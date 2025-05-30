
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '../components/Header';
import { MarketOverview } from '../components/MarketOverview';
import { WatchlistManager } from '../components/WatchlistManager';
import { TradingIndications } from '../components/TradingIndications';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, List, Target } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="w-full">
        {isAuthenticated ? (
          <Tabs defaultValue="overview" className="w-full">
            <div className="px-6 pt-8">
              <TabsList className="grid w-full grid-cols-3 mb-8 max-w-md">
                <TabsTrigger value="overview" className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Market Overview</span>
                </TabsTrigger>
                <TabsTrigger value="watchlists" className="flex items-center space-x-2">
                  <List className="w-4 h-4" />
                  <span>My Watchlists</span>
                </TabsTrigger>
                <TabsTrigger value="indications" className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Indications</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="overview" className="mt-0">
              <MarketOverview />
            </TabsContent>
            
            <TabsContent value="watchlists" className="mt-0 px-6">
              <WatchlistManager />
            </TabsContent>
            
            <TabsContent value="indications" className="mt-0 px-6">
              <TradingIndications />
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
