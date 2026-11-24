'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileUp,
  Lock,
  Save,
  Search,
  Unlock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetBootstrapQuery,
  useProcessExamResultsMutation,
  useSaveMarksBatchMutation,
} from '@/src/store/api';
import { useAppSelector } from '@/src/store/hooks';
import { useI18n } from '@/src/lib/i18n';
import {
  ConfirmDialog,
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Input, Modal, Select, Textarea } from '@/src/components/ui/primitives';
import {
  evaluateExamSubjectMark,
  formatDateShort,
  formatNumber,
  type ComponentFailReason,
} from '@/src/lib/formatters';
import { cn, exportToCsv } from '@/src/lib/utils/cn';
import { ResultPublicationStatus } from '@/src/types/enums';

interface DraftMarkRow {
  written: number;
  mcq: number;
  practical: number;
  ca: number;
  isAbsent: boolean;
}

function failReasonLabel(reason: ComponentFailReason, locale: 'bn' | 'en') {
  switch (reason) {
    case 'ABSENT':
      return locale === 'bn' ? 'অনুপস্থিত' : 'Absent';
    case 'WRITTEN_FAIL':
      return locale === 'bn' ? 'লিখিত ফেল' : 'Written Fail';
    case 'MCQ_FAIL':
      return locale === 'bn' ? 'MCQ ফেল' : 'MCQ Fail';
    case 'PRACTICAL_FAIL':
      return locale === 'bn' ? 'ব্যবহারিক ফেল' : 'Practical Fail';
    case 'CA_FAIL':
      return locale === 'bn' ? 'CA ফেল' : 'CA Fail';
    case 'TOTAL_FAIL':
      return locale === 'bn' ? 'মোট ফেল' : 'Total Fail';
    default:
      return null;
  }
}

