
import React from 'react';

interface MarketStatsHeaderProps {
  stockCount: number;
}

export const MarketStatsHeader: React.FC<MarketStatsHeaderProps> = ({ stockCount }) => {
  return (
    <div className="bg-muted/30 border-b w-full">
      <div className="w-full px-6 py-4">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">Stocks:</span>
            <span className="font-medium">{stockCount}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">Exchanges:</span>
            <span className="font-medium">3</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">Market Cap:</span>
            <span className="font-medium">$45.2T</span>
            <span className="text-green-600">↗ 2.1%</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">24h Vol:</span>
            <span className="font-medium">$2.1T</span>
            <span className="text-green-600">↗ 5.4%</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">Dominance:</span>
            <span className="font-medium">AAPL: 7.2%</span>
            <span className="font-medium">MSFT: 6.8%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
