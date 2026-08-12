import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { Card } from '../components/Card';
import {
  formatMoney,
  monthExpenses,
  totalExpensesMinor,
  categoryTotal,
  budgetUtilization,
  utilizationColor,
  goalProgress
} from '../lib/utils';
import { Receipt, Wallet, PiggyBank, TrendingUp } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-600 mt-1 text-sm">Your financial position at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-slate-500 mb-1">This month spent</div>
          <div className="text-2xl font-bold tracking-tight">{formatMoney(spent)}</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500 mb-1">Total savings</div>
          <div className="text-2xl font-bold tracking-tight text-emerald-700">
            {formatMoney(totalSaved)}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500 mb-1">Net position</div>
          <div
            className={`text-2xl font-bold tracking-tight ${
              net >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatMoney(net)}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/expenses', label: 'Add Expense', icon: Receipt },
          { to: '/budget', label: 'Budgets', icon: Wallet },
          { to: '/savings', label: 'Savings', icon: PiggyBank },
          { to: '/', label: 'Ask Assistant', icon: TrendingUp }
        ].map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="card flex flex-col items-center gap-2 py-4 hover:border-brand-500/40 transition text-center"
          >
            <Icon size={22} className="text-brand-600" />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </div>

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
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{b.category}</span>
                      <span className="text-slate-500">
                        {formatMoney(spentCat)} / {formatMoney(b.limit)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
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
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate">{g.name}</span>
                      <span className="text-slate-500">{pct}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all"
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
          <ul className="divide-y divide-slate-100">
            {recent.map((e) => (
              <li key={e.id} className="py-3 flex justify-between gap-3 text-sm">
                <div>
                  <div className="font-medium">{e.category}</div>
                  <div className="text-slate-500 text-xs">
                    {e.date}
                    {e.note ? ` · ${e.note}` : ''}
                  </div>
                </div>
                <div className="font-semibold tabular-nums">{formatMoney(e.amount)}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
