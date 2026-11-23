import { schoolApi } from '@/src/store/api';
import type { AcademicGroup } from '@/src/types/entities';

export interface CreateAcademicGroupPayload {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateAcademicGroupPayload {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export const academicGroupApi = schoolApi.injectEndpoints({
  endpoints: (builder) => ({
    getAcademicGroups: builder.query<AcademicGroup[], void>({
      query: () => ({
        url: '/academic/groups',
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        const raw = response?.data ?? response;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['Academic'],
    }),

    getAcademicGroupById: builder.query<AcademicGroup, string>({
      query: (id) => ({
        url: `/academic/groups/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      providesTags: (_result, _error, id) => [{ type: 'Academic', id }],
    }),

    createAcademicGroup: builder.mutation<AcademicGroup, CreateAcademicGroupPayload>({
      query: (body) => ({
        url: '/academic/groups',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    updateAcademicGroup: builder.mutation<AcademicGroup, UpdateAcademicGroupPayload>({
      query: ({ id, ...updateBody }) => ({
        url: `/academic/groups/${id}`,
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

    deleteAcademicGroup: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/academic/groups/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetAcademicGroupsQuery,
  useGetAcademicGroupByIdQuery,
  useCreateAcademicGroupMutation,
  useUpdateAcademicGroupMutation,
  useDeleteAcademicGroupMutation,
} = academicGroupApi;
