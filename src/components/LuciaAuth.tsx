import { useState } from 'react';
import { ArrowLeft, AlertCircle, ShieldCheck, LockKeyhole, LogIn } from 'lucide-react';

export function LuciaAuth({
  onGuest,
  authError,
}: {
  onGuest: () => void;
  authError?: string | null;
}) {
  const [busy, setBusy] = useState(false);

  const beginSignIn = () => {
    if (busy) return;
    setBusy(true);
    window.location.assign('/api/auth/lucia/start');
  };

  return (
    <main className="min-h-dvh bg-[var(--bg-deep)] text-[var(--text-primary)] flex items-center justify-center p-5 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[32rem] h-[32rem] -top-48 -right-48 rounded-full bg-[var(--nav-active-bg)] blur-[120px] theme-orb" />
        <div className="absolute w-[28rem] h-[28rem] -bottom-48 -left-48 rounded-full bg-[var(--nav-active-bg)] blur-[120px] theme-orb" />
      </div>

      <div className="relative w-full max-w-md">
        <button
          type="button"
          onClick={onGuest}
          className="mb-5 text-sm text-[var(--text-faint)] hover:text-[var(--text-primary)] flex items-center gap-2 transition"
        >
          <ArrowLeft size={16} /> Continue as guest
        </button>

        <section className="glass-panel p-7 sm:p-9">
          <div className="flex items-center gap-3 mb-7">
            <img src="./brand/ariovelle-mark.svg" alt="Ariovelle" className="w-11 h-11" />
            <div>
              <div className="text-xs tracking-[0.22em] uppercase text-[var(--text-faint)]">LUCIA</div>
              <div className="font-semibold text-[var(--text-primary)]">Your LUCIA ID</div>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Welcome to Ariovelle</h1>
          <p className="text-sm text-[var(--text-muted)] mt-2 mb-6">
            Sign in securely with your Lucia identity. Ariovelle creates and manages its own private session after Lucia verifies you.
          </p>

          {authError && (
            <div role="alert" aria-live="assertive" className="mb-5 text-sm glass-card p-3 flex gap-2 text-rose-600 theme-dark:text-rose-300 border border-rose-500/25">
              <AlertCircle size={17} className="shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <div className="glass-card p-4 mb-6 flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--nav-active-bg)] flex items-center justify-center text-[var(--accent-gold)] shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Secure Lucia sign-in</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Your Lucia password is entered only on Lucia Core. Ariovelle never receives or stores it.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={beginSignIn}
            className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LockKeyhole size={18} />
            {busy ? 'Opening Lucia…' : 'Continue with Lucia'}
          </button>

          <div className="mt-6 text-center text-sm text-[var(--text-faint)]">
            <p>New to Lucia?</p>
            <a
              href="https://auth.lucia.name.ng/login"
              className="inline-flex items-center gap-2 mt-2 text-[var(--accent-gold)] hover:opacity-80"
            >
              <LogIn size={15} /> Open Lucia to create your ID
            </a>
          </div>
        </section>

        <p className="text-center text-xs text-[var(--text-faint)] mt-5">
          Ariovelle · A product of Lucia LLC
        </p>
      </div>
    </main>
  );
}
