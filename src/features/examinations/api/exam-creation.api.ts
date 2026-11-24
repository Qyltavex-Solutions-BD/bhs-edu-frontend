import { baseApi } from '@/src/lib/api/base-api';
import type { Exam } from '@/src/types/entities';

export const examCreationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createExam: builder.mutation<Exam, Partial<Exam>>({
      query: (body) => ({ url: '/exams', method: 'POST', body }),
      invalidatesTags: ['Exams', 'Audit'],
    }),
  }),
});

export const { useCreateExamMutation } = examCreationApi;

