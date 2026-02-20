// Google Sheets API Service - Handles both manual and RFID data

import { AttendanceRecord } from '@/types';

interface SheetConfig {
  sheetId: string;
  apiKey: string;
  range: string;
}

const getSheetConfig = (): SheetConfig => {
  return {
    sheetId:
      localStorage.getItem('global_sheet_id') ||
      import.meta.env.VITE_GOOGLE_SHEET_ID ||
      '',
    apiKey:
      localStorage.getItem('global_api_key') ||
      import.meta.env.VITE_GOOGLE_SHEETS_API_KEY ||
      '',
    range: 'Sheet1!A2:F',
  };
};

// ✅ Student name to rollNo mapping (for RFID data conversion)
const nameToRollNoMap = new Map<string, string>([
  // Full names
  ['Tanmay Naigaonkar', 'ST001'],
  ['Vinayak Mankar', 'ST002'],
  ['Rohan Todkar', 'ST003'],
  ['Sakshi Upadhye', 'ST004'],
  ['Rahul Jain', 'ST005'],
  ['Rishikesh Nautiyal', 'ST006'],
  // First names only (common in RFID data)
  ['Rohan', 'ST003'],
  ['Sakshi', 'ST004'],
  ['Tanmay', 'ST001'],
  ['Vinayak', 'ST002'],
  ['Rahul', 'ST005'],
  ['Rishikesh', 'ST006'],
  // Lowercase variations
  ['rohan', 'ST003'],
  ['sakshi', 'ST004'],
  ['tanmay', 'ST001'],
  ['vinayak', 'ST002'],
  ['rahul', 'ST005'],
  ['rishikesh', 'ST006'],
]);

/**
 * Extract Sheet ID from a full Google Sheets URL
 */
export const extractSheetIdFromUrl = (url: string): string | null => {
  const matches = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return matches ? matches[1] : null;
};

/**
 * Parse RFID format (DATE | TIME | NAME)
 * Input: "30/04/2025 | 01:30:18 | Rohan"
 * Output: {date: "2025-04-30", time: "01:30:18", name: "Rohan"}
 */
const parseRFIDEntry = (row: string[]): { date: string; time: string; name: string } | null => {
  try {
    if (row.length < 3) return null;

    const dateStr = String(row[0] || '').trim();
    const timeStr = String(row[1] || '').trim();
    const nameStr = String(row[2] || '').trim();

    if (!dateStr || !timeStr || !nameStr) return null;

    // Parse DD/MM/YYYY to YYYY-MM-DD
    const [day, month, year] = dateStr.split('/');
    if (!day || !month || !year) return null;

    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    return {
      date: isoDate,
      time: timeStr,
      name: nameStr,
    };
  } catch (error) {
    console.warn('Error parsing RFID entry:', row, error);
    return null;
  }
};

/**
 * Parse manual format (ROLL_NO | NAME | DATE | TIME | STATUS | SOURCE)
 * Input: ["ST001", "Tanmay Naigaonkar", "2025-04-30", "08:00", "present", "google sheets"]
 */
const parseManualEntry = (row: string[]): { rollNo: string; name: string; date: string; time: string; status: string } | null => {
  try {
    if (row.length < 4) return null;

    const rollNo = String(row[0] || '').trim();
    const name = String(row[1] || '').trim();
    const date = String(row[2] || '').trim();
    const time = String(row[3] || '').trim();
    const status = String(row[4] || 'present').toLowerCase().trim();

    // Check if it's manual format (has ROLL_NO like ST001)
    if (rollNo.startsWith('ST') && !isNaN(parseInt(rollNo.substring(2)))) {
      return { rollNo, name, date, time, status };
    }

    return null;
  } catch (error) {
    console.warn('Error parsing manual entry:', row, error);
    return null;
  }
};

/**
 * Determine attendance status based on time
 * Before 08:30 = present
 * 08:30 - 09:00 = late
 * After 09:00 = absent (if not manually marked)
 */
const determineStatus = (time: string): 'present' | 'late' => {
  try {
    const [hour, minute] = time.split(':').map(Number);
    const timeInMinutes = hour * 60 + minute;
    const cutoff830 = 8 * 60 + 30;
    const cutoff900 = 9 * 60;

    if (timeInMinutes < cutoff830) return 'present';
    if (timeInMinutes < cutoff900) return 'late';
    return 'present'; // RFID data = attendance marked, so present
  } catch {
    return 'present';
  }
};

/**
 * Fetch and parse attendance data from Google Sheets
 * Handles both manual format (ST001 | Name | Date | Time | Status) and RFID format (Date | Time | Name)
 */
