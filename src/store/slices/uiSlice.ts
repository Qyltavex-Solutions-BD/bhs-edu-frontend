import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UiState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  enableStudentPortal: boolean;
  enableFutureModules: boolean;
  selectedAcademicYearId: string | null;
}

const initialState: UiState = {
  theme: 'light',
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  enableStudentPortal: process.env.NEXT_PUBLIC_ENABLE_STUDENT_PORTAL === 'true',
  enableFutureModules: process.env.NEXT_PUBLIC_ENABLE_FUTURE_MODULES === 'true',
  selectedAcademicYearId: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    hydratePreferences(
      state,
      action: PayloadAction<{
        theme: 'light' | 'dark';
        sidebarCollapsed: boolean;
        selectedAcademicYearId: string | null;
      }>
    ) {
      state.theme = action.payload.theme;
      state.sidebarCollapsed = action.payload.sidebarCollapsed;
      state.selectedAcademicYearId = action.payload.selectedAcademicYearId;
    },
    setSelectedAcademicYear(state, action: PayloadAction<string>) {
      state.selectedAcademicYearId = action.payload;
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('bhs_academic_year', action.payload);
        }
      } catch {
        // ignore restricted storage
      }
    },
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload;
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('bhs_theme', action.payload);
        }
      } catch {
        // ignore
      }
    },
    toggleTheme(state) {
      const next = state.theme === 'light' ? 'dark' : 'light';
      state.theme = next;
      try {
        if (typeof window !== 'undefined') window.localStorage.setItem('bhs_theme', next);
      } catch {
        // ignore
      }
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('bhs_sidebar_collapsed', String(state.sidebarCollapsed));
        }
      } catch {
        // ignore
      }
    },
    setCommandPaletteOpen(state, action: PayloadAction<boolean>) {
      state.commandPaletteOpen = action.payload;
    },
    setEnableStudentPortal(state, action: PayloadAction<boolean>) {
      state.enableStudentPortal = action.payload;
    },
    setEnableFutureModules(state, action: PayloadAction<boolean>) {
      state.enableFutureModules = action.payload;
    },
  },
});

export const {
  hydratePreferences,
  setSelectedAcademicYear,
  setTheme,
  toggleTheme,
  toggleSidebar,
  setCommandPaletteOpen,
  setEnableStudentPortal,
  setEnableFutureModules,
} = uiSlice.actions;

export default uiSlice.reducer;
