export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthKeyFromISO(iso: string): string {
  return iso.slice(0, 7);
}

export function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  if (Number.isNaN(date.getTime())) return monthKey;
  return date.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
}

export function isValidISODate(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(new Date(`${iso}T00:00:00`).getTime());
}
