
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { yahooFinanceService } from '../services/yahooFinanceService';
import { Stock } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { MarketStatsHeader } from './market/MarketStatsHeader';
import { MarketSummaryCards } from './market/MarketSummaryCards';
import { MyWatchlistCard } from './market/MyWatchlistCard';
import { MarketFilters } from './market/MarketFilters';
import { StockTable } from './market/StockTable';
import { exportToCSV, sortStocks, filterStocks } from '../utils/marketUtils';

// Sample chart data
const marketCapData = [
  { time: '09:00', value: 45.1 },
  { time: '10:00', value: 45.3 },
  { time: '11:00', value: 45.0 },
  { time: '12:00', value: 45.2 },
  { time: '13:00', value: 45.2 },
  { time: '14:00', value: 45.4 },
];

const volumeData = [
  { time: '09:00', value: 2.0 },
  { time: '10:00', value: 2.1 },
  { time: '11:00', value: 1.9 },
  { time: '12:00', value: 2.2 },
  { time: '13:00', value: 2.1 },
  { time: '14:00', value: 2.1 },
];

export const MarketOverview: React.FC = () => {
  const [trendingStocks, setTrendingStocks] = useState<Stock[]>([]);
  const [marketIndices, setMarketIndices] = useState<Stock[]>([]);
  const [watchlistStocks, setWatchlistStocks] = useState<Stock[]>([]);
  const [guestWatchlistStocks, setGuestWatchlistStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [tableColumns, setTableColumns] = useState(['rank', 'name', 'price', '1h', '24h', '7d', 'marketCap', 'volume', 'chart']);
  const [sortBy, setSortBy] = useState('marketCap');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [rowsToShow, setRowsToShow] = useState(100);
  const { addStockToWatchlist, watchlists, isAuthenticated, loadWatchlists } = useAuth();

  useEffect(() => {
    const loadMarketData = async () => {
      try {
        setError(null);
        setIsLoading(true);
        
        console.log('🔴 LIVE: Loading real market data...');
        
        const trending = await yahooFinanceService.getTrendingStocks();
        if (trending.length > 0) {
          setTrendingStocks(trending);
          setFilteredStocks(trending);
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

    loadMarketData();
  }, [isAuthenticated]);

  useEffect(() => {
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

    loadUserWatchlistStocks();
  }, [watchlists, isAuthenticated]);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    const filtered = filterStocks(trendingStocks, filter);
    setFilteredStocks(filtered);
  };

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(column);
    setSortOrder(newOrder);
    
    const sorted = sortStocks(filteredStocks, column, newOrder);
    setFilteredStocks(sorted);
  };

  const handleExportCSV = () => {
    exportToCSV(filteredStocks, rowsToShow);
    toast.success('Market data exported to CSV');
  };

  const handleColumnToggle = (columnId: string) => {
    setTableColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(col => col !== columnId)
        : [...prev, columnId]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold">🔴 Loading Live Market Data</h3>
          <p className="text-muted-foreground">Fetching real-time prices...</p>
        </div>
      </div>
    );
  }

  if (error && trendingStocks.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Live Market Data</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const displayWatchlistStocks = isAuthenticated ? watchlistStocks : guestWatchlistStocks;

  return (
    <div className="w-full bg-background min-h-screen">
      <MarketStatsHeader stockCount={trendingStocks.length} />

      <div className="w-full px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {isAuthenticated && displayWatchlistStocks.length > 0 && (
            <MyWatchlistCard
              watchlistStocks={displayWatchlistStocks}
              showWatchlistModal={showWatchlistModal}
              setShowWatchlistModal={setShowWatchlistModal}
            />
          )}
          
          <div className={isAuthenticated && displayWatchlistStocks.length > 0 ? "lg:col-span-3" : "lg:col-span-4"}>
            <MarketSummaryCards
              trendingStocks={trendingStocks}
              marketCapData={marketCapData}
              volumeData={volumeData}
            />
          </div>
        </div>

        <div className="space-y-6">
          <MarketFilters
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            sortBy={sortBy}
            setSortBy={setSortBy}
            showCustomizeModal={showCustomizeModal}
            setShowCustomizeModal={setShowCustomizeModal}
            tableColumns={tableColumns}
            onColumnToggle={handleColumnToggle}
            rowsToShow={rowsToShow}
            setRowsToShow={setRowsToShow}
            onExportCSV={handleExportCSV}
          />

          {trendingStocks.length > 0 && (
            <StockTable
              filteredStocks={filteredStocks}
              rowsToShow={rowsToShow}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          )}
        </div>
      </div>
    </div>
  );
};
