import { apiClient } from './api';
import { useAppStore } from '@/stores/appStore';

export interface SyncItem {
  id: string;
  version: number;
  deleted: boolean;
  data?: any;
}

export interface SyncRequest {
  notes: SyncItem[];
  tasks: SyncItem[];
  habits: SyncItem[];
}

export interface SyncResponse {
  notes: SyncResult[];
  tasks: SyncResult[];
  habits: SyncResult[];
  conflicts: ConflictInfo[];
}

export interface SyncResult {
  id: string;
  version: number;
  action: 'Created' | 'Updated' | 'Deleted' | 'NoChange' | 'Conflict';
  data?: any;
}

export interface ConflictInfo {
  entity_type: 'Note' | 'Task' | 'Habit';
  entity_id: string;
  local_version: number;
  server_version: number;
  local_data: any;
  server_data: any;
}

class SyncService {
  private isOnline = navigator.onLine;
  private syncQueue: SyncRequest[] = [];
  private isSyncing = false;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Auto-sync every 5 minutes when online
    setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncAll();
      }
    }, 5 * 60 * 1000);
  }

  async syncAll(): Promise<void> {
    if (!this.isOnline || this.isSyncing) {
      return;
    }

    this.isSyncing = true;

    try {
      const store = useAppStore.getState();
      const syncRequest = this.createSyncRequest(store);
      
      if (this.hasChangesToSync(syncRequest)) {
        const response = await apiClient.syncData(syncRequest);
        await this.applySyncResponse(response);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      // Add to queue for retry
      const store = useAppStore.getState();
      this.syncQueue.push(this.createSyncRequest(store));
    } finally {
      this.isSyncing = false;
    }
  }

  private createSyncRequest(store: any): SyncRequest {
    const notes = store.notes.map((note: any) => ({
      id: note.id,
      version: note.version || 1,
      deleted: false,
      data: {
        title: note.title,
        content: note.content,
        tags: note.tags,
        is_encrypted: note.isEncrypted,
        created_at: note.createdAt,
        updated_at: note.updatedAt,
      },
    }));

    const tasks = store.tasks.map((task: any) => ({
      id: task.id,
      version: task.version || 1,
      deleted: false,
      data: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        created_at: task.createdAt,
        updated_at: task.updatedAt,
      },
    }));

    const habits = store.habits.map((habit: any) => ({
      id: habit.id,
      version: habit.version || 1,
      deleted: false,
      data: {
        name: habit.name,
        color: habit.color,
        streak: habit.streak,
        completed_dates: habit.completedDates,
        created_at: habit.createdAt,
      },
    }));

    return { notes, tasks, habits };
  }

  private hasChangesToSync(request: SyncRequest): boolean {
    return request.notes.length > 0 || request.tasks.length > 0 || request.habits.length > 0;
  }

  private async applySyncResponse(response: SyncResponse): Promise<void> {
    const store = useAppStore.getState();

    // Apply note updates
    response.notes.forEach(result => {
      if (result.action === 'Updated' || result.action === 'Created') {
        const existingNoteIndex = store.notes.findIndex((n: any) => n.id === result.id);
        if (existingNoteIndex >= 0) {
          store.updateNote(result.id, {
            ...result.data,
            version: result.version,
          });
        } else if (result.action === 'Created') {
          store.addNote({
            ...result.data,
            id: result.id,
            version: result.version,
          });
        }
      } else if (result.action === 'Deleted') {
        store.deleteNote(result.id);
      }
    });

    // Apply task updates
    response.tasks.forEach(result => {
      if (result.action === 'Updated' || result.action === 'Created') {
        const existingTaskIndex = store.tasks.findIndex((t: any) => t.id === result.id);
        if (existingTaskIndex >= 0) {
          store.updateTask(result.id, {
            ...result.data,
            version: result.version,
          });
        } else if (result.action === 'Created') {
          store.addTask({
            ...result.data,
            id: result.id,
            version: result.version,
          });
        }
      } else if (result.action === 'Deleted') {
        store.deleteTask(result.id);
      }
    });

    // Apply habit updates
    response.habits.forEach(result => {
      if (result.action === 'Updated' || result.action === 'Created') {
        const existingHabitIndex = store.habits.findIndex((h: any) => h.id === result.id);
        if (existingHabitIndex >= 0) {
          store.updateHabit(result.id, {
            ...result.data,
            version: result.version,
          });
        } else if (result.action === 'Created') {
          store.addHabit({
            ...result.data,
            id: result.id,
            version: result.version,
          });
        }
      } else if (result.action === 'Deleted') {
        store.deleteHabit(result.id);
      }
    });

    // Handle conflicts
    if (response.conflicts.length > 0) {
      console.warn('Sync conflicts detected:', response.conflicts);
      // TODO: Implement conflict resolution UI
    }
  }

  private async processSyncQueue(): Promise<void> {
    while (this.syncQueue.length > 0 && this.isOnline && !this.isSyncing) {
      const request = this.syncQueue.shift();
      if (request) {
        try {
          const response = await apiClient.syncData(request);
          await this.applySyncResponse(response);
        } catch (error) {
          console.error('Queued sync failed:', error);
          // Put it back in the queue
          this.syncQueue.unshift(request);
          break;
        }
      }
    }
  }

  // Manual sync trigger
  async forcSync(): Promise<void> {
    await this.syncAll();
  }

  // Check if sync is needed
  needsSync(): boolean {
    return this.syncQueue.length > 0 || this.hasLocalChanges();
  }

  private hasLocalChanges(): boolean {
    // This would check if there are local changes that haven't been synced
    // For now, we'll assume there are always potential changes
    return true;
  }

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  isSyncingStatus(): boolean {
    return this.isSyncing;
  }
}

export const syncService = new SyncService();
export default syncService;
