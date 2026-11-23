'use client';

import React, { useMemo, useState } from 'react';
import {
  Download,
  Plus,
  Printer,
  Scale,
  Search,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateExamMutation,
  useGetBootstrapQuery,
  useSaveConsolidatedConfigMutation,
} from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { cn, exportToCsv, triggerPrint } from '@/src/lib/utils/cn';
import { ExamType, ResultStatus } from '@/src/types/enums';
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
import { getExamEnrolledStudents } from './ExamShared';

function resolveLetterFromGpa(gpa: number, isPassed: boolean): string {
  if (!isPassed) return 'F';
  if (gpa >= 5.0) return 'A+';
  if (gpa >= 4.0) return 'A';
  if (gpa >= 3.5) return 'A-';
  if (gpa >= 3.0) return 'B';
  if (gpa >= 2.0) return 'C';
  if (gpa >= 1.0) return 'D';
  return 'F';
}

export function ConsolidatedResultsView() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [saveConsolidatedConfig, { isLoading: savingConfig }] = useSaveConsolidatedConfigMutation();
  const [createExam, { isLoading: creatingExam }] = useCreateExamMutation();

  const consolidatedExams = useMemo(
    () => (db?.exams ?? []).filter((e) => e.examType === ExamType.CONSOLIDATED),
    [db]
  );

  const [selectedId, setSelectedId] = useState<string>('');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Config weightage modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [weightDraft, setWeightDraft] = useState<Record<string, { enabled: boolean; weight: number }>>({});

  // New Consolidated Exam modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newClassId, setNewClassId] = useState('');
  const [newYearId, setNewYearId] = useState('');

  const activeExamId = useMemo(() => {
    if (selectedId && consolidatedExams.some((e) => e.id === selectedId)) return selectedId;
    return consolidatedExams[0]?.id ?? '';
  }, [selectedId, consolidatedExams]);

  const selectedExam = useMemo(
    () => consolidatedExams.find((e) => e.id === activeExamId) ?? null,
    [consolidatedExams, activeExamId]
  );

  const selectedClass = useMemo(
    () => (db && selectedExam ? db.classes.find((c) => c.id === selectedExam.classId) ?? null : null),
    [db, selectedExam]
  );

  const selectedYear = useMemo(
    () => (db && selectedExam ? db.academicYears.find((y) => y.id === selectedExam.academicYearId) ?? null : null),
    [db, selectedExam]
  );

  const classSections = useMemo(
    () =>
      db && selectedExam
        ? db.sections
            .filter((s) => s.classId === selectedExam.classId && s.isActive)
            .sort((a, b) => a.name.localeCompare(b.name))
        : [],
    [db, selectedExam]
  );

  const eligibleSourceExams = useMemo(() => {
    if (!db || !selectedExam) return [];
    return db.exams.filter(
      (e) =>
        e.examType !== ExamType.CONSOLIDATED &&
        e.classId === selectedExam.classId &&
        e.academicYearId === selectedExam.academicYearId
    );
  }, [db, selectedExam]);

  const activeConfigs = useMemo(() => {
    if (!db || !selectedExam) return [];
    return db.consolidatedConfigs
      .filter((c) => c.consolidatedExamId === selectedExam.id)
      .map((cfg) => {
        const src = db.exams.find((e) => e.id === cfg.sourceExamId);
        return {
          ...cfg,
          sourceExamName: src?.name ?? cfg.sourceExamId,
          sourceExam: src ?? null,
        };
      });
  }, [db, selectedExam]);

  const configWeightSum = useMemo(
    () => activeConfigs.reduce((s, c) => s + c.weightagePercentage, 0),
    [activeConfigs]
  );

  // Accurate NCTB Consolidated Calculation across ALL enrolled students (no slice cap, no fake scores)
  const consolidatedRows = useMemo(() => {
    if (!db || !selectedExam || activeConfigs.length === 0) return [];
    const enrollments = getExamEnrolledStudents(db, selectedExam);

    const rawRows = enrollments.map((enr) => {
      const stu = db.students.find((s) => s.id === enr.studentId);
      const sec = db.sections.find((s) => s.id === enr.sectionId);
      const grp = enr.groupId ? db.academicGroups.find((g) => g.id === enr.groupId) : null;

      const sourceScores: Record<string, { marks: number | null; gpa: number | null; status: string }> = {};
      let weightedMarks = 0;
      let weightedGpa = 0;
      let allSourcesAvailable = true;
      let allSourcesPassed = true;

      activeConfigs.forEach((cfg) => {
        const summary = db.resultSummaries.find(
          (r) => r.examId === cfg.sourceExamId && r.studentEnrollmentId === enr.id
        );
        if (!summary) {
          allSourcesAvailable = false;
          allSourcesPassed = false;
          sourceScores[cfg.sourceExamId] = { marks: null, gpa: null, status: 'MISSING' };
        } else {
          const factor = cfg.weightagePercentage / 100;
          weightedMarks += summary.totalMarks * factor;
          weightedGpa += (summary.gpa ?? 0) * factor;
          if (summary.resultStatus !== ResultStatus.PASS) {
            allSourcesPassed = false;
          }
          sourceScores[cfg.sourceExamId] = {
            marks: summary.totalMarks,
            gpa: summary.gpa ?? 0,
            status: summary.resultStatus,
          };
        }
      });

      const isPassed = allSourcesAvailable && allSourcesPassed;
      const finalMarks = Math.round(weightedMarks * 10) / 10;
      const finalGpa = isPassed ? Math.min(5.0, Math.round(weightedGpa * 100) / 100) : 0;
      const letterGrade = resolveLetterFromGpa(finalGpa, isPassed);

      return {
        enrollmentId: enr.id,
        sectionId: enr.sectionId,
        roll: enr.roll,
        studentId: stu?.studentId ?? enr.studentId,
        studentName: locale === 'bn' ? stu?.nameBn || stu?.nameEn || '—' : stu?.nameEn || '—',
        studentNameEn: stu?.nameEn ?? '',
        sectionName: sec?.name ?? '—',
        groupName: grp ? (locale === 'bn' ? grp.nameBn : grp.name) : null,
        sourceScores,
        weightedMarks: finalMarks,
        weightedGpa: finalGpa,
        letterGrade,
        isPassed,
        isIncomplete: !allSourcesAvailable,
        merit: null as number | null,
      };
    });

    const passed = rawRows
      .filter((r) => r.isPassed)
      .sort(
        (a, b) =>
          b.weightedGpa - a.weightedGpa ||
          b.weightedMarks - a.weightedMarks ||
          a.roll - b.roll
      );
    passed.forEach((r, idx) => {
      r.merit = idx + 1;
    });

    return rawRows.sort((a, b) => {
      if (a.isPassed !== b.isPassed) return a.isPassed ? -1 : 1;
      if (a.merit !== null && b.merit !== null) return a.merit - b.merit;
      return b.weightedMarks - a.weightedMarks || a.roll - b.roll;
    });
  }, [db, selectedExam, activeConfigs, locale]);

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
    const gpa5 = filteredRows.filter((r) => r.isPassed && r.weightedGpa >= 5.0).length;
    const incomplete = filteredRows.filter((r) => r.isIncomplete).length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    return { total, passed, gpa5, incomplete, passRate };
  }, [filteredRows]);

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
        .map(([sourceExamId, v]) => ({ sourceExamId, weightagePercentage: Number(v.weight) || 0 })),
    [weightDraft]
  );

  const draftWeightTotal = useMemo(
    () => draftSelectedItems.reduce((s, i) => s + i.weightagePercentage, 0),
    [draftSelectedItems]
  );

  const handleSaveConfig = async () => {
    if (!selectedExam) return;
    if (draftSelectedItems.length < 2) {
      toast.warning(pick('সমন্বিত ফলাফলের জন্য অন্তত ২টি উৎস পরীক্ষা নির্বাচন করুন।', 'Select at least 2 source exams.'));
      return;
    }
    if (draftWeightTotal !== 100) {
      toast.error(pick('ওয়েটেজের মোট যোগফল ঠিক ১০০% হতে হবে।', 'Total weightage must equal exactly 100%.'));
      return;
    }
    try {
      await saveConsolidatedConfig({
        consolidatedExamId: selectedExam.id,
        items: draftSelectedItems,
      }).unwrap();
      toast.success(pick('সমন্বিত ফলাফলের ওয়েটেজ কনফিগারেশন সংরক্ষিত হয়েছে।', 'Consolidated weightage configuration saved.'));
      setShowConfigModal(false);
    } catch {
      toast.error(pick('ওয়েটেজ সংরক্ষণ করা যায়নি।', 'Failed to save consolidated configuration.'));
    }
  };

  const handleCreateConsolidated = async () => {
    if (!db || !newName.trim() || !newClassId || !newYearId) {
      toast.warning(pick('সকল প্রয়োজনীয় তথ্য পূরণ করুন।', 'Please fill in all required fields.'));
      return;
    }
    const defaultScale = db.gradingScales.find((g) => g.isDefault) ?? db.gradingScales[0];
    try {
      const created = await createExam({
        name: newName.trim(),
        examType: ExamType.CONSOLIDATED,
        academicYearId: newYearId,
        classId: newClassId,
        gradingScaleId: defaultScale?.id ?? 'gs-nctb',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
      }).unwrap();
      setSelectedId(created.id);
      setShowCreateModal(false);
      setNewName('');
      toast.success(
        pick(
          'নতুন সমন্বিত পরীক্ষা তৈরি হয়েছে। এখন উৎস পরীক্ষার ওয়েটেজ নির্ধারণ করুন।',
          'Consolidated exam created. Now configure source exam weightages.'
        )
      );
    } catch {
      toast.error(pick('সমন্বিত পরীক্ষা তৈরি করা যায়নি।', 'Failed to create consolidated exam.'));
    }
  };

  const handleExportCsv = () => {
    if (!selectedExam || filteredRows.length === 0) return;
    const rows = filteredRows.map((r) => {
      const rowObj: Record<string, string | number> = {
        Merit: r.merit ?? '—',
        Roll: r.roll,
        StudentID: r.studentId,
        StudentName: r.studentNameEn,
        Section: r.sectionName,
      };
      activeConfigs.forEach((cfg) => {
        const sc = r.sourceScores[cfg.sourceExamId];
        rowObj[`${cfg.sourceExamName} (${cfg.weightagePercentage}%)`] =
          sc && sc.marks !== null ? `${sc.marks} (GPA ${sc.gpa?.toFixed(2) ?? '0.00'})` : 'MISSING';
      });
      rowObj.WeightedMarks = r.weightedMarks;
      rowObj.FinalGPA = r.weightedGpa.toFixed(2);
      rowObj.Grade = r.letterGrade;
      rowObj.Status = r.isPassed ? 'PASS' : r.isIncomplete ? 'INCOMPLETE' : 'FAIL';
      return rowObj;
    });
    exportToCsv(rows, `consolidated-result-${selectedExam.id}.csv`);
    toast.success(pick('সমন্বিত ফলাফল CSV ডাউনলোড হয়েছে।', 'Consolidated result CSV exported.'));
  };

  if (isLoading || !db) return <LoadingSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('সমন্বিত চূড়ান্ত ফলাফল (Consolidated Result)', 'Consolidated Final Result Builder')}
        description={pick(
          'একাধিক টার্ম পরীক্ষার শতকরা ওয়েটেজ (মোট ১০০%) নির্ধারণ করে বাৎসরিক চূড়ান্ত মেধাতালিকা ও প্রিন্টযোগ্য রেজিস্টার তৈরি করুন।',
          'Combine multiple term examinations with custom percentage weightages (total 100%) to generate annual consolidated merit lists.'
        )}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewClassId(db.classes[0]?.id ?? '');
                setNewYearId(db.academicYears.find((y) => y.isActive)?.id ?? db.academicYears[0]?.id ?? '');
                setShowCreateModal(true);
              }}
            >
              <Plus className="w-4 h-4" />
              {pick('নতুন সমন্বিত পরীক্ষা', 'New Consolidated Exam')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedExam}
              onClick={openConfigModal}
            >
              <Settings2 className="w-4 h-4" />
              {pick('ওয়েটেজ কনফিগার', 'Configure Weights')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filteredRows.length === 0}
              onClick={handleExportCsv}
            >
              <Download className="w-4 h-4" />
              {pick('CSV এক্সপোর্ট', 'Export CSV')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={filteredRows.length === 0}
              onClick={() => setShowPrintModal(true)}
            >
              <Printer className="w-4 h-4" />
              {pick('প্রিন্ট শিট (A4)', 'Print Sheet (A4)')}
            </Button>
          </>
        }
      />

      {/* Selector & Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-2 lg:col-span-5">
            <FormField label={pick('সমন্বিত পরীক্ষা নির্বাচন করুন', 'Select Consolidated Examination')}>
              <Select
                value={activeExamId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setSectionFilter('ALL');
                }}
              >
                {consolidatedExams.length > 0 ? (
                  consolidatedExams.map((ex) => {
                    const cls = db.classes.find((c) => c.id === ex.classId);
                    return (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} — {locale === 'bn' ? cls?.nameBn || cls?.name : cls?.name}
                      </option>
                    );
                  })
                ) : (
                  <option value="">{pick('কোনো সমন্বিত পরীক্ষা নেই', 'No consolidated exams')}</option>
                )}
              </Select>
            </FormField>
          </div>
          <div className="sm:col-span-1 lg:col-span-3">
            <FormField label={pick('শাখা ফিল্টার', 'Filter Section')}>
              <Select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                <option value="ALL">{pick('সকল শাখা', 'All Sections')}</option>
                {classSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="sm:col-span-1 lg:col-span-4">
            <FormField label={pick('শিক্ষার্থী খুঁজুন', 'Search Student')}>
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  className="pl-9"
                  placeholder={pick('নাম, আইডি বা রোল...', 'Name, ID, or roll...')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* Active Weightage Formula Banner */}
        {selectedExam && (
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-muted-foreground inline-flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-primary" />
                {pick('সক্রিয় ওয়েটেজ সূত্র:', 'Active Weightage Formula:')}
              </span>
              {activeConfigs.length === 0 ? (
                <StatusBadge
                  value="UNCONFIGURED"
                  customTone="warning"
                  customLabel={pick('কোনো উৎস পরীক্ষা যুক্ত করা হয়নি', 'No source exams configured')}
                />
              ) : (
                activeConfigs.map((cfg) => (
                  <span
                    key={cfg.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-muted border border-border text-foreground font-medium tabular-nums"
                  >
                    <span>{cfg.sourceExamName}</span>
                    <span className="font-bold text-primary">
                      {formatNumber(cfg.weightagePercentage, locale)}%
                    </span>
                  </span>
                ))
              )}
            </div>
            {activeConfigs.length > 0 && (
              <StatusBadge
                value="WEIGHT_TOTAL"
                customTone={configWeightSum === 100 ? 'success' : 'destructive'}
                customLabel={`${pick('মোট ওয়েটেজ:', 'Total Weight:')} ${formatNumber(configWeightSum, locale)}%`}
              />
            )}
          </div>
        )}
      </Card>

      {/* 4-Column Hairline-Divided KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-base font-bold text-foreground">
            {pick('মোট তালিকাভুক্ত শিক্ষার্থী', 'Enrolled Students')}
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
            {formatNumber(stats.total, locale)}{' '}
            <span className="text-sm font-medium text-muted-foreground">{pick('জন', '')}</span>
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground tabular-nums truncate">
            {selectedExam ? selectedExam.name : pick('কনফিগারেশন নির্বাচন করুন', 'Select configuration')}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-base font-bold text-foreground">
            {pick('সমন্বিত উত্তীর্ণ ও পাসের হার', 'Consolidated Passed & Rate')}
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-success">
            {formatNumber(stats.passed, locale)}{' '}
            <span className="text-sm font-medium text-muted-foreground">({formatNumber(stats.passRate, locale)}%)</span>
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground tabular-nums">
            {pick(
              `উত্তীর্ণ ${formatNumber(stats.passed, 'bn')} · অনুত্তীর্ণ ${formatNumber(stats.total - stats.passed, 'bn')}`,
              `Passed ${stats.passed} · Failed ${stats.total - stats.passed}`
            )}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-base font-bold text-foreground">
            {pick('চূড়ান্ত জিপিএ ৫.০০', 'Final GPA 5.00')}
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-primary">
            {formatNumber(stats.gpa5, locale)}{' '}
            <span className="text-sm font-medium text-muted-foreground">{pick('জন', '')}</span>
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground tabular-nums">
            {stats.total > 0
              ? pick(
                  `মোট শিক্ষার্থীর ${formatNumber(Math.round((stats.gpa5 / stats.total) * 100), locale)}%`,
                  `${Math.round((stats.gpa5 / stats.total) * 100)}% of total`
                )
              : pick('কোনো ফলাফল নেই', 'No results')}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-base font-bold text-foreground">
            {pick('অসম্পূর্ণ / অনুত্তীর্ণ', 'Incomplete / Failed')}
          </p>
          <p
            className={cn(
              'mt-2 text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight',
              stats.total - stats.passed > 0 ? 'text-destructive' : 'text-foreground'
            )}
          >
            {formatNumber(stats.total - stats.passed, locale)}{' '}
            <span className="text-sm font-medium text-muted-foreground">{pick('জন', '')}</span>
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground tabular-nums truncate">
            {stats.incomplete > 0
              ? pick(
                  `${formatNumber(stats.incomplete, locale)} জনের উৎস পরীক্ষার ফল অসম্পূর্ণ`,
                  `${stats.incomplete} missing source result`
                )
              : stats.total - stats.passed > 0
                ? pick('সমন্বিত মূল্যায়নে অনুত্তীর্ণ', 'Failed in combined assessment')
                : pick('সকল শিক্ষার্থী উত্তীর্ণ', 'All students passed')}
          </p>
        </Card>
      </div>

      {/* Main Consolidated Table */}
      <Card className="overflow-hidden">
        {!selectedExam ? (
          <div className="p-6">
            <EmptyState
              title={pick('কোনো সমন্বিত পরীক্ষা পাওয়া যায়নি', 'No Consolidated Examination Yet')}
              description={pick(
                'একাধিক টার্ম পরীক্ষা একত্রিত করে চূড়ান্ত বাৎসরিক ফলাফল তৈরি করতে একটি নতুন সমন্বিত পরীক্ষা তৈরি করুন।',
                'Create a new consolidated examination to combine multiple term exams into a single annual result sheet.'
              )}
              action={
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setNewClassId(db.classes[0]?.id ?? '');
                    setNewYearId(db.academicYears.find((y) => y.isActive)?.id ?? db.academicYears[0]?.id ?? '');
                    setShowCreateModal(true);
                  }}
                >
                  {pick('নতুন সমন্বিত পরীক্ষা তৈরি করুন', 'Create Consolidated Exam')}
                </Button>
              }
            />
          </div>
        ) : activeConfigs.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={pick('উৎস পরীক্ষার ওয়েটেজ নির্ধারণ করা হয়নি', 'Source Exam Weightages Not Configured')}
              description={pick(
                'সমন্বিত ফলাফল গণনা করতে এই শ্রেণির অন্তত ২টি টার্ম পরীক্ষা নির্বাচন করে মোট ১০০% ওয়েটেজ দিন।',
                'Select at least 2 term exams for this class and assign percentage weights totaling 100%.'
              )}
              action={
                <Button size="sm" variant="primary" onClick={openConfigModal}>
                  <Settings2 className="w-4 h-4" />
                  {pick('ওয়েটেজ কনফিগার করুন', 'Configure Weights Now')}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-base">
              <thead>
                <tr className="border-b border-border bg-surface-muted/70 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3 text-center w-16">{pick('মেধা', 'Merit')}</th>
                  <th className="px-3 py-3 text-center w-16">{pick('রোল', 'Roll')}</th>
                  <th className="px-4 py-3 text-left">{pick('শিক্ষার্থী ও শাখা', 'Student & Section')}</th>
                  {activeConfigs.map((cfg) => (
                    <th key={cfg.id} className="px-3 py-3 text-center">
                      <div>{cfg.sourceExamName}</div>
                      <div className="text-xs font-semibold text-primary normal-case">
                        ({formatNumber(cfg.weightagePercentage, locale)}%)
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right">{pick('সমন্বিত নম্বর', 'Weighted Marks')}</th>
                  <th className="px-3 py-3 text-right">{pick('চূড়ান্ত GPA', 'Final GPA')}</th>
                  <th className="px-3 py-3 text-center">{pick('গ্রেড', 'Grade')}</th>
                  <th className="px-4 py-3 text-center">{pick('অবস্থা', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {filteredRows.map((row) => (
                  <tr key={row.enrollmentId} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="px-4 py-3 text-center">
                      {row.merit ? (
                        <span
                          className={`inline-flex items-center justify-center min-w-[2.1rem] px-2.5 py-0.5 rounded-lg text-sm font-semibold ${
                            row.merit <= 3
                              ? 'bg-warning/15 text-warning border border-warning/30'
                              : 'bg-surface-muted text-foreground'
                          }`}
                        >
                          #{formatNumber(row.merit, locale)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-medium">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center font-medium text-foreground">
                      {formatNumber(row.roll, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{row.studentName}</div>
                      <div className="text-sm text-muted-foreground font-medium">
                        <span className="font-mono">{row.studentId}</span> · {pick('শাখা', 'Sec')}: {row.sectionName}
                        {row.groupName ? ` · ${row.groupName}` : ''}
                      </div>
                    </td>
                    {activeConfigs.map((cfg) => {
                      const sc = row.sourceScores[cfg.sourceExamId];
                      return (
                        <td key={cfg.id} className="px-3 py-3 text-center">
                          {!sc || sc.marks === null ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-warning/10 text-warning border border-warning/25">
                              {pick('ফলাফল নেই', 'Missing')}
                            </span>
                          ) : (
                            <div>
                              <span className="font-medium text-foreground">
                                {formatNumber(sc.marks, locale)}
                              </span>
                              <div
                                className={`text-sm ${
                                  sc.status === ResultStatus.PASS ? 'text-muted-foreground font-medium' : 'text-destructive font-semibold'
                                }`}
                              >
                                GPA {formatNumber(sc.gpa ?? 0, locale, 2)}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-right font-medium text-foreground">
                      {formatNumber(row.weightedMarks, locale, 1)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-foreground">
                      {formatNumber(row.weightedGpa, locale, 2)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold border ${
                          row.isPassed
                            ? row.letterGrade === 'A+'
                              ? 'bg-success/10 text-success border-success/25'
                              : 'bg-primary/10 text-primary border-primary/25'
                            : 'bg-destructive/10 text-destructive border-destructive/25'
                        }`}
                      >
                        {row.letterGrade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.isPassed ? (
                        <StatusBadge value="PASS" customTone="success" customLabel={pick('উত্তীর্ণ', 'PASS')} />
                      ) : row.isIncomplete ? (
                        <StatusBadge value="INCOMPLETE" customTone="warning" customLabel={pick('অসম্পূর্ণ', 'INCOMPLETE')} />
                      ) : (
                        <StatusBadge value="FAIL" customTone="destructive" customLabel={pick('অনুত্তীর্ণ', 'FAIL')} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Weightage Configuration Modal */}
      <Modal
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title={pick('উৎস পরীক্ষা ও ওয়েটেজ কনফিগারেশন', 'Source Exam Weightage Configuration')}
        description={
          selectedExam
            ? `${selectedExam.name} — ${locale === 'bn' ? selectedClass?.nameBn : selectedClass?.name}`
            : undefined
        }
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-md bg-surface-muted border border-border text-xs">
            <span className="text-foreground font-medium">
              {pick(
                'অন্তত ২টি পরীক্ষা নির্বাচন করুন এবং মোট ওয়েটেজ ঠিক ১০০% নির্ধারণ করুন।',
                'Select at least 2 source exams and ensure the total weightage equals exactly 100%.'
              )}
            </span>
            <StatusBadge
              value="DRAFT_TOTAL"
              customTone={draftWeightTotal === 100 ? 'success' : 'destructive'}
              customLabel={`${pick('বর্তমান মোট:', 'Current Total:')} ${formatNumber(draftWeightTotal, locale)}%`}
            />
          </div>

          {eligibleSourceExams.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-md">
              {pick(
                'এই শ্রেণি ও শিক্ষাবর্ষে কোনো সাধারণ পরীক্ষা পাওয়া যায়নি। আগে অন্তত ২টি পরীক্ষা তৈরি করুন।',
                'No regular examinations found for this class and academic year. Create at least 2 exams first.'
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {eligibleSourceExams.map((ex) => {
                const entry = weightDraft[ex.id] ?? { enabled: false, weight: 0 };
                const resCount = db.resultSummaries.filter((r) => r.examId === ex.id).length;
                return (
                  <div
                    key={ex.id}
                    className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-md border transition-colors ${
                      entry.enabled ? 'border-primary/40 bg-primary/5' : 'border-border bg-surface'
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-[200px]">
                      <input
                        type="checkbox"
                        checked={entry.enabled}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setWeightDraft((prev) => ({
                            ...prev,
                            [ex.id]: {
                              enabled: checked,
                              weight: checked ? (prev[ex.id]?.weight || 50) : 0,
                            },
                          }));
                        }}
                        className="w-4 h-4 rounded border-border accent-primary"
                      />
                      <div>
                        <div className="font-semibold text-sm text-foreground">{ex.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {pick('প্রক্রিয়াকৃত ফলাফল:', 'Processed Results:')}{' '}
                          {formatNumber(resCount, locale)}
                        </div>
                      </div>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        disabled={!entry.enabled}
                        value={entry.weight}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                          setWeightDraft((prev) => ({
                            ...prev,
                            [ex.id]: { ...entry, weight: val },
                          }));
                        }}
                        className="w-20 h-9 px-2.5 text-sm font-semibold text-right tabular-nums rounded-md border border-border bg-surface disabled:bg-surface-muted disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
                      />
                      <span className="text-xs font-bold text-muted-foreground">%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {eligibleSourceExams.length >= 2 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">{pick('দ্রুত অনুপাত:', 'Quick Presets:')}</span>
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
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={savingConfig || draftSelectedItems.length < 2 || draftWeightTotal !== 100}
              onClick={handleSaveConfig}
            >
              {pick('ওয়েটেজ সংরক্ষণ করুন', 'Save Weightage Config')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create New Consolidated Exam Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={pick('নতুন সমন্বিত ফলাফল পরীক্ষা তৈরি করুন', 'Create New Consolidated Examination')}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <FormField label={pick('সমন্বিত পরীক্ষার নাম', 'Consolidated Exam Title')} required>
            <Input
              placeholder={pick('যেমন: বার্ষিক সমন্বিত চূড়ান্ত ফলাফল ২০২৬', 'e.g., Annual Consolidated Result 2026')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </FormField>
          <FormField label={pick('শ্রেণি', 'Class')} required>
            <Select value={newClassId} onChange={(e) => setNewClassId(e.target.value)}>
              {db.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === 'bn' ? c.nameBn : c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={pick('শিক্ষাবর্ষ', 'Academic Year')} required>
            <Select value={newYearId} onChange={(e) => setNewYearId(e.target.value)}>
              {db.academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button variant="primary" disabled={creatingExam} onClick={handleCreateConsolidated}>
              {pick('তৈরি করুন', 'Create Exam')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Institutional Landscape A4 Consolidated Print Modal */}
      <Modal
        open={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title={pick('সমন্বিত চূড়ান্ত ফলাফল শিট (ল্যান্ডস্কেপ A4)', 'Consolidated Final Result Sheet (Landscape A4)')}
        maxWidth="max-w-6xl"
      >
        {selectedExam && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPrintModal(false)}>
                {pick('বন্ধ করুন', 'Close')}
              </Button>
              <Button variant="primary" size="sm" onClick={() => triggerPrint()}>
                <Printer className="w-4 h-4" />
                {pick('ল্যান্ডস্কেপ A4 প্রিন্ট করুন', 'Print Landscape A4')}
              </Button>
            </div>
            <div className="overflow-x-auto pb-2">
              <PrintableConsolidatedResultSheet
                school={db.schoolProfile}
                title={selectedExam.name}
                className={locale === 'bn' ? selectedClass?.nameBn || selectedClass?.name || '' : selectedClass?.name || ''}
                academicYear={selectedYear?.name ?? '2026'}
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
