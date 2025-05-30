
import { Stock, MarketNews } from '../types';

// Multiple free APIs for redundancy
const APIS = {
  yahoo: {
    base: 'https://query1.finance.yahoo.com/v8/finance/chart/',
    search: 'https://query2.finance.yahoo.com/v1/finance/search',
    proxy: 'https://api.allorigins.win/raw?url='
  },
  finnhub: {
    base: 'https://finnhub.io/api/v1/quote',
    token: 'demo' // Free tier
  },
  alphavantage: {
    base: 'https://www.alphavantage.co/query',
    key: 'demo'
  },
  iex: {
    base: 'https://cloud.iexapis.com/stable/stock/',
    token: 'pk_test_token' // Free sandbox
  },
  polygon: {
    base: 'https://api.polygon.io/v2/aggs/ticker/',
    key: 'demo'
  }
};

const CACHE_DURATION = 1 * 60 * 1000; // 1 minute cache
const REQUEST_DELAY = 100;

class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }
  
  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

const cache = new ApiCache();
let lastRequestTime = 0;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Try Yahoo Finance first (most reliable)
const tryYahooFinance = async (symbol: string): Promise<Stock> => {
  const url = `${APIS.yahoo.base}${symbol}?interval=1d&range=1d&includePrePost=false`;
  const proxiedUrl = APIS.yahoo.proxy + encodeURIComponent(url);
  
  const response = await fetch(proxiedUrl);
  if (!response.ok) throw new Error(`Yahoo HTTP ${response.status}`);
  
  const data = await response.json();
  if (data.chart?.error) throw new Error('Yahoo API error');
  
  const result = data.chart.result[0];
  const meta = result.meta;
  const quote = result.indicators?.quote?.[0];
  
  const currentPrice = meta.regularMarketPrice || quote?.close?.[0] || 0;
  const previousClose = meta.previousClose || meta.chartPreviousClose || currentPrice;
  const change = currentPrice - previousClose;
  const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;
  
  return {
    symbol: symbol.toUpperCase(),
    name: meta.longName || meta.shortName || symbol,
    price: Number(currentPrice.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    lastUpdated: new Date().toISOString(),
    volume: quote?.volume?.[0] || meta.regularMarketVolume,
    high: quote?.high?.[0] || meta.regularMarketDayHigh,
    low: quote?.low?.[0] || meta.regularMarketDayLow
  };
};

// Backup API - Finnhub
const tryFinnhub = async (symbol: string): Promise<Stock> => {
  const url = `${APIS.finnhub.base}?symbol=${symbol}&token=${APIS.finnhub.token}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Finnhub HTTP ${response.status}`);
  
  const data = await response.json();
  if (!data.c) throw new Error('Finnhub no data');
  
  const price = data.c; // current price
  const change = data.d; // change
  const changePercent = data.dp; // change percent
  
  return {
    symbol: symbol.toUpperCase(),
    name: symbol.toUpperCase(),
    price: Number(price.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    lastUpdated: new Date().toISOString(),
    volume: data.v,
    high: data.h,
    low: data.l
  };
};

// Another backup - Alpha Vantage
const tryAlphaVantage = async (symbol: string): Promise<Stock> => {
  const url = `${APIS.alphavantage.base}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${APIS.alphavantage.key}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Alpha Vantage HTTP ${response.status}`);
  
  const data = await response.json();
  const quote = data['Global Quote'];
  if (!quote) throw new Error('Alpha Vantage no data');
  
  const price = parseFloat(quote['05. price']);
  const change = parseFloat(quote['09. change']);
  const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
  
  return {
    symbol: symbol.toUpperCase(),
    name: symbol.toUpperCase(),
    price: Number(price.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    lastUpdated: new Date().toISOString()
  };
};

export const yahooFinanceService = {
  async getQuote(symbol: string): Promise<Stock> {
    const cacheKey = `quote_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    
    // Ensure rate limiting
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    if (timeSinceLastRequest < REQUEST_DELAY) {
      await delay(REQUEST_DELAY - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();
    
    const apis = [tryYahooFinance, tryFinnhub, tryAlphaVantage];
    
    for (const apiCall of apis) {
      try {
        console.log(`Fetching live data for ${symbol}...`);
        const stock = await apiCall(symbol);
        cache.set(cacheKey, stock);
        console.log(`✅ Got live data for ${symbol}: $${stock.price} (${stock.changePercent}%)`);
        return stock;
      } catch (error) {
        console.log(`❌ API failed for ${symbol}:`, error.message);
        continue;
      }
    }
    
    throw new Error(`All APIs failed for ${symbol}`);
  },

  async getMultipleQuotes(symbols: string[]): Promise<Stock[]> {
    console.log(`🔴 LIVE: Fetching real data for ${symbols.length} symbols...`);
    const stocks: Stock[] = [];
    
    for (const symbol of symbols) {
      try {
        const stock = await this.getQuote(symbol);
        stocks.push(stock);
      } catch (error) {
        console.error(`Failed to get live data for ${symbol}:`, error);
      }
    }
    
    console.log(`🔴 LIVE: Successfully loaded ${stocks.length}/${symbols.length} stocks`);
    return stocks;
  },

  async searchSymbols(query: string): Promise<any[]> {
    if (query.length < 2) return [];
    
    try {
      const url = `${APIS.yahoo.search}?q=${encodeURIComponent(query)}`;
      const proxiedUrl = APIS.yahoo.proxy + encodeURIComponent(url);
      const response = await fetch(proxiedUrl);
      
      if (!response.ok) throw new Error(`Search HTTP ${response.status}`);
      
      const data = await response.json();
      if (!data.quotes) return [];

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
    return await this.getMultipleQuotes(popularSymbols);
  },

  async getMarketIndices(): Promise<Stock[]> {
    const indices = ['^GSPC', '^DJI', '^IXIC'];
    return await this.getMultipleQuotes(indices);
  },

  async getMarketNews(): Promise<MarketNews[]> {
    return [];
  },

  isUsingMockData(): boolean {
    return false; // Always real data now
  }
};
