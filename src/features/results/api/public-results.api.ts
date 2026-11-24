import { baseApi } from '@/src/lib/api/base-api';

export interface PublicResultSearchResponse {
  status: 'FOUND' | 'WITHHELD' | 'NOT_PUBLISHED' | 'NOT_FOUND';
  messageBn?: string;
  messageEn?: string;
  resultId?: string;
  exam?: {
    id: string;
    name: string;
    examType: string;
    publishedAt?: string | null;
  };
  student?: {
    studentId: string;
    nameEn: string;
    nameBn?: string | null;
    roll: number;
    className: string;
    classNameBn: string;
    sectionName: string;
    groupName?: string | null;
    groupNameBn?: string | null;
    academicYear: string;
  };
  summary?: {
    id: string;
    totalFullMarks: number;
    totalMarks: number;
    gpa?: number | null;
    gpaWithoutOptional?: number | null;
    letterGrade?: string | null;
    meritPosition?: number | null;
    sectionMeritPosition?: number | null;
    failedSubjectCount: number;
    resultStatus: string;
    publishedAt?: string | null;
  };
  subjects?: Array<{
    subjectCode: string;
    subjectName: string;
    subjectNameBn: string;
    fullMarks: number;
    writtenMarks: number;
    mcqMarks: number;
    practicalMarks: number;
    totalMarks: number;
    letterGrade?: string | null;
    gradePoint?: number | null;
    isPassed: boolean;
    isOptional: boolean;
    bonusGradePoint: number;
    isAbsent: boolean;
  }>;
}

export interface PublicResultSearchRequest {
  examId: string;
  classId: string;
  roll?: string;
  studentIdOrReg?: string;
}

export const publicResultsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    searchPublicResult: builder.mutation<
      PublicResultSearchResponse,
      PublicResultSearchRequest
    >({
      query: (body) => ({
        url: '/public/results/search',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useSearchPublicResultMutation } = publicResultsApi;

