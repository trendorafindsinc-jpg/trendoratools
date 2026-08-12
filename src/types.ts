export type Category =
  | 'Food'
  | 'Transport'
  | 'Housing'
  | 'Utilities'
  | 'Shopping'
  | 'Entertainment'
  | 'Health'
  | 'Education'
  | 'Bills'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Food',
  'Transport',
  'Housing',
  'Utilities',
  'Shopping',
  'Entertainment',
  'Health',
  'Education',
  'Bills',
  'Other'
];

export interface Expense {
  id: string;
  amount: number; // minor units (kobo/cents)
  category: Category;
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface Budget {
  id: string;
  category: Category;
  limit: number; // minor units
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number; // minor units
  currentAmount: number; // minor units
  targetDate: string; // YYYY-MM-DD
  description?: string;
}

export interface FinancialData {
  expenses: Expense[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
}
