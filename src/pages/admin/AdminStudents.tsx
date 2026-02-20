import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useClass } from '@/context/ClassContext';
import { AttendanceRecord } from '@/types';
import { Search, User, UserX, AlertCircle } from 'lucide-react';

interface StudentStat {
  rollNo: string;
  name: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

export default function AdminStudents() {
  const { selectedClass, selectedClassId } = useClass();
  const [students, setStudents] = useState<StudentStat[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentStat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedClassId) {
      loadStudentData();
    } else {
      setStudents([]);
      setFilteredStudents([]);
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      setFilteredStudents(
        students.filter(
          (s) =>
            s.name.toLowerCase().includes(lowerQuery) ||
            s.rollNo.toString().toLowerCase().includes(lowerQuery)
        )
      );
    }
  }, [searchQuery, students]);

  const loadStudentData = () => {
    try {
      setLoading(true);
      const data: AttendanceRecord[] = JSON.parse(
        localStorage.getItem(`class_data_${selectedClassId}`) || '[]'
      );

      // Group by Roll No (or Name if Roll No isn't unique enough, but Roll No should be key)
      // We assume Roll No + Name is unique enough for display.
      const studentMap = new Map<string, StudentStat>();

      data.forEach((record) => {
        // Create a unique key for the student (RollNo)
        const key = record.rollNo;

        if (!studentMap.has(key)) {
          studentMap.set(key, {
            rollNo: record.rollNo,
            name: record.name,
            present: 0,
            absent: 0,
            late: 0,
            total: 0,
            percentage: 0,
          });
        }

        const stats = studentMap.get(key)!;
        stats.total += 1;
        if (record.status === 'present') stats.present += 1;
        else if (record.status === 'absent') stats.absent += 1;
        else if (record.status === 'late') stats.late += 1;
      });

      // Calculate percentages
      const statsArray = Array.from(studentMap.values()).map(s => ({
        ...s,
        percentage: s.total > 0 ? Math.round(((s.present + (s.late * 0.5)) / s.total) * 100) : 0
      }));

      // Sort by Roll No
      statsArray.sort((a, b) => {
        // Try numeric sort if possible
        const rollA = parseInt(a.rollNo);
        const rollB = parseInt(b.rollNo);
        if (!isNaN(rollA) && !isNaN(rollB)) return rollA - rollB;
        return a.rollNo.localeCompare(b.rollNo);
      });

      setStudents(statsArray);
      setFilteredStudents(statsArray);
    } catch (error) {
      console.error("Error loading student data", error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedClassId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-[50vh]">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">No Class Selected</h2>
        <p className="text-muted-foreground">Please select a class from the top bar to view students.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-1">
            Analyzing {students.length} students in <span className="font-semibold text-foreground">{selectedClass?.className}</span>
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or roll no..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Performance</CardTitle>
          <CardDescription>Aggregate attendance statistics for each student</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No student data found for this class. Try syncing attendance first.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Roll No</th>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-center p-3 font-medium">Attendance %</th>
                    <th className="text-center p-3 font-medium">Present</th>
                    <th className="text-center p-3 font-medium">Absent</th>
                    <th className="text-center p-3 font-medium">Late</th>
                    <th className="text-left p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.rollNo} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3 font-medium">{student.rollNo}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {student.name.substring(0, 2).toUpperCase()}
                          </div>
                          {student.name}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={student.percentage < 75 ? "destructive" : "outline"} className={student.percentage >= 75 ? "bg-green-50 text-green-700 hover:bg-green-100 border-green-200" : ""}>
                          {student.percentage}%
                        </Badge>
                      </td>
                      <td className="p-3 text-center text-green-600">{student.present}</td>
                      <td className="p-3 text-center text-red-600">{student.absent}</td>
                      <td className="p-3 text-center text-yellow-600">{student.late}</td>
                      <td className="p-3">
                        {student.percentage < 75 ? (
                          <div className="flex items-center text-destructive text-xs font-medium">
                            <UserX className="w-3 h-3 mr-1" /> Defaulter
                          </div>
                        ) : (
                          <div className="flex items-center text-green-600 text-xs font-medium">
                            <User className="w-3 h-3 mr-1" /> Regular
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}