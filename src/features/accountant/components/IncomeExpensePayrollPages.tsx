'use client';

import React, { useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';
import { formatDateShort } from '@/src/lib/formatters';
import {
  useCreateExpenseMutation,
  useCreateMiscIncomeMutation,
  useCreateSalaryMutation,
  useDeleteExpenseMutation,
  useDeleteMiscIncomeMutation,
  useDeleteSalaryMutation,
  useGetExpensesQuery,
  useGetFinanceContextQuery,
  useGetMiscIncomesQuery,
  useGetSalariesQuery,
  type FeePaymentMethod,
} from '../api/finance.api';
import {
  BN_MONTHS_LIST,
  EXPENSE_CATEGORIES,
  FinancePaginationBar,
  formatTaka,
  MISC_INCOME_CATEGORIES,
  PAYMENT_METHOD_LABELS,
} from './finance-ui';

const PAGE_SIZE = 20;

export function OtherIncomePage() {
  const { data: ctx } = useGetFinanceContextQuery();
  const activeYearId = ctx?.activeAcademicYear?.id;
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterMethod, setFilterMethod] = useState<'' | FeePaymentMethod>('');
  const [page, setPage] = useState(1);

  const { data: incomeData, isLoading } = useGetMiscIncomesQuery(
    activeYearId
      ? {
          academicYearId: activeYearId,
          search: search.trim() || undefined,
          category: filterCat || undefined,
          paymentMethod: filterMethod || undefined,
          page,
          limit: PAGE_SIZE,
        }
      : undefined
  );
  const items = incomeData?.items ?? [];
  const meta = incomeData?.meta;
  const totalIncome = incomeData?.totalAmount ?? 0;

  const [createIncome, { isLoading: saving }] = useCreateMiscIncomeMutation();
  const [deleteIncome] = useDeleteMiscIncomeMutation();

  const [category, setCategory] = useState(MISC_INCOME_CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [payerName, setPayerName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<FeePaymentMethod>('CASH');
  const [remarks, setRemarks] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) {
      toast.error('আয়ের বিবরণ ও সঠিক টাকার পরিমাণ দিন।');
      return;
    }
    try {
      await createIncome({
        academicYearId: activeYearId,
        category,
        title: title.trim(),
        receivedFrom: payerName.trim() || undefined,
        amount: Number(amount),
        paymentMethod,
        incomeDate: new Date().toISOString().slice(0, 10),
        remarks: remarks.trim() || undefined,
      }).unwrap();
      toast.success('অন্যান্য আয় ভাউচার সংরক্ষিত হয়েছে।');
      setTitle('');
      setPayerName('');
      setAmount('');
      setRemarks('');
    } catch (err: any) {
      toast.error(err?.message || 'সংরক্ষণ করা যায়নি।');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={'অন্যান্য আয় নিবন্ধন'}
        description={'ভর্তি ফরম বিক্রয়, অনুদান, সম্পদ ভাড়া ও বিবিধ প্রাতিষ্ঠানিক আয়ের হিসাব'}
      />

      <StatCard
        label={'মোট অন্যান্য আয়'}
        value={formatTaka(totalIncome)}
        meta={`${items.length}টি আয় ভাউচার`}
        accent="success"
        icon={<ArrowDownCircle className="w-5 h-5" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <h2 className="text-base font-semibold mb-4">{'নতুন আয় এন্ট্রি'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">{'আয়ের খাত'}</label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {MISC_INCOME_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{'বিবরণ'}</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: ৫০টি ভর্তি ফরম বিক্রয়"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {'প্রদানকারীর নাম (ঐচ্ছিক)'}
              </label>
              <Input
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="ব্যক্তি বা প্রতিষ্ঠানের নাম লিখুন"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{'টাকা (৳)'}</label>
                <Input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="যেমন: ২৫০০"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{'মাধ্যম'}</label>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as FeePaymentMethod)}
                >
                  {(Object.keys(PAYMENT_METHOD_LABELS) as FeePaymentMethod[]).map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{'মন্তব্য (ঐচ্ছিক)'}</label>
              <Input
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="প্রয়োজনে অতিরিক্ত নোট লিখুন"
              />
            </div>
            <Button type="submit" variant="primary" className="w-full" disabled={saving}>
              <Plus className="w-4 h-4" />
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'আয় সংরক্ষণ করুন'}
            </Button>
          </form>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-base font-semibold">{'অন্যান্য আয়ের তালিকা'}</h2>
            <div className="flex flex-wrap gap-2">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="ভাউচার বা বিবরণ..."
                className="w-40"
              />
              <Select
                value={filterCat}
                onChange={(e) => {
                  setFilterCat(e.target.value);
                  setPage(1);
                }}
                className="w-40"
              >
                <option value="">{'সকল খাত'}</option>
                {MISC_INCOME_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : items.length === 0 ? (
            <EmptyState title={'কোনো অন্যান্য আয় এন্ট্রি নেই'} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="py-2 pr-3">{'ভাউচার'}</th>
                    <th className="py-2 pr-3">{'খাত ও বিবরণ'}</th>
                    <th className="py-2 pr-3">{'তারিখ'}</th>
                    <th className="py-2 pr-3 text-right">{'টাকা'}</th>
                    <th className="py-2 text-right">{'মুছুন'}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-3 font-mono text-sm font-semibold">
                        {item.voucherNo}
                      </td>
                      <td className="py-2.5 pr-3">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.category}
                          {item.receivedFrom ? ` · ${item.receivedFrom}` : ''}
                        </p>
                      </td>
                      <td className="py-2.5 pr-3 text-sm tabular-nums">
                        {formatDateShort(item.incomeDate, 'bn')}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-semibold text-success tabular-nums">
                        {formatTaka(item.amount)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await deleteIncome(item.id).unwrap();
                              toast.success('আয় ভাউচার মুছে ফেলা হয়েছে।');
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
          <FinancePaginationBar meta={meta} onPageChange={setPage} />
        </Card>
      </div>
    </div>
  );
}

export function ExpensesPage() {
  const { data: ctx } = useGetFinanceContextQuery();
  const activeYearId = ctx?.activeAcademicYear?.id;
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [page, setPage] = useState(1);

  const { data: expenseData, isLoading } = useGetExpensesQuery(
    activeYearId
      ? {
          academicYearId: activeYearId,
          search: search.trim() || undefined,
          category: filterCat || undefined,
          page,
          limit: PAGE_SIZE,
        }
      : undefined
  );
  const items = expenseData?.items ?? [];
  const meta = expenseData?.meta;
  const totalExpense = expenseData?.totalAmount ?? 0;

  const [createExpense, { isLoading: saving }] = useCreateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();

  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<FeePaymentMethod>('CASH');
  const [remarks, setRemarks] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) {
      toast.error('ব্যয়ের বিবরণ ও সঠিক টাকার পরিমাণ দিন।');
      return;
    }
    try {
      await createExpense({
        academicYearId: activeYearId,
        category,
        title: title.trim(),
        paidTo: vendorName.trim() || undefined,
        amount: Number(amount),
        paymentMethod,
        expenseDate: new Date().toISOString().slice(0, 10),
        remarks: remarks.trim() || undefined,
      }).unwrap();
      toast.success('ব্যয় ভাউচার সংরক্ষিত হয়েছে।');
      setTitle('');
      setVendorName('');
      setAmount('');
      setRemarks('');
    } catch (err: any) {
      toast.error(err?.message || 'সংরক্ষণ করা যায়নি।');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={'ব্যয় ও খরচ ভাউচার'}
        description={'বিদ্যালয়ের বিদ্যুৎ বিল, পরীক্ষা মুদ্রণ, স্টেশনারি, মেরামত ও দৈনন্দিন খরচের হিসাব'}
      />

      <StatCard
        label={'মোট প্রাতিষ্ঠানিক ব্যয়'}
        value={formatTaka(totalExpense)}
        meta={`${items.length}টি ব্যয় ভাউচার`}
        accent="destructive"
        icon={<ArrowUpCircle className="w-5 h-5" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <h2 className="text-base font-semibold mb-4">{'নতুন ব্যয় ভাউচার'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">{'ব্যয়ের খাত'}</label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{'ব্যয়ের বিবরণ'}</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: মার্চ মাসের বিদ্যুৎ বিল পরিশোধ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {'ভেন্ডর / প্রাপক (ঐচ্ছিক)'}
              </label>
              <Input
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="দোকান, সরবরাহকারী বা ব্যক্তির নাম"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{'টাকা (৳)'}</label>
                <Input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="যেমন: ৩৫০০"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{'মাধ্যম'}</label>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as FeePaymentMethod)}
                >
                  {(Object.keys(PAYMENT_METHOD_LABELS) as FeePaymentMethod[]).map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{'মন্তব্য (ঐচ্ছিক)'}</label>
              <Input
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="ভাউচার সংক্রান্ত অতিরিক্ত নোট"
              />
            </div>
            <Button type="submit" variant="primary" className="w-full" disabled={saving}>
              <Plus className="w-4 h-4" />
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'ব্যয় ভাউচার সংরক্ষণ'}
            </Button>
          </form>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-base font-semibold">{'ব্যয় ভাউচার তালিকা'}</h2>
            <div className="flex flex-wrap gap-2">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="ভাউচার বা বিবরণ..."
                className="w-40"
              />
              <Select
                value={filterCat}
                onChange={(e) => {
                  setFilterCat(e.target.value);
                  setPage(1);
                }}
                className="w-40"
              >
                <option value="">{'সকল খাত'}</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : items.length === 0 ? (
            <EmptyState title={'কোনো ব্যয় ভাউচার এন্ট্রি নেই'} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="py-2 pr-3">{'ভাউচার'}</th>
                    <th className="py-2 pr-3">{'খাত ও বিবরণ'}</th>
                    <th className="py-2 pr-3">{'তারিখ'}</th>
                    <th className="py-2 pr-3 text-right">{'টাকা'}</th>
                    <th className="py-2 text-right">{'মুছুন'}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-3 font-mono text-sm font-semibold">
                        {item.voucherNo}
                      </td>
                      <td className="py-2.5 pr-3">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.category}
                          {item.paidTo ? ` · ${item.paidTo}` : ''}
                        </p>
                      </td>
                      <td className="py-2.5 pr-3 text-sm tabular-nums">
                        {formatDateShort(item.expenseDate, 'bn')}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-semibold text-destructive tabular-nums">
                        {formatTaka(item.amount)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await deleteExpense(item.id).unwrap();
                              toast.success('ব্যয় ভাউচার মুছে ফেলা হয়েছে।');
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
          <FinancePaginationBar meta={meta} onPageChange={setPage} />
        </Card>
      </div>
    </div>
  );
}

export function PayrollPage() {
  const { data: ctx } = useGetFinanceContextQuery();
  const activeYearId = ctx?.activeAcademicYear?.id;
  const yearName = ctx?.activeAcademicYear?.name ?? String(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [page, setPage] = useState(1);

  const { data: salaryData, isLoading } = useGetSalariesQuery(
    activeYearId
      ? {
          academicYearId: activeYearId,
          search: search.trim() || undefined,
          month: filterMonth ? Number(filterMonth) : undefined,
          page,
          limit: PAGE_SIZE,
        }
      : undefined
  );
  const salaries = salaryData?.items ?? [];
  const meta = salaryData?.meta;
  const totalSalaryPaid = salaryData?.totalNetPaid ?? 0;
  const staffList = ctx?.staffList ?? [];

  const [createSalary, { isLoading: saving }] = useCreateSalaryMutation();
  const [deleteSalary] = useDeleteSalaryMutation();

  const [staffId, setStaffId] = useState('');
  const [month, setMonth] = useState('01');
  const [basicSalary, setBasicSalary] = useState('');
  const [allowance, setAllowance] = useState('0');
  const [deduction, setDeduction] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<FeePaymentMethod>('BANK');
  const [remarks, setRemarks] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!staffId || !basicSalary || Number(basicSalary) <= 0) {
      toast.error('শিক্ষক/কর্মচারী এবং মূল বেতনের পরিমাণ দিন।');
      return;
    }
    try {
      await createSalary({
        academicYearId: activeYearId,
        staffId,
        month: Number(month),
        year: Number(yearName) || new Date().getFullYear(),
        basicSalary: Number(basicSalary),
        bonus: Number(allowance) || 0,
        deduction: Number(deduction) || 0,
        paymentMethod,
        paidDate: new Date().toISOString().slice(0, 10),
        remarks: remarks.trim() || undefined,
      }).unwrap();
      toast.success('বেতন ভাউচার সফলভাবে সংরক্ষিত হয়েছে।');
      setStaffId('');
      setBasicSalary('');
      setAllowance('0');
      setDeduction('0');
      setRemarks('');
    } catch (err: any) {
      toast.error(err?.message || 'বেতন এন্ট্রি করা যায়নি।');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={'শিক্ষক ও কর্মচারী বেতন রেজিস্টার'}
        description={'মাসিক মূল বেতন, ভাতা ও কর্তনসহ শিক্ষক-কর্মচারীদের বেতন প্রদানের হিসাব'}
      />

      <StatCard
        label={'মোট প্রদত্ত বেতন'}
        value={formatTaka(totalSalaryPaid)}
        meta={`${salaries.length}টি বেতন ভাউচার`}
        accent="primary"
        icon={<Users className="w-5 h-5" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <h2 className="text-base font-semibold mb-4">{'বেতন প্রদান এন্ট্রি'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                {'শিক্ষক / কর্মচারী'}
              </label>
              <Select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                <option value="">{'— নির্বাচন করুন —'}</option>
                {staffList.map((st: any) => (
                  <option key={st.id} value={st.id}>
                    {`${st.name} (${st.designation})`}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{'বেতনের মাস'}</label>
                <Select value={month} onChange={(e) => setMonth(e.target.value)}>
                  {BN_MONTHS_LIST.map((m) => (
                    <option key={m.value} value={m.value}>
                      {`${m.label} ${yearName}`}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{'মাধ্যম'}</label>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as FeePaymentMethod)}
                >
                  {(Object.keys(PAYMENT_METHOD_LABELS) as FeePaymentMethod[]).map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{'মূল বেতন (৳)'}</label>
              <Input
                type="number"
                min={1}
                value={basicSalary}
                onChange={(e) => setBasicSalary(e.target.value)}
                placeholder="যেমন: ১৮০০০"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{'ভাতা (৳)'}</label>
                <Input
                  type="number"
                  min={0}
                  value={allowance}
                  onChange={(e) => setAllowance(e.target.value)}
                  placeholder="০"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{'কর্তন (৳)'}</label>
                <Input
                  type="number"
                  min={0}
                  value={deduction}
                  onChange={(e) => setDeduction(e.target.value)}
                  placeholder="০"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{'মন্তব্য (ঐচ্ছিক)'}</label>
              <Input
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="বেতন সংক্রান্ত নোট লিখুন"
              />
            </div>
            <Button type="submit" variant="primary" className="w-full" disabled={saving}>
              <Plus className="w-4 h-4" />
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'বেতন প্রদান সংরক্ষণ'}
            </Button>
          </form>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-base font-semibold">{'বেতন প্রদানের তালিকা'}</h2>
            <div className="flex flex-wrap gap-2">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="শিক্ষক বা ভাউচার..."
                className="w-40"
              />
              <Select
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  setPage(1);
                }}
                className="w-36"
              >
                <option value="">{'সকল মাস'}</option>
                {BN_MONTHS_LIST.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : salaries.length === 0 ? (
            <EmptyState title={'কোনো বেতন প্রদানের রেকর্ড নেই'} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="py-2 pr-3">{'ভাউচার'}</th>
                    <th className="py-2 pr-3">{'শিক্ষক / কর্মচারী'}</th>
                    <th className="py-2 pr-3">{'মাস'}</th>
                    <th className="py-2 pr-3 text-right">{'নিট প্রদান'}</th>
                    <th className="py-2 text-right">{'মুছুন'}</th>
                  </tr>
                </thead>
                <tbody>
                  {salaries.map((s) => (
                    <tr key={s.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-3 font-mono text-sm font-semibold">
                        {s.voucherNo}
                      </td>
                      <td className="py-2.5 pr-3">
                        <p className="font-medium">{s.staff?.name ?? '—'}</p>
                        <p className="text-sm text-muted-foreground">
                          {s.staff?.designation ?? ''}
                        </p>
                      </td>
                      <td className="py-2.5 pr-3 text-sm tabular-nums">
                        {`${BN_MONTHS_LIST.find((m) => Number(m.value) === s.month)?.label ?? s.month} ${s.year}`}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">
                        {formatTaka(s.netPaid)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await deleteSalary(s.id).unwrap();
                              toast.success('বেতন ভাউচার মুছে ফেলা হয়েছে।');
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
          <FinancePaginationBar meta={meta} onPageChange={setPage} />
        </Card>
      </div>
    </div>
  );
}
