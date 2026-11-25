import { baseApi } from '@/src/lib/api/base-api';
import { env } from '@/src/lib/env';
import type { NoticeAudience, NoticeStatus } from '@/src/types/enums';
import type { Notice } from '@/src/types/entities';

type NoticeRecord = Notice & { attachmentMime?: string | null; attachmentLength?: number | null };
type NoticeFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: NoticeStatus;
  audience?: NoticeAudience;
  urgent?: boolean;
  category?: 'exam' | 'admission';
};
type NoticePage = { items: NoticeRecord[]; meta: { total: number; page: number; totalPages: number } };
type Response<T> = { data: T };

function documentMetadata(notice: NoticeRecord): Notice {
  const { attachmentMime, attachmentLength, attachmentUrl, ...metadata } = notice;
  const documentPath = `/notices/${notice.id}/document`;
  return {
    ...metadata,
    attachmentType: attachmentMime === 'application/pdf' ? 'PDF' : attachmentMime ? 'IMAGE' : undefined,
    attachmentSize: attachmentLength == null ? null : `${Math.ceil(attachmentLength / 1024)} KB`,
    attachmentUrl: attachmentMime
      ? `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}${attachmentUrl === documentPath ? attachmentUrl : documentPath}`
      : /^https?:\/\//i.test(notice.attachment ?? '') ? notice.attachment : null,
  };
}

function listUrl(path: string, filters: NoticeFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return `${path}?${params}`;
}

const transformList = ({ data }: Response<NoticePage>) => ({
  ...data,
  items: data.items.map(documentMetadata),
});

export const noticesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicNotices: builder.query<ReturnType<typeof transformList>, NoticeFilters | void>({
      query: (filters) => ({ url: listUrl('/notices', filters || {}) }),
      transformResponse: transformList,
      providesTags: ['Notices'],
    }),
    getPublicNotice: builder.query<Notice, string>({
      query: (id) => ({ url: `/notices/${encodeURIComponent(id)}` }),
      transformResponse: ({ data }: Response<NoticeRecord>) => documentMetadata(data),
      providesTags: ['Notices'],
    }),
    getPortalNotices: builder.query<ReturnType<typeof transformList>, NoticeFilters | void>({
      query: (filters) => ({ url: listUrl('/notices/portal', filters || {}) }),
      transformResponse: transformList,
      providesTags: ['Notices'],
    }),
    getPortalNoticeDocument: builder.mutation<string, string>({
      async queryFn(id, _api, _options, baseQuery) {
        const result = await baseQuery({
          url: `/notices/portal/${encodeURIComponent(id)}/document`,
          responseHandler: (response) => (response.ok ? response.blob() : response.json()),
        });
        if (result.error) return { error: result.error };
        return { data: URL.createObjectURL(result.data as Blob) };
      },
    }),
    getAdminNotices: builder.query<ReturnType<typeof transformList>, NoticeFilters>({
      query: (filters) => ({ url: listUrl('/notices/admin', filters) }),
      transformResponse: transformList,
      providesTags: ['Notices'],
    }),
    getAdminNoticeDocument: builder.mutation<string, string>({
      async queryFn(id, _api, _options, baseQuery) {
        const result = await baseQuery({
          url: `/notices/admin/${id}/document`,
          responseHandler: (response) => response.ok ? response.blob() : response.json(),
        });
        if (result.error) return { error: result.error };
        return { data: URL.createObjectURL(result.data as Blob) };
      },
    }),
    createNotice: builder.mutation<unknown, FormData>({
      query: (body) => ({ url: '/notices', method: 'POST', body }),
      invalidatesTags: ['Notices'],
    }),
    deleteNotice: builder.mutation<unknown, string>({
      query: (id) => ({ url: `/notices/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notices'],
    }),
    updateNotice: builder.mutation<
      unknown,
      {
        id: string;
        title: string;
        memoNo: string;
        status: NoticeStatus;
        isUrgent: boolean;
        audiences?: NoticeAudience[];
        file?: File;
      }
    >({
      query: ({ id, file, ...fields }) => {
        if (!file) return { url: `/notices/${id}`, method: 'PATCH', body: fields };
        const body = new FormData();
        body.set('title', fields.title);
        body.set('memoNo', fields.memoNo);
        body.set('status', fields.status);
        body.set('isUrgent', String(fields.isUrgent));
        if (fields.audiences?.length) {
          body.set('audiences', JSON.stringify(fields.audiences));
        }
        body.set('file', file);
        return { url: `/notices/${id}`, method: 'PATCH', body };
      },
      invalidatesTags: ['Notices'],
    }),
  }),
});

export const {
  useCreateNoticeMutation,
  useGetPublicNoticesQuery,
  useGetPublicNoticeQuery,
  useGetPortalNoticesQuery,
  useGetPortalNoticeDocumentMutation,
  useGetAdminNoticesQuery,
  useGetAdminNoticeDocumentMutation,
  useUpdateNoticeMutation,
  useDeleteNoticeMutation,
} = noticesApi;
