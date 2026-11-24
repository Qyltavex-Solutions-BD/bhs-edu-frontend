'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { hydratePreferences } from '@/src/store/slices/uiSlice';
import { hydrateAuth, AUTH_STORAGE_KEY } from '@/src/store/slices/authSlice';

export function ThemeSync() {
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

      const storedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        if (parsed?.accessToken && parsed?.user && parsed?.role) {
          dispatch(
            hydrateAuth({
              accessToken: parsed.accessToken,
              user: parsed.user,
              role: parsed.role,
              permissions: parsed.permissions ?? [],
            })
          );
        }
      }
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
