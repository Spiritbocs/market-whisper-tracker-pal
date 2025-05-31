
import React from 'react';
import { TrendingUp, Users, DollarSign } from 'lucide-react';

interface MarketStatsHeaderProps {
  stockCount: number;
}

export const MarketStatsHeader: React.FC<MarketStatsHeaderProps> = ({ stockCount }) => {
  return (
    <div className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="w-full px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-100">
              🔴 LIVE: Real-time market data from Yahoo Finance
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{stockCount}</div>
            <div className="text-blue-100">Live Stocks</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-4">
            <TrendingUp className="w-8 h-8" />
            <div>
              <div className="text-sm text-blue-100">Market Status</div>
              <div className="text-lg font-semibold">Live Trading</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-4">
            <Users className="w-8 h-8" />
            <div>
              <div className="text-sm text-blue-100">Data Source</div>
              <div className="text-lg font-semibold">Yahoo Finance</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-4">
            <DollarSign className="w-8 h-8" />
            <div>
              <div className="text-sm text-blue-100">Update Frequency</div>
              <div className="text-lg font-semibold">Real-time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
