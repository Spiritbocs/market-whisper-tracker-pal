
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { yahooFinanceService } from '../services/yahooFinanceService';
import { Stock } from '../types';
import { TrendingUp, TrendingDown, Shield, Target, AlertTriangle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface TradingIndication {
  stock: Stock;
  action: 'BUY' | 'SELL' | 'HOLD' | 'YIELD' | 'CAUTION';
  reason: string;
  confidence: number;
  icon: any;
  color: string;
}

const getIndication = (stock: Stock): TradingIndication => {
  const { changePercent, price, volume } = stock;
  
  if (changePercent > 5) {
    return {
      stock,
      action: 'SELL',
      reason: 'Strong gains - consider taking profits before reversal',
      confidence: 85,
      icon: TrendingDown,
      color: 'text-red-600'
    };
  } else if (changePercent > 2) {
    return {
      stock,
      action: 'HOLD',
      reason: 'Positive momentum - monitor for continuation',
      confidence: 75,
      icon: Shield,
      color: 'text-blue-600'
    };
  } else if (changePercent > 0.5) {
    return {
      stock,
      action: 'BUY',
      reason: 'Mild uptrend with room for growth',
      confidence: 70,
      icon: TrendingUp,
      color: 'text-green-600'
    };
  } else if (changePercent < -5) {
    return {
      stock,
      action: 'BUY',
      reason: 'Oversold conditions - potential bounce opportunity',
      confidence: 80,
      icon: Target,
      color: 'text-green-600'
    };
  } else if (changePercent < -2) {
    return {
      stock,
      action: 'CAUTION',
      reason: 'Declining trend - wait for stabilization',
      confidence: 65,
      icon: AlertTriangle,
      color: 'text-yellow-600'
    };
  } else if (changePercent < -0.5) {
    return {
      stock,
      action: 'HOLD',
      reason: 'Minor weakness - monitor closely',
      confidence: 60,
      icon: Shield,
      color: 'text-blue-600'
    };
  } else {
    return {
      stock,
      action: 'YIELD',
      reason: 'Stable price action - good for dividend yield',
      confidence: 55,
      icon: DollarSign,
      color: 'text-purple-600'
    };
  }
};

export const TradingIndications: React.FC = () => {
  const { watchlists } = useAuth();
  const [indications, setIndications] = useState<TradingIndication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadIndications = async () => {
      if (watchlists.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const allSymbols = watchlists.flatMap(w => 
          w.watchlist_stocks?.map(ws => ws.symbol) || []
        );
        
        if (allSymbols.length > 0) {
          const uniqueSymbols = [...new Set(allSymbols)];
          const stocks = await yahooFinanceService.getMultipleQuotes(uniqueSymbols);
          const stockIndications = stocks.map(getIndication);
          setIndications(stockIndications);
        }
      } catch (error) {
        console.error('Failed to load trading indications:', error);
        toast.error('Failed to load trading indications');
      } finally {
        setIsLoading(false);
      }
    };

    loadIndications();
  }, [watchlists]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading trading indications...</p>
      </div>
    );
  }

  if (indications.length === 0) {
    return (
      <div className="text-center py-16">
        <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Trading Indications</h3>
        <p className="text-muted-foreground">Add stocks to your watchlist to see trading recommendations</p>
      </div>
    );
  }

  const actionCounts = indications.reduce((acc, indication) => {
    acc[indication.action] = (acc[indication.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(actionCounts).map(([action, count]) => (
          <Card key={action}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-muted-foreground">{action}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trading Indications</h1>
          <p className="text-muted-foreground">AI-powered recommendations based on market analysis</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Indications Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr className="text-sm text-muted-foreground">
                  <th className="text-left p-4 font-medium">Stock</th>
                  <th className="text-left p-4 font-medium">Current Price</th>
                  <th className="text-left p-4 font-medium">24h Change</th>
                  <th className="text-left p-4 font-medium">Indication</th>
                  <th className="text-left p-4 font-medium">Confidence</th>
                  <th className="text-left p-4 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {indications.map((indication) => {
                  const IconComponent = indication.icon;
                  return (
                    <tr key={indication.stock.symbol} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                            {indication.stock.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold">{indication.stock.symbol}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-32">
                              {indication.stock.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">${indication.stock.price.toFixed(2)}</div>
                      </td>
                      <td className="p-4">
                        <div className={`flex items-center ${indication.stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {indication.stock.changePercent >= 0 ? '↗' : '↘'}
                          <span className="ml-1">{Math.abs(indication.stock.changePercent).toFixed(2)}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`flex items-center space-x-2 ${indication.color}`}>
                          <IconComponent className="w-4 h-4" />
                          <span className="font-medium">{indication.action}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${indication.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground">{indication.confidence}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground max-w-xs">
                          {indication.reason}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <strong>Disclaimer:</strong> These indications are for educational purposes only and should not be considered as financial advice. 
              Always conduct your own research and consult with a financial advisor before making investment decisions.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
