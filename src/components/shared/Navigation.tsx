
import React from 'react';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  FileText, 
  Kanban, 
  Heart, 
  Network,
  Settings
} from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import FocusMode from './FocusMode';
import DataManager from './DataManager';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const Navigation = () => {
  const { currentPage, setCurrentPage, focusMode } = useAppStore();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'tasks', label: 'Tasks', icon: Kanban },
    { id: 'habits', label: 'Habits', icon: Heart },
    { id: 'graph', label: 'Graph', icon: Network },
  ] as const;

  if (focusMode) {
    return (
      <div className="flex items-center space-x-4">
        <div className="text-sm text-muted-foreground">Focus Mode Active</div>
        <FocusMode />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Main Navigation */}
      <nav className="flex items-center space-x-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentPage(item.id)}
              className="flex items-center space-x-2"
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Button>
          );
        })}
      </nav>

      {/* Search */}
      <GlobalSearch />

      {/* Focus Mode & Pomodoro */}
      <FocusMode />

      {/* Settings Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost">
            <Settings className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your workspace data and preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Data Management</h3>
              <DataManager />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Navigation;
