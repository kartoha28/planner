<script setup lang="ts">
import { BellRing, X } from 'lucide-vue-next';
import { dismissToast, useNotifications } from '@/composables/useNotifications';

const { toasts } = useNotifications();
</script>

<template>
  <div class="toast-stack" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="`toast-${toast.variant}`">
        <BellRing :size="18" class="toast-icon" />
        <div class="toast-text">
          <div class="toast-title">{{ toast.title }}</div>
          <div v-if="toast.body" class="toast-body">{{ toast.body }}</div>
        </div>
        <button type="button" class="toast-close" aria-label="Закрити" @click="dismissToast(toast.id)">
          <X :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: min(370px, calc(100vw - 24px));
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.2);
}

.toast-info .toast-icon {
  color: var(--brand-primary);
}
.toast-success .toast-icon {
  color: var(--status-success);
}
.toast-warning .toast-icon {
  color: var(--status-warning);
}
.toast-danger .toast-icon {
  color: var(--status-danger);
}

.toast-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-text {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.toast-body {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 16px;
}

.toast-close {
  border: none;
  background: transparent;
  color: var(--text-muted);
  padding: 2px;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.97);
}
</style>
