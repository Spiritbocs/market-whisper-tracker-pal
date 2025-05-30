
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StockCard } from './StockCard';
import { alphaVantageService } from '../services/alphaVantageService';
import { Stock } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, BarChart3 } from 'lucide-react';

export const MarketOverview: React.FC = () => {
  const [trendingStocks, setTrendingStocks] = useState<Stock[]>([]);
  const [marketIndices, setMarketIndices] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addStockToWatchlist, user } = useAuth();

  useEffect(() => {
    const loadMarketData = async () => {
      try {
        const [trending, indices] = await Promise.all([
          alphaVantageService.getTrendingStocks(),
          alphaVantageService.getMarketIndices(),
        ]);
        
        setTrendingStocks(trending);
        setMarketIndices(indices);
      } catch (error) {
        console.error('Failed to load market data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMarketData();
  }, []);

  const handleAddToDefaultWatchlist = (symbol: string) => {
    const defaultWatchlist = user?.watchlists.find(w => w.id === 'default');
    if (defaultWatchlist) {
      addStockToWatchlist('default', symbol);
    }
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
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
          Market Watchlist
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Track your favorite stocks, monitor market trends, and build personalized watchlists
        </p>
      </div>

      {/* Market Indices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Market Indices</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {marketIndices.map((stock) => (
              <StockCard
                key={stock.symbol}
                stock={stock}
                showAddButton={!!user}
                onAddToWatchlist={() => handleAddToDefaultWatchlist(stock.symbol)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trending Stocks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Popular Stocks</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trendingStocks.map((stock) => (
              <StockCard
                key={stock.symbol}
                stock={stock}
                showAddButton={!!user}
                onAddToWatchlist={() => handleAddToDefaultWatchlist(stock.symbol)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {!user && (
        <Card className="bg-accent/20 border-primary/20">
          <CardContent className="text-center py-8">
            <h3 className="text-xl font-semibold mb-2">Create Your Account</h3>
            <p className="text-muted-foreground mb-4">
              Sign up to create custom watchlists, track your favorite stocks, and get personalized market insights.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
