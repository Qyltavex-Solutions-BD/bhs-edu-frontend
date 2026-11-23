import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { PERMISSIONS } from '@/src/lib/permissions';

/**
 * SECURITY NOTE:
 * Sensitive auth tokens are kept strictly in Redux memory (never persisted to localStorage).
 * Demo login presets exist strictly for frontend preview and are clearly labeled in the UI.
 */

export type AppRole =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'PRINCIPAL'
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
  isDemoSession: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: AuthUser | null;
  role: AppRole | null;
  permissions: string[];
  sessionExpired: boolean;
}

export const DEMO_ACCOUNTS: Record<AppRole, { user: AuthUser; permissions: string[]; redirect: string }> = {
  SUPER_ADMIN: {
    user: {
      id: 'user-admin',
      name: 'মোঃ রফিকুল ইসলাম (ডেমো অ্যাডমিন)',
      email: 'admin@bhs.edu.bd',
      phone: '01711000001',
      role: 'SUPER_ADMIN',
      designation: 'সুপার অ্যাডমিন',
      isDemoSession: true,
    },
    permissions: Object.values(PERMISSIONS),
    redirect: '/admin',
  },
  SCHOOL_ADMIN: {
    user: {
      id: 'user-admin',
      name: 'বিদ্যালয় প্রশাসক (ডেমো)',
      email: 'office@bhs.edu.bd',
      phone: '01711000005',
      role: 'SCHOOL_ADMIN',
      designation: 'স্কুল অ্যাডমিন',
      isDemoSession: true,
    },
    permissions: Object.values(PERMISSIONS).filter((p) => p !== PERMISSIONS.ROLES_MANAGE),
    redirect: '/admin',
  },
  PRINCIPAL: {
    user: {
      id: 'user-principal',
      name: 'মোঃ শফিকুর রহমান (ডেমো প্রধান শিক্ষক)',
      email: 'principal@bhs.edu.bd',
      phone: '01711000002',
      role: 'PRINCIPAL',
      staffId: 'staff-1',
      designation: 'প্রধান শিক্ষক',
      isDemoSession: true,
    },
    permissions: Object.values(PERMISSIONS),
    redirect: '/admin',
  },
  TEACHER: {
    user: {
      id: 'user-teacher-1',
      name: 'মোঃ কামরুল হাসান (ডেমো শিক্ষক)',
      email: 'kamrul@bhs.edu.bd',
      phone: '01711000003',
      role: 'TEACHER',
      staffId: 'staff-3',
      designation: 'সিনিয়র সহকারী শিক্ষক (গণিত)',
      isDemoSession: true,
    },
    permissions: [PERMISSIONS.ATTENDANCE_MARK, PERMISSIONS.MARKS_ENTER],
    redirect: '/teacher/dashboard',
  },
  PARENT: {
    user: {
      id: 'user-parent-1',
      name: 'মোঃ আবুল কালাম (ডেমো অভিভাবক)',
      email: 'parent@bhs.edu.bd',
      phone: '01711000010',
      role: 'PARENT',
      parentId: 'par-1',
      designation: 'অভিভাবক (২ জন শিক্ষার্থী সংযুক্ত)',
      isDemoSession: true,
    },
    permissions: [],
    redirect: '/parent/dashboard',
  },
  STUDENT: {
    user: {
      id: 'user-student-1',
      name: 'তানভীর আহমেদ (ডেমো শিক্ষার্থী)',
      email: 'student@bhs.edu.bd',
      phone: '01711000020',
      role: 'STUDENT',
      studentId: 'stu-10-1',
      designation: '১০ম শ্রেণি, শাখা ক, রোল ১',
      isDemoSession: true,
    },
    permissions: [],
    redirect: '/student/dashboard',
  },
};

const initialState: AuthState = {
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
    loginWithDemoRole(state, action: PayloadAction<AppRole>) {
      const preset = DEMO_ACCOUNTS[action.payload];
      state.isAuthenticated = true;
      state.accessToken = `demo-in-memory-token-${action.payload.toLowerCase()}`;
      state.user = preset.user;
      state.role = action.payload;
      state.permissions = preset.permissions;
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
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      if (action.payload.user) state.user = action.payload.user;
      if (action.payload.role) state.role = action.payload.role;
      if (action.payload.permissions) state.permissions = action.payload.permissions;
      state.sessionExpired = false;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.user = null;
      state.role = null;
      state.permissions = [];
      state.sessionExpired = false;
    },
    triggerSessionExpired(state) {
      state.sessionExpired = true;
    },
    dismissSessionExpired(state) {
      state.sessionExpired = false;
    },
  },
});

export const {
  loginWithDemoRole,
  setCredentials,
  logout,
  triggerSessionExpired,
  dismissSessionExpired,
} = authSlice.actions;

export default authSlice.reducer;
