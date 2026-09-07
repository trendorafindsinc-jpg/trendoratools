export type ThemeMode = 'dark' | 'light';

const THEME_KEY = 'trendora_tools_theme';

export function getStoredTheme(): ThemeMode {
  const v = localStorage.getItem(THEME_KEY);
  return v === 'light' ? 'light' : 'dark';
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove('theme-dark', 'theme-light');
  root.classList.add(mode === 'light' ? 'theme-light' : 'theme-dark');
  root.style.colorScheme = mode;
  localStorage.setItem(THEME_KEY, mode);
}

export function initTheme() {
  applyTheme(getStoredTheme());
}
