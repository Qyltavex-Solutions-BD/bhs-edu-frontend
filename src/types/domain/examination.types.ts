import {
  ExamType,
  ExamStatus,
  ResultPublicationStatus,
  ExamRoutineStatus,
  ResultStatus,
} from '../enums';

export interface GradingScale {
  id: string;
  name: string;
  description?: string | null;
  maxGpa: number;
  optionalBonusThreshold?: number;
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
  academicYear?: {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  };
  schoolClass?: {
    id: string;
    name: string;
    nameBn?: string | null;
    numericValue?: number;
    isActive?: boolean;
  };
  gradingScale?: {
    id: string;
    name: string;
    maxGpa?: number | string;
    isDefault?: boolean;
    gradeRanges?: GradeRange[];
  };
  _count?: {
    examSubjects?: number;
    examRoutines?: number;
    subjectResults?: number;
  };
  examSubjects?: ExamSubject[];
  examRoutines?: any[];
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
  teacherRemarks?: string | null;
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

export interface ExamHallRoom {
  id: string;
  examId: string;
  roomNo: string;
  buildingName?: string | null;
  capacity: number;
  invigilatorStaffId?: string | null;
  assistantInvigilatorStaffId?: string | null;
  notes?: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type ScrutinyStatus = 'PENDING' | 'UNDER_REVIEW' | 'UPDATED' | 'NO_CHANGE';

export interface ResultScrutinyRequest {
  id: string;
  examId: string;
  studentEnrollmentId: string;
  examSubjectId: string;
  reason: string;
  status: ScrutinyStatus;
  previousTotalMarks: number;
  revisedWrittenMarks?: number | null;
  revisedMcqMarks?: number | null;
  revisedPracticalMarks?: number | null;
  revisedCaMarks?: number | null;
  revisedTotalMarks?: number | null;
  reviewerNote?: string | null;
  requestedAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
}
