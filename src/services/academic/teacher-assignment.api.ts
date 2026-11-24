import { schoolApi } from '@/src/store/api';

export interface AssignTeacherPayload {
  academicYearId: string;
  classId: string;
  sectionId: string;
  classSubjectId: string;
  staffId: string;
  assignedDate?: string;
  canEnterMarks?: boolean;
  replaceExisting?: boolean;
}

export interface UpdateTeacherAssignmentPayload {
  id: string;
  canEnterMarks?: boolean;
  staffId?: string;
}

export interface QueryTeacherAssignmentParams {
  academicYearId?: string;
  staffId?: string;
  classId?: string;
  sectionId?: string;
  classSubjectId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface TeacherAssignmentItem {
  id: string;
  staffId: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  classSubjectId: string;
  canEnterMarks: boolean;
  assignedDate: string;
  releasedDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  staff?: {
    id: string;
    name: string;
    employeeId?: string | null;
    designation?: string | null;
  };
  schoolClass?: {
    id: string;
    name: string;
    numericValue: number;
  };
  section?: {
    id: string;
    name: string;
  };
  classSubject?: {
    id: string;
    subject?: {
      id: string;
      name: string;
      nameBn?: string;
      officialCode?: string | null;
    };
  };
}

export const teacherAssignmentApi = schoolApi.injectEndpoints({
  endpoints: (builder) => ({
    getTeacherAssignments: builder.query<TeacherAssignmentItem[], QueryTeacherAssignmentParams | void>({
      query: (params) => ({
        url: '/academic/teacher-assignments',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: any) => {
        const raw = response?.data ?? response;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['Academic'],
    }),

    assignTeacher: builder.mutation<TeacherAssignmentItem, AssignTeacherPayload>({
      query: (body) => ({
        url: '/academic/teacher-assignments',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    updateTeacherAssignment: builder.mutation<TeacherAssignmentItem, UpdateTeacherAssignmentPayload>({
      query: ({ id, ...body }) => ({
        url: `/academic/teacher-assignments/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    releaseTeacherAssignment: builder.mutation<TeacherAssignmentItem, { id: string; releaseDate?: string; remarks?: string }>({
      query: ({ id, ...body }) => ({
        url: `/academic/teacher-assignments/${id}/release`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    deleteTeacherAssignment: builder.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `/academic/teacher-assignments/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),
  }),
});

export const {
  useGetTeacherAssignmentsQuery,
  useAssignTeacherMutation,
  useUpdateTeacherAssignmentMutation,
  useReleaseTeacherAssignmentMutation,
  useDeleteTeacherAssignmentMutation,
} = teacherAssignmentApi;
