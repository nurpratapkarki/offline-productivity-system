import { apiClient } from './api';
import { useAppStore } from '@/stores/appStore';

export interface User {
  id: string;
  email: string;
  name: string;
  profile_picture?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

class AuthService {
  private listeners: ((state: AuthState) => void)[] = [];
  private currentState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
  };

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const response = await apiClient.verifyToken(token);
        if (response.valid) {
          this.currentState = {
            isAuthenticated: true,
            user: response.user,
            token,
          };
          apiClient.setToken(token);
          this.notifyListeners();
        } else {
          this.logout();
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        this.logout();
      }
    }
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.currentState);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentState));
  }

  async initiateGoogleLogin(): Promise<void> {
    try {
      const response = await apiClient.getGoogleAuthUrl();

      // For now, always use web redirect to avoid Vite import issues
      // TODO: Add proper Tauri support when running in desktop mode
      window.location.href = response.auth_url;
    } catch (error) {
      console.error('Failed to initiate Google login:', error);
      throw error;
    }
  }

  async handleAuthCallback(token: string, userId: string): Promise<void> {
    try {
      const response = await apiClient.verifyToken(token);
      if (response.valid) {
        this.currentState = {
          isAuthenticated: true,
          user: response.user,
          token,
        };
        apiClient.setToken(token);
        localStorage.setItem('auth_token', token);
        this.notifyListeners();
      } else {
        throw new Error('Invalid token received');
      }
    } catch (error) {
      console.error('Auth callback failed:', error);
      throw error;
    }
  }

  async loginWithDemo(): Promise<void> {
    try {
      // Create a demo user and token
      const demoUser: User = {
        id: 'demo-user-123',
        email: 'demo@focusflow.app',
        name: 'Demo User',
        profile_picture: undefined,
      };

      const demoToken = 'demo-token-' + Date.now();

      this.currentState = {
        isAuthenticated: true,
        user: demoUser,
        token: demoToken,
      };

      // Set demo flag in localStorage to identify demo sessions
      localStorage.setItem('auth_token', demoToken);
      localStorage.setItem('demo_mode', 'true');

      // Don't set token in API client for demo mode to avoid backend calls
      // apiClient.setToken(demoToken);

      // Load demo data into the store
      const appStore = useAppStore.getState();
      appStore.loadDemoData();

      this.notifyListeners();
    } catch (error) {
      console.error('Demo login failed:', error);
      throw error;
    }
  }

  logout() {
    this.currentState = {
      isAuthenticated: false,
      user: null,
      token: null,
    };
    apiClient.clearToken();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('demo_mode');
    this.notifyListeners();
  }

  getCurrentState(): AuthState {
    return { ...this.currentState };
  }

  isAuthenticated(): boolean {
    return this.currentState.isAuthenticated;
  }

  getUser(): User | null {
    return this.currentState.user;
  }

  getToken(): string | null {
    return this.currentState.token;
  }

  isDemoMode(): boolean {
    return localStorage.getItem('demo_mode') === 'true';
  }
}

export const authService = new AuthService();
export default authService;
