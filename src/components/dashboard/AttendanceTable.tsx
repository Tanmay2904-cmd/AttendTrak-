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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AttendanceRecord, AttendanceStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { filterAttendanceByRole, canViewAttendanceRecord } from '@/lib/sheetService';
import { Search, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

// Suppress Radix Select nesting warning (known issue, doesn't affect functionality)
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('validateDOMNesting')) {
      return;
    }
    originalError.call(console, ...args);
  };
}

interface AttendanceTableProps {
  records: AttendanceRecord[];
  showUserColumn?: boolean;
}

const ITEMS_PER_PAGE = 10;

export function AttendanceTable({ records, showUserColumn = true }: AttendanceTableProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Apply role-based filtering
  const roleBasedRecords = user 
    ? filterAttendanceByRole(records, user.role, user.uid, user.rollNo)
    : [];

  const filteredRecords = roleBasedRecords.filter(record => {
    const matchesSearch = 
      record.name.toLowerCase().includes(search.toLowerCase()) ||
      record.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      (typeof record.date === 'string' ? record.date.includes(search) : false);
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <Badge variant="present">Present</Badge>;
      case 'absent':
        return <Badge variant="absent">Absent</Badge>;
      case 'late':
        return <Badge variant="late">Late</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, roll no, or date..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as AttendanceStatus | 'all');
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="late">Late</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {showUserColumn && (
                <>
                  <TableHead>Name</TableHead>
                  <TableHead>Roll No</TableHead>
                </>
              )}
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={showUserColumn ? 6 : 4} 
                  className="text-center py-8 text-muted-foreground"
                >
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              paginatedRecords.map((record) => (
                <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                  {showUserColumn && (
                    <>
                      <TableCell className="font-medium">{record.name}</TableCell>
                      <TableCell className="text-muted-foreground">{record.rollNo}</TableCell>
                    </>
                  )}
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-muted-foreground">{record.time}</TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {record.source.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredRecords.length)} of{' '}
            {filteredRecords.length} records
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}