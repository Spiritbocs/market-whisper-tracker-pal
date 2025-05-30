
import { Stock, StockQuote, MarketNews } from '../types';

const API_KEY = 'TZNLZB2LBZIG5OIM';
const BASE_URL = 'https://www.alphavantage.co/query';

// Check if API key is configured
const isApiKeyConfigured = API_KEY && API_KEY.length > 0;

// Enhanced caching with localStorage persistence
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours cache
const REQUEST_DELAY = 15000; // 15 seconds between requests (4 per minute to be safe)

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
      const stored = localStorage.getItem(`stock_cache_${key}`);
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
      localStorage.setItem(`stock_cache_${key}`, JSON.stringify(cacheEntry));
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

// Process requests one at a time with proper delays
const processRequestQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      // Ensure proper delay between requests
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
  if (!isApiKeyConfigured) {
    throw new Error('API key not configured');
  }

  const cacheKey = url;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }

  return new Promise((resolve, reject) => {
    const requestHandler = async () => {
      try {
        console.log(`Making API request: ${url.split('?')[1]}`);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data['Error Message']) {
          throw new Error(data['Error Message']);
        }
        
        if (data['Note'] || data['Information']) {
          // Rate limit hit - don't cache this response
          throw new Error(data['Note'] || data['Information']);
        }

        cache.set(cacheKey, data);
        resolve(data);
      } catch (error) {
        console.error('API request failed:', error);
        reject(error);
      }
    };

    requestQueue.push(requestHandler);
    processRequestQueue();
  });
};

const parseStockData = (data: StockQuote, symbol: string): Stock => {
  const price = parseFloat(data['05. price']) || 0;
  const change = parseFloat(data['09. change']) || 0;
  const changePercent = parseFloat(data['10. change percent'].replace('%', '')) || 0;

  return {
    symbol: symbol,
    name: symbol,
    price,
    change,
    changePercent,
    lastUpdated: new Date().toISOString(),
  };
};

export const alphaVantageService = {
  async getQuote(symbol: string): Promise<Stock> {
    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    
    try {
      const data = await makeRequest(url);
      
      if (!data['Global Quote']) {
        throw new Error('Invalid symbol or API response');
      }

      return parseStockData(data['Global Quote'], symbol);
    } catch (error) {
      console.error(`Failed to fetch ${symbol}:`, error);
      throw error;
    }
  },

  async getMultipleQuotes(symbols: string[]): Promise<Stock[]> {
    const stocks: Stock[] = [];
    const errors: string[] = [];
    
    // Process symbols sequentially to respect rate limits
    for (const symbol of symbols) {
      try {
        const stock = await this.getQuote(symbol);
        stocks.push(stock);
      } catch (error) {
        console.error(`Failed to fetch ${symbol}:`, error);
        errors.push(symbol);
      }
    }
    
    if (errors.length > 0) {
      console.log(`Failed to fetch data for: ${errors.join(', ')}`);
    }
    
    return stocks;
  },

  async searchSymbols(query: string): Promise<any[]> {
    const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${query}&apikey=${API_KEY}`;
    
    try {
      const data = await makeRequest(url);
      
      if (!data['bestMatches']) {
        return [];
      }

      return data['bestMatches'].map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region'],
      }));
    } catch (error) {
      console.error('Failed to search symbols:', error);
      return [];
    }
  },

  async getTrendingStocks(): Promise<Stock[]> {
    // Start with the most popular/liquid stocks
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
    // Major market indices - these are less critical, so we'll try but not fail if they don't work
    const indices = ['^GSPC', '^DJI', '^IXIC'];
    
    try {
      const stocks = await this.getMultipleQuotes(indices);
      return stocks;
    } catch (error) {
      console.error('Failed to fetch market indices:', error);
      return [];
    }
  },

  async getMarketNews(): Promise<MarketNews[]> {
    const url = `${BASE_URL}?function=NEWS_SENTIMENT&apikey=${API_KEY}`;
    
    try {
      const data = await makeRequest(url);
      
      if (!data.feed) {
        return [];
      }

      return data.feed.slice(0, 20).map((article: any) => ({
        title: article.title,
        summary: article.summary,
        url: article.url,
        time_published: article.time_published,
        source: article.source,
        banner_image: article.banner_image,
      }));
    } catch (error) {
      console.error('Failed to fetch market news:', error);
      return [];
    }
  },

  // New method to get cache status
  getCacheStatus(): { symbol: string; lastUpdated: string; cached: boolean }[] {
    const status: { symbol: string; lastUpdated: string; cached: boolean }[] = [];
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
    
    symbols.forEach(symbol => {
      const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
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
