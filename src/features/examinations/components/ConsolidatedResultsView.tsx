'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  Printer,
  Scale,
  Search,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetConsolidatedResultQuery,
  useGetExamsQuery,
  useSaveConsolidatedConfigMutation,
} from '@/src/features/examinations/api/examinations.api';
import { useGetSchoolClassesQuery } from '@/src/services/academic/class.api';
import { useGetSectionsQuery } from '@/src/services/academic/section.api';
import { formatNumber } from '@/src/lib/formatters';
import { cn, exportToCsv, triggerPrint } from '@/src/lib/utils/cn';
import { ExamType, ResultStatus } from '@/src/types/enums';
import type { SchoolProfile } from '@/src/types/entities';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
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
import { PrintableConsolidatedResultSheet } from '@/src/components/print/ExamPrintDocuments';

const FALLBACK_SCHOOL_PROFILE: SchoolProfile = {
  id: 'school-default',
  name: 'ভোজেশ্বর উচ্চ বিদ্যালয়',
  nameEn: 'Vojesshor High School',
  eiin: '112233',
  establishedYear: 1965,
  address: 'ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
  phone: '',
  email: '',
  createdAt: '',
  updatedAt: '',
};

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

export function ConsolidatedResultsView() {
  const { data: examsRes, isLoading: loadingExams } = useGetExamsQuery({
    examType: ExamType.CONSOLIDATED,
    limit: 100,
    isDeleted: false,
  });
  const { data: allClasses = [] } = useGetSchoolClassesQuery();

  const [saveConsolidatedConfig, { isLoading: savingConfig }] =
    useSaveConsolidatedConfigMutation();

  const consolidatedExams = useMemo(
    () =>
      [...(examsRes?.items ?? [])].sort(
        (a, b) =>
          (a.schoolClass?.numericValue ?? 99) - (b.schoolClass?.numericValue ?? 99)
      ),
    [examsRes?.items]
  );

  const activeClasses = useMemo(
    () =>
      [...allClasses]
        .filter((c) => c.isActive)
        .sort((a, b) => a.numericValue - b.numericValue),
    [allClasses]
  );

  const [selectedExamName, setSelectedExamName] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Config weightage modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [weightDraft, setWeightDraft] = useState<
    Record<string, { enabled: boolean; weight: number }>
  >({});

  const examNames = useMemo(
    () => Array.from(new Set(consolidatedExams.map((e) => e.name))),
    [consolidatedExams]
  );

  const resolvedExamName =
    selectedExamName && examNames.includes(selectedExamName)
      ? selectedExamName
      : examNames[0] ?? '';

  const classesForExam = useMemo(() => {
    if (!resolvedExamName) return activeClasses;
    const classIdsWithExam = new Set(
      consolidatedExams
        .filter((e) => e.name === resolvedExamName)
        .map((e) => e.classId)
    );
    const matched = activeClasses.filter((c) => classIdsWithExam.has(c.id));
    return matched.length > 0 ? matched : activeClasses;
  }, [consolidatedExams, resolvedExamName, activeClasses]);

  const resolvedClassId =
    selectedClassId && classesForExam.some((c) => c.id === selectedClassId)
      ? selectedClassId
      : classesForExam[0]?.id ?? '';

  const selectedExam = useMemo(
    () =>
      consolidatedExams.find(
        (e) => e.name === resolvedExamName && e.classId === resolvedClassId
      ) ?? null,
    [consolidatedExams, resolvedExamName, resolvedClassId]
  );

  const activeExamId = selectedExam?.id ?? '';

  const {
    data: consolidatedData,
    isLoading: loadingConsolidated,
    isFetching: fetchingConsolidated,
  } = useGetConsolidatedResultQuery(activeExamId, {
    skip: !activeExamId,
  });

  const { data: classSections = [] } = useGetSectionsQuery(
    { classId: selectedExam?.classId },
    { skip: !selectedExam?.classId }
  );

  const activeConfigs = useMemo(
    () => consolidatedData?.configs ?? [],
    [consolidatedData?.configs]
  );

  const eligibleSourceExams = useMemo(
    () => consolidatedData?.eligibleSourceExams ?? [],
    [consolidatedData?.eligibleSourceExams]
  );

  const configWeightSum = useMemo(
    () => activeConfigs.reduce((s, c) => s + c.weightagePercentage, 0),
    [activeConfigs]
  );

  const consolidatedRows = useMemo(
    () => consolidatedData?.rows ?? [],
    [consolidatedData?.rows]
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return consolidatedRows.filter((r) => {
      if (sectionFilter !== 'ALL' && r.sectionId !== sectionFilter) return false;
      if (q) {
        const hay = `${r.studentName} ${r.studentNameEn} ${r.studentId} ${r.roll}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [consolidatedRows, sectionFilter, search]);

  const stats = useMemo(() => {
    const total = filteredRows.length;
    const passed = filteredRows.filter((r) => r.isPassed).length;
    const maxGpa = consolidatedData?.examination?.maxGpa ?? 5.0;
    const gpa5 = filteredRows.filter((r) => r.isPassed && r.weightedGpa >= maxGpa).length;
    const incomplete = filteredRows.filter((r) => r.isIncomplete).length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    return { total, passed, gpa5, incomplete, passRate };
  }, [filteredRows, consolidatedData?.examination?.maxGpa]);

  const schoolProfile: SchoolProfile = FALLBACK_SCHOOL_PROFILE;

  const openConfigModal = () => {
    if (!selectedExam) return;
    const draft: Record<string, { enabled: boolean; weight: number }> = {};
    eligibleSourceExams.forEach((ex) => {
      const existing = activeConfigs.find((c) => c.sourceExamId === ex.id);
      draft[ex.id] = {
        enabled: !!existing,
        weight: existing?.weightagePercentage ?? 0,
      };
    });
    setWeightDraft(draft);
    setShowConfigModal(true);
  };

  const draftSelectedItems = useMemo(
    () =>
      Object.entries(weightDraft)
        .filter(([, v]) => v.enabled)
        .map(([sourceExamId, v]) => ({
          sourceExamId,
          weightagePercentage: Number(v.weight) || 0,
        })),
    [weightDraft]
  );

  const draftWeightTotal = useMemo(
    () => draftSelectedItems.reduce((s, i) => s + i.weightagePercentage, 0),
    [draftSelectedItems]
  );

  const handleSaveConfig = async () => {
    if (!selectedExam) return;
    if (draftSelectedItems.length < 2) {
      toast.error('কমপক্ষে ২টি উৎস পরীক্ষা নির্বাচন করুন।');
      return;
    }
    if (Math.abs(draftWeightTotal - 100) > 0.01) {
      toast.error(`মোট ওয়েটেজ অবশ্যই ১০০% হতে হবে (বর্তমান মোট: ${draftWeightTotal}%)।`);
      return;
    }
    try {
      await saveConsolidatedConfig({
        consolidatedExamId: selectedExam.id,
        items: draftSelectedItems,
      }).unwrap();
      toast.success('সমন্বিত ফলাফলের ওয়েটেজ কনফিগারেশন সংরক্ষিত হয়েছে।');
      setShowConfigModal(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'ওয়েটেজ সংরক্ষণ করা যায়নি।'));
    }
  };

  const handleExportCsv = () => {
    if (!selectedExam || filteredRows.length === 0) return;
    const csvRows = filteredRows.map((r) => {
      const rowObj: Record<string, unknown> = {
        Merit: r.merit ?? '—',
        Roll: r.roll,
        StudentID: r.studentId,
        StudentName: r.studentName,
        Section: r.sectionName,
        Group: r.groupName ?? '',
      };
      activeConfigs.forEach((cfg) => {
        const sc = r.sourceScores[cfg.sourceExamId];
        rowObj[`${cfg.sourceExamName} (${cfg.weightagePercentage}%) Marks`] =
          sc?.marks ?? 'N/A';
        rowObj[`${cfg.sourceExamName} (${cfg.weightagePercentage}%) GPA`] =
          sc?.gpa !== null && sc?.gpa !== undefined ? sc.gpa.toFixed(2) : 'N/A';
      });
      rowObj.ConsolidatedMarks = r.weightedMarks;
      rowObj.FinalGPA = r.weightedGpa.toFixed(2);
      rowObj.Grade = r.letterGrade;
      rowObj.Status = r.isPassed ? 'PASS' : r.isIncomplete ? 'INCOMPLETE' : 'FAIL';
      return rowObj;
    });
    exportToCsv(csvRows, `consolidated-result-${selectedExam.id}.csv`);
    toast.success('সমন্বিত ফলাফল CSV ডাউনলোড হয়েছে।');
  };

  if (loadingExams) return <LoadingSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={'সমন্বিত চূড়ান্ত ফলাফল (Consolidated Result)'}
        description={
          'একাধিক টার্ম পরীক্ষার শতকরা ওয়েটেজ (মোট ১০০%) নির্ধারণ করে বাৎসরিক চূড়ান্ত মেধাতালিকা ও প্রিন্টযোগ্য রেজিস্টার তৈরি করুন।'
        }
        actions={
          <>
            {selectedExam && (
              <Button variant="outline" size="sm" onClick={openConfigModal}>
                <Settings2 className="w-4 h-4" />
                {'ওয়েটেজ কনফিগার'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={filteredRows.length === 0}
              onClick={handleExportCsv}
            >
              <Download className="w-4 h-4" />
              {'CSV এক্সপোর্ট'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={filteredRows.length === 0}
              onClick={() => setShowPrintModal(true)}
            >
              <Printer className="w-4 h-4" />
              {'প্রিন্ট শিট (A4)'}
            </Button>
          </>
        }
      />

      {/* Always-Visible Filter Toolbar */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-2 lg:col-span-4">
            <FormField label={'সমন্বিত পরীক্ষা নির্বাচন করুন'}>
              <Select
                id="consolidated-exam-select"
                name="consolidatedExamName"
                value={resolvedExamName}
                onChange={(e) => {
                  setSelectedExamName(e.target.value);
                  setSectionFilter('ALL');
                }}
              >
                {examNames.length === 0 ? (
                  <option value="">{'কোনো সমন্বিত পরীক্ষা নেই'}</option>
                ) : (
                  examNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))
                )}
              </Select>
            </FormField>
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <FormField label={'শ্রেণি'}>
              <Select
                id="consolidated-class-select"
                name="classId"
                value={resolvedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSectionFilter('ALL');
                }}
              >
                {classesForExam.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.nameBn || cls.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="sm:col-span-1 lg:col-span-3">
            <FormField label={'শাখা ফিল্টার'}>
              <Select
                id="consolidated-section-select"
                name="sectionId"
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
              >
                <option value="ALL">{'সকল শাখা'}</option>
                {classSections
                  .filter((s) => s.isActive)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </Select>
            </FormField>
          </div>

          <div className="sm:col-span-1 lg:col-span-3">
            <FormField label={'শিক্ষার্থী খুঁজুন'}>
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="consolidated-student-search"
                  name="search"
                  className="pl-9"
                  placeholder={'নাম, আইডি বা রোল...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* Active Weightage Formula Banner */}
        {selectedExam && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-primary" />
                  {'সক্রিয় ওয়েটেজ সূত্র:'}
                </span>
                {activeConfigs.length === 0 ? (
                  <span className="text-sm text-warning font-medium">
                    {'কোনো উৎস পরীক্ষা ও ওয়েটেজ নির্ধারণ করা হয়নি'}
                  </span>
                ) : (
                  activeConfigs.map((cfg) => (
                    <span
                      key={cfg.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-surface-muted border border-border text-foreground"
                    >
                      <span>{cfg.sourceExamName}</span>
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold tabular-nums">
                        {formatNumber(cfg.weightagePercentage, 'bn')}%
                      </span>
                    </span>
                  ))
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded border tabular-nums',
                    configWeightSum === 100
                      ? 'bg-success/10 text-success border-success/25'
                      : 'bg-warning/10 text-warning border-warning/25'
                  )}
                >
                  {`মোট ওয়েটেজ: ${formatNumber(configWeightSum, 'bn')}%`}
                </span>
              </div>
            </div>
        )}
      </Card>

      {!selectedExam ? (
        <Card className="p-8">
          <EmptyState
            title={'কোনো সমন্বিত পরীক্ষা পাওয়া যায়নি'}
            description={
              'প্রথমে পরীক্ষা ও বিষয়সমূহ পাতা থেকে একটি সমন্বিত (Consolidated) পরীক্ষা তৈরি করুন, তারপর এখানে অর্ধবার্ষিক ও বার্ষিক পরীক্ষার ওয়েটেজ মিলিয়ে চূড়ান্ত ফলাফল দেখুন।'
            }
            action={
              <Link href="/admin/examinations">
                <Button variant="primary" size="sm">
                  {'পরীক্ষা ও বিষয়সমূহ পাতায় যান'}
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {/* 4-Column KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 flex flex-col justify-between gap-2">
              <p className="text-base font-bold text-foreground">
                {'মোট তালিকাভুক্ত শিক্ষার্থী'}
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
                {formatNumber(stats.total, 'bn')}{' '}
                <span className="text-sm font-semibold text-muted-foreground">{'জন'}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground truncate">
                {consolidatedData?.examination?.className ?? ''} · {selectedExam?.name ?? ''}
              </p>
            </Card>

            <Card className="p-5 flex flex-col justify-between gap-2">
              <p className="text-base font-bold text-foreground">
                {'সমন্বিত উত্তীর্ণ ও পাসের হার'}
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-success">
                {formatNumber(stats.passed, 'bn')}{' '}
                <span className="text-sm font-semibold text-muted-foreground">
                  ({formatNumber(stats.passRate, 'bn')}%)
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                {`উত্তীর্ণ ${formatNumber(stats.passed, 'bn')} · অনুত্তীর্ণ ${formatNumber(
                  stats.total - stats.passed,
                  'bn'
                )}`}
              </p>
            </Card>

            <Card className="p-5 flex flex-col justify-between gap-2">
              <p className="text-base font-bold text-foreground">
                {'চূড়ান্ত জিপিএ ৫.০০'}
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-primary">
                {formatNumber(stats.gpa5, 'bn')}{' '}
                <span className="text-sm font-semibold text-muted-foreground">{'জন'}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                {stats.total > 0
                  ? `মোট শিক্ষার্থীর ${formatNumber(
                      Math.round((stats.gpa5 / stats.total) * 100),
                      'bn'
                    )}%`
                  : 'কোনো ফলাফল নেই'}
              </p>
            </Card>

            <Card className="p-5 flex flex-col justify-between gap-2">
              <p className="text-base font-bold text-foreground">
                {'অসম্পূর্ণ / অনুত্তীর্ণ'}
              </p>
              <p
                className={cn(
                  'mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums',
                  stats.total - stats.passed > 0 ? 'text-warning' : 'text-foreground'
                )}
              >
                {formatNumber(stats.total - stats.passed, 'bn')}{' '}
                <span className="text-sm font-semibold text-muted-foreground">{'জন'}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                {stats.incomplete > 0
                  ? `${formatNumber(stats.incomplete, 'bn')} জনের উৎস পরীক্ষার ফল অসম্পূর্ণ`
                  : 'সব উৎস পরীক্ষার ফলাফল সম্পূর্ণ'}
              </p>
            </Card>
          </div>

          {/* Main Consolidated Matrix Table */}
          <Card className="overflow-hidden">
            {loadingConsolidated || fetchingConsolidated ? (
              <div className="p-6">
                <LoadingSkeleton rows={6} />
              </div>
            ) : activeConfigs.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title={'উৎস পরীক্ষার ওয়েটেজ কনফিগার করা হয়নি'}
                  description={
                    'সমন্বিত চূড়ান্ত ফলাফল হিসাব করতে অন্তত ২টি পরীক্ষার শতকরা ওয়েটেজ (মোট ১০০%) নির্ধারণ করুন।'
                  }
                  action={
                    <Button variant="primary" size="sm" onClick={openConfigModal}>
                      <Settings2 className="w-4 h-4" />
                      {'এখনই ওয়েটেজ কনফিগার করুন'}
                    </Button>
                  }
                />
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title={'কোনো শিক্ষার্থী পাওয়া যায়নি'}
                  description={'নির্বাচিত শ্রেণি/শাখা বা অনুসন্ধানের সাথে কোনো শিক্ষার্থী মেলেনি।'}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-base">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/70 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-3 text-center w-16">{'মেধা'}</th>
                      <th className="px-3 py-3 text-center w-16">{'রোল'}</th>
                      <th className="px-4 py-3 text-left">{'শিক্ষার্থী ও শাখা'}</th>
                      {activeConfigs.map((cfg) => (
                        <th key={cfg.id} className="px-3 py-3 text-right">
                          <div className="truncate max-w-[170px] ml-auto">
                            {cfg.sourceExamName}
                          </div>
                          <div className="text-xs font-bold text-primary normal-case">
                            ({formatNumber(cfg.weightagePercentage, 'bn')}%)
                          </div>
                        </th>
                      ))}
                      <th className="px-3 py-3 text-right">{'সমন্বিত নম্বর'}</th>
                      <th className="px-3 py-3 text-right">{'চূড়ান্ত GPA'}</th>
                      <th className="px-3 py-3 text-center">{'গ্রেড'}</th>
                      <th className="px-4 py-3 text-center">{'অবস্থা'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border tabular-nums">
                    {filteredRows.map((row) => (
                      <tr
                        key={row.enrollmentId}
                        className="hover:bg-surface-muted/40 transition-colors"
                      >
                        <td className="px-4 py-3 text-center">
                          {row.merit ? (
                            <span
                              className={`inline-flex items-center justify-center min-w-[2.2rem] px-2 py-0.5 rounded text-xs font-semibold ${
                                row.merit <= 3
                                  ? 'bg-warning/15 text-warning border border-warning/30'
                                  : 'bg-surface-muted text-foreground'
                              }`}
                            >
                              #{formatNumber(row.merit, 'bn')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center font-medium text-foreground">
                          {formatNumber(row.roll, 'bn')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{row.studentName}</div>
                          <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="font-mono">{row.studentId}</span>
                            <span>·</span>
                            <span>{`শাখা: ${row.sectionName}`}</span>
                            {row.groupName && (
                              <>
                                <span>·</span>
                                <span className="text-primary font-medium">{row.groupName}</span>
                              </>
                            )}
                          </div>
                        </td>
                        {activeConfigs.map((cfg) => {
                          const sc = row.sourceScores[cfg.sourceExamId];
                          return (
                            <td key={cfg.id} className="px-3 py-3 text-right">
                              {!sc || sc.marks === null ? (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/25">
                                  {'ফলাফল নেই'}
                                </span>
                              ) : (
                                <div>
                                  <div className="font-medium text-foreground">
                                    {formatNumber(sc.marks, 'bn')}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    GPA {formatNumber(sc.gpa ?? 0, 'bn', 2)}
                                    {sc.status !== ResultStatus.PASS && (
                                      <span className="ml-1 text-destructive font-semibold">
                                        ({sc.status === ResultStatus.INCOMPLETE ? 'INC' : 'F'})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-3 text-right font-semibold text-foreground">
                          {formatNumber(row.weightedMarks, 'bn', 1)}
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-primary">
                          {formatNumber(row.weightedGpa, 'bn', 2)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold border ${
                              row.isPassed
                                ? 'bg-success/10 text-success border-success/25'
                                : row.isIncomplete
                                  ? 'bg-warning/10 text-warning border-warning/25'
                                  : 'bg-destructive/10 text-destructive border-destructive/25'
                            }`}
                          >
                            {row.letterGrade}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge
                            value={
                              row.isPassed
                                ? 'PASS'
                                : row.isIncomplete
                                  ? 'INCOMPLETE'
                                  : 'FAIL'
                            }
                            customTone={
                              row.isPassed ? 'success' : row.isIncomplete ? 'warning' : 'destructive'
                            }
                            customLabel={
                              row.isPassed
                                ? 'উত্তীর্ণ'
                                : row.isIncomplete
                                  ? 'অসম্পূর্ণ'
                                  : 'অনুত্তীর্ণ'
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Weightage Configuration Modal */}
      <Modal
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title={'উৎস পরীক্ষা ও ওয়েটেজ কনফিগারেশন'}
        description={
          selectedExam
            ? `${selectedExam.name} — ${consolidatedData?.examination?.className ?? ''}`
            : undefined
        }
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-muted/60 border border-border">
            <span className="text-sm text-muted-foreground">
              {'অন্তত ২টি পরীক্ষা নির্বাচন করুন এবং মোট ওয়েটেজ ঠিক ১০০% নির্ধারণ করুন।'}
            </span>
            <span
              className={cn(
                'text-xs font-bold px-2.5 py-1 rounded border tabular-nums shrink-0',
                Math.abs(draftWeightTotal - 100) <= 0.01
                  ? 'bg-success/10 text-success border-success/25'
                  : 'bg-destructive/10 text-destructive border-destructive/25'
              )}
            >
              {`বর্তমান মোট: ${formatNumber(draftWeightTotal, 'bn')}%`}
            </span>
          </div>

          {eligibleSourceExams.length < 2 ? (
            <EmptyState
              title={'পর্যাপ্ত উৎস পরীক্ষা নেই'}
              description={
                'একই শ্রেণি ও শিক্ষাবর্ষে অন্তত ২টি সাধারণ পরীক্ষা (যেমন: অর্ধবার্ষিক ও বার্ষিক) থাকতে হবে।'
              }
            />
          ) : (
            <div className="space-y-2.5">
              {eligibleSourceExams.map((ex) => {
                const entry = weightDraft[ex.id] ?? { enabled: false, weight: 0 };
                return (
                  <div
                    key={ex.id}
                    className={cn(
                      'flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors',
                      entry.enabled
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border bg-surface'
                    )}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={entry.enabled}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setWeightDraft((prev) => ({
                            ...prev,
                            [ex.id]: {
                              enabled: checked,
                              weight: checked ? prev[ex.id]?.weight || 50 : 0,
                            },
                          }));
                        }}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-base text-foreground truncate">
                          {ex.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {`প্রক্রিয়াকৃত ফলাফল: ${formatNumber(ex.processedCount, 'bn')} জন`}
                        </div>
                      </div>
                    </label>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        disabled={!entry.enabled}
                        className="w-20 text-right tabular-nums"
                        value={entry.weight}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                          setWeightDraft((prev) => ({
                            ...prev,
                            [ex.id]: { ...entry, weight: val },
                          }));
                        }}
                      />
                      <span className="text-sm font-semibold text-muted-foreground">%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {eligibleSourceExams.length >= 2 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">{'দ্রুত অনুপাত:'}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const next: Record<string, { enabled: boolean; weight: number }> = {};
                  eligibleSourceExams.forEach((ex, i) => {
                    next[ex.id] = { enabled: i < 2, weight: i < 2 ? 50 : 0 };
                  });
                  setWeightDraft(next);
                }}
              >
                50% + 50%
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const next: Record<string, { enabled: boolean; weight: number }> = {};
                  eligibleSourceExams.forEach((ex, i) => {
                    next[ex.id] = { enabled: i < 2, weight: i === 0 ? 30 : i === 1 ? 70 : 0 };
                  });
                  setWeightDraft(next);
                }}
              >
                30% + 70%
              </Button>
              {eligibleSourceExams.length >= 3 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const next: Record<string, { enabled: boolean; weight: number }> = {};
                    eligibleSourceExams.forEach((ex, i) => {
                      const weights = [20, 30, 50];
                      next[ex.id] = { enabled: i < 3, weight: i < 3 ? weights[i] : 0 };
                    });
                    setWeightDraft(next);
                  }}
                >
                  20% + 30% + 50%
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setShowConfigModal(false)}>
              {'বাতিল'}
            </Button>
            <Button
              variant="primary"
              disabled={
                savingConfig ||
                draftSelectedItems.length < 2 ||
                Math.abs(draftWeightTotal - 100) > 0.01
              }
              onClick={handleSaveConfig}
            >
              {'ওয়েটেজ সংরক্ষণ করুন'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Institutional Landscape A4 Consolidated Print Modal */}
      <Modal
        open={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title={'সমন্বিত চূড়ান্ত ফলাফল শিট (ল্যান্ডস্কেপ A4)'}
        maxWidth="max-w-6xl"
      >
        {selectedExam && consolidatedData && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPrintModal(false)}>
                {'বন্ধ করুন'}
              </Button>
              <Button variant="primary" size="sm" onClick={() => triggerPrint()}>
                <Printer className="w-4 h-4" />
                {'ল্যান্ডস্কেপ A4 প্রিন্ট করুন'}
              </Button>
            </div>
            <div className="overflow-x-auto pb-2">
              <PrintableConsolidatedResultSheet
                school={schoolProfile}
                title={consolidatedData.examination.name}
                className={consolidatedData.examination.className}
                academicYear={consolidatedData.examination.academicYear}
                sources={activeConfigs.map((c) => ({
                  examId: c.sourceExamId,
                  name: c.sourceExamName,
                  weightagePercentage: c.weightagePercentage,
                }))}
                rows={filteredRows.map((r) => ({
                  merit: r.merit,
                  roll: r.roll,
                  studentName: r.studentName,
                  sectionName: r.sectionName,
                  sourceScores: r.sourceScores,
                  weightedMarks: r.weightedMarks,
                  weightedGpa: r.weightedGpa,
                  letterGrade: r.letterGrade,
                  isPassed: r.isPassed,
                }))}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
