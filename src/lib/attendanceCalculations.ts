// ✅ Google Sheets data se calculations
import { AttendanceRecord, MonthlyAttendance } from '@/types';

/**
 * Calculate monthly attendance statistics from Google Sheets records
 */
export const calculateMonthlyAttendance = (records: AttendanceRecord[]): MonthlyAttendance[] => {
  const monthMap = new Map<string, { present: number; absent: number; late: number }>();
  
  records.forEach(record => {
    const date = new Date(record.date);
    const monthKey = date.toLocaleString('en-US', { month: 'short' });
    
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { present: 0, absent: 0, late: 0 });
    }
    
    const monthData = monthMap.get(monthKey)!;
    if (record.status === 'present') monthData.present++;
    else if (record.status === 'absent') monthData.absent++;
    else if (record.status === 'late') monthData.late++;
  });
  
  // Convert to array with all months
  const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return allMonths.map(month => ({
    month,
    present: monthMap.get(month)?.present || 0,
    absent: monthMap.get(month)?.absent || 0,
    late: monthMap.get(month)?.late || 0,
  }));
};

/**
 * Calculate user statistics from attendance records
 */
export const calculateUserStats = (userRecords: AttendanceRecord[]) => {
  const totalDays = userRecords.length;
  const presentDays = userRecords.filter(r => r.status === 'present').length;
  const absentDays = userRecords.filter(r => r.status === 'absent').length;
  const lateDays = userRecords.filter(r => r.status === 'late').length;
  const percentage = totalDays > 0 
    ? Math.round(((presentDays + lateDays) / totalDays) * 100)
    : 0;

  return {
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    percentage,
    isDefaulter: percentage < 75,
  };
};
