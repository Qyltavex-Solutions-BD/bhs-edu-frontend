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
    },
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
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
