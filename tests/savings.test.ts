import { describe, expect, it } from 'vitest';
import { defaultSnapshot } from '../src/data/repositories';
import { goalSummary } from '../src/domain/savings';

describe('savings calculations', () => {
 it('calculates current amount, remaining amount, and percentage', () => {
   const state = defaultSnapshot();

  state.savingsGoals.push({
    id: 'goal_1',
    name: 'Emergency Fund',
    targetMinor: 500000,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  });

  state.savingsContributions.push({
   id: 'contribution_1',
   goalId: 'goal_1',

    amountMinor: 200000,
    date: '2026-01-05',
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-01-05T00:00:00.000Z'
  });

  state.savingsContributions.push({
    id: 'contribution_2',
    goalId: 'goal_1',
    amountMinor: 50000,
    date: '2026-01-10',
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z'
  });

  const summary = goalSummary(state, state.savingsGoals[0]);

    expect(summary.currentMinor).toBe(250000);
    expect(summary.remainingMinor).toBe(250000);
    expect(summary.percent).toBe(50);
    expect(summary.complete).toBe(false);
  });
});
