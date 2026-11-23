'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Calculator,
  CheckCircle2,
  Edit3,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useDeleteGradeRangeMutation,
  useGetBootstrapQuery,
  useToggleArchiveMutation,
  useUpsertGradeRangeMutation,
  useUpsertGradingScaleMutation,
} from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import {
  ConfirmDialog,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import { calculateOverallGpa, formatNumber } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils/cn';
import type { GradeRange, GradingScale } from '@/src/types/entities';

export function GradingScalesView() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [upsertScale, { isLoading: savingScale }] = useUpsertGradingScaleMutation();
  const [upsertRange, { isLoading: savingRange }] = useUpsertGradeRangeMutation();
  const [deleteRange] = useDeleteGradeRangeMutation();
  const [toggleArchive] = useToggleArchiveMutation();

  const [selectedScaleId, setSelectedScaleId] = useState('gs-nctb-5');
  const [scaleModalOpen, setScaleModalOpen] = useState(false);
  const [editingScale, setEditingScale] = useState<GradingScale | null>(null);

  const [rangeModalOpen, setRangeModalOpen] = useState(false);
  const [editingRange, setEditingRange] = useState<GradeRange | null>(null);
  const [deleteRangeTarget, setDeleteRangeTarget] = useState<GradeRange | null>(null);

  // Interactive NCTB GPA Simulator state
  const [simCompulsory, setSimCompulsory] = useState([5.0, 4.0, 5.0, 4.0, 3.5, 5.0]);
  const [simOptional, setSimOptional] = useState(5.0);

  const [scaleForm, setScaleForm] = useState({
    name: '',
    description: '',
    maxGpa: 5.0,
    optionalBonusThreshold: 2.0,
    isDefault: false,
  });

  const [rangeForm, setRangeForm] = useState({
    minPercentage: 80,
    maxPercentage: 100,
    letterGrade: 'A+',
    gradePoint: 5.0,
    remarks: '',
    isFailGrade: false,
  });

  const activeScale = useMemo(() => {
    if (!db) return null;
    return (
      db.gradingScales.find((g) => g.id === selectedScaleId) ??
      db.gradingScales.find((g) => !g.isDeleted) ??
      db.gradingScales[0] ??
      null
    );
  }, [db, selectedScaleId]);

  const ranges = useMemo(() => {
    if (!db || !activeScale) return [];
    return db.gradeRanges
      .filter((r) => r.gradingScaleId === activeScale.id && !r.isDeleted)
      .sort((a, b) => b.minPercentage - a.minPercentage);
  }, [db, activeScale]);

  const linkedExams = useMemo(() => {
    if (!db || !activeScale) return [];
    return db.exams.filter((e) => e.gradingScaleId === activeScale.id && !e.isDeleted);
  }, [db, activeScale]);

  // Check range overlaps or missing coverage
  const rangeWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (ranges.length === 0) return warnings;
    const sorted = [...ranges].sort((a, b) => a.minPercentage - b.minPercentage);
    if (sorted[0].minPercentage > 0) {
      warnings.push(pick(`০% থেকে ${sorted[0].minPercentage}% পর্যন্ত কোনো গ্রেড নেই।`, `Gap between 0% and ${sorted[0].minPercentage}%.`));
    }
    if (sorted[sorted.length - 1].maxPercentage < 100) {
      warnings.push(pick(`${sorted[sorted.length - 1].maxPercentage}% থেকে ১০০% পর্যন্ত কোনো গ্রেড নেই।`, `Gap between ${sorted[sorted.length - 1].maxPercentage}% and 100%.`));
    }
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].minPercentage <= sorted[i - 1].maxPercentage) {
        warnings.push(
          pick(
            `${sorted[i - 1].letterGrade} এবং ${sorted[i].letterGrade} এর শতকরা সীমা ওভারল্যাপ করছে।`,
            `Percentage range overlaps between ${sorted[i - 1].letterGrade} and ${sorted[i].letterGrade}.`
          )
        );
      }
    }
    return warnings;
  }, [ranges, pick]);

  const simulatedGpa = useMemo(() => {
    if (!activeScale || ranges.length === 0) return null;
    return calculateOverallGpa(
      [
        ...simCompulsory.map((gp) => ({ gradePoint: gp, isPassed: gp > 0, isOptional: false })),
        { gradePoint: simOptional, isPassed: simOptional > 0, isOptional: true },
      ],
      activeScale,
      ranges
    );
  }, [activeScale, ranges, simCompulsory, simOptional]);

  if (isLoading || !db || !activeScale) return <LoadingSkeleton rows={5} />;

  const openCreateScale = () => {
    setEditingScale(null);
    setScaleForm({
      name: '',
      description: '',
      maxGpa: 5.0,
      optionalBonusThreshold: 2.0,
      isDefault: false,
    });
    setScaleModalOpen(true);
  };

  const openEditScale = (scale: GradingScale) => {
    setEditingScale(scale);
    setScaleForm({
      name: scale.name,
      description: scale.description ?? '',
      maxGpa: scale.maxGpa,
      optionalBonusThreshold: scale.optionalBonusThreshold ?? 2.0,
      isDefault: scale.isDefault,
    });
    setScaleModalOpen(true);
  };

  const handleSaveScale = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await upsertScale({
      id: editingScale?.id,
      name: scaleForm.name.trim(),
      description: scaleForm.description.trim() || null,
      maxGpa: Number(scaleForm.maxGpa),
      optionalBonusThreshold: Number(scaleForm.optionalBonusThreshold),
      isDefault: scaleForm.isDefault,
    });
    if ('error' in res) {
      toast.error(pick('গ্রেডিং স্কেল সংরক্ষণ ব্যর্থ হয়েছে।', 'Failed to save grading scale.'));
      return;
    }
    if ('data' in res && res.data?.id) {
      setSelectedScaleId(res.data.id);
    }
    toast.success(pick('গ্রেডিং স্কেল সংরক্ষিত হয়েছে।', 'Grading scale saved.'));
    setScaleModalOpen(false);
  };

  const openAddRange = () => {
    setEditingRange(null);
    setRangeForm({
      minPercentage: 80,
      maxPercentage: 100,
      letterGrade: 'A+',
      gradePoint: 5.0,
      remarks: '',
      isFailGrade: false,
    });
    setRangeModalOpen(true);
  };

  const openEditRange = (r: GradeRange) => {
    setEditingRange(r);
    setRangeForm({
      minPercentage: r.minPercentage,
      maxPercentage: r.maxPercentage,
      letterGrade: r.letterGrade,
      gradePoint: r.gradePoint,
      remarks: r.remarks ?? '',
      isFailGrade: r.isFailGrade,
    });
    setRangeModalOpen(true);
  };

  const handleSaveRange = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await upsertRange({
      id: editingRange?.id,
      gradingScaleId: activeScale.id,
      minPercentage: Number(rangeForm.minPercentage),
      maxPercentage: Number(rangeForm.maxPercentage),
      letterGrade: rangeForm.letterGrade.trim(),
      gradePoint: Number(rangeForm.gradePoint),
      remarks: rangeForm.remarks.trim() || null,
      isFailGrade: rangeForm.isFailGrade,
    });
    if ('error' in res) {
      const msg = (res.error as { message?: string })?.message;
      toast.error(msg || pick('গ্রেড ব্যান্ড সংরক্ষণ ব্যর্থ হয়েছে।', 'Failed to save grade range.'));
      return;
    }
    toast.success(pick('গ্রেড ব্যান্ড হালনাগাদ হয়েছে।', 'Grade band saved.'));
    setRangeModalOpen(false);
  };

  const handleDeleteRange = async () => {
    if (!deleteRangeTarget) return;
    await deleteRange({ id: deleteRangeTarget.id });
    toast.success(pick('গ্রেড ব্যান্ড অপসারণ করা হয়েছে।', 'Grade band removed.'));
    setDeleteRangeTarget(null);
  };

  const handleArchiveScale = async () => {
    if (activeScale.isSystemDefault) {
      toast.error(pick('সিস্টেম ডিফল্ট গ্রেডিং স্কেল আর্কাইভ করা যাবে না।', 'System default scale cannot be archived.'));
      return;
    }
    await toggleArchive({ collection: 'gradingScales', id: activeScale.id });
    toast.success(
      activeScale.isDeleted
        ? pick('স্কেল পুনরুদ্ধার করা হয়েছে।', 'Grading scale restored.')
        : pick('স্কেল আর্কাইভ করা হয়েছে।', 'Grading scale archived.')
    );
  };

  const validGps = [...new Set(ranges.map((r) => r.gradePoint))].sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <PageHeader
        titleBn="গ্রেডিং স্কেল ও এনসিটিবি জিপিএ নীতি"
        titleEn="Grading Scales & NCTB GPA Policy"
        subtitleBn="শিক্ষা বোর্ড অনুসৃত ৫.০০ স্কেল, শতকরা নম্বর ব্যান্ড এবং ৪র্থ বিষয়ের বোনাস জিপি নীতি সম্পূর্ণভাবে কনফিগার করুন।"
        subtitleEn="Manage school grading scales, percentage-to-grade bands, and 4th-subject bonus GP policies."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={openCreateScale} className="whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" />
              {pick('নতুন স্কেল তৈরি', 'New Scale')}
            </Button>
            <Button onClick={openAddRange} className="whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" />
              {pick('গ্রেড ব্যান্ড যুক্ত করুন', 'Add Grade Band')}
            </Button>
          </div>
        }
      />

      {/* Scale Selector & Metadata */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[260px] space-y-2">
            <label className="block text-xs text-muted-foreground">
              {pick('সক্রিয় গ্রেডিং স্কেল নির্বাচন করুন', 'Select Grading Scale')}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={activeScale.id}
                onChange={(e) => setSelectedScaleId(e.target.value)}
                className="w-full sm:w-96"
              >
                {db.gradingScales.map((gs) => (
                  <option key={gs.id} value={gs.id}>
                    {gs.name}
                    {gs.isDefault ? ` (${pick('ডিফল্ট', 'Default')})` : ''}
                    {gs.isDeleted ? ` [${pick('আর্কাইভ', 'Archived')}]` : ''}
                  </option>
                ))}
              </Select>
              <Button variant="outline" size="sm" onClick={() => openEditScale(activeScale)}>
                <Edit3 className="w-3.5 h-3.5" />
                {pick('স্কেল সম্পাদনা', 'Edit Scale')}
              </Button>
              {!activeScale.isSystemDefault && (
                <Button variant="ghost" size="sm" onClick={handleArchiveScale}>
                  {activeScale.isDeleted ? (
                    <RotateCcw className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Archive className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </Button>
              )}
            </div>
            {activeScale.description && (
              <p className="text-xs text-muted-foreground">{activeScale.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span>
            {pick(
              `নীতি: কোনো আবশ্যিক বিষয়ে (লিখিত / MCQ / ব্যবহারিক / CA) ফেল করলে সার্বিক ফলাফল F (০.০০)। ৪র্থ বিষয়ে GP ${formatNumber(activeScale.optionalBonusThreshold ?? 2.0, locale, 2)}-এর অতিরিক্ত পয়েন্ট আবশ্যিক মোট জিপি-র সাথে যোগ হয়।`,
              `Policy: Failing any compulsory subject component results in overall F (0.00). Optional 4th-subject points above ${formatNumber(activeScale.optionalBonusThreshold ?? 2.0, locale, 2)} add to compulsory GP sum, capped at ${formatNumber(activeScale.maxGpa, locale, 2)}.`
            )}
          </span>
        </div>
      </Card>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('সর্বোচ্চ জিপিএ ও স্কেল', 'Max GPA & Scale')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-primary">
            GPA {formatNumber(activeScale.maxGpa, locale, 2)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground truncate">
            {activeScale.name}
            {activeScale.isDefault ? ` (${pick('ডিফল্ট', 'Default')})` : ''}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('গ্রেড স্তর ও শতকরা বিস্তার', 'Grade Tiers & Range')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(ranges.length, locale)}{' '}
            <span className="text-sm font-semibold text-muted-foreground">{pick('টি স্তর', 'tiers')}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums truncate">
            {ranges.length > 0
              ? `${ranges[0].letterGrade} (${formatNumber(ranges[0].minPercentage, locale)}%) ${pick('থেকে', 'to')} ${ranges[ranges.length - 1].letterGrade}`
              : pick('কোনো রেঞ্জ নেই', 'No ranges')}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('৪র্থ বিষয় বোনাস সীমা', '4th Subj. Bonus Threshold')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            &gt; {formatNumber(activeScale.optionalBonusThreshold ?? 2.0, locale, 2)}{' '}
            <span className="text-sm font-semibold text-muted-foreground">GP</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground truncate">
            {pick(
              `অতিরিক্ত পয়েন্ট যোগ (সর্বোচ্চ ${formatNumber(activeScale.maxGpa, locale, 2)})`,
              `Surplus GP added (Cap ${activeScale.maxGpa})`
            )}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('সংযুক্ত পরীক্ষা ও স্থিতি', 'Linked Exams & Status')}
          </p>
          <p
            className={cn(
              'mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums',
              activeScale.isDeleted ? 'text-destructive' : 'text-success'
            )}
          >
            {formatNumber(linkedExams.length, locale)}{' '}
            <span className="text-sm font-semibold text-muted-foreground">{pick('টি পরীক্ষা', 'exams')}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground truncate">
            {activeScale.isDeleted
              ? pick('আর্কাইভকৃত স্কেল', 'Archived')
              : activeScale.isSystemDefault
                ? pick('সিস্টেম জাতীয় মানদণ্ড', 'National Standard')
                : pick('কাস্টম স্কেল', 'Custom Scale')}
          </p>
        </Card>
      </div>

      {/* Range Overlap / Gap Warnings */}
      {rangeWarnings.length > 0 && (
        <div className="p-3.5 rounded-[var(--radius)] border border-warning/40 bg-warning/10 text-xs space-y-1">
          <div className="font-semibold text-warning flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            {pick('গ্রেড সীমা সতর্কতা', 'Grade Range Coverage Warning')}
          </div>
          {rangeWarnings.map((w, i) => (
            <p key={i} className="text-foreground">
              • {w}
            </p>
          ))}
        </div>
      )}

      {/* Grade Ranges Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border text-xs">
              <tr>
                <th className="px-4 py-3 text-left">{pick('শতকরা নম্বর সীমা (%)', 'Percentage Range (%)')}</th>
                <th className="px-4 py-3 text-center">{pick('লেটার গ্রেড', 'Letter Grade')}</th>
                <th className="px-4 py-3 text-right">{pick('গ্রেড পয়েন্ট (GP)', 'Grade Point')}</th>
                <th className="px-4 py-3 text-left">{pick('মন্তব্য', 'Remarks')}</th>
                <th className="px-4 py-3 text-center">{pick('ফলাফল ধরন', 'Pass / Fail')}</th>
                <th className="px-4 py-3 text-right">{pick('অ্যাকশন', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {ranges.map((r) => (
                <tr key={r.id} className="hover:bg-surface-muted/40">
                  <td className="px-4 py-3 font-medium">
                    {formatNumber(r.minPercentage, locale)}% – {formatNumber(r.maxPercentage, locale)}%
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-foreground">{r.letterGrade}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatNumber(r.gradePoint, locale, 2)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{r.remarks || '—'}</td>
                  <td className="px-4 py-3 text-center text-xs font-semibold">
                    <span className={r.isFailGrade ? 'text-destructive' : 'text-success'}>
                      {r.isFailGrade ? pick('অকৃতকার্য (Fail)', 'Fail Grade') : pick('কৃতকার্য (Pass)', 'Pass Grade')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditRange(r)}>
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteRangeTarget(r)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Live NCTB GPA Formula Simulator */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">
              {pick('লাইভ GPA ক্যালকুলেশন সিমুলেটর (স্কেল যাচাই)', 'Live GPA Policy Simulator')}
            </h3>
          </div>
          {simulatedGpa && (
            <div className="text-sm tabular-nums flex items-center gap-4">
              <span className="text-muted-foreground">
                {pick('৪র্থ ছাড়া:', 'w/o 4th:')}{' '}
                <strong className="text-foreground">{formatNumber(simulatedGpa.gpaWithoutOptional, locale, 2)}</strong>
              </span>
              <span className="text-muted-foreground">
                {pick('চূড়ান্ত GPA:', 'Final GPA:')}{' '}
                <strong className={simulatedGpa.isPassed ? 'text-primary text-base' : 'text-destructive text-base'}>
                  {formatNumber(simulatedGpa.gpa, locale, 2)} ({simulatedGpa.letterGrade})
                </strong>
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {simCompulsory.map((val, idx) => (
            <div key={idx}>
              <label className="block text-xs text-muted-foreground mb-1">
                {pick(`আবশ্যিক #${formatNumber(idx + 1, locale)}`, `Compulsory #${idx + 1}`)}
              </label>
              <Select
                value={String(val)}
                onChange={(e) => {
                  const next = [...simCompulsory];
                  next[idx] = Number(e.target.value);
                  setSimCompulsory(next);
                }}
              >
                {validGps.map((gp) => (
                  <option key={gp} value={gp}>
                    {formatNumber(gp, locale, 2)}
                  </option>
                ))}
              </Select>
            </div>
          ))}
          <div>
            <label className="block text-xs text-primary font-semibold mb-1">
              {pick('৪র্থ / ঐচ্ছিক', '4th / Optional')}
            </label>
            <Select value={String(simOptional)} onChange={(e) => setSimOptional(Number(e.target.value))}>
              {validGps.map((gp) => (
                <option key={gp} value={gp}>
                  {formatNumber(gp, locale, 2)}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Upsert Grading Scale Modal */}
      <Modal
        open={scaleModalOpen}
        onClose={() => setScaleModalOpen(false)}
        title={
          editingScale
            ? pick('গ্রেডিং স্কেল সম্পাদনা', 'Edit Grading Scale')
            : pick('নতুন গ্রেডিং স্কেল তৈরি করুন', 'Create Grading Scale')
        }
        size="md"
      >
        <form onSubmit={handleSaveScale} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{pick('স্কেলের নাম *', 'Scale Name *')}</label>
            <Input
              required
              value={scaleForm.name}
              onChange={(e) => setScaleForm({ ...scaleForm, name: e.target.value })}
              placeholder={pick('যেমন: NCTB Secondary 5.00 Scale', 'e.g. NCTB Secondary 5.00 Scale')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{pick('বিবরণ', 'Description')}</label>
            <Input
              value={scaleForm.description}
              onChange={(e) => setScaleForm({ ...scaleForm, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{pick('সর্বোচ্চ GPA *', 'Max GPA *')}</label>
              <Input
                type="number"
                step="0.1"
                min={1}
                max={10}
                required
                value={scaleForm.maxGpa}
                onChange={(e) => setScaleForm({ ...scaleForm, maxGpa: Number(e.target.value) || 5 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {pick('৪র্থ বিষয় বোনাস সীমা (GP)', '4th Subject Bonus Threshold')}
              </label>
              <Input
                type="number"
                step="0.1"
                min={0}
                max={5}
                required
                value={scaleForm.optionalBonusThreshold}
                onChange={(e) =>
                  setScaleForm({ ...scaleForm, optionalBonusThreshold: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={scaleForm.isDefault}
              onChange={(e) => setScaleForm({ ...scaleForm, isDefault: e.target.checked })}
            />
            <span>{pick('ডিফল্ট গ্রেডিং স্কেল হিসেবে সেট করুন', 'Set as default grading scale')}</span>
          </label>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setScaleModalOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button type="submit" disabled={savingScale}>
              <CheckCircle2 className="w-4 h-4" />
              {pick('সংরক্ষণ করুন', 'Save Scale')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upsert Grade Range Modal */}
      <Modal
        open={rangeModalOpen}
        onClose={() => setRangeModalOpen(false)}
        title={
          editingRange
            ? pick('গ্রেড ব্যান্ড সম্পাদনা', 'Edit Grade Band')
            : pick('নতুন গ্রেড ব্যান্ড যুক্ত করুন', 'Add Grade Band')
        }
        size="md"
      >
        <form onSubmit={handleSaveRange} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{pick('সর্বনিম্ন % *', 'Min % *')}</label>
              <Input
                type="number"
                step="0.01"
                min={0}
                max={100}
                required
                value={rangeForm.minPercentage}
                onChange={(e) => setRangeForm({ ...rangeForm, minPercentage: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{pick('সর্বোচ্চ % *', 'Max % *')}</label>
              <Input
                type="number"
                step="0.01"
                min={0}
                max={100}
                required
                value={rangeForm.maxPercentage}
                onChange={(e) => setRangeForm({ ...rangeForm, maxPercentage: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{pick('লেটার গ্রেড *', 'Letter Grade *')}</label>
              <Input
                required
                value={rangeForm.letterGrade}
                onChange={(e) => setRangeForm({ ...rangeForm, letterGrade: e.target.value })}
                placeholder="A+"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{pick('গ্রেড পয়েন্ট *', 'Grade Point *')}</label>
              <Input
                type="number"
                step="0.01"
                min={0}
                max={10}
                required
                value={rangeForm.gradePoint}
                onChange={(e) => setRangeForm({ ...rangeForm, gradePoint: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">{pick('মন্তব্য', 'Remarks')}</label>
              <Input
                value={rangeForm.remarks}
                onChange={(e) => setRangeForm({ ...rangeForm, remarks: e.target.value })}
                placeholder={pick('অসাধারণ / Outstanding', 'Outstanding')}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={rangeForm.isFailGrade}
              onChange={(e) => setRangeForm({ ...rangeForm, isFailGrade: e.target.checked })}
            />
            <span>{pick('অকৃতকার্য (Fail) গ্রেড হিসেবে চিহ্নিত করুন', 'Mark as Fail Grade')}</span>
          </label>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setRangeModalOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button type="submit" disabled={savingRange}>
              {pick('সংরক্ষণ করুন', 'Save Band')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteRangeTarget)}
        onClose={() => setDeleteRangeTarget(null)}
        onConfirm={handleDeleteRange}
        title={pick('গ্রেড ব্যান্ড অপসারণ', 'Delete Grade Band')}
        description={pick(
          `আপনি কি "${deleteRangeTarget?.letterGrade}" গ্রেড ব্যান্ডটি মুছে ফেলতে চান?`,
          `Are you sure you want to remove the "${deleteRangeTarget?.letterGrade}" band?`
        )}
        confirmLabel={pick('মুছে ফেলুন', 'Delete')}
        destructive
      />
    </div>
  );
}
