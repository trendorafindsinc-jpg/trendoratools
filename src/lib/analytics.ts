type AnalyticsValue = string | number | boolean;
type AnalyticsParams = Record<string, AnalyticsValue | undefined>;

declare global { interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; } }

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
let initialized = false;
let scriptPromise: Promise<void> | null = null;
const allowedParameters: Record<string, readonly string[]> = {
  navigation_click: ['destination', 'source_page'], tool_used: ['tool_name', 'action'], planner_used: ['action'], insights_viewed: ['period'],
  pwa_install: ['platform'], app_launch: ['launch_type'], lucia_id_sign_in: ['result'], lucia_id_sign_out: ['result'],
  lucia_id_create_account: ['result'], cloud_backup: ['result'], cloud_restore: ['result'],
};
function cleanParams(name: string, params: AnalyticsParams = {}) {
  const allowed = allowedParameters[name] || [];
  const clean: Record<string, AnalyticsValue> = {};
  for (const key of allowed) { const value = params[key]; if (value !== undefined && value !== null) clean[key] = value; }
  return clean;
}
function ensureScript() {
  if (!measurementId || typeof document === 'undefined') return Promise.resolve();
  if (initialized) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve) => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer!.push(args));
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
    const existing = document.querySelector<HTMLScriptElement>(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`);
    if (existing) { initialized = true; resolve(); return; }
    const script = document.createElement('script'); script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.onload = () => { initialized = true; resolve(); }; script.onerror = () => resolve(); document.head.appendChild(script);
  });
  return scriptPromise;
}
function isInstalledPwa() { return window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true; }

export const analytics = {
  enabled: Boolean(measurementId),
  async pageView(path: string) {
    if (!measurementId) return;
    try { await ensureScript(); window.gtag?.('event', 'page_view', { page_location: `${window.location.origin}${path}`, page_path: path }); } catch { /* optional infrastructure */ }
  },
  async event(name: string, params: AnalyticsParams = {}) {
    if (!measurementId) return;
    try { await ensureScript(); window.gtag?.('event', name, cleanParams(name, params)); } catch { /* optional infrastructure */ }
  },
  boot() {
    if (!measurementId || typeof window === 'undefined') return () => undefined;
    let launched = false;
    try { launched = sessionStorage.getItem('trendora_ga4_app_launch') === '1'; } catch { /* storage may be unavailable */ }
    if (!launched) {
      try { sessionStorage.setItem('trendora_ga4_app_launch', '1'); } catch { /* optional */ }
      void analytics.event('app_launch', { launch_type: isInstalledPwa() ? 'installed_pwa' : 'browser' });
    }
    const onInstalled = () => {
      const platform = /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'ios' : /android/i.test(navigator.userAgent) ? 'android' : 'desktop';
      void analytics.event('pwa_install', { platform });
    };
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  },
};
