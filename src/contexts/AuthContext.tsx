import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthState, Profile, Watchlist } from '../types';
import { toast } from 'sonner';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  watchlists: Watchlist[];
  loadWatchlists: () => Promise<void>;
  addWatchlist: (name: string) => Promise<void>;
  removeWatchlist: (id: string) => Promise<void>;
  addStockToWatchlist: (watchlistId: string, symbol: string) => Promise<void>;
  removeStockFromWatchlist: (watchlistId: string, symbol: string) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user);
        
        if (session?.user) {
          setTimeout(() => {
            loadProfile(session.user.id);
            loadWatchlists();
          }, 0);
        } else {
          setProfile(null);
          setWatchlists([]);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      
      if (session?.user) {
        loadProfile(session.user.id);
        loadWatchlists();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadWatchlists = async () => {
    try {
      const { data, error } = await supabase
        .from('watchlists')
        .select(`
          *,
          watchlist_stocks (
            id,
            watchlist_id,
            symbol,
            added_at
          )
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setWatchlists(data || []);
    } catch (error) {
      console.error('Error loading watchlists:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success('Welcome back!');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      return false;
    }
  };

  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      toast.success('Account created successfully!');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Logout failed');
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success('Password reset email sent!');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Password reset failed');
      return false;
    }
  };

  const addWatchlist = async (name: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('watchlists')
        .insert([{ name, user_id: user?.id }]);

      if (error) throw error;
      toast.success(`Watchlist "${name}" created!`);
      loadWatchlists();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create watchlist');
    }
  };

  const removeWatchlist = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('watchlists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Watchlist removed');
      loadWatchlists();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove watchlist');
    }
  };

  const addStockToWatchlist = async (watchlistId: string, symbol: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('watchlist_stocks')
        .insert([{ watchlist_id: watchlistId, symbol: symbol.toUpperCase() }]);

      if (error) throw error;
      toast.success(`${symbol.toUpperCase()} added to watchlist`);
      loadWatchlists();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add stock');
    }
  };

  const removeStockFromWatchlist = async (watchlistId: string, symbol: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('watchlist_stocks')
        .delete()
        .eq('watchlist_id', watchlistId)
        .eq('symbol', symbol);

      if (error) throw error;
      toast.success(`${symbol} removed from watchlist`);
      loadWatchlists();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove stock');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAuthenticated,
        watchlists,
        login,
        register,
        logout,
        resetPassword,
        loadWatchlists,
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
