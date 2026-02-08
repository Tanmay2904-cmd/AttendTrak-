import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, Bell, Shield, Database, Globe } from 'lucide-react';

export default function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    defaulterThreshold: 75,
    autoSync: true,
    syncInterval: 60,
    emailNotifications: true,
    pushNotifications: false,
  });

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your preferences have been updated successfully.',
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your attendance management system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>Attendance Rules</CardTitle>
            </div>
            <CardDescription>Configure attendance thresholds and rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="threshold">Defaulter Threshold (%)</Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                max="100"
                value={settings.defaulterThreshold}
                onChange={(e) => setSettings({ ...settings, defaulterThreshold: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Students below this attendance percentage will be marked as defaulters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sync Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <CardTitle>Sync Settings</CardTitle>
            </div>
            <CardDescription>Configure Google Sheets synchronization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Sync</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically sync data from Google Sheets
                </p>
              </div>
              <Switch
                checked={settings.autoSync}
                onCheckedChange={(checked) => setSettings({ ...settings, autoSync: checked })}
              />
            </div>

            {settings.autoSync && (
              <div className="space-y-2">
                <Label htmlFor="interval">Sync Interval (minutes)</Label>
                <Input
                  id="interval"
                  type="number"
                  min="5"
                  max="1440"
                  value={settings.syncInterval}
                  onChange={(e) => setSettings({ ...settings, syncInterval: parseInt(e.target.value) })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Manage notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive daily attendance reports via email
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Get instant alerts for defaulters
                </p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Firebase Config */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <CardTitle>Firebase Configuration</CardTitle>
            </div>
            <CardDescription>Backend configuration status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-sm font-medium text-warning">Demo Mode Active</p>
              <p className="text-xs text-muted-foreground mt-1">
                This application is running with mock data. To enable full functionality:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>1. Set up a Firebase project</li>
                <li>2. Configure Firebase Authentication</li>
                <li>3. Set up Firestore database</li>
                <li>4. Deploy security rules</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
