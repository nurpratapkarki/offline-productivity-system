
import React, { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard,
  FileText,
  Kanban,
  Heart,
  Network,
  Settings as SettingsIcon
} from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import PomodoroTimer from './PomodoroTimer';
import DataManager from './DataManager';
import BackupManager from './BackupManager';
import Settings from './Settings';
import { authService } from '@/services/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const Navigation = () => {
  const { currentPage, setCurrentPage } = useAppStore();
  const [settingsOpen, setSettingsOpen] = useState(false);



  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'tasks', label: 'Tasks', icon: Kanban },
    { id: 'habits', label: 'Habits', icon: Heart },
    { id: 'graph', label: 'Graph', icon: Network },
  ] as const;



  return (
    <div className="flex items-center space-x-6">
      {/* Main Navigation Tabs */}
      <Tabs value={currentPage} onValueChange={(value) => setCurrentPage(value as any)}>
        <TabsList className="grid grid-cols-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <TabsTrigger key={item.id} value={item.id} className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Utility Actions */}
      <div className="flex items-center space-x-2">
        {/* Search */}
        <GlobalSearch />

        {/* Pomodoro Timer */}
        <PomodoroTimer />

        {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost" title="Settings">
            <SettingsIcon className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your workspace preferences, data, and account settings
            </DialogDescription>
          </DialogHeader>

          <Settings onClose={() => setSettingsOpen(false)} />
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default Navigation;
