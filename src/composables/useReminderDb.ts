import type { Task } from '@/types/task';

const DB_NAME = 'taskflow-db';
const DB_VERSION = 1;
const STORE_NAME = 'reminders';

export interface StoredReminder {
  id: string;
  title: string;
  category: string;
  dueDate: string;
  dueTime: string;
  reminderMinutes: string;
  triggerAt: number;
  completed: boolean;
  notified: boolean;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function computeTriggerAt(task: Task): number | null {
  if (task.completed || task.reminderMinutes === 'none' || !task.dueDate || !task.dueTime) {
    return null;
  }
  const [y, m, d] = task.dueDate.split('-').map(Number);
  const [hh, mm] = task.dueTime.split(':').map(Number);
  if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return null;
  const dueMs = new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
  const offset = Number(task.reminderMinutes) || 0;
  return dueMs - offset * 60 * 1000;
}

export async function syncRemindersToIDB(tasks: Task[]): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();

    for (const task of tasks) {
      const triggerAt = computeTriggerAt(task);
      if (triggerAt === null) continue;
      const item: StoredReminder = {
        id: task.id,
        title: task.title,
        category: task.category,
        dueDate: task.dueDate,
        dueTime: task.dueTime,
        reminderMinutes: task.reminderMinutes,
        triggerAt,
        completed: task.completed,
        notified: Boolean(task.notifiedAt),
      };
      store.put(item);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore IDB failures in restricted browsing modes
  }
}
