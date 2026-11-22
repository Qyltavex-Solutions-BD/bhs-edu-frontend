'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Edit3,
  FileSpreadsheet,
  Lock,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateExamMutation,
  useDeleteExamSubjectMutation,
  useGetBootstrapQuery,
  useToggleArchiveMutation,
  useUpdateExamMutation,
  useUpsertExamSubjectMutation,
} from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import {
  ConfirmDialog,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { DataTable } from '@/src/components/shared/DataTable';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { getEnumMeta } from '@/src/lib/constants/enums';
import { ExamStatus, ExamType, ResultPublicationStatus } from '@/src/types/enums';
import type { Exam, ExamSubject } from '@/src/types/entities';
import { buildExamCompleteness } from './ExamShared';

// ============================================================================
// 1. Examinations Directory View (/admin/examinations & /admin/examinations/create)
// ============================================================================

export function ExamsDirectoryView({ openCreateOnMount = false }: { openCreateOnMount?: boolean }) {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [createExam, { isLoading: creating }] = useCreateExamMutation();
  const [updateExam, { isLoading: updating }] = useUpdateExamMutation();
  const [toggleArchive] = useToggleArchiveMutation();

  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showArchived, setShowArchived] = useState(false);

  const [createOpen, setCreateOpen] = useState(openCreateOnMount);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const [form, setForm] = useState({
    name: '',
    classId: 'cls-10',
    academicYearId: 'ay-2026',
    examType: ExamType.MODEL_TEST as ExamType,
    gradingScaleId: 'gs-nctb-5',
    startDate: '2026-12-01',
    endDate: '2026-12-10',
    marksEntryDeadline: '2026-12-18',
    status: ExamStatus.UPCOMING as ExamStatus,
    allowCombinedPass: true,
  });

  const filteredExams = useMemo(() => {
    if (!db) return [];
    return db.exams.filter((e) => {
      if (!showArchived && e.isDeleted) return false;
      if (classFilter !== 'ALL' && e.classId !== classFilter) return false;
      if (statusFilter !== 'ALL' && e.resultStatus !== statusFilter) return false;
      return true;
    });
  }, [db, classFilter, statusFilter, showArchived]);

  if (isLoading || !db) return <LoadingSkeleton rows={6} />;

  const activeExams = db.exams.filter((e) => !e.isDeleted);
  const publishedCount = activeExams.filter((e) => e.resultStatus === ResultPublicationStatus.PUBLISHED).length;
  const draftCount = activeExams.filter((e) => e.resultStatus === ResultPublicationStatus.DRAFT).length;
  const archivedCount = db.exams.filter((e) => e.isDeleted).length;

  const openCreateModal = () => {
    const activeYear = db.academicYears.find((y) => y.isActive) ?? db.academicYears[0];
    const defaultScale = db.gradingScales.find((g) => g.isDefault && !g.isDeleted) ?? db.gradingScales[0];
    setEditingExam(null);
    setForm({
      name: '',
      classId: db.classes[db.classes.length - 1]?.id ?? 'cls-10',
      academicYearId: activeYear?.id ?? 'ay-2026',
      examType: ExamType.HALF_YEARLY,
      gradingScaleId: defaultScale?.id ?? 'gs-nctb-5',
      startDate: '2026-12-01',
      endDate: '2026-12-12',
      marksEntryDeadline: '2026-12-20',
      status: ExamStatus.UPCOMING,
      allowCombinedPass: true,
    });
    setCreateOpen(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setForm({
      name: exam.name,
      classId: exam.classId,
      academicYearId: exam.academicYearId,
      examType: exam.examType,
      gradingScaleId: exam.gradingScaleId,
      startDate: exam.startDate.slice(0, 10),
      endDate: exam.endDate.slice(0, 10),
      marksEntryDeadline: exam.marksEntryDeadline ? exam.marksEntryDeadline.slice(0, 10) : '',
      status: exam.status,
      allowCombinedPass: exam.allowCombinedPass,
    });
    setCreateOpen(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(pick('পরীক্ষার নাম লিখুন।', 'Please enter an examination name.'));
      return;
    }
    if (form.endDate < form.startDate) {
      toast.error(pick('শেষের তারিখ শুরুর তারিখের আগে হতে পারে না।', 'End date cannot be earlier than start date.'));
      return;
    }
    const deadlineIso = form.marksEntryDeadline
      ? `${form.marksEntryDeadline}T23:59:00.000Z`
      : null;

    if (editingExam) {
      const res = await updateExam({
        id: editingExam.id,
        name: form.name.trim(),
        examType: form.examType,
        gradingScaleId: form.gradingScaleId,
        startDate: form.startDate,
        endDate: form.endDate,
        marksEntryDeadline: deadlineIso,
        status: form.status,
        allowCombinedPass: form.allowCombinedPass,
      });
      if ('error' in res) {
        toast.error(pick('পরীক্ষা আপডেট ব্যর্থ হয়েছে।', 'Failed to update exam.'));
        return;
      }
      toast.success(pick('পরীক্ষার তথ্য হালনাগাদ হয়েছে।', 'Examination updated successfully.'));
    } else {
      const res = await createExam({
        name: form.name.trim(),
        classId: form.classId,
        academicYearId: form.academicYearId,
        examType: form.examType,
        gradingScaleId: form.gradingScaleId,
        startDate: form.startDate,
        endDate: form.endDate,
        marksEntryDeadline: deadlineIso,
        allowCombinedPass: form.allowCombinedPass,
      });
      if ('error' in res) {
        toast.error(pick('পরীক্ষা তৈরি ব্যর্থ হয়েছে।', 'Failed to create exam.'));
        return;
      }
      toast.success(
        pick(
          'নতুন পরীক্ষা তৈরি হয়েছে এবং শ্রেণির এনসিটিবি বিষয়সমূহ স্বয়ংক্রিয়ভাবে যুক্ত হয়েছে।',
          'Exam created and class NCTB subjects attached automatically.'
        )
      );
    }
    setCreateOpen(false);
  };

  const handleArchiveToggle = async (exam: Exam) => {
    await toggleArchive({ collection: 'exams', id: exam.id });
    toast.success(
      exam.isDeleted
        ? pick('পরীক্ষাটি পুনরুদ্ধার করা হয়েছে।', 'Exam restored from archive.')
        : pick('পরীক্ষাটি আর্কাইভ করা হয়েছে।', 'Exam moved to archive.')
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        titleBn="পরীক্ষা তালিকা ও বিষয় কনফিগারেশন"
        titleEn="Examinations & Subject Configuration"
        subtitleBn="ষষ্ঠ থেকে দশম শ্রেণির পরীক্ষা তৈরি, সময়সীমা ব্যবস্থাপনা এবং প্রতিটি পরীক্ষার বিষয়ভিত্তিক পূর্ণমান ও পাশ নম্বর কনফিগার করুন।"
        subtitleEn="Create and manage Class 6–10 examinations, marks-entry deadlines, and per-exam subject marking schemes."
        actions={
          <Button onClick={openCreateModal} className="whitespace-nowrap shrink-0">
            <Plus className="w-4 h-4" />
            {pick('নতুন পরীক্ষা তৈরি করুন', 'Create New Exam')}
          </Button>
        }
      />

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={pick('সক্রিয় পরীক্ষা', 'Active Exams')}
          value={formatNumber(activeExams.length, locale)}
          icon={<FileSpreadsheet className="w-5 h-5" />}
        />
        <StatCard
          label={pick('প্রকাশিত ফলাফল', 'Published Results')}
          value={formatNumber(publishedCount, locale)}
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <StatCard
          label={pick('চলমান / খসড়া', 'Ongoing / Draft')}
          value={formatNumber(draftCount, locale)}
          icon={<CalendarClock className="w-5 h-5" />}
        />
        <StatCard
          label={pick('আর্কাইভকৃত', 'Archived')}
          value={formatNumber(archivedCount, locale)}
          icon={<Archive className="w-5 h-5" />}
        />
      </div>

      {/* Responsive Examinations DataTable (Desktop Table + Mobile Cards, matching portal standard) */}
      <DataTable
        data={filteredExams.map((exam) => {
          const cls = db.classes.find((c) => c.id === exam.classId);
          const year = db.academicYears.find((y) => y.id === exam.academicYearId);
          const typeMeta = getEnumMeta('ExamType', exam.examType);
          const subjectCount = db.examSubjects.filter((es) => es.examId === exam.id).length;
          const comp = buildExamCompleteness(db, exam);
          const deadlineExpired =
            Boolean(exam.marksEntryDeadline) &&
            new Date(exam.marksEntryDeadline!) < new Date() &&
            exam.resultStatus === ResultPublicationStatus.DRAFT;

          return {
            exam,
            id: exam.id,
            name: exam.name,
            classLabel: locale === 'bn' ? cls?.nameBn || cls?.name || '—' : cls?.name || '—',
            yearLabel: formatNumber(year?.name ?? '2026', locale),
            typeLabel: locale === 'bn' ? typeMeta.bn : typeMeta.en,
            startDate: exam.startDate,
            endDate: exam.endDate,
            subjectCount,
            progressPct: comp.overallPct,
            deadlineExpired,
            resultStatus: exam.resultStatus,
            statusLabel:
              locale === 'bn'
                ? getEnumMeta('ExamStatus', exam.status).bn
                : getEnumMeta('ExamStatus', exam.status).en,
          };
        })}
        searchPlaceholder={pick('পরীক্ষার নাম, শ্রেণি বা ধরন খুঁজুন...', 'Search exam name, class, or type...')}
        exportFilename="examinations-directory.csv"
        emptyTitle={pick('কোনো পরীক্ষা পাওয়া যায়নি', 'No examinations found')}
        emptyAction={
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            {pick('নতুন পরীক্ষা তৈরি করুন', 'Create Exam')}
          </Button>
        }
        toolbarExtra={
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-36 sm:w-40">
              <Select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                aria-label={pick('শ্রেণি ফিল্টার', 'Filter by class')}
              >
                <option value="ALL">{pick('সকল শ্রেণি', 'All Classes')}</option>
                {db.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {locale === 'bn' ? c.nameBn : c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-36 sm:w-44">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label={pick('ফলাফলের অবস্থা ফিল্টার', 'Filter by result status')}
              >
                <option value="ALL">{pick('সকল অবস্থা', 'All Status')}</option>
                {Object.values(ResultPublicationStatus).map((st) => {
                  const meta = getEnumMeta('ResultPublicationStatus', st);
                  return (
                    <option key={st} value={st}>
                      {locale === 'bn' ? meta.bn : meta.en}
                    </option>
                  );
                })}
              </Select>
            </div>
            <label className="inline-flex items-center gap-1.5 px-2.5 h-10 rounded-[var(--radius)] border border-border bg-surface text-xs sm:text-sm text-muted-foreground cursor-pointer select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-border accent-primary"
              />
              {pick('আর্কাইভ', 'Archived')}
            </label>
          </div>
        }
        columns={[
          {
            accessorKey: 'name',
            header: pick('পরীক্ষার নাম ও ধরন', 'Examination'),
            cell: ({ row }) => {
              const { exam, typeLabel } = row.original;
              return (
                <div className={`min-w-[180px] ${exam.isDeleted ? 'opacity-60' : ''}`}>
                  <div className="font-semibold text-foreground flex items-center gap-1.5 leading-snug">
                    <span>{exam.name}</span>
                    {exam.isLocked && (
                      <Lock
                        className="w-3.5 h-3.5 text-muted-foreground shrink-0"
                        aria-label={pick('লক করা', 'Locked')}
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {typeLabel}
                    {exam.allowCombinedPass
                      ? ` · ${pick('যৌথ পাশ', 'Combined Pass')}`
                      : ''}
                  </p>
                </div>
              );
            },
          },
          {
            accessorKey: 'classLabel',
            header: pick('শ্রেণি', 'Class'),
            cell: ({ row }) => (
              <div className="whitespace-nowrap tabular-nums">
                <div className="font-medium text-foreground">{row.original.classLabel}</div>
                <div className="text-xs text-muted-foreground">{row.original.yearLabel}</div>
              </div>
            ),
          },
          {
            accessorKey: 'startDate',
            header: pick('সময়সূচি', 'Schedule'),
            cell: ({ row }) => {
              const { exam, deadlineExpired } = row.original;
              return (
                <div className="whitespace-nowrap text-xs tabular-nums">
                  <div className="text-foreground font-medium">
                    {formatDateShort(exam.startDate, locale)} – {formatDateShort(exam.endDate, locale)}
                  </div>
                  {exam.marksEntryDeadline && (
                    <div className={`mt-0.5 ${deadlineExpired ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                      {pick('শেষ তারিখ:', 'Due:')} {formatDateShort(exam.marksEntryDeadline, locale)}
                    </div>
                  )}
                </div>
              );
            },
          },
          {
            accessorKey: 'progressPct',
            header: pick('অগ্রগতি', 'Progress'),
            cell: ({ row }) => (
              <div className="min-w-[100px] tabular-nums">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-foreground">
                    {formatNumber(row.original.subjectCount, locale)} {pick('বিষয়', 'Sub.')}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    {formatNumber(row.original.progressPct, locale)}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-muted overflow-hidden mt-1.5">
                  <div
                    className={`h-full rounded-full transition-all ${
                      row.original.progressPct >= 100
                        ? 'bg-success'
                        : row.original.progressPct > 0
                          ? 'bg-primary'
                          : 'bg-border'
                    }`}
                    style={{ width: `${Math.min(100, row.original.progressPct)}%` }}
                  />
                </div>
              </div>
            ),
          },
          {
            accessorKey: 'resultStatus',
            header: pick('অবস্থা', 'Status'),
            cell: ({ row }) => (
              <div className="flex flex-col items-start gap-1">
                <StatusBadge enumName="ResultPublicationStatus" value={row.original.resultStatus} />
                <span className="text-[11px] text-muted-foreground">{row.original.statusLabel}</span>
              </div>
            ),
          },
          {
            id: 'actions',
            header: pick('ব্যবস্থাপনা', 'Actions'),
            enableSorting: false,
            cell: ({ row }) => {
              const { exam } = row.original;
              return (
                <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                  <Link
                    href={`/admin/examinations/${exam.id}`}
                    className="inline-flex h-8 px-2.5 items-center gap-1.5 rounded-md border border-border bg-surface text-xs font-medium text-foreground hover:bg-surface-muted transition-colors"
                    title={pick('বিষয় ও নম্বর বণ্টন কনফিগার', 'Configure Subjects & Marks')}
                  >
                    <Settings2 className="w-3.5 h-3.5 text-primary" />
                    <span>{pick('বিষয়', 'Subjects')}</span>
                  </Link>
                  <Link
                    href={`/admin/examinations/marks-entry?examId=${exam.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title={pick('নম্বর এন্ট্রি', 'Marks Entry')}
                    aria-label={pick('নম্বর এন্ট্রি', 'Marks Entry')}
                  >
                    <ClipboardList className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => openEditModal(exam)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
                    title={pick('সম্পাদনা করুন', 'Edit Exam')}
                    aria-label={pick('সম্পাদনা করুন', 'Edit Exam')}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchiveToggle(exam)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
                    title={
                      exam.isDeleted
                        ? pick('পুনরুদ্ধার করুন', 'Restore')
                        : pick('আর্কাইভ করুন', 'Archive')
                    }
                    aria-label={
                      exam.isDeleted
                        ? pick('পুনরুদ্ধার করুন', 'Restore')
                        : pick('আর্কাইভ করুন', 'Archive')
                    }
                  >
                    {exam.isDeleted ? (
                      <RotateCcw className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Archive className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            },
          },
        ]}
        renderMobileCard={(row) => {
          const { exam, classLabel, yearLabel, typeLabel, subjectCount, progressPct, deadlineExpired, statusLabel } = row;
          return (
            <div className={`space-y-3 ${exam.isDeleted ? 'opacity-65' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="truncate">{exam.name}</span>
                    {exam.isLocked && <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {classLabel} · {yearLabel} · {typeLabel}
                  </p>
                </div>
                <StatusBadge enumName="ResultPublicationStatus" value={exam.resultStatus} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs tabular-nums bg-surface-muted/50 rounded-md p-2.5">
                <div>
                  <span className="text-muted-foreground block">{pick('সময়সূচি', 'Dates')}</span>
                  <span className="font-medium text-foreground">
                    {formatDateShort(exam.startDate, locale)} – {formatDateShort(exam.endDate, locale)}
                  </span>
                  {exam.marksEntryDeadline && (
                    <span className={`block mt-0.5 ${deadlineExpired ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                      {pick('ডেডলাইন:', 'Due:')} {formatDateShort(exam.marksEntryDeadline, locale)}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground block">
                    {pick('বিষয় ও নম্বর অগ্রগতি', 'Subjects & Progress')}
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatNumber(subjectCount, locale)} {pick('বিষয়', 'Sub.')} · {formatNumber(progressPct, locale)}%
                  </span>
                  <span className="block text-muted-foreground mt-0.5">{statusLabel}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <Link href={`/admin/examinations/${exam.id}`}>
                    <Button variant="outline" size="sm">
                      <Settings2 className="w-3.5 h-3.5" />
                      {pick('বিষয় ও মান', 'Subjects')}
                    </Button>
                  </Link>
                  <Link href={`/admin/examinations/marks-entry?examId=${exam.id}`}>
                    <Button variant="ghost" size="sm">
                      <ClipboardList className="w-3.5 h-3.5" />
                      {pick('নম্বর', 'Marks')}
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(exam)}
                    aria-label={pick('সম্পাদনা করুন', 'Edit Exam')}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchiveToggle(exam)}
                    aria-label={exam.isDeleted ? pick('পুনরুদ্ধার', 'Restore') : pick('আর্কাইভ', 'Archive')}
                  >
                    {exam.isDeleted ? (
                      <RotateCcw className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Archive className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        }}
      />

      {/* Create / Edit Exam Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={
          editingExam
            ? pick('পরীক্ষার তথ্য সম্পাদনা করুন', 'Edit Examination Settings')
            : pick('নতুন পরীক্ষা তৈরি করুন', 'Create New Examination')
        }
        size="lg"
      >
        <form onSubmit={handleSaveExam} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">
                {pick('পরীক্ষার নাম *', 'Examination Name *')}
              </label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={pick('যেমন: অর্ধবার্ষিক পরীক্ষা ২০২৬ (৮ম শ্রেণি)', 'e.g. Half-Yearly Exam 2026 (Class 8)')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {pick('পরীক্ষার ধরন *', 'Exam Type *')}
              </label>
              <Select
                value={form.examType}
                onChange={(e) => setForm({ ...form, examType: e.target.value as ExamType })}
              >
                {Object.values(ExamType).map((t) => {
                  const meta = getEnumMeta('ExamType', t);
                  return (
                    <option key={t} value={t}>
                      {locale === 'bn' ? meta.bn : meta.en}
                    </option>
                  );
                })}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {pick('গ্রেডিং স্কেল *', 'Grading Scale *')}
              </label>
              <Select
                value={form.gradingScaleId}
                onChange={(e) => setForm({ ...form, gradingScaleId: e.target.value })}
              >
                {db.gradingScales
                  .filter((g) => !g.isDeleted)
                  .map((gs) => (
                    <option key={gs.id} value={gs.id}>
                      {gs.name}
                    </option>
                  ))}
              </Select>
            </div>

            {!editingExam && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {pick('শ্রেণি *', 'Class *')}
                  </label>
                  <Select
                    value={form.classId}
                    onChange={(e) => setForm({ ...form, classId: e.target.value })}
                  >
                    {db.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {locale === 'bn' ? c.nameBn : c.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {pick('শিক্ষাবর্ষ *', 'Academic Year *')}
                  </label>
                  <Select
                    value={form.academicYearId}
                    onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}
                  >
                    {db.academicYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {formatNumber(y.name, locale)}
                      </option>
                    ))}
                  </Select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                {pick('শুরুর তারিখ *', 'Start Date *')}
              </label>
              <Input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {pick('শেষের তারিখ *', 'End Date *')}
              </label>
              <Input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {pick('নম্বর এন্ট্রির শেষ তারিখ', 'Marks Entry Deadline')}
              </label>
              <Input
                type="date"
                value={form.marksEntryDeadline}
                onChange={(e) => setForm({ ...form, marksEntryDeadline: e.target.value })}
              />
            </div>

            {editingExam && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {pick('পরীক্ষার অবস্থা', 'Exam Status')}
                </label>
                <Select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ExamStatus })}
                >
                  {Object.values(ExamStatus).map((st) => {
                    const meta = getEnumMeta('ExamStatus', st);
                    return (
                      <option key={st} value={st}>
                        {locale === 'bn' ? meta.bn : meta.en}
                      </option>
                    );
                  })}
                </Select>
              </div>
            )}

            <div className="sm:col-span-2 pt-1">
              <label className="flex items-start gap-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowCombinedPass}
                  onChange={(e) => setForm({ ...form, allowCombinedPass: e.target.checked })}
                  className="mt-1 rounded border-border"
                />
                <span>
                  <strong className="text-foreground">
                    {pick('এনসিটিবি যৌথ পত্র পাশ নীতি (Combined Pass)', 'NCTB Combined Paper Pass Policy')}
                  </strong>
                  <span className="block text-xs text-muted-foreground">
                    {pick(
                      'বাংলা ১ম/২য় ও ইংরেজি ১ম/২য় পত্রের মতো জোড়া বিষয়ে বোর্ডের যৌথ পাশ নীতি প্রয়োগ হবে।',
                      'Apply Education Board paired-paper combined pass rules where applicable.'
                    )}
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button type="submit" disabled={creating || updating}>
              {editingExam ? pick('পরিবর্তন সংরক্ষণ করুন', 'Save Changes') : pick('পরীক্ষা তৈরি করুন', 'Create Exam')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ============================================================================
// 2. Per-Exam Subject & Marks Distribution Config (/admin/examinations/[id] & /subjects)
// ============================================================================

export function ExamSubjectsConfigView({ initialExamId }: { initialExamId?: string }) {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [upsertSubject, { isLoading: saving }] = useUpsertExamSubjectMutation();
  const [deleteSubject] = useDeleteExamSubjectMutation();

  const [selectedExamId, setSelectedExamId] = useState(initialExamId ?? '');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEs, setEditingEs] = useState<ExamSubject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamSubject | null>(null);

  const [form, setForm] = useState({
    subjectId: '',
    groupId: '',
    fullMarks: 100,
    passMarks: 33,
    hasWritten: true,
    writtenFullMarks: 70,
    writtenPassMarks: 23,
    hasMcq: true,
    mcqFullMarks: 30,
    mcqPassMarks: 10,
    hasPractical: false,
    practicalFullMarks: 0,
    practicalPassMarks: 0,
    hasContinuousAssessment: false,
    continuousAssessmentFullMarks: 0,
    continuousAssessmentPassMarks: 0,
    isOptional: false,
  });

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

  if (isLoading || !db) return <LoadingSkeleton rows={6} />;

  const activeClass = activeExam ? db.classes.find((c) => c.id === activeExam.classId) : null;
  const isClassNineTen = (activeClass?.numericValue ?? 0) >= 9;

  const componentSum =
    (form.hasWritten ? Number(form.writtenFullMarks) || 0 : 0) +
    (form.hasMcq ? Number(form.mcqFullMarks) || 0 : 0) +
    (form.hasPractical ? Number(form.practicalFullMarks) || 0 : 0) +
    (form.hasContinuousAssessment ? Number(form.continuousAssessmentFullMarks) || 0 : 0);

  const openAddModal = () => {
    const usedIds = new Set(examSubjects.map((es) => es.subjectId));
    const nextSubject = db.subjects.find((s) => !usedIds.has(s.id)) ?? db.subjects[0];
    setEditingEs(null);
    setForm({
      subjectId: nextSubject?.id ?? '',
      groupId: '',
      fullMarks: 100,
      passMarks: 33,
      hasWritten: true,
      writtenFullMarks: 70,
      writtenPassMarks: 23,
      hasMcq: true,
      mcqFullMarks: 30,
      mcqPassMarks: 10,
      hasPractical: false,
      practicalFullMarks: 0,
      practicalPassMarks: 0,
      hasContinuousAssessment: false,
      continuousAssessmentFullMarks: 0,
      continuousAssessmentPassMarks: 0,
      isOptional: false,
    });
    setModalOpen(true);
  };

  const openEditModal = (es: ExamSubject) => {
    setEditingEs(es);
    setForm({
      subjectId: es.subjectId,
      groupId: es.groupId ?? '',
      fullMarks: es.fullMarks,
      passMarks: es.passMarks,
      hasWritten: es.hasWritten,
      writtenFullMarks: es.writtenFullMarks ?? 0,
      writtenPassMarks: es.writtenPassMarks ?? 0,
      hasMcq: es.hasMcq,
      mcqFullMarks: es.mcqFullMarks ?? 0,
      mcqPassMarks: es.mcqPassMarks ?? 0,
      hasPractical: es.hasPractical,
      practicalFullMarks: es.practicalFullMarks ?? 0,
      practicalPassMarks: es.practicalPassMarks ?? 0,
      hasContinuousAssessment: es.hasContinuousAssessment,
      continuousAssessmentFullMarks: es.continuousAssessmentFullMarks ?? 0,
      continuousAssessmentPassMarks: es.continuousAssessmentPassMarks ?? 0,
      isOptional: es.isOptional,
    });
    setModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExam) return;
    if (componentSum !== Number(form.fullMarks)) {
      toast.error(
        pick(
          `উপাংশগুলোর যোগফল (${componentSum}) এবং মোট পূর্ণমান (${form.fullMarks}) সমান হতে হবে।`,
          `Sum of components (${componentSum}) must equal Full Marks (${form.fullMarks}).`
        )
      );
      return;
    }

    const res = await upsertSubject({
      id: editingEs?.id,
      examId: activeExam.id,
      subjectId: form.subjectId,
      groupId: isClassNineTen && form.groupId ? form.groupId : null,
      fullMarks: Number(form.fullMarks),
      passMarks: Number(form.passMarks),
      hasWritten: form.hasWritten,
      writtenFullMarks: form.hasWritten ? Number(form.writtenFullMarks) : 0,
      writtenPassMarks: form.hasWritten ? Number(form.writtenPassMarks) : 0,
      hasMcq: form.hasMcq,
      mcqFullMarks: form.hasMcq ? Number(form.mcqFullMarks) : 0,
      mcqPassMarks: form.hasMcq ? Number(form.mcqPassMarks) : 0,
      hasPractical: form.hasPractical,
      practicalFullMarks: form.hasPractical ? Number(form.practicalFullMarks) : 0,
      practicalPassMarks: form.hasPractical ? Number(form.practicalPassMarks) : 0,
      hasContinuousAssessment: form.hasContinuousAssessment,
      continuousAssessmentFullMarks: form.hasContinuousAssessment ? Number(form.continuousAssessmentFullMarks) : 0,
      continuousAssessmentPassMarks: form.hasContinuousAssessment ? Number(form.continuousAssessmentPassMarks) : 0,
      isOptional: form.isOptional,
    });

    if ('error' in res) {
      const msg = (res.error as { message?: string })?.message;
      toast.error(msg || pick('বিষয় সংরক্ষণ ব্যর্থ হয়েছে।', 'Failed to save exam subject.'));
      return;
    }

    toast.success(pick('পরীক্ষার বিষয় কাঠামো সংরক্ষিত হয়েছে।', 'Exam subject configuration saved.'));
    setModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const res = await deleteSubject({ id: deleteTarget.id });
    if ('error' in res) {
      const msg = (res.error as { message?: string })?.message;
      toast.error(msg || pick('মুছা সম্ভব হয়নি।', 'Could not delete subject.'));
    } else {
      toast.success(pick('বিষয়টি পরীক্ষা থেকে অপসারণ করা হয়েছে।', 'Subject removed from exam.'));
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        titleBn="পরীক্ষাভিত্তিক বিষয় ও নম্বর বণ্টন"
        titleEn="Exam Subject & Marking Scheme Configuration"
        subtitleBn="প্রতিটি বিষয়ের সৃজনশীল/লিখিত, MCQ, ব্যবহারিক ও ধারাবাহিক মূল্যায়নের (CA) পূর্ণমান ও পৃথক পাশ নম্বর নির্ধারণ করুন।"
        subtitleEn="Configure Written, MCQ, Practical, and Continuous Assessment (CA) full and component-pass marks per exam."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/examinations">
              <Button variant="outline" className="whitespace-nowrap shrink-0">
                <ArrowLeft className="w-4 h-4" />
                {pick('পরীক্ষা তালিকা', 'Back to Exams')}
              </Button>
            </Link>
            {activeExam && !activeExam.isLocked && (
              <Button onClick={openAddModal} className="whitespace-nowrap shrink-0">
                <Plus className="w-4 h-4" />
                {pick('বিষয় যুক্ত করুন', 'Add Subject')}
              </Button>
            )}
          </div>
        }
      />

      {/* Exam Picker & Lock Status */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            {pick('পরীক্ষা নির্বাচন করুন:', 'Select Exam:')}
          </label>
          <div className="w-full sm:w-96">
            <Select value={resolvedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
              {activeExams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {activeExam && (
          <div className="flex items-center gap-3 text-xs tabular-nums">
            <span className="text-muted-foreground">
              {pick('মোট পূর্ণমান:', 'Total Marks:')}{' '}
              <strong className="text-foreground">
                {formatNumber(
                  examSubjects.reduce((s, x) => s + x.fullMarks, 0),
                  locale
                )}
              </strong>
            </span>
            <StatusBadge enumName="ResultPublicationStatus" value={activeExam.resultStatus} />
          </div>
        )}
      </Card>

      {activeExam?.isLocked && (
        <div className="p-3.5 rounded-[var(--radius)] border border-warning/40 bg-warning/10 flex items-center gap-2.5 text-sm">
          <Lock className="w-4 h-4 text-warning shrink-0" />
          <span>
            {pick(
              'এই পরীক্ষাটি লক করা অবস্থায় আছে। বিষয় বা নম্বর বণ্টন পরিবর্তন করতে হলে আগে ফলাফল প্রক্রিয়াকরণ পেজ থেকে পরীক্ষাটি আনলক করুন।',
              'This examination is currently locked. Unlock it from Result Publication before editing subjects.'
            )}
          </span>
        </div>
      )}

      <DataTable
        data={examSubjects.map((es) => {
          const sub = db.subjects.find((s) => s.id === es.subjectId);
          const grp = es.groupId ? db.academicGroups.find((g) => g.id === es.groupId) : null;
          return {
            es,
            id: es.id,
            subjectName: locale === 'bn' ? sub?.nameBn || sub?.name || '—' : sub?.name || '—',
            subjectCode: sub?.officialCode ?? '—',
            groupLabel: grp ? (locale === 'bn' ? grp.nameBn : grp.name) : pick('সকল বিভাগ', 'All Groups'),
            fullMarks: es.fullMarks,
          };
        })}
        pageSize={20}
        searchPlaceholder={pick('বিষয় বা কোড খুঁজুন...', 'Search subject or code...')}
        emptyTitle={pick('কোনো বিষয় যুক্ত নেই', 'No subjects configured')}
        emptyAction={
          activeExam && !activeExam.isLocked ? (
            <Button onClick={openAddModal}>
              <Plus className="w-4 h-4" />
              {pick('প্রথম বিষয় যুক্ত করুন', 'Add First Subject')}
            </Button>
          ) : undefined
        }
        columns={[
          {
            accessorKey: 'subjectName',
            header: pick('বিষয় ও কোড', 'Subject'),
            cell: ({ row }) => (
              <div className="min-w-[150px]">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>{row.original.subjectName}</span>
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  {pick('কোড:', 'Code:')} {row.original.subjectCode}
                </p>
              </div>
            ),
          },
          {
            accessorKey: 'groupLabel',
            header: pick('বিভাগ / ধরন', 'Group / Type'),
            cell: ({ row }) => (
              <div className="text-xs whitespace-nowrap">
                <div className="text-foreground font-medium">{row.original.groupLabel}</div>
                <div className="text-muted-foreground">
                  {row.original.es.isOptional
                    ? pick('ঐচ্ছিক / ৪র্থ বিষয়', 'Optional / 4th')
                    : pick('আবশ্যিক', 'Compulsory')}
                </div>
              </div>
            ),
          },
          {
            accessorKey: 'fullMarks',
            header: pick('পূর্ণ / পাশ', 'Full / Pass'),
            cell: ({ row }) => (
              <span className="font-semibold tabular-nums whitespace-nowrap">
                {formatNumber(row.original.es.fullMarks, locale)} /{' '}
                {formatNumber(row.original.es.passMarks, locale)}
              </span>
            ),
          },
          {
            id: 'written',
            header: pick('লিখিত', 'Written'),
            enableSorting: false,
            cell: ({ row }) => (
              <span className="text-xs tabular-nums whitespace-nowrap">
                {row.original.es.hasWritten
                  ? `${formatNumber(row.original.es.writtenFullMarks ?? 0, locale)} / ${formatNumber(row.original.es.writtenPassMarks ?? 0, locale)}`
                  : '—'}
              </span>
            ),
          },
          {
            id: 'mcq',
            header: 'MCQ',
            enableSorting: false,
            cell: ({ row }) => (
              <span className="text-xs tabular-nums whitespace-nowrap">
                {row.original.es.hasMcq
                  ? `${formatNumber(row.original.es.mcqFullMarks ?? 0, locale)} / ${formatNumber(row.original.es.mcqPassMarks ?? 0, locale)}`
                  : '—'}
              </span>
            ),
          },
          {
            id: 'practical',
            header: pick('ব্যবহারিক', 'Practical'),
            enableSorting: false,
            cell: ({ row }) => (
              <span className="text-xs tabular-nums whitespace-nowrap">
                {row.original.es.hasPractical
                  ? `${formatNumber(row.original.es.practicalFullMarks ?? 0, locale)} / ${formatNumber(row.original.es.practicalPassMarks ?? 0, locale)}`
                  : '—'}
              </span>
            ),
          },
          {
            id: 'ca',
            header: pick('ধারাবাহিক', 'CA'),
            enableSorting: false,
            cell: ({ row }) => (
              <span className="text-xs tabular-nums whitespace-nowrap">
                {row.original.es.hasContinuousAssessment
                  ? `${formatNumber(row.original.es.continuousAssessmentFullMarks ?? 0, locale)} / ${formatNumber(row.original.es.continuousAssessmentPassMarks ?? 0, locale)}`
                  : '—'}
              </span>
            ),
          },
          {
            id: 'actions',
            header: pick('অ্যাকশন', 'Actions'),
            enableSorting: false,
            cell: ({ row }) => (
              <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeExam?.isLocked}
                  onClick={() => openEditModal(row.original.es)}
                  aria-label={pick('সম্পাদনা', 'Edit')}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeExam?.isLocked}
                  onClick={() => setDeleteTarget(row.original.es)}
                  aria-label={pick('মুছে ফেলুন', 'Delete')}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            ),
          },
        ]}
        renderMobileCard={(row) => {
          const { es, subjectName, subjectCode, groupLabel } = row;
          return (
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-foreground">{subjectName}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-mono">{subjectCode}</span> · {groupLabel} ·{' '}
                    {es.isOptional ? pick('ঐচ্ছিক (৪র্থ)', 'Optional (4th)') : pick('আবশ্যিক', 'Compulsory')}
                  </p>
                </div>
                <span className="text-xs font-bold tabular-nums px-2 py-0.5 rounded bg-surface-muted border border-border">
                  {formatNumber(es.fullMarks, locale)} / {formatNumber(es.passMarks, locale)}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center text-xs tabular-nums bg-surface-muted/50 rounded-md p-2">
                <div>
                  <span className="text-[10px] text-muted-foreground block">{pick('লিখিত', 'Written')}</span>
                  <span className="font-semibold">
                    {es.hasWritten ? `${formatNumber(es.writtenFullMarks ?? 0, locale)}/${formatNumber(es.writtenPassMarks ?? 0, locale)}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">MCQ</span>
                  <span className="font-semibold">
                    {es.hasMcq ? `${formatNumber(es.mcqFullMarks ?? 0, locale)}/${formatNumber(es.mcqPassMarks ?? 0, locale)}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">{pick('ব্যবহারিক', 'Prac')}</span>
                  <span className="font-semibold">
                    {es.hasPractical ? `${formatNumber(es.practicalFullMarks ?? 0, locale)}/${formatNumber(es.practicalPassMarks ?? 0, locale)}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">{pick('ধারাবাহিক', 'CA')}</span>
                  <span className="font-semibold">
                    {es.hasContinuousAssessment
                      ? `${formatNumber(es.continuousAssessmentFullMarks ?? 0, locale)}/${formatNumber(es.continuousAssessmentPassMarks ?? 0, locale)}`
                      : '—'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeExam?.isLocked}
                  onClick={() => openEditModal(es)}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {pick('সম্পাদনা', 'Edit')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeExam?.isLocked}
                  onClick={() => setDeleteTarget(es)}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          );
        }}
      />

      {/* Upsert ExamSubject Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingEs
            ? pick('বিষয়ের নম্বর বণ্টন সম্পাদনা করুন', 'Edit Subject Marking Scheme')
            : pick('পরীক্ষায় নতুন বিষয় যুক্ত করুন', 'Add Subject to Exam')
        }
        size="lg"
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{pick('বিষয় *', 'Subject *')}</label>
              <Select
                value={form.subjectId}
                disabled={Boolean(editingEs)}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              >
                {db.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {locale === 'bn' ? s.nameBn : s.name} ({s.officialCode})
                  </option>
                ))}
              </Select>
            </div>

            {isClassNineTen && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {pick('একাডেমিক বিভাগ (ঐচ্ছিক)', 'Academic Group (Optional)')}
                </label>
                <Select
                  value={form.groupId}
                  onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                >
                  <option value="">{pick('সকল বিভাগের জন্য (কমন)', 'All Groups (Common)')}</option>
                  {db.academicGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {locale === 'bn' ? g.nameBn : g.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">{pick('মোট পূর্ণমান *', 'Full Marks *')}</label>
              <Input
                type="number"
                min={10}
                max={200}
                required
                value={form.fullMarks}
                onChange={(e) => {
                  const full = Number(e.target.value) || 0;
                  setForm({ ...form, fullMarks: full, passMarks: Math.ceil(full * 0.33) });
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{pick('মোট পাশ নম্বর *', 'Overall Pass Marks *')}</label>
              <Input
                type="number"
                min={1}
                max={form.fullMarks}
                required
                value={form.passMarks}
                onChange={(e) => setForm({ ...form, passMarks: Number(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Marking Components */}
          <div className="border border-border rounded-[var(--radius)] divide-y divide-border">
            {[
              {
                key: 'written',
                label: pick('সৃজনশীল / লিখিত (CQ / Written)', 'Written / Creative (CQ)'),
                enabled: form.hasWritten,
                full: form.writtenFullMarks,
                pass: form.writtenPassMarks,
                toggle: (v: boolean) => setForm({ ...form, hasWritten: v, writtenFullMarks: v ? form.writtenFullMarks || 70 : 0, writtenPassMarks: v ? form.writtenPassMarks || 23 : 0 }),
                setFull: (v: number) => setForm({ ...form, writtenFullMarks: v, writtenPassMarks: Math.ceil(v * 0.33) }),
                setPass: (v: number) => setForm({ ...form, writtenPassMarks: v }),
              },
              {
                key: 'mcq',
                label: pick('বহুনির্বাচনি (MCQ)', 'Multiple Choice (MCQ)'),
                enabled: form.hasMcq,
                full: form.mcqFullMarks,
                pass: form.mcqPassMarks,
                toggle: (v: boolean) => setForm({ ...form, hasMcq: v, mcqFullMarks: v ? form.mcqFullMarks || 30 : 0, mcqPassMarks: v ? form.mcqPassMarks || 10 : 0 }),
                setFull: (v: number) => setForm({ ...form, mcqFullMarks: v, mcqPassMarks: Math.ceil(v * 0.33) }),
                setPass: (v: number) => setForm({ ...form, mcqPassMarks: v }),
              },
              {
                key: 'practical',
                label: pick('ব্যবহারিক (Practical)', 'Practical'),
                enabled: form.hasPractical,
                full: form.practicalFullMarks,
                pass: form.practicalPassMarks,
                toggle: (v: boolean) => setForm({ ...form, hasPractical: v, practicalFullMarks: v ? form.practicalFullMarks || 25 : 0, practicalPassMarks: v ? form.practicalPassMarks || 8 : 0 }),
                setFull: (v: number) => setForm({ ...form, practicalFullMarks: v, practicalPassMarks: Math.ceil(v * 0.33) }),
                setPass: (v: number) => setForm({ ...form, practicalPassMarks: v }),
              },
              {
                key: 'ca',
                label: pick('ধারাবাহিক মূল্যায়ন (CA / Class Test)', 'Continuous Assessment (CA)'),
                enabled: form.hasContinuousAssessment,
                full: form.continuousAssessmentFullMarks,
                pass: form.continuousAssessmentPassMarks,
                toggle: (v: boolean) => setForm({ ...form, hasContinuousAssessment: v, continuousAssessmentFullMarks: v ? form.continuousAssessmentFullMarks || 20 : 0, continuousAssessmentPassMarks: v ? form.continuousAssessmentPassMarks || 7 : 0 }),
                setFull: (v: number) => setForm({ ...form, continuousAssessmentFullMarks: v, continuousAssessmentPassMarks: Math.ceil(v * 0.33) }),
                setPass: (v: number) => setForm({ ...form, continuousAssessmentPassMarks: v }),
              },
            ].map((comp) => (
              <div key={comp.key} className="p-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <label className="sm:col-span-6 flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={comp.enabled}
                    onChange={(e) => comp.toggle(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span>{comp.label}</span>
                </label>
                <div className="sm:col-span-3">
                  <Input
                    type="number"
                    min={0}
                    max={200}
                    disabled={!comp.enabled}
                    value={comp.full}
                    onChange={(e) => comp.setFull(Number(e.target.value) || 0)}
                    placeholder={pick('পূর্ণমান', 'Full')}
                  />
                </div>
                <div className="sm:col-span-3">
                  <Input
                    type="number"
                    min={0}
                    max={comp.full}
                    disabled={!comp.enabled}
                    value={comp.pass}
                    onChange={(e) => comp.setPass(Number(e.target.value) || 0)}
                    placeholder={pick('পাশ নম্বর', 'Pass')}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs tabular-nums">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.isOptional}
                onChange={(e) => setForm({ ...form, isOptional: e.target.checked })}
                className="rounded border-border"
              />
              <span>{pick('ঐচ্ছিক / ৪র্থ বিষয় হিসেবে গণ্য হবে', 'Mark as Optional / 4th Subject')}</span>
            </label>
            <span
              className={`font-semibold ${
                componentSum === Number(form.fullMarks) ? 'text-success' : 'text-destructive'
              }`}
            >
              {pick('উপাংশের যোগফল:', 'Component Sum:')} {formatNumber(componentSum, locale)} /{' '}
              {formatNumber(form.fullMarks, locale)}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button type="submit" disabled={saving || componentSum !== Number(form.fullMarks)}>
              {pick('সংরক্ষণ করুন', 'Save Configuration')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={pick('বিষয় অপসারণ নিশ্চিত করুন', 'Confirm Remove Subject')}
        description={pick(
          'এই বিষয়টি পরীক্ষা থেকে সরিয়ে ফেললে সংশ্লিষ্ট নম্বর ও রুটিনও মুছে যাবে। আপনি কি নিশ্চিত?',
          'Removing this subject from the exam will also clear its marks and routine entries. Continue?'
        )}
        confirmLabel={pick('অপসারণ করুন', 'Remove')}
        destructive
      />
    </div>
  );
}
