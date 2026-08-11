import type { AppStore } from '../../state/store';
import { uiState } from '../uiState';
import { monthBudgetSummaries } from '../../domain/budget';
import { formatMinor } from '../../core/money';
import { monthLabel } from '../../core/date';
import { escapeHtml } from '../dom';
import { showToast } from '../toast';
import { emptyState, progressBar } from '../components';
import { parseAmountToMinor } from '../../core/money';

export function renderBudget(el: HTMLElement, store: AppStore, refresh: () => void): void {
 const state = store.state;
 const currency = state.preferences.currency;
 const month = uiState.budgetMonth;

 const budgets = state.budgets.filter((budget) => budget.month === month);
 const summaries = monthBudgetSummaries(state, month);
 const incomes = state.incomes.filter((income) => income.month === month);

 const totalIncome = incomes.reduce((sum, income) => sum + income.amountMinor, 0);
 const totalLimit = summaries.reduce((sum, summary) => sum + summary.limitMinor, 0);
 const totalActual = summaries.reduce((sum, summary) => sum + summary.actualMinor, 0);

 const totalRemaining = summaries.reduce((sum, summary) => sum +
summary.remainingMinor, 0);

 const editingCategory = uiState.editingCategoryId
  ? state.budgetCategories.find((category) => category.id === uiState.editingCategoryId)
  : undefined;

   const budgetOptions = budgets
    .map(
      (budget) =>
       `<option value="${budget.id}" ${editingCategory?.budgetId === budget.id ? 'selected' :
''}>${escapeHtml(budget.name)}</option>`
    )
    .join('');

 const incomeRows = incomes.length
  ? incomes
     .map(
       (income) => `
         <div class="list-row">
          <div>
           <div class="strong">${escapeHtml(income.name)}</div>
           <div class="muted small">${escapeHtml(monthLabel(income.month))}</div>
          </div>
          <div class="strong">${escapeHtml(formatMinor(income.amountMinor, currency))}</div>
          <button class="btn btn-danger btn-small" type="button" data-action="delete-income"
data-id="${income.id}">Delete</button>
         </div>
       `
     )
     .join('')
  : emptyState('No income recorded', 'Add income for this month to improve your dashboard overview.');

 const budgetCards = summaries.length
  ? summaries
     .map((summary) => {
      const categories = summary.categories.length
       ? summary.categories
          .map((item) => `
           <div class="list-row">
            <div>
             <div class="strong">${escapeHtml(item.category.name)}</div>
             <div class="muted small">

                ${escapeHtml(formatMinor(item.actualMinor, currency))} of
${escapeHtml(formatMinor(item.category.limitMinor, currency))}
               </div>
               ${progressBar(item.percentUsed)}
             </div>
             <div class="strong ${item.over ? 'danger' : ''}">
               ${item.over ? `${escapeHtml(formatMinor(Math.abs(item.remainingMinor),
currency))} over` : `${escapeHtml(formatMinor(item.remainingMinor, currency))} left`}
             </div>
             <div class="row">
               <button class="btn btn-small" type="button" data-action="edit-category"
data-id="${item.category.id}">Edit</button>
               <button class="btn btn-danger btn-small" type="button"
data-action="delete-category" data-id="${item.category.id}">Delete</button>
             </div>
            </div>
          `)
          .join('')
       : `<p class="muted">No categories yet. Add one below.</p>`;

      return `
       <article class="card">
         <div class="row between">
          <h3>${escapeHtml(summary.name)}</h3>
          <button class="btn btn-danger btn-small" type="button" data-action="delete-budget"
data-id="${summary.budgetId}">Delete budget</button>
         </div>

        <div class="row" style="margin: var(--space-3) 0;">
          <span class="badge">Planned ${escapeHtml(formatMinor(summary.limitMinor,
currency))}</span>
          <span class="badge">Actual ${escapeHtml(formatMinor(summary.actualMinor,
currency))}</span>
          <span class="badge">Remaining
${escapeHtml(formatMinor(summary.remainingMinor, currency))}</span>
        </div>

        ${progressBar(summary.percentUsed)}

         <div class="stack" style="margin-top: var(--space-4);">
          ${categories}
         </div>
        </article>
      `;

      })
      .join('')
  : emptyState(
      'No budgets for this month',
      'Create a budget, then add category limits such as Rent, Groceries, Transport, and Savings.',
      '<button class="btn btn-primary" type="button" id="focus-budget-name">Create budget</button>'
    );

 el.innerHTML = `
  <section class="page">
    <header class="page-header">
      <h1>Budget Planner</h1>
      <p>Create budgets, assign category limits, and compare planned limits with actual spending.</p>
    </header>

     <div class="stats-grid">
      <div class="stat">
       <div class="stat-label">Month</div>
       <div class="stat-value">${escapeHtml(monthLabel(month))}</div>
      </div>
      <div class="stat">
       <div class="stat-label">Income</div>
       <div class="stat-value">${escapeHtml(formatMinor(totalIncome, currency))}</div>
      </div>
      <div class="stat">
       <div class="stat-label">Planned budget</div>
       <div class="stat-value">${escapeHtml(formatMinor(totalLimit, currency))}</div>
      </div>
      <div class="stat">
       <div class="stat-label">Actual spend</div>
       <div class="stat-value">${escapeHtml(formatMinor(totalActual, currency))}</div>
      </div>
     </div>

     <div class="card">
      <label class="field">
       <span class="field-label">Budget month</span>
       <input id="budget-month" class="field-input" type="month" value="${escapeHtml(month)}"
/>
      </label>
     </div>

    <div class="grid two">
     <form id="income-form" class="card">
      <h2>Add income</h2>
      <label class="field">
        <span class="field-label">Income name</span>
        <input id="income-name" class="field-input" type="text" placeholder="Salary, business,
freelance" />
      </label>
      <label class="field">
        <span class="field-label">Amount</span>
        <input id="income-amount" class="field-input" type="text" inputmode="decimal"
placeholder="250000" />
      </label>
      <button class="btn btn-primary" type="submit">Add income</button>
     </form>

     <form id="budget-form" class="card">
      <h2>Create budget</h2>
      <label class="field">
        <span class="field-label">Budget name</span>
        <input id="budget-name" class="field-input" type="text" placeholder="Monthly household
budget" />
      </label>
      <button class="btn btn-primary" type="submit">Create budget for
${escapeHtml(monthLabel(month))}</button>
     </form>
   </div>

   <form id="category-form" class="card">
    <h2>${editingCategory ? 'Edit budget category' : 'Add budget category'}</h2>

     <div class="form-grid three">
      <label class="field">
       <span class="field-label">Budget</span>
       <select id="category-budget" class="field-input" ${editingCategory ? 'disabled' : ''}>
         ${budgetOptions || '<option value="">Create a budget first</option>'}
       </select>
      </label>

      <label class="field">
       <span class="field-label">Category name</span>
       <input id="category-name" class="field-input" type="text" placeholder="Groceries"
value="${escapeHtml(editingCategory?.name ?? '')}" />

         </label>

         <label class="field">
          <span class="field-label">Monthly limit</span>
          <input id="category-limit" class="field-input" type="text" inputmode="decimal"
placeholder="150000" value="${editingCategory ? (editingCategory.limitMinor / 100).toFixed(2) :
''}" />
         </label>
        </div>

     <div class="row">
       <button class="btn btn-primary" type="submit">${editingCategory ? 'Update category' : 'Add category'}</button>
       ${editingCategory ? '<button class="btn" type="button" id="cancel-category-edit">Cancel</button>' : ''}
     </div>
    </form>

      <div class="card">
       <h2>Income</h2>
       <div class="stack">${incomeRows}</div>
      </div>

       <div class="stack">
        ${budgetCards}
       </div>
      </section>
    `;

 el.querySelector<HTMLInputElement>('#budget-month')?.addEventListener('change', (event) => {
   const value = (event.target as HTMLInputElement).value;
   if (!value) return;
   uiState.budgetMonth = value;
   uiState.editingCategoryId = null;
   refresh();
 });

    el.querySelector<HTMLFormElement>('#income-form')?.addEventListener('submit', (event) =>
{
     event.preventDefault();

     const name = el.querySelector<HTMLInputElement>('#income-name')?.value ?? '';
     const amountRaw = el.querySelector<HTMLInputElement>('#income-amount')?.value ?? '';

      const amountMinor = parseAmountToMinor(amountRaw);

      const result = store.addIncome({ name, amountMinor: amountMinor ?? Number.NaN, month
});

      if (!result.ok) {
        showToast(result.message, 'error');
        return;
      }

      showToast('Income added.', 'success');
      refresh();
    });

    el.querySelector<HTMLFormElement>('#budget-form')?.addEventListener('submit', (event) =>
{
      event.preventDefault();

      const name = el.querySelector<HTMLInputElement>('#budget-name')?.value ?? '';
      const result = store.addBudget({ name, month });

      if (!result.ok) {
        showToast(result.message, 'error');
        return;
      }

      showToast('Budget created.', 'success');
      refresh();
    });

 el.querySelector<HTMLFormElement>('#category-form')?.addEventListener('submit', (event) => {
  event.preventDefault();

      const budgetId = el.querySelector<HTMLSelectElement>('#category-budget')?.value ?? '';
      const name = el.querySelector<HTMLInputElement>('#category-name')?.value ?? '';
      const limitRaw = el.querySelector<HTMLInputElement>('#category-limit')?.value ?? '';
      const limitMinor = parseAmountToMinor(limitRaw);

  const result = editingCategory
   ? store.updateBudgetCategory(editingCategory.id, { name, limitMinor: limitMinor ??
undefined })
   : store.addBudgetCategory({ budgetId, name, limitMinor: limitMinor ?? Number.NaN });

     if (!result.ok) {
       showToast(result.message, 'error');
       return;
     }

      uiState.editingCategoryId = null;
      showToast(editingCategory ? 'Category updated.' : 'Category added.', 'success');
      refresh();
    });

 el.querySelector<HTMLButtonElement>('#cancel-category-edit')?.addEventListener('click', () => {
   uiState.editingCategoryId = null;
   refresh();
 });

    el.querySelector<HTMLButtonElement>('#focus-budget-name')?.addEventListener('click', () =>
{
      el.querySelector<HTMLInputElement>('#budget-name')?.focus();
    });

    el.addEventListener('click', (event) => {
     const target = event.target as HTMLElement;
     const actionElement = target.closest<HTMLElement>('[data-action]');
     if (!actionElement) return;

     const action = actionElement.dataset.action;
     const id = actionElement.dataset.id;
     if (!action || !id) return;

     if (action === 'delete-income') {
       if (!window.confirm('Delete this income record?')) return;
       const result = store.deleteIncome(id);
       showToast(result.ok ? 'Income deleted.' : result.message, result.ok ? 'success' : 'error');
       refresh();
     }

     if (action === 'delete-budget') {
       if (!window.confirm('Delete this budget and its categories?')) return;
       const result = store.deleteBudget(id);
       showToast(result.ok ? 'Budget deleted.' : result.message, result.ok ? 'success' : 'error');
       refresh();
     }

      if (action === 'edit-category') {
        uiState.editingCategoryId = id;
        refresh();
      }

   if (action === 'delete-category') {
     if (!window.confirm('Delete this category?')) return;
     const result = store.deleteBudgetCategory(id);
     showToast(result.ok ? 'Category deleted.' : result.message, result.ok ? 'success' : 'error');
     refresh();
   }
 });
}
