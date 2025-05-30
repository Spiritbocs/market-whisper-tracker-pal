
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { yahooFinanceService } from '../services/yahooFinanceService';
import { Stock } from '../types';
import { toast } from 'sonner';
import { WatchlistHeader } from './watchlist/WatchlistHeader';
import { WatchlistTabs } from './watchlist/WatchlistTabs';
import { WatchlistControls } from './watchlist/WatchlistControls';
import { WatchlistTable } from './watchlist/WatchlistTable';
import { EmptyWatchlistState } from './watchlist/EmptyWatchlistState';
import { supabase } from '@/integrations/supabase/client';

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
      console.log(`Loading stocks for watchlist ${watchlistId}:`, symbols);
      const stockData = await yahooFinanceService.getMultipleQuotes(symbols);
      console.log(`Loaded ${stockData.length} stocks for watchlist ${watchlistId}`);
      setStocks(prev => ({ ...prev, [watchlistId]: stockData }));
    } catch (error) {
      console.error('Failed to load watchlist stocks:', error);
      toast.error('Failed to load some stock data');
      setStocks(prev => ({ ...prev, [watchlistId]: [] }));
    } finally {
      setIsLoading(prev => ({ ...prev, [watchlistId]: false }));
    }
  };

  useEffect(() => {
    console.log('Watchlists updated:', watchlists);
    if (watchlists.length > 0) {
      if (!selectedWatchlist && watchlists[0]) {
        setSelectedWatchlist(watchlists[0].id);
      }
      
      watchlists.forEach(watchlist => {
        const symbols = watchlist.watchlist_stocks?.map(ws => ws.symbol) || [];
        console.log(`Watchlist ${watchlist.name} has symbols:`, symbols);
        loadWatchlistStocks(watchlist.id, symbols);
      });
    }
  }, [watchlists, selectedWatchlist]);

  const handleCreateWatchlist = async () => {
    if (newWatchlistName.trim()) {
      try {
        await addWatchlist(newWatchlistName.trim());
        setNewWatchlistName('');
        toast.success('Watchlist created successfully');
      } catch (error) {
        console.error('Error creating watchlist:', error);
        toast.error('Failed to create watchlist');
      }
    }
  };

  const handleStockAdded = async (watchlistId: string) => {
    console.log('Stock added to watchlist, reloading...');
    await loadWatchlists();
    const watchlist = watchlists.find(w => w.id === watchlistId);
    if (watchlist) {
      const symbols = watchlist.watchlist_stocks?.map(ws => ws.symbol) || [];
      await loadWatchlistStocks(watchlistId, symbols);
    }
  };

  const handleRemoveStock = async (watchlistId: string, symbol: string) => {
    try {
      await removeStockFromWatchlist(watchlistId, symbol);
      toast.success('Stock removed from watchlist');
      await loadWatchlists();
    } catch (error) {
      console.error('Error removing stock:', error);
      toast.error('Failed to remove stock from watchlist');
    }
  };

  const handleRenameWatchlist = async (watchlistId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('watchlists')
        .update({ name: newName.trim() })
        .eq('id', watchlistId);

      if (error) throw error;

      toast.success('Watchlist renamed successfully');
      await loadWatchlists();
      setEditingWatchlist(null);
    } catch (error) {
      console.error('Error renaming watchlist:', error);
      toast.error('Failed to rename watchlist');
    }
  };

  const selectedWatchlistData = watchlists.find(w => w.id === selectedWatchlist);
  const selectedWatchlistStocks = stocks[selectedWatchlist] || [];
  const stockSymbols = selectedWatchlistData?.watchlist_stocks?.map(ws => ws.symbol) || [];

  console.log('Current state:', {
    selectedWatchlist,
    selectedWatchlistData,
    stockSymbols,
    selectedWatchlistStocks: selectedWatchlistStocks.length,
    isLoading: isLoading[selectedWatchlist]
  });

  return (
    <div className="space-y-6 bg-background">
      <WatchlistHeader
        newWatchlistName={newWatchlistName}
        setNewWatchlistName={setNewWatchlistName}
        onCreateWatchlist={handleCreateWatchlist}
      />

      <WatchlistTabs
        watchlists={watchlists}
        selectedWatchlist={selectedWatchlist}
        onSelectWatchlist={setSelectedWatchlist}
      />

      {selectedWatchlistData ? (
        <>
          <WatchlistControls
            watchlist={selectedWatchlistData}
            stockSymbols={stockSymbols}
            editingWatchlist={editingWatchlist}
            editName={editName}
            setEditingWatchlist={setEditingWatchlist}
            setEditName={setEditName}
            onRenameWatchlist={handleRenameWatchlist}
            onRemoveWatchlist={removeWatchlist}
            onStockAdded={handleStockAdded}
          />

          <WatchlistTable
            stocks={selectedWatchlistStocks}
            isLoading={isLoading[selectedWatchlist] || false}
            onRemoveStock={(symbol) => handleRemoveStock(selectedWatchlist, symbol)}
          />
        </>
      ) : (
        <EmptyWatchlistState
          onCreateWatchlist={() => setNewWatchlistName('My First Watchlist')}
        />
      )}
    </div>
  );
};
