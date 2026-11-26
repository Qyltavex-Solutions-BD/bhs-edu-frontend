import { baseApi } from '@/src/lib/api/base-api';
import { env } from '@/src/lib/env';
import type { CardStatus } from '@/src/types/enums';
import type {
  Department,
  Staff,
  StaffStructure,
  StudentRFIDcard,
} from '@/src/types/entities';

import type { ApiRequest, ApiError } from '@/src/lib/api/hybrid-base-query';

export interface StaffProfileData extends Staff {
  department: Department | null;
  teacherAssignments: {
    isActive: boolean;
    id: string;
    academicYear: { isActive: boolean };
    section: { name: string } | null;
    classSubject: { subject: { name: string } };
  }[];
  sectionClassTeachers: {
    id: string;
    academicYear: { isActive: boolean };
    section: { name: string; schoolClass: { name: string } };
  }[];
}

export interface StaffWorkspace {
  staff: Staff[];
  departments: Department[];
  staffStructures: StaffStructure[];
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
type Page<T> = Envelope<T[]> & { meta: { hasNextPage: boolean } };
type Result = { data?: unknown; error?: ApiError };
type Request = (args: ApiRequest) => Result | PromiseLike<Result>;

async function readPages<T>(request: Request, url: string) {
  const records: T[] = [];
  for (let page = 1; ; page++) {
    const result = await request({ url, params: { page, limit: 100 } });
    if (result.error) return { error: result.error };
    const payload = result.data as Page<T>;
    records.push(...payload.data);
    if (!payload.meta.hasNextPage) return { data: records };
  }
}

export const staffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStaffWorkspace: builder.query<StaffWorkspace, void>({
      async queryFn(_arg, _api, _options, request) {
        const [staff, departments, posts] = await Promise.all([
          readPages<Staff>(request, '/staff'),
          readPages<Department>(request, '/staff/departments'),
          readPages<StaffStructure>(request, '/staff/structures'),
        ]);
        if (staff.error) return { error: staff.error };
        if (departments.error) return { error: departments.error };
        if (posts.error) return { error: posts.error };
        return { data: { staff: staff.data, departments: departments.data, staffStructures: posts.data } };
      },
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
    saveDepartment: builder.mutation<Department, Partial<Department>>({
      query: ({ id, ...body }) => ({ url: id ? `/staff/departments/${id}` : '/staff/departments', method: id ? 'PATCH' : 'POST', body }),
      invalidatesTags: ['Staff', 'Audit'],
    }),
    removeDepartment: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({ url: `/staff/departments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Staff', 'Audit'],
    }),
    saveStaffStructure: builder.mutation<StaffStructure, Partial<StaffStructure>>({
      query: ({ id, ...body }) => ({ url: id ? `/staff/structures/${id}` : '/staff/structures', method: id ? 'PATCH' : 'POST', body }),
      invalidatesTags: ['Staff', 'Audit'],
    }),
    updateRfidCardStatus: builder.mutation<
      StudentRFIDcard,
      { id: string; status: CardStatus; remarks?: string | null }
    >({
      query: (body) => ({ url: '/students/rfid/status', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
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
  useSaveDepartmentMutation,
  useRemoveDepartmentMutation,
  useSaveStaffStructureMutation,
  useUpdateRfidCardStatusMutation,
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

