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
      warnings.push(`০% থেকে ${sorted[0].minPercentage}% পর্যন্ত কোনো গ্রেড নেই।`);
    }
    if (sorted[sorted.length - 1].maxPercentage < 100) {
      warnings.push(`${sorted[sorted.length - 1].maxPercentage}% থেকে ১০০% পর্যন্ত কোনো গ্রেড নেই।`);
    }
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].minPercentage <= sorted[i - 1].maxPercentage) {
        warnings.push(
          `${sorted[i - 1].letterGrade} এবং ${sorted[i].letterGrade} এর শতকরা সীমা ওভারল্যাপ করছে।`
        );
      }
    }
    return warnings;
  }, [ranges]);

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
      toast.error('গ্রেডিং স্কেল সংরক্ষণ ব্যর্থ হয়েছে।');
      return;
    }
    if ('data' in res && res.data?.id) {
      setSelectedScaleId(res.data.id);
    }
    toast.success('গ্রেডিং স্কেল সংরক্ষিত হয়েছে।');
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
      toast.error(msg || 'গ্রেড ব্যান্ড সংরক্ষণ ব্যর্থ হয়েছে।');
      return;
    }
    toast.success('গ্রেড ব্যান্ড হালনাগাদ হয়েছে।');
    setRangeModalOpen(false);
  };

  const handleDeleteRange = async () => {
    if (!deleteRangeTarget) return;
    await deleteRange({ id: deleteRangeTarget.id });
    toast.success('গ্রেড ব্যান্ড অপসারণ করা হয়েছে।');
    setDeleteRangeTarget(null);
  };

  const handleArchiveScale = async () => {
    if (activeScale.isSystemDefault) {
      toast.error('সিস্টেম ডিফল্ট গ্রেডিং স্কেল আর্কাইভ করা যাবে না।');
      return;
    }
    await toggleArchive({ collection: 'gradingScales', id: activeScale.id });
    toast.success(
      activeScale.isDeleted
        ? 'স্কেল পুনরুদ্ধার করা হয়েছে।'
        : 'স্কেল আর্কাইভ করা হয়েছে।'
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
              {'নতুন স্কেল তৈরি'}
            </Button>
            <Button onClick={openAddRange} className="whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" />
              {'গ্রেড ব্যান্ড যুক্ত করুন'}
            </Button>
          </div>
        }
      />

      {/* Scale Selector & Metadata */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[260px] space-y-2">
            <label className="block text-sm text-muted-foreground">
              {'সক্রিয় গ্রেডিং স্কেল নির্বাচন করুন'}
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
                    {gs.isDefault ? ` (${'ডিফল্ট'})` : ''}
                    {gs.isDeleted ? ` [${'আর্কাইভ'}]` : ''}
                  </option>
                ))}
              </Select>
              <Button variant="outline" size="sm" onClick={() => openEditScale(activeScale)}>
                <Edit3 className="w-3.5 h-3.5" />
                {'স্কেল সম্পাদনা'}
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
              <p className="text-sm text-muted-foreground">{activeScale.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span>
            {`নীতি: কোনো আবশ্যিক বিষয়ে (লিখিত / MCQ / ব্যবহারিক / CA) ফেল করলে সার্বিক ফলাফল F (০.০০)। ৪র্থ বিষয়ে GP ${formatNumber(activeScale.optionalBonusThreshold ?? 2.0, 'bn', 2)}-এর অতিরিক্ত পয়েন্ট আবশ্যিক মোট জিপি-র সাথে যোগ হয়।`}
          </span>
        </div>
      </Card>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'সর্বোচ্চ জিপিএ ও স্কেল'}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-primary">
            GPA {formatNumber(activeScale.maxGpa, 'bn', 2)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground truncate">
            {activeScale.name}
            {activeScale.isDefault ? ` (${'ডিফল্ট'})` : ''}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'গ্রেড স্তর ও শতকরা বিস্তার'}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(ranges.length, 'bn')}{' '}
            <span className="text-sm font-semibold text-muted-foreground">{'টি স্তর'}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums truncate">
            {ranges.length > 0
              ? `${ranges[0].letterGrade} (${formatNumber(ranges[0].minPercentage, 'bn')}%) ${'থেকে'} ${ranges[ranges.length - 1].letterGrade}`
              : 'কোনো রেঞ্জ নেই'}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'৪র্থ বিষয় বোনাস সীমা'}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            &gt; {formatNumber(activeScale.optionalBonusThreshold ?? 2.0, 'bn', 2)}{' '}
            <span className="text-sm font-semibold text-muted-foreground">GP</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground truncate">
            {`অতিরিক্ত পয়েন্ট যোগ (সর্বোচ্চ ${formatNumber(activeScale.maxGpa, 'bn', 2)})`}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'সংযুক্ত পরীক্ষা ও স্থিতি'}
          </p>
          <p
            className={cn(
              'mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums',
              activeScale.isDeleted ? 'text-destructive' : 'text-success'
            )}
          >
            {formatNumber(linkedExams.length, 'bn')}{' '}
            <span className="text-sm font-semibold text-muted-foreground">{'টি পরীক্ষা'}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground truncate">
            {activeScale.isDeleted
              ? 'আর্কাইভকৃত স্কেল'
              : activeScale.isSystemDefault
                ? 'সিস্টেম জাতীয় মানদণ্ড'
                : 'কাস্টম স্কেল'}
          </p>
        </Card>
      </div>

      {/* Range Overlap / Gap Warnings */}
      {rangeWarnings.length > 0 && (
        <div className="p-3.5 rounded-[var(--radius)] border border-warning/40 bg-warning/10 text-sm space-y-1">
          <div className="font-semibold text-warning flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            {'গ্রেড সীমা সতর্কতা'}
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
          <table className="w-full text-base">
            <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border text-sm">
              <tr>
                <th className="px-4 py-3 text-left">{'শতকরা নম্বর সীমা (%)'}</th>
                <th className="px-4 py-3 text-center">{'লেটার গ্রেড'}</th>
                <th className="px-4 py-3 text-right">{'গ্রেড পয়েন্ট (GP)'}</th>
                <th className="px-4 py-3 text-left">{'মন্তব্য'}</th>
                <th className="px-4 py-3 text-center">{'ফলাফল ধরন'}</th>
                <th className="px-4 py-3 text-right">{'অ্যাকশন'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {ranges.map((r) => (
                <tr key={r.id} className="hover:bg-surface-muted/40">
                  <td className="px-4 py-3 font-medium">
                    {formatNumber(r.minPercentage, 'bn')}% – {formatNumber(r.maxPercentage, 'bn')}%
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-foreground">{r.letterGrade}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatNumber(r.gradePoint, 'bn', 2)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{r.remarks || '—'}</td>
                  <td className="px-4 py-3 text-center text-sm font-semibold">
                    <span className={r.isFailGrade ? 'text-destructive' : 'text-success'}>
                      {r.isFailGrade ? 'অকৃতকার্য (Fail)' : 'কৃতকার্য (Pass)'}
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
              {'লাইভ GPA ক্যালকুলেশন সিমুলেটর (স্কেল যাচাই)'}
            </h3>
          </div>
          {simulatedGpa && (
            <div className="text-sm tabular-nums flex items-center gap-4">
              <span className="text-muted-foreground">
                {'৪র্থ ছাড়া:'}{' '}
                <strong className="text-foreground">{formatNumber(simulatedGpa.gpaWithoutOptional, 'bn', 2)}</strong>
              </span>
              <span className="text-muted-foreground">
                {'চূড়ান্ত GPA:'}{' '}
                <strong className={simulatedGpa.isPassed ? 'text-primary text-base' : 'text-destructive text-base'}>
                  {formatNumber(simulatedGpa.gpa, 'bn', 2)} ({simulatedGpa.letterGrade})
                </strong>
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {simCompulsory.map((val, idx) => (
            <div key={idx}>
              <label className="block text-sm text-muted-foreground mb-1">
                {`আবশ্যিক #${formatNumber(idx + 1, 'bn')}`}
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
                    {formatNumber(gp, 'bn', 2)}
                  </option>
                ))}
              </Select>
            </div>
          ))}
          <div>
            <label className="block text-sm text-primary font-semibold mb-1">
              {'৪র্থ / ঐচ্ছিক'}
            </label>
            <Select value={String(simOptional)} onChange={(e) => setSimOptional(Number(e.target.value))}>
              {validGps.map((gp) => (
                <option key={gp} value={gp}>
                  {formatNumber(gp, 'bn', 2)}
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
            ? 'গ্রেডিং স্কেল সম্পাদনা'
            : 'নতুন গ্রেডিং স্কেল তৈরি করুন'
        }
        size="md"
      >
        <form onSubmit={handleSaveScale} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{'স্কেলের নাম *'}</label>
            <Input
              required
              value={scaleForm.name}
              onChange={(e) => setScaleForm({ ...scaleForm, name: e.target.value })}
              placeholder={'যেমন: NCTB Secondary 5.00 Scale'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{'বিবরণ'}</label>
            <Input placeholder="বিবরণ লিখুন"
              value={scaleForm.description}
              onChange={(e) => setScaleForm({ ...scaleForm, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{'সর্বোচ্চ GPA *'}</label>
              <Input placeholder="সর্বোচ্চ GPA লিখুন"
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
                {'৪র্থ বিষয় বোনাস সীমা (GP)'}
              </label>
              <Input placeholder="৪র্থ বিষয় বোনাস সীমা (GP) লিখুন"
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
            <span>{'ডিফল্ট গ্রেডিং স্কেল হিসেবে সেট করুন'}</span>
          </label>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setScaleModalOpen(false)}>
              {'বাতিল'}
            </Button>
            <Button type="submit" disabled={savingScale}>
              <CheckCircle2 className="w-4 h-4" />
              {'সংরক্ষণ করুন'}
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
            ? 'গ্রেড ব্যান্ড সম্পাদনা'
            : 'নতুন গ্রেড ব্যান্ড যুক্ত করুন'
        }
        size="md"
      >
        <form onSubmit={handleSaveRange} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{'সর্বনিম্ন % *'}</label>
              <Input placeholder="সর্বনিম্ন % লিখুন"
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
              <label className="block text-sm font-medium mb-1">{'সর্বোচ্চ % *'}</label>
              <Input placeholder="সর্বোচ্চ % লিখুন"
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
              <label className="block text-sm font-medium mb-1">{'লেটার গ্রেড *'}</label>
              <Input
                required
                value={rangeForm.letterGrade}
                onChange={(e) => setRangeForm({ ...rangeForm, letterGrade: e.target.value })}
                placeholder="A+"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{'গ্রেড পয়েন্ট *'}</label>
              <Input placeholder="গ্রেড পয়েন্ট লিখুন"
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
              <label className="block text-sm font-medium mb-1">{'মন্তব্য'}</label>
              <Input
                value={rangeForm.remarks}
                onChange={(e) => setRangeForm({ ...rangeForm, remarks: e.target.value })}
                placeholder={'অসাধারণ / Outstanding'}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={rangeForm.isFailGrade}
              onChange={(e) => setRangeForm({ ...rangeForm, isFailGrade: e.target.checked })}
            />
            <span>{'অকৃতকার্য (Fail) গ্রেড হিসেবে চিহ্নিত করুন'}</span>
          </label>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setRangeModalOpen(false)}>
              {'বাতিল'}
            </Button>
            <Button type="submit" disabled={savingRange}>
              {'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteRangeTarget)}
        onClose={() => setDeleteRangeTarget(null)}
        onConfirm={handleDeleteRange}
        title={'গ্রেড ব্যান্ড অপসারণ'}
        description={`আপনি কি "${deleteRangeTarget?.letterGrade}" গ্রেড ব্যান্ডটি মুছে ফেলতে চান?`}
        confirmLabel={'মুছে ফেলুন'}
        destructive
      />
    </div>
  );
}
