import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Flame, TrendingUp, ArrowUp, ArrowDown, TrendingDown, Skull } from 'lucide-react';
import { Stock } from '../../types';

interface StockTableProps {
  filteredStocks: Stock[];
  rowsToShow: number;
  sortBy: string;
  sortOrder: string;
  onSort: (column: string) => void;
  tableColumns: string[];
  selectedStocks: Stock[];
  onToggleStock: (stock: Stock) => void;
}

const getPerformanceIndicator = (changePercent: number) => {
  if (changePercent > 3) {
    return {
      icon: Flame,
      text: "Hot!",
      color: "text-orange-500"
    };
  } else if (changePercent > 1) {
    return {
      icon: TrendingUp,
      text: "Good",
      color: "text-green-500"
    };
  } else if (changePercent > 0) {
    return {
      icon: ArrowUp,
      text: "Up",
      color: "text-green-400"
    };
  } else if (changePercent > -1) {
    return {
      icon: ArrowDown,
      text: "Down",
      color: "text-red-400"
    };
  } else if (changePercent > -3) {
    return {
      icon: TrendingDown,
      text: "Bad",
      color: "text-red-500"
    };
  } else {
    return {
      icon: Skull,
      text: "Hell Nah",
      color: "text-red-600"
    };
  }
};

export const StockTable: React.FC<StockTableProps> = ({
  filteredStocks,
  rowsToShow,
  sortBy,
  sortOrder,
  onSort,
  tableColumns,
  selectedStocks,
  onToggleStock,
}) => {
  const displayedStocks = filteredStocks.slice(0, rowsToShow);
  
  const isStockSelected = (stock: Stock) => {
    return selectedStocks.some(s => s.symbol === stock.symbol);
  };

  const handleStarClick = (stock: Stock, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleStock(stock);
  };

  console.log('StockTable: rowsToShow =', rowsToShow);
  console.log('StockTable: filteredStocks.length =', filteredStocks.length);
  console.log('StockTable: displayedStocks.length =', displayedStocks.length);
  console.log('StockTable: selectedStocks.length =', selectedStocks.length);

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-muted/50 border-b">
              <tr className="text-sm text-muted-foreground">
                {tableColumns.includes('rank') && (
                  <th className="text-left p-4 font-medium">#</th>
                )}
                {tableColumns.includes('name') && (
                  <th className="text-left p-4 font-medium cursor-pointer hover:text-foreground" onClick={() => onSort('name')}>
                    Name {sortBy === 'name' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                )}
                {tableColumns.includes('price') && (
                  <th className="text-right p-4 font-medium cursor-pointer hover:text-foreground" onClick={() => onSort('price')}>
                    Price {sortBy === 'price' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                )}
                {tableColumns.includes('1h') && (
                  <th className="text-right p-4 font-medium">1h %</th>
                )}
                {tableColumns.includes('24h') && (
                  <th className="text-right p-4 font-medium cursor-pointer hover:text-foreground" onClick={() => onSort('change')}>
                    24h % {sortBy === 'change' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                )}
                {tableColumns.includes('7d') && (
                  <th className="text-right p-4 font-medium">7d %</th>
                )}
                {tableColumns.includes('marketCap') && (
                  <th className="text-right p-4 font-medium cursor-pointer hover:text-foreground" onClick={() => onSort('marketCap')}>
                    Market Cap {sortBy === 'marketCap' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                )}
                {tableColumns.includes('volume') && (
                  <th className="text-right p-4 font-medium cursor-pointer hover:text-foreground" onClick={() => onSort('volume')}>
                    Volume(24h) {sortBy === 'volume' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                )}
                {tableColumns.includes('chart') && (
                  <th className="text-right p-4 font-medium">Last 7 Days</th>
                )}
              </tr>
            </thead>
            <tbody>
              {displayedStocks.map((stock, index) => {
                const performance = getPerformanceIndicator(stock.changePercent);
                const PerformanceIcon = performance.icon;
                const isSelected = isStockSelected(stock);
                
                return (
                  <tr key={stock.symbol} className="border-b hover:bg-muted/30 transition-colors">
                    {tableColumns.includes('rank') && (
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Star 
                            className={`w-4 h-4 cursor-pointer transition-colors ${
                              isSelected 
                                ? 'text-yellow-500 fill-current' 
                                : 'text-muted-foreground hover:text-yellow-500'
                            }`}
                            onClick={(e) => handleStarClick(stock, e)}
                          />
                          <span className="font-medium">{index + 1}</span>
                        </div>
                      </td>
                    )}
                    {tableColumns.includes('name') && (
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                            {stock.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{stock.symbol}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-32">
                              {stock.name}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                    {tableColumns.includes('price') && (
                      <td className="text-right p-4">
                        <div className="font-semibold">${stock.price.toFixed(2)}</div>
                      </td>
                    )}
                    {tableColumns.includes('1h') && (
                      <td className={`text-right p-4 ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="flex items-center justify-end">
                          {stock.changePercent >= 0 ? '↗' : '↘'}
                          <span className="ml-1">{Math.abs(stock.changePercent).toFixed(2)}%</span>
                        </div>
                      </td>
                    )}
                    {tableColumns.includes('24h') && (
                      <td className={`text-right p-4 ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="flex items-center justify-end">
                          {stock.changePercent >= 0 ? '↗' : '↘'}
                          <span className="ml-1">{Math.abs(stock.changePercent).toFixed(2)}%</span>
                        </div>
                      </td>
                    )}
                    {tableColumns.includes('7d') && (
                      <td className={`text-right p-4 ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="flex items-center justify-end">
                          {stock.changePercent >= 0 ? '↗' : '↘'}
                          <span className="ml-1">{Math.abs(stock.changePercent).toFixed(2)}%</span>
                        </div>
                      </td>
                    )}
                    {tableColumns.includes('marketCap') && (
                      <td className="text-right p-4 text-muted-foreground">
                        {stock.marketCap ? `$${(stock.marketCap / 1000000000).toFixed(1)}B` : 'N/A'}
                      </td>
                    )}
                    {tableColumns.includes('volume') && (
                      <td className="text-right p-4 text-muted-foreground">
                        {stock.volume ? `$${(stock.volume / 1000000).toFixed(1)}M` : 'N/A'}
                      </td>
                    )}
                    {tableColumns.includes('chart') && (
                      <td className="text-right p-4">
                        <div className="flex items-center justify-end space-x-2">
                          <PerformanceIcon className={`w-4 h-4 ${performance.color}`} />
                          <span className={`text-sm font-medium ${performance.color}`}>
                            {performance.text}
                          </span>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
