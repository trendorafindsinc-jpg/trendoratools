import { defaultSnapshot, normalizeSnapshot } from '../data/repositories';
import type { DataRepository } from '../data/repositories';
import type {
  AppSnapshot,
  Budget,
  BudgetCategory,
  Expense,
  Income,
  Preferences,
  SavingsContribution,
  SavingsGoal
} from '../data/types';

import { uid } from '../core/ids';
import {
  fail,
  ok,
  requireDate,
  requireMonth,
  requirePositiveMinor,
  requireText,
  type ValidationResult
} from '../core/validation';

export interface AddIncomeInput {
  name: string;
  amountMinor: number;
  month: string;
  notes?: string;
}

export interface AddBudgetInput {
  name: string;
  month: string;
  notes?: string;
}

export interface AddBudgetCategoryInput {
  budgetId: string;
  name: string;
  limitMinor: number;
}

export interface AddExpenseInput {
  amountMinor: number;
  category?: string;
  categoryId?: string;
  description?: string;
  date: string;
  recurring: Expense['recurring'];
}

export interface AddSavingsGoalInput {
 name: string;
 targetMinor: number;
 targetDate?: string;
 notes?: string;

}

export interface AddSavingsContributionInput {
  goalId: string;
  amountMinor: number;
  date: string;
  note?: string;
}

export class AppStore {
 private snapshot: AppSnapshot;
 private listeners = new Set<() => void>();

    constructor(private repo: DataRepository) {
      this.snapshot = repo.load();
    }

    get state(): AppSnapshot {
      return this.snapshot;
    }

    subscribe(listener: () => void): () => void {
      this.listeners.add(listener);
      return () => {
        this.listeners.delete(listener);
      };
    }

    private emit(): void {
      for (const listener of this.listeners) listener();
    }

    private commit(mutate: (draft: AppSnapshot) => void): void {
      const next = structuredClone(this.snapshot);
      mutate(next);
      this.snapshot = next;
      this.repo.save(next);
      this.emit();
    }

    private now(): string {
      return new Date().toISOString();
    }

setPreferences(patch: Partial<Preferences>): void {
  this.commit((draft) => {
    draft.preferences = { ...draft.preferences, ...patch };
  });
}

completeOnboarding(): void {
  this.setPreferences({ onboarded: true });
}

addIncome(input: AddIncomeInput): ValidationResult {
 const nameCheck = requireText(input.name, 'Income name');
 if (!nameCheck.ok) return nameCheck;

    const amountCheck = requirePositiveMinor(input.amountMinor, 'Income amount');
    if (!amountCheck.ok) return amountCheck;

    const monthCheck = requireMonth(input.month, 'Income month');
    if (!monthCheck.ok) return monthCheck;

    this.commit((draft) => {
      const now = this.now();
      const income: Income = {
        id: uid('income'),
        name: input.name.trim(),
        amountMinor: input.amountMinor,
        month: input.month,
        notes: input.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now
      };
      draft.incomes.push(income);
    });

    return ok();
}

deleteIncome(id: string): ValidationResult {
 if (!this.snapshot.incomes.some((item) => item.id === id)) return fail('Income not found.');

    this.commit((draft) => {
      draft.incomes = draft.incomes.filter((item) => item.id !== id);
    });

     return ok();
 }

 addBudget(input: AddBudgetInput): ValidationResult {
  const nameCheck = requireText(input.name, 'Budget name');
  if (!nameCheck.ok) return nameCheck;

     const monthCheck = requireMonth(input.month, 'Budget month');
     if (!monthCheck.ok) return monthCheck;

     this.commit((draft) => {
       const now = this.now();
       const budget: Budget = {
         id: uid('budget'),
         name: input.name.trim(),
         month: input.month,
         notes: input.notes?.trim() || undefined,
         createdAt: now,
         updatedAt: now
       };
       draft.budgets.push(budget);
     });

     return ok();
 }

 deleteBudget(id: string): ValidationResult {
  if (!this.snapshot.budgets.some((budget) => budget.id === id)) return fail('Budget not found.');

   this.commit((draft) => {
     draft.budgets = draft.budgets.filter((budget) => budget.id !== id);
     draft.budgetCategories = draft.budgetCategories.filter((category) => category.budgetId !==
id);
   });

     return ok();
 }

