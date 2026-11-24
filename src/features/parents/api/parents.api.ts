import { baseApi } from '@/src/lib/api/base-api';
import type { RelationshipType } from '@/src/types/enums';
import type { Parent, ParentStudent } from '@/src/types/entities';

export const parentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    saveParent: builder.mutation<Parent, Partial<Parent>>({
      query: (body) => ({ url: '/parents', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),
    updateParent: builder.mutation<Parent, Partial<Parent> & { id: string }>({
      query: (body) => ({ url: '/parents/update', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),
    removeParent: builder.mutation<{ id: string }, { id: string }>({
      query: (body) => ({ url: '/parents/remove', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),
    linkParent: builder.mutation<
      ParentStudent,
      {
        parentId: string;
        studentId: string;
        relationship: RelationshipType;
        isPrimary?: boolean;
        isEmergencyContact?: boolean;
        isSmsReceiver?: boolean;
      }
    >({
      query: (body) => ({ url: '/parents/link', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),
    updateParentLink: builder.mutation<
      ParentStudent,
      {
        id: string;
        relationship?: RelationshipType;
        isPrimary?: boolean;
        isEmergencyContact?: boolean;
        isSmsReceiver?: boolean;
      }
    >({
      query: (body) => ({ url: '/parents/link/update', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),
    unlinkParent: builder.mutation<{ id: string }, { id: string }>({
      query: (body) => ({ url: '/parents/unlink', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),
  }),
});

export const {
  useSaveParentMutation,
  useUpdateParentMutation,
  useRemoveParentMutation,
  useLinkParentMutation,
  useUpdateParentLinkMutation,
  useUnlinkParentMutation,
} = parentsApi;

