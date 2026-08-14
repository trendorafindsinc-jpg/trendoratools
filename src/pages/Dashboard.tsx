import { Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { Card } from '../components/Card';
import { AmbassadorShowcase } from '../components/AmbassadorShowcase';
import {
  formatMoney,
  monthExpenses,
  totalExpensesMinor,
  categoryTotal,
  budgetUtilization,
  utilizationColor,
  goalProgress
} from '../lib/utils';
import { Receipt, Wallet, PiggyBank, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';

export default function Dashboard() {
  const { expenses, budgets, savingsGoals } = useAppStore();
  const monthExps = monthExpenses(expenses);
  const spent = totalExpensesMinor(monthExps);
  const totalSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const net = totalSaved - spent;
  const recent = [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 5);

  return (
    <div className="space-y-6 scroll-pad-nav lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-brand">
            Command Center
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Financial position, utilization, and growth layer at a glance.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full glass-interactive text-slate-300">
          <ShieldCheck size={14} className="text-emerald-400" />
          Local deterministic · minor units
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-primary p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">This month spent</div>
          <div className="text-2xl font-bold tracking-tight tabular-nums">{formatMoney(spent)}</div>
        </div>
        <div className="glass-primary p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Total savings</div>
          <div className="text-2xl font-bold tracking-tight tabular-nums text-emerald-400">
            {formatMoney(totalSaved)}
          </div>
        </div>
        <div className="glass-primary p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Net position</div>
          <div
            className={`text-2xl font-bold tracking-tight tabular-nums ${
              net >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatMoney(net)}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/expenses', label: 'Add Expense', icon: Receipt },
          { to: '/budget', label: 'Budgets', icon: Wallet },
          { to: '/savings', label: 'Savings', icon: PiggyBank },
          { to: '/wisecraft', label: 'WISECRAFT', icon: Sparkles }
        ].map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="glass-interactive p-4 flex flex-col items-center gap-2 text-center"
          >
            <Icon size={22} className="text-violet-300" />
            <span className="text-sm font-medium text-slate-200">{label}</span>
          </Link>
        ))}
      </div>

      <AmbassadorShowcase />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Budget utilization">
          {budgets.length === 0 ? (
            <p className="text-sm text-slate-500">No budgets yet. Create one on the Budget page.</p>
          ) : (
            <div className="space-y-4">
              {budgets.map((b) => {
                const pct = budgetUtilization(b, expenses);
                const spentCat = categoryTotal(monthExps, b.category);
                return (
                  <div key={b.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-slate-200">{b.category}</span>
                      <span className="text-slate-500 tabular-nums">
                        {formatMoney(spentCat)} / {formatMoney(b.limit)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${utilizationColor(pct)}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Savings progress">
          {savingsGoals.length === 0 ? (
            <p className="text-sm text-slate-500">No savings goals yet.</p>
          ) : (
            <div className="space-y-4">
              {savingsGoals.slice(0, 4).map((g) => {
                const pct = goalProgress(g);
                return (
                  <div key={g.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-slate-200 truncate pr-2">{g.name}</span>
                      <span className="text-slate-500 tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card title="Recent activity">
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">No expenses recorded yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {recent.map((e) => (
              <li key={e.id} className="py-3 flex justify-between gap-3 text-sm">
                <div>
                  <div className="font-medium text-slate-200">{e.category}</div>
                  <div className="text-slate-500 text-xs">
                    {e.date}
                    {e.note ? ` · ${e.note}` : ''}
                  </div>
                </div>
                <div className="font-semibold tabular-nums text-slate-100">
                  {formatMoney(e.amount)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="glass-primary p-4 flex items-center gap-3 text-sm text-slate-400">
        <TrendingUp size={18} className="text-cyan-400 shrink-0" />
        <span>
          Insights stay deterministic. WISECRAFT is an optional growth layer — never a substitute
          for exact local math.
        </span>
      </div>
    </div>
  );
}
