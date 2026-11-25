import { baseApi } from '@/src/lib/api/base-api';
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
  staffStructures: Pick<StaffStructure, 'id' | 'designation' | 'staffType' | 'departmentId' | 'isActive'>[];
}

type Envelope<T> = { data: T };
export type StaffPage<T> = Envelope<T[]> & {
  meta: { page: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
};
export interface StaffListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  hasVacancy?: boolean;
  staffGroup?: 'teachers' | 'employees';
  staffType?: string;
  departmentId?: string;
}
export type StaffListRow = Staff & { department: Pick<Department, 'name'> | null };
export type DepartmentListRow = Department & { activeStaffCount: number };
export type PostListRow = StaffStructure & { department: Pick<Department, 'name'> | null };
interface StaffStatistics {
  activeStaff: number;
  activeTeachers: number;
  activeNonTeachers: number;
  posts: { filled: number; total: number };
}
const listPaths = { staff: '/staff', departments: '/staff/departments', posts: '/staff/structures' };

export const staffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStaffWorkspace: builder.query<StaffWorkspace, void>({
      query: () => ({ url: '/staff/options' }),
      transformResponse: (response: Envelope<StaffWorkspace>) => response.data,
      providesTags: ['Staff'],
    }),
    getStaffPage: builder.query<StaffPage<StaffListRow>, StaffListParams>({
      query: (params) => ({ url: listPaths.staff, params }),
      providesTags: ['Staff'],
    }),
    getDepartmentPage: builder.query<StaffPage<DepartmentListRow>, StaffListParams>({
      query: (params) => ({ url: listPaths.departments, params }),
      providesTags: ['Staff'],
    }),
    getSanctionedPostPage: builder.query<StaffPage<PostListRow>, StaffListParams>({
      query: (params) => ({ url: listPaths.posts, params }),
      providesTags: ['Staff'],
    }),
    getStaffStatistics: builder.query<StaffStatistics, void>({
      query: () => ({ url: '/staff/statistics' }),
      transformResponse: (response: Envelope<StaffStatistics>) => response.data,
      providesTags: ['Staff'],
    }),
    exportStaffTable: builder.mutation<string, { list: keyof typeof listPaths; params: StaffListParams }>({
      query: ({ list, params }) => ({
        url: `${listPaths[list]}/export`,
        params,
        responseHandler: (response) => response.ok ? response.text() : response.json(),
      }),
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
  useGetStaffPageQuery,
  useGetDepartmentPageQuery,
  useGetSanctionedPostPageQuery,
  useGetStaffStatisticsQuery,
  useExportStaffTableMutation,
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

