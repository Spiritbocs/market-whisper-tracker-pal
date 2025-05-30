
export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
  marketCap?: number;
  volume?: number;
  high?: number;
  low?: number;
}

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  stocks?: WatchlistStock[];
}

export interface WatchlistStock {
  id: string;
  watchlist_id: string;
  symbol: string;
  added_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: any | null;
  session: any | null;
  isAuthenticated: boolean;
  profile: Profile | null;
}

export type Theme = 'dark' | 'light' | 'lovable';

export interface StockQuote {
  '01. symbol': string;
  '05. price': string;
  '09. change': string;
  '10. change percent': string;
}

export interface MarketNews {
  title: string;
  summary: string;
  url: string;
  time_published: string;
  source: string;
  banner_image?: string;
}
