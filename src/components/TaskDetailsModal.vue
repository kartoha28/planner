<script setup lang="ts">
import { computed, ref } from 'vue';
import { CalendarPlus, Check, ChevronLeft, Edit3, Plus, Trash2 } from 'lucide-vue-next';
import { pushToast } from '@/composables/useNotifications';
import { PRIORITY_LABELS, useTasks } from '@/composables/useTasks';
import { downloadTaskICS } from '@/utils/icsExport';
import type { Task } from '@/types/task';

const props = defineProps<{
  task: Task;
}>();

const emit = defineEmits<{
  close: [];
  edit: [task: Task];
}>();

const { tasks, toggleTaskComplete, deleteTask, toggleSubtask, addSubtask, deleteSubtask } = useTasks();

const liveTask = computed(() => tasks.value.find((t) => t.id === props.task.id) ?? props.task);
const newSubtaskTitle = ref('');

const subtaskStats = computed(() => {
  const total = liveTask.value.subtasks.length;
  const done = liveTask.value.subtasks.filter((s) => s.completed).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
});

function formatFriendlyDate(dateISO: string, time: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const formatted = dt.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  return `${formatted}, ${time}`;
}

function reminderLabel(mins: Task['reminderMinutes']): string {
  if (mins === 'none') return 'Без нагадування';
  if (mins === '0') return 'В момент старту';
  return `За ${mins} хв`;
}

function handleAddSubtask() {
  if (!newSubtaskTitle.value.trim()) return;
  addSubtask(liveTask.value.id, newSubtaskTitle.value);
  newSubtaskTitle.value = '';
}

function handleCompleteToggle() {
  toggleTaskComplete(liveTask.value.id);
}

function handleDelete() {
  deleteTask(liveTask.value.id);
  emit('close');
}

function handleAddToCalendar() {
  downloadTaskICS(liveTask.value);
  pushToast('Файл .ics збережено', 'Відкрий його — подія з нагадуванням додасться в системний Календар і спрацює навіть при закритому PWA.', 'success');
}
</script>

<template>
  <div class="details-overlay" role="dialog" aria-modal="true" aria-label="Деталі задачі">
    <div class="details-screen">
      <header class="nav-header">
        <button type="button" class="icon-btn" aria-label="Назад" @click="emit('close')">
          <ChevronLeft :size="20" />
        </button>
        <h2 class="nav-title">Деталі задачі</h2>
        <button type="button" class="icon-btn danger" aria-label="Видалити задачу" @click="handleDelete">
          <Trash2 :size="18" />
        </button>
      </header>

      <div class="details-body">
        <div class="badges-row">
          <span class="status-pill" :class="{ done: liveTask.completed }">
            {{ liveTask.completed ? 'Виконано' : 'У роботі' }}
          </span>
          <span class="prio-pill" :class="`prio-${liveTask.priority}`">
            {{ PRIORITY_LABELS[liveTask.priority] }} пріоритет
          </span>
        </div>

        <div class="title-block">
          <h1 class="task-title">{{ liveTask.title }}</h1>
          <p v-if="liveTask.description" class="task-desc">{{ liveTask.description }}</p>
        </div>

        <div class="meta-grid">
          <div class="meta-card">
            <div class="meta-key"><span class="dot dot-danger"></span>Термін</div>
            <div class="meta-val">{{ formatFriendlyDate(liveTask.dueDate, liveTask.dueTime) }}</div>
          </div>
          <div class="meta-card">
            <div class="meta-key"><span class="dot dot-brand"></span>Категорія</div>
            <div class="meta-val">{{ liveTask.category }}</div>
          </div>
          <div class="meta-card">
            <div class="meta-key"><span class="dot dot-warning"></span>Нагадування</div>
            <div class="meta-val">{{ reminderLabel(liveTask.reminderMinutes) }}</div>
          </div>
          <div class="meta-card">
            <div class="meta-key"><span class="dot dot-success"></span>Проєкт</div>
            <div class="meta-val">{{ liveTask.project || 'Без проєкту' }}</div>
          </div>
        </div>

        <section class="subtasks-section">
          <div class="subtasks-header">
            <h3>Підзадачі</h3>
            <span class="subtasks-progress">{{ subtaskStats.done }} з {{ subtaskStats.total }} · {{ subtaskStats.pct }}%</span>
          </div>

          <div class="sub-track">
            <div class="sub-fill" :style="{ width: `${subtaskStats.pct}%` }"></div>
          </div>

          <div class="subtasks-list">
            <div
              v-for="sub in liveTask.subtasks"
              :key="sub.id"
              class="subtask-row"
              @click="toggleSubtask(liveTask.id, sub.id)"
            >
              <span class="sub-check" :class="{ checked: sub.completed }">
                <Check v-if="sub.completed" :size="13" :stroke-width="2.8" />
              </span>
              <span class="sub-title" :class="{ done: sub.completed }">{{ sub.title }}</span>
              <button
                type="button"
                class="sub-del"
                aria-label="Видалити підзадачу"
                @click.stop="deleteSubtask(liveTask.id, sub.id)"
              >
                <Trash2 :size="14" />
              </button>
            </div>
          </div>

          <form class="add-sub-form" @submit.prevent="handleAddSubtask">
            <input
              v-model="newSubtaskTitle"
              type="text"
              placeholder="Додати підзадачу..."
              class="add-sub-input"
            />
            <button type="submit" class="add-sub-btn" aria-label="Додати підзадачу">
              <Plus :size="16" />
            </button>
          </form>
        </section>
      </div>

      <footer class="details-actions">
        <button type="button" class="btn-secondary" title="Додати нагадування в Apple/Google Календар (.ics)" @click="handleAddToCalendar">
          <CalendarPlus :size="16" />
          <span>.ics</span>
        </button>
        <button type="button" class="btn-secondary" @click="emit('edit', liveTask)">
          <Edit3 :size="16" />
          <span>Редагувати</span>
        </button>
        <button type="button" class="btn-primary" @click="handleCompleteToggle">
          <Check :size="16" />
          <span>{{ liveTask.completed ? 'Повернути' : 'Завершити' }}</span>
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.details-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.details-screen {
  width: min(430px, 100vw);
  height: min(860px, 100dvh);
  background: var(--bg-surface);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-shell);
}

