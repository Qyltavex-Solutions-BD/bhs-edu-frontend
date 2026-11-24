import { baseApi } from '@/src/lib/api/base-api';

export const adminOperationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    toggleArchive: builder.mutation<
      unknown,
      { collection: 'exams' | 'gradingScales' | 'staffStructures'; id: string }
    >({
      query: (body) => ({ url: '/archive/toggle', method: 'POST', body }),
      invalidatesTags: ['Exams', 'Staff', 'Audit'],
    }),
  }),
});

export const { useToggleArchiveMutation } = adminOperationsApi;

