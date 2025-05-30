
import { Stock, MarketNews } from '../types';

// Use CORS proxy for Yahoo Finance to bypass CORS restrictions
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const YAHOO_FINANCE_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const YAHOO_NEWS_BASE = 'https://query2.finance.yahoo.com/v1/finance/search';

// Backup Alpha Vantage API (free tier - 25 requests per day)
const ALPHA_VANTAGE_KEY = 'demo'; // This is Alpha Vantage's demo key that works for AAPL
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

// Enhanced caching
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache for live data
const REQUEST_DELAY = 200; // 200ms between requests

class ApiCache {
  private memoryCache = new Map<string, { data: any; timestamp: number }>();
  
  get(key: string): any | null {
    const cached = this.memoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }
  
  set(key: string, data: any): void {
    this.memoryCache.set(key, { data, timestamp: Date.now() });
  }
}

const cache = new ApiCache();
let requestQueue: Array<() => Promise<any>> = [];
let isProcessingQueue = false;
let lastRequestTime = 0;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const processRequestQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      const timeSinceLastRequest = Date.now() - lastRequestTime;
      if (timeSinceLastRequest < REQUEST_DELAY) {
        await delay(REQUEST_DELAY - timeSinceLastRequest);
      }
      
      try {
        await request();
        lastRequestTime = Date.now();
      } catch (error) {
        console.error('Request failed:', error);
      }
    }
  }
  
  isProcessingQueue = false;
};

const makeYahooRequest = async (url: string): Promise<any> => {
  const cacheKey = url;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    console.log('Using cached data for:', url.split('/').pop());
    return cached;
  }

  return new Promise((resolve, reject) => {
    const requestHandler = async () => {
      try {
        console.log(`Making live Yahoo Finance request: ${url.split('/').pop()}`);
        const proxiedUrl = CORS_PROXY + encodeURIComponent(url);
        const response = await fetch(proxiedUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.chart?.error) {
          throw new Error(data.chart.error.description || 'Yahoo Finance API error');
        }

        cache.set(cacheKey, data);
        console.log(`Successfully fetched live data for: ${url.split('/').pop()}`);
        resolve(data);
      } catch (error) {
        console.error('Yahoo Finance request failed:', error);
        reject(error);
      }
    };

    requestQueue.push(requestHandler);
    processRequestQueue();
  });
};

const makeAlphaVantageRequest = async (symbol: string): Promise<any> => {
  const cacheKey = `av_${symbol}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    console.log(`Making Alpha Vantage request for: ${symbol}`);
    const url = `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.Note || data['Error Message']) {
      throw new Error(data.Note || data['Error Message']);
    }

    cache.set(cacheKey, data);
    console.log(`Successfully fetched Alpha Vantage data for: ${symbol}`);
    return data;
  } catch (error) {
    console.error('Alpha Vantage request failed:', error);
    throw error;
  }
};

const parseYahooStockData = (data: any, symbol: string): Stock => {
  const result = data.chart?.result?.[0];
  if (!result) {
    throw new Error('Invalid Yahoo Finance response');
  }

  const meta = result.meta;
  const currentPrice = meta.regularMarketPrice || 0;
  const previousClose = meta.previousClose || currentPrice;
  const change = currentPrice - previousClose;
  const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

  return {
    symbol: symbol.toUpperCase(),
    name: meta.longName || meta.shortName || symbol,
    price: currentPrice,
    change: change,
    changePercent: changePercent,
    lastUpdated: new Date().toISOString(),
  };
};

const parseAlphaVantageData = (data: any, symbol: string): Stock => {
  const quote = data['Global Quote'];
  if (!quote) {
    throw new Error('Invalid Alpha Vantage response');
  }

  const price = parseFloat(quote['05. price']);
  const change = parseFloat(quote['09. change']);
  const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));

  return {
    symbol: symbol.toUpperCase(),
    name: symbol.toUpperCase(),
    price: price,
    change: change,
    changePercent: changePercent,
    lastUpdated: new Date().toISOString(),
  };
};

