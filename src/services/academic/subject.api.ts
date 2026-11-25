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
  category?: SubjectCategory;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedSubjectsResponse {
  items: Subject[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
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
        if (raw && Array.isArray(raw.items)) return raw.items;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['Academic'],
    }),

    getSubjectsPaginated: builder.query<PaginatedSubjectsResponse, QuerySubjectParams>({
      query: (params) => ({
        url: '/academic/subjects',
        method: 'GET',
        params: { page: 1, limit: 12, ...params },
      }),
      transformResponse: (response: any): PaginatedSubjectsResponse => {
        const raw = response?.data ?? response;
        if (raw && Array.isArray(raw.items)) return raw;
        const items = Array.isArray(raw) ? raw : [];
        return {
          items,
          meta: {
            total: items.length,
            page: 1,
            limit: items.length || 12,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
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
  useGetSubjectsPaginatedQuery,
  useGetSubjectByIdQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
} = subjectApi;
