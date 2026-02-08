import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StudentTable } from '@/components/dashboard/StudentTable';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { StudentAttendance, AttendanceRecord } from '@/types';
import { fetchAttendanceFromSheet } from '@/lib/sheetService';

export default function AdminStudents() {
  const [studentStats, setStudentStats] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        setLoading(true);
        
        // ✅ Fetch attendance records from Google Sheets
        const attendanceRecords: AttendanceRecord[] = await fetchAttendanceFromSheet();
        
        if (!attendanceRecords || attendanceRecords.length === 0) {
          throw new Error('No attendance data found in Google Sheets');
        }

        // ✅ GROUP BY ROLL_NO (unique students)
        const studentMap = new Map<string, {
          rollNo: string;
          name: string;
          presentDays: number;
          absentDays: number;
          lateDays: number;
        }>();

        attendanceRecords.forEach((record) => {
          const key = record.rollNo;
          
          // ✅ Create student entry ONCE
          if (!studentMap.has(key)) {
            studentMap.set(key, {
              rollNo: record.rollNo,
              name: record.name,
              presentDays: 0,
              absentDays: 0,
              lateDays: 0,
            });
          }
          
          // ✅ Add attendance counts
          const student = studentMap.get(key)!;
          if (record.status === 'present') student.presentDays++;
          else if (record.status === 'absent') student.absentDays++;
          else if (record.status === 'late') student.lateDays++;
        });

        // ✅ Calculate percentages & convert to StudentAttendance
        const students: StudentAttendance[] = Array.from(studentMap.values())
          .map((student, index) => {
            const total = student.presentDays + student.absentDays + student.lateDays;
            const percentage = total > 0
              ? Math.round(((student.presentDays + student.lateDays) / total) * 100)
              : 0;
            const isDefaulter = percentage < 75;

            return {
              id: student.rollNo, // ✅ Use rollNo as ID (unique)
              name: student.name,
              email: `${student.name.toLowerCase().replace(/\s+/g, '.')}@school.edu`,
              rollNo: student.rollNo,
              presentDays: student.presentDays,
              absentDays: student.absentDays,
              lateDays: student.lateDays,
              percentage: percentage,
              isDefaulter: isDefaulter,
              status: isDefaulter ? 'Defaulter' : 'Regular',
              attendance: percentage,
              userId: student.rollNo,
            };
          });

        setStudentStats(students);
        setError(null);
        
        console.log(`✅ Loaded ${students.length} unique students with attendance data`);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load student data');
        setStudentStats([]);
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
          <p className="text-muted-foreground mt-1">View student attendance statistics and identify defaulters</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin mr-2" />
              <p className="text-muted-foreground">Loading student data from Google Sheets...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
          <p className="text-muted-foreground mt-1">View student attendance statistics and identify defaulters</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive font-medium">Error: {error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Make sure your Google Sheets is properly formatted and sheetService.ts is configured correctly
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const defaulters = studentStats.filter(s => s.isDefaulter);
  const regular = studentStats.filter(s => !s.isDefaulter);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
        <p className="text-muted-foreground mt-1">View student attendance statistics and identify defaulters</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-success/20 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Regular Students</p>
                <p className="text-3xl font-bold text-success">{regular.length}</p>
                <p className="text-sm text-muted-foreground">75% or above attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-destructive/10">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Defaulters</p>
                <p className="text-3xl font-bold text-destructive">{defaulters.length}</p>
                <p className="text-sm text-muted-foreground">Below 75% attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Defaulters Alert */}
      {defaulters.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <CardTitle className="text-lg">Defaulter Alert</CardTitle>
            </div>
            <CardDescription>
              The following students have attendance below 75% and require attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {defaulters.map(student => (
                <Badge key={student.id} variant="warning" className="px-3 py-1">
                  {student.rollNo} ({student.name}) - {student.percentage}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Student Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>
            {studentStats.length > 0 
              ? `Complete attendance statistics for ${studentStats.length} enrolled students from Google Sheets`
              : 'No student data available. Check your Google Sheets connection.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {studentStats.length > 0 ? (
            <StudentTable students={studentStats} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No student data available</p>
              <p className="text-sm">Verify your Google Sheets and API Key configuration</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}