import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { AttendanceBarChart } from '@/components/charts/AttendanceBarChart';
import { AttendancePieChart } from '@/components/charts/AttendancePieChart';
import { AttendanceTable } from '@/components/dashboard/AttendanceTable';
import { calculateMonthlyAttendance } from '@/lib/attendanceCalculations';
import { AttendanceRecord, MonthlyAttendance } from '@/types';
import { Users, UserCheck, UserX, Clock, AlertTriangle, TrendingUp, Loader } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useClass } from '@/context/ClassContext';
import { fetchFromGoogleSheet, extractSheetIdFromUrl, fetchSheetNames } from '@/lib/sheetService';
import { Button } from '@/components/ui/button';
import { useNavigate, Navigate } from 'react-router-dom';

interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendancePercentage: number;
  defaulters: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { selectedClass } = useClass();
  const navigate = useNavigate();
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyAttendance[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    attendancePercentage: 0,
    defaulters: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user, selectedClass]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check for config
      // Use selectedClass sheetId if available, otherwise fallback to user profile
      const targetSheetId = selectedClass?.sheetId || extractSheetIdFromUrl(user?.sheetUrl || '') || user?.sheetUrl;

      if (!targetSheetId || !user?.apiKey) {
        setLoading(false);
        return; // Will show empty state below
      }

      console.log(`Loading data for sheet: ${targetSheetId} (${selectedClass?.className || 'Default'})`);

      // Fetch ALL tabs and combine for complete monthly data
      let attendanceRecords: AttendanceRecord[] = [];
      try {
        const tabs = await fetchSheetNames(targetSheetId, user.apiKey);
        console.log(`📊 Tabs found: ${tabs.join(', ')}`);
        if (tabs.length > 0) {
          const results = await Promise.allSettled(
            tabs.map(tab => fetchFromGoogleSheet(targetSheetId, user.apiKey, `${tab}!A2:F`))
          );
          results.forEach((result, i) => {
            if (result.status === 'fulfilled') {
              attendanceRecords = [...attendanceRecords, ...result.value];
              console.log(`✅ Tab "${tabs[i]}": ${result.value.length} records`);
            }
          });
        }
      } catch (tabErr) {
        console.warn('Tab fetch failed, falling back to single tab:', tabErr);
      }

      // Fallback: single tab if multi-tab fetch returned nothing
      if (attendanceRecords.length === 0) {
        const tabName = selectedClass?.sheetTab || 'Sheet1';
        attendanceRecords = await fetchFromGoogleSheet(targetSheetId, user.apiKey, `${tabName}!A2:F`);
      }

      console.log(`✅ Loaded ${attendanceRecords.length} records`);

      // Get latest date
      const dates = attendanceRecords
        .map(r => new Date(r.date).getTime())
        .filter(d => !isNaN(d));

      const latestDate = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();
      const todayDateString = latestDate.toISOString().split('T')[0];

      // Get recent records
      const sortedByDate = [...attendanceRecords].sort((a, b) => {
        // Sort by date desc, then by time desc
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return b.time.localeCompare(a.time);
      });
      setRecentRecords(sortedByDate.slice(0, 10));

      // Calculate monthly data
      const monthly = calculateMonthlyAttendance(attendanceRecords);
      setMonthlyData(monthly);

      // Group students to calculate stats
      // Reuse logic from previous implementation or move to helper
      // For now, inline simplified calculation
      const uniqueStudents = new Set(attendanceRecords.map(r => r.rollNo));
      const totalStudents = uniqueStudents.size; // This matches "Active students in logs"

      // Stats for "Today" (Latest Date)
      const todayRecords = attendanceRecords.filter(r => r.date === todayDateString);

      // We need to deduplicate today's records per student to get accurate counts 
      // (in case multiple punches, though parser handles some)
      // Assuming parser gives clean stream, but let's just count unique rollNos per status
      const presentSet = new Set(todayRecords.filter(r => r.status === 'present').map(r => r.rollNo));
      const lateSet = new Set(todayRecords.filter(r => r.status === 'late').map(r => r.rollNo));
      // Absent is tricky without a master list of students. 
      // If we don't have a master list, we can only count who is present/late.
      // Or we assume totalStudents is the universe.

      const presentToday = presentSet.size;
      const lateToday = lateSet.size;
      const absentToday = totalStudents - presentToday - lateToday; // Approximation

      // Defaulters (Below 75%)
      let defaulterCount = 0;
      uniqueStudents.forEach(rollNo => {
        const studentRecords = attendanceRecords.filter(r => r.rollNo === rollNo);
        const present = studentRecords.filter(r => r.status === 'present' || r.status === 'late').length;
        // Total days = unique dates this student has records for? 
        // Or unique dates total? usually total class days.
        // Let's use unique dates in the whole dataset as "Total Class Days"
        const uniqueDates = new Set(attendanceRecords.map(r => r.date)).size;
        const percentage = uniqueDates > 0 ? (present / uniqueDates) * 100 : 0;
        if (percentage < 75) defaulterCount++;
      });

      const attendancePercentage = totalStudents > 0
        ? Math.round(((presentToday + lateToday) / totalStudents) * 100)
        : 0;

      setStats({
        totalStudents,
        presentToday,
        absentToday: Math.max(0, absentToday),
        lateToday,
        attendancePercentage,
        defaulters: defaulterCount,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      console.error('❌ Error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  // Not configured state
  if (!user?.sheetUrl || !user?.apiKey) {
    // If Super Admin lands here without config, redirect them to their panel
    if (user?.role === 'super_admin') {
      // Use a small timeout or immediate effect to avoid flash if possible, 
      // but returning null/redirect component is better.
      // Since we are in render, we can't navigate immediately without useEffect, 
      // but we can render the Navigate component.
      return <Navigate to="/super-admin" replace />;
    }

    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Setup Required</CardTitle>
            <CardDescription>
              Please configure your Google Sheet and API options to view the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => navigate('/admin/sync')} className="w-full">
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive font-medium">❌ Error: {error}</p>
              <Button
                variant="outline"
                onClick={() => loadDashboardData()}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Header */}
      <div className="px-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Class: <span className="font-semibold text-foreground">{selectedClass?.className || user?.className || 'Unknown Class'}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          icon={UserCheck}
          variant="success"
        />
        <StatCard
          title="Absent Today"
          value={stats.absentToday}
          icon={UserX}
          variant="danger"
        />
        <StatCard
          title="Late Today"
          value={stats.lateToday}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Attendance %"
          value={`${stats.attendancePercentage}%`}
          icon={TrendingUp}
          variant="default"
        />
        <StatCard
          title="Defaulters"
          value={stats.defaulters}
          subtitle="Below 75%"
          icon={AlertTriangle}
          variant="danger"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Attendance Trends</CardTitle>
            <CardDescription>Attendance patterns over the period</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceBarChart data={monthlyData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Distribution</CardTitle>
            <CardDescription>Attendance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendancePieChart
              present={stats.presentToday}
              absent={stats.absentToday}
              late={stats.lateToday}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Records */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Records</CardTitle>
          <CardDescription>Latest entries</CardDescription>
        </CardHeader>
        <CardContent>
          {recentRecords.length > 0 ? (
            <AttendanceTable records={recentRecords} />
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No recent records
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}