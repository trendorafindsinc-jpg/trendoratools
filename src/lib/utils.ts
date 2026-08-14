import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, addYears, isBefore, isAfter, startOfDay } from 'date-fns';
import type { Category, Expense, Budget, SavingsGoal, Income, Bill, Debt } from '../types';
import { BASE_CATEGORIES } from '../types';

export function toMinorUnits(amount: number | string): number {
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[₦$€£,\s]/gi, '').replace(/^(NGN|USD|EUR|GBP)/i, '');
    const num = parseFloat(cleaned);
    if (isNaN(num) || num < 0) return 0;
    return Math.round(num * 100);
  }
  return Math.round(Math.max(0, amount) * 100);
}

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

/** alias used in some docs */
export const formatCurrency = formatMoney;

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
    return isWithinInterval(d, { start: startOfMonth(now), end: endOfMonth(now) });
  } catch {
    return false;
  }
}

export function monthExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((e) => isCurrentMonth(e.date));
}

export function monthIncomes(incomes: Income[]): Income[] {
  return incomes.filter((i) => isCurrentMonth(i.date));
}

export function totalExpensesMinor(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function totalIncomeMinor(incomes: Income[]): number {
  return incomes.reduce((sum, i) => sum + i.amount, 0);
}

export function categoryTotal(expenses: Expense[], category: string): number {
  return expenses.filter((e) => e.category === category).reduce((sum, e) => sum + e.amount, 0);
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
  if (percent >= 100) return 'text-rose-400';
  if (percent >= 80) return 'text-amber-400';
  return 'text-emerald-400';
}

export function goalProgress(goal: SavingsGoal): number {
  if (goal.targetAmount <= 0) return 0;
  return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
}

export function defaultTargetDate(): string {
  return format(addYears(new Date(), 1), 'yyyy-MM-dd');
}

export function isOverdue(dueDate: string): boolean {
  try {
    return isBefore(startOfDay(parseISO(dueDate)), startOfDay(new Date()));
  } catch {
    return false;
  }
}

export function isDueSoon(dueDate: string, withinDays = 7): boolean {
  try {
    const due = startOfDay(parseISO(dueDate));
    const now = startOfDay(new Date());
    const limit = new Date(now);
    limit.setDate(limit.getDate() + withinDays);
    return !isBefore(due, now) && !isAfter(due, limit);
  } catch {
    return false;
  }
}

export function upcomingBills(bills: Bill[]): Bill[] {
  return bills
    .filter((b) => !b.paid)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function totalDebtRemaining(debts: Debt[]): number {
  return debts.reduce((s, d) => s + d.remainingAmount, 0);
}

export function allCategories(custom: string[] = []): string[] {
  const set = new Set<string>([...BASE_CATEGORIES, ...custom]);
  return Array.from(set);
}
