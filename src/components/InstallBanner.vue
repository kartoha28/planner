<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Download, PlusSquare, Share, Smartphone, X } from 'lucide-vue-next';
import { pushToast } from '@/composables/useNotifications';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'taskflow_install_banner_dismissed_v1';

const installPromptEvent = ref<BeforeInstallPromptEvent | null>(null);
const dismissed = ref(false);
const showIosModal = ref(false);

try {
  dismissed.value = localStorage.getItem(DISMISS_KEY) === 'true';
} catch {
  dismissed.value = false;
}

const isStandalone = computed(() => {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
});

const isIOS = computed(() => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
});

const isSafariOnIOS = computed(() => {
  if (!isIOS.value) return false;
  const ua = window.navigator.userAgent;
  return !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
});

const showAndroidBanner = computed(() => !isStandalone.value && installPromptEvent.value !== null && !dismissed.value);
const showIosBanner = computed(() => !isStandalone.value && isIOS.value && !dismissed.value);

function handleBeforeInstall(e: Event) {
  e.preventDefault();
  installPromptEvent.value = e as BeforeInstallPromptEvent;
}

async function triggerAndroidInstall() {
  if (!installPromptEvent.value) return;
  await installPromptEvent.value.prompt();
  const choice = await installPromptEvent.value.userChoice;
  if (choice.outcome === 'accepted') {
    pushToast('TaskFlow встановлено!', 'Додаток додано на робочий стіл.', 'success');
    installPromptEvent.value = null;
  }
}

function dismissBanner() {
  dismissed.value = true;
  try {
    localStorage.setItem(DISMISS_KEY, 'true');
  } catch {
    // Ignore storage error
  }
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstall);
});

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
});
</script>

<template>
  <!-- Android / Desktop Chrome Install Banner -->
  <div v-if="showAndroidBanner" class="install-banner">
    <div class="banner-left">
      <Smartphone :size="15" />
      <span>Встановити TaskFlow на робочий стіл (PWA)</span>
    </div>
    <div class="banner-actions">
      <button type="button" class="install-btn" @click="triggerAndroidInstall">
        <Download :size="13" /> Встановити
      </button>
      <button type="button" class="dismiss-btn" aria-label="Приховати" @click="dismissBanner">
        <X :size="14" />
      </button>
    </div>
  </div>

  <!-- iPhone / iPad Install Banner (Apple requires manual Share -> Add to Home Screen) -->
  <div v-else-if="showIosBanner" class="install-banner ios-banner">
    <div class="banner-left">
      <Smartphone :size="15" />
      <span>Додати TaskFlow на робочий стіл iPhone</span>
    </div>
    <div class="banner-actions">
      <button type="button" class="install-btn" @click="showIosModal = true">
        Як додати
      </button>
      <button type="button" class="dismiss-btn" aria-label="Приховати" @click="dismissBanner">
        <X :size="14" />
      </button>
    </div>
  </div>

  <!-- iOS Step-by-Step Visual Guide -->
  <div v-if="showIosModal" class="ios-modal-overlay" role="dialog" aria-modal="true" @click.self="showIosModal = false">
    <div class="ios-sheet">
      <div class="ios-sheet-head">
        <h3>Додати на екран iPhone</h3>
        <button type="button" class="ios-close" aria-label="Закрити" @click="showIosModal = false">
          <X :size="16" />
        </button>
      </div>

      <p class="ios-note">
        На iPhone (iOS) Apple не показує автоматичне вікно встановлення як на Android — додаток додається вручну за 3 кроки:
      </p>

      <div v-if="!isSafariOnIOS" class="safari-warning">
        Схоже, сайт відкрито не в Safari (або у вбудованому браузері). Для встановлення на екран «Додому» скопіюй посилання та відкрий його саме в <strong>Safari</strong>.
      </div>

      <ol class="ios-steps">
        <li>
          <span class="step-icon"><Share :size="18" /></span>
          <div>
            <strong>1. Натисни «Поділитися»</strong>
            <p>Іконка квадрата зі стрілкою вгору на нижній (або верхній) панелі Safari.</p>
          </div>
        </li>
        <li>
          <span class="step-icon"><PlusSquare :size="18" /></span>
          <div>
            <strong>2. Обери «На екран «Додому»»</strong>
            <p>Прогорни меню вниз (натисни «Ще» / More, якщо не видно одразу).</p>
          </div>
        </li>
        <li>
          <span class="step-icon">✓</span>
          <div>
            <strong>3. Натисни «Додати» і відкрий з іконки</strong>
            <p>На робочому столі з’явиться іконка <strong>TaskFlow</strong>. Відкрий програму з неї.</p>
          </div>
        </li>
      </ol>

      <button type="button" class="ios-done-btn" @click="showIosModal = false">Зрозуміло</button>
    </div>
  </div>
</template>

<style scoped>
.install-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 14px;
  background: var(--brand-primary-soft);
  color: var(--brand-primary);
  border-bottom: 1px solid var(--border-subtle);
  font-size: 12px;
  font-weight: 600;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.install-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 11px;
  border-radius: 999px;
  border: none;
  background: var(--brand-primary);
  color: var(--text-on-primary);
  font-size: 11px;
  font-weight: 600;
}

.dismiss-btn {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  padding: 3px;
  display: inline-flex;
}

.ios-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

@media (min-width: 520px) {
  .ios-modal-overlay {
    align-items: center;
  }
}

.ios-sheet {
  width: min(430px, 100vw);
  background: var(--bg-surface);
  border-top-left-radius: 26px;
  border-top-right-radius: 26px;
  border: 1px solid var(--border-subtle);
  padding: 18px 20px calc(22px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (min-width: 520px) {
  .ios-sheet {
    border-radius: 26px;
  }
}

.ios-sheet-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ios-sheet-head h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.ios-close {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: none;
  background: var(--bg-muted);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ios-note {
  margin: 0;
  font-size: 13px;
  line-height: 18px;
  color: var(--text-secondary);
}

.safari-warning {
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--status-warning-soft);
  color: var(--status-warning);
  font-size: 12px;
  line-height: 17px;
}

.ios-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ios-steps li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
}

.step-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--brand-primary-soft);
  color: var(--brand-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.ios-steps strong {
  display: block;
  font-size: 13px;
  margin-bottom: 2px;
}

.ios-steps p {
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  color: var(--text-secondary);
}

.ios-done-btn {
  width: 100%;
  padding: 12px;
  border-radius: 14px;
  border: none;
  background: var(--brand-primary);
  color: var(--text-on-primary);
  font-size: 14px;
  font-weight: 600;
}
</style>
