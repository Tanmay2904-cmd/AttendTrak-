import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AttendanceTable } from '@/components/dashboard/AttendanceTable';
import { AttendanceRecord } from '@/types';
import { FileSpreadsheet, Loader, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useClass } from '@/context/ClassContext';

export default function AdminAttendance() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedClass } = useClass();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAttendanceData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!selectedClass) {
          // If context is still loading, we might wait, but useClass has loading state.
          // If not loading and no class, show empty.
          setLoading(false);
          return;
        }

        console.log(`Loading attendance for: ${selectedClass.className}`);

        // Get attendance data
        const data: AttendanceRecord[] = JSON.parse(
          localStorage.getItem(`class_data_${selectedClass.id}`) || '[]'
        );

        if (!data || data.length === 0) {
          throw new Error(`No attendance data for ${selectedClass.className}. Click "Sync Now".`);
        }

        setRecords(data);
        console.log(`✅ Loaded ${data.length} records for ${selectedClass.className}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load attendance data';
        console.error('Error loading attendance data:', err);
        setError(errorMessage);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    loadAttendanceData();
  }, [user?.uid, selectedClass]);

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
    a.download = `attendance_${selectedClass?.className}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: 'Attendance data exported to CSV',
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
              <p className="text-muted-foreground">Loading attendance records...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
          <p className="text-muted-foreground mt-1">View and manage all attendance data</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive py-8">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
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
          <p className="text-muted-foreground mt-1">
            Class: <span className="font-semibold text-foreground">{selectedClass?.className || 'Select a class'}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={!records || records.length === 0}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export CSV
          </Button>

        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Attendance Records</CardTitle>
          <CardDescription>
            {records && records.length > 0
              ? `Showing ${records.length} records for ${selectedClass?.className}`
              : 'No attendance records available'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records && records.length > 0 ? (
            <div className="overflow-x-auto">
              <AttendanceTable records={records} />
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No attendance records available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}