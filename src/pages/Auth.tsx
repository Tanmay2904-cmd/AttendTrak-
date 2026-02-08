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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative animate-scale-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
            <ClipboardCheck className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">AttendTrack</CardTitle>
            <CardDescription className="mt-2">
              Attendance Management System
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="student">Student Register</TabsTrigger>
              <TabsTrigger value="admin">Admin Register</TabsTrigger>
            </TabsList>

            {/* LOGIN TAB */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="admin@school.edu"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.login_email && (
                    <p className="text-sm text-destructive">{errors.login_email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {errors.login_password && (
                    <p className="text-sm text-destructive">{errors.login_password}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* STUDENT REGISTER TAB */}
            <TabsContent value="student">
              <form onSubmit={handleStudentRegister} className="space-y-4">
                <div className="bg-green-50 p-3 rounded text-sm text-green-900 mb-4">
                  <p><strong>Student Registration</strong></p>
                  <p>Select your name from Google Sheets list</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-select">Select Your Name</Label>
                  <Select
                    value={selectedStudent}
                    onValueChange={setSelectedStudent}
                    disabled={isLoading || loadingStudents}
                  >
                    <SelectTrigger>
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
                  />
                  {errors.student_email && (
                    <p className="text-sm text-destructive">{errors.student_email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="student-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {errors.student_password && (
                    <p className="text-sm text-destructive">{errors.student_password}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading || loadingStudents}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Register as Student'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* ADMIN REGISTER TAB */}
            <TabsContent value="admin">
              <form onSubmit={handleAdminRegister} className="space-y-4">
                <div className="bg-amber-50 p-3 rounded text-sm text-amber-900 mb-4">
                  <p><strong>Admin Registration Only</strong></p>
                  <p>Create new admin account</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-name">Full Name</Label>
                  <Input
                    id="admin-name"
                    type="text"
                    placeholder="John Admin"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    disabled={isLoading}
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
                    placeholder="admin@example.edu"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    disabled={isLoading}
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
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {errors.admin_password && (
                    <p className="text-sm text-destructive">{errors.admin_password}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Admin Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}