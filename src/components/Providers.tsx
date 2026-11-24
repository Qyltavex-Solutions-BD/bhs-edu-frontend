'use client';

import React from 'react';
import { StoreProvider } from '@/src/store';
import { I18nProvider } from '@/src/lib/i18n';
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
      <I18nProvider>
        <AppErrorBoundary>
          <ThemeSync />
          <ScrollToTop />
          <OfflineBanner />
          <CommandPalette />
          <ClientToaster />
          {children}
        </AppErrorBoundary>
      </I18nProvider>
    </StoreProvider>
  );
}

export * from './app-providers';
