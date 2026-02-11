// src/pages/admin/SuperAdminDashboard.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { fetchFromGoogleSheet } from '@/lib/sheetService';
import { useAuth } from '@/context/AuthContext';
import {
  Plus,
  Trash2,
  RefreshCw,
  Users,
  Shield,
  Eye,
} from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  password: string;
  schoolName: string;
  createdAt: string;
}

interface AdminSheet {
  id: string;
  adminId: string;
  adminName: string;
  sheetId: string;
  sheetUrl: string;
  className: string;
  lastSyncedAt: string;
  recordsCount: number;
}

export default function SuperAdminDashboard() {
  const { user, isSuperAdmin } = useAuth();
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminSheets, setAdminSheets] = useState<AdminSheet[]>([]);
  const [allAttendance, setAllAttendance] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  // Load data on mount
  useEffect(() => {
    loadAdmins();
    loadAdminSheets();
    loadApiKey();
  }, []);

  const loadAdmins = () => {
    const savedAdmins: AdminUser[] = JSON.parse(localStorage.getItem('admin_users') || '[]');
    setAdmins(savedAdmins);
  };

  const loadAdminSheets = () => {
    const sheets: AdminSheet[] = JSON.parse(localStorage.getItem('admin_sheets') || '[]');
    setAdminSheets(sheets);
  };

  const loadApiKey = () => {
    const key = localStorage.getItem('google_sheets_api_key') || '';
    setApiKey(key);
  };

  const handleCreateAdmin = () => {
    if (!adminName || !adminEmail || !adminPassword || !schoolName) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'All fields are required',
      });
      return;
    }

    if (admins.some(a => a.email === adminEmail)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Email already exists',
      });
      return;
    }

    setIsCreating(true);

    try {
      const newAdmin: AdminUser = {
        id: `admin-${Date.now()}`,
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        schoolName: schoolName,
        createdAt: new Date().toISOString(),
      };

      const updated = [...admins, newAdmin];
      localStorage.setItem('admin_users', JSON.stringify(updated));
      setAdmins(updated);

      toast({
        title: 'Admin Created! ✅',
        description: `${adminName} can login with ${adminEmail}`,
      });

      // Reset form
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      setSchoolName('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create admin',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAdmin = (adminId: string) => {
    const updated = admins.filter(a => a.id !== adminId);
    localStorage.setItem('admin_users', JSON.stringify(updated));
    setAdmins(updated);

    toast({
      title: 'Admin Deleted',
      description: 'Admin has been removed',
    });
  };

  const handleViewAdminData = async (sheet: AdminSheet) => {
    try {
      if (!apiKey) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'API Key not set',
        });
        return;
      }

      const records = await fetchFromGoogleSheet(sheet.sheetId, apiKey);
      
      toast({
        title: 'Data Loaded',
        description: `${records.length} records from ${sheet.adminName}'s sheet`,
      });

      console.log(`📊 ${sheet.adminName} (${sheet.className}):`, records);
      setAllAttendance(records);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load data',
      });
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 font-semibold">Access Denied - Super Admin Only</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in w-full">
      {/* Header */}
      <div className="px-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
          Super Admin Dashboard
        </h1>
        <p className="text-xs sm:text-base text-muted-foreground mt-1">
          Manage all teachers and view all attendance data
        </p>
      </div>

      {/* Create Admin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Admin (Teacher)
          </CardTitle>
          <CardDescription>Add a new teacher to the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="e.g., Mr. Sharma"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="sharma@school.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Secure password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="school">Class/School Name</Label>
              <Input
                id="school"
                placeholder="e.g., Class 10-A"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleCreateAdmin}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? 'Creating...' : 'Create Admin Account'}
          </Button>
        </CardContent>
      </Card>

      {/* All Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Registered Teachers ({admins.length})
          </CardTitle>
          <CardDescription>All teachers in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No admins created yet</p>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="border p-4 rounded-lg flex justify-between items-start"
                >
                  <div className="flex-1">
                    <p className="font-semibold">{admin.name}</p>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                    <p className="text-sm text-muted-foreground">{admin.schoolName}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {new Date(admin.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteAdmin(admin.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Synced Sheets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Synced Google Sheets ({adminSheets.length})
          </CardTitle>
          <CardDescription>All sheets synced by teachers</CardDescription>
        </CardHeader>
        <CardContent>
          {adminSheets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No sheets synced yet</p>
          ) : (
            <div className="space-y-3">
              {adminSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className="border p-4 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-semibold">{sheet.adminName}</p>
                      <p className="text-sm text-muted-foreground">{sheet.className}</p>
                    </div>
                    <Badge variant="outline">{sheet.recordsCount} records</Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">
                    Last synced: {sheet.lastSyncedAt}
                  </p>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewAdminData(sheet)}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Data ({sheet.recordsCount} records)
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Attendance Data */}
      {allAttendance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Attendance Records</CardTitle>
            <CardDescription>{allAttendance.length} total records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Roll No</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allAttendance.slice(0, 20).map((record, idx) => (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="p-2">{record.rollNo}</td>
                      <td className="p-2">{record.name}</td>
                      <td className="p-2">{record.date}</td>
                      <td className="p-2">{record.time}</td>
                      <td className="p-2">
                        <Badge
                          variant={
                            record.status === 'present'
                              ? 'default'
                              : record.status === 'late'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {record.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allAttendance.length > 20 && (
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Showing 20 of {allAttendance.length} records
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}