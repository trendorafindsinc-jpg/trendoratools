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
  { to: '/dashboard', label: 'Command', icon: LayoutDashboard },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/budget', label: 'Budget', icon: Wallet },
  { to: '/savings', label: 'Savings', icon: PiggyBank },
  { to: '/wisecraft', label: 'WISECRAFT', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: Settings }
];

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-deep)] text-slate-100 relative overflow-x-hidden">
      {/* Atmospheric orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-violet-900/20 rounded-full blur-[150px] animate-pulse-slow" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[150px] animate-pulse-slow"
          style={{ animationDelay: '4s' }}
        />
        <div className="absolute top-[40%] right-[15%] w-[400px] h-[400px] bg-indigo-900/10 rounded-full blur-[120px]" />
      </div>

      <header className="sticky top-0 z-20 glass-primary border-b border-white/[0.06] rounded-none">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-violet-900/40">
              T
            </div>
            <div>
              <div className="font-semibold text-slate-100 leading-tight tracking-tight">
                TrendoraTools
              </div>
              <div className="text-[10px] text-slate-500 leading-tight uppercase tracking-widest">
                Command Center · v0.4
              </div>
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
                      ? 'bg-white/10 text-white border border-white/15 shadow-inner'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 py-6 pb-28 lg:pb-8">
        <Outlet />
      </main>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 glass-primary border-t border-white/[0.06] rounded-none safe-bottom">
        <div className="grid grid-cols-7 gap-0.5 px-1 pt-1 pb-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[9px] font-medium ${
                  isActive ? 'text-violet-300' : 'text-slate-500'
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
