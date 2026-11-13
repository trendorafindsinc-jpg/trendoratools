import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { Card } from '../components/Card';
import {
  Download,
  Upload,
  Scale,
  FileText,
  Shield,
  Cookie,
  Ban,
  Code2,
  Cloud,
  LogOut,
  LogIn,
  Sun,
  Moon,
  Monitor,
  Palette
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOutLucia } from '../lib/lucia-auth';
import { backupTrendoraToLuciaCloud, restoreTrendoraFromLuciaCloud } from '../lib/lucia-cloud';
import { applyTheme, getStoredPreference, type ThemePreference } from '../lib/theme';

const legalLinks = [
  { to: '/legal/terms', label: 'Terms of Service', icon: FileText },
  { to: '/legal/privacy', label: 'Privacy Policy', icon: Shield },
  { to: '/legal/disclaimer', label: 'Financial Disclaimer', icon: Scale },
  { to: '/legal/cookies', label: 'Cookie & Local Storage Policy', icon: Cookie },
  { to: '/legal/acceptable-use', label: 'Acceptable Use Policy', icon: Ban },
  { to: '/legal/licenses', label: 'Open Source Licenses', icon: Code2 }
];

const GUEST_KEY = 'trendora_tools_guest_mode';

export default function Settings() {
  const { exportData, importData } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [msgError, setMsgError] = useState(false);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>(() => getStoredPreference());
  const isSignedIn = Boolean(auth?.currentUser);
  const isGuest = !isSignedIn && localStorage.getItem(GUEST_KEY) === 'true';

  const flash = (text: string, isError = false) => {
    setMsg(text);
    setMsgError(isError);
  };

  const setMode = (mode: ThemePreference) => {
    applyTheme(mode);
    setTheme(mode);
    const label = mode === 'light' ? 'Light' : mode === 'system' ? 'System' : 'Dark';
    flash(`${label} theme enabled.`);
  };

  const handleExport = () => {
    try {
      const payload = exportData();
      const stamp = new Date().toISOString().slice(0, 10);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ariovelle-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      flash('Local backup file downloaded.');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Export failed.', true);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        importData(event.target?.result as string);
        flash('Imported successfully. Refreshing…');
        setTimeout(() => window.location.reload(), 800);
      } catch (err: unknown) {
        flash(err instanceof Error ? err.message : 'Import failed', true);
      }
    };
    reader.onerror = () => flash('Could not read that file.', true);
    reader.readAsText(file);
  };

  const cloudBackup = async () => {
    if (!auth?.currentUser) {
      flash('Sign in with your LUCIA ID to use Lucia Cloud backup.', true);
      return;
    }
    setCloudBusy(true);
    flash('');
    try {
      await backupTrendoraToLuciaCloud(exportData());
      flash('Backup saved to Lucia Cloud. You can restore it on any device after signing in.');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Cloud backup failed.', true);
    } finally {
      setCloudBusy(false);
    }
  };

  const cloudRestore = async () => {
    if (!auth?.currentUser) {
      flash('Sign in with your LUCIA ID to restore from Lucia Cloud.', true);
      return;
    }
    const ok = window.confirm(
      'Restore will replace the data currently on this device with your Lucia Cloud backup. Continue?'
    );
    if (!ok) return;

    setCloudBusy(true);
    flash('');
    try {
      const data = await restoreTrendoraFromLuciaCloud();
      importData(data);
      flash('Lucia Cloud backup restored. Refreshing…');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Cloud restore failed.', true);
    } finally {
      setCloudBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAuthBusy(true);
    flash('');
    try {
      await signOutLucia();
      localStorage.removeItem(GUEST_KEY);
      flash('Signed out. Redirecting…');
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Sign out failed.', true);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignIn = () => {
    localStorage.removeItem(GUEST_KEY);
    flash('Opening sign in…');
    setTimeout(() => window.location.reload(), 300);
  };

  const themeBtn = (mode: ThemePreference, active: boolean) =>
    `flex items-center justify-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium transition ${
      active
        ? 'border-[var(--accent-gold)] bg-[var(--nav-active-bg)] text-[var(--accent-gold)]'
        : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--nav-hover)]'
    }`;

  return (
    <div className="space-y-8 max-w-2xl animate-fade-in scroll-pad-nav lg:pb-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-brand">Settings</h1>
        <p className="text-[var(--text-muted)] mt-1 text-sm">
          Appearance, account, data, and legal documents — organized for clarity.
        </p>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-xl text-sm border ${
            msgError
              ? 'bg-rose-500/10 text-rose-700 border-rose-500/25'
              : 'bg-[var(--nav-active-bg)] text-[var(--text-secondary)] border-[var(--nav-active-border)]'
          }`}
        >
          {msg}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)] px-1">Appearance</h2>
        <Card title="Theme">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[var(--nav-active-bg)] flex items-center justify-center text-[var(--accent-gold)]">
              <Palette size={19} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">Display mode</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Dark, light, or follow your device. Preference stays on this device only.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button type="button" onClick={() => setMode('dark')} className={themeBtn('dark', theme === 'dark')}>
              <Moon size={18} /> Dark
            </button>
            <button type="button" onClick={() => setMode('light')} className={themeBtn('light', theme === 'light')}>
              <Sun size={18} /> Light
            </button>
            <button type="button" onClick={() => setMode('system')} className={themeBtn('system', theme === 'system')}>
              <Monitor size={18} /> System
            </button>
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)] px-1">Account</h2>
        <Card title="LUCIA ID">
          {isSignedIn ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--nav-active-bg)] flex items-center justify-center text-[var(--accent-gold)]">
                  <LogOut size={19} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--text-primary)]">Signed in</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1 truncate">{auth?.currentUser?.email || 'LUCIA ID'}</p>
                  <p className="text-xs text-[var(--text-faint)] mt-1">Sign out to switch accounts or continue as guest later.</p>
                </div>
              </div>
              <button
                type="button"
                disabled={authBusy}
                onClick={handleSignOut}
                className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                {authBusy ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          ) : isGuest ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--nav-active-bg)] flex items-center justify-center text-[var(--accent-gold)]">
                  <LogIn size={19} />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">Guest mode</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    You are using Ariovelle without a LUCIA ID. Sign in to enable Lucia Cloud backup and sync.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignIn}
                className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <LogIn size={18} />
                Sign in with LUCIA ID
              </button>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No active session.</p>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)] px-1">Data &amp; backup</h2>
        <Card title="Lucia Cloud">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[var(--nav-active-bg)] flex items-center justify-center text-[var(--accent-gold)]">
              <Cloud size={19} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">Optional cloud backup</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Save a full snapshot to your LUCIA account, then restore on another phone or browser. Live sync also runs
                while you are signed in.
              </p>
            </div>
          </div>
          {auth?.currentUser ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button disabled={cloudBusy} onClick={cloudBackup} className="btn-primary flex-1">
                {cloudBusy ? 'Working…' : 'Back up to Lucia Cloud'}
              </button>
              <button disabled={cloudBusy} onClick={cloudRestore} className="btn-secondary flex-1">
                Restore from Cloud
              </button>
            </div>
          ) : (
            <p className="text-xs text-[var(--text-faint)]">Sign in with your LUCIA ID to enable Lucia Cloud backup.</p>
          )}
        </Card>
        <Card title="Local export & import">
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Your data is stored in this browser by default. Export a JSON file for offline safety, or import a backup you
            saved earlier.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={handleExport} className="btn-secondary flex-1">
              <Download size={18} /> Export Data
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary flex-1">
              <Upload size={18} /> Import Data
            </button>
            <input type="file" accept="application/json,.json" ref={fileInputRef} className="hidden" onChange={handleImport} />
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)] px-1">Legal</h2>
        <Card title="Policies & terms">
          <ul className="divide-y divide-[var(--divider)]">
            {legalLinks.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="flex items-center gap-3 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                >
                  <Icon size={16} className="text-[var(--text-faint)]" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)] px-1">About</h2>
        <Card title="Ariovelle">
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Ariovelle is a financial platform by <strong className="text-[var(--text-secondary)]">Lucia LLC</strong>, bringing
            personal finance, business finance, financial intelligence, markets, and planning into one workspace.
            Existing account, backup, and integration capabilities are being reviewed as part of the platform rebuild.
          </p>
          <p className="text-xs text-[var(--text-faint)] mt-4">Version 1.3 · © Lucia LLC</p>
        </Card>
      </section>
    </div>
  );
}
