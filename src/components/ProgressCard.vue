<script setup lang="ts">
import { Flame } from 'lucide-vue-next';

defineProps<{
  done: number;
  total: number;
  percent: number;
  nextDeadlineText?: string;
}>();
</script>

<template>
  <section class="progress-card" aria-label="Прогрес виконання задач за день">
    <div class="orb orb-top" aria-hidden="true"></div>
    <div class="orb orb-bottom" aria-hidden="true"></div>

    <div class="progress-top">
      <div class="streak">
        <Flame :size="15" class="streak-icon" />
        <span>Прогрес дня · 5 днів серія</span>
      </div>
      <span class="pct-pill">{{ percent }}%</span>
    </div>

    <h2 class="progress-count">
      {{ done }} з {{ total }} {{ total === 1 ? 'задачі' : 'задач' }} виконано
    </h2>

    <div class="track" role="progressbar" :aria-valuenow="percent" aria-valuemin="0" aria-valuemax="100">
      <div class="fill" :style="{ width: `${percent}%` }"></div>
    </div>

    <p class="progress-sub">
      {{ nextDeadlineText || 'Усі задачі на сьогодні виконано — чудова робота!' }}
    </p>
  </section>
</template>

<style scoped>
.progress-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  color: var(--text-on-primary);
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-end) 100%);
  box-shadow: 0 12px 28px rgba(79, 70, 229, 0.3);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.orb {
  position: absolute;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  pointer-events: none;
}

.orb-top {
  width: 120px;
  height: 120px;
  top: -36px;
  right: -24px;
}

.orb-bottom {
  width: 72px;
  height: 72px;
  bottom: -24px;
  left: -18px;
  opacity: 0.6;
}

.progress-top {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.streak {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  opacity: 0.92;
}

.streak-icon {
  color: #fde68a;
}

.pct-pill {
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.progress-count {
  position: relative;
  margin: 0;
  font-size: 20px;
  line-height: 28px;
  font-weight: 700;
}

.track {
  position: relative;
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.24);
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: 999px;
  background: #ffffff;
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-sub {
  position: relative;
  margin: 0;
  font-size: 13px;
  line-height: 18px;
  opacity: 0.9;
}
</style>
