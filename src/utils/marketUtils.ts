
import { Stock } from '../types';

export const generateStockChart = (changePercent: number) => {
  const baseValue = 100;
  const trend = changePercent > 0 ? 1 : -1;
  const volatility = Math.abs(changePercent) / 100;
  
  return Array.from({ length: 7 }, (_, i) => ({
    time: i,
    value: baseValue + (trend * i * 2) + (Math.random() - 0.5) * volatility * 10
  }));
};

export const exportToCSV = (stocks: Stock[], rowsToShow: number) => {
  const headers = ['Rank', 'Symbol', 'Name', 'Price', '1h %', '24h %', '7d %', 'Market Cap', 'Volume'];
  const csvContent = [
    headers.join(','),
    ...stocks.slice(0, rowsToShow).map((stock, index) => [
      index + 1,
      stock.symbol,
      `"${stock.name}"`,
      stock.price.toFixed(2),
      stock.changePercent.toFixed(2),
      stock.changePercent.toFixed(2),
      stock.changePercent.toFixed(2),
      stock.marketCap ? (stock.marketCap / 1000000000).toFixed(1) + 'B' : 'N/A',
      stock.volume ? (stock.volume / 1000000).toFixed(1) + 'M' : 'N/A'
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'market_data.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const sortStocks = (stocks: Stock[], sortBy: string, sortOrder: string): Stock[] => {
  return [...stocks].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'price':
        aValue = a.price;
        bValue = b.price;
        break;
      case 'change':
        aValue = a.changePercent;
        bValue = b.changePercent;
        break;
      case 'marketCap':
        aValue = a.marketCap || 0;
        bValue = b.marketCap || 0;
        break;
      case 'volume':
        aValue = a.volume || 0;
        bValue = b.volume || 0;
        break;
      default:
        aValue = a.symbol;
        bValue = b.symbol;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

export const filterStocks = (stocks: Stock[], filter: string): Stock[] => {
  switch (filter) {
    case 'Active':
      return stocks.filter(stock => stock.volume && stock.volume > 1000000);
    case 'Gainers':
      return stocks.filter(stock => stock.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent);
    case 'Losers':
      return stocks.filter(stock => stock.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent);
    default:
      return stocks;
  }
};
