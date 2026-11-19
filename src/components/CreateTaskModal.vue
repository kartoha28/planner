<script setup lang="ts">
import { ref } from 'vue';
import { X } from 'lucide-vue-next';
import { CATEGORY_OPTIONS, formatDateISO } from '@/composables/useTasks';
import type { ReminderOption, Task, TaskCategory, TaskPriority } from '@/types/task';

const props = defineProps<{
  initialTask?: Task | null;
  defaultDate?: string;
}>();

const emit = defineEmits<{
  close: [];
  save: [payload: Omit<Task, 'id' | 'createdAt' | 'notifiedAt'>, existingId?: string];
}>();

const title = ref(props.initialTask?.title ?? '');
const description = ref(props.initialTask?.description ?? '');
const category = ref<TaskCategory>(props.initialTask?.category ?? 'Навчання');
const project = ref(props.initialTask?.project ?? '3 курс · Універ');
const priority = ref<TaskPriority>(props.initialTask?.priority ?? 'high');
const dueDate = ref(props.initialTask?.dueDate ?? props.defaultDate ?? formatDateISO(new Date()));
const dueTime = ref(
  props.initialTask?.dueTime ??
    new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    })
);
const location = ref(props.initialTask?.location ?? '');
const reminderMinutes = ref<ReminderOption>(props.initialTask?.reminderMinutes ?? '15');

const reminderChoices: { value: ReminderOption; label: string }[] = [
  { value: '0', label: 'У момент старту' },
  { value: '5', label: 'За 5 хв' },
  { value: '15', label: 'За 15 хв' },
  { value: '30', label: 'За 30 хв' },
  { value: '60', label: 'За 1 год' },
  { value: 'none', label: 'Без сповіщень' },
];

function handleSubmit() {
  const cleanTitle = title.value.trim();
  if (!cleanTitle) return;

  emit(
    'save',
    {
      title: cleanTitle,
      description: description.value.trim(),
      category: category.value,
      project: project.value.trim() || category.value,
      priority: priority.value,
      dueDate: dueDate.value,
      dueTime: dueTime.value,
      location: location.value.trim() || undefined,
      reminderMinutes: reminderMinutes.value,
      completed: props.initialTask?.completed ?? false,
      subtasks: props.initialTask?.subtasks ?? [],
    },
    props.initialTask?.id
  );
}
</script>

<template>
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Створити або редагувати задачу" @click.self="emit('close')">
    <div class="sheet">
      <div class="handle-wrap"><div class="drag-handle"></div></div>

      <header class="sheet-header">
        <h2>{{ initialTask ? 'Редагувати задачу' : 'Нова задача' }}</h2>
        <button type="button" class="close-btn" aria-label="Закрити" @click="emit('close')">
          <X :size="16" />
        </button>
      </header>

      <form class="sheet-form" @submit.prevent="handleSubmit">
        <label class="field">
          <span class="field-label">Назва задачі</span>
          <input
            v-model="title"
            type="text"
            class="field-input"
            placeholder="Підготувати презентацію до захисту"
            required
            autofocus
          />
        </label>

        <label class="field">
          <span class="field-label">Нотатки</span>
          <textarea
            v-model="description"
            rows="2"
            class="field-input field-textarea"
            placeholder="Додати опис або посилання на матеріали..."
          ></textarea>
        </label>

        <div class="field">
          <span class="field-label">Категорія</span>
          <div class="chips-row">
            <button
              v-for="cat in CATEGORY_OPTIONS"
              :key="cat"
              type="button"
              class="chip-btn"
              :class="{ active: category === cat }"
              @click="category = cat"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <div class="field">
          <span class="field-label">Пріоритет</span>
          <div class="prio-row">
            <button
              type="button"
              class="prio-opt"
              :class="{ 'active-low': priority === 'low' }"
              @click="priority = 'low'"
            >
              Низький
            </button>
            <button
              type="button"
              class="prio-opt"
              :class="{ 'active-medium': priority === 'medium' }"
              @click="priority = 'medium'"
            >
              Середній
            </button>
            <button
              type="button"
              class="prio-opt"
              :class="{ 'active-high': priority === 'high' }"
              @click="priority = 'high'"
            >
              Високий
            </button>
          </div>
        </div>

        <div class="two-cols">
          <label class="field">
            <span class="field-label">Дата</span>
            <input v-model="dueDate" type="date" class="field-input" required />
          </label>
          <label class="field">
            <span class="field-label">Час</span>
            <input v-model="dueTime" type="time" class="field-input" required />
          </label>
        </div>

        <div class="two-cols">
          <label class="field">
            <span class="field-label">Нагадування (Push)</span>
            <select v-model="reminderMinutes" class="field-input">
              <option v-for="opt in reminderChoices" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
          <label class="field">
            <span class="field-label">Проєкт / Тег</span>
            <input v-model="project" type="text" class="field-input" placeholder="3 курс · Універ" />
          </label>
        </div>

        <button type="submit" class="submit-btn">
          {{ initialTask ? 'Зберегти зміни' : 'Створити задачу' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  background: rgba(15, 23, 42, 0.62);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

@media (min-width: 520px) {
  .modal-overlay {
    align-items: center;
  }
}

.sheet {
  width: min(430px, 100vw);
  max-height: 92dvh;
  overflow-y: auto;
  background: var(--bg-surface);
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  border: 1px solid var(--border-subtle);
  padding: 10px 20px calc(22px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--shadow-shell);
}

@media (min-width: 520px) {
  .sheet {
    border-radius: 28px;
  }
}

.handle-wrap {
  display: flex;
  justify-content: center;
}

.drag-handle {
  width: 40px;
  height: 4px;
  border-radius: 999px;
  background: var(--border-subtle);
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sheet-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: none;
  background: var(--bg-muted);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.sheet-form {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.field-input {
  width: 100%;
  padding: 11px 14px;
  border-radius: 14px;
  border: 1.5px solid var(--border-subtle);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field-input:focus {
  border-color: var(--brand-primary);
  box-shadow: var(--shadow-focus);
}

.field-textarea {
  resize: vertical;
  min-height: 58px;
}

.chips-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip-btn {
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 13px;
}

.chip-btn.active {
  background: var(--brand-primary);
  border-color: var(--brand-primary);
  color: var(--text-on-primary);
}

.prio-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.prio-opt {
  padding: 10px 8px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.prio-opt.active-high {
  background: var(--status-danger-soft);
  border-color: var(--status-danger);
  color: var(--status-danger);
}

.prio-opt.active-medium {
  background: var(--status-warning-soft);
  border-color: var(--status-warning);
  color: var(--status-warning);
}

.prio-opt.active-low {
  background: var(--status-success-soft);
  border-color: var(--status-success);
  color: var(--status-success);
}

.two-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.submit-btn {
  margin-top: 4px;
  width: 100%;
  padding: 14px 18px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--brand-primary);
  color: var(--text-on-primary);
  font-size: 15px;
  font-weight: 600;
}

.submit-btn:hover {
  filter: brightness(1.06);
}
</style>
