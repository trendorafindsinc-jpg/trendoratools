import type { AppSnapshot, SavingsGoal } from '../data/types';

export interface SavingsGoalSummary {
  goal: SavingsGoal;
  currentMinor: number;
  targetMinor: number;
  remainingMinor: number;
  percent: number;
  complete: boolean;
}

export function goalCurrentMinor(state: AppSnapshot, goalId: string): number {
  return state.savingsContributions
   .filter((contribution) => contribution.goalId === goalId)
   .reduce((sum, contribution) => sum + contribution.amountMinor, 0);
}

export function goalSummary(state: AppSnapshot, goal: SavingsGoal): SavingsGoalSummary {
 const currentMinor = goalCurrentMinor(state, goal.id);
 const targetMinor = goal.targetMinor;
 const remainingMinor = Math.max(targetMinor - currentMinor, 0);
 const percent = targetMinor > 0 ? Math.round((currentMinor / targetMinor) * 100) : 0;

    return {
      goal,
      currentMinor,
      targetMinor,
      remainingMinor,
      percent,
      complete: currentMinor >= targetMinor
    };
}

export function goalSummaries(state: AppSnapshot): SavingsGoalSummary[] {
  return state.savingsGoals.map((goal) => goalSummary(state, goal));
}

export function savingsTotals(state: AppSnapshot): { currentMinor: number; targetMinor:
number; activeGoals: number } {
 const summaries = goalSummaries(state);

    return {
      currentMinor: summaries.reduce((sum, item) => sum + item.currentMinor, 0),
      targetMinor: summaries.reduce((sum, item) => sum + item.targetMinor, 0),
      activeGoals: summaries.filter((item) => !item.complete).length
    };
}
