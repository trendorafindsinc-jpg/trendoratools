import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Expense,
  Income,
  Budget,
  SavingsGoal,
  Bill,
  Debt,
  ChatMessage,
  Category
} from './types';
import { generateId, todayISO, defaultTargetDate, toMinorUnits } from './lib/utils';

interface AppState {
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  bills: Bill[];
  debts: Debt[];
  customCategories: string[];
  chat: ChatMessage[];

  addExpense: (data: { amount: number | string; category: Category | string; date?: string; note?: string }) => void;
  updateExpense: (id: string, data: Partial<Omit<Expense, 'id'>>) => void;
  deleteExpense: (id: string) => void;

  addIncome: (data: { amount: number | string; source: string; date?: string; recurring?: boolean; note?: string }) => void;
  updateIncome: (id: string, data: Partial<Omit<Income, 'id'>>) => void;
  deleteIncome: (id: string) => void;

  addBudget: (data: { category: Category | string; limit: number | string }) => void;
  updateBudget: (id: string, data: Partial<Omit<Budget, 'id'>>) => void;
  deleteBudget: (id: string) => void;

  addSavingsGoal: (data: { name: string; targetAmount: number | string; targetDate?: string; description?: string }) => void;
  updateSavingsGoal: (id: string, data: Partial<Omit<SavingsGoal, 'id'>>) => void;
  deleteSavingsGoal: (id: string) => void;
  fundGoal: (id: string, amount: number | string, direction: 'add' | 'remove') => void;

  addBill: (data: { name: string; amount: number | string; dueDate: string; recurring?: boolean; category?: string; note?: string }) => void;
  updateBill: (id: string, data: Partial<Omit<Bill, 'id'>>) => void;
  deleteBill: (id: string) => void;
  markBillPaid: (id: string) => void;
  markBillUnpaid: (id: string) => void;

  addDebt: (data: {
    name: string;
    totalAmount: number | string;
    remainingAmount?: number | string;
    interestRate?: number;
    minimumPayment?: number | string;
    note?: string;
  }) => void;
  updateDebt: (id: string, data: Partial<Omit<Debt, 'id'>>) => void;
  deleteDebt: (id: string) => void;
  recordDebtPayment: (id: string, amount: number | string) => void;

  addCustomCategory: (cat: string) => void;
  removeCustomCategory: (cat: string) => void;

  addChatMessage: (role: 'user' | 'assistant', text: string) => void;
  clearChat: () => void;

