import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, Shield, Cloud, RefreshCw, User } from 'lucide-react';
import { authService, type AuthState } from '@/services/auth';

interface LoginScreenProps {
  onAuthSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onAuthSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  });

  useEffect(() => {
    const unsubscribe = authService.subscribe((state) => {
      setAuthState(state);
      if (state.isAuthenticated) {
        onAuthSuccess();
      }
    });

    return unsubscribe;
  }, [onAuthSuccess]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.initiateGoogleLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.loginWithDemo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Shield,
      title: 'Secure Authentication',
      description: 'Login securely with your Google account',
    },
    {
      icon: Cloud,
      title: 'Cloud Backup',
      description: 'Automatic backup to Google Drive',
    },
    {
      icon: RefreshCw,
      title: 'Cross-Device Sync',
      description: 'Access your data from anywhere',
    },
  ];

  if (authState.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading your workspace...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground">FocusFlow</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Your Personal Productivity Operating System
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Login Card */}
          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to access your productivity workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Continue with Google
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or try the demo
                  </span>
                </div>
              </div>

              <Button
                onClick={handleDemoLogin}
                disabled={isLoading}
                variant="outline"
                className="w-full h-12 text-lg"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading Demo...
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5 mr-2" />
                    Try Demo Account
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>
                  By signing in, you agree to our terms of service and privacy policy.
                </p>
                <p className="text-xs text-muted-foreground opacity-75">
                  Demo account includes sample data and doesn't require registration.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground text-center lg:text-left">
              Why Choose FocusFlow?
            </h2>
            <div className="space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-card rounded-lg shadow-sm border">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold mb-2 text-foreground">📝 Smart Notes</h4>
              <p>Markdown support with encryption and tagging</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-foreground">✅ Task Management</h4>
              <p>Kanban boards with priority and status tracking</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-foreground">🎯 Habit Tracking</h4>
              <p>Build consistent habits with streak tracking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
