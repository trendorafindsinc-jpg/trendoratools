import { describe, expect, it } from 'vitest';
import { defaultSnapshot } from '../src/data/repositories';
import { budgetSummary } from '../src/domain/budget';

describe('budget calculations', () => {
 it('calculates category actuals, limits, and remaining amounts', () => {
   const state = defaultSnapshot();

  state.budgets.push({
    id: 'budget_1',
    name: 'Monthly Budget',
    month: '2026-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  });

  state.budgetCategories.push({
    id: 'category_1',
    budgetId: 'budget_1',
    name: 'Groceries',
    limitMinor: 100000,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  });

  state.expenses.push({
   id: 'expense_1',
   amountMinor: 30000,
   category: 'Groceries',
   date: '2026-01-10',
   recurring: 'none',
   createdAt: '2026-01-10T00:00:00.000Z',

    updatedAt: '2026-01-10T00:00:00.000Z'
  });

  state.expenses.push({
    id: 'expense_2',
    amountMinor: 15000,
    category: 'groceries',
    date: '2026-01-12',
    recurring: 'none',
    createdAt: '2026-01-12T00:00:00.000Z',
    updatedAt: '2026-01-12T00:00:00.000Z'
  });

  const summary = budgetSummary(state, state.budgets[0]);

    expect(summary.limitMinor).toBe(100000);
    expect(summary.actualMinor).toBe(45000);
    expect(summary.remainingMinor).toBe(55000);
    expect(summary.percentUsed).toBe(45);
  });
});
