import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';
import { ClassSelector } from '@/components/ClassSelector';

export function DashboardLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with menu toggle */}
      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        menuOpen={sidebarOpen}
      />
      {user?.role === 'admin' && (
        <div className="bg-card border-b border-border px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3">
          <ClassSelector />
        </div>
      )}

      {/* Main container with flex */}
      <div className="flex flex-1 overflow-hidden w-full relative">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main content area - takes remaining space */}
        <main className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden w-full bg-background"
        )}>
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}