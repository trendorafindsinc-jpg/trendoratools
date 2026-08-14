import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { WelcomeExperience } from './components/WelcomeExperience';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Income from './pages/Income';
import Budget from './pages/Budget';
import Bills from './pages/Bills';
import Savings from './pages/Savings';
import Debts from './pages/Debts';
import Reports from './pages/Reports';
import Wisecraft from './pages/Wisecraft';
import Settings from './pages/Settings';
import Legal from './pages/Legal';

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);

  if (showWelcome) {
    return <WelcomeExperience onComplete={() => setShowWelcome(false)} />;
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
          <Route path="/wisecraft" element={<Wisecraft />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/legal/:page" element={<Legal />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
