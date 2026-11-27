import { baseApi } from '@/src/lib/api/base-api';

export interface PreviewPromotionParams {
  academicYearId: string;
  classId: string;
  sectionId?: string;
  examId?: string;
}

export interface PromotionPreviewStudent {
  enrollmentId: string;
  studentId: string;
  studentCustomId: string;
  studentName: string;
  studentNameBn?: string | null;
  gender: string;
  photo?: string | null;
  currentSection: { id: string; name: string };
  currentGroup?: { id: string; name: string; nameBn?: string | null } | null;
  currentRoll: number;
  isRepeater: boolean;
  examResult: {
    resultSummaryId: string;
    totalMarks: number;
    gpa: number | null;
    letterGrade: string | null;
    meritPosition: number | null;
    sectionMeritPosition: number | null;
    failedSubjectCount: number;
    resultStatus: string;
  } | null;
  promotionEligibility: {
    status: 'ELIGIBLE' | 'REPEAT' | 'PENDING';
    suggestedAction: 'PROMOTE' | 'COMPLETE' | 'MANUAL_REVIEW' | 'REPEAT';
    suggestedRoll: number;
    reason: string;
  };
}

export interface PreviewPromotionResponse {
  source: {
    academicYear: { id: string; name: string; startDate: string; endDate: string; isActive: boolean };
    class: { id: string; name: string; nameBn?: string | null; numericValue: number };
    section: { id: string; name: string } | null;
  };
  target: {
    nextAcademicYear: { id: string; name: string } | null;
    nextClass: { id: string; name: string; nameBn?: string | null; numericValue: number } | null;
    isGraduatingClass: boolean;
    requiresGroupSelection: boolean;
  };
  exam: {
    id: string;
    name: string;
    examType: string;
    resultStatus: string;
    publishedAt: string | null;
  } | null;
  summary: {
    totalStudents: number;
    passedCount: number;
    failedCount: number;
    eligibleForPromotion: number;
    mustRepeat: number;
  };
  students: PromotionPreviewStudent[];
}

export interface BulkPromotionPayload {
  sourceAcademicYearId: string;
  sourceClassId: string;
  sourceSectionId: string;
  targetAcademicYearId?: string;
  targetClassId?: string;
  targetSectionId?: string;
  examId?: string;
  defaultGroupId?: string;
  groupOverrides?: Array<{
    studentId: string;
    groupId: string;
    optionalClassSubjectId?: string;
  }>;
  promotionDate?: string;
  remarks?: string;
}

export interface PromotionHistoryItem {
  id: string;
  promotionDate: string;
  remarks: string | null;
  student: {
    id: string;
    studentId: string;
    nameEn: string;
    nameBn?: string | null;
  };
  from: {
    enrollmentId: string;
    academicYear: string;
    class: string;
    section: string;
    group: string | null;
    roll: number;
  };
  to: {
    enrollmentId: string;
    academicYear: string;
    class: string;
    section: string;
    group: string | null;
    roll: number;
    isRepeater: boolean;
  };
  result: {
    examName: string;
    totalMarks: number;
    gpa: number | null;
    letterGrade: string | null;
    meritPosition: number | null;
    resultStatus: string;
  } | null;
  createdAt: string;
}

export interface QueryPromotionParams {
  page?: number;
  limit?: number;
  search?: string;
  sourceAcademicYearId?: string;
  targetAcademicYearId?: string;
  sourceClassId?: string;
  targetClassId?: string;
  sectionId?: string;
}

export interface RollbackBatchPayload {
  sourceAcademicYearId: string;
  sourceClassId: string;
  sourceSectionId: string;
  targetAcademicYearId: string;
  promotionIds?: string[];
  reason?: string;
}

export const promotionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    previewPromotion: builder.query<PreviewPromotionResponse, PreviewPromotionParams>({
      query: (params) => ({
        url: '/academic/promotions/preview',
        method: 'GET',
        params,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      providesTags: ['Students'],
    }),
    executeBulkPromotion: builder.mutation<any, BulkPromotionPayload>({
      query: (body) => ({
        url: '/academic/promotions/execute',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: ['Students', 'Audit'],
    }),
    getPromotionHistory: builder.query<
      { items: PromotionHistoryItem[]; meta?: any },
      QueryPromotionParams | void
    >({
      query: (params) => ({
        url: '/academic/promotions/history',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: any) => ({
        items: Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [],
        meta: res?.meta,
      }),
      providesTags: ['Students'],
    }),
    rollbackBatchPromotion: builder.mutation<any, RollbackBatchPayload>({
      query: (body) => ({
        url: '/academic/promotions/rollback-batch',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: ['Students', 'Audit'],
    }),
  }),
});

export const {
  usePreviewPromotionQuery,
  useExecuteBulkPromotionMutation,
  useGetPromotionHistoryQuery,
  useRollbackBatchPromotionMutation,
} = promotionsApi;
