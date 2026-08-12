import type { Category } from './types';
import { CATEGORIES as cats } from './types';
import { useAppStore } from './store';
import {
  formatMoney,
  monthExpenses,
  totalExpensesMinor,
  categoryTotal,
  toMinorUnits,
  defaultTargetDate
} from './lib/utils';

/**
 * Deterministic intent engine — NOT an AI.
 * Simple keyword / pattern matching that routes to tools or returns exact answers.
 */
export function processIntent(raw: string): string {
  const text = raw.trim().toLowerCase();
  if (!text) return 'Type something like “add expense 2000 transport” or “how much did I spend this month?”';

  const state = useAppStore.getState();
  const monthExps = monthExpenses(state.expenses);
  const totalSpent = totalExpensesMinor(monthExps);

  // --- Spend summary ---
  if (
    /how much.*(spend|spent|spending)/.test(text) ||
    /total.*(spend|spent|expense)/.test(text) ||
    text.includes('spending this month')
  ) {
    if (monthExps.length === 0) return 'You have no expenses recorded for this month yet.';
    const byCat = new Map<string, number>();
    for (const e of monthExps) {
      byCat.set(e.category, (byCat.get(e.category) || 0) + e.amount);
    }
    let largest = '';
    let largestAmt = 0;
    for (const [cat, amt] of byCat) {
      if (amt > largestAmt) {
        largest = cat;
        largestAmt = amt;
      }
    }
    return `You spent ${formatMoney(totalSpent)} this month. Largest category: ${largest} (${formatMoney(largestAmt)}).`;
  }

  // --- Budget remaining ---
  const budgetMatch = text.match(/(?:left|remaining|left in).*(?:my\s+)?(\w+)\s+budget/);
  if (budgetMatch || /how much.*(left|remaining).*budget/.test(text)) {
    const catName = (budgetMatch?.[1] || '').replace(/[^a-z]/gi, '');
    const category = cats.find((c) => c.toLowerCase() === catName) as Category | undefined;
    if (!category) {
      return 'Tell me which budget, e.g. “how much is left in my food budget?”';
    }
    const budget = state.budgets.find((b) => b.category === category);
    if (!budget) return `You don’t have a ${category} budget yet. Create one in the Budget page.`;
    const spent = categoryTotal(monthExps, category);
    const left = budget.limit - spent;
    return `${category} budget: ${formatMoney(budget.limit)} limit, ${formatMoney(spent)} spent, ${formatMoney(Math.max(0, left))} left.`;
  }

  // --- Quick save goal ---
  const saveMatch =
    text.match(/(?:save|saving|goal)\s+(\d[\d,]*(?:\.\d+)?)/i) ||
    text.match(/i want to save\s+(\d[\d,]*(?:\.\d+)?)/i);
  if (saveMatch) {
    const amount = toMinorUnits(saveMatch[1]);
    if (amount <= 0) return 'Please give a positive amount to save.';
    state.addSavingsGoal({
      name: `Quick Goal ${formatMoney(amount)}`,
      targetAmount: amount,
      targetDate: defaultTargetDate()
    });
    return `Created a savings goal of ${formatMoney(amount)} with a 1-year target. Open Savings to manage it.`;
  }

  // --- Add expense ---
  const expMatch =
    text.match(/(?:add\s+)?(?:expense|spent|spend)\s+(\d[\d,]*(?:\.\d+)?)\s+(?:on\s+)?(\w+)/i) ||
    text.match(/(\d[\d,]*(?:\.\d+)?)\s+(?:on\s+)?(food|transport|housing|utilities|shopping|entertainment|health|education|bills|other)/i);
  if (expMatch) {
    const amount = toMinorUnits(expMatch[1]);
    const catRaw = expMatch[2].toLowerCase();
    const category = (cats.find((c) => c.toLowerCase() === catRaw) || 'Other') as Category;
    if (amount <= 0) return 'Amount must be positive.';
    state.addExpense({ amount, category });
    return `Recorded ${formatMoney(amount)} under ${category}.`;
  }

  // --- Fallback ---
  return 'I can help with your budgets, expenses, savings goals, and financial summaries. Try: “how much did I spend this month?”, “add expense 2000 transport”, or “I want to save 500000”.';
}
