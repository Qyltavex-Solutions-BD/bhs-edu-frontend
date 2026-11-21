'use client';

import React from 'react';
import { cn } from '@/src/lib/utils/cn';
import { X } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => {
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary:
        'bg-primary text-primary-foreground hover:opacity-92 border border-transparent',
      secondary:
        'bg-secondary text-secondary-foreground hover:opacity-92 border border-transparent',
      outline:
        'bg-surface text-foreground border border-border hover:bg-surface-muted',
      ghost:
        'bg-transparent text-foreground hover:bg-surface-muted border border-transparent',
      destructive:
        'bg-destructive text-destructive-foreground hover:opacity-92 border border-transparent',
    };

    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'h-9 px-3.5 text-sm gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-11 px-5 text-base gap-2',
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-[var(--radius)] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full h-10 px-3 rounded-[var(--radius)] border border-border bg-surface text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary disabled:opacity-60',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'w-full h-10 px-3 rounded-[var(--radius)] border border-border bg-surface text-foreground text-base focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary disabled:opacity-60',
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full min-h-[96px] p-3 rounded-[var(--radius)] border border-border bg-surface text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary disabled:opacity-60',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-[var(--radius)] text-foreground',
        className
      )}
    >
      {children}
    </div>
  );
}

export function FormField({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-destructive font-medium">{error}</p>}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex items-center gap-2.5 cursor-pointer disabled:opacity-50',
      )}
    >
      <span
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors border',
          checked ? 'bg-primary border-primary' : 'bg-surface-muted border-border'
        )}
      >
        <span
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white transition-transform mt-px',
            checked ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </span>
      {label && <span className="text-sm text-foreground">{label}</span>}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  maxWidth = 'max-w-2xl',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'w-full bg-surface border border-border rounded-[var(--radius)] shadow-lg max-h-[90vh] flex flex-col',
          maxWidth
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-muted cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: { value: string; label: string; count?: number }[];
  value: T;
  onChange: (val: NoInfer<T>) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-1 p-1 bg-surface-muted rounded-[var(--radius)] border border-border',
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value as T)}
            className={cn(
              'px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer',
              active
                ? 'bg-surface text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground border border-transparent'
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="ml-1.5 tabular-nums text-xs opacity-75">
                ({item.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-surface-muted', className)} />
  );
}
