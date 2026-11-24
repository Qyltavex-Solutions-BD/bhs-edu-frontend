import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import {
  AUTH_STORAGE_KEY,
  logout,
  setCredentials,
  triggerSessionExpired,
  type AuthState,
} from './slices/authSlice';
import {
  setSelectedAcademicYear,
  setTheme,
  toggleSidebar,
  toggleTheme,
  type UiState,
} from './slices/uiSlice';

interface PersistenceState {
  auth: AuthState;
  ui: UiState;
}

const storageKeys = {
  academicYear: 'bhs_academic_year',
  sidebarCollapsed: 'bhs_sidebar_collapsed',
  theme: 'bhs_theme',
} as const;

function safelyWrite(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in restricted/private browser contexts.
  }
}

function safelyRemove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in restricted/private browser contexts.
  }
}

export const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  actionCreator: setCredentials,
  effect: (_action, listenerApi) => {
    const { accessToken, user, role, permissions } =
      (listenerApi.getState() as PersistenceState).auth;
    if (!accessToken || !user || !role) return;

    safelyWrite(
      AUTH_STORAGE_KEY,
      JSON.stringify({ accessToken, user, role, permissions })
    );
  },
});

listenerMiddleware.startListening({
  matcher: isAnyOf(logout, triggerSessionExpired),
  effect: () => safelyRemove(AUTH_STORAGE_KEY),
});

listenerMiddleware.startListening({
  matcher: isAnyOf(setTheme, toggleTheme),
  effect: (_action, listenerApi) => {
    const { theme } = (listenerApi.getState() as PersistenceState).ui;
    safelyWrite(storageKeys.theme, theme);
  },
});

listenerMiddleware.startListening({
  actionCreator: toggleSidebar,
  effect: (_action, listenerApi) => {
    const { sidebarCollapsed } = (listenerApi.getState() as PersistenceState).ui;
    safelyWrite(storageKeys.sidebarCollapsed, String(sidebarCollapsed));
  },
});

listenerMiddleware.startListening({
  actionCreator: setSelectedAcademicYear,
  effect: (action) => safelyWrite(storageKeys.academicYear, action.payload),
});

