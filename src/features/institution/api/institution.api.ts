import { baseApi } from '@/src/lib/api/base-api';
import type { SchoolProfile } from '@/src/types/entities';

export const institutionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    updateSchoolProfile: builder.mutation<SchoolProfile, Partial<SchoolProfile>>({
      query: (body) => ({
        url: '/admin/institution/profile',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Institution', 'Audit'],
    }),
  }),
});

export const { useUpdateSchoolProfileMutation } = institutionApi;

