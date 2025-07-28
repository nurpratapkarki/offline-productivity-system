import { Note, Task, Habit } from '@/stores/appStore';
import { authService } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;

      // Check if the error indicates that logout is required
      if (errorMessage.includes('LOGOUT_REQUIRED') ||
          (response.status === 401 && errorMessage.includes('refresh token'))) {
        console.log('Token refresh failed, logging out user...');
        authService.logout();
        throw new Error('Your session has expired. Please log in again.');
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Authentication
  async getGoogleAuthUrl(): Promise<{ auth_url: string; state: string }> {
    return this.request('/auth/google');
  }

  async verifyToken(token: string): Promise<{ valid: boolean; user: any }> {
    return this.request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async getGoogleAccessToken(): Promise<{ access_token: string; expires_at?: string }> {
    return this.request('/auth/google-token');
  }

  // Notes API
  async getNotes(params?: { limit?: number; offset?: number; search?: string }): Promise<Note[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.search) searchParams.set('search', params.search);
    
    const query = searchParams.toString();
    return this.request(`/api/notes${query ? `?${query}` : ''}`);
  }

  async getNote(id: string): Promise<Note> {
    return this.request(`/api/notes/${id}`);
  }

  async createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    return this.request('/api/notes', {
      method: 'POST',
      body: JSON.stringify({
        title: note.title,
        content: note.content,
        tags: note.tags,
        is_encrypted: note.isEncrypted,
      }),
    });
  }

  async updateNote(id: string, note: Partial<Note> & { version: number }): Promise<Note> {
    return this.request(`/api/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: note.title,
        content: note.content,
        tags: note.tags,
        is_encrypted: note.isEncrypted,
        version: note.version,
      }),
    });
  }

  async deleteNote(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/notes/${id}`, {
      method: 'DELETE',
    });
  }

  // Tasks API
  async getTasks(params?: { limit?: number; offset?: number; status?: string }): Promise<Task[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.status) searchParams.set('status', params.status);
    
    const query = searchParams.toString();
    return this.request(`/api/tasks${query ? `?${query}` : ''}`);
  }

  async getTask(id: string): Promise<Task> {
    return this.request(`/api/tasks/${id}`);
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: string, task: Partial<Task> & { version: number }): Promise<Task> {
    return this.request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  }

  async deleteTask(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Habits API
  async getHabits(): Promise<Habit[]> {
    return this.request('/api/habits');
  }

  async getHabit(id: string): Promise<Habit> {
    return this.request(`/api/habits/${id}`);
  }

  async createHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'completedDates'>): Promise<Habit> {
    return this.request('/api/habits', {
      method: 'POST',
      body: JSON.stringify({
        name: habit.name,
        color: habit.color,
      }),
    });
  }

  async updateHabit(id: string, habit: Partial<Habit> & { version: number }): Promise<Habit> {
    return this.request(`/api/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: habit.name,
        color: habit.color,
        streak: habit.streak,
        completed_dates: habit.completedDates,
        version: habit.version,
      }),
    });
  }

  async deleteHabit(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/habits/${id}`, {
      method: 'DELETE',
    });
  }

  // Sync API
  async syncData(syncRequest: any): Promise<any> {
    return this.request('/api/sync', {
      method: 'POST',
      body: JSON.stringify(syncRequest),
    });
  }

  async getSyncStatus(): Promise<any> {
    return this.request('/api/sync/status', {
      method: 'POST',
    });
  }

  // Backup API
  async createBackup(accessToken: string, encryptionKey?: string): Promise<{ success: boolean; file_id: string }> {
    return this.request('/api/backup', {
      method: 'POST',
      body: JSON.stringify({
        access_token: accessToken,
        encryption_key: encryptionKey,
      }),
    });
  }

  async listBackups(accessToken: string): Promise<{ backups: any[] }> {
    return this.request('/api/backup/list', {
      method: 'POST',
      body: JSON.stringify({
        access_token: accessToken,
      }),
    });
  }

  async restoreBackup(accessToken: string, fileId: string, encryptionKey?: string): Promise<{ success: boolean }> {
    return this.request('/api/backup/restore', {
      method: 'POST',
      body: JSON.stringify({
        access_token: accessToken,
        file_id: fileId,
        encryption_key: encryptionKey,
      }),
    });
  }

  async deleteBackup(fileId: string, accessToken: string): Promise<{ success: boolean }> {
    return this.request(`/api/backup/${fileId}`, {
      method: 'DELETE',
      body: JSON.stringify({
        access_token: accessToken,
      }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
