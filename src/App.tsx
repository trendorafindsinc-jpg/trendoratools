import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { Layout } from './components/Layout';
import { WelcomeExperience } from './components/WelcomeExperience';
import { LuciaAuth } from './components/LuciaAuth';
import { subscribeToLuciaAuth } from './lib/lucia-auth';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
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
  const [welcomeDone, setWelcomeDone] = useState(() => localStorage.getItem(WELCOME_KEY) === 'true');
  const [guest, setGuest] = useState(() => localStorage.getItem(GUEST_KEY) === 'true');

  useEffect(() => subscribeToLuciaAuth((nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.removeItem(GUEST_KEY);
      setGuest(false);
    }
    setAuthReady(true);
  }), []);

  if (!authReady) return <div className="min-h-dvh bg-[#07070A]" />;

  if (!welcomeDone) {
    return <WelcomeExperience
      onGetStarted={() => { localStorage.setItem(WELCOME_KEY, 'true'); setWelcomeDone(true); }}
      onGuest={() => { localStorage.setItem(WELCOME_KEY, 'true'); localStorage.setItem(GUEST_KEY, 'true'); setWelcomeDone(true); setGuest(true); }}
    />;
  }

  if (!user && !guest) {
    return <LuciaAuth onGuest={() => { localStorage.setItem(GUEST_KEY, 'true'); setGuest(true); }} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
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
