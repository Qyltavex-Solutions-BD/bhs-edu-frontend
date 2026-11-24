import { baseApi } from '@/src/lib/api/base-api';
import type { CardStatus } from '@/src/types/enums';
import type {
  Department,
  Staff,
  StaffStructure,
  StudentRFIDcard,
} from '@/src/types/entities';

export const staffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createStaff: builder.mutation<Staff, Partial<Staff>>({
      query: (body) => ({ url: '/staff', method: 'POST', body }),
      invalidatesTags: ['Staff', 'Audit'],
    }),
    updateStaff: builder.mutation<Staff, Partial<Staff> & { id: string }>({
      query: (body) => ({ url: '/staff/update', method: 'POST', body }),
      invalidatesTags: ['Staff', 'Audit'],
    }),
    saveDepartment: builder.mutation<Department, Partial<Department>>({
      query: (body) => ({ url: '/staff/departments', method: 'POST', body }),
      invalidatesTags: ['Staff', 'Audit'],
    }),
    removeDepartment: builder.mutation<{ id: string }, { id: string }>({
      query: (body) => ({ url: '/staff/departments/delete', method: 'POST', body }),
      invalidatesTags: ['Staff', 'Audit'],
    }),
    saveStaffStructure: builder.mutation<StaffStructure, Partial<StaffStructure>>({
      query: (body) => ({ url: '/staff/structures', method: 'POST', body }),
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
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useSaveDepartmentMutation,
  useRemoveDepartmentMutation,
  useSaveStaffStructureMutation,
  useUpdateRfidCardStatusMutation,
} = staffApi;

