'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/src/lib/utils/cn';

export function Modal({
  open,
  onClose,
  title,
  description,
  maxWidth = 'max-w-2xl',
  size,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  maxWidth?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  children: React.ReactNode;
}) {
  if (!open) return null;
  const sizeMap: Record<'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full', string> = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-7xl',
  };
  const resolvedMaxWidth = size ? sizeMap[size] : maxWidth;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'w-full bg-surface border border-border rounded-[var(--radius)] shadow-lg max-h-[90vh] flex flex-col',
          resolvedMaxWidth
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
