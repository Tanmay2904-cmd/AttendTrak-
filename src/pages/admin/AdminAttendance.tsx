import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AttendanceTable } from '@/components/dashboard/AttendanceTable';
import { AttendanceRecord } from '@/types';
import { Download, FileSpreadsheet, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchAttendanceFromSheet } from '@/lib/sheetService'; // ✅ Add this

export default function AdminAttendance() {
  const { toast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch from Google Sheets
  useEffect(() => {
    const loadAttendanceData = async () => {
      try {
        setLoading(true);
        const data = await fetchAttendanceFromSheet(); // ✅ Google Sheets se fetch kar
        setRecords(data);
        console.log(`✅ Loaded ${data.length} attendance records`);
      } catch (error) {
        console.error('Error loading attendance data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load attendance data from Google Sheets',
        });
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    loadAttendanceData();
  }, [toast]);

  const exportCSV = () => {
    if (!records || records.length === 0) {
      toast({
        title: 'No Data',
        description: 'No attendance records to export',
      });
      return;
    }

    const headers = ['Name', 'Roll No', 'Date', 'Time', 'Status', 'Source'];
    const csvContent = [
      headers.join(','),
      ...records.map(record => 
        [record.name, record.rollNo, record.date, record.time, record.status, record.source].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: 'Attendance data exported to CSV',
    });
  };

  const exportPDF = () => {
    toast({
      title: 'PDF Export',
      description: 'PDF export functionality coming soon',
    });
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
          <p className="text-muted-foreground mt-1">View and manage all attendance data</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin mr-2" />
              <p className="text-muted-foreground">Loading attendance records from Google Sheets...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
          <p className="text-muted-foreground mt-1">View and manage all attendance data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={!records || records.length === 0}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Attendance Records</CardTitle>
          <CardDescription>
            {records && records.length > 0 
              ? `Showing ${records.length} records from Google Sheets`
              : 'No attendance records available'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records && records.length > 0 ? (
            <AttendanceTable records={records} />
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No attendance records available. Check your Google Sheets connection.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}