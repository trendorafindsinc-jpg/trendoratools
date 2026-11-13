import { describe, expect, it } from 'vitest';
import {
  allCategories,
  budgetUtilization,
  goalProgress,
  toMinorUnits,
  totalDebtRemaining,
  utilizationColor,
} from './utils';
import type { Budget, Debt, Expense, SavingsGoal } from '../types';

describe('financial utility calculations', () => {
  it('converts supported currency strings to minor units', () => {
    expect(toMinorUnits('₦1,234.56')).toBe(123456);
    expect(toMinorUnits('USD 25.50')).toBe(2550);
    expect(toMinorUnits('invalid')).toBe(0);
    expect(toMinorUnits('-12.00')).toBe(0);
  });

  it('converts numeric amounts to minor units', () => {
    expect(toMinorUnits(10)).toBe(1000);
    expect(toMinorUnits(0.1)).toBe(10);
    expect(toMinorUnits(-5)).toBe(0);
  });

  it('calculates savings goal progress and caps completed goals at 100%', () => {
    const goal: SavingsGoal = {
      id: 'goal-1',
      name: 'Emergency fund',
      targetAmount: 10000,
      currentAmount: 2500,
      targetDate: '2027-01-01',
    };
    expect(goalProgress(goal)).toBe(25);
    expect(goalProgress({ ...goal, currentAmount: 12000 })).toBe(100);
    expect(goalProgress({ ...goal, targetAmount: 0 })).toBe(0);
  });

  it('calculates budget utilization from current-month expenses only', () => {
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), 10).toISOString().slice(0, 10);
    const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString().slice(0, 10);
    const expenses: Expense[] = [
      { id: 'e1', amount: 3000, category: 'Food', date: currentDate },
      { id: 'e2', amount: 2000, category: 'Food', date: previousDate },
      { id: 'e3', amount: 1000, category: 'Transport', date: currentDate },
    ];
    const budget: Budget = { id: 'b1', category: 'Food', limit: 10000 };
    expect(budgetUtilization(budget, expenses)).toBe(30);
    expect(budgetUtilization({ ...budget, limit: 0 }, expenses)).toBe(0);
  });

  it('selects utilization status thresholds consistently', () => {
    expect(utilizationColor(79)).toBe('bg-emerald-500');
    expect(utilizationColor(80)).toBe('bg-amber-500');
    expect(utilizationColor(100)).toBe('bg-rose-500');
  });

  it('sums remaining debt balances', () => {
    const debts: Debt[] = [
      { id: 'd1', name: 'Loan A', totalAmount: 5000, remainingAmount: 3200, interestRate: 0, minimumPayment: 0 },
      { id: 'd2', name: 'Loan B', totalAmount: 2000, remainingAmount: 700, interestRate: 0, minimumPayment: 0 },
    ];
    expect(totalDebtRemaining(debts)).toBe(3900);
    expect(totalDebtRemaining([])).toBe(0);
  });

  it('returns unique categories while preserving their order', () => {
    const categories = allCategories(['Travel', 'Food', 'Travel']);
    expect(categories.filter((category) => category === 'Food')).toHaveLength(1);
    expect(categories.filter((category) => category === 'Travel')).toHaveLength(1);
    expect(categories.at(-1)).toBe('Travel');
  });
});
