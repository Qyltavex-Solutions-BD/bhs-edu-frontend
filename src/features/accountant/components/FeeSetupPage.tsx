'use client';

import React, { useMemo, useState } from 'react';
import { FilePlus2, Layers, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';
import { formatNumber } from '@/src/lib/formatters';
import {
  useDeleteFeeStructureMutation,
  useGenerateInvoicesMutation,
  useGetFeeHeadsQuery,
  useGetFeeStructuresQuery,
  useGetFinanceContextQuery,
  useSaveFeeHeadMutation,
  useSaveFeeStructureMutation,
  type FeeFrequency,
} from '../api/finance.api';
import {
  BN_MONTHS_LIST,
  FEE_FREQUENCY_LABELS,
  FinancePaginationBar,
  formatTaka,
} from './finance-ui';

const PAGE_SIZE = 20;

export function FeeSetupPage() {
  const { data: ctx } = useGetFinanceContextQuery();
  const [selectedYearId, setSelectedYearId] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const activeYearId = selectedYearId || ctx?.activeAcademicYear?.id || undefined;

  const { data: feeHeads = [], isLoading: headsLoading } = useGetFeeHeadsQuery();
  const { data: structuresData, isLoading: structsLoading } =
    useGetFeeStructuresQuery({
      academicYearId: activeYearId,
      classId: filterClassId || undefined,
      search: search.trim() || undefined,
      page,
      limit: PAGE_SIZE,
    });
  const feeStructures = structuresData?.items ?? [];
  const structMeta = structuresData?.meta;

  const [saveFeeHead, { isLoading: savingHead }] = useSaveFeeHeadMutation();
  const [saveFeeStructure, { isLoading: savingStruct }] =
    useSaveFeeStructureMutation();
  const [deleteFeeStructure] = useDeleteFeeStructureMutation();
  const [generateInvoices, { isLoading: generating }] =
    useGenerateInvoicesMutation();

  // New Fee Head form
  const [headCode, setHeadCode] = useState('');
  const [headName, setHeadName] = useState('');
  const [headFreq, setHeadFreq] = useState<FeeFrequency>('MONTHLY');
  const [headDesc, setHeadDesc] = useState('');

  // New Fee Structure form
  const [structClassId, setStructClassId] = useState('');
  const [structHeadId, setStructHeadId] = useState('');
  const [structExamId, setStructExamId] = useState('');
  const [structAmount, setStructAmount] = useState('');
  const [structDueDay, setStructDueDay] = useState('10');

  const selectedStructHead = useMemo(
    () => feeHeads.find((h) => h.id === structHeadId) ?? null,
    [feeHeads, structHeadId]
  );

  const yearExams = useMemo(
    () =>
      (ctx?.exams ?? []).filter(
        (ex) => !activeYearId || ex.academicYearId === activeYearId
      ),
    [ctx?.exams, activeYearId]
  );

  // Bulk Invoice Generator form
  const [genStructId, setGenStructId] = useState('');
  const [genMonth, setGenMonth] = useState('01');
  const [genTitle, setGenTitle] = useState('');
  const [genDueDate, setGenDueDate] = useState('');

  const activeStructures = useMemo(
    () => feeStructures.filter((s) => s.isActive),
    [feeStructures]
  );

  async function handleSaveHead(e: React.FormEvent) {
    e.preventDefault();
    if (!headCode.trim() || !headName.trim()) {
      toast.error('ফি কোড এবং ফি খাতের নাম আবশ্যক।');
      return;
    }
    try {
      await saveFeeHead({
        code: headCode.trim().toUpperCase(),
        name: headName.trim(),
        frequency: headFreq,
        description: headDesc.trim() || undefined,
      }).unwrap();
      toast.success('নতুন ফি খাত সফলভাবে সংরক্ষিত হয়েছে।');
      setHeadCode('');
      setHeadName('');
      setHeadDesc('');
    } catch (err: any) {
      toast.error(err?.message || 'ফি খাত সংরক্ষণ করা যায়নি।');
    }
  }

  async function handleSaveStructure(e: React.FormEvent) {
    e.preventDefault();
    if (!structClassId || !structHeadId || !structAmount) {
      toast.error('শ্রেণি, ফি খাত এবং টাকার পরিমাণ নির্বাচন করুন।');
      return;
    }
    try {
      await saveFeeStructure({
        academicYearId: activeYearId,
        classId: structClassId,
        feeHeadId: structHeadId,
        examId: selectedStructHead?.frequency === 'PER_EXAM' ? structExamId || undefined : undefined,
        amount: Number(structAmount),
        dueDay: Number(structDueDay) || 10,
      }).unwrap();
      toast.success('শ্রেণিভিত্তিক ফি কাঠামো সংরক্ষিত হয়েছে।');
      setStructAmount('');
      setStructExamId('');
    } catch (err: any) {
      toast.error(err?.message || 'ফি কাঠামো সংরক্ষণ করা যায়নি।');
    }
  }

  async function handleGenerateInvoices(e: React.FormEvent) {
    e.preventDefault();
    if (!genStructId) {
      toast.error('কোন ফি কাঠামোর জন্য চালান তৈরি করবেন তা নির্বাচন করুন।');
      return;
    }
    const selectedStruct = feeStructures.find((s) => s.id === genStructId);
    const monthLabel =
      BN_MONTHS_LIST.find((m) => m.value === genMonth)?.label ?? '';
    const yearName = ctx?.academicYears.find((y) => y.id === activeYearId)?.name ?? '';
    const monthNum =
      selectedStruct?.feeHead?.frequency === 'MONTHLY'
        ? Number(genMonth)
        : undefined;
    const autoTitle =
      genTitle.trim() ||
      (selectedStruct?.feeHead?.frequency === 'MONTHLY'
        ? `${selectedStruct.feeHead.name} — ${monthLabel} ${yearName}`
        : `${selectedStruct?.feeHead?.name ?? 'ফি'} ${yearName}`);

    try {
      const res = await generateInvoices({
        academicYearId: activeYearId,
        classId: selectedStruct?.classId,
        feeStructureId: genStructId,
        month: monthNum,
        title: autoTitle,
        dueDate: genDueDate || undefined,
      }).unwrap();
      toast.success(
        `মোট ${formatNumber(res.createdCount, 'bn')} জন শিক্ষার্থীর চালান তৈরি হয়েছে (${formatNumber(res.skippedCount, 'bn')}টি পূর্বেই ছিল)।`
      );
      setGenTitle('');
    } catch (err: any) {
      toast.error(err?.message || 'বকেয়া চালান তৈরি করা যায়নি।');
    }
  }

  if (headsLoading || structsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={'ফি খাত ও শ্রেণিভিত্তিক কাঠামো'}
          description={'ফি খাত, শ্রেণিভিত্তিক ফি হার নির্ধারণ ও এক ক্লিকে চালান তৈরি করুন'}
        />
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={'ফি খাত ও শ্রেণিভিত্তিক কাঠামো'}
        description={'৬ষ্ঠ–১০ম শ্রেণির মাসিক বেতন, ভর্তি, পরীক্ষা ও অন্যান্য ফি হার নির্ধারণ এবং চালান তৈরি'}
        actions={
          ctx && ctx.academicYears.length > 0 ? (
            <Select
              value={activeYearId ?? ''}
              onChange={(e) => setSelectedYearId(e.target.value)}
              aria-label="শিক্ষাবর্ষ নির্বাচন করুন"
              className="w-40"
            >
              {ctx.academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {`শিক্ষাবর্ষ ${y.name}`}
                </option>
              ))}
            </Select>
          ) : null
        }
      />

      {/* Bulk Invoice Generator */}
      <Card className="p-5 border-primary/30 bg-primary/5">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-1">
          <FilePlus2 className="w-4 h-4 text-primary" />
          {'এক ক্লিকে শ্রেণিভিত্তিক বকেয়া চালান (Invoice) তৈরি'}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {'নির্বাচিত শ্রেণির সকল সক্রিয় শিক্ষার্থীর জন্য স্বয়ংক্রিয়ভাবে বকেয়া চালান তৈরি হবে (বৃত্তি/ছাড় বাদ দিয়ে)।'}
        </p>
        <form
          onSubmit={handleGenerateInvoices}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
        >
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium mb-1">{'ফি কাঠামো নির্বাচন'}</label>
            <Select
              value={genStructId}
              onChange={(e) => setGenStructId(e.target.value)}
            >
              <option value="">{'— শ্রেণি ও ফি খাত বেছে নিন —'}</option>
              {activeStructures.map((s) => (
                <option key={s.id} value={s.id}>
                  {`${s.schoolClass?.nameBn ?? s.schoolClass?.name} — ${s.feeHead?.name} (${formatTaka(s.amount)})`}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{'মাস (মাসিক ফি হলে)'}</label>
            <Select value={genMonth} onChange={(e) => setGenMonth(e.target.value)}>
              {BN_MONTHS_LIST.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{'শিরোনাম (ঐচ্ছিক)'}</label>
            <Input
              value={genTitle}
              onChange={(e) => setGenTitle(e.target.value)}
              placeholder="যেমন: অর্ধবার্ষিক পরীক্ষার ফি"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{'জমার শেষ তারিখ'}</label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={genDueDate}
                onChange={(e) => setGenDueDate(e.target.value)}
                placeholder="তারিখ নির্বাচন"
              />
              <Button type="submit" variant="primary" disabled={generating} className="shrink-0">
                {generating ? 'তৈরি হচ্ছে...' : 'তৈরি করুন'}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Class-wise Fee Structures */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-primary" />
            {'শ্রেণিভিত্তিক ফি নির্ধারণ'}
          </h2>
          <form onSubmit={handleSaveStructure} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">{'শ্রেণি'}</label>
              <Select
                value={structClassId}
                onChange={(e) => setStructClassId(e.target.value)}
              >
                <option value="">{'শ্রেণি নির্বাচন করুন'}</option>
                {(ctx?.classes ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameBn || c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{'ফি খাত'}</label>
              <Select
                value={structHeadId}
                onChange={(e) => {
                  setStructHeadId(e.target.value);
                  setStructExamId('');
                }}
              >
                <option value="">{'ফি খাত নির্বাচন করুন'}</option>
                {feeHeads.map((h) => (
                  <option key={h.id} value={h.id}>
                    {`${h.name} (${FEE_FREQUENCY_LABELS[h.frequency]})`}
                  </option>
                ))}
              </Select>
            </div>
            {selectedStructHead?.frequency === 'PER_EXAM' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {'সংশ্লিষ্ট পরীক্ষা (ঐচ্ছিক)'}
                </label>
                <Select
                  value={structExamId}
                  onChange={(e) => setStructExamId(e.target.value)}
                >
                  <option value="">{'সকল / সাধারণ পরীক্ষা'}</option>
                  {yearExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{'টাকার পরিমাণ (৳)'}</label>
                <Input
                  type="number"
                  min={0}
                  value={structAmount}
                  onChange={(e) => setStructAmount(e.target.value)}
                  placeholder="যেমন: ৫০০"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{'জমার তারিখ (দিন)'}</label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={structDueDay}
                  onChange={(e) => setStructDueDay(e.target.value)}
                  placeholder="যেমন: ১০"
                />
              </div>
            </div>
            <Button type="submit" variant="primary" className="w-full" disabled={savingStruct}>
              <Plus className="w-4 h-4" />
              {savingStruct ? 'সংরক্ষণ হচ্ছে...' : 'ফি কাঠামো সংরক্ষণ করুন'}
            </Button>
          </form>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold text-foreground">
              {'নির্ধারিত শ্রেণিভিত্তিক ফি তালিকা'}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="ফি খাত বা শ্রেণি খুঁজুন..."
                className="w-44"
              />
              <Select
                value={filterClassId}
                onChange={(e) => {
                  setFilterClassId(e.target.value);
                  setPage(1);
                }}
                className="w-40"
              >
                <option value="">{'সকল শ্রেণি'}</option>
                {(ctx?.classes ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameBn || c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {feeStructures.length === 0 ? (
            <EmptyState
              title={'কোনো ফি কাঠামো নির্ধারণ করা হয়নি'}
              description={'বাম পাশের ফর্ম থেকে প্রতিটি শ্রেণির জন্য মাসিক বেতন ও অন্যান্য ফি নির্ধারণ করুন।'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="py-2 pr-4">{'শ্রেণি'}</th>
                    <th className="py-2 pr-4">{'ফি খাত'}</th>
                    <th className="py-2 pr-4">{'ধরন'}</th>
                    <th className="py-2 pr-4 text-right">{'টাকা'}</th>
                    <th className="py-2 text-right">{'মুছুন'}</th>
                  </tr>
                </thead>
                <tbody>
                  {feeStructures.map((s) => (
                    <tr key={s.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-4 font-medium">
                        {s.schoolClass?.nameBn ?? s.schoolClass?.name}
                      </td>
                      <td className="py-2.5 pr-4">
                        <div>{s.feeHead?.name}</div>
                        {s.exam?.name && (
                          <div className="text-xs text-muted-foreground">{`পরীক্ষা: ${s.exam.name}`}</div>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-sm text-muted-foreground">
                        {s.feeHead ? FEE_FREQUENCY_LABELS[s.feeHead.frequency] : '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-semibold tabular-nums">
                        {formatTaka(s.amount)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await deleteFeeStructure(s.id).unwrap();
                              toast.success('ফি কাঠামো মুছে ফেলা হয়েছে।');
                            } catch (err: any) {
                              toast.error(err?.message || 'মুছে ফেলা যায়নি।');
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <FinancePaginationBar meta={structMeta} onPageChange={setPage} />
        </Card>
      </div>

      {/* Fee Heads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-foreground mb-4">
            {'নতুন ফি খাত যোগ করুন'}
          </h2>
          <form onSubmit={handleSaveHead} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">{'খাতের কোড (ইংরেজি)'}</label>
              <Input
                value={headCode}
                onChange={(e) => setHeadCode(e.target.value)}
                placeholder="যেমন: SPORTS_FEE"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{'ফি খাতের নাম (বাংলা)'}</label>
              <Input
                value={headName}
                onChange={(e) => setHeadName(e.target.value)}
                placeholder="যেমন: বার্ষিক ক্রীড়া ফি"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{'আদায়ের ধরন'}</label>
              <Select
                value={headFreq}
                onChange={(e) => setHeadFreq(e.target.value as FeeFrequency)}
              >
                <option value="MONTHLY">{'মাসিক'}</option>
                <option value="ONE_TIME">{'এককালীন'}</option>
                <option value="ANNUAL">{'বার্ষিক'}</option>
                <option value="PER_EXAM">{'প্রতি পরীক্ষা'}</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{'সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)'}</label>
              <Input
                value={headDesc}
                onChange={(e) => setHeadDesc(e.target.value)}
                placeholder="খাত সংক্রান্ত সংক্ষিপ্ত নোট লিখুন"
              />
            </div>
            <Button type="submit" variant="primary" className="w-full" disabled={savingHead}>
              {savingHead ? 'সংরক্ষণ হচ্ছে...' : 'ফি খাত যোগ করুন'}
            </Button>
          </form>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-foreground mb-4">
            {'সকল ফি খাতের তালিকা'}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="py-2 pr-4">{'কোড'}</th>
                  <th className="py-2 pr-4">{'ফি খাতের নাম'}</th>
                  <th className="py-2 pr-4">{'ধরন'}</th>
                  <th className="py-2">{'অবস্থা'}</th>
                </tr>
              </thead>
              <tbody>
                {feeHeads.map((h) => (
                  <tr key={h.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-sm">{h.code}</td>
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-foreground">{h.name}</p>
                      {h.description && (
                        <p className="text-sm text-muted-foreground">{h.description}</p>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-sm">
                      {FEE_FREQUENCY_LABELS[h.frequency]}
                    </td>
                    <td className="py-2.5">
                      <StatusBadge
                        value={h.isActive ? 'ACTIVE' : 'INACTIVE'}
                        customTone={h.isActive ? 'success' : 'neutral'}
                        customLabel={h.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
