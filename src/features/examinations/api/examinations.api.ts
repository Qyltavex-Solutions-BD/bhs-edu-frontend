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

export interface GradeSheetStudentMark {
  id: string;
  isAbsent: boolean;
  writtenMarks: number;
  mcqMarks: number;
  practicalMarks: number;
  continuousAssessmentMarks: number;
  totalMarks: number;
  isLocked: boolean;
  enteredBy: string;
  updatedAt: string;
}

export interface GradeSheetStudentRow {
  studentEnrollmentId: string;
  studentId: string;
  roll: number;
  name: string;
  nameBn: string | null;
  gender: string;
  section: string;
  sectionId: string;
  group: string | null;
  isOptionalSubject: boolean;
  isEnrolledOptional: boolean;
  mark: GradeSheetStudentMark | null;
}

export interface GradeSheetResponse {
  examination: {
    id: string;
    name: string;
    examType: string;
    status: string;
    marksEntryDeadline: string | null;
    isLocked: boolean;
    resultStatus: string;
    academicYear: string;
    schoolClass: string;
  };
  examSubject: {
    id: string;
    subjectName: string;
    officialCode: string | null;
    fullMarks: number;
    passMarks: number;
    hasWritten: boolean;
    writtenFullMarks: number | null;
    hasMcq: boolean;
    mcqFullMarks: number | null;
    hasPractical: boolean;
    practicalFullMarks: number | null;
    hasContinuousAssessment: boolean;
    continuousAssessmentFullMarks: number | null;
  };
  summary: {
    totalStudents: number;
    marksEnteredCount: number;
    marksPendingCount: number;
    absentCount: number;
  };
  students: GradeSheetStudentRow[];
}

export interface BulkMarkEntryItem {
  studentEnrollmentId: string;
  isAbsent?: boolean;
  writtenMarks?: number;
  mcqMarks?: number;
  practicalMarks?: number;
  continuousAssessmentMarks?: number;
}

export interface BulkCreateMarkPayload {
  examSubjectId: string;
  sectionId?: string;
  marks: BulkMarkEntryItem[];
}

export interface BulkCreateMarkResult {
  totalProcessed: number;
  createdCount: number;
  updatedCount: number;
}

export interface ProcessResultPayload {
  examId: string;
  forceRecalculate?: boolean;
  lockExamOnProcess?: boolean;
  allowIncomplete?: boolean;
}

export interface TabulationSubjectScore {
  examSubjectId: string;
  subjectName: string;
  code: string | null;
  totalMarks: number;
  letterGrade: string;
  gradePoint: number;
  isPassed: boolean;
  isOptional: boolean;
  isAbsent: boolean;
}

export interface TabulationRow {
  enrollmentId: string;
  studentId: string;
  roll: number;
  name: string;
  nameBn: string | null;
  section: string;
  subjects: TabulationSubjectScore[];
  totalMarks: number;
  totalFullMarks: number;
  gpa: number;
  gpaWithoutOptional: number;
  letterGrade: string;
  meritPosition: number | null;
  sectionMeritPosition: number | null;
  failedSubjectCount: number;
  resultStatus: string;
}

export interface TabulationSheetResponse {
  examination: {
    id: string;
    name: string;
    examType: string;
    class: string;
    academicYear: string;
    resultStatus: string;
    publishedAt: string | null;
    gradingScale: string;
    maxGpa: number;
  };
  subjectsList: Array<{
    id: string;
    name: string;
    code: string | null;
    fullMarks: number;
    passMarks: number;
    isOptional: boolean;
  }>;
  summary: {
    totalStudents: number;
    passedCount: number;
    failedCount: number;
    passPercentage: number;
  };
  tabulation: TabulationRow[];
}

export interface ConsolidatedResultRow {
  enrollmentId: string;
  sectionId: string;
  roll: number;
  studentId: string;
  studentName: string;
  studentNameEn: string;
  sectionName: string;
  groupName: string | null;
  sourceScores: Record<string, { marks: number | null; gpa: number | null; status: string }>;
  weightedMarks: number;
  weightedGpa: number;
  letterGrade: string;
  isPassed: boolean;
  isIncomplete: boolean;
  merit: number | null;
}

