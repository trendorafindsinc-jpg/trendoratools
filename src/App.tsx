import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { WelcomeExperience } from './components/WelcomeExperience';
import { LuciaAuth } from './components/LuciaAuth';
import { getCurrentAriovelleSession, signOutAriovelle, type AriovelleSession } from './lib/ariovelle-session';

const Home = lazy(() => import('./pages/Home'));
const Planner = lazy(() => import('./pages/Planner'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Income = lazy(() => import('./pages/Income'));
const Budget = lazy(() => import('./pages/Budget'));
const Bills = lazy(() => import('./pages/Bills'));
const Savings = lazy(() => import('./pages/Savings'));
const Debts = lazy(() => import('./pages/Debts'));
const Reports = lazy(() => import('./pages/Reports'));
const Insights = lazy(() => import('./pages/Insights'));
const Settings = lazy(() => import('./pages/Settings'));
const Legal = lazy(() => import('./pages/Legal'));
const ProductArea = lazy(() => import('./pages/ProductArea'));

const WELCOME_KEY = 'trendora_tools_welcome_seen';
const GUEST_KEY = 'trendora_tools_guest_mode';

export default function App() {
  const [session, setSession] = useState<AriovelleSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [welcomeDone, setWelcomeDone] = useState(() => localStorage.getItem(WELCOME_KEY) === 'true');
  const [guest, setGuest] = useState(() => localStorage.getItem(GUEST_KEY) === 'true');

  useEffect(() => {
    const controller = new AbortController();
    void getCurrentAriovelleSession(controller.signal)
      .then((current) => {
        setSession(current);
        setAuthError(null);
        if (current) {
          localStorage.removeItem(GUEST_KEY);
          setGuest(false);
          localStorage.setItem(WELCOME_KEY, 'true');
          setWelcomeDone(true);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setAuthError(error instanceof Error ? error.message : 'Ariovelle could not verify your session.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setAuthReady(true);
      });
    return () => controller.abort();
  }, []);

  const handleSignOut = async () => {
    await signOutAriovelle();
    setSession(null);
    setGuest(false);
    localStorage.removeItem(GUEST_KEY);
  };

  if (!authReady) {
    return <div className="min-h-dvh bg-[var(--bg-deep)]" aria-label="Checking your Ariovelle session" />;
  }

  if (!session && !guest && !welcomeDone) {
    return (
      <WelcomeExperience
        onGetStarted={() => {
          localStorage.setItem(WELCOME_KEY, 'true');
          setWelcomeDone(true);
        }}
        onGuest={() => {
          localStorage.setItem(WELCOME_KEY, 'true');
          localStorage.setItem(GUEST_KEY, 'true');
          setWelcomeDone(true);
          setGuest(true);
        }}
      />
    );
  }

  if (!session && !guest) {
    return (
      <LuciaAuth
        authError={authError}
        signInDisabled={Boolean(authError)}
        onGuest={() => {
          localStorage.setItem(GUEST_KEY, 'true');
          setGuest(true);
        }}
      />
    );
  }

  return (
    <BrowserRouter>
      <AnalyticsTracker />
      <Suspense fallback={<div className="ari-route-loading" role="status" aria-live="polite">Loading workspace…</div>}>
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
            <Route path="/business" element={<ProductArea area="business" />} />
            <Route path="/ai" element={<ProductArea area="ai" />} />
            <Route path="/markets" element={<ProductArea area="markets" />} />
            <Route path="/planning" element={<ProductArea area="planning" />} />
            <Route path="/settings" element={<Settings session={session} onSignOut={handleSignOut} />} />
            <Route path="/legal/:page" element={<Legal />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
