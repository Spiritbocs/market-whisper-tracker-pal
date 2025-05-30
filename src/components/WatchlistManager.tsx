
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { StockCard } from './StockCard';
import { StockSearch } from './StockSearch';
import { alphaVantageService } from '../services/alphaVantageService';
import { Stock } from '../types';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const WatchlistManager: React.FC = () => {
  const { user, addWatchlist, removeWatchlist, removeStockFromWatchlist } = useAuth();
  const [stocks, setStocks] = useState<Record<string, Stock[]>>({});
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const loadWatchlistStocks = async (watchlistId: string, symbols: string[]) => {
    if (symbols.length === 0) return;
    
    setIsLoading(prev => ({ ...prev, [watchlistId]: true }));
    try {
      const stockData = await alphaVantageService.getMultipleQuotes(symbols);
      setStocks(prev => ({ ...prev, [watchlistId]: stockData }));
    } catch (error) {
      console.error('Failed to load watchlist stocks:', error);
      toast.error('Failed to load some stock data');
    } finally {
      setIsLoading(prev => ({ ...prev, [watchlistId]: false }));
    }
  };

  useEffect(() => {
    if (user?.watchlists) {
      user.watchlists.forEach(watchlist => {
        loadWatchlistStocks(watchlist.id, watchlist.stocks);
      });
    }
  }, [user?.watchlists]);

  const handleCreateWatchlist = () => {
    if (newWatchlistName.trim()) {
      addWatchlist(newWatchlistName.trim());
      setNewWatchlistName('');
    }
  };

  const handleStockAdded = (watchlistId: string) => {
    const watchlist = user?.watchlists.find(w => w.id === watchlistId);
    if (watchlist) {
      loadWatchlistStocks(watchlistId, watchlist.stocks);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Watchlists</h2>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Watchlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Watchlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Watchlist name"
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateWatchlist()}
              />
              <Button onClick={handleCreateWatchlist} className="w-full">
                Create Watchlist
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {user.watchlists.map((watchlist) => (
          <Card key={watchlist.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <span>{watchlist.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({watchlist.stocks.length} stocks)
                  </span>
                </CardTitle>
                
                <div className="flex items-center space-x-2">
                  {watchlist.id !== 'default' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeWatchlist(watchlist.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <StockSearch
                watchlistId={watchlist.id}
                onStockSelect={() => handleStockAdded(watchlist.id)}
              />
            </CardHeader>
            
            <CardContent>
              {isLoading[watchlist.id] ? (
                <div className="text-center py-8">Loading stocks...</div>
              ) : stocks[watchlist.id]?.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {stocks[watchlist.id].map((stock) => (
                    <StockCard
                      key={stock.symbol}
                      stock={stock}
                      showRemoveButton
                      onRemoveFromWatchlist={() => 
                        removeStockFromWatchlist(watchlist.id, stock.symbol)
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No stocks in this watchlist. Use the search above to add some!
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
