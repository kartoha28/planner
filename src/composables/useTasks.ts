import { computed, ref, watch } from 'vue';
import type { Task, TaskCategory, TaskPriority } from '@/types/task';
import { syncRemindersToIDB } from './useReminderDb';

const TASKS_STORAGE_KEY = 'taskflow_tasks_v1';

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(baseISO: string, deltaDays: number): string {
  const [y, m, d] = baseISO.split('-').map(Number);
  const dt = new Date(y, m - 1, d + deltaDays);
  return formatDateISO(dt);
}

function createInitialDemoTasks(): Task[] {
  const today = formatDateISO(new Date());
  const tomorrow = addDaysISO(today, 1);
  return [
    {
      id: 'task-demo-1',
      title: 'Підготувати лабу з Архітектури ПЗ',
      description: 'Створити діаграму класів, оновити документацію та підготувати шпаргалку до захисту перед парою.',
      category: 'Навчання',
      project: '3 курс · Універ',
      priority: 'high',
      dueDate: today,
      dueTime: '14:00',
      endTime: '15:30',
      location: 'Ауд. 304',
      reminderMinutes: '30',
      completed: false,
      subtasks: [
        { id: 'sub-1', title: 'Зібрати вимоги з методички', completed: true },
        { id: 'sub-2', title: 'Побудувати UML-діаграму', completed: true },
        { id: 'sub-3', title: 'Написати юніт-тести', completed: false },
        { id: 'sub-4', title: 'Перевірити код перед захистом', completed: false },
      ],
      notifiedAt: null,
      createdAt: Date.now() - 3600 * 1000 * 5,
    },
    {
      id: 'task-demo-2',
      title: 'Оновити макет планувальника',
      description: 'Додати підтримку світлої та темної теми через змінні кольорів і перевірити PWA-іконки.',
      category: 'Робота',
      project: 'TaskFlow PWA',
      priority: 'medium',
      dueDate: today,
      dueTime: '16:30',
      endTime: '17:30',
      location: 'Google Meet',
      reminderMinutes: '15',
      completed: false,
      subtasks: [
        { id: 'sub-5', title: 'Налаштувати токени тем', completed: true },
        { id: 'sub-6', title: 'Перевірити адаптив на мобільному', completed: false },
        { id: 'sub-7', title: 'Задеплоїти на GitHub Pages', completed: false },
      ],
      notifiedAt: null,
      createdAt: Date.now() - 3600 * 1000 * 4,
    },
    {
      id: 'task-demo-3',
      title: 'Купити продукти на вечерю',
      description: 'Сир крафтовий, зелень, томати, оливкова олія та хліб.',
      category: 'Особисте',
      project: 'Дім і побут',
      priority: 'low',
      dueDate: today,
      dueTime: '19:00',
      endTime: '19:40',
      reminderMinutes: '30',
      completed: false,
      subtasks: [],
      notifiedAt: null,
      createdAt: Date.now() - 3600 * 1000 * 3,
    },
    {
      id: 'task-demo-4',
      title: 'Перевірити розклад пар',
      description: 'Звірити аудиторії та час консультацій на тиждень.',
      category: 'Навчання',
      project: '3 курс · Універ',
      priority: 'low',
      dueDate: today,
      dueTime: '09:30',
      endTime: '10:00',
      location: 'Електронний кабінет',
      reminderMinutes: 'none',
      completed: true,
      subtasks: [],
      notifiedAt: null,
      createdAt: Date.now() - 3600 * 1000 * 8,
    },
    {
      id: 'task-demo-5',
      title: 'Вечірня пробіжка',
      description: 'Легке кардіо 5 км у комфортному темпі.',
      category: 'Здоров’я',
      project: 'Спорт',
      priority: 'low',
      dueDate: tomorrow,
      dueTime: '18:30',
      endTime: '19:15',
      location: 'Парк ім. Шевченка',
      reminderMinutes: '15',
      completed: false,
      subtasks: [],
      notifiedAt: null,
      createdAt: Date.now() - 3600 * 1000 * 2,
    },
  ];
}

function loadTasksFromStorage(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      const seed = createInitialDemoTasks();
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Corrupted localStorage fallback
  }
  return createInitialDemoTasks();
}

const tasks = ref<Task[]>(loadTasksFromStorage());
void syncRemindersToIDB(tasks.value);

watch(
  tasks,
  (val) => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(val));
    } catch {
      // Ignore quota exceeded
    }
    void syncRemindersToIDB(val);
  },
  { deep: true }
);

export function useTasks() {
  const todayISO = computed(() => formatDateISO(new Date()));

  const todayTasks = computed(() =>
    tasks.value
      .filter((t) => t.dueDate === todayISO.value)
      .sort((a, b) => Number(a.completed) - Number(b.completed) || a.dueTime.localeCompare(b.dueTime))
  );

  const todayStats = computed(() => {
    const total = todayTasks.value.length;
    const done = todayTasks.value.filter((t) => t.completed).length;
    const active = total - done;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, active, percent };
  });

  function addTask(input: Omit<Task, 'id' | 'createdAt' | 'notifiedAt'>): Task {
    const newTask: Task = {
      ...input,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      notifiedAt: null,
      createdAt: Date.now(),
    };
    tasks.value.unshift(newTask);
    return newTask;
  }

  function updateTask(id: string, patch: Partial<Task>) {
    const idx = tasks.value.findIndex((t) => t.id === id);
    if (idx !== -1) {
      tasks.value[idx] = { ...tasks.value[idx], ...patch };
    }
  }

  function toggleTaskComplete(id: string) {
    const task = tasks.value.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
    }
  }

  function deleteTask(id: string) {
    tasks.value = tasks.value.filter((t) => t.id !== id);
  }

  function toggleSubtask(taskId: string, subtaskId: string) {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) return;
    const sub = task.subtasks.find((s) => s.id === subtaskId);
    if (sub) {
      sub.completed = !sub.completed;
    }
  }

  function addSubtask(taskId: string, title: string) {
    const clean = title.trim();
    if (!clean) return;
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) return;
    task.subtasks.push({
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: clean,
      completed: false,
    });
  }

  function deleteSubtask(taskId: string, subtaskId: string) {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) return;
    task.subtasks = task.subtasks.filter((s) => s.id !== subtaskId);
  }

  function markTaskNotified(taskId: string) {
    const task = tasks.value.find((t) => t.id === taskId);
    if (task) {
      task.notifiedAt = Date.now();
    }
  }

  function resetDemoTasks() {
    tasks.value = createInitialDemoTasks();
  }

  function importTasksJson(rawJson: string): { ok: boolean; count: number } {
    try {
      const parsed = JSON.parse(rawJson);
      if (!Array.isArray(parsed)) return { ok: false, count: 0 };
      const valid = parsed.filter(
        (item): item is Task =>
          item &&
          typeof item.id === 'string' &&
          typeof item.title === 'string' &&
          typeof item.dueDate === 'string'
      );
      if (valid.length === 0 && parsed.length > 0) return { ok: false, count: 0 };
      tasks.value = valid;
      return { ok: true, count: valid.length };
    } catch {
      return { ok: false, count: 0 };
    }
  }

  return {
    tasks,
    todayISO,
    todayTasks,
    todayStats,
    addTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    toggleSubtask,
    addSubtask,
    deleteSubtask,
    markTaskNotified,
    resetDemoTasks,
    importTasksJson,
  };
}

export const CATEGORY_OPTIONS: TaskCategory[] = ['Навчання', 'Робота', 'Особисте', 'Здоров’я'];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: 'Високий',
  medium: 'Середній',
  low: 'Низький',
};
