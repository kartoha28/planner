<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronLeft, ChevronRight, MapPin, Plus } from 'lucide-vue-next';
import { addDaysISO, formatDateISO, PRIORITY_LABELS, useTasks } from '@/composables/useTasks';
import type { Task } from '@/types/task';

const emit = defineEmits<{
  openTask: [task: Task];
  createTaskForDate: [dateISO: string];
}>();

const { tasks, todayISO } = useTasks();

const viewMode = ref<'day' | 'week'>('day');
const selectedDate = ref<string>(todayISO.value);

const weekDays = computed(() => {
  const [y, m, d] = selectedDate.value.split('-').map(Number);
  const current = new Date(y, m - 1, d);
  const jsDay = current.getDay(); // 0=Sun..6=Sat
  const diffToMon = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(y, m - 1, d + diffToMon);
  const shortNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const iso = formatDateISO(dt);
    const hasTasks = tasks.value.some((t) => t.dueDate === iso && !t.completed);
    return {
      iso,
      label: shortNames[i],
      dayNum: String(dt.getDate()),
      hasTasks,
    };
  });
});

const monthTitle = computed(() => {
  const [y, m, d] = selectedDate.value.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const formatted = dt.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace(' р.', '');
});

const currentTimeStr = computed(() =>
  new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
);

const dayTasks = computed(() =>
  tasks.value
    .filter((t) => t.dueDate === selectedDate.value)
    .sort((a, b) => a.dueTime.localeCompare(b.dueTime))
);

const weekTasksGrouped = computed(() =>
  weekDays.value.map((day) => ({
    ...day,
    items: tasks.value.filter((t) => t.dueDate === day.iso).sort((a, b) => a.dueTime.localeCompare(b.dueTime)),
  }))
);

function shiftWeek(deltaDays: number) {
  selectedDate.value = addDaysISO(selectedDate.value, deltaDays);
}

function accentTone(task: Task): string {
  if (task.completed) return 'tone-done';
  if (task.priority === 'high') return 'tone-danger';
  if (task.priority === 'medium') return 'tone-warning';
  if (task.category === 'Навчання') return 'tone-brand';
  return 'tone-success';
}
</script>

<template>
  <div class="calendar-view">
    <header class="cal-header">
      <div class="month-nav">
        <button type="button" class="mini-btn" aria-label="Попередній тиждень" @click="shiftWeek(-7)">
          <ChevronLeft :size="16" />
        </button>
        <h1 class="month-title">{{ monthTitle }}</h1>
        <button type="button" class="mini-btn" aria-label="Наступний тиждень" @click="shiftWeek(7)">
          <ChevronRight :size="16" />
        </button>
      </div>

      <div class="seg-toggle">
        <button type="button" :class="{ active: viewMode === 'day' }" @click="viewMode = 'day'">День</button>
        <button type="button" :class="{ active: viewMode === 'week' }" @click="viewMode = 'week'">Тиждень</button>
      </div>
    </header>

    <div class="week-strip">
      <button
        v-for="day in weekDays"
        :key="day.iso"
        type="button"
        class="day-pill"
        :class="{ active: day.iso === selectedDate, today: day.iso === todayISO }"
        @click="selectedDate = day.iso"
      >
        <span class="day-name">{{ day.label }}</span>
        <span class="day-num">{{ day.dayNum }}</span>
        <span class="day-dot" :class="{ visible: day.hasTasks }"></span>
      </button>
    </div>

    <div v-if="viewMode === 'day'" class="timeline">
      <div class="now-line-row">
        <span class="now-time">{{ currentTimeStr }}</span>
        <span class="now-dot"></span>
        <span class="now-line"></span>
      </div>

      <div v-if="dayTasks.length === 0" class="empty-cal">
        <p>На цей день задач ще немає</p>
        <button type="button" class="add-day-btn" @click="emit('createTaskForDate', selectedDate)">
          <Plus :size="15" /> Запланувати задачу
        </button>
      </div>

      <div v-for="task in dayTasks" :key="task.id" class="slot-row" @click="emit('openTask', task)">
        <span class="slot-time">{{ task.dueTime }}</span>
        <div class="event-card" :class="accentTone(task)">
          <div class="event-bar"></div>
          <div class="event-info">
            <h3 class="event-title" :class="{ done: task.completed }">{{ task.title }}</h3>
            <p class="event-sub">
              <span>{{ task.dueTime }}{{ task.endTime ? ` – ${task.endTime}` : '' }}</span>
              <span v-if="task.location" class="loc-tag"><MapPin :size="12" /> {{ task.location }}</span>
              <span v-else>· {{ PRIORITY_LABELS[task.priority] }} пріоритет</span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="week-overview">
      <div v-for="day in weekTasksGrouped" :key="day.iso" class="week-day-group">
        <div class="week-day-head" @click="selectedDate = day.iso; viewMode = 'day'">
          <span>{{ day.label }}, {{ day.dayNum }}</span>
          <span class="count-pill">{{ day.items.length }}</span>
        </div>
        <div v-if="day.items.length > 0" class="week-items">
          <button
            v-for="t in day.items"
            :key="t.id"
            type="button"
            class="week-mini-card"
            :class="accentTone(t)"
            @click="emit('openTask', t)"
          >
            <span class="mini-time">{{ t.dueTime }}</span>
            <span class="mini-title">{{ t.title }}</span>
          </button>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="cal-fab"
      aria-label="Додати задачу на вибрану дату"
      @click="emit('createTaskForDate', selectedDate)"
    >
      <Plus :size="22" />
    </button>
  </div>
