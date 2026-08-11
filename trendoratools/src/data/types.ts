export type Recurrence = 'none' | 'monthly';

export interface Preferences {
  currency: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  onboarded: boolean;
}

export interface Income {
  id: string;
  name: string;
  amountMinor: number;
  month: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  name: string;
  month: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategory {
  id: string;
  budgetId: string;
  name: string;
  limitMinor: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  amountMinor: number;
  category?: string;
  categoryId?: string;
  description?: string;
  date: string;
  recurring: Recurrence;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetMinor: number;
  targetDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsContribution {
 id: string;
 goalId: string;
 amountMinor: number;

    date: string;
    note?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AppSnapshot {
  version: 1;
  preferences: Preferences;
  incomes: Income[];
  budgets: Budget[];
  budgetCategories: BudgetCategory[];
  expenses: Expense[];
  savingsGoals: SavingsGoal[];
  savingsContributions: SavingsContribution[];
}
