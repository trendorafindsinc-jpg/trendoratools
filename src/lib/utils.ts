import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, addYears } from 'date-fns';
import type { Category, Expense, Budget, SavingsGoal } from '../types';

/** Convert naira/dollar amount (or string) to integer minor units (kobo/cents). */
export function toMinorUnits(amount: number | string): number {
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[₦$€£,\s]/gi, '').replace(/^(NGN|USD|EUR|GBP)/i, '');
    const num = parseFloat(cleaned);
    if (isNaN(num) || num < 0) return 0;
    return Math.round(num * 100);
  }
  return Math.round(Math.max(0, amount) * 100);
}

/** Format minor units as currency string (default NGN). */
export function formatMoney(minor: number, currency = 'NGN'): string {
  const value = (minor || 0) / 100;
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(value);
  } catch {
    return `₦${value.toFixed(2)}`;
  }
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function currentMonthKey(): string {
  return format(new Date(), 'yyyy-MM');
}

export function isCurrentMonth(dateStr: string): boolean {
  try {
    const d = parseISO(dateStr);
    const now = new Date();
    return isWithinInterval(d, {
      start: startOfMonth(now),
      end: endOfMonth(now)
    });
  } catch {
    return false;
  }
}

export function monthExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((e) => isCurrentMonth(e.date));
}

export function totalExpensesMinor(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function categoryTotal(expenses: Expense[], category: Category): number {
  return expenses
    .filter((e) => e.category === category)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function budgetUtilization(budget: Budget, expenses: Expense[]): number {
  const spent = categoryTotal(monthExpenses(expenses), budget.category);
  if (budget.limit <= 0) return 0;
  return Math.round((spent / budget.limit) * 100);
}

export function utilizationColor(percent: number): string {
  if (percent >= 100) return 'bg-rose-500';
  if (percent >= 80) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function utilizationTextColor(percent: number): string {
  if (percent >= 100) return 'text-rose-700';
  if (percent >= 80) return 'text-amber-700';
  return 'text-emerald-700';
}

export function goalProgress(goal: SavingsGoal): number {
  if (goal.targetAmount <= 0) return 0;
  return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
}

export function defaultTargetDate(): string {
  return format(addYears(new Date(), 1), 'yyyy-MM-dd');
}
