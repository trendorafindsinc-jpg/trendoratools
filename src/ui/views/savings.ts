import type { AppStore } from '../../state/store';
import { uiState } from '../uiState';
import { goalSummaries } from '../../domain/savings';
import { formatMinor } from '../../core/money';
import { formatDate, todayISO } from '../../core/date';
import { escapeHtml } from '../dom';
import { showToast } from '../toast';
import { emptyState, progressBar } from '../components';
import { parseAmountToMinor } from '../../core/money';

export function renderSavings(el: HTMLElement, store: AppStore, refresh: () => void): void {
 const state = store.state;
 const currency = state.preferences.currency;
 const summaries = goalSummaries(state);

 if (!uiState.selectedGoalId && summaries.length > 0) {
   uiState.selectedGoalId = summaries[0].goal.id;
 }

 const selectedGoal = summaries.find((item) => item.goal.id === uiState.selectedGoalId);
 const editingContribution = uiState.editingContributionId
  ? state.savingsContributions.find((contribution) => contribution.id ===
uiState.editingContributionId)
  : undefined;

 const goalCards = summaries.length
  ? summaries

        .map((summary) => `
         <article class="card goal-card ${summary.goal.id === uiState.selectedGoalId ? 'active' :
''}">
       <div class="row between">
         <h3>${escapeHtml(summary.goal.name)}</h3>
         <div class="row">
          <button class="btn btn-small" type="button" data-action="select-goal"
data-id="${summary.goal.id}">Manage</button>
          <button class="btn btn-danger btn-small" type="button" data-action="delete-goal"
data-id="${summary.goal.id}">Delete</button>
         </div>
       </div>

       <div class="row" style="margin: var(--space-3) 0;">
        <span class="badge">Saved ${escapeHtml(formatMinor(summary.currentMinor,
currency))}</span>
        <span class="badge">Target ${escapeHtml(formatMinor(summary.targetMinor,
currency))}</span>
        ${summary.goal.targetDate ? `<span class="badge">Due
${formatDate(summary.goal.targetDate)}</span>` : ''}
       </div>

         ${progressBar(summary.percent)}
         <p class="muted small" style="margin-top: var(--space-2);">
           ${summary.percent}% complete · ${escapeHtml(formatMinor(summary.remainingMinor,
currency))} remaining
         </p>
        </article>
      `)
      .join('')
  : emptyState(
      'No savings goals yet',
      'Create your first goal and start recording contributions.',
      '<button class="btn btn-primary" type="button" id="focus-goal-name">Create goal</button>'
    );

 const contributions = selectedGoal
  ? state.savingsContributions
      .filter((contribution) => contribution.goalId === selectedGoal.goal.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  : [];

 const contributionRows = selectedGoal
  ? contributions.length

    ? contributions
        .map((contribution) => `
          <div class="list-row">
           <div>
             <div class="strong">${escapeHtml(formatMinor(contribution.amountMinor, currency))}</div>
             <div class="muted small">${formatDate(contribution.date)}${contribution.note ? ` ·
${escapeHtml(contribution.note)}` : ''}</div>
           </div>
           <div></div>
           <div class="row">
             <button class="btn btn-small" type="button" data-action="edit-contribution"
data-id="${contribution.id}">Edit</button>
             <button class="btn btn-danger btn-small" type="button"
data-action="delete-contribution" data-id="${contribution.id}">Delete</button>
           </div>
          </div>
        `)
        .join('')
    : emptyState('No contributions yet', 'Add a contribution to move this goal forward.')
  : '';

 el.innerHTML = `
  <section class="page">
    <header class="page-header">
      <h1>Savings Tracker</h1>
      <p>Create goals, track contributions, and monitor progress toward each target.</p>
    </header>

   <div class="grid two">
    <form id="goal-form" class="card">
     <h2>Create savings goal</h2>

      <label class="field">
       <span class="field-label">Goal name</span>
       <input id="goal-name" class="field-input" type="text" placeholder="Emergency fund" />
      </label>

      <label class="field">
       <span class="field-label">Target amount</span>
       <input id="goal-target" class="field-input" type="text" inputmode="decimal"
placeholder="500000" />
      </label>

      <label class="field">
       <span class="field-label">Target date (optional)</span>
       <input id="goal-date" class="field-input" type="date" />
      </label>

      <button class="btn btn-primary" type="submit">Create goal</button>
     </form>

     <form id="contribution-form" class="card">
      <h2>${editingContribution ? 'Edit contribution' : 'Add contribution'}</h2>

      ${
       selectedGoal
         ?`
          <p class="muted">Goal:
<strong>${escapeHtml(selectedGoal.goal.name)}</strong></p>

         <label class="field">
          <span class="field-label">Amount</span>
          <input id="contribution-amount" class="field-input" type="text" inputmode="decimal"
placeholder="25000" />
         </label>

          <label class="field">
           <span class="field-label">Date</span>
           <input id="contribution-date" class="field-input" type="date" value="${todayISO()}" />
          </label>

           <label class="field">
            <span class="field-label">Note (optional)</span>
            <input id="contribution-note" class="field-input" type="text" placeholder="Salary
contribution" />
           </label>

           <div class="row">
             <button class="btn btn-primary" type="submit">${editingContribution ? 'Update contribution' : 'Add contribution'}</button>
             ${editingContribution ? '<button class="btn" type="button" id="cancel-contribution-edit">Cancel</button>' : ''}
           </div>
         `
         : '<p class="muted">Select a goal to add or edit contributions.</p>'
       }
     </form>

      </div>

      <div class="stack">${goalCards}</div>

    ${
      selectedGoal
       ?`
         <div class="card">
            <h2>Contributions for ${escapeHtml(selectedGoal.goal.name)}</h2>
            <div class="stack">${contributionRows}</div>
         </div>
       `
       : ''
    }
   </section>
 `;

 const goalTargetInput = el.querySelector<HTMLInputElement>('#goal-target');
 if (uiState.prefillSavingsTarget != null && goalTargetInput) {
   goalTargetInput.value = (uiState.prefillSavingsTarget / 100).toFixed(2);
   uiState.prefillSavingsTarget = undefined;
 }

 if (editingContribution) {
   const amountInput = el.querySelector<HTMLInputElement>('#contribution-amount');
   const dateInput = el.querySelector<HTMLInputElement>('#contribution-date');
   const noteInput = el.querySelector<HTMLInputElement>('#contribution-note');

     if (amountInput) amountInput.value = (editingContribution.amountMinor / 100).toFixed(2);
     if (dateInput) dateInput.value = editingContribution.date;
     if (noteInput) noteInput.value = editingContribution.note ?? '';
 }

 el.querySelector<HTMLFormElement>('#goal-form')?.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = el.querySelector<HTMLInputElement>('#goal-name')?.value ?? '';
  const targetMinor =
parseAmountToMinor(el.querySelector<HTMLInputElement>('#goal-target')?.value ?? '');
  const targetDate = el.querySelector<HTMLInputElement>('#goal-date')?.value || undefined;

     const result = store.addSavingsGoal({
      name,
      targetMinor: targetMinor ?? Number.NaN,

    targetDate
  });

  if (!result.ok) {
    showToast(result.message, 'error');
    return;
  }

   showToast('Savings goal created.', 'success');
   refresh();
 });

 el.querySelector<HTMLFormElement>('#contribution-form')?.addEventListener('submit',
(event) => {
  event.preventDefault();

  if (!selectedGoal) return;

     const amountMinor =
parseAmountToMinor(el.querySelector<HTMLInputElement>('#contribution-amount')?.value ??
'');
     const date = el.querySelector<HTMLInputElement>('#contribution-date')?.value || todayISO();
     const note = el.querySelector<HTMLInputElement>('#contribution-note')?.value.trim() ||
undefined;

  const result = editingContribution
   ? store.updateSavingsContribution(editingContribution.id, {
       amountMinor: amountMinor ?? undefined,
       date,
       note
     })
   : store.addSavingsContribution({
       goalId: selectedGoal.goal.id,
       amountMinor: amountMinor ?? Number.NaN,
       date,
       note
     });

  if (!result.ok) {
    showToast(result.message, 'error');
    return;
  }

  uiState.editingContributionId = null;

   showToast(editingContribution ? 'Contribution updated.' : 'Contribution added.', 'success');
   refresh();
 });

  el.querySelector<HTMLButtonElement>('#cancel-contribution-edit')?.addEventListener('click',
() => {
    uiState.editingContributionId = null;
    refresh();
  });

 el.querySelector<HTMLButtonElement>('#focus-goal-name')?.addEventListener('click', () => {
   el.querySelector<HTMLInputElement>('#goal-name')?.focus();
 });

 el.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const actionElement = target.closest<HTMLElement>('[data-action]');
  if (!actionElement) return;

  const action = actionElement.dataset.action;
  const id = actionElement.dataset.id;
  if (!action || !id) return;

  if (action === 'select-goal') {
    uiState.selectedGoalId = id;
    uiState.editingContributionId = null;
    refresh();
  }

  if (action === 'delete-goal') {
    if (!window.confirm('Delete this savings goal and its contributions?')) return;
    const result = store.deleteSavingsGoal(id);
    showToast(result.ok ? 'Savings goal deleted.' : result.message, result.ok ? 'success' : 'error');
    refresh();
  }

  if (action === 'edit-contribution') {
    uiState.editingContributionId = id;
    refresh();
  }

  if (action === 'delete-contribution') {
    if (!window.confirm('Delete this contribution?')) return;
    const result = store.deleteSavingsContribution(id);

       showToast(result.ok ? 'Contribution deleted.' : result.message, result.ok ? 'success' : 'error');
       refresh();
   }
 });
}
