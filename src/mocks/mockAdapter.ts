import { createInitialSeed, type MockDatabase } from './seed';
import {
  AcademicDocumentType,
  AcademicEventType,
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
  StaffStatus,
  StaffType,
  SubjectCategory,
  StudentStatus,
} from '@/src/types/enums';
import type {
  AcademicDocument,
  AcademicEvent,
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
  SectionClassTeacher,
  Staff,
  TeacherAssignment,
  Student,
  Subject,
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

function studentError(status: number, message: string) {
  return { error: { status, message } };
}

function placementError(input: {
  academicYearId: string;
  classId: string;
  sectionId: string;
  groupId?: string | null;
  roll: number;
  studentId?: string;
  ignoreEnrollmentId?: string;
}) {
  if (!db.academicYears.some((year) => year.id === input.academicYearId)) {
    return 'শিক্ষাবর্ষ পাওয়া যায়নি। / Academic year was not found.';
  }
  const schoolClass = db.classes.find((item) => item.id === input.classId);
  if (!schoolClass) return 'শ্রেণি পাওয়া যায়নি। / Class was not found.';
  const section = db.sections.find((item) => item.id === input.sectionId);
  if (!section || section.classId !== input.classId) {
    return 'শাখা এই শ্রেণির নয়। / That section does not belong to this class.';
  }
  if (schoolClass.numericValue >= 9) {
    if (!input.groupId) return 'নবম ও দশম শ্রেণিতে বিভাগ আবশ্যক। / A stream is required for classes 9 and 10.';
    if (!db.academicGroups.some((group) => group.id === input.groupId)) {
      return 'বিভাগ পাওয়া যায়নি। / Stream was not found.';
    }
  } else if (input.groupId) {
    return 'ষষ্ঠ থেকে অষ্টম শ্রেণিতে বিভাগ নেই। / Classes 6 to 8 do not use a stream.';
  }
  if (!Number.isInteger(input.roll) || input.roll < 1) {
    return 'রোল ১ বা তার বেশি হতে হবে। / Roll must be 1 or greater.';
  }
  const rollTaken = db.enrollments.some(
    (row) =>
      row.id !== input.ignoreEnrollmentId &&
      row.academicYearId === input.academicYearId &&
      row.classId === input.classId &&
      row.sectionId === input.sectionId &&
      row.roll === input.roll
  );
  if (rollTaken) return `রোল ${input.roll} এই শাখায় আছে। / Roll ${input.roll} is already used in this section.`;
  if (input.studentId) {
    const yearTaken = db.enrollments.some(
      (row) =>
        row.id !== input.ignoreEnrollmentId &&
        row.studentId === input.studentId &&
        row.academicYearId === input.academicYearId
    );
    if (yearTaken) return 'এই শিক্ষার্থী এই শিক্ষাবর্ষে ইতিমধ্যে ভর্তি। / This student is already enrolled in that year.';
  }
  return null;
}

function identityError(input: { birthCertificateNo?: string | null; boardRegistrationNo?: string | null; ignoreStudentId?: string }) {
  const birth = input.birthCertificateNo?.trim();
  if (birth && db.students.some((student) => student.id !== input.ignoreStudentId && student.birthCertificateNo === birth)) {
    return 'এই জন্ম সনদ নম্বর আরেকজন শিক্ষার্থীর। / This birth certificate number is already used.';
  }
  const board = input.boardRegistrationNo?.trim();
  if (board && db.students.some((student) => student.id !== input.ignoreStudentId && student.boardRegistrationNo === board)) {
    return 'এই বোর্ড রেজিস্ট্রেশন নম্বর আরেকজন শিক্ষার্থীর। / This board registration number is already used.';
  }
  return null;
}

function linkGuardian(
  studentId: string,
  input: {
    name: string;
    nameBn?: string | null;
    phone: string;
    occupation?: string | null;
    nid?: string | null;
    address?: string | null;
    relationship?: RelationshipType;
  }
) {
  const phone = input.phone.trim();
  let parent = db.parents.find((item) => item.phone === phone);
  if (!parent) {
    parent = {
      id: uid('par'),
      name: input.name.trim(),
      nameBn: input.nameBn?.trim() || null,
      phone,
      occupation: input.occupation?.trim() || null,
      nid: input.nid?.trim() || null,
      address: input.address?.trim() || null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.parents.unshift(parent);
  }
  if (!db.parentStudents.some((link) => link.parentId === parent.id && link.studentId === studentId)) {
    db.parentStudents.unshift({
      id: uid('ps'),
      parentId: parent.id,
      studentId,
      relationship: input.relationship ?? RelationshipType.FATHER,
      isPrimary: !db.parentStudents.some((link) => link.studentId === studentId && link.isPrimary),
      isEmergencyContact: true,
      isSmsReceiver: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }
}

function activeClassSubjects(yearId: string, classId: string) {
  return db.classSubjects.filter(
    (row) => row.isActive && row.academicYearId === yearId && row.classId === classId
  );
}

function syllabusCurriculumError(yearId: string, classId: string, groupId: string | null) {
  const schoolClass = db.classes.find((item) => item.id === classId);
  if (!schoolClass) return 'শ্রেণি পাওয়া যায়নি। / Class was not found.';
  const rows = activeClassSubjects(yearId, classId);
  if (!rows.length) {
    return 'এই শিক্ষাবর্ষে এই শ্রেণির পাঠ্যতালিকা নেই। আগে বিষয় যোগ করুন। / This class has no curriculum for the selected year.';
  }
  if (groupId) {
    if (schoolClass.numericValue < 9) {
      return 'ষষ্ঠ থেকে অষ্টম শ্রেণিতে বিভাগ নেই। / Classes 6–8 do not use a stream.';
    }
    const matches = rows.some((row) => row.groupId === groupId || row.groupId == null);
    if (!matches) {
      return 'এই বিভাগের জন্য পাঠ্যতালিকায় কোনো বিষয় নেই। / No curriculum subjects exist for this stream.';
    }
  }
  return null;
}

function syllabusSubjectError(yearId: string, classId: string, subjectId: string, groupId: string | null) {
  const blocked = syllabusCurriculumError(yearId, classId, groupId);
  if (blocked) return blocked;
  const rows = activeClassSubjects(yearId, classId).filter((row) => row.subjectId === subjectId);
  const allowed = groupId
    ? rows.some((row) => row.groupId === groupId || row.groupId == null)
    : rows.some((row) => row.groupId == null);
  if (!allowed) {
    return 'এই বিষয়টি ওই শ্রেণির এই শিক্ষাবর্ষের পাঠ্যতালিকায় নেই। / That subject is not on this class curriculum for the year.';
  }
  return null;
}

function subjectInUse(subjectId: string) {
  return (
    db.classSubjects.some((row) => row.subjectId === subjectId) ||
    db.books.some((book) => book.subjectId === subjectId) ||
    db.syllabusEntries.some((entry) => entry.subjectId === subjectId) ||
    db.examSubjects.some((row) => row.subjectId === subjectId)
  );
}

function saveMasterSubject(body: unknown): { data?: Subject; error?: { status: number; message: string } } {
  const payload = body as Partial<Subject>;
  const name = payload.name?.trim() ?? '';
  const nameBn = payload.nameBn?.trim() ?? '';
  if (!name || !nameBn) {
    return { error: { status: 400, message: 'বিষয়ের ইংরেজি ও বাংলা নাম দুটোই দিন। / Enter both the English and Bangla subject names.' } };
  }
  const code = payload.officialCode?.trim() || null;
  const duplicateName = db.subjects.find(
    (subject) =>
      subject.id !== payload.id &&
      (sameName(subject.name, name) || sameName(subject.nameBn ?? '', nameBn))
  );
  if (duplicateName) {
    return { error: { status: 409, message: 'এই নামে বিষয় আগে থেকে আছে। / A subject with this name already exists.' } };
  }
  if (code) {
    const duplicateCode = db.subjects.find(
      (subject) => subject.id !== payload.id && subject.officialCode && sameName(subject.officialCode, code)
    );
    if (duplicateCode) {
      return { error: { status: 409, message: 'এই বোর্ড কোড আগে থেকে আছে। / This board code is already used.' } };
    }
  }
  const category = payload.category && Object.values(SubjectCategory).includes(payload.category)
    ? payload.category
    : SubjectCategory.GENERAL;
  if (payload.id) {
    const existing = db.subjects.find((subject) => subject.id === payload.id);
    if (!existing) return { error: { status: 404, message: 'বিষয় পাওয়া যায়নি। / Subject was not found.' } };
    existing.name = name;
    existing.nameBn = nameBn;
    existing.officialCode = code;
    existing.category = category;
    existing.description = payload.description?.trim() || null;
    existing.isActive = payload.isActive ?? existing.isActive;
    existing.updatedAt = nowIso();
    addAudit('SUBJECT_UPDATE', 'Academic', `Updated subject ${existing.name}.`);
    return { data: clone(existing) };
  }
  const created: Subject = {
    id: uid('sub'),
    name,
    nameBn,
    officialCode: code,
    category,
    description: payload.description?.trim() || null,
    displayOrder: db.subjects.length + 1,
    isSystemDefault: false,
    isActive: payload.isActive ?? true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.subjects.push(created);
  addAudit('SUBJECT_CREATE', 'Academic', `Created subject ${created.name}.`);
  return { data: clone(created) };
}

function removeMasterSubject(body: unknown): { data?: { id: string }; error?: { status: number; message: string } } {
  const { id } = body as { id?: string };
  const existing = db.subjects.find((subject) => subject.id === id);
  if (!existing) return { error: { status: 404, message: 'বিষয় পাওয়া যায়নি। / Subject was not found.' } };
  if (subjectInUse(existing.id)) {
    return {
      error: {
        status: 400,
        message: 'এই বিষয় পাঠ্যক্রম, বই বা সিলেবাসে আছে। মুছতে হলে আগে সেখান থেকে সরান, অথবা বিষয়টি বন্ধ করুন। / This subject is in use. Remove those links first, or mark the subject inactive.',
      },
    };
  }
  db.subjects = db.subjects.filter((subject) => subject.id !== existing.id);
  addAudit('SUBJECT_REMOVE', 'Academic', `Removed subject ${existing.name}.`);
  return { data: { id: existing.id } };
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

function activeTeacher(staffId: string) {
  return db.staff.find(
    (member) => member.id === staffId && member.staffType === StaffType.TEACHER && member.status === StaffStatus.ACTIVE
  );
}

function saveClassTeacher(body: unknown): { data?: SectionClassTeacher; error?: { status: number; message: string } } {
  const payload = body as Partial<SectionClassTeacher>;
  const year = db.academicYears.find((item) => item.id === payload.academicYearId);
  const section = db.sections.find((item) => item.id === payload.sectionId && item.isActive);
  const teacher = payload.staffId ? activeTeacher(payload.staffId) : undefined;
  if (!year) return { error: { status: 404, message: 'শিক্ষাবর্ষ পাওয়া যায়নি। / Academic year not found.' } };
  if (!section) return { error: { status: 404, message: 'শাখা পাওয়া যায়নি। / Section not found.' } };
  if (!teacher) {
    return { error: { status: 400, message: 'সক্রিয় শিক্ষক নির্বাচন করুন। / Choose an active teacher.' } };
  }
  const otherSection = db.sectionClassTeachers.find(
    (item) => item.academicYearId === year.id && item.staffId === teacher.id && item.sectionId !== section.id
  );
  if (otherSection) {
    const other = db.sections.find((item) => item.id === otherSection.sectionId);
    return {
      error: {
        status: 409,
        message: `${teacher.name} এই বছর ${other?.name ?? 'অন্য'} শাখার শ্রেণি শিক্ষক। এক বছরে এক শাখা। / This teacher is already class teacher of another section this year.`,
      },
    };
  }
  const existing = db.sectionClassTeachers.find(
    (item) => item.academicYearId === year.id && item.sectionId === section.id
  );
  const today = new Date().toISOString().slice(0, 10);
  if (existing) {
    existing.staffId = teacher.id;
    existing.assignedDate = today;
    existing.updatedAt = nowIso();
    addAudit('CLASS_TEACHER_UPDATE', 'Academic', `Set ${teacher.name} as class teacher of section ${section.name} for ${year.name}.`);
    return { data: clone(existing) };
  }
  const created: SectionClassTeacher = {
    id: uid('sct'),
    academicYearId: year.id,
    sectionId: section.id,
    staffId: teacher.id,
    assignedDate: today,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.sectionClassTeachers.push(created);
  addAudit('CLASS_TEACHER_ASSIGN', 'Academic', `Assigned ${teacher.name} as class teacher of section ${section.name}.`);
  return { data: clone(created) };
}

function removeClassTeacher(body: unknown): { data?: { deletedId: string }; error?: { status: number; message: string } } {
  const { id } = body as { id?: string };
  const existing = db.sectionClassTeachers.find((item) => item.id === id);
  if (!existing) return { error: { status: 404, message: 'শ্রেণি শিক্ষক পাওয়া যায়নি। / Class teacher assignment not found.' } };
  db.sectionClassTeachers = db.sectionClassTeachers.filter((item) => item.id !== existing.id);
  addAudit('CLASS_TEACHER_REMOVE', 'Academic', `Removed class teacher ${existing.id}.`);
  return { data: { deletedId: existing.id } };
}

function saveTeacherAssignment(body: unknown): { data?: TeacherAssignment; error?: { status: number; message: string } } {
  const payload = body as Partial<TeacherAssignment>;
  const year = db.academicYears.find((item) => item.id === payload.academicYearId);
  const section = db.sections.find((item) => item.id === payload.sectionId && item.isActive);
  const classSubject = db.classSubjects.find((item) => item.id === payload.classSubjectId && item.isActive);
  const teacher = payload.staffId ? activeTeacher(payload.staffId) : undefined;
  if (!year) return { error: { status: 404, message: 'শিক্ষাবর্ষ পাওয়া যায়নি। / Academic year not found.' } };
  if (!section) return { error: { status: 404, message: 'শাখা পাওয়া যায়নি। / Section not found.' } };
  if (!teacher) return { error: { status: 400, message: 'সক্রিয় শিক্ষক নির্বাচন করুন। / Choose an active teacher.' } };
  if (!classSubject || classSubject.academicYearId !== year.id || classSubject.classId !== section.classId) {
    return {
      error: {
        status: 400,
        message: 'বিষয়টি এই বছরের এই শ্রেণির পাঠ্যক্রমে নেই। / That subject is not on this class curriculum for the selected year.',
      },
    };
  }
  const duplicate = db.teacherAssignments.find(
    (item) =>
      item.isActive &&
      item.academicYearId === year.id &&
      item.sectionId === section.id &&
      item.classSubjectId === classSubject.id
  );
  if (duplicate) {
    return {
      error: {
        status: 409,
        message: 'এই শাখায় এই বিষয়ের শিক্ষক আগে থেকে আছে। / This section already has a teacher for that subject.',
      },
    };
  }
  const today = new Date().toISOString().slice(0, 10);
  const created: TeacherAssignment = {
    id: uid('ta'),
    staffId: teacher.id,
    academicYearId: year.id,
    classId: section.classId,
    sectionId: section.id,
    classSubjectId: classSubject.id,
    canEnterMarks: true,
    assignedDate: today,
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.teacherAssignments.push(created);
  addAudit('TEACHER_ASSIGN', 'Academic', `Assigned ${teacher.name} to a subject in section ${section.name} for ${year.name}.`);
  return { data: clone(created) };
}

function removeTeacherAssignment(body: unknown): { data?: { deletedId: string }; error?: { status: number; message: string } } {
  const { id } = body as { id?: string };
  const existing = db.teacherAssignments.find((item) => item.id === id);
  if (!existing) return { error: { status: 404, message: 'শিক্ষক বণ্টন পাওয়া যায়নি। / Teacher assignment not found.' } };
  const onRoutine = db.classRoutines.some((slot) => slot.teacherAssignmentId === existing.id);
  if (onRoutine) {
    return {
      error: {
        status: 400,
        message: 'এই বণ্টন রুটিনে ব্যবহৃত। আগে রুটিনের পিরিয়ড সরান। / This assignment is on the routine. Remove those periods first.',
      },
    };
  }
  db.teacherAssignments = db.teacherAssignments.filter((item) => item.id !== existing.id);
  addAudit('TEACHER_UNASSIGN', 'Academic', `Removed teacher assignment ${existing.id}.`);
  return { data: { deletedId: existing.id } };
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
      const { id, status, sectionId, roll, academicYearId } = body as {
        id: string;
        status: AdmissionApplicationStatus;
        sectionId?: string;
        roll?: number;
        academicYearId?: string;
      };
      const app = db.onlineAdmissions.find((a) => a.id === id);
      if (!app) return studentError(404, 'আবেদন পাওয়া যায়নি। / Application was not found.');
      if (app.status === 'ADMITTED') {
        return studentError(409, 'এই আবেদন আগেই ভর্তি করা হয়েছে। / This application is already admitted.');
      }
      if (status !== 'ADMITTED') {
        app.status = status;
        addAudit('ADMISSION_STATUS', 'Students', `Set ${app.applicationNumber} to ${status}.`);
        return { data: clone(app) };
      }
      const yearId = academicYearId || db.academicYears.find((year) => year.isActive)?.id || '';
      const section =
        db.sections.find((item) => item.id === sectionId && item.classId === app.targetClassId) ||
        db.sections.find(
          (item) => item.classId === app.targetClassId && app.preferredSection && sameName(item.name, app.preferredSection)
        );
      if (!section) return studentError(400, 'ভর্তির শাখা বেছে নিন। / Choose a section for this admission.');
      const nextRoll = Number(roll);
      const placed = placementError({
        academicYearId: yearId,
        classId: app.targetClassId,
        sectionId: section.id,
        groupId: app.targetGroupId ?? null,
        roll: nextRoll,
      });
      if (placed) return studentError(400, placed);
      const identity = identityError({ birthCertificateNo: app.birthCertificateNo });
      if (identity) return studentError(409, identity);
      const stuId = uid('stu');
      const newStudent: Student = {
        id: stuId,
        studentId: `BHS-2026-${String(3000 + db.students.length + 1)}`,
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
        previousSchoolName: app.previousSchoolName ?? null,
        previousSchoolAddress: app.previousSchoolAddress ?? null,
        previousGrade: app.previousGrade ?? null,
        prevExamPassingYear: app.prevExamPassingYear ?? null,
        prevExamRoll: app.prevExamRoll ?? null,
        prevExamRegistration: app.prevExamRegistration ?? null,
        prevExamGpa: app.prevExamGpa ?? null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.students.unshift(newStudent);
      db.enrollments.unshift({
        id: uid('enr'),
        studentId: stuId,
        academicYearId: yearId,
        classId: app.targetClassId,
        sectionId: section.id,
        groupId: app.targetGroupId ?? null,
        roll: nextRoll,
        enrollmentDate: nowIso().slice(0, 10),
        isRepeater: false,
        isReadmission: app.isReadmission,
        status: EnrollmentStatus.ACTIVE,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
      linkGuardian(stuId, {
        name: app.fatherNameEn,
        nameBn: app.fatherNameBn,
        phone: app.guardianPhone,
        occupation: app.fatherOccupation,
        nid: app.fatherNid,
        address: app.presentAddress,
        relationship: RelationshipType.FATHER,
      });
      app.status = 'ADMITTED';
      addAudit('ADMISSION_ADMIT', 'Students', `Admitted ${app.applicationNumber} as ${newStudent.studentId}, roll ${nextRoll}.`);
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
      const nameEn = String(p.nameEn ?? '').trim();
      const parentName = String(p.parentName ?? '').trim();
      const parentPhone = String(p.parentPhone ?? '').trim();
      if (!nameEn) return studentError(400, 'ইংরেজি নাম আবশ্যক। / English name is required.');
      if (!parentName || !parentPhone) {
        return studentError(400, 'অভিভাবকের নাম ও মোবাইল আবশ্যক। / Guardian name and phone are required.');
      }
      const groupId = p.groupId ? String(p.groupId) : null;
      const placed = placementError({
        academicYearId: String(p.academicYearId ?? ''),
        classId: String(p.classId ?? ''),
        sectionId: String(p.sectionId ?? ''),
        groupId,
        roll: Number(p.roll),
      });
      if (placed) return studentError(400, placed);
      const identity = identityError({
        birthCertificateNo: p.birthCertificateNo ? String(p.birthCertificateNo) : null,
        boardRegistrationNo: p.boardRegistrationNo ? String(p.boardRegistrationNo) : null,
      });
      if (identity) return studentError(409, identity);
      const optionalId = p.optionalClassSubjectId ? String(p.optionalClassSubjectId) : null;
      if (optionalId) {
        const optional = db.classSubjects.find((row) => row.id === optionalId && row.isOptional && row.isActive);
        if (!optional || optional.classId !== String(p.classId) || optional.academicYearId !== String(p.academicYearId)) {
          return studentError(400, 'ঐচ্ছিক বিষয় এই শ্রেণির পাঠ্যতালিকায় নেই। / That optional subject is not on this class curriculum.');
        }
      }
      const stuId = uid('stu');
      const newStudent: Student = {
        id: stuId,
        studentId: `BHS-2026-${String(3000 + db.students.length + 1)}`,
        birthCertificateNo: p.birthCertificateNo ? String(p.birthCertificateNo).trim() : null,
        boardRegistrationNo: p.boardRegistrationNo ? String(p.boardRegistrationNo).trim() : null,
        nameEn,
        nameBn: p.nameBn ? String(p.nameBn).trim() : null,
        dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth) : null,
        gender: p.gender as Student['gender'],
        bloodGroup: (p.bloodGroup as Student['bloodGroup']) || null,
        religion: (p.religion as Student['religion']) || null,
        presentAddress: p.presentAddress ? String(p.presentAddress) : null,
        permanentAddress: p.permanentAddress ? String(p.permanentAddress) : null,
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
        groupId,
        optionalClassSubjectId: optionalId,
        roll: Number(p.roll),
        enrollmentDate: nowIso().slice(0, 10),
        isRepeater: false,
        isReadmission: Boolean(p.isReadmission),
        status: EnrollmentStatus.ACTIVE,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.enrollments.unshift(newEnr);
      linkGuardian(stuId, {
        name: parentName,
        nameBn: p.parentNameBn ? String(p.parentNameBn) : null,
        phone: parentPhone,
        occupation: p.parentOccupation ? String(p.parentOccupation) : null,
        nid: p.parentNid ? String(p.parentNid) : null,
        address: p.presentAddress ? String(p.presentAddress) : null,
        relationship: (p.relationship as RelationshipType) || RelationshipType.FATHER,
      });
      addAudit('STUDENT_CREATE', 'Students', `Registered ${newStudent.nameEn} (${newStudent.studentId}).`);
      return { data: clone({ student: newStudent, enrollment: newEnr }) };
    }

    if (endpoint === '/students/update' && method === 'POST') {
      const p = body as Partial<Student> & { id: string };
      const student = db.students.find((item) => item.id === p.id);
      if (!student) return studentError(404, 'শিক্ষার্থী পাওয়া যায়নি। / Student was not found.');
      const nameEn = (p.nameEn ?? student.nameEn).trim();
      if (!nameEn) return studentError(400, 'ইংরেজি নাম আবশ্যক। / English name is required.');
      const identity = identityError({
        birthCertificateNo: p.birthCertificateNo,
        boardRegistrationNo: p.boardRegistrationNo,
        ignoreStudentId: student.id,
      });
      if (identity) return studentError(409, identity);
      student.nameEn = nameEn;
      student.nameBn = p.nameBn?.trim() || null;
      student.dateOfBirth = p.dateOfBirth || null;
      if (p.gender) student.gender = p.gender;
      student.bloodGroup = p.bloodGroup || null;
      student.religion = p.religion || null;
      student.presentAddress = p.presentAddress?.trim() || null;
      student.permanentAddress = p.permanentAddress?.trim() || null;
      student.birthCertificateNo = p.birthCertificateNo?.trim() || null;
      student.boardRegistrationNo = p.boardRegistrationNo?.trim() || null;
      student.previousSchoolName = p.previousSchoolName?.trim() || null;
      student.previousGpa = p.previousGpa ?? null;
      if (p.status === StudentStatus.ACTIVE || p.status === StudentStatus.INACTIVE) student.status = p.status;
      student.updatedAt = nowIso();
      addAudit('STUDENT_UPDATE', 'Students', `Updated ${student.studentId}.`);
      return { data: clone(student) };
    }

    if (endpoint === '/students/enrollments' && method === 'POST') {
      const p = body as Partial<StudentEnrollment> & { id: string };
      const enrollment = db.enrollments.find((item) => item.id === p.id);
      if (!enrollment) return studentError(404, 'ভর্তি রেকর্ড পাওয়া যায়নি। / Enrollment was not found.');
      const groupId = p.groupId ? String(p.groupId) : null;
      const placed = placementError({
        academicYearId: enrollment.academicYearId,
        classId: enrollment.classId,
        sectionId: String(p.sectionId ?? enrollment.sectionId),
        groupId,
        roll: Number(p.roll ?? enrollment.roll),
        studentId: enrollment.studentId,
        ignoreEnrollmentId: enrollment.id,
      });
      if (placed) return studentError(400, placed);
      const optionalId = p.optionalClassSubjectId ? String(p.optionalClassSubjectId) : null;
      if (optionalId) {
        const optional = db.classSubjects.find((row) => row.id === optionalId && row.isOptional && row.isActive);
        if (
          !optional ||
          optional.academicYearId !== enrollment.academicYearId ||
          optional.classId !== enrollment.classId ||
          (optional.groupId && optional.groupId !== groupId)
        ) {
          return studentError(400, 'ঐচ্ছিক বিষয় এই শ্রেণি ও বিভাগের নয়। / That optional subject does not match this class and stream.');
        }
      }
      enrollment.sectionId = String(p.sectionId ?? enrollment.sectionId);
      enrollment.groupId = groupId;
      enrollment.roll = Number(p.roll ?? enrollment.roll);
      enrollment.optionalClassSubjectId = optionalId;
      enrollment.isRepeater = Boolean(p.isRepeater);
      enrollment.isReadmission = Boolean(p.isReadmission);
      enrollment.remarks = p.remarks?.trim() || null;
      enrollment.updatedAt = nowIso();
      addAudit('ENROLLMENT_UPDATE', 'Students', `Updated enrollment ${enrollment.id}.`);
      return { data: clone(enrollment) };
    }

    if (endpoint === '/students/import' && method === 'POST') {
      const { academicYearId, rows } = body as {
        academicYearId: string;
        rows: Array<Record<string, string>>;
      };
      const created: string[] = [];
      const errors: { row: number; message: string }[] = [];
      rows.forEach((row, index) => {
        const schoolClass = db.classes.find(
          (item) => sameName(item.name, row.className || '') || sameName(item.nameBn || '', row.className || '')
        );
        const section = schoolClass
          ? db.sections.find((item) => item.classId === schoolClass.id && sameName(item.name, row.sectionName || ''))
          : undefined;
        const group = row.groupName
          ? db.academicGroups.find((item) => sameName(item.name, row.groupName) || sameName(item.nameBn || '', row.groupName))
          : undefined;
        const snapshot = {
          students: db.students.length,
          enrollments: db.enrollments.length,
          parents: db.parents.length,
          links: db.parentStudents.length,
        };
        const result = (() => {
          const nameEn = (row.nameEn || '').trim();
          const parentName = (row.parentName || '').trim();
          const parentPhone = (row.parentPhone || '').trim();
          if (!nameEn || !parentName || !parentPhone || !schoolClass || !section) {
            return 'নাম, অভিভাবক, শ্রেণি ও শাখা মিলছে না। / Name, guardian, class, or section did not match.';
          }
          const placed = placementError({
            academicYearId,
            classId: schoolClass.id,
            sectionId: section.id,
            groupId: group?.id ?? null,
            roll: Number(row.roll),
          });
          if (placed) return placed;
          const identity = identityError({ birthCertificateNo: row.birthCertificateNo });
          if (identity) return identity;
          const stuId = uid('stu');
          db.students.unshift({
            id: stuId,
            studentId: `BHS-2026-${String(3000 + db.students.length + 1)}`,
            birthCertificateNo: row.birthCertificateNo?.trim() || null,
            nameEn,
            nameBn: row.nameBn?.trim() || null,
            dateOfBirth: row.dateOfBirth || null,
            gender: (row.gender as Student['gender']) || ('MALE' as Student['gender']),
            admissionDate: nowIso().slice(0, 10),
            status: StudentStatus.ACTIVE,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          });
          db.enrollments.unshift({
            id: uid('enr'),
            studentId: stuId,
            academicYearId,
            classId: schoolClass.id,
            sectionId: section.id,
            groupId: group?.id ?? null,
            roll: Number(row.roll),
            enrollmentDate: nowIso().slice(0, 10),
            isRepeater: false,
            isReadmission: false,
            status: EnrollmentStatus.ACTIVE,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          });
          linkGuardian(stuId, { name: parentName, phone: parentPhone, relationship: RelationshipType.GUARDIAN });
          created.push(stuId);
          return null;
        })();
        if (result) {
          db.students.splice(0, db.students.length - snapshot.students);
          db.enrollments.splice(0, db.enrollments.length - snapshot.enrollments);
          db.parents.splice(0, db.parents.length - snapshot.parents);
          db.parentStudents.splice(0, db.parentStudents.length - snapshot.links);
          errors.push({ row: index + 1, message: result });
        }
      });
      addAudit('STUDENT_IMPORT', 'Students', `Imported ${created.length} students, ${errors.length} rows skipped.`);
      return { data: { created: created.length, errors } };
    }

    // 14. Issue Transfer Certificate
    if (endpoint === '/students/tc' && method === 'POST') {
      const payload = body as Omit<StudentTransferCertificate, 'id' | 'createdAt' | 'updatedAt'>;
      const student = db.students.find((item) => item.id === payload.studentId);
      if (!student) return studentError(404, 'শিক্ষার্থী পাওয়া যায়নি। / Student was not found.');
      if (student.status !== StudentStatus.ACTIVE) {
        return studentError(409, 'শুধু সক্রিয় শিক্ষার্থীর ছাড়পত্র ইস্যু হয়। / A transfer certificate can only be issued for an active student.');
      }
      const tcNumber = payload.tcNumber?.trim();
      if (!tcNumber || !payload.reason?.trim() || !payload.issueDate || !payload.leavingDate) {
        return studentError(400, 'টিসি নম্বর, তারিখ ও কারণ আবশ্যক। / TC number, dates, and reason are required.');
      }
      if (db.transferCertificates.some((item) => sameName(item.tcNumber, tcNumber))) {
        return studentError(409, 'এই টিসি নম্বর আগে ব্যবহার হয়েছে। / This TC number is already used.');
      }
      const enrollment = db.enrollments.find(
        (item) => item.studentId === student.id && item.status === EnrollmentStatus.ACTIVE
      );
      const tc: StudentTransferCertificate = {
        ...payload,
        tcNumber,
        reason: payload.reason.trim(),
        enrollmentId: enrollment?.id ?? payload.enrollmentId ?? null,
        id: uid('tc'),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.transferCertificates.unshift(tc);
      student.status = StudentStatus.TRANSFERRED;
      if (enrollment) {
        enrollment.status = EnrollmentStatus.TRANSFERRED;
        enrollment.updatedAt = nowIso();
      }
      addAudit('TC_ISSUE', 'Students', `Issued Transfer Certificate ${tc.tcNumber}.`);
      return { data: clone(tc) };
    }

    // 15. Add / Update Class Routine Slot with Conflict Prevention
    if (endpoint === '/academic/routines' && method === 'POST') {
      const slot = body as Omit<ClassRoutine, 'id' | 'createdAt' | 'updatedAt'>;
      const assignment = db.teacherAssignments.find((item) => item.id === slot.teacherAssignmentId && item.isActive);
      if (!assignment) {
        return {
          error: {
            status: 400,
            message: 'আগে এই শাখায় বিষয় শিক্ষক বণ্টন করুন। / Assign a subject teacher for this section first.',
          },
        };
      }
      if (assignment.academicYearId !== slot.academicYearId || assignment.sectionId !== slot.sectionId) {
        return {
          error: {
            status: 400,
            message: 'এই বণ্টন নির্বাচিত বছর ও শাখার নয়। / That assignment does not belong to the selected year and section.',
          },
        };
      }
      slot.staffId = assignment.staffId;
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
    if (endpoint === '/students/rfid' && method === 'POST') {
      const { studentId, cardNumber, remarks } = body as { studentId: string; cardNumber: string; remarks?: string };
      const student = db.students.find((item) => item.id === studentId);
      if (!student) return studentError(404, 'শিক্ষার্থী পাওয়া যায়নি। / Student was not found.');
      const number = cardNumber?.trim();
      if (!number) return studentError(400, 'কার্ড নম্বর আবশ্যক। / Card number is required.');
      if (db.rfidCards.some((card) => sameName(card.cardNumber, number))) {
        return studentError(409, 'এই কার্ড নম্বর আগে ইস্যু হয়েছে। / This card number is already issued.');
      }
      if (db.rfidCards.some((card) => card.studentId === studentId && card.status === CardStatus.ACTIVE)) {
        return studentError(409, 'এই শিক্ষার্থীর একটি সক্রিয় কার্ড আছে। আগে সেটি বন্ধ করুন। / This student already has an active card.');
      }
      const card = {
        id: uid('rfid'),
        studentId,
        cardNumber: number,
        status: CardStatus.ACTIVE,
        issuedAt: nowIso(),
        remarks: remarks?.trim() || null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.rfidCards.unshift(card);
      addAudit('RFID_ISSUE', 'Students', `Issued card ${number} to ${student.studentId}.`);
      return { data: clone(card) };
    }

    if (endpoint === '/students/rfid/status' && method === 'POST') {
      const { id, status } = body as { id: string; status: CardStatus };
      const card = db.rfidCards.find((c) => c.id === id);
      if (!card) return studentError(404, 'কার্ড পাওয়া যায়নি। / Card was not found.');
      if (status === CardStatus.ACTIVE && db.rfidCards.some((item) => item.id !== card.id && item.studentId === card.studentId && item.status === CardStatus.ACTIVE)) {
        return studentError(409, 'এই শিক্ষার্থীর আরেকটি সক্রিয় কার্ড আছে। / This student already has another active card.');
      }
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
      const { toAcademicYearId, items } = body as {
        toAcademicYearId: string;
        items: Array<{
          studentId: string;
          fromEnrollmentId: string;
          toClassId?: string;
          toSectionId?: string;
          roll?: number;
          promotionType: PromotionType | 'GRADUATED';
        }>;
      };
      if (!items.length) return studentError(400, 'কোনো শিক্ষার্থী নির্বাচিত নয়। / No students were selected.');
      const prepared: Array<{
        item: (typeof items)[number];
        from: StudentEnrollment;
        toClassId?: string;
        toSectionId?: string;
      }> = [];
      for (const item of items) {
        const from = db.enrollments.find((row) => row.id === item.fromEnrollmentId && row.studentId === item.studentId);
        if (!from || from.status !== EnrollmentStatus.ACTIVE) {
          return studentError(400, 'শুধু চলতি ভর্তি থেকে উত্তরণ হয়। / Only an active enrollment can be moved.');
        }
        const student = db.students.find((row) => row.id === item.studentId);
        if (!student || student.status !== StudentStatus.ACTIVE) {
          return studentError(400, 'সক্রিয় শিক্ষার্থী ছাড়া উত্তরণ হয় না। / Only an active student can be moved.');
        }
        if (db.promotions.some((row) => row.fromEnrollmentId === from.id)) {
          return studentError(409, 'এই ভর্তি আগেই প্রক্রিয়া হয়েছে। / This enrollment was already processed.');
        }
        if (item.promotionType === 'GRADUATED') {
          prepared.push({ item, from });
          continue;
        }
        if (!toAcademicYearId || toAcademicYearId === from.academicYearId) {
          return studentError(400, 'পরের শিক্ষাবর্ষ আলাদা হতে হবে। / Choose a different academic year.');
        }
        const toClassId = item.promotionType === PromotionType.RETAINED ? from.classId : item.toClassId || '';
        const toSectionId = item.toSectionId || '';
        const placed = placementError({
          academicYearId: toAcademicYearId,
          classId: toClassId,
          sectionId: toSectionId,
          groupId: (db.classes.find((row) => row.id === toClassId)?.numericValue ?? 0) >= 9 ? from.groupId ?? null : null,
          roll: Number(item.roll),
          studentId: item.studentId,
        });
        if (placed) return studentError(400, placed);
        prepared.push({ item, from, toClassId, toSectionId });
      }
      const rolls = new Set<string>();
      for (const row of prepared) {
        if (!row.toClassId || !row.toSectionId) continue;
        const key = `${row.toClassId}|${row.toSectionId}|${row.item.roll}`;
        if (rolls.has(key)) return studentError(409, 'একই শাখায় একই রোল দুইজনকে দেওয়া হয়েছে। / Two students were given the same roll.');
        rolls.add(key);
      }
      let promoted = 0;
      let retained = 0;
      let graduated = 0;
      for (const row of prepared) {
        if (row.item.promotionType === 'GRADUATED') {
          row.from.status = EnrollmentStatus.COMPLETED;
          row.from.updatedAt = nowIso();
          const student = db.students.find((item) => item.id === row.item.studentId);
          if (student) student.status = StudentStatus.GRADUATED;
          graduated += 1;
          continue;
        }
        const keepsGroup = (db.classes.find((item) => item.id === row.toClassId)?.numericValue ?? 0) >= 9;
        const next: StudentEnrollment = {
          id: uid('enr'),
          studentId: row.item.studentId,
          academicYearId: toAcademicYearId,
          classId: row.toClassId!,
          sectionId: row.toSectionId!,
          groupId: keepsGroup ? row.from.groupId ?? null : null,
          roll: Number(row.item.roll),
          enrollmentDate: nowIso().slice(0, 10),
          isRepeater: row.item.promotionType === PromotionType.RETAINED,
          isReadmission: false,
          status: EnrollmentStatus.ACTIVE,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        db.enrollments.unshift(next);
        row.from.status = row.item.promotionType === PromotionType.RETAINED ? EnrollmentStatus.COMPLETED : EnrollmentStatus.PROMOTED;
        row.from.updatedAt = nowIso();
        db.promotions.unshift({
          id: uid('promo'),
          studentId: row.item.studentId,
          fromEnrollmentId: row.from.id,
          toEnrollmentId: next.id,
          promotionType: row.item.promotionType as PromotionType,
          promotionDate: nowIso().slice(0, 10),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
        if (row.item.promotionType === PromotionType.RETAINED) retained += 1;
        else promoted += 1;
      }
      addAudit('STUDENT_PROMOTION', 'Students', `Promotion run: ${promoted} promoted, ${retained} retained, ${graduated} graduated.`);
      return { data: { promoted, retained, graduated } };
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

    if (endpoint === '/academic/routines/remove' && method === 'POST') {
      const { id } = body as { id?: string };
      const index = db.classRoutines.findIndex((slot) => slot.id === id);
      if (index < 0) return { error: { status: 404, message: 'Routine slot not found' } };
      const [removed] = db.classRoutines.splice(index, 1);
      addAudit('ROUTINE_REMOVE', 'Academic', `Removed routine period ${removed.id}.`);
      return { data: { id: removed.id } };
    }

    // 26. Upload / Publish Syllabus PDF or Image File
    if (endpoint === '/academic/syllabus/files' && method === 'POST') {
      const payload = body as Omit<SyllabusFile, 'id' | 'createdAt' | 'updatedAt'>;
      const curriculumError = syllabusCurriculumError(
        payload.academicYearId,
        payload.classId,
        payload.groupId ?? null
      );
      if (curriculumError) return { error: { status: 400, message: curriculumError } };
      const newFile: SyllabusFile = {
        ...payload,
        groupId: payload.groupId || null,
        id: uid('sf'),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.syllabusFiles.unshift(newFile);
      addAudit('SYLLABUS_FILE_UPLOAD', 'Academic', `Uploaded syllabus file: ${newFile.title} (${newFile.fileName})`);
      return { data: clone(newFile) };
    }

    // 27. Add or update a chapter row for a subject that is on this year's curriculum
    if (endpoint === '/academic/syllabus/entries' && method === 'POST') {
      const payload = body as Omit<SyllabusChapterEntry, 'id'>;
      const groupId = payload.groupId || null;
      const curriculumError = syllabusSubjectError(
        payload.academicYearId,
        payload.classId,
        payload.subjectId,
        groupId
      );
      if (curriculumError) return { error: { status: 400, message: curriculumError } };
      const existing = db.syllabusEntries.find(
        (entry) =>
          entry.academicYearId === payload.academicYearId &&
          entry.classId === payload.classId &&
          (entry.groupId ?? null) === groupId &&
          entry.examTerm === payload.examTerm &&
          entry.subjectId === payload.subjectId
      );
      if (existing) {
        existing.chaptersBn = payload.chaptersBn;
        existing.chaptersEn = payload.chaptersEn;
        existing.marksBreakdownBn = payload.marksBreakdownBn;
        existing.marksBreakdownEn = payload.marksBreakdownEn;
        addAudit('SYLLABUS_ENTRY_UPDATE', 'Academic', `Updated syllabus chapters ${existing.id}.`);
        return { data: clone(existing) };
      }
      const entry: SyllabusChapterEntry = {
        ...payload,
        groupId,
        id: uid('se'),
      };
      db.syllabusEntries.push(entry);
      addAudit('SYLLABUS_ENTRY_ADD', 'Academic', `Added syllabus chapters for class ${entry.classId} (${entry.examTerm}).`);
      return { data: clone(entry) };
    }

    if (endpoint === '/academic/syllabus/files/remove' && method === 'POST') {
      const { id } = body as { id?: string };
      const index = db.syllabusFiles.findIndex((file) => file.id === id);
      if (index < 0) return { error: { status: 404, message: 'Syllabus file not found' } };
      const [removed] = db.syllabusFiles.splice(index, 1);
      addAudit('SYLLABUS_FILE_REMOVE', 'Academic', `Removed syllabus file ${removed.id}.`);
      return { data: { id: removed.id } };
    }

    if (endpoint === '/academic/syllabus/entries/remove' && method === 'POST') {
      const { id } = body as { id?: string };
      const index = db.syllabusEntries.findIndex((entry) => entry.id === id);
      if (index < 0) return { error: { status: 404, message: 'Syllabus entry not found' } };
      const [removed] = db.syllabusEntries.splice(index, 1);
      addAudit('SYLLABUS_ENTRY_REMOVE', 'Academic', `Removed syllabus entry ${removed.id}.`);
      return { data: { id: removed.id } };
    }

    if (endpoint === '/academic/events' && method === 'POST') {
      const payload = body as Partial<AcademicEvent> & { id?: string };
      const year = db.academicYears.find((item) => item.id === payload.academicYearId);
      if (!year) return { error: { status: 400, message: 'শিক্ষাবর্ষ পাওয়া যায়নি। / Academic year was not found.' } };
      const title = payload.title?.trim() ?? '';
      if (!title) return { error: { status: 400, message: 'ইভেন্টের শিরোনাম দিন। / Enter an event title.' } };
      if (!payload.startDate || !payload.endDate) {
        return { error: { status: 400, message: 'শুরু ও শেষের তারিখ দিন। / Enter a start and end date.' } };
      }
      if (payload.endDate < payload.startDate) {
        return { error: { status: 400, message: 'শেষের তারিখ শুরুর তারিখের আগে হতে পারে না। / End date cannot be before the start date.' } };
      }
      if (payload.id) {
        const existing = db.academicEvents.find((item) => item.id === payload.id);
        if (!existing) return { error: { status: 404, message: 'Event not found' } };
        existing.academicYearId = year.id;
        existing.title = title;
        existing.description = payload.description?.trim() || null;
        existing.eventType = payload.eventType ?? existing.eventType;
        existing.startDate = payload.startDate;
        existing.endDate = payload.endDate;
        addAudit('ACADEMIC_EVENT_UPDATE', 'Academic', `Updated academic event ${existing.id}.`);
        return { data: clone(existing) };
      }
      const created: AcademicEvent = {
        id: uid('aev'),
        academicYearId: year.id,
        title,
        description: payload.description?.trim() || null,
        eventType: payload.eventType ?? AcademicEventType.HOLIDAY,
        startDate: payload.startDate,
        endDate: payload.endDate,
      };
      db.academicEvents.push(created);
      addAudit('ACADEMIC_EVENT_CREATE', 'Academic', `Created academic event ${created.title}.`);
      return { data: clone(created) };
    }

    if (endpoint === '/academic/documents' && method === 'POST') {
      const payload = body as Partial<AcademicDocument> & { id?: string };
      const title = payload.title?.trim() ?? '';
      if (!title) return { error: { status: 400, message: 'নীতিমালার শিরোনাম দিন। / Enter a document title.' } };
      const type = payload.type && Object.values(AcademicDocumentType).includes(payload.type)
        ? payload.type
        : AcademicDocumentType.STUDENT_RULES;
      if (payload.id) {
        const existing = db.academicDocuments.find((item) => item.id === payload.id);
        if (!existing) return { error: { status: 404, message: 'Document not found' } };
        existing.type = type;
        existing.title = title;
        existing.description = payload.description?.trim() || null;
        existing.fileUrl = payload.fileUrl?.trim() || null;
        existing.isPublished = payload.isPublished ?? existing.isPublished;
        existing.updatedAt = nowIso();
        addAudit('ACADEMIC_DOCUMENT_UPDATE', 'Academic', `Updated document ${existing.title}.`);
        return { data: clone(existing) };
      }
      const created: AcademicDocument = {
        id: uid('adoc'),
        type,
        title,
        description: payload.description?.trim() || null,
        fileUrl: payload.fileUrl?.trim() || null,
        isPublished: payload.isPublished ?? true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.academicDocuments.unshift(created);
      addAudit('ACADEMIC_DOCUMENT_CREATE', 'Academic', `Created document ${created.title}.`);
      return { data: clone(created) };
    }

    if (endpoint === '/academic/documents/remove' && method === 'POST') {
      const { id } = body as { id?: string };
      const index = db.academicDocuments.findIndex((item) => item.id === id);
      if (index < 0) return { error: { status: 404, message: 'Document not found' } };
      const [removed] = db.academicDocuments.splice(index, 1);
      addAudit('ACADEMIC_DOCUMENT_REMOVE', 'Academic', `Removed document ${removed.id}.`);
      return { data: { id: removed.id } };
    }

    if (endpoint === '/academic/events/remove' && method === 'POST') {
      const { id } = body as { id?: string };
      const index = db.academicEvents.findIndex((item) => item.id === id);
      if (index < 0) return { error: { status: 404, message: 'Event not found' } };
      const [removed] = db.academicEvents.splice(index, 1);
      addAudit('ACADEMIC_EVENT_REMOVE', 'Academic', `Removed academic event ${removed.id}.`);
      return { data: { id: removed.id } };
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
    if (endpoint === '/academic/subjects' && method === 'POST') {
      return saveMasterSubject(body);
    }
    if (endpoint === '/academic/subjects/remove' && method === 'POST') {
      return removeMasterSubject(body);
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
    if (endpoint === '/academic/class-teachers' && method === 'POST') {
      return saveClassTeacher(body);
    }
    if (endpoint === '/academic/class-teachers/remove' && method === 'POST') {
      return removeClassTeacher(body);
    }
    if (endpoint === '/academic/teacher-assignments' && method === 'POST') {
      return saveTeacherAssignment(body);
    }
    if (endpoint === '/academic/teacher-assignments/remove' && method === 'POST') {
      return removeTeacherAssignment(body);
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
