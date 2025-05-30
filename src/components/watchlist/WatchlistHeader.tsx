
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface WatchlistHeaderProps {
  newWatchlistName: string;
  setNewWatchlistName: (name: string) => void;
  onCreateWatchlist: () => void;
}

export const WatchlistHeader: React.FC<WatchlistHeaderProps> = ({
  newWatchlistName,
  setNewWatchlistName,
  onCreateWatchlist,
}) => {
  return (
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
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Create New Watchlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Watchlist name"
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onCreateWatchlist()}
              />
              <Button onClick={onCreateWatchlist} className="w-full">
                Create Watchlist
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
