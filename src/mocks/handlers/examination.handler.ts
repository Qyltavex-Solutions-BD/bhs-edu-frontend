import { db, clone, uid, nowIso, addAudit } from '../state';
import {
  AttendanceSmsType,
  ExamStatus,
  ExamType,
  ResultPublicationStatus,
  ResultStatus,
  SmsStatus,
  SubjectCategory,
} from '@/src/types/enums';
import type {
  ConsolidatedExamConfig,
  Exam,
  ExamHallRoom,
  ExamSubject,
  GradeRange,
  GradingScale,
  Mark,
  ResultScrutinyRequest,
  ResultSummary,
  StudentSubjectResult,
} from '@/src/types/entities';
import { calculateOverallGpa, evaluateExamSubjectMark } from '@/src/lib/formatters';
import type { MockHandlerResult } from './types';
import { studentError } from './helpers';

export function handleExamsMock(
  endpoint: string,
  method: string,
  body?: unknown
): MockHandlerResult | null {
    // Helper: Recompute StudentSubjectResult & ResultSummary for an exam using unified NCTB component-pass logic
    const recalculateExamResults = (exam: Exam, markPublished: boolean) => {
      const scale = db.gradingScales.find((g) => g.id === exam.gradingScaleId) ?? db.gradingScales[0];
      const ranges = db.gradeRanges.filter((r) => r.gradingScaleId === scale.id && !r.isDeleted);
      const examSubs = db.examSubjects.filter((es) => es.examId === exam.id);
      const classEnrs = db.enrollments.filter(
        (enr) => enr.classId === exam.classId && enr.academicYearId === exam.academicYearId
      );
      const bonusThreshold = scale.optionalBonusThreshold ?? 2.0;

      // Preserve existing teacher remarks across recalculations
      const previousRemarks = new Map<string, string | null | undefined>();
      db.resultSummaries
        .filter((r) => r.examId === exam.id)
        .forEach((r) => previousRemarks.set(r.studentEnrollmentId, r.teacherRemarks));

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
          const g = evaluateExamSubjectMark(mk, es, ranges);
          const bonus = es.isOptional && g.isPassed ? Math.max(0, g.gradePoint - bonusThreshold) : 0;
          const ssr: StudentSubjectResult = {
            id: uid('ssr'),
            studentEnrollmentId: enr.id,
            examId: exam.id,
            examSubjectId: es.id,
            totalMarks: g.totalMarks,
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
          totalObtained += g.totalMarks;
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
          teacherRemarks: previousRemarks.get(enr.id) ?? null,
          publishedAt: markPublished ? nowIso() : exam.publishedAt ?? null,
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
      return generatedSummaries;
    };

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
        return { error: { status: 400, message: 'নম্বর এন্ট্রির সময়সীমা অতিক্রান্ত হয়েছে। ফলাফল প্রক্রিয়াকরণ থেকে সময়সীমা বাড়ান।' } };
      }

      // Strict server-side range check (no negative marks, no overflow above full marks)
      for (const entry of entries) {
        if (entry.isAbsent) continue;
        const w = Number(entry.writtenMarks) || 0;
        const m = Number(entry.mcqMarks) || 0;
        const p = Number(entry.practicalMarks) || 0;
        const ca = Number(entry.continuousAssessmentMarks) || 0;
        if (w < 0 || m < 0 || p < 0 || ca < 0) {
          return { error: { status: 400, message: 'নম্বর ঋণাত্মক (০-এর কম) হতে পারে না।' } };
        }
        if (es.hasWritten && w > (es.writtenFullMarks ?? es.fullMarks)) {
          return { error: { status: 400, message: `লিখিত নম্বর সর্বোচ্চ ${es.writtenFullMarks ?? es.fullMarks}-এর বেশি হতে পারে না।` } };
        }
        if (es.hasMcq && m > (es.mcqFullMarks ?? 0)) {
          return { error: { status: 400, message: `MCQ নম্বর সর্বোচ্চ ${es.mcqFullMarks ?? 0}-এর বেশি হতে পারে না।` } };
        }
        if (es.hasPractical && p > (es.practicalFullMarks ?? 0)) {
          return { error: { status: 400, message: `ব্যবহারিক নম্বর সর্বোচ্চ ${es.practicalFullMarks ?? 0}-এর বেশি হতে পারে না।` } };
        }
        if (es.hasContinuousAssessment && ca > (es.continuousAssessmentFullMarks ?? 0)) {
          return { error: { status: 400, message: `ধারাবাহিক মূল্যায়ন নম্বর সর্বোচ্চ ${es.continuousAssessmentFullMarks ?? 0}-এর বেশি হতে পারে না।` } };
        }
        if (w + m + p + ca > es.fullMarks) {
          return { error: { status: 400, message: `মোট নম্বর পূর্ণমান ${es.fullMarks}-এর বেশি হতে পারে না।` } };
        }
      }

      entries.forEach((entry) => {
        const w = entry.isAbsent ? 0 : Number(entry.writtenMarks) || 0;
        const m = entry.isAbsent ? 0 : Number(entry.mcqMarks) || 0;
        const p = entry.isAbsent ? 0 : Number(entry.practicalMarks) || 0;
        const ca = entry.isAbsent ? 0 : Number(entry.continuousAssessmentMarks) || 0;
        const total = w + m + p + ca;
        const existing = db.marks.find(
          (mk) =>
            mk.studentEnrollmentId === entry.studentEnrollmentId &&
            mk.examSubjectId === examSubjectId
        );
        if (existing) {
          existing.writtenMarks = w;
          existing.mcqMarks = m;
          existing.practicalMarks = p;
          existing.continuousAssessmentMarks = ca;
          existing.totalMarks = total;
          existing.isAbsent = entry.isAbsent;
          existing.enteredBy = enteredBy;
          existing.updatedAt = nowIso();
        } else {
          const mk: Mark = {
            id: uid('mk'),
            studentEnrollmentId: entry.studentEnrollmentId,
            examSubjectId,
            writtenMarks: w,
            mcqMarks: m,
            practicalMarks: p,
            continuousAssessmentMarks: ca,
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
      const { examId, action, extendDeadline, sendSms } = body as {
        examId: string;
        action: 'CALCULATE' | 'PUBLISH' | 'WITHHOLD' | 'LOCK' | 'UNLOCK';
        extendDeadline?: string;
        sendSms?: boolean;
      };
      const exam = db.exams.find((e) => e.id === examId);
      if (!exam) return { error: { status: 404, message: 'Exam not found' } };

      if (action === 'LOCK') {
        exam.isLocked = true;
        exam.updatedAt = nowIso();
        db.marks
          .filter((m) => db.examSubjects.some((es) => es.id === m.examSubjectId && es.examId === examId))
          .forEach((m) => (m.isLocked = true));
        addAudit('EXAM_LOCK', 'Examinations', `Locked marks for ${exam.name}`);
        return { data: { exam: clone(exam) } };
      }

      if (action === 'UNLOCK') {
        exam.isLocked = false;
        if (extendDeadline) {
          exam.marksEntryDeadline = extendDeadline;
        } else if (exam.marksEntryDeadline && new Date(exam.marksEntryDeadline) < new Date()) {
          // Auto-extend by 7 days when unlocking an expired exam so teachers/admins are never deadlocked
          const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          exam.marksEntryDeadline = nextWeek.toISOString();
        }
        exam.updatedAt = nowIso();
        db.marks
          .filter((m) => db.examSubjects.some((es) => es.id === m.examSubjectId && es.examId === examId))
          .forEach((m) => (m.isLocked = false));
        addAudit('EXAM_UNLOCK', 'Examinations', `Unlocked marks for ${exam.name}`);
        return { data: { exam: clone(exam) } };
      }

      if (action === 'WITHHOLD') {
        exam.resultStatus = ResultPublicationStatus.WITHHELD;
        exam.updatedAt = nowIso();
        addAudit('RESULT_WITHHOLD', 'Results', `Withheld results for ${exam.name}`);
        return { data: { exam: clone(exam) } };
      }

      const generatedSummaries = recalculateExamResults(exam, action === 'PUBLISH');
      let smsSentCount = 0;

      if (action === 'PUBLISH') {
        exam.resultStatus = ResultPublicationStatus.PUBLISHED;
        exam.publishedAt = nowIso();
        exam.isLocked = true;
        exam.status = 'COMPLETED' as Exam['status'];
        exam.updatedAt = nowIso();
        db.marks
          .filter((m) => db.examSubjects.some((es) => es.id === m.examSubjectId && es.examId === examId))
          .forEach((m) => (m.isLocked = true));

        if (sendSms) {
          generatedSummaries.forEach((sum) => {
            const enr = db.enrollments.find((e) => e.id === sum.studentEnrollmentId);
            const stu = enr ? db.students.find((s) => s.id === enr.studentId) : null;
            if (!stu || !enr) return;
            const link =
              db.parentStudents.find((ps) => ps.studentId === stu.id && ps.isSmsReceiver) ??
              db.parentStudents.find((ps) => ps.studentId === stu.id);
            const parent = link ? db.parents.find((p) => p.id === link.parentId) : null;
            if (!parent?.phone) return;
            const statusText = sum.resultStatus === ResultStatus.PASS ? `উত্তীর্ণ (GPA ${sum.gpa?.toFixed(2) ?? '0.00'})` : 'অনুত্তীর্ণ (F)';
            db.attendanceSmsLogs.unshift({
              id: uid('sms'),
              attendanceId: `exam-res-${sum.id}`,
              parentId: parent.id,
              smsType: AttendanceSmsType.RESULT,
              phone: parent.phone,
              message: `ভোজেশ্বর উচ্চ বিদ্যালয়: ${stu.nameBn || stu.nameEn} (রোল ${enr.roll}) — ${exam.name}-এ ফলাফল: ${statusText}, মোট নম্বর ${sum.totalMarks}/${sum.totalFullMarks}।`,
              status: SmsStatus.SENT,
              sentAt: nowIso(),
              createdAt: nowIso(),
            });
            smsSentCount += 1;
          });
        }

        db.notifications.unshift({
          id: uid('ntf'),
          type: 'RESULT_PUBLISHED',
          titleBn: `${exam.name} এর ফলাফল প্রকাশিত হয়েছে`,
          titleEn: `Results published for ${exam.name}`,
          bodyBn:
            smsSentCount > 0
              ? `এখন পাবলিক ফলাফল ও পোর্টাল থেকে মার্কশিট দেখা যাবে। ${smsSentCount} জন অভিভাবককে SMS পাঠানো হয়েছে।`
              : 'এখন পাবলিক ফলাফল ও পোর্টাল থেকে মার্কশিট দেখা যাবে।',
          bodyEn:
            smsSentCount > 0
              ? `Marksheets are now live on public result search and portals. ${smsSentCount} guardian SMS notifications queued.`
              : 'Marksheets are now live on public result search and portals.',
          createdAt: nowIso(),
          isRead: false,
          targetRoles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT'],
          link: '/results',
        });
        addAudit(
          'RESULT_PUBLISH',
          'Results',
          `Processed & published ${generatedSummaries.length} results for ${exam.name}${smsSentCount ? ` (${smsSentCount} SMS sent)` : ''}.`
        );
      } else {
        addAudit('RESULT_CALCULATE', 'Results', `Calculated preview results (${generatedSummaries.length} students) for ${exam.name}.`);
      }

      return { data: { exam: clone(exam), processedCount: generatedSummaries.length, smsSentCount } };
    }

    // 7B. Update Exam Metadata (Name, Type, Dates, Deadline, Grading Scale, Combined Pass)
    if (endpoint === '/exams/update' && method === 'POST') {
      const payload = body as Partial<Exam> & { id: string };
      const exam = db.exams.find((e) => e.id === payload.id);
      if (!exam) return { error: { status: 404, message: 'Exam not found' } };
      if (payload.name !== undefined) exam.name = payload.name.trim() || exam.name;
      if (payload.examType !== undefined) exam.examType = payload.examType;
      if (payload.startDate !== undefined) exam.startDate = payload.startDate;
      if (payload.endDate !== undefined) exam.endDate = payload.endDate;
      if (payload.status !== undefined) exam.status = payload.status;
      if (payload.gradingScaleId !== undefined) exam.gradingScaleId = payload.gradingScaleId;
      if (payload.marksEntryDeadline !== undefined) exam.marksEntryDeadline = payload.marksEntryDeadline;
      if (payload.allowCombinedPass !== undefined) exam.allowCombinedPass = payload.allowCombinedPass;
      if (payload.weightagePercentage !== undefined) exam.weightagePercentage = payload.weightagePercentage;
      exam.updatedAt = nowIso();
      addAudit('EXAM_UPDATE', 'Examinations', `Updated exam settings for ${exam.name}.`);
      return { data: clone(exam) };
    }

    // 7C. Upsert ExamSubject (Per-exam subject & Written/MCQ/Practical/CA marks configuration)
    if (endpoint === '/exams/subjects/upsert' && method === 'POST') {
      const payload = body as Partial<ExamSubject> & { examId: string; subjectId: string };
      const exam = db.exams.find((e) => e.id === payload.examId);
      if (!exam) return { error: { status: 404, message: 'Exam not found' } };
      if (exam.isLocked) {
        return { error: { status: 400, message: 'লক করা পরীক্ষার বিষয় কাঠামো পরিবর্তন করা যাবে না। আগে আনলক করুন।' } };
      }

      const hasWritten = Boolean(payload.hasWritten);
      const hasMcq = Boolean(payload.hasMcq);
      const hasPractical = Boolean(payload.hasPractical);
      const hasCa = Boolean(payload.hasContinuousAssessment);
      const wFull = hasWritten ? Number(payload.writtenFullMarks ?? 0) : 0;
      const mFull = hasMcq ? Number(payload.mcqFullMarks ?? 0) : 0;
      const pFull = hasPractical ? Number(payload.practicalFullMarks ?? 0) : 0;
      const caFull = hasCa ? Number(payload.continuousAssessmentFullMarks ?? 0) : 0;
      const computedFull = wFull + mFull + pFull + caFull;
      const fullMarks = Number(payload.fullMarks ?? computedFull);

      if (fullMarks <= 0) {
        return { error: { status: 400, message: 'পূর্ণমান ০-এর বেশি হতে হবে।' } };
      }
      if (computedFull > 0 && computedFull !== fullMarks) {
        return {
          error: {
            status: 400,
            message: `উপাংশের যোগফল (${computedFull}) এবং পূর্ণমান (${fullMarks}) সমান হতে হবে।`,
          },
        };
      }

      const wPass = hasWritten ? Number(payload.writtenPassMarks ?? 0) : 0;
      const mPass = hasMcq ? Number(payload.mcqPassMarks ?? 0) : 0;
      const pPass = hasPractical ? Number(payload.practicalPassMarks ?? 0) : 0;
      const caPass = hasCa ? Number(payload.continuousAssessmentPassMarks ?? 0) : 0;
      const passMarks = Number(payload.passMarks ?? Math.ceil(fullMarks * 0.33));

      if (wPass > wFull || mPass > mFull || pPass > pFull || caPass > caFull || passMarks > fullMarks) {
        return { error: { status: 400, message: 'পাশ নম্বর কখনোই পূর্ণমানের বেশি হতে পারে না।' } };
      }

      if (payload.id) {
        const existing = db.examSubjects.find((es) => es.id === payload.id);
        if (!existing) return { error: { status: 404, message: 'Exam subject not found' } };
        existing.subjectId = payload.subjectId;
        existing.groupId = payload.groupId ?? null;
        existing.fullMarks = fullMarks;
        existing.passMarks = passMarks;
        existing.hasWritten = hasWritten;
        existing.writtenFullMarks = wFull;
        existing.writtenPassMarks = wPass;
        existing.hasMcq = hasMcq;
        existing.mcqFullMarks = mFull;
        existing.mcqPassMarks = mPass;
        existing.hasPractical = hasPractical;
        existing.practicalFullMarks = pFull;
        existing.practicalPassMarks = pPass;
        existing.hasContinuousAssessment = hasCa;
        existing.continuousAssessmentFullMarks = caFull;
        existing.continuousAssessmentPassMarks = caPass;
        existing.isOptional = Boolean(payload.isOptional);
        if (payload.displayOrder !== undefined) existing.displayOrder = payload.displayOrder;
        addAudit('EXAM_SUBJECT_UPDATE', 'Examinations', `Updated subject config ${existing.id} for ${exam.name}.`);
        return { data: clone(existing) };
      }

      const duplicate = db.examSubjects.find(
        (es) =>
          es.examId === payload.examId &&
          es.subjectId === payload.subjectId &&
          (es.groupId ?? null) === (payload.groupId ?? null)
      );
      if (duplicate) {
        return { error: { status: 409, message: 'এই পরীক্ষায় এই বিষয়টি ইতিমধ্যেই যুক্ত আছে।' } };
      }

      const created: ExamSubject = {
        id: uid('es'),
        examId: payload.examId,
        subjectId: payload.subjectId,
        groupId: payload.groupId ?? null,
        fullMarks,
        passMarks,
        hasWritten,
        writtenFullMarks: wFull,
        writtenPassMarks: wPass,
        hasMcq,
        mcqFullMarks: mFull,
        mcqPassMarks: mPass,
        hasPractical,
        practicalFullMarks: pFull,
        practicalPassMarks: pPass,
        hasContinuousAssessment: hasCa,
        continuousAssessmentFullMarks: caFull,
        continuousAssessmentPassMarks: caPass,
        isOptional: Boolean(payload.isOptional),
        displayOrder:
          payload.displayOrder ??
          db.examSubjects.filter((es) => es.examId === payload.examId).length + 1,
      };
      db.examSubjects.push(created);
      addAudit('EXAM_SUBJECT_CREATE', 'Examinations', `Added subject ${payload.subjectId} to ${exam.name}.`);
      return { data: clone(created) };
    }

    // 7D. Delete ExamSubject
    if (endpoint === '/exams/subjects/delete' && method === 'POST') {
      const { id } = body as { id: string };
      const idx = db.examSubjects.findIndex((es) => es.id === id);
      if (idx < 0) return { error: { status: 404, message: 'Exam subject not found' } };
      const target = db.examSubjects[idx];
      const exam = db.exams.find((e) => e.id === target.examId);
      if (exam?.isLocked) {
        return { error: { status: 400, message: 'লক করা পরীক্ষা থেকে বিষয় মুছা যাবে না।' } };
      }
      db.examSubjects.splice(idx, 1);
      db.marks = db.marks.filter((m) => m.examSubjectId !== id);
      db.examRoutines = db.examRoutines.filter((r) => r.examSubjectId !== id);
      addAudit('EXAM_SUBJECT_DELETE', 'Examinations', `Removed exam subject ${id}.`);
      return { data: { deletedId: id } };
    }

    // 7E. Upsert GradingScale
    if (endpoint === '/exams/grading-scales/upsert' && method === 'POST') {
      const payload = body as Partial<GradingScale> & { id?: string };
      const name = payload.name?.trim() ?? '';
      if (!name) return { error: { status: 400, message: 'গ্রেডিং স্কেলের নাম দিন।' } };
      const maxGpa = Number(payload.maxGpa ?? 5.0);
      const optionalBonusThreshold = Number(payload.optionalBonusThreshold ?? 2.0);
      if (maxGpa <= 0 || maxGpa > 10) {
        return { error: { status: 400, message: 'সর্বোচ্চ GPA ০ থেকে ১০-এর মধ্যে হতে হবে।' } };
      }
      if (payload.isDefault) {
        db.gradingScales.forEach((gs) => (gs.isDefault = false));
      }
      if (payload.id) {
        const existing = db.gradingScales.find((gs) => gs.id === payload.id);
        if (!existing) return { error: { status: 404, message: 'Grading scale not found' } };
        existing.name = name;
        existing.description = payload.description ?? existing.description;
        existing.maxGpa = maxGpa;
        existing.optionalBonusThreshold = optionalBonusThreshold;
        if (payload.isDefault !== undefined) existing.isDefault = payload.isDefault;
        if (payload.isActive !== undefined) existing.isActive = payload.isActive;
        existing.updatedAt = nowIso();
        addAudit('GRADING_SCALE_UPDATE', 'Examinations', `Updated grading scale ${existing.name}.`);
        return { data: clone(existing) };
      }
      const created: GradingScale = {
        id: uid('gs'),
        name,
        description: payload.description ?? null,
        maxGpa,
        optionalBonusThreshold,
        isDefault: Boolean(payload.isDefault),
        isSystemDefault: false,
        isActive: true,
        isDeleted: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.gradingScales.push(created);
      // Seed starter ranges copied from default scale so it's immediately usable
      const templateRanges = db.gradeRanges.filter((r) => r.gradingScaleId === 'gs-nctb-5' && !r.isDeleted);
      templateRanges.forEach((tr) => {
        db.gradeRanges.push({
          ...tr,
          id: uid('gr'),
          gradingScaleId: created.id,
        });
      });
      addAudit('GRADING_SCALE_CREATE', 'Examinations', `Created grading scale ${created.name}.`);
      return { data: clone(created) };
    }

    // 7F. Upsert GradeRange
    if (endpoint === '/exams/grade-ranges/upsert' && method === 'POST') {
      const payload = body as Partial<GradeRange> & { gradingScaleId: string };
      const letterGrade = payload.letterGrade?.trim() ?? '';
      if (!letterGrade) return { error: { status: 400, message: 'লেটার গ্রেড লিখুন (যেমন A+)।' } };
      const minP = Number(payload.minPercentage ?? 0);
      const maxP = Number(payload.maxPercentage ?? 100);
      const gp = Number(payload.gradePoint ?? 0);
      if (minP < 0 || maxP > 100 || minP > maxP) {
        return { error: { status: 400, message: 'সঠিক শতকরা সীমা দিন (০% থেকে ১০০%)।' } };
      }
      if (payload.id) {
        const existing = db.gradeRanges.find((r) => r.id === payload.id);
        if (!existing) return { error: { status: 404, message: 'Grade range not found' } };
        existing.minPercentage = minP;
        existing.maxPercentage = maxP;
        existing.letterGrade = letterGrade;
        existing.gradePoint = gp;
        existing.remarks = payload.remarks ?? null;
        existing.isFailGrade = Boolean(payload.isFailGrade);
        if (payload.displayOrder !== undefined) existing.displayOrder = payload.displayOrder;
        addAudit('GRADE_RANGE_UPDATE', 'Examinations', `Updated grade band ${letterGrade}.`);
        return { data: clone(existing) };
      }
      const created: GradeRange = {
        id: uid('gr'),
        gradingScaleId: payload.gradingScaleId,
        minPercentage: minP,
        maxPercentage: maxP,
        letterGrade,
        gradePoint: gp,
        remarks: payload.remarks ?? null,
        isFailGrade: Boolean(payload.isFailGrade),
        displayOrder:
          payload.displayOrder ??
          db.gradeRanges.filter((r) => r.gradingScaleId === payload.gradingScaleId && !r.isDeleted).length + 1,
        isDeleted: false,
      };
      db.gradeRanges.push(created);
      addAudit('GRADE_RANGE_CREATE', 'Examinations', `Added grade band ${letterGrade}.`);
      return { data: clone(created) };
    }

    // 7G. Delete GradeRange
    if (endpoint === '/exams/grade-ranges/delete' && method === 'POST') {
      const { id } = body as { id: string };
      const target = db.gradeRanges.find((r) => r.id === id);
      if (!target) return { error: { status: 404, message: 'Grade range not found' } };
      target.isDeleted = true;
      target.deletedAt = nowIso();
      addAudit('GRADE_RANGE_DELETE', 'Examinations', `Removed grade band ${target.letterGrade}.`);
      return { data: { deletedId: id } };
    }

    // 7H. Save Consolidated Exam Weightage Configuration
    if (endpoint === '/exams/consolidated/save' && method === 'POST') {
      const { consolidatedExamId, items } = body as {
        consolidatedExamId: string;
        items: Array<{ sourceExamId: string; weightagePercentage: number }>;
      };
      const targetExam = db.exams.find((e) => e.id === consolidatedExamId);
      if (!targetExam) return { error: { status: 404, message: 'Consolidated exam not found' } };
      if (!items || items.length < 2) {
        return { error: { status: 400, message: 'কমপক্ষে ২টি পরীক্ষা নির্বাচন করুন।' } };
      }
      const uniqueIds = new Set(items.map((i) => i.sourceExamId));
      if (uniqueIds.size !== items.length) {
        return { error: { status: 400, message: 'একই পরীক্ষা একাধিকবার নির্বাচন করা যাবে না।' } };
      }
      const totalWeight = items.reduce((s, i) => s + Number(i.weightagePercentage || 0), 0);
      if (Math.round(totalWeight) !== 100) {
        return { error: { status: 400, message: `মোট ওয়েটেজ ১০০% হতে হবে (বর্তমানে ${totalWeight}%)।` } };
      }
      db.consolidatedConfigs = db.consolidatedConfigs.filter(
        (c) => c.consolidatedExamId !== consolidatedExamId
      );
      const nextConfigs: ConsolidatedExamConfig[] = items.map((item, idx) => ({
        id: uid('cc'),
        consolidatedExamId,
        sourceExamId: item.sourceExamId,
        weightagePercentage: Number(item.weightagePercentage),
        displayOrder: idx + 1,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }));
      db.consolidatedConfigs.push(...nextConfigs);
      addAudit('CONSOLIDATED_CONFIG_SAVE', 'Results', `Saved ${nextConfigs.length}-exam weightage for ${targetExam.name}.`);
      return { data: clone(nextConfigs) };
    }

    // 7I. Upsert & Delete Exam Hall Rooms (Multi-Room Seat Plan & Invigilators)
    if (endpoint === '/exams/hall-rooms/upsert' && method === 'POST') {
      const payload = body as Partial<ExamHallRoom> & { examId: string; roomNo: string; capacity: number };
      if (!payload.roomNo?.trim()) return { error: { status: 400, message: 'কক্ষ নম্বর দিন।' } };
      const capacity = Number(payload.capacity || 0);
      if (capacity <= 0) return { error: { status: 400, message: 'আসন সংখ্যা ০-এর বেশি হতে হবে।' } };
      if (payload.id) {
        const existing = db.examHallRooms.find((r) => r.id === payload.id);
        if (!existing) return { error: { status: 404, message: 'Hall room not found' } };
        existing.roomNo = payload.roomNo.trim();
        existing.buildingName = payload.buildingName?.trim() || null;
        existing.capacity = capacity;
        existing.invigilatorStaffId = payload.invigilatorStaffId || null;
        existing.assistantInvigilatorStaffId = payload.assistantInvigilatorStaffId || null;
        existing.notes = payload.notes?.trim() || null;
        existing.updatedAt = nowIso();
        addAudit('HALL_ROOM_UPDATE', 'Examinations', `Updated hall room ${existing.roomNo}.`);
        return { data: clone(existing) };
      }
      const created: ExamHallRoom = {
        id: uid('ehr'),
        examId: payload.examId,
        roomNo: payload.roomNo.trim(),
        buildingName: payload.buildingName?.trim() || null,
        capacity,
        invigilatorStaffId: payload.invigilatorStaffId || null,
        assistantInvigilatorStaffId: payload.assistantInvigilatorStaffId || null,
        notes: payload.notes?.trim() || null,
        displayOrder: db.examHallRooms.filter((r) => r.examId === payload.examId).length + 1,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.examHallRooms.push(created);
      addAudit('HALL_ROOM_CREATE', 'Examinations', `Added hall room ${created.roomNo} (cap ${created.capacity}).`);
      return { data: clone(created) };
    }

    if (endpoint === '/exams/hall-rooms/delete' && method === 'POST') {
      const { id } = body as { id: string };
      const idx = db.examHallRooms.findIndex((r) => r.id === id);
      if (idx < 0) return { error: { status: 404, message: 'Hall room not found' } };
      db.examHallRooms.splice(idx, 1);
      addAudit('HALL_ROOM_DELETE', 'Examinations', `Deleted hall room ${id}.`);
      return { data: { deletedId: id } };
    }

    // 7J. Result Scrutiny / Re-evaluation Workflow (Board-style Khata Challenge)
    if (endpoint === '/exams/scrutiny/upsert' && method === 'POST') {
      const payload = body as Partial<ResultScrutinyRequest> & {
        examId: string;
        studentEnrollmentId: string;
        examSubjectId: string;
      };
      const exam = db.exams.find((e) => e.id === payload.examId);
      const es = db.examSubjects.find((x) => x.id === payload.examSubjectId);
      if (!exam || !es) return { error: { status: 404, message: 'Exam or subject not found' } };

      const existingMark = db.marks.find(
        (m) => m.studentEnrollmentId === payload.studentEnrollmentId && m.examSubjectId === payload.examSubjectId
      );

      if (payload.id) {
        const reqItem = db.resultScrutinyRequests.find((r) => r.id === payload.id);
        if (!reqItem) return { error: { status: 404, message: 'Scrutiny request not found' } };
        const nextStatus = payload.status ?? reqItem.status;
        reqItem.status = nextStatus;
        reqItem.reviewerNote = payload.reviewerNote?.trim() || reqItem.reviewerNote;
        reqItem.resolvedBy = payload.resolvedBy ?? 'পরীক্ষা নিয়ন্ত্রক';
        if (nextStatus === 'UPDATED' || nextStatus === 'NO_CHANGE') {
          reqItem.resolvedAt = nowIso();
        }
        if (nextStatus === 'UPDATED') {
          const rw = Number(payload.revisedWrittenMarks ?? existingMark?.writtenMarks ?? 0);
          const rm = Number(payload.revisedMcqMarks ?? existingMark?.mcqMarks ?? 0);
          const rp = Number(payload.revisedPracticalMarks ?? existingMark?.practicalMarks ?? 0);
          const rca = Number(payload.revisedCaMarks ?? existingMark?.continuousAssessmentMarks ?? 0);
          if (rw < 0 || rm < 0 || rp < 0 || rca < 0 || rw + rm + rp + rca > es.fullMarks) {
            return { error: { status: 400, message: `সংশোধিত নম্বর ০ থেকে ${es.fullMarks}-এর মধ্যে হতে হবে।` } };
          }
          const revisedTotal = rw + rm + rp + rca;
          reqItem.revisedWrittenMarks = rw;
          reqItem.revisedMcqMarks = rm;
          reqItem.revisedPracticalMarks = rp;
          reqItem.revisedCaMarks = rca;
          reqItem.revisedTotalMarks = revisedTotal;

          if (existingMark) {
            existingMark.writtenMarks = rw;
            existingMark.mcqMarks = rm;
            existingMark.practicalMarks = rp;
            existingMark.continuousAssessmentMarks = rca;
            existingMark.totalMarks = revisedTotal;
            existingMark.isAbsent = false;
            existingMark.updatedAt = nowIso();
          } else {
            db.marks.push({
              id: uid('mk'),
              studentEnrollmentId: payload.studentEnrollmentId,
              examSubjectId: payload.examSubjectId,
              writtenMarks: rw,
              mcqMarks: rm,
              practicalMarks: rp,
              continuousAssessmentMarks: rca,
              totalMarks: revisedTotal,
              isAbsent: false,
              isLocked: exam.isLocked,
              enteredBy: 'scrutiny-panel',
              createdAt: nowIso(),
              updatedAt: nowIso(),
            });
          }
          // Immediately recalculate exam results & merit list after verified scrutiny update
          recalculateExamResults(exam, exam.resultStatus === ResultPublicationStatus.PUBLISHED);
          addAudit(
            'RESULT_SCRUTINY_UPDATE',
            'Results',
            `Scrutiny ${reqItem.id} updated marks (${reqItem.previousTotalMarks} → ${revisedTotal}) and recalculated ${exam.name}.`
          );
        } else {
          addAudit('RESULT_SCRUTINY_RESOLVE', 'Results', `Scrutiny ${reqItem.id} marked as ${nextStatus}.`);
        }
        return { data: clone(reqItem) };
      }

      const created: ResultScrutinyRequest = {
        id: uid('scr'),
        examId: payload.examId,
        studentEnrollmentId: payload.studentEnrollmentId,
        examSubjectId: payload.examSubjectId,
        reason: payload.reason?.trim() || 'উত্তরপত্র পুনঃনিরীক্ষণের আবেদন',
        status: 'PENDING',
        previousTotalMarks: existingMark?.totalMarks ?? 0,
        revisedWrittenMarks: null,
        revisedMcqMarks: null,
        revisedPracticalMarks: null,
        revisedCaMarks: null,
        revisedTotalMarks: null,
        reviewerNote: null,
        requestedAt: nowIso(),
        resolvedAt: null,
        resolvedBy: null,
      };
      db.resultScrutinyRequests.unshift(created);
      addAudit('RESULT_SCRUTINY_CREATE', 'Results', `Filed scrutiny request ${created.id} for ${exam.name}.`);
      return { data: clone(created) };
    }

    // 7K. Save Class Teacher Remarks on ResultSummary
    if (endpoint === '/exams/remarks/save' && method === 'POST') {
      const { resultSummaryId, teacherRemarks } = body as {
        resultSummaryId: string;
        teacherRemarks: string;
      };
      const summary = db.resultSummaries.find((s) => s.id === resultSummaryId);
      if (!summary) return { error: { status: 404, message: 'Result summary not found' } };
      summary.teacherRemarks = teacherRemarks.trim() || null;
      summary.updatedAt = nowIso();
      addAudit('RESULT_REMARK_SAVE', 'Results', `Updated class teacher remark on result ${resultSummaryId}.`);
      return { data: clone(summary) };
    }

    // 8. Save Daily Attendance Batch + Auto-Dispatch SMS
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
      // Auto-attach configured NCTB classSubjects as examSubjects so Marks Entry & Exam Routine work immediately
      const configuredSubjects = db.classSubjects.filter(
        (cs) => cs.academicYearId === exam.academicYearId && cs.classId === exam.classId
      );
      configuredSubjects.forEach((cs, idx) => {
        const sub = db.subjects.find((s) => s.id === cs.subjectId);
        const isIct = sub?.id === 'sub-ict' || sub?.officialCode === '154';
        const isEng = sub?.id === 'sub-eng' || sub?.officialCode === '107' || sub?.officialCode === '108';
        const hasPractical =
          isIct ||
          sub?.category === SubjectCategory.SCIENCE ||
          sub?.id === 'sub-phy' ||
          sub?.id === 'sub-che' ||
          sub?.id === 'sub-bio' ||
          sub?.id === 'sub-hmath' ||
          sub?.id === 'sub-agri';
        const fullMarks = isIct ? 50 : 100;
        const passMarks = isIct ? 17 : 33;
        db.examSubjects.push({
          id: uid('es'),
          examId: exam.id,
          subjectId: cs.subjectId,
          groupId: cs.groupId ?? null,
          fullMarks,
          passMarks,
          hasWritten: !isIct,
          writtenFullMarks: isIct ? 0 : isEng ? 100 : hasPractical ? 50 : 70,
          writtenPassMarks: isIct ? 0 : isEng ? 33 : hasPractical ? 17 : 23,
          hasMcq: !isEng,
          mcqFullMarks: isEng ? 0 : hasPractical ? 25 : 30,
          mcqPassMarks: isEng ? 0 : hasPractical ? 8 : 10,
          hasPractical,
          practicalFullMarks: hasPractical ? 25 : 0,
          practicalPassMarks: hasPractical ? (isIct ? 9 : 8) : 0,
          hasContinuousAssessment: false,
          isOptional: cs.isOptional ?? false,
          displayOrder: idx + 1,
        });
      });
      addAudit('EXAM_CREATE', 'Examinations', `Created exam: ${exam.name} (${configuredSubjects.length} subjects attached).`);
      return { data: clone(exam) };
    }

    // 24. Drag-and-Drop Reorder for Banners & Quick Links

  return null;
}
