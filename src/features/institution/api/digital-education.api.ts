import { baseApi } from '@/src/lib/api/base-api';

export type DigitalResourceType =
  | 'SMART_CLASS_VIDEO'
  | 'ONLINE_CLASS_LINK'
  | 'EDUCATIONAL_VIDEO'
  | 'MULTIMEDIA_CONTENT';

export interface DigitalResourceItem {
  id: string;
  title: string;
  description?: string | null;
  resourceType: DigitalResourceType;
  classId?: string | null;
  subjectId?: string | null;
  url: string;
  thumbnail?: string | null;
  createdAt: string;
  schoolClass?: { id: string; name: string; nameBn: string } | null;
  subject?: { id: string; name: string; nameBn: string; code?: string | null } | null;
}

export interface DigitalResourcesPageResponse {
  items: DigitalResourceItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

type Envelope<T> = { data: T };

export const digitalEducationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDigitalResources: builder.query<
      DigitalResourcesPageResponse,
      {
        classId?: string;
        subjectId?: string;
        resourceType?: DigitalResourceType;
        search?: string;
        page?: number;
        limit?: number;
      } | void
    >({
      query: (params) => ({
        url: '/digital-education/resources',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: Envelope<DigitalResourcesPageResponse>) => res.data,
      providesTags: ['Academic'],
    }),
    createDigitalResource: builder.mutation<
      DigitalResourceItem,
      {
        title: string;
        description?: string;
        resourceType: DigitalResourceType;
        classId?: string;
        subjectId?: string;
        url: string;
      }
    >({
      query: (body) => ({
        url: '/digital-education/resources',
        method: 'POST',
        body,
      }),
      transformResponse: (res: Envelope<DigitalResourceItem>) => res.data,
      invalidatesTags: ['Academic'],
    }),
    deleteDigitalResource: builder.mutation<{ deletedId: string }, string>({
      query: (id) => ({
        url: `/digital-education/resources/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (res: Envelope<{ deletedId: string }>) => res.data,
      invalidatesTags: ['Academic'],
    }),
  }),
});

export const {
  useGetDigitalResourcesQuery,
  useCreateDigitalResourceMutation,
  useDeleteDigitalResourceMutation,
} = digitalEducationApi;
