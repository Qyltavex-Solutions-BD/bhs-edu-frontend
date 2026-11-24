import { schoolApi } from '@/src/store/api';
import type { Book } from '@/src/types/entities';
import { BookType } from '@/src/types/enums';

export interface CreateBookPayload {
  classId: string;
  subjectId: string;
  name: string;
  bookCode?: string;
  type?: BookType;
  displayOrder?: number;
}

export interface UpdateBookPayload {
  id: string;
  name?: string;
  bookCode?: string;
  type?: BookType;
  displayOrder?: number;
  isActive?: boolean;
}

export interface QueryBookParams {
  classId?: string;
  subjectId?: string;
  type?: BookType;
  search?: string;
  isActive?: boolean;
}

export interface BookWithRelations extends Book {
  schoolClass?: {
    id: string;
    name: string;
    numericValue: number;
    nameBn?: string;
  };
  subject?: {
    id: string;
    name: string;
    nameBn?: string;
    officialCode?: string;
    category?: string;
  };
}

export const bookApi = schoolApi.injectEndpoints({
  endpoints: (builder) => ({
    getBooks: builder.query<BookWithRelations[], QueryBookParams | void>({
      query: (params) => ({
        url: '/academic/books',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: any) => {
        const raw = response?.data ?? response;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['Academic'],
    }),

    getBookById: builder.query<BookWithRelations, string>({
      query: (id) => ({
        url: `/academic/books/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      providesTags: (_result, _error, id) => [{ type: 'Academic', id }],
    }),

    createBook: builder.mutation<BookWithRelations, CreateBookPayload>({
      query: (body) => ({
        url: '/academic/books',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    updateBook: builder.mutation<BookWithRelations, UpdateBookPayload>({
      query: ({ id, ...updateBody }) => ({
        url: `/academic/books/${id}`,
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

    deleteBook: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/academic/books/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetBooksQuery,
  useGetBookByIdQuery,
  useCreateBookMutation,
  useUpdateBookMutation,
  useDeleteBookMutation,
} = bookApi;
