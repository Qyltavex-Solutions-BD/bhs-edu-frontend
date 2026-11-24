import { baseApi } from '@/src/lib/api/base-api';
import type { NoticeStatus } from '@/src/types/enums';

export interface CreateNoticeRequest {
  memoNo?: string | null;
  title: string;
  description: string;
  attachment?: string | null;
  attachmentType?: 'PDF' | 'IMAGE' | 'OFFICIAL_PAD' | null;
  attachmentUrl?: string | null;
  attachmentSize?: string | null;
  status: NoticeStatus;
  isUrgent?: boolean;
  audience?: 'ALL' | 'PARENTS' | 'TEACHERS' | 'STUDENTS';
  createdBy?: string;
}

export const noticesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createNotice: builder.mutation<unknown, CreateNoticeRequest>({
      query: (body) => ({ url: '/notices', method: 'POST', body }),
      invalidatesTags: ['Notices', 'Audit'],
    }),
  }),
});

export const { useCreateNoticeMutation } = noticesApi;

