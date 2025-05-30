import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Trash2 } from 'lucide-react';
import { Stock } from '../../types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StockTableProps {
  stocks: Stock[];
  isLoading: boolean;
  onRemoveStock: (symbol: string) => void;
}

export const StockTable: React.FC<StockTableProps> = ({
  stocks,
  isLoading,
  onRemoveStock,
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading stocks...</p>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Your watchlist is empty</h3>
        <p className="text-muted-foreground mb-6">
          Start building your stock watchlist by searching for stocks above
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr className="text-sm text-muted-foreground">
                <th className="text-left p-4 font-medium">#</th>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-right p-4 font-medium">Price</th>
                <th className="text-right p-4 font-medium">24h %</th>
                <th className="text-right p-4 font-medium">Market Cap</th>
                <th className="text-right p-4 font-medium">Volume(24h)</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock, index) => (
                <tr key={stock.symbol} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Stock is in your watchlist</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-end">
                            {stock.changePercent >= 0 ? '↗' : '↘'}
                            <span className="ml-1">{Math.abs(stock.changePercent).toFixed(2)}%</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Price change in the last 24 hours</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  <td className="text-right p-4 text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>{stock.marketCap ? `$${(stock.marketCap / 1000000000).toFixed(1)}B` : 'N/A'}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total market value of all shares</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  <td className="text-right p-4 text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>{stock.volume ? `$${(stock.volume / 1000000).toFixed(1)}M` : 'N/A'}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Trading volume in the last 24 hours</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  <td className="text-right p-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveStock(stock.symbol)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remove from watchlist</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};