import { baseApi } from '@/src/lib/api/base-api';
import type { AdmissionCatalogData } from '../rules';
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
  | 'reportingStartDate'
  | 'reportingEndDate'
>;

interface AdmissionStatusUpdate {
  id: string;
  status: AdmissionApplicationStatus;
  sectionId?: string;
  roll?: number;
  academicYearId?: string;
  formSerialNo?: string;
  verifiedDocuments?: Record<string, boolean>;
  reportingStartDate?: string;
  reportingEndDate?: string;
}

export const admissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicAdmissionCatalog: builder.query<AdmissionCatalogData, void>({
      query: () => ({ url: '/public/admissions/catalog', method: 'GET' }),
      transformResponse: (response: any) => response?.data ?? response,
      providesTags: ['Academic', 'Admissions'],
    }),
    getPublicAdmissionStatus: builder.query<
      OnlineAdmissionApplication,
      { applicationNumber?: string; birthCertificateNo?: string }
    >({
      query: (params) => ({
        url: '/public/admissions/status',
        method: 'GET',
        params,
      }),
      transformResponse: (response: any) => response?.data ?? response,
    }),
    submitAdmissionApplication: builder.mutation<
      OnlineAdmissionApplication,
      AdmissionSubmission
    >({
      query: (body) => ({ url: '/public/admissions', method: 'POST', body }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Admissions', 'Notifications'],
    }),
    getAdminAdmissions: builder.query<
      OnlineAdmissionApplication[],
      { status?: string; targetClassId?: string; search?: string } | void
    >({
      query: (params) => ({
        url: '/admin/admissions',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: any) => {
        const raw = response?.data ?? response;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['Admissions'],
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
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Admissions', 'Students', 'Audit'],
    }),
  }),
});

export const {
  useGetPublicAdmissionCatalogQuery,
  useLazyGetPublicAdmissionStatusQuery,
  useGetAdminAdmissionsQuery,
  useSubmitAdmissionApplicationMutation,
  useUpdateAdmissionStatusMutation,
} = admissionApi;

