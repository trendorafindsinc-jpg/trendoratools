import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { Layout } from './components/Layout';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { WelcomeExperience } from './components/WelcomeExperience';
import { LuciaAuth } from './components/LuciaAuth';
import { completeGoogleRedirectIfAny, subscribeToLuciaAuth } from './lib/lucia-auth';
import { startLuciaCloudSync, stopLuciaCloudSync, subscribeToLuciaCloudSync } from './lib/lucia-cloud-sync';
import { analytics } from './lib/analytics';
import Home from './pages/Home';
import Planner from './pages/Planner';
import Expenses from './pages/Expenses';
import Income from './pages/Income';
import Budget from './pages/Budget';
import Bills from './pages/Bills';
import Savings from './pages/Savings';
import Debts from './pages/Debts';
import Reports from './pages/Reports';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import Legal from './pages/Legal';

const WELCOME_KEY = 'trendora_tools_welcome_seen';
const GUEST_KEY = 'trendora_tools_guest_mode';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [welcomeDone, setWelcomeDone] = useState(() => localStorage.getItem(WELCOME_KEY) === 'true');
  const [guest, setGuest] = useState(() => localStorage.getItem(GUEST_KEY) === 'true');
  const previousUser = useRef<User | null>(null);

  useEffect(() => {
    void completeGoogleRedirectIfAny().catch(() => undefined);

    const unsubscribeCloud = subscribeToLuciaCloudSync();
    const unsubscribeAuth = subscribeToLuciaAuth((nextUser) => {
      if (nextUser && !previousUser.current) {
        void analytics.event('lucia_id_sign_in', { result: 'success' });
        if (nextUser.metadata.creationTime && nextUser.metadata.creationTime === nextUser.metadata.lastSignInTime) {
          void analytics.event('lucia_id_create_account', { result: 'success' });
        }
      } else if (!nextUser && previousUser.current) {
        void analytics.event('lucia_id_sign_out', { result: 'success' });
      }
      previousUser.current = nextUser;

      setUser(nextUser);
      if (nextUser) {
        localStorage.removeItem(GUEST_KEY);
        setGuest(false);
        setCloudReady(false);
        void startLuciaCloudSync(nextUser.uid)
          .catch(() => undefined)
          .finally(() => setCloudReady(true));
      } else {
        stopLuciaCloudSync();
        setCloudReady(true);
      }
      setAuthReady(true);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeCloud();
      stopLuciaCloudSync();
    };
  }, []);

  if (!authReady || (user && !cloudReady)) return <div className="min-h-dvh bg-[var(--bg-deep)]" />;

  if (!welcomeDone) {
    return <WelcomeExperience onGetStarted={() => { localStorage.setItem(WELCOME_KEY, 'true'); setWelcomeDone(true); }} onGuest={() => { localStorage.setItem(WELCOME_KEY, 'true'); localStorage.setItem(GUEST_KEY, 'true'); setWelcomeDone(true); setGuest(true); }} />;
  }

  if (!user && !guest) {
    return <LuciaAuth onGuest={() => { localStorage.setItem(GUEST_KEY, 'true'); setGuest(true); }} />;
  }

  return (
    <BrowserRouter>
      <AnalyticsTracker />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/dashboard" element={<Navigate to="/planner" replace />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/income" element={<Income />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/legal/:page" element={<Legal />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
