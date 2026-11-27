'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Download,
  Eye,
  FileCheck2,
  Plus,
  Printer,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { cn, exportToCsv, triggerCertificatePrint } from '@/src/lib/utils/cn';
import { localToday } from '@/src/lib/schoolDay';
import { DataTable } from '@/src/components/shared/DataTable';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { PrintableTransferCertificate } from '@/src/components/print/PrintDocuments';
import {
  Button,
  Card,
  FormField,
  Input,
  Modal,
  Select,
  Textarea,
} from '@/src/components/ui/primitives';
import {
  useGetStudentsQuery,
  useGetTransferCertificatesQuery,
  useIssueTransferCertificateMutation,
} from '@/src/features/students/api/students.api';
import { useGetAcademicYearsQuery } from '@/src/services/academic/year.api';
import { Gender, RelationshipType, StudentStatus } from '@/src/types/enums';
import type { Student, StudentTransferCertificate } from '@/src/types/entities';
import { errorMessage, resolveSchoolProfile, studentInitials } from './studentShared';

interface EnrichedTransfer extends StudentTransferCertificate {
  studentNameBn: string;
  studentNameEn: string;
  studentCode: string;
  studentGender: Gender;
  fatherName: string | null;
  motherName: string | null;
  guardianPhone: string;
  leavingClassDisplay: string;
  sectionName: string | null;
  roll: number | null;
  rawStudent: Student | null;
}

const REASON_PRESETS = [
  {
    bn: 'অভিভাবকের কর্মস্থল পরিবর্তনের কারণে স্থানান্তর।',
    en: 'Relocation due to guardian job transfer.',
  },
  {
    bn: 'পরিবারের স্থায়ী বাসস্থান পরিবর্তন।',
    en: 'Permanent change of family residence.',
  },
  {
    bn: 'অন্য শিক্ষা প্রতিষ্ঠানে ভর্তির উদ্দেশ্যে।',
    en: 'Admission to another educational institution.',
  },
  {
    bn: 'ব্যক্তিগত ও পারিবারিক কারণ।',
    en: 'Personal and family reasons.',
  },
];

