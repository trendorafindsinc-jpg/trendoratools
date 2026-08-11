import type { AppSnapshot, Budget, BudgetCategory, Expense } from '../data/types';
import { monthKeyFromISO } from '../core/date';

export interface BudgetCategorySummary {
  category: BudgetCategory;
  actualMinor: number;
  remainingMinor: number;
  percentUsed: number;
  over: boolean;
}

export interface BudgetSummary {
  budgetId: string;
  name: string;
  month: string;
  limitMinor: number;
  actualMinor: number;
  remainingMinor: number;
  percentUsed: number;
  categories: BudgetCategorySummary[];
}

export function expensesInMonth(state: AppSnapshot, month: string): Expense[] {
  return state.expenses.filter((expense) => monthKeyFromISO(expense.date) === month);
}

export function categoryActualMinor(state: AppSnapshot, category: BudgetCategory, month:
string): number {
 const categoryName = category.name.trim().toLowerCase();

    return expensesInMonth(state, month)
     .filter((expense) => {
       const matchesId = Boolean(category.id && expense.categoryId === category.id);
       const matchesName = expense.category?.trim().toLowerCase() === categoryName;
       return matchesId || matchesName;
     })
     .reduce((sum, expense) => sum + expense.amountMinor, 0);
}

export function budgetSummary(state: AppSnapshot, budget: Budget): BudgetSummary {
 const categories = state.budgetCategories.filter((category) => category.budgetId ===
budget.id);

 const categorySummaries: BudgetCategorySummary[] = categories.map((category) => {
  const actualMinor = categoryActualMinor(state, category, budget.month);
  const limitMinor = category.limitMinor;

   return {
     category,
     actualMinor,
     remainingMinor: limitMinor - actualMinor,
     percentUsed: limitMinor > 0 ? Math.round((actualMinor / limitMinor) * 100) : actualMinor > 0
? 100 : 0,
     over: actualMinor > limitMinor
   };
 });

 const limitMinor = categorySummaries.reduce((sum, item) => sum + item.category.limitMinor,
0);
 const actualMinor = categorySummaries.reduce((sum, item) => sum + item.actualMinor, 0);

  return {
    budgetId: budget.id,
    name: budget.name,
    month: budget.month,
    limitMinor,
    actualMinor,
    remainingMinor: limitMinor - actualMinor,
    percentUsed: limitMinor > 0 ? Math.round((actualMinor / limitMinor) * 100) : actualMinor > 0 ?
100 : 0,
    categories: categorySummaries
  };
}

export function monthBudgetSummaries(state: AppSnapshot, month: string): BudgetSummary[]
{
  return state.budgets
   .filter((budget) => budget.month === month)
   .map((budget) => budgetSummary(state, budget));
}

export function totalBudgetRemainingMinor(state: AppSnapshot, month: string): number {

  return monthBudgetSummaries(state, month).reduce((sum, summary) => sum +
summary.remainingMinor, 0);
}
