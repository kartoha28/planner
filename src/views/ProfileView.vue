<script setup lang="ts">
import { ref } from 'vue';
import { Bell, Clock, Download, Moon, RotateCcw, Sun, Upload } from 'lucide-vue-next';
import { useNotifications } from '@/composables/useNotifications';
import { useTasks } from '@/composables/useTasks';
import { useTheme } from '@/composables/useTheme';

const { theme, setTheme } = useTheme();
const { tasks, resetDemoTasks, importTasksJson } = useTasks();
const {
  permission,
  permissionLabel,
  notificationsEnabled,
  lastTriggeredInfo,
  requestPermission,
  setNotificationsEnabled,
  sendTestNotification,
  scheduleQuickReminder,
  pushToast,
} = useNotifications();

const fileInputRef = ref<HTMLInputElement | null>(null);

function exportBackup() {
  const blob = new Blob([JSON.stringify(tasks.value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  pushToast('Резервну копію збережено', 'JSON-файл із задачами завантажено на пристрій.', 'success');
}

function triggerImport() {
  fileInputRef.value?.click();
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const res = importTasksJson(String(reader.result || ''));
    if (res.ok) {
      pushToast('Імпорт виконано', `Відновлено задач: ${res.count}`, 'success');
    } else {
      pushToast('Помилка імпорту', 'Файл не відповідає формату TaskFlow.', 'danger');
    }
    input.value = '';
  };
  reader.readAsText(file);
}

function handleReset() {
  resetDemoTasks();
  pushToast('Демо-дані відновлено', 'Повернуто стартовий список задач.', 'info');
}
</script>

<template>
  <div class="profile-view">
    <header class="profile-card">
      <div class="avatar">ВІ</div>
      <div>
        <h1>Владислав Іванів</h1>
        <p>Локальний режим · LocalStorage ({{ tasks.length }} задач)</p>
      </div>
    </header>

    <section class="settings-block">
      <h2>Тема оформлення</h2>
      <div class="theme-switch">
        <button type="button" :class="{ active: theme === 'light' }" @click="setTheme('light')">
          <Sun :size="16" /> Світла (Light)
        </button>
        <button type="button" :class="{ active: theme === 'dark' }" @click="setTheme('dark')">
          <Moon :size="16" /> Темна (Dark)
        </button>
      </div>
    </section>

    <section class="settings-block">
      <div class="block-head">
        <h2>Локальні Push-сповіщення</h2>
        <span class="perm-badge" :class="`perm-${permission}`">{{ permissionLabel }}</span>
      </div>
      <p class="hint">
        Сповіщення працюють повністю локально на твоєму пристрої (через Service Worker та Notification API, без серверів).
      </p>

      <label class="toggle-row">
        <span>Увімкнути нагадування для задач</span>
        <input
          type="checkbox"
          :checked="notificationsEnabled"
          @change="setNotificationsEnabled(($event.target as HTMLInputElement).checked)"
        />
      </label>

      <div class="btn-grid">
        <button v-if="permission !== 'granted'" type="button" class="action-btn primary" @click="requestPermission">
          <Bell :size="16" /> Дозволити сповіщення
        </button>
        <button type="button" class="action-btn primary" @click="sendTestNotification">
          <Bell :size="16" /> Тестове сповіщення
        </button>
        <button type="button" class="action-btn" @click="scheduleQuickReminder(5, 'Перевірити планувальник TaskFlow')">
          <Clock :size="16" /> Таймер на 5 сек
        </button>
      </div>

      <p v-if="lastTriggeredInfo" class="last-notif">
        Останнє сповіщення: <strong>{{ lastTriggeredInfo.title }}</strong> о {{ lastTriggeredInfo.time }}
      </p>
    </section>

    <section class="settings-block">
      <h2>Локальне сховище (Backup)</h2>
      <div class="btn-grid">
        <button type="button" class="action-btn" @click="exportBackup">
          <Download :size="16" /> Експорт JSON
        </button>
        <button type="button" class="action-btn" @click="triggerImport">
          <Upload :size="16" /> Імпорт JSON
        </button>
        <button type="button" class="action-btn danger" @click="handleReset">
          <RotateCcw :size="16" /> Скинути демо-дані
        </button>
      </div>
      <input ref="fileInputRef" type="file" accept="application/json" hidden @change="onFileChange" />
    </section>
  </div>
</template>

<style scoped>
.profile-view {
  padding: 14px 20px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: var(--radius-lg);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--brand-primary), var(--brand-primary-end));
  color: #ffffff;
  font-weight: 700;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.profile-card h1 {
  margin: 0 0 3px;
  font-size: 18px;
  font-weight: 700;
}

.profile-card p {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.settings-block {
  padding: 16px;
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-block h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.perm-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 999px;
}

.perm-granted {
  background: var(--status-success-soft);
  color: var(--status-success);
}
.perm-default {
  background: var(--status-warning-soft);
  color: var(--status-warning);
}
.perm-denied {
  background: var(--status-danger-soft);
  color: var(--status-danger);
}

.hint {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--text-secondary);
}

.theme-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.theme-switch button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.theme-switch button.active {
  background: var(--brand-primary-soft);
  border-color: var(--brand-primary);
  color: var(--brand-primary);
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 500;
}

.toggle-row input {
  width: 18px;
  height: 18px;
  accent-color: var(--brand-primary);
}

.btn-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-btn {
  flex: 1 1 140px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
}

.action-btn.primary {
  background: var(--brand-primary);
  border-color: var(--brand-primary);
  color: var(--text-on-primary);
}

.action-btn.danger:hover {
  border-color: var(--status-danger);
  color: var(--status-danger);
}

.last-notif {
  margin: 0;
  font-size: 12px;
  color: var(--status-success);
}
</style>
