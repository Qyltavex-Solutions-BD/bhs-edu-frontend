'use client';

import React from 'react';
import { cn } from '@/src/lib/utils/cn';

/**
 * Crisp Institutional Form Controls — tailored for official educational admission portals.
 * Uses restrained 4px radius (rounded-[4px]), sharp hairline borders, and high-legibility labels.
 */
export const AdmissionInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full h-10 px-3 rounded-[4px] border border-border bg-surface text-foreground text-base placeholder:text-muted-foreground/75 transition-colors focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 disabled:bg-surface-muted/60 disabled:text-muted-foreground disabled:cursor-not-allowed',
      className
    )}
    {...props}
  />
));
AdmissionInput.displayName = 'AdmissionInput';

export const AdmissionSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'w-full h-10 px-3 rounded-[4px] border border-border bg-surface text-foreground text-base transition-colors focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 disabled:bg-surface-muted/60 disabled:text-muted-foreground disabled:cursor-not-allowed',
      className
    )}
    {...props}
  >
    {children}
  </select>
));
AdmissionSelect.displayName = 'AdmissionSelect';

export function AdmissionField({
  label,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-sm font-medium text-foreground leading-snug">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-sm text-muted-foreground leading-normal">{hint}</p>
      )}
      {error && (
        <p className="text-sm text-destructive font-medium leading-normal">{error}</p>
      )}
    </div>
  );
}

export function AdmissionSectionHeader({
  title,
  subtitle,
  rightSlot,
}: {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-border">
      <div>
        <h3 className="text-lg font-bold text-foreground tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {rightSlot}
    </div>
  );
}
