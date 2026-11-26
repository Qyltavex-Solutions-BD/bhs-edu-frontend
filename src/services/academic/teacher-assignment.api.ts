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
  staffId?: string;
  canEnterMarks?: boolean;
  assignedDate?: string;
  releasedDate?: string;
  isActive?: boolean;
}

export interface QueryTeacherAssignmentParams {
  academicYearId?: string;
  staffId?: string;
  classId?: string;
  sectionId?: string;
  classSubjectId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTeacherAssignmentsResponse {
  items: TeacherAssignmentItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
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
        if (raw && Array.isArray(raw.items)) return raw.items;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['Academic'],
    }),

    getTeacherAssignmentsPaginated: builder.query<
      PaginatedTeacherAssignmentsResponse,
      QueryTeacherAssignmentParams
    >({
      query: (params) => ({
        url: '/academic/teacher-assignments',
        method: 'GET',
        params: { page: 1, limit: 15, ...params },
      }),
      transformResponse: (response: any): PaginatedTeacherAssignmentsResponse => {
        const raw = response?.data ?? response;
        if (raw && Array.isArray(raw.items)) return raw;
        const items = Array.isArray(raw) ? raw : [];
        const meta = response?.meta ?? {
          total: items.length,
          page: 1,
          limit: items.length || 15,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        };
        return { items, meta };
      },
      providesTags: ['Academic'],
    }),

    getMyTeacherAssignments: builder.query<TeacherAssignmentItem[], void>({
      query: () => ({
        url: '/academic/teacher-assignments/my-assignments',
        method: 'GET',
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

    releaseTeacherAssignment: builder.mutation<
      TeacherAssignmentItem,
      { id: string; releasedDate?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/academic/teacher-assignments/${id}/release`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),
  }),
});

export const {
  useGetTeacherAssignmentsQuery,
  useGetTeacherAssignmentsPaginatedQuery,
  useGetMyTeacherAssignmentsQuery,
  useAssignTeacherMutation,
  useUpdateTeacherAssignmentMutation,
  useReleaseTeacherAssignmentMutation,
} = teacherAssignmentApi;
