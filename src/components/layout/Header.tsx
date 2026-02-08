import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { LogOut, Moon, Sun, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
  menuOpen?: boolean;
}

export function Header({ onMenuToggle, menuOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center justify-between h-14 md:h-16 px-3 sm:px-4 md:px-6 lg:px-8 gap-2 md:gap-4">
        {/* Left side - Menu button (mobile only) + Welcome text */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Menu button - visible on mobile only */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden flex-shrink-0 h-9 w-9"
            onClick={onMenuToggle}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          {/* Welcome text */}
          <span className="text-sm md:text-base font-medium text-foreground truncate">
            
          </span>
        </div>

        {/* Right side - User info and controls */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto flex-shrink-0">
          {user && (
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="text-right min-w-0 hidden sm:block">
                <p className="text-xs md:text-sm font-medium truncate">{user.name}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                  {user.role === 'admin' ? 'Admin' : 'User'}
                </p>
              </div>
              <div className="w-8 md:w-10 h-8 md:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] md:text-sm font-semibold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 md:w-10 md:h-10 p-2 flex-shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 md:w-5 h-4 md:h-5" />
            ) : (
              <Moon className="w-4 md:w-5 h-4 md:h-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="w-9 h-9 md:w-10 md:h-10 p-2 text-destructive hover:bg-destructive/20 flex-shrink-0"
          >
            <LogOut className="w-4 md:w-5 h-4 md:h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}