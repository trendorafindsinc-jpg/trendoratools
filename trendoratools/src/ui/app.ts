import type { AppStore } from '../state/store';
import { currentRoute } from './router';
import { applyTheme } from './theme';
import { renderHome } from './views/home';
import { renderDashboard } from './views/dashboard';
import { renderBudget } from './views/budget';
import { renderExpenses } from './views/expenses';
import { renderSavings } from './views/savings';
import { renderSettings } from './views/settings';

interface NavItem {
  hash: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { hash: '#/home', label: 'Assistant' },
  { hash: '#/dashboard', label: 'Dashboard' },
  { hash: '#/budget', label: 'Budget' },
  { hash: '#/expenses', label: 'Expenses' },
  { hash: '#/savings', label: 'Savings' },
  { hash: '#/settings', label: 'Settings' }
];

function navLinks(route: string): string {
  return NAV_ITEMS.map((item) => {
    const active = route === item.hash;
    return `<a class="nav-link ${active ? 'active' : ''}" href="${item.hash}" ${active ?
'aria-current="page"' : ''}>${item.label}</a>`;
  }).join('');
}

function shell(route: string): string {
 return `

     <a class="skip-link" href="#view">Skip to content</a>
     <div class="app-shell">
      <header class="top-bar">
       <div class="brand">
         <span class="brand-name">TrendoraTools</span>
         <span class="brand-sub">LUCIA by Trendora Inc.</span>
       </div>
       <nav class="desktop-nav" aria-label="Primary">
         ${navLinks(route)}
       </nav>
      </header>

      <main id="view" class="content-wrap" tabindex="-1" aria-live="polite"></main>

       <nav class="mobile-nav" aria-label="Mobile primary">
        ${navLinks(route)}
       </nav>
      </div>
    `;
}

function renderOnboarding(root: HTMLElement, store: AppStore, refresh: () => void): void {
 if (store.state.preferences.onboarded) return;

 root.insertAdjacentHTML(
  'beforeend',
  `
    <div class="onboarding-overlay" role="dialog" aria-modal="true" aria-label="Welcome to
TrendoraTools">
     <div class="onboarding-panel">
       <div>
        <h1>Welcome to TrendoraTools</h1>
        <p class="muted">A practical productivity workspace for budgeting, expenses, and
savings.</p>
       </div>

        <ul class="onboarding-list">
         <li>Create a monthly budget and category limits.</li>
         <li>Record expenses and track spending by category.</li>
         <li>Create savings goals and log contributions.</li>
         <li>Use the assistant to jump straight to the right tool.</li>
        </ul>

        <div class="row">

          <button id="onboarding-start" class="btn btn-primary" type="button">Start using
TrendoraTools</button>
          <button id="onboarding-later" class="btn btn-secondary" type="button">Explore
first</button>
        </div>
       </div>
      </div>
    `
  );

    root.querySelector<HTMLButtonElement>('#onboarding-start')?.addEventListener('click', () =>
{
      store.completeOnboarding();
      refresh();
    });

    root.querySelector<HTMLButtonElement>('#onboarding-later')?.addEventListener('click', () =>
{
      store.completeOnboarding();
      refresh();
    });
}

function renderView(route: string, el: HTMLElement, store: AppStore, refresh: () => void): void {
 switch (route) {
  case '#/home':
    renderHome(el, store, refresh);
    break;
  case '#/dashboard':
    renderDashboard(el, store);
    break;
  case '#/budget':
    renderBudget(el, store, refresh);
    break;
  case '#/expenses':
    renderExpenses(el, store, refresh);
    break;
  case '#/savings':
    renderSavings(el, store, refresh);
    break;
  case '#/settings':
    renderSettings(el, store, refresh);
    break;
  default:

         el.innerHTML = `
           <section class="page">
            <div class="card">
              <h1>Page not found</h1>
              <p class="muted">That route does not exist in TrendoraTools.</p>
              <a class="btn btn-primary" href="#/home">Go to Assistant</a>
            </div>
           </section>
         `;
    }
}

export function createApp(root: HTMLElement, store: AppStore): void {
 const render = () => {
  applyTheme(store.state.preferences.theme);
  const route = currentRoute();

        root.innerHTML = shell(route);

        const view = root.querySelector<HTMLElement>('#view');
        if (view) {
          renderView(route, view, store, render);
        }

      renderOnboarding(root, store, render);
    };

    window.addEventListener('hashchange', render);
    store.subscribe(render);

    if (!window.location.hash) {
      window.location.hash = '#/home';
    }

  render();
}
