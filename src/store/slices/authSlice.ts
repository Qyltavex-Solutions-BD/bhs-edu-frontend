import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AppRole =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'PRINCIPAL'
  | 'ACCOUNTANT'
  | 'TEACHER'
  | 'PARENT'
  | 'STUDENT';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AppRole;
  staffId?: string;
  parentId?: string;
  studentId?: string;
  designation?: string;
}

export interface AuthState {
  isHydrated: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  user: AuthUser | null;
  role: AppRole | null;
  permissions: string[];
  sessionExpired: boolean;
}

export const AUTH_STORAGE_KEY = 'bhs_auth_user_meta';

const initialState: AuthState = {
  isHydrated: false,
  isAuthenticated: false,
  accessToken: null,
  user: null,
  role: null,
  permissions: [],
  sessionExpired: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    markAuthHydrated(state) {
      state.isHydrated = true;
    },
    hydrateAuth(
      state,
      action: PayloadAction<{
        accessToken: string;
        user: AuthUser;
        role: AppRole;
        permissions: string[];
      }>
    ) {
      state.isHydrated = true;
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.permissions = action.payload.permissions;
      state.sessionExpired = false;
    },
    setCredentials(
      state,
      action: PayloadAction<{
        accessToken: string;
        user?: AuthUser | any;
        role?: AppRole;
        permissions?: string[];
      }>
    ) {
      state.isHydrated = true;
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      if (action.payload.user) state.user = action.payload.user;
      if (action.payload.role) state.role = action.payload.role;
      if (action.payload.permissions) state.permissions = action.payload.permissions;
      state.sessionExpired = false;
    },
    logout(state) {
      state.isHydrated = true;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.user = null;
      state.role = null;
      state.permissions = [];
      state.sessionExpired = false;
    },
    triggerSessionExpired(state) {
      state.isHydrated = true;
      state.sessionExpired = true;
      state.isAuthenticated = false;
      state.accessToken = null;
    },
    dismissSessionExpired(state) {
      state.sessionExpired = false;
    },
  },
});

export const {
  markAuthHydrated,
  hydrateAuth,
  setCredentials,
  logout,
  triggerSessionExpired,
  dismissSessionExpired,
} = authSlice.actions;

export default authSlice.reducer;
