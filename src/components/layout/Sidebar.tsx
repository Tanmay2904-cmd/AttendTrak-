import * as React from 'react';
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
  CreditCard,
  HelpCircle
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
      { path: '/admin/students', icon: Users, label: 'Students' },
      { path: '/admin/settings', icon: Settings, label: 'Settings' },

    ]
    : [
      { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/admin/attendance', icon: ClipboardCheck, label: 'Attendance' },
      { path: '/admin/sync', icon: FileSpreadsheet, label: 'Sync Data' },
      { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
      { path: '/admin/students', icon: Users, label: 'Students' },
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
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={onToggle}
        />
      )}

      {/* Sidebar - Glassmorphism applied */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full border-r border-white/10 transition-all duration-300 ease-in-out flex flex-col z-50 md:z-30",
          "glass-card bg-card/95 md:bg-card/80", // Glass effect
          isOpen
            ? "w-72 translate-x-0"
            : "-translate-x-full md:translate-x-0 md:w-20",
          "md:relative"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center h-20 px-6 border-b border-border/50",
          !isOpen && "md:justify-center md:px-2"
        )}>
          {isOpen ? (
            <div className="flex items-center gap-3 min-w-0 flex-1 animate-fade-in">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
                <ClipboardCheck className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-lg tracking-tight">AttendTrak</span>
                <span className="text-xs text-muted-foreground font-medium">
                  {isSuperAdmin ? 'Super Admin' : 'Teacher Portal'}
                </span>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex w-10 h-10 rounded-xl gradient-primary items-center justify-center shadow-lg shadow-indigo-500/20">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
          )}

          {isOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-foreground/70 hover:bg-accent hover:text-foreground absolute right-4 top-5"
              onClick={onToggle}
            >
              <X className="w-6 h-6" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive: active }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  active
                    ? "bg-primary/10 text-primary font-semibold shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                  !isOpen && "md:justify-center md:px-2"
                )}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    onToggle();
                  }
                }}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}

                <item.icon className={cn(
                  "w-5 h-5 flex-shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />

                {isOpen && (
                  <span className="text-sm truncate animate-fade-in">{item.label}</span>
                )}

                {/* Tooltip for collapsed state */}
                {!isOpen && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-secondary/30 backdrop-blur-sm space-y-2">
          {isOpen && user && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50 mb-2 animate-slide-up">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}

          <div className={cn("flex gap-2", !isOpen && "flex-col")}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 justify-start text-muted-foreground hover:text-foreground",
                !isOpen && "justify-center px-0 h-10 w-full"
              )}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isOpen && <span className="ml-2">Theme</span>}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                !isOpen && "justify-center px-0 h-10 w-full"
              )}
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
              {isOpen && <span className="ml-2">Logout</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
