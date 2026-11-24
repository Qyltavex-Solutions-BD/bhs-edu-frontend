'use client';

import type { MockDatabase } from '@/src/mocks/seed';
import type { Exam, ResultSummary } from '@/src/types/entities';
import { AttendanceStatus, RelationshipType } from '@/src/types/enums';
import type { PrintableMarksheetProps, SeatPlanRoomBlock } from '@/src/components/print/ExamPrintDocuments';

export function getExamEnrolledStudents(db: MockDatabase, exam: Exam) {
  return db.enrollments
    .filter((e) => e.classId === exam.classId && e.academicYearId === exam.academicYearId)
    .sort((a, b) => {
      const secA = db.sections.find((s) => s.id === a.sectionId)?.name ?? '';
      const secB = db.sections.find((s) => s.id === b.sectionId)?.name ?? '';
      return secA.localeCompare(secB) || a.roll - b.roll;
    });
}

export function resolveStudentParents(db: MockDatabase, studentId: string, locale: 'bn' | 'en') {
  const links = db.parentStudents.filter((ps) => ps.studentId === studentId);
  const fatherLink = links.find((l) => l.relationship === RelationshipType.FATHER);
  const motherLink = links.find((l) => l.relationship === RelationshipType.MOTHER);
  const father = fatherLink ? db.parents.find((p) => p.id === fatherLink.parentId) : null;
  const mother = motherLink ? db.parents.find((p) => p.id === motherLink.parentId) : null;
  return {
    fatherName: father ? (locale === 'bn' ? father.nameBn || father.name : father.name) : null,
    motherName: mother ? (locale === 'bn' ? mother.nameBn || mother.name : mother.name) : null,
  };
}

export function buildSeatPlanRooms(
  db: MockDatabase,
  exam: Exam,
  locale: 'bn' | 'en',
  sectionFilter = 'ALL'
): {
  rooms: SeatPlanRoomBlock[];
  seatLookup: Map<string, { roomNo: string; buildingName?: string | null; seatNo: number }>;
  unallocatedCount: number;
  totalCapacity: number;
} {
  const cls = db.classes.find((c) => c.id === exam.classId);
  const enrollments = getExamEnrolledStudents(db, exam).filter(
    (e) => sectionFilter === 'ALL' || e.sectionId === sectionFilter
  );

  const configuredRooms = db.examHallRooms
    .filter((r) => r.examId === exam.id)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const seatLookup = new Map<string, { roomNo: string; buildingName?: string | null; seatNo: number }>();

  const toSeatEntry = (enr: (typeof enrollments)[number], seatNo: number) => {
    const stu = db.students.find((s) => s.id === enr.studentId);
    const sec = db.sections.find((s) => s.id === enr.sectionId);
    const grp = enr.groupId ? db.academicGroups.find((g) => g.id === enr.groupId) : null;
    return {
      seatNo,
      roll: enr.roll,
      studentId: stu?.studentId ?? enr.studentId,
      studentName: locale === 'bn' ? stu?.nameBn || stu?.nameEn || '—' : stu?.nameEn || '—',
      className: locale === 'bn' ? cls?.nameBn || cls?.name || '' : cls?.name || '',
      sectionName: sec?.name ?? '',
      groupName: grp ? (locale === 'bn' ? grp.nameBn : grp.name) : null,
    };
  };

  if (configuredRooms.length === 0) {
    const fallbackSeats = enrollments.map((enr, idx) => {
      const seatNo = idx + 1;
      seatLookup.set(enr.id, { roomNo: locale === 'bn' ? 'হল রুম ১০১' : 'Hall Room 101', seatNo });
      return toSeatEntry(enr, seatNo);
    });
    return {
      rooms: [
        {
          roomNo: locale === 'bn' ? 'হল রুম ১০১' : 'Hall Room 101',
          buildingName: locale === 'bn' ? 'মূল একাডেমিক ভবন' : 'Main Academic Building',
          capacity: Math.max(fallbackSeats.length, 30),
          invigilatorName: null,
          assistantInvigilatorName: null,
          seats: fallbackSeats,
        },
      ],
      seatLookup,
      unallocatedCount: 0,
      totalCapacity: Math.max(fallbackSeats.length, 30),
    };
  }

  let cursor = 0;
  const rooms: SeatPlanRoomBlock[] = configuredRooms.map((room) => {
    const slice = enrollments.slice(cursor, cursor + room.capacity);
    cursor += slice.length;
    const inv = room.invigilatorStaffId
      ? db.staff.find((s) => s.id === room.invigilatorStaffId)
      : null;
    const asst = room.assistantInvigilatorStaffId
      ? db.staff.find((s) => s.id === room.assistantInvigilatorStaffId)
      : null;

    const seats = slice.map((enr, idx) => {
      const seatNo = idx + 1;
      seatLookup.set(enr.id, {
        roomNo: room.roomNo,
        buildingName: room.buildingName,
        seatNo,
      });
      return toSeatEntry(enr, seatNo);
    });

    return {
      roomNo: room.roomNo,
      buildingName: room.buildingName,
      capacity: room.capacity,
      invigilatorName: inv ? (locale === 'bn' ? inv.nameBn || inv.name : inv.name) : null,
      assistantInvigilatorName: asst ? (locale === 'bn' ? asst.nameBn || asst.name : asst.name) : null,
      seats,
    };
  });

  const totalCapacity = configuredRooms.reduce((sum, r) => sum + r.capacity, 0);
  const unallocatedCount = Math.max(0, enrollments.length - cursor);

  return { rooms, seatLookup, unallocatedCount, totalCapacity };
}

