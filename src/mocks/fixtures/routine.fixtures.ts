import { WeekDay } from '@/src/types/enums';
import type {
  ClassRoutine,
  ClassSubject,
  SectionClassTeacher,
  TeacherAssignment,
} from '@/src/types/entities';
import { NOW } from './common';

export function createRoutineFixtures(classSubjects: ClassSubject[]) {
  // 6. Teacher Assignments, Class Teachers, Weekly Class Routines
  const teacherAssignments: TeacherAssignment[] = [
    { id: 'ta-1', staffId: 'staff-3', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-ka', classSubjectId: 'cs-10-sub-math', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-2', staffId: 'staff-4', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-ka', classSubjectId: 'cs-10-sub-eng', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-3', staffId: 'staff-2', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-ka', classSubjectId: 'cs-10-sub-ban', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-4', staffId: 'staff-5', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-ka', classSubjectId: 'cs-10-sci-sub-phy', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-5', staffId: 'staff-5', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-ka', classSubjectId: 'cs-10-sci-sub-che', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-6', staffId: 'staff-6', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-ka', classSubjectId: 'cs-10-sci-sub-bio', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-7', staffId: 'staff-3', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-ka', classSubjectId: 'cs-10-sci-sub-hmath', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-8', staffId: 'staff-7', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-ka', classSubjectId: 'cs-10-sub-ict', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-9', staffId: 'staff-3', academicYearId: 'ay-2026', classId: 'cls-9', sectionId: 'sec-9-ka', classSubjectId: 'cs-9-sub-math', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-10', staffId: 'staff-4', academicYearId: 'ay-2026', classId: 'cls-9', sectionId: 'sec-9-ka', classSubjectId: 'cs-9-sub-eng', canEnterMarks: false, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-11', staffId: 'staff-3', academicYearId: 'ay-2026', classId: 'cls-8', sectionId: 'sec-8-ka', classSubjectId: 'cs-8-sub-math', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    // Additional realistic assignments across Classes 6–10 for full weekly timetable coverage
    { id: 'ta-12', staffId: 'staff-2', academicYearId: 'ay-2026', classId: 'cls-9', sectionId: 'sec-9-ka', classSubjectId: 'cs-9-sub-ban', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-13', staffId: 'staff-5', academicYearId: 'ay-2026', classId: 'cls-9', sectionId: 'sec-9-ka', classSubjectId: 'cs-9-sci-sub-phy', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-14', staffId: 'staff-6', academicYearId: 'ay-2026', classId: 'cls-9', sectionId: 'sec-9-ka', classSubjectId: 'cs-9-sci-sub-bio', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-15', staffId: 'staff-7', academicYearId: 'ay-2026', classId: 'cls-9', sectionId: 'sec-9-ka', classSubjectId: 'cs-9-sub-ict', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-16', staffId: 'staff-2', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-kha', classSubjectId: 'cs-10-sub-ban', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-17', staffId: 'staff-4', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-kha', classSubjectId: 'cs-10-sub-eng', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-18', staffId: 'staff-8', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-kha', classSubjectId: 'cs-10-bus-sub-acc', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-19', staffId: 'staff-9', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-kha', classSubjectId: 'cs-10-hum-sub-his', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-20', staffId: 'staff-7', academicYearId: 'ay-2026', classId: 'cls-10', sectionId: 'sec-10-kha', classSubjectId: 'cs-10-sub-ict', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-21', staffId: 'staff-2', academicYearId: 'ay-2026', classId: 'cls-8', sectionId: 'sec-8-ka', classSubjectId: 'cs-8-sub-ban', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-22', staffId: 'staff-4', academicYearId: 'ay-2026', classId: 'cls-8', sectionId: 'sec-8-ka', classSubjectId: 'cs-8-sub-eng', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-23', staffId: 'staff-5', academicYearId: 'ay-2026', classId: 'cls-8', sectionId: 'sec-8-ka', classSubjectId: 'cs-8-sub-sci', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-24', staffId: 'staff-7', academicYearId: 'ay-2026', classId: 'cls-8', sectionId: 'sec-8-ka', classSubjectId: 'cs-8-sub-ict', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-25', staffId: 'staff-9', academicYearId: 'ay-2026', classId: 'cls-8', sectionId: 'sec-8-ka', classSubjectId: 'cs-8-sub-bgs', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-26', staffId: 'staff-2', academicYearId: 'ay-2026', classId: 'cls-7', sectionId: 'sec-7-ka', classSubjectId: 'cs-7-sub-ban', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-27', staffId: 'staff-4', academicYearId: 'ay-2026', classId: 'cls-7', sectionId: 'sec-7-ka', classSubjectId: 'cs-7-sub-eng', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-28', staffId: 'staff-3', academicYearId: 'ay-2026', classId: 'cls-7', sectionId: 'sec-7-ka', classSubjectId: 'cs-7-sub-math', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-29', staffId: 'staff-6', academicYearId: 'ay-2026', classId: 'cls-7', sectionId: 'sec-7-ka', classSubjectId: 'cs-7-sub-sci', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-30', staffId: 'staff-9', academicYearId: 'ay-2026', classId: 'cls-7', sectionId: 'sec-7-ka', classSubjectId: 'cs-7-sub-bgs', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-31', staffId: 'staff-2', academicYearId: 'ay-2026', classId: 'cls-6', sectionId: 'sec-6-ka', classSubjectId: 'cs-6-sub-ban', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-32', staffId: 'staff-4', academicYearId: 'ay-2026', classId: 'cls-6', sectionId: 'sec-6-ka', classSubjectId: 'cs-6-sub-eng', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-33', staffId: 'staff-3', academicYearId: 'ay-2026', classId: 'cls-6', sectionId: 'sec-6-ka', classSubjectId: 'cs-6-sub-math', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-34', staffId: 'staff-6', academicYearId: 'ay-2026', classId: 'cls-6', sectionId: 'sec-6-ka', classSubjectId: 'cs-6-sub-sci', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-35', staffId: 'staff-7', academicYearId: 'ay-2026', classId: 'cls-6', sectionId: 'sec-6-ka', classSubjectId: 'cs-6-sub-ict', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-36', staffId: 'staff-9', academicYearId: 'ay-2026', classId: 'cls-6', sectionId: 'sec-6-ka', classSubjectId: 'cs-6-sub-bgs', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ta-37', staffId: 'staff-12', academicYearId: 'ay-2026', classId: 'cls-6', sectionId: 'sec-6-ka', classSubjectId: 'cs-6-sub-rel', canEnterMarks: true, assignedDate: '2026-01-05', isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  const sectionClassTeachers: SectionClassTeacher[] = [
    { id: 'sct-1', academicYearId: 'ay-2026', sectionId: 'sec-10-ka', staffId: 'staff-3', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
    { id: 'sct-2', academicYearId: 'ay-2026', sectionId: 'sec-9-ka', staffId: 'staff-4', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
    { id: 'sct-3', academicYearId: 'ay-2026', sectionId: 'sec-8-ka', staffId: 'staff-5', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
    { id: 'sct-4', academicYearId: 'ay-2026', sectionId: 'sec-7-ka', staffId: 'staff-6', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
    { id: 'sct-5', academicYearId: 'ay-2026', sectionId: 'sec-6-ka', staffId: 'staff-9', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
    { id: 'sct-6', academicYearId: 'ay-2026', sectionId: 'sec-10-kha', staffId: 'staff-8', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
    { id: 'sct-7', academicYearId: 'ay-2026', sectionId: 'sec-9-kha', staffId: 'staff-7', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
    { id: 'sct-8', academicYearId: 'ay-2026', sectionId: 'sec-8-kha', staffId: 'staff-2', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
    { id: 'sct-9', academicYearId: 'ay-2026', sectionId: 'sec-7-kha', staffId: 'staff-9', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
    { id: 'sct-10', academicYearId: 'ay-2026', sectionId: 'sec-6-kha', staffId: 'staff-6', assignedDate: '2026-01-05', createdAt: NOW, updatedAt: NOW },
  ];

  // Conflict-free 6-period weekly routine scheduler (Sunday–Thursday, Periods 1–6, Tiffin 12:15–12:45)
  // Guarantees zero teacher overlap, zero room overlap, and zero section overlap.
  const classRoutines: ClassRoutine[] = (() => {
    const result: ClassRoutine[] = [];
    const days: WeekDay[] = [
      WeekDay.SUNDAY,
      WeekDay.MONDAY,
      WeekDay.TUESDAY,
      WeekDay.WEDNESDAY,
      WeekDay.THURSDAY,
    ];
    const periods: Array<{ num: number; start: string; end: string }> = [
      { num: 1, start: '10:00', end: '10:45' },
      { num: 2, start: '10:45', end: '11:30' },
      { num: 3, start: '11:30', end: '12:15' },
      { num: 4, start: '12:45', end: '13:30' },
      { num: 5, start: '13:30', end: '14:15' },
      { num: 6, start: '14:15', end: '15:00' },
    ];
    const homerooms: Record<string, string> = {
      'sec-10-ka': 'রুম ২০১',
      'sec-10-kha': 'রুম ২০২',
      'sec-9-ka': 'রুম ১০৮',
      'sec-8-ka': 'রুম ১০৫',
      'sec-7-ka': 'রুম ১০৩',
      'sec-6-ka': 'রুম ১০১',
    };
    const sectionOrder = [
      'sec-10-ka',
      'sec-10-kha',
      'sec-9-ka',
      'sec-8-ka',
      'sec-7-ka',
      'sec-6-ka',
    ];

    const teacherBusy = new Set<string>();
    const roomBusy = new Set<string>();
    const sectionBusy = new Set<string>();
    let seq = 1;

    days.forEach((day, dIdx) => {
      periods.forEach((p, pIdx) => {
        sectionOrder.forEach((secId, sIdx) => {
          const secKey = `${day}|${p.num}|${secId}`;
          if (sectionBusy.has(secKey)) return;

          const secAssignments = teacherAssignments.filter(
            (ta) => ta.isActive && ta.academicYearId === 'ay-2026' && ta.sectionId === secId
          );
          if (!secAssignments.length) return;

          const alreadyToday = new Set(
            result
              .filter((r) => r.day === day && r.sectionId === secId)
              .map((r) => r.teacherAssignmentId)
          );

          const startOffset = (dIdx * 3 + pIdx * 2 + sIdx) % secAssignments.length;
          let picked: TeacherAssignment | null = null;

          // Prefer an assignment not yet taught in this section today and whose teacher is free
          for (let attempt = 0; attempt < secAssignments.length; attempt += 1) {
            const cand = secAssignments[(startOffset + attempt) % secAssignments.length];
            if (alreadyToday.has(cand.id)) continue;
            if (!teacherBusy.has(`${day}|${p.num}|${cand.staffId}`)) {
              picked = cand;
              break;
            }
          }
          // Fallback: allow repeat subject only if teacher is free and section has fewer than 6 unique assignments
          if (!picked && secAssignments.length < 6) {
            for (let attempt = 0; attempt < secAssignments.length; attempt += 1) {
              const cand = secAssignments[(startOffset + attempt) % secAssignments.length];
              if (!teacherBusy.has(`${day}|${p.num}|${cand.staffId}`)) {
                picked = cand;
                break;
              }
            }
          }
          if (!picked) return;

          const cs = classSubjects.find((item) => item.id === picked!.classSubjectId);
          const subId = cs?.subjectId ?? '';
          const preferredLab =
            subId === 'sub-ict'
              ? 'কম্পিউটার ল্যাব'
              : subId === 'sub-phy' || subId === 'sub-che' || subId === 'sub-bio'
                ? 'বিজ্ঞান ল্যাব'
                : null;
          const room =
            preferredLab && !roomBusy.has(`${day}|${p.num}|${preferredLab}`)
              ? preferredLab
              : homerooms[secId] ?? 'রুম ১০১';

          if (roomBusy.has(`${day}|${p.num}|${room}`)) return;

          teacherBusy.add(`${day}|${p.num}|${picked.staffId}`);
          roomBusy.add(`${day}|${p.num}|${room}`);
          sectionBusy.add(secKey);

          result.push({
            id: `cr-${seq++}`,
            academicYearId: 'ay-2026',
            teacherAssignmentId: picked.id,
            staffId: picked.staffId,
            sectionId: secId,
            day,
            periodNumber: p.num,
            startTime: p.start,
            endTime: p.end,
            room,
            createdAt: NOW,
            updatedAt: NOW,
          });
        });
      });
    });

    return result;
  })();


  return {
    teacherAssignments,
    sectionClassTeachers,
    classRoutines,
  };
}
