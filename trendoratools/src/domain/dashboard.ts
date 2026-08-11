import type { AppSnapshot, Expense } from '../data/types';
import { currentMonthKey } from '../core/date';
import { formatMinor } from '../core/money';

import { monthBudgetSummaries } from './budget';
import { totalExpensesForMonthMinor } from './expense';
import { savingsTotals } from './savings';

export interface CategoryBreakdownItem {
  name: string;
  amountMinor: number;
  percent: number;
}

export interface DashboardData {
  month: string;
  incomeMinor: number;
  expenseMinor: number;
  budgetLimitMinor: number;
  budgetActualMinor: number;
  budgetRemainingMinor: number;
  savingsCurrentMinor: number;
  savingsTargetMinor: number;
  activeSavingsGoals: number;
  recentExpenses: Expense[];
  categoryBreakdown: CategoryBreakdownItem[];
  alerts: string[];
}

export function getDashboardData(state: AppSnapshot): DashboardData {
 const month = currentMonthKey();
 const currency = state.preferences.currency;

 const incomeMinor = state.incomes
  .filter((income) => income.month === month)
  .reduce((sum, income) => sum + income.amountMinor, 0);

 const expenseMinor = totalExpensesForMonthMinor(state, month);

 const budgetSummaries = monthBudgetSummaries(state, month);
 const budgetLimitMinor = budgetSummaries.reduce((sum, summary) => sum +
summary.limitMinor, 0);
 const budgetActualMinor = budgetSummaries.reduce((sum, summary) => sum +
summary.actualMinor, 0);
 const budgetRemainingMinor = budgetSummaries.reduce((sum, summary) => sum +
summary.remainingMinor, 0);

 const totals = savingsTotals(state);

 const recentExpenses = [...state.expenses]
  .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  .slice(0, 5);

 const monthExpenses = state.expenses.filter((expense) => expense.date.startsWith(month));
 const categoryTotals = new Map<string, number>();

 for (const expense of monthExpenses) {
   const name = expense.category?.trim() || 'Uncategorized';
   categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + expense.amountMinor);
 }

 const categoryBreakdown: CategoryBreakdownItem[] = [...categoryTotals.entries()]
  .map(([name, amountMinor]) => ({
    name,
    amountMinor,
    percent: expenseMinor > 0 ? Math.round((amountMinor / expenseMinor) * 100) : 0
  }))
  .sort((a, b) => b.amountMinor - a.amountMinor)
  .slice(0, 6);

 const alerts: string[] = [];

  for (const summary of budgetSummaries) {
    if (summary.percentUsed >= 100) {
      alerts.push(`Budget “${summary.name}” is over by
${formatMinor(Math.abs(summary.remainingMinor), currency)}.`);
    } else if (summary.percentUsed >= 80) {
      alerts.push(`Budget “${summary.name}” is at ${summary.percentUsed}% of its planned
limit.`);
    }
  }

 for (const goal of state.savingsGoals) {
   if (goal.targetDate && goal.targetDate.startsWith(month)) {
     alerts.push(`Savings goal “${goal.name}” has a target date this month.`);
   }
 }

 return {
  month,
  incomeMinor,
  expenseMinor,

   budgetLimitMinor,
   budgetActualMinor,
   budgetRemainingMinor,
   savingsCurrentMinor: totals.currentMinor,
   savingsTargetMinor: totals.targetMinor,
   activeSavingsGoals: totals.activeGoals,
   recentExpenses,
   categoryBreakdown,
   alerts
 };
}
