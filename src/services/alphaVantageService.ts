
import { Stock, StockQuote, MarketNews } from '../types';

const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your Alpha Vantage API key
const BASE_URL = 'https://www.alphavantage.co/query';

// Cache to store API responses and respect rate limits
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache
const REQUEST_DELAY = 12000; // 12 seconds between requests (5 per minute limit)

let lastRequestTime = 0;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = async (url: string): Promise<any> => {
  const cacheKey = url;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Respect rate limit
  const timeSinceLastRequest = Date.now() - lastRequestTime;
  if (timeSinceLastRequest < REQUEST_DELAY) {
    await delay(REQUEST_DELAY - timeSinceLastRequest);
  }

  lastRequestTime = Date.now();

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data['Error Message'] || data['Note']) {
      throw new Error(data['Error Message'] || data['Note']);
    }

    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

const parseStockData = (data: StockQuote, symbol: string): Stock => {
  const price = parseFloat(data['05. price']) || 0;
  const change = parseFloat(data['09. change']) || 0;
  const changePercent = parseFloat(data['10. change percent'].replace('%', '')) || 0;

  return {
    symbol: symbol,
    name: symbol, // Alpha Vantage doesn't provide company names in quotes
    price,
    change,
    changePercent,
    lastUpdated: new Date().toISOString(),
  };
};

export const alphaVantageService = {
  async getQuote(symbol: string): Promise<Stock> {
    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    const data = await makeRequest(url);
    
    if (!data['Global Quote']) {
      throw new Error('Invalid symbol or API response');
    }

    return parseStockData(data['Global Quote'], symbol);
  },

  async getMultipleQuotes(symbols: string[]): Promise<Stock[]> {
    const stocks: Stock[] = [];
    
    // Process symbols in batches to respect rate limits
    for (const symbol of symbols) {
      try {
        const stock = await this.getQuote(symbol);
        stocks.push(stock);
      } catch (error) {
        console.error(`Failed to fetch ${symbol}:`, error);
        // Add placeholder data for failed requests
        stocks.push({
          symbol,
          name: symbol,
          price: 0,
          change: 0,
          changePercent: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    }
    
    return stocks;
  },

  async searchSymbols(query: string): Promise<any[]> {
    const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${query}&apikey=${API_KEY}`;
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
  },

  async getTrendingStocks(): Promise<Stock[]> {
    // Popular stocks to display (you can customize this list)
    const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
    
    try {
      const stocks = await this.getMultipleQuotes(popularSymbols);
      return stocks.filter(stock => stock.price > 0); // Filter out failed requests
    } catch (error) {
      console.error('Failed to fetch trending stocks:', error);
      return [];
    }
  },

  async getMarketIndices(): Promise<Stock[]> {
    // Major market indices
    const indices = ['^GSPC', '^DJI', '^IXIC']; // S&P 500, Dow Jones, NASDAQ
    
    try {
      const stocks = await this.getMultipleQuotes(indices);
      return stocks.filter(stock => stock.price > 0);
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
};
