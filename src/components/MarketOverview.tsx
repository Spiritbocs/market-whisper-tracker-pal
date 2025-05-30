
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StockCard } from './StockCard';
import { yahooFinanceService } from '../services/yahooFinanceService';
import { Stock, MarketNews } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, Globe, Clock, Plus, AlertCircle, ArrowUp, ArrowDown, Activity, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export const MarketOverview: React.FC = () => {
  const [trendingStocks, setTrendingStocks] = useState<Stock[]>([]);
  const [marketIndices, setMarketIndices] = useState<Stock[]>([]);
  const [watchlistStocks, setWatchlistStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addStockToWatchlist, watchlists, isAuthenticated, loadWatchlists } = useAuth();

  useEffect(() => {
    const loadMarketData = async () => {
      try {
        setError(null);
        setIsLoading(true);
        
        console.log('🔴 LIVE: Loading real market data...');
        
        // Load trending stocks
        const trending = await yahooFinanceService.getTrendingStocks();
        if (trending.length > 0) {
          setTrendingStocks(trending);
          setFilteredStocks(trending);
          toast.success(`🔴 LIVE: Loaded ${trending.length} real stocks`);
        }
        
        // Load market indices
        const indices = await yahooFinanceService.getMarketIndices();
        if (indices.length > 0) {
          setMarketIndices(indices);
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
  }, []);

  // Load user's actual watchlist stocks
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
    let filtered = [...trendingStocks];
    
    switch (filter) {
      case 'Active':
        filtered = filtered.filter(stock => stock.volume && stock.volume > 1000000);
        break;
      case 'Gainers':
        filtered = filtered.filter(stock => stock.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent);
        break;
      case 'Losers':
        filtered = filtered.filter(stock => stock.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent);
        break;
      default:
        break;
    }
    
    setFilteredStocks(filtered);
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

  const topGainers = trendingStocks.filter(s => s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar - User's Actual Watchlist */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">My Watchlist</CardTitle>
                  <button className="text-primary hover:text-primary/80">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isAuthenticated ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-3">
                      Sign in to create and manage watchlists
                    </p>
                  </div>
                ) : watchlistStocks.length > 0 ? (
                  <div className="space-y-2">
                    {watchlistStocks.map((stock) => (
                      <div key={stock.symbol} className="flex items-center justify-between p-2 hover:bg-accent rounded text-sm">
                        <div className="flex-1">
                          <div className="font-medium">{stock.symbol}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {stock.name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${stock.price}</div>
                          <div className={`text-xs flex items-center ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stock.changePercent >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                            {Math.abs(stock.changePercent)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      Your watchlist is empty. Add some stocks to get started.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center content - Chart and stock table */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold flex items-center">
                    <Activity className="w-6 h-6 mr-2 text-green-500" />
                    Live Market Data
                  </h1>
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>LIVE - {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Chart placeholder with real market indices */}
              <Card className="h-80">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Market Indices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {marketIndices.length > 0 ? (
                    marketIndices.map((index) => (
                      <div key={index.symbol} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{index.name}</div>
                          <div className="text-sm text-muted-foreground">{index.symbol}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{index.price.toLocaleString()}</div>
                          <div className={`text-sm flex items-center justify-end ${index.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {index.changePercent >= 0 ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                            {index.change >= 0 ? '+' : ''}{index.change} ({index.changePercent >= 0 ? '+' : ''}{index.changePercent}%)
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Loading market indices...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stock table with filters */}
              {trendingStocks.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-4">
                      {['All', 'Active', 'Gainers', 'Losers'].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => handleFilterChange(filter)}
                          className={`px-3 py-1 text-sm rounded-full transition-colors ${
                            activeFilter === filter
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr className="text-sm text-muted-foreground">
                            <th className="text-left p-3">Symbol</th>
                            <th className="text-right p-3">Last Price</th>
                            <th className="text-right p-3">Change</th>
                            <th className="text-right p-3">% Change</th>
                            <th className="text-right p-3">Volume</th>
                            <th className="text-right p-3">High</th>
                            <th className="text-right p-3">Low</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStocks.map((stock) => (
                            <tr key={stock.symbol} className="border-b hover:bg-accent/50">
                              <td className="p-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-xs font-medium">
                                    {stock.symbol.slice(0, 2)}
                                  </div>
                                  <div>
                                    <div className="font-medium">{stock.symbol}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-24">
                                      {stock.name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="text-right p-3 font-medium">
                                ${stock.price}
                              </td>
                              <td className={`text-right p-3 ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stock.change >= 0 ? '+' : ''}{stock.change}
                              </td>
                              <td className={`text-right p-3 font-medium ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                <div className="flex items-center justify-end">
                                  {stock.changePercent >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                                </div>
                              </td>
                              <td className="text-right p-3 text-sm text-muted-foreground">
                                {stock.volume ? `${(stock.volume / 1000000).toFixed(1)}M` : 'N/A'}
                              </td>
                              <td className="text-right p-3 text-sm text-muted-foreground">
                                ${stock.high || 'N/A'}
                              </td>
                              <td className="text-right p-3 text-sm text-muted-foreground">
                                ${stock.low || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right sidebar - Performance and Top Gainers */}
          <div className="lg:col-span-1 space-y-6">
            {/* Real Performance metrics from market indices */}
            {marketIndices.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Market Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {marketIndices.map((index) => (
                    <div key={index.symbol} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{index.name}</span>
                      <span className={`text-sm font-medium ${index.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {index.changePercent >= 0 ? '+' : ''}{index.changePercent}%
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Real Top gainers */}
            {topGainers.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Top Gainers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topGainers.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground">Live data</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">${stock.price}</div>
                        <div className="text-xs text-green-600 flex items-center">
                          <ArrowUp className="w-3 h-3 mr-1" />
                          +{stock.changePercent}%
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
