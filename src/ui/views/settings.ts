import type { AppStore } from '../../state/store';
import { showToast } from '../toast';

export function renderSettings(el: HTMLElement, store: AppStore, refresh: () => void): void {
 const prefs = store.state.preferences;

 el.innerHTML = `
  <section class="page">
    <header class="page-header">
      <h1>Settings</h1>
      <p>Manage application preferences and local data.</p>
    </header>

       <div class="grid two">
        <div class="card">
         <h2>Preferences</h2>

      <label class="field">
       <span class="field-label">Currency</span>
       <select id="currency" class="field-input">
         <option value="NGN" ${prefs.currency === 'NGN' ? 'selected' : ''}>NGN — Nigerian
Naira</option>
         <option value="USD" ${prefs.currency === 'USD' ? 'selected' : ''}>USD — US
Dollar</option>
         <option value="GBP" ${prefs.currency === 'GBP' ? 'selected' : ''}>GBP — British
Pound</option>
         <option value="EUR" ${prefs.currency === 'EUR' ? 'selected' : ''}>EUR —
Euro</option>
       </select>
      </label>

         <label class="field">
          <span class="field-label">Appearance</span>
          <select id="theme" class="field-input">
            <option value="system" ${prefs.theme === 'system' ? 'selected' : ''}>System</option>

         <option value="light" ${prefs.theme === 'light' ? 'selected' : ''}>Light</option>
         <option value="dark" ${prefs.theme === 'dark' ? 'selected' : ''}>Dark</option>
       </select>
      </label>

      <label class="field row">
       <input id="notifications" type="checkbox" ${prefs.notifications ? 'checked' : ''} />
       <span>Enable local alert indicators</span>
      </label>

      <button id="reset-onboarding" class="btn" type="button">Show onboarding
again</button>
     </div>

    <div class="card">
     <h2>Data management</h2>

    <p class="muted">TrendoraTools currently stores data locally in this browser. Export a
JSON backup before clearing data.</p>

      <div class="row">
       <button id="export-data" class="btn btn-primary" type="button">Export JSON</button>

       <label class="btn">
        Import JSON
        <input id="import-data" type="file" accept="application/json,.json" hidden />
       </label>

        <button id="clear-data" class="btn btn-danger" type="button">Clear local data</button>
       </div>
     </div>
    </div>
   </section>
 `;

 el.querySelector<HTMLSelectElement>('#currency')?.addEventListener('change', (event) => {
   store.setPreferences({ currency: (event.target as HTMLSelectElement).value });
   showToast('Currency updated.', 'success');
   refresh();
 });

 el.querySelector<HTMLSelectElement>('#theme')?.addEventListener('change', (event) => {
  const value = (event.target as HTMLSelectElement).value;
  if (value === 'light' || value === 'dark' || value === 'system') {

          store.setPreferences({ theme: value });
          refresh();
      }
    });

    el.querySelector<HTMLInputElement>('#notifications')?.addEventListener('change', (event) =>
{
      store.setPreferences({ notifications: (event.target as HTMLInputElement).checked });
    });

    el.querySelector<HTMLButtonElement>('#reset-onboarding')?.addEventListener('click', () => {
      store.setPreferences({ onboarded: false });
      refresh();
    });

    el.querySelector<HTMLButtonElement>('#export-data')?.addEventListener('click', () => {
      const data = store.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'trendoratools-export.json';
      anchor.click();
      URL.revokeObjectURL(url);
      showToast('Export downloaded.', 'success');
    });

    el.querySelector<HTMLInputElement>('#import-data')?.addEventListener('change', (event) => {
     const input = event.target as HTMLInputElement;
     const file = input.files?.[0];
     if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const result = store.importData(String(reader.result));
        showToast(result.ok ? 'Data imported.' : result.message, result.ok ? 'success' : 'error');
        refresh();
      };
      reader.readAsText(file);
    });

    el.querySelector<HTMLButtonElement>('#clear-data')?.addEventListener('click', () => {
     if (!window.confirm('Clear all local TrendoraTools data? This cannot be undone.')) return;
     store.clearAll();

   showToast('Local data cleared.', 'success');
   refresh();
 });
}
