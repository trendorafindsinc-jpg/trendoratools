import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { isFirebaseConfigured } from '../lib/firebase';
import { ensureLuciaIdentity, subscribeToLuciaAuth } from '../lib/lucia-auth';
import { LuciaAuth } from './LuciaAuth';

const GUEST_KEY = 'trendora_tools_guest_mode';

export function LuciaGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(() => localStorage.getItem(GUEST_KEY) === 'true');
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    return subscribeToLuciaAuth(async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        setGuest(false);
        localStorage.removeItem(GUEST_KEY);
        try { await ensureLuciaIdentity(nextUser); } catch { /* Auth still works if profile creation is temporarily unavailable. */ }
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-dvh bg-[#07070A]" />;
  if (user || guest) return <>{children}</>;

  if (authRequired) {
    return <LuciaAuth onGuest={() => { localStorage.setItem(GUEST_KEY, 'true'); setGuest(true); }} />;
  }

  return null;
}

export function useLuciaEntry() {
  const [showWelcome, setShowWelcome] = useState(() => localStorage.getItem('trendora_tools_welcome_seen') !== 'true');
  const [showAuth, setShowAuth] = useState(false);
  return { showWelcome, showAuth, setShowWelcome, setShowAuth, firebaseConfigured: isFirebaseConfigured };
}
