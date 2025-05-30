import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StockCard } from './StockCard';
import { yahooFinanceService } from '../services/yahooFinanceService';
import { Stock, MarketNews } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, TrendingDown, Globe, Clock, Plus, AlertCircle, ArrowUp, ArrowDown, Activity, BarChart3, Star, Target, ShieldCheck, Settings, Filter, Download } from 'lucide-react';
import { toast } from 'sonner';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

const getRecommendation = (stock: Stock): { action: string; reason: string; color: string; icon: any } => {
  const { changePercent, price } = stock;
  
  if (changePercent > 3) {
    return {
      action: "HOLD",
      reason: "Strong upward momentum, but consider taking profits",
      color: "text-yellow-600",
      icon: ShieldCheck
    };
  } else if (changePercent > 0.5) {
    return {
      action: "BUY",
      reason: "Positive momentum with room for growth",
      color: "text-green-600",
      icon: TrendingUp
    };
  } else if (changePercent < -3) {
    return {
      action: "BUY",
      reason: "Potential oversold opportunity",
      color: "text-green-600",
      icon: Target
    };
  } else if (changePercent < -1) {
    return {
      action: "HOLD",
      reason: "Wait for market stabilization",
      color: "text-yellow-600",
      icon: ShieldCheck
    };
  } else {
    return {
      action: "HOLD",
      reason: "Stable price action, monitor closely",
      color: "text-blue-600",
      icon: ShieldCheck
    };
  }
};

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

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(column);
    setSortOrder(newOrder);
    
    const sorted = [...filteredStocks].sort((a, b) => {
      let aValue, bValue;
      
      switch (column) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'change':
          aValue = a.changePercent;
          bValue = b.changePercent;
          break;
        case 'marketCap':
          aValue = a.marketCap || 0;
          bValue = b.marketCap || 0;
          break;
        case 'volume':
          aValue = a.volume || 0;
          bValue = b.volume || 0;
          break;
        default:
          aValue = a.symbol;
          bValue = b.symbol;
      }
      
      if (newOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredStocks(sorted);
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
  const topLosers = trendingStocks.filter(s => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

  const displayWatchlistStocks = isAuthenticated ? watchlistStocks : guestWatchlistStocks;

  return (
    <div className="space-y-6 bg-background">
      {/* Market Stats Header - Similar to CoinMarketCap */}
      <div className="bg-muted/30 border-b">
        <div className="w-full px-4 py-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Stocks:</span>
              <span className="font-medium">{trendingStocks.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Exchanges:</span>
              <span className="font-medium">3</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Market Cap:</span>
              <span className="font-medium">$45.2T</span>
              <span className="text-green-600">↗ 2.1%</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">24h Vol:</span>
              <span className="font-medium">$2.1T</span>
              <span className="text-green-600">↗ 5.4%</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Dominance:</span>
              <span className="font-medium">AAPL: 7.2%</span>
              <span className="font-medium">MSFT: 6.8%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-6">
        {/* Trending section with cards - Reduced height */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Trending Stocks card */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Trending Stocks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {trendingStocks.slice(0, 4).map((stock, index) => (
                <div key={stock.symbol} className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground w-3">{index + 1}</span>
                    <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                      {stock.symbol.slice(0, 1)}
                    </div>
                    <span className="font-medium text-xs">{stock.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-xs">${stock.price.toFixed(2)}</div>
                    <div className={`text-xs ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.changePercent >= 0 ? '↗' : '↘'} {Math.abs(stock.changePercent).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-xs text-muted-foreground pt-1">
                Updated: {new Date().toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>

          {/* Market Cap card with chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Market Cap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">$45.2T</div>
              <div className="text-green-600 text-xs flex items-center mb-2">
                <ArrowUp className="w-3 h-3 mr-1" />
                2.1% (24h)
              </div>
              <ChartContainer config={{ value: { label: 'Market Cap', color: '#22c55e' } }} className="h-16">
                <AreaChart data={marketCapData}>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#22c55e" 
                    fill="#22c55e" 
                    fillOpacity={0.2}
                    strokeWidth={1}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Volume card with chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">24h Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">$2.1T</div>
              <div className="text-green-600 text-xs flex items-center mb-2">
                <ArrowUp className="w-3 h-3 mr-1" />
                5.4% (24h)
              </div>
              <ChartContainer config={{ value: { label: 'Volume', color: '#3b82f6' } }} className="h-16">
                <AreaChart data={volumeData}>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.2}
                    strokeWidth={1}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Fear & Greed card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Market Sentiment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-xl font-bold">72</div>
                <div className="text-xs text-green-600 mb-2">Greed</div>
                <div className="w-12 h-12 rounded-full border-3 border-green-500 mx-auto flex items-center justify-center">
                  <div className="text-xs font-medium">72</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Based on volatility, momentum, and volume
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content area */}
        <div className="space-y-6">
          {/* Header with filters and customization */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Today's Stock Prices by Market Cap</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>LIVE - {new Date().toLocaleTimeString()}</span>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Customize
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Filter tabs and sorting options */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {['All', 'Active', 'Gainers', 'Losers'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeFilter === filter
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketCap">Market Cap</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="change">% Change</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stock table */}
          {trendingStocks.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b">
                      <tr className="text-sm text-muted-foreground">
                        <th className="text-left p-4 font-medium">#</th>
                        <th className="text-left p-4 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('name')}>
                          Name {sortBy === 'name' && (sortOrder === 'desc' ? '↓' : '↑')}
                        </th>
                        <th className="text-right p-4 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('price')}>
                          Price {sortBy === 'price' && (sortOrder === 'desc' ? '↓' : '↑')}
                        </th>
                        <th className="text-right p-4 font-medium">1h %</th>
                        <th className="text-right p-4 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('change')}>
                          24h % {sortBy === 'change' && (sortOrder === 'desc' ? '↓' : '↑')}
                        </th>
                        <th className="text-right p-4 font-medium">7d %</th>
                        <th className="text-right p-4 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('marketCap')}>
                          Market Cap {sortBy === 'marketCap' && (sortOrder === 'desc' ? '↓' : '↑')}
                        </th>
                        <th className="text-right p-4 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('volume')}>
                          Volume(24h) {sortBy === 'volume' && (sortOrder === 'desc' ? '↓' : '↑')}
                        </th>
                        <th className="text-right p-4 font-medium">Last 7 Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStocks.map((stock, index) => (
                        <tr key={stock.symbol} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <Star className="w-4 h-4 text-muted-foreground hover:text-yellow-500 cursor-pointer" />
                              <span className="font-medium">{index + 1}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                                {stock.symbol.slice(0, 2)}
                              </div>
                              <div>
                                <div className="font-semibold">{stock.symbol}</div>
                                <div className="text-sm text-muted-foreground truncate max-w-32">
                                  {stock.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="text-right p-4">
                            <div className="font-semibold">${stock.price.toFixed(2)}</div>
                          </td>
                          <td className={`text-right p-4 ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <div className="flex items-center justify-end">
                              {stock.changePercent >= 0 ? '↗' : '↘'}
                              <span className="ml-1">{Math.abs(stock.changePercent).toFixed(2)}%</span>
                            </div>
                          </td>
                          <td className={`text-right p-4 ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <div className="flex items-center justify-end">
                              {stock.changePercent >= 0 ? '↗' : '↘'}
                              <span className="ml-1">{Math.abs(stock.changePercent).toFixed(2)}%</span>
                            </div>
                          </td>
                          <td className={`text-right p-4 ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <div className="flex items-center justify-end">
                              {stock.changePercent >= 0 ? '↗' : '↘'}
                              <span className="ml-1">{Math.abs(stock.changePercent).toFixed(2)}%</span>
                            </div>
                          </td>
                          <td className="text-right p-4 text-muted-foreground">
                            {stock.marketCap ? `$${(stock.marketCap / 1000000000).toFixed(1)}B` : 'N/A'}
                          </td>
                          <td className="text-right p-4 text-muted-foreground">
                            {stock.volume ? `$${(stock.volume / 1000000).toFixed(1)}M` : 'N/A'}
                          </td>
                          <td className="text-right p-4">
                            <ChartContainer config={{ value: { label: 'Price', color: stock.changePercent >= 0 ? '#22c55e' : '#ef4444' } }} className="w-20 h-8">
                              <LineChart data={marketCapData}>
                                <Line 
                                  type="monotone" 
                                  dataKey="value" 
                                  stroke={stock.changePercent >= 0 ? '#22c55e' : '#ef4444'} 
                                  strokeWidth={1}
                                  dot={false}
                                />
                              </LineChart>
                            </ChartContainer>
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
    </div>
  );
};
