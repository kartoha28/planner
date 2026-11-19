import { ref, watch } from 'vue';
import type { ThemeMode } from '@/types/task';

const THEME_STORAGE_KEY = 'taskflow_theme_v1';

function resolveInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // Ignore storage access failures in restricted environments
  }
  return 'light';
}

const theme = ref<ThemeMode>(resolveInitialTheme());

function applyThemeToDocument(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode);
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', mode === 'dark' ? '#0B1120' : '#4F46E5');
  }
}

applyThemeToDocument(theme.value);

watch(theme, (next) => {
  applyThemeToDocument(next);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Ignore quota errors
  }
});

export function useTheme() {
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  };

  const setTheme = (mode: ThemeMode) => {
    theme.value = mode;
  };

  return {
    theme,
    toggleTheme,
    setTheme,
  };
}
