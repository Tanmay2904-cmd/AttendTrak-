// src/pages/admin/SuperAdminPanel.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  password: string;
  schoolName: string;
  createdAt: string;
}

export default function SuperAdminPanel() {
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const { toast } = useToast();

  const handleCreateAdmin = async () => {
    if (!adminName || !adminEmail || !adminPassword || !schoolName) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'All fields are required',
      });
      return;
    }

    try {
      // Get existing admins from localStorage
      const existingAdmins = JSON.parse(localStorage.getItem('admin_users') || '[]');

      // Check if email already exists
      if (existingAdmins.some((a: AdminUser) => a.email === adminEmail)) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Email already exists',
        });
        return;
      }

      // Create new admin user
      const newAdmin: AdminUser = {
        id: `admin-${Date.now()}`,
        name: adminName,
        email: adminEmail,
        password: adminPassword, // In production: hash this!
        schoolName: schoolName,
        createdAt: new Date().toISOString(),
      };

      // Save to localStorage
      existingAdmins.push(newAdmin);
      localStorage.setItem('admin_users', JSON.stringify(existingAdmins));

      setAdmins(existingAdmins);

      toast({
        title: 'Admin Created! ✅',
        description: `${adminName} can now login with email: ${adminEmail}`,
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
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Super Admin Panel</h1>

      {/* Create New Admin */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Admin (Teacher)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input
              placeholder="e.g., Mr. Sharma"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="sharma@school.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
          </div>

          <div>
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="Secure password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Share this with the teacher securely
            </p>
          </div>

          <div>
            <Label>School/Class Name</Label>
            <Input
              placeholder="e.g., Class 10-A, School XYZ"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
          </div>

          <Button onClick={handleCreateAdmin} className="w-full">
            Create Admin Account
          </Button>
        </CardContent>
      </Card>

      {/* List of Created Admins */}
      <Card>
        <CardHeader>
          <CardTitle>Created Admins</CardTitle>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <p className="text-muted-foreground">No admins created yet</p>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="border p-3 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">{admin.name}</p>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                    <p className="text-sm text-muted-foreground">{admin.schoolName}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}