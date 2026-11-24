import type {
  AcademicDocument,
  AcademicEvent,
  AcademicGroup,
  AcademicYear,
  Achievement,
  Administrator,
  AdmissionContent,
  Attendance,
  AttendancePublicSummary,
  AttendanceSmsLog,
  AuditLog,
  Book,
  Career,
  ClassRoutine,
  ClassSubject,
  ConsolidatedExamConfig,
  ContactInformation,
  Department,
  DigitalClassroom,
  DigitalResource,
  Event,
  EventCategory,
  Exam,
  ExamHallRoom,
  ExamRoutine,
  ExamSubject,
  Gallery,
  GalleryCategory,
  GalleryMedia,
  GradeRange,
  GradingScale,
  InstitutionContent,
  LeadershipMessage,
  LibraryBook,
  LibraryDistributionInfo,
  LibraryProfile,
  ManagingCommitteeMember,
  Mark,
  News,
  Notice,
  Parent,
  ParentStudent,
  Permission,
  Publication,
  QuickLink,
  ResultScrutinyRequest,
  ResultSummary,
  Role,
  RolePermission,
  SchoolClass,
  SchoolFacility,
  SchoolProfile,
  Section,
  SectionClassTeacher,
  Staff,
  StaffStructure,
  Student,
  StudentEnrollment,
  StudentPromotion,
  StudentRFIDcard,
  StudentSubjectResult,
  StudentTestimonial,
  StudentTransferCertificate,
  Subject,
  SyllabusChapterEntry,
  SyllabusFile,
  TeacherAssignment,
  User,
  UserRole,
  WebsiteBanner,
} from '@/src/types/entities';
import type {
  AppNotification,
  ClassAttendanceMethodConfig,
  FeeInvoice,
  HomeworkAssignment,
  LeaveApplication,
  LibraryLoanRecord,
  OnlineAdmissionApplication,
  RfidScanEvent,
  SmsTemplateConfig,
} from '@/src/types/proposed/future';
import {
  createAuthFixtures,
  createInstitutionFixtures,
  createStaffFixtures,
  createAcademicFixtures,
  createStudentFixtures,
  createRoutineFixtures,
  createAttendanceFixtures,
  createExaminationFixtures,
  createLibraryFixtures,
  createContentFixtures,
  createFutureFixtures,
} from './fixtures';

export interface MockDatabase {
  users: User[];
  roles: Role[];
  permissions: Permission[];
  userRoles: UserRole[];
  rolePermissions: RolePermission[];
  auditLogs: AuditLog[];
  schoolProfile: SchoolProfile;
  institutionContents: InstitutionContent[];
  facilities: SchoolFacility[];
  administrators: Administrator[];
  managingCommittee: ManagingCommitteeMember[];
  quickLinks: QuickLink[];
  departments: Department[];
  staffStructures: StaffStructure[];
  staff: Staff[];
  academicYears: AcademicYear[];
  academicGroups: AcademicGroup[];
  classes: SchoolClass[];
  sections: Section[];
  subjects: Subject[];
  books: Book[];
  classSubjects: ClassSubject[];
  students: Student[];
  rfidCards: StudentRFIDcard[];
  enrollments: StudentEnrollment[];
  promotions: StudentPromotion[];
  transferCertificates: StudentTransferCertificate[];
  testimonials: StudentTestimonial[];
  parents: Parent[];
  parentStudents: ParentStudent[];
  teacherAssignments: TeacherAssignment[];
  sectionClassTeachers: SectionClassTeacher[];
  academicDocuments: AcademicDocument[];
  syllabusFiles: SyllabusFile[];
  syllabusEntries: SyllabusChapterEntry[];
  academicEvents: AcademicEvent[];
  classRoutines: ClassRoutine[];
  attendances: Attendance[];
  attendanceSmsLogs: AttendanceSmsLog[];
  gradingScales: GradingScale[];
  gradeRanges: GradeRange[];
  exams: Exam[];
  examSubjects: ExamSubject[];
  examRoutines: ExamRoutine[];
  examHallRooms: ExamHallRoom[];
  marks: Mark[];
  studentSubjectResults: StudentSubjectResult[];
  resultSummaries: ResultSummary[];
  resultScrutinyRequests: ResultScrutinyRequest[];
  consolidatedConfigs: ConsolidatedExamConfig[];
  libraryProfile: LibraryProfile;
  libraryBooks: LibraryBook[];
  libraryDistributions: LibraryDistributionInfo[];
  digitalClassrooms: DigitalClassroom[];
  digitalResources: DigitalResource[];
  notices: Notice[];
  news: News[];
  eventCategories: EventCategory[];
  events: Event[];
  careers: Career[];
  banners: WebsiteBanner[];
  leadershipMessages: LeadershipMessage[];
  galleryCategories: GalleryCategory[];
  galleries: Gallery[];
  galleryMedia: GalleryMedia[];
  admissionContent: AdmissionContent;
  contactInfo: ContactInformation;
  attendancePublicSummaries: AttendancePublicSummary[];
  publications: Publication[];
  achievements: Achievement[];
  // Proposed / Section 12-B (BACKEND-PENDING)
  onlineAdmissions: OnlineAdmissionApplication[];
  classAttendanceConfigs: ClassAttendanceMethodConfig[];
  rfidScans: RfidScanEvent[];
  notifications: AppNotification[];
  smsTemplateConfig: SmsTemplateConfig;
  feeInvoices: FeeInvoice[];
  homeworks: HomeworkAssignment[];
  leaveApplications: LeaveApplication[];
  libraryLoans: LibraryLoanRecord[];
}

export function createInitialSeed(): MockDatabase {
  const auth = createAuthFixtures();
  const inst = createInstitutionFixtures();
  const staff = createStaffFixtures();
  const acad = createAcademicFixtures();
  const student = createStudentFixtures();
  const routine = createRoutineFixtures(acad.classSubjects);
  const attendance = createAttendanceFixtures({
    classes: acad.classes,
    enrollments: student.enrollments,
    students: student.students,
    parents: student.parents,
    parentStudents: student.parentStudents,
  });
  const exam = createExaminationFixtures(student.enrollments);
  const library = createLibraryFixtures();
  const content = createContentFixtures();
  const future = createFutureFixtures();

  return {
    ...auth,
    ...inst,
    ...staff,
    ...acad,
    ...student,
    ...routine,
    ...attendance,
    ...exam,
    ...library,
    ...content,
    ...future,
  };
}
