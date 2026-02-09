import { fetchUsersFromSheet } from '@/lib/sheetService';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType extends Omit<AuthState, 'user'> {
  user?: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole, rollNo?: string) => Promise<boolean>;
  logout: () => void;
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

  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
        });
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
      const sheetUsers = await fetchUsersFromSheet();

      const matched = sheetUsers.find(
        u => u.email.toLowerCase().trim() === emailKey && u.password === password
      );

      // SUPER ADMIN fallback
      if (!matched) {
        if (emailKey === SUPER_ADMIN.email && password === SUPER_ADMIN.password) {
          const superUser: User = {
            uid: "super-admin",
            name: SUPER_ADMIN.name,
            email: SUPER_ADMIN.email,
            role: "admin",
            createdAt: new Date().toISOString(),
          };

          const token = `mock-token-${Date.now()}`;

          localStorage.setItem("user", JSON.stringify(superUser));
          localStorage.setItem("token", token);

          setAuthState({
            user: superUser,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          toast({
            title: "Super Admin Login",
            description: "Logged in using bootstrap admin credentials.",
          });

          return true;
        }

        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid email or password.",
        });

        return false;
      }

      const user: User = {
        uid: `sheet-${matched.rollNo}`,
        name: matched.name,
        email: matched.email,
        role: matched.role,
        rollNo: matched.role === "user" ? matched.rollNo : undefined,
        createdAt: new Date().toISOString(),
      };

      const token = `mock-token-${Date.now()}`;

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.name}`,
      });

      return true;

    } catch (error) {
      console.error("Login error:", error);

      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "An error occurred during login.",
      });

      return false;
    }
  };

  const register = async (): Promise<boolean> => {
    toast({
      title: "Disabled",
      description: "Registration via Google Sheet only.",
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
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
