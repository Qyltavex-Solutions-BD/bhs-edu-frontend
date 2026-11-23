import { schoolApi } from '@/src/store/api';
import type { AcademicYear } from '@/src/types/entities';

export interface CreateAcademicYearPayload {
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface UpdateAcademicYearPayload {
  id: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export const yearApi = schoolApi.injectEndpoints({
  endpoints: (builder) => ({
    getAcademicYears: builder.query<AcademicYear[], void>({
      query: () => ({
        url: '/academic/years',
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        const raw = response?.data ?? response;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['Academic'],
    }),

    getAcademicYearById: builder.query<AcademicYear, string>({
      query: (id) => ({
        url: `/academic/years/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      providesTags: (_result, _error, id) => [{ type: 'Academic', id }],
    }),

    getCurrentAcademicYear: builder.query<AcademicYear, void>({
      query: () => ({
        url: '/academic/years/current',
        method: 'GET',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      providesTags: ['Academic'],
    }),

    createAcademicYear: builder.mutation<AcademicYear, CreateAcademicYearPayload>({
      query: (body) => ({
        url: '/academic/years',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    updateAcademicYear: builder.mutation<AcademicYear, UpdateAcademicYearPayload>({
      query: ({ id, ...updateBody }) => ({
        url: `/academic/years/${id}`,
        method: 'PATCH',
        body: updateBody,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: (_result, _error, { id }) => [
        'Academic',
        'Bootstrap',
        { type: 'Academic', id },
      ],
    }),

    setActiveAcademicYear: builder.mutation<AcademicYear, { id: string }>({
      query: ({ id }) => ({
        url: `/academic/years/${id}/set-active`,
        method: 'PATCH',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    deleteAcademicYear: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/academic/years/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetAcademicYearsQuery,
  useGetAcademicYearByIdQuery,
  useGetCurrentAcademicYearQuery,
  useCreateAcademicYearMutation,
  useUpdateAcademicYearMutation,
  useSetActiveAcademicYearMutation,
  useDeleteAcademicYearMutation,
} = yearApi;