  exportData: () => string;
  importData: (json: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      expenses: [],
      incomes: [],
      budgets: [],
      savingsGoals: [],
      bills: [],
      debts: [],
      customCategories: [],
      chat: [],

      addExpense: (data) => {
        const expense: Expense = {
          id: generateId('exp'),
          amount: toMinorUnits(data.amount),
          category: data.category,
          date: data.date || todayISO(),
          note: data.note?.trim() || undefined
        };
        set((s) => ({ expenses: [expense, ...s.expenses] }));
      },
      updateExpense: (id, data) =>
        set((s) => ({
          expenses: s.expenses.map((e) =>
            e.id === id
              ? { ...e, ...data, amount: data.amount !== undefined ? toMinorUnits(data.amount) : e.amount }
              : e
          )
        })),
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      addIncome: (data) => {
        const row: Income = {
          id: generateId('inc'),
          amount: toMinorUnits(data.amount),
          source: data.source.trim(),
          date: data.date || todayISO(),
          recurring: Boolean(data.recurring),
          note: data.note?.trim() || undefined
        };
        set((s) => ({ incomes: [row, ...s.incomes] }));
      },
      updateIncome: (id, data) =>
        set((s) => ({
          incomes: s.incomes.map((i) =>
            i.id === id
              ? { ...i, ...data, amount: data.amount !== undefined ? toMinorUnits(data.amount) : i.amount }
              : i
          )
        })),
      deleteIncome: (id) => set((s) => ({ incomes: s.incomes.filter((i) => i.id !== id) })),

      addBudget: (data) => {
        const budget: Budget = {
          id: generateId('bud'),
          category: data.category,
          limit: toMinorUnits(data.limit)
        };
        set((s) => ({
          budgets: [...s.budgets.filter((b) => b.category !== data.category), budget]
        }));
      },
      updateBudget: (id, data) =>
        set((s) => ({
          budgets: s.budgets.map((b) =>
            b.id === id
              ? { ...b, ...data, limit: data.limit !== undefined ? toMinorUnits(data.limit) : b.limit }
              : b
          )
        })),
      deleteBudget: (id) => set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })),

      addSavingsGoal: (data) => {
        const goal: SavingsGoal = {
          id: generateId('goal'),
          name: data.name.trim(),
          targetAmount: toMinorUnits(data.targetAmount),
          currentAmount: 0,
          targetDate: data.targetDate || defaultTargetDate(),
          description: data.description?.trim() || undefined
        };
        set((s) => ({ savingsGoals: [goal, ...s.savingsGoals] }));
      },
      updateSavingsGoal: (id, data) =>
        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) =>
            g.id === id
              ? {
                  ...g,
                  ...data,
                  targetAmount:
                    data.targetAmount !== undefined ? toMinorUnits(data.targetAmount) : g.targetAmount,
                  currentAmount:
                    data.currentAmount !== undefined ? toMinorUnits(data.currentAmount) : g.currentAmount
                }
              : g
          )
        })),
      deleteSavingsGoal: (id) => set((s) => ({ savingsGoals: s.savingsGoals.filter((g) => g.id !== id) })),
      fundGoal: (id, amount, direction) => {
        const delta = toMinorUnits(amount);
        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) => {
            if (g.id !== id) return g;
            const next =
              direction === 'add' ? g.currentAmount + delta : Math.max(0, g.currentAmount - delta);
            return { ...g, currentAmount: next };
          })
        }));
      },

      addBill: (data) => {
        const bill: Bill = {
          id: generateId('bill'),
          name: data.name.trim(),
          amount: toMinorUnits(data.amount),
          dueDate: data.dueDate,
          paid: false,
          recurring: Boolean(data.recurring),
          category: data.category,
          note: data.note?.trim() || undefined
        };
        set((s) => ({ bills: [bill, ...s.bills] }));
      },
      updateBill: (id, data) =>
        set((s) => ({
          bills: s.bills.map((b) =>
            b.id === id
              ? { ...b, ...data, amount: data.amount !== undefined ? toMinorUnits(data.amount) : b.amount }
              : b
          )
        })),
      deleteBill: (id) => set((s) => ({ bills: s.bills.filter((b) => b.id !== id) })),
      markBillPaid: (id) =>
        set((s) => ({ bills: s.bills.map((b) => (b.id === id ? { ...b, paid: true } : b)) })),
      markBillUnpaid: (id) =>
        set((s) => ({ bills: s.bills.map((b) => (b.id === id ? { ...b, paid: false } : b)) })),

      addDebt: (data) => {
        const total = toMinorUnits(data.totalAmount);
        const remaining =
          data.remainingAmount !== undefined ? toMinorUnits(data.remainingAmount) : total;
        const debt: Debt = {
          id: generateId('debt'),
          name: data.name.trim(),
          totalAmount: total,
          remainingAmount: remaining,
          interestRate: Number(data.interestRate) || 0,
          minimumPayment: toMinorUnits(data.minimumPayment || 0),
          note: data.note?.trim() || undefined
        };
        set((s) => ({ debts: [debt, ...s.debts] }));
      },
      updateDebt: (id, data) =>
        set((s) => ({
          debts: s.debts.map((d) =>
            d.id === id
              ? {
                  ...d,
                  ...data,
                  totalAmount:
                    data.totalAmount !== undefined ? toMinorUnits(data.totalAmount) : d.totalAmount,
                  remainingAmount:
                    data.remainingAmount !== undefined
                      ? toMinorUnits(data.remainingAmount)
                      : d.remainingAmount,
                  minimumPayment:
                    data.minimumPayment !== undefined
                      ? toMinorUnits(data.minimumPayment)
                      : d.minimumPayment
                }
              : d
          )
        })),
      deleteDebt: (id) => set((s) => ({ debts: s.debts.filter((d) => d.id !== id) })),
      recordDebtPayment: (id, amount) => {
        const pay = toMinorUnits(amount);
        set((s) => ({
          debts: s.debts.map((d) =>
            d.id === id
              ? { ...d, remainingAmount: Math.max(0, d.remainingAmount - pay) }
              : d
          )
        }));
      },

      addCustomCategory: (cat) => {
        const c = cat.trim();
        if (!c) return;
        set((s) =>
          s.customCategories.includes(c) ? s : { customCategories: [...s.customCategories, c] }
        );
      },
      removeCustomCategory: (cat) =>
        set((s) => ({ customCategories: s.customCategories.filter((c) => c !== cat) })),

      addChatMessage: (role, text) => {
        const msg: ChatMessage = {
          id: generateId('chat'),
          role,
          text,
          createdAt: new Date().toISOString()
        };
        set((s) => ({ chat: [...s.chat, msg] }));
      },
      clearChat: () => set({ chat: [] }),

      exportData: () => {
        const { expenses, incomes, budgets, savingsGoals, bills, debts, customCategories } = get();
        return JSON.stringify(
          {
            version: '1.0.0',
            expenses,
            incomes,
            budgets,
            savingsGoals,
            bills,
            debts,
            customCategories
          },
          null,
          2
        );
      },
      importData: (json) => {
        const data = JSON.parse(json);
        if (!data || typeof data !== 'object') throw new Error('Invalid JSON');
        if (!Array.isArray(data.expenses) && !Array.isArray(data.budgets)) {
          throw new Error('Invalid backup file structure.');
        }
        set({
          expenses: Array.isArray(data.expenses) ? data.expenses : [],
          incomes: Array.isArray(data.incomes) ? data.incomes : [],
          budgets: Array.isArray(data.budgets) ? data.budgets : [],
          savingsGoals: Array.isArray(data.savingsGoals) ? data.savingsGoals : [],
          bills: Array.isArray(data.bills) ? data.bills : [],
          debts: Array.isArray(data.debts) ? data.debts : [],
          customCategories: Array.isArray(data.customCategories) ? data.customCategories : []
        });
      }
    }),
    {
      name: 'trendoratools-v10',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted: unknown) => {
        const p = (persisted || {}) as Record<string, unknown>;
        return {
          ...p,
          incomes: Array.isArray(p.incomes) ? p.incomes : [],
          bills: Array.isArray(p.bills) ? p.bills : [],
          debts: Array.isArray(p.debts) ? p.debts : [],
          customCategories: Array.isArray(p.customCategories) ? p.customCategories : []
        };
      },
      partialize: (s) => ({
        expenses: s.expenses,
        incomes: s.incomes,
        budgets: s.budgets,
        savingsGoals: s.savingsGoals,
        bills: s.bills,
        debts: s.debts,
        customCategories: s.customCategories
      })
    }
  )
);
