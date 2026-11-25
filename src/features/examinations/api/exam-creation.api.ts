import { baseApi } from '@/src/lib/api/base-api';
import type { Exam } from '@/src/types/entities';

export const examCreationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createExam: builder.mutation<
      Exam,
      {
        name: string;
        academicYearId: string;
        classId: string;
        examType: string;
        gradingScaleId?: string;
        startDate: string;
        endDate: string;
        marksEntryDeadline?: string | null;
        allowCombinedPass?: boolean;
        weightagePercentage?: number | null;
        status?: string;
        autoAttachSubjects?: boolean;
      }
    >({
      query: (body) => ({ url: '/examination/exams', method: 'POST', body }),
      transformResponse: (res: any) => (res && res.data ? res.data : res),
      invalidatesTags: ['Exams', 'Audit'],
    }),
  }),
});

export const { useCreateExamMutation } = examCreationApi;

