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
import type { ExamRoutineStatus } from '@/src/types/enums';

export interface ExamRoutineSlotResponse {
  id: string;
  examId: string;
  exam?: {
    id: string;
    name: string;
    examType?: string;
    academicYear?: { id: string; name: string };
    schoolClass?: { id: string; name: string; numericValue?: number };
  };
  examDate: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  displayTime: string;
  roomNo: string;
  status: ExamRoutineStatus;
  instructions: string | null;
  section: string;
  sectionId: string | null;
  subject: {
    id: string;
    name: string;
    nameBn?: string | null;
    code: string | null;
    category?: string | null;
    paperNumber?: number | null;
    group: string | null;
  };
  marksDistribution: {
    fullMarks: number;
    passMarks: number;
    hasWritten: boolean;
    writtenFullMarks: number | null;
    hasMcq: boolean;
    mcqFullMarks: number | null;
    hasPractical: boolean;
    practicalFullMarks: number | null;
    isOptional: boolean;
  };
}

export interface CreateExamRoutinePayload {
  examSubjectId: string;
  sectionId?: string;
  examDate: string;
  startTime: string;
  endTime: string;
  roomNo?: string;
  status?: ExamRoutineStatus;
  instructions?: string;
}

export interface QueryExamRoutineParams {
  examId?: string;
  academicYearId?: string;
  classId?: string;
  sectionId?: string;
  status?: ExamRoutineStatus;
  startDate?: string;
  endDate?: string;
}

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

    getExamSubjects: builder.query<ExamSubject[], string>({
      query: (examId) => ({
        url: `/examination/exams/${examId}/subjects`,
        method: 'GET',
      }),
      transformResponse: (res: any) => {
        const payload = res?.data ?? res;
        const raw = Array.isArray(payload) ? payload : (payload?.subjects ?? []);
        return raw.map((es: any) => ({
          ...es,
          fullMarks: Number(es.fullMarks ?? 0),
          passMarks: Number(es.passMarks ?? 0),
          writtenFullMarks: es.writtenFullMarks != null ? Number(es.writtenFullMarks) : null,
          writtenPassMarks: es.writtenPassMarks != null ? Number(es.writtenPassMarks) : null,
          mcqFullMarks: es.mcqFullMarks != null ? Number(es.mcqFullMarks) : null,
          mcqPassMarks: es.mcqPassMarks != null ? Number(es.mcqPassMarks) : null,
          practicalFullMarks: es.practicalFullMarks != null ? Number(es.practicalFullMarks) : null,
          practicalPassMarks: es.practicalPassMarks != null ? Number(es.practicalPassMarks) : null,
          continuousAssessmentFullMarks:
            es.continuousAssessmentFullMarks != null
              ? Number(es.continuousAssessmentFullMarks)
              : null,
          continuousAssessmentPassMarks:
            es.continuousAssessmentPassMarks != null
              ? Number(es.continuousAssessmentPassMarks)
              : null,
        }));
      },
      providesTags: (_result, _error, examId) => [
        { type: 'Exams', id: `SUBJECTS-${examId}` },
        { type: 'Exams', id: examId },
      ],
    }),

    createExamSubject: builder.mutation<
      ExamSubject,
      { examId: string; body: Partial<ExamSubject> & { subjectId: string } }
    >({
      query: ({ examId, body }) => ({
        url: `/examination/exams/${examId}/subjects`,
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => (res && res.data ? res.data : res),
      invalidatesTags: (_result, _error, { examId }) => [
        { type: 'Exams', id: `SUBJECTS-${examId}` },
        { type: 'Exams', id: examId },
        { type: 'Exams', id: 'LIST' },
        'Audit',
      ],
    }),

    updateExamSubject: builder.mutation<
      ExamSubject,
      { examId: string; subjectConfigId: string; body: Partial<ExamSubject> }
    >({
      query: ({ examId, subjectConfigId, body }) => ({
        url: `/examination/exams/${examId}/subjects/${subjectConfigId}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: any) => (res && res.data ? res.data : res),
      invalidatesTags: (_result, _error, { examId }) => [
        { type: 'Exams', id: `SUBJECTS-${examId}` },
        { type: 'Exams', id: examId },
        { type: 'Exams', id: 'LIST' },
        'Audit',
      ],
    }),

    removeExamSubject: builder.mutation<
      { deletedId?: string },
      { examId: string; subjectConfigId: string }
    >({
      query: ({ examId, subjectConfigId }) => ({
        url: `/examination/exams/${examId}/subjects/${subjectConfigId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { examId }) => [
        { type: 'Exams', id: `SUBJECTS-${examId}` },
        { type: 'Exams', id: examId },
        { type: 'Exams', id: 'LIST' },
        'Audit',
      ],
    }),
    getExamRoutinesByExam: builder.query<
      {
        examination: Exam;
        totalSlots: number;
        schedule: ExamRoutineSlotResponse[];
      },
      { examId: string; sectionId?: string }
    >({
      query: ({ examId, sectionId }) => ({
        url: `/examination/routines/exam/${examId}`,
        method: 'GET',
        params: sectionId ? { sectionId } : undefined,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      providesTags: (_result, _error, { examId }) => [
        { type: 'Exams', id: `ROUTINES-${examId}` },
        { type: 'Exams', id: examId },
      ],
    }),
    getExamRoutines: builder.query<
      { totalSlots: number; routines: ExamRoutineSlotResponse[] },
      QueryExamRoutineParams | void
    >({
      query: (params) => ({
        url: '/examination/routines',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      providesTags: [{ type: 'Exams', id: 'ROUTINES-LIST' }],
    }),
    createExamRoutine: builder.mutation<
      any,
      { examId: string; body: CreateExamRoutinePayload }
    >({
      query: ({ examId, body }) => ({
        url: `/examination/routines/exam/${examId}`,
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: (_result, _error, { examId }) => [
        { type: 'Exams', id: `ROUTINES-${examId}` },
        { type: 'Exams', id: 'ROUTINES-LIST' },
        { type: 'Exams', id: examId },
        'Audit',
      ],
    }),
    updateExamRoutine: builder.mutation<
      any,
      { routineId: string; examId?: string; body: Partial<CreateExamRoutinePayload> }
    >({
      query: ({ routineId, body }) => ({
        url: `/examination/routines/${routineId}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: (_result, _error, { examId }) => [
        ...(examId ? [{ type: 'Exams' as const, id: `ROUTINES-${examId}` }] : []),
        { type: 'Exams', id: 'ROUTINES-LIST' },
        'Audit',
      ],
    }),
    removeExamRoutine: builder.mutation<
      any,
      { routineId: string; examId?: string }
    >({
      query: ({ routineId }) => ({
        url: `/examination/routines/${routineId}`,
        method: 'DELETE',
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: (_result, _error, { examId }) => [
        ...(examId ? [{ type: 'Exams' as const, id: `ROUTINES-${examId}` }] : []),
        { type: 'Exams', id: 'ROUTINES-LIST' },
        'Audit',
      ],
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
  useGetExamSubjectsQuery,
  useCreateExamSubjectMutation,
  useUpdateExamSubjectMutation,
  useRemoveExamSubjectMutation,
  useGetExamRoutinesByExamQuery,
  useGetExamRoutinesQuery,
  useCreateExamRoutineMutation,
  useUpdateExamRoutineMutation,
  useRemoveExamRoutineMutation,
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