</template>

<style scoped>
.calendar-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 14px 20px 84px;
}

.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mini-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.month-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.seg-toggle {
  display: inline-flex;
  padding: 3px;
  border-radius: 12px;
  background: var(--bg-muted);
}

.seg-toggle button {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  padding: 6px 11px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
}

.seg-toggle button.active {
  background: var(--bg-elevated);
  color: var(--text-primary);
  box-shadow: var(--shadow-card);
}

.week-strip {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.day-pill {
  padding: 9px 4px;
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--text-primary);
}

.day-pill.today:not(.active) {
  border-color: var(--brand-primary);
}

.day-pill.active {
  background: var(--brand-primary);
  border-color: var(--brand-primary);
  color: var(--text-on-primary);
  box-shadow: 0 6px 14px rgba(79, 70, 229, 0.3);
}

.day-name {
  font-size: 11px;
  font-weight: 600;
  opacity: 0.8;
}

.day-num {
  font-size: 15px;
  font-weight: 700;
}

.day-dot {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: var(--brand-primary);
  opacity: 0;
}

.day-pill.active .day-dot {
  background: #ffffff;
}

.day-dot.visible {
  opacity: 1;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.now-line-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.now-time {
  width: 44px;
  font-size: 11px;
  font-weight: 600;
  color: var(--status-danger);
}

.now-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--status-danger);
}

.now-line {
  flex: 1;
  height: 2px;
  border-radius: 999px;
  background: var(--status-danger);
}

.slot-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
}

.slot-time {
  width: 44px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--text-secondary);
  padding-top: 2px;
}

.event-card {
  flex: 1;
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
}

.event-bar {
  width: 4px;
  border-radius: 999px;
  flex-shrink: 0;
}

.event-info {
  flex: 1;
  min-width: 0;
}

.event-title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.event-title.done {
  text-decoration: line-through;
  opacity: 0.65;
}

.event-sub {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.loc-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.tone-brand {
  background: var(--brand-primary-soft);
}
.tone-brand .event-bar {
  background: var(--brand-primary);
}

.tone-warning {
  background: var(--status-warning-soft);
}
.tone-warning .event-bar {
  background: var(--status-warning);
}

.tone-danger {
  background: var(--status-danger-soft);
}
.tone-danger .event-bar {
  background: var(--status-danger);
}

.tone-success {
  background: var(--status-success-soft);
}
.tone-success .event-bar {
  background: var(--status-success);
}

.tone-done {
  background: var(--bg-muted);
}
.tone-done .event-bar {
  background: var(--text-muted);
}

.empty-cal {
  text-align: center;
  padding: 28px 16px;
  border: 1px dashed var(--border-subtle);
  border-radius: 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

.add-day-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  border: none;
  background: var(--brand-primary-soft);
  color: var(--brand-primary);
  font-size: 13px;
  font-weight: 600;
}

.week-overview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.week-day-group {
  border-radius: 14px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  padding: 10px 12px;
}

.week-day-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.count-pill {
  background: var(--bg-muted);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
}

.week-items {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.week-mini-card {
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  gap: 8px;
  text-align: left;
  color: var(--text-primary);
  font-size: 13px;
}

.mini-time {
  font-weight: 600;
  opacity: 0.8;
}

.cal-fab {
  position: fixed;
  bottom: calc(82px + env(safe-area-inset-bottom, 0px));
  right: max(20px, calc(50% - 195px));
  width: 50px;
  height: 50px;
  border-radius: 999px;
  border: none;
  background: var(--brand-primary);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-fab);
  z-index: 30;
}
</style>
