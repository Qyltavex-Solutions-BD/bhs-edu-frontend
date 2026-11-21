'use client';

import React, { useMemo, useState } from 'react';
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
  ShieldAlert,
  X,
} from 'lucide-react';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { cn, exportToCsv, triggerPrint } from '@/src/lib/utils/cn';
import { localToday } from '@/src/lib/schoolDay';
import { DataTable } from '@/src/components/shared/DataTable';
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
import { useIssueTransferCertificateMutation } from '@/src/store/api';
import { CardStatus, EnrollmentStatus, Gender, StudentStatus } from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import type { StudentTransferCertificate } from '@/src/types/entities';
import { classLabel, errorMessage, studentInitials } from './studentShared';

interface EnrichedTransfer extends StudentTransferCertificate {
  studentNameBn: string;
  studentNameEn: string;
  studentCode: string;
  studentGender: Gender;
  fatherName: string;
  guardianPhone: string;
  leavingClassDisplay: string;
  issueYear: string;
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

function suggestNextTcNumber(db: MockDatabase, yearStr: string): string {
  const prefix = `TC-${yearStr}-`;
  let maxSeq = 0;
  db.transferCertificates.forEach((tc) => {
    const match = tc.tcNumber.match(/(\d+)$/);
    if (tc.tcNumber.toUpperCase().startsWith(prefix) && match) {
      const n = Number(match[1]);
      if (Number.isFinite(n) && n > maxSeq) maxSeq = n;
    }
  });
  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

export function StudentTransfers({ db }: { db: MockDatabase }) {
  const { locale, pick } = useI18n();
  const [issueTc, { isLoading }] = useIssueTransferCertificateMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [duesFilter, setDuesFilter] = useState<'ALL' | 'CLEARED' | 'PENDING'>('ALL');
  const [promotionFilter, setPromotionFilter] = useState<'ALL' | 'PROMOTED' | 'MID'>('ALL');

  const [issueOpen, setIssueOpen] = useState(false);
  const [printId, setPrintId] = useState<string | null>(null);

  const activeYear = db.academicYears.find((y) => y.isActive) ?? db.academicYears[0];
  const activeYearName = activeYear?.name ?? '2026';

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

  // Lookup primary guardian for a student
  const getPrimaryGuardian = (studentId: string) => {
    const link =
      db.parentStudents.find((ps) => ps.studentId === studentId && ps.isPrimary) ??
      db.parentStudents.find((ps) => ps.studentId === studentId);
    const parent = link ? db.parents.find((p) => p.id === link.parentId) : null;
    return {
      name: parent ? (locale === 'bn' ? parent.nameBn || parent.name : parent.name) : '',
      phone: parent?.phone ?? '',
    };
  };

  // Active students eligible for TC issuance, sorted by class & roll
  const eligibleStudents = useMemo(() => {
    return db.students
      .filter((item) => item.status === StudentStatus.ACTIVE)
      .map((student) => {
        const enrollment =
          db.enrollments.find(
            (e) => e.studentId === student.id && e.status === EnrollmentStatus.ACTIVE
          ) ??
          db.enrollments.find((e) => e.studentId === student.id);
        const cls = enrollment ? db.classes.find((c) => c.id === enrollment.classId) : null;
        const sec = enrollment ? db.sections.find((s) => s.id === enrollment.sectionId) : null;
        const activeCards = db.rfidCards.filter(
          (c) => c.studentId === student.id && c.status === CardStatus.ACTIVE
        );
        const guardian = getPrimaryGuardian(student.id);
        return {
          student,
          enrollment,
          classNumeric: cls?.numericValue ?? 99,
          classNameBn: cls?.nameBn || cls?.name || '',
          classNameEn: cls?.name || '',
          classDisplay: enrollment ? classLabel(db, enrollment.classId, locale) : '—',
          sectionName: sec?.name ?? '—',
          roll: enrollment?.roll ?? 0,
          activeCards,
          guardianName: guardian.name,
          guardianPhone: guardian.phone,
        };
      })
      .sort(
        (a, b) =>
          a.classNumeric - b.classNumeric ||
          a.sectionName.localeCompare(b.sectionName) ||
          a.roll - b.roll
      );
  }, [db, locale]);

  const selectedStudentMeta = useMemo(
    () => eligibleStudents.find((item) => item.student.id === form.studentId) ?? null,
    [eligibleStudents, form.studentId]
  );

  // Enriched TC registry rows
  const allTransfers = useMemo<EnrichedTransfer[]>(() => {
    return db.transferCertificates.map((tc) => {
      const student = db.students.find((s) => s.id === tc.studentId);
      const enrollment = tc.enrollmentId
        ? db.enrollments.find((e) => e.id === tc.enrollmentId)
        : db.enrollments.find((e) => e.studentId === tc.studentId);
      const guardian = getPrimaryGuardian(tc.studentId);
      const fallbackClass = enrollment ? classLabel(db, enrollment.classId, locale) : '—';
      return {
        ...tc,
        studentNameBn: student?.nameBn || student?.nameEn || '—',
        studentNameEn: student?.nameEn || '',
        studentCode: student?.studentId ?? '—',
        studentGender: student?.gender ?? Gender.MALE,
        fatherName: guardian.name,
        guardianPhone: guardian.phone,
        leavingClassDisplay: tc.leavingClass || fallbackClass,
        issueYear: tc.issueDate ? tc.issueDate.slice(0, 4) : '',
      };
    });
  }, [db, locale]);

  // Summary metrics
  const totalIssued = allTransfers.length;
  const issuedThisYear = allTransfers.filter((t) => t.issueYear === activeYearName).length;
  const duesClearedCount = allTransfers.filter((t) => t.duesCleared).length;
  const duesPendingCount = totalIssued - duesClearedCount;
  const promotedLeavingCount = allTransfers.filter((t) => t.promotedToNextClass).length;
  const midSessionCount = totalIssued - promotedLeavingCount;

  // Filtered rows
  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allTransfers
      .filter((row) => {
        if (duesFilter === 'CLEARED') return row.duesCleared;
        if (duesFilter === 'PENDING') return !row.duesCleared;
        return true;
      })
      .filter((row) => {
        if (promotionFilter === 'PROMOTED') return row.promotedToNextClass;
        if (promotionFilter === 'MID') return !row.promotedToNextClass;
        return true;
      })
      .filter((row) => {
        if (!q) return true;
        return (
          row.tcNumber.toLowerCase().includes(q) ||
          row.studentNameBn.toLowerCase().includes(q) ||
          row.studentNameEn.toLowerCase().includes(q) ||
          row.studentCode.toLowerCase().includes(q) ||
          (row.destinationSchool ?? '').toLowerCase().includes(q) ||
          row.reason.toLowerCase().includes(q) ||
          row.leavingClassDisplay.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  }, [allTransfers, searchQuery, duesFilter, promotionFilter]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) || duesFilter !== 'ALL' || promotionFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setDuesFilter('ALL');
    setPromotionFilter('ALL');
  };

  const openIssueModal = () => {
    const today = localToday();
    setForm({
      studentId: '',
      tcNumber: suggestNextTcNumber(db, activeYearName),
      issueDate: today,
      leavingDate: today,
      leavingClass: '',
      reason: '',
      destinationSchool: '',
      conductRemarks: pick('উত্তম ও শৃঙ্খলাপরায়ণ', 'Good and disciplined'),
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
      leavingClass: meta ? (locale === 'bn' ? meta.classNameBn : meta.classNameEn) : '',
    }));
  };

  const duplicateTcNumber = useMemo(() => {
    const num = form.tcNumber.trim().toLowerCase();
    if (!num) return false;
    return db.transferCertificates.some((tc) => tc.tcNumber.trim().toLowerCase() === num);
  }, [db.transferCertificates, form.tcNumber]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.studentId) {
      toast.error(pick('একজন সক্রিয় শিক্ষার্থী নির্বাচন করুন।', 'Please select an active student.'));
      return;
    }
    if (!form.tcNumber.trim() || duplicateTcNumber) {
      toast.error(
        duplicateTcNumber
          ? pick('এই টিসি নম্বরটি আগেই ব্যবহৃত হয়েছে।', 'This TC number is already in use.')
          : pick('টিসি নম্বর দিন।', 'TC number is required.')
      );
      return;
    }
    if (!form.reason.trim()) {
      toast.error(pick('বিদ্যালয় ত্যাগের কারণ উল্লেখ করুন।', 'Reason for leaving is required.'));
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
          ? pick(
              ` · ${formatNumber(created.autoBlockedCards, locale)}টি সক্রিয় RFID কার্ড স্বয়ংক্রিয়ভাবে বন্ধ হয়েছে।`,
              ` · ${created.autoBlockedCards} active RFID card auto-blocked.`
            )
          : '';

      toast.success(
        `${pick('ছাড়পত্র ইস্যু সম্পন্ন হয়েছে', 'Transfer certificate issued')} (${created.tcNumber})${blockedMsg}`
      );
      setIssueOpen(false);
      // Immediately open official print preview so clerk can print right away
      setPrintId(created.id);
    } catch (err) {
      toast.error(errorMessage(err, pick('ছাড়পত্র ইস্যু করা যায়নি।', 'Could not issue transfer certificate.')));
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

  const printedTc = db.transferCertificates.find((item) => item.id === printId) ?? null;
  const printedStudent = printedTc
    ? db.students.find((item) => item.id === printedTc.studentId) ?? null
    : null;
  const printedGuardian = printedStudent ? getPrimaryGuardian(printedStudent.id) : null;

  return (
    <div className="space-y-5">
      {/* 1. 4-Column Hairline-Divided Summary Strip */}
      <Card className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {pick('মোট ইস্যুকৃত ছাড়পত্র', 'Total Issued TCs')}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl sm:text-3xl font-bold text-foreground">
              {formatNumber(totalIssued, locale)}
            </span>
            <span className="text-xs text-muted-foreground">
              {pick(
                `${activeYearName} সেশনে ${formatNumber(issuedThisYear, locale)}টি`,
                `${issuedThisYear} in ${activeYearName}`
              )}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {pick('স্থায়ী নথি হিসেবে সংরক্ষিত', 'Archived in permanent registry')}
          </p>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {pick('বকেয়া নিষ্পত্তি', 'Dues Clearance')}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl sm:text-3xl font-bold text-foreground">
              {formatNumber(duesClearedCount, locale)}
            </span>
            <span className="text-xs text-muted-foreground">
              {pick('টি পরিশোধিত', 'cleared')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            {duesPendingCount > 0
              ? pick(
                  `${formatNumber(duesPendingCount, locale)}টি টিসি-তে বকেয়া চিহ্নিত`,
                  `${duesPendingCount} marked with pending dues`
                )
              : pick('সকল ইস্যুকৃত টিসি বকেয়া মুক্ত', 'All issued certificates cleared')}
          </p>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {pick('উত্তরণ অবস্থা (ত্যাগকালে)', 'Promotion Standing')}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl sm:text-3xl font-bold text-foreground">
              {formatNumber(promotedLeavingCount, locale)}
            </span>
            <span className="text-xs text-muted-foreground">
              {pick('জন উত্তীর্ণ হয়ে ত্যাগ', 'promoted before leaving')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            {pick(
              `মধ্য-সেশনে স্থানান্তর ${formatNumber(midSessionCount, locale)} জন`,
              `${midSessionCount} mid-session transfers`
            )}
          </p>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {pick('বর্তমান সক্রিয় শিক্ষার্থী', 'Active Student Roster')}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl sm:text-3xl font-bold text-primary">
              {formatNumber(eligibleStudents.length, locale)}
            </span>
            <span className="text-xs text-muted-foreground">
              {pick('জন অধ্যয়নরত', 'currently enrolled')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {pick('টিসি ইস্যু হলে সক্রিয় কার্ড অটো-ব্লক হয়', 'Active RFID cards auto-block on TC')}
          </p>
        </div>
      </Card>

      {/* 2. Unified Search, Filter & Action Toolbar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center gap-2.5">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={pick(
                'টিসি নম্বর, শিক্ষার্থীর নাম, আইডি, শ্রেণি বা গন্তব্য বিদ্যালয় খুঁজুন...',
                'Search TC number, student name, ID, class, or destination school...'
              )}
              className="pl-9 pr-9 h-9 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={pick('মুছুন', 'Clear')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={duesFilter}
              onChange={(e) => setDuesFilter(e.target.value as 'ALL' | 'CLEARED' | 'PENDING')}
              className="w-36 h-9 text-sm"
              aria-label={pick('বকেয়া অবস্থা', 'Dues status')}
            >
              <option value="ALL">{pick('সকল বকেয়া অবস্থা', 'All dues status')}</option>
              <option value="CLEARED">{pick('পরিশোধিত', 'Dues cleared')}</option>
              <option value="PENDING">{pick('অপরিশোধিত', 'Dues pending')}</option>
            </Select>

            <Select
              value={promotionFilter}
              onChange={(e) => setPromotionFilter(e.target.value as 'ALL' | 'PROMOTED' | 'MID')}
              className="w-40 h-9 text-sm"
              aria-label={pick('উত্তরণ অবস্থা', 'Promotion status')}
            >
              <option value="ALL">{pick('সকল ত্যাগ ধরন', 'All leaving types')}</option>
              <option value="PROMOTED">{pick('পরবর্তী শ্রেণিতে উত্তীর্ণ', 'Promoted to next')}</option>
              <option value="MID">{pick('মধ্য-সেশন ত্যাগ', 'Mid-session leaving')}</option>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={handleExportCsv}
              disabled={rows.length === 0}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{pick('এক্সপোর্ট CSV', 'Export CSV')}</span>
            </Button>

            <Button variant="primary" size="sm" className="h-9" onClick={openIssueModal}>
              <Plus className="w-4 h-4" />
              <span>{pick('নতুন ছাড়পত্র ইস্যু', 'Issue Certificate')}</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border text-xs text-muted-foreground">
          <span className="tabular-nums">
            {hasActiveFilters
              ? pick(
                  `মোট ${formatNumber(totalIssued, locale)}টি ছাড়পত্রের মধ্যে ${formatNumber(rows.length, locale)}টি দেখানো হচ্ছে`,
                  `Showing ${rows.length} of ${totalIssued} transfer certificates`
                )
              : pick(
                  'ছাড়পত্র ইস্যু হলে শিক্ষার্থীর অবস্থা স্থানান্তরিত হয়, চলতি এনরোলমেন্ট বন্ধ হয় এবং সক্রিয় RFID কার্ড ব্লক হয়ে যায়',
                  'Issuing a TC marks the student transferred, closes active enrollment, and auto-blocks active RFID cards'
                )}
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{pick('ফিল্টার রিসেট করুন', 'Reset filters')}</span>
            </button>
          )}
        </div>
      </Card>

      {/* 3. High-Density Transfer Certificate Registry Table */}
      <DataTable
        data={rows}
        hideToolbar
        pageSize={15}
        emptyTitle={
          totalIssued === 0
            ? pick('এখনো কোনো ছাড়পত্র ইস্যু করা হয়নি', 'No transfer certificates issued yet')
            : pick('ফিল্টার অনুযায়ী কোনো ছাড়পত্র পাওয়া যায়নি', 'No matching certificates found')
        }
        emptyAction={
          totalIssued === 0 ? (
            <Button variant="primary" size="sm" onClick={openIssueModal}>
              <Plus className="w-4 h-4" />
              <span>{pick('প্রথম ছাড়পত্র ইস্যু করুন', 'Issue first certificate')}</span>
            </Button>
          ) : hasActiveFilters ? (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{pick('ফিল্টার রিসেট করুন', 'Reset filters')}</span>
            </Button>
          ) : undefined
        }
        columns={[
          {
            accessorKey: 'tcNumber',
            header: pick('টিসি নম্বর ও ইস্যু', 'TC No. & Issued'),
            cell: ({ row }) => (
              <div className="whitespace-nowrap tabular-nums">
                <span className="font-mono text-sm font-semibold text-foreground block">
                  {row.original.tcNumber}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDateShort(row.original.issueDate, locale)}
                </span>
              </div>
            ),
          },
          {
            accessorKey: 'studentNameBn',
            header: pick('শিক্ষার্থী ও আইডি', 'Student & ID'),
            cell: ({ row }) => (
              <div className="flex items-center gap-3 min-w-[200px]">
                <div
                  className={cn(
                    'w-8 h-8 rounded-[var(--radius)] flex items-center justify-center font-semibold text-xs shrink-0 border border-border',
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
                  <span className="block text-xs font-mono text-muted-foreground truncate">
                    {row.original.studentCode}
                  </span>
                </div>
              </div>
            ),
          },
          {
            accessorKey: 'leavingClassDisplay',
            header: pick('শ্রেণি ও ত্যাগের তারিখ', 'Leaving Class & Date'),
            cell: ({ row }) => (
              <div className="whitespace-nowrap tabular-nums">
                <span className="font-medium text-foreground block">
                  {row.original.leavingClassDisplay}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDateShort(row.original.leavingDate, locale)} ·{' '}
                  {row.original.promotedToNextClass
                    ? pick('উত্তীর্ণ', 'Promoted')
                    : pick('মধ্য-সেশন', 'Mid-session')}
                </span>
              </div>
            ),
          },
          {
            accessorKey: 'destinationSchool',
            header: pick('গন্তব্য ও কারণ', 'Destination & Reason'),
            cell: ({ row }) => (
              <div className="max-w-[260px]">
                <span className="font-medium text-foreground block truncate">
                  {row.original.destinationSchool || pick('উল্লেখ নেই', 'Not specified')}
                </span>
                <span className="text-xs text-muted-foreground block truncate">
                  {row.original.reason}
                </span>
              </div>
            ),
          },
          {
            id: 'clearance',
            header: pick('বকেয়া ও আচরণ', 'Clearance & Conduct'),
            enableSorting: false,
            cell: ({ row }) => (
              <div className="whitespace-nowrap text-xs">
                <span
                  className={cn(
                    'font-semibold block',
                    row.original.duesCleared ? 'text-success' : 'text-warning'
                  )}
                >
                  {row.original.duesCleared
                    ? pick('বকেয়া পরিশোধিত', 'Dues cleared')
                    : pick('বকেয়া অপরিশোধিত', 'Dues pending')}
                </span>
                <span className="text-muted-foreground block max-w-[160px] truncate mt-0.5">
                  {row.original.conductRemarks || pick('উত্তম', 'Good')}
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
                  className="h-8 px-2.5 text-xs"
                  onClick={() => setPrintId(row.original.id)}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{pick('দেখুন ও প্রিন্ট', 'Preview & Print')}</span>
                </Button>
                <Link
                  href={`/admin/students/${row.original.studentId}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  aria-label={pick('শিক্ষার্থীর প্রোফাইল', 'View student dossier')}
                  title={pick('শিক্ষার্থীর প্রোফাইল', 'View student dossier')}
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
        title={pick('নতুন ছাড়পত্র (TC) ইস্যু করুন', 'Issue Transfer Certificate')}
        description={pick(
          'সক্রিয় শিক্ষার্থী নির্বাচন করে অফিসিয়াল ছাড়পত্র তৈরি করুন। ইস্যু হওয়ার সাথে সাথে প্রিন্ট কপি পাওয়া যাবে।',
          'Select an active student to generate an official Transfer Certificate. A printable copy opens immediately upon issuance.'
        )}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Student Selection + TC Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={pick('সক্রিয় শিক্ষার্থী নির্বাচন', 'Select Active Student')} required>
              <Select
                value={form.studentId}
                onChange={(e) => handleStudentChange(e.target.value)}
              >
                <option value="">{pick('শিক্ষার্থী বেছে নিন...', 'Choose a student...')}</option>
                {eligibleStudents.map((item) => (
                  <option key={item.student.id} value={item.student.id}>
                    {item.student.nameBn || item.student.nameEn} · {item.classDisplay} ({item.sectionName}, {pick('রোল', 'Roll')} {item.roll})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label={pick('টিসি স্মারক নম্বর', 'TC Reference Number')}
              required
              error={
                duplicateTcNumber
                  ? pick('এই টিসি নম্বরটি আগেই ব্যবহৃত হয়েছে।', 'This TC number already exists.')
                  : undefined
              }
            >
              <Input
                value={form.tcNumber}
                onChange={(e) => setForm({ ...form, tcNumber: e.target.value })}
                className="font-mono"
                placeholder={`TC-${activeYearName}-002`}
              />
            </FormField>
          </div>

          {/* Selected Student Context & Impact Preview */}
          {selectedStudentMeta && (
            <div className="p-3.5 rounded-[var(--radius)] bg-surface-muted/60 border border-border space-y-2 text-xs">
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
                    {selectedStudentMeta.sectionName}) · {pick('রোল', 'Roll')}{' '}
                    {formatNumber(selectedStudentMeta.roll, locale)}
                    {selectedStudentMeta.guardianName
                      ? ` · ${pick('অভিভাবক:', 'Guardian:')} ${selectedStudentMeta.guardianName} (${selectedStudentMeta.guardianPhone})`
                      : ''}
                  </p>
                </div>
              </div>

              {selectedStudentMeta.activeCards.length > 0 && (
                <div className="flex items-start gap-2 pt-2 border-t border-border text-warning">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {pick(
                      `সতর্কতা: এই শিক্ষার্থীর সক্রিয় RFID কার্ড (${selectedStudentMeta.activeCards
                        .map((c) => c.cardNumber)
                        .join(', ')}) ছাড়পত্র ইস্যু হওয়ার সাথে সাথে স্বয়ংক্রিয়ভাবে বন্ধ (BLOCKED) হয়ে যাবে।`,
                      `Notice: Active RFID card (${selectedStudentMeta.activeCards
                        .map((c) => c.cardNumber)
                        .join(', ')}) will be automatically BLOCKED upon TC issuance.`
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Dates & Leaving Class */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label={pick('শেষ অধ্যয়নরত শ্রেণি', 'Leaving Class')} required>
              <Input
                value={form.leavingClass}
                onChange={(e) => setForm({ ...form, leavingClass: e.target.value })}
                placeholder={pick('যেমন: ৮ম শ্রেণি', 'e.g., Class 8')}
              />
            </FormField>
            <FormField label={pick('ইস্যুর তারিখ', 'Issue Date')} required>
              <Input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
              />
            </FormField>
            <FormField label={pick('বিদ্যালয় ত্যাগের তারিখ', 'Leaving Date')} required>
              <Input
                type="date"
                value={form.leavingDate}
                onChange={(e) => setForm({ ...form, leavingDate: e.target.value })}
              />
            </FormField>
          </div>

          {/* Reason with Quick Presets */}
          <div className="space-y-2">
            <FormField label={pick('বিদ্যালয় ত্যাগের কারণ', 'Reason for Transfer')} required>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder={pick(
                  'যেমন: অভিভাবকের কর্মস্থল পরিবর্তনের কারণে ঢাকায় স্থানান্তর...',
                  'e.g., Relocating due to parent job transfer...'
                )}
              />
            </FormField>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">
                {pick('দ্রুত নির্বাচন:', 'Quick fill:')}
              </span>
              {REASON_PRESETS.map((preset) => {
                const text = locale === 'bn' ? preset.bn : preset.en;
                return (
                  <button
                    key={preset.en}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, reason: text }))}
                    className="px-2 py-1 text-xs rounded border border-border bg-surface hover:bg-surface-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {text.length > 34 ? `${text.slice(0, 34)}…` : text}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Destination & Conduct */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={pick('গন্তব্য বিদ্যালয়', 'Destination School')}>
              <Input
                value={form.destinationSchool}
                onChange={(e) => setForm({ ...form, destinationSchool: e.target.value })}
                placeholder={pick('নতুন বিদ্যালয়ের নাম ও ঠিকানা', 'Target school name & location')}
              />
            </FormField>
            <FormField label={pick('আচরণ ও চরিত্র', 'Conduct Remarks')}>
              <Input
                value={form.conductRemarks}
                onChange={(e) => setForm({ ...form, conductRemarks: e.target.value })}
                placeholder={pick('উত্তম ও শৃঙ্খলাপরায়ণ', 'Good and disciplined')}
              />
            </FormField>
          </div>

          {/* Checkboxes */}
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
                  {pick('সকল বকেয়া পরিশোধিত', 'All school dues cleared')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {pick('টিসি-তে বকেয়া মুক্ত হিসেবে উল্লেখ থাকবে', 'Marked as cleared on the official certificate')}
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
                  {pick('পরবর্তী শ্রেণিতে উত্তীর্ণ', 'Promoted to next class')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {pick('বার্ষিক পরীক্ষায় উত্তীর্ণ হলে টিক দিন', 'Check if eligible for promotion to the next grade')}
                </span>
              </span>
            </label>
          </div>

          {!form.duesCleared && (
            <div className="flex items-start gap-2 p-3 rounded-[var(--radius)] border border-warning/40 bg-warning/5 text-xs text-warning">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {pick(
                  'বকেয়া অপরিশোধিত অবস্থায় ছাড়পত্র ইস্যু করলে অফিসিয়াল টিসি-তে "অপরিশোধিত" লেখা প্রদর্শিত হবে।',
                  'Issuing with uncleared dues will mark Dues Status as Pending on the printed certificate.'
                )}
              </span>
            </div>
          )}

          {/* Administrative Impact Confirmation */}
          <div className="p-3 rounded-[var(--radius)] border border-border bg-surface-muted/40 text-xs text-muted-foreground">
            {pick(
              'নিশ্চিত করলে শিক্ষার্থী স্থায়ীভাবে স্থানান্তরিত (TRANSFERRED) হিসেবে চিহ্নিত হবে এবং বর্তমান শ্রেণি ও হাজিরা তালিকা থেকে বাদ পড়বে। পূর্বের পরীক্ষার রেজাল্ট ও নথি সংরক্ষিত থাকবে।',
              'Confirming marks this student as TRANSFERRED and closes their active class enrollment. All historical results and attendance logs remain preserved.'
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIssueOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !form.studentId || duplicateTcNumber}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>
                {isLoading
                  ? pick('ইস্যু হচ্ছে...', 'Issuing...')
                  : pick('ছাড়পত্র ইস্যু ও প্রিন্ট করুন', 'Issue & Open Print Copy')}
              </span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Official Print Preview Modal */}
      <Modal
        open={Boolean(printedTc && printedStudent)}
        onClose={() => setPrintId(null)}
        title={
          printedTc
            ? `${pick('অফিসিয়াল ছাড়পত্র', 'Official Transfer Certificate')} · ${printedTc.tcNumber}`
            : pick('ছাড়পত্র', 'Transfer Certificate')
        }
        maxWidth="max-w-3xl"
      >
        {printedTc && printedStudent && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border no-print">
              <Link
                href={`/admin/students/${printedStudent.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{pick('শিক্ষার্থীর সংরক্ষিত প্রোফাইল দেখুন', 'Open archived student dossier')}</span>
              </Link>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPrintId(null)}>
                  {pick('বন্ধ করুন', 'Close')}
                </Button>
                <Button variant="primary" size="sm" onClick={triggerPrint}>
                  <Printer className="w-4 h-4" />
                  <span>{pick('প্রিন্ট করুন', 'Print Certificate')}</span>
                </Button>
              </div>
            </div>
            <PrintableTransferCertificate
              school={db.schoolProfile}
              tc={printedTc}
              student={printedStudent}
              fatherName={printedGuardian?.name}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
