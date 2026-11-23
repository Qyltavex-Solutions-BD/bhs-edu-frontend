import { schoolApi } from '@/src/store/api';
import type { Subject } from '@/src/types/entities';
import { SubjectCategory } from '@/src/types/enums';

export interface CreateSubjectPayload {
  name: string;
  nameBn?: string;
  officialCode?: string;
  category?: SubjectCategory;
  description?: string;
  isActive?: boolean;
}

export interface UpdateSubjectPayload {
  id: string;
  name?: string;
  nameBn?: string;
  officialCode?: string;
  category?: SubjectCategory;
  description?: string;
  isActive?: boolean;
}

export interface QuerySubjectParams {
  search?: string;
  classId?: string;
}

export const subjectApi = schoolApi.injectEndpoints({
  endpoints: (builder) => ({
    getSubjects: builder.query<Subject[], QuerySubjectParams | void>({
      query: (params) => ({
        url: '/academic/subjects',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: any) => {
        const raw = response?.data ?? response;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['Academic'],
    }),

    getSubjectById: builder.query<Subject, string>({
      query: (id) => ({
        url: `/academic/subjects/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      providesTags: (_result, _error, id) => [{ type: 'Academic', id }],
    }),

    createSubject: builder.mutation<Subject, CreateSubjectPayload>({
      query: (body) => ({
        url: '/academic/subjects',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    updateSubject: builder.mutation<Subject, UpdateSubjectPayload>({
      query: ({ id, ...updateBody }) => ({
        url: `/academic/subjects/${id}`,
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

    deleteSubject: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/academic/subjects/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetSubjectsQuery,
  useGetSubjectByIdQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
} = subjectApi;
