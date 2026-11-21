import {
  AcademicDocumentType,
  AcademicEventType,
  AchievementType,
  AttendanceMethod,
  AttendanceSmsType,
  AttendanceStatus,
  BloodGroup,
  BookType,
  CardStatus,
  DepartmentStatus,
  EmploymentType,
  EnrollmentStatus,
  EventCategoryType,
  ExamRoutineStatus,
  ExamStatus,
  ExamType,
  FacilityType,
  Gender,
  InstitutionContentType,
  LeadershipType,
  LibraryDistributionType,
  MediaType,
  NoticeStatus,
  PromotionType,
  PublicationType,
  RelationshipType,
  Religion,
  ResourceType,
  ResultPublicationStatus,
  ResultStatus,
  SmsStatus,
  StaffStatus,
  StaffType,
  StudentStatus,
  SubjectCategory,
  WeekDay,
} from '@/src/types/enums';
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
  ExamRoutine,
  ExamSubject,
  Gallery,
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
import { PERMISSIONS } from '@/src/lib/permissions';
import { calculateOverallGpa, resolveGradeFromScale } from '@/src/lib/formatters';

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
  marks: Mark[];
  studentSubjectResults: StudentSubjectResult[];
  resultSummaries: ResultSummary[];
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

const NOW = '2026-11-19T09:00:00.000Z';

