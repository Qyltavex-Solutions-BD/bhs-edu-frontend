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
  TestimonialType,
  WeekDay,
} from './enums';

// ============================================================================
// Module: Auth (6 tables)
// Note: passwordHash is omitted on frontend DTOs for security
// ============================================================================

export interface User {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
}

export interface Permission {
  id: string;
  name: string;
  description?: string | null;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  module: string;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

// ============================================================================
// Module: Institution (6 tables)
// ============================================================================

export interface SchoolProfile {
  id: string;
  name: string;
  nameEn?: string;
  motto?: string;
  eiin?: string | null;
  schoolCode?: string | null;
  logo?: string | null;
  establishedYear?: number | null;
  address: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  description?: string | null;
  mission?: string | null;
  vision?: string | null;
  socialLinks?: {
    facebook?: string;
    youtube?: string;
    twitter?: string;
    linkedin?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionContent {
  id: string;
  type: InstitutionContentType;
  title: string;
  description: string;
  image?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolFacility {
  id: string;
  name: string;
  type: FacilityType;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Administrator {
  id: string;
  staffId?: string | null;
  name: string;
  designation: string;
  photo?: string | null;
  message?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagingCommitteeMember {
  id: string;
  name: string;
  designation: string;
  photo?: string | null;
  phone?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  isButton: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Module: Staff (3 tables)
// ============================================================================

export interface Staff {
  id: string;
  userId?: string | null;
  employeeId?: string | null;
  name: string;
  nameBn?: string;
  photo?: string | null;
  designation: string;
  qualification?: string | null;
  staffType: StaffType;
  departmentId?: string | null;
  staffStructureId?: string | null;
  employmentType: EmploymentType;
  fatherName?: string | null;
  motherName?: string | null;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  nid?: string | null;
  bloodGroup?: BloodGroup | null;
  religion?: Religion | null;
  presentAddress?: string | null;
  permanentAddress?: string | null;
  emergencyContact?: string | null;
  phone?: string | null;
  email?: string | null;
  joiningDate?: string | null;
  leavingDate?: string | null;
  displayOrder: number;
  status: StaffStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  displayOrder: number;
  status: DepartmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StaffStructure {
  id: string;
  designation: string;
  staffType: StaffType;
  totalPositions: number;
  filledPositions: number;
  departmentId?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Module: Academic, Students, Parents, Teaching (19 tables)
// ============================================================================

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicGroup {
  id: string;
  name: string;
  nameBn?: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  nameBn?: string;
  numericValue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  classId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  nameBn?: string;
  officialCode?: string | null;
  category: SubjectCategory;
  paperNumber?: number | null;
  description?: string | null;
  displayOrder: number;
  isSystemDefault: boolean;
  isActive: boolean;
  combinedSubjectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  subjectId: string;
  classId: string;
  name: string;
  bookCode?: string | null;
  type: BookType;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSubject {
  id: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  groupId?: string | null;
  isOptional: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  userId?: string | null;
  studentId: string;
  birthCertificateNo?: string | null;
  boardRegistrationNo?: string | null;
  nameEn: string;
  nameBn?: string | null;
  photo?: string | null;
  dateOfBirth?: string | null;
  gender: Gender;
  bloodGroup?: BloodGroup | null;
  religion?: Religion | null;
  presentAddress?: string | null;
  permanentAddress?: string | null;
  admissionDate: string;
  status: StudentStatus;
  previousSchoolName?: string | null;
  previousSchoolAddress?: string | null;
  previousGrade?: string | null;
  previousGpa?: number | null;
  prevExamPassingYear?: number | null;
  prevExamRoll?: string | null;
  prevExamRegistration?: string | null;
  prevExamGpa?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentRFIDcard {
  id: string;
  studentId: string;
  cardNumber: string;
  status: CardStatus;
  issuedAt: string;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  groupId?: string | null;
  optionalClassSubjectId?: string | null;
  roll: number;
  enrollmentDate: string;
  formSerialNo?: string | null;
  isRepeater: boolean;
  isReadmission: boolean;
  status: EnrollmentStatus;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentPromotion {
  id: string;
  studentId: string;
  fromEnrollmentId: string;
  toEnrollmentId: string;
  resultSummaryId?: string | null;
  promotionType: PromotionType;
  promotionDate: string;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentTransferCertificate {
  id: string;
  studentId: string;
  enrollmentId?: string | null;
  tcNumber: string;
  issueDate: string;
  leavingDate: string;
  reason: string;
  duesCleared: boolean;
  conductRemarks?: string | null;
  leavingClass?: string | null;
  promotedToNextClass: boolean;
  destinationSchool?: string | null;
  documentUrl?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentTestimonial {
  id: string;
  studentId: string;
  enrollmentId?: string | null;
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
  createdAt: string;
  updatedAt: string;
}

export interface Parent {
  id: string;
  userId?: string | null;
  name: string;
  nameBn?: string | null;
  phone: string;
  email?: string | null;
  nid?: string | null;
  occupation?: string | null;
  monthlyIncome?: number | null;
  photo?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParentStudent {
  id: string;
  parentId: string;
  studentId: string;
  relationship: RelationshipType;
  isPrimary: boolean;
  isEmergencyContact: boolean;
  isSmsReceiver: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherAssignment {
  id: string;
  staffId: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  classSubjectId: string;
  canEnterMarks: boolean;
  assignedDate: string;
  releasedDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SectionClassTeacher {
  id: string;
  academicYearId: string;
  sectionId: string;
  staffId: string;
  assignedDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicDocument {
  id: string;
  type: AcademicDocumentType;
  title: string;
  description?: string | null;
  fileUrl?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SyllabusExamTerm = 'HALF_YEARLY' | 'ANNUAL' | 'SELECTION';

export interface SyllabusFile {
  id: string;
  academicYearId: string;
  classId: string;
  groupId?: string | null;
  examTerm: SyllabusExamTerm;
  title: string;
  fileName: string;
  fileSize: string;
  fileType: 'PDF' | 'IMAGE';
  fileUrl?: string | null;
  publishedAt: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SyllabusChapterEntry {
  id: string;
  academicYearId: string;
  classId: string;
  groupId?: string | null;
  examTerm: SyllabusExamTerm;
  subjectId: string;
  chaptersBn: string;
  chaptersEn: string;
  marksBreakdownBn: string;
  marksBreakdownEn: string;
  remarks?: string | null;
  displayOrder: number;
}

export interface AcademicEvent {
  id: string;
  academicYearId: string;
  title: string;
  description?: string | null;
  eventType: AcademicEventType;
  startDate: string;
  endDate: string;
}

export interface ClassRoutine {
  id: string;
  academicYearId: string;
  teacherAssignmentId: string;
  staffId: string;
  sectionId: string;
  day: WeekDay;
  periodNumber: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Module: Attendance (2 tables)
// ============================================================================

export interface Attendance {
  id: string;
  studentEnrollmentId: string;
  date: string;
  inTime?: string | null;
  outTime?: string | null;
  status: AttendanceStatus;
  method: AttendanceMethod;
  remarks?: string | null;
  markedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSmsLog {
  id: string;
  attendanceId: string;
  parentId: string;
  smsType: AttendanceSmsType;
  phone: string;
  message: string;
  status: SmsStatus;
  sentAt?: string | null;
  createdAt: string;
}

// ============================================================================
// Module: Examination (9 tables)
// ============================================================================

export interface GradingScale {
  id: string;
  name: string;
  description?: string | null;
  maxGpa: number;
  isDefault: boolean;
  isSystemDefault: boolean;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GradeRange {
  id: string;
  gradingScaleId: string;
  minPercentage: number;
  maxPercentage: number;
  letterGrade: string;
  gradePoint: number;
  remarks?: string | null;
  isFailGrade: boolean;
  displayOrder: number;
  isDeleted: boolean;
  deletedAt?: string | null;
}

export interface Exam {
  id: string;
  academicYearId: string;
  classId: string;
  gradingScaleId: string;
  name: string;
  examType: ExamType;
  startDate: string;
  endDate: string;
  status: ExamStatus;
  marksEntryDeadline?: string | null;
  allowCombinedPass: boolean;
  weightagePercentage?: number | null;
  resultStatus: ResultPublicationStatus;
  publishedAt?: string | null;
  isLocked: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamSubject {
  id: string;
  examId: string;
  subjectId: string;
  groupId?: string | null;
  fullMarks: number;
  passMarks: number;
  hasWritten: boolean;
  writtenFullMarks?: number | null;
  writtenPassMarks?: number | null;
  hasMcq: boolean;
  mcqFullMarks?: number | null;
  mcqPassMarks?: number | null;
  hasPractical: boolean;
  practicalFullMarks?: number | null;
  practicalPassMarks?: number | null;
  hasContinuousAssessment: boolean;
  continuousAssessmentFullMarks?: number | null;
  continuousAssessmentPassMarks?: number | null;
  isOptional: boolean;
  displayOrder: number;
}

export interface ExamRoutine {
  id: string;
  examId: string;
  examSubjectId: string;
  sectionId?: string | null;
  examDate: string;
  startTime: string;
  endTime: string;
  roomNo?: string | null;
  status: ExamRoutineStatus;
  instructions?: string | null;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Mark {
  id: string;
  studentEnrollmentId: string;
  examSubjectId: string;
  writtenMarks: number;
  mcqMarks: number;
  practicalMarks: number;
  continuousAssessmentMarks: number;
  totalMarks: number;
  isAbsent: boolean;
  isLocked: boolean;
  enteredBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSubjectResult {
  id: string;
  studentEnrollmentId: string;
  examId: string;
  examSubjectId: string;
  totalMarks: number;
  letterGrade?: string | null;
  gradePoint?: number | null;
  isPassed: boolean;
  isOptional: boolean;
  bonusGradePoint?: number | null;
  isAbsent: boolean;
  calculatedAt: string;
}

export interface ResultSummary {
  id: string;
  studentEnrollmentId: string;
  examId: string;
  totalFullMarks: number;
  totalMarks: number;
  gpa?: number | null;
  gpaWithoutOptional?: number | null;
  letterGrade?: string | null;
  meritPosition?: number | null;
  sectionMeritPosition?: number | null;
  failedSubjectCount: number;
  resultStatus: ResultStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConsolidatedExamConfig {
  id: string;
  consolidatedExamId: string;
  sourceExamId: string;
  weightagePercentage: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Module: Library (3 tables)
// ============================================================================

export interface LibraryProfile {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  updatedAt: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  author?: string | null;
  publisher?: string | null;
  category?: string | null;
  description?: string | null;
  coverImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryDistributionInfo {
  id: string;
  type: LibraryDistributionType;
  title: string;
  description?: string | null;
  distributionDate?: string | null;
  image?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Module: DigitalEducation (2 tables)
// ============================================================================

export interface DigitalClassroom {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  image?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DigitalResource {
  id: string;
  academicYearId?: string | null;
  title: string;
  description?: string | null;
  resourceType: ResourceType;
  subjectId?: string | null;
  classId?: string | null;
  url: string;
  thumbnail?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Module: NoticeEvent (5 tables)
// ============================================================================

export type NoticeAttachmentType = 'PDF' | 'IMAGE' | 'OFFICIAL_PAD';

export interface Notice {
  id: string;
  memoNo?: string | null;
  title: string;
  description: string;
  attachment?: string | null;
  attachmentType?: NoticeAttachmentType | null;
  attachmentUrl?: string | null;
  attachmentSize?: string | null;
  publishedAt?: string | null;
  status: NoticeStatus;
  createdBy: string;
  isUrgent?: boolean;
  audience?: 'ALL' | 'PARENTS' | 'TEACHERS' | 'STUDENTS';
  createdAt: string;
  updatedAt: string;
}

export interface News {
  id: string;
  title: string;
  description: string;
  image?: string | null;
  publishedAt?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventCategory {
  id: string;
  name: string;
  type: EventCategoryType;
  description?: string | null;
}

export interface Event {
  id: string;
  categoryId: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  image?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Career {
  id: string;
  title: string;
  description: string;
  circularFile?: string | null;
  deadline: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Module: WebsiteContent (9 tables)
// ============================================================================

export interface WebsiteBanner {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  image: string;
  link?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeadershipMessage {
  id: string;
  personName: string;
  designation: string;
  photo?: string | null;
  message: string;
  type: LeadershipType;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Gallery {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryMedia {
  id: string;
  galleryId: string;
  mediaUrl: string;
  mediaType: MediaType;
  caption?: string | null;
  sortOrder: number;
  createdAt: string;
}

export type AdmissionCycleStatus = 'OPEN' | 'UPCOMING' | 'CLOSED';

export interface AdmissionContent {
  id: string;
  title: string;
  academicSession?: string | null;
  admissionStatus?: AdmissionCycleStatus;
  showOnHomepage?: boolean;
  bannerTitle?: string | null;
  bannerSubtitle?: string | null;
  eligibleClasses?: string | null;
  schoolNameBn?: string | null;
  schoolNameEn?: string | null;
  schoolCode?: string | null;
  districtCode?: string | null;
  thanaCode?: string | null;
  eiin?: string | null;
  schoolAddress?: string | null;
  studentNameNotice?: string | null;
  fatherInfoNotice?: string | null;
  motherInfoNotice?: string | null;
  addressInfoNotice?: string | null;
  dobNotice?: string | null;
  birthCertificateNotice?: string | null;
  religionNotice?: string | null;
  prevExamNotice?: string | null;
  prevSchoolNotice?: string | null;
  admissionTypeNotice?: string | null;
  classesAndSections?: string | null;
  availableGroups?: string | null;
  optionalSubjects?: string | null;
  declarationText?: string | null;
  admitCardNotice?: string | null;
  admissionTestDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  applicationFee?: number | null;
  helplinePhone?: string | null;
  formPdfUrl?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactInformation {
  id: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  mapUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendancePublicSummary {
  id: string;
  summaryDate: string;
  title: string;
  description?: string | null;
  presentCount?: number | null;
  absentCount?: number | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Publication {
  id: string;
  title: string;
  type: PublicationType;
  description?: string | null;
  coverImage?: string | null;
  fileUrl?: string | null;
  publishYear?: number | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  type: AchievementType;
  personName?: string | null;
  batch?: string | null;
  description?: string | null;
  image?: string | null;
  achievedAt?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
