import { baseApi } from '@/src/lib/api/base-api';

export interface PortalUserRole {
  id: string;
  name: string;
  description: string | null;
}

export interface PortalUserItem {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  isActive: boolean;
  mustSetPassword: boolean;
  createdAt: string;
  updatedAt: string;
  roles: PortalUserRole[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UsersPageResponse {
  items: PortalUserItem[];
  meta: PaginationMeta;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  module: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
  } | null;
}

export interface AuditLogsPageResponse {
  items: AuditLogEntry[];
  meta: PaginationMeta;
}

type Envelope<T> = { data: T };

export const accessControlApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<
      UsersPageResponse,
      {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
      }
    >({
      query: (params) => ({ url: '/users', method: 'GET', params }),
      transformResponse: (res: Envelope<UsersPageResponse>) => res.data,
      providesTags: ['AuthProfile'],
    }),
    getUserById: builder.query<PortalUserItem, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'GET' }),
      transformResponse: (res: Envelope<PortalUserItem>) => res.data,
      providesTags: ['AuthProfile'],
    }),
    createUser: builder.mutation<
      PortalUserItem,
      {
        name: string;
        phone: string;
        email?: string;
        password: string;
        roleName: 'ADMIN' | 'ACCOUNTANT';
      }
    >({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      transformResponse: (res: Envelope<PortalUserItem>) => res.data,
      invalidatesTags: ['AuthProfile', 'Audit'],
    }),
    updateUserStatus: builder.mutation<
      { id: string; isActive: boolean },
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/users/${id}/status`,
        method: 'PATCH',
        body: { isActive },
      }),
      transformResponse: (res: Envelope<{ id: string; isActive: boolean }>) =>
        res.data,
      invalidatesTags: ['AuthProfile', 'Audit'],
    }),
    resetUserPassword: builder.mutation<
      { id: string },
      { id: string; newPassword: string }
    >({
      query: ({ id, newPassword }) => ({
        url: `/users/${id}/reset-password`,
        method: 'POST',
        body: { newPassword },
      }),
      invalidatesTags: ['AuthProfile', 'Audit'],
    }),
    getAuditLogs: builder.query<
      AuditLogsPageResponse,
      {
        page?: number;
        limit?: number;
        module?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
      }
    >({
      query: (params) => ({ url: '/audit-logs', method: 'GET', params }),
      transformResponse: (res: Envelope<AuditLogsPageResponse>) => res.data,
      providesTags: ['Audit'],
    }),
    getAuditModules: builder.query<string[], void>({
      query: () => ({ url: '/audit-logs/modules', method: 'GET' }),
      transformResponse: (res: Envelope<string[]>) => res.data ?? [],
      providesTags: ['Audit'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserStatusMutation,
  useResetUserPasswordMutation,
  useGetAuditLogsQuery,
  useGetAuditModulesQuery,
} = accessControlApi;
