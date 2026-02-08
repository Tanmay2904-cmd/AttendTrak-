import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { fetchAttendanceFromSheet } from '@/lib/sheetService';
import { calculateUserStats } from '@/lib/attendanceCalculations'; // ✅ Real calculations
import { User, Mail, Hash, Calendar, Award, AlertTriangle, Loader } from 'lucide-react';

export default function UserProfile() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    percentage: 0,
    isDefaulter: false,
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        
        // ✅ Fetch from Google Sheets
        const allRecords = await fetchAttendanceFromSheet();
        const userRollNo = user?.rollNo;
        
        if (userRollNo) {
          const userRecords = allRecords.filter(r => r.rollNo === userRollNo);
          const calculatedStats = calculateUserStats(userRecords);
          setStats(calculatedStats);
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, [user?.rollNo]);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account information</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin mr-2" />
              <p className="text-muted-foreground">Loading your profile data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full gradient-primary mx-auto flex items-center justify-center">
                <span className="text-3xl font-bold text-primary-foreground">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <h2 className="text-xl font-bold mt-4">{user?.name || 'Student'}</h2>
              <p className="text-muted-foreground">{user?.email || 'student@school.edu'}</p>
              
              <div className="mt-4">
                {stats.isDefaulter ? (
                  <Badge variant="danger" className="px-4 py-2">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Defaulter
                  </Badge>
                ) : (
                  <Badge variant="success" className="px-4 py-2">
                    <Award className="w-4 h-4 mr-2" />
                    Regular Student
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
              <div className="p-3 rounded-lg bg-primary/10">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{user?.name || 'Student Name'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
              <div className="p-3 rounded-lg bg-primary/10">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email Address</p>
                <p className="font-medium">{user?.email || 'student@school.edu'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
              <div className="p-3 rounded-lg bg-primary/10">
                <Hash className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Roll Number</p>
                <p className="font-medium">{(user as any)?.rollNo || 'STU001'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
              <div className="p-3 rounded-lg bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {(user as any)?.createdAt
                    ? new Date((user as any).createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'January 2024'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
          <CardDescription>Your overall attendance statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <p className="text-2xl font-bold">{stats.totalDays}</p>
              <p className="text-sm text-muted-foreground">Total Days</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-success/10">
              <p className="text-2xl font-bold text-success">{stats.presentDays}</p>
              <p className="text-sm text-muted-foreground">Present</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-destructive/10">
              <p className="text-2xl font-bold text-destructive">{stats.absentDays}</p>
              <p className="text-sm text-muted-foreground">Absent</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-warning/10">
              <p className="text-2xl font-bold text-warning">{stats.lateDays}</p>
              <p className="text-sm text-muted-foreground">Late</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/10">
              <p className={`text-2xl font-bold ${stats.percentage >= 75 ? 'text-success' : 'text-destructive'}`}>
                {stats.percentage}%
              </p>
              <p className="text-sm text-muted-foreground">Percentage</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
