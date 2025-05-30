
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StockSearch } from '../StockSearch';
import { Edit2, Trash2 } from 'lucide-react';

interface Watchlist {
  id: string;
  name: string;
  is_default: boolean;
  watchlist_stocks?: Array<{ symbol: string }>;
}

interface WatchlistControlsProps {
  watchlist: Watchlist;
  stockSymbols: string[];
  editingWatchlist: string | null;
  editName: string;
  setEditingWatchlist: (id: string | null) => void;
  setEditName: (name: string) => void;
  onRenameWatchlist: (id: string, name: string) => void;
  onRemoveWatchlist: (id: string) => void;
  onStockAdded: (watchlistId: string) => void;
}

export const WatchlistControls: React.FC<WatchlistControlsProps> = ({
  watchlist,
  stockSymbols,
  editingWatchlist,
  editName,
  setEditingWatchlist,
  setEditName,
  onRenameWatchlist,
  onRemoveWatchlist,
  onStockAdded,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div>
          <div className="flex items-center space-x-2">
            {editingWatchlist === watchlist.id ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => {
                  onRenameWatchlist(watchlist.id, editName);
                  setEditingWatchlist(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onRenameWatchlist(watchlist.id, editName);
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
                <h2 className="text-2xl font-bold">{watchlist.name}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingWatchlist(watchlist.id);
                    setEditName(watchlist.name);
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
            watchlistId={watchlist.id}
            onStockSelect={() => onStockAdded(watchlist.id)}
          />
        </div>
        {!watchlist.is_default && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemoveWatchlist(watchlist.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