export interface ConsolidatedResultResponse {
  examination: {
    id: string;
    name: string;
    classId: string;
    className: string;
    academicYearId: string;
    academicYear: string;
    maxGpa: number;
  };
  configs: Array<{
    id: string;
    sourceExamId: string;
    sourceExamName: string;
    weightagePercentage: number;
    displayOrder: number;
    processedCount: number;
  }>;
  eligibleSourceExams: Array<{
    id: string;
    name: string;
    examType: string;
    resultStatus: string;
    processedCount: number;
  }>;
  summary: {
    total: number;
    passed: number;
    gpa5: number;
    incomplete: number;
    passRate: number;
  };
  rows: ConsolidatedResultRow[];
}

export interface StudentTranscriptResponse {
  student: {
    enrollmentId: string;
    studentId: string;
    name: string;
    nameBn: string | null;
    roll: number;
    class: string;
    section: string;
    academicYear: string;
  };
  examination: {
    id: string;
    name: string;
    examType: string;
    resultStatus: string;
    publishedAt: string | null;
  };
  subjects: Array<{
    subjectName: string;
    officialCode: string | null;
    fullMarks: number;
    passMarks: number;
    obtainedMarks: number;
    letterGrade: string;
    gradePoint: number;
    isPassed: boolean;
    isOptional: boolean;
    bonusGradePoint: number;
    isAbsent: boolean;
  }>;
  resultSummary: {
    totalMarks: number;
    totalFullMarks: number;
    gpa: number;
    gpaWithoutOptional: number;
    letterGrade: string;
    meritPosition: number | null;
    sectionMeritPosition: number | null;
    failedSubjectCount: number;
    resultStatus: string;
    publishedAt: string | null;
  };
  gradingScale: {
    name: string;
    maxGpa: number;
    ranges: Array<{
      minPercentage: number;
      maxPercentage: number;
      letterGrade: string;
      gradePoint: number;
      remarks?: string | null;
    }>;
  };
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
        const raw = res && res.data && Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        return {
          items: raw.map((gs: any) => ({
            ...gs,
            maxGpa: Number(gs.maxGpa ?? 5.0),
          })),
          meta: res?.meta,
        };
      },
      providesTags: ['Exams'],
    }),

    getGradingScaleById: builder.query<
      GradingScale & {
        gradeRanges: GradeRange[];
        _count?: { gradeRanges?: number; exams?: number };
      },
      string
    >({
      query: (id) => ({
        url: `/examination/grading-scales/${id}`,
        method: 'GET',
      }),
      transformResponse: (res: any) => {
        const d = res?.data ?? res;
        return {
          ...d,
          maxGpa: Number(d?.maxGpa ?? 5.0),
          gradeRanges: Array.isArray(d?.gradeRanges)
            ? d.gradeRanges.map((r: any) => ({
                ...r,
                minPercentage: Number(r.minPercentage ?? 0),
                maxPercentage: Number(r.maxPercentage ?? 0),
                gradePoint: Number(r.gradePoint ?? 0),
              }))
            : [],
        };
      },
      providesTags: (_result, _error, id) => [{ type: 'Exams', id }, 'Exams'],
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
    getGradeSheet: builder.query<
      GradeSheetResponse,
      { examSubjectId: string; sectionId?: string }
    >({
      query: (params) => ({
        url: '/examination/marks/grade-sheet',
        method: 'GET',
        params,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      providesTags: ['Results'],
    }),
    saveBulkMarks: builder.mutation<BulkCreateMarkResult, BulkCreateMarkPayload>({
      query: (body) => ({
        url: '/examination/marks/bulk',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: ['Results', 'Exams', 'Audit'],
    }),
    toggleMarkLock: builder.mutation<any, { id: string; isLocked: boolean }>({
      query: ({ id, isLocked }) => ({
        url: `/examination/marks/${id}/lock`,
        method: 'PATCH',
        body: { isLocked },
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: ['Results', 'Audit'],
    }),
    bulkToggleMarkLock: builder.mutation<
      { updatedCount: number; isLocked: boolean },
      { examSubjectId: string; sectionId?: string; isLocked: boolean }
    >({
      query: (body) => ({
        url: '/examination/marks/bulk-lock',
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: ['Results', 'Audit'],
    }),
    processExamResultsLive: builder.mutation<any, ProcessResultPayload>({
      query: ({ examId, ...body }) => ({
        url: `/examination/results/process/${examId}`,
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: ['Results', 'Exams', 'Audit'],
    }),
    getTabulationSheet: builder.query<
      TabulationSheetResponse,
      { examId: string; sectionId?: string; resultStatus?: string; search?: string }
    >({
      query: ({ examId, ...params }) => ({
        url: `/examination/results/tabulation-sheet/${examId}`,
        method: 'GET',
        params,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      providesTags: (_result, _error, { examId }) => [{ type: 'Results', id: examId }],
    }),
    getStudentTranscript: builder.query<
      StudentTranscriptResponse,
      { enrollmentId: string; examId: string }
    >({
      query: ({ enrollmentId, examId }) => ({
        url: `/examination/results/student/${enrollmentId}/exam/${examId}`,
        method: 'GET',
      }),
      transformResponse: (res: any) => res?.data ?? res,
      providesTags: (_result, _error, { enrollmentId, examId }) => [
        { type: 'Results', id: `${enrollmentId}-${examId}` },
      ],
    }),
    publishExamResults: builder.mutation<any, string>({
      query: (examId) => ({
        url: `/examination/results/publish/${examId}`,
        method: 'PATCH',
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: ['Results', 'Exams', 'Audit'],
    }),
    withholdExamResults: builder.mutation<any, string>({
      query: (examId) => ({
        url: `/examination/results/withhold/${examId}`,
        method: 'PATCH',
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: ['Results', 'Exams', 'Audit'],
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
    createGradingScale: builder.mutation<
      GradingScale,
      { name: string; description?: string; maxGpa?: number; isDefault?: boolean }
    >({
      query: (body) => ({
        url: '/examination/grading-scales',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => {
        const d = res?.data ?? res;
        return { ...d, maxGpa: Number(d?.maxGpa ?? 5.0) };
      },
      invalidatesTags: ['Exams', 'Results', 'Audit'],
    }),
    updateGradingScale: builder.mutation<
      GradingScale,
      { id: string; name?: string; description?: string; maxGpa?: number; isDefault?: boolean; isActive?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/examination/grading-scales/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: any) => {
        const d = res?.data ?? res;
        return { ...d, maxGpa: Number(d?.maxGpa ?? 5.0) };
      },
      invalidatesTags: (_res, _err, { id }) => [{ type: 'Exams', id }, 'Exams', 'Results', 'Audit'],
    }),
    deleteGradingScale: builder.mutation<void, string>({
      query: (id) => ({
        url: `/examination/grading-scales/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Exams', 'Results', 'Audit'],
    }),
    createGradeRange: builder.mutation<
      GradeRange,
      {
        scaleId: string;
        minPercentage: number;
        maxPercentage: number;
        letterGrade: string;
        gradePoint: number;
        remarks?: string;
        isFailGrade?: boolean;
      }
    >({
      query: ({ scaleId, ...body }) => ({
        url: `/examination/grading-scales/${scaleId}/ranges`,
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => {
        const d = res?.data ?? res;
        return {
          ...d,
          minPercentage: Number(d?.minPercentage ?? 0),
          maxPercentage: Number(d?.maxPercentage ?? 0),
          gradePoint: Number(d?.gradePoint ?? 0),
        };
      },
      invalidatesTags: (_res, _err, { scaleId }) => [{ type: 'Exams', id: scaleId }, 'Exams', 'Results', 'Audit'],
    }),
    updateGradeRange: builder.mutation<
      GradeRange,
      {
        scaleId: string;
        rangeId: string;
        minPercentage?: number;
        maxPercentage?: number;
        letterGrade?: string;
        gradePoint?: number;
        remarks?: string;
        isFailGrade?: boolean;
      }
    >({
      query: ({ scaleId, rangeId, ...body }) => ({
        url: `/examination/grading-scales/${scaleId}/ranges/${rangeId}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: any) => {
        const d = res?.data ?? res;
        return {
          ...d,
          minPercentage: Number(d?.minPercentage ?? 0),
          maxPercentage: Number(d?.maxPercentage ?? 0),
          gradePoint: Number(d?.gradePoint ?? 0),
        };
      },
      invalidatesTags: (_res, _err, { scaleId }) => [{ type: 'Exams', id: scaleId }, 'Exams', 'Results', 'Audit'],
    }),
    deleteGradeRange: builder.mutation<void, { scaleId: string; rangeId: string }>({
      query: ({ scaleId, rangeId }) => ({
        url: `/examination/grading-scales/${scaleId}/ranges/${rangeId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { scaleId }) => [{ type: 'Exams', id: scaleId }, 'Exams', 'Results', 'Audit'],
    }),
    saveConsolidatedConfig: builder.mutation<
      ConsolidatedResultResponse,
      {
        consolidatedExamId: string;
        items: Array<{ sourceExamId: string; weightagePercentage: number }>;
      }
    >({
      query: ({ consolidatedExamId, items }) => ({
        url: `/examination/results/consolidated/${consolidatedExamId}/config`,
        method: 'PUT',
        body: { items },
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: (_result, _error, { consolidatedExamId }) => [
        { type: 'Results', id: consolidatedExamId },
        'Results',
        'Exams',
        'Audit',
      ],
    }),
    getConsolidatedResult: builder.query<ConsolidatedResultResponse, string>({
      query: (examId) => ({
        url: `/examination/results/consolidated/${examId}`,
        method: 'GET',
      }),
      transformResponse: (res: any) => res?.data ?? res,
      providesTags: (_result, _error, examId) => [{ type: 'Results', id: examId }],
    }),
    getExamHallRoomsByExam: builder.query<ExamHallRoom[], string>({
      query: (examId) => ({
        url: `/examination/hall-rooms/exam/${examId}`,
        method: 'GET',
      }),
      transformResponse: (res: any) => {
        const raw = res?.data ?? res;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: (_res, _err, examId) => [
        { type: 'Exams', id: `HALL-ROOMS-${examId}` },
        'Exams',
      ],
    }),
    createExamHallRoom: builder.mutation<
      ExamHallRoom,
      {
        examId: string;
        roomNo: string;
        buildingName?: string | null;
        capacity: number;
        invigilatorStaffId?: string | null;
        assistantInvigilatorStaffId?: string | null;
        notes?: string | null;
      }
    >({
      query: (body) => ({
        url: '/examination/hall-rooms',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: (_res, _err, { examId }) => [
        { type: 'Exams', id: `HALL-ROOMS-${examId}` },
        'Exams',
        'Audit',
      ],
    }),
    updateExamHallRoom: builder.mutation<
      ExamHallRoom,
      {
        id: string;
        examId: string;
        roomNo?: string;
        buildingName?: string | null;
        capacity?: number;
        invigilatorStaffId?: string | null;
        assistantInvigilatorStaffId?: string | null;
        notes?: string | null;
      }
    >({
      query: ({ id, examId: _examId, ...body }) => ({
        url: `/examination/hall-rooms/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: (_res, _err, { examId }) => [
        { type: 'Exams', id: `HALL-ROOMS-${examId}` },
        'Exams',
        'Audit',
      ],
    }),
    deleteExamHallRoom: builder.mutation<{ deletedId: string }, { id: string; examId: string }>({
      query: ({ id }) => ({
        url: `/examination/hall-rooms/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: (_res, _err, { examId }) => [
        { type: 'Exams', id: `HALL-ROOMS-${examId}` },
        'Exams',
        'Audit',
      ],
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
  useGetGradingScaleByIdQuery,
  useGetExamSubjectsQuery,
  useCreateExamSubjectMutation,
  useUpdateExamSubjectMutation,
  useRemoveExamSubjectMutation,
  useGetExamRoutinesByExamQuery,
  useGetExamRoutinesQuery,
  useCreateExamRoutineMutation,
  useUpdateExamRoutineMutation,
  useRemoveExamRoutineMutation,
  useGetGradeSheetQuery,
  useSaveBulkMarksMutation,
  useToggleMarkLockMutation,
  useBulkToggleMarkLockMutation,
  useProcessExamResultsLiveMutation,
  useGetTabulationSheetQuery,
  useGetStudentTranscriptQuery,
  usePublishExamResultsMutation,
  useWithholdExamResultsMutation,
  useSaveMarksBatchMutation,
  useProcessExamResultsMutation,
  useUpsertExamSubjectMutation,
  useDeleteExamSubjectMutation,
  useCreateGradingScaleMutation,
  useUpdateGradingScaleMutation,
  useDeleteGradingScaleMutation,
  useCreateGradeRangeMutation,
  useUpdateGradeRangeMutation,
  useDeleteGradeRangeMutation,
  useSaveConsolidatedConfigMutation,
  useGetConsolidatedResultQuery,
  useGetExamHallRoomsByExamQuery,
  useCreateExamHallRoomMutation,
  useUpdateExamHallRoomMutation,
  useDeleteExamHallRoomMutation,
  useUpsertResultScrutinyMutation,
  useSaveResultRemarkMutation,
} = examinationsApi;

