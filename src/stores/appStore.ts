
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import CryptoJS from 'crypto-js';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isEncrypted?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  streak: number;
  completedDates: string[];
  createdAt: Date;
}

export interface PomodoroSession {
  id: string;
  type: 'work' | 'break';
  duration: number;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
}

interface AppState {
  // Navigation
  currentPage: 'dashboard' | 'notes' | 'tasks' | 'habits' | 'graph';
  setCurrentPage: (page: AppState['currentPage']) => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: { notes: Note[]; tasks: Task[] };
  performSearch: () => void;
  
  // Focus Mode & Pomodoro
  focusMode: boolean;
  setFocusMode: (enabled: boolean) => void;
  pomodoroTimer: {
    isActive: boolean;
    timeLeft: number;
    currentSession: 'work' | 'break';
    workDuration: number;
    breakDuration: number;
  };
  startPomodoro: () => void;
  pausePomodoro: () => void;
  resetPomodoro: () => void;
  updatePomodoroTime: () => void;
  pomodoroSessions: PomodoroSession[];
  
  // Notes
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  encryptNote: (id: string, password: string) => void;
  decryptNote: (id: string, password: string) => boolean;
  
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: Task['status']) => void;
  
  // Habits
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  markHabitComplete: (id: string, date: string) => void;
  
  // Data Management
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  clearAllData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentPage: 'dashboard',
      setCurrentPage: (page) => set({ currentPage: page }),
      
      // Search functionality
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      searchResults: { notes: [], tasks: [] },
      performSearch: () => {
        const { searchQuery, notes, tasks } = get();
        if (!searchQuery.trim()) {
          set({ searchResults: { notes: [], tasks: [] } });
          return;
        }
        
        const query = searchQuery.toLowerCase();
        const filteredNotes = notes.filter(note => 
          note.title.toLowerCase().includes(query) || 
          note.content.toLowerCase().includes(query) ||
          note.tags.some(tag => tag.toLowerCase().includes(query))
        );
        
        const filteredTasks = tasks.filter(task =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query)
        );
        
        set({ searchResults: { notes: filteredNotes, tasks: filteredTasks } });
      },
      
      // Focus Mode & Pomodoro
      focusMode: false,
      setFocusMode: (enabled) => set({ focusMode: enabled }),
      pomodoroTimer: {
        isActive: false,
        timeLeft: 25 * 60, // 25 minutes in seconds
        currentSession: 'work',
        workDuration: 25 * 60,
        breakDuration: 5 * 60,
      },
      startPomodoro: () => set((state) => ({
        pomodoroTimer: { ...state.pomodoroTimer, isActive: true }
      })),
      pausePomodoro: () => set((state) => ({
        pomodoroTimer: { ...state.pomodoroTimer, isActive: false }
      })),
      resetPomodoro: () => set((state) => ({
        pomodoroTimer: {
          ...state.pomodoroTimer,
          isActive: false,
          timeLeft: state.pomodoroTimer.currentSession === 'work' 
            ? state.pomodoroTimer.workDuration 
            : state.pomodoroTimer.breakDuration
        }
      })),
      updatePomodoroTime: () => set((state) => {
        if (!state.pomodoroTimer.isActive || state.pomodoroTimer.timeLeft <= 0) return state;
        
        const newTimeLeft = state.pomodoroTimer.timeLeft - 1;
        
        if (newTimeLeft <= 0) {
          // Session completed, switch to next session
          const nextSession = state.pomodoroTimer.currentSession === 'work' ? 'break' : 'work';
          const nextDuration = nextSession === 'work' 
            ? state.pomodoroTimer.workDuration 
            : state.pomodoroTimer.breakDuration;
            
          return {
            pomodoroTimer: {
              ...state.pomodoroTimer,
              isActive: false,
              timeLeft: nextDuration,
              currentSession: nextSession
            }
          };
        }
        
        return {
          pomodoroTimer: {
            ...state.pomodoroTimer,
            timeLeft: newTimeLeft
          }
        };
      }),
      pomodoroSessions: [],
      
      notes: [],
      addNote: (note) => {
        const newNote = {
          ...note,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          notes: [...state.notes, newNote]
        }));
        return newNote.id;
      },
      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === id 
            ? { ...note, ...updates, updatedAt: new Date() }
            : note
        )
      })),
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter(note => note.id !== id)
      })),
      encryptNote: (id, password) => set((state) => ({
        notes: state.notes.map(note => {
          if (note.id === id && !note.isEncrypted) {
            const encryptedContent = CryptoJS.AES.encrypt(note.content, password).toString();
            return { ...note, content: encryptedContent, isEncrypted: true };
          }
          return note;
        })
      })),
      decryptNote: (id, password) => {
        const state = get();
        const note = state.notes.find(n => n.id === id);
        if (!note || !note.isEncrypted) return false;
        
        try {
          const decryptedBytes = CryptoJS.AES.decrypt(note.content, password);
          const decryptedContent = decryptedBytes.toString(CryptoJS.enc.Utf8);
          
          if (!decryptedContent) return false;
          
          set((state) => ({
            notes: state.notes.map(n => 
              n.id === id 
                ? { ...n, content: decryptedContent, isEncrypted: false }
                : n
            )
          }));
          return true;
        } catch {
          return false;
        }
      },
      
      tasks: [],
      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, {
          ...task,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }]
      })),
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === id 
            ? { ...task, ...updates, updatedAt: new Date() }
            : task
        )
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(task => task.id !== id)
      })),
      moveTask: (id, status) => set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === id 
            ? { ...task, status, updatedAt: new Date() }
            : task
        )
      })),
      
      habits: [],
      addHabit: (habit) => set((state) => ({
        habits: [...state.habits, {
          ...habit,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        }]
      })),
      updateHabit: (id, updates) => set((state) => ({
        habits: state.habits.map(habit => 
          habit.id === id ? { ...habit, ...updates } : habit
        )
      })),
      deleteHabit: (id) => set((state) => ({
        habits: state.habits.filter(habit => habit.id !== id)
      })),
      markHabitComplete: (id, date) => set((state) => ({
        habits: state.habits.map(habit => {
          if (habit.id === id) {
            const completedDates = habit.completedDates.includes(date)
              ? habit.completedDates.filter(d => d !== date)
              : [...habit.completedDates, date];
            return { ...habit, completedDates };
          }
          return habit;
        })
      })),
      
      // Data Management
      exportData: () => {
        const { notes, tasks, habits, pomodoroSessions } = get();
        const exportData = {
          notes,
          tasks,
          habits,
          pomodoroSessions,
          exportDate: new Date().toISOString(),
          version: '1.0'
        };
        return JSON.stringify(exportData, null, 2);
      },
      
      importData: (jsonData) => {
        try {
          const data = JSON.parse(jsonData);
          if (data.notes && data.tasks && data.habits) {
            set({
              notes: data.notes,
              tasks: data.tasks,
              habits: data.habits,
              pomodoroSessions: data.pomodoroSessions || []
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
      
      clearAllData: () => set({
        notes: [],
        tasks: [],
        habits: [],
        pomodoroSessions: [],
        searchQuery: '',
        searchResults: { notes: [], tasks: [] }
      }),
    }),
    {
      name: 'focusflow-storage',
    }
  )
);
