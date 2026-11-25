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
      invalidatesTags: ['Bootstrap'],
    }),
    refreshSession: builder.mutation<LoginResponseData, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST', body: {} }),
      transformResponse: unwrap<LoginResponseData>,
    }),
    logoutUser: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST', body: {} }),
    }),
    getAuthProfile: builder.query<unknown, void>({
      query: () => ({ url: '/auth/me', method: 'GET' }),
      transformResponse: unwrap<unknown>,
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
  useRegisterUserMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} = authApi;

