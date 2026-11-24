import { db, clone, uid, nowIso, addAudit, sameName } from '../state';
import {
  AcademicDocumentType,
  AcademicEventType,
  BookType,
  StaffStatus,
  StaffType,
  SubjectCategory,
  WeekDay,
} from '@/src/types/enums';
import type {
  AcademicDocument,
  AcademicEvent,
  AcademicGroup,
  AcademicYear,
  Book,
  ClassRoutine,
  ClassSubject,
  SchoolClass,
  Section,
  SectionClassTeacher,
  Subject,
  SyllabusChapterEntry,
  SyllabusFile,
  TeacherAssignment,
} from '@/src/types/entities';
import type { MockHandlerResult } from './types';
import { studentError } from './helpers';

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
    canEnterMarks: payload.canEnterMarks ?? true,
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


export function handleAcademicMock(
  endpoint: string,
  method: string,
  body?: unknown
): MockHandlerResult | null {
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

    // 28. Unified CMS & Operations Collection Upsert (Create or Update)
    if (endpoint === '/academic/years' && method === 'POST') {
      return saveAcademicYear(body);
    }
    if (endpoint === '/academic/years/set-active' && method === 'POST') {
      return setActiveAcademicYear(body);
    }
    if (endpoint === '/academic/groups' && method === 'POST') {
      return saveAcademicGroup(body);
    }
    if (endpoint.startsWith('/academic/classes') && method === 'GET') {
      return { data: db.classes };
    }
    if (endpoint === '/academic/classes' && method === 'POST') {
      return saveSchoolClass(body);
    }
    if (endpoint.startsWith('/academic/classes/') && method === 'PATCH') {
      const id = endpoint.replace('/academic/classes/', '');
      return saveSchoolClass({ ...(body as object), id });
    }
    if (endpoint.startsWith('/academic/classes/') && method === 'DELETE') {
      const id = endpoint.replace('/academic/classes/', '');
      const idx = db.classes.findIndex((c) => c.id === id);
      if (idx !== -1) db.classes.splice(idx, 1);
      return { data: { message: 'Class deleted successfully' } };
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

  return null;
}