export const fetchFromGoogleSheet = async (
  sheetId: string,
  apiKey: string,
  range: string = 'Sheet1!A2:F'
): Promise<AttendanceRecord[]> => {
  try {
    if (!sheetId || !apiKey) {
      throw new Error('Missing VITE_GOOGLE_SHEET_ID or VITE_GOOGLE_SHEETS_API_KEY');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;

    console.log('🔍 Fetching from Google Sheets...');

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', data);
      throw new Error(`Sheet API error: ${data.error?.message}`);
    }

    const rows = data.values || [];
    console.log(`📊 Total rows: ${rows.length}`);

    if (rows.length === 0) {
      throw new Error('No data found in Google Sheet');
    }

    const records: AttendanceRecord[] = [];
    const processedKeys = new Set<string>(); // Track duplicates

    rows.forEach((row: string[], idx: number) => {
      if (!row || row.length < 3) return;

      // ✅ Try parsing as manual format first (ST001 | Name | Date | Time | Status)
      const manualEntry = parseManualEntry(row);
      if (manualEntry) {
        const key = `${manualEntry.rollNo}-${manualEntry.date}`;
        if (!processedKeys.has(key)) {
          processedKeys.add(key);
          records.push({
            id: `${manualEntry.rollNo}-${manualEntry.date}-${idx}`,
            studentId: manualEntry.rollNo,
            userId: manualEntry.rollNo,
            name: manualEntry.name,
            rollNo: manualEntry.rollNo,
            date: manualEntry.date,
            time: manualEntry.time,
            status: (manualEntry.status as 'present' | 'absent' | 'late'),
            source: 'google sheets',
          });
        }
        return;
      }

      // ✅ Try parsing as RFID format (Date | Time | Name)
      const rfidEntry = parseRFIDEntry(row);
      if (rfidEntry) {
        // Try exact match first, then lowercase
        let rollNo = nameToRollNoMap.get(rfidEntry.name);
        if (!rollNo) {
          rollNo = nameToRollNoMap.get(rfidEntry.name.toLowerCase());
        }

        if (rollNo) {
          const key = `${rollNo}-${rfidEntry.date}-${rfidEntry.time}`;
          if (!processedKeys.has(key)) {
            processedKeys.add(key);
            const status = determineStatus(rfidEntry.time);

            records.push({
              id: `${rollNo}-${rfidEntry.date}-${rfidEntry.time}-${idx}`,
              studentId: rollNo,
              userId: rollNo,
              name: rfidEntry.name,
              rollNo: rollNo,
              date: rfidEntry.date,
              time: rfidEntry.time,
              status: status,
              source: 'rfid',
            });
          }
        } else {
          console.warn(`⚠️ Student not found in name mapping: "${rfidEntry.name}". Please add to nameToRollNoMap in sheetService.ts`);
        }
      }
    });

    console.log(`✅ Parsed ${records.length} attendance records`);

    // Debug: Group by rollNo
    const rollNoMap = new Map<string, number>();
    records.forEach(r => {
      rollNoMap.set(r.rollNo, (rollNoMap.get(r.rollNo) || 0) + 1);
    });

    console.log('📋 Records per student:');
    rollNoMap.forEach((count, rollNo) => {
      console.log(`  ${rollNo}: ${count} records`);
    });

    return records;
  } catch (error) {
    console.error('❌ Error fetching from Google Sheets:', error);
    throw error;
  }
};

/**
 * Fetch attendance data using default config
 */
export const fetchAttendanceFromSheet = async (): Promise<AttendanceRecord[]> => {
  const config = getSheetConfig();
  return fetchFromGoogleSheet(config.sheetId, config.apiKey, config.range);
};


/**
 * Filter attendance records based on user role
 */
export const filterAttendanceByRole = (
  records: AttendanceRecord[],
  userRole: 'admin' | 'user',
  userId?: string,
  userRollNo?: string
): AttendanceRecord[] => {
  if (userRole === 'admin') {
    return records;
  } else if (userRole === 'user') {
    const matchRollNo = userRollNo || userId;
    return records.filter(record =>
      record.rollNo === matchRollNo ||
      record.userId === matchRollNo
    );
  }
  return [];
};

/**
 * Validate user has permission to view specific attendance record
 */
export const canViewAttendanceRecord = (
  record: AttendanceRecord,
  userRole: 'admin' | 'user',
  userId?: string,
  userRollNo?: string
): boolean => {
  if (userRole === 'admin') return true;
  if (userRole === 'user' && (userId || userRollNo)) {
    const matchRollNo = userRollNo || userId;
    return record.rollNo === matchRollNo || record.userId === matchRollNo;
  }
  return false;
};

export default {
  fetchFromGoogleSheet,
  fetchAttendanceFromSheet,
  filterAttendanceByRole,
  canViewAttendanceRecord,
};
/**
 * Fetch users from Google Sheets (Users tab)
 */
export const fetchUsersFromSheet = async (): Promise<
  { rollNo: string; name: string; email: string; password: string; role: 'admin' | 'user'; sheetId?: string }[]
> => {
  const config = getSheetConfig();

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${encodeURIComponent(
    'Users!A2:F'
  )}?key=${config.apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to fetch users');
  }

  const rows: string[][] = data.values || [];

  return rows.map(row => ({
    rollNo: row[0],
    name: row[1],
    email: row[2],
    password: row[3],
    role: (row[4] as 'admin' | 'user') || 'user',
    sheetId: row[5] || undefined,
  }));
};
