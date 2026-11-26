import { baseApi } from '@/src/lib/api/base-api';
import type { RelationshipType } from '@/src/types/enums';

export interface ParentPortalUser {
  id: string;
  isActive: boolean;
  mustSetPassword: boolean;
}

export interface ParentListItem {
  id: string;
  userId?: string | null;
  user?: ParentPortalUser | null;
  name: string;
  nameBn?: string | null;
  phone: string;
  email?: string | null;
  nid?: string | null;
  occupation?: string | null;
  monthlyIncome?: number | null;
  address?: string | null;
  childrenCount: number;
  smsCount: number;
  childrenSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParentsSummaryStats {
  totalParents: number;
  linkedActiveStudents: number;
  totalActiveStudents: number;
  activeSmsLinks: number;
  coverageGapCount: number;
}

export interface ParentsPageResult {
  items: ParentListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    stats?: ParentsSummaryStats;
  };
}

export interface ParentChildLink {
  mappingId: string;
  studentId: string;
  studentCustomId?: string | null;
  studentName: string;
  studentNameEn: string;
  studentNameBn?: string | null;
  gender?: string | null;
  photo?: string | null;
  relationship: RelationshipType;
  isPrimary: boolean;
  isEmergencyContact: boolean;
  isSmsReceiver: boolean;
  currentClass?: string | null;
  currentSection?: string | null;
  currentRoll?: number | null;
  academicYear?: string | null;
}

export interface ParentDetailData {
  id: string;
  userId?: string | null;
  user?: ParentPortalUser | null;
  name: string;
  nameBn?: string | null;
  phone: string;
  email?: string | null;
  nid?: string | null;
  occupation?: string | null;
  monthlyIncome?: number | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
  childrenCount: number;
  children: ParentChildLink[];
}

export interface ParentCoverageRow {
  id: string;
  studentId: string;
  name: string;
  nameEn: string;
  primaryParentId: string | null;
  primaryName: string;
  phone: string;
  emergency: number;
  sms: number;
  gap: boolean;
}

export interface ParentCoverageResult {
  items: ParentCoverageRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  summary: {
    activeStudents: number;
    fullCoverage: number;
    smsReady: number;
    gapCount: number;
  };
}

type Envelope<T> = { data: T };

export const parentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getParents: builder.query<
      ParentsPageResult,
      {
        page?: number;
        limit?: number;
        search?: string;
        portalStatus?: 'ALL' | 'ACTIVE' | 'PENDING' | 'NONE';
        sortBy?: 'name' | 'phone' | 'occupation' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      } | void
    >({
      query: (params) => ({
        url: '/academic/parents',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (
        response: Envelope<ParentListItem[]> & { meta?: ParentsPageResult['meta'] }
      ): ParentsPageResult => ({
        items: response.data ?? [],
        meta: response.meta ?? {
          total: response.data?.length ?? 0,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }),
      providesTags: ['Students'],
    }),
    getParentById: builder.query<ParentDetailData, string>({
      query: (id) => ({ url: `/academic/parents/${id}`, method: 'GET' }),
      transformResponse: (response: Envelope<ParentDetailData>) => response.data,
      providesTags: ['Students'],
    }),
    getParentCoverage: builder.query<
      ParentCoverageResult,
      {
        onlyGaps?: boolean;
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
      } | void
    >({
      query: (params) => ({
        url: '/academic/parents/coverage',
        method: 'GET',
        params: params
          ? {
              ...(params.onlyGaps ? { onlyGaps: 'true' } : {}),
              ...(params.search ? { search: params.search } : {}),
              ...(params.page ? { page: params.page } : {}),
              ...(params.limit ? { limit: params.limit } : {}),
              ...(params.sortBy ? { sortBy: params.sortBy } : {}),
              ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
            }
          : undefined,
      }),
      transformResponse: (response: Envelope<ParentCoverageResult>) => response.data,
      providesTags: ['Students'],
    }),
    updateParent: builder.mutation<
      ParentListItem,
      {
        id: string;
        name?: string;
        nameBn?: string;
        phone?: string;
        email?: string;
        nid?: string;
        occupation?: string;
        monthlyIncome?: number | null;
        address?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/academic/parents/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: Envelope<ParentListItem>) => response.data,
      invalidatesTags: ['Students', 'Audit'],
    }),
    removeParent: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/academic/parents/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Students', 'Audit'],
    }),
    updateParentLink: builder.mutation<
      unknown,
      {
        id: string;
        relationship?: RelationshipType;
        isPrimary?: boolean;
        isEmergencyContact?: boolean;
        isSmsReceiver?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/academic/parents/links/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Students', 'Audit'],
    }),
    createParentPortalAccount: builder.mutation<ParentListItem, string>({
      query: (id) => ({
        url: `/academic/parents/${id}/portal-account`,
        method: 'POST',
        body: {},
      }),
      transformResponse: (response: Envelope<ParentListItem>) => response.data,
      invalidatesTags: ['Students', 'Audit'],
    }),
    toggleParentPortalAccess: builder.mutation<
      ParentListItem,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/academic/parents/${id}/portal-access`,
        method: 'PATCH',
        body: { isActive },
      }),
      transformResponse: (response: Envelope<ParentListItem>) => response.data,
      invalidatesTags: ['Students', 'Audit'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetParentsQuery,
  useGetParentByIdQuery,
  useGetParentCoverageQuery,
  useUpdateParentMutation,
  useRemoveParentMutation,
  useUpdateParentLinkMutation,
  useCreateParentPortalAccountMutation,
  useToggleParentPortalAccessMutation,
} = parentsApi;
