
import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  isLoading: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading }) => {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15); // Predicted 15 seconds
  const [loadingText, setLoadingText] = useState('Connecting to Yahoo Finance...');

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setTimeLeft(15);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / 150); // 15 seconds = 150 intervals of 100ms
        
        // Update loading text based on progress
        if (newProgress < 30) {
          setLoadingText('🔴 Connecting to Yahoo Finance...');
        } else if (newProgress < 60) {
          setLoadingText('📈 Fetching real-time stock data...');
        } else if (newProgress < 90) {
          setLoadingText('⚡ Processing market information...');
        } else {
          setLoadingText('🎯 Almost ready...');
        }
        
        return Math.min(newProgress, 100);
      });

      setTimeLeft(prev => Math.max(prev - 0.1, 0));
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-6"></div>
        
        <h3 className="text-2xl font-bold mb-2">Loading Live Market Data</h3>
        <p className="text-muted-foreground mb-6">{loadingText}</p>
        
        <div className="w-full bg-muted rounded-full h-3 mb-4">
          <div 
            className="bg-primary h-3 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{Math.round(progress)}% complete</span>
          <span>~{Math.ceil(timeLeft)}s remaining</span>
        </div>
        
        <div className="mt-6 text-xs text-muted-foreground">
          <p>Fetching real-time data from Yahoo Finance API</p>
          <p>This may take a moment depending on market conditions</p>
        </div>
      </div>
    </div>
  );
};
