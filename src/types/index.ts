export interface Student {
  id: string;
  name: string;
  email: string;
  attendance: number;
}

export interface Attendance {
  id: string;
  studentId: string;
  date: Date;
  status: 'present' | 'absent' | 'late';
}

export interface User {
  id?: string;
  uid?: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'super_admin';
  rollNo?: string;
  createdAt?: string;
  sheetUrl?: string;
  apiKey?: string;
  className?: string;
  isApproved?: boolean;
}

export type UserRole = 'admin' | 'user' | 'super_admin';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token?: string | null;
}

export interface AttendanceRecord {
  id: string;
  studentId?: string;
  userId?: string;
  name: string;
  rollNo: string;
  date: Date | string;
  time: string;
  status: AttendanceStatus;
  source: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface MonthlyAttendance {
  month: string;
  present: number;
  absent: number;
  late: number;
}

export interface StudentAttendance {
  id: string;
  name: string;
  email: string;
  attendance: number;
  status: 'Regular' | 'Defaulter';
  userId?: string;
  rollNo?: string;
  presentDays?: number;
  absentDays?: number;
  lateDays?: number;
  percentage?: number;
  isDefaulter?: boolean;
}

export interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendancePercentage: number;
  averageAttendance: number;
  defaulters: number;
}

export interface ClassSheet {
  id: string;
  className: string;
  recordsCount: number;
  sheetId?: string;
  sheetUrl?: string;
  adminId?: string;
  lastSyncedAt?: string;
  isAutoSync?: boolean;
}
