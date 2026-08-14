import type { Expense, Income, Bill, Debt, SavingsGoal } from '../types';
import {
  isCurrentMonth,
  totalExpensesMinor,
  totalIncomeMinor,
  totalDebtRemaining,
  monthExpenses,
  monthIncomes
} from './utils';

export interface PeriodSummary {
  incomeMinor: number;
  expenseMinor: number;
  netCashflowMinor: number;
  savedMinor: number;
  debtRemainingMinor: number;
  unpaidBillsMinor: number;
  unpaidBillsCount: number;
  categoryBreakdown: { category: string; amount: number }[];
}

export function buildMonthSummary(
  expenses: Expense[],
  incomes: Income[],
  bills: Bill[],
  debts: Debt[],
  savingsGoals: SavingsGoal[]
): PeriodSummary {
  const mExp = monthExpenses(expenses);
  const mInc = monthIncomes(incomes);
  const expenseMinor = totalExpensesMinor(mExp);
  const incomeMinor = totalIncomeMinor(mInc);
  const byCat = new Map<string, number>();
  for (const e of mExp) {
    byCat.set(e.category, (byCat.get(e.category) || 0) + e.amount);
  }
  const categoryBreakdown = Array.from(byCat.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
  const unpaid = bills.filter((b) => !b.paid);
  return {
    incomeMinor,
    expenseMinor,
    netCashflowMinor: incomeMinor - expenseMinor,
    savedMinor: savingsGoals.reduce((s, g) => s + g.currentAmount, 0),
    debtRemainingMinor: totalDebtRemaining(debts),
    unpaidBillsMinor: unpaid.reduce((s, b) => s + b.amount, 0),
    unpaidBillsCount: unpaid.length,
    categoryBreakdown
  };
}
