import { createInitialSeed, type MockDatabase } from './seed';
import {
  AttendanceMethod,
  AttendanceSmsType,
  AttendanceStatus,
  BookType,
  CardStatus,
  EnrollmentStatus,
  NoticeStatus,
  PromotionType,
  RelationshipType,
  ResultPublicationStatus,
  ResultStatus,
  SmsStatus,
  StudentStatus,
} from '@/src/types/enums';
import type {
  AcademicGroup,
  AcademicYear,
  Book,
  ClassSubject,
  Exam,
  Mark,
  Notice,
  ResultSummary,
  SchoolClass,
  SchoolProfile,
  Section,
  Staff,
  Student,
  StudentEnrollment,
  StudentSubjectResult,
  StudentTransferCertificate,
  ClassRoutine,
  SyllabusChapterEntry,
  SyllabusFile,
} from '@/src/types/entities';
import type {
  AdmissionApplicationStatus,
  ClassAttendanceMethodConfig,
  OnlineAdmissionApplication,
} from '@/src/types/proposed/future';
import { calculateOverallGpa, resolveGradeFromScale } from '@/src/lib/formatters';

/**
 * Centralized Mock API Adapter
 * All demo data and stateful workflows live strictly here (never hardcoded inside components).
 * To switch to a real backend, set NEXT_PUBLIC_USE_MOCK_API=false and NEXT_PUBLIC_API_URL in .env.
 */

