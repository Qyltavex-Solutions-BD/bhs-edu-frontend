import { baseApi } from '@/src/lib/api/base-api';
import type { AttendanceMethod, AttendanceStatus } from '@/src/types/enums';
import type { ClassAttendanceMethodConfig } from '@/src/types/proposed/future';

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    saveAttendanceBatch: builder.mutation<
      { saved: number; smsQueued: number },
      {
        date: string;
        markedBy: string;
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
      invalidatesTags: ['Attendance', 'Audit'],
    }),
    retryAttendanceSms: builder.mutation<unknown, { id: string }>({
      query: (body) => ({ url: '/attendance/sms/retry', method: 'POST', body }),
      invalidatesTags: ['Attendance', 'Audit'],
    }),
    retryAllAttendanceSms: builder.mutation<{ retried: number }, void>({
      query: () => ({ url: '/attendance/sms/retry-all', method: 'POST', body: {} }),
      invalidatesTags: ['Attendance', 'Audit'],
    }),
    updateAttendanceConfig: builder.mutation<
      ClassAttendanceMethodConfig,
      ClassAttendanceMethodConfig
    >({
      query: (body) => ({ url: '/attendance/config', method: 'PUT', body }),
      invalidatesTags: ['Attendance', 'Audit'],
    }),
    simulateRfidScan: builder.mutation<
      {
        id: string;
        cardNumber: string;
        studentId: string | null;
        studentName: string | null;
        className: string | null;
        scannedAt: string;
        deviceLocation: string;
        direction: 'ENTRY' | 'EXIT';
        isKnownCard: boolean;
        recorded?: boolean;
        message?: string;
      },
      { cardNumber: string; direction: 'ENTRY' | 'EXIT'; date?: string }
    >({
      query: (body) => ({ url: '/attendance/rfid/simulate', method: 'POST', body }),
      invalidatesTags: ['Attendance'],
    }),
  }),
});

export const {
  useSaveAttendanceBatchMutation,
  useRetryAttendanceSmsMutation,
  useRetryAllAttendanceSmsMutation,
  useUpdateAttendanceConfigMutation,
  useSimulateRfidScanMutation,
} = attendanceApi;