export function buildStudentMarksheetProps(
  db: MockDatabase,
  exam: Exam,
  summary: ResultSummary,
  locale: 'bn' | 'en'
): PrintableMarksheetProps | null {
  const enr = db.enrollments.find((e) => e.id === summary.studentEnrollmentId);
  const stu = enr ? db.students.find((s) => s.id === enr.studentId) : null;
  if (!enr || !stu) return null;

  const cls = db.classes.find((c) => c.id === enr.classId);
  const sec = db.sections.find((s) => s.id === enr.sectionId);
  const grp = enr.groupId ? db.academicGroups.find((g) => g.id === enr.groupId) : null;
  const year = db.academicYears.find((y) => y.id === enr.academicYearId);
  const { fatherName, motherName } = resolveStudentParents(db, stu.id, locale);

  const examSubs = db.examSubjects
    .filter((es) => es.examId === exam.id)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  // Compute class-wide highest marks per examSubject
  const highestBySubject = new Map<string, number>();
  examSubs.forEach((es) => {
    const subMarks = db.marks.filter((m) => m.examSubjectId === es.id && !m.isAbsent);
    if (subMarks.length > 0) {
      highestBySubject.set(
        es.id,
        Math.max(...subMarks.map((m) => m.totalMarks))
      );
    }
  });

  const ssrRows = db.studentSubjectResults.filter(
    (r) => r.examId === exam.id && r.studentEnrollmentId === enr.id
  );

  const subjects = ssrRows
    .map((r) => {
      const es = examSubs.find((x) => x.id === r.examSubjectId);
      const sub = es ? db.subjects.find((s) => s.id === es.subjectId) : null;
      const mk = db.marks.find(
        (m) => m.studentEnrollmentId === enr.id && m.examSubjectId === r.examSubjectId
      );
      return {
        displayOrder: es?.displayOrder ?? 99,
        subjectCode: sub?.officialCode ?? '—',
        subjectName: sub?.name ?? 'Subject',
        subjectNameBn: sub?.nameBn ?? sub?.name ?? 'বিষয়',
        fullMarks: es?.fullMarks ?? 100,
        writtenMarks: mk?.writtenMarks ?? 0,
        mcqMarks: mk?.mcqMarks ?? 0,
        practicalMarks: mk?.practicalMarks ?? 0,
        continuousAssessmentMarks: mk?.continuousAssessmentMarks ?? 0,
        highestMarks: highestBySubject.get(r.examSubjectId) ?? null,
        totalMarks: r.totalMarks,
        letterGrade: r.letterGrade,
        gradePoint: r.gradePoint,
        isPassed: r.isPassed,
        isOptional: r.isOptional,
        bonusGradePoint: r.bonusGradePoint ?? 0,
        isAbsent: r.isAbsent,
      };
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);

  // Student Attendance summary
  const attRecords = db.attendances.filter((a) => a.studentEnrollmentId === enr.id);
  const workingDays = attRecords.length;
  const presentDays = attRecords.filter(
    (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE
  ).length;

  const scaleRanges = db.gradeRanges.filter(
    (r) => r.gradingScaleId === exam.gradingScaleId && !r.isDeleted
  );

  return {
    school: db.schoolProfile,
    examName: exam.name,
    student: {
      studentId: stu.studentId,
      nameEn: stu.nameEn,
      nameBn: stu.nameBn,
      fatherName,
      motherName,
      dateOfBirth: stu.dateOfBirth,
      roll: enr.roll,
      className: cls?.name ?? '',
      classNameBn: cls?.nameBn ?? '',
      sectionName: sec?.name ?? '',
      groupName: grp?.name ?? null,
      groupNameBn: grp?.nameBn ?? null,
      academicYear: year?.name ?? '2026',
    },
    summary,
    subjects,
    gradeRanges: scaleRanges,
    attendance: workingDays > 0 ? { presentDays, workingDays } : null,
  };
}

export function buildExamCompleteness(db: MockDatabase, exam: Exam) {
  const examSubs = db.examSubjects
    .filter((es) => es.examId === exam.id)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const classEnrs = db.enrollments.filter(
    (e) => e.classId === exam.classId && e.academicYearId === exam.academicYearId
  );

  const items = examSubs.map((es) => {
    const sub = db.subjects.find((s) => s.id === es.subjectId);
    const grp = es.groupId ? db.academicGroups.find((g) => g.id === es.groupId) : null;
    const expectedEnrs = classEnrs.filter((e) => !es.groupId || e.groupId === es.groupId);
    const expectedIds = new Set(expectedEnrs.map((e) => e.id));
    const enteredMarks = db.marks.filter(
      (m) => m.examSubjectId === es.id && expectedIds.has(m.studentEnrollmentId)
    );
    const expected = expectedEnrs.length;
    const entered = enteredMarks.length;
    const pct = expected > 0 ? Math.round((entered / expected) * 100) : 100;
    return {
      examSubject: es,
      subject: sub ?? null,
      group: grp ?? null,
      expected,
      entered,
      missing: Math.max(0, expected - entered),
      pct,
    };
  });

  const totalExpected = items.reduce((s, i) => s + i.expected, 0);
  const totalEntered = items.reduce((s, i) => s + i.entered, 0);
  const totalMissing = items.reduce((s, i) => s + i.missing, 0);
  const overallPct = totalExpected > 0 ? Math.round((totalEntered / totalExpected) * 100) : 0;

  return { items, totalExpected, totalEntered, totalMissing, overallPct };
}
