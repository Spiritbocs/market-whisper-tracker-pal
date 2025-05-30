
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus } from 'lucide-react';
import { alphaVantageService } from '../services/alphaVantageService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface StockSearchProps {
  onStockSelect?: (symbol: string) => void;
  watchlistId?: string;
}

export const StockSearch: React.FC<StockSearchProps> = ({ onStockSelect, watchlistId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addStockToWatchlist, user } = useAuth();

  useEffect(() => {
    const searchStocks = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await alphaVantageService.searchSymbols(query);
        setResults(searchResults);
      } catch (error) {
        console.error('Search failed:', error);
        toast.error('Search failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchStocks, 500);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleAddStock = (symbol: string) => {
    if (watchlistId) {
      addStockToWatchlist(watchlistId, symbol);
    }
    if (onStockSelect) {
      onStockSelect(symbol);
    }
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search stocks (e.g., AAPL, TSLA)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-10 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {results.map((result, index) => (
              <div
                key={index}
                className="p-3 border-b last:border-b-0 hover:bg-accent/50 cursor-pointer"
                onClick={() => handleAddStock(result.symbol)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{result.symbol}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {result.name}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 text-center text-muted-foreground">
          Searching...
        </div>
      )}
    </div>
  );
};
