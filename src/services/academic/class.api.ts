import { schoolApi } from '@/src/store/api';
import type { SchoolClass } from '@/src/types/entities';

export interface CreateClassPayload {
  name: string;
  nameBn?: string;
  numericValue: number;
  isActive?: boolean;
  sections?: string[];
  sectionNames?: string[];
}

export interface UpdateClassPayload {
  id: string;
  name?: string;
  nameBn?: string;
  numericValue?: number;
  isActive?: boolean;
}

export const classApi = schoolApi.injectEndpoints({
  endpoints: (builder) => ({
    getSchoolClasses: builder.query<SchoolClass[], { isActive?: boolean } | void>({
      query: (params) => ({
        url:
          '/academic/classes' +
          (params && params.isActive !== undefined ? `?isActive=${params.isActive}` : ''),
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        const raw = response?.data ?? response;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['Academic'],
    }),

    getSchoolClassById: builder.query<SchoolClass, string>({
      query: (id) => ({
        url: `/academic/classes/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      providesTags: (_result, _error, id) => [{ type: 'Academic', id }],
    }),

    createSchoolClass: builder.mutation<SchoolClass, CreateClassPayload>({
      query: (body) => {
        const { sectionNames, sections, ...createBody } = body;
        const resolvedSections = sections ?? sectionNames;
        return {
          url: '/academic/classes',
          method: 'POST',
          body: {
            ...createBody,
            ...(resolvedSections && resolvedSections.length > 0
              ? { sections: resolvedSections }
              : {}),
          },
        };
      },
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    updateSchoolClass: builder.mutation<SchoolClass, UpdateClassPayload>({
      query: ({ id, ...updateBody }) => ({
        url: `/academic/classes/${id}`,
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

    saveSchoolClass: builder.mutation<
      SchoolClass,
      {
        id?: string;
        name: string;
        nameBn?: string;
        numericValue: number;
        isActive?: boolean;
        sections?: string[];
        sectionNames?: string[];
      }
    >({
      query: (body) => {
        if (body.id) {
          const { id, sectionNames, sections, ...updateBody } = body;
          return {
            url: `/academic/classes/${id}`,
            method: 'PATCH',
            body: updateBody,
          };
        }
        const { sectionNames, sections, ...createBody } = body;
        const resolvedSections = sections ?? sectionNames;
        return {
          url: '/academic/classes',
          method: 'POST',
          body: {
            ...createBody,
            ...(resolvedSections && resolvedSections.length > 0
              ? { sections: resolvedSections }
              : {}),
          },
        };
      },
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetSchoolClassesQuery,
  useGetSchoolClassByIdQuery,
  useCreateSchoolClassMutation,
  useUpdateSchoolClassMutation,
  useSaveSchoolClassMutation,
} = classApi;
