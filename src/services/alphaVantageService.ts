
import { Stock, StockQuote } from '../types';

const API_KEY = 'YOUR_API_KEY_HERE'; // User will replace this
const BASE_URL = 'https://www.alphavantage.co/query';

// Cache to store API responses and timestamps
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache to respect API limits

class AlphaVantageService {
  private async makeRequest(params: Record<string, string>) {
    const cacheKey = JSON.stringify(params);
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Using cached data for:', params);
      return cached.data;
    }

    const url = new URL(BASE_URL);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    url.searchParams.append('apikey', API_KEY);

    try {
      console.log('Making API request:', url.toString());
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      
      if (data['Note']) {
        console.warn('API Rate limit warning:', data['Note']);
        throw new Error('API rate limit reached. Please wait a moment.');
      }

      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getQuote(symbol: string): Promise<Stock> {
    const data = await this.makeRequest({
      function: 'GLOBAL_QUOTE',
      symbol: symbol.toUpperCase(),
    });

    const quote = data['Global Quote'] as StockQuote;
    if (!quote) {
      throw new Error(`No data found for symbol: ${symbol}`);
    }

    return {
      symbol: quote['01. symbol'],
      name: quote['01. symbol'], // Alpha Vantage doesn't provide company name in this endpoint
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      lastUpdated: new Date().toISOString(),
    };
  }

  async getMultipleQuotes(symbols: string[]): Promise<Stock[]> {
    const promises = symbols.map(symbol => 
      this.getQuote(symbol).catch(error => {
        console.error(`Failed to fetch ${symbol}:`, error);
        return null;
      })
    );

    const results = await Promise.all(promises);
    return results.filter((stock): stock is Stock => stock !== null);
  }

  async searchSymbols(query: string) {
    const data = await this.makeRequest({
      function: 'SYMBOL_SEARCH',
      keywords: query,
    });

    const matches = data['bestMatches'] || [];
    return matches.slice(0, 10).map((match: any) => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'],
      region: match['4. region'],
      currency: match['8. currency'],
    }));
  }

  // Get popular stocks (hardcoded list since Alpha Vantage doesn't have a "trending" endpoint)
  async getTrendingStocks(): Promise<Stock[]> {
    const trendingSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
    return this.getMultipleQuotes(trendingSymbols.slice(0, 6)); // Limit to 6 to save API calls
  }

  // Get market indices
  async getMarketIndices(): Promise<Stock[]> {
    const indices = ['SPY', 'QQQ', 'DIA']; // ETFs that track major indices
    return this.getMultipleQuotes(indices);
  }
}

export const alphaVantageService = new AlphaVantageService();
