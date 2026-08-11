export type MinorUnits = number;

export function parseAmountToMinor(raw: string): MinorUnits | null {
 if (typeof raw !== 'string') return null;

    let value = raw.trim();
    if (!value) return null;

   value = value.replace(/[₦$€£,\s]/gi, '').replace(/^NGN/i, '').replace(/^USD/i, '').replace(/^EUR/i, '').replace(/^GBP/i, '');

    if (value.startsWith('-')) return null;

    const match = value.match(/^(\d+)(?:\.(\d{1,2}))?$/);
    if (!match) return null;

    const whole = Number(match[1]);
    const fractionRaw = match[2] ?? '0';
    const fraction = Number(fractionRaw.padEnd(2, '0'));

    if (!Number.isSafeInteger(whole) || !Number.isSafeInteger(fraction)) return null;

    return whole * 100 + fraction;
}

export function formatMinor(minor: MinorUnits, currency = 'NGN'): string {
 const safe = Number.isFinite(minor) ? minor : 0;
 try {
   return new Intl.NumberFormat('en-NG', {
     style: 'currency',
     currency,
     minimumFractionDigits: 2
   }).format(safe / 100);
 } catch {
   return `${currency} ${(safe / 100).toFixed(2)}`;

    }
}

export function addMinor(a: MinorUnits, b: MinorUnits): MinorUnits {
  return a + b;
}

export function subtractMinor(a: MinorUnits, b: MinorUnits): MinorUnits {
  return a - b;
}

export function percentOf(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}
