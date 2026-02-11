import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { fetchFromGoogleSheet } from '@/lib/sheetService';
import { useAuth } from '@/context/AuthContext';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Loader2,
  Info,
  Trash2,
  Plus
} from 'lucide-react';

interface SyncRecord {
  id: number;
  date: string;
  records: number;
  status: 'success' | 'partial' | 'failed';
}

interface ClassSheet {
  id: string;
  adminId: string;
  className: string;
  sheetId: string;
  sheetUrl: string;
  lastSyncedAt: string;
  recordsCount: number;
  isAutoSync: boolean;
}

// Helper function to extract sheet ID from URL
const extractSheetIdFromUrl = (url: string): string | null => {
  try {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

export default function AdminSync() {
  const { user, isSuperAdmin } = useAuth();
  const [sheetUrl, setSheetUrl] = useState('');
  const [className, setClassName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncRecord[]>([
    { id: 1, date: '2024-12-20 10:30 AM', records: 8, status: 'success' },
    { id: 2, date: '2024-12-19 09:45 AM', records: 8, status: 'success' },
    { id: 3, date: '2024-12-18 10:00 AM', records: 7, status: 'partial' },
  ]);
  const [classSheets, setClassSheets] = useState<ClassSheet[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedClassData, setSelectedClassData] = useState<any[]>([]);
  const { toast } = useToast();

  // Load data on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('google_sheets_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }

    loadClassSheets();

    // Setup auto-sync interval (every 5 minutes)
    const autoSyncInterval = setInterval(() => {
      handleAutoSync();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(autoSyncInterval);
  }, [user?.uid]);

  const loadClassSheets = () => {
    const sheets: ClassSheet[] = JSON.parse(
      localStorage.getItem(`class_sheets_${user?.uid}`) || '[]'
    );
    setClassSheets(sheets);

    // Auto-select first class
    if (sheets.length > 0 && !selectedClass) {
      setSelectedClass(sheets[0].id);
      localStorage.setItem('current_selected_class', sheets[0].id); // ✅ SET HERE
      loadClassData(sheets[0].id);
    }
  };

  const handleAddClass = async () => {
    if (!sheetUrl.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a Google Sheet URL',
      });
      return;
    }

    if (!className.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter class name',
      });
      return;
    }

    if (!apiKey.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter your Google Sheets API Key',
      });
      return;
    }

    setIsSyncing(true);

    try {
      const sheetId = extractSheetIdFromUrl(sheetUrl);
      if (!sheetId) {
        throw new Error('Invalid Google Sheets URL');
      }

      console.log(`🔍 Syncing sheet: ${sheetId}`);

      // Fetch data from Google Sheets
      const records = await fetchFromGoogleSheet(sheetId, apiKey);

      if (records.length === 0) {
        throw new Error('No attendance data found in the sheet.');
      }

      // Save API key
      localStorage.setItem('google_sheets_api_key', apiKey);

      // Create new class sheet
      const newClassSheet: ClassSheet = {
        id: `class-${Date.now()}`,
        adminId: user?.uid || '',
        className: className,
        sheetId: sheetId,
        sheetUrl: sheetUrl,
        lastSyncedAt: new Date().toLocaleString(),
        recordsCount: records.length,
        isAutoSync: true, // Enable auto-sync by default
      };

      // Save class sheet
      const updated = [...classSheets, newClassSheet];
      localStorage.setItem(`class_sheets_${user?.uid}`, JSON.stringify(updated));
      
      // Save class data
      localStorage.setItem(
        `class_data_${newClassSheet.id}`,
        JSON.stringify(records)
      );

      setClassSheets(updated);
      setSelectedClass(newClassSheet.id);
      localStorage.setItem('current_selected_class', newClassSheet.id); // ✅ SET HERE

      // Add to sync history
      const newSync: SyncRecord = {
        id: syncHistory.length + 1,
        date: new Date().toLocaleString(),
        records: records.length,
        status: 'success',
      };
      setSyncHistory([newSync, ...syncHistory]);

      toast({
        title: 'Class Added! ✅',
        description: `${className} with ${records.length} records added successfully`,
      });

      // Reset form
      setSheetUrl('');
      setClassName('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAutoSync = async () => {
    for (const sheet of classSheets) {
      if (sheet.isAutoSync && apiKey) {
        try {
          const records = await fetchFromGoogleSheet(sheet.sheetId, apiKey);
          localStorage.setItem(`class_data_${sheet.id}`, JSON.stringify(records));

          // Update last synced time
          const updated = classSheets.map(s =>
            s.id === sheet.id
              ? { ...s, lastSyncedAt: new Date().toLocaleString(), recordsCount: records.length }
              : s
          );
          localStorage.setItem(`class_sheets_${user?.uid}`, JSON.stringify(updated));
          setClassSheets(updated);

          console.log(`✅ Auto-synced ${sheet.className}: ${records.length} records`);
        } catch (error) {
          console.error(`❌ Auto-sync failed for ${sheet.className}:`, error);
        }
      }
    }
  };

  const loadClassData = (classId: string) => {
    const data = JSON.parse(localStorage.getItem(`class_data_${classId}`) || '[]');
    setSelectedClassData(data);
  };

  const handleManualSync = async (classId: string) => {
    const sheet = classSheets.find(s => s.id === classId);
    if (!sheet || !apiKey) return;

    try {
      const records = await fetchFromGoogleSheet(sheet.sheetId, apiKey);
      localStorage.setItem(`class_data_${classId}`, JSON.stringify(records));

      const updated = classSheets.map(s =>
        s.id === classId
          ? { ...s, lastSyncedAt: new Date().toLocaleString(), recordsCount: records.length }
          : s
      );
      localStorage.setItem(`class_sheets_${user?.uid}`, JSON.stringify(updated));
      setClassSheets(updated);
      loadClassData(classId);

      toast({
        title: 'Synced! ✅',
        description: `${sheet.className}: ${records.length} records`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sync',
      });
    }
  };

  const handleDeleteClass = (classId: string) => {
    const updated = classSheets.filter(s => s.id !== classId);
    localStorage.setItem(`class_sheets_${user?.uid}`, JSON.stringify(updated));
    localStorage.removeItem(`class_data_${classId}`);
    setClassSheets(updated);

    if (selectedClass === classId) {
      setSelectedClass(updated.length > 0 ? updated[0].id : '');
      if (updated.length > 0) {
        localStorage.setItem('current_selected_class', updated[0].id); // ✅ SET HERE
        loadClassData(updated[0].id);
      }
    }

    toast({
      title: 'Class Removed',
    });
  };

  const toggleAutoSync = (classId: string) => {
    const updated = classSheets.map(s =>
      s.id === classId ? { ...s, isAutoSync: !s.isAutoSync } : s
    );
    localStorage.setItem(`class_sheets_${user?.uid}`, JSON.stringify(updated));
    setClassSheets(updated);

    toast({
      title: 'Updated',
      description: `Auto-sync ${updated.find(s => s.id === classId)?.isAutoSync ? 'enabled' : 'disabled'}`,
    });
  };

  // Super Admin view
  if (isSuperAdmin) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-fade-in w-full">
        <div className="px-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sync Management (Super Admin)</h1>
          <p className="text-xs sm:text-base text-muted-foreground mt-1">
            View all synced classes from teachers
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Teacher Classes</CardTitle>
            <CardDescription>Classes synced by all teachers</CardDescription>
          </CardHeader>
          <CardContent>
            {classSheets.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No classes synced yet</p>
            ) : (
              <div className="space-y-3">
                {classSheets.map((sheet) => (
                  <div key={sheet.id} className="border p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{sheet.className}</p>
                        <p className="text-sm text-muted-foreground">Teacher ID: {sheet.adminId}</p>
                      </div>
                      <Badge variant="outline">{sheet.recordsCount} records</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Last synced: {sheet.lastSyncedAt}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Regular Teacher view
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in w-full">
      {/* Header */}
      <div className="px-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Manage Classes</h1>
        <p className="text-xs sm:text-base text-muted-foreground mt-1">
          Add and manage multiple Google Sheets for different classes
        </p>
      </div>

      {/* Add New Class */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Class
          </CardTitle>
          <CardDescription>Connect a Google Sheet for a class</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Add your class's Google Sheet:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-xs">
                <li>Create Google Sheet with attendance data</li>
                <li>Get API Key from Google Cloud Console</li>
                <li>Share sheet link below</li>
              </ol>
            </div>
          </div>

          <div>
            <Label>Class Name (e.g., 10-A, 12-B)</Label>
            <Input
              placeholder="Class name"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
          </div>

          <div>
            <Label>Google Sheet URL</Label>
            <Input
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
            />
          </div>

          <div>
            <Label>API Key</Label>
            <div className="flex gap-2 flex-col sm:flex-row">
              <Input
                type="password"
                placeholder="Your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => localStorage.setItem('google_sheets_api_key', apiKey)}
                className="w-full sm:w-auto"
              >
                Save Key
              </Button>
            </div>
          </div>

          <Button
            onClick={handleAddClass}
            disabled={isSyncing}
            className="w-full"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Classes List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Classes ({classSheets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {classSheets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No classes added yet</p>
          ) : (
            <div className="space-y-3">
              {classSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className={`border p-4 rounded-lg cursor-pointer transition ${
                    selectedClass === sheet.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    setSelectedClass(sheet.id);
                    localStorage.setItem('current_selected_class', sheet.id); // ✅ SET HERE
                    loadClassData(sheet.id);
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-lg">{sheet.className}</p>
                      <p className="text-sm text-muted-foreground">
                        Last synced: {sheet.lastSyncedAt}
                      </p>
                    </div>
                    <Badge variant="outline">{sheet.recordsCount} records</Badge>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleManualSync(sheet.id);
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Sync Now
                    </Button>

                    <Button
                      variant={sheet.isAutoSync ? 'default' : 'outline'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAutoSync(sheet.id);
                      }}
                    >
                      Auto Sync {sheet.isAutoSync ? '✓' : '✗'}
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(sheet.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Class Data */}
      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle>
              {classSheets.find(s => s.id === selectedClass)?.className} Attendance
            </CardTitle>
            <CardDescription>
              {selectedClassData.length} records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Roll No</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedClassData.slice(0, 50).map((record, idx) => (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="p-2">{record.rollNo}</td>
                      <td className="p-2">{record.name}</td>
                      <td className="p-2">{record.date}</td>
                      <td className="p-2">{record.time}</td>
                      <td className="p-2">
                        <Badge
                          variant={
                            record.status === 'present'
                              ? 'default'
                              : record.status === 'late'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {record.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Guide */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">Setup Guide</CardTitle>
          <CardDescription className="text-xs sm:text-sm">How to connect Google Sheets with AttendTrack</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h3 className="font-semibold text-sm sm:text-base mb-2">Step 1: Create Google Sheet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                Create a Google Sheet with attendance data in one of these formats:
              </p>
              
              {/* Manual Format */}
              <div className="bg-slate-100 p-2 sm:p-3 rounded text-[10px] sm:text-xs font-mono overflow-x-auto mb-3">
                <p className="font-semibold mb-2 text-slate-700">Format 1: Manual Entry</p>
                <div className="bg-white p-2 rounded mb-2 overflow-x-auto">
                  <div className="font-bold text-slate-600 mb-1 whitespace-nowrap">
                    ROLL_NO | NAME | DATE | TIME | STATUS
                  </div>
                  <div className="text-slate-500 space-y-0.5">
                    <div className="whitespace-nowrap">ST001 | Tanmay | 2026-01-31 | 08:00 | present</div>
                    <div className="whitespace-nowrap">ST002 | Vinayak | 2026-01-31 | 08:15 | present</div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600">✅ Format: YYYY-MM-DD | Status: present/absent/late</p>
              </div>

              {/* RFID Format */}
              <div className="bg-blue-50 p-2 sm:p-3 rounded text-[10px] sm:text-xs font-mono overflow-x-auto">
                <p className="font-semibold mb-2 text-blue-700">Format 2: RFID System</p>
                <div className="bg-white p-2 rounded mb-2 overflow-x-auto">
                  <div className="font-bold text-blue-600 mb-1 whitespace-nowrap">
                    DATE | TIME | NAME
                  </div>
                  <div className="text-blue-500 space-y-0.5">
                    <div className="whitespace-nowrap">30/04/2025 | 01:30:18 | Rohan</div>
                    <div className="whitespace-nowrap">30/04/2025 | 02:41:07 | Sakshi</div>
                  </div>
                </div>
                <p className="text-[10px] text-blue-600">
                  ✅ Auto-converts | Before 8:30 AM = Present, 8:30-9:00 AM = Late
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <h3 className="font-semibold text-sm mb-2">Step 2: Get API Key</h3>
                <Button variant="outline" size="sm" asChild className="w-full text-xs sm:text-sm">
                  <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">
                    Open Google Cloud Console
                  </a>
                </Button>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-2">Step 3: Share Sheet</h3>
                <p className="text-xs text-muted-foreground">
                  Set &quot;Anyone with the link can view&quot;
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 sm:p-3">
              <p className="text-[10px] sm:text-xs text-yellow-900">
                <strong>Note:</strong> Your API key is stored locally in your browser.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}