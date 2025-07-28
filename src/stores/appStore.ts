
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
  
  // Pomodoro
  pomodoroTimer: {
    isActive: boolean;
    timeLeft: number;
    currentSession: 'work' | 'break';
    workDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
  };
  startPomodoro: () => void;
  pausePomodoro: () => void;
  resetPomodoro: () => void;
  updatePomodoroTime: () => void;
  updatePomodoroSettings: (settings: {
    workDuration?: number;
    breakDuration?: number;
    longBreakDuration?: number;
    autoStartBreaks?: boolean;
    autoStartPomodoros?: boolean;
  }) => void;
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
  loadDemoData: () => void;
  loadSettings: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentPage: 'dashboard',
      setCurrentPage: (page) => set({ currentPage: page }),
      
      // Search functionality
      searchQuery: '',
      setSearchQuery: (query) => {
        set({ searchQuery: query });

        // Perform search immediately when query changes
        const { notes, tasks } = get();
        if (!query.trim()) {
          set({ searchResults: { notes: [], tasks: [] } });
          return;
        }

        const searchTerm = query.toLowerCase();
        const filteredNotes = notes.filter(note =>
          note.title.toLowerCase().includes(searchTerm) ||
          note.content.toLowerCase().includes(searchTerm) ||
          note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );

        const filteredTasks = tasks.filter(task =>
          task.title.toLowerCase().includes(searchTerm) ||
          task.description.toLowerCase().includes(searchTerm)
        );

        set({ searchResults: { notes: filteredNotes, tasks: filteredTasks } });
      },
      searchResults: { notes: [], tasks: [] },

      // Pomodoro
      pomodoroTimer: {
        isActive: false,
        timeLeft: 25 * 60, // 25 minutes in seconds
        currentSession: 'work',
        workDuration: 25 * 60,
        breakDuration: 5 * 60,
        longBreakDuration: 15 * 60,
        autoStartBreaks: false,
        autoStartPomodoros: false,
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

          // Check if we should auto-start the next session
          const shouldAutoStart = (nextSession === 'break' && state.pomodoroTimer.autoStartBreaks) ||
                                 (nextSession === 'work' && state.pomodoroTimer.autoStartPomodoros);

          // Show notification for session completion
          const completedSession = state.pomodoroTimer.currentSession;
          const sessionTitle = completedSession === 'work' ? 'Work Session Complete!' : 'Break Time Over!';
          const sessionMessage = completedSession === 'work'
            ? 'Great job! Time for a break.'
            : 'Break time is over. Ready to get back to work?';

          // Check if notifications are enabled
          try {
            const settings = localStorage.getItem('focusflow-settings');
            const parsedSettings = settings ? JSON.parse(settings) : {};
            const notificationsEnabled = parsedSettings.enableNotifications !== false;
            const pomodoroNotificationsEnabled = parsedSettings.pomodoroNotifications !== false;

            if (notificationsEnabled && pomodoroNotificationsEnabled) {
              // Browser notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(sessionTitle, {
                  body: sessionMessage,
                  icon: '/favicon.ico'
                });
              }

              // Play sound if enabled
              if (parsedSettings.soundEnabled !== false) {
                // Create a simple beep sound
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
              }
            }
          } catch (error) {
            console.error('Failed to show notification:', error);
          }

          return {
            pomodoroTimer: {
              ...state.pomodoroTimer,
              isActive: shouldAutoStart,
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
      updatePomodoroSettings: (settings) => set((state) => {
        const updatedTimer = { ...state.pomodoroTimer };

        if (settings.workDuration !== undefined) {
          updatedTimer.workDuration = settings.workDuration * 60; // Convert minutes to seconds
          if (state.pomodoroTimer.currentSession === 'work' && !state.pomodoroTimer.isActive) {
            updatedTimer.timeLeft = settings.workDuration * 60;
          }
        }

        if (settings.breakDuration !== undefined) {
          updatedTimer.breakDuration = settings.breakDuration * 60; // Convert minutes to seconds
          if (state.pomodoroTimer.currentSession === 'break' && !state.pomodoroTimer.isActive) {
            updatedTimer.timeLeft = settings.breakDuration * 60;
          }
        }

        if (settings.longBreakDuration !== undefined) {
          updatedTimer.longBreakDuration = settings.longBreakDuration * 60; // Convert minutes to seconds
        }

        if (settings.autoStartBreaks !== undefined) {
          updatedTimer.autoStartBreaks = settings.autoStartBreaks;
        }

        if (settings.autoStartPomodoros !== undefined) {
          updatedTimer.autoStartPomodoros = settings.autoStartPomodoros;
        }

        return { pomodoroTimer: updatedTimer };
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

      loadDemoData: () => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

        const demoNotes: Note[] = [
          {
            id: 'demo-note-1',
            title: 'Welcome to FocusFlow! 🎉',
            content: `# Welcome to FocusFlow!

This is your personal productivity operating system. Here's what you can do:

## 📝 Notes
- Create and organize notes with **Markdown** support
- Add tags for easy categorization
- Encrypt sensitive notes with passwords

## ✅ Tasks
- Manage tasks with Kanban boards
- Set priorities and track progress
- Drag and drop to update status

## 🎯 Habits
- Track daily habits with streak counters
- Visual progress with color coding
- Build consistency over time

## 🍅 Pomodoro Timer
- Use Pomodoro technique for focused work
- Track productivity sessions
- Customizable work and break durations

Try exploring the different sections using the navigation menu!`,
            tags: ['welcome', 'guide', 'getting-started'],
            createdAt: twoDaysAgo,
            updatedAt: yesterday,
            isEncrypted: false,
          },
          {
            id: 'demo-note-2',
            title: 'Project Ideas 💡',
            content: `# Project Ideas

## Web Development
- [ ] Personal portfolio website
- [ ] Task management app
- [ ] Weather dashboard
- [ ] Recipe organizer

## Learning Goals
- [ ] Master TypeScript
- [ ] Learn React Native
- [ ] Explore AI/ML basics
- [ ] Practice system design

## Side Projects
- [ ] Open source contribution
- [ ] Blog about coding journey
- [ ] Build a Chrome extension
- [ ] Create a mobile game`,
            tags: ['projects', 'ideas', 'development'],
            createdAt: yesterday,
            updatedAt: now,
            isEncrypted: false,
          },
          {
            id: 'demo-note-3',
            title: 'Meeting Notes - Q1 Planning',
            content: `# Q1 Planning Meeting

**Date:** ${now.toLocaleDateString()}
**Attendees:** Team leads, Product managers

## Key Decisions
- Focus on user experience improvements
- Implement dark mode
- Add mobile responsiveness
- Performance optimization

## Action Items
- [ ] Create wireframes for new features
- [ ] Set up user testing sessions
- [ ] Review current analytics
- [ ] Plan sprint schedules

## Next Steps
Follow up meeting scheduled for next week to review progress.`,
            tags: ['meetings', 'planning', 'work'],
            createdAt: now,
            updatedAt: now,
            isEncrypted: false,
          },
        ];

        const demoTasks: Task[] = [
          {
            id: 'demo-task-1',
            title: 'Set up development environment',
            description: 'Install Node.js, VS Code extensions, and configure Git',
            status: 'done',
            priority: 'high',
            createdAt: twoDaysAgo,
            updatedAt: yesterday,
          },
          {
            id: 'demo-task-2',
            title: 'Design user interface mockups',
            description: 'Create wireframes and high-fidelity designs for the main dashboard',
            status: 'doing',
            priority: 'high',
            createdAt: yesterday,
            updatedAt: now,
          },
          {
            id: 'demo-task-3',
            title: 'Implement authentication system',
            description: 'Add login/logout functionality with JWT tokens',
            status: 'doing',
            priority: 'medium',
            createdAt: yesterday,
            updatedAt: now,
          },
          {
            id: 'demo-task-4',
            title: 'Write unit tests',
            description: 'Add comprehensive test coverage for core components',
            status: 'todo',
            priority: 'medium',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'demo-task-5',
            title: 'Deploy to production',
            description: 'Set up CI/CD pipeline and deploy to cloud hosting',
            status: 'todo',
            priority: 'low',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'demo-task-6',
            title: 'User feedback collection',
            description: 'Implement feedback forms and analytics tracking',
            status: 'todo',
            priority: 'low',
            createdAt: now,
            updatedAt: now,
          },
        ];

        const demoHabits: Habit[] = [
          {
            id: 'demo-habit-1',
            name: 'Morning Exercise',
            color: '#10b981',
            streak: 5,
            completedDates: [
              twoDaysAgo.toISOString().split('T')[0],
              yesterday.toISOString().split('T')[0],
              now.toISOString().split('T')[0],
            ],
            createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
          {
            id: 'demo-habit-2',
            name: 'Read for 30 minutes',
            color: '#3b82f6',
            streak: 3,
            completedDates: [
              yesterday.toISOString().split('T')[0],
              now.toISOString().split('T')[0],
            ],
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          },
          {
            id: 'demo-habit-3',
            name: 'Drink 8 glasses of water',
            color: '#06b6d4',
            streak: 2,
            completedDates: [
              yesterday.toISOString().split('T')[0],
              now.toISOString().split('T')[0],
            ],
            createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          },
          {
            id: 'demo-habit-4',
            name: 'Practice coding',
            color: '#8b5cf6',
            streak: 1,
            completedDates: [
              now.toISOString().split('T')[0],
            ],
            createdAt: yesterday,
          },
        ];

        set({
          notes: demoNotes,
          tasks: demoTasks,
          habits: demoHabits,
          pomodoroSessions: [],
        });
      },
      loadSettings: () => {
        try {
          const savedSettings = localStorage.getItem('focusflow-settings');
          if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            get().updatePomodoroSettings({
              workDuration: settings.workDuration || 25,
              breakDuration: settings.shortBreakDuration || 5,
              longBreakDuration: settings.longBreakDuration || 15,
              autoStartBreaks: settings.autoStartBreaks || false,
              autoStartPomodoros: settings.autoStartPomodoros || false,
            });

            // Request notification permission if notifications are enabled
            if (settings.enableNotifications !== false && settings.pomodoroNotifications !== false) {
              if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
              }
            }
          }
        } catch (error) {
          console.error('Failed to load settings:', error);
        }
      },
    }),
    {
      name: 'focusflow-storage',
    }
  )
);
