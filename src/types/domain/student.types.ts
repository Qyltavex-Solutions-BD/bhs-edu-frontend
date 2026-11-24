import {
  Gender,
  Religion,
  BloodGroup,
  StudentStatus,
  CardStatus,
  EnrollmentStatus,
  PromotionType,
  TestimonialType,
} from '../enums';

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
  nationality?: string | null;
  studentPhone?: string | null;
  admissionType?: 'NEW' | 'TRANSFER' | 'READMISSION' | null;
  transferCertificateNo?: string | null;
  transferCertificateDate?: string | null;
  previousSchoolEiin?: string | null;
  verifiedDocuments?: Record<string, boolean> | null;
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
