import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/dashboard/StatCard';
import { AttendancePieChart } from '@/components/charts/AttendancePieChart';
import { AttendanceTable } from '@/components/dashboard/AttendanceTable';
import { useAuth } from '@/context/AuthContext';
import { fetchFromGoogleSheet } from '@/lib/sheetService';
import { AttendanceRecord } from '@/types';
import { Calendar, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface UserStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  percentage: number;
  isDefaulter: boolean;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [userAttendance, setUserAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    percentage: 0,
    isDefaulter: false,
  });

  useEffect(() => {
    const loadUserAttendance = async () => {
      try {
        // Get all attendance records from Google Sheets
        // Use user's specific sheet if available, otherwise default
        const sheetId = user?.sheetUrl || import.meta.env.VITE_GOOGLE_SHEET_ID;
        const apiKey = user?.apiKey || import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

        if (!sheetId || !apiKey) {
          console.error("Missing sheet config");
          return;
        }

        const allRecords = await fetchFromGoogleSheet(sheetId, apiKey);

        // Filter by user's rollNo
        const userRollNo = user?.rollNo;
        if (!userRollNo) {
          console.error('User roll number not found');
          return;
        }

        const filtered = allRecords.filter(record => record.rollNo === userRollNo);
        setUserAttendance(filtered);

        // Calculate stats
        const presentDays = filtered.filter(r => r.status === 'present').length;
        const absentDays = filtered.filter(r => r.status === 'absent').length;
        const lateDays = filtered.filter(r => r.status === 'late').length;
        const totalDays = filtered.length;

        const percentage = totalDays > 0
          ? Math.round(((presentDays + lateDays) / totalDays) * 100)
          : 0;

        setStats({
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          percentage,
          isDefaulter: percentage < 75,
        });
      } catch (error) {
        console.error('Error loading user attendance:', error);
        setUserAttendance([]);
      }
    };

    loadUserAttendance();
  }, [user?.rollNo]);

  const recentAttendance = userAttendance.slice(0, 7);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in w-full">
      {/* Header with Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-1">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Welcome, {user?.name || 'Student'}!</h1>
          <p className="text-xs sm:text-base text-muted-foreground mt-1">Here's your attendance overview</p>
        </div>
        {stats.isDefaulter ? (
          <Badge variant="destructive" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 whitespace-nowrap flex-shrink-0">
            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
            Below 75%
          </Badge>
        ) : (
          <Badge variant="default" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 whitespace-nowrap flex-shrink-0 bg-green-600">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            Good
          </Badge>
        )}
      </div>

      {/* Stats Grid - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <StatCard
          title="Total Days"
          value={stats.totalDays}
          icon={Calendar}
          variant="default"
        />
        <StatCard
          title="Present"
          value={stats.presentDays}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Absent"
          value={stats.absentDays}
          icon={XCircle}
          variant="danger"
        />
        <StatCard
          title="Late"
          value={stats.lateDays}
          icon={Clock}
          variant="warning"
        />
      </div>

      {/* Attendance Progress Card */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-xl">Attendance Percentage</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your overall attendance rate</CardDescription>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={`text-3xl sm:text-4xl font-bold ${stats.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.percentage}%
              </span>
              <p className="text-xs sm:text-sm text-muted-foreground">Min required: 75%</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <Progress
            value={stats.percentage}
            className="h-3 sm:h-4"
          />
          <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
            <span>0%</span>
            <span className="text-yellow-600 font-medium">75% (Threshold)</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      {/* Charts and Recent - Stack on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Attendance Breakdown</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Distribution of your attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendancePieChart
              present={stats.presentDays}
              absent={stats.absentDays}
              late={stats.lateDays}
            />
          </CardContent>
        </Card>

        {/* Recent Attendance Table - takes 2 cols on desktop */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Recent Attendance</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Your last 7 records</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-full">
              {recentAttendance.length > 0 ? (
                <AttendanceTable records={recentAttendance} showUserColumn={false} />
              ) : (
                <p className="text-center text-xs sm:text-sm text-muted-foreground py-8">No attendance records found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Grid - 3 cols on mobile, responsive on desktop */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">Summary</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Quick overview of your attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Present */}
            <div className="text-center p-2 sm:p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600">{stats.presentDays}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">Present</p>
            </div>

            {/* Absent */}
            <div className="text-center p-2 sm:p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600">{stats.absentDays}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">Absent</p>
            </div>

            {/* Late */}
            <div className="text-center p-2 sm:p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-600">{stats.lateDays}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">Late</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}