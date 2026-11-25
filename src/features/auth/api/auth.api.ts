import { baseApi } from '@/src/lib/api/base-api';

export interface LoginPayload { email: string; password: string }
export interface LoginResponseData {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    roles: string[];
    permissions: string[];
  };
}

export interface AuthProfileStaff {
  id: string;
  employeeId?: string | null;
  name: string;
  designation: string;
  qualification?: string | null;
  staffType: string;
  phone?: string | null;
  email?: string | null;
  presentAddress?: string | null;
  permanentAddress?: string | null;
  emergencyContact?: string | null;
  joiningDate?: string | null;
  department?: { id: string; name: string; code?: string | null } | null;
}

export interface AuthProfileParent {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  occupation?: string | null;
  address?: string | null;
  students?: Array<{
    id: string;
    relationship?: string | null;
    student: {
      id: string;
      studentId?: string | null;
      nameEn?: string | null;
      nameBn?: string | null;
    };
  }>;
}

export interface AuthProfileData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  roles: string[];
  permissions: string[];
  staff: AuthProfileStaff | null;
  parent: AuthProfileParent | null;
  createdAt: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  qualification?: string;
  presentAddress?: string;
  permanentAddress?: string;
  emergencyContact?: string;
  occupation?: string;
  address?: string;
}

export interface ActiveSessionItem {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}
export interface VerifyOtpPayload {
  email: string;
  code: string;
  type: 'ACCOUNT_VERIFY' | 'PASSWORD_RESET';
}
export interface ResendOtpPayload {
  email: string;
  type: 'ACCOUNT_VERIFY' | 'PASSWORD_RESET';
}
export interface ForgotPasswordPayload { email: string }
export interface ResetPasswordPayload { resetToken: string; newPassword: string }
export interface ChangePasswordPayload { oldPassword: string; newPassword: string }

const unwrap = <T>(response: T | { data: T }): T =>
  response && typeof response === 'object' && 'data' in response
    ? (response as { data: T }).data
    : (response as T);

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    loginUser: builder.mutation<LoginResponseData, LoginPayload>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: unwrap<LoginResponseData>,
      invalidatesTags: ['Bootstrap', 'AuthProfile', 'AuthSessions'],
    }),
    refreshSession: builder.mutation<LoginResponseData, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST', body: {} }),
      transformResponse: unwrap<LoginResponseData>,
    }),
    logoutUser: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST', body: {} }),
    }),
    getAuthProfile: builder.query<AuthProfileData, void>({
      query: () => ({ url: '/auth/me', method: 'GET' }),
      transformResponse: unwrap<AuthProfileData>,
      providesTags: ['AuthProfile'],
    }),
    updateAuthProfile: builder.mutation<AuthProfileData, UpdateProfilePayload>({
      query: (body) => ({ url: '/auth/me', method: 'PATCH', body }),
      transformResponse: unwrap<AuthProfileData>,
      invalidatesTags: ['AuthProfile'],
    }),
    getAuthSessions: builder.query<ActiveSessionItem[], void>({
      query: () => ({ url: '/auth/sessions', method: 'GET' }),
      transformResponse: unwrap<ActiveSessionItem[]>,
      providesTags: ['AuthSessions'],
    }),
    revokeAuthSession: builder.mutation<void, string>({
      query: (sessionId) => ({
        url: `/auth/sessions/${encodeURIComponent(sessionId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AuthSessions'],
    }),
    revokeOtherAuthSessions: builder.mutation<{ revokedCount: number }, void>({
      query: () => ({ url: '/auth/sessions', method: 'DELETE' }),
      transformResponse: unwrap<{ revokedCount: number }>,
      invalidatesTags: ['AuthSessions'],
    }),
    registerUser: builder.mutation<
      { userId: string; email: string; isVerified: boolean },
      RegisterPayload
    >({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      transformResponse: unwrap<{ userId: string; email: string; isVerified: boolean }>,
    }),
    verifyOtp: builder.mutation<{ message: string }, VerifyOtpPayload>({
      query: (body) => ({ url: '/auth/verify-otp', method: 'POST', body }),
      transformResponse: unwrap<{ message: string }>,
    }),
    resendOtp: builder.mutation<{ message: string }, ResendOtpPayload>({
      query: (body) => ({ url: '/auth/resend-otp', method: 'POST', body }),
      transformResponse: unwrap<{ message: string }>,
    }),
    forgotPassword: builder.mutation<{ message: string }, ForgotPasswordPayload>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
      transformResponse: unwrap<{ message: string }>,
    }),
    resetPassword: builder.mutation<{ message: string }, ResetPasswordPayload>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
      transformResponse: unwrap<{ message: string }>,
    }),
    changePassword: builder.mutation<{ message: string }, ChangePasswordPayload>({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
      transformResponse: unwrap<{ message: string }>,
    }),
  }),
  overrideExisting: true,
});

export const {
  useLoginUserMutation,
  useRefreshSessionMutation,
  useLogoutUserMutation,
  useGetAuthProfileQuery,
  useUpdateAuthProfileMutation,
  useGetAuthSessionsQuery,
  useRevokeAuthSessionMutation,
  useRevokeOtherAuthSessionsMutation,
  useRegisterUserMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} = authApi;
