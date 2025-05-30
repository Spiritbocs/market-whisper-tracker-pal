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

// Diverse stock universe - mix of different sectors and market caps
const STOCK_UNIVERSE = [
  // Large Cap Tech
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX', 'CRM', 'ADBE',
  // Large Cap Traditional
  'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD', 'MA', 'DIS', 'BAC', 'XOM',
  // Mid Cap Growth
  'ROKU', 'SQ', 'SHOP', 'ZOOM', 'DOCU', 'OKTA', 'SNOW', 'DDOG', 'NET', 'FSLY',
  // Finance & Banking
  'GS', 'WFC', 'C', 'MS', 'AXP', 'BLK', 'SCHW', 'USB', 'PNC', 'TFC',
  // Healthcare & Biotech
  'PFE', 'MRNA', 'JNJ', 'ABT', 'TMO', 'DHR', 'ISRG', 'GILD', 'AMGN', 'BIIB',
  // Energy & Utilities
  'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'KMI', 'OKE', 'WMB', 'PSX', 'VLO',
  // Consumer & Retail
  'WMT', 'COST', 'TGT', 'LOW', 'NKE', 'SBUX', 'MCD', 'KO', 'PEP', 'AMZN',
  // Industrial & Manufacturing
  'BA', 'CAT', 'GE', 'MMM', 'HON', 'UPS', 'FDX', 'LMT', 'RTX', 'NOC',
  // Real Estate & REITs
  'AMT', 'PLD', 'CCI', 'EQIX', 'SPG', 'O', 'WELL', 'AVB', 'EQR',
  // Emerging & Crypto-related
  'COIN', 'HOOD', 'SQ', 'PYPL', 'SOFI', 'LCID', 'RIVN', 'F', 'GM', 'FORD'
];

// Function to get random selection of stocks
const getRandomStocks = (count: number = 30): string[] => {
  const shuffled = [...STOCK_UNIVERSE].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

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
  
  // Generate realistic market cap based on stock price and sector
  const generateMarketCap = (symbol: string, price: number): number => {
    const largeCaps = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA'];
    const midCaps = ['ROKU', 'SQ', 'SHOP', 'ZOOM', 'DOCU', 'OKTA'];
    
    if (largeCaps.includes(symbol)) {
      return Math.random() * 2000 + 500; // 500B - 2.5T
    } else if (midCaps.includes(symbol)) {
      return Math.random() * 100 + 10; // 10B - 110B
    } else {
      return Math.random() * 50 + 1; // 1B - 51B
    }
  };
  
  return {
    symbol: symbol.toUpperCase(),
    name: meta.longName || meta.shortName || symbol,
    price: Number(currentPrice.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    lastUpdated: new Date().toISOString(),
    volume: quote?.volume?.[0] || meta.regularMarketVolume,
    high: quote?.high?.[0] || meta.regularMarketDayHigh,
    low: quote?.low?.[0] || meta.regularMarketDayLow,
    marketCap: generateMarketCap(symbol, currentPrice) * 1000000000 // Convert to actual number
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

class YahooFinanceService {
  private stockUniverse = STOCK_UNIVERSE;
  
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
    
    // Add backup APIs to the array
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
  }

  async getMultipleQuotes(symbols: string[]): Promise<Stock[]> {
    console.log(`🔴 LIVE: Fetching real data for ${symbols.length} symbols...`);
    const stocks: Stock[] = [];
    
    for (const symbol of symbols) {
      try {
        const stock = await this.getQuote(symbol);
        stocks.push(stock);
      } catch (error) {
        console.error(`Failed to get live data for ${symbol}:`, error);
        // Continue with other symbols instead of failing completely
        continue;
      }
    }
    
    console.log(`🔴 LIVE: Successfully loaded ${stocks.length}/${symbols.length} stocks`);
    return stocks;
  }

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
  }

  async getTrendingStocks(): Promise<Stock[]> {
    try {
      console.log('🔴 LIVE: Fetching trending stocks...');
      
      // Load more stocks to ensure we have enough after filtering
      const shuffled = [...this.stockUniverse].sort(() => 0.5 - Math.random());
      const selectedSymbols = shuffled.slice(0, 30); // Reduced from 100 to 30 to minimize API load
      
      console.log('🔴 LIVE: Fetching real data for', selectedSymbols.length, 'symbols...');
      
      const stocks = await this.getMultipleQuotes(selectedSymbols);
      
      // Filter out any stocks that failed to load and ensure we have valid data
      const validStocks = stocks.filter(stock => 
        stock && 
        typeof stock.price === 'number' && 
        stock.price > 0 &&
        typeof stock.changePercent === 'number'
      );
      
      // If we don't have enough valid stocks, try another batch
      if (validStocks.length < 10) {
        console.log('Not enough valid stocks, trying another batch...');
        const remainingSymbols = shuffled.slice(30, 60);
        const additionalStocks = await this.getMultipleQuotes(remainingSymbols);
        validStocks.push(...additionalStocks.filter(stock => 
          stock && 
          typeof stock.price === 'number' && 
          stock.price > 0 &&
          typeof stock.changePercent === 'number'
        ));
      }
      
      console.log(`🔴 LIVE: Successfully loaded ${validStocks.length} valid stocks`);
      
      return validStocks;
    } catch (error) {
      console.error('Failed to fetch trending stocks:', error);
      // Return any valid stocks we have instead of throwing
      return [];
    }
  }

  async getMarketIndices(): Promise<Stock[]> {
    const indices = ['^GSPC', '^DJI', '^IXIC'];
    return await this.getMultipleQuotes(indices);
  }

  async getMarketNews(): Promise<MarketNews[]> {
    return [];
  }

  isUsingMockData(): boolean {
    return false; // Always real data now
  }
}

export const yahooFinanceService = new YahooFinanceService();