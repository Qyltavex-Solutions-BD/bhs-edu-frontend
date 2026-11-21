// BACKEND-PENDING: Proposed TypeScript contracts for Section 12-B modules
// These entities are NOT present in the current DBML schema and require
// future backend API & PostgreSQL/Prisma implementation.

import { AttendanceMethod, Gender, Religion } from '../enums';

export type AdmissionApplicationStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ADMITTED';

// BACKEND-PENDING: Online admission application submission (mirrors 13-point school form)
export interface OnlineAdmissionApplication {
  id: string;
  applicationNumber: string;
  academicSession: string;
  status: AdmissionApplicationStatus;
  submittedAt: string;
  admissionTestRoll?: string;
  admissionTestDate?: string;
  // 01. Student name
  studentNameBn: string;
  studentNameEn: string;
  photoPreview?: string | null;
  // 02. Father
  fatherNameBn: string;
  fatherNameEn: string;
  fatherOccupation: string;
  fatherNid: string;
  // 03. Mother
  motherNameBn: string;
  motherNameEn: string;
  motherOccupation: string;
  motherNid: string;
  guardianPhone: string;
  // 04. Addresses
  presentAddress: string;
  permanentAddress: string;
  // 05-07. Bio
  dateOfBirth: string;
  gender: Gender;
  birthCertificateNo: string; // 17 digits
  religion: Religion;
  // 08-09. Previous exam & school
  prevExamName?: string;
  prevExamPassingYear?: number;
  prevExamRoll?: string;
  prevExamRegistration?: string;
  prevExamGpa?: number;
  previousSchoolName?: string;
  previousSchoolAddress?: string;
  previousClass?: string;
  previousGrade?: string;
  // 10-13. Target admission details
  isReadmission: boolean;
  targetClassId: string;
  preferredSection?: string;
  targetGroupId?: string | null;
  optionalSubjectName?: string | null;
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
