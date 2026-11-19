<script setup lang="ts">
import { Calendar, CheckSquare, Folder, User } from 'lucide-vue-next';
import type { AppTab } from '@/types/task';

defineProps<{
  activeTab: AppTab;
}>();

const emit = defineEmits<{
  change: [tab: AppTab];
}>();

const tabs: { id: AppTab; label: string; icon: typeof CheckSquare }[] = [
  { id: 'today', label: 'Сьогодні', icon: CheckSquare },
  { id: 'calendar', label: 'Календар', icon: Calendar },
  { id: 'projects', label: 'Проєкти', icon: Folder },
  { id: 'profile', label: 'Профіль', icon: User },
];
</script>

<template>
  <nav class="bottom-nav" aria-label="Основна навігація">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="nav-item"
      :class="{ active: activeTab === tab.id }"
      @click="emit('change', tab.id)"
    >
      <span class="icon-pill">
        <component :is="tab.icon" :size="20" :stroke-width="2" />
      </span>
      <span class="nav-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 8px 10px calc(10px + env(safe-area-inset-bottom, 0px));
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.nav-item {
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 2px 4px;
  color: var(--text-muted);
  transition: color 0.18s ease;
}

.nav-item.active {
  color: var(--brand-primary);
}

.icon-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 14px;
  border-radius: 999px;
  transition: background-color 0.2s ease;
}

.nav-item.active .icon-pill {
  background: var(--brand-primary-soft);
}

.nav-label {
  font-size: 11px;
  line-height: 14px;
  font-weight: 600;
}
</style>
