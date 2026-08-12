import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Expense, Budget, SavingsGoal, ChatMessage, Category } from './types';
import { generateId, todayISO, defaultTargetDate, toMinorUnits } from './lib/utils';

interface AppState {
  expenses: Expense[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  chat: ChatMessage[];

  addExpense: (data: { amount: number | string; category: Category; date?: string; note?: string }) => void;
  updateExpense: (id: string, data: Partial<Omit<Expense, 'id'>>) => void;
  deleteExpense: (id: string) => void;

  addBudget: (data: { category: Category; limit: number | string }) => void;
  updateBudget: (id: string, data: Partial<Omit<Budget, 'id'>>) => void;
  deleteBudget: (id: string) => void;

  addSavingsGoal: (data: { name: string; targetAmount: number | string; targetDate?: string; description?: string }) => void;
  updateSavingsGoal: (id: string, data: Partial<Omit<SavingsGoal, 'id'>>) => void;
  deleteSavingsGoal: (id: string) => void;
  fundGoal: (id: string, amount: number | string, direction: 'add' | 'remove') => void;

  addChatMessage: (role: 'user' | 'assistant', text: string) => void;
  clearChat: () => void;

  exportData: () => string;
  importData: (json: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      expenses: [],
      budgets: [],
      savingsGoals: [],
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

      updateExpense: (id, data) => {
        set((s) => ({
          expenses: s.expenses.map((e) =>
            e.id === id
              ? {
                  ...e,
                  ...data,
                  amount: data.amount !== undefined ? toMinorUnits(data.amount) : e.amount
                }
              : e
          )
        }));
      },

      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      addBudget: (data) => {
        const budget: Budget = {
          id: generateId('bud'),
          category: data.category,
          limit: toMinorUnits(data.limit)
        };
        set((s) => ({ budgets: [...s.budgets.filter((b) => b.category !== data.category), budget] }));
      },

      updateBudget: (id, data) => {
        set((s) => ({
          budgets: s.budgets.map((b) =>
            b.id === id
              ? {
                  ...b,
                  ...data,
                  limit: data.limit !== undefined ? toMinorUnits(data.limit) : b.limit
                }
              : b
          )
        }));
      },

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

      updateSavingsGoal: (id, data) => {
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
        }));
      },

      deleteSavingsGoal: (id) =>
        set((s) => ({ savingsGoals: s.savingsGoals.filter((g) => g.id !== id) })),

      fundGoal: (id, amount, direction) => {
        const delta = toMinorUnits(amount);
        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) => {
            if (g.id !== id) return g;
            const next =
              direction === 'add'
                ? g.currentAmount + delta
                : Math.max(0, g.currentAmount - delta);
            return { ...g, currentAmount: next };
          })
        }));
      },

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
        const { expenses, budgets, savingsGoals } = get();
        return JSON.stringify({ expenses, budgets, savingsGoals, version: '0.2.0' }, null, 2);
      },

      importData: (json) => {
        const parsed = JSON.parse(json);
        if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON');
        set({
          expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
          budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
          savingsGoals: Array.isArray(parsed.savingsGoals) ? parsed.savingsGoals : []
        });
      }
    }),
    {
      name: 'trendoratools-v02',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        expenses: s.expenses,
        budgets: s.budgets,
        savingsGoals: s.savingsGoals
      })
    }
  )
);
