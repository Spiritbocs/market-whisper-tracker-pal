
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StockCard } from './StockCard';
import { alphaVantageService } from '../services/alphaVantageService';
import { Stock, MarketNews } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, Globe, Clock, ExternalLink } from 'lucide-react';

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
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Header */}
      <div className="border-b pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Markets</h1>
            <p className="text-muted-foreground mt-1">Real-time market data and analysis</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Market Indices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {marketIndices.map((stock) => (
          <Card key={stock.symbol} className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{stock.symbol}</h3>
                  <p className="text-2xl font-bold">${stock.price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <div className={`flex items-center space-x-1 ${
                    stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span className="font-medium">
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                    </span>
                    <span className="text-sm">
                      ({stock.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market News */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Market News</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {marketNews.slice(0, 8).map((article, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start space-x-3">
                    {article.banner_image && (
                      <img 
                        src={article.banner_image} 
                        alt=""
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm leading-5 line-clamp-2 mb-1">
                        {article.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {article.summary}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{article.source}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(article.time_published)}</span>
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Active Stocks */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Most Active</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trendingStocks.slice(0, 10).map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-2 hover:bg-accent rounded">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{stock.symbol}</span>
                        <span className="text-sm font-medium">${stock.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground truncate pr-2">
                          {stock.name}
                        </span>
                        <span className={`text-xs font-medium ${
                          stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    {isAuthenticated && (
                      <button
                        onClick={() => handleAddToDefaultWatchlist(stock.symbol)}
                        className="ml-2 p-1 hover:bg-background rounded text-xs"
                      >
                        +
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {!isAuthenticated && (
        <Card className="bg-accent/20 border-primary/20">
          <CardContent className="text-center py-8">
            <h3 className="text-xl font-semibold mb-2">Track Your Investments</h3>
            <p className="text-muted-foreground mb-4">
              Create an account to build custom watchlists, track your portfolio, and get personalized market insights.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
