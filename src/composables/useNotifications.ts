import { computed, onUnmounted, ref } from 'vue';
import type { Task, ToastMessage } from '@/types/task';
import { useTasks } from './useTasks';

const NOTIF_ENABLED_KEY = 'taskflow_notifications_enabled_v1';

const isSupported = typeof window !== 'undefined' && 'Notification' in window;
const permission = ref<NotificationPermission>(isSupported ? Notification.permission : 'denied');
const notificationsEnabled = ref<boolean>(loadEnabledPref());
const toasts = ref<ToastMessage[]>([]);
const lastTriggeredInfo = ref<{ title: string; time: string } | null>(null);

let schedulerTimer: number | null = null;
const scheduledTimeouts = new Map<string, number>();

function loadEnabledPref(): boolean {
  try {
    const v = localStorage.getItem(NOTIF_ENABLED_KEY);
    return v === null ? true : v === 'true';
  } catch {
    return true;
  }
}

function saveEnabledPref(val: boolean) {
  try {
    localStorage.setItem(NOTIF_ENABLED_KEY, String(val));
  } catch {
    // Ignore storage error
  }
}

export function pushToast(title: string, body?: string, variant: ToastMessage['variant'] = 'info') {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  toasts.value.push({ id, title, body, variant });
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }, 4500);
}

export function dismissToast(id: string) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

function parseTaskTriggerTimestamp(task: Task): number | null {
  if (task.completed || task.reminderMinutes === 'none' || !task.dueDate || !task.dueTime) {
    return null;
  }
  const [y, m, d] = task.dueDate.split('-').map(Number);
  const [hh, mm] = task.dueTime.split(':').map(Number);
  if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return null;

  const dueMs = new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
  const offsetMin = Number(task.reminderMinutes);
  return dueMs - (Number.isNaN(offsetMin) ? 0 : offsetMin * 60 * 1000);
}

async function dispatchSystemNotification(title: string, body: string, tag: string): Promise<boolean> {
  lastTriggeredInfo.value = {
    title,
    time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };

  // Always show in-app toast so the user gets immediate visual feedback inside the PWA
  pushToast(title, body, 'info');

  if (!isSupported || Notification.permission !== 'granted' || !notificationsEnabled.value) {
    return false;
  }

  const iconUrl = `${import.meta.env.BASE_URL}icons/icon-192.png`;
  const options: NotificationOptions = {
    body,
    icon: iconUrl,
    badge: iconUrl,
    tag,
    requireInteraction: false,
    data: { url: import.meta.env.BASE_URL },
  };

  try {
    // Prefer Service Worker registration.showNotification (works on Android PWA & Desktop)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, options);
        return true;
      }
    }
    // Fallback to window.Notification (works in desktop browser even before SW activates)
    new Notification(title, options);
    return true;
  } catch {
    try {
      new Notification(title, options);
      return true;
    } catch {
      return false;
    }
  }
}

export function useNotifications() {
  const { tasks, markTaskNotified } = useTasks();

  const permissionLabel = computed(() => {
    if (!isSupported) return 'Не підтримується браузером';
    if (permission.value === 'granted') return 'Дозволено';
    if (permission.value === 'denied') return 'Заблоковано в браузері';
    return 'Ще не запитували';
  });

  async function requestPermission(): Promise<NotificationPermission> {
    if (!isSupported) {
      pushToast('Сповіщення не підтримуються', 'Використовуйте сучасний браузер або встановлений PWA.', 'warning');
      return 'denied';
    }
    const result = await Notification.requestPermission();
    permission.value = result;
    if (result === 'granted') {
      notificationsEnabled.value = true;
      saveEnabledPref(true);
      pushToast('Сповіщення увімкнено', 'Тепер нагадування про задачі приходитимуть локально.', 'success');
    } else if (result === 'denied') {
      pushToast('Доступ до сповіщень відхилено', 'Дозвольте сповіщення в налаштуваннях сайту в адресному рядку.', 'warning');
    }
    return result;
  }

  function setNotificationsEnabled(enabled: boolean) {
    notificationsEnabled.value = enabled;
    saveEnabledPref(enabled);
  }

  async function sendTestNotification() {
    if (isSupported && Notification.permission === 'default') {
      await requestPermission();
    }
    const deliveredSystem = await dispatchSystemNotification(
      'TaskFlow · Нагадування працює!',
      'Локальні push-сповіщення налаштовані та готові нагадувати про твої задачі.',
      `taskflow-test-${Date.now()}`
    );
    if (!deliveredSystem && permission.value === 'denied') {
      pushToast('Системні сповіщення заблоковані', 'Показано внутрішній банер. Увімкніть дозвіл у налаштуваннях браузера.', 'warning');
    }
    return deliveredSystem;
  }

  function scheduleQuickReminder(seconds = 5, taskTitle = 'Перевірити завдання в TaskFlow') {
    const id = `quick-${Date.now()}`;
    pushToast('Нагадування заплановано', `Спрацює через ${seconds} сек`, 'success');
    const tid = window.setTimeout(async () => {
      scheduledTimeouts.delete(id);
      await dispatchSystemNotification(
        `⏰ Нагадування: ${taskTitle}`,
        'Заплановане локальне сповіщення (без сервера).',
        id
      );
    }, seconds * 1000);
    scheduledTimeouts.set(id, tid);
  }

  function checkDueReminders() {
    if (!notificationsEnabled.value) return;
    const now = Date.now();
    // Notify for tasks whose reminder window arrived within the last 12 hours and wasn't notified yet
    const maxPastWindowMs = 12 * 60 * 60 * 1000;

    for (const task of tasks.value) {
      if (task.completed || task.notifiedAt) continue;
      const triggerAt = parseTaskTriggerTimestamp(task);
      if (triggerAt === null) continue;

      if (now >= triggerAt && now - triggerAt <= maxPastWindowMs) {
        markTaskNotified(task.id);
        const minsText =
          task.reminderMinutes === '0'
            ? 'Час виконання настав'
            : `Початок о ${task.dueTime} (нагадування за ${task.reminderMinutes} хв)`;
        void dispatchSystemNotification(`📌 ${task.title}`, `${task.category} · ${minsText}`, `task-${task.id}`);
      }
    }
  }

  function startScheduler() {
    if (schedulerTimer !== null) return;
    checkDueReminders();
    schedulerTimer = window.setInterval(checkDueReminders, 5000);
    window.addEventListener('focus', checkDueReminders);
    document.addEventListener('visibilitychange', checkDueReminders);
  }

  function stopScheduler() {
    if (schedulerTimer !== null) {
      window.clearInterval(schedulerTimer);
      schedulerTimer = null;
    }
    window.removeEventListener('focus', checkDueReminders);
    document.removeEventListener('visibilitychange', checkDueReminders);
    for (const tid of scheduledTimeouts.values()) {
      window.clearTimeout(tid);
    }
    scheduledTimeouts.clear();
  }

  onUnmounted(() => {
    // Keep global scheduler active while app root lives; individual consumers don't stop it unless root unmounts
  });

  return {
    isSupported,
    permission,
    permissionLabel,
    notificationsEnabled,
    toasts,
    lastTriggeredInfo,
    requestPermission,
    setNotificationsEnabled,
    sendTestNotification,
    scheduleQuickReminder,
    checkDueReminders,
    startScheduler,
    stopScheduler,
    pushToast,
    dismissToast,
  };
}
