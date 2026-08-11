import type { AppStore } from '../../state/store';
import { parseIntent, routeForIntent, type ToolIntent } from '../../intent/intent';
import { uiState, type ChatMessage } from '../uiState';
import { escapeHtml } from '../dom';

import { formatMinor } from '../../core/money';
import { todayISO } from '../../core/date';
import { showToast } from '../toast';
import { navigate } from '../router';
import { emptyState } from '../components';

function ensureWelcomeMessage(): void {
  if (uiState.chat.length === 0) {
    uiState.chat.push({
      role: 'assistant',
      text: 'Hello. I am the TrendoraTools assistant. I use built-in rules to route your request to Budget, Expenses, Savings, or your Dashboard. I am not an AI chatbot.'
    });
  }
}

function actionsHtml(intent: ToolIntent, index: number, currency: string): string {
 const buttons: string[] = [];

 if (intent.type === 'add_expense' && intent.amountMinor != null) {
   buttons.push(
     `<button class="btn btn-primary" type="button" data-intent-action="record-expense"
data-index="${index}">Record ${escapeHtml(formatMinor(intent.amountMinor, currency))}
expense</button>`
   );
 }

 if (intent.type === 'create_savings_goal' && intent.amountMinor != null) {
   buttons.push(
     `<button class="btn btn-primary" type="button" data-intent-action="open-savings"
data-index="${index}">Create goal for ${escapeHtml(formatMinor(intent.amountMinor,
currency))}</button>`
   );
 }

 buttons.push(
   `<button class="btn btn-secondary" type="button" data-intent-action="open-tool"
data-index="${index}">Open tool</button>`
 );

    return `<div class="chat-actions">${buttons.join('')}</div>`;
}

function messageHtml(message: ChatMessage, index: number, currency: string): string {

    return `
      <article class="chat-message ${message.role}">
       <p>${escapeHtml(message.text)}</p>
       ${message.intent ? actionsHtml(message.intent, index, currency) : ''}
      </article>
    `;
}

export function renderHome(el: HTMLElement, store: AppStore, refresh: () => void): void {
 ensureWelcomeMessage();

    const currency = store.state.preferences.currency;
    const messages = uiState.chat
     .map((message, index) => messageHtml(message, index, currency))
     .join('');

 el.innerHTML = `
  <section class="page">
    <header class="page-header">
      <h1>Assistant</h1>
      <p>Describe what you want to do. TrendoraTools interprets your intent locally and routes
you to the right productivity tool.</p>
    </header>

      <div class="card">
       <div id="home-chat" class="chat" aria-live="polite">
        ${messages}
       </div>

     <form id="home-form" class="row" style="margin-top: var(--space-4);">
      <label class="field" style="flex: 1 1 320px; margin: 0;">
        <span class="field-label">What do you want to do?</span>
        <input id="home-input" class="field-input" type="text" autocomplete="off"
placeholder="Example: I spent ₦25,000 on groceries" />
      </label>
      <button class="btn btn-primary" type="submit">Interpret</button>
     </form>

     <div class="row" style="margin-top: var(--space-3);">
      <button class="btn btn-secondary" type="button" data-suggestion="I want to create a
monthly budget.">Create budget</button>
      <button class="btn btn-secondary" type="button" data-suggestion="I spent ₦10,000 on
transport.">Add expense</button>

     <button class="btn btn-secondary" type="button" data-suggestion="I want to save
₦500,000.">Set savings goal</button>
     <button class="btn btn-secondary" type="button" data-suggestion="Show my
dashboard.">Dashboard</button>
    </div>
   </div>

    ${emptyState(
      'How this works',
      'Conversation is the experience. Productivity tools are the product. The assistant does not claim to be AI. It simply helps you move into the right workflow.',
      `<a class="btn" href="#/dashboard">Open Dashboard</a>
       <a class="btn" href="#/budget">Open Budget Planner</a>
       <a class="btn" href="#/expenses">Open Expense Tracker</a>
       <a class="btn" href="#/savings">Open Savings Tracker</a>`
    )}
   </section>
 `;

 const form = el.querySelector<HTMLFormElement>('#home-form');
 const input = el.querySelector<HTMLInputElement>('#home-input');
 const chat = el.querySelector<HTMLElement>('#home-chat');

 form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input?.value.trim() ?? '';
  if (!text) return;

  const intent = parseIntent(text);

  uiState.chat.push({ role: 'user', text });
  uiState.chat.push({ role: 'assistant', text: intent.message, intent });

   refresh();
 });

 el.querySelectorAll<HTMLButtonElement>('[data-suggestion]').forEach((button) => {
   button.addEventListener('click', () => {
     if (!input) return;
     input.value = button.dataset.suggestion ?? '';
     input.focus();
   });
 });

chat?.addEventListener('click', (event) => {
 const target = event.target as HTMLElement;
 const actionElement = target.closest<HTMLElement>('[data-intent-action]');
 if (!actionElement) return;

 const action = actionElement.dataset.intentAction;
 const index = Number(actionElement.dataset.index ?? '-1');
 const intent = uiState.chat[index]?.intent;
 if (!intent) return;

 if (action === 'record-expense' && intent.amountMinor != null) {
   const result = store.addExpense({
     amountMinor: intent.amountMinor,
     category: intent.category || 'General',
     description: intent.raw,
     date: todayISO(),
     recurring: 'none'
   });

     if (result.ok) {
       showToast('Expense recorded.', 'success');
     } else {
       showToast(result.message, 'error');
     }
     return;
 }

 if (action === 'open-savings') {
   uiState.prefillSavingsTarget = intent.amountMinor;
   navigate(routeForIntent(intent));
   return;
 }

 if (action === 'open-tool') {
   if (intent.type === 'add_expense') {
     uiState.prefillExpenseAmount = intent.amountMinor;
     uiState.prefillExpenseCategory = intent.category;
   }

     if (intent.type === 'create_savings_goal') {
       uiState.prefillSavingsTarget = intent.amountMinor;
     }

     navigate(routeForIntent(intent));

   }
 });
}
