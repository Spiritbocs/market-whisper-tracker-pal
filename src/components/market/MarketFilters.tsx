
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, Download, BarChart3 } from 'lucide-react';

interface MarketFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  showCustomizeModal: boolean;
  setShowCustomizeModal: (show: boolean) => void;
  tableColumns: string[];
  onColumnToggle: (columnId: string) => void;
  rowsToShow: number;
  setRowsToShow: (rows: number) => void;
  onExportCSV: () => void;
  selectedStocks: any[];
  onCompareSelected: () => void;
}

const availableColumns = [
  { id: 'rank', label: '#' },
  { id: 'name', label: 'Name' },
  { id: 'price', label: 'Price' },
  { id: '1h', label: '1h %' },
  { id: '24h', label: '24h %' },
  { id: '7d', label: '7d %' },
  { id: 'marketCap', label: 'Market Cap' },
  { id: 'volume', label: 'Volume(24h)' },
  { id: 'chart', label: 'Last 7 Days' }
];

export const MarketFilters: React.FC<MarketFiltersProps> = ({
  activeFilter,
  onFilterChange,
  sortBy,
  setSortBy,
  showCustomizeModal,
  setShowCustomizeModal,
  tableColumns,
  onColumnToggle,
  rowsToShow,
  setRowsToShow,
  onExportCSV,
  selectedStocks,
  onCompareSelected,
}) => {
  const handleRowsChange = (value: string) => {
    const rows = Number(value);
    console.log('MarketFilters: Changing rows to:', rows);
    setRowsToShow(rows);
  };

  const getCompareButtonText = () => {
    if (selectedStocks.length === 0) return 'Compare';
    if (selectedStocks.length === 1) return 'Select 1 more to compare';
    return `Compare Selected (${selectedStocks.length})`;
  };

  return (
    <>
      {/* Sticky header with live indicator and compare button */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b pb-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Today's Stock Prices by Market Cap</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>LIVE - {new Date().toLocaleTimeString()}</span>
            </div>
            <Button 
              variant={selectedStocks.length >= 2 ? "default" : "outline"} 
              size="sm"
              onClick={onCompareSelected}
              disabled={selectedStocks.length < 2}
              className={selectedStocks.length === 1 ? "animate-pulse" : ""}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {getCompareButtonText()}
            </Button>
          </div>
        </div>
      </div>

      {/* Controls section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Dialog open={showCustomizeModal} onOpenChange={setShowCustomizeModal}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Customize
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Choose up to 7/9 metrics</DialogTitle>
                <p className="text-sm text-muted-foreground">Add, delete and sort metrics just how you need it</p>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Columns</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {availableColumns.map((column) => (
                      <div key={column.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={tableColumns.includes(column.id)}
                          onCheckedChange={() => onColumnToggle(column.id)}
                        />
                        <label className="text-sm">{column.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Rows to show</h4>
                  <Select value={rowsToShow.toString()} onValueChange={handleRowsChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">Show 10</SelectItem>
                      <SelectItem value="20">Show 20</SelectItem>
                      <SelectItem value="30">Show 30</SelectItem>
                      <SelectItem value="50">Show 50</SelectItem>
                      <SelectItem value="100">Show 100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowCustomizeModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowCustomizeModal(false)}>
                    Apply Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marketCap">Market Cap</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="change">% Change</SelectItem>
                <SelectItem value="volume">Volume</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" size="sm" onClick={onExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center space-x-1">
        {['All', 'Active', 'Gainers', 'Losers'].map((filter) => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              activeFilter === filter
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
    </>
  );
};
