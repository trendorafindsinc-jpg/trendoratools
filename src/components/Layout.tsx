import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  Receipt,
  Home as HomeIcon,
  Settings,
  Sparkles,
  Banknote,
  FileText,
  CreditCard,
  BarChart3,
  MoreHorizontal,
  X
} from 'lucide-react';

const primary = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/dashboard', label: 'Command', icon: LayoutDashboard },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/wisecraft', label: 'WISECRAFT', icon: Sparkles },
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
    <div className="min-h-screen flex flex-col bg-[var(--bg-deep)] text-slate-100 relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-violet-900/20 rounded-full blur-[150px] animate-pulse-slow" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[150px] animate-pulse-slow"
          style={{ animationDelay: '4s' }}
        />
      </div>

      <header className="sticky top-0 z-20 glass-primary border-b border-white/[0.06] rounded-none">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-violet-900/40">
              T
            </div>
            <div>
              <div className="font-semibold leading-tight tracking-tight">TrendoraTools</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">LUCIA · v1.0</div>
            </div>
          </div>
          <nav className="hidden xl:flex items-center gap-0.5 flex-wrap justify-end">
            {desktop.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-2.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition ${
                    isActive
                      ? 'bg-white/10 text-white border border-white/15'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`
                }
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 py-6 pb-28 lg:pb-8">
        <Outlet />
      </main>

      {/* Mobile nav */}
      <nav className="xl:hidden fixed bottom-0 inset-x-0 z-20 glass-primary border-t border-white/[0.06] rounded-none safe-bottom">
        <div className="grid grid-cols-6 gap-0.5 px-1 pt-1 pb-1">
          {primary.map(({ to, label, icon: Icon }) => (
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
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setOpenMore(true)}
            className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[9px] font-medium text-slate-500"
          >
            <MoreHorizontal size={18} />
            More
          </button>
        </div>
      </nav>

      {openMore && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end xl:hidden" onClick={() => setOpenMore(false)}>
          <div
            className="w-full glass-primary rounded-t-3xl p-4 pb-8 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-sm">More tools</span>
              <button type="button" onClick={() => setOpenMore(false)} className="p-2 text-slate-400">
                <X size={18} />
              </button>
            </div>
            {more.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpenMore(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-sm text-slate-200"
              >
                <Icon size={18} className="text-violet-300" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
