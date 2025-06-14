import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
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

interface AppState {
  // Navigation
  currentPage: 'dashboard' | 'notes' | 'tasks' | 'habits' | 'graph';
  setCurrentPage: (page: AppState['currentPage']) => void;
  
  // Notes
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  
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
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentPage: 'dashboard',
      setCurrentPage: (page) => set({ currentPage: page }),
      
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
    }),
    {
      name: 'focusflow-storage',
    }
  )
);
