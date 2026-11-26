import { baseApi } from '@/src/lib/api/base-api';
import { CardStatus, TestimonialType } from '@/src/types/enums';
import type {
  Student,
  StudentEnrollment,
  StudentRFIDcard,
  StudentTestimonial,
  StudentTransferCertificate,
} from '@/src/types/entities';

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query<
      { items: Student[]; meta?: { total: number; page: number; limit: number } },
      { academicYearId?: string; classId?: string; sectionId?: string; search?: string; page?: number; limit?: number } | void
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
    updateEnrollment: builder.mutation<
      StudentEnrollment,
      Partial<StudentEnrollment> & { id: string }
    >({
      query: (body) => ({ url: '/students/enrollments', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),
    importStudents: builder.mutation<
      { created: number; errors: { row: number; message: string }[] },
      { academicYearId: string; rows: Array<Record<string, string>> }
    >({
      query: (body) => ({ url: '/students/import', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),
    issueRfidCard: builder.mutation<
      StudentRFIDcard,
      { studentId: string; cardNumber: string; remarks?: string | null }
    >({
      query: (body) => ({ url: '/students/rfid', method: 'POST', body }),
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
      query: (body) => ({ url: '/students/rfid/replace', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),
    issueTransferCertificate: builder.mutation<
      StudentTransferCertificate & { autoBlockedCards?: number },
      {
        studentId: string;
        tcNumber: string;
        issueDate: string;
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
      query: (body) => ({ url: '/students/tc', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),
    issueTestimonial: builder.mutation<
      StudentTestimonial,
      {
        studentId: string;
        refNumber: string;
        type: TestimonialType;
        issueDate: string;
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
      query: (body) => ({ url: '/students/testimonials', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useGetNextSuggestedRollQuery,
  useCheckStudentDuplicateQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useUpdateEnrollmentMutation,
  useImportStudentsMutation,
  useIssueRfidCardMutation,
  useReplaceRfidCardMutation,
  useIssueTransferCertificateMutation,
  useIssueTestimonialMutation,
} = studentsApi;

