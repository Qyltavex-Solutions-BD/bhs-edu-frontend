import { createApi, fetchBaseQuery, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { handleMockRequest } from '@/src/mocks/mockAdapter';
import type { MockDatabase } from '@/src/mocks/seed';
import type { RootState } from './index';
import type {
  AcademicDocumentType,
  AcademicEventType,
  SubjectCategory,
  CardStatus,
  AttendanceMethod,
  AttendanceStatus,
  NoticeStatus,
  PromotionType,
  RelationshipType,
  TestimonialType,
} from '@/src/types/enums';
import type {
  AcademicDocument,
  AcademicEvent,
  AcademicGroup,
  AcademicYear,
  AdmissionContent,
  Book,
  ClassSubject,
  ConsolidatedExamConfig,
  Department,
  Exam,
  ExamHallRoom,
  ExamSubject,
  GradeRange,
  GradingScale,
  ClassRoutine,
  Parent,
  ParentStudent,
  ResultScrutinyRequest,
  ResultSummary,
  SchoolClass,
  SchoolProfile,
  Section,
  Subject,
  SectionClassTeacher,
  Student,
  StudentEnrollment,
  StudentRFIDcard,
  StudentTestimonial,
  StudentTransferCertificate,
  Staff,
  StaffStructure,
  TeacherAssignment,
  SyllabusChapterEntry,
  SyllabusFile,
} from '@/src/types/entities';
import type {
  AdmissionApplicationStatus,
  ClassAttendanceMethodConfig,
  OnlineAdmissionApplication,
} from '@/src/types/proposed/future';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const realFetchBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

interface CustomQueryArgs {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

const hybridBaseQuery: BaseQueryFn<CustomQueryArgs, unknown, { status: number; message: string }> =
  async (args, api, extraOptions) => {
    if (USE_MOCK) {
      const res = await handleMockRequest(args.url, args.method ?? 'GET', args.body);
      if (res.error) return { error: res.error };
      return { data: res.data };
    }

    const result = await realFetchBaseQuery(args, api, extraOptions);
    if (result.error) {
      const status = typeof result.error.status === 'number' ? result.error.status : 500;
      const errData = result.error.data as
        | {
            message?: string;
            errors?: Array<{ field: string; message: string; value?: unknown }>;
          }
        | undefined;
      const validationMessage = errData?.errors?.[0]?.message;
      return {
        error: {
          status,
          message: validationMessage ?? errData?.message ?? 'API request failed',
        },
      };
    }
    return { data: result.data };
  };

export const schoolApi = createApi({
  reducerPath: 'schoolApi',
  baseQuery: hybridBaseQuery,
  tagTypes: [
    'Bootstrap',
    'Institution',
    'Students',
    'Staff',
    'Academic',
    'Attendance',
    'Exams',
    'Results',
    'Notices',
    'Admissions',
    'Notifications',
    'Audit',
  ],
  endpoints: (builder) => ({
    getBootstrap: builder.query<MockDatabase, void>({
      query: () => ({ url: '/bootstrap', method: 'GET' }),
      providesTags: [
        'Bootstrap',
        'Institution',
        'Students',
        'Staff',
        'Academic',
        'Attendance',
        'Exams',
        'Results',
        'Notices',
        'Admissions',
        'Notifications',
        'Audit',
      ],
    }),

    login: builder.mutation<
      {
        accessToken: string;
        refreshToken?: string;
        user: {
          id: string;
          name: string;
          email: string;
          phone: string;
          roles: string[];
          permissions: string[];
        };
      },
      { email: string; password: string }
    >({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: (response: any) => response?.data ?? response,
    }),

    searchPublicResult: builder.mutation<
      {
        status: 'FOUND' | 'WITHHELD' | 'NOT_PUBLISHED' | 'NOT_FOUND';
        messageBn?: string;
        messageEn?: string;
        resultId?: string;
        exam?: { id: string; name: string; examType: string; publishedAt?: string | null };
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
      },
      { examId: string; classId: string; roll?: string; studentIdOrReg?: string }
    >({
      query: (body) => ({ url: '/public/results/search', method: 'POST', body }),
    }),

    submitAdmissionApplication: builder.mutation<
      OnlineAdmissionApplication,
      Omit<
        OnlineAdmissionApplication,
        'id' | 'applicationNumber' | 'status' | 'submittedAt' | 'admissionTestRoll' | 'admissionTestDate'
      >
    >({
      query: (body) => ({ url: '/public/admissions', method: 'POST', body }),
      invalidatesTags: ['Admissions', 'Notifications'],
    }),

    updateAdmissionStatus: builder.mutation<
      OnlineAdmissionApplication,
      {
        id: string;
        status: AdmissionApplicationStatus;
        sectionId?: string;
        roll?: number;
        academicYearId?: string;
        formSerialNo?: string;
        verifiedDocuments?: Record<string, boolean>;
      }
    >({
      query: (body) => ({ url: '/admin/admissions/status', method: 'POST', body }),
      invalidatesTags: ['Admissions', 'Students', 'Audit'],
    }),

    updateSchoolProfile: builder.mutation<SchoolProfile, Partial<SchoolProfile>>({
      query: (body) => ({ url: '/admin/institution/profile', method: 'PUT', body }),
      invalidatesTags: ['Institution', 'Audit'],
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

    updateExam: builder.mutation<Exam, Partial<Exam> & { id: string }>({
      query: (body) => ({ url: '/exams/update', method: 'POST', body }),
      invalidatesTags: ['Exams', 'Results', 'Audit'],
    }),

    upsertExamSubject: builder.mutation<ExamSubject, Partial<ExamSubject> & { examId: string; subjectId: string }>({
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

    upsertGradeRange: builder.mutation<GradeRange, Partial<GradeRange> & { gradingScaleId: string }>({
      query: (body) => ({ url: '/exams/grade-ranges/upsert', method: 'POST', body }),
      invalidatesTags: ['Exams', 'Results', 'Audit'],
    }),

    deleteGradeRange: builder.mutation<{ deletedId: string }, { id: string }>({
      query: (body) => ({ url: '/exams/grade-ranges/delete', method: 'POST', body }),
      invalidatesTags: ['Exams', 'Results', 'Audit'],
    }),

    saveConsolidatedConfig: builder.mutation<
      ConsolidatedExamConfig[],
      { consolidatedExamId: string; items: Array<{ sourceExamId: string; weightagePercentage: number }> }
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

    saveResultRemark: builder.mutation<ResultSummary, { resultSummaryId: string; teacherRemarks: string }>({
      query: (body) => ({ url: '/exams/remarks/save', method: 'POST', body }),
      invalidatesTags: ['Results', 'Audit'],
    }),

    saveAttendanceBatch: builder.mutation<
      { saved: number; smsQueued: number },
      {
        date: string;
        markedBy: string;
        academicYearId: string;
        entries: Array<{
          studentEnrollmentId: string;
          status: AttendanceStatus;
          method: AttendanceMethod;
          remarks?: string;
        }>;
      }
    >({
      query: (body) => ({ url: '/attendance/batch', method: 'POST', body }),
      invalidatesTags: ['Attendance', 'Audit'],
    }),

    retryAttendanceSms: builder.mutation<unknown, { id: string }>({
      query: (body) => ({ url: '/attendance/sms/retry', method: 'POST', body }),
      invalidatesTags: ['Attendance', 'Audit'],
    }),

    retryAllAttendanceSms: builder.mutation<{ retried: number }, void>({
      query: () => ({ url: '/attendance/sms/retry-all', method: 'POST', body: {} }),
      invalidatesTags: ['Attendance', 'Audit'],
    }),

    updateAttendanceConfig: builder.mutation<ClassAttendanceMethodConfig, ClassAttendanceMethodConfig>({
      query: (body) => ({ url: '/attendance/config', method: 'PUT', body }),
      invalidatesTags: ['Attendance', 'Audit'],
    }),

    simulateRfidScan: builder.mutation<
      {
        id: string;
        cardNumber: string;
        studentId: string | null;
        studentName: string | null;
        className: string | null;
        scannedAt: string;
        deviceLocation: string;
        direction: 'ENTRY' | 'EXIT';
        isKnownCard: boolean;
        recorded?: boolean;
        message?: string;
      },
      { cardNumber: string; direction: 'ENTRY' | 'EXIT'; date?: string }
    >({
      query: (body) => ({ url: '/attendance/rfid/simulate', method: 'POST', body }),
      invalidatesTags: ['Attendance'],
    }),

    createNotice: builder.mutation<
      unknown,
      {
        memoNo?: string | null;
        title: string;
        description: string;
        attachment?: string | null;
        attachmentType?: 'PDF' | 'IMAGE' | 'OFFICIAL_PAD' | null;
        attachmentUrl?: string | null;
        attachmentSize?: string | null;
        status: NoticeStatus;
        isUrgent?: boolean;
        audience?: 'ALL' | 'PARENTS' | 'TEACHERS' | 'STUDENTS';
        createdBy?: string;
      }
    >({
      query: (body) => ({ url: '/notices', method: 'POST', body }),
      invalidatesTags: ['Notices', 'Audit'],
    }),

    createStudent: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: '/students', method: 'POST', body }),
      invalidatesTags: ['Students', 'Admissions', 'Audit'],
    }),

    updateStudent: builder.mutation<Student, Partial<Student> & { id: string }>({
      query: (body) => ({ url: '/students/update', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),

    updateEnrollment: builder.mutation<StudentEnrollment, Partial<StudentEnrollment> & { id: string }>({
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

    saveAcademicYear: builder.mutation<AcademicYear, Partial<AcademicYear>>({
      query: (body) => ({ url: '/academic/years', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    setActiveAcademicYear: builder.mutation<AcademicYear, { id: string }>({
      query: (body) => ({ url: '/academic/years/set-active', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    saveAcademicGroup: builder.mutation<AcademicGroup, Partial<AcademicGroup>>({
      query: (body) => ({ url: '/academic/groups', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    saveSection: builder.mutation<Section, Partial<Section>>({
      query: (body) => ({ url: '/academic/sections', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    saveMasterSubject: builder.mutation<
      Subject,
      {
        id?: string;
        name: string;
        nameBn: string;
        officialCode?: string | null;
        category: SubjectCategory;
        description?: string | null;
        isActive?: boolean;
      }
    >({
      query: (body) => ({ url: '/academic/subjects', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    removeMasterSubject: builder.mutation<{ id: string }, { id: string }>({
      query: (body) => ({ url: '/academic/subjects/remove', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    saveClassSubject: builder.mutation<ClassSubject, Partial<ClassSubject>>({
      query: (body) => ({ url: '/academic/class-subjects', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    removeClassSubject: builder.mutation<{ deletedId: string }, { id: string }>({
      query: (body) => ({ url: '/academic/class-subjects/remove', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    rolloverClassSubjects: builder.mutation<
      { copiedCount: number; skippedCount: number },
      { fromAcademicYearId: string; toAcademicYearId: string }
    >({
      query: (body) => ({ url: '/academic/class-subjects/rollover', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    saveBook: builder.mutation<Book, Partial<Book> & { academicYearId?: string }>({
      query: (body) => ({ url: '/academic/books', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    saveClassTeacher: builder.mutation<
      SectionClassTeacher,
      { academicYearId: string; sectionId: string; staffId: string }
    >({
      query: (body) => ({ url: '/academic/class-teachers', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    removeClassTeacher: builder.mutation<{ deletedId: string }, { id: string }>({
      query: (body) => ({ url: '/academic/class-teachers/remove', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    saveTeacherAssignment: builder.mutation<
      TeacherAssignment,
      { academicYearId: string; sectionId: string; classSubjectId: string; staffId: string; canEnterMarks?: boolean }
    >({
      query: (body) => ({ url: '/academic/teacher-assignments', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    removeTeacherAssignment: builder.mutation<{ deletedId: string }, { id: string }>({
      query: (body) => ({ url: '/academic/teacher-assignments/remove', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    addClassRoutine: builder.mutation<ClassRoutine, Omit<ClassRoutine, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (body) => ({ url: '/academic/routines', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Audit'],
    }),

    createStaff: builder.mutation<Staff, Partial<Staff>>({
      query: (body) => ({ url: '/staff', method: 'POST', body }),
      invalidatesTags: ['Staff', 'Audit'],
    }),

    updateStaff: builder.mutation<Staff, Partial<Staff> & { id: string }>({
      query: (body) => ({ url: '/staff/update', method: 'POST', body }),
      invalidatesTags: ['Staff', 'Audit'],
    }),

    saveDepartment: builder.mutation<Department, Partial<Department>>({
      query: (body) => ({ url: '/staff/departments', method: 'POST', body }),
      invalidatesTags: ['Staff', 'Audit'],
    }),

    removeDepartment: builder.mutation<{ id: string }, { id: string }>({
      query: (body) => ({ url: '/staff/departments/remove', method: 'POST', body }),
      invalidatesTags: ['Staff', 'Audit'],
    }),

    saveStaffStructure: builder.mutation<StaffStructure, Partial<StaffStructure>>({
      query: (body) => ({ url: '/staff/structures', method: 'POST', body }),
      invalidatesTags: ['Staff', 'Audit'],
    }),

    updateRfidCardStatus: builder.mutation<
      StudentRFIDcard,
      { id: string; status: CardStatus; remarks?: string | null }
    >({
      query: (body) => ({ url: '/students/rfid/status', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),

    markNotificationRead: builder.mutation<unknown, { id?: string }>({
      query: (body) => ({ url: '/notifications/read', method: 'POST', body }),
      invalidatesTags: ['Notifications'],
    }),

    toggleRolePermission: builder.mutation<unknown, { roleId: string; permissionId: string }>({
      query: (body) => ({ url: '/roles/permission-toggle', method: 'POST', body }),
      invalidatesTags: ['Audit', 'Bootstrap'],
    }),

    promoteStudents: builder.mutation<
      { promoted: number; retained: number; graduated: number },
      {
        toAcademicYearId: string;
        items: Array<{
          studentId: string;
          fromEnrollmentId: string;
          toClassId?: string;
          toSectionId?: string;
          toGroupId?: string | null;
          roll?: number;
          resultSummaryId?: string | null;
          remarks?: string | null;
          promotionType: PromotionType | 'GRADUATED';
        }>;
      }
    >({
      query: (body) => ({ url: '/students/promote', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),

    toggleArchive: builder.mutation<
      unknown,
      { collection: 'exams' | 'gradingScales' | 'staffStructures'; id: string }
    >({
      query: (body) => ({ url: '/archive/toggle', method: 'POST', body }),
      invalidatesTags: ['Exams', 'Staff', 'Audit'],
    }),

    toggleCmsItem: builder.mutation<
      unknown,
      {
        collection:
          | 'banners'
          | 'quickLinks'
          | 'notices'
          | 'news'
          | 'events'
          | 'careers'
          | 'publications'
          | 'achievements'
          | 'digitalResources'
          | 'digitalClassrooms'
          | 'libraryDistributions'
          | 'leadershipMessages'
          | 'institutionContents'
          | 'facilities'
          | 'galleryCategories'
          | 'galleries';
        id: string;
        field: 'isActive' | 'isPublished';
      }
    >({
      query: (body) => ({ url: '/cms/toggle', method: 'POST', body }),
      invalidatesTags: ['Bootstrap', 'Institution', 'Notices', 'Audit'],
    }),

    upsertCmsItem: builder.mutation<
      unknown,
      {
        collection:
          | 'banners'
          | 'quickLinks'
          | 'institutionContents'
          | 'facilities'
          | 'leadershipMessages'
          | 'managingCommittee'
          | 'news'
          | 'events'
          | 'careers'
          | 'galleryCategories'
          | 'galleries'
          | 'galleryMedia'
          | 'publications'
          | 'achievements'
          | 'libraryBooks'
          | 'libraryDistributions'
          | 'digitalClassrooms'
          | 'digitalResources'
          | 'examRoutines';
        item: Record<string, unknown>;
      }
    >({
      query: (body) => ({ url: '/cms/upsert', method: 'POST', body }),
      invalidatesTags: ['Bootstrap', 'Institution', 'Notices', 'Exams', 'Results', 'Audit'],
    }),

    deleteCmsItem: builder.mutation<
      { deletedId: string },
      {
        collection:
          | 'banners'
          | 'quickLinks'
          | 'institutionContents'
          | 'facilities'
          | 'leadershipMessages'
          | 'managingCommittee'
          | 'news'
          | 'events'
          | 'careers'
          | 'galleryCategories'
          | 'galleries'
          | 'galleryMedia'
          | 'publications'
          | 'achievements'
          | 'libraryBooks'
          | 'libraryDistributions'
          | 'digitalClassrooms'
          | 'digitalResources'
          | 'examRoutines';
        id: string;
      }
    >({
      query: (body) => ({ url: '/cms/delete', method: 'POST', body }),
      invalidatesTags: ['Bootstrap', 'Institution', 'Notices', 'Exams', 'Results', 'Audit'],
    }),

    updateContactInfo: builder.mutation<
      unknown,
      { address: string; phone?: string | null; email?: string | null; mapUrl?: string | null }
    >({
      query: (body) => ({ url: '/cms/contact-info', method: 'PUT', body }),
      invalidatesTags: ['Bootstrap', 'Institution', 'Audit'],
    }),

    updateAdmissionContent: builder.mutation<AdmissionContent, Partial<AdmissionContent>>({
      query: (body) => ({ url: '/cms/admission-content', method: 'PUT', body }),
      invalidatesTags: ['Bootstrap', 'Admissions', 'Audit'],
    }),

    createExam: builder.mutation<Exam, Partial<Exam>>({
      query: (body) => ({ url: '/exams', method: 'POST', body }),
      invalidatesTags: ['Exams', 'Audit'],
    }),

    reorderCmsItems: builder.mutation<
      unknown,
      { collection: 'banners' | 'quickLinks' | 'galleryMedia' | 'galleryCategories'; orderedIds: string[] }
    >({
      query: (body) => ({ url: '/cms/reorder', method: 'POST', body }),
      invalidatesTags: ['Bootstrap', 'Audit'],
    }),

    moveClassRoutineSlot: builder.mutation<
      ClassRoutine,
      { routineId: string; targetDay: ClassRoutine['day']; targetPeriodNumber: number }
    >({
      query: (body) => ({ url: '/academic/routines/move', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Audit'],
    }),

    removeClassRoutine: builder.mutation<{ id: string }, { id: string }>({
      query: (body) => ({ url: '/academic/routines/remove', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    saveSyllabusFile: builder.mutation<
      SyllabusFile,
      Omit<SyllabusFile, 'id' | 'createdAt' | 'updatedAt'>
    >({
      query: (body) => ({ url: '/academic/syllabus/files', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    addSyllabusEntry: builder.mutation<
      SyllabusChapterEntry,
      Omit<SyllabusChapterEntry, 'id'>
    >({
      query: (body) => ({ url: '/academic/syllabus/entries', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    removeSyllabusFile: builder.mutation<{ id: string }, { id: string }>({
      query: (body) => ({ url: '/academic/syllabus/files/remove', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    removeSyllabusEntry: builder.mutation<{ id: string }, { id: string }>({
      query: (body) => ({ url: '/academic/syllabus/entries/remove', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    saveAcademicEvent: builder.mutation<
      AcademicEvent,
      {
        id?: string;
        academicYearId: string;
        title: string;
        description?: string | null;
        eventType: AcademicEventType;
        startDate: string;
        endDate: string;
      }
    >({
      query: (body) => ({ url: '/academic/events', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    saveAcademicDocument: builder.mutation<
      AcademicDocument,
      {
        id?: string;
        type: AcademicDocumentType;
        title: string;
        description?: string | null;
        fileUrl?: string | null;
        isPublished?: boolean;
      }
    >({
      query: (body) => ({ url: '/academic/documents', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    removeAcademicDocument: builder.mutation<{ id: string }, { id: string }>({
      query: (body) => ({ url: '/academic/documents/remove', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    removeAcademicEvent: builder.mutation<{ id: string }, { id: string }>({
      query: (body) => ({ url: '/academic/events/remove', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    saveParent: builder.mutation<Parent, Partial<Parent>>({
      query: (body) => ({ url: '/parents', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),

    updateParent: builder.mutation<Parent, Partial<Parent> & { id: string }>({
      query: (body) => ({ url: '/parents/update', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),

    removeParent: builder.mutation<{ id: string }, { id: string }>({
      query: (body) => ({ url: '/parents/remove', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),

    linkParent: builder.mutation<
      ParentStudent,
      {
        parentId: string;
        studentId: string;
        relationship: RelationshipType;
        isPrimary?: boolean;
        isEmergencyContact?: boolean;
        isSmsReceiver?: boolean;
      }
    >({
      query: (body) => ({ url: '/parents/link', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),

    updateParentLink: builder.mutation<
      ParentStudent,
      {
        id: string;
        relationship?: RelationshipType;
        isPrimary?: boolean;
        isEmergencyContact?: boolean;
        isSmsReceiver?: boolean;
      }
    >({
      query: (body) => ({ url: '/parents/link/update', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),

    unlinkParent: builder.mutation<{ id: string }, { id: string }>({
      query: (body) => ({ url: '/parents/unlink', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),
  }),
});

export const {
  useGetBootstrapQuery,
  useLoginMutation,
  useSearchPublicResultMutation,
  useSubmitAdmissionApplicationMutation,
  useUpdateAdmissionStatusMutation,
  useUpdateSchoolProfileMutation,
  useSaveMarksBatchMutation,
  useProcessExamResultsMutation,
  useSaveAttendanceBatchMutation,
  useRetryAttendanceSmsMutation,
  useRetryAllAttendanceSmsMutation,
  useUpdateAttendanceConfigMutation,
  useSimulateRfidScanMutation,
  useCreateNoticeMutation,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useUpdateEnrollmentMutation,
  useImportStudentsMutation,
  useIssueRfidCardMutation,
  useReplaceRfidCardMutation,
  useIssueTransferCertificateMutation,
  useIssueTestimonialMutation,
  useSaveAcademicYearMutation,
  useSetActiveAcademicYearMutation,
  useSaveAcademicGroupMutation,
  useSaveSectionMutation,
  useSaveMasterSubjectMutation,
  useRemoveMasterSubjectMutation,
  useSaveClassSubjectMutation,
  useRemoveClassSubjectMutation,
  useRolloverClassSubjectsMutation,
  useSaveBookMutation,
  useSaveClassTeacherMutation,
  useRemoveClassTeacherMutation,
  useSaveTeacherAssignmentMutation,
  useRemoveTeacherAssignmentMutation,
  useAddClassRoutineMutation,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useSaveDepartmentMutation,
  useRemoveDepartmentMutation,
  useSaveStaffStructureMutation,
  useUpdateRfidCardStatusMutation,
  useMarkNotificationReadMutation,
  useToggleRolePermissionMutation,
  usePromoteStudentsMutation,
  useToggleArchiveMutation,
  useToggleCmsItemMutation,
  useUpsertCmsItemMutation,
  useDeleteCmsItemMutation,
  useUpdateContactInfoMutation,
  useUpdateAdmissionContentMutation,
  useCreateExamMutation,
  useUpdateExamMutation,
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
  useReorderCmsItemsMutation,
  useMoveClassRoutineSlotMutation,
  useRemoveClassRoutineMutation,
  useSaveSyllabusFileMutation,
  useRemoveSyllabusFileMutation,
  useAddSyllabusEntryMutation,
  useRemoveSyllabusEntryMutation,
  useSaveAcademicEventMutation,
  useRemoveAcademicEventMutation,
  useSaveParentMutation,
  useUpdateParentMutation,
  useRemoveParentMutation,
  useLinkParentMutation,
  useUpdateParentLinkMutation,
  useUnlinkParentMutation,
  useSaveAcademicDocumentMutation,
  useRemoveAcademicDocumentMutation,
} = schoolApi;

export * from '@/src/services/academic/class.api';
