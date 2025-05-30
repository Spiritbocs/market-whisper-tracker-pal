
import { Stock, MarketNews } from '../types';

// Yahoo Finance endpoints (unofficial)
const YAHOO_FINANCE_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const YAHOO_NEWS_BASE = 'https://query2.finance.yahoo.com/v1/finance/search';

// Enhanced caching with localStorage persistence
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache for faster updates
const REQUEST_DELAY = 100; // 100ms between requests (much faster than Alpha Vantage)

class ApiCache {
  private memoryCache = new Map<string, { data: any; timestamp: number }>();
  
  get(key: string): any | null {
    // Check memory cache first
    const memoryData = this.memoryCache.get(key);
    if (memoryData && Date.now() - memoryData.timestamp < CACHE_DURATION) {
      return memoryData.data;
    }
    
    // Check localStorage
    try {
      const stored = localStorage.getItem(`yahoo_cache_${key}`);
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < CACHE_DURATION) {
          // Update memory cache
          this.memoryCache.set(key, { data, timestamp });
          return data;
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    
    return null;
  }
  
  set(key: string, data: any): void {
    const cacheEntry = { data, timestamp: Date.now() };
    
    // Update memory cache
    this.memoryCache.set(key, cacheEntry);
    
    // Update localStorage
    try {
      localStorage.setItem(`yahoo_cache_${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }
}

const cache = new ApiCache();
let requestQueue: Array<() => Promise<any>> = [];
let isProcessingQueue = false;
let lastRequestTime = 0;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Process requests with minimal delays
const processRequestQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      // Ensure minimal delay between requests
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

const makeRequest = async (url: string): Promise<any> => {
  const cacheKey = url;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }

  return new Promise((resolve, reject) => {
    const requestHandler = async () => {
      try {
        console.log(`Making Yahoo Finance request: ${url.split('/').pop()}`);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.chart?.error) {
          throw new Error(data.chart.error.description || 'Yahoo Finance API error');
        }

        cache.set(cacheKey, data);
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

const parseYahooStockData = (data: any, symbol: string): Stock => {
  const result = data.chart?.result?.[0];
  if (!result) {
    throw new Error('Invalid Yahoo Finance response');
  }

  const meta = result.meta;
  const quote = result.indicators?.quote?.[0];
  
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

export const yahooFinanceService = {
  async getQuote(symbol: string): Promise<Stock> {
    const url = `${YAHOO_FINANCE_BASE}${symbol}?interval=1d&range=1d&includePrePost=false`;
    
    try {
      const data = await makeRequest(url);
      return parseYahooStockData(data, symbol);
    } catch (error) {
      console.error(`Failed to fetch ${symbol}:`, error);
      throw error;
    }
  },

  async getMultipleQuotes(symbols: string[]): Promise<Stock[]> {
    const stocks: Stock[] = [];
    const errors: string[] = [];
    
    // Process multiple symbols in parallel with controlled concurrency
    const batchSize = 5; // Process 5 at a time
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map(async (symbol) => {
        try {
          const stock = await this.getQuote(symbol);
          return stock;
        } catch (error) {
          console.error(`Failed to fetch ${symbol}:`, error);
          errors.push(symbol);
          return null;
        }
      });
      
      const results = await Promise.all(promises);
      stocks.push(...results.filter(Boolean) as Stock[]);
    }
    
    if (errors.length > 0) {
      console.log(`Failed to fetch data for: ${errors.join(', ')}`);
    }
    
    return stocks;
  },

  async searchSymbols(query: string): Promise<any[]> {
    if (query.length < 2) return [];
    
    const url = `${YAHOO_NEWS_BASE}?q=${encodeURIComponent(query)}`;
    
    try {
      const data = await makeRequest(url);
      
      if (!data.quotes) {
        return [];
      }

      return data.quotes.slice(0, 10).map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname || quote.symbol,
        type: quote.quoteType || 'EQUITY',
        region: quote.region || 'US',
      }));
    } catch (error) {
      console.error('Failed to search symbols:', error);
      return [];
    }
  },

  async getTrendingStocks(): Promise<Stock[]> {
    // Popular liquid stocks that should always have data
    const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
    
    try {
      const stocks = await this.getMultipleQuotes(popularSymbols);
      return stocks;
    } catch (error) {
      console.error('Failed to fetch trending stocks:', error);
      return [];
    }
  },

  async getMarketIndices(): Promise<Stock[]> {
    // Major market indices using Yahoo Finance symbols
    const indices = ['^GSPC', '^DJI', '^IXIC']; // S&P 500, Dow Jones, NASDAQ
    
    try {
      const stocks = await this.getMultipleQuotes(indices);
      return stocks;
    } catch (error) {
      console.error('Failed to fetch market indices:', error);
      return [];
    }
  },

  async getMarketNews(): Promise<MarketNews[]> {
    // For now, return empty array as Yahoo Finance news requires different endpoint
    // This can be implemented later with additional endpoints
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
        lastUpdated: cached ? new Date(cached.timestamp || 0).toLocaleString() : 'Never'
      });
    });
    
    return status;
  },
};
