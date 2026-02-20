import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ClassProvider } from "@/context/ClassContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import SuperAdminDashboard from '@/pages/admin/SuperAdminDashboard';
import AdminCreation from '@/pages/admin/AdminCreation';

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminSync from "./pages/admin/AdminSync-final";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";

// User Pages
import UserDashboard from "./pages/user/UserDashboard";
import UserAttendance from "./pages/user/UserAttendance";
import UserProfile from "./pages/user/UserProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <ClassProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="attendance" element={<AdminAttendance />} />
                  <Route path="students" element={<AdminStudents />} />
                  <Route path="sync" element={<AdminSync />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* Super Admin Route - Only accessible to super admins */}
                <Route
                  path="/super-admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']} requireSuperAdmin={true}>
                      <SuperAdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* User Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<UserDashboard />} />
                  <Route path="attendance" element={<UserAttendance />} />
                  <Route path="profile" element={<UserProfile />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ClassProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;