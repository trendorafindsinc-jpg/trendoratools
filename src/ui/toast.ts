export type ToastTone = 'success' | 'error' | 'info';

export function showToast(message: string, tone: ToastTone = 'info'): void {
 let container = document.getElementById('toast-container') as HTMLElement | null;

 if (!container) {
   container = document.createElement('div');
   container.id = 'toast-container';
   container.className = 'toast-container';
   container.setAttribute('aria-live', 'polite');
   document.body.appendChild(container);
 }

 const toast = document.createElement('div');
 toast.className = `toast ${tone}`;
 toast.textContent = message;
 container.appendChild(toast);

 window.setTimeout(() => {
   toast.remove();
 }, 4200);
}
