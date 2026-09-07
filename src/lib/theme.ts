export type ThemePreference = 'dark' | 'light' | 'system';
export type ThemeMode = 'dark' | 'light';

const THEME_KEY = 'trendora_tools_theme';

/** Critical tokens set inline so light mode cannot be overridden by cascade quirks. */
const LIGHT_VARS: Record<string, string> = {
  '--bg-deep': '#f4f5f8',
  '--glass-bg': 'rgba(255, 255, 255, 0.85)',
  '--glass-border': 'rgba(15, 23, 42, 0.1)',
  '--glass-highlight': 'rgba(255, 255, 255, 0.95)',
  '--text-primary': '#0f172a',
  '--text-secondary': '#1e293b',
  '--text-muted': '#475569',
  '--text-faint': '#64748b',
  '--divider': 'rgba(15, 23, 42, 0.1)',
  '--track': 'rgba(15, 23, 42, 0.08)',
  '--header-border': 'rgba(15, 23, 42, 0.1)',
  '--nav-border': 'rgba(15, 23, 42, 0.12)',
  '--nav-bar-bg': 'rgba(255, 255, 255, 0.96)',
  '--nav-active-bg': 'rgba(124, 58, 237, 0.12)',
  '--nav-active-border': 'rgba(124, 58, 237, 0.3)',
  '--nav-hover': 'rgba(15, 23, 42, 0.05)',
  '--input-bg': '#ffffff',
  '--card-bg': 'rgba(255, 255, 255, 0.92)',
  '--option-bg': '#ffffff',
  '--option-fg': '#0f172a',
  '--ring-offset': '#f4f5f8'
};

const DARK_VARS: Record<string, string> = {
  '--bg-deep': '#07070a',
  '--glass-bg': 'rgba(255, 255, 255, 0.03)',
  '--glass-border': 'rgba(255, 255, 255, 0.08)',
  '--glass-highlight': 'rgba(255, 255, 255, 0.15)',
  '--text-primary': '#f1f5f9',
  '--text-secondary': '#e2e8f0',
  '--text-muted': '#94a3b8',
  '--text-faint': '#64748b',
  '--divider': 'rgba(255, 255, 255, 0.05)',
  '--track': 'rgba(255, 255, 255, 0.05)',
  '--header-border': 'rgba(255, 255, 255, 0.06)',
  '--nav-border': 'rgba(255, 255, 255, 0.1)',
  '--nav-bar-bg': 'rgba(10, 10, 15, 0.95)',
  '--nav-active-bg': 'rgba(255, 255, 255, 0.1)',
  '--nav-active-border': 'rgba(255, 255, 255, 0.15)',
  '--nav-hover': 'rgba(255, 255, 255, 0.05)',
  '--input-bg': 'rgba(255, 255, 255, 0.04)',
  '--card-bg': 'rgba(255, 255, 255, 0.04)',
  '--option-bg': '#0f1117',
  '--option-fg': '#f1f5f9',
  '--ring-offset': '#07070a'
};

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

function paintVars(root: HTMLElement, mode: ThemeMode) {
  const vars = mode === 'light' ? LIGHT_VARS : DARK_VARS;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  root.style.backgroundColor = vars['--bg-deep'];
  if (document.body) {
    document.body.style.backgroundColor = vars['--bg-deep'];
    document.body.style.color = vars['--text-primary'];
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', mode === 'light' ? '#f4f5f8' : '#07070A');
}

export function applyTheme(preference: ThemePreference) {
  const mode = resolveTheme(preference);
  const root = document.documentElement;
  root.classList.remove('theme-dark', 'theme-light', 'dark', 'light');
  root.classList.add(mode === 'light' ? 'theme-light' : 'theme-dark');
  root.setAttribute('data-theme', mode);
  root.style.colorScheme = mode;
  paintVars(root, mode);
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
