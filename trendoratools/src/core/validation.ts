import { isValidISODate } from './date';

export interface ValidationResult {
  ok: boolean;
  message: string;
}

export function ok(): ValidationResult {
  return { ok: true, message: '' };
}

export function fail(message: string): ValidationResult {
  return { ok: false, message };
}

export function requireText(value: string, label: string): ValidationResult {
  if (!value || !value.trim()) return fail(`${label} is required.`);
  return ok();
}

export function requireMinor(value: number | null | undefined, label: string): ValidationResult {
  if (value == null || Number.isNaN(value)) return fail(`${label} is invalid.`);
  if (value < 0) return fail(`${label} cannot be negative.`);
  return ok();
}

export function requirePositiveMinor(value: number | null | undefined, label: string):
ValidationResult {
  const base = requireMinor(value, label);
  if (!base.ok) return base;
  if ((value ?? 0) <= 0) return fail(`${label} must be greater than zero.`);
  return ok();
}

export function requireDate(value: string, label: string): ValidationResult {
  if (!value) return fail(`${label} is required.`);
  if (!isValidISODate(value)) return fail(`${label} is invalid.`);
  return ok();
}

export function requireMonth(value: string, label: string): ValidationResult {
  if (!/^\d{4}-\d{2}$/.test(value)) return fail(`${label} is invalid.`);
  const [, month] = value.split('-').map(Number);
  if (month < 1 || month > 12) return fail(`${label} is invalid.`);
  return ok();
}