export function MarksEntryView() {
  const searchParams = useSearchParams();
  const urlExamId = searchParams.get('examId') ?? '';
  const urlSubjectId = searchParams.get('subjectId') ?? '';

  const { data: db, isLoading } = useGetBootstrapQuery();
  const user = useAppSelector((s) => s.auth.user);
  const { locale, pick } = useI18n();
  const [saveMarksBatch, { isLoading: saving }] = useSaveMarksBatchMutation();
  const [processResults, { isLoading: unlocking }] = useProcessExamResultsMutation();

  const [selectedExamId, setSelectedExamId] = useState(urlExamId || 'exam-ann-10');
  const [selectedSubjectId, setSelectedSubjectId] = useState(urlSubjectId);
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState<Record<string, DraftMarkRow>>({});

  // Dirty-state navigation guard
  const [pendingSwitch, setPendingSwitch] = useState<{ type: 'exam' | 'subject'; value: string } | null>(null);

  // CSV Bulk Import Modal state
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');

  const activeExams = useMemo(
    () => (db ? db.exams.filter((e) => !e.isDeleted) : []),
    [db]
  );

  const resolvedExamId =
    selectedExamId && activeExams.some((e) => e.id === selectedExamId)
      ? selectedExamId
      : activeExams[0]?.id ?? '';

  const activeExam = activeExams.find((e) => e.id === resolvedExamId) ?? null;

  const examSubjects = useMemo(() => {
    if (!db || !activeExam) return [];
    return db.examSubjects
      .filter((es) => es.examId === activeExam.id)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [db, activeExam]);

  const resolvedSubjectId =
    selectedSubjectId && examSubjects.some((es) => es.id === selectedSubjectId)
      ? selectedSubjectId
      : examSubjects[0]?.id ?? '';

  const activeExamSubject = examSubjects.find((es) => es.id === resolvedSubjectId) ?? null;

  const classSections = useMemo(() => {
    if (!db || !activeExam) return [];
    return db.sections.filter((s) => s.classId === activeExam.classId);
  }, [db, activeExam]);

  const targetEnrollments = useMemo(() => {
    if (!db || !activeExam || !activeExamSubject) return [];
    const q = search.trim().toLowerCase();
    return db.enrollments
      .filter((e) => e.classId === activeExam.classId && e.academicYearId === activeExam.academicYearId)
      .filter((e) => !activeExamSubject.groupId || e.groupId === activeExamSubject.groupId)
      .filter((e) => sectionFilter === 'ALL' || e.sectionId === sectionFilter)
      .filter((e) => {
        if (!q) return true;
        const stu = db.students.find((s) => s.id === e.studentId);
        const hay = `${stu?.nameBn ?? ''} ${stu?.nameEn ?? ''} ${stu?.studentId ?? ''} ${e.roll}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => a.roll - b.roll);
  }, [db, activeExam, activeExamSubject, sectionFilter, search]);

  const scaleRanges = useMemo(() => {
    if (!db || !activeExam) return [];
    return db.gradeRanges.filter((r) => r.gradingScaleId === activeExam.gradingScaleId && !r.isDeleted);
  }, [db, activeExam]);

  // CSV preview parser
  const csvPreview = useMemo(() => {
    if (!db || !activeExamSubject || !csvText.trim()) {
      return { matched: [] as Array<{ enrollmentId: string; roll: number; name: string; row: DraftMarkRow }>, errors: [] as string[] };
    }
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const matched: Array<{ enrollmentId: string; roll: number; name: string; row: DraftMarkRow }> = [];
    const errors: string[] = [];

    const wMax = activeExamSubject.hasWritten ? activeExamSubject.writtenFullMarks ?? 0 : 0;
    const mMax = activeExamSubject.hasMcq ? activeExamSubject.mcqFullMarks ?? 0 : 0;
    const pMax = activeExamSubject.hasPractical ? activeExamSubject.practicalFullMarks ?? 0 : 0;
    const cMax = activeExamSubject.hasContinuousAssessment
      ? activeExamSubject.continuousAssessmentFullMarks ?? 0
      : 0;

    lines.forEach((line, idx) => {
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (idx === 0 && (cols[0].toLowerCase().includes('roll') || cols[0].toLowerCase().includes('student'))) {
        return; // skip header row
      }
      const key = cols[0];
      const enr = targetEnrollments.find((e) => {
        const stu = db.students.find((s) => s.id === e.studentId);
        return String(e.roll) === key || stu?.studentId.toLowerCase() === key.toLowerCase();
      });
      if (!enr) {
        errors.push(`Row ${idx + 1}: Unknown Roll/Student ID "${key}"`);
        return;
      }
      const stu = db.students.find((s) => s.id === enr.studentId);
      const written = activeExamSubject.hasWritten ? Number(cols[1] || 0) : 0;
      const mcq = activeExamSubject.hasMcq ? Number(cols[2] || 0) : 0;
      const practical = activeExamSubject.hasPractical ? Number(cols[3] || 0) : 0;
      const ca = activeExamSubject.hasContinuousAssessment ? Number(cols[4] || 0) : 0;
      const absentRaw = (cols[5] ?? '').toLowerCase();
      const isAbsent = absentRaw === 'true' || absentRaw === 'ab' || absentRaw === '1' || absentRaw === 'yes';

      if (!isAbsent) {
        if (
          Number.isNaN(written) ||
          Number.isNaN(mcq) ||
          Number.isNaN(practical) ||
          Number.isNaN(ca) ||
          written < 0 ||
          mcq < 0 ||
          practical < 0 ||
          ca < 0
        ) {
          errors.push(`Row ${idx + 1} (Roll ${enr.roll}): Invalid or negative mark value`);
          return;
        }
        if (written > wMax || mcq > mMax || practical > pMax || ca > cMax) {
          errors.push(`Row ${idx + 1} (Roll ${enr.roll}): Component mark exceeds maximum allowed`);
          return;
        }
      }

      matched.push({
        enrollmentId: enr.id,
        roll: enr.roll,
        name: locale === 'bn' ? stu?.nameBn || stu?.nameEn || '' : stu?.nameEn || '',
        row: {
          written: isAbsent ? 0 : written,
          mcq: isAbsent ? 0 : mcq,
          practical: isAbsent ? 0 : practical,
          ca: isAbsent ? 0 : ca,
          isAbsent,
        },
      });
    });

    return { matched, errors };
  }, [db, activeExamSubject, csvText, targetEnrollments, locale]);

  const dirtyCount = Object.keys(drafts).length;
  const deadlineExpired = Boolean(
    activeExam?.marksEntryDeadline && new Date(activeExam.marksEntryDeadline) < new Date()
  );
  const isLocked = Boolean(
    !activeExam ||
      activeExam.isLocked ||
      deadlineExpired ||
      activeExam.resultStatus === ResultPublicationStatus.PUBLISHED
  );

  const getRow = (enrollmentId: string): DraftMarkRow => {
    if (drafts[enrollmentId]) return drafts[enrollmentId];
    const mk = db?.marks.find(
      (m) => m.studentEnrollmentId === enrollmentId && m.examSubjectId === resolvedSubjectId
    );
    return {
      written: mk?.writtenMarks ?? 0,
      mcq: mk?.mcqMarks ?? 0,
      practical: mk?.practicalMarks ?? 0,
      ca: mk?.continuousAssessmentMarks ?? 0,
      isAbsent: mk?.isAbsent ?? false,
    };
  };

  const requestSwitch = (type: 'exam' | 'subject', value: string) => {
    if (dirtyCount > 0) {
      setPendingSwitch({ type, value });
      return;
    }
    if (type === 'exam') {
      setSelectedExamId(value);
      setSelectedSubjectId('');
      setSectionFilter('ALL');
    } else {
      setSelectedSubjectId(value);
    }
  };

  const confirmSwitch = () => {
    if (!pendingSwitch) return;
    setDrafts({});
    if (pendingSwitch.type === 'exam') {
      setSelectedExamId(pendingSwitch.value);
      setSelectedSubjectId('');
      setSectionFilter('ALL');
    } else {
      setSelectedSubjectId(pendingSwitch.value);
    }
    setPendingSwitch(null);
  };

  const handleSaveSheet = async () => {
    if (!activeExam || !activeExamSubject) return;
    const wMax = activeExamSubject.hasWritten ? activeExamSubject.writtenFullMarks ?? 0 : 0;
    const mMax = activeExamSubject.hasMcq ? activeExamSubject.mcqFullMarks ?? 0 : 0;
    const pMax = activeExamSubject.hasPractical ? activeExamSubject.practicalFullMarks ?? 0 : 0;
    const cMax = activeExamSubject.hasContinuousAssessment
      ? activeExamSubject.continuousAssessmentFullMarks ?? 0
      : 0;

    for (const enr of targetEnrollments) {
      const row = getRow(enr.id);
      if (row.isAbsent) continue;
      if (row.written < 0 || row.mcq < 0 || row.practical < 0 || row.ca < 0) {
        toast.error(
          pick(
            `রোল ${formatNumber(enr.roll, locale)}: ঋণাত্মক নম্বর গ্রহণযোগ্য নয়।`,
            `Roll ${enr.roll}: Negative marks are not allowed.`
          )
        );
        return;
      }
      if (row.written > wMax || row.mcq > mMax || row.practical > pMax || row.ca > cMax) {
        toast.error(
          pick(
            `রোল ${formatNumber(enr.roll, locale)}: কোনো উপাংশের নম্বর সর্বোচ্চ সীমা অতিক্রম করেছে।`,
            `Roll ${enr.roll}: Mark exceeds maximum allowed for a component.`
          )
        );
        return;
      }
    }

    const entries = targetEnrollments.map((enr) => {
      const row = getRow(enr.id);
      return {
        studentEnrollmentId: enr.id,
        writtenMarks: row.isAbsent ? 0 : row.written,
        mcqMarks: row.isAbsent ? 0 : row.mcq,
        practicalMarks: row.isAbsent ? 0 : row.practical,
        continuousAssessmentMarks: row.isAbsent ? 0 : row.ca,
        isAbsent: row.isAbsent,
      };
    });

    const res = await saveMarksBatch({
      examId: activeExam.id,
      examSubjectId: activeExamSubject.id,
      enteredBy: user?.id ?? 'user-admin',
      entries,
    });

    if ('error' in res) {
      const msg = (res.error as { message?: string })?.message;
      toast.error(msg || pick('নম্বর সংরক্ষণ ব্যর্থ হয়েছে।', 'Failed to save marks.'));
      return;
    }

    setDrafts({});
    toast.success(
      pick(
        `${formatNumber(entries.length, locale)} জন শিক্ষার্থীর নম্বর সংরক্ষিত হয়েছে।`,
        `Saved marks for ${entries.length} students.`
      )
    );
  };

  const handleQuickUnlock = async () => {
    if (!activeExam) return;
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await processResults({
      examId: activeExam.id,
      action: 'UNLOCK',
      extendDeadline: nextWeek,
    });
    toast.success(
      pick(
        'পরীক্ষা আনলক এবং সময়সীমা ৭ দিন বাড়ানো হয়েছে। এখন নম্বর এন্ট্রি করতে পারবেন।',
        'Exam unlocked and deadline extended by 7 days.'
      )
    );
  };

  const handleDownloadCsvTemplate = () => {
    if (!activeExamSubject) return;
    exportToCsv(
      targetEnrollments.map((enr) => {
        const row = getRow(enr.id);
        return {
          roll: enr.roll,
          written: row.written,
          mcq: row.mcq,
          practical: row.practical,
          ca: row.ca,
          absent: row.isAbsent ? 'AB' : '',
        };
      }),
      `marks-template-${activeExam?.id}-${activeExamSubject.id}.csv`,
      [
        { key: 'roll', label: 'Roll' },
        { key: 'written', label: 'Written' },
        { key: 'mcq', label: 'MCQ' },
        { key: 'practical', label: 'Practical' },
        { key: 'ca', label: 'CA' },
        { key: 'absent', label: 'Absent (AB)' },
      ]
    );
  };

  const handleApplyCsvImport = () => {
    if (csvPreview.matched.length === 0) {
      toast.error(pick('ইম্পোর্ট করার মতো কোনো সঠিক সারি নেই।', 'No valid rows found to import.'));
      return;
    }
    setDrafts((prev) => {
      const next = { ...prev };
      csvPreview.matched.forEach((m) => {
        next[m.enrollmentId] = m.row;
      });
      return next;
    });
    toast.success(
      pick(
        `${formatNumber(csvPreview.matched.length, locale)} জন শিক্ষার্থীর নম্বর শিটে লোড হয়েছে। স্থায়ীভাবে সংরক্ষণের জন্য "নম্বর সংরক্ষণ করুন" বাটনে ক্লিক করুন।`,
        `Loaded ${csvPreview.matched.length} rows into the marks grid. Click Save Marks to persist.`
      )
    );
    setCsvModalOpen(false);
    setCsvText('');
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText(String(ev.target?.result ?? ''));
    };
    reader.readAsText(file);
  };

  const activeSubjectMeta = activeExamSubject && db
    ? db.subjects.find((s) => s.id === activeExamSubject.subjectId)
    : null;

  const kpis = useMemo(() => {
    if (!db) {
      return { total: 0, enteredCount: 0, absentCount: 0, passedCount: 0, failedCount: 0, progressPct: 0 };
    }
    let enteredCount = 0;
    let absentCount = 0;
    let passedCount = 0;
    let failedCount = 0;

    targetEnrollments.forEach((enr) => {
      const row = getRow(enr.id);
      const isEntered =
        row.isAbsent || row.written > 0 || row.mcq > 0 || row.practical > 0 || row.ca > 0;
      if (isEntered) {
        enteredCount++;
      }
      if (row.isAbsent) {
        absentCount++;
        failedCount++;
      } else if (activeExamSubject && scaleRanges.length > 0) {
        const ev = evaluateExamSubjectMark(
          {
            writtenMarks: row.written,
            mcqMarks: row.mcq,
            practicalMarks: row.practical,
            continuousAssessmentMarks: row.ca,
            isAbsent: row.isAbsent,
          },
          activeExamSubject,
          scaleRanges
        );
        if (ev.isPassed) passedCount++;
        else failedCount++;
      }
    });

    const total = targetEnrollments.length;
    const progressPct = total > 0 ? Math.round((enteredCount / total) * 100) : 0;

    return {
      total,
      enteredCount,
      absentCount,
      passedCount,
      failedCount,
      progressPct,
    };
  }, [targetEnrollments, drafts, db, resolvedSubjectId, activeExamSubject, scaleRanges]);

  if (isLoading || !db) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <PageHeader
        titleBn="নম্বর এন্ট্রি শিট ও বাল্ক CSV ইম্পোর্ট"
        titleEn="Marks Entry Grid & Bulk CSV Import"
        subtitleBn="সৃজনশীল/লিখিত, MCQ, ব্যবহারিক ও ধারাবাহিক মূল্যায়নের (CA) নম্বর এন্ট্রি করুন। এনসিটিবি উপাংশ-ভিত্তিক পাশ নীতি তাৎক্ষণিক যাচাই হবে।"
        subtitleEn="Enter Written, MCQ, Practical, and CA marks with real-time NCTB component-pass validation and CSV bulk import."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadCsvTemplate}
              disabled={!activeExamSubject || targetEnrollments.length === 0}
              className="whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              {pick('CSV টেমপ্লেট', 'CSV Template')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setCsvModalOpen(true)}
              disabled={isLocked || !activeExamSubject}
              className="whitespace-nowrap shrink-0"
            >
              <FileUp className="w-4 h-4" />
              {pick('CSV ইম্পোর্ট', 'Import CSV')}
            </Button>
            <Button
              onClick={handleSaveSheet}
              disabled={isLocked || saving || !activeExamSubject || targetEnrollments.length === 0}
              className="whitespace-nowrap shrink-0"
            >
              <Save className="w-4 h-4" />
              {dirtyCount > 0
                ? pick(`নম্বর সংরক্ষণ (${formatNumber(dirtyCount, locale)})`, `Save Marks (${dirtyCount})`)
                : pick('নম্বর সংরক্ষণ করুন', 'Save Marks')}
            </Button>
          </div>
        }
      />

      {/* Selection Toolbar */}
      <Card className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-1 lg:col-span-4">
          <label className="block text-xs text-muted-foreground mb-1">{pick('পরীক্ষা নির্বাচন করুন', 'Examination')}</label>
          <Select value={resolvedExamId} onChange={(e) => requestSwitch('exam', e.target.value)}>
            {activeExams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="sm:col-span-1 lg:col-span-4">
          <label className="block text-xs text-muted-foreground mb-1">{pick('বিষয় নির্বাচন করুন', 'Subject')}</label>
          <Select value={resolvedSubjectId} onChange={(e) => requestSwitch('subject', e.target.value)}>
            {examSubjects.map((es) => {
              const sub = db.subjects.find((s) => s.id === es.subjectId);
              const grp = es.groupId ? db.academicGroups.find((g) => g.id === es.groupId) : null;
              return (
                <option key={es.id} value={es.id}>
                  {locale === 'bn' ? sub?.nameBn || sub?.name : sub?.name} ({sub?.officialCode})
                  {grp ? ` — ${locale === 'bn' ? grp.nameBn : grp.name}` : ''}
                </option>
              );
            })}
          </Select>
        </div>

        <div className="sm:col-span-1 lg:col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">{pick('শাখা', 'Section')}</label>
          <Select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
            <option value="ALL">{pick('সকল শাখা', 'All')}</option>
            {classSections.map((s) => (
              <option key={s.id} value={s.id}>
                {pick('শাখা', 'Sec')} {s.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="sm:col-span-1 lg:col-span-2 relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={pick('রোল বা নাম...', 'Roll/name...')}
            className="pl-9"
          />
        </div>
      </Card>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-base font-bold text-foreground">
            {pick('মোট পরীক্ষার্থী ও বিষয়', 'Total Examinees & Subject')}
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
            {formatNumber(kpis.total, locale)}{' '}
            <span className="text-sm font-medium text-muted-foreground">{pick('জন', '')}</span>
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground truncate">
            {activeExamSubject
              ? `${pick('পূর্ণমান', 'Full')}: ${formatNumber(activeExamSubject.fullMarks, locale)} | ${activeSubjectMeta?.officialCode ?? ''}`
              : pick('বিষয় নির্বাচিত হয়নি', 'No subject selected')}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-base font-bold text-foreground">
            {pick('এন্ট্রি অগ্রগতি', 'Entry Progress')}
          </p>
          <p
            className={cn(
              'mt-2 text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight',
              kpis.progressPct === 100
                ? 'text-success'
                : kpis.progressPct > 0
                  ? 'text-primary'
                  : 'text-muted-foreground'
            )}
          >
            {formatNumber(kpis.progressPct, locale)}%
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground tabular-nums">
            {pick(
              `${formatNumber(kpis.enteredCount, locale)} / ${formatNumber(kpis.total, locale)} জনের নম্বর এন্ট্রি`,
              `${kpis.enteredCount} of ${kpis.total} marks recorded`
            )}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-base font-bold text-foreground">
            {pick('উপস্থিতি ও অনুপস্থিতি', 'Attendance & Absent')}
          </p>
          <p
            className={cn(
              'mt-2 text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight',
              kpis.absentCount > 0 ? 'text-destructive' : 'text-foreground'
            )}
          >
            {formatNumber(kpis.absentCount, locale)}{' '}
            <span className="text-sm font-medium text-muted-foreground">{pick('অনুপস্থিত', 'absent')}</span>
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground tabular-nums">
            {pick(
              `উপস্থিত: ${formatNumber(kpis.total - kpis.absentCount, locale)} জন (${formatNumber(kpis.total > 0 ? Math.round(((kpis.total - kpis.absentCount) / kpis.total) * 100) : 0, locale)}%)`,
              `Present: ${kpis.total - kpis.absentCount} (${kpis.total > 0 ? Math.round(((kpis.total - kpis.absentCount) / kpis.total) * 100) : 0}%)`
            )}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-base font-bold text-foreground">
            {pick('প্রাথমিক মূল্যায়ন (উত্তীর্ণ / ব্যর্থ)', 'Pass / Component Fail')}
          </p>
          <p
            className={cn(
              'mt-2 text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight',
              kpis.failedCount > 0 ? 'text-warning' : 'text-success'
            )}
          >
            {formatNumber(kpis.passedCount, locale)}{' '}
            <span className="text-sm font-medium text-muted-foreground">{pick('পাস', 'passed')}</span>
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground tabular-nums truncate">
            {kpis.failedCount > 0
              ? pick(
                  `${formatNumber(kpis.failedCount, locale)} জন উপাংশে অকৃতকার্য`,
                  `${kpis.failedCount} component failed`
                )
              : pick('সকল মূল্যায়নকৃত শিক্ষার্থী উত্তীর্ণ', 'All evaluated passed')}
          </p>
        </Card>
      </div>

      {/* Lock / Deadline Notice Banner */}
      {isLocked && activeExam && (
        <div className="p-4 rounded-[var(--radius)] border border-warning/40 bg-warning/10 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">
                {activeExam.resultStatus === ResultPublicationStatus.PUBLISHED
                  ? pick('ফলাফল ইতিমধ্যে প্রকাশিত হয়েছে (শুধুমাত্র দেখার মোড)', 'Results already published (Read-only mode)')
                  : deadlineExpired
                    ? pick(
                        `নম্বর এন্ট্রির সময়সীমা অতিক্রান্ত হয়েছে (${formatDateShort(activeExam.marksEntryDeadline!, locale)})`,
                        `Marks entry deadline expired (${formatDateShort(activeExam.marksEntryDeadline!, locale)})`
                      )
                    : pick('পরীক্ষাটি লক করা আছে (শুধুমাত্র দেখার মোড)', 'Exam is locked (Read-only mode)')}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeExam.resultStatus === ResultPublicationStatus.PUBLISHED
                  ? pick(
                      'প্রকাশিত ফলাফল সংশোধনের জন্য ফলাফল প্রক্রিয়াকরণ পেজে পুনঃনিরীক্ষণ (Scrutiny) ব্যবহার করুন।',
                      'Use the Scrutiny / Re-evaluation workflow in Result Publication for post-publish mark revisions.'
                    )
                  : pick(
                      'নম্বর এন্ট্রি চালু করতে পরীক্ষাটি আনলক ও সময়সীমা বর্ধিত করুন।',
                      'Unlock the exam and extend deadline to resume editing marks.'
                    )}
              </p>
            </div>
          </div>
          {activeExam.resultStatus !== ResultPublicationStatus.PUBLISHED ? (
            <Button variant="outline" size="sm" onClick={handleQuickUnlock} disabled={unlocking}>
              <Unlock className="w-3.5 h-3.5" />
              {pick('আনলক ও ৭ দিন সময় বাড়ান', 'Unlock & Extend 7 Days')}
            </Button>
          ) : (
            <Link href="/admin/results/publication">
              <Button variant="outline" size="sm">
                {pick('পুনঃনিরীক্ষণ প্যানেল', 'Open Scrutiny Panel')}
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Marks Spreadsheet */}
      {!activeExamSubject ? (
        <EmptyState
          title={pick('কোনো বিষয় কনফিগার করা নেই', 'No exam subjects configured')}
          description={pick('আগে পরীক্ষা ও বিষয় পেজ থেকে বিষয় যুক্ত করুন।', 'Add subjects in Exams & Subjects first.')}
        />
      ) : targetEnrollments.length === 0 ? (
        <EmptyState
          title={pick('কোনো শিক্ষার্থী পাওয়া যায়নি', 'No matching students')}
          description={pick('অনুসন্ধান বা শাখা ফিল্টার পরিবর্তন করুন।', 'Adjust your section filter or search query.')}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-muted/50 flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <strong className="text-sm text-foreground">
                {locale === 'bn' ? activeSubjectMeta?.nameBn || activeSubjectMeta?.name : activeSubjectMeta?.name} (
                {activeSubjectMeta?.officialCode})
              </strong>
              <span className="text-muted-foreground">
                {pick('পূর্ণমান:', 'Full:')} <strong>{formatNumber(activeExamSubject.fullMarks, locale)}</strong> ·{' '}
                {pick('পাশ:', 'Pass:')} <strong>{formatNumber(activeExamSubject.passMarks, locale)}</strong>
              </span>
              {activeExamSubject.isOptional && (
                <span className="font-semibold text-primary">{pick('৪র্থ / ঐচ্ছিক বিষয়', '4th / Optional')}</span>
              )}
            </div>
            {activeExam && <StatusBadge enumName="ResultPublicationStatus" value={activeExam.resultStatus} />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-base">
              <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border text-sm font-semibold uppercase tracking-wider tabular-nums">
                <tr>
                  <th className="px-3 py-3 text-center w-16">{pick('রোল', 'Roll')}</th>
                  <th className="px-3 py-3 text-left min-w-[180px]">{pick('শিক্ষার্থী ও শাখা', 'Student')}</th>
                  <th className="px-2.5 py-3 text-center w-20">{pick('অনুপস্থিত', 'Absent')}</th>
                  {activeExamSubject.hasWritten && (
                    <th className="px-2.5 py-3 text-right w-28">
                      <div>{pick('লিখিত', 'Written')}</div>
                      <div className="text-xs font-semibold text-primary normal-case">
                        {formatNumber(activeExamSubject.writtenFullMarks ?? 0, locale)} ({pick('পাশ', 'Pass')}{' '}
                        {formatNumber(activeExamSubject.writtenPassMarks ?? 0, locale)})
                      </div>
                    </th>
                  )}
                  {activeExamSubject.hasMcq && (
                    <th className="px-2.5 py-3 text-right w-28">
                      <div>MCQ</div>
                      <div className="text-xs font-semibold text-primary normal-case">
                        {formatNumber(activeExamSubject.mcqFullMarks ?? 0, locale)} ({pick('পাশ', 'Pass')}{' '}
                        {formatNumber(activeExamSubject.mcqPassMarks ?? 0, locale)})
                      </div>
                    </th>
                  )}
                  {activeExamSubject.hasPractical && (
                    <th className="px-2.5 py-3 text-right w-28">
                      <div>{pick('ব্যবহারিক', 'Practical')}</div>
                      <div className="text-xs font-semibold text-primary normal-case">
                        {formatNumber(activeExamSubject.practicalFullMarks ?? 0, locale)} ({pick('পাশ', 'Pass')}{' '}
                        {formatNumber(activeExamSubject.practicalPassMarks ?? 0, locale)})
                      </div>
                    </th>
                  )}
                  {activeExamSubject.hasContinuousAssessment && (
                    <th className="px-2.5 py-3 text-right w-28">
                      <div>{pick('ধারাবাহিক (CA)', 'CA')}</div>
                      <div className="text-xs font-semibold text-primary normal-case">
                        {formatNumber(activeExamSubject.continuousAssessmentFullMarks ?? 0, locale)} ({pick('পাশ', 'Pass')}{' '}
                        {formatNumber(activeExamSubject.continuousAssessmentPassMarks ?? 0, locale)})
                      </div>
                    </th>
                  )}
                  <th className="px-3 py-3 text-right w-24">{pick('মোট', 'Total')}</th>
                  <th className="px-3 py-3 text-center w-36">{pick('তাৎক্ষণিক গ্রেড', 'Live Grade')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {targetEnrollments.map((enr) => {
                  const stu = db.students.find((s) => s.id === enr.studentId);
                  const sec = db.sections.find((s) => s.id === enr.sectionId);
                  const row = getRow(enr.id);
                  const isDirty = Boolean(drafts[enr.id]);

                  const evalRes = evaluateExamSubjectMark(
                    {
                      writtenMarks: row.written,
                      mcqMarks: row.mcq,
                      practicalMarks: row.practical,
                      continuousAssessmentMarks: row.ca,
                      isAbsent: row.isAbsent,
                    },
                    activeExamSubject,
                    scaleRanges
                  );
                  const reasonText = failReasonLabel(evalRes.failReason, locale);

                  const updateField = (patch: Partial<DraftMarkRow>) => {
                    setDrafts((prev) => ({
                      ...prev,
                      [enr.id]: { ...row, ...patch },
                    }));
                  };

                  return (
                    <tr
                      key={enr.id}
                      className={`${isDirty ? 'bg-primary/5' : 'hover:bg-surface-muted/40'} transition-colors`}
                    >
                      <td className="px-3 py-2.5 text-center font-medium text-base">{formatNumber(enr.roll, locale)}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-base text-foreground">
                          {locale === 'bn' ? stu?.nameBn || stu?.nameEn : stu?.nameEn}
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                          {pick('শাখা', 'Sec')} {sec?.name} · <span className="font-mono">{stu?.studentId}</span>
                        </p>
                      </td>
                      <td className="px-2.5 py-2 text-center">
                        <input
                          type="checkbox"
                          disabled={isLocked}
                          checked={row.isAbsent}
                          onChange={(e) => updateField({ isAbsent: e.target.checked })}
                        />
                      </td>
                      {activeExamSubject.hasWritten && (
                        <td className="px-2.5 py-2 text-right">
                          <Input
                            type="number"
                            min={0}
                            max={activeExamSubject.writtenFullMarks ?? 100}
                            disabled={isLocked || row.isAbsent}
                            value={row.isAbsent ? 0 : row.written}
                            onChange={(e) => {
                              const max = activeExamSubject.writtenFullMarks ?? 100;
                              const val = Math.min(max, Math.max(0, Number(e.target.value) || 0));
                              updateField({ written: val });
                            }}
                            className="w-20 ml-auto text-right h-8 px-2"
                          />
                        </td>
                      )}
                      {activeExamSubject.hasMcq && (
                        <td className="px-2.5 py-2 text-right">
                          <Input
                            type="number"
                            min={0}
                            max={activeExamSubject.mcqFullMarks ?? 50}
                            disabled={isLocked || row.isAbsent}
                            value={row.isAbsent ? 0 : row.mcq}
                            onChange={(e) => {
                              const max = activeExamSubject.mcqFullMarks ?? 50;
                              const val = Math.min(max, Math.max(0, Number(e.target.value) || 0));
                              updateField({ mcq: val });
                            }}
                            className="w-20 ml-auto text-right h-8 px-2"
                          />
                        </td>
                      )}
                      {activeExamSubject.hasPractical && (
                        <td className="px-2.5 py-2 text-right">
                          <Input
                            type="number"
                            min={0}
                            max={activeExamSubject.practicalFullMarks ?? 50}
                            disabled={isLocked || row.isAbsent}
                            value={row.isAbsent ? 0 : row.practical}
                            onChange={(e) => {
                              const max = activeExamSubject.practicalFullMarks ?? 50;
                              const val = Math.min(max, Math.max(0, Number(e.target.value) || 0));
                              updateField({ practical: val });
                            }}
                            className="w-20 ml-auto text-right h-8 px-2"
                          />
                        </td>
                      )}
                      {activeExamSubject.hasContinuousAssessment && (
                        <td className="px-2.5 py-2 text-right">
                          <Input
                            type="number"
                            min={0}
                            max={activeExamSubject.continuousAssessmentFullMarks ?? 50}
                            disabled={isLocked || row.isAbsent}
                            value={row.isAbsent ? 0 : row.ca}
                            onChange={(e) => {
                              const max = activeExamSubject.continuousAssessmentFullMarks ?? 50;
                              const val = Math.min(max, Math.max(0, Number(e.target.value) || 0));
                              updateField({ ca: val });
                            }}
                            className="w-20 ml-auto text-right h-8 px-2"
                          />
                        </td>
                      )}
                      <td className="px-3 py-2 text-right font-medium">
                        {row.isAbsent ? 'AB' : formatNumber(evalRes.totalMarks, locale)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`font-semibold ${
                            evalRes.isPassed ? 'text-success' : 'text-destructive'
                          }`}
                        >
                          {evalRes.letterGrade} ({formatNumber(evalRes.gradePoint, locale, 2)})
                        </span>
                        {reasonText && (
                          <span className="block text-xs text-destructive font-medium">
                            {reasonText}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Bulk CSV Import Modal */}
      <Modal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        title={pick('বাল্ক CSV নম্বর ইম্পোর্ট', 'Bulk CSV Marks Import')}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {pick(
              'কলাম বিন্যাস: Roll, Written, MCQ, Practical, CA, Absent (AB)। চাইলে "CSV টেমপ্লেট" ডাউনলোড করে পূরণ করে আপলোড করুন অথবা নিচে পেস্ট করুন।',
              'Column format: Roll, Written, MCQ, Practical, CA, Absent (AB). Upload a CSV file or paste rows below.'
            )}
          </p>

          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvFileUpload}
              className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius)] file:border file:border-border file:bg-surface-muted file:text-foreground file:text-xs file:font-medium cursor-pointer"
            />
          </div>

          <Textarea
            rows={6}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Roll,Written,MCQ,Practical,CA,Absent\n1,64,27,0,0,\n2,58,24,0,0,`}
            className="font-mono text-xs"
          />

          {csvText.trim() && (
            <div className="p-3 rounded-[var(--radius)] border border-border bg-surface-muted/50 text-xs space-y-1.5">
              <div className="flex items-center gap-4 font-semibold">
                <span className="text-success flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {pick('সঠিক সারি:', 'Valid rows:')} {formatNumber(csvPreview.matched.length, locale)}
                </span>
                {csvPreview.errors.length > 0 && (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {pick('ত্রুটি:', 'Errors:')} {formatNumber(csvPreview.errors.length, locale)}
                  </span>
                )}
              </div>
              {csvPreview.errors.slice(0, 4).map((err, i) => (
                <p key={i} className="text-destructive">
                  • {err}
                </p>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setCsvModalOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button onClick={handleApplyCsvImport} disabled={csvPreview.matched.length === 0}>
              {pick('শিটে লোড করুন', 'Apply to Marks Grid')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingSwitch)}
        onClose={() => setPendingSwitch(null)}
        onConfirm={confirmSwitch}
        title={pick('অসংরক্ষিত পরিবর্তন রয়েছে', 'Unsaved Marks Detected')}
        description={pick(
          `আপনার ${formatNumber(dirtyCount, locale)} জন শিক্ষার্থীর নম্বর এখনো সংরক্ষণ করা হয়নি। এগিয়ে গেলে পরিবর্তনগুলো হারিয়ে যাবে।`,
          `You have unsaved marks for ${dirtyCount} student(s). Switching now will discard those edits.`
        )}
        confirmLabel={pick('পরিবর্তন বাদ দিয়ে এগিয়ে যান', 'Discard & Switch')}
        destructive
      />
    </div>
  );
}
