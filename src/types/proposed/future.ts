// BACKEND-PENDING: Proposed TypeScript contracts for Section 12-B modules
// These entities are NOT present in the current DBML schema and require
// future backend API & PostgreSQL/Prisma implementation.

import { AttendanceMethod, BloodGroup, Gender, Religion } from '../enums';

export type AdmissionApplicationStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ADMITTED';

export type AdmissionType = 'NEW' | 'TRANSFER' | 'READMISSION';
export type PrimaryGuardianType = 'FATHER' | 'MOTHER' | 'LEGAL_GUARDIAN';

export interface StructuredAddress {
  village: string;
  postOffice: string;
  postCode?: string;
  upazila: string;
  district: string;
}

export interface AdmissionDocumentAttachment {
  name: string;
  dataUrl: string;
  sizeBytes?: number;
}

export interface AdmissionAttachments {
  birthCertificate?: AdmissionDocumentAttachment | null;
  parentsNid?: AdmissionDocumentAttachment | null;
  previousRecordOrTc?: AdmissionDocumentAttachment | null;
}

// BACKEND-PENDING: Unified online admission application (Classes 6-10, BHS + BUTPHS + DSHE/Board standard)
export interface OnlineAdmissionApplication {
  id: string;
  applicationNumber: string;
  academicSession: string;
  status: AdmissionApplicationStatus;
  submittedAt: string;
  admissionTestRoll?: string;
  admissionTestDate?: string;
  // 01. Student identity
  studentNameBn: string;
  studentNameEn: string;
  photoPreview?: string | null;
  dateOfBirth: string;
  gender: Gender;
  birthCertificateNo: string; // 17 digits (BDRIS)
  religion: Religion;
  bloodGroup?: BloodGroup | null;
  nationality?: string;
  studentPhone?: string | null;
  // 02. Father
  fatherAlive?: boolean;
  fatherNameBn: string;
  fatherNameEn: string;
  fatherOccupation: string;
  fatherNid: string;
  fatherPhone?: string | null;
  // 03. Mother
  motherAlive?: boolean;
  motherNameBn: string;
  motherNameEn: string;
  motherOccupation: string;
  motherNid: string;
  motherPhone?: string | null;
  // Primary contact & Legal guardian
  primaryGuardianType?: PrimaryGuardianType;
  guardianPhone: string;
  guardianMonthlyIncome?: number | null;
  legalGuardianNameBn?: string | null;
  legalGuardianNameEn?: string | null;
  legalGuardianRelation?: string | null;
  legalGuardianPhone?: string | null;
  legalGuardianNid?: string | null;
  legalGuardianAddress?: string | null;
  // 04. Addresses (formatted + structured)
  presentAddress: string;
  permanentAddress: string;
  presentAddressParts?: StructuredAddress | null;
  permanentAddressParts?: StructuredAddress | null;
  // 08-09. Previous academic / TC / Board Registration
  prevExamName?: string;
  prevExamPassingYear?: number;
  prevExamRoll?: string;
  prevExamRegistration?: string;
  prevExamGpa?: number;
  previousSchoolName?: string;
  previousSchoolEiin?: string | null;
  previousSchoolAddress?: string;
  previousClass?: string;
  previousGrade?: string;
  transferCertificateNo?: string | null;
  transferCertificateDate?: string | null;
  boardRegistrationNo?: string | null;
  boardRegistrationSession?: string | null;
  // 10-13. Target admission details
  admissionType?: AdmissionType;
  isReadmission: boolean;
  targetClassId: string;
  preferredSection?: string;
  targetGroupId?: string | null;
  optionalClassSubjectId?: string | null;
  optionalSubjectName?: string | null;
  attachments?: AdmissionAttachments | null;
  verifiedDocuments?: Record<string, boolean> | null;
  declarationAccepted: boolean;
  remarks?: string;
}

// BACKEND-PENDING: Attendance method configuration per class (e.g. Class 10 -> RFID, Classes 6-9 -> MANUAL)
export interface ClassAttendanceMethodConfig {
  classId: string;
  method: AttendanceMethod;
  autoSmsOnEntry: boolean;
  autoSmsOnExit: boolean;
  autoSmsOnAbsent: boolean;
  lateThresholdTime: string; // e.g., "10:15"
}

// BACKEND-PENDING: Live RFID device scan event (WebSocket/polling integration interface)
export interface RfidScanEvent {
  id: string;
  cardNumber: string;
  studentId?: string | null;
  studentName?: string | null;
  className?: string | null;
  scannedAt: string;
  deviceLocation: string;
  direction: 'ENTRY' | 'EXIT';
  isKnownCard: boolean;
}

// BACKEND-PENDING: Notification records
export interface AppNotification {
  id: string;
  type: 'NOTICE' | 'RESULT_PUBLISHED' | 'ATTENDANCE_SMS' | 'MARKS_DEADLINE' | 'ADMISSION';
  titleBn: string;
  titleEn: string;
  bodyBn: string;
  bodyEn: string;
  createdAt: string;
  isRead: boolean;
  targetRoles: string[];
  link?: string;
}

// BACKEND-PENDING: Fees & Finance contracts
export interface FeeStructure {
  id: string;
  classId: string;
  academicYearId: string;
  title: string;
  amountBdt: number;
  frequency: 'MONTHLY' | 'ANNUAL' | 'ONE_TIME';
}

export interface FeeInvoice {
  id: string;
  invoiceNo: string;
  studentId: string;
  studentName: string;
  className: string;
  monthLabel: string;
  amountBdt: number;
  paidAmountBdt: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
  paymentGateway?: 'BKASH' | 'NAGAD' | 'ROCKET' | 'CASH';
  dueDate: string;
}

// BACKEND-PENDING: Homework & Class Diary
export interface HomeworkAssignment {
  id: string;
  classId: string;
  sectionId: string;
  subjectName: string;
  teacherName: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'ACTIVE' | 'CLOSED';
}

// BACKEND-PENDING: Leave Application
export interface LeaveApplication {
  id: string;
  applicantType: 'STUDENT' | 'STAFF';
  applicantName: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// BACKEND-PENDING: Library Loan
export interface LibraryLoanRecord {
  id: string;
  bookTitle: string;
  borrowerName: string;
  borrowerRole: 'STUDENT' | 'TEACHER';
  issuedDate: string;
  dueDate: string;
  returnedDate?: string | null;
  fineBdt: number;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE';
}

// BACKEND-PENDING: SMS Gateway & Templates config
export interface SmsTemplateConfig {
  entryTemplateBn: string;
  exitTemplateBn: string;
  absentTemplateBn: string;
  gatewayProvider: string;
  senderId: string;
  isEnabled: boolean;
}
