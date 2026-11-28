import { baseApi } from '@/src/lib/api/base-api';
import type { SchoolProfile } from '@/src/types/entities';

export const institutionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInstitutionProfile: builder.query<SchoolProfile | null, void>({
      query: () => ({
        url: '/institution/profile',
        method: 'GET',
      }),
      transformResponse: (res: { data: SchoolProfile | null }) => res.data,
      providesTags: ['Institution'],
    }),
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

export const {
  useGetInstitutionProfileQuery,
  useUpdateSchoolProfileMutation,
} = institutionApi;

