<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import BottomTabBar from '@/components/BottomTabBar.vue';
import CreateTaskModal from '@/components/CreateTaskModal.vue';
import InstallBanner from '@/components/InstallBanner.vue';
import TaskDetailsModal from '@/components/TaskDetailsModal.vue';
import ToastBanner from '@/components/ToastBanner.vue';
import { useNotifications } from '@/composables/useNotifications';
import { useTasks } from '@/composables/useTasks';
import { useTheme } from '@/composables/useTheme';
import CalendarView from '@/views/CalendarView.vue';
import ProfileView from '@/views/ProfileView.vue';
import ProjectsView from '@/views/ProjectsView.vue';
import TodayView from '@/views/TodayView.vue';
import type { AppTab, Task } from '@/types/task';

useTheme();
const { addTask, updateTask } = useTasks();
const { startScheduler, stopScheduler, checkDueReminders, pushToast } = useNotifications();

const activeTab = ref<AppTab>('today');
const selectedTask = ref<Task | null>(null);
const createModalOpen = ref(false);
const editingTask = ref<Task | null>(null);
const defaultModalDate = ref<string | undefined>(undefined);

onMounted(() => {
  startScheduler();
});

onUnmounted(() => {
  stopScheduler();
});

function openCreateModal(dateISO?: string) {
  editingTask.value = null;
  defaultModalDate.value = dateISO;
  createModalOpen.value = true;
}

function openEditModal(task: Task) {
  selectedTask.value = null;
  editingTask.value = task;
  defaultModalDate.value = task.dueDate;
  createModalOpen.value = true;
}

function handleSaveTask(payload: Omit<Task, 'id' | 'createdAt' | 'notifiedAt'>, existingId?: string) {
  if (existingId) {
    updateTask(existingId, { ...payload, notifiedAt: null });
    pushToast('Задачу оновлено', payload.title, 'success');
  } else {
    addTask(payload);
    pushToast('Задачу створено', `${payload.title} · ${payload.dueTime}`, 'success');
  }
  createModalOpen.value = false;
  editingTask.value = null;
  checkDueReminders();
}
</script>

<template>
  <div class="app-backdrop">
    <div class="app-shell">
      <InstallBanner />

      <main class="app-main">
        <TodayView
          v-if="activeTab === 'today'"
          @open-task="selectedTask = $event"
          @create-task="openCreateModal()"
        />
        <CalendarView
          v-else-if="activeTab === 'calendar'"
          @open-task="selectedTask = $event"
          @create-task-for-date="openCreateModal($event)"
        />
        <ProjectsView
          v-else-if="activeTab === 'projects'"
          @open-task="selectedTask = $event"
          @create-task="openCreateModal()"
        />
        <ProfileView v-else />
      </main>

      <BottomTabBar :active-tab="activeTab" @change="activeTab = $event" />
    </div>

    <TaskDetailsModal
      v-if="selectedTask"
      :task="selectedTask"
      @close="selectedTask = null"
      @edit="openEditModal"
    />

    <CreateTaskModal
      v-if="createModalOpen"
      :initial-task="editingTask"
      :default-date="defaultModalDate"
      @close="createModalOpen = false; editingTask = null"
      @save="handleSaveTask"
    />

    <ToastBanner />
  </div>
</template>

<style scoped>
.app-backdrop {
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--bg-canvas);
}

@media (min-width: 520px) {
  .app-backdrop {
    padding: 20px;
    background: radial-gradient(circle at top right, rgba(79, 70, 229, 0.1), transparent 45%),
      var(--bg-canvas);
  }
}

.app-shell {
  width: min(430px, 100vw);
  height: 100dvh;
  background: var(--bg-canvas);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

@media (min-width: 520px) {
  .app-shell {
    height: min(860px, calc(100dvh - 40px));
    border-radius: 36px;
    border: 1px solid var(--border-subtle);
    box-shadow: var(--shadow-shell);
  }
}

.install-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 16px;
  background: var(--brand-primary-soft);
  color: var(--brand-primary);
  font-size: 12px;
  font-weight: 600;
}

.install-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 999px;
  border: none;
  background: var(--brand-primary);
  color: var(--text-on-primary);
  font-size: 11px;
  font-weight: 600;
}

.app-main {
  flex: 1;
  overflow-y: auto;
}
</style>
