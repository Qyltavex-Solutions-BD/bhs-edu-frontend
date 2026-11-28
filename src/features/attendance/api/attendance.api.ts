import { baseApi } from '@/src/lib/api/base-api';
import type { AttendanceMethod, AttendanceStatus, SmsStatus } from '@/src/types/enums';
import type { AcademicYear, SchoolClass, Section } from '@/src/types/entities';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DailyAttendanceItem {
  studentEnrollmentId: string;
  studentId: string;
  studentCode: string;
  nameBn: string;
  nameEn: string;
  roll: number;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  rfidCardNumber: string | null;
  attendance: {
    id: string;
    status: AttendanceStatus;
    method: AttendanceMethod;
    inTime: string | null;
    outTime: string | null;
    remarks: string | null;
  } | null;
}

export interface DailyAttendanceResponse {
  date: string;
  isClosedDay: boolean;
  closedReason: string | null;
  stats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
    unmarked: number;
    rfidCount: number;
    manualCount: number;
  };
  items: DailyAttendanceItem[];
  meta: PaginationMeta;
}

export interface RfidScanItem {
  id: string;
  cardNumber: string;
  studentId: string | null;
  studentCode: string | null;
  studentName: string | null;
  className: string | null;
  roll: number | null;
  scannedAt: string;
  deviceLocation: string;
  direction: 'ENTRY' | 'EXIT';
  isKnownCard: boolean;
}

export interface RfidScansResponse {
  items: RfidScanItem[];
  meta: PaginationMeta;
  stats: {
    totalToday: number;
    knownToday: number;
    unknownToday: number;
  };
}

export interface MonthlySectionReportItem {
  studentEnrollmentId: string;
  studentId: string;
  studentCode: string;
  nameBn: string;
  nameEn: string;
  className: string;
  sectionName: string;
  roll: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  markedDays: number;
  rate: number | null;
}

export interface MonthlyClassSummaryRow {
  classId: string;
  className: string;
  numericValue: number;
  totalStudents: number;
  totalMarked: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  leaveCount: number;
  rate: number | null;
}

export type AttendanceReportResponse =
  | {
      view: 'section';
      summary: {
        workingDays: number;
        totalStudents: number;
        avgRate: number | null;
        atRiskCount: number;
      };
      items: MonthlySectionReportItem[];
      meta: PaginationMeta;
    }
  | {
      view: 'summary';
      summaryRows: MonthlyClassSummaryRow[];
    };

export interface AttendanceSmsLogItem {
  id: string;
  attendanceId: string;
  parentId: string;
  parentName: string;
  studentName: string;
  studentCode: string;
  className: string;
  sectionName: string;
  roll: number;
  date: string;
  smsType: 'ENTRY' | 'EXIT' | 'ABSENT';
  phone: string;
  message: string;
  status: SmsStatus;
  sentAt: string | null;
  createdAt: string;
}

export interface AttendanceSmsLogsResponse {
  items: AttendanceSmsLogItem[];
  meta: PaginationMeta;
  stats: {
    total: number;
    sent: number;
    pending: number;
    failed: number;
  };
}

export interface AttendanceConfigItem {
  classId: string;
  className: string;
  numericValue: number;
  method: AttendanceMethod;
  lateThresholdTime: string;
  autoSmsOnAbsent: boolean;
  autoSmsOnEntry: boolean;
  autoSmsOnExit: boolean;
  totalStudents: number;
  studentsWithCard: number;
}

export interface AttendanceConfigsResponse {
  items: AttendanceConfigItem[];
  kpis: {
    totalClasses: number;
    rfidClasses: number;
    totalActiveStudents: number;
    studentsWithCard: number;
    studentsWithoutCard: number;
  };
}

