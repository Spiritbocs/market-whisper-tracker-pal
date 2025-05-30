
import { useState, useEffect } from 'react';
import { yahooFinanceService } from '../services/yahooFinanceService';
import { Stock } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { filterStocks, sortStocks } from '../utils/marketUtils';

export const useMarketData = () => {
  const [trendingStocks, setTrendingStocks] = useState<Stock[]>([]);
  const [marketIndices, setMarketIndices] = useState<Stock[]>([]);
  const [watchlistStocks, setWatchlistStocks] = useState<Stock[]>([]);
  const [guestWatchlistStocks, setGuestWatchlistStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { watchlists, isAuthenticated } = useAuth();

  const loadMarketData = async (activeFilter: string, sortBy: string, sortOrder: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      console.log('🔴 LIVE: Loading real market data...');
      
      const trending = await yahooFinanceService.getTrendingStocks();
      if (trending.length > 0) {
        setTrendingStocks(trending);
        const filtered = filterStocks(trending, activeFilter);
        const sorted = sortStocks(filtered, sortBy, sortOrder);
        setFilteredStocks(sorted);
        toast.success(`🔴 LIVE: Loaded ${trending.length} real stocks`);
      }
      
      const indices = await yahooFinanceService.getMarketIndices();
      if (indices.length > 0) {
        setMarketIndices(indices);
      }
      
      if (!isAuthenticated) {
        const guestStocks = trending.slice(0, 5);
        setGuestWatchlistStocks(guestStocks);
      }
      
    } catch (error) {
      console.error('Failed to load real market data:', error);
      setError(error.message || 'Failed to load live market data');
      toast.error('Failed to load live market data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserWatchlistStocks = async () => {
    if (!isAuthenticated || watchlists.length === 0) {
      setWatchlistStocks([]);
      return;
    }

    try {
      const defaultWatchlist = watchlists.find(w => w.is_default) || watchlists[0];
      if (defaultWatchlist?.watchlist_stocks && defaultWatchlist.watchlist_stocks.length > 0) {
        const symbols = defaultWatchlist.watchlist_stocks.map(ws => ws.symbol);
        console.log('🔴 LIVE: Loading user watchlist symbols:', symbols);
        const stocks = await yahooFinanceService.getMultipleQuotes(symbols);
        setWatchlistStocks(stocks);
      }
    } catch (error) {
      console.error('Failed to load watchlist stocks:', error);
    }
  };

  const updateFilteredStocks = (activeFilter: string, sortBy: string, sortOrder: string) => {
    const filtered = filterStocks(trendingStocks, activeFilter);
    const sorted = sortStocks(filtered, sortBy, sortOrder);
    setFilteredStocks(sorted);
  };

  return {
    trendingStocks,
    marketIndices,
    watchlistStocks,
    guestWatchlistStocks,
    filteredStocks,
    isLoading,
    error,
    loadMarketData,
    loadUserWatchlistStocks,
    updateFilteredStocks
  };
};
