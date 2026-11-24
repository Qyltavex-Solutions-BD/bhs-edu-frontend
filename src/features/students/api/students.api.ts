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
    createStudent: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: '/students', method: 'POST', body }),
      invalidatesTags: ['Students', 'Admissions', 'Audit'],
    }),
    updateStudent: builder.mutation<Student, Partial<Student> & { id: string }>({
      query: (body) => ({ url: '/students/update', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
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
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useUpdateEnrollmentMutation,
  useImportStudentsMutation,
  useIssueRfidCardMutation,
  useReplaceRfidCardMutation,
  useIssueTransferCertificateMutation,
  useIssueTestimonialMutation,
} = studentsApi;

