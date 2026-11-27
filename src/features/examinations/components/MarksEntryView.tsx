'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Pencil,
  Save,
  Search,
  Unlock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useBulkToggleMarkLockMutation,
  useGetExamsQuery,
  useGetExamSubjectsQuery,
  useGetGradeSheetQuery,
  useGetGradingScalesQuery,
  useSaveBulkMarksMutation,
  useToggleMarkLockMutation,
  useUpdateExamMutation,
  type GradeSheetStudentRow,
} from '@/src/features/examinations/api/examinations.api';
import { useGetSchoolClassesQuery } from '@/src/services/academic/class.api';
import { useGetSectionsQuery } from '@/src/services/academic/section.api';
import {
  ConfirmDialog,
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';
import {
  evaluateExamSubjectMark,
  formatDateShort,
  formatNumber,
  type ComponentFailReason,
} from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils/cn';
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
      return 'অনুপস্থিত';
    case 'WRITTEN_FAIL':
      return 'লিখিত ফেল';
    case 'MCQ_FAIL':
      return 'MCQ ফেল';
    case 'PRACTICAL_FAIL':
      return 'ব্যবহারিক ফেল';
    case 'CA_FAIL':
      return 'CA ফেল';
    case 'TOTAL_FAIL':
      return 'মোট ফেল';
    default:
      return null;
  }
}

