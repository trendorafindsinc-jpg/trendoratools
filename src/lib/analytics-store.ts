import { useAppStore } from '../store';
import { analytics } from './analytics';

type Store = ReturnType<typeof useAppStore.getState>;
type ActionKey = {
  [K in keyof Store]: Store[K] extends (...args: never[]) => unknown ? K : never
}[keyof Store];

let installed = false;

function wrap<K extends ActionKey>(key: K, toolName: string, action: string) {
  const original = useAppStore.getState()[key] as unknown as (...args: never[]) => unknown;
  useAppStore.setState({
    [key]: (...args: never[]) => {
      const result = original(...args);
      void analytics.event('tool_used', { tool_name: toolName, action });
      return result;
    },
  } as Partial<Store>);
}

export function installAnalyticsStoreTracking() {
  if (installed) return;
  installed = true;

  wrap('addExpense', 'expenses', 'add');
  wrap('updateExpense', 'expenses', 'edit');
  wrap('deleteExpense', 'expenses', 'delete');

  wrap('addIncome', 'income', 'add');
  wrap('updateIncome', 'income', 'edit');
  wrap('deleteIncome', 'income', 'delete');

  wrap('addBudget', 'budget', 'add');
  wrap('updateBudget', 'budget', 'edit');
  wrap('deleteBudget', 'budget', 'delete');

  wrap('addBill', 'bills', 'add');
  wrap('updateBill', 'bills', 'edit');
  wrap('deleteBill', 'bills', 'delete');
  wrap('markBillPaid', 'bills', 'edit');
  wrap('markBillUnpaid', 'bills', 'edit');

  wrap('addSavingsGoal', 'savings', 'add');
  wrap('updateSavingsGoal', 'savings', 'edit');
  wrap('deleteSavingsGoal', 'savings', 'delete');
  wrap('fundGoal', 'savings', 'edit');

  wrap('addDebt', 'debts', 'add');
  wrap('updateDebt', 'debts', 'edit');
  wrap('deleteDebt', 'debts', 'delete');
  wrap('recordDebtPayment', 'debts', 'edit');
}
