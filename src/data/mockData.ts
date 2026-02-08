// ⚠️ DEPRECATED - This file is no longer used
// All data is now fetched from Google Sheets via fetchAttendanceFromSheet()
// See: src/lib/sheetService.ts and src/lib/attendanceCalculations.ts

/**
 * @deprecated Use fetchAttendanceFromSheet() from '@/lib/sheetService'
 * @see {@link ../lib/sheetService.ts}
 */

import { AttendanceRecord, User, DashboardStats, MonthlyAttendance, StudentAttendance } from '@/types';

console.warn('⚠️ mockData.ts is deprecated. Please use Google Sheets API via sheetService.ts');

// This file kept for backward compatibility only
// All functions below return empty data

export const mockStudents: User[] = [];

export const mockAttendanceRecords: AttendanceRecord[] = [];

export const getTodayStats = (): DashboardStats => {
  console.warn('getTodayStats() is deprecated. Calculate from Google Sheets data.');
  return {
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    attendancePercentage: 0,
    averageAttendance: 0,
    defaulters: 0,
  };
};

export const getMonthlyAttendance = (): MonthlyAttendance[] => {
  console.warn('getMonthlyAttendance() is deprecated. Use calculateMonthlyAttendance() from attendanceCalculations.ts');
  return [];
};

export const getStudentAttendanceStats = (): StudentAttendance[] => {
  console.warn('getStudentAttendanceStats() is deprecated. Calculate from Google Sheets data.');
  return [];
};

export const getUserAttendance = (userId: string): AttendanceRecord[] => {
  console.warn('getUserAttendance() is deprecated. Filter Google Sheets data by userId/rollNo.');
  return [];
};

export const getUserStats = (userId: string) => {
  console.warn('getUserStats() is deprecated. Use calculateUserStats() from attendanceCalculations.ts');
  return {
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    percentage: 0,
    isDefaulter: false,
  };
};
