import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AttendanceBarChart } from '@/components/charts/AttendanceBarChart';
import { AttendanceLineChart } from '@/components/charts/AttendanceLineChart';
import { AttendancePieChart } from '@/components/charts/AttendancePieChart';
import { calculateMonthlyAttendance } from '@/lib/attendanceCalculations';
import { Progress } from '@/components/ui/progress';
import { Loader, AlertCircle } from 'lucide-react';
import { StudentAttendance, AttendanceRecord, MonthlyAttendance } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface ClassSheet {
  id: string;
  className: string;
}

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [studentStats, setStudentStats] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyAttendance[]>([]);
  const [currentClass, setCurrentClass] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get selected class
        const selectedClassId = localStorage.getItem('current_selected_class');
        if (!selectedClassId) {
          throw new Error('No class selected. Please add a class first.');
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

        // Get attendance records for this class
        const attendanceRecords: AttendanceRecord[] = JSON.parse(
          localStorage.getItem(`class_data_${selectedClassId}`) || '[]'
        );

        if (!attendanceRecords || attendanceRecords.length === 0) {
          throw new Error(`No data for ${selectedClassData.className}`);
        }

        // Calculate monthly data
        const monthly = calculateMonthlyAttendance(attendanceRecords);
        setMonthlyData(monthly);

        // Transform to student stats
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
        
        setStudentStats(students);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin mr-2" />
        <span>Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Detailed attendance analytics and insights</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive py-8">
              <AlertCircle className="w-5 h-5" />
              <p>Error: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!studentStats || studentStats.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Class: <span className="font-semibold">{currentClass}</span></p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">No student data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPresent = studentStats?.reduce((sum, s) => sum + (s.presentDays || 0), 0) || 0;
  const totalAbsent = studentStats?.reduce((sum, s) => sum + (s.absentDays || 0), 0) || 0;
  const totalLate = studentStats?.reduce((sum, s) => sum + (s.lateDays || 0), 0) || 0;
  const avgAttendance = studentStats && studentStats.length > 0 
    ? Math.round(studentStats.reduce((sum, s) => sum + (s.percentage || 0), 0) / studentStats.length)
    : 0;

  const topPerformers = studentStats 
    ? [...studentStats]
        .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
        .slice(0, 5)
    : [];

  const defaulters = studentStats
    ? studentStats.filter(s => s.isDefaulter)
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Class: <span className="font-semibold">{currentClass}</span></p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Average Attendance</p>
            <p className="text-3xl font-bold text-primary">{avgAttendance}%</p>
            <Progress value={avgAttendance} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Present Days</p>
            <p className="text-3xl font-bold text-success">{totalPresent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Absent Days</p>
            <p className="text-3xl font-bold text-destructive">{totalAbsent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Late Arrivals</p>
            <p className="text-3xl font-bold text-warning">{totalLate}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Attendance patterns over time</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceLineChart data={monthlyData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Comparison</CardTitle>
            <CardDescription>Bar chart comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceBarChart data={monthlyData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Distribution</CardTitle>
            <CardDescription>All-time attendance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendancePieChart
              present={totalPresent}
              absent={totalAbsent}
              late={totalLate}
            />
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Highest attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((student) => (
                <div key={student.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {topPerformers.indexOf(student) + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.rollNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-success">{student.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Defaulters */}
        <Card>
          <CardHeader>
            <CardTitle>Attention Required</CardTitle>
            <CardDescription>Below 75% attendance</CardDescription>
          </CardHeader>
          <CardContent>
            {defaulters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No defaulters!</p>
                <p className="text-sm">All students have good attendance.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {defaulters.map((student) => (
                  <div key={student.id} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-destructive">!</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.rollNo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-destructive">{student.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}