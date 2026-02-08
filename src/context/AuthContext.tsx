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

// Mock users database for demo
let mockUsers: User[] = [
  {
    uid: 'admin-001',
    name: 'Tanmay Naigaonkar(Admin)',
    email: 'tanmay.naigaonkar29@gmail.com',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'admin-002',
    name: 'test admin',
    email: 'test.admin@school.edu',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  // ✅ FIXED: Changed from STU00X to ST00X to match Google Sheets
  {
    uid: 'user-001',
    name: 'Tanmay Naigaonkar',
    email: 'tanmay@school.edu',
    role: 'user',
    rollNo: 'ST001', // ✅ Matches Google Sheets
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'user-002',
    name: 'Vinayak Mankar',
    email: 'vinayakmankar@gmail.com',
    role: 'user',
    rollNo: 'ST002', // ✅ Matches Google Sheets
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'user-003',
    name: 'Rohan Todkar',
    email: 'rohantodkar@gmail.com',
    role: 'user',
    rollNo: 'ST003', // ✅ Matches Google Sheets
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'user-004',
    name: 'Sakshi Upadhye',
    email: 'sakshiupadhye@gmail.com',
    role: 'user',
    rollNo: 'ST004', // ✅ Matches Google Sheets
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'user-005',
    name: 'Rahul Jain',
    email: 'rahuljain@gmail.com',
    role: 'user',
    rollNo: 'ST005', // ✅ Matches Google Sheets
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'user-006',
    name: 'Rishikesh Nautiyal',
    email: 'rishikeshnautiyal@gmail.com',
    role: 'user',
    rollNo: 'ST006', // ✅ Matches Google Sheets
    createdAt: new Date().toISOString(),
  },
];

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
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const emailKey = email.toLowerCase().trim();
      const user = mockUsers.find(u => u.email === emailKey);
      
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'Email not found.',
        });
        return false;
      }

      console.log('✅ Login successful:', { name: user.name, role: user.role, rollNo: user.rollNo });

      const token = `mock-token-${Date.now()}`;
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      localStorage.setItem('uid', user.uid);

      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

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

  const register = async (
    name: string, 
    email: string, 
    password: string, 
    role: UserRole,
    rollNo?: string
  ): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const emailKey = email.toLowerCase().trim();

      if (mockUsers.find(u => u.email === emailKey)) {
        toast({
          variant: 'destructive',
          title: 'Registration Failed',
          description: 'Email already exists.',
        });
        return false;
      }

      // ✅ Check if student with same rollNo already registered
      if (role === 'user' && rollNo) {
        console.log('🔍 Checking registration for rollNo:', rollNo);
        console.log('📋 Existing users:', mockUsers.map(u => ({ name: u.name, rollNo: u.rollNo })));
        
        const existingStudent = mockUsers.find(u => u.rollNo === rollNo && u.role === 'user');
        
        if (existingStudent) {
          console.log('❌ Student already registered:', existingStudent);
          toast({
            variant: 'destructive',
            title: 'Already Registered',
            description: `${name} is already registered with email: ${existingStudent.email}`,
          });
          return false;
        } else {
          console.log('✅ Student not found, can register');
        }
      }

      const newUser: User = {
        uid: `user-${Date.now()}`,
        name,
        email,
        role,
        rollNo: role === 'user' ? rollNo : undefined,
        createdAt: new Date().toISOString(),
      };

      mockUsers = [...mockUsers, newUser];

      console.log('✅ Registration successful:', { name: newUser.name, role: newUser.role, rollNo: newUser.rollNo });

      const token = `mock-token-${Date.now()}`;
      
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('token', token);
      localStorage.setItem('role', newUser.role);
      localStorage.setItem('uid', newUser.uid);

      setAuthState({
        user: newUser,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

      toast({
        title: 'Account Created!',
        description: 'Your account has been successfully created.',
      });

      return true;
    } catch (error) {
      console.error('Register error:', error);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: 'An error occurred during registration.',
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('uid');

    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });

    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}