@media (min-width: 520px) {
  .details-screen {
    border-radius: 32px;
    border: 1px solid var(--border-subtle);
  }
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 10px;
}

.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-btn.danger:hover {
  color: var(--status-danger);
  border-color: var(--status-danger);
}

.nav-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.details-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.badges-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-pill,
.prio-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.status-pill {
  background: var(--brand-primary-soft);
  color: var(--brand-primary);
}

.status-pill.done {
  background: var(--status-success-soft);
  color: var(--status-success);
}

.prio-high {
  background: var(--status-danger-soft);
  color: var(--status-danger);
}
.prio-medium {
  background: var(--status-warning-soft);
  color: var(--status-warning);
}
.prio-low {
  background: var(--status-success-soft);
  color: var(--status-success);
}

.task-title {
  margin: 0 0 6px;
  font-size: 20px;
  line-height: 28px;
  font-weight: 700;
}

.task-desc {
  margin: 0;
  font-size: 13px;
  line-height: 19px;
  color: var(--text-secondary);
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.meta-card {
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-key {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
}
.dot-danger {
  background: var(--status-danger);
}
.dot-brand {
  background: var(--brand-primary);
}
.dot-warning {
  background: var(--status-warning);
}
.dot-success {
  background: var(--status-success);
}

.meta-val {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.subtasks-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subtasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subtasks-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.subtasks-progress {
  font-size: 13px;
  color: var(--brand-primary);
  font-weight: 600;
}

.sub-track {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: var(--bg-muted);
  overflow: hidden;
}

.sub-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--brand-primary);
  transition: width 0.25s ease;
}

.subtasks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subtask-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
}

.sub-check {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid var(--border-subtle);
  background: var(--bg-input);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
}

.sub-check.checked {
  background: var(--status-success);
  border-color: var(--status-success);
}

.sub-title {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
}

.sub-title.done {
  color: var(--text-muted);
  text-decoration: line-through;
}

.sub-del {
  border: none;
  background: transparent;
  color: var(--text-muted);
  padding: 2px;
}

.sub-del:hover {
  color: var(--status-danger);
}

.add-sub-form {
  display: flex;
  gap: 8px;
  margin-top: 2px;
}

.add-sub-input {
  flex: 1;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.add-sub-input:focus {
  border-color: var(--brand-primary);
}

.add-sub-btn {
  width: 38px;
  border-radius: 12px;
  border: none;
  background: var(--brand-primary-soft);
  color: var(--brand-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.details-actions {
  display: flex;
  gap: 10px;
  padding: 12px 20px calc(16px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

.btn-secondary,
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 13px 18px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
}

.btn-secondary {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.btn-primary {
  flex: 1;
  border: none;
  background: var(--brand-primary);
  color: var(--text-on-primary);
}
</style>
