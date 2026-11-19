export type TaskCategory = 'Навчання' | 'Робота' | 'Особисте' | 'Здоров’я';
export type TaskPriority = 'high' | 'medium' | 'low';
export type ReminderOption = 'none' | '0' | '5' | '15' | '30' | '60';
export type AppTab = 'today' | 'calendar' | 'projects' | 'profile';
export type ThemeMode = 'light' | 'dark';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  project: string;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  endTime?: string; // HH:mm
  location?: string;
  reminderMinutes: ReminderOption;
  completed: boolean;
  subtasks: Subtask[];
  notifiedAt?: number | null;
  createdAt: number;
}

export interface ToastMessage {
  id: string;
  title: string;
  body?: string;
  variant: 'info' | 'success' | 'warning' | 'danger';
}
