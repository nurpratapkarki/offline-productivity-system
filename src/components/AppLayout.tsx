
import { useAppStore } from "@/stores/appStore";
import Navigation from "@/components/shared/Navigation";
import Dashboard from "@/pages/Dashboard";
import Notes from "@/pages/Notes";
import Tasks from "@/pages/Tasks";
import Habits from "@/pages/Habits";
import Graph from "@/pages/Graph";
import { authService } from "@/services/auth";
import { useEffect, useState } from "react";

const AppLayout = () => {
  const { currentPage } = useAppStore();
  const [fontSize, setFontSize] = useState('medium');
  const [compactMode, setCompactMode] = useState(false);

  // Load appearance settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('focusflow-settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          setFontSize(settings.fontSize || 'medium');
          setCompactMode(settings.compactMode || false);
        }
      } catch (error) {
        console.error('Failed to load appearance settings:', error);
      }
    };

    loadSettings();

    // Listen for settings changes to update in real-time
    const handleSettingsChange = (e: CustomEvent) => {
      const { settings } = e.detail;
      setFontSize(settings.fontSize || 'medium');
      setCompactMode(settings.compactMode || false);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'focusflow-settings') {
        loadSettings();
      }
    };

    window.addEventListener('focusflow-settings-changed', handleSettingsChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('focusflow-settings-changed', handleSettingsChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'notes':
        return <Notes />;
      case 'tasks':
        return <Tasks />;
      case 'habits':
        return <Habits />;
      case 'graph':
        return <Graph />;
      default:
        return <Dashboard />;
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  const getSpacingClass = () => {
    return compactMode ? 'space-y-4' : 'space-y-6';
  };

  const getPaddingClass = () => {
    return compactMode ? 'px-2 py-3' : 'px-4 py-6';
  };

  return (
    <div className={`min-h-screen bg-background ${getFontSizeClass()}`}>
      <div className={`container mx-auto ${getPaddingClass()}`}>
        {/* Header */}
        <header className={`flex items-center justify-between ${compactMode ? 'mb-4' : 'mb-6'}`}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">
                FocusFlow
              </h1>
              {authService.isDemoMode() && (
                <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full border border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700">
                  Demo Mode
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Navigation />
          </div>
        </header>

        {/* Main Content */}
        <main className={`animate-fade-in ${getSpacingClass()}`}>
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
