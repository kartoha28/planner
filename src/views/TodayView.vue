<script setup lang="ts">
import { computed, ref } from 'vue';
import { Bell, Moon, Plus, Search, Sun, X } from 'lucide-vue-next';
import ProgressCard from '@/components/ProgressCard.vue';
import TaskCard from '@/components/TaskCard.vue';
import { useNotifications } from '@/composables/useNotifications';
import { CATEGORY_OPTIONS, useTasks } from '@/composables/useTasks';
import { useTheme } from '@/composables/useTheme';
import type { Task, TaskCategory } from '@/types/task';

const emit = defineEmits<{
  openTask: [task: Task];
  createTask: [];
}>();

const { todayTasks, todayStats, toggleTaskComplete } = useTasks();
const { theme, toggleTheme } = useTheme();
const { permission, requestPermission, sendTestNotification } = useNotifications();

const selectedCategory = ref<'Усі' | TaskCategory>('Усі');
const searchOpen = ref(false);
const searchQuery = ref('');

const todayFormatted = computed(() => {
  const raw = new Date().toLocaleDateString('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
});

const nextDeadlineText = computed(() => {
  const next = todayTasks.value.find((t) => !t.completed);
  if (!next) return undefined;
  return `Наступний дедлайн о ${next.dueTime} · ${next.category}`;
});

const filteredTasks = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return todayTasks.value.filter((t) => {
    const catMatch = selectedCategory.value === 'Усі' || t.category === selectedCategory.value;
    const queryMatch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q);
    return catMatch && queryMatch;
  });
});

async function handleBellClick() {
  if (permission.value !== 'granted') {
    const res = await requestPermission();
    if (res === 'granted') {
      await sendTestNotification();
    }
  } else {
    await sendTestNotification();
  }
}
</script>

<template>
  <div class="today-view">
    <header class="top-header">
      <div>
        <p class="date-label">{{ todayFormatted }}</p>
        <h1 class="page-title">Мої задачі</h1>
      </div>

      <div class="header-actions">
        <button
          type="button"
          class="circle-btn"
          :title="permission === 'granted' ? 'Надіслати тестове сповіщення' : 'Увімкнути сповіщення'"
          aria-label="Сповіщення"
          @click="handleBellClick"
        >
          <Bell :size="17" />
          <span v-if="permission !== 'granted'" class="notif-dot"></span>
        </button>

        <button
          type="button"
          class="circle-btn"
          aria-label="Пошук задач"
          @click="searchOpen = !searchOpen"
        >
          <Search :size="17" />
        </button>

        <button
          type="button"
          class="circle-btn"
          :title="theme === 'dark' ? 'Світла тема' : 'Темна тема'"
          aria-label="Перемкнути тему"
          @click="toggleTheme"
        >
          <Sun v-if="theme === 'dark'" :size="17" />
          <Moon v-else :size="17" />
        </button>
      </div>
    </header>

    <div v-if="searchOpen" class="search-bar">
      <Search :size="15" class="search-icon" />
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="Знайти задачу на сьогодні..."
        autofocus
      />
      <button type="button" class="search-clear" aria-label="Очистити пошук" @click="searchQuery = ''; searchOpen = false">
        <X :size="15" />
      </button>
    </div>

    <ProgressCard
      :done="todayStats.done"
      :total="todayStats.total"
      :percent="todayStats.percent"
      :next-deadline-text="nextDeadlineText"
    />

    <div class="chips-scroll" role="tablist" aria-label="Фільтр за категорією">
      <button
        type="button"
        class="chip"
        :class="{ active: selectedCategory === 'Усі' }"
        @click="selectedCategory = 'Усі'"
      >
        Усі
      </button>
      <button
        v-for="cat in CATEGORY_OPTIONS"
        :key="cat"
        type="button"
        class="chip"
        :class="{ active: selectedCategory === cat }"
        @click="selectedCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <div class="section-header">
      <h2>На сьогодні</h2>
      <span class="section-counter">{{ todayStats.active }} активні · {{ todayStats.done }} готові</span>
    </div>

    <div v-if="filteredTasks.length > 0" class="tasks-list">
      <TaskCard
        v-for="task in filteredTasks"
        :key="task.id"
        :task="task"
        @toggle="toggleTaskComplete"
        @open="emit('openTask', $event)"
      />
    </div>

    <div v-else class="empty-state">
      <p>Немає задач за вибраним фільтром</p>
      <button type="button" class="empty-btn" @click="emit('createTask')">+ Додати задачу</button>
    </div>

    <button type="button" class="fab" aria-label="Створити нову задачу" @click="emit('createTask')">
      <Plus :size="24" :stroke-width="2.4" />
    </button>
  </div>
</template>

<style scoped>
.today-view {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 20px 84px;
}

.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.date-label {
  margin: 0 0 2px;
  font-size: 13px;
  color: var(--text-secondary);
}

.page-title {
  margin: 0;
  font-size: 24px;
  line-height: 30px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.circle-btn {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.notif-dot {
  position: absolute;
  top: 7px;
  right: 8px;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--status-danger);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 14px;
  border: 1px solid var(--brand-primary);
  background: var(--bg-input);
}

.search-icon,
.search-clear {
  color: var(--text-muted);
  border: none;
  background: transparent;
  padding: 0;
  display: inline-flex;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.chips-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.chips-scroll::-webkit-scrollbar {
  display: none;
}

.chip {
  flex-shrink: 0;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 13px;
  transition: all 0.18s ease;
}

.chip.active {
  background: var(--brand-primary);
  border-color: var(--brand-primary);
  color: var(--text-on-primary);
  font-weight: 500;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.section-counter {
  font-size: 13px;
  color: var(--text-secondary);
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-state {
  text-align: center;
  padding: 28px 16px;
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-subtle);
  color: var(--text-secondary);
  font-size: 14px;
}

.empty-btn {
  margin-top: 8px;
  padding: 8px 16px;
  border-radius: 999px;
  border: none;
  background: var(--brand-primary-soft);
  color: var(--brand-primary);
  font-weight: 600;
  font-size: 13px;
}

.fab {
  position: fixed;
  bottom: calc(82px + env(safe-area-inset-bottom, 0px));
  right: max(20px, calc(50% - 195px));
  width: 54px;
  height: 54px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-end) 100%);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-fab);
  z-index: 30;
  transition: transform 0.15s ease;
}

.fab:active {
  transform: scale(0.95);
}
</style>
