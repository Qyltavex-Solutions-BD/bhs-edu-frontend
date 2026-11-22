'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Archive,
  Calculator,
  CalendarClock,
  CheckCircle2,
  Download,
  ExternalLink,
  Globe,
  Lock,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  Unlock,
} from 'lucide-react';
import {
  useCreateExamMutation,
  useDeleteCmsItemMutation,
  useGetBootstrapQuery,
  useProcessExamResultsMutation,
  useSaveMarksBatchMutation,
  useToggleArchiveMutation,
  useUpsertCmsItemMutation,
} from '@/src/store/api';
import { useAppSelector } from '@/src/store/hooks';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { exportToCsv, triggerPrint } from '@/src/lib/utils/cn';
import { LoadingSkeleton, PageHeader } from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import {
  Button,
  Card,
  FormField,
  Input,
  Modal,
  SegmentedTabs,
  Select,
} from '@/src/components/ui/primitives';
import {
  PrintableExamSeatPlan,
  PrintableMarksheet,
  PrintableTabulationSheet,
} from '@/src/components/print/PrintDocuments';
import {
  ExamRoutineStatus,
  ExamType,
  ResultPublicationStatus,
  ResultStatus,
} from '@/src/types/enums';
import type { ExamSubject, GradeRange } from '@/src/types/entities';

type ExamsTab =
  | 'exams'
  | 'routines'
  | 'marks'
  | 'publication'
  | 'merit'
  | 'grading'
  | 'consolidated';

const WEEKDAYS_BN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function weekdayLabel(isoDate: string, locale: 'bn' | 'en') {
  const dt = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return '—';
  const idx = dt.getDay();
  return locale === 'bn' ? WEEKDAYS_BN[idx] : WEEKDAYS_EN[idx];
}

function evaluateRowGrade(
  es: ExamSubject,
  m: { written: number; mcq: number; practical: number; isAbsent: boolean },
  ranges: GradeRange[]
) {
  if (m.isAbsent) {
    return { total: 0, letterGrade: 'AB', gradePoint: 0, isPassed: false, failReason: 'AB' };
  }
  const written = es.hasWritten ? Number(m.written) || 0 : 0;
  const mcq = es.hasMcq ? Number(m.mcq) || 0 : 0;
  const practical = es.hasPractical ? Number(m.practical) || 0 : 0;
  const total = written + mcq + practical;

  const failedWritten = es.hasWritten && es.writtenPassMarks != null && written < es.writtenPassMarks;
  const failedMcq = es.hasMcq && es.mcqPassMarks != null && mcq < es.mcqPassMarks;
  const failedPractical =
    es.hasPractical && es.practicalPassMarks != null && practical < es.practicalPassMarks;
  const failedTotal = total < es.passMarks;

  if (failedWritten || failedMcq || failedPractical || failedTotal) {
    const reasons: string[] = [];
    if (failedWritten) reasons.push('W');
    if (failedMcq) reasons.push('MCQ');
    if (failedPractical) reasons.push('PR');
    return {
      total,
      letterGrade: 'F',
      gradePoint: 0,
      isPassed: false,
      failReason: reasons.join('/'),
    };
  }

  const pct = es.fullMarks > 0 ? Math.round((total / es.fullMarks) * 100) : 0;
  const matched =
    ranges.find((r) => pct >= r.minPercentage && pct <= r.maxPercentage) ??
    ranges[ranges.length - 1];
  return {
    total,
    letterGrade: matched?.letterGrade ?? 'D',
    gradePoint: matched?.gradePoint ?? 1.0,
    isPassed: !(matched?.isFailGrade ?? false),
    failReason: '',
  };
}

