import { baseApi } from '@/src/lib/api/base-api';
import type { AuditLog } from '@/src/types/entities';
import type {
  AtRiskStudentRow,
  ClassTodayAttendanceRow,
  UpcomingScheduleItem,
} from '../components/AdminDashboardAttendanceInsights';

type Envelope<T> = { data: T };

export interface DashboardOverviewResponse {
  activeYearName: string;
  schoolName: string;
  eiin: string;
  activeStudentsCount: number;
  classesCount: number;
  teachersCount: number;
  otherStaffCount: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  presentRate: number;
  unpublishedExams: number;
  smsSent: number;
  smsFailed: number;
  gender: {
    maleCount: number;
    femaleCount: number;
    totalStudentsCount: number;
  };
  classDistData: Array<{ name: string; students: number }>;
}

export interface DashboardAttendanceTrendResponse {
  range: 'day' | 'week' | 'month';
  items: Array<{ date: string; present: number; late: number; absent: number }>;
}

export interface DashboardAttendanceInsightsResponse {
  classAttendance: ClassTodayAttendanceRow[];
  atRiskCount: number;
  atRiskStudents: AtRiskStudentRow[];
  upcomingItems: UpcomingScheduleItem[];
}

export interface DashboardExamPerformanceResponse {
  selectedExamId: string;
  examOptions: Array<{ key: string; label: string }>;
  subjects: Array<{ subject: string; avgPct: number }>;
  passRate: number | null;
}

export interface DashboardOperationsResponse {
  pendingCounts: {
    pendingAdmissions: number;
    failedSms: number;
    unpublishedExams: number;
    studentsWithoutRfid: number;
  };
  auditLogs: AuditLog[];
}

export const adminDashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardOverview: builder.query<DashboardOverviewResponse, void>({
      query: () => ({ url: '/admin/dashboard/overview', method: 'GET' }),
      transformResponse: (res: Envelope<DashboardOverviewResponse>) => res.data,
      providesTags: ['Attendance', 'Students', 'Staff', 'Academic', 'Exams'],
    }),
    getDashboardAttendanceTrend: builder.query<
      DashboardAttendanceTrendResponse,
      'day' | 'week' | 'month'
    >({
      query: (range) => ({
        url: '/admin/dashboard/attendance-trend',
        method: 'GET',
        params: { range },
      }),
      transformResponse: (res: Envelope<DashboardAttendanceTrendResponse>) => res.data,
      providesTags: ['Attendance'],
    }),
    getDashboardAttendanceInsights: builder.query<
      DashboardAttendanceInsightsResponse,
      void
    >({
      query: () => ({ url: '/admin/dashboard/attendance-insights', method: 'GET' }),
      transformResponse: (res: Envelope<DashboardAttendanceInsightsResponse>) => res.data,
      providesTags: ['Attendance', 'Academic', 'Exams'],
    }),
    getDashboardExamPerformance: builder.query<
      DashboardExamPerformanceResponse,
      string | void
    >({
      query: (examId) => ({
        url: '/admin/dashboard/exam-performance',
        method: 'GET',
        params: examId ? { examId } : undefined,
      }),
      transformResponse: (res: Envelope<DashboardExamPerformanceResponse>) => res.data,
      providesTags: ['Exams', 'Results'],
    }),
    getDashboardOperations: builder.query<DashboardOperationsResponse, void>({
      query: () => ({ url: '/admin/dashboard/operations', method: 'GET' }),
      transformResponse: (res: Envelope<DashboardOperationsResponse>) => res.data,
      providesTags: ['Admissions', 'Attendance', 'Exams', 'Students', 'Audit'],
    }),
  }),
});

export const {
  useGetDashboardOverviewQuery,
  useGetDashboardAttendanceTrendQuery,
  useGetDashboardAttendanceInsightsQuery,
  useGetDashboardExamPerformanceQuery,
  useGetDashboardOperationsQuery,
} = adminDashboardApi;
