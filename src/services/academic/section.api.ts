import { schoolApi } from '@/src/store/api';
import type { Section } from '@/src/types/entities';

export interface CreateSectionPayload {
  classId: string;
  name: string;
  isActive?: boolean;
}

export interface UpdateSectionPayload {
  id: string;
  name?: string;
  isActive?: boolean;
}

export const sectionApi = schoolApi.injectEndpoints({
  endpoints: (builder) => ({
    getSections: builder.query<
      Section[],
      { classId?: string; isActive?: boolean } | void
    >({
      query: (params) => {
        const queryParts: string[] = [];
        if (params && typeof params === 'object') {
          if (params.classId) queryParts.push(`classId=${params.classId}`);
          if (params.isActive !== undefined) queryParts.push(`isActive=${params.isActive}`);
        }
        const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        return {
          url: `/academic/sections${queryString}`,
          method: 'GET',
        };
      },
      transformResponse: (response: any) => {
        const raw = response?.data ?? response;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['Academic'],
    }),

    getSectionById: builder.query<Section, string>({
      query: (id) => ({
        url: `/academic/sections/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      providesTags: (_result, _error, id) => [{ type: 'Academic', id }],
    }),

    createSection: builder.mutation<Section, CreateSectionPayload>({
      query: (body) => ({
        url: '/academic/sections',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    updateSection: builder.mutation<Section, UpdateSectionPayload>({
      query: ({ id, ...updateBody }) => ({
        url: `/academic/sections/${id}`,
        method: 'PATCH',
        body: updateBody,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: (_result, _error, { id }) => [
        'Academic',
        'Bootstrap',
        { type: 'Academic', id },
      ],
    }),

    saveSection: builder.mutation<
      Section,
      {
        id?: string;
        classId: string;
        name: string;
        isActive?: boolean;
      }
    >({
      query: (body) => {
        if (body.id) {
          const { id, classId: _classId, ...updateBody } = body;
          return {
            url: `/academic/sections/${id}`,
            method: 'PATCH',
            body: updateBody,
          };
        }
        return {
          url: '/academic/sections',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetSectionsQuery,
  useGetSectionByIdQuery,
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useSaveSectionMutation,
} = sectionApi;
