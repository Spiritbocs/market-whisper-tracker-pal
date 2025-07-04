
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { ThemeSelector } from './ThemeSelector';
import { User, LogOut, MessageSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header: React.FC = () => {
  const { isAuthenticated, profile, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  {/* Remove max-w-screen-2xl and mx-auto from this div */}
  <div className="w-full px-4 py-3"> 
    <div className="flex items-center justify-between">
      {/* Left side: Title */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            Market Whisperer
          </h1>
        </div>
      </div>

      {/* Right side: Buttons */}
      <div className="flex items-center space-x-4">
        <ThemeSelector />
        
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {profile?.full_name || profile?.email || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => setShowAuthModal(true)}>
            Sign In
          </Button>
        )}
      </div>
    </div>
  </div>
</header>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};
