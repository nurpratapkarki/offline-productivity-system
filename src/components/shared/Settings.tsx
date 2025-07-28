import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Palette,
  Bell,
  Shield,
  Database,
  Cloud,
  Timer,
  Info,
  LogOut,
  Trash2,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX
} from 'lucide-react';
import { authService } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/stores/appStore';
import { backupService } from '@/services/backup';
import DataManager from './DataManager';
import BackupManager from './BackupManager';

interface SettingsProps {
  onClose?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { toast } = useToast();
  const { updatePomodoroSettings } = useAppStore();
  const { theme, setTheme } = useTheme();
  const defaultSettings = {
    // Appearance
    theme: 'system',
    fontSize: 'medium',
    compactMode: false,

    // Notifications
    enableNotifications: true,
    pomodoroNotifications: true,
    taskReminders: true,
    soundEnabled: true,

    // Pomodoro
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStartBreaks: false,
    autoStartPomodoros: false,

    // Privacy & Security
    autoLock: false,
    autoLockDuration: 15,
    encryptNotesByDefault: false,

    // Backup & Sync
    autoBackup: false,
    backupFrequency: 'daily',
    syncOnStartup: true,
  };

  const [settings, setSettings] = useState(defaultSettings);

  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('focusflow-settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        const loadedSettings = { ...defaultSettings, ...parsedSettings };
        setSettings(loadedSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);



  const handleSettingChange = (key: string, value: any) => {
    const newSettings = {
      ...settings,
      [key]: value
    };

    setSettings(newSettings);

    // Save to localStorage
    localStorage.setItem('focusflow-settings', JSON.stringify(newSettings));

    // Dispatch custom event to notify other components of settings change
    window.dispatchEvent(new CustomEvent('focusflow-settings-changed', {
      detail: { key, value, settings: newSettings }
    }));

    // Update theme if theme setting changed
    if (key === 'theme') {
      setTheme(value);
    }

    // Update Pomodoro timer settings if relevant
    if (['workDuration', 'shortBreakDuration', 'longBreakDuration', 'autoStartBreaks', 'autoStartPomodoros'].includes(key)) {
      updatePomodoroSettings({
        workDuration: key === 'workDuration' ? value : newSettings.workDuration,
        breakDuration: key === 'shortBreakDuration' ? value : newSettings.shortBreakDuration,
        longBreakDuration: key === 'longBreakDuration' ? value : newSettings.longBreakDuration,
        autoStartBreaks: key === 'autoStartBreaks' ? value : newSettings.autoStartBreaks,
        autoStartPomodoros: key === 'autoStartPomodoros' ? value : newSettings.autoStartPomodoros,
      });
    }

    // Handle auto backup settings
    if (key === 'autoBackup' || key === 'backupFrequency') {
      if (newSettings.autoBackup) {
        // Convert frequency to minutes
        const frequencyToMinutes = {
          'hourly': 60,
          'daily': 24 * 60,
          'weekly': 7 * 24 * 60
        };

        const intervalMinutes = frequencyToMinutes[newSettings.backupFrequency as keyof typeof frequencyToMinutes] || 60;

        try {
          backupService.startAutoBackup(intervalMinutes);
          console.log(`Auto backup started with ${intervalMinutes} minute interval`);
        } catch (error) {
          console.error('Failed to start auto backup:', error);
          toast({
            title: 'Auto Backup Error',
            description: 'Failed to start automatic backups. Please check your Google Drive connection.',
            variant: 'destructive',
          });
        }
      } else {
        backupService.stopAutoBackup();
        console.log('Auto backup stopped');
      }
    }

    // Request notification permission if notifications are being enabled
    if ((key === 'enableNotifications' || key === 'pomodoroNotifications') && value === true) {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  const resetSettings = () => {
    localStorage.removeItem('focusflow-settings');
    setSettings(defaultSettings);

    // Reset theme to default
    setTheme(defaultSettings.theme);

    // Reset Pomodoro timer settings
    updatePomodoroSettings({
      workDuration: defaultSettings.workDuration,
      breakDuration: defaultSettings.shortBreakDuration,
      longBreakDuration: defaultSettings.longBreakDuration,
      autoStartBreaks: defaultSettings.autoStartBreaks,
      autoStartPomodoros: defaultSettings.autoStartPomodoros,
    });

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('focusflow-settings-changed', {
      detail: { settings: defaultSettings }
    }));

    toast({
      title: "Settings Reset",
      description: "All settings have been reset to default values."
    });
  };

  const currentUser = authService.getUser();
  const isDemoMode = authService.isDemoMode();

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="productivity" className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            <span className="hidden sm:inline">Productivity</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for important events
                  </p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => handleSettingChange('enableNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Pomodoro Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when pomodoro sessions end
                  </p>
                </div>
                <Switch
                  checked={settings.pomodoroNotifications}
                  onCheckedChange={(checked) => handleSettingChange('pomodoroNotifications', checked)}
                  disabled={!settings.enableNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Task Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders for upcoming tasks
                  </p>
                </div>
                <Switch
                  checked={settings.taskReminders}
                  onCheckedChange={(checked) => handleSettingChange('taskReminders', checked)}
                  disabled={!settings.enableNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds for notifications and timers
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {settings.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                  )}
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Protect your data and privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-lock Application</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically lock the app after inactivity
                  </p>
                </div>
                <Switch
                  checked={settings.autoLock}
                  onCheckedChange={(checked) => handleSettingChange('autoLock', checked)}
                />
              </div>
              
              {settings.autoLock && (
                <div className="space-y-2">
                  <Label>Auto-lock Duration (minutes)</Label>
                  <Select
                    value={settings.autoLockDuration.toString()}
                    onValueChange={(value) => handleSettingChange('autoLockDuration', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Encrypt Notes by Default</Label>
                  <p className="text-sm text-muted-foreground">
                    New notes will be encrypted automatically
                  </p>
                </div>
                <Switch
                  checked={settings.encryptNotesByDefault}
                  onCheckedChange={(checked) => handleSettingChange('encryptNotesByDefault', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Theme & Display
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={theme}
                  onValueChange={(value) => handleSettingChange('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Select
                  value={settings.fontSize}
                  onValueChange={(value) => handleSettingChange('fontSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce spacing and padding for more content
                  </p>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Productivity Settings */}
        <TabsContent value="productivity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5" />
                Pomodoro Timer
              </CardTitle>
              <CardDescription>
                Configure your focus and break durations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Work Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.workDuration}
                    onChange={(e) => handleSettingChange('workDuration', parseInt(e.target.value) || 25)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Short Break (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.shortBreakDuration}
                    onChange={(e) => handleSettingChange('shortBreakDuration', parseInt(e.target.value) || 5)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Long Break (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.longBreakDuration}
                    onChange={(e) => handleSettingChange('longBreakDuration', parseInt(e.target.value) || 15)}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-start Breaks</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically start break timers after work sessions
                  </p>
                </div>
                <Switch
                  checked={settings.autoStartBreaks}
                  onCheckedChange={(checked) => handleSettingChange('autoStartBreaks', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-start Pomodoros</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically start work sessions after breaks
                  </p>
                </div>
                <Switch
                  checked={settings.autoStartPomodoros}
                  onCheckedChange={(checked) => handleSettingChange('autoStartPomodoros', checked)}
                />
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Local Data Management
              </CardTitle>
              <CardDescription>
                Export, import, and manage your local workspace data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataManager />
            </CardContent>
          </Card>

          {!isDemoMode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  Cloud Backup & Sync
                </CardTitle>
                <CardDescription>
                  Backup your data to Google Drive and sync across devices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Backup</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically backup your data to Google Drive
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
                  />
                </div>

                {settings.autoBackup && (
                  <div className="space-y-2">
                    <Label>Backup Frequency</Label>
                    <Select
                      value={settings.backupFrequency}
                      onValueChange={(value) => handleSettingChange('backupFrequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Every Hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sync on Startup</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync data when the app starts
                    </p>
                  </div>
                  <Switch
                    checked={settings.syncOnStartup}
                    onCheckedChange={(checked) => handleSettingChange('syncOnStartup', checked)}
                  />
                </div>

                <Separator />

                <BackupManager />
              </CardContent>
            </Card>
          )}

          {isDemoMode && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Info className="w-5 h-5" />
                  Demo Mode Limitations
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Cloud backup and sync features are not available in demo mode
                </CardDescription>
              </CardHeader>
              <CardContent className="text-orange-700">
                <p className="text-sm">
                  To access cloud backup and sync features, please sign in with your Google account.
                  Your demo data will be preserved during the sign-in process.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isDemoMode ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-orange-800">Demo User</h3>
                      <p className="text-sm text-orange-600">demo@focusflow.app</p>
                      <Badge variant="outline" className="mt-1 border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                        Demo Account
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Upgrade to Full Account</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Sign in with Google to access cloud backup, sync, and save your progress permanently.
                    </p>
                    <Button
                      onClick={() => {
                        authService.logout();
                        window.location.reload();
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Sign In with Google
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      {currentUser?.profile_picture ? (
                        <img
                          src={currentUser.profile_picture}
                          alt={currentUser.name}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{currentUser?.name}</h3>
                      <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                      <Badge variant="outline" className="mt-1">
                        Google Account
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Application Info
              </CardTitle>
              <CardDescription>
                Version and system information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <span className="text-sm font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Build</span>
                <span className="text-sm font-medium">2024.01.27</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Platform</span>
                <span className="text-sm font-medium">
                  {navigator.userAgent.includes('Tauri') ? 'Desktop' : 'Web'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that affect your account and data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                <div>
                  <h4 className="font-medium">Reset All Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    Reset all preferences to default values
                  </p>
                </div>
                <Button variant="outline" onClick={resetSettings}>
                  Reset Settings
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                <div>
                  <h4 className="font-medium">Sign Out</h4>
                  <p className="text-sm text-muted-foreground">
                    Sign out of your account and return to login screen
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    authService.logout();
                    onClose?.();
                  }}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