 addBudgetCategory(input: AddBudgetCategoryInput): ValidationResult {
  const budgetExists = this.snapshot.budgets.some((budget) => budget.id === input.budgetId);
  if (!budgetExists) return fail('Choose a valid budget.');

     const nameCheck = requireText(input.name, 'Category name');
     if (!nameCheck.ok) return nameCheck;

     const limitCheck = requirePositiveMinor(input.limitMinor, 'Category limit');
     if (!limitCheck.ok) return limitCheck;

  const duplicate = this.snapshot.budgetCategories.some(
    (category) => category.budgetId === input.budgetId && category.name.trim().toLowerCase()
=== input.name.trim().toLowerCase()
  );
  if (duplicate) return fail('That category already exists in this budget.');

     this.commit((draft) => {
       const now = this.now();
       const category: BudgetCategory = {
         id: uid('budget_category'),
         budgetId: input.budgetId,
         name: input.name.trim(),
         limitMinor: input.limitMinor,
         createdAt: now,
         updatedAt: now
       };
       draft.budgetCategories.push(category);
     });

     return ok();
 }

 updateBudgetCategory(id: string, patch: { name?: string; limitMinor?: number }):
ValidationResult {
  const existing = this.snapshot.budgetCategories.find((category) => category.id === id);
  if (!existing) return fail('Category not found.');

     if (patch.name !== undefined) {
       const nameCheck = requireText(patch.name, 'Category name');
       if (!nameCheck.ok) return nameCheck;
     }

     if (patch.limitMinor !== undefined) {
       const limitCheck = requirePositiveMinor(patch.limitMinor, 'Category limit');
       if (!limitCheck.ok) return limitCheck;
     }

     this.commit((draft) => {
      const category = draft.budgetCategories.find((item) => item.id === id);
      if (!category) return;

       if (patch.name !== undefined) category.name = patch.name.trim();
       if (patch.limitMinor !== undefined) category.limitMinor = patch.limitMinor;
       category.updatedAt = this.now();
     });

     return ok();
 }

 deleteBudgetCategory(id: string): ValidationResult {
   if (!this.snapshot.budgetCategories.some((category) => category.id === id)) return fail('Category not found.');

     this.commit((draft) => {
       draft.budgetCategories = draft.budgetCategories.filter((category) => category.id !== id);
     });

     return ok();
 }

 addExpense(input: AddExpenseInput): ValidationResult {
  const amountCheck = requirePositiveMinor(input.amountMinor, 'Expense amount');
  if (!amountCheck.ok) return amountCheck;

     const dateCheck = requireDate(input.date, 'Expense date');
     if (!dateCheck.ok) return dateCheck;

     this.commit((draft) => {
       const now = this.now();
       const expense: Expense = {
         id: uid('expense'),
         amountMinor: input.amountMinor,
         category: input.category?.trim() || undefined,
         categoryId: input.categoryId || undefined,
         description: input.description?.trim() || undefined,
         date: input.date,
         recurring: input.recurring ?? 'none',
         createdAt: now,
         updatedAt: now
       };
       draft.expenses.push(expense);
     });

     return ok();

 }

 updateExpense(id: string, patch: Partial<Omit<Expense, 'id' | 'createdAt'>>): ValidationResult {
  const existing = this.snapshot.expenses.find((expense) => expense.id === id);
  if (!existing) return fail('Expense not found.');

     if (patch.amountMinor !== undefined) {
       const amountCheck = requirePositiveMinor(patch.amountMinor, 'Expense amount');
       if (!amountCheck.ok) return amountCheck;
     }

     if (patch.date !== undefined) {
       const dateCheck = requireDate(patch.date, 'Expense date');
       if (!dateCheck.ok) return dateCheck;
     }

     this.commit((draft) => {
      const expense = draft.expenses.find((item) => item.id === id);
      if (!expense) return;

    if (patch.amountMinor !== undefined) expense.amountMinor = patch.amountMinor;
    if (patch.category !== undefined) expense.category = patch.category?.trim() || undefined;
    if (patch.categoryId !== undefined) expense.categoryId = patch.categoryId || undefined;
    if (patch.description !== undefined) expense.description = patch.description?.trim() ||
undefined;
    if (patch.date !== undefined) expense.date = patch.date;
    if (patch.recurring !== undefined) expense.recurring = patch.recurring;
    expense.updatedAt = this.now();
  });

     return ok();
 }

