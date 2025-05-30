
export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export interface Watchlist {
  id: string;
  name: string;
  stocks: string[];
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  watchlists: Watchlist[];
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export type Theme = 'dark' | 'light' | 'lovable';

export interface StockQuote {
  '01. symbol': string;
  '05. price': string;
  '09. change': string;
  '10. change percent': string;
}
