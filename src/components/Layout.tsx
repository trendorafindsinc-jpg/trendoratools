import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  CalendarCheck2,
  Wallet,
  PiggyBank,
  Receipt,
  Home as HomeIcon,
  Settings,
  BarChart3,
  Banknote,
  FileText,
  CreditCard,
  MoreHorizontal,
  X
} from 'lucide-react';
import { AnalyticsTracker } from './AnalyticsTracker';

const primary = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/planner', label: 'Planner', icon: CalendarCheck2 },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/insights', label: 'Insights', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings }
];

const more = [
  { to: '/income', label: 'Income', icon: Banknote },
  { to: '/budget', label: 'Budget', icon: Wallet },
  { to: '/bills', label: 'Bills', icon: FileText },
  { to: '/savings', label: 'Savings', icon: PiggyBank },
  { to: '/debts', label: 'Debts', icon: CreditCard },
  { to: '/reports', label: 'Reports', icon: BarChart3 }
];

const desktop = [...primary.slice(0, 3), ...more, ...primary.slice(3)];

export function Layout() {
  const [openMore, setOpenMore] = useState(false);

  return (
    <div className="min-h-dvh min-h-[-webkit-fill-available] flex flex-col bg-[var(--bg-deep)] text-[var(--text-primary)] relative overflow-x-hidden">
      <AnalyticsTracker />
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-violet-500/15 theme-dark:bg-violet-900/20 rounded-full blur-[150px] animate-pulse-slow theme-orb" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-400/10 theme-dark:bg-cyan-900/10 rounded-full blur-[150px] animate-pulse-slow theme-orb"
          style={{ animationDelay: '4s' }}
        />
      </div>

      <header className="sticky top-0 z-20 glass-primary border-b border-[var(--header-border)] rounded-none">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="./brand/trendora-mark.svg" alt="Trendora Tools" className="w-8 h-8 rounded-xl shadow-lg shadow-violet-500/20" width={32} height={32} />
            <div>
              <div className="font-semibold leading-tight tracking-tight text-[var(--text-primary)]">Trendora Tools</div>
              <div className="text-[10px] text-[var(--text-faint)] uppercase tracking-widest">A Trendora product · LUCIA</div>
            </div>
          </div>
          <nav className="hidden xl:flex items-center gap-0.5 flex-wrap justify-end">
            {desktop.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `px-2.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition ${isActive ? 'bg-[var(--nav-active-bg)] text-[var(--text-primary)] border border-[var(--nav-active-border)]' : 'text-[var(--text-muted)] hover:bg-[var(--nav-hover)] hover:text-[var(--text-secondary)]'}`}>
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 py-6 pb-36 lg:pb-8">
        <Outlet />
      </main>

      <nav className="xl:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[var(--nav-border)] rounded-none safe-bottom-nav bg-[var(--nav-bar-bg)] backdrop-blur-xl">
        <div className="grid grid-cols-6 gap-0.5 px-1 pt-1 pb-1">
          {primary.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[9px] font-medium ${isActive ? 'text-violet-600' : 'text-[var(--text-faint)]'}`}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <button type="button" onClick={() => setOpenMore(true)} className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[9px] font-medium text-[var(--text-faint)]">
            <MoreHorizontal size={18} />
            More
          </button>
        </div>
      </nav>

      {openMore && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end xl:hidden" onClick={() => setOpenMore(false)}>
          <div className="w-full glass-primary rounded-t-3xl p-4 pb-8 space-y-1" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-sm text-[var(--text-primary)]">More tools</span>
              <button type="button" onClick={() => setOpenMore(false)} className="p-2 text-[var(--text-muted)]"><X size={18} /></button>
            </div>
            {more.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={() => setOpenMore(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--nav-hover)] text-sm text-[var(--text-secondary)]">
                <Icon size={18} className="text-violet-500" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
