import type { AppStore } from '../../state/store';
import { getDashboardData } from '../../domain/dashboard';
import { formatMinor } from '../../core/money';
import { formatDate, monthLabel } from '../../core/date';
import { escapeHtml } from '../dom';
import { emptyState, progressBar } from '../components';

export function renderDashboard(el: HTMLElement, store: AppStore): void {
 const state = store.state;
 const currency = state.preferences.currency;
 const data = getDashboardData(state);

 const hasAnyData =
  state.budgets.length > 0 ||
  state.expenses.length > 0 ||
  state.savingsGoals.length > 0 ||
  state.incomes.length > 0;

 const recentExpenses = data.recentExpenses.length
   ?`
    <div class="list">
     ${data.recentExpenses
      .map(
        (expense) => `
          <div class="list-row">
           <div>
            <div class="strong">${escapeHtml(expense.category || 'Uncategorized')}</div>
            <div class="muted small">${escapeHtml(expense.description || 'No description')} ·
${formatDate(expense.date)}</div>
           </div>
           <div class="strong">${escapeHtml(formatMinor(expense.amountMinor,
currency))}</div>
           <a class="btn btn-small" href="#/expenses">Manage</a>
          </div>
        `
      )
      .join('')}

   </div>
  `
  : emptyState('No recent expenses', 'Record an expense to see it here.', '<a class="btn"
href="#/expenses">Add expense</a>');

 const categories = data.categoryBreakdown.length
   ?`
     <div class="bar-chart">
      ${data.categoryBreakdown
       .map(
         (item) => `
           <div class="bar-item">
             <div class="row between">
              <span>${escapeHtml(item.name)}</span>
              <span class="muted">${escapeHtml(formatMinor(item.amountMinor, currency))} ·
${item.percent}%</span>
             </div>
             <div class="bar-track">
              <div class="bar-fill" style="width:${Math.min(100, item.percent)}%"></div>
             </div>
           </div>
         `
       )
       .join('')}
     </div>
   `
   : emptyState('No spending breakdown yet', 'Add expenses with categories to see spending
patterns.');

 const alerts = data.alerts.length
  ?`
    <div class="stack">
      ${data.alerts.map((alert) => `<div class="card" style="padding:
var(--space-3);">${escapeHtml(alert)}</div>`).join('')}
    </div>
  `
  : `<p class="muted">No alerts right now.</p>`;

 el.innerHTML = `
  <section class="page">
    <header class="page-header">
      <h1>Dashboard</h1>
      <p>Overview for ${escapeHtml(monthLabel(data.month))}.</p>
    </header>

   ${
     !hasAnyData
      ? emptyState(
           'Set up your workspace',
           'Start by creating a budget, recording an expense, or adding a savings goal.',
           `<a class="btn btn-primary" href="#/budget">Create budget</a>
            <a class="btn" href="#/expenses">Add expense</a>
            <a class="btn" href="#/savings">Create savings goal</a>`
        )
      : ''
   }

   <div class="stats-grid">
    <div class="stat">
     <div class="stat-label">Income this month</div>
     <div class="stat-value">${escapeHtml(formatMinor(data.incomeMinor, currency))}</div>
     <div class="stat-meta">Recorded monthly income</div>
    </div>

    <div class="stat">
     <div class="stat-label">Expenses this month</div>
     <div class="stat-value">${escapeHtml(formatMinor(data.expenseMinor, currency))}</div>
     <div class="stat-meta">All recorded expenses</div>
    </div>

      <div class="stat">
       <div class="stat-label">Budget remaining</div>
       <div class="stat-value ${data.budgetRemainingMinor < 0 ? 'danger' :
''}">${escapeHtml(formatMinor(data.budgetRemainingMinor, currency))}</div>
       <div class="stat-meta">Across budgets for this month</div>
      </div>

     <div class="stat">
      <div class="stat-label">Savings progress</div>
      <div class="stat-value">${escapeHtml(formatMinor(data.savingsCurrentMinor,
currency))}</div>
      <div class="stat-meta">${data.activeSavingsGoals} active goal${data.activeSavingsGoals
=== 1 ? '' : 's'}</div>
     </div>
    </div>

   <div class="grid two">
    <div class="card">

        <h2>Spending by category</h2>
        ${categories}
       </div>

       <div class="card">
        <h2>Recent expenses</h2>
        ${recentExpenses}
       </div>
      </div>

    <div class="card">
     <h2>Alerts</h2>
     ${alerts}
    </div>
   </section>
 `;
}
