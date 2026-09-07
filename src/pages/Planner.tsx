import { Link } from 'react-router-dom';
import {
  CalendarCheck2,
  AlertTriangle,
  CreditCard,
  PiggyBank,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useAppStore } from '../store';
import { Card } from '../components/Card';
import {
  formatMoney,
  upcomingBills,
  isOverdue,
  isDueSoon,
  budgetUtilization,
  monthExpenses,
  categoryTotal,
  goalProgress,
  totalDebtRemaining
} from '../lib/utils';

/**
 * Planner — forward-looking action surface.
 * Insights answers "what happened?"; Planner answers "what should I do next?".
 */
export default function Planner() {
  const { expenses, budgets, savingsGoals, bills, debts } = useAppStore();
  const unpaid = upcomingBills(bills);
  const overdue = unpaid.filter((b) => isOverdue(b.dueDate));
  const dueSoon = unpaid.filter((b) => isDueSoon(b.dueDate, 14) && !isOverdue(b.dueDate));
  const monthExps = monthExpenses(expenses);

  const stressedBudgets = budgets
    .map((b) => ({ budget: b, pct: budgetUtilization(b, expenses), spent: categoryTotal(monthExps, b.category) }))
    .filter((x) => x.pct >= 80)
    .sort((a, b) => b.pct - a.pct);

  const activeGoals = savingsGoals
    .map((g) => ({ goal: g, pct: goalProgress(g) }))
    .filter((x) => x.pct < 100)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 4);

  const debtTotal = totalDebtRemaining(debts);
  const priorityDebts = [...debts]
    .filter((d) => d.remainingAmount > 0)
    .sort((a, b) => {
      // High interest first, then largest remaining
      if ((b.interestRate || 0) !== (a.interestRate || 0)) return (b.interestRate || 0) - (a.interestRate || 0);
      return b.remainingAmount - a.remainingAmount;
    })
    .slice(0, 4);

  const actionCount =
    overdue.length + dueSoon.length + stressedBudgets.length + (priorityDebts.length > 0 ? 1 : 0) + activeGoals.length;

  return (
    <div className="space-y-6 scroll-pad-nav lg:pb-0 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-brand">Planner</h1>
          <p className="text-[var(--text-muted)] mt-1 text-sm">
            What needs attention next — bills, budgets, debt, and goals. Not a replay of Insights.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full glass-interactive text-[var(--text-secondary)]">
          <CalendarCheck2 size={14} className="text-violet-400" />
          {actionCount === 0 ? 'All clear for now' : `${actionCount} item${actionCount === 1 ? '' : 's'} to review`}
        </div>
      </div>

      {/* Priority strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-primary p-5">
          <div className="text-xs uppercase tracking-wider text-[var(--text-faint)] mb-1">Overdue bills</div>
          <div className={`text-2xl font-bold tracking-tight tabular-nums ${overdue.length ? 'text-rose-400' : 'text-[var(--text-primary)]'}`}>
            {overdue.length}
          </div>
          <p className="text-xs text-[var(--text-faint)] mt-1">
            {overdue.length ? formatMoney(overdue.reduce((s, b) => s + b.amount, 0)) + ' total' : 'None overdue'}
          </p>
        </div>
        <div className="glass-primary p-5">
          <div className="text-xs uppercase tracking-wider text-[var(--text-faint)] mb-1">Due in 14 days</div>
          <div className="text-2xl font-bold tracking-tight tabular-nums text-amber-400">{dueSoon.length}</div>
          <p className="text-xs text-[var(--text-faint)] mt-1">
            {dueSoon.length ? formatMoney(dueSoon.reduce((s, b) => s + b.amount, 0)) + ' upcoming' : 'Nothing due soon'}
          </p>
        </div>
        <div className="glass-primary p-5">
          <div className="text-xs uppercase tracking-wider text-[var(--text-faint)] mb-1">Debt remaining</div>
          <div className="text-2xl font-bold tracking-tight tabular-nums text-[var(--text-primary)]">{formatMoney(debtTotal)}</div>
          <p className="text-xs text-[var(--text-faint)] mt-1">{debts.length} account{debts.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Bills to handle">
          {unpaid.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <CheckCircle2 size={16} className="text-emerald-400" /> No unpaid bills on the list.
            </div>
          ) : (
            <ul className="divide-y divide-[var(--divider)]">
              {[...overdue, ...dueSoon, ...unpaid.filter((b) => !isOverdue(b.dueDate) && !isDueSoon(b.dueDate, 14))]
                .slice(0, 8)
                .map((b) => {
                  const late = isOverdue(b.dueDate);
                  const soon = isDueSoon(b.dueDate, 14);
                  return (
                    <li key={b.id} className="py-3 flex justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--text-primary)] truncate">{b.name}</div>
                        <div className="text-xs text-[var(--text-faint)] flex items-center gap-1 mt-0.5">
                          {late ? (
                            <><AlertTriangle size={12} className="text-rose-400" /> Overdue · {b.dueDate}</>
                          ) : soon ? (
                            <><Clock size={12} className="text-amber-400" /> Due {b.dueDate}</>
                          ) : (
                            <>Due {b.dueDate}</>
                          )}
                        </div>
                      </div>
                      <div className="font-semibold tabular-nums text-[var(--text-primary)] shrink-0">{formatMoney(b.amount)}</div>
                    </li>
                  );
                })}
            </ul>
          )}
          <Link to="/bills" className="mt-4 inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300">
            Manage bills <ArrowRight size={14} />
          </Link>
        </Card>

        <Card title="Budget pressure">
          {budgets.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No budgets yet. Set limits so Planner can flag pressure early.</p>
          ) : stressedBudgets.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <CheckCircle2 size={16} className="text-emerald-400" /> All budgets under 80% this month.
            </div>
          ) : (
            <div className="space-y-4">
              {stressedBudgets.map(({ budget: b, pct, spent }) => (
                <div key={b.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-[var(--text-primary)]">{b.category}</span>
                    <span className="text-[var(--text-faint)] tabular-nums">
                      {formatMoney(spent)} / {formatMoney(b.limit)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--track)] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 100 ? 'bg-rose-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/budget" className="mt-4 inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300">
            Adjust budgets <ArrowRight size={14} />
          </Link>
        </Card>

        <Card title="Debt pay-down order">
          {priorityDebts.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No active debts. Add accounts on Debts if you track balances here.</p>
          ) : (
            <ul className="divide-y divide-[var(--divider)]">
              {priorityDebts.map((d, i) => (
                <li key={d.id} className="py-3 flex justify-between gap-3 text-sm">
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">
                      <span className="text-[var(--text-faint)] mr-2">#{i + 1}</span>
                      {d.name}
                    </div>
                    <div className="text-xs text-[var(--text-faint)] mt-0.5">
                      {d.interestRate ? `${d.interestRate}% APR · ` : ''}
                      min {formatMoney(d.minimumPayment || 0)}
                    </div>
                  </div>
                  <div className="font-semibold tabular-nums text-[var(--text-primary)]">{formatMoney(d.remainingAmount)}</div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-[var(--text-faint)] mt-3">Ordered by interest rate, then balance — a practical pay-down sequence from your records.</p>
          <Link to="/debts" className="mt-3 inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300">
            Open debts <ArrowRight size={14} />
          </Link>
        </Card>

        <Card title="Goals that need funding">
          {activeGoals.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No open savings goals, or all goals are fully funded.</p>
          ) : (
            <div className="space-y-4">
              {activeGoals.map(({ goal: g, pct }) => (
                <div key={g.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-[var(--text-primary)] truncate pr-2">{g.name}</span>
                    <span className="text-[var(--text-faint)] tabular-nums">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--track)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-[var(--text-faint)] mt-1 tabular-nums">
                    {formatMoney(g.currentAmount)} of {formatMoney(g.targetAmount)}
                    {g.targetDate ? ` · target ${g.targetDate}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/savings" className="mt-4 inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300">
            Fund goals <ArrowRight size={14} />
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/bills', label: 'Bills', icon: CalendarCheck2 },
          { to: '/budget', label: 'Budgets', icon: Wallet },
          { to: '/debts', label: 'Debts', icon: CreditCard },
          { to: '/savings', label: 'Savings', icon: PiggyBank }
        ].map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="glass-interactive p-4 flex flex-col items-center gap-2 text-center">
            <Icon size={22} className="text-violet-400" />
            <span className="text-sm font-medium text-[var(--text-secondary)]">{label}</span>
          </Link>
        ))}
      </div>

      <p className="text-xs text-[var(--text-faint)] text-center max-w-xl mx-auto">
        Planner uses only the numbers you recorded in Trendora Tools. For historical totals and cash-flow summary, open Insights.
      </p>
    </div>
  );
}
