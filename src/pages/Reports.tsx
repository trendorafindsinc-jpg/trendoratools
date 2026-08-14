import { useMemo } from 'react';
import { useAppStore } from '../store';
import { Card } from '../components/Card';
import { buildMonthSummary } from '../lib/reports';
import { formatMoney } from '../lib/utils';

export default function Reports() {
  const { expenses, incomes, bills, debts, savingsGoals } = useAppStore();
  const summary = useMemo(
    () => buildMonthSummary(expenses, incomes, bills, debts, savingsGoals),
    [expenses, incomes, bills, debts, savingsGoals]
  );
  const maxCat = summary.categoryBreakdown[0]?.amount || 1;

  return (
    <div className="space-y-6 animate-fade-in scroll-pad-nav lg:pb-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-brand">Reports</h1>
        <p className="text-slate-400 mt-1 text-sm">This month’s deterministic snapshot.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: 'Income', value: summary.incomeMinor, color: 'text-emerald-400' },
          { label: 'Expenses', value: summary.expenseMinor, color: 'text-slate-100' },
          {
            label: 'Net cashflow',
            value: summary.netCashflowMinor,
            color: summary.netCashflowMinor >= 0 ? 'text-emerald-400' : 'text-rose-400'
          },
          { label: 'Savings balances', value: summary.savedMinor, color: 'text-cyan-300' },
          { label: 'Debt remaining', value: summary.debtRemainingMinor, color: 'text-rose-400' },
          {
            label: 'Unpaid bills',
            value: summary.unpaidBillsMinor,
            color: 'text-amber-400',
            sub: `${summary.unpaidBillsCount} open`
          }
        ].map((k) => (
          <div key={k.label} className="glass-primary p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">{k.label}</div>
            <div className={`text-xl font-bold tabular-nums mt-1 ${k.color}`}>{formatMoney(k.value)}</div>
            {k.sub && <div className="text-xs text-slate-500 mt-0.5">{k.sub}</div>}
          </div>
        ))}
      </div>

      <Card title="Spending by category">
        {summary.categoryBreakdown.length === 0 ? (
          <p className="text-sm text-slate-500">No expenses this month.</p>
        ) : (
          <div className="space-y-3">
            {summary.categoryBreakdown.map((c) => (
              <div key={c.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-200">{c.category}</span>
                  <span className="text-slate-400 tabular-nums">{formatMoney(c.amount)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{ width: `${Math.round((c.amount / maxCat) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
