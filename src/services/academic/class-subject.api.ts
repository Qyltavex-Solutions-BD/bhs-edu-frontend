import { schoolApi } from '@/src/store/api';
import type { ClassSubject } from '@/src/types/entities';

export interface AssignClassSubjectPayload {
  academicYearId: string;
  classId: string;
  subjectId: string;
  groupId?: string | null;
  isOptional?: boolean;
  displayOrder?: number;
}

export interface UpdateClassSubjectPayload {
  id: string;
  groupId?: string | null;
  isOptional?: boolean;
  displayOrder?: number;
}

export interface RolloverClassSubjectPayload {
  fromAcademicYearId: string;
  toAcademicYearId: string;
}

export interface QueryClassSubjectParams {
  academicYearId?: string;
  classId?: string;
  groupId?: string;
  isOptional?: boolean;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedClassSubjectsResponse {
  items: ClassSubject[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface RolloverResult {
  copiedCount: number;
  skippedCount: number;
}

export const classSubjectApi = schoolApi.injectEndpoints({
  endpoints: (builder) => ({
    getClassSubjects: builder.query<ClassSubject[], QueryClassSubjectParams | void>({
      query: (params) => ({
        url: '/academic/class-subjects',
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

    getClassSubjectsPaginated: builder.query<PaginatedClassSubjectsResponse, QueryClassSubjectParams>({
      query: (params) => ({
        url: '/academic/class-subjects',
        method: 'GET',
        params: { page: 1, limit: 15, ...params },
      }),
      transformResponse: (response: any): PaginatedClassSubjectsResponse => {
        const raw = response?.data ?? response;
        if (raw && Array.isArray(raw.items)) return raw;
        const items = Array.isArray(raw) ? raw : [];
        return {
          items,
          meta: {
            total: items.length,
            page: 1,
            limit: items.length || 15,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      },
      providesTags: ['Academic'],
    }),

    getClassSubjectById: builder.query<ClassSubject, string>({
      query: (id) => ({
        url: `/academic/class-subjects/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      providesTags: (_result, _error, id) => [{ type: 'Academic', id }],
    }),

    assignClassSubject: builder.mutation<ClassSubject, AssignClassSubjectPayload>({
      query: (body) => ({
        url: '/academic/class-subjects',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    updateClassSubject: builder.mutation<ClassSubject, UpdateClassSubjectPayload>({
      query: ({ id, ...updateBody }) => ({
        url: `/academic/class-subjects/${id}`,
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

    toggleClassSubjectActive: builder.mutation<ClassSubject, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/academic/class-subjects/${id}/toggle-status`,
        method: 'PATCH',
        params: { isActive },
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: (_result, _error, { id }) => [
        'Academic',
        'Bootstrap',
        { type: 'Academic', id },
      ],
    }),

    rolloverClassSubjects: builder.mutation<RolloverResult, RolloverClassSubjectPayload>({
      query: (body) => ({
        url: '/academic/class-subjects/rollover',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    deleteClassSubject: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/academic/class-subjects/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    getPublicCurriculum: builder.query<any, { classId: string; academicYearId?: string }>({
      query: ({ classId, academicYearId }) => ({
        url: `/academic/class-subjects/public/curriculum/${classId}`,
        method: 'GET',
        params: academicYearId ? { academicYearId } : undefined,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      providesTags: ['Academic'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetClassSubjectsQuery,
  useGetClassSubjectsPaginatedQuery,
  useGetClassSubjectByIdQuery,
  useAssignClassSubjectMutation,
  useUpdateClassSubjectMutation,
  useToggleClassSubjectActiveMutation,
  useRolloverClassSubjectsMutation,
  useDeleteClassSubjectMutation,
  useGetPublicCurriculumQuery,
} = classSubjectApi;
