
import { Stock, StockQuote, MarketNews } from '../types';

const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your Alpha Vantage API key
const BASE_URL = 'https://www.alphavantage.co/query';

// Check if API key is configured
const isApiKeyConfigured = API_KEY !== 'YOUR_API_KEY_HERE' && API_KEY.length > 0;

// Cache to store API responses and respect rate limits
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache
const REQUEST_DELAY = 12000; // 12 seconds between requests (5 per minute limit)

let lastRequestTime = 0;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data for when API key is not configured
const getMockStocks = (): Stock[] => [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 182.50, change: 2.35, changePercent: 1.31, lastUpdated: new Date().toISOString() },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.85, change: -1.20, changePercent: -0.32, lastUpdated: new Date().toISOString() },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.80, change: 0.95, changePercent: 0.67, lastUpdated: new Date().toISOString() },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 146.25, change: -0.85, changePercent: -0.58, lastUpdated: new Date().toISOString() },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 208.89, change: 4.12, changePercent: 2.01, lastUpdated: new Date().toISOString() },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 485.75, change: -2.45, changePercent: -0.50, lastUpdated: new Date().toISOString() },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 875.30, change: 15.60, changePercent: 1.81, lastUpdated: new Date().toISOString() },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 498.12, change: -3.22, changePercent: -0.64, lastUpdated: new Date().toISOString() },
];

const getMockIndices = (): Stock[] => [
  { symbol: 'S&P 500', name: 'S&P 500', price: 5916.98, change: 28.62, changePercent: 0.49, lastUpdated: new Date().toISOString() },
  { symbol: 'Dow Jones', name: 'Dow Jones Industrial Average', price: 43487.83, change: 123.74, changePercent: 0.29, lastUpdated: new Date().toISOString() },
  { symbol: 'NASDAQ', name: 'NASDAQ Composite', price: 18771.16, change: -89.54, changePercent: -0.48, lastUpdated: new Date().toISOString() },
];

const getMockNews = (): MarketNews[] => [
  {
    title: "Tech Stocks Rally as AI Optimism Grows",
    summary: "Major technology companies see gains as investors remain bullish on artificial intelligence developments and their potential impact on future earnings.",
    url: "#",
    time_published: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    source: "Market News",
    banner_image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop"
  },
  {
    title: "Federal Reserve Signals Potential Rate Adjustments",
    summary: "Fed officials hint at possible monetary policy changes in upcoming meetings, causing mixed reactions across different market sectors.",
    url: "#",
    time_published: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    source: "Financial Times",
    banner_image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=200&fit=crop"
  },
  {
    title: "Energy Sector Shows Renewed Strength",
    summary: "Oil and gas companies post strong quarterly results, driving energy stocks higher amid global supply chain improvements.",
    url: "#",
    time_published: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    source: "Energy Daily",
    banner_image: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=400&h=200&fit=crop"
  },
  {
    title: "Healthcare Innovation Drives Biotech Gains",
    summary: "Breakthrough medical research and new drug approvals fuel optimism in the biotechnology sector.",
    url: "#",
    time_published: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    source: "BioTech News",
    banner_image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop"
  },
  {
    title: "Cryptocurrency Market Shows Volatility",
    summary: "Digital assets experience mixed trading as regulatory clarity remains a key concern for investors.",
    url: "#",
    time_published: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    source: "Crypto Times",
    banner_image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=200&fit=crop"
  }
];

const makeRequest = async (url: string): Promise<any> => {
  if (!isApiKeyConfigured) {
    throw new Error('API key not configured');
  }

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
    if (!isApiKeyConfigured) {
      // Return mock data for the requested symbol
      const mockStock = getMockStocks().find(s => s.symbol === symbol);
      if (mockStock) {
        return mockStock;
      }
      // Return a default mock stock if symbol not found
      return {
        symbol,
        name: symbol,
        price: Math.random() * 200 + 50,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        lastUpdated: new Date().toISOString(),
      };
    }

    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    const data = await makeRequest(url);
    
    if (!data['Global Quote']) {
      throw new Error('Invalid symbol or API response');
    }

    return parseStockData(data['Global Quote'], symbol);
  },

  async getMultipleQuotes(symbols: string[]): Promise<Stock[]> {
    if (!isApiKeyConfigured) {
      return getMockStocks().filter(stock => symbols.includes(stock.symbol));
    }

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
    if (!isApiKeyConfigured) {
      // Return mock search results
      const mockResults = getMockStocks()
        .filter(stock => 
          stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
          stock.name.toLowerCase().includes(query.toLowerCase())
        )
        .map(stock => ({
          symbol: stock.symbol,
          name: stock.name,
          type: 'Equity',
          region: 'United States',
        }));
      
      return mockResults;
    }

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
    if (!isApiKeyConfigured) {
      return getMockStocks();
    }

    // Popular stocks to display (you can customize this list)
    const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
    
    try {
      const stocks = await this.getMultipleQuotes(popularSymbols);
      return stocks.filter(stock => stock.price > 0); // Filter out failed requests
    } catch (error) {
      console.error('Failed to fetch trending stocks:', error);
      return getMockStocks();
    }
  },

  async getMarketIndices(): Promise<Stock[]> {
    if (!isApiKeyConfigured) {
      return getMockIndices();
    }

    // Major market indices
    const indices = ['^GSPC', '^DJI', '^IXIC']; // S&P 500, Dow Jones, NASDAQ
    
    try {
      const stocks = await this.getMultipleQuotes(indices);
      return stocks.filter(stock => stock.price > 0);
    } catch (error) {
      console.error('Failed to fetch market indices:', error);
      return getMockIndices();
    }
  },

  async getMarketNews(): Promise<MarketNews[]> {
    if (!isApiKeyConfigured) {
      return getMockNews();
    }

    const url = `${BASE_URL}?function=NEWS_SENTIMENT&apikey=${API_KEY}`;
    
    try {
      const data = await makeRequest(url);
      
      if (!data.feed) {
        return getMockNews();
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
      return getMockNews();
    }
  },
};
