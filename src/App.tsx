import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { WelcomeExperience } from './components/WelcomeExperience';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Budget from './pages/Budget';
import Savings from './pages/Savings';
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
          <Route path="/budget" element={<Budget />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="/wisecraft" element={<Wisecraft />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/legal/:page" element={<Legal />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
