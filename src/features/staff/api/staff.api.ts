import { baseApi } from '@/src/lib/api/base-api';
import { env } from '@/src/lib/env';
import type { CardStatus } from '@/src/types/enums';
import type {
  Department,
  Staff,
  StaffStructure,
  StudentRFIDcard,
} from '@/src/types/entities';

export interface StaffProfileData extends Staff {
  department: Department | null;
  teacherAssignments: {
    isActive: boolean;
    id: string;
    section: { name: string } | null;
    classSubject: { subject: { name: string } };
  }[];
  sectionClassTeachers: {
    id: string;
    section: { name: string; schoolClass: { name: string } };
  }[];
}

export interface StaffWorkspace {
  departments: Pick<Department, 'id' | 'name' | 'status'>[];
  staffStructures: Pick<
    StaffStructure,
    'id' | 'designation' | 'staffType' | 'departmentId' | 'isActive'
  >[];
}

export interface StaffPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface StaffPageResult {
  items: Staff[];
  meta: StaffPaginationMeta;
}

export interface StaffStatistics {
  totalStaff: number;
  activeStaff: number;
  activeNonTeachers: number;
  activeTeachers: number;
  activeOfficers: number;
  activeEmployees: number;
  formerTeachers: number;
  formerStaff: number;
}

export interface StaffQueryParams {
  staffType?: string;
  status?: string;
  isFormer?: boolean;
  departmentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

type Envelope<T> = { data: T };

export const staffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStaffWorkspace: builder.query<StaffWorkspace, void>({
      query: () => ({ url: '/staff/options' }),
      transformResponse: (response: Envelope<StaffWorkspace>) => response.data,
      providesTags: ['Staff'],
    }),
    getStaffProfile: builder.query<StaffProfileData, string>({
      query: (id) => ({ url: `/staff/${id}` }),
      transformResponse: (response: Envelope<StaffProfileData>) => response.data,
      providesTags: ['Staff'],
    }),
    archiveStaffStructure: builder.mutation<void, string>({
      query: (id) => ({ url: `/staff/structures/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Staff', 'Audit'],
    }),
    getStaffPage: builder.query<StaffPageResult, StaffQueryParams | void>({
      query: (params) => ({
        url: '/staff',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (
        response: Envelope<Staff[]> & { meta?: StaffPaginationMeta }
      ): StaffPageResult => ({
        items: response.data ?? [],
        meta: response.meta ?? {
          total: response.data?.length ?? 0,
          page: 1,
          limit: 15,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }),
      providesTags: ['Staff'],
    }),
    getStaffStatistics: builder.query<StaffStatistics, void>({
      query: () => ({ url: '/staff/statistics', method: 'GET' }),
      transformResponse: (response: Envelope<StaffStatistics>) => response.data,
      providesTags: ['Staff'],
    }),
    getStaff: builder.query<Staff[], StaffQueryParams | void>({
      query: (params) => ({
        url: '/staff',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: Envelope<Staff[]>) => response.data,
      providesTags: ['Staff'],
    }),
    createStaff: builder.mutation<Staff, FormData | Partial<Staff>>({
      query: (body) => ({ url: '/staff', method: 'POST', body }),
      invalidatesTags: ['Staff', 'Audit'],
    }),
    updateStaff: builder.mutation<
      Staff,
      { id: string; body: FormData | Partial<Staff> }
    >({
      query: ({ id, body }) => ({ url: `/staff/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Staff', 'Audit'],
    }),
    deleteStaff: builder.mutation<void, string>({
      query: (id) => ({ url: `/staff/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Staff', 'Audit'],
    }),
    createStaffPortalAccount: builder.mutation<
      Staff,
      { id: string; portalRole?: 'TEACHER' | 'ACCOUNTANT' }
    >({
      query: ({ id, portalRole }) => ({
        url: `/staff/${id}/portal-account`,
        method: 'POST',
        body: portalRole ? { portalRole } : {},
      }),
      transformResponse: (response: Envelope<Staff>) => response.data,
      invalidatesTags: ['Staff', 'Audit'],
    }),
    saveDepartment: builder.mutation<Department, Partial<Department>>({
      query: ({ id, ...body }) => ({
        url: id ? `/staff/departments/${id}` : '/staff/departments',
        method: id ? 'PATCH' : 'POST',
        body,
      }),
      invalidatesTags: ['Staff', 'Audit'],
    }),
    removeDepartment: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({ url: `/staff/departments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Staff', 'Audit'],
    }),
    saveStaffStructure: builder.mutation<StaffStructure, Partial<StaffStructure>>({
      query: ({ id, ...body }) => ({
        url: id ? `/staff/structures/${id}` : '/staff/structures',
        method: id ? 'PATCH' : 'POST',
        body,
      }),
      invalidatesTags: ['Staff', 'Audit'],
    }),
  }),
});

export const {
  useGetStaffQuery,
  useGetStaffPageQuery,
  useGetStaffStatisticsQuery,
  useGetStaffWorkspaceQuery,
  useGetStaffProfileQuery,
  useArchiveStaffStructureMutation,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useCreateStaffPortalAccountMutation,
  useSaveDepartmentMutation,
  useRemoveDepartmentMutation,
  useSaveStaffStructureMutation,
} = staffApi;

export function resolveStaffPhotoUrl(photo?: string | null): string | null {
  if (!photo) return null;
  if (photo.startsWith('http://') || photo.startsWith('https://') || photo.startsWith('data:')) {
    return photo;
  }
  if (photo.startsWith('/')) {
    return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}${photo}`;
  }
  return photo;
}