export function MarksEntryView() {
  const searchParams = useSearchParams();
  const urlExamId = searchParams.get('examId') ?? '';
  const urlSubjectId = searchParams.get('subjectId') ?? '';

  const { data: examsRes, isLoading: loadingExams } = useGetExamsQuery({
    limit: 100,
    isDeleted: false,
  });
  const { data: allClasses = [] } = useGetSchoolClassesQuery();
  const { data: allSections = [] } = useGetSectionsQuery();
  const { data: scalesRes } = useGetGradingScalesQuery();
  const [saveBulkMarks, { isLoading: saving }] = useSaveBulkMarksMutation();
  const [updateExam, { isLoading: unlocking }] = useUpdateExamMutation();
  const [toggleMarkLock, { isLoading: togglingLock }] = useToggleMarkLockMutation();
  const [bulkToggleMarkLock, { isLoading: bulkLocking }] = useBulkToggleMarkLockMutation();

  const [selectedExamName, setSelectedExamName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(urlSubjectId);
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, DraftMarkRow>>({});
  const [pendingSwitch, setPendingSwitch] = useState<{
    type: 'examName' | 'class' | 'subject';
    value: string;
  } | null>(null);

  const activeClasses = useMemo(
    () =>
      [...allClasses]
        .filter((c) => c.isActive)
        .sort((a, b) => a.numericValue - b.numericValue),
    [allClasses]
  );

  const activeExams = useMemo(() => {
    const items = [...(examsRes?.items ?? [])];
    return items.sort(
      (a, b) =>
        (a.schoolClass?.numericValue ?? 99) - (b.schoolClass?.numericValue ?? 99)
    );
  }, [examsRes?.items]);

  const examNames = useMemo(
    () => Array.from(new Set(activeExams.map((e) => e.name))),
    [activeExams]
  );

  const urlExam = urlExamId ? activeExams.find((e) => e.id === urlExamId) : undefined;

  const resolvedExamName =
    selectedExamName && examNames.includes(selectedExamName)
      ? selectedExamName
      : urlExam?.name ?? examNames[0] ?? '';

  const resolvedClassId =
    selectedClassId && activeClasses.some((c) => c.id === selectedClassId)
      ? selectedClassId
      : urlExam?.classId ?? activeClasses[0]?.id ?? '';

  const activeExam =
    activeExams.find(
      (e) => e.name === resolvedExamName && e.classId === resolvedClassId
    ) ?? null;

  const resolvedExamId = activeExam?.id ?? '';

  const { data: examSubjects = [], isFetching: loadingSubjects } =
    useGetExamSubjectsQuery(resolvedExamId, { skip: !resolvedExamId });

  const resolvedSubjectId =
    selectedSubjectId && examSubjects.some((es) => es.id === selectedSubjectId)
      ? selectedSubjectId
      : examSubjects[0]?.id ?? '';

  const activeExamSubject =
    examSubjects.find((es) => es.id === resolvedSubjectId) ?? null;

  const classSections = useMemo(() => {
    if (!resolvedClassId) return [];
    return allSections.filter((s) => s.classId === resolvedClassId && s.isActive);
  }, [allSections, resolvedClassId]);

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
    const filtered = !q
      ? allStudents
      : allStudents.filter((s) => {
          const hay = `${s.nameBn ?? ''} ${s.name ?? ''} ${s.studentId ?? ''} ${s.roll}`.toLowerCase();
          return hay.includes(q);
        });
    return [...filtered].sort(
      (a, b) => a.roll - b.roll || a.section.localeCompare(b.section, 'bn')
    );
  }, [allStudents, search, 'bn']);

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

  const dirtyCount = Object.keys(drafts).length;
  const deadlineExpired = Boolean(
    activeExam?.marksEntryDeadline &&
      new Date(activeExam.marksEntryDeadline) < new Date()
  );
  const canLockMarks = Boolean(!activeExam?.marksEntryDeadline || deadlineExpired);
  const isLocked = Boolean(
    !activeExam ||
      activeExam.isLocked ||
      activeExam.resultStatus === ResultPublicationStatus.PUBLISHED
  );

  const requestSwitch = (type: 'examName' | 'class' | 'subject', value: string) => {
    if (dirtyCount > 0) {
      setPendingSwitch({ type, value });
      return;
    }
    if (type === 'examName') {
      setSelectedExamName(value);
      setSelectedSubjectId('');
    } else if (type === 'class') {
      setSelectedClassId(value);
      setSelectedSubjectId('');
      setSectionFilter('ALL');
    } else {
      setSelectedSubjectId(value);
    }
    setIsEditMode(false);
  };

  const confirmSwitch = () => {
    if (!pendingSwitch) return;
    setDrafts({});
    setIsEditMode(false);
    if (pendingSwitch.type === 'examName') {
      setSelectedExamName(pendingSwitch.value);
      setSelectedSubjectId('');
    } else if (pendingSwitch.type === 'class') {
      setSelectedClassId(pendingSwitch.value);
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
        'সংরক্ষণের জন্য অন্তত একজন শিক্ষার্থীর নম্বর পরিবর্তন বা এন্ট্রি করুন।'
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
          `রোল ${formatNumber(stu.roll, 'bn')}: ঋণাত্মক নম্বর গ্রহণযোগ্য নয়।`
        );
        return;
      }
      if (w > wMax || m > mMax || p > pMax || c > cMax) {
        toast.error(
          `রোল ${formatNumber(stu.roll, 'bn')}: কোনো উপাংশের নম্বর সর্বোচ্চ সীমা অতিক্রম করেছে।`
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
      setIsEditMode(false);
      toast.success(
        `${formatNumber(res.totalProcessed, 'bn')} জন শিক্ষার্থীর নম্বর সংরক্ষিত হয়েছে।`
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'নম্বর সংরক্ষণ ব্যর্থ হয়েছে।'));
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
        'পরীক্ষা আনলক এবং সময়সীমা ৭ দিন বাড়ানো হয়েছে। এখন নম্বর এন্ট্রি করতে পারবেন।'
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'আনলক করা যায়নি।'));
    }
  };

  const handleToggleStudentLock = async (stu: GradeSheetStudentRow) => {
    if (!stu.mark?.id) return;
    if (!stu.mark.isLocked && !canLockMarks) {
      toast.info(
        `নম্বর এন্ট্রির শেষ তারিখ (${formatDateShort(activeExam!.marksEntryDeadline!, 'bn')}) পার হওয়ার পর লক করা যাবে।`
      );
      return;
    }
    try {
      await toggleMarkLock({
        id: stu.mark.id,
        isLocked: !stu.mark.isLocked,
      }).unwrap();
      toast.success(
        !stu.mark.isLocked
          ? 'নম্বর লক করা হয়েছে।'
          : 'নম্বর আনলক করা হয়েছে।'
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'লক পরিবর্তন করা যায়নি।'));
    }
  };

  const handleBulkLock = async (lockState: boolean) => {
    if (!activeExamSubject) return;
    if (lockState && !canLockMarks) {
      toast.info(
        `নম্বর এন্ট্রির শেষ তারিখ (${formatDateShort(activeExam!.marksEntryDeadline!, 'bn')}) পার হওয়ার পর লক করা যাবে।`
      );
      return;
    }
    try {
      const res = await bulkToggleMarkLock({
        examSubjectId: activeExamSubject.id,
        ...(sectionFilter !== 'ALL' ? { sectionId: sectionFilter } : {}),
        isLocked: lockState,
      }).unwrap();
      toast.success(
        lockState
          ? `${formatNumber(res.updatedCount, 'bn')} জন শিক্ষার্থীর নম্বর লক করা হয়েছে।`
          : `${formatNumber(res.updatedCount, 'bn')} জন শিক্ষার্থীর নম্বর আনলক করা হয়েছে।`
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'বাল্ক লক পরিবর্তন করা যায়নি।'));
    }
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
  const showSubjectCode = (activeExam?.schoolClass?.numericValue ?? 0) >= 9;

  return (
    <div className="space-y-6">
      <PageHeader
        titleBn="নম্বর এন্ট্রি ও রিভিউ"
        titleEn="Marks Entry & Review"
        subtitleBn="শিক্ষকদের এন্ট্রি করা নম্বর যাচাই, আপডেট ও লক করুন।"
        subtitleEn="Review, update, and lock examination marks."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!isEditMode ? (
              <Button
                onClick={() => setIsEditMode(true)}
                disabled={isLocked || !activeExamSubject || targetStudents.length === 0}
                className="whitespace-nowrap shrink-0"
              >
                <Pencil className="w-4 h-4" />
                {'নম্বর আপডেট'}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditMode(false);
                    setDrafts({});
                  }}
                  disabled={saving}
                  className="whitespace-nowrap shrink-0"
                >
                  {'বাতিল'}
                </Button>
                <Button
                  onClick={handleSaveSheet}
                  disabled={isLocked || saving || !activeExamSubject || targetStudents.length === 0}
                  className="whitespace-nowrap shrink-0"
                >
                  <Save className="w-4 h-4" />
                  {dirtyCount > 0
                    ? `নম্বর সংরক্ষণ (${formatNumber(dirtyCount, 'bn')})`
                    : 'নম্বর সংরক্ষণ করুন'}
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-base font-bold text-foreground">
            {'মোট পরীক্ষার্থী ও বিষয়'}
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {formatNumber(kpis.total, 'bn')}{' '}
            <span className="text-sm font-medium text-muted-foreground">{'জন'}</span>
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground truncate">
            {activeExamSubject
              ? `${'পূর্ণমান'}: ${formatNumber(activeExamSubject.fullMarks, 'bn')}${
                  showSubjectCode && activeSubjectInfo?.officialCode
                    ? ` | ${activeSubjectInfo.officialCode}`
                    : ''
                }`
              : 'বিষয় নির্বাচিত হয়নি'}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-base font-bold text-foreground">
            {'এন্ট্রি অগ্রগতি'}
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
            {formatNumber(kpis.progressPct, 'bn')}%
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {`${formatNumber(kpis.enteredCount, 'bn')} / ${formatNumber(kpis.total, 'bn')} জনের নম্বর এন্ট্রি`}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-base font-bold text-foreground">
            {'উপস্থিতি ও অনুপস্থিতি'}
          </p>
          <p
            className={cn(
              'mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight',
              kpis.absentCount > 0 ? 'text-destructive' : 'text-foreground'
            )}
          >
            {formatNumber(kpis.absentCount, 'bn')}{' '}
            <span className="text-sm font-medium text-muted-foreground">
              {'অনুপস্থিত'}
            </span>
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {`উপস্থিত: ${formatNumber(kpis.total - kpis.absentCount, 'bn')} জন`}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-base font-bold text-foreground">
            {'প্রাথমিক মূল্যায়ন (পাস / ফেল)'}
          </p>
          <p
            className={cn(
              'mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight',
              kpis.failedCount > 0 ? 'text-warning' : 'text-success'
            )}
          >
            {formatNumber(kpis.passedCount, 'bn')}{' '}
            <span className="text-sm font-medium text-muted-foreground">{'পাস'}</span>
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground truncate">
            {kpis.failedCount > 0
              ? `${formatNumber(kpis.failedCount, 'bn')} জন অকৃতকার্য`
              : 'মূল্যায়নকৃত সবাই উত্তীর্ণ'}
          </p>
        </Card>
      </div>

      {/* Compact Selection Toolbar */}
      <Card className="p-4 flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-52">
          <label className="block text-sm text-muted-foreground mb-1">
            {'পরীক্ষা নির্বাচন করুন'}
          </label>
          <Select
            value={resolvedExamName}
            disabled={examNames.length === 0}
            onChange={(e) => requestSwitch('examName', e.target.value)}
            className="h-9 text-sm"
          >
            {examNames.length === 0 && (
              <option value="">{'কোনো পরীক্ষা নেই'}</option>
            )}
            {examNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full sm:w-36">
          <label className="block text-sm text-muted-foreground mb-1">
            {'শ্রেণি'}
          </label>
          <Select
            value={resolvedClassId}
            disabled={activeClasses.length === 0}
            onChange={(e) => requestSwitch('class', e.target.value)}
            className="h-9 text-sm"
          >
            {activeClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.nameBn || cls.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full sm:w-52">
          <label className="block text-sm text-muted-foreground mb-1">
            {'বিষয় নির্বাচন করুন'}
          </label>
          <Select
            value={resolvedSubjectId}
            disabled={loadingSubjects || examSubjects.length === 0}
            onChange={(e) => requestSwitch('subject', e.target.value)}
            className="h-9 text-sm"
          >
            {examSubjects.length === 0 && (
              <option value="">{'কোনো বিষয় নেই'}</option>
            )}
            {examSubjects.map((es) => {
              const subName = es.subject?.nameBn || es.subject?.name;
              const code =
                showSubjectCode && es.subject?.officialCode ? ` (${es.subject.officialCode})` : '';
              const grpName = es.group
                ? ` — ${es.group.nameBn || es.group.name}`
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

        <div className="w-full sm:w-32">
          <label className="block text-sm text-muted-foreground mb-1">
            {'শাখা'}
          </label>
          <Select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="h-9 text-sm"
          >
            <option value="ALL">{'সকল শাখা'}</option>
            {classSections.map((s) => (
              <option key={s.id} value={s.id}>
                {'শাখা'} {s.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full sm:w-44 relative sm:ml-auto">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={'রোল বা নাম...'}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </Card>

      {/* Lock / Deadline Notice Banner */}
      {(isLocked || deadlineExpired) && activeExam && (
        <div className="p-4 rounded-[var(--radius)] border border-warning/40 bg-warning/10 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">
                {activeExam.resultStatus === ResultPublicationStatus.PUBLISHED
                  ? 'ফলাফল ইতিমধ্যে প্রকাশিত হয়েছে (শুধুমাত্র দেখার মোড)'
                  : activeExam.isLocked
                    ? 'পরীক্ষাটি লক করা আছে (শুধুমাত্র দেখার মোড)'
                    : `শিক্ষকদের নম্বর এন্ট্রির সময়সীমা অতিক্রান্ত হয়েছে (${formatDateShort(activeExam.marksEntryDeadline!, 'bn')}) — অ্যাডমিন এন্ট্রি করতে পারবেন`}
              </p>
            </div>
          </div>
          {activeExam.resultStatus !== ResultPublicationStatus.PUBLISHED ? (
            <Button variant="outline" size="sm" onClick={handleQuickUnlock} disabled={unlocking}>
              <Unlock className="w-3.5 h-3.5" />
              {'আনলক ও ৭ দিন সময় বাড়ান'}
            </Button>
          ) : (
            <Link href="/admin/examinations/results">
              <Button variant="outline" size="sm">
                {'ফলাফল প্যানেল'}
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
          title={'কোনো বিষয় কনফিগার করা নেই'}
          description={'আগে পরীক্ষা ও বিষয় পেজ থেকে বিষয় যুক্ত করুন।'}
        />
      ) : targetStudents.length === 0 ? (
        <EmptyState
          title={'কোনো শিক্ষার্থী পাওয়া যায়নি'}
          description={'অনুসন্ধান বা শাখা ফিল্টার পরিবর্তন করুন।'}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-muted/50 flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <strong className="text-sm text-foreground">
                {activeSubjectInfo?.nameBn || activeSubjectInfo?.name || gsSubject?.subjectName}
                {showSubjectCode && activeSubjectInfo?.officialCode
                  ? ` (${activeSubjectInfo.officialCode})`
                  : ''}
              </strong>
              <span className="text-muted-foreground">
                {'পূর্ণমান:'} <strong>{formatNumber(activeExamSubject.fullMarks, 'bn')}</strong> ·{' '}
                {'পাশ:'} <strong>{formatNumber(activeExamSubject.passMarks, 'bn')}</strong>
              </span>
              {activeExamSubject.isOptional && (
                <span className="font-semibold text-primary">{'৪র্থ / ঐচ্ছিক বিষয়'}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {targetStudents.some((s) => s.mark?.id) && !isLocked && (
                <>
                  {targetStudents.some((s) => s.mark?.id && !s.mark.isLocked) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={bulkLocking || !canLockMarks}
                      onClick={() => handleBulkLock(true)}
                      title={
                        !canLockMarks && activeExam?.marksEntryDeadline
                          ? `শেষ তারিখ (${formatDateShort(activeExam.marksEntryDeadline, 'bn')}) পার হলে লক করা যাবে`
                          : 'সব নম্বর লক করুন'
                      }
                      className="h-7 px-2.5 text-sm"
                    >
                      <Lock className="w-3 h-3 mr-1" />
                      {'সব লক করুন'}
                    </Button>
                  )}
                  {targetStudents.some((s) => s.mark?.isLocked) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={bulkLocking}
                      onClick={() => handleBulkLock(false)}
                      className="h-7 px-2.5 text-sm"
                    >
                      <Unlock className="w-3 h-3 mr-1" />
                      {'সব আনলক করুন'}
                    </Button>
                  )}
                </>
              )}
              {activeExam && (
                <StatusBadge
                  enumName="ResultPublicationStatus"
                  value={activeExam.resultStatus as ResultPublicationStatus}
                />
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-base">
              <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border text-sm font-semibold">
                <tr>
                  <th className="px-3 py-3 text-center w-16">{'রোল'}</th>
                  <th className="px-3 py-3 text-left min-w-[170px]">{'শিক্ষার্থীর নাম'}</th>
                  <th className="px-3 py-3 text-center w-20">{'শাখা'}</th>
                  <th className="px-3 py-3 text-left min-w-[140px]">{'নম্বর প্রদানকারী'}</th>
                  <th className="px-2.5 py-3 text-center w-20">{'অনুপস্থিত'}</th>
                  {activeExamSubject.hasWritten && (
                    <th className="px-2.5 py-3 text-right w-28">
                      <div>{'লিখিত'}</div>
                      <div className="text-sm font-medium text-primary">
                        {formatNumber(activeExamSubject.writtenFullMarks ?? 0, 'bn')} ({'পাশ'}{' '}
                        {formatNumber(activeExamSubject.writtenPassMarks ?? 0, 'bn')})
                      </div>
                    </th>
                  )}
                  {activeExamSubject.hasMcq && (
                    <th className="px-2.5 py-3 text-right w-28">
                      <div>MCQ</div>
                      <div className="text-sm font-medium text-primary">
                        {formatNumber(activeExamSubject.mcqFullMarks ?? 0, 'bn')} ({'পাশ'}{' '}
                        {formatNumber(activeExamSubject.mcqPassMarks ?? 0, 'bn')})
                      </div>
                    </th>
                  )}
                  {activeExamSubject.hasPractical && (
                    <th className="px-2.5 py-3 text-right w-28">
                      <div>{'ব্যবহারিক'}</div>
                      <div className="text-sm font-medium text-primary">
                        {formatNumber(activeExamSubject.practicalFullMarks ?? 0, 'bn')} ({'পাশ'}{' '}
                        {formatNumber(activeExamSubject.practicalPassMarks ?? 0, 'bn')})
                      </div>
                    </th>
                  )}
                  {activeExamSubject.hasContinuousAssessment && (
                    <th className="px-2.5 py-3 text-right w-28">
                      <div>{'ধারাবাহিক (CA)'}</div>
                      <div className="text-sm font-medium text-primary">
                        {formatNumber(activeExamSubject.continuousAssessmentFullMarks ?? 0, 'bn')} ({'পাশ'}{' '}
                        {formatNumber(activeExamSubject.continuousAssessmentPassMarks ?? 0, 'bn')})
                      </div>
                    </th>
                  )}
                  <th className="px-3 py-3 text-right w-20">{'মোট'}</th>
                  <th className="px-3 py-3 text-center w-32">{'গ্রেড'}</th>
                  <th className="px-3 py-3 text-center w-20">{'লক'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {targetStudents.map((stu) => {
                  const row = getRow(stu);
                  const isDirty = Boolean(drafts[stu.studentEnrollmentId]);
                  const rowLocked = Boolean(stu.mark?.isLocked);
                  const rowDisabled = !isEditMode || isLocked || rowLocked;
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
                  const reasonText = hasEntered ? failReasonLabel(evalRes.failReason, 'bn') : null;

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
                      <td className="px-3 py-2.5 text-center font-semibold">
                        {formatNumber(stu.roll, 'bn')}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-foreground">
                        {stu.nameBn || stu.name}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-muted text-foreground border border-border">
                          {stu.section}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-left text-sm text-muted-foreground">
                        {stu.mark?.enteredBy ? (
                          <span className="font-medium text-foreground">{stu.mark.enteredBy}</span>
                        ) : (
                          '—'
                        )}
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
                          <input placeholder="তথ্য লিখুন"
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
                          <input placeholder="তথ্য লিখুন"
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
                          <input placeholder="তথ্য লিখুন"
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
                          <input placeholder="তথ্য লিখুন"
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
                            : formatNumber(evalRes.totalMarks, 'bn')}
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
                                : `${evalRes.letterGrade} (${formatNumber(evalRes.gradePoint, 'bn', 2)})`}
                            </span>
                            {reasonText && (
                              <span className="block text-sm text-destructive font-medium">
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
                            disabled={togglingLock || isLocked || (!rowLocked && !canLockMarks)}
                            onClick={() => handleToggleStudentLock(stu)}
                            title={
                              !rowLocked && !canLockMarks && activeExam?.marksEntryDeadline
                                ? `শেষ তারিখ (${formatDateShort(activeExam.marksEntryDeadline, 'bn')}) পার হলে লক করা যাবে`
                                : rowLocked
                                  ? 'আনলক করুন'
                                  : 'লক করুন'
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
                          <span className="text-sm text-muted-foreground">—</span>
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

      <ConfirmDialog
        open={Boolean(pendingSwitch)}
        onClose={() => setPendingSwitch(null)}
        onConfirm={confirmSwitch}
        title={'অসংরক্ষিত পরিবর্তন রয়েছে'}
        description={`আপনার ${formatNumber(dirtyCount, 'bn')} জন শিক্ষার্থীর নম্বর এখনো সংরক্ষণ করা হয়নি। এগিয়ে গেলে পরিবর্তনগুলো হারিয়ে যাবে।`}
        confirmLabel={'পরিবর্তন বাদ দিয়ে এগিয়ে যান'}
        destructive
      />
    </div>
  );
}
