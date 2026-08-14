import type { Category } from './types';
import { BASE_CATEGORIES } from './types';
import { useAppStore } from './store';
import {
  formatMoney,
  monthExpenses,
  monthIncomes,
  totalExpensesMinor,
  totalIncomeMinor,
  categoryTotal,
  toMinorUnits,
  defaultTargetDate,
  upcomingBills,
  totalDebtRemaining,
  todayISO
} from './lib/utils';

/**
 * Deterministic intent engine — NOT an AI.
 * Grok-style direct answers, exact figures only.
 */
export function processIntent(raw: string): string {
  const text = raw.trim();
  const lower = text.toLowerCase();
  if (!lower) {
    return 'Try /help — or ask about spending, income, bills, debt, budgets, or savings.';
  }

  if (lower === '/help' || lower === 'help') {
    return [
      'I route with deterministic rules (not an LLM). I can:',
      '• Spending — “how much did I spend this month?”',
      '• Income — “how much did I earn?” / “add income 500000 salary”',
      '• Budget left — “how much is left in my food budget?”',
      '• Bills — “what bills are due?”',
      '• Debt — “how much do I owe?”',
      '• Cashflow — “am I cash flow positive this month?”',
      '• Save — “I want to save 500000”',
      '• Expense — “add expense 2000 transport”',
      'Slash shortcuts: /spend /income /bills /debt /budget /save /networth /help'
    ].join('\n');
  }

  const state = useAppStore.getState();
  const mExp = monthExpenses(state.expenses);
  const mInc = monthIncomes(state.incomes);
  const spent = totalExpensesMinor(mExp);
  const earned = totalIncomeMinor(mInc);

  // slash aliases
  const cmd = lower.startsWith('/') ? lower.split(/\s+/)[0] : '';

  if (
    cmd === '/spend' ||
    /how much.*(spend|spent|spending)/.test(lower) ||
    /total.*(spend|spent|expense)/.test(lower) ||
    lower.includes('spending this month')
  ) {
    if (mExp.length === 0) return 'No expenses recorded for this month yet.';
    const byCat = new Map<string, number>();
    for (const e of mExp) byCat.set(e.category, (byCat.get(e.category) || 0) + e.amount);
    let largest = '';
    let largestAmt = 0;
    for (const [cat, amt] of byCat) {
      if (amt > largestAmt) {
        largest = cat;
        largestAmt = amt;
      }
    }
    return `You spent ${formatMoney(spent)} this month. Largest category: ${largest} (${formatMoney(largestAmt)}).`;
  }

  if (
    cmd === '/income' ||
    /how much.*(earn|earned|income)/.test(lower) ||
    /total income/.test(lower)
  ) {
    if (mInc.length === 0 && !lower.includes('add income')) {
      return 'No income recorded for this month yet. Try: add income 500000 salary';
    }
    if (!lower.includes('add income') && !/^\/income\s+\d/.test(lower)) {
      return `Income this month: ${formatMoney(earned)} across ${mInc.length} entr${mInc.length === 1 ? 'y' : 'ies'}.`;
    }
  }

  // add income
  const addInc =
    lower.match(/add\s+income\s+(\d[\d,]*(?:\.\d+)?)\s+(.+)/i) ||
    lower.match(/^\/income\s+(\d[\d,]*(?:\.\d+)?)\s+(.+)/i);
  if (addInc) {
    const amount = toMinorUnits(addInc[1]);
    const source = addInc[2].trim();
    if (amount <= 0) return 'Amount must be positive.';
    state.addIncome({ amount, source });
    return `Recorded income ${formatMoney(amount)} from “${source}”.`;
  }

  // budget remaining
  const budgetMatch = lower.match(/(?:left|remaining).*(?:my\s+)?(\w+)\s+budget/);
  if (cmd === '/budget' || budgetMatch || /how much.*(left|remaining).*budget/.test(lower)) {
    const catName = (budgetMatch?.[1] || '').replace(/[^a-z]/gi, '');
    const category = BASE_CATEGORIES.find((c) => c.toLowerCase() === catName) as Category | undefined;
    if (!category && cmd !== '/budget') {
      return 'Specify a category, e.g. “how much is left in my food budget?”';
    }
    if (!category) {
      if (state.budgets.length === 0) return 'No budgets set yet.';
      return state.budgets
        .map((b) => {
          const s = categoryTotal(mExp, b.category);
          return `${b.category}: ${formatMoney(Math.max(0, b.limit - s))} left of ${formatMoney(b.limit)}`;
        })
        .join('\n');
    }
    const budget = state.budgets.find((b) => b.category === category);
    if (!budget) return `No ${category} budget yet. Create one on the Budget page.`;
    const s = categoryTotal(mExp, category);
    return `${category}: ${formatMoney(budget.limit)} limit · ${formatMoney(s)} spent · ${formatMoney(Math.max(0, budget.limit - s))} left.`;
  }

  // bills
  if (cmd === '/bills' || (/bill/.test(lower) && /(due|upcoming|unpaid)/.test(lower))) {
    const upcoming = upcomingBills(state.bills);
    if (upcoming.length === 0) return 'No unpaid bills on the books. Clear skies.';
    const total = upcoming.reduce((s, b) => s + b.amount, 0);
    const lines = upcoming
      .slice(0, 5)
      .map((b) => `• ${b.name} — ${formatMoney(b.amount)} due ${b.dueDate}`)
      .join('\n');
    return `${upcoming.length} unpaid bill(s) totaling ${formatMoney(total)}:\n${lines}`;
  }

  // debt
  if (cmd === '/debt' || /how much.*(owe|debt)/.test(lower) || /total debt/.test(lower)) {
    const total = totalDebtRemaining(state.debts);
    if (total === 0) return 'No recorded debt. Strong position.';
    return `Total remaining debt across ${state.debts.length} account(s): ${formatMoney(total)}.`;
  }

  // cashflow / networth-ish
  if (
    cmd === '/networth' ||
    /cash\s*flow/.test(lower) ||
    /net\s*worth/.test(lower) ||
    /cash flow positive/.test(lower)
  ) {
    const saved = state.savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
    const debt = totalDebtRemaining(state.debts);
    const net = earned - spent;
    const approx = saved - debt;
    return [
      `This month cashflow: ${formatMoney(net)} (income ${formatMoney(earned)} − expenses ${formatMoney(spent)}).`,
      `Savings balances: ${formatMoney(saved)}. Debt remaining: ${formatMoney(debt)}.`,
      `Rough position (savings − debt): ${formatMoney(approx)}. (Does not include untracked cash/assets.)`
    ].join('\n');
  }

  // quick save goal
  const saveMatch =
    lower.match(/(?:save|saving|goal)\s+(\d[\d,]*(?:\.\d+)?)/i) ||
    lower.match(/i want to save\s+(\d[\d,]*(?:\.\d+)?)/i) ||
    lower.match(/^\/save\s+(\d[\d,]*(?:\.\d+)?)/i);
  if (cmd === '/save' || saveMatch) {
    const amount = toMinorUnits(saveMatch?.[1] || '0');
    if (amount <= 0) return 'Give a positive amount to save.';
    state.addSavingsGoal({
      name: `Quick Goal ${formatMoney(amount)}`,
      targetAmount: amount,
      targetDate: defaultTargetDate()
    });
    return `Created savings goal ${formatMoney(amount)} (1-year target). Open Savings to fund it.`;
  }

  // add expense
  const expMatch =
    lower.match(/(?:add\s+)?(?:expense|spent|spend)\s+(\d[\d,]*(?:\.\d+)?)\s+(?:on\s+)?(\w+)/i) ||
    lower.match(/(\d[\d,]*(?:\.\d+)?)\s+(?:on\s+)?(food|transport|housing|utilities|shopping|entertainment|health|education|bills|other)/i);
  if (expMatch) {
    const amount = toMinorUnits(expMatch[1]);
    const catRaw = expMatch[2].toLowerCase();
    const category =
      (BASE_CATEGORIES.find((c) => c.toLowerCase() === catRaw) as Category) || 'Other';
    if (amount <= 0) return 'Amount must be positive.';
    state.addExpense({ amount, category });
    return `Recorded ${formatMoney(amount)} under ${category}.`;
  }

  // add bill best-effort: add bill rent 200000 due 2026-08-28
  const billMatch = lower.match(
    /add\s+bill\s+(\w+(?:\s+\w+)?)\s+(\d[\d,]*(?:\.\d+)?)\s*(?:due\s+)?(\d{4}-\d{2}-\d{2})?/i
  );
  if (billMatch) {
    const name = billMatch[1].trim();
    const amount = toMinorUnits(billMatch[2]);
    const dueDate = billMatch[3] || todayISO();
    state.addBill({ name, amount, dueDate, recurring: false });
    return `Bill “${name}” for ${formatMoney(amount)} due ${dueDate} added.`;
  }

  return 'I use fixed rules, not an AI model. Try /help — or ask about spending, income, bills, debt, budgets, or savings with exact amounts.';
}
