import { WeekDay } from '../enums';

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
