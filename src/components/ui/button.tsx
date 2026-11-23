'use client';

import React from 'react';
import { cn } from '@/src/lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => {
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary:
        'bg-[#1C6440] text-white hover:bg-[#165033] shadow-xs active:scale-[0.99] border border-transparent',
      secondary:
        'bg-[#124B96] text-white hover:bg-[#0E3B77] shadow-xs active:scale-[0.99] border border-transparent',
      outline:
        'bg-surface text-foreground border border-border hover:bg-surface-muted/60 shadow-xs active:scale-[0.99]',
      ghost:
        'bg-transparent text-foreground hover:bg-surface-muted border border-transparent',
      destructive:
        'bg-[#DF6153] text-white hover:bg-[#C94F42] shadow-xs active:scale-[0.99] border border-transparent',
    };

    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'h-9 px-3.5 text-sm gap-1.5 font-medium',
      md: 'h-10 px-4 text-sm sm:text-base gap-2 font-semibold',
      lg: 'h-11 px-5 text-base gap-2 font-semibold',
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center rounded-2xl transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
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
