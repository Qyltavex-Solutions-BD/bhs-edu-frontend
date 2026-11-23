'use client';

import React from 'react';
import { cn } from '@/src/lib/utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-surface-muted', className)} />
  );
}
