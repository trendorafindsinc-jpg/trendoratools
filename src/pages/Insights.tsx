import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, CalendarClock, PiggyBank, Receipt, ShieldCheck, Wallet } from 'lucide-react';
import { useAppStore } from '../store';
import {
  formatMoney,
  monthExpenses,
  monthIncomes,
  totalExpensesMinor,
  totalIncomeMinor,
  upcomingBills,
  totalDebtRemaining,
  categoryTotal
} from '../lib/utils';

export default function Insights() {
  const { expenses, incomes, budgets, savingsGoals, bills, debts } = useAppStore();
  const monthlyExpenses = monthExpenses(expenses);
  const monthlyIncome = monthIncomes(incomes);
  const spent = totalExpensesMinor(monthlyExpenses);
  const earned = totalIncomeMinor(monthlyIncome);
  const cashflow = earned - spent;
  const unpaidBills = upcomingBills(bills);
  const billsTotal = unpaidBills.reduce((sum, bill) => sum + bill.amount, 0);
  const debt = totalDebtRemaining(debts);
  const saved = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const budgetTotal = budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const budgetUsed = budgets.reduce((sum, budget) => sum + categoryTotal(monthlyExpenses, budget.category), 0);

  const largestCategory = monthlyExpenses.reduce<{ name: string; amount: number } | null>((largest, expense) => {
    const amount = categoryTotal(monthlyExpenses, expense.category);
    if (!largest || amount > largest.amount) return { name: expense.category, amount };
    return largest;
  }, null);

  const cards = [
    { label: 'Monthly cash flow', value: formatMoney(cashflow), detail: cashflow >= 0 ? 'Income is ahead of expenses' : 'Expenses are ahead of income', icon: BarChart3 },
    { label: 'Savings progress', value: formatMoney(saved), detail: `${savingsGoals.length} active goal${savingsGoals.length === 1 ? '' : 's'}`, icon: PiggyBank },
    { label: 'Bills to watch', value: formatMoney(billsTotal), detail: `${unpaidBills.length} unpaid bill${unpaidBills.length === 1 ? '' : 's'}`, icon: CalendarClock },
    { label: 'Debt remaining', value: formatMoney(debt), detail: `${debts.length} account${debts.length === 1 ? '' : 's'} tracked`, icon: ShieldCheck }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-8">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-violet-300">
          <BarChart3 size={14} /> Trendora Tools
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gradient-brand">Financial Insights</h1>
        <p className="text-slate-400 max-w-2xl">
          A clear view of the numbers already recorded in Trendora Tools. No chatbot, no remote AI, and no guessed figures.
        </p>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="glass-card p-4 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-300">
              <Icon size={18} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
              <div className="text-lg font-semibold text-slate-100 tabular-nums">{value}</div>
              <div className="text-xs text-slate-500 mt-1">{detail}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="glass-primary p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-white">This month</h2>
            <p className="text-sm text-slate-500">Based on your recorded income and expenses.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-4"><div className="text-xs text-slate-500">Income</div><div className="text-xl font-semibold text-slate-100">{formatMoney(earned)}</div></div>
            <div className="glass-card p-4"><div className="text-xs text-slate-500">Expenses</div><div className="text-xl font-semibold text-slate-100">{formatMoney(spent)}</div></div>
          </div>
          <div className="glass-card p-4">
            <div className="text-xs text-slate-500">Largest spending category</div>
            <div className="text-lg font-semibold text-slate-100">
              {largestCategory ? `${largestCategory.name} · ${formatMoney(largestCategory.amount)}` : 'No expenses recorded yet'}
            </div>
          </div>
        </div>

        <div className="glass-primary p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Budget position</h2>
            <p className="text-sm text-slate-500">Live utilization from your current budget limits.</p>
          </div>
          {budgetTotal > 0 ? (
            <>
              <div className="flex items-end justify-between gap-3">
                <div><div className="text-xs text-slate-500">Used</div><div className="text-2xl font-semibold text-slate-100">{formatMoney(budgetUsed)}</div></div>
                <div className="text-right"><div className="text-xs text-slate-500">Limit</div><div className="text-lg font-medium text-slate-300">{formatMoney(budgetTotal)}</div></div>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, (budgetUsed / budgetTotal) * 100)}%` }} />
              </div>
            </>
          ) : (
            <div className="glass-card p-4 text-sm text-slate-400">No budgets set yet. Create your first budget to start tracking utilization.</div>
          )}
          <Link to="/budget" className="glass-button inline-flex">Manage budgets <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-3">
        <Link to="/expenses" className="glass-interactive p-5 space-y-2">
          <Receipt size={20} className="text-violet-300" />
          <div className="font-semibold text-slate-100">Review expenses</div>
          <div className="text-sm text-slate-500">Keep your ledger accurate and current.</div>
        </Link>
        <Link to="/savings" className="glass-interactive p-5 space-y-2">
          <PiggyBank size={20} className="text-violet-300" />
          <div className="font-semibold text-slate-100">Grow savings</div>
          <div className="text-sm text-slate-500">Track progress toward your goals.</div>
        </Link>
        <Link to="/dashboard" className="glass-interactive p-5 space-y-2">
          <Wallet size={20} className="text-violet-300" />
          <div className="font-semibold text-slate-100">Open Command</div>
          <div className="text-sm text-slate-500">See your wider financial position.</div>
        </Link>
      </section>
    </div>
  );
}
