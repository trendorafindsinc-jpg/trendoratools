import { currentMonthKey } from '../core/date';
import type { ToolIntent } from '../intent/intent';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  intent?: ToolIntent;
}

export const uiState = {
 chat: [] as ChatMessage[],
 budgetMonth: currentMonthKey(),
 editingCategoryId: null as string | null,

 expenseSearch: '',
 expenseCategory: 'all',
 expenseSort: 'date-desc',
 editingExpenseId: null as string | null,
 prefillExpenseAmount: undefined as number | undefined,

 prefillExpenseCategory: undefined as string | undefined,

  selectedGoalId: '',
  editingContributionId: null as string | null,
  prefillSavingsTarget: undefined as number | undefined
};