export const yahooFinanceService = {
  async getQuote(symbol: string): Promise<Stock> {
    // Try Yahoo Finance first (through CORS proxy)
    try {
      const url = `${YAHOO_FINANCE_BASE}${symbol}?interval=1d&range=1d&includePrePost=false`;
      const data = await makeYahooRequest(url);
      return parseYahooStockData(data, symbol);
    } catch (yahooError) {
      console.log(`Yahoo Finance failed for ${symbol}, trying Alpha Vantage...`);
      
      // Fallback to Alpha Vantage
      try {
        const data = await makeAlphaVantageRequest(symbol);
        return parseAlphaVantageData(data, symbol);
      } catch (alphaError) {
        console.error(`Both APIs failed for ${symbol}:`, { yahooError, alphaError });
        throw new Error(`Failed to fetch live data for ${symbol}: Both Yahoo Finance and Alpha Vantage failed`);
      }
    }
  },

  async getMultipleQuotes(symbols: string[]): Promise<Stock[]> {
    console.log(`Fetching live data for ${symbols.length} symbols...`);
    const stocks: Stock[] = [];
    
    // Process symbols in smaller batches to avoid overwhelming APIs
    const batchSize = 3;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map(async (symbol) => {
        try {
          return await this.getQuote(symbol);
        } catch (error) {
          console.error(`Failed to fetch data for ${symbol}:`, error);
          // Return null for failed requests, filter out later
          return null;
        }
      });
      
      const results = await Promise.all(promises);
      // Filter out null results
      const validStocks = results.filter((stock): stock is Stock => stock !== null);
      stocks.push(...validStocks);
      
      // Add delay between batches
      if (i + batchSize < symbols.length) {
        await delay(1000);
      }
    }
    
    console.log(`Successfully fetched live data for ${stocks.length}/${symbols.length} symbols`);
    return stocks;
  },

  async searchSymbols(query: string): Promise<any[]> {
    if (query.length < 2) return [];
    
    try {
      console.log(`Searching for symbols: ${query}`);
      const url = `${YAHOO_NEWS_BASE}?q=${encodeURIComponent(query)}`;
      const proxiedUrl = CORS_PROXY + encodeURIComponent(url);
      const response = await fetch(proxiedUrl);
      
      if (!response.ok) {
        throw new Error(`Search HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.quotes) {
        return [];
      }

      console.log(`Found ${data.quotes.length} search results for: ${query}`);
      return data.quotes.slice(0, 10).map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname || quote.symbol,
        type: quote.quoteType || 'EQUITY',
        region: quote.region || 'US',
      }));
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  },

  async getTrendingStocks(): Promise<Stock[]> {
    const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
    console.log('Fetching live trending stocks...');
    
    const stocks = await this.getMultipleQuotes(popularSymbols);
    console.log(`Loaded ${stocks.length} live trending stocks`);
    return stocks;
  },

  async getMarketIndices(): Promise<Stock[]> {
    const indices = ['^GSPC', '^DJI', '^IXIC'];
    console.log('Fetching live market indices...');
    
    const stocks = await this.getMultipleQuotes(indices);
    console.log(`Loaded ${stocks.length} live market indices`);
    return stocks;
  },

  async getMarketNews(): Promise<MarketNews[]> {
    return [];
  },

  // Get cache status
  getCacheStatus(): { symbol: string; lastUpdated: string; cached: boolean }[] {
    const status: { symbol: string; lastUpdated: string; cached: boolean }[] = [];
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
    
    symbols.forEach(symbol => {
      const url = `${YAHOO_FINANCE_BASE}${symbol}?interval=1d&range=1d&includePrePost=false`;
      const cached = cache.get(url);
      
      status.push({
        symbol,
        cached: !!cached,
        lastUpdated: cached ? new Date().toLocaleString() : 'Never'
      });
    });
    
    return status;
  },

  // Check if using mock data (always false now)
  isUsingMockData(): boolean {
    return false;
  },
};
