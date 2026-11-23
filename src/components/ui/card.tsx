'use client';

import React from 'react';
import { cn } from '@/src/lib/utils/cn';

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
        'bg-surface border border-border rounded-3xl shadow-[0_2px_12px_-4px_rgba(28,100,64,0.06)] text-foreground transition-all duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}
