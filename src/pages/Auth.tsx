import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRole } from '@/types';
import { ClipboardCheck, Loader2, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { fetchAttendanceFromSheet } from '@/lib/sheetService';

interface Student {
  studentId: string;
  name: string;
  rollNo: string;
}

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password required'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password required'),
});

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [registerMode, setRegisterMode] = useState<'admin' | 'student'>('student');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Admin Register form
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  // Student Register form
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  const { login, register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Load students from Google Sheets
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoadingStudents(true);
        const records = await fetchAttendanceFromSheet();

        const uniqueStudents = Array.from(
          new Map(
            records.map(r => [
              r.rollNo,
              {
                studentId: r.studentId || r.rollNo,
                name: r.name,
                rollNo: r.rollNo,
              }
            ])
          ).values()
        );

        setStudents(uniqueStudents);
      } catch (error) {
        console.error('Error loading students:', error);
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudents();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      loginSchema.parse({ email: loginEmail, password: loginPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[`login_${error.path[0]}`] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setIsLoading(true);
    await login(loginEmail, loginPassword);
    setIsLoading(false);
  };

  const handleAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      registerSchema.parse({
        name: registerName,
        email: registerEmail,
        password: registerPassword,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[`admin_${error.path[0]}`] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setIsLoading(true);
    await register(registerName, registerEmail, registerPassword, 'admin');
    setIsLoading(false);
  };

  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!selectedStudent) {
      setErrors({ student: 'Please select your name from the list' });
      return;
    }

    // Get selected student data
    const selectedStudentData = students.find(s => s.rollNo === selectedStudent);

    if (!selectedStudentData) {
      setErrors({ student: 'Invalid student selection' });
      return;
    }

    // Validate email and password only (name comes from Google Sheets)
    if (!studentEmail || !studentEmail.includes('@')) {
      setErrors({ student_email: 'Please enter a valid email address' });
      return;
    }

    if (!studentPassword || studentPassword.length < 1) {
      setErrors({ student_password: 'Password is required' });
      return;
    }

    console.log('📝 Registering student:', {
      name: selectedStudentData.name,
      rollNo: selectedStudent,
      email: studentEmail
    });

    setIsLoading(true);
    await register(
      selectedStudentData.name,
      studentEmail,
      studentPassword,
      'user',
      selectedStudent
    );
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Visual & Branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 via-purple-600/90 to-slate-900/90" />

        <div className="relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 border border-white/20">
            <ClipboardCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">AttendTrack</h1>
          <p className="text-indigo-200 text-lg">Next Gen Attendance Management</p>
        </div>

        <div className="relative z-10 space-y-6">
          <blockquote className="space-y-2">
            <p className="text-xl font-medium leading-relaxed">
              "This platform has completely transformed how we manage classroom attendance. The real-time syncing with Google Sheets is a game changer."
            </p>
            <footer className="text-indigo-200">
              — Sarah Chen, University Administrator
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 bg-background animate-in relative">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-2">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-12 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Login</TabsTrigger>
              <TabsTrigger value="student" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Student</TabsTrigger>
              <TabsTrigger value="admin" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Admin</TabsTrigger>
            </TabsList>

            {/* LOGIN TAB */}
            <TabsContent value="login" className="space-y-6 animate-in hover:none">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="name@school.edu"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-11 bg-muted/30 border-input focus-visible:ring-indigo-500"
                  />
                  {errors.login_email && (
                    <p className="text-sm text-destructive">{errors.login_email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <a href="#" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">Forgot?</a>
                  </div>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-11 bg-muted/30 border-input focus-visible:ring-indigo-500 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {errors.login_password && (
                    <p className="text-sm text-destructive">{errors.login_password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* STUDENT REGISTER TAB */}
            <TabsContent value="student" className="space-y-6 animate-in">
              <form onSubmit={handleStudentRegister} className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-sm text-indigo-900 mb-4">
                  <p className="font-semibold mb-1">Student Registration</p>
                  <p className="text-indigo-700">Find your name in the list to create your account.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-select">Select Your Name</Label>
                  <Select
                    value={selectedStudent}
                    onValueChange={setSelectedStudent}
                    disabled={isLoading || loadingStudents}
                  >
                    <SelectTrigger className="h-11 bg-muted/30 border-input">
                      <SelectValue placeholder={loadingStudents ? "Loading..." : "Select your name"} />
                    </SelectTrigger>
                    <SelectContent>
                      {students.length > 0 ? (
                        students.map(student => (
                          <SelectItem key={student.rollNo} value={student.rollNo}>
                            {student.name} ({student.rollNo})
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">
                          {loadingStudents ? 'Loading students...' : 'No students available'}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.student && (
                    <p className="text-sm text-destructive">{errors.student}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-email">Email</Label>
                  <Input
                    id="student-email"
                    type="email"
                    placeholder="you@school.edu"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-11 bg-muted/30 border-input"
                  />
                  {errors.student_email && (
                    <p className="text-sm text-destructive">{errors.student_email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-password">Create Password</Label>
                  <div className="relative">
                    <Input
                      id="student-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-11 bg-muted/30 border-input pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {errors.student_password && (
                    <p className="text-sm text-destructive">{errors.student_password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
                  disabled={isLoading || loadingStudents}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating account...
                    </>
                  ) : (
                    'Register as Student'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* ADMIN REGISTER TAB */}
            <TabsContent value="admin" className="space-y-6 animate-in">
              <form onSubmit={handleAdminRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-name">Full Name</Label>
                  <Input
                    id="admin-name"
                    type="text"
                    placeholder="John Doe"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    disabled={isLoading}
                    className="h-11 bg-muted/30 border-input"
                  />
                  {errors.admin_name && (
                    <p className="text-sm text-destructive">{errors.admin_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@school.edu"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-11 bg-muted/30 border-input"
                  />
                  {errors.admin_email && (
                    <p className="text-sm text-destructive">{errors.admin_email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-11 bg-muted/30 border-input pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {errors.admin_password && (
                    <p className="text-sm text-destructive">{errors.admin_password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating account...
                    </>
                  ) : (
                    'Create Admin Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground mt-8">
            By clicking continue, you agree to our <a href="#" className="underline hover:text-indigo-600">Terms of Service</a> and <a href="#" className="underline hover:text-indigo-600">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}