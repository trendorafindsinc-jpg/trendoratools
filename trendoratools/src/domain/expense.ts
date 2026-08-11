import type { AppSnapshot, Expense } from '../data/types';
import { monthKeyFromISO } from '../core/date';

export type ExpenseSort = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export interface ExpenseFilters {
  search?: string;
  category?: string;
  sort?: ExpenseSort;
}

export function filterExpenses(state: AppSnapshot, filters: ExpenseFilters): Expense[] {
 let list = [...state.expenses];

 const search = filters.search?.trim().toLowerCase();
 if (search) {
   list = list.filter((expense) =>
     [expense.description, expense.category]
       .filter(Boolean)
       .some((value) => String(value).toLowerCase().includes(search))
   );
 }

 const category = filters.category?.trim().toLowerCase();
 if (category && category !== 'all') {
   list = list.filter((expense) => (expense.category ?? 'Uncategorized').toLowerCase() ===
category);
 }

 switch (filters.sort) {
  case 'date-asc':
   list.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
   break;
  case 'amount-desc':
   list.sort((a, b) => b.amountMinor - a.amountMinor);
   break;
  case 'amount-asc':

         list.sort((a, b) => a.amountMinor - b.amountMinor);
         break;
        case 'date-desc':
        default:
         list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
         break;
    }

    return list;
}

export function totalExpensesForMonthMinor(state: AppSnapshot, month: string): number {
  return state.expenses
   .filter((expense) => monthKeyFromISO(expense.date) === month)
   .reduce((sum, expense) => sum + expense.amountMinor, 0);
}

export function uniqueExpenseCategories(state: AppSnapshot): string[] {
 const categories = new Set<string>();

    for (const expense of state.expenses) {
      if (expense.category?.trim()) categories.add(expense.category.trim());
    }

    for (const category of state.budgetCategories) {
      if (category.name?.trim()) categories.add(category.name.trim());
    }

    return [...categories].sort((a, b) => a.localeCompare(b));
}
