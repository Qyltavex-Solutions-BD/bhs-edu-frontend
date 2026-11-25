import { schoolApi } from '@/src/store/api';
import { env } from '@/src/lib/env';

export interface SyllabusFileRecord {
  id: string;
  academicYearId: string;
  classId: string;
  title: string;
  description: string;
  attachment?: string | null;
  attachmentMime?: string | null;
  attachmentLength?: number | null;
  attachmentUrl?: string | null;
  isPublished: boolean;
  createdAt: string;
  academicYear?: { id: string; name: string };
  schoolClass?: {
    id: string;
    name: string;
    nameBn?: string | null;
    numericValue: number;
  };
}

function normalizeSyllabus(item: SyllabusFileRecord): SyllabusFileRecord {
  const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  return {
    ...item,
    attachmentUrl: item.attachmentUrl
      ? item.attachmentUrl.startsWith('http')
        ? item.attachmentUrl
        : `${base}${item.attachmentUrl}`
      : null,
  };
}

export const syllabusApi = schoolApi.injectEndpoints({
  endpoints: (builder) => ({
    getSyllabi: builder.query<
      SyllabusFileRecord[],
      { academicYearId?: string; classId?: string } | void
    >({
      query: (params) => ({
        url: '/academic/syllabi',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: any) => {
        const raw = res?.data ?? res;
        return Array.isArray(raw) ? raw.map(normalizeSyllabus) : [];
      },
      providesTags: ['Academic'],
    }),

    getPublicSyllabi: builder.query<
      SyllabusFileRecord[],
      { academicYearId?: string; classId?: string } | void
    >({
      query: (params) => ({
        url: '/academic/syllabi/public',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: any) => {
        const raw = res?.data ?? res;
        return Array.isArray(raw) ? raw.map(normalizeSyllabus) : [];
      },
      providesTags: ['Academic'],
    }),

    uploadSyllabus: builder.mutation<SyllabusFileRecord, FormData>({
      query: (body) => ({
        url: '/academic/syllabi',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => normalizeSyllabus(res?.data ?? res),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    toggleSyllabusPublish: builder.mutation<
      SyllabusFileRecord,
      { id: string; isPublished: boolean }
    >({
      query: ({ id, isPublished }) => ({
        url: `/academic/syllabi/${encodeURIComponent(id)}/publish`,
        method: 'PATCH',
        body: { isPublished },
      }),
      transformResponse: (res: any) => normalizeSyllabus(res?.data ?? res),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    deleteSyllabus: builder.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `/academic/syllabi/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetSyllabiQuery,
  useGetPublicSyllabiQuery,
  useUploadSyllabusMutation,
  useToggleSyllabusPublishMutation,
  useDeleteSyllabusMutation,
} = syllabusApi;
