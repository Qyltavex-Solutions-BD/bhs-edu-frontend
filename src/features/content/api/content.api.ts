import { baseApi } from '@/src/lib/api/base-api';
import type { AdmissionContent } from '@/src/types/entities';

export const contentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    toggleCmsItem: builder.mutation<
      unknown,
      {
        collection:
          | 'banners'
          | 'quickLinks'
          | 'notices'
          | 'news'
          | 'events'
          | 'careers'
          | 'publications'
          | 'achievements'
          | 'digitalResources'
          | 'digitalClassrooms'
          | 'libraryDistributions'
          | 'leadershipMessages'
          | 'institutionContents'
          | 'facilities'
          | 'galleryCategories'
          | 'galleries';
        id: string;
        field: 'isActive' | 'isPublished';
      }
    >({
      query: (body) => ({ url: '/cms/toggle', method: 'POST', body }),
      invalidatesTags: ['Bootstrap', 'Institution', 'Notices', 'Audit'],
    }),

    upsertCmsItem: builder.mutation<
      unknown,
      {
        collection:
          | 'banners'
          | 'quickLinks'
          | 'institutionContents'
          | 'facilities'
          | 'leadershipMessages'
          | 'managingCommittee'
          | 'news'
          | 'events'
          | 'careers'
          | 'galleryCategories'
          | 'galleries'
          | 'galleryMedia'
          | 'publications'
          | 'achievements'
          | 'libraryBooks'
          | 'libraryDistributions'
          | 'digitalClassrooms'
          | 'digitalResources'
          | 'examRoutines';
        item: Record<string, unknown>;
      }
    >({
      query: (body) => ({ url: '/cms/upsert', method: 'POST', body }),
      invalidatesTags: ['Bootstrap', 'Institution', 'Notices', 'Exams', 'Results', 'Audit'],
    }),

    deleteCmsItem: builder.mutation<
      { deletedId: string },
      {
        collection:
          | 'banners'
          | 'quickLinks'
          | 'institutionContents'
          | 'facilities'
          | 'leadershipMessages'
          | 'managingCommittee'
          | 'news'
          | 'events'
          | 'careers'
          | 'galleryCategories'
          | 'galleries'
          | 'galleryMedia'
          | 'publications'
          | 'achievements'
          | 'libraryBooks'
          | 'libraryDistributions'
          | 'digitalClassrooms'
          | 'digitalResources'
          | 'examRoutines';
        id: string;
      }
    >({
      query: (body) => ({ url: '/cms/delete', method: 'POST', body }),
      invalidatesTags: ['Bootstrap', 'Institution', 'Notices', 'Exams', 'Results', 'Audit'],
    }),

    updateContactInfo: builder.mutation<
      unknown,
      { address: string; phone?: string | null; email?: string | null; mapUrl?: string | null }
    >({
      query: (body) => ({ url: '/cms/contact-info', method: 'PUT', body }),
      invalidatesTags: ['Bootstrap', 'Institution', 'Audit'],
    }),

    updateAdmissionContent: builder.mutation<AdmissionContent, Partial<AdmissionContent>>({
      query: (body) => ({ url: '/cms/admission-content', method: 'PUT', body }),
      invalidatesTags: ['Bootstrap', 'Admissions', 'Audit'],
    }),

    reorderCmsItems: builder.mutation<
      unknown,
      { collection: 'banners' | 'quickLinks' | 'galleryMedia' | 'galleryCategories'; orderedIds: string[] }
    >({
      query: (body) => ({ url: '/cms/reorder', method: 'POST', body }),
      invalidatesTags: ['Bootstrap', 'Audit'],
    }),

  }),
});

export const {
  useToggleCmsItemMutation,
  useUpsertCmsItemMutation,
  useDeleteCmsItemMutation,
  useUpdateContactInfoMutation,
  useUpdateAdmissionContentMutation,
  useReorderCmsItemsMutation,
} = contentApi;

