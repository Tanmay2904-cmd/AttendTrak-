import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AttendanceTable } from '@/components/dashboard/AttendanceTable';
import { AttendanceLineChart } from '@/components/charts/AttendanceLineChart';
import { useAuth } from '@/context/AuthContext';
import { fetchFromGoogleSheet, fetchSheetNames, extractSheetIdFromUrl } from '@/lib/sheetService';
import { calculateMonthlyAttendance } from '@/lib/attendanceCalculations'; // ✅ Real calculations
import { AttendanceRecord, MonthlyAttendance } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Loader } from 'lucide-react';

export default function UserAttendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        setLoading(true);

        // ✅ Google Sheets se user ka data fetch kar
        const rawSheetId = user?.sheetUrl || import.meta.env.VITE_GOOGLE_SHEET_ID;
        const apiKey = user?.apiKey || import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

        if (!rawSheetId || !apiKey) {
          console.error("Missing sheet config");
          setLoading(false);
          return;
        }

        const sheetId = extractSheetIdFromUrl(rawSheetId) || rawSheetId;

        // Fetch all tabs
        let allRecords: AttendanceRecord[] = [];
        try {
          const tabs = await fetchSheetNames(sheetId, apiKey);
          if (tabs.length > 0) {
            const results = await Promise.allSettled(
              tabs.map(tab => fetchFromGoogleSheet(sheetId, apiKey, `${tab}!A2:F`))
            );
            results.forEach(result => {
              if (result.status === 'fulfilled') {
                allRecords = [...allRecords, ...result.value];
              }
            });
          }
        } catch (err) {
          console.warn('Tab fetch failed, falling back to single tab:', err);
        }

        if (allRecords.length === 0) {
          allRecords = await fetchFromGoogleSheet(sheetId, apiKey);
        }

        // Filter by user's rollNo
        const userRollNo = user?.rollNo;
        if (!userRollNo) {
          console.error('User roll number not found');
          setLoading(false);
          return;
        }

        const userRecords = allRecords.filter(record => record.rollNo === userRollNo);
        setAttendance(userRecords);

        // ✅ Calculate monthly data from user's records
        const monthly = calculateMonthlyAttendance(userRecords);
        setMonthlyData(monthly);
      } catch (error) {
        console.error('Error loading attendance:', error);
        setAttendance([]);
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, [user?.rollNo]);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
          <p className="text-muted-foreground mt-1">View your complete attendance history</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin mr-2" />
              <p className="text-muted-foreground">Loading your attendance data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground mt-1">View your complete attendance history</p>
      </div>

      {/* Security Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-blue-900">
          <strong>Protected Data:</strong> You can only view your own attendance records.
          All data is encrypted and only accessible to authorized users.
        </AlertDescription>
      </Alert>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trend</CardTitle>
          <CardDescription>Your attendance pattern over the months</CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceLineChart data={monthlyData} />
        </CardContent>
      </Card>

      {/* Full Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>
            Complete record of your attendance ({attendance.length} entries)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendance.length > 0 ? (
            <AttendanceTable records={attendance} showUserColumn={false} />
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No attendance records found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}