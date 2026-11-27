import { schoolApi } from '@/src/store/api';
import { WeekDay } from '@/src/types/enums';

export interface CreateClassRoutinePayload {
  academicYearId: string;
  classId: string;
  sectionId: string;
  groupId?: string | null;
  classSubjectId?: string | null;
  staffId?: string | null;
  teacherAssignmentId?: string | null;
  day: WeekDay;
  periodNumber: number;
  periodName?: string;
  startTime: string;
  endTime: string;
  room?: string;
  isBreak?: boolean;
}

export interface UpdateClassRoutinePayload extends Partial<CreateClassRoutinePayload> {
  id: string;
  isActive?: boolean;
}

export interface QueryClassRoutineParams {
  academicYearId?: string;
  classId?: string;
  sectionId?: string;
  groupId?: string;
  staffId?: string;
  day?: WeekDay;
  room?: string;
}

export interface ClassRoutineSlot {
  id: string;
  academicYear: {
    id: string;
    year: number;
  };
  class: {
    id: string;
    name: string;
    numericValue: number;
  };
  section: {
    id: string;
    name: string;
  };
  group: {
    id: string;
    name: string;
  } | null;
  day: WeekDay;
  periodNumber: number;
  periodName?: string | null;
  isBreak: boolean;
  time: {
    startTime: string;
    endTime: string;
    displayTime: string;
  };
  room: string | null;
  subject: {
    id: string;
    classSubjectId: string;
    name: string;
    code?: string | null;
    category?: string | null;
  } | null;
  teacher: {
    id: string;
    name: string;
    staffId: string;
    designation: string | null;
  } | null;
  teacherAssignmentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SectionTimetablePeriodSlot {
  routineId: string;
  group: {
    id: string;
    name: string;
  } | null;
  subject: {
    id: string;
    classSubjectId: string;
    name: string;
    code?: string | null;
  } | null;
  teacher: {
    id: string;
    name: string;
    staffId: string;
    designation?: string | null;
  } | null;
  room: string | null;
  isBreak: boolean;
}

export interface SectionTimetablePeriod {
  periodNumber: number;
  periodName?: string | null;
  isBreak: boolean;
  time: {
    startTime: string;
    endTime: string;
    displayTime: string;
  };
  slots: SectionTimetablePeriodSlot[];
}

export interface SectionTimetableDay {
  day: WeekDay;
  periods: SectionTimetablePeriod[];
}

export interface SectionWeeklyRoutineResponse {
  section: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
    };
  };
  academicYear: {
    id: string;
    year: number;
  };
  timetable: SectionTimetableDay[];
}

export interface TeacherWeeklyRoutineClass {
  routineId: string;
  periodNumber: number;
  periodName?: string | null;
  time: {
    startTime: string;
    endTime: string;
    displayTime: string;
  };
  class: {
    id: string;
    name: string;
    numericValue: number;
  };
  section: {
    id: string;
    name: string;
  };
  group: {
    id: string;
    name: string;
  } | null;
  subject: {
    id: string;
    name: string;
    code?: string | null;
  } | null;
  room: string | null;
}

export interface TeacherWeeklyRoutineResponse {
  teacher: {
    id: string;
    name: string;
    employeeId?: string | null;
    designation?: string | null;
  };
  academicYear: {
    id?: string;
    name?: string;
  };
  weeklySchedule: Array<{
    day: WeekDay;
    totalClasses: number;
    classes: TeacherWeeklyRoutineClass[];
  }>;
}

export const classRoutineApi = schoolApi.injectEndpoints({
  endpoints: (builder) => ({
    getClassRoutines: builder.query<ClassRoutineSlot[], QueryClassRoutineParams | void>({
      query: (params) => ({
        url: '/class-routines',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: any) => {
        const raw = response?.data ?? response;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['Academic'],
    }),

    getSectionWeeklyRoutine: builder.query<
      SectionWeeklyRoutineResponse,
      { sectionId: string; academicYearId?: string; day?: WeekDay }
    >({
      query: ({ sectionId, academicYearId, day }) => ({
        url: `/class-routines/section/${sectionId}`,
        method: 'GET',
        params: {
          ...(academicYearId ? { academicYearId } : {}),
          ...(day ? { day } : {}),
        },
      }),
      transformResponse: (response: any) => response?.data ?? response,
      providesTags: ['Academic'],
    }),

    getTeacherWeeklyRoutine: builder.query<
      TeacherWeeklyRoutineResponse,
      { staffId: string; academicYearId?: string }
    >({
      query: ({ staffId, academicYearId }) => ({
        url: `/class-routines/teacher/${staffId}`,
        method: 'GET',
        params: academicYearId ? { academicYearId } : undefined,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      providesTags: ['Academic'],
    }),

    getClassRoutineById: builder.query<ClassRoutineSlot, string>({
      query: (id) => ({
        url: `/class-routines/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      providesTags: (_result, _error, id) => [{ type: 'Academic', id }],
    }),

    createClassRoutine: builder.mutation<ClassRoutineSlot, CreateClassRoutinePayload>({
      query: (body) => ({
        url: '/class-routines',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    updateClassRoutine: builder.mutation<ClassRoutineSlot, UpdateClassRoutinePayload>({
      query: ({ id, ...body }) => ({
        url: `/class-routines/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    deleteClassRoutine: builder.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `/class-routines/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),
  }),
});

export const {
  useGetClassRoutinesQuery,
  useGetSectionWeeklyRoutineQuery,
  useGetTeacherWeeklyRoutineQuery,
  useGetClassRoutineByIdQuery,
  useCreateClassRoutineMutation,
  useUpdateClassRoutineMutation,
  useDeleteClassRoutineMutation,
} = classRoutineApi;
