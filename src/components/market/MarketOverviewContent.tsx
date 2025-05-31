import React, { useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { MarketStatsHeader } from './MarketStatsHeader';
import { MarketSummaryCards } from './MarketSummaryCards';
import { MyWatchlistCard } from './MyWatchlistCard';
import { MarketFilters } from './MarketFilters';
import { StockTable } from './StockTable';
import { DetailedStockView } from './DetailedStockView';
import { LoadingScreen } from './LoadingScreen';
import { exportToCSV } from '../../utils/marketUtils';
import { useAuth } from '../../contexts/AuthContext';
import { useMarketData } from '../../hooks/useMarketData';
import { useMarketSettings } from '../../hooks/useMarketSettings';
import { useStockSelection } from '../../hooks/useStockSelection';

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

export const MarketOverviewContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  const {
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
  } = useMarketData();

  const {
    activeFilter,
    setActiveFilter,
    tableColumns,
    setTableColumns,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    rowsToShow,
    setRowsToShow,
    showWatchlistModal,
    setShowWatchlistModal,
    showCustomizeModal,
    setShowCustomizeModal
  } = useMarketSettings();

  const {
    selectedStocks,
    showDetailedView,
    handleToggleStock,
    handleRemoveSelectedStock,
    handleBackToOverview,
    handleCompareSelected
  } = useStockSelection();

  useEffect(() => {
    loadMarketData(activeFilter, sortBy, sortOrder);
  }, [isAuthenticated, activeFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadUserWatchlistStocks();
  }, [isAuthenticated]);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    updateFilteredStocks(filter, sortBy, sortOrder);
  };

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(column);
    setSortOrder(newOrder);
    updateFilteredStocks(activeFilter, column, newOrder);
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

  // Show loading screen with timer
  if (isLoading) {
    return <LoadingScreen isLoading={isLoading} />;
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

  // Show detailed view only when explicitly triggered by Compare button
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
