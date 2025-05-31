
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Stock } from '../../types';

interface MarketSummaryCardsProps {
  trendingStocks: Stock[];
  marketCapData: Array<{ time: string; value: number }>;
  volumeData: Array<{ time: string; value: number }>;
}

export const MarketSummaryCards: React.FC<MarketSummaryCardsProps> = ({
  trendingStocks,
  marketCapData,
  volumeData
}) => {
  const [currentStats, setCurrentStats] = useState({
    totalMarketCap: 0,
    gainers: 0,
    losers: 0,
    avgVolume: 0
  });

  const [liveMarketCapData, setLiveMarketCapData] = useState(marketCapData);
  const [liveVolumeData, setLiveVolumeData] = useState(volumeData);

  // Calculate real-time statistics (no page refresh, just state updates)
  useEffect(() => {
    if (trendingStocks.length > 0) {
      const totalMarketCap = trendingStocks.reduce((sum, stock) => 
        sum + (stock.marketCap || 0), 0
      ) / 1e12; // Convert to trillions

      const gainers = trendingStocks.filter(stock => stock.changePercent > 0).length;
      const losers = trendingStocks.filter(stock => stock.changePercent < 0).length;
      
      const avgVolume = trendingStocks.reduce((sum, stock) => 
        sum + (stock.volume || 0), 0
      ) / trendingStocks.length / 1e9; // Convert to billions

      // Smooth transition for numbers (like CoinMarketCap)
      setCurrentStats(prev => ({
        totalMarketCap: Number(totalMarketCap.toFixed(1)),
        gainers,
        losers,
        avgVolume: Number(avgVolume.toFixed(1))
      }));
    }
  }, [trendingStocks]);

  // Real-time chart updates (smooth like CoinMarketCap)
  useEffect(() => {
    const interval = setInterval(() => {
      // Update market cap data with realistic variations
      setLiveMarketCapData(prev => {
        const newData = [...prev];
        const lastValue = newData[newData.length - 1].value;
        const variation = (Math.random() - 0.5) * 0.1; // Smaller, more realistic variations
        const newValue = Math.max(0, lastValue + variation);
        
        newData.shift();
        newData.push({
          time: new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          value: Number(newValue.toFixed(1))
        });
        
        return newData;
      });

      // Update volume data
      setLiveVolumeData(prev => {
        const newData = [...prev];
        const lastValue = newData[newData.length - 1].value;
        const variation = (Math.random() - 0.5) * 0.05; 
        const newValue = Math.max(0, lastValue + variation);
        
        newData.shift();
        newData.push({
          time: new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          value: Number(newValue.toFixed(1))
        });
        
        return newData;
      });
    }, 3000); // Update every 3 seconds for smooth real-time feel

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Stock Prices by Market Cap</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold transition-all duration-500 ease-in-out">
            ${currentStats.totalMarketCap}T
          </div>
          <div className="h-[80px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={liveMarketCapData}>
                <XAxis dataKey="time" hide />
                <YAxis hide />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Market Gainers</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 transition-all duration-500 ease-in-out">
            {currentStats.gainers}
          </div>
          <p className="text-xs text-muted-foreground">stocks with positive change</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Market Losers</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 transition-all duration-500 ease-in-out">
            {currentStats.losers}
          </div>
          <p className="text-xs text-muted-foreground">stocks with negative change</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Volume</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold transition-all duration-500 ease-in-out">
            {currentStats.avgVolume}B
          </div>
          <div className="h-[80px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={liveVolumeData}>
                <XAxis dataKey="time" hide />
                <YAxis hide />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
