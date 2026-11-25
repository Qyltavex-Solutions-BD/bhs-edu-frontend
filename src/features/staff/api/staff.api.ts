import { baseApi } from '@/src/lib/api/base-api';
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
    getStaff: builder.query<
      Staff[],
      {
        staffType?: string;
        status?: string;
        departmentId?: string;
        search?: string;
        page?: number;
        limit?: number;
      } | void
    >({
      query: (params) => ({
        url: '/staff',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: Envelope<Staff[]>) => response.data,
      providesTags: ['Staff'],
    }),
    createStaff: builder.mutation<Staff, Partial<Staff>>({
      query: (body) => ({ url: '/staff', method: 'POST', body }),
      invalidatesTags: ['Staff', 'Audit'],
    }),
    updateStaff: builder.mutation<Staff, Partial<Staff> & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/staff/${id}`, method: 'PATCH', body }),
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
  useGetStaffWorkspaceQuery,
  useGetStaffProfileQuery,
  useArchiveStaffStructureMutation,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useSaveDepartmentMutation,
  useRemoveDepartmentMutation,
  useSaveStaffStructureMutation,
  useUpdateRfidCardStatusMutation,
} = staffApi;

