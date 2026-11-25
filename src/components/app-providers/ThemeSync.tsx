'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { hydratePreferences } from '@/src/store/slices/uiSlice';
import {
  hydrateAuth,
  markAuthHydrated,
  AUTH_STORAGE_KEY,
  type AppRole,
} from '@/src/store/slices/authSlice';
import { env } from '@/src/lib/env';

const PROTECTED_PREFIXES = ['/admin', '/teacher', '/parent', '/student'];

function mapRolesToAppRole(roles: string[] = []): AppRole | undefined {
  if (roles.includes('ADMIN')) return 'SUPER_ADMIN';
  return (['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT'] as const).find(
    (candidate) => roles.includes(candidate)
  );
}

let inFlightHydrationRefresh: Promise<{
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: AppRole;
  };
  role: AppRole;
  permissions: string[];
} | null> | null = null;

async function fetchHydrationSession() {
  if (inFlightHydrationRefresh) {
    return inFlightHydrationRefresh;
  }

  inFlightHydrationRefresh = (async () => {
    try {
      const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!response.ok) return null;

      const json = await response.json();
      const data = json?.data ?? json;
      const mappedRole = mapRolesToAppRole(data?.user?.roles);

      if (!data?.accessToken || !data?.user || !mappedRole) {
        return null;
      }

      return {
        accessToken: data.accessToken,
        user: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          role: mappedRole,
        },
        role: mappedRole,
        permissions: data.user.permissions ?? [],
      };
    } catch {
      return null;
    } finally {
      inFlightHydrationRefresh = null;
    }
  })();

  return inFlightHydrationRefresh;
}

export function ThemeSync() {
  const pathname = usePathname();
  const theme = useAppSelector((s) => s.ui.theme);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
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

    dispatch(
      hydratePreferences({ theme: storedTheme, sidebarCollapsed, selectedAcademicYearId })
    );
  }, [dispatch]);

  useEffect(() => {
    let active = true;

    async function hydrateAuthIfNeeded() {
      // Already have a valid in-memory session
      if (isAuthenticated && accessToken) {
        dispatch(markAuthHydrated());
        return;
      }

      const isProtectedRoute = PROTECTED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
      );

      let hasStoredMeta = false;
      try {
        hasStoredMeta = Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY));
      } catch {
        hasStoredMeta = false;
      }

      // Only attempt silent refresh when on a protected portal route or when an active
      // session metadata flag exists (never on /login or for anonymous public visitors).
      if (!isProtectedRoute && !hasStoredMeta) {
        if (active) dispatch(markAuthHydrated());
        return;
      }

      if (pathname === '/login' || pathname === '/register') {
        if (active) dispatch(markAuthHydrated());
        return;
      }

      const session = await fetchHydrationSession();
      if (!active) return;

      if (session) {
        try {
          window.localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify({
              user: session.user,
              role: session.role,
              permissions: session.permissions,
            })
          );
        } catch {
          // ignore restricted storage
        }
        dispatch(hydrateAuth(session));
      } else {
        try {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch {
          // ignore restricted storage
        }
        dispatch(markAuthHydrated());
      }
    }

    hydrateAuthIfNeeded();

    return () => {
      active = false;
    };
  }, [pathname, isAuthenticated, accessToken, dispatch]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return null;
}
