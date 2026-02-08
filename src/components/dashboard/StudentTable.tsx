import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { StudentAttendance } from '@/types';
import { Search, AlertTriangle } from 'lucide-react';

interface StudentTableProps {
  students: StudentAttendance[];
}

export function StudentTable({ students }: StudentTableProps) {
  const [search, setSearch] = useState('');

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Student</TableHead>
              <TableHead>Roll No</TableHead>
              <TableHead className="text-center">Present</TableHead>
              <TableHead className="text-center">Absent</TableHead>
              <TableHead className="text-center">Late</TableHead>
              <TableHead>Attendance %</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student, index) => (
              <TableRow 
                key={student.id || `${student.rollNo}-${index}`} 
                className="hover:bg-muted/30 transition-colors"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {student.name}
                    {student.isDefaulter && (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{student.rollNo}</TableCell>
                <TableCell className="text-center">
                  <span className="text-success font-medium">{student.presentDays}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-destructive font-medium">{student.absentDays}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-warning font-medium">{student.lateDays}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <Progress 
                      value={student.percentage} 
                      className="h-2"
                    />
                    <span className="text-sm font-medium w-12">
                      {student.percentage}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {student.isDefaulter ? (
                    <Badge variant="danger">Defaulter</Badge>
                  ) : (
                    <Badge variant="success">Regular</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}