import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { fetchFromGoogleSheet } from '@/lib/sheetService';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Loader2,
  Info
} from 'lucide-react';

interface SyncRecord {
  id: number;
  date: string;
  records: number;
  status: 'success' | 'partial' | 'failed';
}

// Helper function to extract sheet ID from URL
const extractSheetIdFromUrl = (url: string): string | null => {
  try {
    // Pattern: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit...
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

export default function AdminSync() {
  const [sheetUrl, setSheetUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncRecord[]>([
    { id: 1, date: '2024-12-20 10:30 AM', records: 8, status: 'success' },
    { id: 2, date: '2024-12-19 09:45 AM', records: 8, status: 'success' },
    { id: 3, date: '2024-12-18 10:00 AM', records: 7, status: 'partial' },
  ]);
  const { toast } = useToast();

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('google_sheets_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleSync = async () => {
    if (!sheetUrl.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a Google Sheet URL',
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
      // Extract Sheet ID from URL
      const sheetId = extractSheetIdFromUrl(sheetUrl);
      if (!sheetId) {
        throw new Error('Invalid Google Sheets URL. Please enter a valid URL.');
      }

      console.log(`🔍 Syncing sheet: ${sheetId}`);

      // Fetch data from Google Sheets
      const records = await fetchFromGoogleSheet(sheetId, apiKey);

      if (records.length === 0) {
        throw new Error('No attendance data found in the sheet.');
      }

      // Save to localStorage
      localStorage.setItem('global_sheet_id', sheetId);
      localStorage.setItem('google_sheets_api_key', apiKey);
      localStorage.setItem('synced_sheet_url', sheetUrl);
      

      // Add to sync history
      const newSync: SyncRecord = {
        id: syncHistory.length + 1,
        date: new Date().toLocaleString(),
        records: records.length,
        status: 'success',
      };
      setSyncHistory([newSync, ...syncHistory]);

      toast({
        title: 'Sync Successful! ✅',
        description: `Successfully synced ${records.length} attendance records from Google Sheets`,
      });

      console.log(`✅ Synced ${records.length} records`);
      window.location.reload();


      setSheetUrl('');
    } catch (error: any) {
      console.error('Sync error:', error);

      // Add failed sync to history
      const failedSync: SyncRecord = {
        id: syncHistory.length + 1,
        date: new Date().toLocaleString(),
        records: 0,
        status: 'failed',
      };
      setSyncHistory([failedSync, ...syncHistory]);

      toast({
        variant: 'destructive',
        title: 'Sync Failed ❌',
        description: error.message || 'Failed to sync attendance data. Please check your URL and API key.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter your API Key',
      });
      return;
    }

    localStorage.setItem('google_sheets_api_key', apiKey);
    toast({
      title: 'Saved',
      description: 'API Key saved securely in your browser',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 text-xs">Success</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Partial</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 text-xs">Failed</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in w-full">
      {/* Header */}
      <div className="px-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sync Attendance Data</h1>
        <p className="text-xs sm:text-base text-muted-foreground mt-1">
          Import attendance data from Google Sheets
        </p>
      </div>

      {/* Main Content - Stack on mobile, 2 cols on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Sync Configuration */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-lg sm:text-xl">Google Sheets Integration</CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Connect your Google Sheet to automatically sync attendance records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 flex gap-2">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-[10px] sm:text-xs text-blue-900">
                <p className="font-semibold mb-1">Setup Required:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Create a Google Sheets API key</li>
                  <li>Share your sheet with read access</li>
                  <li>Paste the sheet URL and API key below</li>
                </ol>
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <Label htmlFor="api-key" className="text-xs sm:text-sm">Google Sheets API Key</Label>
              <div className="flex gap-2 flex-col sm:flex-row">
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Your API key from Google Cloud Console"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="text-xs sm:text-sm"
                />
                <Button
                  variant="outline"
                  onClick={handleSaveApiKey}
                  disabled={!apiKey.trim()}
                  className="text-xs sm:text-sm w-full sm:w-auto"
                  size="sm"
                >
                  Save
                </Button>
              </div>
            </div>

            {/* Sheet URL Input */}
            <div className="space-y-2">
              <Label htmlFor="sheet-url" className="text-xs sm:text-sm">Google Sheet URL</Label>
              <Input
                id="sheet-url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                className="text-xs sm:text-sm"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Example: https://docs.google.com/spreadsheets/d/1x4I3J93pzExH_H0Gq7l4f89Ic1CtsmZLaiem-gBdTWg/edit
              </p>
            </div>

            {/* Sync Button */}
            <Button
              onClick={handleSync}
              disabled={isSyncing || !sheetUrl.trim() || !apiKey.trim()}
              className="w-full text-sm sm:text-base"
              size="sm"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>

            {/* Action Links */}
            <div className="flex gap-2 pt-2 flex-col sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex-1 text-xs sm:text-sm"
              >
                <a
                  href="https://docs.google.com/spreadsheets"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Open Sheets
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex-1 text-xs sm:text-sm"
              >
                <a
                  href="https://console.cloud.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Get API Key
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sync History */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Sync History</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Recent synchronization attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
              {syncHistory.length === 0 ? (
                <p className="text-xs sm:text-sm text-muted-foreground text-center py-8">
                  No sync history yet
                </p>
              ) : (
                syncHistory.map((sync) => (
                  <div
                    key={sync.id}
                    className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-slate-50 gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(sync.status)}
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{sync.date}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {sync.records} records synced
                          </p>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(sync.status)}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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