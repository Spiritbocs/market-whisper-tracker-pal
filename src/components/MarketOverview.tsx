
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StockCard } from './StockCard';
import { alphaVantageService } from '../services/alphaVantageService';
import { Stock, MarketNews } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, Globe, Clock, ExternalLink, Plus } from 'lucide-react';

export const MarketOverview: React.FC = () => {
  const [trendingStocks, setTrendingStocks] = useState<Stock[]>([]);
  const [marketIndices, setMarketIndices] = useState<Stock[]>([]);
  const [marketNews, setMarketNews] = useState<MarketNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addStockToWatchlist, watchlists, isAuthenticated } = useAuth();

  useEffect(() => {
    const loadMarketData = async () => {
      try {
        const [trending, indices, news] = await Promise.all([
          alphaVantageService.getTrendingStocks(),
          alphaVantageService.getMarketIndices(),
          alphaVantageService.getMarketNews(),
        ]);
        
        setTrendingStocks(trending);
        setMarketIndices(indices);
        setMarketNews(news);
      } catch (error) {
        console.error('Failed to load market data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMarketData();
  }, []);

  const handleAddToDefaultWatchlist = async (symbol: string) => {
    const defaultWatchlist = watchlists.find(w => w.is_default);
    if (defaultWatchlist) {
      await addStockToWatchlist(defaultWatchlist.id, symbol);
    }
  };

  const formatTimeAgo = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top ticker strip */}
      <div className="bg-card border-b px-4 py-2 overflow-x-auto">
        <div className="flex items-center space-x-6 min-w-max">
          <span className="text-sm font-medium text-muted-foreground">Popular</span>
          {trendingStocks.slice(0, 8).map((stock) => (
            <div key={stock.symbol} className="flex items-center space-x-2 text-sm">
              <span className="font-medium">{stock.symbol}</span>
              <span className={stock.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                {stock.change >= 0 ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar - Watchlist */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">My watchlist</CardTitle>
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
                ) : (
                  <>
                    <div className="space-y-2">
                      {trendingStocks.slice(0, 5).map((stock) => (
                        <div key={stock.symbol} className="flex items-center justify-between p-2 hover:bg-accent rounded text-sm">
                          <div className="flex-1">
                            <div className="font-medium">{stock.symbol}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {stock.name}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${stock.price.toFixed(2)}</div>
                            <div className={`text-xs ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3 border-t">
                      <h4 className="text-sm font-medium mb-2">Suggested for you</h4>
                      <div className="space-y-2">
                        {trendingStocks.slice(5, 8).map((stock) => (
                          <div key={stock.symbol} className="flex items-center justify-between p-2 hover:bg-accent rounded text-sm">
                            <div className="flex-1">
                              <div className="font-medium">{stock.symbol}</div>
                              <div className="text-xs text-muted-foreground">
                                {stock.change >= 0 ? 'Price up' : 'Price down'}
                              </div>
                            </div>
                            <div className={`text-xs ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stock.changePercent.toFixed(2)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center content - Main chart and table */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Watchlist header */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold">Watchlist</h1>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {trendingStocks.length} Symbols
                </div>
              </div>

              {/* Chart placeholder */}
              <Card className="h-80">
                <CardContent className="p-6 h-full flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Chart visualization coming soon</p>
                  </div>
                </CardContent>
              </Card>

              {/* Stock table */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-4">
                    <button className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm">
                      All
                    </button>
                    <button className="px-3 py-1 text-sm hover:bg-accent rounded-full">
                      Active
                    </button>
                    <button className="px-3 py-1 text-sm hover:bg-accent rounded-full">
                      Gainers
                    </button>
                    <button className="px-3 py-1 text-sm hover:bg-accent rounded-full">
                      Losers
                    </button>
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
                          <th className="text-right p-3">% Chg</th>
                          <th className="text-right p-3">Volume</th>
                          <th className="text-right p-3">Day Range</th>
                          <th className="text-right p-3">52Wk Range</th>
                          <th className="text-right p-3">Market cap</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trendingStocks.map((stock) => (
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
                              ${stock.price.toFixed(2)}
                            </td>
                            <td className={`text-right p-3 ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                            </td>
                            <td className={`text-right p-3 ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </td>
                            <td className="text-right p-3 text-sm text-muted-foreground">
                              {(Math.random() * 100 + 10).toFixed(1)}M
                            </td>
                            <td className="text-right p-3 text-sm text-muted-foreground">
                              ${(stock.price * 0.95).toFixed(2)} - ${(stock.price * 1.05).toFixed(2)}
                            </td>
                            <td className="text-right p-3 text-sm text-muted-foreground">
                              ${(stock.price * 0.7).toFixed(2)} - ${(stock.price * 1.3).toFixed(2)}
                            </td>
                            <td className="text-right p-3 text-sm text-muted-foreground">
                              ${((Math.random() * 2 + 0.5) * 1000).toFixed(0)}B
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right sidebar - Performance and news */}
          <div className="lg:col-span-1 space-y-6">
            {/* Performance metrics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">1-Month Return</span>
                    <span className="text-sm font-medium text-green-600">+11.39%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">VS S&P 500</span>
                    <span className="text-sm font-medium text-green-600">+5.07%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">VS DOW</span>
                    <span className="text-sm font-medium text-green-600">+7.22%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">VS NASDAQ</span>
                    <span className="text-sm font-medium text-green-600">+1.57%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top gainers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Top Gainers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingStocks
                  .filter(stock => stock.change > 0)
                  .slice(0, 5)
                  .map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground">Price up</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">${stock.price.toFixed(2)}</div>
                        <div className="text-xs text-green-600">
                          +{stock.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Market news */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  News
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {marketNews.slice(0, 5).map((article, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="text-sm font-medium leading-tight line-clamp-2">
                      {article.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{article.source}</span>
                      <span>{formatTimeAgo(article.time_published)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
