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
  | 'Income'
  | 'Debt'
  | 'Other';

export const BASE_CATEGORIES: Category[] = [
  'Food',
  'Transport',
  'Housing',
  'Utilities',
  'Shopping',
  'Entertainment',
  'Health',
  'Education',
  'Bills',
  'Income',
  'Debt',
  'Other'
];

/** @deprecated use BASE_CATEGORIES */
export const CATEGORIES = BASE_CATEGORIES;

export interface Expense {
  id: string;
  amount: number;
  category: Category | string;
  date: string;
  note?: string;
}

export interface Income {
  id: string;
  amount: number;
  source: string;
  date: string;
  recurring?: boolean;
  note?: string;
}

export interface Budget {
  id: string;
  category: Category | string;
  limit: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  description?: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  recurring: boolean;
  category?: Category | string;
  note?: string;
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  minimumPayment: number;
  note?: string;
}

export interface FinancialData {
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  bills: Bill[];
  debts: Debt[];
  customCategories: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
}
