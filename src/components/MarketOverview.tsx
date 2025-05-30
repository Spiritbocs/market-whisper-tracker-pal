import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { yahooFinanceService } from '../services/yahooFinanceService';
import { Stock } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { MarketStatsHeader } from './market/MarketStatsHeader';
import { MarketSummaryCards } from './market/MarketSummaryCards';
import { MyWatchlistCard } from './market/MyWatchlistCard';
import { MarketFilters } from './market/MarketFilters';
import { StockTable } from './market/StockTable';
import { DetailedStockView } from './market/DetailedStockView';
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

// Helper functions for localStorage
const saveToLocalStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

const loadFromLocalStorage = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

export const MarketOverview: React.FC = () => {
  const [trendingStocks, setTrendingStocks] = useState<Stock[]>([]);
  const [marketIndices, setMarketIndices] = useState<Stock[]>([]);
  const [watchlistStocks, setWatchlistStocks] = useState<Stock[]>([]);
  const [guestWatchlistStocks, setGuestWatchlistStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [selectedStocks, setSelectedStocks] = useState<Stock[]>([]);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [activeFilter, setActiveFilter] = useState(() => loadFromLocalStorage('market-active-filter', 'All'));
  const [tableColumns, setTableColumns] = useState(() => loadFromLocalStorage('market-table-columns', ['rank', 'name', 'price', '1h', '24h', '7d', 'marketCap', 'volume', 'chart']));
  const [sortBy, setSortBy] = useState(() => loadFromLocalStorage('market-sort-by', 'marketCap'));
  const [sortOrder, setSortOrder] = useState(() => loadFromLocalStorage('market-sort-order', 'desc'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [rowsToShow, setRowsToShow] = useState(() => loadFromLocalStorage('market-rows-to-show', 8));
  const { addStockToWatchlist, watchlists, isAuthenticated, loadWatchlists } = useAuth();

  // Save settings to localStorage whenever they change
  useEffect(() => {
    saveToLocalStorage('market-active-filter', activeFilter);
  }, [activeFilter]);

  useEffect(() => {
    saveToLocalStorage('market-table-columns', tableColumns);
  }, [tableColumns]);

  useEffect(() => {
    saveToLocalStorage('market-sort-by', sortBy);
  }, [sortBy]);

  useEffect(() => {
    saveToLocalStorage('market-sort-order', sortOrder);
  }, [sortOrder]);

  useEffect(() => {
    saveToLocalStorage('market-rows-to-show', rowsToShow);
  }, [rowsToShow]);

  // Watch for selected stocks changes to show detailed view
  useEffect(() => {
    if (selectedStocks.length > 0 && selectedStocks.length <= 6) {
      setShowDetailedView(true);
    } else if (selectedStocks.length === 0) {
      setShowDetailedView(false);
    }
  }, [selectedStocks]);

  useEffect(() => {
    const loadMarketData = async () => {
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

    loadMarketData();
  }, [isAuthenticated, activeFilter, sortBy, sortOrder]);

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

  const handleToggleStock = (stock: Stock) => {
    setSelectedStocks(prev => {
      const isAlreadySelected = prev.some(s => s.symbol === stock.symbol);
      
      if (isAlreadySelected) {
        return prev.filter(s => s.symbol !== stock.symbol);
      } else {
        if (prev.length >= 6) {
          toast.error('You can select up to 6 stocks for detailed analysis');
          return prev;
        }
        return [...prev, stock];
      }
    });
  };

  const handleRemoveSelectedStock = (symbol: string) => {
    setSelectedStocks(prev => prev.filter(s => s.symbol !== symbol));
  };

  const handleBackToOverview = () => {
    setShowDetailedView(false);
  };

  const handleCompareSelected = () => {
    if (selectedStocks.length < 2) {
      toast.error('Please select at least 2 stocks to compare');
      return;
    }
    setShowDetailedView(true);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    const filtered = filterStocks(trendingStocks, filter);
    const sorted = sortStocks(filtered, sortBy, sortOrder);
    setFilteredStocks(sorted);
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

  const handleRowsToShowChange = (rows: number) => {
    console.log('Setting rows to show:', rows);
    setRowsToShow(rows);
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

  // Show detailed view when compare button is clicked
  if (showDetailedView && selectedStocks.length > 0) {
    return (
      <div className="w-full bg-background min-h-screen p-6">
        <DetailedStockView
          selectedStocks={selectedStocks}
          onBack={handleBackToOverview}
          onRemoveStock={handleRemoveSelectedStock}
        />
      </div>
    );
  }

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
            setRowsToShow={handleRowsToShowChange}
            onExportCSV={handleExportCSV}
            selectedStocks={selectedStocks}
            onCompareSelected={handleCompareSelected}
          />

          {selectedStocks.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-blue-800 font-medium">
                  {selectedStocks.length} stock(s) selected for analysis. 
                  {selectedStocks.length < 6 && ` You can select up to ${6 - selectedStocks.length} more.`}
                  {selectedStocks.length === 1 && " Select 1 more to enable comparison."}
                </p>
              </div>
            </div>
          )}

          {trendingStocks.length > 0 && (
            <StockTable
              filteredStocks={filteredStocks}
              rowsToShow={rowsToShow}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              tableColumns={tableColumns}
              selectedStocks={selectedStocks}
              onToggleStock={handleToggleStock}
            />
          )}
        </div>
      </div>
    </div>
  );
};
