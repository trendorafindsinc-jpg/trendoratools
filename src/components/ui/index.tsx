import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';

export { Card } from '../Card';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const styles: Record<ButtonVariant, string> = {
    primary: 'bg-[var(--accent-gold-fill)] text-[#172333] border-transparent hover:brightness-105',
    secondary: 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--glass-border)] hover:border-[var(--accent-gold)]',
    ghost: 'bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--nav-hover)]',
    danger: 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30 hover:bg-[var(--danger)]/15',
  };
  const dimensions: Record<ButtonSize, string> = {
    sm: 'min-h-8 px-3 text-xs',
    md: 'min-h-10 px-4 text-sm',
    lg: 'min-h-12 px-5 text-sm',
  };
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)] disabled:cursor-not-allowed disabled:opacity-55 ${styles[variant]} ${dimensions[size]} ${className}`}
    >
      {loading && <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />}
      {children}
    </button>
  );
}

interface FieldDescriptionProps {
  label: string;
  hint?: string;
  error?: string;
  id?: string;
  className?: string;
}

function FieldDescription({ label, hint, error, id, className = '' }: FieldDescriptionProps) {
  return (
    <>
      <label htmlFor={id} className={`mb-1.5 block text-sm font-medium text-[var(--text-secondary)] ${className}`}>
        {label}
      </label>
      {hint && !error && <span id={`${id}-hint`} className="mb-1.5 block text-xs text-[var(--text-muted)]">{hint}</span>}
      {error && <span id={`${id}-error`} className="mt-1.5 block text-xs text-[var(--danger)]" role="alert">{error}</span>}
    </>
  );
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export function Input({ label, hint, error, id, className = '', wrapperClassName = '', required, ...props }: InputProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy = [props['aria-describedby'], error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined].filter(Boolean).join(' ') || undefined;
  return (
    <div className={wrapperClassName}>
      <FieldDescription label={label} hint={hint} error={error} id={fieldId} />
      <input
        {...props}
        id={fieldId}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        className={`min-h-11 w-full rounded-xl border bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] border-[var(--glass-border)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)] disabled:opacity-60 ${className}`}
      />
    </div>
  );
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: string;
  hint?: string;
  error?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  wrapperClassName?: string;
}

export function Select({ label, hint, error, options, id, className = '', wrapperClassName = '', required, ...props }: SelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy = [props['aria-describedby'], error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined].filter(Boolean).join(' ') || undefined;
  return (
    <div className={wrapperClassName}>
      <FieldDescription label={label} hint={hint} error={error} id={fieldId} />
      <select
        {...props}
        id={fieldId}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        className={`min-h-11 w-full rounded-xl border bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] border-[var(--glass-border)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)] disabled:opacity-60 ${className}`}
      >
        {options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
      </select>
    </div>
  );
}

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  const tones: Record<BadgeTone, string> = {
    neutral: 'border-[var(--glass-border)] bg-[var(--surface)] text-[var(--text-muted)]',
    success: 'border-[var(--positive)]/30 bg-[var(--positive)]/10 text-[var(--positive)]',
    warning: 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]',
    danger: 'border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]',
    brand: 'border-[var(--nav-active-border)] bg-[var(--nav-active-bg)] text-[var(--accent-gold)]',
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Skeleton({ className = '', label = 'Loading' }: { className?: string; label?: string }) {
  return <span aria-label={label} role="status" className={`block animate-pulse rounded-lg bg-[var(--nav-hover)] ${className}`} />;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  const titleId = useId();
  return (
    <section className="rounded-2xl border border-dashed border-[var(--glass-border)] bg-[var(--surface)] px-6 py-10 text-center" aria-labelledby={titleId}>
      <h2 id={titleId} className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-muted)]">{description}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </section>
  );
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }: { title?: string; description: string; onRetry?: () => void }) {
  return (
    <section role="alert" className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-5">
      <h2 className="font-semibold text-[var(--text-primary)]">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{description}</p>
      {onRetry && <Button className="mt-4" variant="secondary" onClick={onRetry}>Try again</Button>}
    </section>
  );
}

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export function Tabs({ items, value, defaultValue, onValueChange, label = 'Section tabs' }: {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
}) {
  const id = useId();
  const [internalValue, setInternalValue] = useState(defaultValue ?? items[0]?.value ?? '');
  const active = value ?? internalValue;
  const activeIndex = Math.max(0, items.findIndex(item => item.value === active));
  const selectTab = (next: string) => {
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
  };
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const enabled = items.map((item, index) => ({ item, index })).filter(entry => !entry.item.disabled);
    const current = enabled.findIndex(entry => entry.item.value === active);
    let nextIndex = current;
    if (event.key === 'ArrowRight') nextIndex = (current + 1) % enabled.length;
    else if (event.key === 'ArrowLeft') nextIndex = (current - 1 + enabled.length) % enabled.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = enabled.length - 1;
    else return;
    event.preventDefault();
    const next = enabled[nextIndex];
    if (next) {
      selectTab(next.item.value);
      document.getElementById(`${id}-tab-${next.index}`)?.focus();
    }
  };
  const current = items[activeIndex];
  return (
    <div>
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex flex-wrap gap-1 border-b border-[var(--divider)]">
        {items.map((item, index) => (
          <button
            key={item.value}
            id={`${id}-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={item.value === active}
            aria-controls={`${id}-panel`}
            tabIndex={item.value === active ? 0 : -1}
            disabled={item.disabled}
            onClick={() => selectTab(item.value)}
            className={`min-h-10 border-b-2 px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] ${item.value === active ? 'border-[var(--accent-gold)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)]'} disabled:opacity-40`}
          >{item.label}</button>
        ))}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${activeIndex}`} tabIndex={0} className="py-4 focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]">
        {current?.content}
      </div>
    </div>
  );
}

export function DataTable({ caption, columns, rows, emptyLabel = 'No records to display' }: {
  caption: string;
  columns: Array<{ key: string; label: string; align?: 'left' | 'right' }>;
  rows: Array<Record<string, ReactNode>>;
  emptyLabel?: string;
}) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[var(--glass-border)]">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-[var(--surface-raised)] text-xs text-[var(--text-muted)]">
          <tr>{columns.map(column => <th key={column.key} scope="col" className={`px-4 py-3 font-semibold ${column.align === 'right' ? 'text-right' : 'text-left'}`}>{column.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[var(--divider)]">
          {rows.length ? rows.map((row, index) => (
            <tr key={index} className="text-[var(--text-secondary)]">
              {columns.map(column => <td key={column.key} className={`px-4 py-3 ${column.align === 'right' ? 'text-right tabular-nums' : ''}`}>{row[column.key] ?? '—'}</td>)}
            </tr>
          )) : <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-[var(--text-muted)]">{emptyLabel}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  const id = useId();
  return (
    <span className="relative inline-flex" title={content} aria-describedby={id}>
      {children}
      <span id={id} role="tooltip" className="sr-only">{content}</span>
    </span>
  );
}

export function Toast({ title, message, tone = 'neutral' }: { title: string; message?: string; tone?: 'neutral' | 'success' | 'error' }) {
  const role = tone === 'error' ? 'alert' : 'status';
  return (
    <div role={role} aria-live={tone === 'error' ? 'assertive' : 'polite'} className="rounded-xl border border-[var(--glass-border)] bg-[var(--surface-raised)] p-4 shadow-lg">
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      {message && <p className="mt-1 text-sm text-[var(--text-muted)]">{message}</p>}
    </div>
  );
}

function OverlaySurface({ open, onClose, title, description, children, kind }: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  kind: 'dialog' | 'drawer';
}) {
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('[data-overlay-close]')?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      } else if (event.key === 'Tab') {
        const nodes = panelRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
        const focusable = nodes ? Array.from(nodes).filter(node => node.offsetParent !== null) : [];
        if (!focusable.length) { event.preventDefault(); return; }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !panelRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !panelRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined}
        className={kind === 'drawer'
          ? 'relative ml-auto flex h-full w-full max-w-md flex-col overflow-y-auto border border-[var(--glass-border)] bg-[var(--surface)] p-5 shadow-2xl'
          : 'relative max-h-[min(85vh,760px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--glass-border)] bg-[var(--surface)] p-6 shadow-2xl'}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id={`${id}-title`} className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
            {description && <p id={`${id}-description`} className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>}
          </div>
          <button data-overlay-close type="button" onClick={onClose} aria-label="Close dialog" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--glass-border)] text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Dialog(props: Omit<Parameters<typeof OverlaySurface>[0], 'kind'>) {
  return <OverlaySurface {...props} kind="dialog" />;
}

export function Drawer(props: Omit<Parameters<typeof OverlaySurface>[0], 'kind'>) {
  return <OverlaySurface {...props} kind="drawer" />;
}
