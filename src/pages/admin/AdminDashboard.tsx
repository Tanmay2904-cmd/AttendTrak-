import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { AttendanceBarChart } from '@/components/charts/AttendanceBarChart';
import { AttendancePieChart } from '@/components/charts/AttendancePieChart';
import { AttendanceTable } from '@/components/dashboard/AttendanceTable';
import { calculateMonthlyAttendance } from '@/lib/attendanceCalculations';
import { fetchFromGoogleSheet } from '@/lib/sheetService';
import { AttendanceRecord, StudentAttendance, MonthlyAttendance } from '@/types';
import { Users, UserCheck, UserX, Clock, AlertTriangle, TrendingUp, Loader } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendancePercentage: number;
  defaulters: number;
}

interface ClassSheet {
  id: string;
  className: string;
  sheetId: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
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
  const [currentClass, setCurrentClass] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get selected class from localStorage
      const selectedClassId = localStorage.getItem('current_selected_class');
      
      if (!selectedClassId) {
        throw new Error('No class selected. Please add a class in Sync Data.');
      }

      // Get class info
      const classSheets: ClassSheet[] = JSON.parse(
        localStorage.getItem(`class_sheets_${user?.uid}`) || '[]'
      );

      const selectedClassData = classSheets.find(c => c.id === selectedClassId);
      if (!selectedClassData) {
        throw new Error('Selected class not found');
      }

      setCurrentClass(selectedClassData.className);

      // Get attendance data for this class
      const attendanceRecords = JSON.parse(
        localStorage.getItem(`class_data_${selectedClassId}`) || '[]'
      );

      if (!attendanceRecords || attendanceRecords.length === 0) {
        throw new Error(`No attendance data for ${selectedClassData.className}. Please sync first.`);
      }

      console.log(`✅ Loaded ${attendanceRecords.length} records for ${selectedClassData.className}`);

      // Get latest date
      const dates = attendanceRecords
        .map(r => new Date(r.date).getTime())
        .filter(d => !isNaN(d));
      
      const latestDate = new Date(Math.max(...dates));
      const todayDateString = latestDate.toISOString().split('T')[0];

      // Get recent records
      const sortedByDate = [...attendanceRecords].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      setRecentRecords(sortedByDate.slice(0, 10));

      // Calculate monthly data
      const monthly = calculateMonthlyAttendance(attendanceRecords);
      setMonthlyData(monthly);

      // Group students
      const studentMap = new Map<string, StudentAttendance>();

      attendanceRecords.forEach(record => {
        const key = record.rollNo;
        
        if (!studentMap.has(key)) {
          studentMap.set(key, {
            id: record.studentId || record.rollNo,
            name: record.name,
            email: `${record.name.toLowerCase().replace(/\s+/g, '.')}@school.edu`,
            rollNo: record.rollNo,
            presentDays: 0,
            absentDays: 0,
            lateDays: 0,
            percentage: 0,
            isDefaulter: false,
            status: 'Regular',
            attendance: 0,
            userId: record.userId,
          });
        }

        const student = studentMap.get(key)!;
        if (record.status === 'present') student.presentDays!++;
        else if (record.status === 'absent') student.absentDays!++;
        else if (record.status === 'late') student.lateDays!++;
      });

      // Calculate percentages
      const students = Array.from(studentMap.values()).map(student => {
        const totalDays = (student.presentDays || 0) + (student.absentDays || 0) + (student.lateDays || 0);
        const percentage = totalDays > 0
          ? Math.round(((student.presentDays || 0) + (student.lateDays || 0)) / totalDays * 100)
          : 0;

        return {
          ...student,
          percentage,
          attendance: percentage,
          isDefaulter: percentage < 75,
          status: percentage < 75 ? 'Defaulter' : 'Regular',
        };
      });

      // Calculate today's stats
      const todayRecords = attendanceRecords.filter(r => r.date === todayDateString);
      const presentToday = todayRecords.filter(r => r.status === 'present').length;
      const absentToday = todayRecords.filter(r => r.status === 'absent').length;
      const lateToday = todayRecords.filter(r => r.status === 'late').length;
      const defaulters = students.filter(s => s.isDefaulter).length;
      const totalStudents = students.length;
      const attendancePercentage = totalStudents > 0
        ? Math.round(((presentToday + lateToday) / totalStudents) * 100)
        : 0;

      setStats({
        totalStudents,
        presentToday,
        absentToday,
        lateToday,
        attendancePercentage,
        defaulters,
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
      <div className="space-y-6 sm:space-y-8 animate-fade-in">
        <div className="flex items-center justify-center p-8">
          <Loader className="w-6 h-6 animate-spin mr-2" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-fade-in">
        <div className="px-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Welcome back! Here's today's overview.</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-sm sm:text-base text-destructive font-medium">❌ Error: {error}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Go to "Sync Data" to add a class or check your connection
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in w-full">
      {/* Header */}
      <div className="px-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Class: <span className="font-semibold text-foreground">{currentClass}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Monthly Attendance Trends</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Attendance patterns over the period</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-full">
              <AttendanceBarChart data={monthlyData} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Today's Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Attendance breakdown</CardDescription>
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
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">Recent Attendance Records</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Latest entries for {currentClass}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-full">
            {recentRecords.length > 0 ? (
              <AttendanceTable records={recentRecords} />
            ) : (
              <p className="text-center text-xs sm:text-sm text-muted-foreground py-8">
                No recent records
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}