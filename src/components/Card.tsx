import React, { useId } from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function Card({ title, children, className = '', action }: CardProps) {
  const titleId = useId();
  return (
    <section className={`card ${className}`} aria-labelledby={title ? titleId : undefined}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 gap-3">
          {title && <h2 id={titleId} className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
