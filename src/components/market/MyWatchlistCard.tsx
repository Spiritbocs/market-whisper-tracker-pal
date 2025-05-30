
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { List, Eye } from 'lucide-react';
import { Stock } from '../../types';

interface MyWatchlistCardProps {
  watchlistStocks: Stock[];
  showWatchlistModal: boolean;
  setShowWatchlistModal: (show: boolean) => void;
}

export const MyWatchlistCard: React.FC<MyWatchlistCardProps> = ({
  watchlistStocks,
  showWatchlistModal,
  setShowWatchlistModal,
}) => {
  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <List className="w-5 h-5 mr-2 text-green-500" />
          My Watchlist
        </h3>
        <Dialog open={showWatchlistModal} onOpenChange={setShowWatchlistModal}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>My Watchlist</DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {watchlistStocks.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                        {stock.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium">{stock.symbol}</div>
                        <div className="text-sm text-muted-foreground">{stock.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${stock.price.toFixed(2)}</div>
                      <div className={`text-sm ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {watchlistStocks.slice(0, 3).map((stock, index) => (
          <div key={stock.symbol} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground w-4">{index + 1}</span>
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                {stock.symbol.slice(0, 1)}
              </div>
              <div>
                <div className="font-medium text-sm">{stock.symbol}</div>
                <div className="text-xs text-muted-foreground">${stock.price.toFixed(2)}</div>
              </div>
            </div>
            <div className={`text-sm font-medium ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
