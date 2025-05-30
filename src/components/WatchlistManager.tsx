
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
import { Plus, Trash2, List, Edit2, Star, MoreHorizontal, Settings } from 'lucide-react';
import { toast } from 'sonner';

export const WatchlistManager: React.FC = () => {
  const { watchlists, addWatchlist, removeWatchlist, removeStockFromWatchlist, loadWatchlists } = useAuth();
  const [stocks, setStocks] = useState<Record<string, Stock[]>>({});
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [editingWatchlist, setEditingWatchlist] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [selectedWatchlist, setSelectedWatchlist] = useState<string>('');

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
    if (watchlists.length > 0) {
      // Set the first watchlist as selected by default
      if (!selectedWatchlist) {
        setSelectedWatchlist(watchlists[0].id);
      }
      
      watchlists.forEach(watchlist => {
        const symbols = watchlist.watchlist_stocks?.map(ws => ws.symbol) || [];
        loadWatchlistStocks(watchlist.id, symbols);
      });
    }
  }, [watchlists, selectedWatchlist]);

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
    try {
      await removeStockFromWatchlist(watchlistId, symbol);
      toast.success('Stock removed from watchlist');
    } catch (error) {
      console.error('Error removing stock:', error);
      if (error.message?.includes('duplicate key')) {
        toast.error('This stock is already in your watchlist');
      } else {
        toast.error('Failed to remove stock from watchlist');
      }
    }
  };

  const handleRenameWatchlist = async (watchlistId: string, newName: string) => {
    // This would need to be implemented in the AuthContext
    // For now, we'll just show a message
    toast.info('Rename functionality will be available soon');
    setEditingWatchlist(null);
  };

  const selectedWatchlistData = watchlists.find(w => w.id === selectedWatchlist);
  const selectedWatchlistStocks = stocks[selectedWatchlist] || [];
  const stockSymbols = selectedWatchlistData?.watchlist_stocks?.map(ws => ws.symbol) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Watchlists</h1>
              <p className="text-muted-foreground mt-1">Track your favorite stocks and monitor their performance</p>
            </div>
            <div className="flex items-center space-x-3">
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
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Customize
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Watchlist tabs */}
        <div className="flex items-center space-x-1 mb-6 border-b">
          {watchlists.map((watchlist) => (
            <button
              key={watchlist.id}
              onClick={() => setSelectedWatchlist(watchlist.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedWatchlist === watchlist.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{watchlist.name}</span>
                {watchlist.is_default && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Main</span>}
                <span className="text-xs text-muted-foreground">
                  {stockSymbols.length}
                </span>
              </div>
            </button>
          ))}
          <Button variant="ghost" size="sm" className="ml-4">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {selectedWatchlistData && (
          <>
            {/* Watchlist header with search */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="flex items-center space-x-2">
                    {editingWatchlist === selectedWatchlist ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => {
                          handleRenameWatchlist(selectedWatchlist, editName);
                          setEditingWatchlist(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameWatchlist(selectedWatchlist, editName);
                            setEditingWatchlist(null);
                          }
                          if (e.key === 'Escape') {
                            setEditingWatchlist(null);
                          }
                        }}
                        className="text-2xl font-bold"
                        autoFocus
                      />
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold">{selectedWatchlistData.name}</h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingWatchlist(selectedWatchlist);
                            setEditName(selectedWatchlistData.name);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-muted-foreground">{stockSymbols.length} assets</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-80">
                  <StockSearch
                    watchlistId={selectedWatchlist}
                    onStockSelect={() => handleStockAdded(selectedWatchlist)}
                  />
                </div>
                {!selectedWatchlistData.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeWatchlist(selectedWatchlist)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Stocks table */}
            {isLoading[selectedWatchlist] ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading stocks...</p>
              </div>
            ) : selectedWatchlistStocks.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr className="text-sm text-muted-foreground">
                          <th className="text-left p-4 font-medium">#</th>
                          <th className="text-left p-4 font-medium">Name</th>
                          <th className="text-right p-4 font-medium">Price</th>
                          <th className="text-right p-4 font-medium">1h %</th>
                          <th className="text-right p-4 font-medium">24h %</th>
                          <th className="text-right p-4 font-medium">7d %</th>
                          <th className="text-right p-4 font-medium">Market Cap</th>
                          <th className="text-right p-4 font-medium">Volume(24h)</th>
                          <th className="text-right p-4 font-medium">Circulating Supply</th>
                          <th className="text-right p-4 font-medium">Last 7 Days</th>
                          <th className="text-right p-4 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedWatchlistStocks.map((stock, index) => (
                          <tr key={stock.symbol} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
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
                              <div className="flex items-center justify-end">
                                {stock.changePercent >= 0 ? '↗' : '↘'}
                                <span className="ml-1">{Math.abs(stock.changePercent).toFixed(2)}%</span>
                              </div>
                            </td>
                            <td className={`text-right p-4 ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              <div className="flex items-center justify-end">
                                {stock.changePercent >= 0 ? '↗' : '↘'}
                                <span className="ml-1">{Math.abs(stock.changePercent).toFixed(2)}%</span>
                              </div>
                            </td>
                            <td className={`text-right p-4 ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              <div className="flex items-center justify-end">
                                {stock.changePercent >= 0 ? '↗' : '↘'}
                                <span className="ml-1">{Math.abs(stock.changePercent).toFixed(2)}%</span>
                              </div>
                            </td>
                            <td className="text-right p-4 text-muted-foreground">
                              {stock.marketCap ? `$${(stock.marketCap / 1000000000).toFixed(1)}B` : 'N/A'}
                            </td>
                            <td className="text-right p-4 text-muted-foreground">
                              {stock.volume ? `$${(stock.volume / 1000000).toFixed(1)}M` : 'N/A'}
                            </td>
                            <td className="text-right p-4 text-muted-foreground">
                              {stock.volume ? `${(stock.volume / 1000000).toFixed(1)}M ${stock.symbol}` : 'N/A'}
                            </td>
                            <td className="text-right p-4">
                              <div className="w-20 h-8 bg-gradient-to-r from-green-500/20 to-red-500/20 rounded"></div>
                            </td>
                            <td className="text-right p-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveStock(selectedWatchlist, stock.symbol)}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Your watchlist is empty</h3>
                <p className="text-muted-foreground mb-6">
                  Start building your stock watchlist by clicking the button below
                </p>
                <div className="w-80 mx-auto">
                  <StockSearch
                    watchlistId={selectedWatchlist}
                    onStockSelect={() => handleStockAdded(selectedWatchlist)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
