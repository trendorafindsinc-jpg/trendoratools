export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  route: string;
  keywords: string[];
}

export const toolRegistry: ToolDefinition[] = [
 {
   id: 'budget-planner',
   name: 'Budget Planner',
   description: 'Plan income, set category limits, and monitor monthly budget performance.',
   route: '#/budget',
   keywords: ['budget', 'plan', 'limit', 'income']
 },
 {
   id: 'expense-tracker',
   name: 'Expense Tracker',
   description: 'Record, categorize, filter, and review spending.',
   route: '#/expenses',
   keywords: ['expense', 'spend', 'payment', 'purchase']
 },
 {
   id: 'savings-tracker',
   name: 'Savings Tracker',

    description: 'Create savings goals and track contributions toward them.',
    route: '#/savings',
    keywords: ['savings', 'goal', 'save', 'contribution']
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'See income, spending, budget health, and savings progress in one place.',
    route: '#/dashboard',
    keywords: ['dashboard', 'overview', 'summary']
  }
];
