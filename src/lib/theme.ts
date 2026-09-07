export type ThemePreference = 'dark' | 'light' | 'system';
export type ThemeMode = 'dark' | 'light';

const THEME_KEY = 'trendora_tools_theme';

export function getStoredPreference(): ThemePreference {
  const v = localStorage.getItem(THEME_KEY);
  if (v === 'light' || v === 'system') return v;
  return 'dark';
}

/** @deprecated use getStoredPreference */
export function getStoredTheme(): ThemeMode {
  const p = getStoredPreference();
  if (p === 'system') return resolveSystem();
  return p;
}

function resolveSystem(): ThemeMode {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function resolveTheme(preference: ThemePreference): ThemeMode {
  return preference === 'system' ? resolveSystem() : preference;
}

export function applyTheme(preference: ThemePreference) {
  const mode = resolveTheme(preference);
  const root = document.documentElement;
  root.classList.remove('theme-dark', 'theme-light');
  root.classList.add(mode === 'light' ? 'theme-light' : 'theme-dark');
  root.style.colorScheme = mode;
  localStorage.setItem(THEME_KEY, preference);
}

export function initTheme() {
  applyTheme(getStoredPreference());
  if (typeof window === 'undefined') return;
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  const onChange = () => {
    if (getStoredPreference() === 'system') applyTheme('system');
  };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else mq.addListener(onChange);
}
