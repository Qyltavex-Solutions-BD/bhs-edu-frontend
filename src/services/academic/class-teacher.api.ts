import { schoolApi } from '@/src/store/api';

export interface SectionClassTeacherItem {
  id: string;
  academicYearId: string;
  sectionId: string;
  staffId: string;
  assignedDate: string;
  section?: {
    id: string;
    name: string;
    classId: string;
    schoolClass?: {
      id: string;
      name: string;
      nameBn?: string | null;
      numericValue: number;
    };
  };
  staff?: {
    id: string;
    name: string;
    designation?: string | null;
    employeeId?: string | null;
  };
}

export const classTeacherApi = schoolApi.injectEndpoints({
  endpoints: (builder) => ({
    getClassTeachers: builder.query<SectionClassTeacherItem[], { academicYearId?: string } | void>({
      query: (params) => ({
        url: '/academic/class-teachers',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: any) => {
        const raw = res?.data ?? res;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['Academic'],
    }),

    assignClassTeacher: builder.mutation<
      SectionClassTeacherItem,
      { academicYearId: string; sectionId: string; staffId: string }
    >({
      query: (body) => ({
        url: '/academic/class-teachers',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    removeClassTeacher: builder.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `/academic/class-teachers/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetClassTeachersQuery,
  useAssignClassTeacherMutation,
  useRemoveClassTeacherMutation,
} = classTeacherApi;
