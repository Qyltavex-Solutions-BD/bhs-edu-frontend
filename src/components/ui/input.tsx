'use client';

import React from 'react';
import { cn } from '@/src/lib/utils/cn';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full h-10 px-3.5 rounded-2xl border border-border bg-surface text-foreground text-sm sm:text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#1C6440]/25 focus:border-[#1C6440] shadow-xs transition-all disabled:opacity-60',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';
