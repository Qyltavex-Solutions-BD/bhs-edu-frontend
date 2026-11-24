import {
  AcademicDocumentType,
  AcademicEventType,
  BookType,
  SubjectCategory,
} from '../enums';

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
  sections?: Section[];
  _count?: {
    sections?: number;
    enrollments?: number;
    classSubjects?: number;
  };
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

  // Joined relations from backend API
  academicYear?: {
    id: string;
    name: string;
    isActive: boolean;
  };
  schoolClass?: {
    id: string;
    name: string;
    nameBn?: string | null;
    numericValue: number;
  };
  subject?: {
    id: string;
    name: string;
    nameBn?: string | null;
    officialCode?: string | null;
    category?: SubjectCategory | string | null;
    displayOrder?: number;
  };
  group?: {
    id: string;
    name: string;
    nameBn?: string | null;
  } | null;
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
