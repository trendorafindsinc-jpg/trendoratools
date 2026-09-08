import { FormEvent, useState } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound
} from 'lucide-react';
import {
  createLuciaAccount,
  isFirebaseConfigured,
  resetLuciaPassword,
  signInLucia,
  signInWithGoogle
} from '../lib/lucia-auth';

export function LuciaAuth({ onGuest }: { onGuest: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setIsError(false);
    try {
      if (mode === 'signup') {
        if (!firstName.trim() || !lastName.trim()) throw new Error('Please enter your first and last name.');
        await createLuciaAccount(firstName, lastName, email, password);
        setMessage('Your LUCIA ID is ready. A verification email has been sent.');
      } else if (mode === 'signin') {
        await signInLucia(email, password);
      } else {
        await resetLuciaPassword(email);
        setMessage('Password reset instructions have been sent to your email.');
      }
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    if (!isFirebaseConfigured) {
      setIsError(true);
      setMessage(
        'LUCIA ID is not configured on this deployment. Add VITE_FIREBASE_* environment variables and enable the Google provider in Firebase Console.'
      );
      return;
    }
    setBusy(true);
    setMessage('');
    setIsError(false);
    try {
      const result = await signInWithGoogle();
      if (!result) {
        // Redirect in progress
        setMessage('Redirecting to Google…');
      }
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[var(--bg-deep)] text-[var(--text-primary)] flex items-center justify-center p-5 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[32rem] h-[32rem] -top-48 -right-48 rounded-full bg-violet-600/15 blur-[120px] theme-orb" />
        <div className="absolute w-[28rem] h-[28rem] -bottom-48 -left-48 rounded-full bg-cyan-500/10 blur-[120px] theme-orb" />
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
            <img src="./brand/trendora-mark.svg" alt="Trendora" className="w-11 h-11" />
            <div>
              <div className="text-xs tracking-[0.22em] uppercase text-[var(--text-faint)]">LUCIA</div>
              <div className="font-semibold text-[var(--text-primary)]">Your LUCIA ID</div>
            </div>
          </div>

          {!isFirebaseConfigured && (
            <div className="mb-5 text-sm glass-card p-3 flex gap-2 text-amber-700 theme-dark:text-amber-200 border border-amber-500/25">
              <AlertCircle size={17} className="shrink-0 mt-0.5" />
              <span>
                Sign-in is unavailable until Firebase is configured on this host (VITE_FIREBASE_* env vars). You can
                still continue as a guest — data stays on this device.
              </span>
            </div>
          )}

          {mode === 'reset' ? (
            <>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Reset your password</h1>
              <p className="text-sm text-[var(--text-muted)] mt-2 mb-6">We’ll send a password reset link to your email.</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                {mode === 'signup' ? 'Create your LUCIA ID' : 'Welcome back'}
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-2 mb-6">
                {mode === 'signup'
                  ? 'One identity across the LUCIA family.'
                  : 'Sign in to continue to Trendora Tools.'}
              </p>
            </>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <label className="field">
                  <span className="field-label">First name</span>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-3.5 text-[var(--text-faint)]" size={16} />
                    <input
                      className="field-input pl-9"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      autoComplete="given-name"
                    />
                  </div>
                </label>
                <label className="field">
                  <span className="field-label">Last name</span>
                  <input
                    className="field-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                  />
                </label>
              </div>
            )}
            <label className="field">
              <span className="field-label">Email</span>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-[var(--text-faint)]" size={16} />
                <input
                  type="email"
                  className="field-input pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </label>
            {mode !== 'reset' && (
              <label className="field">
                <span className="field-label">Password</span>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3.5 text-[var(--text-faint)]" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    minLength={6}
                    className="field-input pl-9 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-3 text-[var(--text-faint)] hover:text-[var(--text-primary)]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            )}
            {message && (
              <div
                className={`text-sm glass-card p-3 flex gap-2 ${
                  isError ? 'text-rose-600 theme-dark:text-rose-300' : 'text-[var(--text-secondary)]'
                }`}
              >
                {isError ? (
                  <AlertCircle size={17} className="text-rose-500 shrink-0" />
                ) : (
                  <CheckCircle2 size={17} className="text-violet-400 shrink-0" />
                )}
                {message}
              </div>
            )}
            <button
              disabled={busy || !isFirebaseConfigured}
              className="btn-primary w-full disabled:opacity-50"
              type="submit"
            >
              {busy
                ? 'Please wait…'
                : mode === 'signup'
                  ? 'Create LUCIA ID'
                  : mode === 'reset'
                    ? 'Send reset link'
                    : 'Sign in'}
            </button>
          </form>

          {mode !== 'reset' && (
            <>
              <div className="flex items-center gap-3 my-5 text-xs text-[var(--text-faint)]">
                <span className="h-px bg-[var(--divider)] flex-1" />
                OR
                <span className="h-px bg-[var(--divider)] flex-1" />
              </div>
              <button
                type="button"
                disabled={busy || !isFirebaseConfigured}
                onClick={google}
                className="btn-secondary w-full disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <GoogleGlyph />
                Continue with Google
              </button>
            </>
          )}

          <div className="mt-6 text-center text-sm text-[var(--text-faint)]">
            {mode === 'reset' ? (
              <button type="button" onClick={() => setMode('signin')} className="text-violet-500 hover:text-violet-400">
                Back to sign in
              </button>
            ) : mode === 'signin' ? (
              <>
                <button type="button" onClick={() => setMode('signup')} className="text-violet-500 hover:text-violet-400">
                  Create a LUCIA ID
                </button>
                <span className="mx-2">·</span>
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="hover:text-[var(--text-primary)]"
                >
                  Forgot password?
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setMode('signin')} className="text-violet-500 hover:text-violet-400">
                Already have a LUCIA ID? Sign in
              </button>
            )}
          </div>
        </section>

        <p className="text-center text-xs text-[var(--text-faint)] mt-5">
          Trendora Tools · A Trendora product · LUCIA
        </p>
      </div>
    </main>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l.1.1 6.2 5.2C39.2 36.9 44 31.5 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}
