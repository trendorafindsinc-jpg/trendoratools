import type { Preferences } from '../data/types';

export function applyTheme(theme: Preferences['theme']): void {
  const root = document.documentElement;
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.dataset.theme = dark ? 'dark' : 'light';
}