let db: MockDatabase = createInitialSeed();

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function sameName(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function saveAcademicYear(body: unknown): { data?: AcademicYear; error?: { status: number; message: string } } {
  const payload = body as Partial<AcademicYear>;
  const name = payload.name?.trim() ?? '';
  if (!name) {
    return { error: { status: 400, message: 'শিক্ষাবর্ষের নাম দিন। / Academic year name is required.' } };
  }
  if (!payload.startDate || !payload.endDate || payload.startDate >= payload.endDate) {
    return {
      error: {
        status: 400,
        message: 'শুরুর তারিখ শেষ তারিখের আগে হতে হবে। / Start date must be before the end date.',
      },
    };
  }
  const duplicate = db.academicYears.find((year) => sameName(year.name, name) && year.id !== payload.id);
  if (duplicate) {
    return {
      error: {
        status: 409,
        message: 'এই নামের শিক্ষাবর্ষ আছে। / An academic year with this name already exists.',
      },
    };
  }

  const wantActive = payload.isActive === true;
  if (payload.id) {
    const existing = db.academicYears.find((year) => year.id === payload.id);
    if (!existing) {
      return { error: { status: 404, message: 'শিক্ষাবর্ষ পাওয়া যায়নি। / Academic year not found.' } };
    }
    if (existing.isActive && payload.isActive === false) {
      return {
        error: {
          status: 400,
          message:
            'সক্রিয় শিক্ষাবর্ষ বন্ধ করা যায় না। আগে অন্য একটি বছর সক্রিয় করুন। / Activate another year before turning this one off.',
        },
      };
    }
    if (wantActive) {
      db.academicYears.forEach((year) => {
        year.isActive = false;
      });
    }
    existing.name = name;
    existing.startDate = payload.startDate;
    existing.endDate = payload.endDate;
    existing.isActive = wantActive || existing.isActive;
    existing.updatedAt = nowIso();
    addAudit('ACADEMIC_YEAR_UPDATE', 'Academic', `Updated academic year ${existing.name}.`);
    return { data: clone(existing) };
  }

  const noActiveYear = db.academicYears.every((year) => !year.isActive);
  const isActive = wantActive || noActiveYear;
  if (isActive) {
    db.academicYears.forEach((year) => {
      year.isActive = false;
    });
  }
  const created: AcademicYear = {
    id: uid('ay'),
    name,
    startDate: payload.startDate,
    endDate: payload.endDate,
    isActive,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.academicYears.unshift(created);
  addAudit('ACADEMIC_YEAR_CREATE', 'Academic', `Created academic year ${created.name}.`);
  return { data: clone(created) };
}

function setActiveAcademicYear(body: unknown): { data?: AcademicYear; error?: { status: number; message: string } } {
  const { id } = body as { id?: string };
  const year = db.academicYears.find((item) => item.id === id);
  if (!year) {
    return { error: { status: 404, message: 'শিক্ষাবর্ষ পাওয়া যায়নি। / Academic year not found.' } };
  }
  db.academicYears.forEach((item) => {
    item.isActive = item.id === year.id;
    if (item.id === year.id) item.updatedAt = nowIso();
  });
  addAudit('ACADEMIC_YEAR_ACTIVATE', 'Academic', `Set ${year.name} as the active academic year.`);
  return { data: clone(year) };
}

function saveAcademicGroup(body: unknown): { data?: AcademicGroup; error?: { status: number; message: string } } {
  const payload = body as Partial<AcademicGroup>;
  const name = payload.name?.trim() ?? '';
  const nameBn = payload.nameBn?.trim() || undefined;
  if (!name) {
    return { error: { status: 400, message: 'বিভাগের ইংরেজি নাম দিন। / Group name is required.' } };
  }
  const duplicate = db.academicGroups.find(
    (group) =>
      group.id !== payload.id &&
      (sameName(group.name, name) || (nameBn && group.nameBn && sameName(group.nameBn, nameBn)))
  );
  if (duplicate) {
    return {
      error: {
        status: 409,
        message: 'এই নামের বিভাগ আছে। / An academic group with this name already exists.',
      },
    };
  }
  if (payload.id) {
    const existing = db.academicGroups.find((group) => group.id === payload.id);
    if (!existing) {
      return { error: { status: 404, message: 'বিভাগ পাওয়া যায়নি। / Academic group not found.' } };
    }
    existing.name = name;
    existing.nameBn = nameBn;
    existing.description = payload.description?.trim() || null;
    existing.isActive = payload.isActive ?? existing.isActive;
    existing.updatedAt = nowIso();
    addAudit('ACADEMIC_GROUP_UPDATE', 'Academic', `Updated academic group ${existing.name}.`);
    return { data: clone(existing) };
  }
  const created: AcademicGroup = {
    id: uid('grp'),
    name,
    nameBn,
    description: payload.description?.trim() || null,
    isActive: payload.isActive ?? true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.academicGroups.push(created);
  addAudit('ACADEMIC_GROUP_CREATE', 'Academic', `Created academic group ${created.name}.`);
  return { data: clone(created) };
}

function saveSchoolClass(
  body: unknown
): { data?: SchoolClass; error?: { status: number; message: string } } {
  const payload = body as Partial<SchoolClass> & { sectionNames?: string[] };
  const name = payload.name?.trim() ?? '';
  const nameBn = payload.nameBn?.trim() || undefined;
  const numericValue = Number(payload.numericValue);
  if (!name) {
    return { error: { status: 400, message: 'শ্রেণির ইংরেজি নাম দিন। / Class name is required.' } };
  }
  if (!Number.isInteger(numericValue) || numericValue < 1 || numericValue > 12) {
    return {
      error: {
        status: 400,
        message: 'শ্রেণির নম্বর ১ থেকে ১২ এর পূর্ণসংখ্যা হতে হবে। / Class number must be a whole number from 1 to 12.',
      },
    };
  }
  const duplicate = db.classes.find(
    (schoolClass) =>
      schoolClass.id !== payload.id &&
      (sameName(schoolClass.name, name) ||
        (nameBn && schoolClass.nameBn && sameName(schoolClass.nameBn, nameBn)) ||
        schoolClass.numericValue === numericValue)
  );
  if (duplicate) {
    return {
      error: {
        status: 409,
        message: 'এই নাম বা শ্রেণি নম্বর আগে থেকে আছে। / A class with this name or number already exists.',
      },
    };
  }

  if (payload.id) {
    const existing = db.classes.find((schoolClass) => schoolClass.id === payload.id);
    if (!existing) {
      return { error: { status: 404, message: 'শ্রেণি পাওয়া যায়নি। / Class not found.' } };
    }
    existing.name = name;
    existing.nameBn = nameBn;
    existing.numericValue = numericValue;
    existing.isActive = payload.isActive ?? existing.isActive;
    existing.updatedAt = nowIso();
    addAudit('CLASS_UPDATE', 'Academic', `Updated class ${existing.name}.`);
    return { data: clone(existing) };
  }

  const sectionNames = (payload.sectionNames ?? [])
    .map((sectionName) => sectionName.trim())
    .filter(Boolean);
  const uniqueSectionNames = new Set(sectionNames.map((sectionName) => sectionName.toLowerCase()));
  if (uniqueSectionNames.size !== sectionNames.length) {
    return {
      error: {
        status: 409,
        message: 'একই শ্রেণিতে একই শাখার নাম দুবার দেওয়া যাবে না। / Section names must be unique within the class.',
      },
    };
  }

  const created: SchoolClass = {
    id: uid('cls'),
    name,
    nameBn,
    numericValue,
    isActive: payload.isActive ?? true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.classes.push(created);
  sectionNames.forEach((sectionName) => {
    db.sections.push({
      id: uid('sec'),
      classId: created.id,
      name: sectionName,
      isActive: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  });
  db.classes.sort((a, b) => a.numericValue - b.numericValue);
  addAudit('CLASS_CREATE', 'Academic', `Created class ${created.name} with ${sectionNames.length} section(s).`);
  return { data: clone(created) };
}

function saveSection(body: unknown): { data?: Section; error?: { status: number; message: string } } {
  const payload = body as Partial<Section>;
  const name = payload.name?.trim() ?? '';
  if (!payload.classId) {
    return { error: { status: 400, message: 'শাখার জন্য শ্রেণি নির্বাচন করুন। / Choose a class for the section.' } };
  }
  if (!name) {
    return { error: { status: 400, message: 'শাখার নাম দিন। / Section name is required.' } };
  }
  const schoolClass = db.classes.find((item) => item.id === payload.classId);
  if (!schoolClass) {
    return { error: { status: 404, message: 'শ্রেণি পাওয়া যায়নি। / Class not found.' } };
  }
  const duplicate = db.sections.find(
    (section) =>
      section.id !== payload.id && section.classId === payload.classId && sameName(section.name, name)
  );
  if (duplicate) {
    return {
      error: {
        status: 409,
        message: `${schoolClass.nameBn ?? schoolClass.name} শ্রেণিতে "${name}" শাখা আছে। / This section name already exists in the class.`,
      },
    };
  }
  if (payload.id) {
    const existing = db.sections.find((section) => section.id === payload.id);
    if (!existing) {
      return { error: { status: 404, message: 'শাখা পাওয়া যায়নি। / Section not found.' } };
    }
    existing.classId = payload.classId;
    existing.name = name;
    existing.isActive = payload.isActive ?? existing.isActive;
    existing.updatedAt = nowIso();
    addAudit('SECTION_UPDATE', 'Academic', `Updated section ${existing.name} in ${schoolClass.name}.`);
    return { data: clone(existing) };
  }
  const created: Section = {
    id: uid('sec'),
    classId: payload.classId,
    name,
    isActive: payload.isActive ?? true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.sections.push(created);
  addAudit('SECTION_CREATE', 'Academic', `Created section ${created.name} in ${schoolClass.name}.`);
  return { data: clone(created) };
}

function classSubjectKey(item: { classId: string; subjectId: string; groupId?: string | null }) {
  return `${item.classId}|${item.subjectId}|${item.groupId ?? ''}`;
}

function saveClassSubject(body: unknown): { data?: ClassSubject; error?: { status: number; message: string } } {
  const payload = body as Partial<ClassSubject>;
  const year = db.academicYears.find((item) => item.id === payload.academicYearId);
  const schoolClass = db.classes.find((item) => item.id === payload.classId);
  const subject = db.subjects.find((item) => item.id === payload.subjectId);
  if (!year) return { error: { status: 404, message: 'শিক্ষাবর্ষ পাওয়া যায়নি। / Academic year not found.' } };
  if (!schoolClass) return { error: { status: 404, message: 'শ্রেণি পাওয়া যায়নি। / Class not found.' } };
  if (!subject || !subject.isActive) {
    return { error: { status: 404, message: 'বিষয় পাওয়া যায়নি। / Subject not found.' } };
  }

  const usesGroup = schoolClass.numericValue >= 9;
  const groupId = usesGroup ? payload.groupId || null : null;
  if (!usesGroup && payload.groupId) {
    return {
      error: {
        status: 400,
        message: '৬ষ্ঠ–৮ম শ্রেণিতে বিভাগ বসানো যায় না। / Groups apply only to classes 9 and 10.',
      },
    };
  }
  if (groupId) {
    const group = db.academicGroups.find((item) => item.id === groupId && item.isActive);
    if (!group) return { error: { status: 404, message: 'বিভাগ পাওয়া যায়নি। / Academic group not found.' } };
  }

  const duplicate = db.classSubjects.find(
    (item) =>
      item.id !== payload.id &&
      item.academicYearId === year.id &&
      classSubjectKey(item) === classSubjectKey({ classId: schoolClass.id, subjectId: subject.id, groupId })
  );
  if (duplicate) {
    return {
      error: {
        status: 409,
        message: 'এই বিষয় এই শ্রেণি ও বিভাগে আগে থেকে আছে। / This subject is already assigned for this class and group.',
      },
    };
  }

  if (payload.id) {
    const existing = db.classSubjects.find((item) => item.id === payload.id);
    if (!existing) return { error: { status: 404, message: 'পাঠ্যক্রমের বিষয় পাওয়া যায়নি। / Class subject not found.' } };
    existing.isOptional = payload.isOptional ?? existing.isOptional;
    existing.displayOrder = payload.displayOrder ?? existing.displayOrder;
    existing.isActive = payload.isActive ?? existing.isActive;
    existing.updatedAt = nowIso();
    addAudit('CLASS_SUBJECT_UPDATE', 'Academic', `Updated ${subject.name} on ${schoolClass.name} for ${year.name}.`);
    return { data: clone(existing) };
  }

  const created: ClassSubject = {
    id: uid('cs'),
    academicYearId: year.id,
    classId: schoolClass.id,
    subjectId: subject.id,
    groupId,
    isOptional: payload.isOptional ?? false,
    displayOrder: payload.displayOrder ?? 0,
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.classSubjects.push(created);
  addAudit('CLASS_SUBJECT_ASSIGN', 'Academic', `Assigned ${subject.name} to ${schoolClass.name} for ${year.name}.`);
  return { data: clone(created) };
}

function removeClassSubject(body: unknown): { data?: { deletedId: string }; error?: { status: number; message: string } } {
  const { id } = body as { id?: string };
  const existing = db.classSubjects.find((item) => item.id === id);
  if (!existing) return { error: { status: 404, message: 'পাঠ্যক্রমের বিষয় পাওয়া যায়নি। / Class subject not found.' } };
  const used = db.teacherAssignments.some((item) => item.classSubjectId === existing.id);
  if (used) {
    return {
      error: {
        status: 400,
        message: 'এই বিষয়ে শিক্ষক বণ্টন আছে। আগে বণ্টন সরান, অথবা বিষয়টি বন্ধ করুন। / A teacher is assigned to this subject. Remove that assignment, or deactivate the subject.',
      },
    };
  }
  db.classSubjects = db.classSubjects.filter((item) => item.id !== existing.id);
  addAudit('CLASS_SUBJECT_REMOVE', 'Academic', `Removed class subject ${existing.id}.`);
  return { data: { deletedId: existing.id } };
}

function rolloverClassSubjects(body: unknown): {
  data?: { copiedCount: number; skippedCount: number };
  error?: { status: number; message: string };
} {
  const { fromAcademicYearId, toAcademicYearId } = body as {
    fromAcademicYearId?: string;
    toAcademicYearId?: string;
  };
  if (!fromAcademicYearId || !toAcademicYearId || fromAcademicYearId === toAcademicYearId) {
    return {
      error: {
        status: 400,
        message: 'কপি করার উৎস ও গন্তব্য শিক্ষাবর্ষ আলাদা হতে হবে। / Choose two different academic years.',
      },
    };
  }
  const fromYear = db.academicYears.find((item) => item.id === fromAcademicYearId);
  const toYear = db.academicYears.find((item) => item.id === toAcademicYearId);
  if (!fromYear || !toYear) {
    return { error: { status: 404, message: 'শিক্ষাবর্ষ পাওয়া যায়নি। / Academic year not found.' } };
  }
  const source = db.classSubjects.filter((item) => item.academicYearId === fromYear.id && item.isActive);
  if (source.length === 0) {
    return {
      error: {
        status: 400,
        message: `${fromYear.name} বছরে কপি করার মতো সক্রিয় বিষয় নেই। / No active subjects to copy.`,
      },
    };
  }
  const existingKeys = new Set(
    db.classSubjects.filter((item) => item.academicYearId === toYear.id).map((item) => classSubjectKey(item))
  );
  const toCopy = source.filter((item) => !existingKeys.has(classSubjectKey(item)));
  toCopy.forEach((item) => {
    db.classSubjects.push({
      ...item,
      id: uid('cs'),
      academicYearId: toYear.id,
      isActive: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  });
  addAudit(
    'CLASS_SUBJECT_ROLLOVER',
    'Academic',
    `Copied ${toCopy.length} subjects from ${fromYear.name} to ${toYear.name}.`
  );
  return { data: { copiedCount: toCopy.length, skippedCount: source.length - toCopy.length } };
}

function saveBook(body: unknown): { data?: Book; error?: { status: number; message: string } } {
  const payload = body as Partial<Book> & { academicYearId?: string };
  const name = payload.name?.trim() ?? '';
  const schoolClass = db.classes.find((item) => item.id === payload.classId);
  const subject = db.subjects.find((item) => item.id === payload.subjectId);
  if (!schoolClass) return { error: { status: 404, message: 'শ্রেণি পাওয়া যায়নি। / Class not found.' } };
  if (!subject) return { error: { status: 404, message: 'বিষয় পাওয়া যায়নি। / Subject not found.' } };
  if (!name) return { error: { status: 400, message: 'বইয়ের নাম দিন। / Book name is required.' } };
  if (payload.academicYearId) {
    const onCurriculum = db.classSubjects.some(
      (item) =>
        item.academicYearId === payload.academicYearId &&
        item.classId === schoolClass.id &&
        item.subjectId === subject.id &&
        item.isActive
    );
    if (!onCurriculum) {
      return {
        error: {
          status: 400,
          message: 'আগে এই শ্রেণির পাঠ্যক্রমে বিষয়টি যুক্ত করুন। / Assign this subject to the class for the selected year first.',
        },
      };
    }
  }
  const duplicate = db.books.find(
    (book) =>
      book.id !== payload.id &&
      book.classId === schoolClass.id &&
      book.subjectId === subject.id &&
      sameName(book.name, name)
  );
  if (duplicate) {
    return {
      error: { status: 409, message: 'এই শ্রেণি ও বিষয়ে একই নামের বই আছে। / This book is already listed for the class and subject.' },
    };
  }
  const type = Object.values(BookType).includes(payload.type as BookType) ? (payload.type as BookType) : BookType.TEXTBOOK;
  if (payload.id) {
    const existing = db.books.find((book) => book.id === payload.id);
    if (!existing) return { error: { status: 404, message: 'বই পাওয়া যায়নি। / Book not found.' } };
    existing.name = name;
    existing.bookCode = payload.bookCode?.trim() || null;
    existing.type = type;
    existing.isActive = payload.isActive ?? existing.isActive;
    existing.updatedAt = nowIso();
    addAudit('BOOK_UPDATE', 'Academic', `Updated book ${existing.name}.`);
    return { data: clone(existing) };
  }
  const created: Book = {
    id: uid('bk'),
    classId: schoolClass.id,
    subjectId: subject.id,
    name,
    bookCode: payload.bookCode?.trim() || null,
    type,
    displayOrder: payload.displayOrder ?? 0,
    isActive: payload.isActive ?? true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.books.push(created);
  addAudit('BOOK_CREATE', 'Academic', `Added book ${created.name} for ${schoolClass.name}.`);
  return { data: clone(created) };
}

function addAudit(action: string, module: string, details: string, userId = 'user-admin') {
  db.auditLogs.unshift({
    id: uid('aud'),
    userId,
    action,
    module,
    details,
    ipAddress: '103.112.54.18',
    createdAt: nowIso(),
  });
}

export function getDbSnapshot(): MockDatabase {
  return clone(db);
}

export function resetMockDb(): MockDatabase {
  db = createInitialSeed();
  return clone(db);
}

export async function handleMockRequest(
  endpoint: string,
  method: string = 'GET',
  body?: unknown
): Promise<{ data?: unknown; error?: { status: number; message: string } }> {
  // Subtle realistic latency without slowing down interactions
  await new Promise((r) => setTimeout(r, 45));

  try {
    // 1. Full state bootstrap (convenient read endpoint for portals & public views)
    if (endpoint === '/bootstrap' && method === 'GET') {
      return { data: clone(db) };
    }

    // 2. Public Result Lookup (strictly PUBLISHED only; polite message for WITHHELD; never exposes private PII)
    if (endpoint === '/public/results/search' && method === 'POST') {
      const { examId, classId, roll, studentIdOrReg } = body as {
        examId: string;
        classId: string;
        roll?: string;
        studentIdOrReg?: string;
      };
      const exam = db.exams.find((e) => e.id === examId && !e.isDeleted);
      if (!exam) return { error: { status: 404, message: 'পরীক্ষাটি পাওয়া যায়নি / Exam not found.' } };

      if (exam.resultStatus === ResultPublicationStatus.WITHHELD) {
        return {
          data: {
            status: 'WITHHELD',
            messageBn: 'এই পরীক্ষার ফলাফল বর্তমানে কর্তৃপক্ষ কর্তৃক স্থগিত (Withheld) রাখা হয়েছে। অনুগ্রহ করে বিদ্যালয় অফিসে যোগাযোগ করুন।',
            messageEn: 'Results for this examination are currently withheld by the school authority. Please contact the school office.',
          },
        };
      }

      if (exam.resultStatus !== ResultPublicationStatus.PUBLISHED) {
        return {
          data: {
            status: 'NOT_PUBLISHED',
            messageBn: 'এই পরীক্ষার ফলাফল এখনো প্রকাশিত হয়নি।',
            messageEn: 'Results for this examination have not been published yet.',
          },
        };
      }

      const matchingEnr = db.enrollments.find((enr) => {
        if (enr.classId !== classId || enr.academicYearId !== exam.academicYearId) return false;
        const stu = db.students.find((s) => s.id === enr.studentId);
        if (!stu) return false;
        if (roll && String(enr.roll) === String(roll).trim()) return true;
        if (
          studentIdOrReg &&
          (stu.studentId.toLowerCase() === studentIdOrReg.trim().toLowerCase() ||
            stu.boardRegistrationNo === studentIdOrReg.trim())
        ) {
          return true;
        }
        return false;
      });

      if (!matchingEnr) {
        return {
          data: {
            status: 'NOT_FOUND',
            messageBn: 'প্রদত্ত রোল বা আইডি নম্বরে কোনো শিক্ষার্থীর প্রকাশিত ফলাফল পাওয়া যায়নি।',
            messageEn: 'No published result matched the provided roll number or student ID.',
          },
        };
      }

      const summary = db.resultSummaries.find(
        (rs) => rs.examId === exam.id && rs.studentEnrollmentId === matchingEnr.id
      );
      if (!summary) {
        return {
          data: {
            status: 'NOT_FOUND',
            messageBn: 'এই শিক্ষার্থীর ফলাফল এখনো প্রক্রিয়াকরণ করা হয়নি।',
            messageEn: 'Result summary is not available for this student yet.',
          },
        };
      }

      const stu = db.students.find((s) => s.id === matchingEnr.studentId)!;
      const cls = db.classes.find((c) => c.id === matchingEnr.classId)!;
      const sec = db.sections.find((s) => s.id === matchingEnr.sectionId)!;
      const grp = db.academicGroups.find((g) => g.id === matchingEnr.groupId) ?? null;
      const year = db.academicYears.find((y) => y.id === matchingEnr.academicYearId)!;

      const subjectRows = db.studentSubjectResults
        .filter((ssr) => ssr.examId === exam.id && ssr.studentEnrollmentId === matchingEnr.id)
        .map((ssr) => {
          const es = db.examSubjects.find((x) => x.id === ssr.examSubjectId)!;
          const sub = db.subjects.find((x) => x.id === es.subjectId)!;
          const mk = db.marks.find(
            (m) => m.examSubjectId === es.id && m.studentEnrollmentId === matchingEnr.id
          );
          return {
            subjectCode: sub.officialCode ?? '',
            subjectName: sub.name,
            subjectNameBn: sub.nameBn ?? sub.name,
            fullMarks: es.fullMarks,
            writtenMarks: mk?.writtenMarks ?? 0,
            mcqMarks: mk?.mcqMarks ?? 0,
            practicalMarks: mk?.practicalMarks ?? 0,
            totalMarks: ssr.totalMarks,
            letterGrade: ssr.letterGrade,
            gradePoint: ssr.gradePoint,
            isPassed: ssr.isPassed,
            isOptional: ssr.isOptional,
            bonusGradePoint: ssr.bonusGradePoint ?? 0,
            isAbsent: ssr.isAbsent,
          };
        });

      // Return ONLY public-safe student metadata (no address, NID, birth cert, or parent phone!)
      return {
        data: {
          status: 'FOUND',
          resultId: summary.id,
          exam: { id: exam.id, name: exam.name, examType: exam.examType, publishedAt: exam.publishedAt },
          student: {
            studentId: stu.studentId,
            nameEn: stu.nameEn,
            nameBn: stu.nameBn,
            roll: matchingEnr.roll,
            className: cls.name,
            classNameBn: cls.nameBn ?? cls.name,
            sectionName: sec.name,
            groupName: grp?.name ?? null,
            groupNameBn: grp?.nameBn ?? null,
            academicYear: year.name,
          },
          summary: clone(summary),
          subjects: subjectRows,
        },
      };
    }

    // 3. Submit Online Admission Application (BACKEND-PENDING mock)
    if (endpoint === '/public/admissions' && method === 'POST') {
      const payload = body as Omit<
        OnlineAdmissionApplication,
        'id' | 'applicationNumber' | 'status' | 'submittedAt' | 'admissionTestRoll' | 'admissionTestDate'
      >;
      const seq = String(db.onlineAdmissions.length + 1).padStart(3, '0');
      const created: OnlineAdmissionApplication = {
        ...payload,
        id: uid('app'),
        applicationNumber: `ADM-2027-${seq}`,
        status: 'NEW',
        submittedAt: nowIso(),
        admissionTestRoll: `270${seq}`,
        admissionTestDate: db.admissionContent.admissionTestDate ?? '2026-12-24',
      };
      db.onlineAdmissions.unshift(created);
      db.notifications.unshift({
        id: uid('ntf'),
        type: 'ADMISSION',
        titleBn: `নতুন ভর্তি আবেদন: ${created.applicationNumber}`,
        titleEn: `New Admission Application: ${created.applicationNumber}`,
        bodyBn: `${created.studentNameBn} অনলাইন ভর্তি আবেদন জমা দিয়েছেন।`,
        bodyEn: `${created.studentNameEn} submitted an online admission application.`,
        createdAt: nowIso(),
        isRead: false,
        targetRoles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'],
        link: '/admin/students/admissions',
      });
      return { data: clone(created) };
    }

    // 4. Update Admission Application Status / One-Click Admit into Students
    if (endpoint === '/admin/admissions/status' && method === 'POST') {
      const { id, status } = body as { id: string; status: AdmissionApplicationStatus };
      const app = db.onlineAdmissions.find((a) => a.id === id);
      if (!app) return { error: { status: 404, message: 'Application not found' } };
      app.status = status;

      if (status === 'ADMITTED') {
        const stuId = uid('stu');
        const nextNum = db.students.length + 1;
        const newStudent: Student = {
          id: stuId,
          studentId: `BHS-2026-${String(2000 + nextNum)}`,
          birthCertificateNo: app.birthCertificateNo,
          nameEn: app.studentNameEn,
          nameBn: app.studentNameBn,
          dateOfBirth: app.dateOfBirth,
          gender: app.gender,
          religion: app.religion,
          presentAddress: app.presentAddress,
          permanentAddress: app.permanentAddress,
          admissionDate: nowIso().slice(0, 10),
          status: StudentStatus.ACTIVE,
          previousSchoolName: app.previousSchoolName,
          previousGrade: app.previousGrade,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        db.students.unshift(newStudent);

        const targetSection =
          db.sections.find((s) => s.classId === app.targetClassId) ?? db.sections[0];
        const existingRolls = db.enrollments
          .filter((e) => e.classId === app.targetClassId && e.sectionId === targetSection.id)
          .map((e) => e.roll);
        const nextRoll = existingRolls.length ? Math.max(...existingRolls) + 1 : 1;

        db.enrollments.unshift({
          id: uid('enr'),
          studentId: stuId,
          academicYearId: 'ay-2026',
          classId: app.targetClassId,
          sectionId: targetSection.id,
          groupId: app.targetGroupId ?? null,
          roll: nextRoll,
          enrollmentDate: nowIso().slice(0, 10),
          isRepeater: false,
          isReadmission: app.isReadmission,
          status: EnrollmentStatus.ACTIVE,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });

        const parId = uid('par');
        db.parents.unshift({
          id: parId,
          name: app.fatherNameEn,
          nameBn: app.fatherNameBn,
          phone: app.guardianPhone,
          nid: app.fatherNid,
          occupation: app.fatherOccupation,
          address: app.presentAddress,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
        db.parentStudents.unshift({
          id: uid('ps'),
          parentId: parId,
          studentId: stuId,
          relationship: RelationshipType.FATHER,
          isPrimary: true,
          isEmergencyContact: true,
          isSmsReceiver: true,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
        addAudit('ADMISSION_ADMIT', 'Students', `Admitted applicant ${app.applicationNumber} (${app.studentNameEn}) with roll ${nextRoll}.`);
      }
      return { data: clone(app) };
    }

    // 5. Update School Profile
    if (endpoint === '/admin/institution/profile' && method === 'PUT') {
      db.schoolProfile = { ...db.schoolProfile, ...(body as Partial<SchoolProfile>), updatedAt: nowIso() };
      addAudit('PROFILE_UPDATE', 'Institution', 'Updated official school profile configuration.');
      return { data: clone(db.schoolProfile) };
    }

    // 6. Save Marks Batch (Admin or Teacher)
    if (endpoint === '/exams/marks/batch' && method === 'POST') {
      const { examId, examSubjectId, entries, enteredBy } = body as {
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
      };
      const exam = db.exams.find((e) => e.id === examId);
      const es = db.examSubjects.find((x) => x.id === examSubjectId);
      if (!exam || !es) return { error: { status: 404, message: 'Exam or subject not found' } };
      if (exam.isLocked) {
        return { error: { status: 400, message: 'পরীক্ষাটি লক করা আছে; নম্বর পরিবর্তন করা যাবে না।' } };
      }
      if (exam.marksEntryDeadline && new Date(exam.marksEntryDeadline) < new Date()) {
        return { error: { status: 400, message: 'নম্বর এন্ট্রির সময়সীমা অতিক্রান্ত হয়েছে।' } };
      }

      entries.forEach((entry) => {
        const total = entry.isAbsent
          ? 0
          : entry.writtenMarks +
            entry.mcqMarks +
            entry.practicalMarks +
            entry.continuousAssessmentMarks;
        const existing = db.marks.find(
          (m) =>
            m.studentEnrollmentId === entry.studentEnrollmentId &&
            m.examSubjectId === examSubjectId
        );
        if (existing) {
          existing.writtenMarks = entry.isAbsent ? 0 : entry.writtenMarks;
          existing.mcqMarks = entry.isAbsent ? 0 : entry.mcqMarks;
          existing.practicalMarks = entry.isAbsent ? 0 : entry.practicalMarks;
          existing.continuousAssessmentMarks = entry.isAbsent ? 0 : entry.continuousAssessmentMarks;
          existing.totalMarks = total;
          existing.isAbsent = entry.isAbsent;
          existing.enteredBy = enteredBy;
          existing.updatedAt = nowIso();
        } else {
          const mk: Mark = {
            id: uid('mk'),
            studentEnrollmentId: entry.studentEnrollmentId,
            examSubjectId,
            writtenMarks: entry.isAbsent ? 0 : entry.writtenMarks,
            mcqMarks: entry.isAbsent ? 0 : entry.mcqMarks,
            practicalMarks: entry.isAbsent ? 0 : entry.practicalMarks,
            continuousAssessmentMarks: entry.isAbsent ? 0 : entry.continuousAssessmentMarks,
            totalMarks: total,
            isAbsent: entry.isAbsent,
            isLocked: false,
            enteredBy,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          };
          db.marks.push(mk);
        }
      });

      addAudit('MARKS_SAVE', 'Examinations', `Saved ${entries.length} mark entries for exam ${exam.name}.`, enteredBy);
      return { data: { savedCount: entries.length } };
    }

    // 7. Process Results + Lock / Publish / Withhold Exam (End-to-End Result Flow!)
    if (endpoint === '/exams/process-results' && method === 'POST') {
      const { examId, action } = body as {
        examId: string;
        action: 'CALCULATE' | 'PUBLISH' | 'WITHHOLD' | 'LOCK' | 'UNLOCK';
      };
      const exam = db.exams.find((e) => e.id === examId);
      if (!exam) return { error: { status: 404, message: 'Exam not found' } };

      if (action === 'LOCK') {
        exam.isLocked = true;
        db.marks
          .filter((m) => db.examSubjects.some((es) => es.id === m.examSubjectId && es.examId === examId))
          .forEach((m) => (m.isLocked = true));
        addAudit('EXAM_LOCK', 'Examinations', `Locked marks for ${exam.name}`);
        return { data: clone(exam) };
      }

      if (action === 'UNLOCK') {
        exam.isLocked = false;
        db.marks
          .filter((m) => db.examSubjects.some((es) => es.id === m.examSubjectId && es.examId === examId))
          .forEach((m) => (m.isLocked = false));
        addAudit('EXAM_UNLOCK', 'Examinations', `Unlocked marks for ${exam.name}`);
        return { data: clone(exam) };
      }

      if (action === 'WITHHOLD') {
        exam.resultStatus = ResultPublicationStatus.WITHHELD;
        exam.updatedAt = nowIso();
        addAudit('RESULT_WITHHOLD', 'Results', `Withheld results for ${exam.name}`);
        return { data: clone(exam) };
      }

      // CALCULATE or PUBLISH: recompute StudentSubjectResult & ResultSummary from live Marks + GradingScale!
      const scale = db.gradingScales.find((g) => g.id === exam.gradingScaleId) ?? db.gradingScales[0];
      const ranges = db.gradeRanges.filter((r) => r.gradingScaleId === scale.id && !r.isDeleted);
      const examSubs = db.examSubjects.filter((es) => es.examId === exam.id);
      const classEnrs = db.enrollments.filter(
        (enr) => enr.classId === exam.classId && enr.academicYearId === exam.academicYearId
      );

      // Clear previous computed results for this exam
      db.studentSubjectResults = db.studentSubjectResults.filter((r) => r.examId !== exam.id);
      db.resultSummaries = db.resultSummaries.filter((r) => r.examId !== exam.id);

      const generatedSummaries: ResultSummary[] = [];
      classEnrs.forEach((enr) => {
        const applicable = examSubs.filter((es) => !es.groupId || es.groupId === enr.groupId);
        const subResults: StudentSubjectResult[] = [];
        let totalFull = 0;
        let totalObtained = 0;
        let missingMarks = false;

        applicable.forEach((es) => {
          const mk = db.marks.find(
            (m) => m.studentEnrollmentId === enr.id && m.examSubjectId === es.id
          );
          if (!mk) {
            missingMarks = true;
            return;
          }
          const g = resolveGradeFromScale(mk.totalMarks, es.fullMarks, ranges, mk.isAbsent, es.passMarks);
          const bonus = es.isOptional && g.isPassed ? Math.max(0, g.gradePoint - 2.0) : 0;
          const ssr: StudentSubjectResult = {
            id: uid('ssr'),
            studentEnrollmentId: enr.id,
            examId: exam.id,
            examSubjectId: es.id,
            totalMarks: mk.totalMarks,
            letterGrade: g.letterGrade,
            gradePoint: g.gradePoint,
            isPassed: g.isPassed,
            isOptional: es.isOptional,
            bonusGradePoint: bonus,
            isAbsent: mk.isAbsent,
            calculatedAt: nowIso(),
          };
          db.studentSubjectResults.push(ssr);
          subResults.push(ssr);
          totalFull += es.fullMarks;
          totalObtained += mk.totalMarks;
        });

        const overall = calculateOverallGpa(
          subResults.map((r) => ({
            gradePoint: r.gradePoint ?? 0,
            isPassed: r.isPassed,
            isOptional: r.isOptional,
          })),
          scale,
          ranges
        );

        generatedSummaries.push({
          id: uid('res'),
          studentEnrollmentId: enr.id,
          examId: exam.id,
          totalFullMarks: totalFull,
          totalMarks: totalObtained,
          gpa: missingMarks && subResults.length === 0 ? null : overall.gpa,
          gpaWithoutOptional: missingMarks && subResults.length === 0 ? null : overall.gpaWithoutOptional,
          letterGrade: missingMarks && subResults.length === 0 ? null : overall.letterGrade,
          meritPosition: null,
          sectionMeritPosition: null,
          failedSubjectCount: overall.failedSubjectCount,
          resultStatus:
            missingMarks && subResults.length === 0
              ? ResultStatus.INCOMPLETE
              : overall.isPassed
                ? ResultStatus.PASS
                : ResultStatus.FAIL,
          publishedAt: action === 'PUBLISH' ? nowIso() : null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
      });

      const passed = generatedSummaries
        .filter((s) => s.resultStatus === ResultStatus.PASS)
        .sort((a, b) => (b.gpa ?? 0) - (a.gpa ?? 0) || b.totalMarks - a.totalMarks);
      passed.forEach((s, idx) => (s.meritPosition = idx + 1));

      const bySec = new Map<string, ResultSummary[]>();
      passed.forEach((s) => {
        const enr = db.enrollments.find((e) => e.id === s.studentEnrollmentId);
        if (!enr) return;
        const arr = bySec.get(enr.sectionId) ?? [];
        arr.push(s);
        bySec.set(enr.sectionId, arr);
      });
      bySec.forEach((arr) => arr.forEach((s, idx) => (s.sectionMeritPosition = idx + 1)));

      db.resultSummaries.push(...generatedSummaries);

      if (action === 'PUBLISH') {
        exam.resultStatus = ResultPublicationStatus.PUBLISHED;
        exam.publishedAt = nowIso();
        exam.isLocked = true;
        exam.status = 'COMPLETED' as Exam['status'];
        db.notifications.unshift({
          id: uid('ntf'),
          type: 'RESULT_PUBLISHED',
          titleBn: `${exam.name} এর ফলাফল প্রকাশিত হয়েছে`,
          titleEn: `Results published for ${exam.name}`,
          bodyBn: 'এখন পাবলিক ফলাফল ও পোর্টাল থেকে মার্কশিট দেখা যাবে।',
          bodyEn: 'Marksheets are now live on public result search and portals.',
          createdAt: nowIso(),
          isRead: false,
          targetRoles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT'],
          link: '/results',
        });
        addAudit('RESULT_PUBLISH', 'Results', `Processed & published ${generatedSummaries.length} results for ${exam.name}.`);
      } else {
        addAudit('RESULT_CALCULATE', 'Results', `Calculated preview results (${generatedSummaries.length} students) for ${exam.name}.`);
      }

      return { data: { exam: clone(exam), processedCount: generatedSummaries.length } };
    }

    // 8. Save Daily Attendance Batch + Auto-Dispatch SMS
    if (endpoint === '/attendance/batch' && method === 'POST') {
      const { date, entries, markedBy } = body as {
        date: string;
        markedBy: string;
        entries: Array<{
          studentEnrollmentId: string;
          status: AttendanceStatus;
          method: AttendanceMethod;
          remarks?: string;
        }>;
      };

      let smsQueued = 0;
      entries.forEach((e) => {
        const existing = db.attendances.find(
          (a) => a.studentEnrollmentId === e.studentEnrollmentId && a.date === date
        );
        let attId = existing?.id ?? uid('att');
        if (existing) {
          existing.status = e.status;
          existing.method = e.method;
          existing.remarks = e.remarks ?? existing.remarks;
          existing.markedBy = markedBy;
          existing.updatedAt = nowIso();
        } else {
          db.attendances.push({
            id: attId,
            studentEnrollmentId: e.studentEnrollmentId,
            date,
            inTime: e.status === AttendanceStatus.PRESENT ? `${date}T09:55:00` : e.status === AttendanceStatus.LATE ? `${date}T10:25:00` : null,
            status: e.status,
            method: e.method,
            remarks: e.remarks,
            markedBy,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          });
        }

        if (e.status === AttendanceStatus.ABSENT) {
          const enr = db.enrollments.find((x) => x.id === e.studentEnrollmentId);
          const stu = enr ? db.students.find((s) => s.id === enr.studentId) : null;
          const ps = stu ? db.parentStudents.find((p) => p.studentId === stu.id && p.isSmsReceiver) : null;
          const par = ps ? db.parents.find((p) => p.id === ps.parentId) : null;
          if (stu && par) {
            db.attendanceSmsLogs.unshift({
              id: uid('sms'),
              attendanceId: attId,
              parentId: par.id,
              smsType: AttendanceSmsType.ABSENT,
              phone: par.phone,
              message: `প্রিয় অভিভাবক, আপনার সন্তান ${stu.nameBn ?? stu.nameEn} আজ (${date}) বিদ্যালয়ে অনুপস্থিত। - ভোজেশ্বর উচ্চ বিদ্যালয়`,
              status: SmsStatus.SENT,
              sentAt: nowIso(),
              createdAt: nowIso(),
            });
            smsQueued++;
          }
        }
      });

      addAudit('ATTENDANCE_MARK', 'Attendance', `Marked attendance for ${entries.length} students on ${date} (${smsQueued} absent SMS queued).`, markedBy);
      return { data: { saved: entries.length, smsQueued } };
    }

    // 9. Retry Failed SMS
    if (endpoint === '/attendance/sms/retry' && method === 'POST') {
      const { id } = body as { id: string };
      const sms = db.attendanceSmsLogs.find((s) => s.id === id);
      if (!sms) return { error: { status: 404, message: 'SMS log not found' } };
      sms.status = SmsStatus.SENT;
      sms.sentAt = nowIso();
      return { data: clone(sms) };
    }

    // 10. Update Configurable Attendance Method per Class (Class 10 RFID vs Classes 6-9 Manual)
    if (endpoint === '/attendance/config' && method === 'PUT') {
      const updated = body as ClassAttendanceMethodConfig;
      const idx = db.classAttendanceConfigs.findIndex((c) => c.classId === updated.classId);
      if (idx >= 0) db.classAttendanceConfigs[idx] = updated;
      else db.classAttendanceConfigs.push(updated);
      addAudit('ATTENDANCE_CONFIG', 'Attendance', `Updated attendance method for ${updated.classId} to ${updated.method}.`);
      return { data: clone(updated) };
    }

    // 11. Simulate Live RFID Scan (Integration-ready mock feed)
    if (endpoint === '/attendance/rfid/simulate' && method === 'POST') {
      const { cardNumber, direction } = body as { cardNumber: string; direction: 'ENTRY' | 'EXIT' };
      const card = db.rfidCards.find((c) => c.cardNumber === cardNumber && c.status === CardStatus.ACTIVE);
      const stu = card ? db.students.find((s) => s.id === card.studentId) : null;
      const enr = stu ? db.enrollments.find((e) => e.studentId === stu.id && e.academicYearId === 'ay-2026') : null;
      const cls = enr ? db.classes.find((c) => c.id === enr.classId) : null;
      const sec = enr ? db.sections.find((s) => s.id === enr.sectionId) : null;

      const scan = {
        id: uid('scan'),
        cardNumber,
        studentId: stu?.id ?? null,
        studentName: stu?.nameBn ?? stu?.nameEn ?? null,
        className: cls && sec ? `${cls.nameBn ?? cls.name} (${sec.name})` : null,
        scannedAt: nowIso(),
        deviceLocation: 'Main Gate Reader #1',
        direction,
        isKnownCard: Boolean(card && stu),
      };
      db.rfidScans.unshift(scan);
      return { data: clone(scan) };
    }

    // 12. Create Notice / Update Notice Status
    if (endpoint === '/notices' && method === 'POST') {
      const payload = body as Partial<Notice>;
      const notice: Notice = {
        id: uid('not'),
        memoNo:
          payload.memoNo?.trim() ||
          `ভউবি/নোটিশ/২০২৬/${String(db.notices.length + 85).padStart(3, '0')}`,
        title: payload.title ?? 'নতুন বিজ্ঞপ্তি',
        description: payload.description ?? '',
        attachment: payload.attachment ?? null,
        attachmentType: payload.attachmentType ?? (payload.attachment ? 'PDF' : 'OFFICIAL_PAD'),
        attachmentUrl: payload.attachmentUrl ?? null,
        attachmentSize: payload.attachmentSize ?? null,
        publishedAt: payload.status === NoticeStatus.PUBLISHED ? nowIso() : null,
        status: payload.status ?? NoticeStatus.DRAFT,
        createdBy: payload.createdBy ?? 'user-admin',
        isUrgent: payload.isUrgent ?? false,
        audience: payload.audience ?? 'ALL',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.notices.unshift(notice);
      addAudit('NOTICE_CREATE', 'Notices', `Created notice: ${notice.title}`);
      return { data: clone(notice) };
    }

    // 13. Register Student + Enrollment + Parent (6-step wizard)
    if (endpoint === '/students' && method === 'POST') {
      const p = body as Record<string, unknown>;
      // Roll conflict detection
      const conflict = db.enrollments.find(
        (e) =>
          e.academicYearId === p.academicYearId &&
          e.classId === p.classId &&
          e.sectionId === p.sectionId &&
          e.roll === Number(p.roll)
      );
      if (conflict) {
        return {
          error: {
            status: 409,
            message: `রোল নম্বর ${p.roll} এই শ্রেণি ও শাখায় ইতিমধ্যেই বরাদ্দ করা আছে।`,
          },
        };
      }

      const stuId = uid('stu');
      const newStudent: Student = {
        id: stuId,
        studentId: `BHS-2026-${String(3000 + db.students.length + 1)}`,
        birthCertificateNo: String(p.birthCertificateNo ?? ''),
        boardRegistrationNo: p.boardRegistrationNo ? String(p.boardRegistrationNo) : null,
        nameEn: String(p.nameEn),
        nameBn: String(p.nameBn ?? ''),
        dateOfBirth: String(p.dateOfBirth ?? ''),
        gender: p.gender as Student['gender'],
        bloodGroup: (p.bloodGroup as Student['bloodGroup']) || null,
        religion: (p.religion as Student['religion']) || null,
        presentAddress: String(p.presentAddress ?? ''),
        permanentAddress: String(p.permanentAddress ?? ''),
        admissionDate: String(p.admissionDate ?? nowIso().slice(0, 10)),
        status: StudentStatus.ACTIVE,
        previousSchoolName: p.previousSchoolName ? String(p.previousSchoolName) : null,
        previousGpa: p.previousGpa ? Number(p.previousGpa) : null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.students.unshift(newStudent);

      const newEnr: StudentEnrollment = {
        id: uid('enr'),
        studentId: stuId,
        academicYearId: String(p.academicYearId),
        classId: String(p.classId),
        sectionId: String(p.sectionId),
        groupId: p.groupId ? String(p.groupId) : null,
        roll: Number(p.roll),
        enrollmentDate: nowIso().slice(0, 10),
        isRepeater: false,
        isReadmission: Boolean(p.isReadmission),
        status: EnrollmentStatus.ACTIVE,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.enrollments.unshift(newEnr);

      const parId = uid('par');
      db.parents.unshift({
        id: parId,
        name: String(p.parentName),
        nameBn: p.parentNameBn ? String(p.parentNameBn) : null,
        phone: String(p.parentPhone),
        occupation: p.parentOccupation ? String(p.parentOccupation) : null,
        nid: p.parentNid ? String(p.parentNid) : null,
        address: String(p.presentAddress ?? ''),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
      db.parentStudents.unshift({
        id: uid('ps'),
        parentId: parId,
        studentId: stuId,
        relationship: RelationshipType.FATHER,
        isPrimary: true,
        isEmergencyContact: true,
        isSmsReceiver: true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });

      addAudit('STUDENT_CREATE', 'Students', `Registered new student ${newStudent.nameEn} (${newStudent.studentId}).`);
      return { data: clone({ student: newStudent, enrollment: newEnr }) };
    }

    // 14. Issue Transfer Certificate
    if (endpoint === '/students/tc' && method === 'POST') {
      const payload = body as Omit<StudentTransferCertificate, 'id' | 'createdAt' | 'updatedAt'>;
      const tc: StudentTransferCertificate = {
        ...payload,
        id: uid('tc'),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.transferCertificates.unshift(tc);
      const stu = db.students.find((s) => s.id === tc.studentId);
      if (stu) stu.status = StudentStatus.TRANSFERRED;
      addAudit('TC_ISSUE', 'Students', `Issued Transfer Certificate ${tc.tcNumber}.`);
      return { data: clone(tc) };
    }

    // 15. Add / Update Class Routine Slot with Conflict Prevention
    if (endpoint === '/academic/routines' && method === 'POST') {
      const slot = body as Omit<ClassRoutine, 'id' | 'createdAt' | 'updatedAt'>;
      const secConflict = db.classRoutines.find(
        (r) =>
          r.academicYearId === slot.academicYearId &&
          r.sectionId === slot.sectionId &&
          r.day === slot.day &&
          r.periodNumber === slot.periodNumber
      );
      if (secConflict) {
        return {
          error: {
            status: 409,
            message: 'এই শাখায় একই দিন ও পিরিয়ডে ইতিমধ্যেই একটি ক্লাস নির্ধারিত আছে (Section Conflict)।',
          },
        };
      }
      const teacherConflict = db.classRoutines.find(
        (r) =>
          r.academicYearId === slot.academicYearId &&
          r.staffId === slot.staffId &&
          r.day === slot.day &&
          r.periodNumber === slot.periodNumber
      );
      if (teacherConflict) {
        return {
          error: {
            status: 409,
            message: 'নির্বাচিত শিক্ষক একই দিন ও পিরিয়ডে অন্য শ্রেণিতে ক্লাস নিচ্ছেন (Teacher Conflict)।',
          },
        };
      }
      if (slot.room) {
        const roomConflict = db.classRoutines.find(
          (r) =>
            r.academicYearId === slot.academicYearId &&
            r.room === slot.room &&
            r.day === slot.day &&
            r.periodNumber === slot.periodNumber
        );
        if (roomConflict) {
          return {
            error: {
              status: 409,
              message: `${slot.room} কক্ষটি এই পিরিয়ডে অন্য শ্রেণির জন্য বরাদ্দ আছে (Room Conflict)।`,
            },
          };
        }
      }

      const created: ClassRoutine = {
        ...slot,
        id: uid('cr'),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.classRoutines.push(created);
      addAudit('ROUTINE_ADD', 'Academic', `Added class routine slot (${slot.day} Period ${slot.periodNumber}).`);
      return { data: clone(created) };
    }

    // 16. Create Staff
    if (endpoint === '/staff' && method === 'POST') {
      const payload = body as Partial<Staff>;
      const created: Staff = {
        id: uid('staff'),
        employeeId: payload.employeeId ?? `T-${db.staff.length + 10}`,
        name: payload.name ?? '',
        nameBn: payload.nameBn ?? payload.name ?? '',
        designation: payload.designation ?? 'সহকারী শিক্ষক',
        qualification: payload.qualification ?? '',
        staffType: payload.staffType ?? ('TEACHER' as Staff['staffType']),
        departmentId: payload.departmentId ?? null,
        employmentType: payload.employmentType ?? ('PERMANENT' as Staff['employmentType']),
        phone: payload.phone ?? null,
        email: payload.email ?? null,
        joiningDate: payload.joiningDate ?? nowIso().slice(0, 10),
        displayOrder: db.staff.length + 1,
        status: 'ACTIVE' as Staff['status'],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.staff.unshift(created);
      addAudit('STAFF_CREATE', 'Staff', `Added staff member ${created.name} (${created.employeeId}).`);
      return { data: clone(created) };
    }

    // 17. Toggle RFID Card Status
    if (endpoint === '/students/rfid/status' && method === 'POST') {
      const { id, status } = body as { id: string; status: CardStatus };
      const card = db.rfidCards.find((c) => c.id === id);
      if (!card) return { error: { status: 404, message: 'RFID card not found' } };
      card.status = status;
      card.updatedAt = nowIso();
      addAudit('RFID_STATUS', 'Students', `Updated RFID card ${card.cardNumber} status to ${status}.`);
      return { data: clone(card) };
    }

    // 18. Mark Notification(s) Read
    if (endpoint === '/notifications/read' && method === 'POST') {
      const { id } = (body as { id?: string }) ?? {};
      if (id) {
        const n = db.notifications.find((x) => x.id === id);
        if (n) n.isRead = true;
      } else {
        db.notifications.forEach((x) => (x.isRead = true));
      }
      return { data: { ok: true } };
    }

    // 19. Toggle Role Permission in Permission Matrix
    if (endpoint === '/roles/permission-toggle' && method === 'POST') {
      const { roleId, permissionId } = body as { roleId: string; permissionId: string };
      const existingIdx = db.rolePermissions.findIndex(
        (rp) => rp.roleId === roleId && rp.permissionId === permissionId
      );
      if (existingIdx >= 0) {
        db.rolePermissions.splice(existingIdx, 1);
      } else {
        db.rolePermissions.push({ id: uid('rp'), roleId, permissionId });
      }
      addAudit('PERMISSION_TOGGLE', 'Users', `Updated permission assignment for role ${roleId}.`);
      return { data: { ok: true } };
    }

    // 20. Promote Students Wizard
    if (endpoint === '/students/promote' && method === 'POST') {
      const { items } = body as {
        items: Array<{
          studentId: string;
          fromEnrollmentId: string;
          toClassId: string;
          promotionType: PromotionType;
        }>;
      };
      items.forEach((item) => {
        db.promotions.unshift({
          id: uid('promo'),
          studentId: item.studentId,
          fromEnrollmentId: item.fromEnrollmentId,
          toEnrollmentId: uid('enr-next'),
          promotionType: item.promotionType,
          promotionDate: nowIso().slice(0, 10),
          remarks: 'প্রমোশন উইজার্ডের মাধ্যমে প্রক্রিয়াকৃত',
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
        const oldEnr = db.enrollments.find((e) => e.id === item.fromEnrollmentId);
        if (oldEnr && item.promotionType !== PromotionType.RETAINED) {
          oldEnr.status = EnrollmentStatus.PROMOTED;
        }
      });
      addAudit('STUDENT_PROMOTION', 'Students', `Processed promotion for ${items.length} students.`);
      return { data: { promotedCount: items.length } };
    }

    // 21. Archive / Restore Soft-Deletable Entity (Exam, GradingScale, StaffStructure)
    if (endpoint === '/archive/toggle' && method === 'POST') {
      const { collection, id } = body as {
        collection: 'exams' | 'gradingScales' | 'staffStructures';
        id: string;
      };
      const target = (db[collection] as Array<{ id: string; isDeleted: boolean; deletedAt?: string | null }>).find(
        (x) => x.id === id
      );
      if (!target) return { error: { status: 404, message: 'Record not found' } };
      target.isDeleted = !target.isDeleted;
      target.deletedAt = target.isDeleted ? nowIso() : null;
      addAudit(target.isDeleted ? 'ARCHIVE' : 'RESTORE', collection, `Toggled archive state for ${id}.`);
      return { data: clone(target) };
    }

    // 22. Generic Website / Banner / QuickLink Publish Toggle
    if (endpoint === '/cms/toggle' && method === 'POST') {
      const { collection, id, field } = body as {
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
          | 'leadershipMessages'
          | 'institutionContents'
          | 'facilities'
          | 'galleries';
        id: string;
        field: 'isActive' | 'isPublished';
      };
      const item = (db[collection] as unknown as Array<Record<string, unknown>>).find((x) => x.id === id);
      if (!item) return { error: { status: 404, message: 'CMS item not found' } };
      item[field] = !Boolean(item[field]);
      if ('updatedAt' in item) item.updatedAt = nowIso();
      addAudit('CMS_TOGGLE', 'Website', `Toggled ${field} on ${collection}/${id}.`);
      return { data: clone(item) };
    }

    // 22b. Update Admission Campaign & Homepage Spotlight Settings
    if (endpoint === '/cms/admission-content' && method === 'PUT') {
      const patch = body as Partial<typeof db.admissionContent>;
      db.admissionContent = {
        ...db.admissionContent,
        ...patch,
        updatedAt: nowIso(),
      };
      addAudit(
        'ADMISSION_CMS_UPDATE',
        'Website',
        `Updated admission campaign settings (status: ${db.admissionContent.admissionStatus ?? 'OPEN'}, homepage: ${db.admissionContent.showOnHomepage ? 'visible' : 'hidden'}).`
      );
      return { data: clone(db.admissionContent) };
    }

    // 23. Create Exam
    if (endpoint === '/exams' && method === 'POST') {
      const payload = body as Partial<Exam>;
      const exam: Exam = {
        id: uid('exam'),
        academicYearId: payload.academicYearId ?? 'ay-2026',
        classId: payload.classId ?? 'cls-10',
        gradingScaleId: payload.gradingScaleId ?? 'gs-nctb-5',
        name: payload.name ?? 'নতুন পরীক্ষা ২০২৬',
        examType: payload.examType ?? ('MODEL_TEST' as Exam['examType']),
        startDate: payload.startDate ?? '2026-12-01',
        endDate: payload.endDate ?? '2026-12-10',
        status: 'UPCOMING' as Exam['status'],
        marksEntryDeadline: payload.marksEntryDeadline ?? '2026-12-20T23:59:00.000Z',
        allowCombinedPass: payload.allowCombinedPass ?? true,
        resultStatus: ResultPublicationStatus.DRAFT,
        isLocked: false,
        isDeleted: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.exams.unshift(exam);
      addAudit('EXAM_CREATE', 'Examinations', `Created exam: ${exam.name}`);
      return { data: clone(exam) };
    }

    // 24. Drag-and-Drop Reorder for Banners & Quick Links
    if (endpoint === '/cms/reorder' && method === 'POST') {
      const { collection, orderedIds } = body as {
        collection: 'banners' | 'quickLinks';
        orderedIds: string[];
      };
      const items = db[collection];
      orderedIds.forEach((id, idx) => {
        const match = items.find((item) => item.id === id);
        if (match) match.sortOrder = idx + 1;
      });
      items.sort((a, b) => a.sortOrder - b.sortOrder);
      addAudit('CMS_REORDER', 'Website', `Reordered ${collection} (${orderedIds.length} items).`);
      return { data: clone(items) };
    }

    // 25. Drag-and-Drop Move Class Routine Period with Conflict Check
    if (endpoint === '/academic/routines/move' && method === 'POST') {
      const { routineId, targetDay, targetPeriodNumber } = body as {
        routineId: string;
        targetDay: ClassRoutine['day'];
        targetPeriodNumber: number;
      };
      const slot = db.classRoutines.find((r) => r.id === routineId);
      if (!slot) return { error: { status: 404, message: 'Routine slot not found' } };

      const conflict = db.classRoutines.find(
        (r) =>
          r.id !== slot.id &&
          r.academicYearId === slot.academicYearId &&
          r.day === targetDay &&
          r.periodNumber === targetPeriodNumber &&
          (r.sectionId === slot.sectionId ||
            r.staffId === slot.staffId ||
            (slot.room && r.room === slot.room))
      );
      if (conflict) {
        return {
          error: {
            status: 409,
            message:
              'কনফ্লিক্ট পাওয়া গেছে: লক্ষ্য পিরিয়ডে একই শাখা, শিক্ষক বা রুম ইতোমধ্যে নির্ধারিত। / Schedule conflict detected in target period.',
          },
        };
      }
      slot.day = targetDay;
      slot.periodNumber = targetPeriodNumber;
      slot.updatedAt = nowIso();
      addAudit('ROUTINE_MOVE', 'Academic', `Moved routine ${slot.id} to ${targetDay} P${targetPeriodNumber}.`);
      return { data: clone(slot) };
    }

    // 26. Upload / Publish Syllabus PDF or Image File
    if (endpoint === '/academic/syllabus/files' && method === 'POST') {
      const payload = body as Omit<SyllabusFile, 'id' | 'createdAt' | 'updatedAt'>;
      const newFile: SyllabusFile = {
        ...payload,
        id: uid('sf'),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.syllabusFiles.unshift(newFile);
      addAudit('SYLLABUS_FILE_UPLOAD', 'Academic', `Uploaded syllabus file: ${newFile.title} (${newFile.fileName})`);
      return { data: clone(newFile) };
    }

    // 27. Add Chapter-wise Syllabus Entry
    if (endpoint === '/academic/syllabus/entries' && method === 'POST') {
      const payload = body as Omit<SyllabusChapterEntry, 'id'>;
      const entry: SyllabusChapterEntry = {
        ...payload,
        id: uid('se'),
      };
      db.syllabusEntries.push(entry);
      addAudit('SYLLABUS_ENTRY_ADD', 'Academic', `Added syllabus chapters for class ${entry.classId} (${entry.examTerm}).`);
      return { data: clone(entry) };
    }

    // 28. Unified Website CMS Upsert (Create or Update)
    if (endpoint === '/cms/upsert' && method === 'POST') {
      const { collection, item } = body as {
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
          | 'galleries'
          | 'galleryMedia'
          | 'publications'
          | 'achievements';
        item: Record<string, unknown>;
      };
      const list = db[collection] as unknown as Array<Record<string, unknown>>;
      const existingId = typeof item.id === 'string' && item.id.trim() ? item.id : null;
      const existingIdx = existingId ? list.findIndex((x) => x.id === existingId) : -1;

      if (existingIdx >= 0) {
        const updated = {
          ...list[existingIdx],
          ...item,
          updatedAt: nowIso(),
        };
        list[existingIdx] = updated;
        addAudit('CMS_UPDATE', 'Website', `Updated ${collection}/${existingId}.`);
        return { data: clone(updated) };
      }

      const created: Record<string, unknown> = {
        ...item,
        id: uid(collection.slice(0, 3)),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      if ((collection === 'banners' || collection === 'quickLinks' || collection === 'galleryMedia') && !created.sortOrder) {
        created.sortOrder = list.length + 1;
      }
      if (collection === 'news' || collection === 'events' || collection === 'careers' || collection === 'galleries' || collection === 'publications' || collection === 'achievements') {
        list.unshift(created);
      } else {
        list.push(created);
      }
      addAudit('CMS_CREATE', 'Website', `Created ${collection}/${String(created.id)}.`);
      return { data: clone(created) };
    }

    // 29. Unified Website CMS Delete
    if (endpoint === '/cms/delete' && method === 'POST') {
      const { collection, id } = body as {
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
          | 'galleries'
          | 'galleryMedia'
          | 'publications'
          | 'achievements';
        id: string;
      };
      const list = db[collection] as unknown as Array<Record<string, unknown>>;
      const idx = list.findIndex((x) => x.id === id);
      if (idx < 0) return { error: { status: 404, message: 'CMS item not found' } };
      list.splice(idx, 1);
      addAudit('CMS_DELETE', 'Website', `Deleted ${collection}/${id}.`);
      return { data: { deletedId: id } };
    }

    // 30. Update Website Contact Information
    if (endpoint === '/cms/contact-info' && method === 'PUT') {
      const patch = body as {
        address: string;
        phone?: string | null;
        email?: string | null;
        mapUrl?: string | null;
      };
      db.contactInfo = {
        ...db.contactInfo,
        address: patch.address,
        phone: patch.phone ?? db.contactInfo.phone,
        email: patch.email ?? db.contactInfo.email,
        mapUrl: patch.mapUrl ?? db.contactInfo.mapUrl,
        updatedAt: nowIso(),
      };
      addAudit('CONTACT_CMS_UPDATE', 'Website', 'Updated public contact information and map link.');
      return { data: clone(db.contactInfo) };
    }

    if (endpoint === '/academic/years' && method === 'POST') {
      return saveAcademicYear(body);
    }
    if (endpoint === '/academic/years/set-active' && method === 'POST') {
      return setActiveAcademicYear(body);
    }
    if (endpoint === '/academic/groups' && method === 'POST') {
      return saveAcademicGroup(body);
    }
    if (endpoint === '/academic/classes' && method === 'POST') {
      return saveSchoolClass(body);
    }
    if (endpoint === '/academic/sections' && method === 'POST') {
      return saveSection(body);
    }
    if (endpoint === '/academic/class-subjects' && method === 'POST') {
      return saveClassSubject(body);
    }
    if (endpoint === '/academic/class-subjects/remove' && method === 'POST') {
      return removeClassSubject(body);
    }
    if (endpoint === '/academic/class-subjects/rollover' && method === 'POST') {
      return rolloverClassSubjects(body);
    }
    if (endpoint === '/academic/books' && method === 'POST') {
      return saveBook(body);
    }

    return { error: { status: 404, message: `Mock endpoint not implemented: ${method} ${endpoint}` } };
  } catch (err) {
    return {
      error: {
        status: 500,
        message: err instanceof Error ? err.message : 'Unexpected mock API error',
      },
    };
  }
}
