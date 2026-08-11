import type { AppStore } from '../../state/store';
import type { Expense, Recurrence } from '../../data/types';
import { uiState } from '../uiState';
import { filterExpenses, uniqueExpenseCategories, type ExpenseSort } from
'../../domain/expense';
import { formatMinor } from '../../core/money';
import { formatDate, todayISO } from '../../core/date';
import { escapeHtml } from '../dom';
import { showToast } from '../toast';
import { emptyState } from '../components';
import { parseAmountToMinor } from '../../core/money';

function expenseRow(expense: Expense, currency: string): string {
 return `
   <div class="list-row">
    <div>
     <div class="strong">${escapeHtml(expense.category || 'Uncategorized')}</div>
     <div class="muted small">${escapeHtml(expense.description || 'No description')} ·
${formatDate(expense.date)} · ${expense.recurring}</div>
    </div>
    <div class="strong">${escapeHtml(formatMinor(expense.amountMinor, currency))}</div>
    <div class="row">
     <button class="btn btn-small" type="button" data-action="edit-expense"
data-id="${expense.id}">Edit</button>
     <button class="btn btn-danger btn-small" type="button" data-action="delete-expense"
data-id="${expense.id}">Delete</button>
    </div>

      </div>
    `;
}

export function renderExpenses(el: HTMLElement, store: AppStore, refresh: () => void): void {
 const state = store.state;
 const currency = state.preferences.currency;
 const editingExpense = uiState.editingExpenseId
  ? state.expenses.find((expense) => expense.id === uiState.editingExpenseId)
  : undefined;

    const categories = uniqueExpenseCategories(state);

  const categoryOptions = ['all', ...categories]
   .map(
     (category) =>
      `<option value="${escapeHtml(category)}" ${uiState.expenseCategory === category ?
'selected' : ''}>${
        category === 'all' ? 'All categories' : escapeHtml(category)
      }</option>`
   )
   .join('');

 const datalistOptions = categories.map((category) => `<option
value="${escapeHtml(category)}"></option>`).join('');

    el.innerHTML = `
     <section class="page">
       <header class="page-header">
         <h1>Expense Tracker</h1>
         <p>Record spending, categorize entries, and review history with search and filters.</p>
       </header>

      <form id="expense-form" class="card">
       <h2>${editingExpense ? 'Edit expense' : 'Add expense'}</h2>

     <div class="form-grid three">
      <label class="field">
       <span class="field-label">Amount</span>
       <input id="expense-amount" class="field-input" type="text" inputmode="decimal"
placeholder="25000" />
      </label>

         <label class="field">

        <span class="field-label">Category</span>
        <input id="expense-category" class="field-input" type="text"
list="expense-category-options" placeholder="Groceries" />
        <datalist id="expense-category-options">${datalistOptions}</datalist>
       </label>

       <label class="field">
        <span class="field-label">Date</span>
        <input id="expense-date" class="field-input" type="date" value="${todayISO()}" />
       </label>
      </div>

      <div class="form-grid three">
       <label class="field">
        <span class="field-label">Description</span>
        <input id="expense-description" class="field-input" type="text" placeholder="Market run"
/>
       </label>

       <label class="field">
        <span class="field-label">Recurring</span>
        <select id="expense-recurring" class="field-input">
          <option value="none">Not recurring</option>
          <option value="monthly">Monthly</option>
        </select>
       </label>

       <div class="field">
        <span class="field-label">&nbsp;</span>
        <div class="row">
         <button class="btn btn-primary" type="submit">${editingExpense ? 'Update expense' : 'Add expense'}</button>
         ${editingExpense ? '<button class="btn" type="button" id="cancel-expense-edit">Cancel</button>' : ''}
        </div>
       </div>
     </div>
    </form>

     <div class="card">
      <div class="filters form-grid three">
       <label class="field">
         <span class="field-label">Search</span>

       <input id="expense-search" class="field-input" type="search"
value="${escapeHtml(uiState.expenseSearch)}" placeholder="Search description or category"
/>
      </label>

      <label class="field">
       <span class="field-label">Category</span>
       <select id="expense-filter-category" class="field-input">${categoryOptions}</select>
      </label>

        <label class="field">
         <span class="field-label">Sort</span>
         <select id="expense-sort" class="field-input">
           <option value="date-desc" ${uiState.expenseSort === 'date-desc' ? 'selected' :
''}>Newest first</option>
           <option value="date-asc" ${uiState.expenseSort === 'date-asc' ? 'selected' : ''}>Oldest
first</option>
           <option value="amount-desc" ${uiState.expenseSort === 'amount-desc' ? 'selected' :
''}>Highest amount</option>
           <option value="amount-asc" ${uiState.expenseSort === 'amount-asc' ? 'selected' :
''}>Lowest amount</option>
         </select>
        </label>
      </div>

     <div id="expense-list" class="stack" style="margin-top: var(--space-4);"></div>
    </div>
   </section>
 `;

 const amountInput = el.querySelector<HTMLInputElement>('#expense-amount');
 const categoryInput = el.querySelector<HTMLInputElement>('#expense-category');
 const dateInput = el.querySelector<HTMLInputElement>('#expense-date');
 const descriptionInput = el.querySelector<HTMLInputElement>('#expense-description');
 const recurringInput = el.querySelector<HTMLSelectElement>('#expense-recurring');
 const listContainer = el.querySelector<HTMLElement>('#expense-list');

 if (editingExpense) {
   if (amountInput) amountInput.value = (editingExpense.amountMinor / 100).toFixed(2);
   if (categoryInput) categoryInput.value = editingExpense.category ?? '';
   if (dateInput) dateInput.value = editingExpense.date;
   if (descriptionInput) descriptionInput.value = editingExpense.description ?? '';
   if (recurringInput) recurringInput.value = editingExpense.recurring;
 } else {

     if (uiState.prefillExpenseAmount != null && amountInput) {
       amountInput.value = (uiState.prefillExpenseAmount / 100).toFixed(2);
       uiState.prefillExpenseAmount = undefined;
     }

     if (uiState.prefillExpenseCategory && categoryInput) {
       categoryInput.value = uiState.prefillExpenseCategory;
       uiState.prefillExpenseCategory = undefined;
     }
 }

 function updateList(): void {
  if (!listContainer) return;

     const list = filterExpenses(store.state, {
       search: uiState.expenseSearch,
       category: uiState.expenseCategory,
       sort: uiState.expenseSort as ExpenseSort
     });

   listContainer.innerHTML = list.length
     ? list.map((expense) => expenseRow(expense, currency)).join('')
     : emptyState('No expenses found', 'Try changing your search or add your first expense above.');
 }

 updateList();

 el.querySelector<HTMLInputElement>('#expense-search')?.addEventListener('input', (event) => {
   uiState.expenseSearch = (event.target as HTMLInputElement).value;
   updateList();
 });


el.querySelector<HTMLSelectElement>('#expense-filter-category')?.addEventListener('change',
(event) => {
   uiState.expenseCategory = (event.target as HTMLSelectElement).value;
   updateList();
 });

 el.querySelector<HTMLSelectElement>('#expense-sort')?.addEventListener('change', (event) => {
  uiState.expenseSort = (event.target as HTMLSelectElement).value;

   updateList();
 });

 el.querySelector<HTMLFormElement>('#expense-form')?.addEventListener('submit', (event) => {
  event.preventDefault();

  const amountMinor = parseAmountToMinor(amountInput?.value ?? '');
  const category = categoryInput?.value.trim() || undefined;
  const date = dateInput?.value || todayISO();
  const description = descriptionInput?.value.trim() || undefined;
  const recurring = (recurringInput?.value ?? 'none') as Recurrence;

  const result = editingExpense
    ? store.updateExpense(editingExpense.id, { amountMinor: amountMinor ?? undefined,
category, date, description, recurring })
    : store.addExpense({ amountMinor: amountMinor ?? Number.NaN, category, date,
description, recurring });

  if (!result.ok) {
    showToast(result.message, 'error');
    return;
  }

   uiState.editingExpenseId = null;
   showToast(editingExpense ? 'Expense updated.' : 'Expense added.', 'success');
   refresh();
 });

 el.querySelector<HTMLButtonElement>('#cancel-expense-edit')?.addEventListener('click', () => {
   uiState.editingExpenseId = null;
   refresh();
 });

 listContainer?.addEventListener('click', (event) => {
   const target = event.target as HTMLElement;
   const actionElement = target.closest<HTMLElement>('[data-action]');
   if (!actionElement) return;

  const action = actionElement.dataset.action;
  const id = actionElement.dataset.id;
  if (!action || !id) return;

      if (action === 'edit-expense') {
        uiState.editingExpenseId = id;
        refresh();
      }

   if (action === 'delete-expense') {
     if (!window.confirm('Delete this expense?')) return;
     const result = store.deleteExpense(id);
     showToast(result.ok ? 'Expense deleted.' : result.message, result.ok ? 'success' : 'error');
     refresh();
   }
 });
}
