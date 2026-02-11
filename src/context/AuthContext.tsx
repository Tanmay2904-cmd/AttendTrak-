import { fetchUsersFromSheet } from '@/lib/sheetService';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  password: string;
  schoolName: string;
  createdAt: string;
}

interface AuthContextType extends Omit<AuthState, 'user'> {
  user?: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole, rollNo?: string) => Promise<boolean>;
  logout: () => void;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPER_ADMIN = {
  email: "superadmin@system.com",
  password: "123",
  name: "Super Admin",
  role: "admin" as const,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedSuperAdmin = localStorage.getItem('is_super_admin') === 'true';

    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
        });
        setIsSuperAdmin(storedSuperAdmin);
      } catch {
        localStorage.clear();
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const emailKey = email.toLowerCase().trim();

      // ✅ Check 1: Admin users created by Super Admin
      const adminUsers: AdminUser[] = JSON.parse(localStorage.getItem('admin_users') || '[]');
      const adminMatch = adminUsers.find(
        u => u.email.toLowerCase().trim() === emailKey && u.password === password
      );

      if (adminMatch) {
        const user: User = {
          uid: adminMatch.id,
          name: adminMatch.name,
          email: adminMatch.email,
          role: 'admin',
          createdAt: adminMatch.createdAt,
        };

        const token = `mock-token-${Date.now()}`;

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        localStorage.setItem('is_super_admin', 'false');

        setAuthState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        setIsSuperAdmin(false);

        toast({
          title: 'Welcome!',
          description: `Logged in as ${user.name}`,
        });

        return true;
      }

      // ✅ Check 2: Super Admin credentials
      if (emailKey === SUPER_ADMIN.email && password === SUPER_ADMIN.password) {
        const superUser: User = {
          uid: 'super-admin',
          name: SUPER_ADMIN.name,
          email: SUPER_ADMIN.email,
          role: 'admin',
          createdAt: new Date().toISOString(),
        };

        const token = `mock-token-${Date.now()}`;

        localStorage.setItem('user', JSON.stringify(superUser));
        localStorage.setItem('token', token);
        localStorage.setItem('is_super_admin', 'true');

        setAuthState({
          user: superUser,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        setIsSuperAdmin(true);

        toast({
          title: 'Super Admin Login',
          description: 'Logged in using super admin credentials.',
        });

        return true;
      }

      // ✅ Check 3: Google Sheets users (students)
      const sheetUsers = await fetchUsersFromSheet();

      const matched = sheetUsers.find(
        u => u.email.toLowerCase().trim() === emailKey && u.password === password
      );

      if (!matched) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'Invalid email or password.',
        });

        return false;
      }

      const user: User = {
        uid: `sheet-${matched.rollNo}`,
        name: matched.name,
        email: matched.email,
        role: matched.role,
        rollNo: matched.role === 'user' ? matched.rollNo : undefined,
        createdAt: new Date().toISOString(),
      };

      const token = `mock-token-${Date.now()}`;

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      localStorage.setItem('is_super_admin', 'false');

      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      setIsSuperAdmin(false);

      toast({
        title: 'Welcome back!',
        description: `Logged in as ${user.name}`,
      });

      return true;

    } catch (error) {
      console.error('Login error:', error);

      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'An error occurred during login.',
      });

      return false;
    }
  };

  const register = async (): Promise<boolean> => {
    toast({
      title: 'Disabled',
      description: 'Registration via Google Sheet only.',
    });
    return false;
  };

  const logout = () => {
    localStorage.clear();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    setIsSuperAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}