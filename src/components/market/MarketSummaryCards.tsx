
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ChartContainer } from '@/components/ui/chart';
import { AreaChart, Area } from 'recharts';
import { Stock } from '../../types';

interface MarketSummaryCardsProps {
  trendingStocks: Stock[];
  marketCapData: Array<{ time: string; value: number }>;
  volumeData: Array<{ time: string; value: number }>;
}

export const MarketSummaryCards: React.FC<MarketSummaryCardsProps> = ({
  trendingStocks,
  marketCapData,
  volumeData,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
      {/* Trending Stocks */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
            Trending Stocks
          </h3>
        </div>
        <div className="space-y-3">
          {trendingStocks.slice(0, 3).map((stock, index) => (
            <div key={stock.symbol} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground w-4">{index + 1}</span>
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                  {stock.symbol.slice(0, 1)}
                </div>
                <div>
                  <div className="font-medium text-sm">{stock.symbol}</div>
                  <div className="text-xs text-muted-foreground">${stock.price.toFixed(2)}</div>
                </div>
              </div>
              <div className={`text-sm font-medium ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Cap */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Market Cap</h3>
        </div>
        <div className="space-y-2">
          <div className="text-3xl font-bold">$45.33T</div>
          <div className="text-red-600 text-sm flex items-center">
            <TrendingDown className="w-4 h-4 mr-1" />
            3.14% (24h)
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            Dominance: AAPL: 7.2% MSFT: 6.8%
          </div>
          <ChartContainer config={{ value: { label: 'Market Cap', color: '#ef4444' } }} className="h-16">
            <AreaChart data={marketCapData}>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#ef4444" 
                fill="#ef4444" 
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
          <div className="text-xs text-muted-foreground mt-2">
            Market cap changes over time
          </div>
        </div>
      </div>

      {/* 24h Volume */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">24h Volume</h3>
        </div>
        <div className="space-y-2">
          <div className="text-3xl font-bold">$147.89B</div>
          <div className="text-green-600 text-sm flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            14.10% (24h)
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            Total trading volume across all exchanges
          </div>
          <ChartContainer config={{ value: { label: 'Volume', color: '#22c55e' } }} className="h-16">
            <AreaChart data={volumeData}>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#22c55e" 
                fill="#22c55e" 
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
          <div className="text-xs text-muted-foreground mt-2">
            Trading activity increasing
          </div>
        </div>
      </div>

      {/* Fear & Greed */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Fear & Greed</h3>
        </div>
        <div className="text-center space-y-3">
          <div className="text-3xl font-bold">61</div>
          <div className="text-sm text-orange-600 font-medium">Greed</div>
          <div className="relative w-20 h-20 mx-auto">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                strokeDasharray="61, 100"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">61</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Based on volatility, momentum, volume, and social sentiment
          </div>
        </div>
      </div>
    </div>
  );
};
