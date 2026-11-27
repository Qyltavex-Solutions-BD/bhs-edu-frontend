'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  History,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  useExecuteBulkPromotionMutation,
  useGetPromotionHistoryQuery,
  usePreviewPromotionQuery,
  useRollbackBatchPromotionMutation,
} from '@/src/features/students/api/promotions.api';
import { useGetExamsQuery } from '@/src/features/examinations/api/examinations.api';
import { useGetAcademicYearsQuery } from '@/src/services/academic/year.api';
import { useGetSchoolClassesQuery } from '@/src/services/academic/class.api';
import { useGetSectionsQuery } from '@/src/services/academic/section.api';
import { useGetAcademicGroupsQuery } from '@/src/services/academic/group.api';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils/cn';
import {
  EmptyState,
  LoadingSkeleton,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import {
  Button,
  Card,
  FormField,
  Input,
  Modal,
  Select,
} from '@/src/components/ui/primitives';
import { ExamType, ResultStatus } from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import { errorMessage, studentInitials } from './studentShared';

export function StudentPromotions({
  yearId,
}: {
  db?: MockDatabase;
  yearId?: string;
}) {
  const [activeTab, setActiveTab] = useState<'bulk' | 'history'>('bulk');

  // Master academic data
  const { data: academicYears = [], isLoading: loadingYears } = useGetAcademicYearsQuery();
  const { data: allClasses = [], isLoading: loadingClasses } = useGetSchoolClassesQuery();
  const { data: academicGroups = [] } = useGetAcademicGroupsQuery();

  const sortedYears = useMemo(
    () =>
      [...academicYears].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      ),
    [academicYears]
  );

  const activeClasses = useMemo(
    () =>
      [...allClasses]
        .filter((c) => c.isActive)
        .sort((a, b) => a.numericValue - b.numericValue),
    [allClasses]
  );

  // Source & target selection state
  const [sourceYearId, setSourceYearId] = useState<string>('');
  const [sourceClassId, setSourceClassId] = useState<string>('');
  const [sourceSectionId, setSourceSectionId] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  const [targetYearId, setTargetYearId] = useState<string>('');
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [targetSectionId, setTargetSectionId] = useState<string>('');
  const [defaultGroupId, setDefaultGroupId] = useState<string>('');
  const [groupOverrides, setGroupOverrides] = useState<Record<string, string>>({});

  // Confirm execution modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [remarksDraft, setRemarksDraft] = useState('');

  // History & rollback state
  const [historySearch, setHistorySearch] = useState('');
  const [historySourceYearId, setHistorySourceYearId] = useState('');
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [rbSourceYearId, setRbSourceYearId] = useState('');
  const [rbSourceClassId, setRbSourceClassId] = useState('');
  const [rbSourceSectionId, setRbSourceSectionId] = useState('');
  const [rbTargetYearId, setRbTargetYearId] = useState('');
  const [rbReason, setRbReason] = useState('');

  const resolvedSourceYearId = useMemo(() => {
    if (sourceYearId && sortedYears.some((y) => y.id === sourceYearId)) return sourceYearId;
    if (yearId && sortedYears.some((y) => y.id === yearId)) return yearId;
    const active = sortedYears.find((y) => y.isActive);
    return active?.id ?? sortedYears[0]?.id ?? '';
  }, [sourceYearId, yearId, sortedYears]);

  const resolvedSourceClassId = useMemo(() => {
    if (sourceClassId && activeClasses.some((c) => c.id === sourceClassId)) return sourceClassId;
    return activeClasses[0]?.id ?? '';
  }, [sourceClassId, activeClasses]);

  const { data: sourceSections = [] } = useGetSectionsQuery(
    { classId: resolvedSourceClassId },
    { skip: !resolvedSourceClassId }
  );

  const activeSourceSections = useMemo(
    () =>
      [...sourceSections]
        .filter((s) => s.isActive)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [sourceSections]
  );

  const resolvedSourceSectionId = useMemo(() => {
    if (sourceSectionId && activeSourceSections.some((s) => s.id === sourceSectionId)) {
      return sourceSectionId;
    }
    return activeSourceSections[0]?.id ?? '';
  }, [sourceSectionId, activeSourceSections]);

  const { data: examsRes } = useGetExamsQuery(
    {
      academicYearId: resolvedSourceYearId,
      classId: resolvedSourceClassId,
      limit: 100,
      isDeleted: false,
    },
    { skip: !resolvedSourceYearId || !resolvedSourceClassId }
  );

  const eligibleExams = useMemo(
    () =>
      (examsRes?.items ?? []).filter(
        (e) =>
          e.examType === ExamType.ANNUAL ||
          e.examType === ExamType.CONSOLIDATED ||
          e.examType === ExamType.HALF_YEARLY
      ),
    [examsRes?.items]
  );

  const sectionBelongsToSourceClass = activeSourceSections.some(
    (s) => s.id === resolvedSourceSectionId && s.classId === resolvedSourceClassId
  );

  const {
    data: previewData,
    isLoading: loadingPreview,
    isFetching: fetchingPreview,
    error: previewError,
  } = usePreviewPromotionQuery(
    {
      academicYearId: resolvedSourceYearId,
      classId: resolvedSourceClassId,
      sectionId: sectionBelongsToSourceClass ? resolvedSourceSectionId : undefined,
      examId: selectedExamId || undefined,
    },
    { skip: !resolvedSourceYearId || !resolvedSourceClassId }
  );

  const resolvedTargetYearId = useMemo(() => {
    if (targetYearId && sortedYears.some((y) => y.id === targetYearId)) return targetYearId;
    if (previewData?.target?.nextAcademicYear?.id) {
      return previewData.target.nextAcademicYear.id;
    }
    const nextIdx = sortedYears.findIndex((y) => y.id === resolvedSourceYearId) + 1;
    return sortedYears[nextIdx]?.id ?? '';
  }, [targetYearId, sortedYears, previewData?.target?.nextAcademicYear?.id, resolvedSourceYearId]);

  const resolvedTargetClassId = useMemo(() => {
    if (targetClassId && activeClasses.some((c) => c.id === targetClassId)) return targetClassId;
    if (previewData?.target?.nextClass?.id) return previewData.target.nextClass.id;
    const nextIdx = activeClasses.findIndex((c) => c.id === resolvedSourceClassId) + 1;
    return activeClasses[nextIdx]?.id ?? '';
  }, [targetClassId, activeClasses, previewData?.target?.nextClass?.id, resolvedSourceClassId]);

  const { data: targetSections = [] } = useGetSectionsQuery(
    { classId: resolvedTargetClassId },
    { skip: !resolvedTargetClassId || !!previewData?.target?.isGraduatingClass }
  );

  const activeTargetSections = useMemo(
    () =>
      [...targetSections]
        .filter((s) => s.isActive)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [targetSections]
  );

  const resolvedTargetSectionId = useMemo(() => {
    if (targetSectionId && activeTargetSections.some((s) => s.id === targetSectionId)) {
      return targetSectionId;
    }
    return activeTargetSections[0]?.id ?? '';
  }, [targetSectionId, activeTargetSections]);

  // History query
  const {
    data: historyRes,
    isLoading: loadingHistory,
    isFetching: fetchingHistory,
  } = useGetPromotionHistoryQuery(
    {
      limit: 50,
      search: historySearch.trim() || undefined,
      sourceAcademicYearId: historySourceYearId || undefined,
    },
    { skip: activeTab !== 'history' }
  );

  // Rollback modal section lookup
  const { data: rbSourceSections = [] } = useGetSectionsQuery(
    { classId: rbSourceClassId },
    { skip: !rollbackOpen || !rbSourceClassId }
  );

  const [executeBulkPromotion, { isLoading: executing }] = useExecuteBulkPromotionMutation();
  const [rollbackBatch, { isLoading: rollingBack }] = useRollbackBatchPromotionMutation();

  const isGraduatingClass = previewData?.target?.isGraduatingClass ?? false;
  const requiresGroupSelection = previewData?.target?.requiresGroupSelection ?? false;
  const previewStudents = previewData?.students ?? [];
  const summary = previewData?.summary;

  const handleExecutePromotion = async () => {
    if (!resolvedSourceYearId || !resolvedSourceClassId || !resolvedSourceSectionId) {
      toast.error('উৎস শিক্ষাবর্ষ, শ্রেণি এবং শাখা নির্বাচন করুন।');
      return;
    }
    if (!isGraduatingClass && (!resolvedTargetYearId || !resolvedTargetClassId || !resolvedTargetSectionId)) {
      toast.error('লক্ষ্য শিক্ষাবর্ষ, শ্রেণি এবং শাখা নির্বাচন করুন।');
      return;
    }

    const overridesList = Object.entries(groupOverrides)
      .filter(([, groupId]) => !!groupId)
      .map(([studentId, groupId]) => ({ studentId, groupId }));

    try {
      const res = await executeBulkPromotion({
        sourceAcademicYearId: resolvedSourceYearId,
        sourceClassId: resolvedSourceClassId,
        sourceSectionId: resolvedSourceSectionId,
        ...(isGraduatingClass
          ? {}
          : {
              targetAcademicYearId: resolvedTargetYearId,
              targetClassId: resolvedTargetClassId,
              targetSectionId: resolvedTargetSectionId,
            }),
        ...(selectedExamId ? { examId: selectedExamId } : {}),
        ...(defaultGroupId ? { defaultGroupId } : {}),
        ...(overridesList.length > 0 ? { groupOverrides: overridesList } : {}),
        ...(remarksDraft.trim() ? { remarks: remarksDraft.trim() } : {}),
      }).unwrap();

      toast.success(
        res?.message ||
          (isGraduatingClass
            ? 'দশম শ্রেণির গ্র্যাজুয়েশন সফলভাবে সম্পন্ন হয়েছে।'
            : 'শিক্ষার্থীদের প্রমোশন সফলভাবে সম্পন্ন হয়েছে।')
      );
      setConfirmOpen(false);
      setRemarksDraft('');
      setGroupOverrides({});
    } catch (err) {
      toast.error(errorMessage(err, 'প্রমোশন কার্যকর করা যায়নি।'));
    }
  };

  const handleOpenRollbackModal = () => {
    setRbSourceYearId(resolvedSourceYearId);
    setRbSourceClassId(resolvedSourceClassId);
    setRbSourceSectionId(resolvedSourceSectionId);
    setRbTargetYearId(resolvedTargetYearId);
    setRbReason('');
    setRollbackOpen(true);
  };

  const handleExecuteRollback = async () => {
    if (!rbSourceYearId || !rbSourceClassId || !rbSourceSectionId || !rbTargetYearId) {
      toast.error('রোলব্যাকের জন্য উৎস ও লক্ষ্য শিক্ষাবর্ষ, শ্রেণি এবং শাখা নির্বাচন করুন।');
      return;
    }
    try {
      await rollbackBatch({
        sourceAcademicYearId: rbSourceYearId,
        sourceClassId: rbSourceClassId,
        sourceSectionId: rbSourceSectionId,
        targetAcademicYearId: rbTargetYearId,
        ...(rbReason.trim() ? { reason: rbReason.trim() } : {}),
      }).unwrap();
      toast.success('ব্যাচ প্রমোশন সফলভাবে রোলব্যাক করা হয়েছে।');
      setRollbackOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, 'প্রমোশন রোলব্যাক করা যায়নি।'));
    }
  };

  if (loadingYears || loadingClasses) {
    return <LoadingSkeleton rows={8} />;
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setActiveTab('bulk')}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer',
              activeTab === 'bulk'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Sparkles className="w-4 h-4" />
            {'প্রমোশন ও উত্তরণ'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer',
              activeTab === 'history'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <History className="w-4 h-4" />
            {'প্রমোশন ইতিহাস ও রোলব্যাক'}
          </button>
        </div>

        {activeTab === 'history' && (
          <Button variant="outline" size="sm" onClick={handleOpenRollbackModal}>
            <RotateCcw className="w-4 h-4" />
            {'ব্যাচ রোলব্যাক (Undo)'}
          </Button>
        )}
      </div>

      {activeTab === 'bulk' ? (
        <>
          {/* Source & Target Configuration Card */}
          <Card className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField label={'উৎস শিক্ষাবর্ষ'}>
                <Select
                  id="promotion-source-year"
                  name="sourceAcademicYearId"
                  aria-label="উৎস শিক্ষাবর্ষ"
                  value={resolvedSourceYearId}
                  onChange={(e) => {
                    setSourceYearId(e.target.value);
                    setSelectedExamId('');
                    setTargetYearId('');
                  }}
                >
                  {sortedYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name} {y.isActive ? '· চলতি' : ''}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label={'উৎস শ্রেণি'}>
                <Select
                  id="promotion-source-class"
                  name="sourceClassId"
                  aria-label="উৎস শ্রেণি"
                  value={resolvedSourceClassId}
                  onChange={(e) => {
                    setSourceClassId(e.target.value);
                    setSourceSectionId('');
                    setSelectedExamId('');
                    setTargetClassId('');
                    setTargetSectionId('');
                    setGroupOverrides({});
                  }}
                >
                  {activeClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nameBn || cls.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label={'উৎস শাখা'}>
                <Select
                  id="promotion-source-section"
                  name="sourceSectionId"
                  aria-label="উৎস শাখা"
                  value={resolvedSourceSectionId}
                  onChange={(e) => setSourceSectionId(e.target.value)}
                >
                  {activeSourceSections.length === 0 ? (
                    <option value="">{'কোনো শাখা নেই'}</option>
                  ) : (
                    activeSourceSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))
                  )}
                </Select>
              </FormField>

              <FormField label={'রেফারেন্স পরীক্ষা (ঐচ্ছিক)'}>
                <Select
                  id="promotion-reference-exam"
                  name="examId"
                  aria-label="রেফারেন্স পরীক্ষা"
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                >
                  <option value="">{'স্বয়ংক্রিয় (সর্বশেষ প্রকাশিত বার্ষিক/সমন্বিত)'}</option>
                  {eligibleExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            {/* Target Year / Class / Section Row */}
            {isGraduatingClass ? (
              <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3.5 text-sm text-foreground">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <span className="font-semibold">{'১০ম শ্রেণি সমাপনী (Graduation): '}</span>
                  {'উত্তীর্ণ শিক্ষার্থীরা এসএসসি সমাপ্ত (GRADUATED) হিসেবে চিহ্নিত হবে; নতুন কোনো শ্রেণিতে ভর্তি তৈরি হবে না।'}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
                <FormField label={'লক্ষ্য শিক্ষাবর্ষ (পরবর্তী সেশন)'}>
                  <Select
                    id="promotion-target-year"
                    name="targetAcademicYearId"
                    aria-label="লক্ষ্য শিক্ষাবর্ষ"
                    value={resolvedTargetYearId}
                    onChange={(e) => setTargetYearId(e.target.value)}
                  >
                    <option value="">{'লক্ষ্য শিক্ষাবর্ষ নির্বাচন করুন'}</option>
                    {sortedYears
                      .filter((y) => y.id !== resolvedSourceYearId)
                      .map((y) => (
                        <option key={y.id} value={y.id}>
                          {y.name}
                        </option>
                      ))}
                  </Select>
                </FormField>

                <FormField label={'লক্ষ্য শ্রেণি'}>
                  <Select
                    id="promotion-target-class"
                    name="targetClassId"
                    aria-label="লক্ষ্য শ্রেণি"
                    value={resolvedTargetClassId}
                    onChange={(e) => {
                      setTargetClassId(e.target.value);
                      setTargetSectionId('');
                    }}
                  >
                    <option value="">{'লক্ষ্য শ্রেণি নির্বাচন করুন'}</option>
                    {activeClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.nameBn || cls.name}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label={'লক্ষ্য শাখা'}>
                  <Select
                    id="promotion-target-section"
                    name="targetSectionId"
                    aria-label="লক্ষ্য শাখা"
                    value={resolvedTargetSectionId}
                    onChange={(e) => setTargetSectionId(e.target.value)}
                  >
                    {activeTargetSections.length === 0 ? (
                      <option value="">{'কোনো শাখা নেই'}</option>
                    ) : (
                      activeTargetSections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name}
                        </option>
                      ))
                    )}
                  </Select>
                </FormField>

                {requiresGroupSelection && (
                  <FormField label={'ডিফল্ট বিভাগ (৯ম শ্রেণির জন্য)'}>
                    <Select
                      id="promotion-default-group"
                      name="defaultGroupId"
                      aria-label="ডিফল্ট বিভাগ"
                      value={defaultGroupId}
                      onChange={(e) => setDefaultGroupId(e.target.value)}
                    >
                      <option value="">{'বিভাগ নির্বাচন করুন'}</option>
                      {academicGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nameBn || g.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                )}
              </div>
            )}

            {/* 4-Column Summary KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="rounded-lg border border-border bg-surface-muted/40 p-3.5">
                <p className="text-xs font-semibold text-muted-foreground">{'সক্রিয় প্রার্থী'}</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">
                  {formatNumber(summary?.totalStudents ?? 0, 'bn')}{' '}
                  <span className="text-xs font-medium text-muted-foreground">{'জন'}</span>
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface-muted/40 p-3.5">
                <p className="text-xs font-semibold text-muted-foreground">
                  {isGraduatingClass ? 'সমাপ্তির জন্য প্রস্তুত' : 'উত্তীর্ণের যোগ্য'}
                </p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-success">
                  {formatNumber(summary?.eligibleForPromotion ?? 0, 'bn')}{' '}
                  <span className="text-xs font-medium text-muted-foreground">{'জন'}</span>
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface-muted/40 p-3.5">
                <p className="text-xs font-semibold text-muted-foreground">
                  {'একই শ্রেণিতে (Retained)'}
                </p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-destructive">
                  {formatNumber(summary?.mustRepeat ?? 0, 'bn')}{' '}
                  <span className="text-xs font-medium text-muted-foreground">{'জন'}</span>
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface-muted/40 p-3.5">
                <p className="text-xs font-semibold text-muted-foreground">{'রেফারেন্স পরীক্ষা'}</p>
                <p className="mt-1 text-sm font-bold text-foreground truncate">
                  {previewData?.exam?.name ?? 'প্রকাশিত ফল যুক্ত নেই'}
                </p>
                {previewData?.exam && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {`পাস: ${formatNumber(summary?.passedCount ?? 0, 'bn')} · ফেল: ${formatNumber(
                      summary?.failedCount ?? 0,
                      'bn'
                    )}`}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Preview Action Bar + Table */}
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border bg-surface-muted/30">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {'শিক্ষার্থী প্রমোশন তালিকা ও মেধাক্রম প্রিভিউ'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {'প্রকাশিত পরীক্ষার ফলাফল অনুযায়ী পরবর্তী শ্রেণির প্রস্তাবিত রোল ও সিদ্ধান্ত যাচাই করুন।'}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                disabled={
                  executing ||
                  previewStudents.length === 0 ||
                  !resolvedSourceSectionId ||
                  (!isGraduatingClass &&
                    (!resolvedTargetYearId || !resolvedTargetClassId || !resolvedTargetSectionId))
                }
                onClick={() => setConfirmOpen(true)}
              >
                {isGraduatingClass ? 'গ্র্যাজুয়েশন সম্পন্ন করুন' : 'প্রমোশন কার্যকর করুন'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {loadingPreview || fetchingPreview ? (
              <div className="p-6">
                <LoadingSkeleton rows={6} />
              </div>
            ) : previewError ? (
              <div className="p-6">
                <EmptyState
                  title={'প্রমোশন প্রিভিউ লোড করা যায়নি'}
                  description={errorMessage(
                    previewError,
                    'উৎস শিক্ষাবর্ষ, শ্রেণি ও শাখার তথ্য যাচাই করুন।'
                  )}
                />
              </div>
            ) : previewStudents.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title={'এই শ্রেণি/শাখায় কোনো সক্রিয় শিক্ষার্থী নেই'}
                  description={
                    'প্রমোশন করার জন্য নির্বাচিত উৎস শিক্ষাবর্ষ, শ্রেণি ও শাখায় সক্রিয় ভর্তি থাকতে হবে।'
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-base">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/70 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-3 text-center w-24">{'বর্তমান রোল'}</th>
                      <th className="px-4 py-3 text-left">{'শিক্ষার্থী'}</th>
                      <th className="px-4 py-3 text-left">{'পরীক্ষার অবস্থান'}</th>
                      <th className="px-4 py-3 text-center">{'প্রস্তাবিত সিদ্ধান্ত'}</th>
                      {requiresGroupSelection && (
                        <th className="px-4 py-3 text-left">{'পরবর্তী বিভাগ'}</th>
                      )}
                      <th className="px-4 py-3 text-center w-28">
                        {isGraduatingClass ? 'অবস্থা' : 'নতুন রোল'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border tabular-nums">
                    {previewStudents.map((stu) => {
                      const action = stu.promotionEligibility.suggestedAction;
                      const displayName = stu.studentNameBn || stu.studentName;
                      return (
                        <tr
                          key={stu.enrollmentId}
                          className="hover:bg-surface-muted/40 transition-colors"
                        >
                          <td className="px-4 py-3 text-center">
                            <div className="font-bold text-foreground">
                              #{formatNumber(stu.currentRoll, 'bn')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {`শাখা ${stu.currentSection.name}`}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                {studentInitials(stu.studentName)}
                              </div>
                              <div>
                                <Link
                                  href={`/admin/students/${stu.studentId}`}
                                  className="font-semibold text-foreground hover:text-primary transition-colors"
                                >
                                  {displayName}
                                </Link>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {stu.studentCustomId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {stu.examResult ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <StatusBadge
                                    value={stu.examResult.resultStatus}
                                    customTone={
                                      stu.examResult.resultStatus === ResultStatus.PASS
                                        ? 'success'
                                        : 'destructive'
                                    }
                                    customLabel={
                                      stu.examResult.resultStatus === ResultStatus.PASS
                                        ? 'উত্তীর্ণ (PASS)'
                                        : 'অনুত্তীর্ণ (FAIL)'
                                    }
                                  />
                                  <span className="text-xs font-semibold text-foreground">
                                    GPA {formatNumber(stu.examResult.gpa ?? 0, 'bn', 2)} (
                                    {stu.examResult.letterGrade ?? '—'})
                                  </span>
                                </div>
                                {stu.examResult.meritPosition && (
                                  <div className="text-xs text-muted-foreground">
                                    {`মেধাক্রম #${formatNumber(stu.examResult.meritPosition, 'bn')}`}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {'প্রকাশিত ফল নেই'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge
                              value={action}
                              customTone={
                                action === 'PROMOTE' || action === 'COMPLETE'
                                  ? 'success'
                                  : action === 'REPEAT'
                                    ? 'destructive'
                                    : 'warning'
                              }
                              customLabel={
                                action === 'PROMOTE'
                                  ? 'উত্তীর্ণ (Promoted)'
                                  : action === 'COMPLETE'
                                    ? 'এসএসসি সমাপ্ত'
                                    : action === 'REPEAT'
                                      ? 'একই শ্রেণিতে'
                                      : 'ম্যানুয়াল পর্যালোচনা'
                              }
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                              {stu.promotionEligibility.reason}
                            </div>
                          </td>
                          {requiresGroupSelection && (
                            <td className="px-4 py-3">
                              {action === 'PROMOTE' ? (
                                <Select
                                  aria-label={`${displayName} বিভাগ`}
                                  value={groupOverrides[stu.studentId] ?? defaultGroupId}
                                  onChange={(e) =>
                                    setGroupOverrides((prev) => ({
                                      ...prev,
                                      [stu.studentId]: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">{'ডিফল্ট বিভাগ'}</option>
                                  {academicGroups.map((g) => (
                                    <option key={g.id} value={g.id}>
                                      {g.nameBn || g.name}
                                    </option>
                                  ))}
                                </Select>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          )}
                          <td className="px-4 py-3 text-center font-bold text-foreground">
                            {isGraduatingClass ? (
                              <span className="text-xs text-primary">{'GRADUATED'}</span>
                            ) : (
                              `#${formatNumber(stu.promotionEligibility.suggestedRoll, 'bn')}`
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : (
        /* Promotion History Tab */
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            <div className="lg:col-span-6">
              <FormField label={'শিক্ষার্থী খুঁজুন (নাম / আইডি)'}>
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="promotion-history-search"
                    name="search"
                    className="pl-9"
                    placeholder={'নাম বা আইডি লিখুন...'}
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                  />
                </div>
              </FormField>
            </div>
            <div className="lg:col-span-4">
              <FormField label={'উৎস শিক্ষাবর্ষ ফিল্টার'}>
                <Select
                  id="promotion-history-year"
                  name="sourceAcademicYearId"
                  aria-label="উৎস শিক্ষাবর্ষ ফিল্টার"
                  value={historySourceYearId}
                  onChange={(e) => setHistorySourceYearId(e.target.value)}
                >
                  <option value="">{'সকল শিক্ষাবর্ষ'}</option>
                  {sortedYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          </div>

          {loadingHistory || fetchingHistory ? (
            <div className="p-6">
              <LoadingSkeleton rows={6} />
            </div>
          ) : (historyRes?.items ?? []).length === 0 ? (
            <div className="p-6">
              <EmptyState
                title={'কোনো প্রমোশন ইতিহাস পাওয়া যায়নি'}
                description={'এখনো কোনো শিক্ষার্থীর প্রমোশন রেকর্ড সংরক্ষিত হয়নি।'}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-base">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/70 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">{'তারিখ'}</th>
                    <th className="px-4 py-3 text-left">{'শিক্ষার্থী'}</th>
                    <th className="px-4 py-3 text-left">{'পূর্বের শ্রেণি'}</th>
                    <th className="px-4 py-3 text-left">{'নতুন শ্রেণি'}</th>
                    <th className="px-4 py-3 text-left">{'পরীক্ষার ফলাফল'}</th>
                    <th className="px-4 py-3 text-left">{'মন্তব্য'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border tabular-nums">
                  {(historyRes?.items ?? []).map((item) => (
                    <tr key={item.id} className="hover:bg-surface-muted/40 transition-colors">
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {formatDateShort(item.promotionDate, 'bn')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">
                          {item.student.nameBn || item.student.nameEn}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {item.student.studentId}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-foreground">
                          {item.from.class} ({item.from.section})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {`${item.from.academicYear} · রোল #${formatNumber(item.from.roll, 'bn')}`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-semibold text-primary">
                          {item.to.class} ({item.to.section})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {`${item.to.academicYear} · রোল #${formatNumber(item.to.roll, 'bn')}`}
                          {item.to.isRepeater ? ' · একই শ্রেণিতে' : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.result ? (
                          <div>
                            <div className="font-medium text-foreground">
                              {item.result.examName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {`GPA ${formatNumber(item.result.gpa ?? 0, 'bn', 2)} (${
                                item.result.letterGrade ?? '—'
                              })`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {item.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Confirm Bulk Promotion Modal */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={isGraduatingClass ? 'গ্র্যাজুয়েশন নিশ্চিত করুন' : 'বাল্ক প্রমোশন নিশ্চিত করুন'}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-foreground">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              {isGraduatingClass
                ? `এই শাখার ${formatNumber(
                    previewStudents.length,
                    'bn'
                  )} জন শিক্ষার্থীর ১০ম শ্রেণি সমাপ্তি (GRADUATED) কার্যকর করা হবে।`
                : `এই শাখার ${formatNumber(
                    previewStudents.length,
                    'bn'
                  )} জন শিক্ষার্থীর প্রমোশন কার্যকর করা হবে (প্রয়োজনে ইতিহাস ট্যাব থেকে রোলব্যাক করা যাবে)।`}
            </div>
          </div>

          <FormField label={'মন্তব্য (ঐচ্ছিক)'}>
            <Input
              id="promotion-remarks"
              name="remarks"
              placeholder={'যেমন: বার্ষিক পরীক্ষা ২০২৬ অনুযায়ী প্রমোশন'}
              value={remarksDraft}
              onChange={(e) => setRemarksDraft(e.target.value)}
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {'বাতিল'}
            </Button>
            <Button variant="primary" disabled={executing} onClick={handleExecutePromotion}>
              {executing ? 'সংরক্ষণ হচ্ছে...' : 'নিশ্চিত ও কার্যকর করুন'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Batch Rollback Modal */}
      <Modal
        open={rollbackOpen}
        onClose={() => setRollbackOpen(false)}
        title={'ব্যাচ প্রমোশন রোলব্যাক (Undo)'}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <FormField label={'উৎস শিক্ষাবর্ষ (যেখান থেকে প্রমোশন হয়েছিল)'} required>
            <Select
              id="rb-source-year"
              name="rbSourceYearId"
              aria-label="রোলব্যাক উৎস শিক্ষাবর্ষ"
              value={rbSourceYearId}
              onChange={(e) => setRbSourceYearId(e.target.value)}
            >
              {sortedYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={'উৎস শ্রেণি'} required>
            <Select
              id="rb-source-class"
              name="rbSourceClassId"
              aria-label="রোলব্যাক উৎস শ্রেণি"
              value={rbSourceClassId}
              onChange={(e) => {
                setRbSourceClassId(e.target.value);
                setRbSourceSectionId('');
              }}
            >
              {activeClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBn || c.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={'উৎস শাখা'} required>
            <Select
              id="rb-source-section"
              name="rbSourceSectionId"
              aria-label="রোলব্যাক উৎস শাখা"
              value={rbSourceSectionId}
              onChange={(e) => setRbSourceSectionId(e.target.value)}
            >
              <option value="">{'শাখা নির্বাচন করুন'}</option>
              {rbSourceSections
                .filter((s) => s.isActive)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </Select>
          </FormField>

          <FormField label={'লক্ষ্য শিক্ষাবর্ষ (যেখানে প্রমোশন হয়েছিল)'} required>
            <Select
              id="rb-target-year"
              name="rbTargetYearId"
              aria-label="রোলব্যাক লক্ষ্য শিক্ষাবর্ষ"
              value={rbTargetYearId}
              onChange={(e) => setRbTargetYearId(e.target.value)}
            >
              <option value="">{'লক্ষ্য শিক্ষাবর্ষ নির্বাচন করুন'}</option>
              {sortedYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={'রোলব্যাকের কারণ (ঐচ্ছিক)'}>
            <Input
              id="rb-reason"
              name="reason"
              placeholder={'যেমন: ভুলবশত প্রমোশন দেওয়া হয়েছিল'}
              value={rbReason}
              onChange={(e) => setRbReason(e.target.value)}
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setRollbackOpen(false)}>
              {'বাতিল'}
            </Button>
            <Button variant="primary" disabled={rollingBack} onClick={handleExecuteRollback}>
              {rollingBack ? 'রোলব্যাক হচ্ছে...' : 'রোলব্যাক সম্পন্ন করুন'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
