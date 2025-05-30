
import React from 'react';
import { Button } from '@/components/ui/button';
import { List, Plus } from 'lucide-react';

interface EmptyWatchlistStateProps {
  onCreateWatchlist: () => void;
}

export const EmptyWatchlistState: React.FC<EmptyWatchlistStateProps> = ({
  onCreateWatchlist,
}) => {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <List className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No watchlists yet</h3>
      <p className="text-muted-foreground mb-6">
        Create your first watchlist to start tracking stocks
      </p>
      <Button onClick={onCreateWatchlist}>
        <Plus className="w-4 h-4 mr-2" />
        Create Watchlist
      </Button>
    </div>
  );
};
