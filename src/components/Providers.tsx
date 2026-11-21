'use client';

import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import { WifiOff } from 'lucide-react';
import { store } from '@/src/store';
import { I18nProvider, useI18n } from '@/src/lib/i18n';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { hydratePreferences } from '@/src/store/slices/uiSlice';
import { CommandPalette } from '@/src/components/shared/CommandPalette';
import { ErrorState } from '@/src/components/shared/Feedback';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message ?? 'অপ্রত্যাশিত ত্রুটি হয়েছে' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <ErrorState
              message={this.state.message}
              onRetry={() => this.setState({ hasError: false, message: '' })}
            />
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ThemeSync() {
  const theme = useAppSelector((s) => s.ui.theme);
  const dispatch = useAppDispatch();

  useEffect(() => {
    let storedTheme: 'light' | 'dark' = 'light';
    let sidebarCollapsed = false;
    let selectedAcademicYearId: string | null = null;
    try {
      storedTheme = window.localStorage.getItem('bhs_theme') === 'dark' ? 'dark' : 'light';
      sidebarCollapsed = window.localStorage.getItem('bhs_sidebar_collapsed') === 'true';
      selectedAcademicYearId = window.localStorage.getItem('bhs_academic_year');
    } catch {
      // ignore restricted storage
    }
    dispatch(hydratePreferences({ theme: storedTheme, sidebarCollapsed, selectedAcademicYearId }));
  }, [dispatch]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return null;
}

function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

function OfflineBanner() {
  const { pick } = useI18n();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false);
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="bg-warning text-white text-sm font-medium py-2 px-4 flex items-center justify-center gap-2 no-print">
      <WifiOff className="w-4 h-4" />
      <span>
        {pick('ইন্টারনেট সংযোগ বিচ্ছিন্ন। সংযোগ ফিরে এলে পরিবর্তনগুলো পুনরায় সিঙ্ক করুন।')}
      </span>
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <I18nProvider>
        <AppErrorBoundary>
          <ThemeSync />
          <ScrollToTop />
          <OfflineBanner />
          <CommandPalette />
          <Toaster richColors position="top-right" />
          {children}
        </AppErrorBoundary>
      </I18nProvider>
    </Provider>
  );
}
