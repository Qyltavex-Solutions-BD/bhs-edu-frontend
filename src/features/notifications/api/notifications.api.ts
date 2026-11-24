import { baseApi } from '@/src/lib/api/base-api';

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    markNotificationRead: builder.mutation<unknown, { id?: string }>({
      query: (body) => ({ url: '/notifications/read', method: 'POST', body }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const { useMarkNotificationReadMutation } = notificationsApi;