type Envelope<T> = { data: T };

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAttendanceAcademicYears: builder.query<AcademicYear[], void>({
      query: () => ({ url: '/academic/years', method: 'GET' }),
      transformResponse: (res: Envelope<AcademicYear[]>) => res.data ?? [],
      providesTags: ['Academic'],
    }),
    getAttendanceClasses: builder.query<SchoolClass[], void>({
      query: () => ({ url: '/academic/classes', method: 'GET', params: { isActive: true } }),
      transformResponse: (res: Envelope<SchoolClass[]>) => res.data ?? [],
      providesTags: ['Academic'],
    }),
    getAttendanceSections: builder.query<Section[], void>({
      query: () => ({ url: '/academic/sections', method: 'GET', params: { isActive: true } }),
      transformResponse: (res: Envelope<Section[]>) => res.data ?? [],
      providesTags: ['Academic'],
    }),
    getDailyAttendance: builder.query<
      DailyAttendanceResponse,
      {
        academicYearId: string;
        date: string;
        classId?: string;
        sectionId?: string;
        status?: 'ALL' | 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'UNMARKED';
        search?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({ url: '/attendance/daily', method: 'GET', params }),
      transformResponse: (res: Envelope<DailyAttendanceResponse>) => res.data,
      providesTags: ['Attendance'],
    }),
    saveAttendanceBatch: builder.mutation<
      { saved: number; smsQueued: number },
      {
        date: string;
        academicYearId: string;
        entries: Array<{
          studentEnrollmentId: string;
          status: AttendanceStatus;
          method: AttendanceMethod;
          remarks?: string;
        }>;
      }
    >({
      query: (body) => ({ url: '/attendance/batch', method: 'POST', body }),
      transformResponse: (res: Envelope<{ saved: number; smsQueued: number }>) => res.data,
      invalidatesTags: ['Attendance', 'Audit'],
    }),
    getRfidScans: builder.query<
      RfidScansResponse,
      {
        date?: string;
        direction?: 'ALL' | 'ENTRY' | 'EXIT';
        known?: 'ALL' | 'KNOWN' | 'UNKNOWN';
        search?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({ url: '/attendance/rfid/scans', method: 'GET', params }),
      transformResponse: (res: Envelope<RfidScansResponse>) => res.data,
      providesTags: ['Attendance'],
    }),
    simulateRfidScan: builder.mutation<
      RfidScanItem & { recorded: boolean; message: string },
      { cardNumber: string; direction: 'ENTRY' | 'EXIT'; date?: string }
    >({
      query: (body) => ({ url: '/attendance/rfid/simulate', method: 'POST', body }),
      transformResponse: (res: Envelope<RfidScanItem & { recorded: boolean; message: string }>) =>
        res.data,
      invalidatesTags: ['Attendance'],
    }),
    getAttendanceReports: builder.query<
      AttendanceReportResponse,
      {
        academicYearId: string;
        month: string;
        view: 'section' | 'summary';
        classId?: string;
        sectionId?: string;
        onlyAtRisk?: boolean;
        search?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({ url: '/attendance/reports', method: 'GET', params }),
      transformResponse: (res: Envelope<AttendanceReportResponse>) => res.data,
      providesTags: ['Attendance'],
    }),
    getAttendanceSmsLogs: builder.query<
      AttendanceSmsLogsResponse,
      {
        status?: 'ALL' | 'SENT' | 'PENDING' | 'FAILED';
        smsType?: 'ALL' | 'ENTRY' | 'EXIT' | 'ABSENT';
        date?: string;
        search?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({ url: '/attendance/sms-logs', method: 'GET', params }),
      transformResponse: (res: Envelope<AttendanceSmsLogsResponse>) => res.data,
      providesTags: ['Attendance'],
    }),
    retryAttendanceSms: builder.mutation<unknown, { id: string }>({
      query: (body) => ({ url: '/attendance/sms/retry', method: 'POST', body }),
      invalidatesTags: ['Attendance', 'Audit'],
    }),
    retryAllAttendanceSms: builder.mutation<{ retried: number }, void>({
      query: () => ({ url: '/attendance/sms/retry-all', method: 'POST', body: {} }),
      transformResponse: (res: Envelope<{ retried: number }>) => res.data,
      invalidatesTags: ['Attendance', 'Audit'],
    }),
    getAttendanceConfigs: builder.query<AttendanceConfigsResponse, { academicYearId: string }>({
      query: (params) => ({ url: '/attendance/config', method: 'GET', params }),
      transformResponse: (res: Envelope<AttendanceConfigsResponse>) => res.data,
      providesTags: ['Attendance'],
    }),
    updateAttendanceConfig: builder.mutation<
      unknown,
      {
        classId: string;
        method: AttendanceMethod;
        lateThresholdTime: string;
        autoSmsOnAbsent: boolean;
        autoSmsOnEntry: boolean;
        autoSmsOnExit: boolean;
      }
    >({
      query: (body) => ({ url: '/attendance/config', method: 'PUT', body }),
      invalidatesTags: ['Attendance', 'Audit'],
    }),
    getParentChildAttendance: builder.query<
      {
        summary: {
          totalDays: number;
          present: number;
          late: number;
          absent: number;
          leave: number;
          percentage: number;
        };
        records: Array<{
          id: string;
          date: string;
          status: AttendanceStatus;
          method: AttendanceMethod;
          inTime: string | null;
          outTime: string | null;
          remarks: string | null;
        }>;
      },
      { studentEnrollmentId: string; month?: string }
    >({
      query: ({ studentEnrollmentId, month }) => ({
        url: '/attendance/parent/child-monthly',
        method: 'GET',
        params: { studentEnrollmentId, ...(month ? { month } : {}) },
      }),
      transformResponse: (res: Envelope<any>) => res.data,
      providesTags: ['Attendance'],
    }),
    getParentSmsLogs: builder.query<
      {
        phone: string | null;
        total: number;
        items: Array<{
          id: string;
          smsType: 'ENTRY' | 'EXIT' | 'ABSENT';
          phone: string;
          message: string;
          status: SmsStatus;
          sentAt: string | null;
          createdAt: string;
          date: string;
          studentName: string;
        }>;
      },
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: '/attendance/parent/sms-logs',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: Envelope<any>) => res.data,
      providesTags: ['Attendance'],
    }),
  }),
});

export const {
  useGetAttendanceAcademicYearsQuery,
  useGetAttendanceClassesQuery,
  useGetAttendanceSectionsQuery,
  useGetDailyAttendanceQuery,
  useSaveAttendanceBatchMutation,
  useGetRfidScansQuery,
  useSimulateRfidScanMutation,
  useGetAttendanceReportsQuery,
  useGetAttendanceSmsLogsQuery,
  useRetryAttendanceSmsMutation,
  useRetryAllAttendanceSmsMutation,
  useGetAttendanceConfigsQuery,
  useUpdateAttendanceConfigMutation,
  useGetParentChildAttendanceQuery,
  useGetParentSmsLogsQuery,
} = attendanceApi;
