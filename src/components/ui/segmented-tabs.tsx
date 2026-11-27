'use client';

import React from 'react';
import { cn } from '@/src/lib/utils/cn';

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
              <span className="ml-1.5 tabular-nums text-sm opacity-75">
                ({item.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
