import { baseApi } from '@/src/lib/api/base-api';
import type { MockDatabase } from '@/src/mocks/seed';

export const bootstrapApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBootstrap: builder.query<MockDatabase, void>({
      query: () => ({ url: '/bootstrap', method: 'GET' }),
      providesTags: [
        'Bootstrap',
        'Institution',
        'Students',
        'Staff',
        'Academic',
        'Attendance',
        'Exams',
        'Results',
        'Notices',
        'Admissions',
        'Notifications',
        'Audit',
      ],
    }),
  }),
});

export const { useGetBootstrapQuery } = bootstrapApi;

