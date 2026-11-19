<script setup lang="ts">
import { computed } from 'vue';
import { Folder, Plus } from 'lucide-vue-next';
import { CATEGORY_OPTIONS, useTasks } from '@/composables/useTasks';
import type { Task } from '@/types/task';

const emit = defineEmits<{
  openTask: [task: Task];
  createTask: [];
}>();

const { tasks } = useTasks();

const categoryCards = computed(() =>
  CATEGORY_OPTIONS.map((cat) => {
    const items = tasks.value.filter((t) => t.category === cat);
    const done = items.filter((t) => t.completed).length;
    const pct = items.length === 0 ? 0 : Math.round((done / items.length) * 100);
    return { cat, items, done, total: items.length, pct };
  })
);
</script>

<template>
  <div class="projects-view">
    <header class="proj-header">
      <div>
        <p class="subtitle">Усі напрямки та категорії</p>
        <h1>Проєкти й задачі</h1>
      </div>
      <button type="button" class="add-pill" @click="emit('createTask')">
        <Plus :size="15" /> Нова
      </button>
    </header>

    <div class="grid">
      <section v-for="group in categoryCards" :key="group.cat" class="project-card">
        <div class="project-top">
          <div class="folder-badge">
            <Folder :size="16" />
          </div>
          <div class="project-meta">
            <h2>{{ group.cat }}</h2>
            <span>{{ group.done }} з {{ group.total }} виконано</span>
          </div>
          <span class="pct">{{ group.pct }}%</span>
        </div>

        <div class="bar-track">
          <div class="bar-fill" :style="{ width: `${group.pct}%` }"></div>
        </div>

        <div v-if="group.items.length > 0" class="mini-list">
          <button
            v-for="item in group.items.slice(0, 3)"
            :key="item.id"
            type="button"
            class="mini-item"
            :class="{ done: item.completed }"
            @click="emit('openTask', item)"
          >
            <span class="bullet"></span>
            <span class="item-text">{{ item.title }}</span>
            <span class="item-date">{{ item.dueTime }}</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.projects-view {
  padding: 14px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.proj-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subtitle {
  margin: 0 0 2px;
  font-size: 13px;
  color: var(--text-secondary);
}

.proj-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.add-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: 999px;
  border: none;
  background: var(--brand-primary);
  color: var(--text-on-primary);
  font-size: 13px;
  font-weight: 600;
}

.grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-card {
  padding: 14px;
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.project-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.folder-badge {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--brand-primary-soft);
  color: var(--brand-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.project-meta {
  flex: 1;
}

.project-meta h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.project-meta span {
  font-size: 12px;
  color: var(--text-secondary);
}

.pct {
  font-size: 13px;
  font-weight: 700;
  color: var(--brand-primary);
}

.bar-track {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: var(--bg-muted);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--brand-primary);
  transition: width 0.3s ease;
}

.mini-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mini-item {
  width: 100%;
  border: none;
  background: var(--bg-canvas);
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
  font-size: 13px;
  text-align: left;
}

.mini-item.done .item-text {
  text-decoration: line-through;
  color: var(--text-muted);
}

.bullet {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--brand-primary);
  flex-shrink: 0;
}

.item-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-date {
  font-size: 11px;
  color: var(--text-muted);
}
</style>
