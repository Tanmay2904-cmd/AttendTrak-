import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  FileSpreadsheet,
  UserCircle,
  X,
  ClipboardCheck,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { user, logout, isSuperAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const adminNavItems = isSuperAdmin
    ? [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/super-admin', icon: Shield, label: 'Super Admin Panel' },
        { path: '/admin/attendance', icon: ClipboardCheck, label: 'Attendance' },
        { path: '/admin/sync', icon: FileSpreadsheet, label: 'Sync Management' },
        { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/admin/settings', icon: Settings, label: 'Settings' },
        
      ]
    : [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/attendance', icon: ClipboardCheck, label: 'Attendance' },
        { path: '/admin/sync', icon: FileSpreadsheet, label: 'Sync Data' },
        { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/admin/settings', icon: Settings, label: 'Settings' },
      ];

  const userNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dashboard/attendance', icon: Calendar, label: 'My Attendance' },
    { path: '/dashboard/profile', icon: UserCircle, label: 'Profile' },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : userNavItems;

  return (
    <>
      {/* Mobile Overlay - Only when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar - Hidden on mobile when closed, visible on desktop always */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out flex flex-col",
          // Mobile behavior: show only when open, hide completely when closed
          isOpen 
            ? "w-64 z-50 md:z-30" 
            : "-left-64 md:left-0 md:w-20 md:z-30",
          "md:relative md:left-0"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center h-16 px-3 md:px-4 border-b border-sidebar-border",
          !isOpen && "md:justify-center"
        )}>
          {isOpen ? (
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <div className="w-8 md:w-9 h-8 md:h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                <ClipboardCheck className="w-4 md:w-5 h-4 md:h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs md:text-sm truncate">AttendTrack</span>
                <span className="text-[10px] md:text-xs text-sidebar-muted truncate">
                  {isSuperAdmin ? 'Super Admin' : 'Management'}
                </span>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex w-8 md:w-9 h-8 md:h-9 rounded-lg gradient-primary items-center justify-center">
              <ClipboardCheck className="w-4 md:w-5 h-4 md:h-5 text-primary-foreground" />
            </div>
          )}

          {/* X Button - Only show on mobile when sidebar is open */}
          {isOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-sidebar-foreground hover:bg-sidebar-accent p-1 ml-auto flex-shrink-0"
              onClick={onToggle}
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 md:py-4 px-2 md:px-3 space-y-0.5 md:space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive: active }) => cn(
                  "flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg transition-all duration-200 text-sm md:text-base",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  !isOpen && "md:justify-center md:px-1.5"
                )}
                onClick={() => {
                  // Auto close sidebar on mobile after selection
                  if (window.innerWidth < 768) {
                    setTimeout(() => onToggle(), 100);
                  }
                }}
              >
                <item.icon className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
                {isOpen && <span className="text-xs md:text-sm font-medium truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer - Only show on desktop OR when sidebar is open on mobile */}
        <div className={cn(
          "border-t border-sidebar-border space-y-1 md:space-y-2 transition-all duration-300",
          isOpen ? "p-2 md:p-3" : "hidden md:block md:p-3"
        )}>
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground text-xs md:text-sm h-8 md:h-9",
              !isOpen && "md:justify-center md:px-1.5"
            )}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
            ) : (
              <Moon className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
            )}
            {isOpen && <span className="ml-2 md:ml-3 text-xs md:text-sm">Theme</span>}
          </Button>

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start text-sidebar-muted hover:bg-destructive/20 hover:text-destructive text-xs md:text-sm h-8 md:h-9",
              !isOpen && "md:justify-center md:px-1.5"
            )}
            onClick={logout}
          >
            <LogOut className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
            {isOpen && <span className="ml-2 md:ml-3 text-xs md:text-sm">Logout</span>}
          </Button>

          {/* User Info - Only show when sidebar is open */}
          {isOpen && user && (
            <div className="px-2 md:px-3 py-2 md:py-3 rounded-lg bg-sidebar-accent text-xs md:text-sm">
              <p className="font-medium truncate">{user.name}</p>
              <p className="text-sidebar-muted truncate text-[10px] md:text-xs">{user.email}</p>
              {isSuperAdmin && (
                <p className="text-sidebar-primary truncate text-[10px] md:text-xs font-semibold mt-1">
                  Super Admin
                </p>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}