export function AdminExamsAndResultsPage({
  defaultTab = 'exams',
}: {
  defaultTab?: ExamsTab;
}) {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [createExam, { isLoading: creatingExam }] = useCreateExamMutation();
  const [saveMarks, { isLoading: savingMarks }] = useSaveMarksBatchMutation();
  const [processResults, { isLoading: processing }] = useProcessExamResultsMutation();
  const [toggleArchive] = useToggleArchiveMutation();
  const [upsertCms, { isLoading: savingRoutine }] = useUpsertCmsItemMutation();
  const [deleteCms] = useDeleteCmsItemMutation();
  const auth = useAppSelector((s) => s.auth);
  const { locale, pick } = useI18n();

  const [tab, setTab] = useState<ExamsTab>(defaultTab);
  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  // Global exam / subject / section selection
  const [selectedExamId, setSelectedExamId] = useState('exam-ann-10');
  const [selectedSubjectId, setSelectedSubjectId] = useState('es-exam-ann-10-math');
  const [marksSectionId, setMarksSectionId] = useState('ALL');
  const [marksSearch, setMarksSearch] = useState('');

  // Exam list filters
  const [examClassFilter, setExamClassFilter] = useState('ALL');
  const [examPubFilter, setExamPubFilter] = useState('ALL');
  const [examSearch, setExamSearch] = useState('');

  // Merit list filters
  const [meritSectionId, setMeritSectionId] = useState('ALL');
  const [meritStatusFilter, setMeritStatusFilter] = useState('ALL');
  const [meritSearch, setMeritSearch] = useState('');

  // Marks entry draft map
  const [draftMarks, setDraftMarks] = useState<
    Record<string, { written: number; mcq: number; practical: number; isAbsent: boolean }>
  >({});

  // Modals
  const [previewStudentEnrId, setPreviewStudentEnrId] = useState<string | null>(null);
  const [tabulationOpen, setTabulationOpen] = useState(false);
  const [seatPlanOpen, setSeatPlanOpen] = useState(false);
  const [newExamOpen, setNewExamOpen] = useState(false);
  const [newExamForm, setNewExamForm] = useState({
    name: '',
    classId: 'cls-10',
    examType: ExamType.MODEL_TEST,
    startDate: '2026-12-05',
    endDate: '2026-12-12',
  });

  // Exam Routine CRUD modal
  const [routineModalOpen, setRoutineModalOpen] = useState(false);
  const [routineForm, setRoutineForm] = useState({
    id: '',
    examSubjectId: '',
    examDate: '2026-11-18',
    startTime: '10:00',
    endTime: '13:00',
    roomNo: 'হল রুম ২০১',
    status: ExamRoutineStatus.SCHEDULED as ExamRoutineStatus,
    instructions: 'পরীক্ষা শুরুর ৩০ মিনিট পূর্বে আসন গ্রহণ করতে হবে।',
  });

  const activeExam = useMemo(() => {
    if (!db) return undefined;
    return (
      db.exams.find((e) => e.id === selectedExamId) ??
      db.exams.find((e) => !e.isDeleted) ??
      db.exams[0]
    );
  }, [db, selectedExamId]);

  const examSubs = useMemo(
    () =>
      db && activeExam
        ? db.examSubjects
            .filter((es) => es.examId === activeExam.id)
            .sort((a, b) => a.displayOrder - b.displayOrder)
        : [],
    [db, activeExam]
  );

  const currentExamSub = useMemo(
    () => examSubs.find((es) => es.id === selectedSubjectId) ?? examSubs[0] ?? null,
    [examSubs, selectedSubjectId]
  );

  const classSections = useMemo(() => {
    if (!db || !activeExam) return [];
    return db.sections.filter((s) => s.classId === activeExam.classId && s.isActive);
  }, [db, activeExam]);

  const activeScaleRanges = useMemo(() => {
    if (!db || !activeExam) return [];
    return db.gradeRanges
      .filter((r) => r.gradingScaleId === activeExam.gradingScaleId && !r.isDeleted)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [db, activeExam]);

  const allExamEnrollments = useMemo(() => {
    if (!db || !activeExam) return [];
    return db.enrollments
      .filter(
        (e) =>
          e.classId === activeExam.classId &&
          e.academicYearId === activeExam.academicYearId
      )
      .sort((a, b) => a.roll - b.roll);
  }, [db, activeExam]);

  const targetEnrollments = useMemo(() => {
    if (!db || !activeExam) return [];
    const q = marksSearch.trim().toLowerCase();
    return allExamEnrollments
      .filter((e) => !currentExamSub?.groupId || currentExamSub.groupId === e.groupId)
      .filter((e) => marksSectionId === 'ALL' || e.sectionId === marksSectionId)
      .filter((e) => {
        if (!q) return true;
        const stu = db.students.find((s) => s.id === e.studentId);
        return (
          String(e.roll).includes(q) ||
          (stu?.studentId ?? '').toLowerCase().includes(q) ||
          (stu?.nameEn ?? '').toLowerCase().includes(q) ||
          (stu?.nameBn ?? '').toLowerCase().includes(q)
        );
      });
  }, [db, activeExam, allExamEnrollments, currentExamSub, marksSectionId, marksSearch]);

  const activeRoutines = useMemo(() => {
    if (!db || !activeExam) return [];
    return db.examRoutines
      .filter((r) => r.examId === activeExam.id && !r.isDeleted)
      .sort((a, b) =>
        `${a.examDate} ${a.startTime}`.localeCompare(`${b.examDate} ${b.startTime}`)
      );
  }, [db, activeExam]);

  const examSummaries = useMemo(() => {
    if (!db || !activeExam) return [];
    return db.resultSummaries
      .filter((r) => r.examId === activeExam.id)
      .sort((a, b) => (a.meritPosition ?? 999) - (b.meritPosition ?? 999));
  }, [db, activeExam]);

  const filteredMeritSummaries = useMemo(() => {
    if (!db) return [];
    const q = meritSearch.trim().toLowerCase();
    return examSummaries.filter((res) => {
      const enr = db.enrollments.find((e) => e.id === res.studentEnrollmentId);
      if (meritSectionId !== 'ALL' && enr?.sectionId !== meritSectionId) return false;
      if (meritStatusFilter !== 'ALL' && res.resultStatus !== meritStatusFilter) return false;
      if (!q) return true;
      const stu = enr ? db.students.find((s) => s.id === enr.studentId) : null;
      return (
        String(enr?.roll ?? '').includes(q) ||
        (stu?.studentId ?? '').toLowerCase().includes(q) ||
        (stu?.nameEn ?? '').toLowerCase().includes(q) ||
        (stu?.nameBn ?? '').toLowerCase().includes(q)
      );
    });
  }, [db, examSummaries, meritSectionId, meritStatusFilter, meritSearch]);

  if (isLoading || !db) return <LoadingSkeleton />;

  // Platform-wide Exam KPIs
  const activeExamsList = db.exams.filter((e) => !e.isDeleted);
  const publishedExamsCount = activeExamsList.filter(
    (e) => e.resultStatus === ResultPublicationStatus.PUBLISHED
  ).length;
  const totalRoutineSlots = db.examRoutines.filter((r) => !r.isDeleted).length;
  const totalSummaries = db.resultSummaries.length;
  const passedSummaries = db.resultSummaries.filter(
    (r) => r.resultStatus === ResultStatus.PASS
  ).length;
  const overallPassRate = totalSummaries
    ? Math.round((passedSummaries / totalSummaries) * 100)
    : 0;

  // Filtered Exam Directory
  const filteredExams = db.exams.filter((ex) => {
    if (examClassFilter !== 'ALL' && ex.classId !== examClassFilter) return false;
    if (examPubFilter !== 'ALL' && ex.resultStatus !== examPubFilter) return false;
    if (examSearch.trim()) {
      const q = examSearch.trim().toLowerCase();
      const cls = db.classes.find((c) => c.id === ex.classId);
      if (
        !ex.name.toLowerCase().includes(q) &&
        !(cls?.name ?? '').toLowerCase().includes(q) &&
        !(cls?.nameBn ?? '').toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const getMarkState = (enrId: string) => {
    if (draftMarks[enrId]) return draftMarks[enrId];
    const existing = currentExamSub
      ? db.marks.find(
          (m) => m.studentEnrollmentId === enrId && m.examSubjectId === currentExamSub.id
        )
      : null;
    return {
      written: existing?.writtenMarks ?? 0,
      mcq: existing?.mcqMarks ?? 0,
      practical: existing?.practicalMarks ?? 0,
      isAbsent: existing?.isAbsent ?? false,
    };
  };

  const dirtyCount = Object.keys(draftMarks).length;

  const isMarksLocked = Boolean(
    activeExam?.isLocked ||
      (activeExam?.marksEntryDeadline && new Date(activeExam.marksEntryDeadline) < new Date())
  );

  const handleSaveMarksSheet = async () => {
    if (!activeExam || !currentExamSub) return;
    for (const enr of targetEnrollments) {
      const m = getMarkState(enr.id);
      if (m.isAbsent) continue;
      if (currentExamSub.hasWritten && m.written > (currentExamSub.writtenFullMarks ?? 100)) {
        toast.error(
          pick(
            `রোল ${enr.roll}: লিখিত নম্বর পূর্ণমানের (${currentExamSub.writtenFullMarks}) চেয়ে বেশি!`,
            `Roll ${enr.roll}: Written exceeds full marks (${currentExamSub.writtenFullMarks})!`
          )
        );
        return;
      }
      if (currentExamSub.hasMcq && m.mcq > (currentExamSub.mcqFullMarks ?? 100)) {
        toast.error(
          pick(
            `রোল ${enr.roll}: MCQ নম্বর পূর্ণমানের (${currentExamSub.mcqFullMarks}) চেয়ে বেশি!`,
            `Roll ${enr.roll}: MCQ exceeds full marks (${currentExamSub.mcqFullMarks})!`
          )
        );
        return;
      }
      if (currentExamSub.hasPractical && m.practical > (currentExamSub.practicalFullMarks ?? 100)) {
        toast.error(
          pick(
            `রোল ${enr.roll}: ব্যবহারিক নম্বর পূর্ণমানের (${currentExamSub.practicalFullMarks}) চেয়ে বেশি!`,
            `Roll ${enr.roll}: Practical exceeds full marks (${currentExamSub.practicalFullMarks})!`
          )
        );
        return;
      }
    }
    try {
      const res = await saveMarks({
        examId: activeExam.id,
        examSubjectId: currentExamSub.id,
        enteredBy: auth.user?.id ?? 'user-admin',
        entries: targetEnrollments.map((enr) => {
          const m = getMarkState(enr.id);
          return {
            studentEnrollmentId: enr.id,
            writtenMarks: Number(m.written),
            mcqMarks: Number(m.mcq),
            practicalMarks: Number(m.practical),
            continuousAssessmentMarks: 0,
            isAbsent: m.isAbsent,
          };
        }),
      }).unwrap();
      setDraftMarks({});
      toast.success(
        pick(
          `${formatNumber(res.savedCount, 'bn')} জন শিক্ষার্থীর নম্বর সংরক্ষিত হয়েছে।`,
          `Saved marks for ${res.savedCount} students.`
        )
      );
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? 'Failed to save marks');
    }
  };

  const handleProcessAction = async (
    examId: string,
    action: 'CALCULATE' | 'PUBLISH' | 'WITHHOLD' | 'LOCK' | 'UNLOCK'
  ) => {
    try {
      await processResults({ examId, action }).unwrap();
      const msgs: Record<typeof action, string> = {
        CALCULATE: pick(
          'ফলাফল ও মেধাক্রম গণনা সম্পন্ন হয়েছে (প্রিভিউ প্রস্তুত)।',
          'Results & merit positions calculated.'
        ),
        PUBLISH: pick(
          'ফলাফল প্রকাশিত হয়েছে! এখন পাবলিক ফলাফল পৃষ্ঠা (/results) থেকে দেখা যাবে।',
          'Results published! Now searchable on /results.'
        ),
        WITHHOLD: pick('ফলাফল স্থগিত (Withheld) করা হয়েছে।', 'Results marked Withheld.'),
        LOCK: pick('নম্বর এন্ট্রি লক করা হয়েছে।', 'Marks locked.'),
        UNLOCK: pick('নম্বর এন্ট্রি আনলক করা হয়েছে।', 'Marks unlocked.'),
      };
      toast.success(msgs[action]);
    } catch {
      toast.error(pick('প্রক্রিয়াকরণে ত্রুটি হয়েছে।', 'Operation failed.'));
    }
  };

  const openAddRoutine = () => {
    if (!activeExam) return;
    setRoutineForm({
      id: '',
      examSubjectId: examSubs[0]?.id ?? '',
      examDate: activeExam.startDate || '2026-11-18',
      startTime: '10:00',
      endTime: '13:00',
      roomNo: 'হল রুম ২০১',
      status: ExamRoutineStatus.SCHEDULED,
      instructions: 'পরীক্ষা শুরুর ৩০ মিনিট পূর্বে আসন গ্রহণ করতে হবে।',
    });
    setRoutineModalOpen(true);
  };

  const handleSaveRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExam || !routineForm.examSubjectId || !routineForm.examDate) {
      toast.error(pick('বিষয় ও তারিখ নির্বাচন করুন।', 'Select subject and exam date.'));
      return;
    }
    try {
      await upsertCms({
        collection: 'examRoutines',
        item: {
          ...(routineForm.id ? { id: routineForm.id } : {}),
          examId: activeExam.id,
          examSubjectId: routineForm.examSubjectId,
          sectionId: null,
          examDate: routineForm.examDate,
          startTime: routineForm.startTime,
          endTime: routineForm.endTime,
          roomNo: routineForm.roomNo.trim() || null,
          status: routineForm.status,
          instructions: routineForm.instructions.trim() || null,
          isDeleted: false,
        },
      }).unwrap();
      toast.success(
        routineForm.id
          ? pick('পরীক্ষার রুটিন হালনাগাদ হয়েছে।', 'Exam routine slot updated.')
          : pick('পরীক্ষার রুটিন যুক্ত হয়েছে।', 'Exam routine slot added.')
      );
      setRoutineModalOpen(false);
    } catch {
      toast.error(pick('রুটিন সংরক্ষণ ব্যর্থ হয়েছে।', 'Failed to save routine slot.'));
    }
  };

  const activeExamYearName =
    db.academicYears.find((y) => y.id === activeExam?.academicYearId)?.name ?? '2026';

  // Active exam analytics (for Publication & Merit KPI strips)
  const activePassedCount = examSummaries.filter((r) => r.resultStatus === ResultStatus.PASS).length;
  const activeFailedCount = examSummaries.filter((r) => r.resultStatus !== ResultStatus.PASS).length;
  const activeGpa5Count = examSummaries.filter(
    (r) => r.resultStatus === ResultStatus.PASS && (r.gpa ?? 0) >= 5.0
  ).length;
  const activePassPct = examSummaries.length
    ? Math.round((activePassedCount / examSummaries.length) * 100)
    : 0;
  const activeHighestMarks = examSummaries.reduce((max, r) => Math.max(max, r.totalMarks), 0);
  const activeAvgGpa = activePassedCount
    ? examSummaries
        .filter((r) => r.resultStatus === ResultStatus.PASS)
        .reduce((sum, r) => sum + (r.gpa ?? 0), 0) / activePassedCount
    : 0;

  // Subjects completeness count for activeExam
  const subjectsWithMarksCount = examSubs.filter((es) =>
    db.marks.some((m) => m.examSubjectId === es.id)
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('পরীক্ষা, রুটিন, নম্বর ও ফলাফল', 'Examinations, Routines, Marks & Results')}
        description={pick(
          'এনসিটিবি (৫.০০) নীতিমালা অনুযায়ী পরীক্ষার রুটিন, বিষয়ভিত্তিক নম্বর এন্ট্রি, জিপিএ গণনা, প্রকাশনা ও মার্কশিট প্রিন্ট।',
          'NCTB 5.00 examination timetable, component marks entry, GPA processing, publication, and printable marksheets.'
        )}
        actions={
          <div className="flex flex-wrap items-center gap-2 no-print">
            <Link href="/academics/examination" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4" />
                {pick('পাবলিক পরীক্ষা পেজ', 'Public Exam Page')}
              </Button>
            </Link>
            <Button variant="primary" size="sm" onClick={() => setNewExamOpen(true)}>
              <Plus className="w-4 h-4" /> {pick('নতুন পরীক্ষা তৈরি', 'Create Exam')}
            </Button>
          </div>
        }
      />

      {/* 4-Column Hairline-Divided Institutional KPI Strip */}
      <div className="bg-surface border border-border rounded-[var(--radius)] grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-border no-print">
        <div className="p-4">
          <p className="text-xs font-medium text-muted-foreground">
            {pick('সক্রিয় পরীক্ষা', 'Active Examinations')}
          </p>
          <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
            {formatNumber(activeExamsList.length, locale)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
            {pick(
              `মোট ${formatNumber(db.examSubjects.length, 'bn')}টি বিষয় বিন্যাস`,
              `${db.examSubjects.length} configured subjects`
            )}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs font-medium text-muted-foreground">
            {pick('প্রকাশিত ফলাফল', 'Published Results')}
          </p>
          <p className="text-2xl font-bold text-primary tabular-nums mt-1">
            {formatNumber(publishedExamsCount, locale)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
            {pick(
              `${formatNumber(totalSummaries, 'bn')} জন পরীক্ষার্থীর ফলাফল`,
              `${totalSummaries} processed examinees`
            )}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs font-medium text-muted-foreground">
            {pick('পরীক্ষার রুটিন স্লট', 'Exam Routine Slots')}
          </p>
          <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
            {formatNumber(totalRoutineSlots, locale)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pick('পাবলিক সাইটে সিঙ্ককৃত', 'Synced to public timetable')}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs font-medium text-muted-foreground">
            {pick('সামগ্রিক পাসের হার', 'Overall Pass Rate')}
          </p>
          <p className="text-2xl font-bold text-success tabular-nums mt-1">
            {formatNumber(overallPassRate, locale)}%
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
            {pick(
              `${formatNumber(passedSummaries, 'bn')} / ${formatNumber(totalSummaries, 'bn')} উত্তীর্ণ`,
              `${passedSummaries} / ${totalSummaries} passed`
            )}
          </p>
        </div>
      </div>

      <div className="no-print">
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'exams', label: pick('পরীক্ষা তালিকা', 'Exams'), count: activeExamsList.length },
            { value: 'routines', label: pick('পরীক্ষার রুটিন', 'Exam Routines'), count: totalRoutineSlots },
            { value: 'marks', label: pick('নম্বর এন্ট্রি', 'Marks Entry') },
            { value: 'publication', label: pick('ফলাফল প্রক্রিয়াকরণ', 'Process & Publish') },
            { value: 'merit', label: pick('মেধাতালিকা ও মার্কশিট', 'Merit & Marksheets') },
            { value: 'grading', label: pick('গ্রেডিং স্কেল', 'Grading Scales') },
            { value: 'consolidated', label: pick('সমন্বিত ফলাফল', 'Consolidated') },
          ]}
        />
      </div>

      {/* 1. EXAMS DIRECTORY */}
      {tab === 'exams' && (
        <div className="space-y-4">
          <Card className="p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={examSearch}
                onChange={(e) => setExamSearch(e.target.value)}
                placeholder={pick('পরীক্ষা বা শ্রেণির নাম খুঁজুন...', 'Search exam or class...')}
                className="pl-9 h-9"
              />
            </div>
            <Select
              value={examClassFilter}
              onChange={(e) => setExamClassFilter(e.target.value)}
              className="w-44 h-9"
            >
              <option value="ALL">{pick('সকল শ্রেণি', 'All Classes')}</option>
              {db.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === 'bn' ? c.nameBn : c.name}
                </option>
              ))}
            </Select>
            <Select
              value={examPubFilter}
              onChange={(e) => setExamPubFilter(e.target.value)}
              className="w-44 h-9"
            >
              <option value="ALL">{pick('সকল ফলাফল অবস্থা', 'All Result Status')}</option>
              <option value={ResultPublicationStatus.PUBLISHED}>{pick('প্রকাশিত', 'Published')}</option>
              <option value={ResultPublicationStatus.DRAFT}>{pick('খসড়া', 'Draft')}</option>
              <option value={ResultPublicationStatus.WITHHELD}>{pick('স্থগিত', 'Withheld')}</option>
            </Select>
          </Card>

          <div className="space-y-3">
            {filteredExams.map((ex) => {
              const cls = db.classes.find((c) => c.id === ex.classId);
              const exSubs = db.examSubjects.filter((es) => es.examId === ex.id);
              const enteredSubCount = exSubs.filter((es) =>
                db.marks.some((m) => m.examSubjectId === es.id)
              ).length;
              const routineCount = db.examRoutines.filter(
                (r) => r.examId === ex.id && !r.isDeleted
              ).length;
              const summaryCount = db.resultSummaries.filter((r) => r.examId === ex.id).length;

              return (
                <Card
                  key={ex.id}
                  className={`p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    ex.isDeleted ? 'opacity-55' : ''
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge enumName="ExamType" value={ex.examType} />
                      <StatusBadge enumName="ExamStatus" value={ex.status} />
                      <StatusBadge enumName="ResultPublicationStatus" value={ex.resultStatus} />
                      {ex.isLocked && (
                        <span className="text-xs font-medium text-warning inline-flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> {pick('লককৃত', 'Locked')}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-foreground">{ex.name}</h3>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {locale === 'bn' ? cls?.nameBn : cls?.name} ·{' '}
                      {formatDateShort(ex.startDate, locale)} – {formatDateShort(ex.endDate, locale)}
                      {' · '}
                      {pick(
                        `${formatNumber(enteredSubCount, 'bn')}/${formatNumber(exSubs.length, 'bn')} বিষয়ে নম্বর`,
                        `${enteredSubCount}/${exSubs.length} subjects graded`
                      )}
                      {' · '}
                      {pick(
                        `${formatNumber(routineCount, 'bn')}টি রুটিন`,
                        `${routineCount} routine slots`
                      )}
                      {summaryCount > 0 &&
                        ` · ${pick(
                          `${formatNumber(summaryCount, 'bn')} জন ফলাফল`,
                          `${summaryCount} results`
                        )}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedExamId(ex.id);
                        setTab('routines');
                      }}
                    >
                      <CalendarClock className="w-3.5 h-3.5" /> {pick('রুটিন', 'Routine')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedExamId(ex.id);
                        setDraftMarks({});
                        setTab('marks');
                      }}
                    >
                      {pick('নম্বর এন্ট্রি', 'Marks')}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedExamId(ex.id);
                        setTab('publication');
                      }}
                    >
                      {pick('ফলাফল পরিচালনা', 'Manage Results')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title={ex.isDeleted ? pick('পুনরুদ্ধার', 'Restore') : pick('আর্কাইভ', 'Archive')}
                      onClick={() => toggleArchive({ collection: 'exams', id: ex.id })}
                    >
                      {ex.isDeleted ? (
                        <RotateCcw className="w-3.5 h-3.5" />
                      ) : (
                        <Archive className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
            {!filteredExams.length && (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                {pick('ফিল্টার অনুযায়ী কোনো পরীক্ষা পাওয়া যায়নি।', 'No examinations match the selected filter.')}
              </Card>
            )}
          </div>
        </div>
      )}

      {/* 2. EXAM ROUTINES MANAGEMENT */}
      {tab === 'routines' && activeExam && (
        <div className="space-y-4">
          <Card className="p-4 flex flex-wrap items-end justify-between gap-3 no-print">
            <FormField label={pick('পরীক্ষা নির্বাচন করুন', 'Select Examination')}>
              <Select
                value={activeExam.id}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-80"
              >
                {activeExamsList.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!activeRoutines.length}
                onClick={() => {
                  const rows = activeRoutines.map((r) => {
                    const es = db.examSubjects.find((x) => x.id === r.examSubjectId);
                    const sub = es ? db.subjects.find((s) => s.id === es.subjectId) : null;
                    return {
                      Exam: activeExam.name,
                      Date: r.examDate,
                      Day: weekdayLabel(r.examDate, 'en'),
                      Time: `${r.startTime}-${r.endTime}`,
                      SubjectCode: sub?.officialCode ?? '',
                      Subject: sub?.nameBn || sub?.name || '',
                      FullMarks: es?.fullMarks ?? 100,
                      Room: r.roomNo ?? '',
                      Status: r.status,
                      Instructions: r.instructions ?? '',
                    };
                  });
                  exportToCsv(rows, `exam-routine-${activeExam.id}.csv`);
                }}
              >
                <Download className="w-4 h-4" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={triggerPrint} disabled={!activeRoutines.length}>
                <Printer className="w-4 h-4" /> {pick('রুটিন প্রিন্ট', 'Print Routine')}
              </Button>
              <Button variant="primary" size="sm" onClick={openAddRoutine} disabled={!examSubs.length}>
                <Plus className="w-4 h-4" /> {pick('নতুন রুটিন স্লট', 'Add Routine Slot')}
              </Button>
            </div>
          </Card>

          {/* Official Print Header (Visible Only When Printing) */}
          <div className="hidden print:block text-center border-b border-border pb-4 mb-4">
            <h2 className="text-xl font-bold">{db.schoolProfile.name}</h2>
            <p className="text-sm text-muted-foreground">
              {db.schoolProfile.address} · EIIN: {db.schoolProfile.eiin}
            </p>
            <h3 className="text-base font-bold mt-2">
              {activeExam.name} — {pick('পরীক্ষার সময়সূচি', 'Examination Timetable')}
            </h3>
          </div>

          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">{pick('তারিখ ও বার', 'Date & Day')}</th>
                  <th className="p-3 text-left">{pick('সময়', 'Time')}</th>
                  <th className="p-3 text-left">{pick('বিষয় ও কোড', 'Subject & Code')}</th>
                  <th className="p-3 text-right">{pick('পূর্ণমান', 'Full Marks')}</th>
                  <th className="p-3 text-left">{pick('কক্ষ / হল', 'Room / Hall')}</th>
                  <th className="p-3 text-left">{pick('অবস্থা', 'Status')}</th>
                  <th className="p-3 text-right no-print">{pick('ব্যবস্থাপনা', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {activeRoutines.map((rt) => {
                  const es = db.examSubjects.find((x) => x.id === rt.examSubjectId);
                  const sub = es ? db.subjects.find((s) => s.id === es.subjectId) : null;
                  return (
                    <tr key={rt.id}>
                      <td className="p-3">
                        <span className="font-semibold text-foreground block">
                          {formatDateShort(rt.examDate, locale)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {weekdayLabel(rt.examDate, locale)}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs sm:text-sm whitespace-nowrap">
                        {rt.startTime} – {rt.endTime}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-foreground">
                          {locale === 'bn' ? sub?.nameBn || sub?.name : sub?.name}
                        </span>
                        {sub?.officialCode && (
                          <span className="ml-2 font-mono text-xs text-muted-foreground">
                            [{sub.officialCode}]
                          </span>
                        )}
                        {rt.instructions && (
                          <span className="block text-xs text-muted-foreground mt-0.5">
                            {rt.instructions}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {es ? formatNumber(es.fullMarks, locale) : '—'}
                      </td>
                      <td className="p-3">{rt.roomNo || '—'}</td>
                      <td className="p-3">
                        <StatusBadge enumName="ExamRoutineStatus" value={rt.status} />
                      </td>
                      <td className="p-3 text-right no-print">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRoutineForm({
                                id: rt.id,
                                examSubjectId: rt.examSubjectId,
                                examDate: rt.examDate,
                                startTime: rt.startTime,
                                endTime: rt.endTime,
                                roomNo: rt.roomNo ?? '',
                                status: rt.status,
                                instructions: rt.instructions ?? '',
                              });
                              setRoutineModalOpen(true);
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              await deleteCms({ collection: 'examRoutines', id: rt.id }).unwrap();
                              toast.success(pick('রুটিন স্লট মুছে ফেলা হয়েছে।', 'Routine slot deleted.'));
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!activeRoutines.length && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      {pick(
                        'এই পরীক্ষার জন্য এখনো কোনো রুটিন নির্ধারিত হয়নি। "নতুন রুটিন স্লট" বাটনে ক্লিক করে যুক্ত করুন।',
                        'No routine scheduled for this exam yet. Click "Add Routine Slot" to schedule.'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* 3. SPREADSHEET-STYLE MARKS ENTRY GRID WITH LIVE COMPONENT PASS/FAIL & GRADE */}
      {tab === 'marks' && activeExam && (
        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <FormField label={pick('পরীক্ষা নির্বাচন', 'Select Exam')}>
                  <Select
                    value={activeExam.id}
                    onChange={(e) => {
                      setSelectedExamId(e.target.value);
                      setMarksSectionId('ALL');
                      setDraftMarks({});
                    }}
                    className="w-64"
                  >
                    {activeExamsList.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label={pick('বিষয়', 'Subject')}>
                  <Select
                    value={currentExamSub?.id ?? ''}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setDraftMarks({});
                    }}
                    className="w-52"
                  >
                    {examSubs.map((es) => {
                      const sub = db.subjects.find((s) => s.id === es.subjectId);
                      return (
                        <option key={es.id} value={es.id}>
                          {locale === 'bn' ? sub?.nameBn : sub?.name} ({es.fullMarks})
                        </option>
                      );
                    })}
                  </Select>
                </FormField>
                <FormField label={pick('শাখা', 'Section')}>
                  <Select
                    value={marksSectionId}
                    onChange={(e) => setMarksSectionId(e.target.value)}
                    className="w-36"
                  >
                    <option value="ALL">{pick('সব শাখা', 'All Sections')}</option>
                    {classSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {pick(`শাখা ${sec.name}`, `Section ${sec.name}`)}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label={pick('শিক্ষার্থী খুঁজুন', 'Search Student')}>
                  <Input
                    value={marksSearch}
                    onChange={(e) => setMarksSearch(e.target.value)}
                    placeholder={pick('রোল বা নাম...', 'Roll or name...')}
                    className="w-44 h-9"
                  />
                </FormField>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {dirtyCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setDraftMarks({})}>
                    <RotateCcw className="w-3.5 h-3.5" />
                    {pick(`বাতিল (${formatNumber(dirtyCount, 'bn')})`, `Reset (${dirtyCount})`)}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!currentExamSub || !targetEnrollments.length}
                  onClick={() => {
                    if (!currentExamSub) return;
                    const sub = db.subjects.find((s) => s.id === currentExamSub.subjectId);
                    exportToCsv(
                      targetEnrollments.map((enr) => {
                        const stu = db.students.find((s) => s.id === enr.studentId);
                        const sec = db.sections.find((s) => s.id === enr.sectionId);
                        const m = getMarkState(enr.id);
                        const ev = evaluateRowGrade(currentExamSub, m, activeScaleRanges);
                        return {
                          Roll: enr.roll,
                          StudentID: stu?.studentId ?? '',
                          StudentName: stu?.nameBn || stu?.nameEn || '',
                          Section: sec?.name ?? '',
                          Written: m.isAbsent ? 'AB' : m.written,
                          MCQ: m.isAbsent ? 'AB' : m.mcq,
                          Practical: m.isAbsent ? 'AB' : m.practical,
                          Total: m.isAbsent ? 'AB' : ev.total,
                          Grade: ev.letterGrade,
                          GP: ev.gradePoint.toFixed(2),
                        };
                      }),
                      `marks-${activeExam.id}-${sub?.officialCode ?? currentExamSub.id}.csv`
                    );
                  }}
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </Button>
                {activeExam.isLocked ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleProcessAction(activeExam.id, 'UNLOCK')}
                  >
                    <Unlock className="w-3.5 h-3.5" /> {pick('আনলক করুন', 'Unlock Marks')}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveMarksSheet}
                    disabled={savingMarks || !currentExamSub}
                  >
                    {savingMarks
                      ? pick('সংরক্ষণ হচ্ছে...', 'Saving...')
                      : dirtyCount > 0
                        ? pick(
                            `নম্বর সংরক্ষণ (${formatNumber(dirtyCount, 'bn')} পরিবর্তিত)`,
                            `Save Marks (${dirtyCount} edited)`
                          )
                        : pick('নম্বর সংরক্ষণ করুন', 'Save Marks')}
                  </Button>
                )}
              </div>
            </div>

            {currentExamSub && (
              <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground tabular-nums">
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    {pick('পূর্ণমান:', 'Full Marks:')}{' '}
                    <strong className="text-foreground">
                      {formatNumber(currentExamSub.fullMarks, locale)}
                    </strong>
                  </span>
                  <span>
                    {pick('পাস নম্বর:', 'Pass Marks:')}{' '}
                    <strong className="text-foreground">
                      {formatNumber(currentExamSub.passMarks, locale)}
                    </strong>
                  </span>
                  {currentExamSub.hasWritten && (
                    <span>
                      {pick('লিখিত:', 'Written:')}{' '}
                      {formatNumber(currentExamSub.writtenFullMarks ?? 0, locale)} (
                      {pick('পাস', 'Pass')}{' '}
                      {formatNumber(currentExamSub.writtenPassMarks ?? 0, locale)})
                    </span>
                  )}
                  {currentExamSub.hasMcq && (
                    <span>
                      MCQ: {formatNumber(currentExamSub.mcqFullMarks ?? 0, locale)} (
                      {pick('পাস', 'Pass')}{' '}
                      {formatNumber(currentExamSub.mcqPassMarks ?? 0, locale)})
                    </span>
                  )}
                  {currentExamSub.hasPractical && (
                    <span>
                      {pick('ব্যবহারিক:', 'Practical:')}{' '}
                      {formatNumber(currentExamSub.practicalFullMarks ?? 0, locale)} (
                      {pick('পাস', 'Pass')}{' '}
                      {formatNumber(currentExamSub.practicalPassMarks ?? 0, locale)})
                    </span>
                  )}
                </div>
                <span>
                  {pick('তালিকাভুক্ত শিক্ষার্থী:', 'Listed Students:')}{' '}
                  <strong className="text-foreground">
                    {formatNumber(targetEnrollments.length, locale)}
                  </strong>
                </span>
              </div>
            )}
          </Card>

          {isMarksLocked && (
            <Card className="p-4 border-warning/40 bg-warning/5 flex items-center gap-2 text-sm text-foreground">
              <ShieldAlert className="w-4 h-4 text-warning shrink-0" />
              <span>
                {pick(
                  'এই পরীক্ষার নম্বর এন্ট্রি লক করা আছে অথবা সময়সীমা অতিক্রান্ত হয়েছে। পরিবর্তন করতে হলে অ্যাডমিন কর্তৃক আনলক করতে হবে।',
                  'Marks entry is locked or deadline has passed. Admin must unlock before editing.'
                )}
              </span>
            </Card>
          )}

          {currentExamSub ? (
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">{pick('রোল', 'Roll')}</th>
                    <th className="p-3 text-left">{pick('শিক্ষার্থীর নাম ও শাখা', 'Student & Section')}</th>
                    {currentExamSub.hasWritten && (
                      <th className="p-3 text-right">
                        {pick('লিখিত', 'Written')} ({currentExamSub.writtenFullMarks})
                      </th>
                    )}
                    {currentExamSub.hasMcq && (
                      <th className="p-3 text-right">
                        MCQ ({currentExamSub.mcqFullMarks})
                      </th>
                    )}
                    {currentExamSub.hasPractical && (
                      <th className="p-3 text-right">
                        {pick('ব্যবহারিক', 'Practical')} ({currentExamSub.practicalFullMarks})
                      </th>
                    )}
                    <th className="p-3 text-center">{pick('অনুপস্থিত', 'Absent')}</th>
                    <th className="p-3 text-right">
                      {pick('মোট', 'Total')} ({currentExamSub.fullMarks})
                    </th>
                    <th className="p-3 text-center">{pick('গ্রেড (GP)', 'Grade (GP)')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border tabular-nums">
                  {targetEnrollments.map((enr) => {
                    const stu = db.students.find((s) => s.id === enr.studentId);
                    const sec = db.sections.find((s) => s.id === enr.sectionId);
                    const m = getMarkState(enr.id);
                    const ev = evaluateRowGrade(currentExamSub, m, activeScaleRanges);
                    const isEdited = Boolean(draftMarks[enr.id]);
                    return (
                      <tr
                        key={enr.id}
                        className={
                          isEdited
                            ? 'bg-primary/5'
                            : !ev.isPassed && !m.isAbsent
                              ? 'bg-destructive/5'
                              : ''
                        }
                      >
                        <td className="p-3 font-bold">{formatNumber(enr.roll, locale)}</td>
                        <td className="p-3">
                          <span className="font-medium text-foreground block">
                            {stu?.nameBn ?? stu?.nameEn}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {sec ? pick(`শাখা ${sec.name}`, `Sec ${sec.name}`) : '—'} ·{' '}
                            <span className="font-mono">{stu?.studentId}</span>
                          </span>
                        </td>
                        {currentExamSub.hasWritten && (
                          <td className="p-3 text-right">
                            <Input
                              type="number"
                              min={0}
                              max={currentExamSub.writtenFullMarks ?? 100}
                              disabled={isMarksLocked || m.isAbsent}
                              value={m.written}
                              onChange={(e) =>
                                setDraftMarks((prev) => ({
                                  ...prev,
                                  [enr.id]: { ...m, written: Number(e.target.value) },
                                }))
                              }
                              className="w-20 ml-auto text-right h-8"
                            />
                          </td>
                        )}
                        {currentExamSub.hasMcq && (
                          <td className="p-3 text-right">
                            <Input
                              type="number"
                              min={0}
                              max={currentExamSub.mcqFullMarks ?? 100}
                              disabled={isMarksLocked || m.isAbsent}
                              value={m.mcq}
                              onChange={(e) =>
                                setDraftMarks((prev) => ({
                                  ...prev,
                                  [enr.id]: { ...m, mcq: Number(e.target.value) },
                                }))
                              }
                              className="w-20 ml-auto text-right h-8"
                            />
                          </td>
                        )}
                        {currentExamSub.hasPractical && (
                          <td className="p-3 text-right">
                            <Input
                              type="number"
                              min={0}
                              max={currentExamSub.practicalFullMarks ?? 100}
                              disabled={isMarksLocked || m.isAbsent}
                              value={m.practical}
                              onChange={(e) =>
                                setDraftMarks((prev) => ({
                                  ...prev,
                                  [enr.id]: { ...m, practical: Number(e.target.value) },
                                }))
                              }
                              className="w-20 ml-auto text-right h-8"
                            />
                          </td>
                        )}
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            disabled={isMarksLocked}
                            checked={m.isAbsent}
                            onChange={(e) =>
                              setDraftMarks((prev) => ({
                                ...prev,
                                [enr.id]: { ...m, isAbsent: e.target.checked },
                              }))
                            }
                            className="w-4 h-4 accent-destructive"
                          />
                        </td>
                        <td className="p-3 text-right font-bold text-foreground">
                          {m.isAbsent ? 'AB' : formatNumber(ev.total, locale)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`font-bold ${
                              ev.isPassed ? 'text-primary' : 'text-destructive'
                            }`}
                          >
                            {ev.letterGrade}
                          </span>
                          {!m.isAbsent && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({formatNumber(ev.gradePoint, locale, 2)})
                            </span>
                          )}
                          {ev.failReason && ev.failReason !== 'AB' && (
                            <span className="block text-[11px] text-destructive">
                              {ev.failReason} {pick('অকৃতকার্য', 'Fail')}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          ) : (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              {pick('এই পরীক্ষায় কোনো বিষয় যুক্ত নেই।', 'No subjects configured for this exam.')}
            </Card>
          )}
        </div>
      )}

      {/* 4. RESULT PROCESSING & PUBLICATION PIPELINE */}
      {tab === 'publication' && activeExam && (
        <div className="space-y-5">
          <Card className="p-5 flex flex-wrap items-end justify-between gap-4">
            <FormField label={pick('পরীক্ষা নির্বাচন করুন', 'Select Examination')}>
              <Select
                value={activeExam.id}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-80"
              >
                {activeExamsList.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge enumName="ResultPublicationStatus" value={activeExam.resultStatus} />
              <Button
                variant="outline"
                size="sm"
                disabled={processing}
                onClick={() =>
                  handleProcessAction(activeExam.id, activeExam.isLocked ? 'UNLOCK' : 'LOCK')
                }
              >
                {activeExam.isLocked ? (
                  <>
                    <Unlock className="w-4 h-4" /> {pick('আনলক', 'Unlock')}
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> {pick('নম্বর লক', 'Lock Marks')}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={processing}
                onClick={() => handleProcessAction(activeExam.id, 'CALCULATE')}
              >
                <Calculator className="w-4 h-4" /> {pick('১. ফলাফল গণনা', '1. Calculate GPA')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={processing}
                onClick={() => handleProcessAction(activeExam.id, 'PUBLISH')}
              >
                <Globe className="w-4 h-4" /> {pick('২. ফলাফল প্রকাশ', '2. Publish')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={processing}
                onClick={() => handleProcessAction(activeExam.id, 'WITHHOLD')}
              >
                {pick('স্থগিত', 'Withhold')}
              </Button>
            </div>
          </Card>

          {/* 4-Step Visual Publication Checklist */}
          <div className="bg-surface border border-border rounded-[var(--radius)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
            {[
              {
                step: '১',
                label: pick('বিষয়ভিত্তিক নম্বর এন্ট্রি', 'Subject Marks Entry'),
                done: examSubs.length > 0 && subjectsWithMarksCount === examSubs.length,
                meta: `${formatNumber(subjectsWithMarksCount, locale)} / ${formatNumber(examSubs.length, locale)} ${pick('বিষয়', 'subjects')}`,
              },
              {
                step: '২',
                label: pick('নম্বর যাচাই ও লক', 'Verify & Lock Marks'),
                done: activeExam.isLocked,
                meta: activeExam.isLocked ? pick('লককৃত', 'Locked') : pick('উন্মুক্ত', 'Unlocked'),
              },
              {
                step: '৩',
                label: pick('জিপিএ ও মেধাক্রম গণনা', 'GPA & Merit Processing'),
                done: examSummaries.length > 0,
                meta: `${formatNumber(examSummaries.length, locale)} ${pick('পরীক্ষার্থী', 'examinees')}`,
              },
              {
                step: '৪',
                label: pick('পাবলিক ফলাফল প্রকাশনা', 'Public Publication'),
                done: activeExam.resultStatus === ResultPublicationStatus.PUBLISHED,
                meta:
                  activeExam.resultStatus === ResultPublicationStatus.PUBLISHED
                    ? pick('প্রকাশিত (/results)', 'Live on /results')
                    : pick('অপ্রকাশিত', 'Not published'),
              },
            ].map((item) => (
              <div key={item.step} className="p-4 flex items-start gap-3">
                <span
                  className={`h-7 w-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                    item.done
                      ? 'bg-success/15 text-success'
                      : 'bg-surface-muted text-muted-foreground'
                  }`}
                >
                  {item.done ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground tabular-nums mt-0.5">{item.meta}</p>
                </div>
              </div>
            ))}
          </div>

          {activeExam.resultStatus === ResultPublicationStatus.PUBLISHED && (
            <Card className="p-4 border-success/40 bg-success/5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-medium text-success flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {pick(
                  'এই পরীক্ষার ফলাফল বর্তমানে পাবলিক রেজাল্ট পেজে উন্মুক্ত রয়েছে।',
                  'Results for this exam are live on Public Result Search.'
                )}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setTab('merit')}>
                  {pick('মেধাতালিকা দেখুন', 'View Merit List')}
                </Button>
                <Link href={`/results?examId=${activeExam.id}&classId=${activeExam.classId}`}>
                  <Button variant="primary" size="sm">
                    {pick('পাবলিক পেজে যাচাই', 'Verify on /results')}
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Exam Result Summary Metrics */}
          {examSummaries.length > 0 && (
            <div className="bg-surface border border-border rounded-[var(--radius)] grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-border">
              <div className="p-4">
                <p className="text-xs text-muted-foreground">{pick('মোট পরীক্ষার্থী', 'Total Examinees')}</p>
                <p className="text-xl font-bold tabular-nums mt-1">
                  {formatNumber(examSummaries.length, locale)}
                </p>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground">{pick('উত্তীর্ণ ও পাসের হার', 'Passed & Pass %')}</p>
                <p className="text-xl font-bold text-success tabular-nums mt-1">
                  {formatNumber(activePassedCount, locale)} ({formatNumber(activePassPct, locale)}%)
                </p>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground">{pick('জিপিএ ৫.০০ প্রাপ্ত', 'GPA 5.00 Count')}</p>
                <p className="text-xl font-bold text-primary tabular-nums mt-1">
                  {formatNumber(activeGpa5Count, locale)}
                </p>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground">{pick('অকৃতকার্য / অসম্পূর্ণ', 'Failed / Incomplete')}</p>
                <p className="text-xl font-bold text-destructive tabular-nums mt-1">
                  {formatNumber(activeFailedCount, locale)}
                </p>
              </div>
            </div>
          )}

          {/* Subject Completeness Matrix */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold">
                {pick('বিষয়ভিত্তিক নম্বর এন্ট্রি সম্পূর্ণতা', 'Subject Marks Completeness Matrix')}
              </h3>
              <span className="text-xs text-muted-foreground">
                {pick('যেকোনো বিষয়ে ক্লিক করে নম্বর এন্ট্রি খুলুন', 'Click any subject to open marks sheet')}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {examSubs.map((es) => {
                const sub = db.subjects.find((s) => s.id === es.subjectId);
                const expected = allExamEnrollments.filter(
                  (e) => !es.groupId || es.groupId === e.groupId
                ).length;
                const entered = db.marks.filter((m) => m.examSubjectId === es.id).length;
                const complete = expected > 0 && entered >= expected;
                return (
                  <button
                    key={es.id}
                    type="button"
                    onClick={() => {
                      setSelectedSubjectId(es.id);
                      setDraftMarks({});
                      setTab('marks');
                    }}
                    className="text-left p-3.5 border border-border rounded-[var(--radius)] hover:border-primary/50 transition-colors space-y-2 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {locale === 'bn' ? sub?.nameBn : sub?.name}
                      </span>
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          complete ? 'text-success' : 'text-warning'
                        }`}
                      >
                        {formatNumber(entered, locale)}/{formatNumber(expected, locale)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${complete ? 'bg-success' : 'bg-primary'}`}
                        style={{
                          width: `${expected > 0 ? Math.min(100, Math.round((entered / expected) * 100)) : 0}%`,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* 5. MERIT LIST, TABULATION & PRINTABLE MARKSHEETS */}
      {tab === 'merit' && activeExam && (
        <div className="space-y-4">
          {/* Active Exam Merit KPI Strip */}
          <div className="bg-surface border border-border rounded-[var(--radius)] grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-border no-print">
            <div className="p-4">
              <p className="text-xs text-muted-foreground">{pick('পাসের হার', 'Pass Rate')}</p>
              <p className="text-xl font-bold text-success tabular-nums mt-1">
                {formatNumber(activePassPct, locale)}%
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatNumber(activePassedCount, locale)} / {formatNumber(examSummaries.length, locale)}
              </p>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground">{pick('জিপিএ ৫.০০ (A+)', 'GPA 5.00 (A+)')}</p>
              <p className="text-xl font-bold text-primary tabular-nums mt-1">
                {formatNumber(activeGpa5Count, locale)}
              </p>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground">{pick('সর্বোচ্চ প্রাপ্ত নম্বর', 'Highest Marks')}</p>
              <p className="text-xl font-bold text-foreground tabular-nums mt-1">
                {formatNumber(activeHighestMarks, locale)}
              </p>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground">{pick('উত্তীর্ণদের গড় জিপিএ', 'Average GPA (Passed)')}</p>
              <p className="text-xl font-bold text-foreground tabular-nums mt-1">
                {formatNumber(activeAvgGpa, locale, 2)}
              </p>
            </div>
          </div>

          <Card className="p-4 flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={activeExam.id}
                onChange={(e) => {
                  setSelectedExamId(e.target.value);
                  setMeritSectionId('ALL');
                }}
                className="w-64 h-9"
              >
                {activeExamsList.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </Select>
              <Select
                value={meritSectionId}
                onChange={(e) => setMeritSectionId(e.target.value)}
                className="w-36 h-9"
              >
                <option value="ALL">{pick('সব শাখা', 'All Sections')}</option>
                {classSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {pick(`শাখা ${sec.name}`, `Section ${sec.name}`)}
                  </option>
                ))}
              </Select>
              <Select
                value={meritStatusFilter}
                onChange={(e) => setMeritStatusFilter(e.target.value)}
                className="w-36 h-9"
              >
                <option value="ALL">{pick('সকল অবস্থা', 'All Status')}</option>
                <option value={ResultStatus.PASS}>{pick('উত্তীর্ণ', 'Passed')}</option>
                <option value={ResultStatus.FAIL}>{pick('অকৃতকার্য', 'Failed')}</option>
              </Select>
              <Input
                value={meritSearch}
                onChange={(e) => setMeritSearch(e.target.value)}
                placeholder={pick('রোল বা নাম...', 'Roll or name...')}
                className="w-40 h-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!filteredMeritSummaries.length}
                onClick={() => {
                  exportToCsv(
                    filteredMeritSummaries.map((res) => {
                      const enr = db.enrollments.find((e) => e.id === res.studentEnrollmentId);
                      const stu = enr ? db.students.find((s) => s.id === enr.studentId) : null;
                      const sec = enr ? db.sections.find((s) => s.id === enr.sectionId) : null;
                      return {
                        Merit: res.meritPosition ?? '—',
                        Roll: enr?.roll ?? '',
                        StudentID: stu?.studentId ?? '',
                        StudentName: stu?.nameBn || stu?.nameEn || '',
                        Section: sec?.name ?? '',
                        TotalMarks: res.totalMarks,
                        FullMarks: res.totalFullMarks,
                        GPA: res.gpa?.toFixed(2) ?? '0.00',
                        GPA_Without_4th: res.gpaWithoutOptional?.toFixed(2) ?? '0.00',
                        Grade: res.letterGrade ?? 'F',
                        Status: res.resultStatus,
                      };
                    }),
                    `merit-list-${activeExam.id}.csv`
                  );
                }}
              >
                <Download className="w-4 h-4" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSeatPlanOpen(true)}>
                <Printer className="w-4 h-4" /> {pick('আসন বিন্যাস', 'Seat Plan')}
              </Button>
              <Button variant="primary" size="sm" onClick={() => setTabulationOpen(true)}>
                <Printer className="w-4 h-4" /> {pick('ট্যাবুলেশন শিট (A4)', 'Tabulation Sheet')}
              </Button>
            </div>
          </Card>

          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">{pick('মেধা', 'Merit')}</th>
                  <th className="p-3 text-left">{pick('রোল', 'Roll')}</th>
                  <th className="p-3 text-left">{pick('শিক্ষার্থী ও শাখা', 'Student & Section')}</th>
                  <th className="p-3 text-right">{pick('মোট নম্বর', 'Total Marks')}</th>
                  <th className="p-3 text-right">GPA</th>
                  <th className="p-3 text-right">{pick('৪র্থ ছাড়া', 'No 4th')}</th>
                  <th className="p-3 text-center">{pick('গ্রেড', 'Grade')}</th>
                  <th className="p-3 text-left">{pick('অবস্থা', 'Status')}</th>
                  <th className="p-3 text-right no-print">{pick('মার্কশিট', 'Marksheet')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {filteredMeritSummaries.map((res) => {
                  const enr = db.enrollments.find((e) => e.id === res.studentEnrollmentId);
                  const stu = enr ? db.students.find((s) => s.id === enr.studentId) : null;
                  const sec = enr ? db.sections.find((s) => s.id === enr.sectionId) : null;
                  const pct =
                    res.totalFullMarks > 0
                      ? Math.round((res.totalMarks / res.totalFullMarks) * 100)
                      : 0;
                  return (
                    <tr key={res.id}>
                      <td className="p-3 font-bold text-primary">
                        {res.meritPosition ? `#${formatNumber(res.meritPosition, locale)}` : '—'}
                      </td>
                      <td className="p-3 font-semibold">
                        {enr ? formatNumber(enr.roll, locale) : '—'}
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-foreground block">
                          {stu?.nameBn ?? stu?.nameEn}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {sec ? pick(`শাখা ${sec.name}`, `Sec ${sec.name}`) : '—'} ·{' '}
                          <span className="font-mono">{stu?.studentId}</span>
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-semibold">
                          {formatNumber(res.totalMarks, locale)} /{' '}
                          {formatNumber(res.totalFullMarks, locale)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {formatNumber(pct, locale)}%
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold">
                        {res.gpa !== null && res.gpa !== undefined
                          ? formatNumber(res.gpa, locale, 2)
                          : '—'}
                      </td>
                      <td className="p-3 text-right text-muted-foreground">
                        {res.gpaWithoutOptional !== null && res.gpaWithoutOptional !== undefined
                          ? formatNumber(res.gpaWithoutOptional, locale, 2)
                          : '—'}
                      </td>
                      <td className="p-3 text-center font-bold">{res.letterGrade ?? '—'}</td>
                      <td className="p-3">
                        <StatusBadge enumName="ResultStatus" value={res.resultStatus} />
                      </td>
                      <td className="p-3 text-right no-print">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewStudentEnrId(res.studentEnrollmentId)}
                        >
                          <Printer className="w-3.5 h-3.5" /> {pick('মার্কশিট', 'Marksheet')}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {!filteredMeritSummaries.length && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      {pick(
                        'এই পরীক্ষার ফলাফল এখনো গণনা করা হয়নি অথবা ফিল্টারের সাথে মেলেনি।',
                        'No processed results found for this filter. Calculate GPA in Process & Publish tab first.'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* 6. GRADING SCALES */}
      {tab === 'grading' && (
        <div className="space-y-4">
          {db.gradingScales.map((scale) => {
            const ranges = db.gradeRanges
              .filter((r) => r.gradingScaleId === scale.id && !r.isDeleted)
              .sort((a, b) => a.displayOrder - b.displayOrder);
            return (
              <Card key={scale.id} className="p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{scale.name}</h3>
                    <p className="text-sm text-muted-foreground">{scale.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleArchive({ collection: 'gradingScales', id: scale.id })}
                  >
                    {scale.isDeleted ? pick('পুনরুদ্ধার', 'Restore') : pick('আর্কাইভ', 'Archive')}
                  </Button>
                </div>
                <div className="overflow-x-auto border border-border rounded-[var(--radius)]">
                  <table className="w-full text-sm tabular-nums">
                    <thead className="bg-surface-muted text-muted-foreground">
                      <tr>
                        <th className="p-3 text-left">{pick('নম্বরের পরিসর (%)', 'Marks Range (%)')}</th>
                        <th className="p-3 text-center">{pick('লেটার গ্রেড', 'Letter Grade')}</th>
                        <th className="p-3 text-center">{pick('গ্রেড পয়েন্ট (GP)', 'Grade Point')}</th>
                        <th className="p-3 text-left">{pick('মন্তব্য', 'Remarks')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ranges.map((r) => (
                        <tr key={r.id}>
                          <td className="p-3 font-medium">
                            {formatNumber(r.minPercentage, locale)}% – {formatNumber(r.maxPercentage, locale)}%
                          </td>
                          <td className="p-3 text-center font-bold text-primary">{r.letterGrade}</td>
                          <td className="p-3 text-center font-semibold">
                            {formatNumber(r.gradePoint, locale, 2)}
                          </td>
                          <td className="p-3 text-muted-foreground">{r.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 rounded-[var(--radius)] bg-surface-muted/50 border border-border text-sm space-y-1">
                  <p className="font-semibold text-foreground">
                    {pick('এনসিটিবি ৪র্থ (ঐচ্ছিক) বিষয় বোনাস ও অংশভিত্তিক পাস নীতি', 'NCTB 4th (Optional) Subject Bonus & Component Pass Rule')}
                  </p>
                  <p className="text-muted-foreground">
                    {pick(
                      'প্রতিটি আবশ্যিক বিষয়ের লিখিত, নৈর্ব্যক্তিক (MCQ) ও ব্যবহারিক অংশে পৃথকভাবে ন্যূনতম ৩৩% নম্বর অর্জন বাধ্যতামূলক। ৪র্থ (ঐচ্ছিক) বিষয়ে GP ২.০০ এর অতিরিক্ত পয়েন্ট (GP − ২.০০) মোট গ্রেড পয়েন্টে বোনাস হিসেবে যোগ হয় এবং সর্বোচ্চ GPA ৫.০০ নির্ধারিত থাকে।',
                      'Students must pass Written, MCQ, and Practical components separately (33% each). Optional (4th) subject points above 2.00 are added as bonus points, capped at 5.00 GPA.'
                    )}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 7. CONSOLIDATED EXAM WEIGHTAGE & LIVE PREVIEW */}
      {tab === 'consolidated' && (
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold">
                  {pick('সমন্বিত চূড়ান্ত ফলাফল কনফিগারেশন', 'Consolidated Final Result Weightage')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {pick(
                    'অর্ধবার্ষিক ও বার্ষিক পরীক্ষার নির্ধারিত শতকরা হার অনুযায়ী সমন্বিত মেধাক্রম নির্ণয়।',
                    'Weighted final score computed from Half-Yearly and Annual examination results.'
                  )}
                </p>
              </div>
              <span className="text-sm font-bold text-success tabular-nums">
                {pick('মোট ওজন:', 'Total Weight:')}{' '}
                {formatNumber(
                  db.consolidatedConfigs.reduce((s, c) => s + c.weightagePercentage, 0),
                  locale
                )}
                %
              </span>
            </div>
            <div className="divide-y divide-border border border-border rounded-[var(--radius)]">
              {db.consolidatedConfigs.map((cc) => {
                const src = db.exams.find((e) => e.id === cc.sourceExamId);
                return (
                  <div key={cc.id} className="p-3.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{src?.name}</span>
                    <span className="font-mono font-bold text-primary">
                      {formatNumber(cc.weightagePercentage, locale)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Live Consolidated Preview Table */}
          {db.consolidatedConfigs.length >= 2 && (() => {
            const c0 = db.consolidatedConfigs[0];
            const c1 = db.consolidatedConfigs[1];
            const src0Summaries = db.resultSummaries.filter((r) => r.examId === c0.sourceExamId);
            const src1Summaries = db.resultSummaries.filter((r) => r.examId === c1.sourceExamId);
            const merged = src1Summaries
              .map((s1) => {
                const s0 = src0Summaries.find((x) => x.studentEnrollmentId === s1.studentEnrollmentId);
                const enr = db.enrollments.find((e) => e.id === s1.studentEnrollmentId);
                const stu = enr ? db.students.find((s) => s.id === enr.studentId) : null;
                const wScore = Math.round(
                  ((s0?.totalMarks ?? s1.totalMarks) * c0.weightagePercentage +
                    s1.totalMarks * c1.weightagePercentage) /
                    100
                );
                const wGpa = Number(
                  (
                    ((s0?.gpa ?? s1.gpa ?? 0) * c0.weightagePercentage +
                      (s1.gpa ?? 0) * c1.weightagePercentage) /
                    100
                  ).toFixed(2)
                );
                return {
                  enrId: s1.studentEnrollmentId,
                  roll: enr?.roll ?? 0,
                  studentName: stu?.nameBn || stu?.nameEn || '—',
                  m0: s0?.totalMarks ?? null,
                  m1: s1.totalMarks,
                  weightedMarks: wScore,
                  weightedGpa: Math.min(5, wGpa),
                  status: s1.resultStatus,
                };
              })
              .sort((a, b) => b.weightedMarks - a.weightedMarks);

            if (!merged.length) return null;
            return (
              <Card className="overflow-x-auto">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">
                    {pick('সমন্বিত চূড়ান্ত ফলাফলের লাইভ প্রিভিউ', 'Live Consolidated Result Preview')}
                  </h4>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatNumber(merged.length, locale)} {pick('জন শিক্ষার্থী', 'students')}
                  </span>
                </div>
                <table className="w-full text-sm tabular-nums">
                  <thead className="bg-surface-muted text-muted-foreground">
                    <tr>
                      <th className="p-3 text-left">{pick('সমন্বিত মেধা', 'Rank')}</th>
                      <th className="p-3 text-left">{pick('রোল', 'Roll')}</th>
                      <th className="p-3 text-left">{pick('শিক্ষার্থী', 'Student')}</th>
                      <th className="p-3 text-right">
                        {pick('অর্ধবার্ষিক', 'Half-Yearly')} ({c0.weightagePercentage}%)
                      </th>
                      <th className="p-3 text-right">
                        {pick('বার্ষিক', 'Annual')} ({c1.weightagePercentage}%)
                      </th>
                      <th className="p-3 text-right">{pick('সমন্বিত নম্বর', 'Weighted Total')}</th>
                      <th className="p-3 text-right">{pick('সমন্বিত GPA', 'Weighted GPA')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {merged.slice(0, 15).map((row, idx) => (
                      <tr key={row.enrId}>
                        <td className="p-3 font-bold text-primary">
                          #{formatNumber(idx + 1, locale)}
                        </td>
                        <td className="p-3">{formatNumber(row.roll, locale)}</td>
                        <td className="p-3 font-medium">{row.studentName}</td>
                        <td className="p-3 text-right text-muted-foreground">
                          {row.m0 !== null ? formatNumber(row.m0, locale) : '—'}
                        </td>
                        <td className="p-3 text-right">{formatNumber(row.m1, locale)}</td>
                        <td className="p-3 text-right font-bold">
                          {formatNumber(row.weightedMarks, locale)}
                        </td>
                        <td className="p-3 text-right font-bold text-primary">
                          {formatNumber(row.weightedGpa, locale, 2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            );
          })()}
        </div>
      )}

      {/* Add / Edit Exam Routine Modal */}
      <Modal
        open={routineModalOpen}
        onClose={() => setRoutineModalOpen(false)}
        title={
          routineForm.id
            ? pick('পরীক্ষার রুটিন সম্পাদনা', 'Edit Exam Routine Slot')
            : pick('নতুন পরীক্ষার রুটিন স্লট', 'Add Exam Routine Slot')
        }
      >
        <form onSubmit={handleSaveRoutine} className="space-y-4">
          <FormField label={pick('বিষয় নির্বাচন করুন', 'Subject')} required>
            <Select
              value={routineForm.examSubjectId}
              onChange={(e) => setRoutineForm({ ...routineForm, examSubjectId: e.target.value })}
            >
              {examSubs.map((es) => {
                const sub = db.subjects.find((s) => s.id === es.subjectId);
                return (
                  <option key={es.id} value={es.id}>
                    {locale === 'bn' ? sub?.nameBn || sub?.name : sub?.name}{' '}
                    {sub?.officialCode ? `[${sub.officialCode}]` : ''} ({es.fullMarks})
                  </option>
                );
              })}
            </Select>
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label={pick('পরীক্ষার তারিখ', 'Exam Date')} required>
              <Input
                type="date"
                value={routineForm.examDate}
                onChange={(e) => setRoutineForm({ ...routineForm, examDate: e.target.value })}
              />
            </FormField>
            <FormField label={pick('শুরুর সময়', 'Start Time')} required>
              <Input
                type="time"
                value={routineForm.startTime}
                onChange={(e) => setRoutineForm({ ...routineForm, startTime: e.target.value })}
              />
            </FormField>
            <FormField label={pick('শেষের সময়', 'End Time')} required>
              <Input
                type="time"
                value={routineForm.endTime}
                onChange={(e) => setRoutineForm({ ...routineForm, endTime: e.target.value })}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={pick('কক্ষ / হল নম্বর', 'Room / Hall')}>
              <Input
                value={routineForm.roomNo}
                onChange={(e) => setRoutineForm({ ...routineForm, roomNo: e.target.value })}
                placeholder="হল রুম ২০১"
              />
            </FormField>
            <FormField label={pick('অবস্থা', 'Status')}>
              <Select
                value={routineForm.status}
                onChange={(e) =>
                  setRoutineForm({ ...routineForm, status: e.target.value as ExamRoutineStatus })
                }
              >
                <option value={ExamRoutineStatus.SCHEDULED}>{pick('নির্ধারিত', 'Scheduled')}</option>
                <option value={ExamRoutineStatus.POSTPONED}>{pick('স্থগিত', 'Postponed')}</option>
                <option value={ExamRoutineStatus.COMPLETED}>{pick('সম্পন্ন', 'Completed')}</option>
                <option value={ExamRoutineStatus.CANCELLED}>{pick('বাতিল', 'Cancelled')}</option>
              </Select>
            </FormField>
          </div>
          <FormField label={pick('হল নির্দেশনা', 'Hall Instructions')}>
            <Input
              value={routineForm.instructions}
              onChange={(e) => setRoutineForm({ ...routineForm, instructions: e.target.value })}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRoutineModalOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={savingRoutine}>
              {savingRoutine ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('সংরক্ষণ করুন', 'Save Slot')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Marksheet Print Modal */}
      <Modal
        open={Boolean(previewStudentEnrId)}
        onClose={() => setPreviewStudentEnrId(null)}
        title={pick('মার্কশিট প্রিভিউ ও প্রিন্ট', 'Marksheet Preview & Print')}
        maxWidth="max-w-4xl"
      >
        {previewStudentEnrId &&
          activeExam &&
          (() => {
            const summary = db.resultSummaries.find(
              (r) => r.examId === activeExam.id && r.studentEnrollmentId === previewStudentEnrId
            );
            const enr = db.enrollments.find((e) => e.id === previewStudentEnrId);
            const stu = enr ? db.students.find((s) => s.id === enr.studentId) : null;
            const cls = enr ? db.classes.find((c) => c.id === enr.classId) : null;
            const sec = enr ? db.sections.find((s) => s.id === enr.sectionId) : null;
            if (!summary || !enr || !stu || !cls || !sec) return null;
            const subs = db.studentSubjectResults
              .filter((r) => r.examId === activeExam.id && r.studentEnrollmentId === enr.id)
              .map((r) => {
                const es = db.examSubjects.find((x) => x.id === r.examSubjectId)!;
                const sub = db.subjects.find((x) => x.id === es.subjectId)!;
                const mk = db.marks.find(
                  (m) => m.examSubjectId === es.id && m.studentEnrollmentId === enr.id
                );
                return {
                  subjectCode: sub.officialCode ?? '',
                  subjectName: sub.name,
                  subjectNameBn: sub.nameBn ?? sub.name,
                  fullMarks: es.fullMarks,
                  writtenMarks: mk?.writtenMarks ?? 0,
                  mcqMarks: mk?.mcqMarks ?? 0,
                  practicalMarks: mk?.practicalMarks ?? 0,
                  totalMarks: r.totalMarks,
                  letterGrade: r.letterGrade,
                  gradePoint: r.gradePoint,
                  isPassed: r.isPassed,
                  isOptional: r.isOptional,
                  bonusGradePoint: r.bonusGradePoint ?? 0,
                  isAbsent: r.isAbsent,
                };
              });
            return (
              <div className="space-y-4">
                <div className="flex justify-end no-print">
                  <Button variant="primary" size="sm" onClick={triggerPrint}>
                    <Printer className="w-4 h-4" /> {pick('প্রিন্ট করুন', 'Print Marksheet')}
                  </Button>
                </div>
                <PrintableMarksheet
                  school={db.schoolProfile}
                  examName={activeExam.name}
                  student={{
                    studentId: stu.studentId,
                    nameEn: stu.nameEn,
                    nameBn: stu.nameBn,
                    roll: enr.roll,
                    className: cls.name,
                    classNameBn: cls.nameBn ?? cls.name,
                    sectionName: sec.name,
                    academicYear: activeExamYearName,
                  }}
                  summary={summary}
                  subjects={subs}
                />
              </div>
            );
          })()}
      </Modal>

      {/* Create Exam Modal */}
      <Modal
        open={newExamOpen}
        onClose={() => setNewExamOpen(false)}
        title={pick('নতুন পরীক্ষা তৈরি করুন', 'Create New Examination')}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newExamForm.name.trim()) return;
            const created = await createExam(newExamForm).unwrap();
            setSelectedExamId(created.id);
            toast.success(
              pick(
                'নতুন পরীক্ষা এবং এনসিটিবি বিষয় বিন্যাস স্বয়ংক্রিয়ভাবে তৈরি হয়েছে।',
                'Exam created with NCTB subject configurations.'
              )
            );
            setNewExamForm({ ...newExamForm, name: '' });
            setNewExamOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={pick('পরীক্ষার নাম', 'Exam Name')} required>
            <Input
              value={newExamForm.name}
              onChange={(e) => setNewExamForm({ ...newExamForm, name: e.target.value })}
              placeholder={pick('যেমন: মডেল টেস্ট ২০২৬ (৯ম শ্রেণি)', 'e.g., Model Test 2026 (Class 9)')}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={pick('শ্রেণি', 'Class')}>
              <Select
                value={newExamForm.classId}
                onChange={(e) => setNewExamForm({ ...newExamForm, classId: e.target.value })}
              >
                {db.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {locale === 'bn' ? c.nameBn : c.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={pick('ধরন', 'Type')}>
              <Select
                value={newExamForm.examType}
                onChange={(e) =>
                  setNewExamForm({ ...newExamForm, examType: e.target.value as ExamType })
                }
              >
                {Object.values(ExamType).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={pick('শুরুর তারিখ', 'Start Date')} required>
              <Input
                type="date"
                value={newExamForm.startDate}
                onChange={(e) => setNewExamForm({ ...newExamForm, startDate: e.target.value })}
              />
            </FormField>
            <FormField label={pick('শেষের তারিখ', 'End Date')} required>
              <Input
                type="date"
                value={newExamForm.endDate}
                onChange={(e) => setNewExamForm({ ...newExamForm, endDate: e.target.value })}
              />
            </FormField>
          </div>
          <p className="text-xs text-muted-foreground bg-surface-muted/60 p-3 rounded-[var(--radius)] border border-border">
            {pick(
              'নতুন পরীক্ষা তৈরি হলে নির্বাচিত শ্রেণির এনসিটিবি নির্ধারিত সকল বিষয় ও অংশভিত্তিক পূর্ণমান (লিখিত/MCQ/ব্যবহারিক) স্বয়ংক্রিয়ভাবে যুক্ত হয়ে যাবে।',
              'All NCTB subjects and component marks (Written/MCQ/Practical) for the selected class will automatically attach to this exam.'
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNewExamOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={creatingExam}>
              {creatingExam ? pick('তৈরি হচ্ছে...', 'Creating...') : pick('তৈরি করুন', 'Create')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Landscape A4 Tabulation Sheet Modal */}
      <Modal
        open={tabulationOpen}
        onClose={() => setTabulationOpen(false)}
        title={pick('শ্রেণিভিত্তিক ট্যাবুলেশন শিট (A4 ল্যান্ডস্কেপ)', 'Class Tabulation Sheet (A4 Landscape)')}
        maxWidth="max-w-6xl"
      >
        {activeExam &&
          (() => {
            const cls = db.classes.find((c) => c.id === activeExam.classId);
            const tabSubjects = examSubs.map((es) => {
              const sub = db.subjects.find((s) => s.id === es.subjectId);
              return {
                id: es.id,
                code: sub?.officialCode ?? '',
                nameBn: sub?.nameBn ?? sub?.name ?? '',
                nameEn: sub?.name ?? '',
                fullMarks: es.fullMarks,
              };
            });
            const tabRows = examSummaries.map((res) => {
              const enr = db.enrollments.find((e) => e.id === res.studentEnrollmentId);
              const stu = enr ? db.students.find((s) => s.id === enr.studentId) : null;
              const sec = enr ? db.sections.find((s) => s.id === enr.sectionId) : null;
              const subjectMarks: Record<string, { total: number; grade: string; isAbsent?: boolean }> =
                {};
              db.studentSubjectResults
                .filter(
                  (r) => r.examId === activeExam.id && r.studentEnrollmentId === res.studentEnrollmentId
                )
                .forEach((r) => {
                  subjectMarks[r.examSubjectId] = {
                    total: r.totalMarks,
                    grade: r.letterGrade ?? '—',
                    isAbsent: r.isAbsent,
                  };
                });
              return {
                roll: enr?.roll ?? 0,
                studentId: stu?.studentId ?? res.studentEnrollmentId,
                studentName: locale === 'bn' ? stu?.nameBn || stu?.nameEn || '—' : stu?.nameEn || '—',
                sectionName: sec?.name ?? '—',
                subjectMarks,
                totalMarks: res.totalMarks,
                totalFullMarks: res.totalFullMarks,
                gpa: res.gpa ?? null,
                letterGrade: res.letterGrade ?? null,
                meritPosition: res.meritPosition ?? null,
                resultStatus: res.resultStatus,
              };
            });
            return (
              <div className="space-y-4">
                <div className="flex justify-end no-print">
                  <Button variant="primary" size="sm" onClick={triggerPrint}>
                    <Printer className="w-4 h-4" /> {pick('ল্যান্ডস্কেপ প্রিন্ট করুন', 'Print Landscape Sheet')}
                  </Button>
                </div>
                <PrintableTabulationSheet
                  school={db.schoolProfile}
                  examName={activeExam.name}
                  className={locale === 'bn' ? cls?.nameBn ?? cls?.name ?? '' : cls?.name ?? ''}
                  academicYear={activeExamYearName}
                  subjects={tabSubjects}
                  rows={tabRows}
                />
              </div>
            );
          })()}
      </Modal>

      {/* Exam Seat Plan Print Modal */}
      <Modal
        open={seatPlanOpen}
        onClose={() => setSeatPlanOpen(false)}
        title={pick('পরীক্ষার আসন বিন্যাস (Exam Seat Plan)', 'Exam Seat Plan Print')}
        maxWidth="max-w-4xl"
      >
        {activeExam &&
          (() => {
            const cls = db.classes.find((c) => c.id === activeExam.classId);
            const seats = allExamEnrollments.map((enr, idx) => {
              const stu = db.students.find((s) => s.id === enr.studentId);
              const sec = db.sections.find((s) => s.id === enr.sectionId);
              return {
                seatNo: idx + 1,
                roll: enr.roll,
                studentId: stu?.studentId ?? enr.studentId,
                studentName: locale === 'bn' ? stu?.nameBn || stu?.nameEn || '—' : stu?.nameEn || '—',
                className: locale === 'bn' ? cls?.nameBn ?? cls?.name ?? '' : cls?.name ?? '',
                sectionName: sec?.name ?? '—',
              };
            });
            return (
              <div className="space-y-4">
                <div className="flex justify-end no-print">
                  <Button variant="primary" size="sm" onClick={triggerPrint}>
                    <Printer className="w-4 h-4" /> {pick('আসন বিন্যাস প্রিন্ট করুন', 'Print Seat Plan')}
                  </Button>
                </div>
                <PrintableExamSeatPlan
                  school={db.schoolProfile}
                  examName={activeExam.name}
                  roomName={pick('ভবন ১ — হল রুম ২০১', 'Building 1 — Exam Hall 201')}
                  seats={seats}
                />
              </div>
            );
          })()}
      </Modal>
    </div>
  );
}
