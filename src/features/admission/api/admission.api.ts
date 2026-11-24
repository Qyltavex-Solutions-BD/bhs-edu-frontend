import { baseApi } from '@/src/lib/api/base-api';
import type {
  AdmissionApplicationStatus,
  OnlineAdmissionApplication,
} from '@/src/types/proposed/future';

type AdmissionSubmission = Omit<
  OnlineAdmissionApplication,
  | 'id'
  | 'applicationNumber'
  | 'status'
  | 'submittedAt'
  | 'admissionTestRoll'
  | 'admissionTestDate'
>;

interface AdmissionStatusUpdate {
  id: string;
  status: AdmissionApplicationStatus;
  sectionId?: string;
  roll?: number;
  academicYearId?: string;
  formSerialNo?: string;
  verifiedDocuments?: Record<string, boolean>;
}

export const admissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitAdmissionApplication: builder.mutation<
      OnlineAdmissionApplication,
      AdmissionSubmission
    >({
      query: (body) => ({ url: '/public/admissions', method: 'POST', body }),
      invalidatesTags: ['Admissions', 'Notifications'],
    }),
    updateAdmissionStatus: builder.mutation<
      OnlineAdmissionApplication,
      AdmissionStatusUpdate
    >({
      query: (body) => ({
        url: '/admin/admissions/status',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Admissions', 'Students', 'Audit'],
    }),
  }),
});

export const {
  useSubmitAdmissionApplicationMutation,
  useUpdateAdmissionStatusMutation,
} = admissionApi;

