import { parseAmountToMinor, type MinorUnits } from '../core/money';

export type IntentType =
 | 'create_budget'
 | 'add_expense'
 | 'create_savings_goal'
 | 'view_dashboard'
 | 'unknown';

export interface ToolIntent {
  type: IntentType;
  confidence: number;
  amountMinor?: MinorUnits;
  category?: string;
  raw: string;
  message: string;
}

export interface IntentProvider {
  interpret(text: string): Promise<ToolIntent>;
}

export class LocalIntentProvider implements IntentProvider {
  async interpret(text: string): Promise<ToolIntent> {
    return parseIntent(text);
  }
}

function extractAmount(text: string): MinorUnits | undefined {

    const match = text.match(/(?:₦|ngn|usd|\$)?\s*([\d][\d,]*(?:\.\d{1,2})?)/i);
    if (!match) return undefined;

    const parsed = parseAmountToMinor(match[1]);
    return parsed == null ? undefined : parsed;
}

function extractCategory(text: string): string | undefined {
 const match = text.toLowerCase().match(/(?:on|for|at)\s+([a-z0-9][a-z0-9\s&-]{1,40})/i);
 if (!match) return undefined;

    const cleaned = match[1]
     .replace(/\b(today|this month|monthly|yesterday|tomorrow)\b/gi, '')
     .replace(/[.!?]+$/g, '')
     .trim();

    return cleaned || undefined;
}

export function parseIntent(raw: string): ToolIntent {
 const text = raw.trim();
 const lower = text.toLowerCase();

    const amountMinor = extractAmount(text);
    const category = extractCategory(text);

    const hasBudget = /budget/i.test(lower);
    const hasExpense = /(spent|spend|expense|paid|buy|bought)/i.test(lower);
    const hasSaving = /(save|saving|savings|goal)/i.test(lower);
    const hasDashboard = /(dashboard|overview|summary)/i.test(lower);

    if (hasBudget) {
      return {
        type: 'create_budget',
        confidence: 0.9,
        amountMinor,
        category,
        raw: text,
        message: 'This looks like a budget task. Continue in Budget Planner.'
      };
    }

    if (hasExpense) {
      return {

       type: 'add_expense',
       confidence: 0.92,
       amountMinor,
       category,
       raw: text,
       message: amountMinor
         ? 'This looks like an expense. You can record it now or open Expense Tracker.'
         : 'This looks like an expense. Open Expense Tracker to add the details.'
     };
 }

 if (hasSaving) {
   return {
     type: 'create_savings_goal',
     confidence: 0.9,
     amountMinor,
     category,
     raw: text,
     message: amountMinor
       ? 'This looks like a savings goal. Continue in Savings Tracker.'
       : 'This looks like a savings task. Continue in Savings Tracker.'
   };
 }

 if (hasDashboard) {
   return {
     type: 'view_dashboard',
     confidence: 0.88,
     raw: text,
     message: 'Opening your dashboard.'
   };
 }

  return {
    type: 'unknown',
    confidence: 0.2,
    amountMinor,
    category,
    raw: text,
    message: 'I can help with budgets, expenses, savings, or your dashboard. Try one of the
quick actions below.'
  };
}

export function routeForIntent(intent: ToolIntent): string {
  switch (intent.type) {
    case 'create_budget':
     return '#/budget';
    case 'add_expense':
     return '#/expenses';
    case 'create_savings_goal':
     return '#/savings';
    case 'view_dashboard':
     return '#/dashboard';
    default:
     return '#/home';
  }
}
