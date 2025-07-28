
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";
import LoginScreen from "./components/auth/LoginScreen";
import { authService, type AuthState } from "./services/auth";
import { useAppStore } from "./stores/appStore";
import { backupService } from "./services/backup";

const queryClient = new QueryClient();

const App = () => {
  const { loadSettings } = useAppStore();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  });
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Load settings from localStorage
    loadSettings();

    // Initialize auto backup if enabled
    try {
      const savedSettings = localStorage.getItem('focusflow-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.autoBackup) {
          const frequencyToMinutes = {
            'hourly': 60,
            'daily': 24 * 60,
            'weekly': 7 * 24 * 60
          };

          const intervalMinutes = frequencyToMinutes[settings.backupFrequency as keyof typeof frequencyToMinutes] || 60;

          // Only start auto backup if user is authenticated (not in demo mode)
          if (!localStorage.getItem('demo_mode')) {
            backupService.startAutoBackup(intervalMinutes);
            console.log(`Auto backup initialized with ${intervalMinutes} minute interval`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize auto backup:', error);
    }

    const unsubscribe = authService.subscribe((state) => {
      setAuthState(state);
      setIsInitializing(false);
    });

    // Check for OAuth callback parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userId = urlParams.get('user_id');

    if (token && userId) {
      console.log('OAuth callback detected, processing token...');
      authService.handleAuthCallback(token, userId)
        .then(() => {
          console.log('Auth callback successful');
          // Clean up URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((error) => {
          console.error('Auth callback failed:', error);
          // Clean up URL parameters even on error
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }

    return unsubscribe;
  }, []);

  const handleAuthSuccess = () => {
    // This will be called when authentication is successful
    // The auth state will be updated automatically via the subscription
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <p className="text-muted-foreground">Initializing FocusFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {authState.isAuthenticated ? (
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<AppLayout />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          ) : (
            <LoginScreen onAuthSuccess={handleAuthSuccess} />
          )}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
