
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { StockCard } from './StockCard';
import { StockSearch } from './StockSearch';
import { alphaVantageService } from '../services/alphaVantageService';
import { Stock } from '../types';
import { Plus, Trash2, List } from 'lucide-react';
import { toast } from 'sonner';

export const WatchlistManager: React.FC = () => {
  const { watchlists, addWatchlist, removeWatchlist, removeStockFromWatchlist, loadWatchlists } = useAuth();
  const [stocks, setStocks] = useState<Record<string, Stock[]>>({});
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const loadWatchlistStocks = async (watchlistId: string, symbols: string[]) => {
    if (symbols.length === 0) {
      setStocks(prev => ({ ...prev, [watchlistId]: [] }));
      return;
    }
    
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
    watchlists.forEach(watchlist => {
      const symbols = watchlist.watchlist_stocks?.map(ws => ws.symbol) || [];
      loadWatchlistStocks(watchlist.id, symbols);
    });
  }, [watchlists]);

  const handleCreateWatchlist = async () => {
    if (newWatchlistName.trim()) {
      await addWatchlist(newWatchlistName.trim());
      setNewWatchlistName('');
    }
  };

  const handleStockAdded = (watchlistId: string) => {
    loadWatchlists();
  };

  const handleRemoveStock = async (watchlistId: string, symbol: string) => {
    await removeStockFromWatchlist(watchlistId, symbol);
  };

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
        {watchlists.map((watchlist) => {
          const watchlistStocks = stocks[watchlist.id] || [];
          const stockSymbols = watchlist.watchlist_stocks?.map(ws => ws.symbol) || [];
          
          return (
            <Card key={watchlist.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <List className="w-5 h-5" />
                    <span>{watchlist.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({stockSymbols.length} stocks)
                    </span>
                  </CardTitle>
                  
                  <div className="flex items-center space-x-2">
                    {!watchlist.is_default && (
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
                ) : watchlistStocks.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {watchlistStocks.map((stock) => (
                      <StockCard
                        key={stock.symbol}
                        stock={stock}
                        showRemoveButton
                        onRemoveFromWatchlist={() => 
                          handleRemoveStock(watchlist.id, stock.symbol)
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
          );
        })}
      </div>
    </div>
  );
};
