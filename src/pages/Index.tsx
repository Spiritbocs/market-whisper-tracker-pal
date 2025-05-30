
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '../components/Header';
import { MarketOverview } from '../components/MarketOverview';
import { WatchlistManager } from '../components/WatchlistManager';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, List } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {isAuthenticated ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Market Overview</span>
              </TabsTrigger>
              <TabsTrigger value="watchlists" className="flex items-center space-x-2">
                <List className="w-4 h-4" />
                <span>My Watchlists</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <MarketOverview />
            </TabsContent>
            
            <TabsContent value="watchlists">
              <WatchlistManager />
            </TabsContent>
          </Tabs>
        ) : (
          <MarketOverview />
        )}
      </main>
    </div>
  );
};

const Index = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default Index;
