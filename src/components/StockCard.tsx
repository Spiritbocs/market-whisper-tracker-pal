
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Stock } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockCardProps {
  stock: Stock;
  onAddToWatchlist?: () => void;
  onRemoveFromWatchlist?: () => void;
  showAddButton?: boolean;
  showRemoveButton?: boolean;
}

export const StockCard: React.FC<StockCardProps> = ({
  stock,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  showAddButton = false,
  showRemoveButton = false,
}) => {
  const { isAuthenticated } = useAuth();
  const isPositive = stock.change >= 0;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{stock.symbol}</h3>
              {isAuthenticated && showAddButton && onAddToWatchlist && (
                <Button size="sm" variant="outline" onClick={onAddToWatchlist}>
                  <Plus className="w-4 h-4" />
                </Button>
              )}
              {isAuthenticated && showRemoveButton && onRemoveFromWatchlist && (
                <Button size="sm" variant="outline" onClick={onRemoveFromWatchlist}>
                  <Minus className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-bold">
                ${stock.price.toFixed(2)}
              </div>
              
              <div className={cn(
                "flex items-center space-x-2 text-sm font-medium",
                isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                <span>{isPositive ? '+' : ''}{stock.change.toFixed(2)}</span>
                <span>({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
