<script setup lang="ts">
import { Bell, Check, Clock } from 'lucide-vue-next';
import { PRIORITY_LABELS } from '@/composables/useTasks';
import type { Task } from '@/types/task';

const props = defineProps<{
  task: Task;
}>();

const emit = defineEmits<{
  toggle: [id: string];
  open: [task: Task];
}>();

function subtasksSummary(task: Task): string {
  if (!task.subtasks || task.subtasks.length === 0) return '';
  const done = task.subtasks.filter((s) => s.completed).length;
  return ` · ${done}/${task.subtasks.length}`;
}
</script>

<template>
  <article
    class="task-card"
    :class="{ 'is-completed': task.completed }"
    @click="emit('open', props.task)"
  >
    <button
      type="button"
      class="checkbox"
      :class="{ checked: task.completed }"
      :aria-label="task.completed ? 'Позначити як невиконану' : 'Позначити як виконану'"
      @click.stop="emit('toggle', task.id)"
    >
      <Check v-if="task.completed" :size="14" :stroke-width="2.8" />
    </button>

    <div class="content">
      <h3 class="title">{{ task.title }}</h3>
      <div class="meta">
        <Clock :size="12" class="meta-icon" />
        <span>{{ task.category }} · {{ task.dueTime }}{{ subtasksSummary(task) }}</span>
        <Bell
          v-if="task.reminderMinutes !== 'none' && !task.completed"
          :size="12"
          class="reminder-icon"
          title="Увімкнено нагадування"
        />
      </div>
    </div>

    <span v-if="!task.completed" class="priority-badge" :class="`prio-${task.priority}`">
      {{ PRIORITY_LABELS[task.priority] }}
    </span>
  </article>
</template>

<style scoped>
.task-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.2s ease, opacity 0.2s ease;
}

.task-card:hover {
  border-color: var(--brand-primary);
}

.task-card:active {
  transform: scale(0.99);
}

.task-card.is-completed {
  opacity: 0.72;
}

.checkbox {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  border: 2px solid var(--border-subtle);
  background: var(--bg-input);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  padding: 0;
  transition: all 0.2s ease;
}

.checkbox.checked {
  background: var(--status-success);
  border-color: var(--status-success);
}

.content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title {
  margin: 0;
  font-size: 15px;
  line-height: 21px;
  font-weight: 500;
  color: var(--text-primary);
  word-break: break-word;
}

.is-completed .title {
  color: var(--text-muted);
  text-decoration: line-through;
}

.meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  line-height: 18px;
  color: var(--text-secondary);
}

.is-completed .meta {
  color: var(--text-muted);
}

.meta-icon {
  flex-shrink: 0;
  color: var(--text-muted);
}

.reminder-icon {
  flex-shrink: 0;
  color: var(--brand-primary);
}

.priority-badge {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 14px;
  font-weight: 600;
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
</style>
