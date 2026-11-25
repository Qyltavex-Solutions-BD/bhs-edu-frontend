import { schoolApi } from '@/src/store/api';
import type { AcademicEvent } from '@/src/types/entities';
import type { AcademicEventType } from '@/src/types/enums';

export interface CreateAcademicEventPayload {
  academicYearId: string;
  title: string;
  description?: string | null;
  eventType: AcademicEventType;
  startDate: string;
  endDate?: string;
}

export interface UpdateAcademicEventPayload extends Partial<CreateAcademicEventPayload> {
  id: string;
}

export const academicEventApi = schoolApi.injectEndpoints({
  endpoints: (builder) => ({
    getAcademicEvents: builder.query<
      AcademicEvent[],
      { academicYearId?: string; eventType?: AcademicEventType } | void
    >({
      query: (params) => ({
        url: '/academic/events',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: any) => {
        const raw = res?.data ?? res;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['Academic'],
    }),

    getPublicAcademicEvents: builder.query<
      AcademicEvent[],
      { academicYearId?: string; eventType?: AcademicEventType } | void
    >({
      query: (params) => ({
        url: '/academic/events/public',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: any) => {
        const raw = res?.data ?? res;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['Academic'],
    }),

    createAcademicEvent: builder.mutation<AcademicEvent, CreateAcademicEventPayload>({
      query: (body) => ({
        url: '/academic/events',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    updateAcademicEvent: builder.mutation<AcademicEvent, UpdateAcademicEventPayload>({
      query: ({ id, ...body }) => ({
        url: `/academic/events/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    deleteAcademicEvent: builder.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `/academic/events/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetAcademicEventsQuery,
  useGetPublicAcademicEventsQuery,
  useCreateAcademicEventMutation,
  useUpdateAcademicEventMutation,
  useDeleteAcademicEventMutation,
} = academicEventApi;
