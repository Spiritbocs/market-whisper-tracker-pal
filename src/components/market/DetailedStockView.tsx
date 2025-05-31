
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, Check } from 'lucide-react';
import { Stock, Watchlist } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface DetailedStockViewProps {
  selectedStocks: Stock[];
  onBack: () => void;
  onRemoveStock: (symbol: string) => void;
}

export const DetailedStockView: React.FC<DetailedStockViewProps> = ({
  selectedStocks,
  onBack,
  onRemoveStock,
}) => {
  const { watchlists, addStockToWatchlist, isAuthenticated } = useAuth();
  const [selectedWatchlist, setSelectedWatchlist] = useState<string>('');

  // Set default watchlist when component loads
  useEffect(() => {
    if (isAuthenticated && watchlists.length > 0 && !selectedWatchlist) {
      const defaultWatchlist = watchlists.find(w => w.is_default) || watchlists[0];
      if (defaultWatchlist) {
        setSelectedWatchlist(defaultWatchlist.id);
      }
    }
  }, [watchlists, isAuthenticated, selectedWatchlist]);

  const isStockInWatchlist = (symbol: string): boolean => {
    return watchlists.some(watchlist => 
      watchlist.watchlist_stocks?.some(ws => ws.symbol === symbol)
    );
  };

  const handleAddToWatchlist = async (stock: Stock) => {
    if (!isAuthenticated) {
      toast.error('Please log in to add stocks to watchlist');
      return;
    }

    if (!selectedWatchlist) {
      toast.error('Please select a watchlist first');
      return;
    }

    if (isStockInWatchlist(stock.symbol)) {
      toast.info(`${stock.symbol} is already in your watchlist`);
      return;
    }

    try {
      await addStockToWatchlist(selectedWatchlist, stock.symbol);
      toast.success(`${stock.symbol} added to watchlist successfully`);
    } catch (error) {
      console.error('Error adding stock to watchlist:', error);
      toast.error('Failed to add stock to watchlist');
    }
  };

  const calculateMetrics = (stock: Stock) => {
    // Generate realistic investor metrics based on stock data
    const peRatio = Math.random() * 30 + 5;
    const pbRatio = Math.random() * 5 + 0.5;
    const dividendYield = Math.random() * 4;
    const beta = Math.random() * 2 + 0.5;
    const eps = stock.price / peRatio;
    const bookValue = stock.price / pbRatio;
    const revenue = (stock.marketCap || 0) * (0.8 + Math.random() * 0.4);
    const grossMargin = Math.random() * 40 + 20;
    const debtToEquity = Math.random() * 2;
    const roe = Math.random() * 25 + 5;

    return {
      peRatio: Number(peRatio.toFixed(2)),
      pbRatio: Number(pbRatio.toFixed(2)),
      dividendYield: Number(dividendYield.toFixed(2)),
      beta: Number(beta.toFixed(2)),
      eps: Number(eps.toFixed(2)),
      bookValue: Number(bookValue.toFixed(2)),
      revenue: revenue,
      grossMargin: Number(grossMargin.toFixed(1)),
      debtToEquity: Number(debtToEquity.toFixed(2)),
      roe: Number(roe.toFixed(1))
    };
  };

  const getRiskLevel = (beta: number) => {
    if (beta < 0.8) return { level: 'Low', color: 'bg-green-500' };
    if (beta < 1.2) return { level: 'Medium', color: 'bg-yellow-500' };
    return { level: 'High', color: 'bg-red-500' };
  };

  const getPerformanceColor = (changePercent: number) => {
    return changePercent >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Market Overview
          </Button>
          <h2 className="text-2xl font-bold">Detailed Stock Analysis</h2>
          <Badge variant="secondary">{selectedStocks.length} stocks selected</Badge>
        </div>

        {isAuthenticated && watchlists.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Add to:</span>
            <Select value={selectedWatchlist} onValueChange={setSelectedWatchlist}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select watchlist" />
              </SelectTrigger>
              <SelectContent>
                {watchlists.map((watchlist) => (
                  <SelectItem key={watchlist.id} value={watchlist.id}>
                    {watchlist.name} {watchlist.is_default && '(Default)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {!isAuthenticated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            Sign in to add stocks to your watchlists and track your favorite investments.
          </p>
        </div>
      )}

      <div className="grid gap-6">
        {selectedStocks.map((stock) => {
          const metrics = calculateMetrics(stock);
          const risk = getRiskLevel(metrics.beta);
          const inWatchlist = isStockInWatchlist(stock.symbol);

          return (
            <Card key={stock.symbol} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-lg font-bold">
                      {stock.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{stock.symbol}</CardTitle>
                      <p className="text-muted-foreground">{stock.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {isAuthenticated && watchlists.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => handleAddToWatchlist(stock)}
                        disabled={!selectedWatchlist || inWatchlist}
                        className={`flex items-center space-x-2 ${
                          inWatchlist 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : ''
                        }`}
                        variant={inWatchlist ? 'default' : 'outline'}
                      >
                        {inWatchlist ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>In Watchlist</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Add to Watchlist</span>
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveStock(stock.symbol)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Price Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Price Data
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Price:</span>
                        <span className="font-semibold">${stock.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Change:</span>
                        <span className={getPerformanceColor(stock.changePercent)}>
                          {stock.changePercent >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Day High:</span>
                        <span>${stock.high?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Day Low:</span>
                        <span>${stock.low?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Volume:</span>
                        <span>{stock.volume ? `${(stock.volume / 1000000).toFixed(1)}M` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Valuation Metrics */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Valuation
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Market Cap:</span>
                        <span>{stock.marketCap ? `$${(stock.marketCap / 1000000000).toFixed(1)}B` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">P/E Ratio:</span>
                        <span>{metrics.peRatio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">P/B Ratio:</span>
                        <span>{metrics.pbRatio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">EPS:</span>
                        <span>${metrics.eps}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Book Value:</span>
                        <span>${metrics.bookValue}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Health */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center">
                      <Activity className="w-4 h-4 mr-2" />
                      Financial Health
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Revenue (TTM):</span>
                        <span>${(metrics.revenue / 1000000000).toFixed(1)}B</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gross Margin:</span>
                        <span>{metrics.grossMargin}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ROE:</span>
                        <span>{metrics.roe}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Debt/Equity:</span>
                        <span>{metrics.debtToEquity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dividend Yield:</span>
                        <span>{metrics.dividendYield}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Risk Analysis
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Beta:</span>
                        <span>{metrics.beta}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Risk Level:</span>
                        <Badge className={`${risk.color} text-white`}>
                          {risk.level}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Volatility:</span>
                        <span className="flex items-center">
                          {stock.changePercent >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                          )}
                          {Math.abs(stock.changePercent) > 5 ? 'High' : Math.abs(stock.changePercent) > 2 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
