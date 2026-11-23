import { schoolApi } from '@/src/store/api';
import type { AppRole } from '@/src/store/slices/authSlice';

export interface LoginPayload {
  email: string;
  password: string;
}

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

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export const authApi = schoolApi.injectEndpoints({
  endpoints: (builder) => ({
    loginUser: builder.mutation<LoginResponseData, LoginPayload>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Bootstrap'],
    }),

    getAuthProfile: builder.query<any, void>({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      }),
      transformResponse: (response: any) => response?.data ?? response,
    }),

    registerUser: builder.mutation<
      { userId: string; email: string; isVerified: boolean },
      RegisterPayload
    >({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
    }),

    verifyOtp: builder.mutation<{ message: string }, VerifyOtpPayload>({
      query: (body) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
    }),

    resendOtp: builder.mutation<{ message: string }, ResendOtpPayload>({
      query: (body) => ({
        url: '/auth/resend-otp',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
    }),

    forgotPassword: builder.mutation<{ message: string }, ForgotPasswordPayload>({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
    }),

    resetPassword: builder.mutation<{ message: string }, ResetPasswordPayload>({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
    }),

    changePassword: builder.mutation<{ message: string }, ChangePasswordPayload>({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
    }),
  }),
  overrideExisting: true,
});

export const {
  useLoginUserMutation,
  useGetAuthProfileQuery,
  useRegisterUserMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} = authApi;
