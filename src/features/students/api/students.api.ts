import { baseApi } from '@/src/lib/api/base-api';
import { CardStatus, StudentStatus, TestimonialType } from '@/src/types/enums';
import type {
  SchoolProfile,
  Student,
  StudentEnrollment,
  StudentRFIDcard,
  StudentTestimonial,
  StudentTransferCertificate,
} from '@/src/types/entities';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface RfidCardsResponse {
  items: any[];
  meta: PaginationMeta;
  summary: {
    totalActiveStudents: number;
    activeCardCount: number;
    lostOrDamagedCount: number;
    blockedCount: number;
    totalCardsCount: number;
    unassignedCount: number;
  };
  school: SchoolProfile | null;
  suggestedNextSeq: number;
}

export interface TransferCertificatesResponse {
  items: any[];
  meta: PaginationMeta;
  summary: {
    totalIssued: number;
    issuedThisYear: number;
    duesClearedCount: number;
    duesPendingCount: number;
    promotedLeavingCount: number;
    midSessionCount: number;
    activeStudentsCount: number;
  };
  school: SchoolProfile | null;
  suggestedTcNumber: string;
}

export interface TestimonialsResponse {
  items: any[];
  meta: PaginationMeta;
  summary: {
    totalIssued: number;
    issuedThisYear: number;
    studyCount: number;
    sscCount: number;
    activeStudentsCount: number;
  };
  school: SchoolProfile | null;
  suggestedRefNumber: string;
}

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query<
      { items: Student[]; meta?: { total: number; page: number; limit: number } },
      { academicYearId?: string; classId?: string; sectionId?: string; status?: StudentStatus; search?: string; page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: '/academic/students',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: any) => {
        const raw = response?.data ?? response;
        if (raw && Array.isArray(raw.items)) return raw;
        if (Array.isArray(raw)) return { items: raw };
        return { items: [] };
      },
      providesTags: ['Students'],
    }),
    getNextSuggestedRoll: builder.query<
      { nextRoll: number; usedRolls: number[] },
      { academicYearId: string; sectionId: string }
    >({
      query: ({ academicYearId, sectionId }) => ({
        url: '/academic/students/next-roll',
        method: 'GET',
        params: { academicYearId, sectionId },
      }),
      transformResponse: (response: any) => {
        const raw = response?.data ?? response;
        return {
          nextRoll: typeof raw?.nextRoll === 'number' ? raw.nextRoll : 1,
          usedRolls: Array.isArray(raw?.usedRolls) ? raw.usedRolls : [],
        };
      },
      providesTags: ['Students'],
    }),
    checkStudentDuplicate: builder.query<
      { birthCertConflict?: string; boardRegConflict?: string },
      { birthCertificateNo?: string; boardRegistrationNo?: string }
    >({
      query: (params) => ({
        url: '/academic/students/check-duplicate',
        method: 'GET',
        params,
      }),
      transformResponse: (response: any) => response?.data ?? response ?? {},
    }),
    getStudentById: builder.query<Student, string>({
      query: (id) => ({
        url: `/academic/students/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      providesTags: (_result, _error, id) => [{ type: 'Students', id }, 'Students'],
    }),
    createStudent: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: '/academic/students', method: 'POST', body }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Students', 'Admissions', 'Audit'],
    }),
    updateStudent: builder.mutation<Student, Partial<Student> & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `/academic/students/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Students', id },
        'Students',
        'Audit',
      ],
    }),
    getEnrollments: builder.query<
      StudentEnrollment[],
      { academicYearId?: string } | void
    >({
      query: (params) => ({
        url: '/academic/students/enrollments',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: any) => {
        const raw = response?.data ?? response;
        return Array.isArray(raw) ? raw : [];
      },
      providesTags: ['Students'],
    }),
    updateEnrollment: builder.mutation<
      StudentEnrollment,
      Partial<StudentEnrollment> & { id: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/academic/students/enrollments/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Students', 'Audit'],
    }),
    importStudents: builder.mutation<
      { created: number; errors: { row: number; message: string }[] },
      { academicYearId: string; rows: Array<Record<string, string>> }
    >({
      query: (body) => ({ url: '/students/import', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),
    getRfidCards: builder.query<
      RfidCardsResponse,
      { page?: number; limit?: number; search?: string; classId?: string; status?: CardStatus } | void
    >({
      query: (params) => ({
        url: '/academic/rfid-cards',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: any): RfidCardsResponse => {
        const d = response?.data ?? response ?? {};
        return {
          items: d.items ?? [],
          meta: response?.meta ?? {
            page: 1,
            limit: 15,
            total: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          summary: d.summary ?? {
            totalActiveStudents: 0,
            activeCardCount: 0,
            lostOrDamagedCount: 0,
            blockedCount: 0,
            totalCardsCount: 0,
            unassignedCount: 0,
          },
          school: d.school ?? null,
          suggestedNextSeq: d.suggestedNextSeq ?? 8841,
        };
      },
      providesTags: ['Students'],
    }),
    getUnassignedRfidStudents: builder.query<
      RfidCardsResponse,
      { page?: number; limit?: number; search?: string; classId?: string } | void
    >({
      query: (params) => ({
        url: '/academic/rfid-cards/unassigned',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: any): RfidCardsResponse => {
        const d = response?.data ?? response ?? {};
        return {
          items: d.items ?? [],
          meta: response?.meta ?? {
            page: 1,
            limit: 15,
            total: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          summary: d.summary ?? {
            totalActiveStudents: 0,
            activeCardCount: 0,
            lostOrDamagedCount: 0,
            blockedCount: 0,
            totalCardsCount: 0,
            unassignedCount: 0,
          },
          school: d.school ?? null,
          suggestedNextSeq: d.suggestedNextSeq ?? 8841,
        };
      },
      providesTags: ['Students'],
    }),
    issueRfidCard: builder.mutation<
      StudentRFIDcard,
      { studentId: string; cardNumber: string; remarks?: string | null }
    >({
      query: (body) => ({
        url: '/academic/rfid-cards',
        method: 'POST',
        body: {
          studentId: body.studentId,
          cardNumber: body.cardNumber,
          remarks: body.remarks ?? undefined,
        },
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Students', 'Audit'],
    }),
    updateRfidCardStatus: builder.mutation<
      StudentRFIDcard,
      { id: string; status: CardStatus; remarks?: string | null }
    >({
      query: ({ id, status, remarks }) => ({
        url: `/academic/rfid-cards/${id}/status`,
        method: 'PATCH',
        body: { status, remarks: remarks ?? undefined },
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Students', 'Audit'],
    }),
    replaceRfidCard: builder.mutation<
      { oldCard: StudentRFIDcard; newCard: StudentRFIDcard },
      {
        oldCardId: string;
        oldCardStatus: CardStatus.LOST | CardStatus.DAMAGED | CardStatus.BLOCKED;
        newCardNumber: string;
        remarks?: string | null;
      }
    >({
      query: ({ oldCardId, oldCardStatus, newCardNumber, remarks }) => ({
        url: `/academic/rfid-cards/${oldCardId}/replace`,
        method: 'POST',
        body: {
          oldCardStatus,
          newCardNumber,
          remarks: remarks ?? undefined,
        },
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Students', 'Audit'],
    }),
    getTransferCertificates: builder.query<
      TransferCertificatesResponse,
      {
        page?: number;
        limit?: number;
        search?: string;
        duesStatus?: 'ALL' | 'CLEARED' | 'PENDING';
        promotionStatus?: 'ALL' | 'PROMOTED' | 'MID';
      } | void
    >({
      query: (params) => ({
        url: '/academic/transfer-certificates',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: any): TransferCertificatesResponse => {
        const d = response?.data ?? response ?? {};
        return {
          items: d.items ?? [],
          meta: response?.meta ?? {
            page: 1,
            limit: 15,
            total: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          summary: d.summary ?? {
            totalIssued: 0,
            issuedThisYear: 0,
            duesClearedCount: 0,
            duesPendingCount: 0,
            promotedLeavingCount: 0,
            midSessionCount: 0,
            activeStudentsCount: 0,
          },
          school: d.school ?? null,
          suggestedTcNumber: d.suggestedTcNumber ?? '',
        };
      },
      providesTags: ['Students'],
    }),
    issueTransferCertificate: builder.mutation<
      StudentTransferCertificate & { autoBlockedCards?: number },
      {
        studentId: string;
        tcNumber?: string;
        issueDate?: string;
        leavingDate: string;
        reason: string;
        duesCleared: boolean;
        conductRemarks?: string | null;
        leavingClass?: string | null;
        promotedToNextClass: boolean;
        destinationSchool?: string | null;
        remarks?: string | null;
      }
    >({
      query: (body) => ({
        url: '/academic/transfer-certificates',
        method: 'POST',
        body: {
          ...body,
          conductRemarks: body.conductRemarks ?? undefined,
          leavingClass: body.leavingClass ?? undefined,
          destinationSchool: body.destinationSchool ?? undefined,
          remarks: body.remarks ?? undefined,
        },
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Students', 'Audit'],
    }),
    getTestimonials: builder.query<
      TestimonialsResponse,
      { page?: number; limit?: number; search?: string; type?: TestimonialType } | void
    >({
      query: (params) => ({
        url: '/academic/testimonials',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: any): TestimonialsResponse => {
        const d = response?.data ?? response ?? {};
        return {
          items: d.items ?? [],
          meta: response?.meta ?? {
            page: 1,
            limit: 15,
            total: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          summary: d.summary ?? {
            totalIssued: 0,
            issuedThisYear: 0,
            studyCount: 0,
            sscCount: 0,
            activeStudentsCount: 0,
          },
          school: d.school ?? null,
          suggestedRefNumber: d.suggestedRefNumber ?? '',
        };
      },
      providesTags: ['Students'],
    }),
    issueTestimonial: builder.mutation<
      StudentTestimonial,
      {
        studentId: string;
        refNumber?: string;
        type: TestimonialType;
        issueDate?: string;
        academicSession: string;
        className: string;
        sectionName?: string | null;
        roll?: number | null;
        groupName?: string | null;
        purpose?: string | null;
        conductRemarks?: string | null;
        boardName?: string | null;
        passingYear?: string | null;
        boardRoll?: string | null;
        registrationNo?: string | null;
        gpa?: string | null;
        letterGrade?: string | null;
        remarks?: string | null;
      }
    >({
      query: (body) => ({
        url: '/academic/testimonials',
        method: 'POST',
        body: {
          ...body,
          sectionName: body.sectionName ?? undefined,
          roll: body.roll ?? undefined,
          groupName: body.groupName ?? undefined,
          purpose: body.purpose ?? undefined,
          conductRemarks: body.conductRemarks ?? undefined,
          boardName: body.boardName ?? undefined,
          passingYear: body.passingYear ?? undefined,
          boardRoll: body.boardRoll ?? undefined,
          registrationNo: body.registrationNo ?? undefined,
          gpa: body.gpa ?? undefined,
          letterGrade: body.letterGrade ?? undefined,
          remarks: body.remarks ?? undefined,
        },
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Students', 'Audit'],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useGetEnrollmentsQuery,
  useGetNextSuggestedRollQuery,
  useCheckStudentDuplicateQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useUpdateEnrollmentMutation,
  useImportStudentsMutation,
  useGetRfidCardsQuery,
  useGetUnassignedRfidStudentsQuery,
  useIssueRfidCardMutation,
  useUpdateRfidCardStatusMutation,
  useReplaceRfidCardMutation,
  useGetTransferCertificatesQuery,
  useIssueTransferCertificateMutation,
  useGetTestimonialsQuery,
  useIssueTestimonialMutation,
} = studentsApi;

