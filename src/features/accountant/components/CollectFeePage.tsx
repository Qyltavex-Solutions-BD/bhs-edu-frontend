'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, FormField, Input, Select } from '@/src/components/ui/primitives';
import { useGetEnrollmentsQuery } from '@/src/features/students/api/students.api';
import { formatNumber } from '@/src/lib/formatters';
import {
  useCollectFeeMutation,
  useGetFeeHeadsQuery,
  useGetFinanceContextQuery,
  useGetStudentLedgerQuery,
  type FeePaymentMethod,
  type FeePaymentTransactionItem,
} from '../api/finance.api';
import {
  formatTaka,
  INVOICE_STATUS_LABELS,
  MoneyReceiptModal,
  PAYMENT_METHOD_LABELS,
} from './finance-ui';

interface DraftLineItem {
  key: string;
  invoiceId?: string;
  feeHeadId: string;
  title: string;
  amount: number;
  discount: number;
  netPaid: number;
}

export function CollectFeePage({ initialEnrollmentId }: { initialEnrollmentId?: string }) {
  const {
    data: ctx,
    isLoading: ctxLoading,
    isError: ctxError,
    refetch: refetchCtx,
  } = useGetFinanceContextQuery();
  const activeYearId = ctx?.activeAcademicYear?.id;

  const { data: enrollments = [], isLoading: enrollLoading } = useGetEnrollmentsQuery(
    activeYearId ? { academicYearId: activeYearId } : undefined
  );
  const { data: feeHeads = [] } = useGetFeeHeadsQuery();

  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(
    initialEnrollmentId ?? ''
  );

  const {
    data: ledger,
    isFetching: ledgerFetching,
    isError: ledgerError,
    refetch: refetchLedger,
  } = useGetStudentLedgerQuery(selectedEnrollmentId, {
    skip: !selectedEnrollmentId,
  });

  const [collectFee, { isLoading: collecting }] = useCollectFeeMutation();

  const [selectedItems, setSelectedItems] = useState<Record<string, DraftLineItem>>({});
  const [adHocHeadId, setAdHocHeadId] = useState('');
  const [adHocTitle, setAdHocTitle] = useState('');
  const [adHocAmount, setAdHocAmount] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<FeePaymentMethod>('CASH');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [issuedReceipt, setIssuedReceipt] =
    useState<FeePaymentTransactionItem | null>(null);

  const availableSections = useMemo(() => {
    const map = new Map<string, string>();
    for (const en of enrollments as any[]) {
      if (classFilter && en.classId !== classFilter) continue;
      if (en.sectionId && en.section?.name && !map.has(en.sectionId)) {
        map.set(en.sectionId, en.section.name);
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [enrollments, classFilter]);

  const filteredEnrollments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrollments.filter((en: any) => {
      if (classFilter && en.classId !== classFilter) return false;
      if (sectionFilter && en.sectionId !== sectionFilter) return false;
      if (!q) return true;
      const name = `${en.student?.nameBn ?? ''} ${en.student?.nameEn ?? ''} ${en.student?.name ?? ''}`.toLowerCase();
      const code = String(en.student?.studentId ?? en.student?.studentIdCode ?? '').toLowerCase();
      const roll = String(en.roll ?? en.rollNumber ?? '').toLowerCase();
      return name.includes(q) || code.includes(q) || roll.includes(q);
    });
  }, [enrollments, classFilter, sectionFilter, searchQuery]);

  const pendingInvoices = useMemo(
    () =>
      (ledger?.invoices ?? []).filter(
        (inv) => inv.status === 'UNPAID' || inv.status === 'PARTIAL'
      ),
    [ledger?.invoices]
  );

  const ledgerTotals = useMemo(() => {
    const all = ledger?.invoices ?? [];
    const billed = all.reduce((s, i) => s + i.netAmount, 0);
    const paid = all.reduce((s, i) => s + i.paidAmount, 0);
    const due = Math.max(0, billed - paid);
    return { billed, paid, due };
  }, [ledger?.invoices]);

  const lineItemsList = Object.values(selectedItems);
  const totalGross = lineItemsList.reduce((sum, i) => sum + i.amount, 0);
  const totalDiscount = lineItemsList.reduce((sum, i) => sum + i.discount, 0);
  const totalPayable = lineItemsList.reduce((sum, i) => sum + i.netPaid, 0);

  function toggleInvoice(inv: (typeof pendingInvoices)[number]) {
    const key = `inv:${inv.id}`;
    setSelectedItems((prev) => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      const due = Math.max(0, inv.netAmount - inv.paidAmount);
      return {
        ...prev,
        [key]: {
          key,
          invoiceId: inv.id,
          feeHeadId: inv.feeHeadId,
          title: inv.title,
          amount: due,
          discount: 0,
          netPaid: due,
        },
      };
    });
  }

  function selectAllPendingInvoices() {
    if (pendingInvoices.length === 0) return;
    setSelectedItems((prev) => {
      const next = { ...prev };
      for (const inv of pendingInvoices) {
        const key = `inv:${inv.id}`;
        const due = Math.max(0, inv.netAmount - inv.paidAmount);
        if (due > 0) {
          next[key] = {
            key,
            invoiceId: inv.id,
            feeHeadId: inv.feeHeadId,
            title: inv.title,
            amount: due,
            discount: 0,
            netPaid: due,
          };
        }
      }
      return next;
    });
  }

  function addAdHocItem() {
    if (!adHocHeadId || !adHocAmount || Number(adHocAmount) <= 0) {
      toast.error('ফি খাত এবং সঠিক টাকার পরিমাণ দিন।');
      return;
    }
    const head = feeHeads.find((h) => h.id === adHocHeadId);
    const amount = Number(adHocAmount);
    const key = `adhoc:${Date.now()}`;
    setSelectedItems((prev) => ({
      ...prev,
      [key]: {
        key,
        feeHeadId: adHocHeadId,
        title: adHocTitle.trim() || head?.name || 'অন্যান্য ফি',
        amount,
        discount: 0,
        netPaid: amount,
      },
    }));
    setAdHocTitle('');
    setAdHocAmount('');
  }

  function updateItemValues(key: string, field: 'discount' | 'netPaid', val: number) {
    setSelectedItems((prev) => {
      const current = prev[key];
      if (!current) return prev;
      const safeVal = Math.max(0, Number.isNaN(val) ? 0 : val);
      if (field === 'discount') {
        const clampedDiscount = Math.min(safeVal, current.amount);
        return {
          ...prev,
          [key]: {
            ...current,
            discount: clampedDiscount,
            netPaid: Math.max(0, current.amount - clampedDiscount),
          },
        };
      }
      return {
        ...prev,
        [key]: {
          ...current,
          netPaid: safeVal,
        },
      };
    });
  }

  async function handleCollectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEnrollmentId) {
      toast.error('প্রথমে একজন শিক্ষার্থী নির্বাচন করুন।');
      return;
    }
    if (lineItemsList.length === 0) {
      toast.error('কমপক্ষে একটি ফি আইটেম যোগ বা নির্বাচন করুন।');
      return;
    }
    if (totalPayable <= 0) {
      toast.error('পরিশোধযোগ্য পরিমাণ শূন্যের বেশি হতে হবে।');
      return;
    }

    try {
      const tx = await collectFee({
        academicYearId: activeYearId,
        studentEnrollmentId: selectedEnrollmentId,
        paymentMethod,
        referenceNo: referenceNo.trim() || undefined,
        remarks: remarks.trim() || undefined,
        items: lineItemsList.map((i) => ({
          invoiceId: i.invoiceId,
          feeHeadId: i.feeHeadId,
          title: i.title,
          amount: i.amount,
          discount: i.discount,
          netPaid: i.netPaid,
        })),
      }).unwrap();

      toast.success(`রসিদ ${tx.receiptNo} সফলভাবে ইস্যু হয়েছে।`);
      setIssuedReceipt(tx);
      setSelectedItems({});
      setReferenceNo('');
      setRemarks('');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'ফি গ্রহণ সম্পন্ন করা যায়নি।');
    }
  }

  if (ctxLoading || enrollLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={'ফি কালেকশন ডেস্ক'}
          description={'শিক্ষার্থী নির্বাচন করে বকেয়া চালান বা তাৎক্ষণিক ফি গ্রহণ ও রসিদ প্রিন্ট করুন'}
        />
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={'ফি কালেকশন ডেস্ক'}
        description={'মাসিক বেতন, সেশন, পরীক্ষা ও অন্যান্য ফি গ্রহণ করে তাৎক্ষণিক মানি রসিদ ইস্যু করুন'}
      />

      {ctxError && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm text-destructive font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{'ফিন্যান্স কনটেক্সট লোড করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchCtx()}>
            <RefreshCw className="w-4 h-4" />
            {'পুনরায় চেষ্টা করুন'}
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Student Selector */}
        <Card className="p-5 lg:col-span-4 space-y-4 lg:sticky lg:top-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-foreground">
              {'১. শিক্ষার্থী নির্বাচন'}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground tabular-nums">
              {`${formatNumber(filteredEnrollments.length, 'bn')} জন`}
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <FormField label={'শ্রেণি'}>
                <Select
                  id="collect-fee-class-filter"
                  name="classId"
                  aria-label="শ্রেণি"
                  value={classFilter}
                  onChange={(e) => {
                    setClassFilter(e.target.value);
                    setSectionFilter('');
                  }}
                >
                  <option value="">{'সকল শ্রেণি'}</option>
                  {(ctx?.classes ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn || c.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label={'শাখা'}>
                <Select
                  id="collect-fee-section-filter"
                  name="sectionId"
                  aria-label="শাখা"
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                >
                  <option value="">{'সকল শাখা'}</option>
                  {availableSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <FormField label={'শিক্ষার্থী খুঁজুন'}>
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="collect-fee-search"
                  name="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="নাম বা রোল দিয়ে খুঁজুন..."
                  className="pl-9"
                />
              </div>
            </FormField>
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-border border border-border rounded-lg">
            {filteredEnrollments.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">
                {'কোনো শিক্ষার্থী পাওয়া যায়নি'}
              </p>
            ) : (
              filteredEnrollments.slice(0, 80).map((en: any) => {
                const isSelected = en.id === selectedEnrollmentId;
                return (
                  <button
                    key={en.id}
                    type="button"
                    onClick={() => {
                      setSelectedEnrollmentId(en.id);
                      setSelectedItems({});
                    }}
                    className={`w-full text-left px-3.5 py-2.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 border-l-4 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {en.student?.nameBn || en.student?.nameEn || en.student?.name || '—'}
                      </p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground tabular-nums shrink-0">
                        {`রোল ${formatNumber(en.roll ?? en.rollNumber ?? 0, 'bn')}`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {en.schoolClass?.nameBn ?? en.schoolClass?.name}
                      {en.section?.name ? ` (${en.section.name})` : ''}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Right: Ledger & Payment Form */}
        <div className="lg:col-span-8 space-y-5">
          {!selectedEnrollmentId ? (
            <Card className="p-8">
              <EmptyState
                title={'বাম তালিকা থেকে একজন শিক্ষার্থী নির্বাচন করুন'}
                description={'শিক্ষার্থী নির্বাচন করলে তার বকেয়া চালান, বৃত্তি/ছাড় ও ফি আদায়ের ফর্ম এখানে দেখা যাবে।'}
              />
            </Card>
          ) : ledgerFetching ? (
            <Card className="p-6">
              <LoadingSkeleton rows={5} />
            </Card>
          ) : ledgerError ? (
            <Card className="p-6 border-destructive/40 bg-destructive/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sm text-destructive font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{'শিক্ষার্থীর ফি লেজার লোড করা যায়নি।'}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchLedger()}>
                <RefreshCw className="w-4 h-4" />
                {'পুনরায় চেষ্টা করুন'}
              </Button>
            </Card>
          ) : (
            <>
              {/* Student Summary Banner */}
              <Card className="p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        {ledger?.enrollment.student.nameBn ||
                          ledger?.enrollment.student.nameEn ||
                          '—'}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {ledger?.enrollment.schoolClass.nameBn}
                        {ledger?.enrollment.section?.name ? ` (${ledger.enrollment.section.name})` : ''} ·{' '}
                        {'রোল:'}{' '}
                        {ledger?.enrollment.roll != null
                          ? formatNumber(ledger.enrollment.roll, 'bn')
                          : '—'}{' '}
                        · {'অভিভাবকের ফোন:'}{' '}
                        {ledger?.enrollment.student.guardianPhone ?? '—'}
                      </p>
                    </div>
                  </div>
                  {(ledger?.waivers.length ?? 0) > 0 && (
                    <StatusBadge
                      value="WAIVER"
                      customTone="info"
                      customLabel={`বৃত্তি/ছাড় সক্রিয়: ${formatNumber(ledger?.waivers.length ?? 0, 'bn')}টি`}
                    />
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border text-sm tabular-nums">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <span className="text-xs text-muted-foreground">{'মোট ধার্য'}</span>
                    <p className="font-bold text-foreground text-base mt-0.5">
                      {formatTaka(ledgerTotals.billed)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-success/10 p-3">
                    <span className="text-xs text-muted-foreground">{'মোট পরিশোধিত'}</span>
                    <p className="font-bold text-success text-base mt-0.5">
                      {formatTaka(ledgerTotals.paid)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-warning/10 p-3">
                    <span className="text-xs text-muted-foreground">{'বর্তমান বকেয়া'}</span>
                    <p className="font-bold text-warning text-base mt-0.5">
                      {formatTaka(ledgerTotals.due)}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Pending Invoices */}
              <Card className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-foreground">
                    {'২. বকেয়া চালানসমূহ (সিলেক্ট করে যোগ করুন)'}
                  </h3>
                  {pendingInvoices.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllPendingInvoices}
                    >
                      {'সব বকেয়া নির্বাচন করুন'}
                    </Button>
                  )}
                </div>

                {pendingInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    {'এই শিক্ষার্থীর কোনো বকেয়া চালান নেই। নিচ থেকে সরাসরি তাৎক্ষণিক ফি যোগ করতে পারেন।'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pendingInvoices.map((inv) => {
                      const key = `inv:${inv.id}`;
                      const checked = Boolean(selectedItems[key]);
                      const due = Math.max(0, inv.netAmount - inv.paidAmount);
                      return (
                        <label
                          key={inv.id}
                          className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            checked
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                              : 'border-border hover:bg-muted/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleInvoice(inv)}
                              className="w-4 h-4 accent-primary"
                            />
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {inv.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                                {`মোট: ${formatTaka(inv.netAmount)} · পরিশোধিত: ${formatTaka(inv.paidAmount)} · `}
                                <span className="text-warning font-bold">
                                  {`বকেয়া: ${formatTaka(due)}`}
                                </span>
                              </p>
                            </div>
                          </div>
                          <StatusBadge
                            value={inv.status}
                            customTone={inv.status === 'PARTIAL' ? 'warning' : 'destructive'}
                            customLabel={INVOICE_STATUS_LABELS[inv.status]}
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Ad-hoc Fee Item */}
              <Card className="p-5 space-y-3">
                <h3 className="text-base font-bold text-foreground">
                  {'৩. তাৎক্ষণিক / অতিরিক্ত ফি যোগ করুন (ভর্তি, পরীক্ষা, টিসি, জরিমানা ইত্যাদি)'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <FormField label={'ফি খাত'}>
                    <Select
                      id="adhoc-fee-head"
                      name="feeHeadId"
                      value={adHocHeadId}
                      onChange={(e) => setAdHocHeadId(e.target.value)}
                    >
                      <option value="">{'খাত নির্বাচন'}</option>
                      {feeHeads.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label={'বিবরণ (ঐচ্ছিক)'}>
                    <Input
                      id="adhoc-fee-title"
                      name="title"
                      value={adHocTitle}
                      onChange={(e) => setAdHocTitle(e.target.value)}
                      placeholder="যেমন: এসএসসি ফরম ফিলাপ"
                    />
                  </FormField>
                  <FormField label={'টাকা (৳)'}>
                    <Input
                      id="adhoc-fee-amount"
                      name="amount"
                      type="text"
                      inputMode="numeric"
                      value={adHocAmount}
                      onChange={(e) =>
                        setAdHocAmount(e.target.value.replace(/[^\d.]/g, ''))
                      }
                      placeholder="যেমন: 1200"
                    />
                  </FormField>
                  <Button type="button" variant="outline" onClick={addAdHocItem}>
                    <Plus className="w-4 h-4" />
                    {'রসিদে যোগ করুন'}
                  </Button>
                </div>
              </Card>

              {/* Finalize Payment */}
              <Card className="p-5">
                <form onSubmit={handleCollectSubmit} className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-primary" />
                      {'৪. রসিদের বিবরণ ও পেমেন্ট গ্রহণ'}
                    </h3>
                    {lineItemsList.length > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary tabular-nums">
                        {`${formatNumber(lineItemsList.length, 'bn')}টি আইটেম`}
                      </span>
                    )}
                  </div>

                  {lineItemsList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {'এখনও কোনো ফি আইটেম যোগ করা হয়নি।'}
                    </p>
                  ) : (
                    <div className="overflow-x-auto border border-border rounded-lg">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
                            <th className="py-2.5 px-3">{'বিবরণ'}</th>
                            <th className="py-2.5 px-3 text-right">{'নির্ধারিত'}</th>
                            <th className="py-2.5 px-3 text-right w-28">{'ছাড় (৳)'}</th>
                            <th className="py-2.5 px-3 text-right w-32">{'জমা (৳)'}</th>
                            <th className="py-2.5 px-3 text-right w-14">{'বাদ'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {lineItemsList.map((item) => (
                            <tr key={item.key}>
                              <td className="py-2 px-3 font-medium">{item.title}</td>
                              <td className="py-2 px-3 text-right tabular-nums">
                                {formatTaka(item.amount)}
                              </td>
                              <td className="py-2 px-3">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  value={item.discount === 0 ? '' : String(item.discount)}
                                  onChange={(e) => {
                                    const cleaned = e.target.value.replace(/[^\d.]/g, '');
                                    updateItemValues(
                                      item.key,
                                      'discount',
                                      cleaned ? Number(cleaned) : 0
                                    );
                                  }}
                                  placeholder="0"
                                  className="text-right tabular-nums"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  value={item.netPaid === 0 ? '' : String(item.netPaid)}
                                  onChange={(e) => {
                                    const cleaned = e.target.value.replace(/[^\d.]/g, '');
                                    updateItemValues(
                                      item.key,
                                      'netPaid',
                                      cleaned ? Number(cleaned) : 0
                                    );
                                  }}
                                  placeholder="0"
                                  className="text-right tabular-nums"
                                />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setSelectedItems((prev) => {
                                      const next = { ...prev };
                                      delete next[item.key];
                                      return next;
                                    })
                                  }
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <FormField label={'পেমেন্ট মাধ্যম'}>
                      <Select
                        id="collect-payment-method"
                        name="paymentMethod"
                        value={paymentMethod}
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as FeePaymentMethod)
                        }
                      >
                        {(Object.keys(PAYMENT_METHOD_LABELS) as FeePaymentMethod[]).map(
                          (m) => (
                            <option key={m} value={m}>
                              {PAYMENT_METHOD_LABELS[m]}
                            </option>
                          )
                        )}
                      </Select>
                    </FormField>
                    <FormField label={'ট্রানজেকশন / রেফারেন্স নং (ঐচ্ছিক)'}>
                      <Input
                        id="collect-reference-no"
                        name="referenceNo"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        placeholder="যেমন: TrxID বা রসিদ রেফারেন্স"
                      />
                    </FormField>
                    <FormField label={'মন্তব্য (ঐচ্ছিক)'}>
                      <Input
                        id="collect-remarks"
                        name="remarks"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="অতিরিক্ত কোনো নোট থাকলে লিখুন"
                      />
                    </FormField>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border">
                    <div className="text-base space-y-0.5">
                      <p className="text-sm text-muted-foreground tabular-nums">
                        {`মোট: ${formatTaka(totalGross)} · ছাড়: ${formatTaka(totalDiscount)}`}
                      </p>
                      <p className="text-xl font-bold text-primary tabular-nums">
                        {`সর্বমোট গ্রহণযোগ্য: ${formatTaka(totalPayable)}`}
                      </p>
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={collecting || lineItemsList.length === 0}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {collecting ? 'সংরক্ষণ হচ্ছে...' : 'ফি গ্রহণ ও রসিদ ইস্যু করুন'}
                    </Button>
                  </div>
                </form>
              </Card>
            </>
          )}
        </div>
      </div>

      <MoneyReceiptModal
        transaction={issuedReceipt}
        schoolProfile={ctx?.schoolProfile}
        onClose={() => setIssuedReceipt(null)}
      />
    </div>
  );
}
