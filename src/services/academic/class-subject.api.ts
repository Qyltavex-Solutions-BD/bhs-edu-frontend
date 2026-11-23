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
  isActive?: boolean;
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
        return Array.isArray(raw) ? raw : [];
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
  }),
  overrideExisting: true,
});

export const {
  useGetClassSubjectsQuery,
  useGetClassSubjectByIdQuery,
  useAssignClassSubjectMutation,
  useUpdateClassSubjectMutation,
  useToggleClassSubjectActiveMutation,
  useRolloverClassSubjectsMutation,
  useDeleteClassSubjectMutation,
} = classSubjectApi;