 deleteExpense(id: string): ValidationResult {
  if (!this.snapshot.expenses.some((expense) => expense.id === id)) return fail('Expense not found.');

     this.commit((draft) => {
       draft.expenses = draft.expenses.filter((expense) => expense.id !== id);
     });

     return ok();
 }

 addSavingsGoal(input: AddSavingsGoalInput): ValidationResult {
  const nameCheck = requireText(input.name, 'Goal name');
  if (!nameCheck.ok) return nameCheck;

     const targetCheck = requirePositiveMinor(input.targetMinor, 'Target amount');
     if (!targetCheck.ok) return targetCheck;

     if (input.targetDate) {
       const dateCheck = requireDate(input.targetDate, 'Target date');
       if (!dateCheck.ok) return dateCheck;
     }

     this.commit((draft) => {
       const now = this.now();
       const goal: SavingsGoal = {
         id: uid('savings_goal'),
         name: input.name.trim(),
         targetMinor: input.targetMinor,
         targetDate: input.targetDate || undefined,
         notes: input.notes?.trim() || undefined,
         createdAt: now,
         updatedAt: now
       };
       draft.savingsGoals.push(goal);
     });

     return ok();
 }

 deleteSavingsGoal(id: string): ValidationResult {
  if (!this.snapshot.savingsGoals.some((goal) => goal.id === id)) return fail('Savings goal not found.');

  this.commit((draft) => {
    draft.savingsGoals = draft.savingsGoals.filter((goal) => goal.id !== id);
    draft.savingsContributions = draft.savingsContributions.filter((contribution) =>
contribution.goalId !== id);
  });

     return ok();
 }

 addSavingsContribution(input: AddSavingsContributionInput): ValidationResult {
  const goalExists = this.snapshot.savingsGoals.some((goal) => goal.id === input.goalId);

     if (!goalExists) return fail('Choose a valid savings goal.');

     const amountCheck = requirePositiveMinor(input.amountMinor, 'Contribution amount');
     if (!amountCheck.ok) return amountCheck;

     const dateCheck = requireDate(input.date, 'Contribution date');
     if (!dateCheck.ok) return dateCheck;

     this.commit((draft) => {
       const now = this.now();
       const contribution: SavingsContribution = {
         id: uid('savings_contribution'),
         goalId: input.goalId,
         amountMinor: input.amountMinor,
         date: input.date,
         note: input.note?.trim() || undefined,
         createdAt: now,
         updatedAt: now
       };
       draft.savingsContributions.push(contribution);
     });

     return ok();
 }

  updateSavingsContribution(id: string, patch: { amountMinor?: number; date?: string; note?:
string }): ValidationResult {
   const existing = this.snapshot.savingsContributions.find((contribution) => contribution.id ===
id);
   if (!existing) return fail('Contribution not found.');

     if (patch.amountMinor !== undefined) {
       const amountCheck = requirePositiveMinor(patch.amountMinor, 'Contribution amount');
       if (!amountCheck.ok) return amountCheck;
     }

     if (patch.date !== undefined) {
       const dateCheck = requireDate(patch.date, 'Contribution date');
       if (!dateCheck.ok) return dateCheck;
     }

     this.commit((draft) => {
      const contribution = draft.savingsContributions.find((item) => item.id === id);
      if (!contribution) return;

       if (patch.amountMinor !== undefined) contribution.amountMinor = patch.amountMinor;
       if (patch.date !== undefined) contribution.date = patch.date;
       if (patch.note !== undefined) contribution.note = patch.note?.trim() || undefined;
       contribution.updatedAt = this.now();
     });

     return ok();
 }

 deleteSavingsContribution(id: string): ValidationResult {
  if (!this.snapshot.savingsContributions.some((contribution) => contribution.id === id)) {
    return fail('Contribution not found.');
  }

  this.commit((draft) => {
    draft.savingsContributions = draft.savingsContributions.filter((contribution) => contribution.id
!== id);
  });

     return ok();
 }

 exportData(): string {
   return JSON.stringify(this.snapshot, null, 2);
 }

 importData(json: string): ValidationResult {
   try {
     const parsed: unknown = JSON.parse(json);
     const normalized = normalizeSnapshot(parsed);
     this.snapshot = normalized;
     this.repo.save(normalized);
     this.emit();
     return ok();
   } catch {
     return fail('Import failed. The file is not valid TrendoraTools JSON.');
   }
 }

 clearAll(): void {
  this.snapshot = defaultSnapshot();
  this.repo.clear();
  this.emit();

    }
}
