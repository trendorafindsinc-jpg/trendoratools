import type { AppSnapshot, Preferences } from './types';
import type { StorageAdapter } from './storage';

export const STORAGE_KEY = 'trendoratools:v1';

export function defaultPreferences(): Preferences {

    return {
      currency: 'NGN',
      theme: 'system',
      notifications: true,
      onboarded: false
    };
}

export function defaultSnapshot(): AppSnapshot {
  return {
    version: 1,
    preferences: defaultPreferences(),
    incomes: [],
    budgets: [],
    budgetCategories: [],
    expenses: [],
    savingsGoals: [],
    savingsContributions: []
  };
}

export function normalizeSnapshot(input: unknown): AppSnapshot {
 const base = defaultSnapshot();

    if (!input || typeof input !== 'object') return base;

    const candidate = input as Partial<AppSnapshot>;

  return {
   version: 1,
   preferences: {
     ...base.preferences,
     ...(candidate.preferences && typeof candidate.preferences === 'object' ?
candidate.preferences : {})
   },
   incomes: Array.isArray(candidate.incomes) ? candidate.incomes : base.incomes,
   budgets: Array.isArray(candidate.budgets) ? candidate.budgets : base.budgets,
   budgetCategories: Array.isArray(candidate.budgetCategories) ? candidate.budgetCategories
: base.budgetCategories,
   expenses: Array.isArray(candidate.expenses) ? candidate.expenses : base.expenses,
   savingsGoals: Array.isArray(candidate.savingsGoals) ? candidate.savingsGoals :
base.savingsGoals,
   savingsContributions: Array.isArray(candidate.savingsContributions) ?
candidate.savingsContributions : base.savingsContributions

    };
}

export class DataRepository {
 constructor(
   private storage: StorageAdapter,
   private key = STORAGE_KEY
 ) {}

    load(): AppSnapshot {
      const raw = this.storage.load(this.key);
      if (!raw) return defaultSnapshot();

        try {
          return normalizeSnapshot(JSON.parse(raw));
        } catch {
          return defaultSnapshot();
        }
    }

    save(snapshot: AppSnapshot): void {
      this.storage.save(this.key, JSON.stringify(snapshot));
    }

    clear(): void {
      this.storage.remove(this.key);
    }
}
