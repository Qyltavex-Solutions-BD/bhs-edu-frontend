import {
  ExamRoutineStatus,
  ExamStatus,
  ExamType,
  ResultPublicationStatus,
  ResultStatus,
} from '@/src/types/enums';
import type {
  ConsolidatedExamConfig,
  Exam,
  ExamHallRoom,
  ExamRoutine,
  ExamSubject,
  GradeRange,
  GradingScale,
  Mark,
  ResultScrutinyRequest,
  ResultSummary,
  StudentEnrollment,
  StudentSubjectResult,
} from '@/src/types/entities';
import { calculateOverallGpa, evaluateExamSubjectMark } from '@/src/lib/formatters';
import { NOW } from './common';

export function createExaminationFixtures(enrollments: StudentEnrollment[]) {
  // 8. Grading Scale & Grade Ranges (Configurable NCTB Secondary 5.00 scale)
  const gradingScales: GradingScale[] = [
    {
      id: 'gs-nctb-5',
      name: 'NCTB Secondary Grading Scale (5.00)',
      description: 'বাংলাদেশ মাধ্যমিক শিক্ষা বোর্ড অনুসৃত ৫.০০ স্কেল (বিদ্যালয় নীতিমালা অনুযায়ী পরিবর্তনযোগ্য)',
      maxGpa: 5.0,
      optionalBonusThreshold: 2.0,
      isDefault: true,
      isSystemDefault: true,
      isActive: true,
      isDeleted: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const gradeRanges: GradeRange[] = [
    { id: 'gr-1', gradingScaleId: 'gs-nctb-5', minPercentage: 80, maxPercentage: 100, letterGrade: 'A+', gradePoint: 5.0, remarks: 'অসাধারণ / Outstanding', isFailGrade: false, displayOrder: 1, isDeleted: false },
    { id: 'gr-2', gradingScaleId: 'gs-nctb-5', minPercentage: 70, maxPercentage: 79.99, letterGrade: 'A', gradePoint: 4.0, remarks: 'অতি উত্তম / Excellent', isFailGrade: false, displayOrder: 2, isDeleted: false },
    { id: 'gr-3', gradingScaleId: 'gs-nctb-5', minPercentage: 60, maxPercentage: 69.99, letterGrade: 'A-', gradePoint: 3.5, remarks: 'উত্তম / Very Good', isFailGrade: false, displayOrder: 3, isDeleted: false },
    { id: 'gr-4', gradingScaleId: 'gs-nctb-5', minPercentage: 50, maxPercentage: 59.99, letterGrade: 'B', gradePoint: 3.0, remarks: 'ভালো / Good', isFailGrade: false, displayOrder: 4, isDeleted: false },
    { id: 'gr-5', gradingScaleId: 'gs-nctb-5', minPercentage: 40, maxPercentage: 49.99, letterGrade: 'C', gradePoint: 2.0, remarks: 'সন্তোষজনক / Satisfactory', isFailGrade: false, displayOrder: 5, isDeleted: false },
    { id: 'gr-6', gradingScaleId: 'gs-nctb-5', minPercentage: 33, maxPercentage: 39.99, letterGrade: 'D', gradePoint: 1.0, remarks: 'গ্রহণযোগ্য / Pass', isFailGrade: false, displayOrder: 6, isDeleted: false },
    { id: 'gr-7', gradingScaleId: 'gs-nctb-5', minPercentage: 0, maxPercentage: 32.99, letterGrade: 'F', gradePoint: 0.0, remarks: 'অকৃতকার্য / Fail', isFailGrade: true, displayOrder: 7, isDeleted: false },
  ];

  // 9. Exams:
  // - exam-hy-10: Half-Yearly 2026 Class 10 (PUBLISHED - searchable on public /results!)
  // - exam-hy-9: Half-Yearly 2026 Class 9 (PUBLISHED)
  // - exam-ann-10: Annual 2026 Class 10 (ONGOING / DRAFT - live marks entry -> lock -> process -> publish flow!)
  // - exam-sel-10: Selection Exam 2026 Class 10 (WITHHELD - demonstrates withheld protection on public search!)
  // - exam-cons-10: Consolidated 2026 Class 10 (DRAFT)
  const exams: Exam[] = [
    {
      id: 'exam-hy-10',
      academicYearId: 'ay-2026',
      classId: 'cls-10',
      gradingScaleId: 'gs-nctb-5',
      name: 'অর্ধবার্ষিক পরীক্ষা ২০২৬ (১০ম শ্রেণি)',
      examType: ExamType.HALF_YEARLY,
      startDate: '2026-06-15',
      endDate: '2026-06-28',
      status: ExamStatus.COMPLETED,
      marksEntryDeadline: '2026-07-10T23:59:00.000Z',
      allowCombinedPass: true,
      weightagePercentage: 30,
      resultStatus: ResultPublicationStatus.PUBLISHED,
      publishedAt: '2026-07-15T10:00:00.000Z',
      isLocked: true,
      isDeleted: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'exam-hy-9',
      academicYearId: 'ay-2026',
      classId: 'cls-9',
      gradingScaleId: 'gs-nctb-5',
      name: 'অর্ধবার্ষিক পরীক্ষা ২০২৬ (৯ম শ্রেণি)',
      examType: ExamType.HALF_YEARLY,
      startDate: '2026-06-15',
      endDate: '2026-06-28',
      status: ExamStatus.COMPLETED,
      marksEntryDeadline: '2026-07-10T23:59:00.000Z',
      allowCombinedPass: true,
      weightagePercentage: 30,
      resultStatus: ResultPublicationStatus.PUBLISHED,
      publishedAt: '2026-07-15T10:00:00.000Z',
      isLocked: true,
      isDeleted: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'exam-ann-10',
      academicYearId: 'ay-2026',
      classId: 'cls-10',
      gradingScaleId: 'gs-nctb-5',
      name: 'বার্ষিক / নির্বাচনি প্রস্তুতি পরীক্ষা ২০২৬ (১০ম শ্রেণি)',
      examType: ExamType.ANNUAL,
      startDate: '2026-11-10',
      endDate: '2026-11-24',
      status: ExamStatus.ONGOING,
      marksEntryDeadline: '2026-12-10T23:59:00.000Z',
      allowCombinedPass: true,
      weightagePercentage: 70,
      resultStatus: ResultPublicationStatus.DRAFT,
      publishedAt: null,
      isLocked: false,
      isDeleted: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'exam-sel-10',
      academicYearId: 'ay-2026',
      classId: 'cls-10',
      gradingScaleId: 'gs-nctb-5',
      name: 'মডেল টেস্ট ২০২৬ (১০ম শ্রেণি — ফলাফল স্থগিত)',
      examType: ExamType.MODEL_TEST,
      startDate: '2026-09-10',
      endDate: '2026-09-20',
      status: ExamStatus.COMPLETED,
      marksEntryDeadline: '2026-09-28T23:59:00.000Z',
      allowCombinedPass: true,
      resultStatus: ResultPublicationStatus.WITHHELD,
      publishedAt: null,
      isLocked: true,
      isDeleted: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'exam-cons-10',
      academicYearId: 'ay-2026',
      classId: 'cls-10',
      gradingScaleId: 'gs-nctb-5',
      name: 'সমন্বিত চূড়ান্ত ফলাফল ২০২৬ (১০ম শ্রেণি)',
      examType: ExamType.CONSOLIDATED,
      startDate: '2026-12-15',
      endDate: '2026-12-20',
      status: ExamStatus.UPCOMING,
      allowCombinedPass: true,
      resultStatus: ResultPublicationStatus.DRAFT,
      isLocked: false,
      isDeleted: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const consolidatedConfigs: ConsolidatedExamConfig[] = [
    { id: 'cc-1', consolidatedExamId: 'exam-cons-10', sourceExamId: 'exam-hy-10', weightagePercentage: 30, displayOrder: 1, createdAt: NOW, updatedAt: NOW },
    { id: 'cc-2', consolidatedExamId: 'exam-cons-10', sourceExamId: 'exam-ann-10', weightagePercentage: 70, displayOrder: 2, createdAt: NOW, updatedAt: NOW },
  ];

  const makeExamSubjects = (examId: string): ExamSubject[] => [
    { id: `es-${examId}-ban`, examId, subjectId: 'sub-ban', groupId: null, fullMarks: 100, passMarks: 33, hasWritten: true, writtenFullMarks: 70, writtenPassMarks: 23, hasMcq: true, mcqFullMarks: 30, mcqPassMarks: 10, hasPractical: false, hasContinuousAssessment: false, isOptional: false, displayOrder: 1 },
    { id: `es-${examId}-eng`, examId, subjectId: 'sub-eng', groupId: null, fullMarks: 100, passMarks: 33, hasWritten: true, writtenFullMarks: 100, writtenPassMarks: 33, hasMcq: false, hasPractical: false, hasContinuousAssessment: false, isOptional: false, displayOrder: 2 },
    { id: `es-${examId}-math`, examId, subjectId: 'sub-math', groupId: null, fullMarks: 100, passMarks: 33, hasWritten: true, writtenFullMarks: 70, writtenPassMarks: 23, hasMcq: true, mcqFullMarks: 30, mcqPassMarks: 10, hasPractical: false, hasContinuousAssessment: false, isOptional: false, displayOrder: 3 },
    { id: `es-${examId}-phy`, examId, subjectId: 'sub-phy', groupId: 'grp-sci', fullMarks: 100, passMarks: 33, hasWritten: true, writtenFullMarks: 50, writtenPassMarks: 17, hasMcq: true, mcqFullMarks: 25, mcqPassMarks: 8, hasPractical: true, practicalFullMarks: 25, practicalPassMarks: 8, hasContinuousAssessment: false, isOptional: false, displayOrder: 4 },
    { id: `es-${examId}-che`, examId, subjectId: 'sub-che', groupId: 'grp-sci', fullMarks: 100, passMarks: 33, hasWritten: true, writtenFullMarks: 50, writtenPassMarks: 17, hasMcq: true, mcqFullMarks: 25, mcqPassMarks: 8, hasPractical: true, practicalFullMarks: 25, practicalPassMarks: 8, hasContinuousAssessment: false, isOptional: false, displayOrder: 5 },
    { id: `es-${examId}-ict`, examId, subjectId: 'sub-ict', groupId: null, fullMarks: 50, passMarks: 17, hasWritten: false, hasMcq: true, mcqFullMarks: 25, mcqPassMarks: 8, hasPractical: true, practicalFullMarks: 25, practicalPassMarks: 9, hasContinuousAssessment: false, isOptional: false, displayOrder: 6 },
    { id: `es-${examId}-hmath`, examId, subjectId: 'sub-hmath', groupId: 'grp-sci', fullMarks: 100, passMarks: 33, hasWritten: true, writtenFullMarks: 50, writtenPassMarks: 17, hasMcq: true, mcqFullMarks: 25, mcqPassMarks: 8, hasPractical: true, practicalFullMarks: 25, practicalPassMarks: 8, hasContinuousAssessment: false, isOptional: true, displayOrder: 7 },
  ];

  const examSubjects: ExamSubject[] = [
    ...makeExamSubjects('exam-hy-10'),
    ...makeExamSubjects('exam-hy-9'),
    ...makeExamSubjects('exam-ann-10'),
  ];

  const examRoutines: ExamRoutine[] = [
    { id: 'er-1', examId: 'exam-ann-10', examSubjectId: 'es-exam-ann-10-ban', examDate: '2026-11-22', startTime: '10:00', endTime: '13:00', roomNo: 'হল রুম ১০১', status: ExamRoutineStatus.SCHEDULED, instructions: 'পরীক্ষা শুরুর ৩০ মিনিট পূর্বে প্রবেশপত্রসহ উপস্থিত থাকতে হবে।', isDeleted: false, createdAt: NOW, updatedAt: NOW },
    { id: 'er-2', examId: 'exam-ann-10', examSubjectId: 'es-exam-ann-10-eng', examDate: '2026-11-24', startTime: '10:00', endTime: '13:00', roomNo: 'হল রুম ১০১', status: ExamRoutineStatus.SCHEDULED, instructions: 'অতিরিক্ত উত্তরপত্রে রোল নম্বর স্পষ্টভাবে লিখতে হবে।', isDeleted: false, createdAt: NOW, updatedAt: NOW },
    { id: 'er-3', examId: 'exam-ann-10', examSubjectId: 'es-exam-ann-10-math', examDate: '2026-11-26', startTime: '10:00', endTime: '13:00', roomNo: 'হল রুম ১০১', status: ExamRoutineStatus.SCHEDULED, instructions: 'সাধারণ নন-প্রোগ্রামেবল ক্যালকুলেটর অনুমোদিত।', isDeleted: false, createdAt: NOW, updatedAt: NOW },
    { id: 'er-4', examId: 'exam-ann-10', examSubjectId: 'es-exam-ann-10-phy', examDate: '2026-11-29', startTime: '10:00', endTime: '13:00', roomNo: 'বিজ্ঞান ভবন ২০১', status: ExamRoutineStatus.SCHEDULED, instructions: 'ব্যবহারিক খাতা নির্ধারিত তারিখে জমা দিতে হবে।', isDeleted: false, createdAt: NOW, updatedAt: NOW },
    { id: 'er-5', examId: 'exam-ann-10', examSubjectId: 'es-exam-ann-10-che', examDate: '2026-12-01', startTime: '10:00', endTime: '13:00', roomNo: 'বিজ্ঞান ভবন ২০১', status: ExamRoutineStatus.SCHEDULED, isDeleted: false, createdAt: NOW, updatedAt: NOW },
    { id: 'er-6', examId: 'exam-ann-10', examSubjectId: 'es-exam-ann-10-ict', examDate: '2026-12-03', startTime: '10:00', endTime: '11:30', roomNo: 'কম্পিউটার ল্যাব', status: ExamRoutineStatus.SCHEDULED, isDeleted: false, createdAt: NOW, updatedAt: NOW },
  ];

  // Generate realistic Marks & calculated Results for PUBLISHED exams + partial marks for Annual 2026
  const marks: Mark[] = [];
  const studentSubjectResults: StudentSubjectResult[] = [];
  const resultSummaries: ResultSummary[] = [];

  const scoreProfiles: Record<string, number[]> = {
    'enr-stu-10-1': [86, 84, 92, 88, 85, 46, 90], // GPA 5.00 Topper
    'enr-stu-10-2': [82, 80, 85, 79, 81, 44, 84], // GPA 5.00 (with optional bonus!)
    'enr-stu-10-3': [76, 72, 81, 74, 70, 42, 78], // GPA 4.50
    'enr-stu-10-4': [68, 65, 62, 66, 61, 38, 64], // GPA 3.75
    'enr-stu-10-5': [55, 48, 28, 52, 46, 35, 50], // FAIL in Math!
    'enr-stu-10-6': [78, 74, 68, 0, 0, 43, 0], // Humanities
    'enr-stu-10-7': [62, 58, 64, 0, 0, 39, 0], // Business
    'enr-stu-9-1': [84, 86, 89, 82, 80, 45, 86], // Class 9 Topper
    'enr-stu-9-2': [72, 68, 75, 70, 66, 40, 72],
    'enr-stu-9-3': [80, 77, 83, 78, 74, 43, 81],
    'enr-stu-9-4': [64, 60, 58, 0, 0, 37, 0],
  };

  const buildExamMarksAndResults = (examId: string, classId: string, locked: boolean, publishResults: boolean) => {
    const subs = examSubjects.filter((es) => es.examId === examId);
    const classEnrs = enrollments.filter((e) => e.classId === classId);
    const summariesForExam: ResultSummary[] = [];

    classEnrs.forEach((enr) => {
      const profile = scoreProfiles[enr.id] ?? [70, 68, 72, 66, 65, 38, 70];
      const applicableSubs = subs.filter((es) => !es.groupId || es.groupId === enr.groupId);
      const subResList: StudentSubjectResult[] = [];
      let totalFull = 0;
      let totalGot = 0;

      applicableSubs.forEach((es, idx) => {
        const subIdx = subs.findIndex((x) => x.id === es.id);
        const rawScore = Math.min(es.fullMarks, profile[subIdx] ?? 65 + (idx % 10));
        const writtenMarks = es.hasWritten
          ? Math.min(es.writtenFullMarks ?? 0, Math.round(rawScore * ((es.writtenFullMarks ?? 0) / es.fullMarks)))
          : 0;
        const mcqMarks = es.hasMcq
          ? Math.min(es.mcqFullMarks ?? 0, Math.round(rawScore * ((es.mcqFullMarks ?? 0) / es.fullMarks)))
          : 0;
        const practicalMarks = es.hasPractical
          ? Math.min(es.practicalFullMarks ?? 0, Math.max(0, rawScore - writtenMarks - mcqMarks))
          : 0;
        const total = writtenMarks + mcqMarks + practicalMarks;

        marks.push({
          id: `mk-${examId}-${enr.id}-${es.id}`,
          studentEnrollmentId: enr.id,
          examSubjectId: es.id,
          writtenMarks,
          mcqMarks,
          practicalMarks,
          continuousAssessmentMarks: 0,
          totalMarks: total,
          isAbsent: false,
          isLocked: locked,
          enteredBy: 'user-teacher-1',
          createdAt: NOW,
          updatedAt: NOW,
        });

        if (publishResults) {
          const g = evaluateExamSubjectMark(
            {
              writtenMarks,
              mcqMarks,
              practicalMarks,
              continuousAssessmentMarks: 0,
              isAbsent: false,
            },
            es,
            gradeRanges
          );
          const bonus = es.isOptional && g.isPassed ? Math.max(0, g.gradePoint - 2.0) : 0;
          const ssr: StudentSubjectResult = {
            id: `ssr-${examId}-${enr.id}-${es.id}`,
            studentEnrollmentId: enr.id,
            examId,
            examSubjectId: es.id,
            totalMarks: total,
            letterGrade: g.letterGrade,
            gradePoint: g.gradePoint,
            isPassed: g.isPassed,
            isOptional: es.isOptional,
            bonusGradePoint: bonus,
            isAbsent: false,
            calculatedAt: NOW,
          };
          studentSubjectResults.push(ssr);
          subResList.push(ssr);
          totalFull += es.fullMarks;
          totalGot += total;
        }
      });

      if (publishResults && subResList.length > 0) {
        const overall = calculateOverallGpa(
          subResList.map((r) => ({
            gradePoint: r.gradePoint ?? 0,
            isPassed: r.isPassed,
            isOptional: r.isOptional,
          })),
          gradingScales[0],
          gradeRanges
        );

        const defaultRemark = !overall.isPassed
          ? 'গণিত ও মৌলিক বিষয়ে অতিরিক্ত অনুশীলন ও নিয়মিত ক্লাস উপস্থিতি প্রয়োজন।'
          : overall.gpa >= 5.0
            ? 'অসাধারণ মেধা ও ধারাবাহিক কৃতিত্ব; উজ্জ্বল ভবিষ্যতের জন্য শুভকামনা।'
            : overall.gpa >= 4.0
              ? 'অতি উত্তম ফলাফল; আরও মনোযোগী হলে জিপিএ ৫.০০ অর্জন সম্ভব।'
              : 'সন্তোষজনক অগ্রগতি; নিয়মিত অনুশীলন অব্যাহত রাখলে আরও ভালো করবে।';

        summariesForExam.push({
          id: `res-${examId}-${enr.id}`,
          studentEnrollmentId: enr.id,
          examId,
          totalFullMarks: totalFull,
          totalMarks: totalGot,
          gpa: overall.gpa,
          gpaWithoutOptional: overall.gpaWithoutOptional,
          letterGrade: overall.letterGrade,
          meritPosition: null,
          sectionMeritPosition: null,
          failedSubjectCount: overall.failedSubjectCount,
          resultStatus: overall.isPassed ? ResultStatus.PASS : ResultStatus.FAIL,
          teacherRemarks: defaultRemark,
          publishedAt: '2026-07-15T10:00:00.000Z',
          createdAt: NOW,
          updatedAt: NOW,
        });
      }
    });

    // Rank merit positions among PASS students
    const passed = summariesForExam
      .filter((s) => s.resultStatus === ResultStatus.PASS)
      .sort((a, b) => (b.gpa ?? 0) - (a.gpa ?? 0) || b.totalMarks - a.totalMarks);
    passed.forEach((s, idx) => {
      s.meritPosition = idx + 1;
    });

    // Section merit position
    const bySec = new Map<string, ResultSummary[]>();
    passed.forEach((s) => {
      const enr = enrollments.find((e) => e.id === s.studentEnrollmentId);
      if (!enr) return;
      const arr = bySec.get(enr.sectionId) ?? [];
      arr.push(s);
      bySec.set(enr.sectionId, arr);
    });
    bySec.forEach((arr) => {
      arr.forEach((s, idx) => {
        s.sectionMeritPosition = idx + 1;
      });
    });

    resultSummaries.push(...summariesForExam);
  };

  buildExamMarksAndResults('exam-hy-10', 'cls-10', true, true);
  buildExamMarksAndResults('exam-hy-9', 'cls-9', true, true);
  // Seed draft marks for Annual 2026 Class 10 so teachers/admin can edit, lock, process & publish live!
  buildExamMarksAndResults('exam-ann-10', 'cls-10', false, false);

  const examHallRooms: ExamHallRoom[] = [
    {
      id: 'ehr-ann-10-1',
      examId: 'exam-ann-10',
      roomNo: 'হল রুম ১০১',
      buildingName: 'মূল একাডেমিক ভবন (২য় তলা)',
      capacity: 4,
      invigilatorStaffId: 'staff-3',
      assistantInvigilatorStaffId: 'staff-4',
      notes: '১০ম শ্রেণি (বিজ্ঞান ও মানবিক)',
      displayOrder: 1,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ehr-ann-10-2',
      examId: 'exam-ann-10',
      roomNo: 'বিজ্ঞান ভবন ২০১',
      buildingName: 'বিজ্ঞান ভবন (২য় তলা)',
      capacity: 4,
      invigilatorStaffId: 'staff-5',
      assistantInvigilatorStaffId: 'staff-7',
      notes: 'অতিরিক্ত ও ব্যবসায় শিক্ষা আসন',
      displayOrder: 2,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ehr-hy-10-1',
      examId: 'exam-hy-10',
      roomNo: 'হল রুম ১০১',
      buildingName: 'মূল একাডেমিক ভবন (২য় তলা)',
      capacity: 4,
      invigilatorStaffId: 'staff-3',
      assistantInvigilatorStaffId: 'staff-6',
      notes: 'অর্ধবার্ষিক পরীক্ষা কেন্দ্র কক্ষ ১',
      displayOrder: 1,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ehr-hy-10-2',
      examId: 'exam-hy-10',
      roomNo: 'হল রুম ১০২',
      buildingName: 'মূল একাডেমিক ভবন (২য় তলা)',
      capacity: 4,
      invigilatorStaffId: 'staff-8',
      assistantInvigilatorStaffId: 'staff-9',
      notes: 'অর্ধবার্ষিক পরীক্ষা কেন্দ্র কক্ষ ২',
      displayOrder: 2,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ehr-hy-9-1',
      examId: 'exam-hy-9',
      roomNo: 'হল রুম ২০৩',
      buildingName: 'নতুন একাডেমিক ভবন',
      capacity: 6,
      invigilatorStaffId: 'staff-4',
      assistantInvigilatorStaffId: 'staff-7',
      notes: '৯ম শ্রেণির সকল শাখা',
      displayOrder: 1,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const resultScrutinyRequests: ResultScrutinyRequest[] = [
    {
      id: 'scr-1',
      examId: 'exam-hy-10',
      studentEnrollmentId: 'enr-stu-10-4',
      examSubjectId: 'es-exam-hy-10-math',
      reason: 'সৃজনশীল অংশে ৩ নং প্রশ্নের যোগফল পুনঃযাচাইয়ের আবেদন।',
      status: 'PENDING',
      previousTotalMarks: 62,
      revisedWrittenMarks: null,
      revisedMcqMarks: null,
      revisedPracticalMarks: null,
      revisedCaMarks: null,
      revisedTotalMarks: null,
      reviewerNote: null,
      requestedAt: '2026-07-17T11:30:00.000Z',
      resolvedAt: null,
      resolvedBy: null,
    },
    {
      id: 'scr-2',
      examId: 'exam-hy-10',
      studentEnrollmentId: 'enr-stu-10-3',
      examSubjectId: 'es-exam-hy-10-eng',
      reason: 'ইংরেজি রচনা অংশের নম্বর পুনর্গণনা।',
      status: 'NO_CHANGE',
      previousTotalMarks: 72,
      revisedWrittenMarks: 72,
      revisedMcqMarks: 0,
      revisedPracticalMarks: 0,
      revisedCaMarks: 0,
      revisedTotalMarks: 72,
      reviewerNote: 'খাতা যাচাই করে সকল প্রশ্নের যোগফল সঠিক পাওয়া গেছে।',
      requestedAt: '2026-07-16T09:15:00.000Z',
      resolvedAt: '2026-07-18T14:20:00.000Z',
      resolvedBy: 'প্রধান পরীক্ষক',
    },
  ];


  return {
    gradingScales,
    gradeRanges,
    exams,
    examSubjects,
    examRoutines,
    examHallRooms,
    marks,
    studentSubjectResults,
    resultSummaries,
    resultScrutinyRequests,
    consolidatedConfigs,
  };
}
