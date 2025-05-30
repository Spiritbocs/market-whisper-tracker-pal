
import React from 'react';

interface Watchlist {
  id: string;
  name: string;
  is_default: boolean;
  watchlist_stocks?: Array<{ symbol: string }>;
}

interface WatchlistTabsProps {
  watchlists: Watchlist[];
  selectedWatchlist: string;
  onSelectWatchlist: (id: string) => void;
}

export const WatchlistTabs: React.FC<WatchlistTabsProps> = ({
  watchlists,
  selectedWatchlist,
  onSelectWatchlist,
}) => {
  if (watchlists.length === 0) return null;

  return (
    <div className="flex items-center space-x-1 border-b">
      {watchlists.map((watchlist) => (
        <button
          key={watchlist.id}
          onClick={() => onSelectWatchlist(watchlist.id)}
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
              {watchlist.watchlist_stocks?.length || 0}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};
