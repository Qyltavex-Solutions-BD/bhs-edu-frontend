import { baseApi } from '@/src/lib/api/base-api';
import type {
  ConsolidatedExamConfig,
  Exam,
  ExamHallRoom,
  ExamSubject,
  GradeRange,
  GradingScale,
  ResultScrutinyRequest,
  ResultSummary,
} from '@/src/types/entities';

export const examinationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExams: builder.query<
      { items: Exam[]; meta?: any },
      {
        academicYearId?: string;
        classId?: string;
        status?: string;
        examType?: string;
        resultStatus?: string;
        search?: string;
        isDeleted?: boolean;
        page?: number;
        limit?: number;
      } | void
    >({
      query: (params) => ({
        url: '/examination/exams',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: any) => {
        if (res && res.data && Array.isArray(res.data)) {
          return { items: res.data, meta: res.meta };
        }
        if (Array.isArray(res)) {
          return { items: res };
        }
        return { items: [] };
      },
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'Exams' as const, id })),
              { type: 'Exams', id: 'LIST' },
            ]
          : [{ type: 'Exams', id: 'LIST' }],
    }),

    getExamById: builder.query<Exam, string>({
      query: (id) => ({
        url: `/examination/exams/${id}`,
        method: 'GET',
      }),
      transformResponse: (res: any) => (res && res.data ? res.data : res),
      providesTags: (_result, _error, id) => [{ type: 'Exams', id }],
    }),

    updateExam: builder.mutation<
      Exam,
      {
        id: string;
        name?: string;
        examType?: string;
        gradingScaleId?: string;
        startDate?: string;
        endDate?: string;
        status?: string;
        marksEntryDeadline?: string | null;
        allowCombinedPass?: boolean;
        weightagePercentage?: number | null;
        isLocked?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/examination/exams/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: any) => (res && res.data ? res.data : res),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Exams', id },
        { type: 'Exams', id: 'LIST' },
        'Audit',
      ],
    }),

    deleteExam: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/examination/exams/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Exams', id: 'LIST' }, 'Audit'],
    }),

    getGradingScales: builder.query<{ items: GradingScale[]; meta?: any }, void>({
      query: () => ({
        url: '/examination/grading-scales',
        method: 'GET',
        params: { limit: 100 },
      }),
      transformResponse: (res: any) => {
        if (res && res.data && Array.isArray(res.data)) {
          return { items: res.data, meta: res.meta };
        }
        if (Array.isArray(res)) return { items: res };
        return { items: [] };
      },
      providesTags: ['Exams'],
    }),
    saveMarksBatch: builder.mutation<
      { savedCount: number },
      {
        examId: string;
        examSubjectId: string;
        enteredBy: string;
        entries: Array<{
          studentEnrollmentId: string;
          writtenMarks: number;
          mcqMarks: number;
          practicalMarks: number;
          continuousAssessmentMarks: number;
          isAbsent: boolean;
        }>;
      }
    >({
      query: (body) => ({ url: '/exams/marks/batch', method: 'POST', body }),
      invalidatesTags: ['Exams', 'Results', 'Audit'],
    }),
    processExamResults: builder.mutation<
      { exam: Exam; processedCount?: number; smsSentCount?: number },
      {
        examId: string;
        action: 'CALCULATE' | 'PUBLISH' | 'WITHHOLD' | 'LOCK' | 'UNLOCK';
        extendDeadline?: string;
        sendSms?: boolean;
      }
    >({
      query: (body) => ({ url: '/exams/process-results', method: 'POST', body }),
      invalidatesTags: ['Exams', 'Results', 'Attendance', 'Notifications', 'Audit'],
    }),
    upsertExamSubject: builder.mutation<
      ExamSubject,
      Partial<ExamSubject> & { examId: string; subjectId: string }
    >({
      query: (body) => ({ url: '/exams/subjects/upsert', method: 'POST', body }),
      invalidatesTags: ['Exams', 'Results', 'Audit'],
    }),
    deleteExamSubject: builder.mutation<{ deletedId: string }, { id: string }>({
      query: (body) => ({ url: '/exams/subjects/delete', method: 'POST', body }),
      invalidatesTags: ['Exams', 'Results', 'Audit'],
    }),
    upsertGradingScale: builder.mutation<GradingScale, Partial<GradingScale>>({
      query: (body) => ({ url: '/exams/grading-scales/upsert', method: 'POST', body }),
      invalidatesTags: ['Exams', 'Results', 'Audit'],
    }),
    upsertGradeRange: builder.mutation<
      GradeRange,
      Partial<GradeRange> & { gradingScaleId: string }
    >({
      query: (body) => ({ url: '/exams/grade-ranges/upsert', method: 'POST', body }),
      invalidatesTags: ['Exams', 'Results', 'Audit'],
    }),
    deleteGradeRange: builder.mutation<{ deletedId: string }, { id: string }>({
      query: (body) => ({ url: '/exams/grade-ranges/delete', method: 'POST', body }),
      invalidatesTags: ['Exams', 'Results', 'Audit'],
    }),
    saveConsolidatedConfig: builder.mutation<
      ConsolidatedExamConfig[],
      {
        consolidatedExamId: string;
        items: Array<{ sourceExamId: string; weightagePercentage: number }>;
      }
    >({
      query: (body) => ({ url: '/exams/consolidated/save', method: 'POST', body }),
      invalidatesTags: ['Exams', 'Results', 'Audit'],
    }),
    upsertExamHallRoom: builder.mutation<
      ExamHallRoom,
      Partial<ExamHallRoom> & { examId: string; roomNo: string; capacity: number }
    >({
      query: (body) => ({ url: '/exams/hall-rooms/upsert', method: 'POST', body }),
      invalidatesTags: ['Exams', 'Audit'],
    }),
    deleteExamHallRoom: builder.mutation<{ deletedId: string }, { id: string }>({
      query: (body) => ({ url: '/exams/hall-rooms/delete', method: 'POST', body }),
      invalidatesTags: ['Exams', 'Audit'],
    }),
    upsertResultScrutiny: builder.mutation<
      ResultScrutinyRequest,
      Partial<ResultScrutinyRequest> & {
        examId: string;
        studentEnrollmentId: string;
        examSubjectId: string;
      }
    >({
      query: (body) => ({ url: '/exams/scrutiny/upsert', method: 'POST', body }),
      invalidatesTags: ['Exams', 'Results', 'Audit'],
    }),
    saveResultRemark: builder.mutation<
      ResultSummary,
      { resultSummaryId: string; teacherRemarks: string }
    >({
      query: (body) => ({ url: '/exams/remarks/save', method: 'POST', body }),
      invalidatesTags: ['Results', 'Audit'],
    }),
  }),
});

export const {
  useGetExamsQuery,
  useGetExamByIdQuery,
  useUpdateExamMutation,
  useDeleteExamMutation,
  useGetGradingScalesQuery,
  useSaveMarksBatchMutation,
  useProcessExamResultsMutation,
  useUpsertExamSubjectMutation,
  useDeleteExamSubjectMutation,
  useUpsertGradingScaleMutation,
  useUpsertGradeRangeMutation,
  useDeleteGradeRangeMutation,
  useSaveConsolidatedConfigMutation,
  useUpsertExamHallRoomMutation,
  useDeleteExamHallRoomMutation,
  useUpsertResultScrutinyMutation,
  useSaveResultRemarkMutation,
} = examinationsApi;

