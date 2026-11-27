import { schoolApi } from '@/src/store/api';

export interface ParentChildItem {
  mappingId: string;
  studentId: string;
  studentCustomId: string;
  studentName: string;
  studentNameEn: string;
  studentNameBn: string | null;
  gender: string;
  photo: string | null;
  relationship: string;
  isPrimary: boolean;
  isEmergencyContact: boolean;
  isSmsReceiver: boolean;
  currentClass: string | null;
  currentSection: string | null;
  currentRoll: number | null;
  academicYear: string | null;
}

export interface ParentDetailResponse {
  id: string;
  userId: string | null;
  user?: {
    id: string;
    isActive: boolean;
    mustSetPassword: boolean;
  } | null;
  name: string;
  nameBn: string | null;
  phone: string;
  email: string | null;
  nid: string | null;
  occupation: string | null;
  monthlyIncome: number | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
  childrenCount: number;
  children: ParentChildItem[];
}

export const parentApi = schoolApi.injectEndpoints({
  endpoints: (builder) => ({
    getParentById: builder.query<ParentDetailResponse, string>({
      query: (id) => ({
        url: `/academic/parents/${id}`,
        method: 'GET',
      }),
      transformResponse: (res: any) => res?.data ?? res,
      providesTags: (_result, _error, id) => [{ type: 'Academic', id: `PARENT-${id}` }],
    }),
  }),
  overrideExisting: true,
});

export const { useGetParentByIdQuery } = parentApi;
