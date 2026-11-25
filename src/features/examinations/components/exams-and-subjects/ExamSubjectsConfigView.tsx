'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Edit3,
  Lock,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateExamSubjectMutation,
  useGetExamsQuery,
  useGetExamSubjectsQuery,
  useRemoveExamSubjectMutation,
  useUpdateExamSubjectMutation,
} from '@/src/store/api';
import {
  useGetAcademicGroupsQuery,
  useGetSchoolClassesQuery,
  useGetSubjectsQuery,
} from '@/src/services/academic';
import {
  ConfirmDialog,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { DataTable } from '@/src/components/shared/DataTable';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import { formatNumber } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils/cn';
import { getEnumMeta } from '@/src/lib/constants/enums';
import type { ExamSubject } from '@/src/types/entities';

export function ExamSubjectsConfigView({ initialExamId }: { initialExamId?: string }) {
  const { data: examsData, isLoading: examsLoading } = useGetExamsQuery({ limit: 100 });
  const { data: classesList = [], isLoading: classesLoading } = useGetSchoolClassesQuery();
  const { data: subjectsList = [], isLoading: subjectsLoading } = useGetSubjectsQuery();
  const { data: groupsList = [] } = useGetAcademicGroupsQuery();

  const [createExamSubject, { isLoading: creating }] = useCreateExamSubjectMutation();
  const [updateExamSubject, { isLoading: updating }] = useUpdateExamSubjectMutation();
  const [removeExamSubject] = useRemoveExamSubjectMutation();
  const saving = creating || updating;

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
    () => (examsData?.items ?? []).filter((e) => !e.isDeleted),
    [examsData]
  );

  const resolvedExamId =
    selectedExamId && activeExams.some((e) => e.id === selectedExamId)
      ? selectedExamId
      : activeExams[0]?.id ?? '';

  const activeExam = activeExams.find((e) => e.id === resolvedExamId) ?? null;

  const { data: examSubjectsRaw = [], isLoading: subjectsConfigLoading } =
    useGetExamSubjectsQuery(activeExam?.id ?? '', { skip: !activeExam?.id });

  const examSubjects = useMemo(() => {
    return [...examSubjectsRaw].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [examSubjectsRaw]);

  if (examsLoading || classesLoading || subjectsLoading || (activeExam && subjectsConfigLoading)) {
    return <LoadingSkeleton rows={6} />;
  }

  const activeClass = activeExam
    ? activeExam.schoolClass ?? classesList.find((c) => c.id === activeExam.classId) ?? null
    : null;
  const isClassNineTen = (activeClass?.numericValue ?? 0) >= 9;

  const totalFullMarks = examSubjects.reduce((s, x) => s + x.fullMarks, 0);
  const compulsoryCount = examSubjects.filter((x) => !x.isOptional).length;
  const optionalCount = examSubjects.filter((x) => x.isOptional).length;
  const writtenMcqCount = examSubjects.filter((x) => x.hasWritten || x.hasMcq).length;
  const practicalCaCount = examSubjects.filter((x) => x.hasPractical || x.hasContinuousAssessment).length;

  const componentSum =
    (form.hasWritten ? Number(form.writtenFullMarks) || 0 : 0) +
    (form.hasMcq ? Number(form.mcqFullMarks) || 0 : 0) +
    (form.hasPractical ? Number(form.practicalFullMarks) || 0 : 0) +
    (form.hasContinuousAssessment ? Number(form.continuousAssessmentFullMarks) || 0 : 0);

  const openAddModal = () => {
    const usedIds = new Set(examSubjects.map((es) => es.subjectId));
    const nextSubject = subjectsList.find((s) => !usedIds.has(s.id)) ?? subjectsList[0];
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
        `উপাংশগুলোর যোগফল (${componentSum}) এবং মোট পূর্ণমান (${form.fullMarks}) সমান হতে হবে।`
      );
      return;
    }

    const commonPayload = {
      groupId: isClassNineTen && form.groupId ? form.groupId : undefined,
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
      continuousAssessmentFullMarks: form.hasContinuousAssessment
        ? Number(form.continuousAssessmentFullMarks)
        : 0,
      continuousAssessmentPassMarks: form.hasContinuousAssessment
        ? Number(form.continuousAssessmentPassMarks)
        : 0,
      isOptional: form.isOptional,
    };

    try {
      if (editingEs) {
        await updateExamSubject({
          examId: activeExam.id,
          subjectConfigId: editingEs.id,
          body: commonPayload,
        }).unwrap();
      } else {
        await createExamSubject({
          examId: activeExam.id,
          body: {
            subjectId: form.subjectId,
            ...commonPayload,
          },
        }).unwrap();
      }
      toast.success('পরীক্ষার বিষয় কাঠামো সংরক্ষিত হয়েছে।');
      setModalOpen(false);
    } catch (err: any) {
      const msg = err?.data?.message || err?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'বিষয় সংরক্ষণ ব্যর্থ হয়েছে।');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !activeExam) return;
    try {
      await removeExamSubject({
        examId: activeExam.id,
        subjectConfigId: deleteTarget.id,
      }).unwrap();
      toast.success('বিষয়টি পরীক্ষা থেকে অপসারণ করা হয়েছে।');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'মুছা সম্ভব হয়নি।');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        titleBn="পরীক্ষাভিত্তিক বিষয় ও নম্বর বণ্টন"
        subtitleBn="প্রতিটি বিষয়ের সৃজনশীল/লিখিত, MCQ, ব্যবহারিক ও ধারাবাহিক মূল্যায়নের (CA) পূর্ণমান ও পৃথক পাশ নম্বর নির্ধারণ করুন।"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/examinations">
              <Button variant="outline" className="whitespace-nowrap shrink-0">
                <ArrowLeft className="w-4 h-4" />
                {'পরীক্ষা তালিকা'}
              </Button>
            </Link>
            {activeExam && !activeExam.isLocked && (
              <Button onClick={openAddModal} className="whitespace-nowrap shrink-0">
                <Plus className="w-4 h-4" />
                {'বিষয় যুক্ত করুন'}
              </Button>
            )}
          </div>
        }
      />

      {/* Exam Picker & Lock Status */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            {'পরীক্ষা নির্বাচন করুন:'}
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
              {'মোট পূর্ণমান:'}{' '}
              <strong className="text-foreground">
                {formatNumber(
                  examSubjects.reduce((s, x) => s + x.fullMarks, 0),
                  'bn'
                )}
              </strong>
            </span>
            <StatusBadge enumName="ResultPublicationStatus" value={activeExam.resultStatus} />
          </div>
        )}
      </Card>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'মোট বিষয় ও পূর্ণমান'}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(examSubjects.length, 'bn')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {`সর্বমোট পূর্ণমান ${formatNumber(totalFullMarks, 'bn')} নম্বর`}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'আবশ্যিক ও ঐচ্ছিক বিষয়'}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-primary">
            {formatNumber(compulsoryCount, 'bn')} / {formatNumber(optionalCount, 'bn')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {`আবশ্যিক ${formatNumber(compulsoryCount, 'bn')} · ৪র্থ ঐচ্ছিক ${formatNumber(optionalCount, 'bn')}`}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'উপাংশ বণ্টন স্থিতি'}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(writtenMcqCount, 'bn')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {`লিখিত+MCQ ${formatNumber(writtenMcqCount, 'bn')} · ব্যবহারিক/CA ${formatNumber(practicalCaCount, 'bn')}`}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'যৌথ পাস ও লক অবস্থা'}
          </p>
          <p className={cn('mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums', activeExam?.isLocked ? 'text-warning' : 'text-success')}>
            {activeExam?.isLocked ? 'লকড' : 'উন্মুক্ত'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {`যৌথ পাস: ${activeExam?.allowCombinedPass ? 'চালু (NCTB)' : 'বন্ধ'}`}
          </p>
        </Card>
      </div>

      {activeExam?.isLocked && (
        <div className="p-3.5 rounded-[var(--radius)] border border-warning/40 bg-warning/10 flex items-center gap-2.5 text-sm">
          <Lock className="w-4 h-4 text-warning shrink-0" />
          <span>
            {'এই পরীক্ষাটি লক করা অবস্থায় আছে। বিষয় বা নম্বর বণ্টন পরিবর্তন করতে হলে আগে ফলাফল প্রক্রিয়াকরণ পেজ থেকে পরীক্ষাটি আনলক করুন।'}
          </span>
        </div>
      )}

      <DataTable
        data={examSubjects.map((es) => {
          const sub = es.subject ?? subjectsList.find((s) => s.id === es.subjectId);
          const grp = es.group ?? (es.groupId ? groupsList.find((g) => g.id === es.groupId) : null);
          return {
            es,
            id: es.id,
            subjectName: sub?.nameBn || sub?.name || '—',
            subjectCode: sub?.officialCode ?? '—',
            groupLabel: grp ? (grp.nameBn || grp.name) : 'সকল বিভাগ',
            fullMarks: es.fullMarks,
          };
        })}
        pageSize={20}
        searchPlaceholder={'বিষয় বা কোড খুঁজুন...'}
        emptyTitle={'কোনো বিষয় যুক্ত নেই'}
        emptyAction={
          activeExam && !activeExam.isLocked ? (
            <Button onClick={openAddModal}>
              <Plus className="w-4 h-4" />
              {'প্রথম বিষয় যুক্ত করুন'}
            </Button>
          ) : undefined
        }
        columns={[
          {
            accessorKey: 'subjectName',
            header: 'বিষয় ও কোড',
            cell: ({ row }) => (
              <div className="min-w-[150px]">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>{row.original.subjectName}</span>
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  {'কোড:'} {row.original.subjectCode}
                </p>
              </div>
            ),
          },
          {
            accessorKey: 'groupLabel',
            header: 'বিভাগ / ধরন',
            cell: ({ row }) => (
              <div className="text-xs whitespace-nowrap">
                <div className="text-foreground font-medium">{row.original.groupLabel}</div>
                <div className="text-muted-foreground">
                  {row.original.es.isOptional
                    ? 'ঐচ্ছিক / ৪র্থ বিষয়'
                    : 'আবশ্যিক'}
                </div>
              </div>
            ),
          },
          {
            accessorKey: 'fullMarks',
            header: 'পূর্ণ / পাশ',
            cell: ({ row }) => (
              <span className="font-semibold tabular-nums whitespace-nowrap">
                {formatNumber(row.original.es.fullMarks, 'bn')} /{' '}
                {formatNumber(row.original.es.passMarks, 'bn')}
              </span>
            ),
          },
          {
            id: 'written',
            header: 'লিখিত',
            enableSorting: false,
            cell: ({ row }) => (
              <span className="text-xs tabular-nums whitespace-nowrap">
                {row.original.es.hasWritten
                  ? `${formatNumber(row.original.es.writtenFullMarks ?? 0, 'bn')} / ${formatNumber(row.original.es.writtenPassMarks ?? 0, 'bn')}`
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
                  ? `${formatNumber(row.original.es.mcqFullMarks ?? 0, 'bn')} / ${formatNumber(row.original.es.mcqPassMarks ?? 0, 'bn')}`
                  : '—'}
              </span>
            ),
          },
          {
            id: 'practical',
            header: 'ব্যবহারিক',
            enableSorting: false,
            cell: ({ row }) => (
              <span className="text-xs tabular-nums whitespace-nowrap">
                {row.original.es.hasPractical
                  ? `${formatNumber(row.original.es.practicalFullMarks ?? 0, 'bn')} / ${formatNumber(row.original.es.practicalPassMarks ?? 0, 'bn')}`
                  : '—'}
              </span>
            ),
          },
          {
            id: 'ca',
            header: 'ধারাবাহিক',
            enableSorting: false,
            cell: ({ row }) => (
              <span className="text-xs tabular-nums whitespace-nowrap">
                {row.original.es.hasContinuousAssessment
                  ? `${formatNumber(row.original.es.continuousAssessmentFullMarks ?? 0, 'bn')} / ${formatNumber(row.original.es.continuousAssessmentPassMarks ?? 0, 'bn')}`
                  : '—'}
              </span>
            ),
          },
          {
            id: 'actions',
            header: 'অ্যাকশন',
            enableSorting: false,
            cell: ({ row }) => (
              <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeExam?.isLocked}
                  onClick={() => openEditModal(row.original.es)}
                  aria-label={'সম্পাদনা'}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeExam?.isLocked}
                  onClick={() => setDeleteTarget(row.original.es)}
                  aria-label={'মুছে ফেলুন'}
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
                    {es.isOptional ? 'ঐচ্ছিক (৪র্থ)' : 'আবশ্যিক'}
                  </p>
                </div>
                <span className="text-xs font-bold tabular-nums px-2 py-0.5 rounded bg-surface-muted border border-border">
                  {formatNumber(es.fullMarks, 'bn')} / {formatNumber(es.passMarks, 'bn')}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center text-xs tabular-nums bg-surface-muted/50 rounded-md p-2">
                <div>
                  <span className="text-xs text-muted-foreground block">{'লিখিত'}</span>
                  <span className="font-semibold">
                    {es.hasWritten ? `${formatNumber(es.writtenFullMarks ?? 0, 'bn')}/${formatNumber(es.writtenPassMarks ?? 0, 'bn')}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">MCQ</span>
                  <span className="font-semibold">
                    {es.hasMcq ? `${formatNumber(es.mcqFullMarks ?? 0, 'bn')}/${formatNumber(es.mcqPassMarks ?? 0, 'bn')}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">{'ব্যবহারিক'}</span>
                  <span className="font-semibold">
                    {es.hasPractical ? `${formatNumber(es.practicalFullMarks ?? 0, 'bn')}/${formatNumber(es.practicalPassMarks ?? 0, 'bn')}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">{'ধারাবাহিক'}</span>
                  <span className="font-semibold">
                    {es.hasContinuousAssessment
                      ? `${formatNumber(es.continuousAssessmentFullMarks ?? 0, 'bn')}/${formatNumber(es.continuousAssessmentPassMarks ?? 0, 'bn')}`
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
                  {'সম্পাদনা'}
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
            ? 'বিষয়ের নম্বর বণ্টন সম্পাদনা করুন'
            : 'পরীক্ষায় নতুন বিষয় যুক্ত করুন'
        }
        size="lg"
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{'বিষয় *'}</label>
              <Select
                value={form.subjectId}
                disabled={Boolean(editingEs)}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              >
                {subjectsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameBn || s.name} {s.officialCode ? `(${s.officialCode})` : ''}
                  </option>
                ))}
              </Select>
            </div>

            {isClassNineTen && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {'একাডেমিক বিভাগ (ঐচ্ছিক)'}
                </label>
                <Select
                  value={form.groupId}
                  onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                >
                  <option value="">{'সকল বিভাগের জন্য (কমন)'}</option>
                  {groupsList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nameBn || g.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">{'মোট পূর্ণমান *'}</label>
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
              <label className="block text-sm font-medium mb-1">{'মোট পাশ নম্বর *'}</label>
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
                label: 'সৃজনশীল / লিখিত (CQ / Written)',
                enabled: form.hasWritten,
                full: form.writtenFullMarks,
                pass: form.writtenPassMarks,
                toggle: (v: boolean) => setForm({ ...form, hasWritten: v, writtenFullMarks: v ? form.writtenFullMarks || 70 : 0, writtenPassMarks: v ? form.writtenPassMarks || 23 : 0 }),
                setFull: (v: number) => setForm({ ...form, writtenFullMarks: v, writtenPassMarks: Math.ceil(v * 0.33) }),
                setPass: (v: number) => setForm({ ...form, writtenPassMarks: v }),
              },
              {
                key: 'mcq',
                label: 'বহুনির্বাচনি (MCQ)',
                enabled: form.hasMcq,
                full: form.mcqFullMarks,
                pass: form.mcqPassMarks,
                toggle: (v: boolean) => setForm({ ...form, hasMcq: v, mcqFullMarks: v ? form.mcqFullMarks || 30 : 0, mcqPassMarks: v ? form.mcqPassMarks || 10 : 0 }),
                setFull: (v: number) => setForm({ ...form, mcqFullMarks: v, mcqPassMarks: Math.ceil(v * 0.33) }),
                setPass: (v: number) => setForm({ ...form, mcqPassMarks: v }),
              },
              {
                key: 'practical',
                label: 'ব্যবহারিক (Practical)',
                enabled: form.hasPractical,
                full: form.practicalFullMarks,
                pass: form.practicalPassMarks,
                toggle: (v: boolean) => setForm({ ...form, hasPractical: v, practicalFullMarks: v ? form.practicalFullMarks || 25 : 0, practicalPassMarks: v ? form.practicalPassMarks || 8 : 0 }),
                setFull: (v: number) => setForm({ ...form, practicalFullMarks: v, practicalPassMarks: Math.ceil(v * 0.33) }),
                setPass: (v: number) => setForm({ ...form, practicalPassMarks: v }),
              },
              {
                key: 'ca',
                label: 'ধারাবাহিক মূল্যায়ন (CA / Class Test)',
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
                    placeholder={'পূর্ণমান'}
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
                    placeholder={'পাশ নম্বর'}
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
              <span>{'ঐচ্ছিক / ৪র্থ বিষয় হিসেবে গণ্য হবে'}</span>
            </label>
            <span
              className={`font-semibold ${
                componentSum === Number(form.fullMarks) ? 'text-success' : 'text-destructive'
              }`}
            >
              {'উপাংশের যোগফল:'} {formatNumber(componentSum, 'bn')} /{' '}
              {formatNumber(form.fullMarks, 'bn')}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              {'বাতিল'}
            </Button>
            <Button type="submit" disabled={saving || componentSum !== Number(form.fullMarks)}>
              {'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={'বিষয় অপসারণ নিশ্চিত করুন'}
        description={'এই বিষয়টি পরীক্ষা থেকে সরিয়ে ফেললে সংশ্লিষ্ট নম্বর ও রুটিনও মুছে যাবে। আপনি কি নিশ্চিত?'}
        confirmLabel={'অপসারণ করুন'}
        destructive
      />
    </div>
  );
}
