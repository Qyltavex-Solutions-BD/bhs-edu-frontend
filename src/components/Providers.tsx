'use client';

import React from 'react';
import { StoreProvider } from '@/src/store';
import { CommandPalette } from '@/src/components/shared/CommandPalette';
import {
  AppErrorBoundary,
  ThemeSync,
  ScrollToTop,
  OfflineBanner,
  ClientToaster,
} from './app-providers';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AppErrorBoundary>
        <ThemeSync />
        <ScrollToTop />
        <OfflineBanner />
        <CommandPalette />
        <ClientToaster />
        {children}
      </AppErrorBoundary>
    </StoreProvider>
  );
}

export * from './app-providers';