export function createInitialSeed(): MockDatabase {
  // 1. Roles & Permissions
  const roles: Role[] = [
    { id: 'role-super-admin', name: 'SUPER_ADMIN', description: 'সিস্টেম সুপার অ্যাডমিন (পূর্ণ অধিকার)' },
    { id: 'role-school-admin', name: 'SCHOOL_ADMIN', description: 'বিদ্যালয় প্রশাসক' },
    { id: 'role-principal', name: 'PRINCIPAL', description: 'প্রধান শিক্ষক' },
    { id: 'role-teacher', name: 'TEACHER', description: 'শ্রেণি ও বিষয়ভিত্তিক শিক্ষক' },
    { id: 'role-parent', name: 'PARENT', description: 'অভিভাবক' },
    { id: 'role-student', name: 'STUDENT', description: 'শিক্ষার্থী' },
    { id: 'role-accountant', name: 'ACCOUNTANT', description: 'হিসাবরক্ষক (ভবিষ্যৎ মডিউল)' },
    { id: 'role-librarian', name: 'LIBRARIAN', description: 'গ্রন্থাগারিক (ভবিষ্যৎ মডিউল)' },
    { id: 'role-staff', name: 'STAFF', description: 'অফিস সহায়ক ও কর্মচারী' },
  ];

  const permissions: Permission[] = Object.entries(PERMISSIONS).map(([k, v], i) => ({
    id: `perm-${i + 1}`,
    name: v,
    description: k.replace(/_/g, ' '),
  }));

  const users: User[] = [
    { id: 'user-admin', name: 'মোঃ রফিকুল ইসলাম (ডেমো অ্যাডমিন)', email: 'admin@bhs.edu.bd', phone: '01711000001', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'user-principal', name: 'প্রধান শিক্ষক (ডেমো প্রোফাইল)', email: 'principal@bhs.edu.bd', phone: '01711000002', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'user-teacher-1', name: 'মোঃ কামরুল হাসান (ডেমো শিক্ষক)', email: 'kamrul@bhs.edu.bd', phone: '01711000003', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'user-teacher-2', name: 'সাবিনা ইয়াসমিন (ডেমো শিক্ষক)', email: 'sabina@bhs.edu.bd', phone: '01711000004', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'user-parent-1', name: 'মোঃ আবুল কালাম (ডেমো অভিভাবক)', email: 'parent@bhs.edu.bd', phone: '01711000010', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'user-student-1', name: 'তানভীর আহমেদ (ডেমো শিক্ষার্থী)', email: 'student@bhs.edu.bd', phone: '01711000020', isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  const userRoles: UserRole[] = [
    { id: 'ur-1', userId: 'user-admin', roleId: 'role-super-admin' },
    { id: 'ur-2', userId: 'user-principal', roleId: 'role-principal' },
    { id: 'ur-3', userId: 'user-teacher-1', roleId: 'role-teacher' },
    { id: 'ur-4', userId: 'user-teacher-2', roleId: 'role-teacher' },
    { id: 'ur-5', userId: 'user-parent-1', roleId: 'role-parent' },
    { id: 'ur-6', userId: 'user-student-1', roleId: 'role-student' },
  ];

  const rolePermissions: RolePermission[] = [];
  permissions.forEach((p, idx) => {
    rolePermissions.push({ id: `rp-sa-${idx}`, roleId: 'role-super-admin', permissionId: p.id });
    if (p.name !== PERMISSIONS.ROLES_MANAGE) {
      rolePermissions.push({ id: `rp-adm-${idx}`, roleId: 'role-school-admin', permissionId: p.id });
    }
    if ([PERMISSIONS.REPORTS_VIEW, PERMISSIONS.RESULTS_PUBLISH, PERMISSIONS.NOTICES_MANAGE, PERMISSIONS.AUDIT_VIEW].includes(p.name as never)) {
      rolePermissions.push({ id: `rp-pr-${idx}`, roleId: 'role-principal', permissionId: p.id });
    }
    if ([PERMISSIONS.ATTENDANCE_MARK, PERMISSIONS.MARKS_ENTER].includes(p.name as never)) {
      rolePermissions.push({ id: `rp-tc-${idx}`, roleId: 'role-teacher', permissionId: p.id });
    }
  });

  const auditLogs: AuditLog[] = [
    { id: 'aud-1', userId: 'user-admin', action: 'RESULT_PUBLISH', module: 'Results', details: 'Published Half-Yearly Examination 2026 results for Class 10 (SSC Batch).', ipAddress: '103.112.54.18', createdAt: '2026-11-18T11:30:00.000Z' },
    { id: 'aud-2', userId: 'user-teacher-1', action: 'MARKS_SUBMIT', module: 'Examinations', details: 'Submitted Mathematics marks for Class 10 Section ক.', ipAddress: '103.112.54.22', createdAt: '2026-11-17T14:15:00.000Z' },
    { id: 'aud-3', userId: 'user-admin', action: 'ATTENDANCE_CONFIG_UPDATE', module: 'Attendance', details: 'Configured Class 10 attendance method to RFID and Classes 6–9 to MANUAL.', ipAddress: '103.112.54.18', createdAt: '2026-11-16T08:40:00.000Z' },
    { id: 'aud-4', userId: 'user-principal', action: 'NOTICE_PUBLISH', module: 'Notices', details: 'Published notice: বার্ষিক পরীক্ষা ২০২৬ এর সময়সূচি ও প্রবেশপত্র বিতরণ।', ipAddress: '103.112.54.19', createdAt: '2026-11-15T10:05:00.000Z' },
    { id: 'aud-5', userId: 'user-admin', action: 'STUDENT_ENROLL', module: 'Students', details: 'Enrolled Class 6 incoming batch for Academic Year 2026.', ipAddress: '103.112.54.18', createdAt: '2026-11-12T09:10:00.000Z' },
  ];

  // 2. Institution (Bhojeshwar High School — BHS)
  const schoolProfile: SchoolProfile = {
    id: 'school-profile-1',
    name: 'ভোজেশ্বর উচ্চ বিদ্যালয়',
    nameEn: 'Bhojeshwar High School',
    motto: 'শিক্ষাই আলো, জ্ঞানই শক্তি',
    eiin: '113587',
    schoolCode: 'BHS',
    logo: '/assets/aistudio/15f910cc-7969-442c-abd0-8fbf9bc3081d_9580ab1b.jpg',
    establishedYear: 1978,
    address: 'ডাকঘর: ভোজেশ্বর (মশুরা), উপজেলা: নড়িয়া, জেলা: শরীয়তপুর।',
    phone: '+880 1700-000000',
    email: 'info@bhs.edu.bd',
    website: 'https://bhojeshwarhighschool.edu.bd',
    description:
      '১৯৭৮ সালে প্রতিষ্ঠিত ভোজেশ্বর উচ্চ বিদ্যালয় (BHS) শরীয়তপুর জেলার নড়িয়া উপজেলার ভোজেশ্বরের একটি অন্যতম ঐতিহ্যবাহী ও সুনামধন্য মাধ্যমিক শিক্ষা প্রতিষ্ঠান। ষষ্ঠ থেকে দশম শ্রেণি পর্যন্ত মানসম্মত পাঠদান, নৈতিক শিক্ষা ও আধুনিক ডিজিটাল শিক্ষাব্যবস্থার সমন্বয়ে আমরা আলোকিত মানুষ গড়ার লক্ষ্যে কাজ করছি।',
    mission:
      'ভোজেশ্বর, নড়িয়া ও আশপাশের অঞ্চলের শিক্ষার্থীদের জন্য আধুনিক, অন্তর্ভুক্তিমূলক ও প্রযুক্তিনির্ভর মাধ্যমিক শিক্ষা নিশ্চিত করা এবং নৈতিক মূল্যবোধ, বিজ্ঞানমনস্কতা ও নেতৃত্বগুণ বিকাশ ঘটানো।',
    vision:
      'ঐতিহ্য ও আধুনিকতার মেলবন্ধনে একটি আদর্শ ডিজিটাল স্মার্ট বিদ্যালয় হিসেবে প্রতিটি শিক্ষার্থীর সৃজনশীলতা ও মেধার পূর্ণ বিকাশ নিশ্চিত করা।',
    socialLinks: {
      facebook: 'https://facebook.com',
      youtube: 'https://youtube.com',
    },
    createdAt: NOW,
    updatedAt: NOW,
  };

  const institutionContents: InstitutionContent[] = [
    {
      id: 'ic-1',
      type: InstitutionContentType.HISTORY,
      title: 'ঐতিহ্য ও প্রতিষ্ঠার ইতিহাস (১৯৭৮)',
      description:
        '১৯৭৮ খ্রিস্টাব্দের ১ জানুয়ারি শরীয়তপুর জেলার নড়িয়া উপজেলার ভোজেশ্বর ইউনিয়নে শিক্ষানুরাগী ব্যক্তিবর্গের উদ্যোগে ভোজেশ্বর উচ্চ বিদ্যালয় (BHS) প্রতিষ্ঠিত হয়। প্রতিষ্ঠার পর থেকে প্রায় অর্ধশতাব্দী ধরে অত্র প্রতিষ্ঠানটি এই জনপদে মাধ্যমিক শিক্ষার আলো ছড়িয়ে আসছে।',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ic-2',
      type: InstitutionContentType.TRADITION,
      title: 'নৈতিকতা, শৃঙ্খলা ও সহশিক্ষা কার্যক্রম',
      description:
        'পাঠ্যবইয়ের পাশাপাশি বিতর্ক, বিজ্ঞান মেলা, স্কাউটিং, ক্রীড়া ও সাংস্কৃতিক চর্চার মাধ্যমে শিক্ষার্থীদের সামগ্রিক বিকাশ এই বিদ্যালয়ের দীর্ঘদিনের ঐতিহ্য।',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ic-3',
      type: InstitutionContentType.INFRASTRUCTURE,
      title: 'একাডেমিক ভবন ও শিক্ষার পরিবেশ',
      description:
        'সুপরিসর শ্রেণিকক্ষ, মাল্টিমিডিয়া স্মার্ট ক্লাসরুম, বিজ্ঞান গবেষণাগার, গ্রন্থাগার, খেলার মাঠ এবং নিরাপদ ক্যাম্পাস শিক্ষার্থীদের অনুকূল শিক্ষার পরিবেশ প্রদান করে।',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const facilities: SchoolFacility[] = [
    { id: 'fac-1', name: 'শেখ রাসেল ডিজিটাল ও কম্পিউটার ল্যাব', type: FacilityType.LAB, description: 'আধুনিক কম্পিউটার ও ইন্টারনেট সংযোগসহ তথ্য ও যোগাযোগ প্রযুক্তি ব্যবহারিক ল্যাব।', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'fac-2', name: 'পদার্থ, রসায়ন ও জীববিজ্ঞান গবেষণাগার', type: FacilityType.LAB, description: 'নবম-দশম শ্রেণির বিজ্ঞান বিভাগের শিক্ষার্থীদের ব্যবহারিক পরীক্ষার সুসজ্জিত বিজ্ঞানাগার।', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'fac-3', name: 'সমৃদ্ধ বিদ্যালয় গ্রন্থাগার', type: FacilityType.LIBRARY, description: 'পাঠ্যবই, সাহিত্য, ইতিহাস, বিজ্ঞান ও রেফারেন্স বইসমৃদ্ধ শান্ত পাঠকক্ষ।', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'fac-4', name: 'মাল্টিমিডিয়া স্মার্ট শ্রেণিকক্ষ', type: FacilityType.MULTIMEDIA, description: 'প্রজেক্টর ও ডিজিটাল কনটেন্ট ব্যবহারের মাধ্যমে ইন্টারেক্টিভ পাঠদান ব্যবস্থা।', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'fac-5', name: 'প্রশস্ত খেলার মাঠ', type: FacilityType.PLAYGROUND, description: 'বার্ষিক ক্রীড়া প্রতিযোগিতা, ফুটবল, ক্রিকেট ও প্রাত্যহিক সমাবেশের জন্য উন্মুক্ত মাঠ।', isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  const quickLinks: QuickLink[] = [
    { id: 'ql-1', title: 'ভর্তি তথ্য ও নির্দেশিকা', url: '/admission', isButton: false, sortOrder: 1, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ql-2', title: 'ক্লাস রুটিন', url: '/academics/routines', isButton: false, sortOrder: 2, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ql-3', title: 'পরীক্ষার রুটিন', url: '/academics/examination', isButton: false, sortOrder: 3, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ql-4', title: 'একাডেমিক ক্যালেন্ডার', url: '/academics/academic-calendar', isButton: false, sortOrder: 4, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ql-5', title: 'অনলাইন ফলাফল', url: '/results', isButton: true, sortOrder: 5, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ql-6', title: 'পাঠ্যসূচি (সিলেবাস)', url: '/academics/syllabus', isButton: false, sortOrder: 6, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ql-7', title: 'ভর্তি ফরম ডাউনলোড', url: '/admission/download-form', isButton: false, sortOrder: 7, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ql-8', title: 'পোর্টাল লগইন', url: '/login', isButton: true, sortOrder: 8, isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  // 3. Departments, Staff Structures, Fictional Demo Staff
  const departments: Department[] = [
    { id: 'dept-sci', name: 'বিজ্ঞান বিভাগ', code: 'SCI', description: 'পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান ও উচ্চতর গণিত', displayOrder: 1, status: DepartmentStatus.ACTIVE, createdAt: NOW, updatedAt: NOW },
    { id: 'dept-math', name: 'গণিত ও আইসিটি বিভাগ', code: 'MTH', description: 'সাধারণ গণিত ও তথ্য ও যোগাযোগ প্রযুক্তি', displayOrder: 2, status: DepartmentStatus.ACTIVE, createdAt: NOW, updatedAt: NOW },
    { id: 'dept-lang', name: 'ভাষা ও সাহিত্য বিভাগ', code: 'LNG', description: 'বাংলা ও ইংরেজি ভাষা ও সাহিত্য', displayOrder: 3, status: DepartmentStatus.ACTIVE, createdAt: NOW, updatedAt: NOW },
    { id: 'dept-hum', name: 'মানবিক ও সমাজবিজ্ঞান বিভাগ', code: 'HUM', description: 'ইতিহাস, ভূগোল, পৌরনীতি ও বাংলাদেশ ও বিশ্বপরিচয়', displayOrder: 4, status: DepartmentStatus.ACTIVE, createdAt: NOW, updatedAt: NOW },
    { id: 'dept-bus', name: 'ব্যবসায় শিক্ষা বিভাগ', code: 'BUS', description: 'হিসাববিজ্ঞান, ব্যবসায় উদ্যোগ ও ফিন্যান্স', displayOrder: 5, status: DepartmentStatus.ACTIVE, createdAt: NOW, updatedAt: NOW },
    { id: 'dept-adm', name: 'প্রশাসন ও অফিস ব্যবস্থাপনা', code: 'ADM', description: 'দাপ্তরিক কাজ, হিসাব ও শিক্ষার্থী সেবা', displayOrder: 6, status: DepartmentStatus.ACTIVE, createdAt: NOW, updatedAt: NOW },
  ];

  const staffStructures: StaffStructure[] = [
    { id: 'ss-1', designation: 'প্রধান শিক্ষক', staffType: StaffType.TEACHER, totalPositions: 1, filledPositions: 1, departmentId: 'dept-adm', isActive: true, isDeleted: false, createdAt: NOW, updatedAt: NOW },
    { id: 'ss-2', designation: 'সহকারী প্রধান শিক্ষক', staffType: StaffType.TEACHER, totalPositions: 1, filledPositions: 1, departmentId: 'dept-adm', isActive: true, isDeleted: false, createdAt: NOW, updatedAt: NOW },
    { id: 'ss-3', designation: 'সিনিয়র সহকারী শিক্ষক', staffType: StaffType.TEACHER, totalPositions: 6, filledPositions: 5, departmentId: 'dept-sci', isActive: true, isDeleted: false, createdAt: NOW, updatedAt: NOW },
    { id: 'ss-4', designation: 'সহকারী শিক্ষক', staffType: StaffType.TEACHER, totalPositions: 8, filledPositions: 6, departmentId: 'dept-lang', isActive: true, isDeleted: false, createdAt: NOW, updatedAt: NOW },
    { id: 'ss-5', designation: 'অফিস সহকারী কাম কম্পিউটার অপারেটর', staffType: StaffType.OFFICER, totalPositions: 2, filledPositions: 2, departmentId: 'dept-adm', isActive: true, isDeleted: false, createdAt: NOW, updatedAt: NOW },
    { id: 'ss-6', designation: 'অফিস সহায়ক ও নিরাপত্তা কর্মী', staffType: StaffType.EMPLOYEE, totalPositions: 4, filledPositions: 3, departmentId: 'dept-adm', isActive: true, isDeleted: false, createdAt: NOW, updatedAt: NOW },
  ];

  const staff: Staff[] = [
    { id: 'staff-1', userId: 'user-principal', employeeId: 'T-001', name: 'মোঃ শফিকুর রহমান', nameBn: 'মোঃ শফিকুর রহমান', photo: '/images/headteacher_clean_portrait_1795154685112.jpg', designation: 'প্রধান শিক্ষক', qualification: 'এম.এসসি, বি.এড', staffType: StaffType.TEACHER, departmentId: 'dept-adm', staffStructureId: 'ss-1', employmentType: EmploymentType.PERMANENT, gender: Gender.MALE, bloodGroup: BloodGroup.O_POSITIVE, religion: Religion.ISLAM, phone: '01711-200101', email: 'principal@bhs.edu.bd', joiningDate: '2012-03-01', displayOrder: 1, status: StaffStatus.ACTIVE, createdAt: NOW, updatedAt: NOW },
    { id: 'staff-2', userId: null, employeeId: 'T-002', name: 'অনুপমা রায়', nameBn: 'অনুপমা রায়', photo: '/images/teacher_anupama_portrait_1795155720897.jpg', designation: 'সহকারী প্রধান শিক্ষক', qualification: 'এম.এ (বাংলা), বি.এড', staffType: StaffType.TEACHER, departmentId: 'dept-lang', staffStructureId: 'ss-2', employmentType: EmploymentType.PERMANENT, gender: Gender.FEMALE, bloodGroup: BloodGroup.A_POSITIVE, religion: Religion.HINDUISM, phone: '01711-200102', email: 'anupama@bhs.edu.bd', joiningDate: '2014-01-15', displayOrder: 2, status: StaffStatus.ACTIVE, createdAt: NOW, updatedAt: NOW },
    { id: 'staff-3', userId: 'user-teacher-1', employeeId: 'T-003', name: 'মোঃ কামরুল হাসান', nameBn: 'মোঃ কামরুল হাসান', photo: '/images/teacher_kamrul_portrait_1795155721415.jpg', designation: 'সিনিয়র সহকারী শিক্ষক (গণিত)', qualification: 'এম.এসসি (গণিত), বি.এড', staffType: StaffType.TEACHER, departmentId: 'dept-math', staffStructureId: 'ss-3', employmentType: EmploymentType.PERMANENT, gender: Gender.MALE, bloodGroup: BloodGroup.B_POSITIVE, religion: Religion.ISLAM, phone: '01711-200103', email: 'kamrul@bhs.edu.bd', joiningDate: '2015-07-01', displayOrder: 3, status: StaffStatus.ACTIVE, createdAt: NOW, updatedAt: NOW },
    { id: 'staff-4', userId: 'user-teacher-2', employeeId: 'T-004', name: 'সাবিনা ইয়াসমিন', nameBn: 'সাবিনা ইয়াসমিন', photo: '/images/teacher_sabina_portrait_1795155721585.jpg', designation: 'সহকারী শিক্ষক (ইংরেজি)', qualification: 'এম.এ (ইংরেজি), বি.এড', staffType: StaffType.TEACHER, departmentId: 'dept-lang', staffStructureId: 'ss-4', employmentType: EmploymentType.PERMANENT, gender: Gender.FEMALE, bloodGroup: BloodGroup.O_POSITIVE, religion: Religion.ISLAM, phone: '01711-200104', email: 'sabina@bhs.edu.bd', joiningDate: '2017-02-10', displayOrder: 4, status: StaffStatus.ACTIVE, createdAt: NOW, updatedAt: NOW },
    { id: 'staff-5', userId: null, employeeId: 'T-005', name: 'দেবাশীষ চক্রবর্তী', nameBn: 'দেবাশীষ চক্রবর্তী', photo: '/images/teacher_debashish_portrait_1795155721385.jpg', designation: 'সিনিয়র সহকারী শিক্ষক (পদার্থ ও রসায়ন)', qualification: 'এম.এসসি (রসায়ন)', staffType: StaffType.TEACHER, departmentId: 'dept-sci', staffStructureId: 'ss-3', employmentType: EmploymentType.PERMANENT, gender: Gender.MALE, bloodGroup: BloodGroup.AB_POSITIVE, religion: Religion.HINDUISM, phone: '01711-200105', email: 'debashish@bhs.edu.bd', joiningDate: '2016-05-12', displayOrder: 5, status: StaffStatus.ACTIVE, createdAt: NOW, updatedAt: NOW },
    { id: 'staff-6', userId: null, employeeId: 'T-006', name: 'মোছাঃ নাসরিন সুলতানা', nameBn: 'মোছাঃ নাসরিন সুলতানা', photo: '/images/teacher_anupama_portrait_1795155720897.jpg', designation: 'সহকারী শিক্ষক (জীববিজ্ঞান ও কৃষি)', qualification: 'এম.এসসি (উদ্ভিদবিজ্ঞান)', staffType: StaffType.TEACHER, departmentId: 'dept-sci', staffStructureId: 'ss-4', employmentType: EmploymentType.PERMANENT, gender: Gender.FEMALE, bloodGroup: BloodGroup.B_NEGATIVE, religion: Religion.ISLAM, phone: '01711-200106', email: 'nasrin@bhs.edu.bd', joiningDate: '2018-09-01', displayOrder: 6, status: StaffStatus.ACTIVE, createdAt: NOW, updatedAt: NOW },
    { id: 'staff-7', userId: null, employeeId: 'T-007', name: 'মোঃ মাহমুদুল হক', nameBn: 'মোঃ মাহমুদুল হক', photo: '/images/teacher_mahmudul_portrait_1795155721712.jpg', designation: 'সহকারী শিক্ষক (আইসিটি)', qualification: 'বি.এসসি (সিএসই)', staffType: StaffType.TEACHER, departmentId: 'dept-math', staffStructureId: 'ss-4', employmentType: EmploymentType.PERMANENT, gender: Gender.MALE, bloodGroup: BloodGroup.A_POSITIVE, religion: Religion.ISLAM, phone: '01711-200107', email: 'mahmudul@bhs.edu.bd', joiningDate: '2020-01-05', displayOrder: 7, status: StaffStatus.ACTIVE, createdAt: NOW, updatedAt: NOW },
    { id: 'staff-8', userId: null, employeeId: 'T-008', name: 'মোঃ জহিরুল ইসলাম', nameBn: 'মোঃ জহিরুল ইসলাম', photo: '/images/teacher_kamrul_portrait_1795155721415.jpg', designation: 'সহকারী শিক্ষক (ব্যবসায় শিক্ষা)', qualification: 'এম.বি.এস (হিসাববিজ্ঞান)', staffType: StaffType.TEACHER, departmentId: 'dept-bus', staffStructureId: 'ss-4', employmentType: EmploymentType.PERMANENT, gender: Gender.MALE, bloodGroup: BloodGroup.O_NEGATIVE, religion: Religion.ISLAM, phone: '01711-200108', email: 'zahirul@bhs.edu.bd', joiningDate: '2019-03-14', displayOrder: 8, status: StaffStatus.ACTIVE, createdAt: NOW, updatedAt: NOW },
    { id: 'staff-9', userId: null, employeeId: 'T-009', name: 'ফারহানা আক্তার', nameBn: 'ফারহানা আক্তার', photo: '/images/teacher_sabina_portrait_1795155721585.jpg', designation: 'সহকারী শিক্ষক (সমাজবিজ্ঞান)', qualification: 'এম.এস.এস (রাষ্ট্রবিজ্ঞান)', staffType: StaffType.TEACHER, departmentId: 'dept-hum', staffStructureId: 'ss-4', employmentType: EmploymentType.PROBATIONARY, gender: Gender.FEMALE, bloodGroup: BloodGroup.A_POSITIVE, religion: Religion.ISLAM, phone: '01711-200109', email: 'farhana@bhs.edu.bd', joiningDate: '2024-02-01', displayOrder: 9, status: StaffStatus.ACTIVE, createdAt: NOW, updatedAt: NOW },
    { id: 'staff-10', userId: null, employeeId: 'EMP-001', name: 'মোঃ সাইফুল আলম', nameBn: 'মোঃ সাইফুল আলম', photo: '/images/teacher_mahmudul_portrait_1795155721712.jpg', designation: 'অফিস সহকারী কাম কম্পিউটার অপারেটর', qualification: 'বি.কম', staffType: StaffType.OFFICER, departmentId: 'dept-adm', staffStructureId: 'ss-5', employmentType: EmploymentType.PERMANENT, gender: Gender.MALE, bloodGroup: BloodGroup.B_POSITIVE, religion: Religion.ISLAM, phone: '01711-200201', email: 'office@bhs.edu.bd', joiningDate: '2015-01-01', displayOrder: 10, status: StaffStatus.ACTIVE, createdAt: NOW, updatedAt: NOW },
    { id: 'staff-11', userId: null, employeeId: 'EMP-002', name: 'মোঃ শাহিন মিয়া', nameBn: 'মোঃ শাহিন মিয়া', photo: '/images/teacher_debashish_portrait_1795155721385.jpg', designation: 'অফিস সহায়ক', qualification: 'এইচ.এস.সি', staffType: StaffType.EMPLOYEE, departmentId: 'dept-adm', staffStructureId: 'ss-6', employmentType: EmploymentType.PERMANENT, gender: Gender.MALE, bloodGroup: BloodGroup.O_POSITIVE, religion: Religion.ISLAM, phone: '01711-200202', joiningDate: '2018-04-01', displayOrder: 11, status: StaffStatus.ACTIVE, createdAt: NOW, updatedAt: NOW },
  ];

  const administrators: Administrator[] = [
    { id: 'adm-1', staffId: 'staff-1', name: 'মোঃ শফিকুর রহমান', designation: 'প্রধান শিক্ষক', message: 'শিক্ষার্থীদের মেধা ও নৈতিক বিকাশে আমরা প্রতিশ্রুতিবদ্ধ।', startDate: '2021-01-01', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'adm-2', staffId: 'staff-2', name: 'অনুপমা রায়', designation: 'সহকারী প্রধান শিক্ষক', message: 'শৃঙ্খলা ও নিয়মিত অধ্যবসায় সাফল্যের মূল চাবিকাঠি।', startDate: '2022-01-01', isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  const managingCommittee: ManagingCommitteeMember[] = [
    { id: 'mc-1', name: 'আলহাজ্ব মোঃ নুরুল আমিন', designation: 'সভাপতি, ম্যানেজিং কমিটি', photo: '/images/chairman_portrait_1795154662402.jpg', phone: '01711-300001', startDate: '2024-07-01', endDate: '2026-06-30', createdAt: NOW, updatedAt: NOW },
    { id: 'mc-2', name: 'মোঃ শফিকুর রহমান', designation: 'সদস্য সচিব (পদাধিকারবলে প্রধান শিক্ষক)', photo: '/images/headteacher_clean_portrait_1795154685112.jpg', phone: '01711-200101', startDate: '2024-07-01', endDate: '2026-06-30', createdAt: NOW, updatedAt: NOW },
    { id: 'mc-3', name: 'অ্যাডভোকেট সুব্রত দাস', designation: 'শিক্ষানুরাগী সদস্য', photo: '/images/committee_subrata_portrait_1795171029609.jpg', phone: '01711-300003', startDate: '2024-07-01', endDate: '2026-06-30', createdAt: NOW, updatedAt: NOW },
    { id: 'mc-4', name: 'মোঃ হাবিবুর রহমান', designation: 'অভিভাবক প্রতিনিধি', photo: '/images/committee_habibur_portrait_1795170999277.jpg', phone: '01711-300004', startDate: '2024-07-01', endDate: '2026-06-30', createdAt: NOW, updatedAt: NOW },
    { id: 'mc-5', name: 'মিসেস রেহানা বেগম', designation: 'সংরক্ষিত মহিলা অভিভাবক সদস্য', photo: '/images/committee_rehana_portrait_1795170999363.jpg', phone: '01711-300005', startDate: '2024-07-01', endDate: '2026-06-30', createdAt: NOW, updatedAt: NOW },
  ];

  // 4. Academic Setup (2027 upcoming, 2026 active, 2025 previous; Classes 6–10; Sections ক, খ, গ; Groups)
  const academicYears: AcademicYear[] = [
    { id: 'ay-2027', name: '2027', startDate: '2027-01-01', endDate: '2027-12-31', isActive: false, createdAt: NOW, updatedAt: NOW },
    { id: 'ay-2026', name: '2026', startDate: '2026-01-01', endDate: '2026-12-31', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ay-2025', name: '2025', startDate: '2025-01-01', endDate: '2025-12-31', isActive: false, createdAt: NOW, updatedAt: NOW },
  ];

  const academicGroups: AcademicGroup[] = [
    { id: 'grp-sci', name: 'Science', nameBn: 'বিজ্ঞান', description: 'পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান ও উচ্চতর গণিত', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'grp-hum', name: 'Humanities', nameBn: 'মানবিক', description: 'ইতিহাস, ভূগোল ও পরিবেশ, পৌরনীতি ও নাগরিকতা', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'grp-bus', name: 'Business Studies', nameBn: 'ব্যবসায় শিক্ষা', description: 'হিসাববিজ্ঞান, ব্যবসায় উদ্যোগ ও ফিন্যান্স ও ব্যাংকিং', isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  const classes: SchoolClass[] = [
    { id: 'cls-6', name: 'Class 6', nameBn: '৬ষ্ঠ শ্রেণি', numericValue: 6, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'cls-7', name: 'Class 7', nameBn: '৭ম শ্রেণি', numericValue: 7, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'cls-8', name: 'Class 8', nameBn: '৮ম শ্রেণি', numericValue: 8, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'cls-9', name: 'Class 9', nameBn: '৯ম শ্রেণি', numericValue: 9, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'cls-10', name: 'Class 10', nameBn: '১০ম শ্রেণি (এসএসসি ব্যাচ)', numericValue: 10, isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  const sections: Section[] = [];
  classes.forEach((c) => {
    ['ক', 'খ'].forEach((secName, idx) => {
      sections.push({
        id: `sec-${c.numericValue}-${idx === 0 ? 'ka' : 'kha'}`,
        classId: c.id,
        name: secName,
        isActive: true,
        createdAt: NOW,
        updatedAt: NOW,
      });
    });
    if (c.numericValue >= 9) {
      sections.push({
        id: `sec-${c.numericValue}-ga`,
        classId: c.id,
        name: 'গ',
        isActive: true,
        createdAt: NOW,
        updatedAt: NOW,
      });
    }
  });

  const subjects: Subject[] = [
    { id: 'sub-ban', name: 'Bangla', nameBn: 'বাংলা', officialCode: '101', category: SubjectCategory.LANGUAGE, displayOrder: 1, isSystemDefault: true, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-eng', name: 'English', nameBn: 'ইংরেজি', officialCode: '107', category: SubjectCategory.LANGUAGE, displayOrder: 2, isSystemDefault: true, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-math', name: 'Mathematics', nameBn: 'গণিত', officialCode: '109', category: SubjectCategory.MATHEMATICS, displayOrder: 3, isSystemDefault: true, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-sci', name: 'General Science', nameBn: 'বিজ্ঞান', officialCode: '127', category: SubjectCategory.SCIENCE, displayOrder: 4, isSystemDefault: true, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-bgs', name: 'Bangladesh & Global Studies', nameBn: 'বাংলাদেশ ও বিশ্বপরিচয়', officialCode: '150', category: SubjectCategory.SOCIAL_SCIENCE, displayOrder: 5, isSystemDefault: true, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-ict', name: 'Information & Communication Technology', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', officialCode: '154', category: SubjectCategory.TECHNICAL, displayOrder: 6, isSystemDefault: true, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-rel', name: 'Religion & Moral Education', nameBn: 'ধর্ম ও নৈতিক শিক্ষা', officialCode: '111', category: SubjectCategory.RELIGION, displayOrder: 7, isSystemDefault: true, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-phy', name: 'Physics', nameBn: 'পদার্থবিজ্ঞান', officialCode: '136', category: SubjectCategory.SCIENCE, displayOrder: 8, isSystemDefault: false, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-che', name: 'Chemistry', nameBn: 'রসায়ন', officialCode: '137', category: SubjectCategory.SCIENCE, displayOrder: 9, isSystemDefault: false, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-bio', name: 'Biology', nameBn: 'জীববিজ্ঞান', officialCode: '138', category: SubjectCategory.SCIENCE, displayOrder: 10, isSystemDefault: false, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-hmath', name: 'Higher Mathematics', nameBn: 'উচ্চতর গণিত', officialCode: '126', category: SubjectCategory.MATHEMATICS, displayOrder: 11, isSystemDefault: false, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-agri', name: 'Agriculture Studies', nameBn: 'কৃষি শিক্ষা', officialCode: '134', category: SubjectCategory.GENERAL, displayOrder: 12, isSystemDefault: false, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-acc', name: 'Accounting', nameBn: 'হিসাববিজ্ঞান', officialCode: '146', category: SubjectCategory.COMMERCE, displayOrder: 13, isSystemDefault: false, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-his', name: 'History of Bangladesh & World', nameBn: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', officialCode: '153', category: SubjectCategory.SOCIAL_SCIENCE, displayOrder: 14, isSystemDefault: false, isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  const books: Book[] = [
    { id: 'bk-1', subjectId: 'sub-ban', classId: 'cls-10', name: 'বাংলা সাহিত্য (নবম-দশম শ্রেণি)', bookCode: 'NCTB-101', type: BookType.TEXTBOOK, displayOrder: 1, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-2', subjectId: 'sub-eng', classId: 'cls-10', name: 'English For Today (Classes Nine-Ten)', bookCode: 'NCTB-107', type: BookType.TEXTBOOK, displayOrder: 2, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-3', subjectId: 'sub-math', classId: 'cls-10', name: 'গণিত (নবম-দশম শ্রেণি)', bookCode: 'NCTB-109', type: BookType.TEXTBOOK, displayOrder: 3, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-4', subjectId: 'sub-phy', classId: 'cls-10', name: 'পদার্থবিজ্ঞান (নবম-দশম শ্রেণি)', bookCode: 'NCTB-136', type: BookType.TEXTBOOK, displayOrder: 4, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-5', subjectId: 'sub-che', classId: 'cls-10', name: 'রসায়ন (নবম-দশম শ্রেণি)', bookCode: 'NCTB-137', type: BookType.TEXTBOOK, displayOrder: 5, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-6', subjectId: 'sub-ban', classId: 'cls-6', name: 'চারুপাঠ (ষষ্ঠ শ্রেণি)', bookCode: 'NCTB-601', type: BookType.TEXTBOOK, displayOrder: 1, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-7', subjectId: 'sub-math', classId: 'cls-8', name: 'গণিত (অষ্টম শ্রেণি)', bookCode: 'NCTB-809', type: BookType.TEXTBOOK, displayOrder: 3, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-8', subjectId: 'sub-eng', classId: 'cls-6', name: 'English For Today (Class Six)', bookCode: 'NCTB-607', type: BookType.TEXTBOOK, displayOrder: 2, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-9', subjectId: 'sub-math', classId: 'cls-6', name: 'গণিত (ষষ্ঠ শ্রেণি)', bookCode: 'NCTB-609', type: BookType.TEXTBOOK, displayOrder: 3, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-10', subjectId: 'sub-sci', classId: 'cls-6', name: 'বিজ্ঞান (ষষ্ঠ শ্রেণি)', bookCode: 'NCTB-627', type: BookType.TEXTBOOK, displayOrder: 4, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-11', subjectId: 'sub-ict', classId: 'cls-6', name: 'তথ্য ও যোগাযোগ প্রযুক্তি (ষষ্ঠ শ্রেণি)', bookCode: 'NCTB-654', type: BookType.TEXTBOOK, displayOrder: 5, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-12', subjectId: 'sub-ban', classId: 'cls-7', name: 'সপ্তবর্ণা (সপ্তম শ্রেণি)', bookCode: 'NCTB-701', type: BookType.TEXTBOOK, displayOrder: 1, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-13', subjectId: 'sub-eng', classId: 'cls-7', name: 'English For Today (Class Seven)', bookCode: 'NCTB-707', type: BookType.TEXTBOOK, displayOrder: 2, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-14', subjectId: 'sub-math', classId: 'cls-7', name: 'গণিত (সপ্তম শ্রেণি)', bookCode: 'NCTB-709', type: BookType.TEXTBOOK, displayOrder: 3, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-15', subjectId: 'sub-sci', classId: 'cls-7', name: 'বিজ্ঞান (সপ্তম শ্রেণি)', bookCode: 'NCTB-727', type: BookType.TEXTBOOK, displayOrder: 4, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-16', subjectId: 'sub-bgs', classId: 'cls-7', name: 'বাংলাদেশ ও বিশ্বপরিচয় (সপ্তম শ্রেণি)', bookCode: 'NCTB-750', type: BookType.TEXTBOOK, displayOrder: 5, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-17', subjectId: 'sub-ban', classId: 'cls-8', name: 'সাহিত্য কণিকা (অষ্টম শ্রেণি)', bookCode: 'NCTB-801', type: BookType.TEXTBOOK, displayOrder: 1, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-18', subjectId: 'sub-eng', classId: 'cls-8', name: 'English For Today (Class Eight)', bookCode: 'NCTB-807', type: BookType.TEXTBOOK, displayOrder: 2, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-19', subjectId: 'sub-sci', classId: 'cls-8', name: 'বিজ্ঞান (অষ্টম শ্রেণি)', bookCode: 'NCTB-827', type: BookType.TEXTBOOK, displayOrder: 4, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-20', subjectId: 'sub-ict', classId: 'cls-8', name: 'তথ্য ও যোগাযোগ প্রযুক্তি (অষ্টম শ্রেণি)', bookCode: 'NCTB-854', type: BookType.TEXTBOOK, displayOrder: 5, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-21', subjectId: 'sub-ban', classId: 'cls-9', name: 'বাংলা সাহিত্য (নবম-দশম শ্রেণি)', bookCode: 'NCTB-101', type: BookType.TEXTBOOK, displayOrder: 1, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-22', subjectId: 'sub-eng', classId: 'cls-9', name: 'English For Today (Classes Nine-Ten)', bookCode: 'NCTB-107', type: BookType.TEXTBOOK, displayOrder: 2, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-23', subjectId: 'sub-math', classId: 'cls-9', name: 'গণিত (নবম-দশম শ্রেণি)', bookCode: 'NCTB-109', type: BookType.TEXTBOOK, displayOrder: 3, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-24', subjectId: 'sub-phy', classId: 'cls-9', name: 'পদার্থবিজ্ঞান (নবম-দশম শ্রেণি)', bookCode: 'NCTB-136', type: BookType.TEXTBOOK, displayOrder: 4, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-25', subjectId: 'sub-bio', classId: 'cls-9', name: 'জীববিজ্ঞান (নবম-দশম শ্রেণি)', bookCode: 'NCTB-138', type: BookType.TEXTBOOK, displayOrder: 5, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-26', subjectId: 'sub-acc', classId: 'cls-9', name: 'হিসাববিজ্ঞান (নবম-দশম শ্রেণি)', bookCode: 'NCTB-146', type: BookType.TEXTBOOK, displayOrder: 6, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-27', subjectId: 'sub-his', classId: 'cls-9', name: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা (নবম-দশম)', bookCode: 'NCTB-153', type: BookType.TEXTBOOK, displayOrder: 7, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-28', subjectId: 'sub-bio', classId: 'cls-10', name: 'জীববিজ্ঞান (নবম-দশম শ্রেণি)', bookCode: 'NCTB-138', type: BookType.TEXTBOOK, displayOrder: 6, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-29', subjectId: 'sub-hmath', classId: 'cls-10', name: 'উচ্চতর গণিত (নবম-দশম শ্রেণি)', bookCode: 'NCTB-126', type: BookType.TEXTBOOK, displayOrder: 7, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-30', subjectId: 'sub-acc', classId: 'cls-10', name: 'হিসাববিজ্ঞান (নবম-দশম শ্রেণি)', bookCode: 'NCTB-146', type: BookType.TEXTBOOK, displayOrder: 8, isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  // ClassSubject mappings for 2026
  const classSubjects: ClassSubject[] = [];
  const commonSubs = ['sub-ban', 'sub-eng', 'sub-math', 'sub-ict', 'sub-rel'];
  classes.forEach((cls) => {
    if (cls.numericValue <= 8) {
      [...commonSubs, 'sub-sci', 'sub-bgs', 'sub-agri'].forEach((subId, idx) => {
        classSubjects.push({
          id: `cs-${cls.numericValue}-${subId}`,
          academicYearId: 'ay-2026',
          classId: cls.id,
          subjectId: subId,
          groupId: null,
          isOptional: subId === 'sub-agri',
          displayOrder: idx + 1,
          isActive: true,
          createdAt: NOW,
          updatedAt: NOW,
        });
      });
    } else {
      // Classes 9 & 10: common + group subjects
      commonSubs.forEach((subId, idx) => {
        classSubjects.push({
          id: `cs-${cls.numericValue}-${subId}`,
          academicYearId: 'ay-2026',
          classId: cls.id,
          subjectId: subId,
          groupId: null,
          isOptional: false,
          displayOrder: idx + 1,
          isActive: true,
          createdAt: NOW,
          updatedAt: NOW,
        });
      });
      // Science
      ['sub-phy', 'sub-che', 'sub-bio', 'sub-hmath'].forEach((subId, idx) => {
        classSubjects.push({
          id: `cs-${cls.numericValue}-sci-${subId}`,
          academicYearId: 'ay-2026',
          classId: cls.id,
          subjectId: subId,
          groupId: 'grp-sci',
          isOptional: subId === 'sub-hmath',
          displayOrder: 6 + idx,
          isActive: true,
          createdAt: NOW,
          updatedAt: NOW,
        });
      });
      // Humanities
      ['sub-his', 'sub-bgs', 'sub-agri'].forEach((subId, idx) => {
        classSubjects.push({
          id: `cs-${cls.numericValue}-hum-${subId}`,
          academicYearId: 'ay-2026',
          classId: cls.id,
          subjectId: subId,
          groupId: 'grp-hum',
          isOptional: subId === 'sub-agri',
          displayOrder: 6 + idx,
          isActive: true,
          createdAt: NOW,
          updatedAt: NOW,
        });
      });
      // Business
      ['sub-acc', 'sub-agri'].forEach((subId, idx) => {
        classSubjects.push({
          id: `cs-${cls.numericValue}-bus-${subId}`,
          academicYearId: 'ay-2026',
          classId: cls.id,
          subjectId: subId,
          groupId: 'grp-bus',
          isOptional: subId === 'sub-agri',
          displayOrder: 6 + idx,
          isActive: true,
          createdAt: NOW,
          updatedAt: NOW,
        });
      });
    }
  });

  // 5. Realistic Fictional Demo Students & Parents across Classes 6–10
  const studentSeedRows: Array<{
    id: string;
    studentId: string;
    nameEn: string;
    nameBn: string;
    gender: Gender;
    religion: Religion;
    blood: BloodGroup;
    classNum: number;
    sec: 'ka' | 'kha' | 'ga';
    roll: number;
    groupId: string | null;
    parentName: string;
    parentNameBn: string;
    parentPhone: string;
    parentOcc: string;
    parentId: string;
    userId?: string;
    rfid?: string;
  }> = [
    // Class 10 (SSC Batch - RFID enabled)
    { id: 'stu-10-1', studentId: 'BHS-2026-1001', nameEn: 'Tanvir Ahmed', nameBn: 'তানভীর আহমেদ', gender: Gender.MALE, religion: Religion.ISLAM, blood: BloodGroup.O_POSITIVE, classNum: 10, sec: 'ka', roll: 1, groupId: 'grp-sci', parentName: 'Md. Abul Kalam', parentNameBn: 'মোঃ আবুল কালাম', parentPhone: '01711000010', parentOcc: 'ব্যবসা', parentId: 'par-1', userId: 'user-student-1', rfid: 'RFID-10-8841' },
    { id: 'stu-10-2', studentId: 'BHS-2026-1002', nameEn: 'Nusrat Jahan Mim', nameBn: 'নুসরাত জাহান মিম', gender: Gender.FEMALE, religion: Religion.ISLAM, blood: BloodGroup.A_POSITIVE, classNum: 10, sec: 'ka', roll: 2, groupId: 'grp-sci', parentName: 'Md. Delwar Hossain', parentNameBn: 'মোঃ দেলোয়ার হোসেন', parentPhone: '01711000011', parentOcc: 'চাকরি', parentId: 'par-2', rfid: 'RFID-10-8842' },
    { id: 'stu-10-3', studentId: 'BHS-2026-1003', nameEn: 'Pranto Chandra Das', nameBn: 'প্রান্ত চন্দ্র দাস', gender: Gender.MALE, religion: Religion.HINDUISM, blood: BloodGroup.B_POSITIVE, classNum: 10, sec: 'ka', roll: 3, groupId: 'grp-sci', parentName: 'Nirmal Chandra Das', parentNameBn: 'নির্মল চন্দ্র দাস', parentPhone: '01711000012', parentOcc: 'কৃষি ও ব্যবসা', parentId: 'par-3', rfid: 'RFID-10-8843' },
    { id: 'stu-10-4', studentId: 'BHS-2026-1004', nameEn: 'Farzana Akter', nameBn: 'ফারজানা আক্তার', gender: Gender.FEMALE, religion: Religion.ISLAM, blood: BloodGroup.AB_POSITIVE, classNum: 10, sec: 'ka', roll: 4, groupId: 'grp-sci', parentName: 'Md. Nasir Uddin', parentNameBn: 'মোঃ নাসির উদ্দিন', parentPhone: '01711000013', parentOcc: 'শিক্ষকতা', parentId: 'par-4', rfid: 'RFID-10-8844' },
    { id: 'stu-10-5', studentId: 'BHS-2026-1005', nameEn: 'Mehedi Hasan Shuvo', nameBn: 'মেহেদী হাসান শুভ', gender: Gender.MALE, religion: Religion.ISLAM, blood: BloodGroup.O_NEGATIVE, classNum: 10, sec: 'ka', roll: 5, groupId: 'grp-sci', parentName: 'Md. Rafiqul Islam', parentNameBn: 'মোঃ রফিকুল ইসলাম', parentPhone: '01711000014', parentOcc: 'প্রবাসী', parentId: 'par-5', rfid: 'RFID-10-8845' },
    { id: 'stu-10-6', studentId: 'BHS-2026-1006', nameEn: 'Sadia Afrin', nameBn: 'সাদিয়া আফরিন', gender: Gender.FEMALE, religion: Religion.ISLAM, blood: BloodGroup.A_POSITIVE, classNum: 10, sec: 'kha', roll: 1, groupId: 'grp-hum', parentName: 'Md. Kamal Mia', parentNameBn: 'মোঃ কামাল মিয়া', parentPhone: '01711000015', parentOcc: 'ব্যবসা', parentId: 'par-6', rfid: 'RFID-10-8846' },
    { id: 'stu-10-7', studentId: 'BHS-2026-1007', nameEn: 'Rakibul Islam', nameBn: 'রাকিবুল ইসলাম', gender: Gender.MALE, religion: Religion.ISLAM, blood: BloodGroup.B_POSITIVE, classNum: 10, sec: 'kha', roll: 2, groupId: 'grp-bus', parentName: 'Md. Mizanur Rahman', parentNameBn: 'মোঃ মিজানুর রহমান', parentPhone: '01711000016', parentOcc: 'কৃষি', parentId: 'par-7', rfid: 'RFID-10-8847' },

    // Class 9
    { id: 'stu-9-1', studentId: 'BHS-2026-0901', nameEn: 'Tahsina Tabassum', nameBn: 'তাহসিনা তাবাসসুম', gender: Gender.FEMALE, religion: Religion.ISLAM, blood: BloodGroup.O_POSITIVE, classNum: 9, sec: 'ka', roll: 1, groupId: 'grp-sci', parentName: 'Md. Abul Kalam', parentNameBn: 'মোঃ আবুল কালাম', parentPhone: '01711000010', parentOcc: 'ব্যবসা', parentId: 'par-1' }, // Second child of par-1!
    { id: 'stu-9-2', studentId: 'BHS-2026-0902', nameEn: 'Sajib Hossain', nameBn: 'সজীব হোসেন', gender: Gender.MALE, religion: Religion.ISLAM, blood: BloodGroup.B_POSITIVE, classNum: 9, sec: 'ka', roll: 2, groupId: 'grp-sci', parentName: 'Md. Shahidul Islam', parentNameBn: 'মোঃ শহিদুল ইসলাম', parentPhone: '01711000017', parentOcc: 'ব্যবসা', parentId: 'par-8' },
    { id: 'stu-9-3', studentId: 'BHS-2026-0903', nameEn: 'Ananya Saha', nameBn: 'অনন্যা সাহা', gender: Gender.FEMALE, religion: Religion.HINDUISM, blood: BloodGroup.A_POSITIVE, classNum: 9, sec: 'ka', roll: 3, groupId: 'grp-sci', parentName: 'Bimal Saha', parentNameBn: 'বিমল সাহা', parentPhone: '01711000018', parentOcc: 'ব্যবসা', parentId: 'par-9' },
    { id: 'stu-9-4', studentId: 'BHS-2026-0904', nameEn: 'Mahir Faisal', nameBn: 'মাহির ফয়সাল', gender: Gender.MALE, religion: Religion.ISLAM, blood: BloodGroup.AB_POSITIVE, classNum: 9, sec: 'kha', roll: 1, groupId: 'grp-bus', parentName: 'Md. Moniruzzaman', parentNameBn: 'মোঃ মনিরুজ্জামান', parentPhone: '01711000019', parentOcc: 'চাকরি', parentId: 'par-10' },

    // Class 8
    { id: 'stu-8-1', studentId: 'BHS-2026-0801', nameEn: 'Jannatul Ferdous', nameBn: 'জান্নাতুল ফেরদৌস', gender: Gender.FEMALE, religion: Religion.ISLAM, blood: BloodGroup.O_POSITIVE, classNum: 8, sec: 'ka', roll: 1, groupId: null, parentName: 'Md. Delwar Hossain', parentNameBn: 'মোঃ দেলোয়ার হোসেন', parentPhone: '01711000011', parentOcc: 'চাকরি', parentId: 'par-2' },
    { id: 'stu-8-2', studentId: 'BHS-2026-0802', nameEn: 'Samiul Alim', nameBn: 'সামিউল আলিম', gender: Gender.MALE, religion: Religion.ISLAM, blood: BloodGroup.A_POSITIVE, classNum: 8, sec: 'ka', roll: 2, groupId: null, parentName: 'Md. Harun-or-Rashid', parentNameBn: 'মোঃ হারুন-অর-রশিদ', parentPhone: '01711000021', parentOcc: 'কৃষি', parentId: 'par-11' },
    { id: 'stu-8-3', studentId: 'BHS-2026-0803', nameEn: 'Riya Rani Paul', nameBn: 'রিয়া রানী পাল', gender: Gender.FEMALE, religion: Religion.HINDUISM, blood: BloodGroup.B_POSITIVE, classNum: 8, sec: 'kha', roll: 1, groupId: null, parentName: 'Kartik Paul', parentNameBn: 'কার্তিক পাল', parentPhone: '01711000022', parentOcc: 'মৃৎশিল্প ব্যবসা', parentId: 'par-12' },

    // Class 7
    { id: 'stu-7-1', studentId: 'BHS-2026-0701', nameEn: 'Nafis Iqbal', nameBn: 'নাফিস ইকবাল', gender: Gender.MALE, religion: Religion.ISLAM, blood: BloodGroup.O_POSITIVE, classNum: 7, sec: 'ka', roll: 1, groupId: null, parentName: 'Md. Iqbal Hossain', parentNameBn: 'মোঃ ইকবাল হোসেন', parentPhone: '01711000023', parentOcc: 'চাকরি', parentId: 'par-13' },
    { id: 'stu-7-2', studentId: 'BHS-2026-0702', nameEn: 'Sumaiya Islam', nameBn: 'সুমাইয়া ইসলাম', gender: Gender.FEMALE, religion: Religion.ISLAM, blood: BloodGroup.B_POSITIVE, classNum: 7, sec: 'ka', roll: 2, groupId: null, parentName: 'Md. Zakir Hossain', parentNameBn: 'মোঃ জাকির হোসেন', parentPhone: '01711000024', parentOcc: 'ব্যবসা', parentId: 'par-14' },
    { id: 'stu-7-3', studentId: 'BHS-2026-0703', nameEn: 'Arifur Rahman', nameBn: 'আরিফুর রহমান', gender: Gender.MALE, religion: Religion.ISLAM, blood: BloodGroup.A_POSITIVE, classNum: 7, sec: 'kha', roll: 1, groupId: null, parentName: 'Md. Selim Mia', parentNameBn: 'মোঃ সেলিম মিয়া', parentPhone: '01711000025', parentOcc: 'কৃষি', parentId: 'par-15' },

    // Class 6
    { id: 'stu-6-1', studentId: 'BHS-2026-0601', nameEn: 'Lamia Akter', nameBn: 'লামিয়া আক্তার', gender: Gender.FEMALE, religion: Religion.ISLAM, blood: BloodGroup.O_POSITIVE, classNum: 6, sec: 'ka', roll: 1, groupId: null, parentName: 'Md. Masud Rana', parentNameBn: 'মোঃ মাসুদ রানা', parentPhone: '01711000026', parentOcc: 'ব্যবসা', parentId: 'par-16' },
    { id: 'stu-6-2', studentId: 'BHS-2026-0602', nameEn: 'Ashraful Alam', nameBn: 'আশরাফুল আলম', gender: Gender.MALE, religion: Religion.ISLAM, blood: BloodGroup.B_POSITIVE, classNum: 6, sec: 'ka', roll: 2, groupId: null, parentName: 'Md. Nurul Islam', parentNameBn: 'মোঃ নুরুল ইসলাম', parentPhone: '01711000027', parentOcc: 'প্রবাসী', parentId: 'par-17' },
    { id: 'stu-6-3', studentId: 'BHS-2026-0603', nameEn: 'Puja Rani Mondol', nameBn: 'পূজা রানী মণ্ডল', gender: Gender.FEMALE, religion: Religion.HINDUISM, blood: BloodGroup.AB_POSITIVE, classNum: 6, sec: 'kha', roll: 1, groupId: null, parentName: 'Sujit Mondol', parentNameBn: 'সুজিত মণ্ডল', parentPhone: '01711000028', parentOcc: 'চাকরি', parentId: 'par-18' },
  ];

  const students: Student[] = [];
  const enrollments: StudentEnrollment[] = [];
  const rfidCards: StudentRFIDcard[] = [];
  const parentsMap = new Map<string, Parent>();
  const parentStudents: ParentStudent[] = [];

  studentSeedRows.forEach((row, idx) => {
    const isSeededTransfer = row.id === 'stu-8-3';
    students.push({
      id: row.id,
      userId: row.userId ?? null,
      studentId: row.studentId,
      birthCertificateNo: `2011861450000${String(1000 + idx)}`,
      boardRegistrationNo: row.classNum >= 9 ? `21108654${String(10 + idx)}` : null,
      nameEn: row.nameEn,
      nameBn: row.nameBn,
      dateOfBirth: `${2016 - row.classNum}-0${(idx % 9) + 1}-1${idx % 9}`,
      gender: row.gender,
      bloodGroup: row.blood,
      religion: row.religion,
      presentAddress: 'গ্রাম: ভোজেশ্বর, ডাকঘর: ভোজেশ্বর, উপজেলা: নড়িয়া, জেলা: শরীয়তপুর',
      permanentAddress: 'গ্রাম: ভোজেশ্বর, ডাকঘর: ভোজেশ্বর, উপজেলা: নড়িয়া, জেলা: শরীয়তপুর',
      admissionDate: `${2026 - (row.classNum - 6)}-01-10`,
      status: isSeededTransfer ? StudentStatus.TRANSFERRED : StudentStatus.ACTIVE,
      previousSchoolName: 'ভোজেশ্বর সরকারি প্রাথমিক বিদ্যালয়',
      previousGpa: 4.75,
      createdAt: NOW,
      updatedAt: NOW,
    });

    const optCsId =
      row.classNum >= 9 && row.groupId === 'grp-sci'
        ? `cs-${row.classNum}-sci-sub-hmath`
        : row.classNum >= 9
          ? `cs-${row.classNum}-hum-sub-agri`
          : null;

    enrollments.push({
      id: `enr-${row.id}`,
      studentId: row.id,
      academicYearId: 'ay-2026',
      classId: `cls-${row.classNum}`,
      sectionId: `sec-${row.classNum}-${row.sec}`,
      groupId: row.groupId,
      optionalClassSubjectId: optCsId,
      roll: row.roll,
      enrollmentDate: '2026-01-05',
      formSerialNo: String(100 + idx),
      isRepeater: false,
      isReadmission: row.classNum > 6,
      status: isSeededTransfer ? EnrollmentStatus.TRANSFERRED : EnrollmentStatus.ACTIVE,
      createdAt: NOW,
      updatedAt: NOW,
    });

    if (row.rfid) {
      rfidCards.push({
        id: `rfid-${idx + 1}`,
        studentId: row.id,
        cardNumber: row.rfid,
        status: idx === 4 ? CardStatus.LOST : CardStatus.ACTIVE,
        issuedAt: '2026-01-15T09:00:00.000Z',
        remarks: idx === 4 ? 'শিক্ষার্থী কার্ড হারানোর রিপোর্ট করেছে' : 'সক্রিয় এসএসসি ব্যাচ কার্ড',
        createdAt: NOW,
        updatedAt: NOW,
      });
    }

    if (!parentsMap.has(row.parentId)) {
      parentsMap.set(row.parentId, {
        id: row.parentId,
        userId: row.parentId === 'par-1' ? 'user-parent-1' : null,
        name: row.parentName,
        nameBn: row.parentNameBn,
        phone: row.parentPhone,
        email: row.parentId === 'par-1' ? 'parent@bhs.edu.bd' : null,
        nid: `19828614500${String(100000 + idx)}`,
        occupation: row.parentOcc,
        monthlyIncome: 28000 + idx * 1500,
        address: 'ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
        createdAt: NOW,
        updatedAt: NOW,
      });
    }

    parentStudents.push({
      id: `ps-${idx + 1}`,
      parentId: row.parentId,
      studentId: row.id,
      relationship: RelationshipType.FATHER,
      isPrimary: true,
      isEmergencyContact: true,
      isSmsReceiver: true,
      createdAt: NOW,
      updatedAt: NOW,
    });
  });

  const parents = Array.from(parentsMap.values());

  const promotions: StudentPromotion[] = [
    {
      id: 'promo-1',
      studentId: 'stu-10-1',
      fromEnrollmentId: 'enr-prev-2025-1',
      toEnrollmentId: 'enr-stu-10-1',
      promotionType: PromotionType.PROMOTED,
      promotionDate: '2026-01-02',
      remarks: '৯ম শ্রেণির বার্ষিক পরীক্ষায় জিপিএ ৫.০০ অর্জন করে উত্তীর্ণ।',
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const transferCertificates: StudentTransferCertificate[] = [
    {
      id: 'tc-1',
      studentId: 'stu-8-3',
      enrollmentId: 'enr-stu-8-3',
      tcNumber: 'TC-2026-001',
      issueDate: '2026-08-14',
      leavingDate: '2026-08-10',
      reason: 'অভিভাবকের কর্মস্থল পরিবর্তনের কারণে ঢাকায় স্থানান্তর।',
      duesCleared: true,
      conductRemarks: 'উত্তম ও শান্ত',
      leavingClass: '৮ম শ্রেণি',
      promotedToNextClass: false,
      destinationSchool: 'মিরপুর গার্লস আইডিয়াল স্কুল, ঢাকা',
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  // 6. Teacher Assignments, Class Teachers, Weekly Class Routines
  const teacherAssignments: TeacherAssignment[] = [
    { id: 'ta-1', staffId: 'staff-3', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-ka', classSubjectId: 'cs-10-sub-math', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-2', staffId: 'staff-4', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-ka', classSubjectId: 'cs-10-sub-eng', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-3', staffId: 'staff-2', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-ka', classSubjectId: 'cs-10-sub-ban', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-4', staffId: 'staff-5', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-ka', classSubjectId: 'cs-10-sci-sub-phy', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-5', staffId: 'staff-5', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-ka', classSubjectId: 'cs-10-sci-sub-che', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-6', staffId: 'staff-6', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-ka', classSubjectId: 'cs-10-sci-sub-bio', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-7', staffId: 'staff-3', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-ka', classSubjectId: 'cs-10-sci-sub-hmath', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-8', staffId: 'staff-7', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-ka', classSubjectId: 'cs-10-sub-ict', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-9', staffId: 'staff-3', academicYearId: 'ay-2026', classId: 'cls-9', sectionId: 'sec-9-ka', classSubjectId: 'cs-9-sub-math', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-10', staffId: 'staff-4', academicYearId: 'ay-2026', classId: 'cls-9', sectionId: 'sec-9-ka', classSubjectId: 'cs-9-sub-eng', canEnterMarks: false, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-11', staffId: 'staff-3', academicYearId: 'ay-2026', classId: 'cls-8', sectionId: 'sec-8-ka', classSubjectId: 'cs-8-sub-math', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    // Additional realistic assignments across Classes 6–10 for full weekly timetable coverage
    { id: 'ta-12', staffId: 'staff-2', academicYearId: 'ay-2026', classId: 'cls-9', sectionId: 'sec-9-ka', classSubjectId: 'cs-9-sub-ban', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-13', staffId: 'staff-5', academicYearId: 'ay-2026', classId: 'cls-9', sectionId: 'sec-9-ka', classSubjectId: 'cs-9-sci-sub-phy', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-14', staffId: 'staff-6', academicYearId: 'ay-2026', classId: 'cls-9', sectionId: 'sec-9-ka', classSubjectId: 'cs-9-sci-sub-bio', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-15', staffId: 'staff-7', academicYearId: 'ay-2026', classId: 'cls-9', sectionId: 'sec-9-ka', classSubjectId: 'cs-9-sub-ict', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-16', staffId: 'staff-2', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-kha', classSubjectId: 'cs-10-sub-ban', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-17', staffId: 'staff-4', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-kha', classSubjectId: 'cs-10-sub-eng', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-18', staffId: 'staff-8', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-kha', classSubjectId: 'cs-10-bus-sub-acc', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-19', staffId: 'staff-9', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-kha', classSubjectId: 'cs-10-hum-sub-his', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-20', staffId: 'staff-7', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-kha', classSubjectId: 'cs-10-sub-ict', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-21', staffId: 'staff-2', academicYearId: 'ay-2026', classId: 'cls-8', sectionId: 'sec-8-ka', classSubjectId: 'cs-8-sub-ban', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-22', staffId: 'staff-4', academicYearId: 'ay-2026', classId: 'cls-8', sectionId: 'sec-8-ka', classSubjectId: 'cs-8-sub-eng', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-23', staffId: 'staff-5', academicYearId: 'ay-2026', classId: 'cls-8', sectionId: 'sec-8-ka', classSubjectId: 'cs-8-sub-sci', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-24', staffId: 'staff-7', academicYearId: 'ay-2026', classId: 'cls-8', sectionId: 'sec-8-ka', classSubjectId: 'cs-8-sub-ict', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-25', staffId: 'staff-9', academicYearId: 'ay-2026', classId: 'cls-8', sectionId: 'sec-8-ka', classSubjectId: 'cs-8-sub-bgs', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-26', staffId: 'staff-2', academicYearId: 'ay-2026', classId: 'cls-7', sectionId: 'sec-7-ka', classSubjectId: 'cs-7-sub-ban', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-27', staffId: 'staff-4', academicYearId: 'ay-2026', classId: 'cls-7', sectionId: 'sec-7-ka', classSubjectId: 'cs-7-sub-eng', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-28', staffId: 'staff-3', academicYearId: 'ay-2026', classId: 'cls-7', sectionId: 'sec-7-ka', classSubjectId: 'cs-7-sub-math', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-29', staffId: 'staff-6', academicYearId: 'ay-2026', classId: 'cls-7', sectionId: 'sec-7-ka', classSubjectId: 'cs-7-sub-sci', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-30', staffId: 'staff-9', academicYearId: 'ay-2026', classId: 'cls-7', sectionId: 'sec-7-ka', classSubjectId: 'cs-7-sub-bgs', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-31', staffId: 'staff-2', academicYearId: 'ay-2026', classId: 'cls-6', sectionId: 'sec-6-ka', classSubjectId: 'cs-6-sub-ban', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-32', staffId: 'staff-4', academicYearId: 'ay-2026', classId: 'cls-6', sectionId: 'sec-6-ka', classSubjectId: 'cs-6-sub-eng', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-33', staffId: 'staff-3', academicYearId: 'ay-2026', classId: 'cls-6', sectionId: 'sec-6-ka', classSubjectId: 'cs-6-sub-math', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-34', staffId: 'staff-6', academicYearId: 'ay-2026', classId: 'cls-6', sectionId: 'sec-6-ka', classSubjectId: 'cs-6-sub-sci', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-35', staffId: 'staff-7', academicYearId: 'ay-2026', classId: 'cls-6', sectionId: 'sec-6-ka', classSubjectId: 'cs-6-sub-ict', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-36', staffId: 'staff-9', academicYearId: 'ay-2026', classId: 'cls-6', sectionId: 'sec-6-ka', classSubjectId: 'cs-6-sub-bgs', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  const sectionClassTeachers: SectionClassTeacher[] = [
    { id: 'sct-1', academicYearId: 'ay-2026', sectionId: 'sec-10-ka', staffId: 'staff-3', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
    { id: 'sct-2', academicYearId: 'ay-2026', sectionId: 'sec-9-ka', staffId: 'staff-4', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
    { id: 'sct-3', academicYearId: 'ay-2026', sectionId: 'sec-8-ka', staffId: 'staff-5', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
    { id: 'sct-4', academicYearId: 'ay-2026', sectionId: 'sec-7-ka', staffId: 'staff-6', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
    { id: 'sct-5', academicYearId: 'ay-2026', sectionId: 'sec-6-ka', staffId: 'staff-9', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
    { id: 'sct-6', academicYearId: 'ay-2026', sectionId: 'sec-10-kha', staffId: 'staff-8', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
    { id: 'sct-7', academicYearId: 'ay-2026', sectionId: 'sec-9-kha', staffId: 'staff-7', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
    { id: 'sct-8', academicYearId: 'ay-2026', sectionId: 'sec-8-kha', staffId: 'staff-2', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
    { id: 'sct-9', academicYearId: 'ay-2026', sectionId: 'sec-7-kha', staffId: 'staff-9', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
    { id: 'sct-10', academicYearId: 'ay-2026', sectionId: 'sec-6-kha', staffId: 'staff-6', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
  ];

  const classRoutines: ClassRoutine[] = [
    // Class 10 (ক) — Complete Sunday–Thursday (Periods 1–4, Tiffin 12:15–12:45)
    { id: 'cr-1', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-3', staffId: 'staff-2', sectionId: 'sec-10-ka', day: WeekDay.SUNDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ২০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-2', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-2', staffId: 'staff-4', sectionId: 'sec-10-ka', day: WeekDay.SUNDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রুম ২০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-3', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-1', staffId: 'staff-3', sectionId: 'sec-10-ka', day: WeekDay.SUNDAY, periodNumber: 3, startTime: '11:30', endTime: '12:15', room: 'রুম ২০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-4', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-4', staffId: 'staff-5', sectionId: 'sec-10-ka', day: WeekDay.SUNDAY, periodNumber: 4, startTime: '12:45', endTime: '13:30', room: 'বিজ্ঞান ল্যাব', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-5', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-1', staffId: 'staff-3', sectionId: 'sec-10-ka', day: WeekDay.MONDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ২০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-6', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-5', staffId: 'staff-5', sectionId: 'sec-10-ka', day: WeekDay.MONDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রসায়ন ল্যাব', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-7', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-8', staffId: 'staff-7', sectionId: 'sec-10-ka', day: WeekDay.MONDAY, periodNumber: 3, startTime: '11:30', endTime: '12:15', room: 'কম্পিউটার ল্যাব', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-14', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-3', staffId: 'staff-2', sectionId: 'sec-10-ka', day: WeekDay.MONDAY, periodNumber: 4, startTime: '12:45', endTime: '13:30', room: 'রুম ২০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-8', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-2', staffId: 'staff-4', sectionId: 'sec-10-ka', day: WeekDay.TUESDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ২০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-9', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-6', staffId: 'staff-6', sectionId: 'sec-10-ka', day: WeekDay.TUESDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রুম ২০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-15', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-4', staffId: 'staff-5', sectionId: 'sec-10-ka', day: WeekDay.TUESDAY, periodNumber: 3, startTime: '11:30', endTime: '12:15', room: 'বিজ্ঞান ল্যাব', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-16', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-7', staffId: 'staff-3', sectionId: 'sec-10-ka', day: WeekDay.TUESDAY, periodNumber: 4, startTime: '12:45', endTime: '13:30', room: 'রুম ২০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-10', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-7', staffId: 'staff-3', sectionId: 'sec-10-ka', day: WeekDay.WEDNESDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ২০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-17', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-3', staffId: 'staff-2', sectionId: 'sec-10-ka', day: WeekDay.WEDNESDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রুম ২০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-18', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-5', staffId: 'staff-5', sectionId: 'sec-10-ka', day: WeekDay.WEDNESDAY, periodNumber: 3, startTime: '11:30', endTime: '12:15', room: 'রসায়ন ল্যাব', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-19', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-8', staffId: 'staff-7', sectionId: 'sec-10-ka', day: WeekDay.WEDNESDAY, periodNumber: 4, startTime: '12:45', endTime: '13:30', room: 'কম্পিউটার ল্যাব', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-20', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-1', staffId: 'staff-3', sectionId: 'sec-10-ka', day: WeekDay.THURSDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ২০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-21', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-2', staffId: 'staff-4', sectionId: 'sec-10-ka', day: WeekDay.THURSDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রুম ২০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-22', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-6', staffId: 'staff-6', sectionId: 'sec-10-ka', day: WeekDay.THURSDAY, periodNumber: 3, startTime: '11:30', endTime: '12:15', room: 'জীববিজ্ঞান ল্যাব', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-23', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-4', staffId: 'staff-5', sectionId: 'sec-10-ka', day: WeekDay.THURSDAY, periodNumber: 4, startTime: '12:45', endTime: '13:30', room: 'রুম ২০১', createdAt: NOW, updatedAt: NOW },

    // Class 10 (খ) — Humanities & Business Studies
    { id: 'cr-24', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-16', staffId: 'staff-2', sectionId: 'sec-10-kha', day: WeekDay.SUNDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ২০২', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-25', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-18', staffId: 'staff-8', sectionId: 'sec-10-kha', day: WeekDay.SUNDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রুম ২০২', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-26', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-19', staffId: 'staff-9', sectionId: 'sec-10-kha', day: WeekDay.SUNDAY, periodNumber: 3, startTime: '11:30', endTime: '12:15', room: 'রুম ২০২', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-27', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-17', staffId: 'staff-4', sectionId: 'sec-10-kha', day: WeekDay.MONDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ২০২', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-28', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-20', staffId: 'staff-7', sectionId: 'sec-10-kha', day: WeekDay.MONDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'কম্পিউটার ল্যাব', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-29', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-18', staffId: 'staff-8', sectionId: 'sec-10-kha', day: WeekDay.TUESDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ২০২', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-30', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-19', staffId: 'staff-9', sectionId: 'sec-10-kha', day: WeekDay.WEDNESDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রুম ২০২', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-31', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-16', staffId: 'staff-2', sectionId: 'sec-10-kha', day: WeekDay.THURSDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ২০২', createdAt: NOW, updatedAt: NOW },

    // Class 9 (ক)
    { id: 'cr-11', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-9', staffId: 'staff-3', sectionId: 'sec-9-ka', day: WeekDay.SUNDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ১০৮', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-32', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-12', staffId: 'staff-2', sectionId: 'sec-9-ka', day: WeekDay.SUNDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রুম ১০৮', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-12', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-10', staffId: 'staff-4', sectionId: 'sec-9-ka', day: WeekDay.SUNDAY, periodNumber: 3, startTime: '11:30', endTime: '12:15', room: 'রুম ১০৮', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-33', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-13', staffId: 'staff-5', sectionId: 'sec-9-ka', day: WeekDay.SUNDAY, periodNumber: 4, startTime: '12:45', endTime: '13:30', room: 'বিজ্ঞান ল্যাব', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-34', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-14', staffId: 'staff-6', sectionId: 'sec-9-ka', day: WeekDay.MONDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ১০৮', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-35', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-9', staffId: 'staff-3', sectionId: 'sec-9-ka', day: WeekDay.MONDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রুম ১০৮', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-36', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-15', staffId: 'staff-7', sectionId: 'sec-9-ka', day: WeekDay.TUESDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'কম্পিউটার ল্যাব', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-37', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-10', staffId: 'staff-4', sectionId: 'sec-9-ka', day: WeekDay.TUESDAY, periodNumber: 3, startTime: '11:30', endTime: '12:15', room: 'রুম ১০৮', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-38', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-12', staffId: 'staff-2', sectionId: 'sec-9-ka', day: WeekDay.WEDNESDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ১০৮', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-39', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-13', staffId: 'staff-5', sectionId: 'sec-9-ka', day: WeekDay.WEDNESDAY, periodNumber: 3, startTime: '11:30', endTime: '12:15', room: 'রুম ১০৮', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-40', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-9', staffId: 'staff-3', sectionId: 'sec-9-ka', day: WeekDay.THURSDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রুম ১০৮', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-41', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-14', staffId: 'staff-6', sectionId: 'sec-9-ka', day: WeekDay.THURSDAY, periodNumber: 4, startTime: '12:45', endTime: '13:30', room: 'রুম ১০৮', createdAt: NOW, updatedAt: NOW },

    // Class 8 (ক)
    { id: 'cr-42', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-21', staffId: 'staff-2', sectionId: 'sec-8-ka', day: WeekDay.SUNDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ১০৫', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-43', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-23', staffId: 'staff-5', sectionId: 'sec-8-ka', day: WeekDay.SUNDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রুম ১০৫', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-44', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-22', staffId: 'staff-4', sectionId: 'sec-8-ka', day: WeekDay.MONDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ১০৫', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-45', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-11', staffId: 'staff-3', sectionId: 'sec-8-ka', day: WeekDay.MONDAY, periodNumber: 3, startTime: '11:30', endTime: '12:15', room: 'রুম ১০৫', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-46', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-24', staffId: 'staff-7', sectionId: 'sec-8-ka', day: WeekDay.TUESDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'কম্পিউটার ল্যাব', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-47', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-25', staffId: 'staff-9', sectionId: 'sec-8-ka', day: WeekDay.TUESDAY, periodNumber: 3, startTime: '11:30', endTime: '12:15', room: 'রুম ১০৫', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-48', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-21', staffId: 'staff-2', sectionId: 'sec-8-ka', day: WeekDay.WEDNESDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রুম ১০৫', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-49', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-23', staffId: 'staff-5', sectionId: 'sec-8-ka', day: WeekDay.WEDNESDAY, periodNumber: 4, startTime: '12:45', endTime: '13:30', room: 'রুম ১০৫', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-13', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-11', staffId: 'staff-3', sectionId: 'sec-8-ka', day: WeekDay.THURSDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রুম ১০৫', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-50', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-22', staffId: 'staff-4', sectionId: 'sec-8-ka', day: WeekDay.THURSDAY, periodNumber: 3, startTime: '11:30', endTime: '12:15', room: 'রুম ১০৫', createdAt: NOW, updatedAt: NOW },

    // Class 7 (ক)
    { id: 'cr-51', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-26', staffId: 'staff-2', sectionId: 'sec-7-ka', day: WeekDay.SUNDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ১০৩', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-52', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-28', staffId: 'staff-3', sectionId: 'sec-7-ka', day: WeekDay.SUNDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রুম ১০৩', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-53', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-29', staffId: 'staff-6', sectionId: 'sec-7-ka', day: WeekDay.SUNDAY, periodNumber: 4, startTime: '12:45', endTime: '13:30', room: 'রুম ১০৩', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-54', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-27', staffId: 'staff-4', sectionId: 'sec-7-ka', day: WeekDay.MONDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রুম ১০৩', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-55', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-30', staffId: 'staff-9', sectionId: 'sec-7-ka', day: WeekDay.MONDAY, periodNumber: 3, startTime: '11:30', endTime: '12:15', room: 'রুম ১০৩', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-56', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-28', staffId: 'staff-3', sectionId: 'sec-7-ka', day: WeekDay.TUESDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ১০৩', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-57', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-29', staffId: 'staff-6', sectionId: 'sec-7-ka', day: WeekDay.WEDNESDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রুম ১০৩', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-58', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-26', staffId: 'staff-2', sectionId: 'sec-7-ka', day: WeekDay.THURSDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ১০৩', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-59', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-27', staffId: 'staff-4', sectionId: 'sec-7-ka', day: WeekDay.THURSDAY, periodNumber: 3, startTime: '11:30', endTime: '12:15', room: 'রুম ১০৩', createdAt: NOW, updatedAt: NOW },

    // Class 6 (ক)
    { id: 'cr-60', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-31', staffId: 'staff-2', sectionId: 'sec-6-ka', day: WeekDay.SUNDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ১০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-61', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-32', staffId: 'staff-4', sectionId: 'sec-6-ka', day: WeekDay.SUNDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রুম ১০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-62', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-34', staffId: 'staff-6', sectionId: 'sec-6-ka', day: WeekDay.SUNDAY, periodNumber: 3, startTime: '11:30', endTime: '12:15', room: 'রুম ১০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-63', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-33', staffId: 'staff-3', sectionId: 'sec-6-ka', day: WeekDay.MONDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ১০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-64', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-35', staffId: 'staff-7', sectionId: 'sec-6-ka', day: WeekDay.MONDAY, periodNumber: 4, startTime: '12:45', endTime: '13:30', room: 'কম্পিউটার ল্যাব', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-65', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-36', staffId: 'staff-9', sectionId: 'sec-6-ka', day: WeekDay.TUESDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রুম ১০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-66', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-33', staffId: 'staff-3', sectionId: 'sec-6-ka', day: WeekDay.WEDNESDAY, periodNumber: 1, startTime: '10:00', endTime: '10:45', room: 'রুম ১০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-67', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-31', staffId: 'staff-2', sectionId: 'sec-6-ka', day: WeekDay.THURSDAY, periodNumber: 2, startTime: '10:45', endTime: '11:30', room: 'রুম ১০১', createdAt: NOW, updatedAt: NOW },
    { id: 'cr-68', academicYearId: 'ay-2026', teacherAssignmentId: 'ta-34', staffId: 'staff-6', sectionId: 'sec-6-ka', day: WeekDay.THURSDAY, periodNumber: 4, startTime: '12:45', endTime: '13:30', room: 'রুম ১০১', createdAt: NOW, updatedAt: NOW },
  ];

  const academicDocuments: AcademicDocument[] = [
    {
      id: 'adoc-1',
      type: AcademicDocumentType.CURRICULUM,
      title: 'ষষ্ঠ থেকে দশম শ্রেণি — ২০২৬ শিক্ষাবর্ষের পাঠ্যক্রম ও সিলেবাস',
      description:
        'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (এনসিটিবি) অনুমোদিত ২০২৬ শিক্ষাবর্ষের অধ্যায়ভিত্তিক পাঠ্যসূচি, অর্ধবার্ষিক ও বার্ষিক মূল্যায়ন কাঠামো এবং ব্যবহারিক পরীক্ষার মানবণ্টন নির্দেশিকা।',
      fileUrl: '#syllabus-2026',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'adoc-2',
      type: AcademicDocumentType.STUDENT_RULES,
      title: 'শিক্ষার্থীদের আচরণবিধি ও উপস্থিতি নীতিমালা',
      description:
        'প্রতিটি শিক্ষার্থীর ন্যূনতম ৮০% শ্রেণি উপস্থিতি, প্রাত্যহিক সমাবেশে সময়মতো অংশগ্রহণ, বিদ্যালয়ের শৃঙ্খলা রক্ষা এবং পরীক্ষার হলে করণীয় ও বর্জনীয় সংক্রান্ত পূর্ণাঙ্গ নীতিমালা।',
      fileUrl: '#student-rules',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'adoc-3',
      type: AcademicDocumentType.PARENT_GUIDELINES,
      title: 'অভিভাবকদের জন্য নির্দেশিকা ও ডিজিটাল পোর্টাল ব্যবহারবিধি',
      description:
        'সন্তানের দৈনিক উপস্থিতি, স্বয়ংক্রিয় RFID ও অনুপস্থিতি এসএমএস অ্যালার্ট, ফলাফল পর্যবেক্ষণ এবং অভিভাবক-শিক্ষক সমন্বয় সভার নিয়মিত নির্দেশিকা।',
      fileUrl: '#parent-guidelines',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'adoc-4',
      type: AcademicDocumentType.DRESS_CODE,
      title: 'বিদ্যালয়ের নির্ধারিত পোশাক বিধি (ড্রেস কোড)',
      description:
        'ছাত্রদের জন্য সাদা শার্ট, নেভি ব্লু ফুল প্যান্ট ও কালো জুতা; ছাত্রীদের জন্য নেভি ব্লু কামিজ, সাদা সালোয়ার ও সাদা ওড়না এবং সকল শিক্ষার্থীর জন্য বিদ্যালয়ের মনোগ্রামযুক্ত আইডি কার্ড ও ব্যাজ।',
      fileUrl: '#dress-code',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  // Authentic Class-wise & Term-wise Official Syllabus Files (PDF attachments)
  const syllabusFiles: SyllabusFile[] = [
    { id: 'sf-10-hy', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'HALF_YEARLY', title: '১০ম শ্রেণি (এসএসসি) — অর্ধবার্ষিক পরীক্ষা ২০২৬ পূর্ণাঙ্গ সিলেবাস', fileName: 'BHS-Class-10-Half-Yearly-Syllabus-2026.pdf', fileSize: '342 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-01-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-10-ann', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'ANNUAL', title: '১০ম শ্রেণি (এসএসসি) — বার্ষিক / প্রাক-নির্বাচনি পরীক্ষা ২০২৬ সিলেবাস', fileName: 'BHS-Class-10-Annual-Syllabus-2026.pdf', fileSize: '388 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-07-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-10-sel', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'SELECTION', title: '১০ম শ্রেণি — এসএসসি নির্বাচনি (টেস্ট) পরীক্ষা ২০২৬ পূর্ণাঙ্গ বোর্ড সিলেবাস', fileName: 'BHS-SSC-Selection-Full-Syllabus-2026.pdf', fileSize: '416 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-09-01', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-9-hy', academicYearId: 'ay-2026', classId: 'cls-9', groupId: null, examTerm: 'HALF_YEARLY', title: '৯ম শ্রেণি — অর্ধবার্ষিক পরীক্ষা ২০২৬ সিলেবাস (সকল বিভাগ)', fileName: 'BHS-Class-9-Half-Yearly-Syllabus-2026.pdf', fileSize: '318 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-01-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-9-ann', academicYearId: 'ay-2026', classId: 'cls-9', groupId: null, examTerm: 'ANNUAL', title: '৯ম শ্রেণি — বার্ষিক পরীক্ষা ২০২৬ সিলেবাস (সকল বিভাগ)', fileName: 'BHS-Class-9-Annual-Syllabus-2026.pdf', fileSize: '334 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-07-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-8-hy', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'HALF_YEARLY', title: '৮ম শ্রেণি — অর্ধবার্ষিক পরীক্ষা ২০২৬ সিলেবাস', fileName: 'BHS-Class-8-Half-Yearly-Syllabus-2026.pdf', fileSize: '274 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-01-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-8-ann', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'ANNUAL', title: '৮ম শ্রেণি — বার্ষিক পরীক্ষা ২০২৬ সিলেবাস', fileName: 'BHS-Class-8-Annual-Syllabus-2026.pdf', fileSize: '286 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-07-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-7-hy', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'HALF_YEARLY', title: '৭ম শ্রেণি — অর্ধবার্ষিক পরীক্ষা ২০২৬ সিলেবাস', fileName: 'BHS-Class-7-Half-Yearly-Syllabus-2026.pdf', fileSize: '256 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-01-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-7-ann', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'ANNUAL', title: '৭ম শ্রেণি — বার্ষিক পরীক্ষা ২০২৬ সিলেবাস', fileName: 'BHS-Class-7-Annual-Syllabus-2026.pdf', fileSize: '264 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-07-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-6-hy', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'HALF_YEARLY', title: '৬ষ্ঠ শ্রেণি — অর্ধবার্ষিক পরীক্ষা ২০২৬ সিলেবাস', fileName: 'BHS-Class-6-Half-Yearly-Syllabus-2026.pdf', fileSize: '248 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-01-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-6-ann', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'ANNUAL', title: '৬ষ্ঠ শ্রেণি — বার্ষিক পরীক্ষা ২০২৬ সিলেবাস', fileName: 'BHS-Class-6-Annual-Syllabus-2026.pdf', fileSize: '258 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-07-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
  ];

  // Authentic NCTB Chapter-wise Syllabus Entries across Classes 6–10 & Terms
  const syllabusEntries: SyllabusChapterEntry[] = [
    // Class 10 — Half-Yearly
    { id: 'se-10-hy-ban', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-ban', chaptersBn: 'গদ্য: সুভা, বইপড়া, অভাগীর স্বর্গ, প্রবাস বন্ধু; পদ্য: বঙ্গবাণী, কপোতাক্ষ নদ, জীবন-সঙ্গীত; ব্যাকরণ: ধ্বনিতত্ত্ব ও শব্দ প্রকরণ', chaptersEn: 'Prose: Shuvas, Boipora, Obhagir Swargo, Probash Bondhu; Poetry: Bongobani, Kopotakkho Nod, Jibon-Sangeet; Grammar: Phonology & Morphology', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-10-hy-eng', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-eng', chaptersBn: 'English For Today: Units 1–6; Grammar: Right Form of Verbs, Transformation, Narration, Connectors; Composition: Paragraph & Formal Letter', chaptersEn: 'English For Today: Units 1–6; Grammar: Right Form of Verbs, Transformation, Narration, Connectors; Composition: Paragraph & Formal Letter', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-10-hy-math', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ১ (বাস্তব সংখ্যা), অধ্যায় ২ (সেট ও ফাংশন), অধ্যায় ৩ (বীজগাণিতিক রাশি), অধ্যায় ৮ (বৃত্ত), অধ্যায় ১৭ (পরিসংখ্যান)', chaptersEn: 'Ch 1 (Real Numbers), Ch 2 (Sets & Functions), Ch 3 (Algebraic Expressions), Ch 8 (Circles), Ch 17 (Statistics)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-10-hy-ict', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-ict', chaptersBn: 'অধ্যায় ১ (তথ্য ও যোগাযোগ প্রযুক্তি এবং আমাদের বাংলাদেশ), অধ্যায় ২ (কম্পিউটার ও কম্পিউটার ব্যবহারকারীর নিরাপত্তা), অধ্যায় ৩ (আমার শিক্ষায় ইন্টারনেট)', chaptersEn: 'Ch 1 (ICT & Bangladesh), Ch 2 (Computer Security), Ch 3 (Internet in Education)', marksBreakdownBn: 'মোট ৫০ (বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 50 (MCQ 25 + Practical 25)', displayOrder: 4 },
    { id: 'se-10-hy-phy', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-sci', examTerm: 'HALF_YEARLY', subjectId: 'sub-phy', chaptersBn: 'অধ্যায় ১ (ভৌত রাশি ও পরিমাপ), অধ্যায় ২ (গতি), অধ্যায় ৩ (বল), অধ্যায় ৪ (কাজ, ক্ষমতা ও শক্তি), অধ্যায় ৫ (পদার্থের অবস্থা ও চাপ)', chaptersEn: 'Ch 1 (Physical Quantities), Ch 2 (Motion), Ch 3 (Force), Ch 4 (Work, Power & Energy), Ch 5 (State of Matter & Pressure)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 5 },
    { id: 'se-10-hy-che', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-sci', examTerm: 'HALF_YEARLY', subjectId: 'sub-che', chaptersBn: 'অধ্যায় ১–৫ (রসায়নের ধারণা, পদার্থের অবস্থা, পদার্থের গঠন, পর্যায় সারণি, রাসায়নিক বন্ধন)', chaptersEn: 'Chapters 1–5 (Concept of Chemistry, States & Structure of Matter, Periodic Table, Chemical Bonding)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 6 },
    { id: 'se-10-hy-bio', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-sci', examTerm: 'HALF_YEARLY', subjectId: 'sub-bio', chaptersBn: 'অধ্যায় ১ (জীবন পাঠ), অধ্যায় ২ (জীবকোষ ও টিস্যু), অধ্যায় ৩ (কোষ বিভাজন), অধ্যায় ৪ (জীবনীশক্তি)', chaptersEn: 'Ch 1 (Lessons on Life), Ch 2 (Cells & Tissues), Ch 3 (Cell Division), Ch 4 (Bioenergetics)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 7 },
    { id: 'se-10-hy-hmath', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-sci', examTerm: 'HALF_YEARLY', subjectId: 'sub-hmath', chaptersBn: 'অধ্যায় ১ (সেট ও ফাংশন), অধ্যায় ২ (বীজগাণিতিক রাশি), অধ্যায় ৩ (জ্যামিতি), অধ্যায় ৮ (ত্রিকোণমিতি)', chaptersEn: 'Ch 1 (Sets & Functions), Ch 2 (Algebraic Expressions), Ch 3 (Geometry), Ch 8 (Trigonometry)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 8 },
    { id: 'se-10-hy-his', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-hum', examTerm: 'HALF_YEARLY', subjectId: 'sub-his', chaptersBn: 'অধ্যায় ১–৬ (ইতিহাস পরিচিতি, বিশ্বসভ্যতা, প্রাচীন বাংলার জনপদ, মধ্যযুগের বাংলা)', chaptersEn: 'Chapters 1–6 (Introduction to History, World Civilizations, Ancient & Medieval Bengal)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 5 },
    { id: 'se-10-hy-bgs', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-hum', examTerm: 'HALF_YEARLY', subjectId: 'sub-bgs', chaptersBn: 'অধ্যায় ১–৭ (পূর্ব বাংলার আন্দোলন ও জাতীয়তাবাদের উত্থান, স্বাধীন বাংলাদেশ, সৌরজগৎ ও ভূমণ্ডল)', chaptersEn: 'Chapters 1–7 (Nationalist Movement, Independent Bangladesh, Solar System & Geography)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 6 },
    { id: 'se-10-hy-acc', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-bus', examTerm: 'HALF_YEARLY', subjectId: 'sub-acc', chaptersBn: 'অধ্যায় ১–৬ (হিসাববিজ্ঞান পরিচিতি, লেনদেন, দুতরফা দাখিলা পদ্ধতি, মূলধন ও মুনাফা জাতীয় লেনদেন, হিসাব, জাবেদা)', chaptersEn: 'Chapters 1–6 (Intro to Accounting, Transactions, Double Entry, Capital & Revenue, Accounts, Journal)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 5 },

    // Class 10 — Annual
    { id: 'se-10-ann-ban', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-ban', chaptersBn: 'গদ্য: মানুষ মুহম্মদ (স.), নিমগাছ, শিক্ষা ও মনুষ্যত্ব, একাত্তরের দিনগুলি; পদ্য: মানুষ, সেইদিন এই মাঠ, তোমাকে পাওয়ার জন্যে হে স্বাধীনতা; উপন্যাস: কাকতাড়ুয়া ও নাটক: বহিপীর', chaptersEn: 'Prose: Manush Muhammad (S), Nimgach, Shikkha o Monushotto, Ekattorer Dinguli; Poetry: Manush, Seidin Ei Math; Novel: Kaktarua & Drama: Bohipir', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-10-ann-eng', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-eng', chaptersBn: 'English For Today: Units 7–13; Grammar: Completing Sentences, Tag Questions, Punctuation, Suffix-Prefix; Composition: Essay, CV & Dialogue', chaptersEn: 'English For Today: Units 7–13; Grammar: Completing Sentences, Tag Questions, Punctuation; Composition: Essay, CV & Dialogue', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-10-ann-math', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ৪ (সূচক ও লগারিদম), অধ্যায় ৯ (ত্রিকোণমিতিক অনুপাত), অধ্যায় ১০ (দূরত্ব ও উচ্চতা), অধ্যায় ১৩ (সসীম ধারা), অধ্যায় ১৬ (পরিমিতি)', chaptersEn: 'Ch 4 (Exponents & Logs), Ch 9 (Trigonometry), Ch 10 (Distance & Height), Ch 13 (Finite Series), Ch 16 (Mensuration)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-10-ann-ict', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-ict', chaptersBn: 'অধ্যায় ৪ (আমার লেখালেখি ও হিসাব), অধ্যায় ৫ (মাল্টিমিডিয়া ও গ্রাফিক্স), অধ্যায় ৬ (ডেটাবেজের ব্যবহার)', chaptersEn: 'Ch 4 (Word Processing & Spreadsheets), Ch 5 (Multimedia & Graphics), Ch 6 (Database Usage)', marksBreakdownBn: 'মোট ৫০ (বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 50 (MCQ 25 + Practical 25)', displayOrder: 4 },
    { id: 'se-10-ann-phy', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-sci', examTerm: 'ANNUAL', subjectId: 'sub-phy', chaptersBn: 'অধ্যায় ৭ (তরঙ্গ ও শব্দ), অধ্যায় ৮ (আলোর প্রতিফলন), অধ্যায় ৯ (আলোর প্রতিসরণ), অধ্যায় ১১ (চলবিদ্যুৎ)', chaptersEn: 'Ch 7 (Waves & Sound), Ch 8 (Reflection of Light), Ch 9 (Refraction), Ch 11 (Current Electricity)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 5 },
    { id: 'se-10-ann-che', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-sci', examTerm: 'ANNUAL', subjectId: 'sub-che', chaptersBn: 'অধ্যায় ৬ (মোলের ধারণা ও রাসায়নিক গণনা), অধ্যায় ৭ (রাসায়নিক বিক্রিয়া), অধ্যায় ১১ (খনিজ সম্পদ: জীবাশ্ম)', chaptersEn: 'Ch 6 (Mole Concept), Ch 7 (Chemical Reactions), Ch 11 (Organic Chemistry & Fossil Fuels)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 6 },
    { id: 'se-10-ann-bio', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-sci', examTerm: 'ANNUAL', subjectId: 'sub-bio', chaptersBn: 'অধ্যায় ৬ (জীবে পরিবহন), অধ্যায় ৮ (রেচন প্রক্রিয়া), অধ্যায় ১১ (জীবের প্রজনন), অধ্যায় ১২ (জীবের বংশগতি ও বিবর্তন)', chaptersEn: 'Ch 6 (Transport in Organisms), Ch 8 (Excretion), Ch 11 (Reproduction), Ch 12 (Heredity & Evolution)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 7 },
    { id: 'se-10-ann-his', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-hum', examTerm: 'ANNUAL', subjectId: 'sub-his', chaptersBn: 'অধ্যায় ১০–১৪ (ইংরেজ শাসনামলে বাংলার স্বাধিকার আন্দোলন, ভাষা আন্দোলন ও ১৯৭১ সালের মহান মুক্তিযুদ্ধ)', chaptersEn: 'Chapters 10–14 (Anti-Colonial Movements, Language Movement & 1971 Liberation War)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 5 },
    { id: 'se-10-ann-acc', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-bus', examTerm: 'ANNUAL', subjectId: 'sub-acc', chaptersBn: 'অধ্যায় ৭ (খতিয়ান), অধ্যায় ৮ (নগদান বই), অধ্যায় ৯ (রেওয়ামিল), অধ্যায় ১০ (আর্থিক বিবরণী)', chaptersEn: 'Ch 7 (Ledger), Ch 8 (Cash Book), Ch 9 (Trial Balance), Ch 10 (Financial Statements)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 5 },

    // Class 10 — Selection (SSC Full Board Syllabus)
    { id: 'se-10-sel-ban', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'SELECTION', subjectId: 'sub-ban', chaptersBn: 'এসএসসি বোর্ড নির্ধারিত সম্পূর্ণ বাংলা ১ম ও ২য় পত্র পাঠ্যসূচি (সকল নির্বাচিত গদ্য, পদ্য, উপন্যাস, নাটক ও ব্যাকরণ)', chaptersEn: 'Complete SSC Board Syllabus for Bangla 1st & 2nd Paper (Prose, Poetry, Novel, Drama & Grammar)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-10-sel-eng', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'SELECTION', subjectId: 'sub-eng', chaptersBn: 'সম্পূর্ণ English For Today (Units 1–13) এবং সম্পূর্ণ এসএসসি গ্রামার ও কম্পোজিশন পাঠ্যসূচি', chaptersEn: 'Full English For Today (Units 1–13) & complete SSC Grammar and Composition syllabus', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-10-sel-math', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'SELECTION', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ১ থেকে ১৭ পর্যন্ত সম্পূর্ণ সাধারণ গণিত বোর্ড সিলেবাস (বীজগণিত, জ্যামিতি, ত্রিকোণমিতি ও পরিসংখ্যান)', chaptersEn: 'Complete SSC General Mathematics Board Syllabus (Chapters 1–17)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-10-sel-phy', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-sci', examTerm: 'SELECTION', subjectId: 'sub-phy', chaptersBn: 'অধ্যায় ১–১৪ (সম্পূর্ণ পদার্থবিজ্ঞান বোর্ড সিলেবাস ও ব্যবহারিক খাতা)', chaptersEn: 'Complete SSC Physics Board Syllabus (Chapters 1–14) & Practical Notebook', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 4 },
    { id: 'se-10-sel-che', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-sci', examTerm: 'SELECTION', subjectId: 'sub-che', chaptersBn: 'অধ্যায় ১–১২ (সম্পূর্ণ রসায়ন বোর্ড সিলেবাস ও ব্যবহারিক পরীক্ষণ)', chaptersEn: 'Complete SSC Chemistry Board Syllabus (Chapters 1–12) & Lab Practicals', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 5 },
    { id: 'se-10-sel-his', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-hum', examTerm: 'SELECTION', subjectId: 'sub-his', chaptersBn: 'অধ্যায় ১–১৪ (সম্পূর্ণ বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা বোর্ড সিলেবাস)', chaptersEn: 'Complete History of Bangladesh & World Civilization Board Syllabus (Ch 1–14)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },
    { id: 'se-10-sel-acc', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-bus', examTerm: 'SELECTION', subjectId: 'sub-acc', chaptersBn: 'অধ্যায় ১–১২ (সম্পূর্ণ হিসাববিজ্ঞান বোর্ড সিলেবাস ও আর্থিক বিবরণী)', chaptersEn: 'Complete Accounting Board Syllabus (Ch 1–12 & Financial Statements)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },

    // Class 9 — Half-Yearly & Annual
    { id: 'se-9-hy-ban', academicYearId: 'ay-2026', classId: 'cls-9', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-ban', chaptersBn: 'গদ্য: সুভা, বইপড়া, আম-আঁটির ভেঁপু; পদ্য: বঙ্গবাণী, কপোতাক্ষ নদ, মানুষ; ব্যাকরণ: বাংলা ভাষার ব্যাকরণ অধ্যায় ১–৩', chaptersEn: 'Prose: Shuvas, Boipora, Am-Atir Vepu; Poetry: Bongobani, Kopotakkho Nod, Manush; Grammar Ch 1–3', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-9-hy-eng', academicYearId: 'ay-2026', classId: 'cls-9', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-eng', chaptersBn: 'English For Today: Units 1–5; Grammar: Articles, Prepositions, Substitution Table, Tense; Writing: Paragraph & Email', chaptersEn: 'English For Today: Units 1–5; Grammar: Articles, Prepositions, Tense; Writing: Paragraph & Email', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-9-hy-math', academicYearId: 'ay-2026', classId: 'cls-9', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ১ (বাস্তব সংখ্যা), অধ্যায় ২ (সেট ও ফাংশন), অধ্যায় ৩ (বীজগাণিতিক রাশি), অধ্যায় ৬ (রেখা, কোণ ও ত্রিভুজ)', chaptersEn: 'Ch 1 (Real Numbers), Ch 2 (Sets & Functions), Ch 3 (Algebraic Expressions), Ch 6 (Lines, Angles & Triangles)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-9-hy-phy', academicYearId: 'ay-2026', classId: 'cls-9', groupId: 'grp-sci', examTerm: 'HALF_YEARLY', subjectId: 'sub-phy', chaptersBn: 'অধ্যায় ১ (ভৌত রাশি ও পরিমাপ), অধ্যায় ২ (গতি), অধ্যায় ৩ (বল)', chaptersEn: 'Ch 1 (Physical Quantities & Measurement), Ch 2 (Motion), Ch 3 (Force)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 4 },
    { id: 'se-9-hy-bio', academicYearId: 'ay-2026', classId: 'cls-9', groupId: 'grp-sci', examTerm: 'HALF_YEARLY', subjectId: 'sub-bio', chaptersBn: 'অধ্যায় ১ (জীবন পাঠ), অধ্যায় ২ (জীবকোষ ও টিস্যু), অধ্যায় ৩ (কোষ বিভাজন)', chaptersEn: 'Ch 1 (Lessons on Life), Ch 2 (Cells & Tissues), Ch 3 (Cell Division)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 5 },
    { id: 'se-9-hy-acc', academicYearId: 'ay-2026', classId: 'cls-9', groupId: 'grp-bus', examTerm: 'HALF_YEARLY', subjectId: 'sub-acc', chaptersBn: 'অধ্যায় ১–৪ (হিসাববিজ্ঞান পরিচিতি, লেনদেন, দুতরফা দাখিলা, মূলধন ও মুনাফা)', chaptersEn: 'Chapters 1–4 (Intro to Accounting, Transactions, Double Entry, Capital & Revenue)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },
    { id: 'se-9-hy-his', academicYearId: 'ay-2026', classId: 'cls-9', groupId: 'grp-hum', examTerm: 'HALF_YEARLY', subjectId: 'sub-his', chaptersBn: 'অধ্যায় ১–৫ (ইতিহাস পরিচিতি, বিশ্বসভ্যতা ও প্রাচীন বাংলা)', chaptersEn: 'Chapters 1–5 (Introduction to History, World Civilizations & Ancient Bengal)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },
    { id: 'se-9-ann-ban', academicYearId: 'ay-2026', classId: 'cls-9', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-ban', chaptersBn: 'গদ্য: মানুষ মুহম্মদ (স.), নিমগাছ, মমতাদি; পদ্য: প্রাণ, অন্ধবধূ, ঝর্ণার গান; ব্যাকরণ: সন্ধি, সমাস ও কারক', chaptersEn: 'Prose: Manush Muhammad (S), Nimgach, Momatadi; Poetry: Pran, Ondhobodu; Grammar: Shondhi, Shomas & Karok', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-9-ann-eng', academicYearId: 'ay-2026', classId: 'cls-9', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-eng', chaptersBn: 'English For Today: Units 6–10; Grammar: Changing Sentences, Voice, Narration; Composition: Story & Letter', chaptersEn: 'English For Today: Units 6–10; Grammar: Voice, Narration, Transformation; Composition: Story & Letter', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-9-ann-math', academicYearId: 'ay-2026', classId: 'cls-9', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ৪ (সূচক ও লগারিদম), অধ্যায় ৭ (ব্যবহারিক জ্যামিতি), অধ্যায় ৯ (ত্রিকোণমিতিক অনুপাত), অধ্যায় ১৭ (পরিসংখ্যান)', chaptersEn: 'Ch 4 (Exponents & Logs), Ch 7 (Practical Geometry), Ch 9 (Trigonometry), Ch 17 (Statistics)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-9-ann-phy', academicYearId: 'ay-2026', classId: 'cls-9', groupId: 'grp-sci', examTerm: 'ANNUAL', subjectId: 'sub-phy', chaptersBn: 'অধ্যায় ৪ (কাজ, ক্ষমতা ও শক্তি), অধ্যায় ৫ (পদার্থের অবস্থা ও চাপ), অধ্যায় ৬ (বস্তুর ওপর তাপের প্রভাব)', chaptersEn: 'Ch 4 (Work, Power & Energy), Ch 5 (State of Matter & Pressure), Ch 6 (Effect of Heat)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 4 },
    { id: 'se-9-ann-acc', academicYearId: 'ay-2026', classId: 'cls-9', groupId: 'grp-bus', examTerm: 'ANNUAL', subjectId: 'sub-acc', chaptersBn: 'অধ্যায় ৫ (হিসাব), অধ্যায় ৬ (জাবেদা), অধ্যায় ৭ (খতিয়ান)', chaptersEn: 'Ch 5 (Accounts), Ch 6 (Journal), Ch 7 (Ledger)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },

    // Class 8 — Half-Yearly & Annual
    { id: 'se-8-hy-ban', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-ban', chaptersBn: 'সাহিত্য কণিকা: অতিথির স্মৃতি, ভাব ও কাজ, পড়ে পাওয়া; কবিতা: মানবধর্ম, বঙ্গভূমির প্রতি, দুই বিঘা জমি; ব্যাকরণ: ভাষা ও ধ্বনি', chaptersEn: 'Sahitya Konika: Otithir Smriti, Bhab o Kaj, Pore Pawa; Poems: Manobdhormo, Bongobhumir Proti', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-8-hy-eng', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-eng', chaptersBn: 'English For Today: Units 1–4; Grammar: Parts of Speech, Articles, Tense, Voice; Writing: Paragraph & Dialogue', chaptersEn: 'English For Today: Units 1–4; Grammar: Parts of Speech, Articles, Tense, Voice; Writing: Paragraph & Dialogue', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-8-hy-math', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ১ (প্যাটার্ন), অধ্যায় ২ (মুনাফা), অধ্যায় ৩ (পরিমাপ), অধ্যায় ৪ (বীজগণিতীয় সূত্রাবলি ও প্রয়োগ), অধ্যায় ৮ (চতুর্ভুজ)', chaptersEn: 'Ch 1 (Patterns), Ch 2 (Profit), Ch 3 (Measurement), Ch 4 (Algebraic Formulae), Ch 8 (Quadrilaterals)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-8-hy-sci', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-sci', chaptersBn: 'অধ্যায় ১ (প্রাণিজগতের শ্রেণিবিন্যাস), অধ্যায় ২ (জীবের বৃদ্ধি ও বংশগতি), অধ্যায় ৩ (ব্যাপন, অভিস্রবণ ও প্রস্বেদন), অধ্যায় ৬ (পরমাণুর গঠন)', chaptersEn: 'Ch 1 (Classification of Animals), Ch 2 (Growth & Heredity), Ch 3 (Diffusion & Osmosis), Ch 6 (Structure of Atom)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },
    { id: 'se-8-hy-ict', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-ict', chaptersBn: 'অধ্যায় ১ (তথ্য ও যোগাযোগ প্রযুক্তির গুরুত্ব), অধ্যায় ২ (কম্পিউটার নেটওয়ার্ক)', chaptersEn: 'Ch 1 (Importance of ICT), Ch 2 (Computer Networks)', marksBreakdownBn: 'মোট ৫০ (লিখিত ২৫ + বহুনির্বাচনি ২৫)', marksBreakdownEn: 'Total 50 (Written 25 + MCQ 25)', displayOrder: 5 },
    { id: 'se-8-ann-ban', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-ban', chaptersBn: 'গদ্য: তৈলচিত্রের ভূত, এবারের সংগ্রাম স্বাধীনতার সংগ্রাম, বাংলা নববর্ষ; কবিতা: পাছে লোকে কিছু বলে, নারী, আবার আসিব ফিরে', chaptersEn: 'Prose: Toilochitrer Bhut, Bangla Noboborsho; Poems: Pache Loke Kichu Bole, Nari, Abar Ashibo Phire', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-8-ann-eng', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-eng', chaptersBn: 'English For Today: Units 5–9; Grammar: Narration, Transformation, Punctuation; Composition: Essay & Application', chaptersEn: 'English For Today: Units 5–9; Grammar: Narration, Transformation, Punctuation; Composition: Essay & Application', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-8-ann-math', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ৫ (বীজগণিতীয় ভগ্নাংশ), অধ্যায় ৬ (সরল সহসমীকরণ), অধ্যায় ৯ (পিথাগোরাসের উপপাদ্য), অধ্যায় ১০ (বৃত্ত), অধ্যায় ১১ (তথ্য ও উপাত্ত)', chaptersEn: 'Ch 5 (Algebraic Fractions), Ch 6 (Simple Simultaneous Equations), Ch 9 (Pythagoras Theorem), Ch 10 (Circle), Ch 11 (Data)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-8-ann-sci', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-sci', chaptersBn: 'অধ্যায় ৭ (পৃথিবী ও মহাকর্ষ), অধ্যায় ৮ (রাসায়নিক বিক্রিয়া), অধ্যায় ৯ (বর্তনী ও চলবিদ্যুৎ), অধ্যায় ১০ (অম্ল, ক্ষারক ও লবণ)', chaptersEn: 'Ch 7 (Earth & Gravitation), Ch 8 (Chemical Reactions), Ch 9 (Circuits & Electricity), Ch 10 (Acids, Bases & Salts)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },
    { id: 'se-8-ann-ict', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-ict', chaptersBn: 'অধ্যায় ৩ (তথ্য ও যোগাযোগ প্রযুক্তির নিরাপদ ও নৈতিক ব্যবহার), অধ্যায় ৪ (স্প্রেডশিটের ব্যবহার), অধ্যায় ৫ (শিক্ষা ও দৈনন্দিন জীবনে ইন্টারনেট)', chaptersEn: 'Ch 3 (Safe & Ethical ICT), Ch 4 (Spreadsheets), Ch 5 (Internet in Daily Life)', marksBreakdownBn: 'মোট ৫০ (লিখিত ২৫ + বহুনির্বাচনি ২৫)', marksBreakdownEn: 'Total 50 (Written 25 + MCQ 25)', displayOrder: 5 },

    // Class 7 — Half-Yearly & Annual
    { id: 'se-7-hy-ban', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-ban', chaptersBn: 'সপ্তবর্ণা: কাবুলিওয়ালা, লখার একুশে, মরু-ভাস্কর; কবিতা: নতুন দেশ, কুলি-মজুর, আমার বাড়ি', chaptersEn: 'Soptoborna: Kabuliwala, Lokhar Ekushe, Moru-Bhaskor; Poems: Notun Desh, Kuli-Mojur, Amar Bari', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-7-hy-eng', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-eng', chaptersBn: 'English For Today: Units 1–4; Grammar: Noun, Pronoun, Verb, Tense, Articles; Composition: Paragraph & Informal Letter', chaptersEn: 'English For Today: Units 1–4; Grammar: Parts of Speech, Tense, Articles; Writing: Paragraph & Informal Letter', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-7-hy-math', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ১ (মূলদ ও অমূলদ সংখ্যা), অধ্যায় ২ (সমানুপাত ও লাভ-ক্ষতি), অধ্যায় ৪ (বীজগণিতীয় রাশির গুণ ও ভাগ), অধ্যায় ৮ (সমান্তরাল সরলরেখা)', chaptersEn: 'Ch 1 (Rational & Irrational Numbers), Ch 2 (Proportion & Profit-Loss), Ch 4 (Algebraic Multiplication/Division), Ch 8 (Parallel Lines)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-7-hy-sci', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-sci', chaptersBn: 'অধ্যায় ১ (নিম্নশ্রেণির জীব), অধ্যায় ২ (উদ্ভিদ ও প্রাণীর কোষীয় সংগঠন), অধ্যায় ৩ (উদ্ভিদের বাহ্যিক বৈশিষ্ট্য), অধ্যায় ৪ (শ্বসন)', chaptersEn: 'Ch 1 (Lower Organisms), Ch 2 (Cellular Organization), Ch 3 (External Features of Plants), Ch 4 (Respiration)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },
    { id: 'se-7-ann-ban', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-ban', chaptersBn: 'গদ্য: পিতৃপুরুষের গল্প, ছবির রং, সেই ছেলেটি; কবিতা: শ্রাবণে, গারো পাহাড়ের নিচে, সাম্য', chaptersEn: 'Prose: Pitripurusher Golpo, Chobir Rong; Poems: Shrabone, Samyo', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-7-ann-eng', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-eng', chaptersBn: 'English For Today: Units 5–9; Grammar: Preposition, Voice Change, Punctuation; Writing: Dialogue & Short Essay', chaptersEn: 'English For Today: Units 5–9; Grammar: Prepositions, Voice, Punctuation; Writing: Dialogue & Essay', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-7-ann-math', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ৫ (বীজগণিতীয় সূত্রাবলি), অধ্যায় ৭ (সরল সমীকরণ), অধ্যায় ৯ (ত্রিভুজ), অধ্যায় ১১ (তথ্য ও উপাত্ত)', chaptersEn: 'Ch 5 (Algebraic Formulae), Ch 7 (Simple Equations), Ch 9 (Triangles), Ch 11 (Information & Data)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-7-ann-sci', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-sci', chaptersBn: 'অধ্যায় ৬ (পদার্থের গঠন), অধ্যায় ৭ (শক্তির ব্যবহার), অধ্যায় ৮ (শব্দের কথা), অধ্যায় ৯ (তাপ ও তাপমাত্রা)', chaptersEn: 'Ch 6 (Structure of Matter), Ch 7 (Use of Energy), Ch 8 (Sound), Ch 9 (Heat & Temperature)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },

    // Class 6 — Half-Yearly & Annual
    { id: 'se-6-hy-ban', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-ban', chaptersBn: 'চারুপাঠ: সততার পুরস্কার, মিনু, নীলনদ আর পিরামিডের দেশ; কবিতা: জন্মভূমি, সুখ, মানুষ জাতি', chaptersEn: 'Charupath: Shototar Puroshkar, Minu, Nilnod ar Pyramider Desh; Poems: Jonmobhumi, Shukh, Manush Jati', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-6-hy-eng', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-eng', chaptersBn: 'English For Today: Lessons 1–12; Grammar: Sentence, Parts of Speech, Number, Gender, Articles; Writing: Paragraph', chaptersEn: 'English For Today: Lessons 1–12; Grammar: Sentence, Parts of Speech, Number, Gender, Articles; Writing: Paragraph', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-6-hy-math', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ১ (স্বাভাবিক সংখ্যা ও ভগ্নাংশ), অধ্যায় ২ (অনুপাত ও শতকরা), অধ্যায় ৩ (পূর্ণসংখ্যা), অধ্যায় ৬ (জ্যামিতির মৌলিক ধারণা)', chaptersEn: 'Ch 1 (Whole Numbers & Fractions), Ch 2 (Ratio & Percentage), Ch 3 (Integers), Ch 6 (Basic Geometry)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-6-hy-sci', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-sci', chaptersBn: 'অধ্যায় ১ (বৈজ্ঞানিক প্রক্রিয়া ও পরিমাপ), অধ্যায় ২ (জীবজগৎ), অধ্যায় ৩ (উদ্ভিদ ও প্রাণীর কোষীয় সংগঠন)', chaptersEn: 'Ch 1 (Scientific Process & Measurement), Ch 2 (Living World), Ch 3 (Cell Organization)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },
    { id: 'se-6-hy-ict', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-ict', chaptersBn: 'অধ্যায় ১ (তথ্য ও যোগাযোগ প্রযুক্তি পরিচিতি), অধ্যায় ২ (তথ্য ও যোগাযোগ প্রযুক্তি সংশ্লিষ্ট যন্ত্রপাতি)', chaptersEn: 'Ch 1 (Intro to ICT), Ch 2 (ICT Devices & Hardware)', marksBreakdownBn: 'মোট ৫০ (লিখিত ২৫ + বহুনির্বাচনি ২৫)', marksBreakdownEn: 'Total 50 (Written 25 + MCQ 25)', displayOrder: 5 },
    { id: 'se-6-ann-ban', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-ban', chaptersBn: 'গদ্য: আকাশ, কত দিকে কত কারিগর, অমর একুশে; কবিতা: মুজিব, বাঁচতে দাও, আসমানি; ব্যাকরণ ও রচনা', chaptersEn: 'Prose: Akash, Koto Dike Koto Karigor, Omor Ekushe; Poems: Mujib, Bachte Dao, Asmani', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-6-ann-eng', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-eng', chaptersBn: 'English For Today: Lessons 13–28; Grammar: Tense, Preposition, Punctuation; Writing: Application & Composition', chaptersEn: 'English For Today: Lessons 13–28; Grammar: Tense, Preposition, Punctuation; Writing: Application & Essay', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-6-ann-math', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ৪ (বীজগণিতীয় রাশি), অধ্যায় ৫ (সরল সমীকরণ), অধ্যায় ৭ (ব্যবহারিক জ্যামিতি), অধ্যায় ৮ (তথ্য ও উপাত্ত)', chaptersEn: 'Ch 4 (Algebraic Expressions), Ch 5 (Simple Equations), Ch 7 (Practical Geometry), Ch 8 (Data & Statistics)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-6-ann-sci', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-sci', chaptersBn: 'অধ্যায় ৬ (সংবেদী অঙ্গ), অধ্যায় ৭ (পদার্থের বৈশিষ্ট্য), অধ্যায় ৯ (আলোর ঘটনা), অধ্যায় ১০ (গতি)', chaptersEn: 'Ch 6 (Sensory Organs), Ch 7 (Properties of Matter), Ch 9 (Light Phenomena), Ch 10 (Motion)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },
    { id: 'se-6-ann-ict', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-ict', chaptersBn: 'অধ্যায় ৩ (তথ্য ও যোগাযোগ প্রযুক্তির নিরাপদ ব্যবহার), অধ্যায় ৪ (ওয়ার্ড প্রসেসিং), অধ্যায় ৫ (ইন্টারনেট পরিচিতি)', chaptersEn: 'Ch 3 (Safe Use of ICT), Ch 4 (Word Processing), Ch 5 (Intro to Internet)', marksBreakdownBn: 'মোট ৫০ (লিখিত ২৫ + বহুনির্বাচনি ২৫)', marksBreakdownEn: 'Total 50 (Written 25 + MCQ 25)', displayOrder: 5 },
  ];

  const academicEvents: AcademicEvent[] = [
    { id: 'aev-1', academicYearId: 'ay-2026', title: 'নতুন শিক্ষাবর্ষ ও পাঠ্যপুস্তক উৎসব ২০২৬', description: 'ষষ্ঠ থেকে দশম শ্রেণির সকল শিক্ষার্থীর মাঝে বিনামূল্যে সরকারি পাঠ্যবই বিতরণ।', eventType: AcademicEventType.EVENT, startDate: '2026-01-01', endDate: '2026-01-01' },
    { id: 'aev-2', academicYearId: 'ay-2026', title: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস', description: 'প্রভাতফেরি, শহীদ মিনারে পুষ্পস্তবক অর্পণ, আলোচনা সভা ও রচনা প্রতিযোগিতা।', eventType: AcademicEventType.HOLIDAY, startDate: '2026-02-21', endDate: '2026-02-21' },
    { id: 'aev-6', academicYearId: 'ay-2026', title: 'মহান স্বাধীনতা ও জাতীয় দিবস উদযাপন', description: 'জাতীয় পতাকা উত্তোলন, কুচকাওয়াজ ও মুক্তিযুদ্ধভিত্তিক সাংস্কৃতিক অনুষ্ঠান।', eventType: AcademicEventType.HOLIDAY, startDate: '2026-03-26', endDate: '2026-03-26' },
    { id: 'aev-7', academicYearId: 'ay-2026', title: 'বাংলা নববর্ষ ১৪৩৩ উদযাপন', description: 'বিদ্যালয় প্রাঙ্গণে বৈশাখী সাংস্কৃতিক অনুষ্ঠান ও সরকারি ছুটি।', eventType: AcademicEventType.HOLIDAY, startDate: '2026-04-14', endDate: '2026-04-14' },
    { id: 'aev-8', academicYearId: 'ay-2026', title: 'গ্রীষ্মকালীন অবকাশ ও ঈদ-উল-আযহা ছুটি', description: 'শিক্ষা মন্ত্রণালয়ের বাৎসরিক ছুটির তালিকা অনুযায়ী গ্রীষ্মকালীন অবকাশ।', eventType: AcademicEventType.HOLIDAY, startDate: '2026-05-18', endDate: '2026-06-04' },
    { id: 'aev-3', academicYearId: 'ay-2026', title: 'অর্ধবার্ষিক পরীক্ষা ২০২৬', description: 'ষষ্ঠ থেকে দশম শ্রেণির অর্ধবার্ষিক মূল্যায়ন ও ব্যবহারিক পরীক্ষা।', eventType: AcademicEventType.EVENT, startDate: '2026-06-15', endDate: '2026-06-30' },
    { id: 'aev-9', academicYearId: 'ay-2026', title: 'অর্ধবার্ষিক ফলাফল প্রকাশ ও অভিভাবক সমাবেশ', description: 'অনলাইনে ফলাফল প্রকাশ ও শ্রেণিশিক্ষকদের সাথে অভিভাবক মতবিনিময়।', eventType: AcademicEventType.EVENT, startDate: '2026-07-15', endDate: '2026-07-15' },
    { id: 'aev-5', academicYearId: 'ay-2026', title: '২০২৭ শিক্ষাবর্ষের ভর্তি আবেদন গ্রহণ', description: '৬ষ্ঠ থেকে ৯ম শ্রেণিতে অনলাইন ও সরাসরি ভর্তি ফরম সংগ্রহ ও জমা।', eventType: AcademicEventType.ADMISSION, startDate: '2026-11-15', endDate: '2026-12-20' },
    { id: 'aev-4', academicYearId: 'ay-2026', title: 'বার্ষিক পরীক্ষা ২০২৬', description: 'সকল শ্রেণির বার্ষিক সমাপনী ও ১০ম শ্রেণির নির্বাচনি পরীক্ষা।', eventType: AcademicEventType.EVENT, startDate: '2026-11-22', endDate: '2026-12-08' },
    { id: 'aev-10', academicYearId: 'ay-2026', title: 'মহান বিজয় দিবস উদযাপন', description: 'বিজয় র‍্যালি, আলোচনা সভা ও ক্রীড়া প্রতিযোগিতা।', eventType: AcademicEventType.HOLIDAY, startDate: '2026-12-16', endDate: '2026-12-16' },
    { id: 'aev-11', academicYearId: 'ay-2026', title: 'বার্ষিক পরীক্ষার ফলাফল প্রকাশ ও পুরস্কার বিতরণী', description: 'মেধাবী ও নিয়মিত উপস্থিত শিক্ষার্থীদের সম্মাননা ও মার্কশিট বিতরণ।', eventType: AcademicEventType.EVENT, startDate: '2026-12-28', endDate: '2026-12-28' },
  ];

  // 7. Attendance (14 recent school days) + SMS Logs + Configurable Class Attendance Methods
  const classAttendanceConfigs: ClassAttendanceMethodConfig[] = classes.map((c) => ({
    classId: c.id,
    method: c.numericValue === 10 ? AttendanceMethod.RFID : AttendanceMethod.MANUAL,
    autoSmsOnEntry: c.numericValue === 10,
    autoSmsOnExit: c.numericValue === 10,
    autoSmsOnAbsent: true,
    lateThresholdTime: '10:15',
  }));

  const attendances: Attendance[] = [];
  const attendanceSmsLogs: AttendanceSmsLog[] = [];
  const schoolDates = [
    '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05',
    '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12',
    '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19',
  ];

  schoolDates.forEach((dateStr, dIdx) => {
    enrollments.forEach((enr, eIdx) => {
      const isClass10 = enr.classId === 'cls-10';
      const mod = (dIdx * 7 + eIdx * 3) % 19;
      let status = AttendanceStatus.PRESENT;
      if (mod === 0) status = AttendanceStatus.ABSENT;
      else if (mod === 1) status = AttendanceStatus.LATE;
      else if (mod === 2 && eIdx % 4 === 0) status = AttendanceStatus.LEAVE;

      const attId = `att-${dateStr}-${enr.id}`;
      attendances.push({
        id: attId,
        studentEnrollmentId: enr.id,
        date: dateStr,
        inTime: status === AttendanceStatus.PRESENT ? `${dateStr}T09:52:00` : status === AttendanceStatus.LATE ? `${dateStr}T10:24:00` : null,
        outTime: status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE ? `${dateStr}T15:30:00` : null,
        status,
        method: isClass10 ? AttendanceMethod.RFID : AttendanceMethod.MANUAL,
        markedBy: isClass10 ? null : 'user-teacher-1',
        createdAt: `${dateStr}T10:30:00.000Z`,
        updatedAt: `${dateStr}T10:30:00.000Z`,
      });

      if (dIdx >= schoolDates.length - 3) {
        const ps = parentStudents.find((x) => x.studentId === enr.studentId && x.isSmsReceiver);
        const parent = ps ? parents.find((p) => p.id === ps.parentId) : null;
        const student = students.find((s) => s.id === enr.studentId);
        if (parent && student && (status === AttendanceStatus.ABSENT || (isClass10 && status === AttendanceStatus.PRESENT))) {
          const smsType = status === AttendanceStatus.ABSENT ? AttendanceSmsType.ABSENT : AttendanceSmsType.ENTRY;
          const smsStatus = (dIdx + eIdx) % 7 === 0 ? SmsStatus.FAILED : SmsStatus.SENT;
          attendanceSmsLogs.push({
            id: `sms-${attId}`,
            attendanceId: attId,
            parentId: parent.id,
            smsType,
            phone: parent.phone,
            message:
              smsType === AttendanceSmsType.ABSENT
                ? `প্রিয় অভিভাবক, আপনার সন্তান ${student.nameBn} আজ (${dateStr}) বিদ্যালয়ে অনুপস্থিত। - ভোজেশ্বর উচ্চ বিদ্যালয়`
                : `প্রিয় অভিভাবক, আপনার সন্তান ${student.nameBn} সকাল ০৯:৫২ মিনিটে RFID কার্ডের মাধ্যমে বিদ্যালয়ে প্রবেশ করেছে।`,
            status: smsStatus,
            sentAt: smsStatus === SmsStatus.SENT ? `${dateStr}T10:35:00.000Z` : null,
            createdAt: `${dateStr}T10:34:00.000Z`,
          });
        }
      }
    });
  });

  const rfidScans: RfidScanEvent[] = [
    { id: 'scan-1', cardNumber: 'RFID-10-8841', studentId: 'stu-10-1', studentName: 'তানভীর আহমেদ', className: '১০ম শ্রেণি (ক)', scannedAt: '2026-11-19T09:48:12.000Z', deviceLocation: 'Main Gate Reader #1', direction: 'ENTRY', isKnownCard: true },
    { id: 'scan-2', cardNumber: 'RFID-10-8842', studentId: 'stu-10-2', studentName: 'নুসরাত জাহান মিম', className: '১০ম শ্রেণি (ক)', scannedAt: '2026-11-19T09:50:44.000Z', deviceLocation: 'Main Gate Reader #1', direction: 'ENTRY', isKnownCard: true },
    { id: 'scan-3', cardNumber: 'RFID-10-8843', studentId: 'stu-10-3', studentName: 'প্রান্ত চন্দ্র দাস', className: '১০ম শ্রেণি (ক)', scannedAt: '2026-11-19T09:53:09.000Z', deviceLocation: 'Main Gate Reader #1', direction: 'ENTRY', isKnownCard: true },
    { id: 'scan-4', cardNumber: 'RFID-UNK-9902', studentId: null, studentName: null, className: null, scannedAt: '2026-11-19T09:55:21.000Z', deviceLocation: 'Main Gate Reader #1', direction: 'ENTRY', isKnownCard: false },
  ];

  // 8. Grading Scale & Grade Ranges (Configurable NCTB Secondary 5.00 scale)
  const gradingScales: GradingScale[] = [
    {
      id: 'gs-nctb-5',
      name: 'NCTB Secondary Grading Scale (5.00)',
      description: 'বাংলাদেশ মাধ্যমিক শিক্ষা বোর্ড অনুসৃত ৫.০০ স্কেল (বিদ্যালয় নীতিমালা অনুযায়ী পরিবর্তনযোগ্য)',
      maxGpa: 5.0,
      isDefault: true,
      isSystemDefault: true,
      isActive: true,
      isDeleted: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const gradeRanges: GradeRange[] = [
    { id: 'gr-1', gradingScaleId: 'gs-nctb-5', minPercentage: 80, maxPercentage: 100, letterGrade: 'A+', gradePoint: 5.0, remarks: 'অসাধারণ / Outstanding', isFailGrade: false, displayOrder: 1, isDeleted: false },
    { id: 'gr-2', gradingScaleId: 'gs-nctb-5', minPercentage: 70, maxPercentage: 79.99, letterGrade: 'A', gradePoint: 4.0, remarks: 'অতি উত্তম / Excellent', isFailGrade: false, displayOrder: 2, isDeleted: false },
    { id: 'gr-3', gradingScaleId: 'gs-nctb-5', minPercentage: 60, maxPercentage: 69.99, letterGrade: 'A-', gradePoint: 3.5, remarks: 'উত্তম / Very Good', isFailGrade: false, displayOrder: 3, isDeleted: false },
    { id: 'gr-4', gradingScaleId: 'gs-nctb-5', minPercentage: 50, maxPercentage: 59.99, letterGrade: 'B', gradePoint: 3.0, remarks: 'ভালো / Good', isFailGrade: false, displayOrder: 4, isDeleted: false },
    { id: 'gr-5', gradingScaleId: 'gs-nctb-5', minPercentage: 40, maxPercentage: 49.99, letterGrade: 'C', gradePoint: 2.0, remarks: 'সন্তোষজনক / Satisfactory', isFailGrade: false, displayOrder: 5, isDeleted: false },
    { id: 'gr-6', gradingScaleId: 'gs-nctb-5', minPercentage: 33, maxPercentage: 39.99, letterGrade: 'D', gradePoint: 1.0, remarks: 'গ্রহণযোগ্য / Pass', isFailGrade: false, displayOrder: 6, isDeleted: false },
    { id: 'gr-7', gradingScaleId: 'gs-nctb-5', minPercentage: 0, maxPercentage: 32.99, letterGrade: 'F', gradePoint: 0.0, remarks: 'অকৃতকার্য / Fail', isFailGrade: true, displayOrder: 7, isDeleted: false },
  ];

  // 9. Exams:
  // - exam-hy-10: Half-Yearly 2026 Class 10 (PUBLISHED - searchable on public /results!)
  // - exam-hy-9: Half-Yearly 2026 Class 9 (PUBLISHED)
  // - exam-ann-10: Annual 2026 Class 10 (ONGOING / DRAFT - live marks entry -> lock -> process -> publish flow!)
  // - exam-sel-10: Selection Exam 2026 Class 10 (WITHHELD - demonstrates withheld protection on public search!)
  // - exam-cons-10: Consolidated 2026 Class 10 (DRAFT)
  const exams: Exam[] = [
    {
      id: 'exam-hy-10',
      academicYearId: 'ay-2026',
      classId: 'cls-10',
      gradingScaleId: 'gs-nctb-5',
      name: 'অর্ধবার্ষিক পরীক্ষা ২০২৬ (১০ম শ্রেণি)',
      examType: ExamType.HALF_YEARLY,
      startDate: '2026-06-15',
      endDate: '2026-06-28',
      status: ExamStatus.COMPLETED,
      marksEntryDeadline: '2026-07-10T23:59:00.000Z',
      allowCombinedPass: true,
      weightagePercentage: 30,
      resultStatus: ResultPublicationStatus.PUBLISHED,
      publishedAt: '2026-07-15T10:00:00.000Z',
      isLocked: true,
      isDeleted: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'exam-hy-9',
      academicYearId: 'ay-2026',
      classId: 'cls-9',
      gradingScaleId: 'gs-nctb-5',
      name: 'অর্ধবার্ষিক পরীক্ষা ২০২৬ (৯ম শ্রেণি)',
      examType: ExamType.HALF_YEARLY,
      startDate: '2026-06-15',
      endDate: '2026-06-28',
      status: ExamStatus.COMPLETED,
      marksEntryDeadline: '2026-07-10T23:59:00.000Z',
      allowCombinedPass: true,
      weightagePercentage: 30,
      resultStatus: ResultPublicationStatus.PUBLISHED,
      publishedAt: '2026-07-15T10:00:00.000Z',
      isLocked: true,
      isDeleted: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'exam-ann-10',
      academicYearId: 'ay-2026',
      classId: 'cls-10',
      gradingScaleId: 'gs-nctb-5',
      name: 'বার্ষিক / নির্বাচনি প্রস্তুতি পরীক্ষা ২০২৬ (১০ম শ্রেণি)',
      examType: ExamType.ANNUAL,
      startDate: '2026-11-10',
      endDate: '2026-11-24',
      status: ExamStatus.ONGOING,
      marksEntryDeadline: '2026-12-10T23:59:00.000Z',
      allowCombinedPass: true,
      weightagePercentage: 70,
      resultStatus: ResultPublicationStatus.DRAFT,
      publishedAt: null,
      isLocked: false,
      isDeleted: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'exam-sel-10',
      academicYearId: 'ay-2026',
      classId: 'cls-10',
      gradingScaleId: 'gs-nctb-5',
      name: 'মডেল টেস্ট ২০২৬ (১০ম শ্রেণি — ফলাফল স্থগিত)',
      examType: ExamType.MODEL_TEST,
      startDate: '2026-09-10',
      endDate: '2026-09-20',
      status: ExamStatus.COMPLETED,
      marksEntryDeadline: '2026-09-28T23:59:00.000Z',
      allowCombinedPass: true,
      resultStatus: ResultPublicationStatus.WITHHELD,
      publishedAt: null,
      isLocked: true,
      isDeleted: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'exam-cons-10',
      academicYearId: 'ay-2026',
      classId: 'cls-10',
      gradingScaleId: 'gs-nctb-5',
      name: 'সমন্বিত চূড়ান্ত ফলাফল ২০২৬ (১০ম শ্রেণি)',
      examType: ExamType.CONSOLIDATED,
      startDate: '2026-12-15',
      endDate: '2026-12-20',
      status: ExamStatus.UPCOMING,
      allowCombinedPass: true,
      resultStatus: ResultPublicationStatus.DRAFT,
      isLocked: false,
      isDeleted: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const consolidatedConfigs: ConsolidatedExamConfig[] = [
    { id: 'cc-1', consolidatedExamId: 'exam-cons-10', sourceExamId: 'exam-hy-10', weightagePercentage: 30, displayOrder: 1, createdAt: NOW, updatedAt: NOW },
    { id: 'cc-2', consolidatedExamId: 'exam-cons-10', sourceExamId: 'exam-ann-10', weightagePercentage: 70, displayOrder: 2, createdAt: NOW, updatedAt: NOW },
  ];

  const makeExamSubjects = (examId: string): ExamSubject[] => [
    { id: `es-${examId}-ban`, examId, subjectId: 'sub-ban', groupId: null, fullMarks: 100, passMarks: 33, hasWritten: true, writtenFullMarks: 70, writtenPassMarks: 23, hasMcq: true, mcqFullMarks: 30, mcqPassMarks: 10, hasPractical: false, hasContinuousAssessment: false, isOptional: false, displayOrder: 1 },
    { id: `es-${examId}-eng`, examId, subjectId: 'sub-eng', groupId: null, fullMarks: 100, passMarks: 33, hasWritten: true, writtenFullMarks: 100, writtenPassMarks: 33, hasMcq: false, hasPractical: false, hasContinuousAssessment: false, isOptional: false, displayOrder: 2 },
    { id: `es-${examId}-math`, examId, subjectId: 'sub-math', groupId: null, fullMarks: 100, passMarks: 33, hasWritten: true, writtenFullMarks: 70, writtenPassMarks: 23, hasMcq: true, mcqFullMarks: 30, mcqPassMarks: 10, hasPractical: false, hasContinuousAssessment: false, isOptional: false, displayOrder: 3 },
    { id: `es-${examId}-phy`, examId, subjectId: 'sub-phy', groupId: 'grp-sci', fullMarks: 100, passMarks: 33, hasWritten: true, writtenFullMarks: 50, writtenPassMarks: 17, hasMcq: true, mcqFullMarks: 25, mcqPassMarks: 8, hasPractical: true, practicalFullMarks: 25, practicalPassMarks: 8, hasContinuousAssessment: false, isOptional: false, displayOrder: 4 },
    { id: `es-${examId}-che`, examId, subjectId: 'sub-che', groupId: 'grp-sci', fullMarks: 100, passMarks: 33, hasWritten: true, writtenFullMarks: 50, writtenPassMarks: 17, hasMcq: true, mcqFullMarks: 25, mcqPassMarks: 8, hasPractical: true, practicalFullMarks: 25, practicalPassMarks: 8, hasContinuousAssessment: false, isOptional: false, displayOrder: 5 },
    { id: `es-${examId}-ict`, examId, subjectId: 'sub-ict', groupId: null, fullMarks: 50, passMarks: 17, hasWritten: false, hasMcq: true, mcqFullMarks: 25, mcqPassMarks: 8, hasPractical: true, practicalFullMarks: 25, practicalPassMarks: 9, hasContinuousAssessment: false, isOptional: false, displayOrder: 6 },
    { id: `es-${examId}-hmath`, examId, subjectId: 'sub-hmath', groupId: 'grp-sci', fullMarks: 100, passMarks: 33, hasWritten: true, writtenFullMarks: 50, writtenPassMarks: 17, hasMcq: true, mcqFullMarks: 25, mcqPassMarks: 8, hasPractical: true, practicalFullMarks: 25, practicalPassMarks: 8, hasContinuousAssessment: false, isOptional: true, displayOrder: 7 },
  ];

  const examSubjects: ExamSubject[] = [
    ...makeExamSubjects('exam-hy-10'),
    ...makeExamSubjects('exam-hy-9'),
    ...makeExamSubjects('exam-ann-10'),
  ];

  const examRoutines: ExamRoutine[] = [
    { id: 'er-1', examId: 'exam-ann-10', examSubjectId: 'es-exam-ann-10-ban', examDate: '2026-11-22', startTime: '10:00', endTime: '13:00', roomNo: 'হল রুম ১০১', status: ExamRoutineStatus.SCHEDULED, instructions: 'পরীক্ষা শুরুর ৩০ মিনিট পূর্বে প্রবেশপত্রসহ উপস্থিত থাকতে হবে।', isDeleted: false, createdAt: NOW, updatedAt: NOW },
    { id: 'er-2', examId: 'exam-ann-10', examSubjectId: 'es-exam-ann-10-eng', examDate: '2026-11-24', startTime: '10:00', endTime: '13:00', roomNo: 'হল রুম ১০১', status: ExamRoutineStatus.SCHEDULED, instructions: 'অতিরিক্ত উত্তরপত্রে রোল নম্বর স্পষ্টভাবে লিখতে হবে।', isDeleted: false, createdAt: NOW, updatedAt: NOW },
    { id: 'er-3', examId: 'exam-ann-10', examSubjectId: 'es-exam-ann-10-math', examDate: '2026-11-26', startTime: '10:00', endTime: '13:00', roomNo: 'হল রুম ১০১', status: ExamRoutineStatus.SCHEDULED, instructions: 'সাধারণ নন-প্রোগ্রামেবল ক্যালকুলেটর অনুমোদিত।', isDeleted: false, createdAt: NOW, updatedAt: NOW },
    { id: 'er-4', examId: 'exam-ann-10', examSubjectId: 'es-exam-ann-10-phy', examDate: '2026-11-29', startTime: '10:00', endTime: '13:00', roomNo: 'বিজ্ঞান ভবন ২০১', status: ExamRoutineStatus.SCHEDULED, instructions: 'ব্যবহারিক খাতা নির্ধারিত তারিখে জমা দিতে হবে।', isDeleted: false, createdAt: NOW, updatedAt: NOW },
    { id: 'er-5', examId: 'exam-ann-10', examSubjectId: 'es-exam-ann-10-che', examDate: '2026-12-01', startTime: '10:00', endTime: '13:00', roomNo: 'বিজ্ঞান ভবন ২০১', status: ExamRoutineStatus.SCHEDULED, isDeleted: false, createdAt: NOW, updatedAt: NOW },
    { id: 'er-6', examId: 'exam-ann-10', examSubjectId: 'es-exam-ann-10-ict', examDate: '2026-12-03', startTime: '10:00', endTime: '11:30', roomNo: 'কম্পিউটার ল্যাব', status: ExamRoutineStatus.SCHEDULED, isDeleted: false, createdAt: NOW, updatedAt: NOW },
  ];

  // Generate realistic Marks & calculated Results for PUBLISHED exams + partial marks for Annual 2026
  const marks: Mark[] = [];
  const studentSubjectResults: StudentSubjectResult[] = [];
  const resultSummaries: ResultSummary[] = [];

  const scoreProfiles: Record<string, number[]> = {
    'enr-stu-10-1': [86, 84, 92, 88, 85, 46, 90], // GPA 5.00 Topper
    'enr-stu-10-2': [82, 80, 85, 79, 81, 44, 84], // GPA 5.00 (with optional bonus!)
    'enr-stu-10-3': [76, 72, 81, 74, 70, 42, 78], // GPA 4.50
    'enr-stu-10-4': [68, 65, 62, 66, 61, 38, 64], // GPA 3.75
    'enr-stu-10-5': [55, 48, 28, 52, 46, 35, 50], // FAIL in Math!
    'enr-stu-10-6': [78, 74, 68, 0, 0, 43, 0], // Humanities
    'enr-stu-10-7': [62, 58, 64, 0, 0, 39, 0], // Business
    'enr-stu-9-1': [84, 86, 89, 82, 80, 45, 86], // Class 9 Topper
    'enr-stu-9-2': [72, 68, 75, 70, 66, 40, 72],
    'enr-stu-9-3': [80, 77, 83, 78, 74, 43, 81],
    'enr-stu-9-4': [64, 60, 58, 0, 0, 37, 0],
  };

  const buildExamMarksAndResults = (examId: string, classId: string, locked: boolean, publishResults: boolean) => {
    const subs = examSubjects.filter((es) => es.examId === examId);
    const classEnrs = enrollments.filter((e) => e.classId === classId);
    const summariesForExam: ResultSummary[] = [];

    classEnrs.forEach((enr) => {
      const profile = scoreProfiles[enr.id] ?? [70, 68, 72, 66, 65, 38, 70];
      const applicableSubs = subs.filter((es) => !es.groupId || es.groupId === enr.groupId);
      const subResList: StudentSubjectResult[] = [];
      let totalFull = 0;
      let totalGot = 0;

      applicableSubs.forEach((es, idx) => {
        const subIdx = subs.findIndex((x) => x.id === es.id);
        const rawScore = Math.min(es.fullMarks, profile[subIdx] ?? 65 + (idx % 10));
        const writtenMarks = es.hasWritten
          ? Math.min(es.writtenFullMarks ?? 0, Math.round(rawScore * ((es.writtenFullMarks ?? 0) / es.fullMarks)))
          : 0;
        const mcqMarks = es.hasMcq
          ? Math.min(es.mcqFullMarks ?? 0, Math.round(rawScore * ((es.mcqFullMarks ?? 0) / es.fullMarks)))
          : 0;
        const practicalMarks = es.hasPractical
          ? Math.min(es.practicalFullMarks ?? 0, Math.max(0, rawScore - writtenMarks - mcqMarks))
          : 0;
        const total = writtenMarks + mcqMarks + practicalMarks;

        marks.push({
          id: `mk-${examId}-${enr.id}-${es.id}`,
          studentEnrollmentId: enr.id,
          examSubjectId: es.id,
          writtenMarks,
          mcqMarks,
          practicalMarks,
          continuousAssessmentMarks: 0,
          totalMarks: total,
          isAbsent: false,
          isLocked: locked,
          enteredBy: 'user-teacher-1',
          createdAt: NOW,
          updatedAt: NOW,
        });

        if (publishResults) {
          const g = resolveGradeFromScale(total, es.fullMarks, gradeRanges, false, es.passMarks);
          const bonus = es.isOptional && g.isPassed ? Math.max(0, g.gradePoint - 2.0) : 0;
          const ssr: StudentSubjectResult = {
            id: `ssr-${examId}-${enr.id}-${es.id}`,
            studentEnrollmentId: enr.id,
            examId,
            examSubjectId: es.id,
            totalMarks: total,
            letterGrade: g.letterGrade,
            gradePoint: g.gradePoint,
            isPassed: g.isPassed,
            isOptional: es.isOptional,
            bonusGradePoint: bonus,
            isAbsent: false,
            calculatedAt: NOW,
          };
          studentSubjectResults.push(ssr);
          subResList.push(ssr);
          totalFull += es.fullMarks;
          totalGot += total;
        }
      });

      if (publishResults && subResList.length > 0) {
        const overall = calculateOverallGpa(
          subResList.map((r) => ({
            gradePoint: r.gradePoint ?? 0,
            isPassed: r.isPassed,
            isOptional: r.isOptional,
          })),
          gradingScales[0],
          gradeRanges
        );

        summariesForExam.push({
          id: `res-${examId}-${enr.id}`,
          studentEnrollmentId: enr.id,
          examId,
          totalFullMarks: totalFull,
          totalMarks: totalGot,
          gpa: overall.gpa,
          gpaWithoutOptional: overall.gpaWithoutOptional,
          letterGrade: overall.letterGrade,
          meritPosition: null,
          sectionMeritPosition: null,
          failedSubjectCount: overall.failedSubjectCount,
          resultStatus: overall.isPassed ? ResultStatus.PASS : ResultStatus.FAIL,
          publishedAt: '2026-07-15T10:00:00.000Z',
          createdAt: NOW,
          updatedAt: NOW,
        });
      }
    });

    // Rank merit positions among PASS students
    const passed = summariesForExam
      .filter((s) => s.resultStatus === ResultStatus.PASS)
      .sort((a, b) => (b.gpa ?? 0) - (a.gpa ?? 0) || b.totalMarks - a.totalMarks);
    passed.forEach((s, idx) => {
      s.meritPosition = idx + 1;
    });

    // Section merit position
    const bySec = new Map<string, ResultSummary[]>();
    passed.forEach((s) => {
      const enr = enrollments.find((e) => e.id === s.studentEnrollmentId);
      if (!enr) return;
      const arr = bySec.get(enr.sectionId) ?? [];
      arr.push(s);
      bySec.set(enr.sectionId, arr);
    });
    bySec.forEach((arr) => {
      arr.forEach((s, idx) => {
        s.sectionMeritPosition = idx + 1;
      });
    });

    resultSummaries.push(...summariesForExam);
  };

  buildExamMarksAndResults('exam-hy-10', 'cls-10', true, true);
  buildExamMarksAndResults('exam-hy-9', 'cls-9', true, true);
  // Seed draft marks for Annual 2026 Class 10 so teachers/admin can edit, lock, process & publish live!
  buildExamMarksAndResults('exam-ann-10', 'cls-10', false, false);

  // 10. Library & Digital Education
  const libraryProfile: LibraryProfile = {
    id: 'lib-1',
    title: 'ভোজেশ্বর উচ্চ বিদ্যালয় কেন্দ্রীয় গ্রন্থাগার',
    description:
      'শিক্ষার্থীদের পাঠাভ্যাস গড়ে তুলতে গ্রন্থাগারে রয়েছে সাহিত্য, মুক্তিযুদ্ধ, বিজ্ঞান, বিশ্বকোষ ও এনসিটিবি সহায়ক বইয়ের সমৃদ্ধ সংগ্রহ। বিদ্যালয় চলাকালীন সকাল ১০:৩০ থেকে বিকাল ৩:৩০ পর্যন্ত পাঠকক্ষ উন্মুক্ত থাকে।',
    updatedAt: NOW,
  };

  const libraryBooks: LibraryBook[] = [
    { id: 'lb-1', title: 'অসমাপ্ত আত্মজীবনী', author: 'বঙ্গবন্ধু শেখ মুজিবুর রহমান', publisher: 'ইউনিভার্সিটি প্রেস লিমিটেড', category: 'ইতিহাস ও জীবনী', description: 'বাংলাদেশের ইতিহাসের অমূল্য দলিল।', createdAt: NOW, updatedAt: NOW },
    { id: 'lb-2', title: 'বিজ্ঞান ও আমাদের পৃথিবী', author: 'ড. মুহম্মদ জাফর ইকবাল', publisher: 'তাম্রলিপি', category: 'বিজ্ঞান', description: 'মাধ্যমিক শিক্ষার্থীদের জন্য সহজবোধ্য বিজ্ঞান গ্রন্থ।', createdAt: NOW, updatedAt: NOW },
    { id: 'lb-3', title: 'সঞ্চিতা', author: 'কাজী নজরুল ইসলাম', publisher: 'বাংলা একাডেমি', category: 'সাহিত্য', description: 'জাতীয় কবির নির্বাচিত কবিতা সংকলন।', createdAt: NOW, updatedAt: NOW },
    { id: 'lb-4', title: 'অঙ্ক ভাইয়া', author: 'চমক হাসান', publisher: 'আদর্শ', category: 'গণিত', description: 'আনন্দে গণিত শেখার সহায়ক বই।', createdAt: NOW, updatedAt: NOW },
    { id: 'lb-5', title: 'গল্পগুচ্ছ', author: 'রবীন্দ্রনাথ ঠাকুর', publisher: 'বিশ্বভারতী', category: 'সাহিত্য', description: 'বিশ্বকবির কালজয়ী ছোটগল্প সমগ্র।', createdAt: NOW, updatedAt: NOW },
    { id: 'lb-6', title: 'Oxford Advanced Learner’s Dictionary', author: 'A. S. Hornby', publisher: 'Oxford University Press', category: 'রেফারেন্স', description: 'ইংরেজি ভাষা চর্চার প্রামাণ্য অভিধান।', createdAt: NOW, updatedAt: NOW },
    { id: 'lb-7', title: 'লালসালু', author: 'সৈয়দ ওয়ালীউল্লাহ', publisher: 'নওরোজ কিতাবিস্তান', category: 'সাহিত্য', description: 'বাংলা কথাসাহিত্যের অন্যতম কালজয়ী উপন্যাস।', createdAt: NOW, updatedAt: NOW },
    { id: 'lb-8', title: 'মুক্তিযুদ্ধের ইতিহাস', author: 'ড. মুহম্মদ জাফর ইকবাল', publisher: 'প্রতীতি', category: 'ইতিহাস ও জীবনী', description: 'শিক্ষার্থীদের জন্য ১৯৭১ সালের মহান মুক্তিযুদ্ধের সংক্ষিপ্ত প্রামাণ্য ইতিহাস।', createdAt: NOW, updatedAt: NOW },
    { id: 'lb-9', title: 'মাধ্যমিক ব্যবহারিক বিজ্ঞান নির্দেশিকা', author: 'ড. শাহজাহান তপন', publisher: 'হাসান বুক হাউস', category: 'বিজ্ঞান', description: 'পদার্থ ও রসায়ন ব্যবহারিক পরীক্ষার সহায়ক গ্রন্থ।', createdAt: NOW, updatedAt: NOW },
  ];

  const libraryDistributions: LibraryDistributionInfo[] = [
    { id: 'ld-1', type: LibraryDistributionType.TEXTBOOK_DISTRIBUTION, title: 'বিনামূল্যে পাঠ্যপুস্তক বিতরণ উৎসব ২০২৬', description: 'ষষ্ঠ থেকে দশম শ্রেণির সকল শিক্ষার্থীর মাঝে নতুন বছরের পাঠ্যবই বিতরণ সম্পন্ন হয়েছে।', distributionDate: '2026-01-01', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ld-2', type: LibraryDistributionType.BOOK_DISTRIBUTION, title: 'বইপড়া কর্মসূচি ও সহায়ক গ্রন্থ বিতরণ', description: 'বিশ্বসাহিত্য কেন্দ্রের সহযোগিতায় ষষ্ঠ থেকে নবম শ্রেণির পাঠকদের মাঝে গল্পের বই বিতরণ।', distributionDate: '2026-03-10', isPublished: true, createdAt: NOW, updatedAt: NOW },
  ];

  const digitalClassrooms: DigitalClassroom[] = [
    { id: 'dc-1', name: 'মাল্টিমিডিয়া স্মার্ট ক্লাসরুম – ০১', description: 'ইন্টারেক্টিভ প্রজেক্টর, সাউন্ড সিস্টেম ও ডিজিটাল হোয়াইটবোর্ড সমৃদ্ধ কক্ষ।', location: 'নতুন একাডেমিক ভবন, ২য় তলা', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'dc-2', name: 'আইসিটি ও কম্পিউটার ল্যাব', description: '২০টি আধুনিক ডেস্কটপ কম্পিউটার এবং ব্রডব্যান্ড ইন্টারনেট সংযোগ।', location: 'বিজ্ঞান ভবন, নিচতলা', isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  const digitalResources: DigitalResource[] = [
    { id: 'dr-1', academicYearId: 'ay-2026', title: 'ত্রিকোণমিতিক অনুপাত — অধ্যায় ৯ (স্মার্ট ক্লাস লেকচার)', description: 'নবম ও দশম শ্রেণির গণিতের ত্রিকোণমিতি অধ্যায়ের ধাপে ধাপে অনুশীলন।', resourceType: ResourceType.SMART_CLASS_VIDEO, subjectId: 'sub-math', classId: 'cls-10', url: 'https://teachers.gov.bd', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'dr-2', academicYearId: 'ay-2026', title: 'গতি ও বল — পদার্থবিজ্ঞান মাল্টিমিডিয়া স্লাইড', description: 'নিউটনের গতিসূত্র ও গাণিতিক সমস্যার সমাধান।', resourceType: ResourceType.MULTIMEDIA_CONTENT, subjectId: 'sub-phy', classId: 'cls-10', url: 'https://muktopaath.gov.bd', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'dr-3', academicYearId: 'ay-2026', title: 'English Grammar: Completing Sentences & Connectors', description: 'Interactive worksheet and recorded revision lecture for Class 9–10.', resourceType: ResourceType.EDUCATIONAL_VIDEO, subjectId: 'sub-eng', classId: 'cls-9', url: 'https://teachers.gov.bd', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'dr-4', academicYearId: 'ay-2026', title: 'ষষ্ঠ শ্রেণি — সংখ্যা ও ভগ্নাংশের খেলা', description: 'নতুন শিক্ষাক্রমভিত্তিক প্রাথমিক গণিত অনুশীলনী।', resourceType: ResourceType.ONLINE_CLASS_LINK, subjectId: 'sub-math', classId: 'cls-6', url: 'https://teachers.gov.bd', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'dr-5', academicYearId: 'ay-2026', title: 'সপ্তম শ্রেণি — উদ্ভিদ ও প্রাণীর কোষীয় সংগঠন', description: 'চিত্রসহ জীবকোষ পরিচিতি ও অনুশীলনীমূলক মাল্টিমিডিয়া প্রেজেন্টেশন।', resourceType: ResourceType.MULTIMEDIA_CONTENT, subjectId: 'sub-sci', classId: 'cls-7', url: 'https://teachers.gov.bd', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'dr-6', academicYearId: 'ay-2026', title: 'অষ্টম শ্রেণি — স্প্রেডশিট বিশ্লেষণ ও ডেটাবেস পরিচিতি', description: 'আইসিটি ল্যাব অনুশীলনের জন্য ধাপে ধাপে ভিডিও টিউটোরিয়াল।', resourceType: ResourceType.SMART_CLASS_VIDEO, subjectId: 'sub-ict', classId: 'cls-8', url: 'https://muktopaath.gov.bd', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'dr-7', academicYearId: 'ay-2026', title: 'হিসাববিজ্ঞান — জাবেদা ও খতিয়ান প্রস্তুত প্রণালি', description: 'ব্যবসায় শিক্ষা বিভাগের ৯ম-১০ম শ্রেণির শিক্ষার্থীদের জন্য অনুশীলন লেকচার।', resourceType: ResourceType.EDUCATIONAL_VIDEO, subjectId: 'sub-acc', classId: 'cls-9', url: 'https://teachers.gov.bd', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'dr-8', academicYearId: 'ay-2026', title: 'জীববিজ্ঞান — কোষ বিভাজন ও বংশগতি (অনলাইন ক্লাস)', description: 'চিত্রভিত্তিক ব্যাখ্যা ও সৃজনশীল প্রশ্নোত্তর আলোচনা।', resourceType: ResourceType.ONLINE_CLASS_LINK, subjectId: 'sub-bio', classId: 'cls-10', url: 'https://teachers.gov.bd', isPublished: true, createdAt: NOW, updatedAt: NOW },
  ];

  // 11. Notices, News, Events, Careers
  const notices: Notice[] = [
    {
      id: 'not-1',
      memoNo: 'ভউবি/পরীক্ষা/২০২৬/০৮৪',
      title: 'বার্ষিক পরীক্ষা ২০২৬ এর সময়সূচি ও প্রবেশপত্র বিতরণ সংক্রান্ত জরুরি বিজ্ঞপ্তি',
      description:
        'ভোজেশ্বর উচ্চ বিদ্যালয়ের ৬ষ্ঠ থেকে ১০ম শ্রেণির সকল শিক্ষার্থী ও সম্মানিত অভিভাবকদের অবগতির জন্য জানানো যাচ্ছে যে, আগামী ২২ নভেম্বর ২০২৬ (রবিবার) থেকে বার্ষিক পরীক্ষা ২০২৬ শুরু হবে।\n\n• প্রবেশপত্র সংগ্রহের তারিখ: ১৭–২০ নভেম্বর ২০২৬ (সকাল ১০:০০ – দুপুর ২:০০ ঘটিকা)।\n• পরীক্ষার প্রথম দিন নির্ধারিত স্কুল ইউনিফর্ম ও বৈধ প্রবেশপত্র ছাড়া পরীক্ষার হলে প্রবেশ করা যাবে না।\n• বকেয়া টিউশন ফি ও পরীক্ষার ফি অফিস কক্ষে পরিশোধ করে রসিদ দেখিয়ে প্রবেশপত্র সংগ্রহ করতে হবে।',
      attachment: 'BHS-Annual-Exam-Routine-2026.pdf',
      attachmentType: 'PDF',
      attachmentSize: '428 KB',
      publishedAt: '2026-11-16T09:00:00.000Z',
      status: NoticeStatus.PUBLISHED,
      createdBy: 'user-principal',
      isUrgent: true,
      audience: 'ALL',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'not-2',
      memoNo: 'ভউবি/ভর্তি/২০২৬/০৮১',
      title: '২০২৭ শিক্ষাবর্ষে ৬ষ্ঠ থেকে ৯ম শ্রেণিতে ভর্তি বিজ্ঞপ্তি ও আবেদন নির্দেশিকা',
      description:
        'ভোজেশ্বর উচ্চ বিদ্যালয়ে ২০২৭ শিক্ষাবর্ষে ৬ষ্ঠ থেকে ৯ম শ্রেণিতে (বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা শাখা) অনলাইন ও সরাসরি ভর্তি আবেদন গ্রহণ শুরু হয়েছে।\n\n• আবেদনের শেষ তারিখ: ১৫ ডিসেম্বর ২০২৬।\n• প্রয়োজনীয় কাগজপত্র: শিক্ষার্থীর ১৭ ডিজিটের অনলাইন জন্ম সনদ, ২ কপি পাসপোর্ট সাইজের রঙিন ছবি, পিতা-মাতার এনআইডি ফটোকপি এবং পূর্ববর্তী শ্রেণির প্রত্যয়নপত্র।\n• অনলাইনে আবেদনের পর ট্র্যাকিং নম্বর সংরক্ষণ করে ভর্তি পরীক্ষার প্রবেশপত্র ডাউনলোড করতে হবে।',
      attachment: 'BHS-Admission-Circular-2027.pdf',
      attachmentType: 'PDF',
      attachmentSize: '512 KB',
      publishedAt: '2026-11-14T10:30:00.000Z',
      status: NoticeStatus.PUBLISHED,
      createdBy: 'user-admin',
      isUrgent: false,
      audience: 'ALL',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'not-3',
      memoNo: 'ভউবি/প্রশাসন/২০২৬/০৭৮',
      title: 'দশম শ্রেণির (এসএসসি ব্যাচ) RFID ডিজিটাল হাজিরা কার্ড ব্যবহারের বাধ্যতামূলক নির্দেশিকা',
      description:
        'দশম শ্রেণির (এসএসসি পরীক্ষার্থী) সকল শিক্ষার্থীকে জানানো যাচ্ছে যে, আগামী রবিবার থেকে বিদ্যালয়ে প্রবেশ ও প্রস্থানের সময় প্রধান ফটকে স্থাপিত ডিজিটাল RFID স্ক্যানারে নিজ নিজ আইডি কার্ড পাঞ্চ করা বাধ্যতামূলক।\n\n• কার্ড পাঞ্চ করার সাথে সাথে অভিভাবকের নিবন্ধিত মোবাইল নম্বরে স্বয়ংক্রিয়ভাবে এসএমএস পৌঁছে যাবে।\n• কোনো শিক্ষার্থীর আইডি কার্ড হারিয়ে গেলে অফিস কক্ষে আবেদন করে নতুন কার্ড সংগ্রহ করতে হবে।',
      attachment: 'BHS-RFID-Notice-Scanned-Copy.jpg',
      attachmentType: 'IMAGE',
      attachmentSize: '860 KB',
      publishedAt: '2026-11-10T08:00:00.000Z',
      status: NoticeStatus.PUBLISHED,
      createdBy: 'user-admin',
      isUrgent: false,
      audience: 'PARENTS',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'not-4',
      memoNo: 'ভউবি/একাডেমিক/২০২৬/০৭৪',
      title: 'অভিভাবক সমাবেশ ও অর্ধবার্ষিক পরীক্ষার ফলাফল পর্যালোচনা সভা',
      description:
        'নবম ও দশম শ্রেণির সম্মানিত অভিভাবকদের জানানো যাচ্ছে যে, শিক্ষার্থীদের একাডেমিক অগ্রগতি ও নির্বাচনি পরীক্ষার প্রস্তুতি পর্যালোচনার লক্ষ্যে আগামী শনিবার সকাল ১০:৩০ ঘটিকায় বিদ্যালয় মিলনায়তনে এক অভিভাবক সমাবেশ অনুষ্ঠিত হবে।\n\nউক্ত সভায় আপনার সদয় উপস্থিতি একান্তভাবে কামনা করছি।',
      attachment: 'BHS-Guardian-Meeting-Notice.jpg',
      attachmentType: 'IMAGE',
      attachmentSize: '640 KB',
      publishedAt: '2026-11-05T11:00:00.000Z',
      status: NoticeStatus.PUBLISHED,
      createdBy: 'user-principal',
      isUrgent: false,
      audience: 'PARENTS',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'not-6',
      memoNo: 'ভউবি/সাধারণ/২০২৬/০৭০',
      title: 'মহান বিজয় দিবস ও বার্ষিক ক্রীড়া প্রতিযোগিতার প্রস্তুতি সংক্রান্ত বিজ্ঞপ্তি',
      description:
        'আগামী ১৬ ডিসেম্বর মহান বিজয় দিবস যথাযোগ্য মর্যাদায় উদযাপন উপলক্ষে চিত্রাঙ্কন, রচনা, দেশাত্মবোধক সংগীত ও কুচকাওয়াজ প্রতিযোগিতার আয়োজন করা হয়েছে। আগ্রহী শিক্ষার্থীদের নিজ নিজ শ্রেণি শিক্ষকের নিকট আগামী ১০ ডিসেম্বরের মধ্যে নাম নিবন্ধন করার জন্য নির্দেশ দেওয়া হলো।',
      attachment: 'BHS-Victory-Day-Circular-2026.pdf',
      attachmentType: 'PDF',
      attachmentSize: '295 KB',
      publishedAt: '2026-11-02T09:30:00.000Z',
      status: NoticeStatus.PUBLISHED,
      createdBy: 'user-principal',
      isUrgent: false,
      audience: 'ALL',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'not-5',
      memoNo: 'ভউবি/অভ্যন্তরীণ/২০২৬/০৮৫',
      title: 'শিক্ষক পরিষদের মাসিক একাডেমিক সমন্বয় সভা (খসড়া)',
      description: 'বার্ষিক পরীক্ষার খাতা মূল্যায়ন ও ডিজিটাল নম্বর ইনপুট সময়সীমা নির্ধারণ সংক্রান্ত।',
      attachmentType: 'OFFICIAL_PAD',
      status: NoticeStatus.DRAFT,
      createdBy: 'user-principal',
      audience: 'TEACHERS',
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const news: News[] = [
    {
      id: 'news-1',
      title: 'উপজেলা পর্যায়ের বিজ্ঞান মেলায় শিক্ষার্থীদের সৌর সেচ প্রকল্পের প্রশংসা',
      description:
        'নড়িয়া উপজেলা বিজ্ঞান ও প্রযুক্তি মেলায় ভোজেশ্বর উচ্চ বিদ্যালয়ের বিজ্ঞান বিভাগের শিক্ষার্থীরা “নবায়নযোগ্য সৌর সেচ ও স্মার্ট পানি ব্যবস্থাপনা” প্রকল্প প্রদর্শন করে বিচারকদের বিশেষ প্রশংসা ও সেরা প্রদর্শনী সম্মাননা অর্জন করেছে।\n\nনবম ও দশম শ্রেণির শিক্ষার্থীদের যৌথ উদ্ভাবনে তৈরি এই মডেলে সৌরশক্তি ব্যবহার করে স্বয়ংক্রিয়ভাবে জমিতে সেচ প্রদানের কার্যকর পদ্ধতি উপস্থাপন করা হয়। প্রকল্প তত্ত্বাবধানে ছিলেন বিদ্যালয়ের বিজ্ঞান বিভাগের জ্যেষ্ঠ শিক্ষকবৃন্দ।\n\nপ্রধান শিক্ষক মোঃ শফিকুর রহমান অংশগ্রহণকারী শিক্ষার্থীদের অভিনন্দন জানিয়ে বলেন, হাতে-কলমে ব্যবহারিক বিজ্ঞান চর্চা শিক্ষার্থীদের সৃজনশীলতা ও বাস্তব সমস্যা সমাধানের দক্ষতা বৃদ্ধি করে।',
      image: '/images/news_science_fair_1795157433625.jpg',
      publishedAt: '2026-10-24T12:00:00.000Z',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'news-2',
      title: 'বিদ্যালয় প্রাঙ্গণে বৃক্ষরোপণ ও সবুজ ক্যাম্পাস সপ্তাহ উদযাপন',
      description:
        'সবুজ ও পরিবেশবান্ধব ক্যাম্পাস গড়ে তোলার লক্ষ্যে স্কাউটস, শিক্ষক ও শিক্ষার্থীদের স্বতঃস্ফূর্ত অংশগ্রহণে বিদ্যালয় প্রাঙ্গণের চারপাশে শতাধিক ফলজ, বনজ ও ঔষধি গাছের চারা রোপণ করা হয়েছে।\n\nকর্মসূচির উদ্বোধনী পর্বে পরিবেশের ভারসাম্য রক্ষায় বৃক্ষের ভূমিকা নিয়ে সংক্ষিপ্ত আলোচনা সভা অনুষ্ঠিত হয়। প্রতিটি শ্রেণির শিক্ষার্থীদের হাতে রোপণকৃত চারার নিয়মিত পরিচর্যার দায়িত্ব তুলে দেওয়া হয়েছে।',
      image: '/images/news_tree_plantation_1795157433367.jpg',
      publishedAt: '2026-09-18T10:00:00.000Z',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'news-3',
      title: 'আন্তঃবিদ্যালয় বিতর্ক ও পাঠাভ্যাস প্রতিযোগিতায় ভোজেশ্বর উচ্চ বিদ্যালয়ের সাফল্য',
      description:
        'নড়িয়া উপজেলা আন্তঃবিদ্যালয় বিতর্ক, কুইজ ও রচনা প্রতিযোগিতায় ভোজেশ্বর উচ্চ বিদ্যালয়ের শিক্ষার্থীরা চ্যাম্পিয়ন ও রানার-আপ হওয়ার গৌরব অর্জন করেছে।\n\nবিদ্যালয়ের সমৃদ্ধ পাঠাগার ও নিয়মিত বিতর্ক ক্লাবের অনুশীলনের ধারাবাহিকতায় শিক্ষার্থীরা যুক্তিনির্ভর উপস্থাপনা ও উপস্থিত বক্তৃতায় দক্ষতার স্বাক্ষর রেখেছে। বিজয়ীদের হাতে সনদ ও বই উপহার তুলে দেওয়া হয়।',
      image: '/images/hero_library_reading_1795136892122.jpg',
      publishedAt: '2026-08-22T09:00:00.000Z',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const eventCategories: EventCategory[] = [
    { id: 'ec-1', name: 'বার্ষিক ক্রীড়া', type: EventCategoryType.SPORTS, description: 'অ্যাথলেটিকস, ফুটবল ও ইনডোর গেমস' },
    { id: 'ec-2', name: 'বিজ্ঞান মেলা', type: EventCategoryType.SCIENCE_FAIR, description: 'শিক্ষার্থীদের বিজ্ঞান ও প্রযুক্তি উদ্ভাবন' },
    { id: 'ec-3', name: 'সাংস্কৃতিক অনুষ্ঠান', type: EventCategoryType.CULTURAL, description: 'কবিতা আবৃত্তি, সংগীত ও বার্ষিক পুরস্কার বিতরণী' },
    { id: 'ec-4', name: 'জাতীয় দিবস', type: EventCategoryType.NATIONAL_DAY, description: '২১ ফেব্রুয়ারি, ২৬ মার্চ ও ১৬ ডিসেম্বর উদযাপন' },
    { id: 'ec-5', name: 'বিতর্ক প্রতিযোগিতা', type: EventCategoryType.DEBATE, description: 'আন্তঃশ্রেণি ও উপজেলা বিতর্ক' },
  ];

  const events: Event[] = [
    {
      id: 'ev-3',
      categoryId: 'ec-2',
      title: 'আন্তঃশ্রেণি বিজ্ঞান ও গণিত অলিম্পিয়াড',
      description:
        'ষষ্ঠ থেকে দশম শ্রেণির শিক্ষার্থীদের অংশগ্রহণে সৃজনশীল বিজ্ঞান প্রকল্প প্রদর্শনী, গণিত অলিম্পিয়াড এবং কুইজ প্রতিযোগিতা।\n\nসকাল ১০:০০ ঘটিকায় বিজ্ঞান ভবন ও অডিটোরিয়ামে প্রদর্শনী শুরু হবে। অভিভাবক ও প্রাক্তন শিক্ষার্থীরা প্রদর্শনী পরিদর্শন করতে পারবেন।',
      startDate: '2026-12-12',
      endDate: '2026-12-12',
      image: '/images/news_science_fair_1795157433625.jpg',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ev-1',
      categoryId: 'ec-4',
      title: 'মহান বিজয় দিবস উদযাপন ও আলোচনা সভা',
      description:
        'যথাযোগ্য মর্যাদায় মহান বিজয় দিবস উদযাপন উপলক্ষে সূর্যোদয়ের সাথে সাথে জাতীয় পতাকা উত্তোলন, শহিদ মিনারে পুষ্পস্তবক অর্পণ, মুক্তিযুদ্ধভিত্তিক চিত্রাঙ্কন, রচনা ও দেশাত্মবোধক সংগীত অনুষ্ঠান।\n\nসকল শিক্ষার্থীকে সকাল ৮:৩০ ঘটিকার মধ্যে নির্ধারিত ইউনিফর্মে বিদ্যালয় প্রাঙ্গণে উপস্থিত থাকতে অনুরোধ করা হলো।',
      startDate: '2026-12-16',
      endDate: '2026-12-16',
      image: '/images/hero_campus_heritage_1795136893336.jpg',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ev-2',
      categoryId: 'ec-1',
      title: 'বার্ষিক ক্রীড়া ও পুরস্কার বিতরণী অনুষ্ঠান ২০২৭',
      description:
        'বিদ্যালয়ের বিশাল খেলার মাঠে দুই দিনব্যাপী কুচকাওয়াজ, দৌড়, লং জাম্প, উচ্চ লাফ, যেমন খুশি তেমন সাজো, শিক্ষক-অভিভাবক প্রীতি প্রতিযোগিতা ও বার্ষিক পুরস্কার বিতরণী অনুষ্ঠান।\n\nবিজয়ী ও কৃতি শিক্ষার্থীদের মাঝে সম্মাননা পদক ও সনদপত্র প্রদান করা হবে।',
      startDate: '2027-01-25',
      endDate: '2027-01-26',
      image: '/images/hero_sports_campus_1795136944347.jpg',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const careers: Career[] = [
    {
      id: 'car-1',
      title: 'খণ্ডকালীন সহকারী শিক্ষক (তথ্য ও যোগাযোগ প্রযুক্তি) নিয়োগ বিজ্ঞপ্তি',
      description:
        'ভোজেশ্বর উচ্চ বিদ্যালয়ের জন্য স্বীকৃত বিশ্ববিদ্যালয় থেকে সিএসই/আইসিটি বিষয়ে স্নাতক ডিগ্রিধারী একজন খণ্ডকালীন শিক্ষক নিয়োগ করা হবে। আগ্রহী প্রার্থীদের জীবনবৃত্তান্ত ও প্রয়োজনীয় সনদের সত্যায়িত কপিসহ প্রধান শিক্ষক বরাবর আবেদন করতে অনুরোধ করা হলো।',
      circularFile: 'ict-teacher-circular-2026.pdf',
      deadline: '2026-12-15',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  // 12. Website CMS Entities
  const banners: WebsiteBanner[] = [
    {
      id: 'ban-1',
      title: '১৯৭৮ সাল থেকে শিক্ষার আলো ছড়াচ্ছে ভোজেশ্বর উচ্চ বিদ্যালয়',
      subtitle: 'ভোজেশ্বর, নড়িয়া, শরীয়তপুর — ঐতিহ্য, নৈতিক শৃঙ্খলা এবং আধুনিক ডিজিটাল শিক্ষাব্যবস্থার অনন্য সমন্বয়।',
      image: 'campus-heritage',
      link: '/about',
      sortOrder: 1,
      isActive: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ban-2',
      title: 'ডিজিটাল ফলাফল, স্মার্ট হাজিরা ও সমন্বিত অভিভাবক পোর্টাল',
      subtitle: 'অনলাইনে তাৎক্ষণিক পরীক্ষার ফলাফল, শ্রেণি রুটিন ও শিক্ষার্থীর অগ্রগতি জানুন যেকোনো সময়।',
      image: 'digital-classroom',
      link: '/results',
      sortOrder: 2,
      isActive: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const leadershipMessages: LeadershipMessage[] = [
    {
      id: 'lm-1',
      personName: 'মোঃ শফিকুর রহমান',
      designation: 'প্রধান শিক্ষক, ভোজেশ্বর উচ্চ বিদ্যালয়',
      photo: '/images/headteacher_clean_portrait_1795154685112.jpg',
      message:
        '“শিক্ষাই আলো, জ্ঞানই শক্তি” — এই মূলমন্ত্রকে ধারণ করে ১৯৭৮ সাল থেকে ভোজেশ্বর উচ্চ বিদ্যালয় নড়িয়া অঞ্চলের শিক্ষার্থীদের আলোকিত, নৈতিক ও দক্ষ মানুষ হিসেবে গড়ে তুলছে। দীর্ঘ চার দশকেরও বেশি সময় ধরে আমাদের প্রাক্তন শিক্ষার্থীরা দেশ-বিদেশের বিভিন্ন গুরুত্বপূর্ণ ক্ষেত্রে সুনামের সাথে অবদান রেখে চলেছেন।\n\nআধুনিক তথ্যপ্রযুক্তির এই যুগে কেবল পাঠ্যবইনির্ভর শিক্ষা যথেষ্ট নয়; তাই আমরা নিয়মিত শ্রেণি পাঠদানের পাশাপাশি বিজ্ঞান ও আইসিটি ল্যাবে ব্যবহারিক শিক্ষা, সমৃদ্ধ পাঠাগার চর্চা, বিতর্ক, স্কাউটিং এবং ক্রীড়া কার্যক্রমে সমান গুরুত্ব দিয়ে থাকি। আমাদের অভিজ্ঞ ও নিবেদিতপ্রাণ শিক্ষকমণ্ডলী প্রতিটি শিক্ষার্থীর মেধা ও সৃজনশীলতা বিকাশে নিরলসভাবে কাজ করে যাচ্ছেন।\n\nঅভিভাবকদের সচেতন সহযোগিতা এবং বিদ্যালয়ের এই আধুনিক ডিজিটাল প্ল্যাটফর্মের মাধ্যমে হাজিরা, পরীক্ষার ফলাফল ও প্রাতিষ্ঠানিক যোগাযোগ আরও স্বচ্ছ ও গতিশীল হবে বলে আমার দৃঢ় বিশ্বাস। আসুন, সম্মিলিত প্রচেষ্টায় আমাদের সন্তানদের উজ্জ্বল ভবিষ্যৎ গড়ে তুলি।',
      type: LeadershipType.PRINCIPAL,
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'lm-2',
      personName: 'আলহাজ্ব মোঃ নুরুল আমিন',
      designation: 'সভাপতি, বিদ্যালয় ম্যানেজিং কমিটি',
      photo: '/images/chairman_portrait_1795154662402.jpg',
      message:
        'ভোজেশ্বর উচ্চ বিদ্যালয় কেবল একটি শিক্ষা প্রতিষ্ঠান নয়, এটি নড়িয়া ও শরীয়তপুর অঞ্চলের মানুষের গর্ব, ঐতিহ্য এবং আলোকিত সমাজ নির্মাণের অন্যতম কেন্দ্র। ১৯৭৮ সালে এলাকার শিক্ষানুরাগী ব্যক্তিবর্গের হাত ধরে যে মহৎ যাত্রা শুরু হয়েছিল, তা আজ হাজারো শিক্ষার্থীর স্বপ্ন পূরণের সোপানে পরিণত হয়েছে।\n\nবিদ্যালয়ের শিক্ষার মানোন্নয়ন, আধুনিক শ্রেণিকক্ষ ও অবকাঠামোগত উন্নয়ন, এবং শিক্ষার্থীদের জন্য একটি নিরাপদ, শৃঙ্খলাপূর্ণ ও আনন্দময় শিক্ষার পরিবেশ নিশ্চিত করতে ম্যানেজিং কমিটি সর্বদা অঙ্গীকারবদ্ধ। ডিজিটাল শিক্ষা সেবা, স্বচ্ছ প্রশাসনিক ব্যবস্থা এবং বিজ্ঞানমনস্ক পাঠদানের প্রসারে আমরা নিরবচ্ছিন্ন সহায়তা প্রদান করে যাচ্ছি।\n\nশিক্ষক, শিক্ষার্থী, অভিভাবক, প্রাক্তন ছাত্র-ছাত্রী ও এলাকার সর্বস্তরের সুধীজনের সম্মিলিত প্রচেষ্টায় ভোজেশ্বর উচ্চ বিদ্যালয় শরীয়তপুর জেলার একটি অনুকরণীয় আদর্শ শিক্ষা প্রতিষ্ঠানে পরিণত হবে — এই আমার একান্ত প্রত্যাশা।',
      type: LeadershipType.CHAIRMAN,
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const galleries: Gallery[] = [
    { id: 'gal-1', title: 'বিদ্যালয় ক্যাম্পাস ও প্রাত্যহিক সমাবেশ', description: 'শতবর্ষী বিদ্যালয় প্রাঙ্গণ, একাডেমিক ভবন ও শিক্ষার্থীদের সমাবেশ।', category: 'ক্যাম্পাস', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'gal-2', title: 'বিজ্ঞান মেলা ও প্রজেক্ট প্রদর্শনী ২০২৬', description: 'নবম ও দশম শ্রেণির শিক্ষার্থীদের উদ্ভাবনী বিজ্ঞান প্রকল্প।', category: 'বিজ্ঞান মেলা', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'gal-3', title: 'বার্ষিক ক্রীড়া ও সাংস্কৃতিক অনুষ্ঠান', description: 'মাঠের ক্রীড়া প্রতিযোগিতা ও পুরস্কার বিতরণী মুহূর্ত।', category: 'ক্রীড়া ও সংস্কৃতি', isPublished: true, createdAt: NOW, updatedAt: NOW },
  ];

  const galleryMedia: GalleryMedia[] = [
    { id: 'gm-1', galleryId: 'gal-1', mediaUrl: 'campus-heritage', mediaType: MediaType.IMAGE, caption: 'মূল একাডেমিক ভবন ও খেলার মাঠ', sortOrder: 1, createdAt: NOW },
    { id: 'gm-2', galleryId: 'gal-1', mediaUrl: 'library-room', mediaType: MediaType.IMAGE, caption: 'বিদ্যালয়ের সমৃদ্ধ গ্রন্থাগার ও পাঠকক্ষ', sortOrder: 2, createdAt: NOW },
    { id: 'gm-3', galleryId: 'gal-2', mediaUrl: 'science-lab', mediaType: MediaType.IMAGE, caption: 'পদার্থ ও রসায়ন গবেষণাগারে ব্যবহারিক ক্লাস', sortOrder: 1, createdAt: NOW },
    { id: 'gm-4', galleryId: 'gal-3', mediaUrl: 'sports-day', mediaType: MediaType.IMAGE, caption: 'বার্ষিক ক্রীড়া ও সাংস্কৃতিক উৎসব', sortOrder: 1, createdAt: NOW },
  ];

  // Official DBML default AdmissionContent verbatim!
  const admissionContent: AdmissionContent = {
    id: 'adm-content-1',
    title: 'ভর্তির আবেদন ফরম ও নির্দেশিকা',
    academicSession: '২০২৭',
    admissionStatus: 'OPEN',
    showOnHomepage: true,
    bannerTitle: '২০২৭ শিক্ষাবর্ষে ৬ষ্ঠ থেকে ৯ম শ্রেণিতে ভর্তি চলছে',
    bannerSubtitle:
      'ভোজেশ্বর উচ্চ বিদ্যালয়ে নতুন শিক্ষাবর্ষের ভর্তি কার্যক্রম শুরু হয়েছে। অনলাইনে আবেদন সম্পন্ন করে আবেদন নম্বর ও প্রবেশপত্র সংগ্রহ করুন।',
    eligibleClasses: '৬ষ্ঠ–৯ম শ্রেণি (বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা)',
    schoolNameBn: 'ভোজেশ্বর উচ্চ বিদ্যালয়',
    schoolNameEn: 'BHOJESHWAR HIGH SCHOOL (BHS)',
    schoolCode: 'BHS',
    districtCode: '৩০',
    thanaCode: '২৪১',
    eiin: '113587',
    schoolAddress: 'ডাকঘর : ভোজেশ্বর, উপজেলা : নড়িয়া, জেলা : শরীয়তপুর। স্থাপিত : ১৯৭৮ খ্রি.',
    studentNameNotice: '০১. শিক্ষার্থীর নাম (বাংলা ও ইংরেজিতে)',
    fatherInfoNotice: '০২. পিতার নাম (বাংলা ও ইংরেজিতে), পেশা, পিতার এনআইডি নং',
    motherInfoNotice: '০৩. মাতার নাম (বাংলা ও ইংরেজিতে), পেশা, মাতার এনআইডি নং',
    addressInfoNotice: '০৪. বর্তমান ও স্থায়ী ঠিকানা (গ্রাম, ডাকঘর, পোস্ট কোড, উপজেলা, জেলা)',
    dobNotice: '০৫. শিক্ষার্থীর জন্ম তারিখ',
    birthCertificateNotice: '০৬. শিক্ষার্থীর ১৭ ডিজিটের ডিজিটাল জন্ম সনদ নং',
    religionNotice: '০৭. শিক্ষার্থীর ধর্ম',
    prevExamNotice: '০৮. পি.এস.সি / জে.এস.সি পাসের সন, রোল নম্বর, রেজিঃ নং, প্রাপ্ত জি.পি.এ.',
    prevSchoolNotice: '০৯. পূর্বে অধ্যয়নরত বিদ্যালয়ের নাম, শ্রেণি, শিক্ষাবর্ষ, প্রাপ্ত গ্রেড, জি.পি.এ. ও ঠিকানা',
    admissionTypeNotice: '১০. নতুন ভর্তি / পুনঃ ভর্তি (টিক চিহ্ন)',
    classesAndSections: '১১. ৬ষ্ঠ / ৭ম / ৮ম / ৯ম শ্রেণি : শাখা ক / খ / গ / ঘ, রোল নং',
    availableGroups: '১২. ৯ম শ্রেণির শাখা : বিজ্ঞান / মানবিক / ব্যবসায় শিক্ষা শাখা',
    optionalSubjects: '১৩. ৪র্থ বিষয় : উচ্চতর গণিত / কৃষি শিক্ষা / গার্হস্থ্য অর্থনীতি / কম্পিউটার শিক্ষা',
    declarationText:
      'আমি এই মর্মে অঙ্গীকার করিতেছি যে, আমার পুত্র / কন্যা / আত্মীয় অন্য কোন বিদ্যালয়ে ভর্তি হয় নাই। সে অত্র বিদ্যালয়ের সকল প্রকার বিধি-বিধান মানিয়া চলিতে বাধ্য থাকিবে এবং আমার উপরে বর্ণিত সকল তথ্যাবলী সঠিক।',
    admitCardNotice: 'ভর্তি পরীক্ষার প্রবেশপত্র (রোল নং, পরীক্ষার তারিখ, প্রধান শিক্ষকের স্বাক্ষর)',
    admissionTestDate: '2026-12-24',
    startDate: '2026-11-15',
    endDate: '2026-12-20',
    applicationFee: 200,
    helplinePhone: '01711-200201',
    formPdfUrl: '#official-admission-form',
    isPublished: true,
    createdAt: NOW,
    updatedAt: NOW,
  };

  const contactInfo: ContactInformation = {
    id: 'contact-1',
    address: 'ভোজেশ্বর উচ্চ বিদ্যালয়, ডাকঘর: ভোজেশ্বর (মশুরা), উপজেলা: নড়িয়া, জেলা: শরীয়তপুর।',
    phone: '+880 1711-200201',
    email: 'info@bhs.edu.bd',
    mapUrl: 'https://maps.google.com/?q=Bhojeshwar,Noria,Shariatpur,Bangladesh',
    createdAt: NOW,
    updatedAt: NOW,
  };

  const attendancePublicSummaries: AttendancePublicSummary[] = [
    { id: 'aps-1', summaryDate: '2026-11-19', title: 'দৈনিক শ্রেণি উপস্থিতি সারসংক্ষেপ', description: 'ষষ্ঠ থেকে দশম শ্রেণির সমন্বিত উপস্থিতির হার', presentCount: 18, absentCount: 2, isPublished: true, createdAt: NOW, updatedAt: NOW },
  ];

  const publications: Publication[] = [
    { id: 'pub-1', title: 'আলোকবর্তিকা — ভোজেশ্বর উচ্চ বিদ্যালয় বার্ষিক ম্যাগাজিন ২০২৬', type: PublicationType.SCHOOL_MAGAZINE, description: 'শিক্ষার্থীদের কবিতা, গল্প, প্রবন্ধ ও বিদ্যালয়ের বার্ষিক কার্যক্রমের সচিত্র সংকলন।', publishYear: 2026, fileUrl: '#alokbortika-2026', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'pub-2', title: 'একুশের দেয়ালিকা — ভাষা ও সংস্কৃতি সংখ্যা', type: PublicationType.WALL_MAGAZINE, description: 'মহান শহীদ দিবস উপলক্ষে শিক্ষার্থীদের স্বহস্তে রচিত দেয়াল পত্রিকা।', publishYear: 2026, fileUrl: '#wall-mag-2026', isPublished: true, createdAt: NOW, updatedAt: NOW },
  ];

  const achievements: Achievement[] = [
    { id: 'ach-1', title: 'গৌরবময় শিক্ষাসেবার ৪৮+ বছর (১৯৭৮–২০২৬)', type: AchievementType.INSTITUTION_ACHIEVEMENT, description: 'নড়িয়া উপজেলার ভোজেশ্বরের অন্যতম সুনামধন্য মাধ্যমিক বিদ্যালয় হিসেবে ধারাবাহিক সাফল্যের পথচলা। (অফিসিয়াল আর্কাইভ থেকে কনফিগারযোগ্য)', achievedAt: '2026-01-01', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ach-2', title: 'উপজেলা বিজ্ঞান মেলা অংশগ্রহণ সম্মাননা (ডেমো এন্ট্রি)', type: AchievementType.STUDENT_STAR, personName: 'বিজ্ঞান ক্লাব দল (ডেমো)', batch: 'ব্যাচ ২০২৬', description: 'অভিভাবক ও শিক্ষার্থীর সম্মতি সাপেক্ষে কৃতী শিক্ষার্থীদের তালিকা এখানে প্রকাশিত হয়।', achievedAt: '2026-10-24', isPublished: true, createdAt: NOW, updatedAt: NOW },
  ];

  // 13. Proposed / BACKEND-PENDING demo records (Admissions inbox, notifications, future previews)
  const onlineAdmissions: OnlineAdmissionApplication[] = [
    {
      id: 'app-1',
      applicationNumber: 'ADM-2027-001',
      academicSession: '২০২৭',
      status: 'UNDER_REVIEW',
      submittedAt: '2026-11-17T11:20:00.000Z',
      admissionTestRoll: '270601',
      admissionTestDate: '2026-12-24',
      studentNameBn: 'রাফিউল ইসলাম (ডেমো আবেদনকারী)',
      studentNameEn: 'Rafiul Islam',
      fatherNameBn: 'মোঃ সাইদুর রহমান',
      fatherNameEn: 'Md. Saidur Rahman',
      fatherOccupation: 'ব্যবসা',
      fatherNid: '19848614500112233',
      motherNameBn: 'মোছাঃ সালমা বেগম',
      motherNameEn: 'Mst. Salma Begum',
      motherOccupation: 'গৃহিণী',
      motherNid: '19888614500112244',
      guardianPhone: '01712345678',
      presentAddress: 'গ্রাম: মশুরা, ডাকঘর: ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
      permanentAddress: 'গ্রাম: মশুরা, ডাকঘর: ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
      dateOfBirth: '2014-05-12',
      gender: Gender.MALE,
      birthCertificateNo: '20148614500012345',
      religion: Religion.ISLAM,
      previousSchoolName: 'ভোজেশ্বর সরকারি প্রাথমিক বিদ্যালয়',
      previousClass: '৫ম শ্রেণি',
      previousGrade: 'A+',
      isReadmission: false,
      targetClassId: 'cls-6',
      preferredSection: 'ক',
      declarationAccepted: true,
    },
    {
      id: 'app-2',
      applicationNumber: 'ADM-2027-002',
      academicSession: '২০২৭',
      status: 'APPROVED',
      submittedAt: '2026-11-18T08:45:00.000Z',
      admissionTestRoll: '270901',
      admissionTestDate: '2026-12-24',
      studentNameBn: 'মালিহা চৌধুরী (ডেমো আবেদনকারী)',
      studentNameEn: 'Maliha Chowdhury',
      fatherNameBn: 'মোঃ জসিম উদ্দিন চৌধুরী',
      fatherNameEn: 'Md. Jasim Uddin Chowdhury',
      fatherOccupation: 'চাকরি',
      fatherNid: '19818614500223344',
      motherNameBn: 'তাসলিমা আক্তার',
      motherNameEn: 'Taslima Akter',
      motherOccupation: 'শিক্ষকতা',
      motherNid: '19868614500223355',
      guardianPhone: '01812345679',
      presentAddress: 'গ্রাম: ভোজেশ্বর বাজার, নড়িয়া, শরীয়তপুর',
      permanentAddress: 'গ্রাম: ভোজেশ্বর বাজার, নড়িয়া, শরীয়তপুর',
      dateOfBirth: '2011-08-20',
      gender: Gender.FEMALE,
      birthCertificateNo: '20118614500098765',
      religion: Religion.ISLAM,
      previousSchoolName: 'নড়িয়া বালিকা উচ্চ বিদ্যালয়',
      previousClass: '৮ম শ্রেণি',
      previousGrade: 'A+',
      isReadmission: false,
      targetClassId: 'cls-9',
      targetGroupId: 'grp-sci',
      optionalSubjectName: 'উচ্চতর গণিত',
      declarationAccepted: true,
    },
  ];

  const notifications: AppNotification[] = [
    { id: 'ntf-1', type: 'MARKS_DEADLINE', titleBn: 'বার্ষিক পরীক্ষার নম্বর এন্ট্রির সময়সীমা', titleEn: 'Annual Exam Marks Entry Deadline', bodyBn: '১০ম শ্রেণির বার্ষিক পরীক্ষার নম্বর আগামী ১০ ডিসেম্বর ২০২৬ এর মধ্যে জমা দিতে হবে।', bodyEn: 'Submit Class 10 Annual Exam marks before 10 December 2026.', createdAt: '2026-11-19T08:00:00.000Z', isRead: false, targetRoles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'], link: '/admin/examinations/marks-entry' },
    { id: 'ntf-2', type: 'RESULT_PUBLISHED', titleBn: 'অর্ধবার্ষিক পরীক্ষা ২০২৬ ফলাফল প্রকাশিত', titleEn: 'Half-Yearly Exam 2026 Results Published', bodyBn: '৯ম ও ১০ম শ্রেণির অর্ধবার্ষিক ফলাফল পাবলিক রেজাল্ট পেজে উন্মুক্ত করা হয়েছে।', bodyEn: 'Class 9 & 10 Half-Yearly results are now live on public result search.', createdAt: '2026-11-18T11:30:00.000Z', isRead: false, targetRoles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT'], link: '/results' },
    { id: 'ntf-3', type: 'ATTENDANCE_SMS', titleBn: 'আজকের RFID উপস্থিতি এসএমএস প্রেরিত', titleEn: 'Daily RFID Attendance SMS Sent', bodyBn: 'তানভীর আহমেদ সকাল ০৯:৫২ মিনিটে বিদ্যালয়ে প্রবেশ করেছে।', bodyEn: 'Tanvir Ahmed entered campus at 09:52 AM via RFID.', createdAt: '2026-11-19T09:53:00.000Z', isRead: false, targetRoles: ['PARENT', 'SUPER_ADMIN'], link: '/parent/sms-history' },
    { id: 'ntf-4', type: 'ADMISSION', titleBn: 'নতুন অনলাইন ভর্তি আবেদন জমা হয়েছে', titleEn: 'New Online Admission Application', bodyBn: 'আবেদন নং ADM-2027-002 (মালিহা চৌধুরী, ৯ম শ্রেণি) পর্যালোচনার জন্য অপেক্ষমাণ।', bodyEn: 'Application ADM-2027-002 (Maliha Chowdhury, Class 9) awaits review.', createdAt: '2026-11-18T08:50:00.000Z', isRead: true, targetRoles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'], link: '/admin/students/admissions' },
  ];

  const smsTemplateConfig: SmsTemplateConfig = {
    entryTemplateBn: 'প্রিয় অভিভাবক, আপনার সন্তান {{studentName}} আজ {{time}} মিনিটে বিদ্যালয়ে প্রবেশ করেছে। - ভোজেশ্বর উচ্চ বিদ্যালয়',
    exitTemplateBn: 'প্রিয় অভিভাবক, আপনার সন্তান {{studentName}} আজ {{time}} মিনিটে বিদ্যালয় ত্যাগ করেছে। - ভোজেশ্বর উচ্চ বিদ্যালয়',
    absentTemplateBn: 'প্রিয় অভিভাবক, আপনার সন্তান {{studentName}} আজ ({{date}}) বিদ্যালয়ে অনুপস্থিত। অনুগ্রহ করে যোগাযোগ করুন।',
    gatewayProvider: 'BD Bulk SMS Gateway (Backend Pending)',
    senderId: 'BHS',
    isEnabled: true,
  };

  const feeInvoices: FeeInvoice[] = [
    { id: 'inv-1', invoiceNo: 'INV-2026-1001', studentId: 'stu-10-1', studentName: 'তানভীর আহমেদ', className: '১০ম শ্রেণি', monthLabel: 'নভেম্বর ২০২৬', amountBdt: 650, paidAmountBdt: 650, status: 'PAID', paymentGateway: 'BKASH', dueDate: '2026-11-15' },
    { id: 'inv-2', invoiceNo: 'INV-2026-1002', studentId: 'stu-10-2', studentName: 'নুসরাত জাহান মিম', className: '১০ম শ্রেণি', monthLabel: 'নভেম্বর ২০২৬', amountBdt: 650, paidAmountBdt: 0, status: 'UNPAID', dueDate: '2026-11-25' },
    { id: 'inv-3', invoiceNo: 'INV-2026-0901', studentId: 'stu-9-1', studentName: 'তাহসিনা তাবাসসুম', className: '৯ম শ্রেণি', monthLabel: 'নভেম্বর ২০২৬', amountBdt: 550, paidAmountBdt: 300, status: 'PARTIAL', paymentGateway: 'NAGAD', dueDate: '2026-11-25' },
  ];

  const homeworks: HomeworkAssignment[] = [
    { id: 'hw-1', classId: 'cls-10', sectionId: 'sec-10-ka', subjectName: 'গণিত', teacherName: 'মোঃ কামরুল হাসান (ডেমো)', title: 'অনুশীলনী ৯.২ — ত্রিকোণমিতির ১ থেকে ১২ নং সমস্যা সমাধান', description: 'সব অঙ্ক খাতায় লিখে পরবর্তী রবিবারে জমা দিতে হবে।', dueDate: '2026-11-22', status: 'ACTIVE' },
    { id: 'hw-2', classId: 'cls-10', sectionId: 'sec-10-ka', subjectName: 'ইংরেজি', teacherName: 'সাবিনা ইয়াসমিন (ডেমো)', title: 'Paragraph: Digital Education in Rural Bangladesh', description: 'Write within 180–200 words in your classwork notebook.', dueDate: '2026-11-23', status: 'ACTIVE' },
  ];

  const leaveApplications: LeaveApplication[] = [
    { id: 'lv-1', applicantType: 'STUDENT', applicantName: 'মেহেদী হাসান শুভ (১০ম শ্রেণি)', fromDate: '2026-11-20', toDate: '2026-11-21', reason: 'জ্বর ও শারীরিক অসুস্থতা', status: 'PENDING' },
    { id: 'lv-2', applicantType: 'STAFF', applicantName: 'ফারহানা আক্তার (ডেমো)', fromDate: '2026-11-24', toDate: '2026-11-24', reason: 'পারিবারিক জরুরি কাজ', status: 'APPROVED' },
  ];

  const libraryLoans: LibraryLoanRecord[] = [
    { id: 'loan-1', bookTitle: 'বিজ্ঞান ও আমাদের পৃথিবী', borrowerName: 'তানভীর আহমেদ (১০ম)', borrowerRole: 'STUDENT', issuedDate: '2026-11-10', dueDate: '2026-11-24', fineBdt: 0, status: 'ISSUED' },
    { id: 'loan-2', bookTitle: 'অসমাপ্ত আত্মজীবনী', borrowerName: 'অনন্যা সাহা (৯ম)', borrowerRole: 'STUDENT', issuedDate: '2026-10-28', dueDate: '2026-11-11', fineBdt: 20, status: 'OVERDUE' },
  ];

  return {
    users,
    roles,
    permissions,
    userRoles,
    rolePermissions,
    auditLogs,
    schoolProfile,
    institutionContents,
    facilities,
    administrators,
    managingCommittee,
    quickLinks,
    departments,
    staffStructures,
    staff,
    academicYears,
    academicGroups,
    classes,
    sections,
    subjects,
    books,
    classSubjects,
    students,
    rfidCards,
    enrollments,
    promotions,
    transferCertificates,
    parents,
    parentStudents,
    teacherAssignments,
    sectionClassTeachers,
    academicDocuments,
    syllabusFiles,
    syllabusEntries,
    academicEvents,
    classRoutines,
    attendances,
    attendanceSmsLogs,
    gradingScales,
    gradeRanges,
    exams,
    examSubjects,
    examRoutines,
    marks,
    studentSubjectResults,
    resultSummaries,
    consolidatedConfigs,
    libraryProfile,
    libraryBooks,
    libraryDistributions,
    digitalClassrooms,
    digitalResources,
    notices,
    news,
    eventCategories,
    events,
    careers,
    banners,
    leadershipMessages,
    galleries,
    galleryMedia,
    admissionContent,
    contactInfo,
    attendancePublicSummaries,
    publications,
    achievements,
    onlineAdmissions,
    classAttendanceConfigs,
    rfidScans,
    notifications,
    smsTemplateConfig,
    feeInvoices,
    homeworks,
    leaveApplications,
    libraryLoans,
  };
}
