
import { useState, useEffect } from 'react';

// Helper functions for localStorage
const saveToLocalStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

const loadFromLocalStorage = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

export const useMarketSettings = () => {
  const [activeFilter, setActiveFilter] = useState(() => loadFromLocalStorage('market-active-filter', 'All'));
  const [tableColumns, setTableColumns] = useState(() => loadFromLocalStorage('market-table-columns', ['rank', 'name', 'price', '1h', '24h', '7d', 'marketCap', 'volume', 'chart']));
  const [sortBy, setSortBy] = useState(() => loadFromLocalStorage('market-sort-by', 'marketCap'));
  const [sortOrder, setSortOrder] = useState(() => loadFromLocalStorage('market-sort-order', 'desc'));
  const [rowsToShow, setRowsToShow] = useState(() => loadFromLocalStorage('market-rows-to-show', 8));
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    saveToLocalStorage('market-active-filter', activeFilter);
  }, [activeFilter]);

  useEffect(() => {
    saveToLocalStorage('market-table-columns', tableColumns);
  }, [tableColumns]);

  useEffect(() => {
    saveToLocalStorage('market-sort-by', sortBy);
  }, [sortBy]);

  useEffect(() => {
    saveToLocalStorage('market-sort-order', sortOrder);
  }, [sortOrder]);

  useEffect(() => {
    saveToLocalStorage('market-rows-to-show', rowsToShow);
  }, [rowsToShow]);

  return {
    activeFilter,
    setActiveFilter,
    tableColumns,
    setTableColumns,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    rowsToShow,
    setRowsToShow,
    showWatchlistModal,
    setShowWatchlistModal,
    showCustomizeModal,
    setShowCustomizeModal
  };
};
