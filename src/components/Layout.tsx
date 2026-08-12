import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  Receipt,
  MessageSquare,
  Settings,
  Sparkles
} from 'lucide-react';

const nav = [
  { to: '/', label: 'Home', icon: MessageSquare },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/budget', label: 'Budget', icon: Wallet },
  { to: '/savings', label: 'Savings', icon: PiggyBank },
  { to: '/wisecraft', label: 'WISECRAFT', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: Settings }
];

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 glass-surface border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-900/30">
              T
            </div>
            <div>
              <div className="font-semibold text-slate-100 leading-tight">TrendoraTools</div>
              <div className="text-[11px] text-slate-400 leading-tight">LUCIA · v0.3</div>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition ${
                    isActive
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 pb-28 lg:pb-8">
        <Outlet />
      </main>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 glass-surface border-t border-white/10 safe-bottom">
        <div className="grid grid-cols-7 gap-0.5 px-1 pt-1 pb-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[9px] font-medium ${
                  isActive ? 'text-indigo-300' : 'text-slate-500'
                }`
              }
            >
              <Icon size={18} />
              <span className="truncate max-w-full px-0.5">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
