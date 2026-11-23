'use client';

import React from 'react';
import { cn } from '@/src/lib/utils/cn';

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