export function StudentTransfers() {
  const [issueTc, { isLoading: issuing }] = useIssueTransferCertificateMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [duesFilter, setDuesFilter] = useState<'ALL' | 'CLEARED' | 'PENDING'>('ALL');
  const [promotionFilter, setPromotionFilter] = useState<'ALL' | 'PROMOTED' | 'MID'>('ALL');
  const [page, setPage] = useState(1);

  const [issueOpen, setIssueOpen] = useState(false);
  const [printId, setPrintId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: liveYears = [] } = useGetAcademicYearsQuery();
  const activeYear = liveYears.find((y) => y.isActive) ?? liveYears[0];
  const activeYearName = activeYear?.name ?? String(new Date().getFullYear());

  const {
    data: tcRes,
    isLoading: loadingTc,
    isFetching: fetchingTc,
  } = useGetTransferCertificatesQuery({
    page,
    limit: 15,
    search: debouncedSearch || undefined,
    duesStatus: duesFilter !== 'ALL' ? duesFilter : undefined,
    promotionStatus: promotionFilter !== 'ALL' ? promotionFilter : undefined,
  });

  const { data: activeStudentsRes } = useGetStudentsQuery(
    { status: StudentStatus.ACTIVE, limit: 100 },
    { skip: !issueOpen }
  );

  const [form, setForm] = useState({
    studentId: '',
    tcNumber: '',
    issueDate: '',
    leavingDate: '',
    leavingClass: '',
    reason: '',
    destinationSchool: '',
    conductRemarks: 'উত্তম ও শৃঙ্খলাপরায়ণ',
    duesCleared: true,
    promotedToNextClass: false,
    remarks: '',
  });

  const eligibleStudents = useMemo(() => {
    return (activeStudentsRes?.items ?? []).map((raw: any) => {
      const enr = raw.enrollments?.[0];
      const cls = enr?.schoolClass;
      const sec = enr?.section;
      const parents = raw.parents ?? [];
      const primary =
        parents.find((p: any) => p.isPrimary)?.parent ?? parents[0]?.parent ?? null;
      return {
        student: raw as Student,
        classNumeric: cls?.numericValue ?? 99,
        classNameBn: cls?.nameBn || cls?.name || '',
        classNameEn: cls?.name || '',
        classDisplay: cls ? (cls.nameBn || cls.name) : '—',
        sectionName: sec?.name ?? '—',
        roll: enr?.roll ?? 0,
        guardianName: primary ? (primary.nameBn || primary.name) : '',
        guardianPhone: primary?.phone ?? '',
      };
    });
  }, [activeStudentsRes?.items, 'bn']);

  const selectedStudentMeta = useMemo(
    () => eligibleStudents.find((item) => item.student.id === form.studentId) ?? null,
    [eligibleStudents, form.studentId]
  );

  const rows = useMemo<EnrichedTransfer[]>(() => {
    return (tcRes?.items ?? []).map((tc: any) => {
      const student = tc.student ?? null;
      const enr = tc.enrollment ?? null;
      const cls = enr?.schoolClass;
      const parents = student?.parents ?? [];
      const father =
        parents.find((p: any) => p.relationship === RelationshipType.FATHER)?.parent ??
        parents.find((p: any) => p.isPrimary)?.parent ??
        parents[0]?.parent ??
        null;
      const mother =
        parents.find((p: any) => p.relationship === RelationshipType.MOTHER)?.parent ?? null;
      const fallbackClass = cls ? (cls.nameBn || cls.name) : '—';

      return {
        ...tc,
        issueDate: String(tc.issueDate ?? '').slice(0, 10),
        leavingDate: String(tc.leavingDate ?? '').slice(0, 10),
        studentNameBn: student?.nameBn || student?.nameEn || '—',
        studentNameEn: student?.nameEn || '',
        studentCode: student?.studentId ?? '—',
        studentGender: (student?.gender as Gender) ?? Gender.MALE,
        fatherName: father ? (father.nameBn || father.name) : null,
        motherName: mother ? (mother.nameBn || mother.name) : null,
        guardianPhone: father?.phone ?? '',
        leavingClassDisplay: tc.leavingClass || fallbackClass,
        sectionName: enr?.section?.name ?? null,
        roll: enr?.roll ?? null,
        rawStudent: student,
      };
    });
  }, [tcRes?.items, 'bn']);

  const summary = tcRes?.summary ?? {
    totalIssued: 0,
    issuedThisYear: 0,
    duesClearedCount: 0,
    duesPendingCount: 0,
    promotedLeavingCount: 0,
    midSessionCount: 0,
    activeStudentsCount: 0,
  };
  const schoolProfile = resolveSchoolProfile(tcRes?.school);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) || duesFilter !== 'ALL' || promotionFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setDuesFilter('ALL');
    setPromotionFilter('ALL');
    setPage(1);
  };

  const openIssueModal = () => {
    const today = localToday();
    setForm({
      studentId: '',
      tcNumber: tcRes?.suggestedTcNumber || `TC-${activeYearName}-0001`,
      issueDate: today,
      leavingDate: today,
      leavingClass: '',
      reason: '',
      destinationSchool: '',
      conductRemarks: 'উত্তম ও শৃঙ্খলাপরায়ণ',
      duesCleared: true,
      promotedToNextClass: false,
      remarks: '',
    });
    setIssueOpen(true);
  };

  const handleStudentChange = (studentId: string) => {
    const meta = eligibleStudents.find((item) => item.student.id === studentId);
    setForm((prev) => ({
      ...prev,
      studentId,
      leavingClass: meta ? (meta.classNameBn) : '',
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.studentId) {
      toast.error('একজন সক্রিয় শিক্ষার্থী নির্বাচন করুন।');
      return;
    }
    if (!form.tcNumber.trim()) {
      toast.error('টিসি নম্বর দিন।');
      return;
    }
    if (!form.reason.trim()) {
      toast.error('বিদ্যালয় ত্যাগের কারণ উল্লেখ করুন।');
      return;
    }

    try {
      const created = await issueTc({
        studentId: form.studentId,
        tcNumber: form.tcNumber.trim(),
        issueDate: form.issueDate,
        leavingDate: form.leavingDate,
        leavingClass: form.leavingClass.trim() || null,
        reason: form.reason.trim(),
        destinationSchool: form.destinationSchool.trim() || null,
        conductRemarks: form.conductRemarks.trim() || null,
        duesCleared: form.duesCleared,
        promotedToNextClass: form.promotedToNextClass,
        remarks: form.remarks.trim() || null,
      }).unwrap();

      const blockedMsg =
        created.autoBlockedCards && created.autoBlockedCards > 0
          ? ` · ${formatNumber(created.autoBlockedCards, 'bn')}টি সক্রিয় RFID কার্ড স্বয়ংক্রিয়ভাবে বন্ধ হয়েছে।`
          : '';

      toast.success(
        `${'ছাড়পত্র ইস্যু সম্পন্ন হয়েছে'} (${created.tcNumber})${blockedMsg}`
      );
      setIssueOpen(false);
      setPrintId(created.id);
    } catch (err) {
      toast.error(errorMessage(err, 'ছাড়পত্র ইস্যু করা যায়নি।'));
    }
  };

  const handleExportCsv = () => {
    exportToCsv(
      rows.map((r) => ({
        tcNumber: r.tcNumber,
        studentId: r.studentCode,
        nameBn: r.studentNameBn,
        nameEn: r.studentNameEn,
        leavingClass: r.leavingClassDisplay,
        issueDate: r.issueDate,
        leavingDate: r.leavingDate,
        promotedToNextClass: r.promotedToNextClass ? 'Yes' : 'No',
        duesCleared: r.duesCleared ? 'Cleared' : 'Pending',
        conduct: r.conductRemarks ?? '',
        destinationSchool: r.destinationSchool ?? '',
        reason: r.reason,
      })),
      `transfer-certificates-${activeYearName}.csv`
    );
  };

  const printedRow = rows.find((item) => item.id === printId) ?? null;

  if (loadingTc && !tcRes) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-5">
      {/* 1. 4-Column Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-3">
          <span className="text-base font-bold text-foreground">
            {'মোট ইস্যুকৃত ছাড়পত্র'}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {formatNumber(summary.totalIssued, 'bn')}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {`${activeYearName} সেশনে ${formatNumber(summary.issuedThisYear, 'bn')}টি`}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {'স্থায়ী নথি হিসেবে সংরক্ষিত'}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-3">
          <span className="text-base font-bold text-foreground">
            {'বকেয়া নিষ্পত্তি'}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {formatNumber(summary.duesClearedCount, 'bn')}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {'টি পরিশোধিত'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            {summary.duesPendingCount > 0
              ? `${formatNumber(summary.duesPendingCount, 'bn')}টি টিসি-তে বকেয়া চিহ্নিত`
              : 'সকল ইস্যুকৃত টিসি বকেয়া মুক্ত'}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-3">
          <span className="text-base font-bold text-foreground">
            {'উত্তরণ অবস্থা (ত্যাগকালে)'}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {formatNumber(summary.promotedLeavingCount, 'bn')}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {'জন উত্তীর্ণ হয়ে ত্যাগ'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            {`মধ্য-সেশনে স্থানান্তর ${formatNumber(summary.midSessionCount, 'bn')} জন`}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-3">
          <span className="text-base font-bold text-foreground">
            {'বর্তমান সক্রিয় শিক্ষার্থী'}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">
              {formatNumber(summary.activeStudentsCount, 'bn')}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {'জন অধ্যয়নরত'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {'টিসি ইস্যু হলে সক্রিয় কার্ড অটো-ব্লক হয়'}
          </p>
        </Card>
      </div>

      {/* 2. Unified Search, Filter & Action Toolbar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative w-full lg:max-w-xs shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={'টিসি নম্বর, নাম বা আইডি খুঁজুন...'}
              className="pl-9 pr-9 h-10 text-base w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={'মুছুন'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={duesFilter}
              onChange={(e) => {
                setDuesFilter(e.target.value as 'ALL' | 'CLEARED' | 'PENDING');
                setPage(1);
              }}
              className="w-auto min-w-[155px] h-10 text-base"
              aria-label={'বকেয়া অবস্থা'}
            >
              <option value="ALL">{'সকল বকেয়া অবস্থা'}</option>
              <option value="CLEARED">{'পরিশোধিত'}</option>
              <option value="PENDING">{'অপরিশোধিত'}</option>
            </Select>

            <Select
              value={promotionFilter}
              onChange={(e) => {
                setPromotionFilter(e.target.value as 'ALL' | 'PROMOTED' | 'MID');
                setPage(1);
              }}
              className="w-auto min-w-[155px] h-10 text-base"
              aria-label={'উত্তরণ অবস্থা'}
            >
              <option value="ALL">{'সকল ত্যাগ ধরন'}</option>
              <option value="PROMOTED">{'পরবর্তী শ্রেণিতে উত্তীর্ণ'}</option>
              <option value="MID">{'মধ্য-সেশন ত্যাগ'}</option>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={handleExportCsv}
              disabled={rows.length === 0}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{'এক্সপোর্ট CSV'}</span>
            </Button>

            <Button variant="primary" size="sm" className="h-9" onClick={openIssueModal}>
              <Plus className="w-4 h-4" />
              <span>{'নতুন ছাড়পত্র ইস্যু'}</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border text-sm text-muted-foreground">
          <span className="tabular-nums">
            {hasActiveFilters
              ? `মোট ${formatNumber(summary.totalIssued, 'bn')}টি ছাড়পত্রের মধ্যে ${formatNumber(tcRes?.meta.total ?? 0, 'bn')}টি দেখানো হচ্ছে`
              : 'ছাড়পত্র ইস্যু হলে শিক্ষার্থীর অবস্থা স্থানান্তরিত হয়, চলতি এনরোলমেন্ট বন্ধ হয় এবং সক্রিয় RFID কার্ড ব্লক হয়ে যায়'}
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{'ফিল্টার রিসেট করুন'}</span>
            </button>
          )}
        </div>
      </Card>

      {/* 3. Transfer Certificate Registry Table */}
      <DataTable
        data={rows}
        hideToolbar
        isLoading={fetchingTc}
        server={{
          search: searchQuery,
          onSearch: setSearchQuery,
          meta: tcRes?.meta,
          onPage: setPage,
        }}
        emptyTitle={
          summary.totalIssued === 0
            ? 'এখনো কোনো ছাড়পত্র ইস্যু করা হয়নি'
            : 'ফিল্টার অনুযায়ী কোনো ছাড়পত্র পাওয়া যায়নি'
        }
        emptyAction={
          summary.totalIssued === 0 ? (
            <Button variant="primary" size="sm" onClick={openIssueModal}>
              <Plus className="w-4 h-4" />
              <span>{'প্রথম ছাড়পত্র ইস্যু করুন'}</span>
            </Button>
          ) : hasActiveFilters ? (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{'ফিল্টার রিসেট করুন'}</span>
            </Button>
          ) : undefined
        }
        columns={[
          {
            accessorKey: 'tcNumber',
            header: 'টিসি নম্বর ও ইস্যু',
            cell: ({ row }) => (
              <div className="whitespace-nowrap tabular-nums">
                <span className="font-mono text-base font-semibold text-foreground block">
                  {row.original.tcNumber}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDateShort(row.original.issueDate, 'bn')}
                </span>
              </div>
            ),
          },
          {
            accessorKey: 'studentNameBn',
            header: 'শিক্ষার্থী ও আইডি',
            cell: ({ row }) => (
              <div className="flex items-center gap-3 min-w-[200px]">
                <div
                  className={cn(
                    'w-8 h-8 rounded-[var(--radius)] flex items-center justify-center font-semibold text-sm shrink-0 border border-border',
                    row.original.studentGender === Gender.FEMALE
                      ? 'bg-secondary/10 text-secondary'
                      : 'bg-primary/10 text-primary'
                  )}
                >
                  {studentInitials(row.original.studentNameEn)}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/admin/students/${row.original.studentId}`}
                    className="font-semibold text-foreground hover:text-primary hover:underline block truncate leading-snug"
                  >
                    {row.original.studentNameBn}
                  </Link>
                  <span className="block text-sm font-mono text-muted-foreground truncate">
                    {row.original.studentCode}
                  </span>
                </div>
              </div>
            ),
          },
          {
            accessorKey: 'leavingClassDisplay',
            header: 'শ্রেণি ও ত্যাগের তারিখ',
            cell: ({ row }) => (
              <div className="whitespace-nowrap tabular-nums">
                <span className="font-medium text-foreground block">
                  {row.original.leavingClassDisplay}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDateShort(row.original.leavingDate, 'bn')} ·{' '}
                  {row.original.promotedToNextClass
                    ? 'উত্তীর্ণ'
                    : 'মধ্য-সেশন'}
                </span>
              </div>
            ),
          },
          {
            accessorKey: 'destinationSchool',
            header: 'গন্তব্য ও কারণ',
            cell: ({ row }) => (
              <div className="max-w-[260px]">
                <span className="font-medium text-foreground block truncate">
                  {row.original.destinationSchool || 'উল্লেখ নেই'}
                </span>
                <span className="text-sm text-muted-foreground block truncate">
                  {row.original.reason}
                </span>
              </div>
            ),
          },
          {
            id: 'clearance',
            header: 'বকেয়া ও আচরণ',
            enableSorting: false,
            cell: ({ row }) => (
              <div className="whitespace-nowrap text-sm">
                <span
                  className={cn(
                    'font-semibold block',
                    row.original.duesCleared ? 'text-success' : 'text-warning'
                  )}
                >
                  {row.original.duesCleared
                    ? 'বকেয়া পরিশোধিত'
                    : 'বকেয়া অপরিশোধিত'}
                </span>
                <span className="text-muted-foreground block max-w-[160px] truncate mt-0.5">
                  {row.original.conductRemarks || 'উত্তম'}
                </span>
              </div>
            ),
          },
          {
            id: 'actions',
            header: '',
            enableSorting: false,
            cell: ({ row }) => (
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-sm"
                  onClick={() => setPrintId(row.original.id)}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{'দেখুন ও প্রিন্ট'}</span>
                </Button>
                <Link
                  href={`/admin/students/${row.original.studentId}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  aria-label={'শিক্ষার্থীর প্রোফাইল'}
                  title={'শিক্ষার্থীর প্রোফাইল'}
                >
                  <Eye className="w-3.5 h-3.5" />
                </Link>
              </div>
            ),
          },
        ]}
      />

      {/* 4. Issue Transfer Certificate Modal */}
      <Modal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        title={'নতুন ছাড়পত্র (TC) ইস্যু করুন'}
        description={'সক্রিয় শিক্ষার্থী নির্বাচন করে অফিসিয়াল ছাড়পত্র তৈরি করুন। ইস্যু হওয়ার সাথে সাথে প্রিন্ট কপি পাওয়া যাবে।'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={'সক্রিয় শিক্ষার্থী নির্বাচন'} required>
              <Select
                value={form.studentId}
                onChange={(e) => handleStudentChange(e.target.value)}
              >
                <option value="">{'শিক্ষার্থী বেছে নিন...'}</option>
                {eligibleStudents.map((item) => (
                  <option key={item.student.id} value={item.student.id}>
                    {item.student.nameBn || item.student.nameEn} · {item.classDisplay} ({item.sectionName}, {'রোল'} {item.roll})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label={'টিসি স্মারক নম্বর'} required>
              <Input
                value={form.tcNumber}
                onChange={(e) => setForm({ ...form, tcNumber: e.target.value })}
                className="font-mono"
                placeholder={`TC-${activeYearName}-0001`}
              />
            </FormField>
          </div>

          {selectedStudentMeta && (
            <div className="p-3.5 rounded-[var(--radius)] bg-surface-muted/60 border border-border space-y-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedStudentMeta.student.nameBn || selectedStudentMeta.student.nameEn}{' '}
                    <span className="font-normal text-muted-foreground">
                      ({selectedStudentMeta.student.nameEn})
                    </span>
                  </p>
                  <p className="text-muted-foreground tabular-nums mt-0.5">
                    {selectedStudentMeta.student.studentId} · {selectedStudentMeta.classDisplay} (
                    {selectedStudentMeta.sectionName}) · {'রোল'}{' '}
                    {formatNumber(selectedStudentMeta.roll, 'bn')}
                    {selectedStudentMeta.guardianName
                      ? ` · ${'অভিভাবক:'} ${selectedStudentMeta.guardianName} (${selectedStudentMeta.guardianPhone})`
                      : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label={'শেষ অধ্যয়নরত শ্রেণি'} required>
              <Input
                value={form.leavingClass}
                onChange={(e) => setForm({ ...form, leavingClass: e.target.value })}
                placeholder={'যেমন: ৮ম শ্রেণি'}
              />
            </FormField>
            <FormField label={'ইস্যুর তারিখ'} required>
              <Input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
              />
            </FormField>
            <FormField label={'বিদ্যালয় ত্যাগের তারিখ'} required>
              <Input
                type="date"
                value={form.leavingDate}
                onChange={(e) => setForm({ ...form, leavingDate: e.target.value })}
              />
            </FormField>
          </div>

          <div className="space-y-2">
            <FormField label={'বিদ্যালয় ত্যাগের কারণ'} required>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder={'যেমন: অভিভাবকের কর্মস্থল পরিবর্তনের কারণে ঢাকায় স্থানান্তর...'}
              />
            </FormField>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm text-muted-foreground mr-1">
                {'দ্রুত নির্বাচন:'}
              </span>
              {REASON_PRESETS.map((preset) => {
                const text = preset.bn;
                return (
                  <button
                    key={preset.en}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, reason: text }))}
                    className="px-2 py-1 text-sm rounded border border-border bg-surface hover:bg-surface-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {text.length > 34 ? `${text.slice(0, 34)}…` : text}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={'গন্তব্য বিদ্যালয়'}>
              <Input
                value={form.destinationSchool}
                onChange={(e) => setForm({ ...form, destinationSchool: e.target.value })}
                placeholder={'নতুন বিদ্যালয়ের নাম ও ঠিকানা'}
              />
            </FormField>
            <FormField label={'আচরণ ও চরিত্র'}>
              <Input
                value={form.conductRemarks}
                onChange={(e) => setForm({ ...form, conductRemarks: e.target.value })}
                placeholder={'উত্তম ও শৃঙ্খলাপরায়ণ'}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-[var(--radius)] border border-border bg-surface-muted/30">
            <label className="flex items-start gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.duesCleared}
                onChange={(e) => setForm({ ...form, duesCleared: e.target.checked })}
              />
              <span>
                <span className="font-medium text-foreground block">
                  {'সকল বকেয়া পরিশোধিত'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {'টিসি-তে বকেয়া মুক্ত হিসেবে উল্লেখ থাকবে'}
                </span>
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.promotedToNextClass}
                onChange={(e) => setForm({ ...form, promotedToNextClass: e.target.checked })}
              />
              <span>
                <span className="font-medium text-foreground block">
                  {'পরবর্তী শ্রেণিতে উত্তীর্ণ'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {'বার্ষিক পরীক্ষায় উত্তীর্ণ হলে টিক দিন'}
                </span>
              </span>
            </label>
          </div>

          {!form.duesCleared && (
            <div className="flex items-start gap-2 p-3 rounded-[var(--radius)] border border-warning/40 bg-warning/5 text-sm text-warning">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {'বকেয়া অপরিশোধিত অবস্থায় ছাড়পত্র ইস্যু করলে অফিসিয়াল টিসি-তে "অপরিশোধিত" লেখা প্রদর্শিত হবে।'}
              </span>
            </div>
          )}

          <div className="p-3 rounded-[var(--radius)] border border-border bg-surface-muted/40 text-sm text-muted-foreground">
            {'নিশ্চিত করলে শিক্ষার্থী স্থায়ীভাবে স্থানান্তরিত (TRANSFERRED) হিসেবে চিহ্নিত হবে এবং বর্তমান শ্রেণি ও হাজিরা তালিকা থেকে বাদ পড়বে। পূর্বের পরীক্ষার রেজাল্ট ও নথি সংরক্ষিত থাকবে।'}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIssueOpen(false)}>
              {'বাতিল'}
            </Button>
            <Button type="submit" variant="primary" disabled={issuing || !form.studentId}>
              <FileCheck2 className="w-4 h-4" />
              <span>
                {issuing
                  ? 'ইস্যু হচ্ছে...'
                  : 'ছাড়পত্র ইস্যু ও প্রিন্ট করুন'}
              </span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Official Print Preview Modal */}
      <Modal
        open={Boolean(printedRow && printedRow.rawStudent)}
        onClose={() => setPrintId(null)}
        title={
          printedRow
            ? `${'অফিসিয়াল ছাড়পত্র'} · ${printedRow.tcNumber}`
            : 'ছাড়পত্র'
        }
        maxWidth="max-w-4xl"
      >
        {printedRow && printedRow.rawStudent && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border no-print">
              <Link
                href={`/admin/students/${printedRow.studentId}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{'শিক্ষার্থীর সংরক্ষিত প্রোফাইল দেখুন'}</span>
              </Link>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() =>
                  triggerCertificatePrint({
                    kind: 'TC',
                    school: schoolProfile,
                    tc: printedRow,
                    student: printedRow.rawStudent!,
                    fatherName: printedRow.fatherName,
                    motherName: printedRow.motherName,
                    sectionName: printedRow.sectionName,
                    roll: printedRow.roll,
                  })
                }
              >
                <Printer className="w-4 h-4" />
                <span>{'প্রিন্ট করুন'}</span>
              </Button>
            </div>
            <PrintableTransferCertificate
              school={schoolProfile}
              tc={printedRow}
              student={printedRow.rawStudent}
              fatherName={printedRow.fatherName}
              motherName={printedRow.motherName}
              sectionName={printedRow.sectionName}
              roll={printedRow.roll}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
