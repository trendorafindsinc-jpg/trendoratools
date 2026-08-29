import { FormEvent, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Globe2, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { createLuciaAccount, resetLuciaPassword, signInLucia, signInWithGoogle } from '../lib/lucia-auth';

export function LuciaAuth({ onGuest }: { onGuest: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
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
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setMessage('');
    try {
      await signInWithGoogle();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[#07070A] text-white flex items-center justify-center p-5 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[32rem] h-[32rem] -top-48 -right-48 rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute w-[28rem] h-[28rem] -bottom-48 -left-48 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <button type="button" onClick={onGuest} className="mb-5 text-sm text-slate-500 hover:text-white flex items-center gap-2 transition">
          <ArrowLeft size={16} /> Continue as guest
        </button>

        <section className="glass-panel p-7 sm:p-9">
          <div className="flex items-center gap-3 mb-7">
            <img src="./brand/trendora-mark.svg" alt="Trendora" className="w-11 h-11" />
            <div>
              <div className="text-xs tracking-[0.22em] uppercase text-slate-500">LUCIA</div>
              <div className="font-semibold text-slate-100">Your LUCIA ID</div>
            </div>
          </div>

          {mode === 'reset' ? (
            <>
              <h1 className="text-2xl font-semibold">Reset your password</h1>
              <p className="text-sm text-slate-400 mt-2 mb-6">We’ll send a password reset link to your email.</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold">{mode === 'signup' ? 'Create your LUCIA ID' : 'Welcome back'}</h1>
              <p className="text-sm text-slate-400 mt-2 mb-6">
                {mode === 'signup' ? 'One identity across the LUCIA family.' : 'Sign in to continue to Trendora Tools.'}
              </p>
            </>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <label className="field"><span className="field-label">First name</span><div className="relative"><UserRound className="absolute left-3 top-3.5 text-slate-500" size={16}/><input className="field-input pl-9" value={firstName} onChange={e => setFirstName(e.target.value)} required /></div></label>
                <label className="field"><span className="field-label">Last name</span><input className="field-input" value={lastName} onChange={e => setLastName(e.target.value)} required /></label>
              </div>
            )}
            <label className="field"><span className="field-label">Email</span><div className="relative"><Mail className="absolute left-3 top-3.5 text-slate-500" size={16}/><input type="email" className="field-input pl-9" value={email} onChange={e => setEmail(e.target.value)} required /></div></label>
            {mode !== 'reset' && (
              <label className="field"><span className="field-label">Password</span><div className="relative"><LockKeyhole className="absolute left-3 top-3.5 text-slate-500" size={16}/><input type={showPassword ? 'text' : 'password'} minLength={6} className="field-input pl-9 pr-10" value={password} onChange={e => setPassword(e.target.value)} required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-3 text-slate-500 hover:text-white">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
            )}
            {message && <div className="text-sm text-slate-300 glass-card p-3 flex gap-2"><CheckCircle2 size={17} className="text-violet-300 shrink-0" />{message}</div>}
            <button disabled={busy} className="btn-primary w-full disabled:opacity-50" type="submit">{busy ? 'Please wait…' : mode === 'signup' ? 'Create LUCIA ID' : mode === 'reset' ? 'Send reset link' : 'Sign in'}</button>
          </form>

          {mode !== 'reset' && <>
            <div className="flex items-center gap-3 my-5 text-xs text-slate-600"><span className="h-px bg-white/10 flex-1"/>OR<span className="h-px bg-white/10 flex-1"/></div>
            <button type="button" disabled={busy} onClick={google} className="btn-secondary w-full"><Globe2 size={18}/> Continue with Google</button>
          </>}

          <div className="mt-6 text-center text-sm text-slate-500">
            {mode === 'reset' ? <button type="button" onClick={() => setMode('signin')} className="text-violet-300 hover:text-white">Back to sign in</button> : mode === 'signin' ? <><button type="button" onClick={() => setMode('signup')} className="text-violet-300 hover:text-white">Create a LUCIA ID</button><span className="mx-2">·</span><button type="button" onClick={() => setMode('reset')} className="hover:text-white">Forgot password?</button></> : <button type="button" onClick={() => setMode('signin')} className="text-violet-300 hover:text-white">Already have a LUCIA ID? Sign in</button>}
          </div>
        </section>

        <p className="text-center text-xs text-slate-600 mt-5">Trendora Tools · A Trendora product · LUCIA</p>
      </div>
    </main>
  );
}
