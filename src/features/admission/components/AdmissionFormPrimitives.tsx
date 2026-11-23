'use client';

import React from 'react';
import { cn } from '@/src/lib/utils/cn';
import { Select } from '@/src/components/ui/primitives';

/**
 * Modern Institutional Form Controls — matching the clean, elevated aesthetic of the platform.
 * Uses 16px (rounded-2xl) squircle radius, smooth borders, and clear high-legibility typography.
 */
export const AdmissionInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full h-11 px-4 rounded-2xl border border-border bg-surface text-foreground text-base placeholder:text-muted-foreground/70 transition-all duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-surface-muted/60 disabled:text-muted-foreground disabled:cursor-not-allowed',
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
  <Select
    ref={ref}
    className={cn(
      'w-full h-11 px-4 text-base font-medium rounded-2xl',
      className
    )}
    {...props}
  >
    {children}
  </Select>
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
    <div className={cn('space-y-2', className)}>
      <label className="block text-base font-semibold text-foreground leading-snug">
        {label}
        {required && <span className="text-destructive ml-1.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-sm text-muted-foreground leading-relaxed">{hint}</p>
      )}
      {error && (
        <p className="text-sm text-destructive font-medium leading-relaxed">{error}</p>
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
    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/80">
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {rightSlot}
    </div>
  );
}
