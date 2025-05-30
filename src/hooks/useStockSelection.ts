
import { useState } from 'react';
import { Stock } from '../types';
import { toast } from 'sonner';

export const useStockSelection = () => {
  const [selectedStocks, setSelectedStocks] = useState<Stock[]>([]);
  const [showDetailedView, setShowDetailedView] = useState(false);

  const handleToggleStock = (stock: Stock) => {
    setSelectedStocks(prev => {
      const isAlreadySelected = prev.some(s => s.symbol === stock.symbol);
      
      if (isAlreadySelected) {
        return prev.filter(s => s.symbol !== stock.symbol);
      } else {
        if (prev.length >= 6) {
          toast.error('You can select up to 6 stocks for detailed analysis');
          return prev;
        }
        return [...prev, stock];
      }
    });
  };

  const handleRemoveSelectedStock = (symbol: string) => {
    setSelectedStocks(prev => prev.filter(s => s.symbol !== symbol));
  };

  const handleBackToOverview = () => {
    setShowDetailedView(false);
  };

  const handleCompareSelected = () => {
    if (selectedStocks.length < 2) {
      toast.error('Please select at least 2 stocks to compare');
      return;
    }
    setShowDetailedView(true);
  };

  return {
    selectedStocks,
    showDetailedView,
    handleToggleStock,
    handleRemoveSelectedStock,
    handleBackToOverview,
    handleCompareSelected
  };
};
