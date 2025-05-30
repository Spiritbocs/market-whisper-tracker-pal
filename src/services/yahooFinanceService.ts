
import { Stock, MarketNews } from '../types';

// Yahoo Finance endpoints (unofficial)
const YAHOO_FINANCE_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const YAHOO_NEWS_BASE = 'https://query2.finance.yahoo.com/v1/finance/search';

// Enhanced caching with localStorage persistence
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache for faster updates
const REQUEST_DELAY = 100; // 100ms between requests

// Mock data for when Yahoo Finance is blocked
const MOCK_STOCK_DATA = {
  'AAPL': { name: 'Apple Inc.', price: 189.84, change: 2.15, changePercent: 1.15 },
  'MSFT': { name: 'Microsoft Corporation', price: 374.51, change: -1.23, changePercent: -0.33 },
  'GOOGL': { name: 'Alphabet Inc.', price: 138.21, change: 1.87, changePercent: 1.37 },
  'AMZN': { name: 'Amazon.com Inc.', price: 146.32, change: 0.98, changePercent: 0.68 },
  'TSLA': { name: 'Tesla Inc.', price: 248.50, change: -3.21, changePercent: -1.27 },
  'META': { name: 'Meta Platforms Inc.', price: 296.17, change: 4.33, changePercent: 1.48 },
  'NVDA': { name: 'NVIDIA Corporation', price: 118.11, change: 2.87, changePercent: 2.49 },
  'NFLX': { name: 'Netflix Inc.', price: 679.26, change: -2.14, changePercent: -0.31 },
  '^GSPC': { name: 'S&P 500', price: 5808.12, change: 12.44, changePercent: 0.21 },
  '^DJI': { name: 'Dow Jones', price: 42592.40, change: -154.52, changePercent: -0.36 },
  '^IXIC': { name: 'NASDAQ', price: 18489.55, change: 49.25, changePercent: 0.27 }
};

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
let apiBlocked = false;

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

const createMockStock = (symbol: string): Stock => {
  const mockData = MOCK_STOCK_DATA[symbol];
  if (!mockData) {
    // Generate random data for unknown symbols
    const price = Math.random() * 200 + 50;
    const change = (Math.random() - 0.5) * 10;
    return {
      symbol: symbol.toUpperCase(),
      name: `${symbol} Corporation`,
      price,
      change,
      changePercent: (change / price) * 100,
      lastUpdated: new Date().toISOString(),
    };
  }

  return {
    symbol: symbol.toUpperCase(),
    name: mockData.name,
    price: mockData.price,
    change: mockData.change,
    changePercent: mockData.changePercent,
    lastUpdated: new Date().toISOString(),
  };
};

const makeRequest = async (url: string): Promise<any> => {
  const cacheKey = url;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }

  // If API is known to be blocked, use mock data immediately
  if (apiBlocked) {
    throw new Error('API blocked - using mock data');
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
        // Mark API as blocked for future requests
        if (error.message.includes('Failed to fetch')) {
          apiBlocked = true;
          console.log('Yahoo Finance API blocked by CORS - switching to mock data');
        }
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
      console.log(`Using mock data for ${symbol} due to API error`);
      return createMockStock(symbol);
    }
  },

  async getMultipleQuotes(symbols: string[]): Promise<Stock[]> {
    const stocks: Stock[] = [];
    
    // If API is blocked, use mock data for all symbols
    if (apiBlocked) {
      console.log('Using mock data for all symbols');
      return symbols.map(symbol => createMockStock(symbol));
    }
    
    // Process multiple symbols in parallel with controlled concurrency
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map(async (symbol) => {
        try {
          const stock = await this.getQuote(symbol);
          return stock;
        } catch (error) {
          console.log(`Using mock data for ${symbol}`);
          return createMockStock(symbol);
        }
      });
      
      const results = await Promise.all(promises);
      stocks.push(...results);
    }
    
    return stocks;
  },

  async searchSymbols(query: string): Promise<any[]> {
    if (query.length < 2) return [];
    
    // If API is blocked, return mock search results
    if (apiBlocked) {
      const mockResults = Object.keys(MOCK_STOCK_DATA)
        .filter(symbol => symbol.toLowerCase().includes(query.toLowerCase()))
        .map(symbol => ({
          symbol,
          name: MOCK_STOCK_DATA[symbol].name,
          type: 'EQUITY',
          region: 'US',
        }));
      return mockResults.slice(0, 10);
    }
    
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
      console.log('Search failed - using mock results');
      const mockResults = Object.keys(MOCK_STOCK_DATA)
        .filter(symbol => symbol.toLowerCase().includes(query.toLowerCase()))
        .map(symbol => ({
          symbol,
          name: MOCK_STOCK_DATA[symbol].name,
          type: 'EQUITY',
          region: 'US',
        }));
      return mockResults.slice(0, 10);
    }
  },

  async getTrendingStocks(): Promise<Stock[]> {
    const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
    
    try {
      const stocks = await this.getMultipleQuotes(popularSymbols);
      return stocks;
    } catch (error) {
      console.log('Using mock data for trending stocks');
      return popularSymbols.map(symbol => createMockStock(symbol));
    }
  },

  async getMarketIndices(): Promise<Stock[]> {
    const indices = ['^GSPC', '^DJI', '^IXIC'];
    
    try {
      const stocks = await this.getMultipleQuotes(indices);
      return stocks;
    } catch (error) {
      console.log('Using mock data for market indices');
      return indices.map(symbol => createMockStock(symbol));
    }
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
        lastUpdated: cached ? new Date(cached.timestamp || 0).toLocaleString() : 'Never'
      });
    });
    
    return status;
  },

  // Check if using mock data
  isUsingMockData(): boolean {
    return apiBlocked;
  },
};
