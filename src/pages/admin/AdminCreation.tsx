import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  UserPlus,
  Users,
  Shield,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface AdminFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'user';
}

export default function AdminCreation() {
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AdminFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: validationError,
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Initialize secondary app to avoid logging out super admin
      const { initializeApp, getApps, deleteApp } = await import("firebase/app");
      const { getAuth, createUserWithEmailAndPassword, signOut } = await import("firebase/auth");
      const { doc, setDoc } = await import("firebase/firestore");
      const { db, firebaseConfig } = await import("@/Firebase");

      // Use a unique name for the secondary app
      const secondaryAppName = "secondaryAppCreation";
      let secondaryApp = getApps().find(app => app.name === secondaryAppName);
      if (!secondaryApp) {
        secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      }

      const secondaryAuth = getAuth(secondaryApp);

      // Check if email already exists in local record (fast check)
      const existingAdmins = JSON.parse(localStorage.getItem('admins') || '[]');
      const emailExists = existingAdmins.some((admin: { email: string }) => admin.email === formData.email);
      if (emailExists) {
        throw new Error('An admin with this email already exists locally (check Firebase console to be sure)');
      }

      // 2. Create User in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
      const newUid = userCred.user.uid;

      // 3. Save to Firestore (this is what AuthContext looks for)
      const newAdminData = {
        uid: newUid,
        adminName: formData.name,
        email: formData.email,
        role: formData.role,
        schoolName: 'School', // AdminCreation form might not have schoolName, defaulting
        createdAt: new Date().toISOString(),
        createdBy: user?.uid,
        sheetUrl: '',
        apiKey: '',
      };

      await setDoc(doc(db, "users", newUid), newAdminData);

      // 4. Cleanup secondary auth
      await signOut(secondaryAuth);

      // 5. Update Local State
      const newAdmin = {
        id: newUid,
        name: formData.name,
        email: formData.email,
        // password: formData.password, // Don't store password
        role: formData.role,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || 'super-admin'
      };

      const updatedAdmins = [...existingAdmins, newAdmin];
      localStorage.setItem('admins', JSON.stringify(updatedAdmins));

      // Clear form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'admin'
      });

      toast({
        title: 'Admin Created Successfully! ✅',
        description: `${formData.name} has been created in Firebase & Firestore/`,
      });

    } catch (error: any) {
      console.error("Creation error:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create admin',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdmin = (adminId: string, adminName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${adminName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const existingAdmins = JSON.parse(localStorage.getItem('admins') || '[]');
      const updatedAdmins = existingAdmins.filter((admin: { id: string }) => admin.id !== adminId);
      localStorage.setItem('admins', JSON.stringify(updatedAdmins));

      toast({
        title: 'Admin Deleted',
        description: 'Admin has been successfully removed',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete admin',
      });
    }
  };

  const getAdmins = () => {
    return JSON.parse(localStorage.getItem('admins') || '[]');
  };

  // If not super admin, show access denied
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page. Only Super Admins can create and manage admins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.history.back()}
              className="w-full"
              variant="outline"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Admin Management
          </h1>
          <p className="text-gray-600">Create and manage teacher accounts</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Create Admin Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Create New Admin</CardTitle>
                  <CardDescription>Add a new teacher to the system</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter teacher's full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="teacher@school.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter password (min 6 characters)"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="role"
                        value="admin"
                        checked={formData.role === 'admin'}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
                        className="form-radio text-blue-600"
                      />
                      <span className="text-sm">Teacher (Admin)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="role"
                        value="user"
                        checked={formData.role === 'user'}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
                        className="form-radio text-gray-600"
                      />
                      <span className="text-sm">Student (User)</span>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Save className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Admin
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Admins List */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Existing Admins</CardTitle>
                    <CardDescription>Manage teacher accounts</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {getAdmins().length} admins
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {getAdmins().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No admins created yet</p>
                  </div>
                ) : (
                  getAdmins().map((admin: { id: string; name: string; email: string; role: string; createdAt: string }) => (
                    <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Shield className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{admin.name}</p>
                          <p className="text-sm text-gray-500">{admin.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={admin.role === 'admin' ? 'default' : 'secondary'}>
                              {admin.role === 'admin' ? 'Teacher' : 'Student'}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              Created: {new Date(admin.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                        className="text-xs"
                      >
                        Delete
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-friendly info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>✅ Mobile-friendly design</p>
          <p>✅ Data stored locally per teacher</p>
          <p>✅ Teachers can only see their own class data</p>
        </div>
      </div>
    </div>
  );
}