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
  useGetExamsQuery,
  useGetExamSubjectsQuery,
  useGetGradeSheetQuery,
  useGetGradingScalesQuery,
  useSaveBulkMarksMutation,
  useToggleMarkLockMutation,
  useUpdateExamMutation,
  type GradeSheetStudentRow,
} from '@/src/features/examinations/api/examinations.api';
import { useGetSectionsQuery } from '@/src/services/academic/section.api';
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
import type { GradeRange } from '@/src/types/entities';

interface DraftMarkRow {
  written: string;
  mcq: string;
  practical: string;
  ca: string;
  isAbsent: boolean;
}

function sanitizeMarkInput(raw: string, max: number): string {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (cleaned === '') return '';
  const parts = cleaned.split('.');
  const normalized =
    parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
  const limitedDecimals =
    parts.length === 2 ? `${parts[0]}.${parts[1].slice(0, 2)}` : normalized;
  const num = Number(limitedDecimals);
  if (Number.isNaN(num)) return '';
  if (num > max) return String(max);
  return limitedDecimals;
}

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object') {
    const data = (err as { data?: { message?: unknown } }).data;
    if (data && typeof data.message === 'string') return data.message;
    if ('message' in err && typeof (err as { message?: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
  }
  return fallback;
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

  const { locale, pick } = useI18n();
  const { data: examsRes, isLoading: loadingExams } = useGetExamsQuery({
    limit: 100,
    isDeleted: false,
  });
  const { data: allSections = [] } = useGetSectionsQuery();
  const { data: scalesRes } = useGetGradingScalesQuery();
  const [saveBulkMarks, { isLoading: saving }] = useSaveBulkMarksMutation();
  const [updateExam, { isLoading: unlocking }] = useUpdateExamMutation();
  const [toggleMarkLock, { isLoading: togglingLock }] = useToggleMarkLockMutation();

  const [selectedExamId, setSelectedExamId] = useState(urlExamId);
  const [selectedSubjectId, setSelectedSubjectId] = useState(urlSubjectId);
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState<Record<string, DraftMarkRow>>({});
  const [pendingSwitch, setPendingSwitch] = useState<{
    type: 'exam' | 'subject';
    value: string;
  } | null>(null);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');

  const activeExams = useMemo(() => examsRes?.items ?? [], [examsRes?.items]);

  const resolvedExamId =
    selectedExamId && activeExams.some((e) => e.id === selectedExamId)
      ? selectedExamId
      : activeExams[0]?.id ?? '';

  const activeExam = activeExams.find((e) => e.id === resolvedExamId) ?? null;

  const { data: examSubjects = [], isFetching: loadingSubjects } =
    useGetExamSubjectsQuery(resolvedExamId, { skip: !resolvedExamId });

  const resolvedSubjectId =
    selectedSubjectId && examSubjects.some((es) => es.id === selectedSubjectId)
      ? selectedSubjectId
      : examSubjects[0]?.id ?? '';

  const activeExamSubject =
    examSubjects.find((es) => es.id === resolvedSubjectId) ?? null;

  const classSections = useMemo(() => {
    if (!activeExam) return [];
    return allSections.filter((s) => s.classId === activeExam.classId && s.isActive);
  }, [allSections, activeExam]);

  const { data: gradeSheet, isFetching: loadingSheet } = useGetGradeSheetQuery(
    {
      examSubjectId: resolvedSubjectId,
      ...(sectionFilter !== 'ALL' ? { sectionId: sectionFilter } : {}),
    },
    { skip: !resolvedSubjectId }
  );

  const allStudents = useMemo(
    () => gradeSheet?.students ?? [],
    [gradeSheet?.students]
  );

  const targetStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allStudents;
    return allStudents.filter((s) => {
      const hay = `${s.nameBn ?? ''} ${s.name ?? ''} ${s.studentId ?? ''} ${s.roll}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allStudents, search]);

  const scaleRanges = useMemo<GradeRange[]>(() => {
    const scales = scalesRes?.items ?? [];
    const matched = (scales.find((s) => s.id === activeExam?.gradingScaleId) ??
      scales[0]) as { gradeRanges?: GradeRange[]; ranges?: GradeRange[] } | undefined;
    const rawRanges = matched?.gradeRanges ?? matched?.ranges ?? [];
    return rawRanges.map((r) => ({
      ...r,
      minPercentage: Number(r.minPercentage),
      maxPercentage: Number(r.maxPercentage),
      gradePoint: Number(r.gradePoint),
    }));
  }, [scalesRes?.items, activeExam?.gradingScaleId]);

  const getRow = (stu: GradeSheetStudentRow): DraftMarkRow => {
    if (drafts[stu.studentEnrollmentId]) return drafts[stu.studentEnrollmentId];
    if (!stu.mark) {
      return { written: '', mcq: '', practical: '', ca: '', isAbsent: false };
    }
    return {
      written: String(stu.mark.writtenMarks ?? ''),
      mcq: String(stu.mark.mcqMarks ?? ''),
      practical: String(stu.mark.practicalMarks ?? ''),
      ca: String(stu.mark.continuousAssessmentMarks ?? ''),
      isAbsent: stu.mark.isAbsent ?? false,
    };
  };

  // CSV preview parser
  const csvPreview = useMemo(() => {
    if (!activeExamSubject || !csvText.trim()) {
      return {
        matched: [] as Array<{
          enrollmentId: string;
          roll: number;
          name: string;
          row: DraftMarkRow;
        }>,
        errors: [] as string[],
      };
    }
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const matched: Array<{
      enrollmentId: string;
      roll: number;
      name: string;
      row: DraftMarkRow;
    }> = [];
    const errors: string[] = [];

    const wMax = activeExamSubject.hasWritten ? activeExamSubject.writtenFullMarks ?? 0 : 0;
    const mMax = activeExamSubject.hasMcq ? activeExamSubject.mcqFullMarks ?? 0 : 0;
    const pMax = activeExamSubject.hasPractical ? activeExamSubject.practicalFullMarks ?? 0 : 0;
    const cMax = activeExamSubject.hasContinuousAssessment
      ? activeExamSubject.continuousAssessmentFullMarks ?? 0
      : 0;

    lines.forEach((line, idx) => {
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (
        idx === 0 &&
        (cols[0].toLowerCase().includes('roll') || cols[0].toLowerCase().includes('student'))
      ) {
        return;
      }
      const key = cols[0];
      const stu = targetStudents.find(
        (s) =>
          String(s.roll) === key || s.studentId.toLowerCase() === key.toLowerCase()
      );
      if (!stu) {
        errors.push(`Row ${idx + 1}: Unknown Roll/Student ID "${key}"`);
        return;
      }
      if (stu.mark?.isLocked) {
        errors.push(`Row ${idx + 1} (Roll ${stu.roll}): Mark is locked`);
        return;
      }
      const written = activeExamSubject.hasWritten ? Number(cols[1] || 0) : 0;
      const mcq = activeExamSubject.hasMcq ? Number(cols[2] || 0) : 0;
      const practical = activeExamSubject.hasPractical ? Number(cols[3] || 0) : 0;
      const ca = activeExamSubject.hasContinuousAssessment ? Number(cols[4] || 0) : 0;
      const absentRaw = (cols[5] ?? '').toLowerCase();
      const isAbsent =
        absentRaw === 'true' ||
        absentRaw === 'ab' ||
        absentRaw === '1' ||
        absentRaw === 'yes';

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
          errors.push(`Row ${idx + 1} (Roll ${stu.roll}): Invalid or negative mark value`);
          return;
        }
        if (written > wMax || mcq > mMax || practical > pMax || ca > cMax) {
          errors.push(
            `Row ${idx + 1} (Roll ${stu.roll}): Component mark exceeds maximum allowed`
          );
          return;
        }
      }

      matched.push({
        enrollmentId: stu.studentEnrollmentId,
        roll: stu.roll,
        name: locale === 'bn' ? stu.nameBn || stu.name : stu.name,
        row: {
          written: isAbsent ? '0' : String(written),
          mcq: isAbsent ? '0' : String(mcq),
          practical: isAbsent ? '0' : String(practical),
          ca: isAbsent ? '0' : String(ca),
          isAbsent,
        },
      });
    });

    return { matched, errors };
  }, [activeExamSubject, csvText, targetStudents, locale]);

  const dirtyCount = Object.keys(drafts).length;
  const deadlineExpired = Boolean(
    activeExam?.marksEntryDeadline &&
      new Date(activeExam.marksEntryDeadline) < new Date()
  );
  const isLocked = Boolean(
    !activeExam ||
      activeExam.isLocked ||
      activeExam.resultStatus === ResultPublicationStatus.PUBLISHED
  );

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
    const editedStudents = targetStudents.filter((stu) => {
      if (stu.mark?.isLocked) return false;
      const edit = drafts[stu.studentEnrollmentId];
      if (!edit) return false;
      if (stu.mark) return true;
      return (
        edit.isAbsent ||
        edit.written !== '' ||
        edit.mcq !== '' ||
        edit.practical !== '' ||
        edit.ca !== ''
      );
    });

    if (editedStudents.length === 0) {
      toast.info(
        pick(
          'সংরক্ষণের জন্য অন্তত একজন শিক্ষার্থীর নম্বর পরিবর্তন বা এন্ট্রি করুন।',
          'No edited or newly entered marks to save.'
        )
      );
      return;
    }

    const wMax = activeExamSubject.hasWritten ? activeExamSubject.writtenFullMarks ?? 0 : 0;
    const mMax = activeExamSubject.hasMcq ? activeExamSubject.mcqFullMarks ?? 0 : 0;
    const pMax = activeExamSubject.hasPractical ? activeExamSubject.practicalFullMarks ?? 0 : 0;
    const cMax = activeExamSubject.hasContinuousAssessment
      ? activeExamSubject.continuousAssessmentFullMarks ?? 0
      : 0;

    for (const stu of editedStudents) {
      const row = getRow(stu);
      if (row.isAbsent) continue;
      const w = Number(row.written || 0);
      const m = Number(row.mcq || 0);
      const p = Number(row.practical || 0);
      const c = Number(row.ca || 0);
      if (w < 0 || m < 0 || p < 0 || c < 0) {
        toast.error(
          pick(
            `রোল ${formatNumber(stu.roll, locale)}: ঋণাত্মক নম্বর গ্রহণযোগ্য নয়।`,
            `Roll ${stu.roll}: Negative marks are not allowed.`
          )
        );
        return;
      }
      if (w > wMax || m > mMax || p > pMax || c > cMax) {
        toast.error(
          pick(
            `রোল ${formatNumber(stu.roll, locale)}: কোনো উপাংশের নম্বর সর্বোচ্চ সীমা অতিক্রম করেছে।`,
            `Roll ${stu.roll}: Mark exceeds maximum allowed for a component.`
          )
        );
        return;
      }
    }

    try {
      const res = await saveBulkMarks({
        examSubjectId: activeExamSubject.id,
        ...(sectionFilter !== 'ALL' ? { sectionId: sectionFilter } : {}),
        marks: editedStudents.map((stu) => {
          const row = getRow(stu);
          return {
            studentEnrollmentId: stu.studentEnrollmentId,
            isAbsent: row.isAbsent,
            writtenMarks: row.isAbsent ? 0 : Number(row.written || 0),
            mcqMarks: row.isAbsent ? 0 : Number(row.mcq || 0),
            practicalMarks: row.isAbsent ? 0 : Number(row.practical || 0),
            continuousAssessmentMarks: row.isAbsent ? 0 : Number(row.ca || 0),
          };
        }),
      }).unwrap();

      setDrafts({});
      toast.success(
        pick(
          `${formatNumber(res.totalProcessed, locale)} জন শিক্ষার্থীর নম্বর সংরক্ষিত হয়েছে।`,
          `Saved marks for ${res.totalProcessed} students.`
        )
      );
    } catch (err) {
      toast.error(getErrorMessage(err, pick('নম্বর সংরক্ষণ ব্যর্থ হয়েছে।', 'Failed to save marks.')));
    }
  };

  const handleQuickUnlock = async () => {
    if (!activeExam) return;
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    try {
      await updateExam({
        id: activeExam.id,
        isLocked: false,
        marksEntryDeadline: nextWeek,
      }).unwrap();
      toast.success(
        pick(
          'পরীক্ষা আনলক এবং সময়সীমা ৭ দিন বাড়ানো হয়েছে। এখন নম্বর এন্ট্রি করতে পারবেন।',
          'Exam unlocked and deadline extended by 7 days.'
        )
      );
    } catch (err) {
      toast.error(getErrorMessage(err, pick('আনলক করা যায়নি।', 'Failed to unlock exam.')));
    }
  };

  const handleToggleStudentLock = async (stu: GradeSheetStudentRow) => {
    if (!stu.mark?.id) return;
    try {
      await toggleMarkLock({
        id: stu.mark.id,
        isLocked: !stu.mark.isLocked,
      }).unwrap();
      toast.success(
        !stu.mark.isLocked
          ? pick('নম্বর লক করা হয়েছে।', 'Mark locked.')
          : pick('নম্বর আনলক করা হয়েছে।', 'Mark unlocked.')
      );
    } catch (err) {
      toast.error(getErrorMessage(err, pick('লক পরিবর্তন করা যায়নি।', 'Could not update mark lock.')));
    }
  };

  const handleDownloadCsvTemplate = () => {
    if (!activeExamSubject) return;
    exportToCsv(
      targetStudents.map((stu) => {
        const row = getRow(stu);
        return {
          roll: stu.roll,
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

  const kpis = useMemo(() => {
    let enteredCount = 0;
    let absentCount = 0;
    let passedCount = 0;
    let failedCount = 0;

    targetStudents.forEach((stu) => {
      const row = getRow(stu);
      const isEntered =
        Boolean(stu.mark) ||
        row.isAbsent ||
        row.written !== '' ||
        row.mcq !== '' ||
        row.practical !== '' ||
        row.ca !== '';

      if (isEntered) {
        enteredCount++;
        if (row.isAbsent) {
          absentCount++;
          failedCount++;
        } else if (activeExamSubject && scaleRanges.length > 0) {
          const ev = evaluateExamSubjectMark(
            {
              writtenMarks: Number(row.written || 0),
              mcqMarks: Number(row.mcq || 0),
              practicalMarks: Number(row.practical || 0),
              continuousAssessmentMarks: Number(row.ca || 0),
              isAbsent: row.isAbsent,
            },
            activeExamSubject,
            scaleRanges
          );
          if (ev.isPassed) passedCount++;
          else failedCount++;
        }
      }
    });

    const total = targetStudents.length;
    const progressPct = total > 0 ? Math.round((enteredCount / total) * 100) : 0;

    return {
      total,
      enteredCount,
      absentCount,
      passedCount,
      failedCount,
      progressPct,
    };
  }, [targetStudents, drafts, activeExamSubject, scaleRanges]);

  if (loadingExams) return <LoadingSkeleton rows={6} />;

  const activeSubjectInfo = activeExamSubject?.subject;
  const gsSubject = gradeSheet?.examSubject;

  return (
    <div className="space-y-6">
      <PageHeader
        titleBn="নম্বর এন্ট্রি শিট ও রিভিউ"
        titleEn="Marks Entry Grid & Review"
        subtitleBn="শিক্ষকদের এন্ট্রি করা নম্বর যাচাই, সংশোধন, CSV ইম্পোর্ট ও লক করুন।"
        subtitleEn="Review, edit, CSV import, and lock examination marks."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadCsvTemplate}
              disabled={!activeExamSubject || targetStudents.length === 0}
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
              disabled={isLocked || saving || !activeExamSubject || targetStudents.length === 0}
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
          <label className="block text-xs text-muted-foreground mb-1">
            {pick('পরীক্ষা নির্বাচন করুন', 'Examination')}
          </label>
          <Select value={resolvedExamId} onChange={(e) => requestSwitch('exam', e.target.value)}>
            {activeExams.map((ex) => {
              const clsName =
                locale === 'bn'
                  ? (ex.schoolClass as { nameBn?: string; name?: string } | undefined)?.nameBn ||
                    ex.schoolClass?.name
                  : ex.schoolClass?.name;
              return (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                  {clsName ? ` (${clsName})` : ''}
                </option>
              );
            })}
          </Select>
        </div>

        <div className="sm:col-span-1 lg:col-span-4">
          <label className="block text-xs text-muted-foreground mb-1">
            {pick('বিষয় নির্বাচন করুন', 'Subject')}
          </label>
          <Select
            value={resolvedSubjectId}
            disabled={loadingSubjects || examSubjects.length === 0}
            onChange={(e) => requestSwitch('subject', e.target.value)}
          >
            {examSubjects.length === 0 && (
              <option value="">{pick('কোনো বিষয় নেই', 'No subjects')}</option>
            )}
            {examSubjects.map((es) => {
              const subName = locale === 'bn' ? es.subject?.nameBn || es.subject?.name : es.subject?.name;
              const code = es.subject?.officialCode ? ` (${es.subject.officialCode})` : '';
              const grpName = es.group
                ? ` — ${locale === 'bn' ? es.group.nameBn || es.group.name : es.group.name}`
                : '';
              return (
                <option key={es.id} value={es.id}>
                  {subName || '—'}
                  {code}
                  {grpName}
                </option>
              );
            })}
          </Select>
        </div>

        <div className="sm:col-span-1 lg:col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">
            {pick('শাখা', 'Section')}
          </label>
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
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {formatNumber(kpis.total, locale)}{' '}
            <span className="text-sm font-medium text-muted-foreground">{pick('জন', '')}</span>
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground truncate">
            {activeExamSubject
              ? `${pick('পূর্ণমান', 'Full')}: ${formatNumber(activeExamSubject.fullMarks, locale)}${
                  activeSubjectInfo?.officialCode ? ` | ${activeSubjectInfo.officialCode}` : ''
                }`
              : pick('বিষয় নির্বাচিত হয়নি', 'No subject selected')}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-base font-bold text-foreground">
            {pick('এন্ট্রি অগ্রগতি', 'Entry Progress')}
          </p>
          <p
            className={cn(
              'mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight',
              kpis.progressPct === 100
                ? 'text-success'
                : kpis.progressPct > 0
                  ? 'text-primary'
                  : 'text-muted-foreground'
            )}
          >
            {formatNumber(kpis.progressPct, locale)}%
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
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
              'mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight',
              kpis.absentCount > 0 ? 'text-destructive' : 'text-foreground'
            )}
          >
            {formatNumber(kpis.absentCount, locale)}{' '}
            <span className="text-sm font-medium text-muted-foreground">
              {pick('অনুপস্থিত', 'absent')}
            </span>
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {pick(
              `উপস্থিত: ${formatNumber(kpis.total - kpis.absentCount, locale)} জন`,
              `Present: ${kpis.total - kpis.absentCount}`
            )}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-base font-bold text-foreground">
            {pick('প্রাথমিক মূল্যায়ন (পাস / ফেল)', 'Pass / Fail Summary')}
          </p>
          <p
            className={cn(
              'mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight',
              kpis.failedCount > 0 ? 'text-warning' : 'text-success'
            )}
          >
            {formatNumber(kpis.passedCount, locale)}{' '}
            <span className="text-sm font-medium text-muted-foreground">{pick('পাস', 'passed')}</span>
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground truncate">
            {kpis.failedCount > 0
              ? pick(`${formatNumber(kpis.failedCount, locale)} জন অকৃতকার্য`, `${kpis.failedCount} failed`)
              : pick('মূল্যায়নকৃত সবাই উত্তীর্ণ', 'All evaluated passed')}
          </p>
        </Card>
      </div>

      {/* Lock / Deadline Notice Banner */}
      {(isLocked || deadlineExpired) && activeExam && (
        <div className="p-4 rounded-[var(--radius)] border border-warning/40 bg-warning/10 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">
                {activeExam.resultStatus === ResultPublicationStatus.PUBLISHED
                  ? pick('ফলাফল ইতিমধ্যে প্রকাশিত হয়েছে (শুধুমাত্র দেখার মোড)', 'Results already published (Read-only mode)')
                  : activeExam.isLocked
                    ? pick('পরীক্ষাটি লক করা আছে (শুধুমাত্র দেখার মোড)', 'Exam is locked (Read-only mode)')
                    : pick(
                        `শিক্ষকদের নম্বর এন্ট্রির সময়সীমা অতিক্রান্ত হয়েছে (${formatDateShort(activeExam.marksEntryDeadline!, locale)}) — অ্যাডমিন এন্ট্রি করতে পারবেন`,
                        `Teacher marks deadline expired (${formatDateShort(activeExam.marksEntryDeadline!, locale)}) — Admin can still edit`
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
            <Link href="/admin/examinations/results">
              <Button variant="outline" size="sm">
                {pick('ফলাফল প্যানেল', 'Open Results Panel')}
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Marks Spreadsheet */}
      {loadingSheet ? (
        <LoadingSkeleton rows={6} />
      ) : !activeExamSubject ? (
        <EmptyState
          title={pick('কোনো বিষয় কনফিগার করা নেই', 'No exam subjects configured')}
          description={pick('আগে পরীক্ষা ও বিষয় পেজ থেকে বিষয় যুক্ত করুন।', 'Add subjects in Exams & Subjects first.')}
        />
      ) : targetStudents.length === 0 ? (
        <EmptyState
          title={pick('কোনো শিক্ষার্থী পাওয়া যায়নি', 'No matching students')}
          description={pick('অনুসন্ধান বা শাখা ফিল্টার পরিবর্তন করুন।', 'Adjust your section filter or search query.')}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-muted/50 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <strong className="text-sm text-foreground">
                {locale === 'bn'
                  ? activeSubjectInfo?.nameBn || activeSubjectInfo?.name || gsSubject?.subjectName
                  : activeSubjectInfo?.name || gsSubject?.subjectName}
                {activeSubjectInfo?.officialCode ? ` (${activeSubjectInfo.officialCode})` : ''}
              </strong>
              <span className="text-muted-foreground">
                {pick('পূর্ণমান:', 'Full:')} <strong>{formatNumber(activeExamSubject.fullMarks, locale)}</strong> ·{' '}
                {pick('পাশ:', 'Pass:')} <strong>{formatNumber(activeExamSubject.passMarks, locale)}</strong>
              </span>
              {activeExamSubject.isOptional && (
                <span className="font-semibold text-primary">{pick('৪র্থ / ঐচ্ছিক বিষয়', '4th / Optional')}</span>
              )}
            </div>
            {activeExam && (
              <StatusBadge
                enumName="ResultPublicationStatus"
                value={activeExam.resultStatus as ResultPublicationStatus}
              />
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border text-sm font-semibold">
                <tr>
                  <th className="px-3 py-3 text-center w-16">{pick('রোল', 'Roll')}</th>
                  <th className="px-3 py-3 text-left min-w-[180px]">{pick('শিক্ষার্থী ও শাখা', 'Student')}</th>
                  <th className="px-2.5 py-3 text-center w-20">{pick('অনুপস্থিত', 'Absent')}</th>
                  {activeExamSubject.hasWritten && (
                    <th className="px-2.5 py-3 text-right w-28">
                      <div>{pick('লিখিত', 'Written')}</div>
                      <div className="text-xs font-medium text-primary">
                        {formatNumber(activeExamSubject.writtenFullMarks ?? 0, locale)} ({pick('পাশ', 'Pass')}{' '}
                        {formatNumber(activeExamSubject.writtenPassMarks ?? 0, locale)})
                      </div>
                    </th>
                  )}
                  {activeExamSubject.hasMcq && (
                    <th className="px-2.5 py-3 text-right w-28">
                      <div>MCQ</div>
                      <div className="text-xs font-medium text-primary">
                        {formatNumber(activeExamSubject.mcqFullMarks ?? 0, locale)} ({pick('পাশ', 'Pass')}{' '}
                        {formatNumber(activeExamSubject.mcqPassMarks ?? 0, locale)})
                      </div>
                    </th>
                  )}
                  {activeExamSubject.hasPractical && (
                    <th className="px-2.5 py-3 text-right w-28">
                      <div>{pick('ব্যবহারিক', 'Practical')}</div>
                      <div className="text-xs font-medium text-primary">
                        {formatNumber(activeExamSubject.practicalFullMarks ?? 0, locale)} ({pick('পাশ', 'Pass')}{' '}
                        {formatNumber(activeExamSubject.practicalPassMarks ?? 0, locale)})
                      </div>
                    </th>
                  )}
                  {activeExamSubject.hasContinuousAssessment && (
                    <th className="px-2.5 py-3 text-right w-28">
                      <div>{pick('ধারাবাহিক (CA)', 'CA')}</div>
                      <div className="text-xs font-medium text-primary">
                        {formatNumber(activeExamSubject.continuousAssessmentFullMarks ?? 0, locale)} ({pick('পাশ', 'Pass')}{' '}
                        {formatNumber(activeExamSubject.continuousAssessmentPassMarks ?? 0, locale)})
                      </div>
                    </th>
                  )}
                  <th className="px-3 py-3 text-right w-20">{pick('মোট', 'Total')}</th>
                  <th className="px-3 py-3 text-center w-32">{pick('গ্রেড', 'Grade')}</th>
                  <th className="px-3 py-3 text-center w-20">{pick('লক', 'Lock')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {targetStudents.map((stu) => {
                  const row = getRow(stu);
                  const isDirty = Boolean(drafts[stu.studentEnrollmentId]);
                  const rowLocked = Boolean(stu.mark?.isLocked);
                  const rowDisabled = isLocked || rowLocked;
                  const hasEntered =
                    Boolean(stu.mark) ||
                    row.isAbsent ||
                    row.written !== '' ||
                    row.mcq !== '' ||
                    row.practical !== '' ||
                    row.ca !== '';

                  const wNum = Number(row.written || 0);
                  const mNum = Number(row.mcq || 0);
                  const pNum = Number(row.practical || 0);
                  const cNum = Number(row.ca || 0);

                  const evalRes = evaluateExamSubjectMark(
                    {
                      writtenMarks: wNum,
                      mcqMarks: mNum,
                      practicalMarks: pNum,
                      continuousAssessmentMarks: cNum,
                      isAbsent: row.isAbsent,
                    },
                    activeExamSubject,
                    scaleRanges
                  );
                  const reasonText = hasEntered ? failReasonLabel(evalRes.failReason, locale) : null;

                  const updateField = (patch: Partial<DraftMarkRow>) => {
                    setDrafts((prev) => ({
                      ...prev,
                      [stu.studentEnrollmentId]: { ...row, ...patch },
                    }));
                  };

                  return (
                    <tr
                      key={stu.studentEnrollmentId}
                      className={`${isDirty ? 'bg-primary/5' : 'hover:bg-surface-muted/40'} transition-colors`}
                    >
                      <td className="px-3 py-2.5 text-center font-medium">
                        {formatNumber(stu.roll, locale)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-foreground">
                          {locale === 'bn' ? stu.nameBn || stu.name : stu.name}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {pick('শাখা', 'Sec')} {stu.section} ·{' '}
                          <span className="font-mono">{stu.studentId}</span>
                          {stu.mark?.enteredBy ? ` · ${stu.mark.enteredBy}` : ''}
                        </p>
                      </td>
                      <td className="px-2.5 py-2 text-center">
                        <input
                          type="checkbox"
                          disabled={rowDisabled}
                          checked={row.isAbsent}
                          onChange={(e) => updateField({ isAbsent: e.target.checked })}
                          className="w-4 h-4 accent-primary cursor-pointer"
                        />
                      </td>
                      {activeExamSubject.hasWritten && (
                        <td className="px-2.5 py-2 text-right">
                          <input
                            type="text"
                            inputMode="decimal"
                            disabled={rowDisabled || row.isAbsent}
                            value={row.isAbsent ? '' : row.written}
                            onChange={(e) => {
                              const max = activeExamSubject.writtenFullMarks ?? 100;
                              updateField({ written: sanitizeMarkInput(e.target.value, max) });
                            }}
                            className={`w-16 text-right px-2 py-1.5 border rounded font-medium text-foreground ${
                              row.isAbsent
                                ? 'border-border/60 bg-surface-muted/40 opacity-40'
                                : rowDisabled
                                  ? 'border-border/60 bg-surface-muted/30'
                                  : 'border-border bg-surface'
                            }`}
                          />
                        </td>
                      )}
                      {activeExamSubject.hasMcq && (
                        <td className="px-2.5 py-2 text-right">
                          <input
                            type="text"
                            inputMode="decimal"
                            disabled={rowDisabled || row.isAbsent}
                            value={row.isAbsent ? '' : row.mcq}
                            onChange={(e) => {
                              const max = activeExamSubject.mcqFullMarks ?? 50;
                              updateField({ mcq: sanitizeMarkInput(e.target.value, max) });
                            }}
                            className={`w-16 text-right px-2 py-1.5 border rounded font-medium text-foreground ${
                              row.isAbsent
                                ? 'border-border/60 bg-surface-muted/40 opacity-40'
                                : rowDisabled
                                  ? 'border-border/60 bg-surface-muted/30'
                                  : 'border-border bg-surface'
                            }`}
                          />
                        </td>
                      )}
                      {activeExamSubject.hasPractical && (
                        <td className="px-2.5 py-2 text-right">
                          <input
                            type="text"
                            inputMode="decimal"
                            disabled={rowDisabled || row.isAbsent}
                            value={row.isAbsent ? '' : row.practical}
                            onChange={(e) => {
                              const max = activeExamSubject.practicalFullMarks ?? 50;
                              updateField({ practical: sanitizeMarkInput(e.target.value, max) });
                            }}
                            className={`w-16 text-right px-2 py-1.5 border rounded font-medium text-foreground ${
                              row.isAbsent
                                ? 'border-border/60 bg-surface-muted/40 opacity-40'
                                : rowDisabled
                                  ? 'border-border/60 bg-surface-muted/30'
                                  : 'border-border bg-surface'
                            }`}
                          />
                        </td>
                      )}
                      {activeExamSubject.hasContinuousAssessment && (
                        <td className="px-2.5 py-2 text-right">
                          <input
                            type="text"
                            inputMode="decimal"
                            disabled={rowDisabled || row.isAbsent}
                            value={row.isAbsent ? '' : row.ca}
                            onChange={(e) => {
                              const max = activeExamSubject.continuousAssessmentFullMarks ?? 50;
                              updateField({ ca: sanitizeMarkInput(e.target.value, max) });
                            }}
                            className={`w-16 text-right px-2 py-1.5 border rounded font-medium text-foreground ${
                              row.isAbsent
                                ? 'border-border/60 bg-surface-muted/40 opacity-40'
                                : rowDisabled
                                  ? 'border-border/60 bg-surface-muted/30'
                                  : 'border-border bg-surface'
                            }`}
                          />
                        </td>
                      )}
                      <td className="px-3 py-2 text-right font-bold">
                        {!hasEntered
                          ? '—'
                          : row.isAbsent
                            ? '0'
                            : formatNumber(evalRes.totalMarks, locale)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {!hasEntered ? (
                          <span className="text-muted-foreground font-semibold">—</span>
                        ) : (
                          <>
                            <span
                              className={`font-semibold ${
                                !row.isAbsent && evalRes.isPassed
                                  ? 'text-success'
                                  : 'text-destructive'
                              }`}
                            >
                              {row.isAbsent
                                ? 'F (0.00)'
                                : `${evalRes.letterGrade} (${formatNumber(evalRes.gradePoint, locale, 2)})`}
                            </span>
                            {reasonText && (
                              <span className="block text-xs text-destructive font-medium">
                                {reasonText}
                              </span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {stu.mark?.id ? (
                          <button
                            type="button"
                            disabled={togglingLock || isLocked}
                            onClick={() => handleToggleStudentLock(stu)}
                            title={
                              rowLocked
                                ? pick('আনলক করুন', 'Unlock mark')
                                : pick('লক করুন', 'Lock mark')
                            }
                            className={`p-1.5 rounded border transition-colors cursor-pointer disabled:opacity-40 ${
                              rowLocked
                                ? 'border-amber-500/40 bg-amber-500/10 text-amber-600'
                                : 'border-border bg-surface hover:bg-surface-muted text-muted-foreground'
                            }`}
                          >
                            {rowLocked ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
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
