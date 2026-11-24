import { baseApi } from '@/src/lib/api/base-api';

export const accessControlApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    toggleRolePermission: builder.mutation<
      unknown,
      { roleId: string; permissionId: string }
    >({
      query: (body) => ({ url: '/roles/permission-toggle', method: 'POST', body }),
      invalidatesTags: ['Audit', 'Bootstrap'],
    }),
  }),
});

export const { useToggleRolePermissionMutation } = accessControlApi;

