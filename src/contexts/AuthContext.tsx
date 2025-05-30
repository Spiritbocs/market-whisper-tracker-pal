
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState, User, Watchlist } from '../types';
import { toast } from 'sonner';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  addWatchlist: (name: string) => void;
  removeWatchlist: (id: string) => void;
  addStockToWatchlist: (watchlistId: string, symbol: string) => void;
  removeStockFromWatchlist: (watchlistId: string, symbol: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('market-watchlist-user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setAuthState({
        user,
        isAuthenticated: true,
      });
    }
  }, []);

  const saveUserToStorage = (user: User) => {
    localStorage.setItem('market-watchlist-user', JSON.stringify(user));
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('market-watchlist-users') || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);
    
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      setAuthState({
        user: userWithoutPassword,
        isAuthenticated: true,
      });
      saveUserToStorage(userWithoutPassword);
      toast.success('Welcome back!');
      return true;
    }
    
    toast.error('Invalid credentials');
    return false;
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('market-watchlist-users') || '[]');
    
    if (users.find((u: any) => u.email === email)) {
      toast.error('Email already exists');
      return false;
    }

    const newUser: User & { password: string } = {
      id: Date.now().toString(),
      email,
      name,
      password,
      watchlists: [{
        id: 'default',
        name: 'My Watchlist',
        stocks: ['AAPL', 'GOOGL', 'MSFT'],
        createdAt: new Date().toISOString(),
      }],
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem('market-watchlist-users', JSON.stringify(users));

    const { password: _, ...userWithoutPassword } = newUser;
    setAuthState({
      user: userWithoutPassword,
      isAuthenticated: true,
    });
    saveUserToStorage(userWithoutPassword);
    toast.success('Account created successfully!');
    return true;
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
    });
    localStorage.removeItem('market-watchlist-user');
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser: User) => {
    setAuthState(prev => ({
      ...prev,
      user: updatedUser,
    }));
    saveUserToStorage(updatedUser);
    
    // Update in users array too
    const users = JSON.parse(localStorage.getItem('market-watchlist-users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === updatedUser.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updatedUser };
      localStorage.setItem('market-watchlist-users', JSON.stringify(users));
    }
  };

  const addWatchlist = (name: string) => {
    if (!authState.user) return;
    
    const newWatchlist: Watchlist = {
      id: Date.now().toString(),
      name,
      stocks: [],
      createdAt: new Date().toISOString(),
    };

    const updatedUser = {
      ...authState.user,
      watchlists: [...authState.user.watchlists, newWatchlist],
    };

    updateUser(updatedUser);
    toast.success(`Watchlist "${name}" created!`);
  };

  const removeWatchlist = (id: string) => {
    if (!authState.user) return;
    
    const updatedUser = {
      ...authState.user,
      watchlists: authState.user.watchlists.filter(w => w.id !== id),
    };

    updateUser(updatedUser);
    toast.success('Watchlist removed');
  };

  const addStockToWatchlist = (watchlistId: string, symbol: string) => {
    if (!authState.user) return;
    
    const updatedWatchlists = authState.user.watchlists.map(w => {
      if (w.id === watchlistId && !w.stocks.includes(symbol.toUpperCase())) {
        return { ...w, stocks: [...w.stocks, symbol.toUpperCase()] };
      }
      return w;
    });

    const updatedUser = {
      ...authState.user,
      watchlists: updatedWatchlists,
    };

    updateUser(updatedUser);
    toast.success(`${symbol.toUpperCase()} added to watchlist`);
  };

  const removeStockFromWatchlist = (watchlistId: string, symbol: string) => {
    if (!authState.user) return;
    
    const updatedWatchlists = authState.user.watchlists.map(w => {
      if (w.id === watchlistId) {
        return { ...w, stocks: w.stocks.filter(s => s !== symbol) };
      }
      return w;
    });

    const updatedUser = {
      ...authState.user,
      watchlists: updatedWatchlists,
    };

    updateUser(updatedUser);
    toast.success(`${symbol} removed from watchlist`);
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        addWatchlist,
        removeWatchlist,
        addStockToWatchlist,
        removeStockFromWatchlist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
