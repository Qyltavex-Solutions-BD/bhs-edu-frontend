'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Check,
  CreditCard,
  Download,
  Eye,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  ShieldOff,
  X,
} from 'lucide-react';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { cn, exportToCsv, triggerPrint } from '@/src/lib/utils/cn';
import { DataTable } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { PrintableIdCardSheet } from '@/src/components/print/PrintDocuments';
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
  useIssueRfidCardMutation,
  useReplaceRfidCardMutation,
  useUpdateRfidCardStatusMutation,
} from '@/src/store/api';
import { CardStatus, EnrollmentStatus, Gender, StudentStatus } from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import type { StudentRFIDcard } from '@/src/types/entities';
import { classLabel, errorMessage, studentInitials } from './studentShared';

interface EnrichedCard extends StudentRFIDcard {
  studentNameBn: string;
  studentNameEn: string;
  studentCode: string;
  studentStatus: StudentStatus;
  studentGender: Gender;
  bloodGroup?: string | null;
  classId: string;
  classNumeric: number;
  classLabel: string;
  sectionLabel: string;
  roll: number;
  guardianPhone: string;
  hasOtherActiveCard: boolean;
}

interface UnassignedStudentRow {
  id: string;
  studentCode: string;
  nameBn: string;
  nameEn: string;
  gender: Gender;
  classId: string;
  classNumeric: number;
  classLabel: string;
  sectionLabel: string;
  roll: number;
  guardianPhone: string;
  lastCard: StudentRFIDcard | null;
}

function suggestNextCardNumber(db: MockDatabase, classNumeric?: number): string {
  const prefix = classNumeric ? `RFID-${String(classNumeric).padStart(2, '0')}-` : 'RFID-26-';
  let maxNum = 8840;
  db.rfidCards.forEach((c) => {
    const match = c.cardNumber.match(/(\d+)$/);
    if (match) {
      const val = Number(match[1]);
      if (Number.isFinite(val) && val > maxNum) maxNum = val;
    }
  });
  return `${prefix}${maxNum + 1}`;
}

export function StudentRfidCards({ db }: { db: MockDatabase }) {
  const { locale, pick } = useI18n();
  const [issueCard, { isLoading: issuing }] = useIssueRfidCardMutation();
  const [updateCardStatus, { isLoading: updating }] = useUpdateRfidCardStatusMutation();
  const [replaceCard, { isLoading: replacing }] = useReplaceRfidCardMutation();

  const [activeTab, setActiveTab] = useState<'registry' | 'unassigned'>('registry');
  const [searchQuery, setSearchQuery] = useState('');
  const [classId, setClassId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CardStatus>('ALL');
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  // Modals state
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({ studentId: '', cardNumber: '', remarks: '' });

  const [statusTarget, setStatusTarget] = useState<EnrichedCard | null>(null);
  const [nextStatus, setNextStatus] = useState<CardStatus>(CardStatus.ACTIVE);
  const [statusRemarks, setStatusRemarks] = useState('');

  const [replaceTarget, setReplaceTarget] = useState<EnrichedCard | null>(null);
  const [replaceOldStatus, setReplaceOldStatus] = useState<
    CardStatus.LOST | CardStatus.DAMAGED | CardStatus.BLOCKED
  >(CardStatus.LOST);
  const [replaceNewNumber, setReplaceNewNumber] = useState('');
  const [replaceRemarks, setReplaceRemarks] = useState('');

  const [printCardIds, setPrintCardIds] = useState<string[] | null>(null);

  const activeYear = db.academicYears.find((y) => y.isActive) ?? db.academicYears[0];
  const sortedClasses = useMemo(
    () => [...db.classes].sort((a, b) => a.numericValue - b.numericValue),
    [db.classes]
  );

  // Helper to resolve latest/active enrollment and guardian phone for a student
  const studentLookup = useMemo(() => {
    const map = new Map<
      string,
      {
        classId: string;
        classNumeric: number;
        classLabel: string;
        sectionLabel: string;
        roll: number;
        guardianPhone: string;
      }
    >();

    db.students.forEach((student) => {
      const enrollment =
        db.enrollments.find(
          (e) => e.studentId === student.id && e.status === EnrollmentStatus.ACTIVE
        ) ??
        db.enrollments
          .filter((e) => e.studentId === student.id)
          .sort((a, b) => b.enrollmentDate.localeCompare(a.enrollmentDate))[0];

      const cls = enrollment ? db.classes.find((c) => c.id === enrollment.classId) : null;
      const sec = enrollment ? db.sections.find((s) => s.id === enrollment.sectionId) : null;
      const link =
        db.parentStudents.find((ps) => ps.studentId === student.id && ps.isPrimary) ??
        db.parentStudents.find((ps) => ps.studentId === student.id);
      const parent = link ? db.parents.find((p) => p.id === link.parentId) : null;

      map.set(student.id, {
        classId: enrollment?.classId ?? '',
        classNumeric: cls?.numericValue ?? 99,
        classLabel: enrollment ? classLabel(db, enrollment.classId, locale) : '—',
        sectionLabel: sec?.name ?? '—',
        roll: enrollment?.roll ?? 0,
        guardianPhone: parent?.phone ?? '—',
      });
    });

    return map;
  }, [db, locale]);

  // All enriched RFID cards
  const allCards = useMemo<EnrichedCard[]>(() => {
    return db.rfidCards.map((card) => {
      const student = db.students.find((s) => s.id === card.studentId);
      const meta = studentLookup.get(card.studentId);
      const hasOtherActiveCard = db.rfidCards.some(
        (other) =>
          other.id !== card.id &&
          other.studentId === card.studentId &&
          other.status === CardStatus.ACTIVE
      );
      return {
        ...card,
        studentNameBn: student?.nameBn || student?.nameEn || '—',
        studentNameEn: student?.nameEn || '',
        studentCode: student?.studentId ?? '—',
        studentStatus: student?.status ?? StudentStatus.ACTIVE,
        studentGender: student?.gender ?? Gender.MALE,
        bloodGroup: student?.bloodGroup,
        classId: meta?.classId ?? '',
        classNumeric: meta?.classNumeric ?? 99,
        classLabel: meta?.classLabel ?? '—',
        sectionLabel: meta?.sectionLabel ?? '—',
        roll: meta?.roll ?? 0,
        guardianPhone: meta?.guardianPhone ?? '—',
        hasOtherActiveCard,
      };
    });
  }, [db, studentLookup]);

  // Active students who do NOT currently hold an ACTIVE RFID card
  const unassignedStudents = useMemo<UnassignedStudentRow[]>(() => {
    const activeCardStudentIds = new Set(
      db.rfidCards.filter((c) => c.status === CardStatus.ACTIVE).map((c) => c.studentId)
    );

    return db.students
      .filter((s) => s.status === StudentStatus.ACTIVE && !activeCardStudentIds.has(s.id))
      .map((s) => {
        const meta = studentLookup.get(s.id);
        const previousCards = db.rfidCards
          .filter((c) => c.studentId === s.id)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        return {
          id: s.id,
          studentCode: s.studentId,
          nameBn: s.nameBn || s.nameEn,
          nameEn: s.nameEn,
          gender: s.gender,
          classId: meta?.classId ?? '',
          classNumeric: meta?.classNumeric ?? 99,
          classLabel: meta?.classLabel ?? '—',
          sectionLabel: meta?.sectionLabel ?? '—',
          roll: meta?.roll ?? 0,
          guardianPhone: meta?.guardianPhone ?? '—',
          lastCard: previousCards[0] ?? null,
        };
      })
      .sort(
        (a, b) =>
          a.classNumeric - b.classNumeric ||
          a.sectionLabel.localeCompare(b.sectionLabel) ||
          a.roll - b.roll
      );
  }, [db, studentLookup]);

  // Summary KPIs
  const totalActiveStudents = db.students.filter((s) => s.status === StudentStatus.ACTIVE).length;
  const activeCardCount = allCards.filter((c) => c.status === CardStatus.ACTIVE).length;
  const lostOrDamagedCount = allCards.filter(
    (c) => c.status === CardStatus.LOST || c.status === CardStatus.DAMAGED
  ).length;
  const blockedCount = allCards.filter((c) => c.status === CardStatus.BLOCKED).length;
  const coveragePct = totalActiveStudents
    ? Math.round((activeCardCount / totalActiveStudents) * 100)
    : 0;

  // Filtered rows for active tab
  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allCards
      .filter((c) => (classId === 'ALL' ? true : c.classId === classId))
      .filter((c) => (statusFilter === 'ALL' ? true : c.status === statusFilter))
      .filter((c) => {
        if (!q) return true;
        return (
          c.cardNumber.toLowerCase().includes(q) ||
          c.studentNameBn.toLowerCase().includes(q) ||
          c.studentNameEn.toLowerCase().includes(q) ||
          c.studentCode.toLowerCase().includes(q) ||
          c.classLabel.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // Active first, then lost/damaged, then blocked
        const order: Record<CardStatus, number> = {
          [CardStatus.ACTIVE]: 0,
          [CardStatus.LOST]: 1,
          [CardStatus.DAMAGED]: 2,
          [CardStatus.BLOCKED]: 3,
        };
        return (
          order[a.status] - order[b.status] ||
          a.classNumeric - b.classNumeric ||
          a.roll - b.roll
        );
      });
  }, [allCards, classId, statusFilter, searchQuery]);

  const filteredUnassigned = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return unassignedStudents
      .filter((s) => (classId === 'ALL' ? true : s.classId === classId))
      .filter((s) => {
        if (!q) return true;
        return (
          s.nameBn.toLowerCase().includes(q) ||
          s.nameEn.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q) ||
          String(s.roll).includes(q) ||
          s.classLabel.toLowerCase().includes(q)
        );
      });
  }, [unassignedStudents, classId, searchQuery]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    classId !== 'ALL' ||
    (activeTab === 'registry' && statusFilter !== 'ALL');

  const resetFilters = () => {
    setSearchQuery('');
    setClassId('ALL');
    setStatusFilter('ALL');
  };

  // Selection helpers for batch ID card printing
  const toggleSelectCard = (id: string) => {
    setSelectedCardIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const allFilteredActiveIds = useMemo(
    () => filteredCards.filter((c) => c.status === CardStatus.ACTIVE).map((c) => c.id),
    [filteredCards]
  );

  const toggleSelectAllFiltered = () => {
    const allSelected =
      allFilteredActiveIds.length > 0 &&
      allFilteredActiveIds.every((id) => selectedCardIds.includes(id));
    if (allSelected) {
      setSelectedCardIds((prev) => prev.filter((id) => !allFilteredActiveIds.includes(id)));
    } else {
      setSelectedCardIds((prev) => Array.from(new Set([...prev, ...allFilteredActiveIds])));
    }
  };

  // Open Issue Modal (optionally pre-selecting an unassigned student)
  const openIssueModal = (preselectStudentId?: string) => {
    const meta = preselectStudentId ? studentLookup.get(preselectStudentId) : null;
    setIssueForm({
      studentId: preselectStudentId ?? '',
      cardNumber: suggestNextCardNumber(db, meta?.classNumeric),
      remarks: '',
    });
    setIssueOpen(true);
  };

  const duplicateIssueNumber = useMemo(() => {
    const num = issueForm.cardNumber.trim().toLowerCase();
    if (!num) return false;
    return db.rfidCards.some((c) => c.cardNumber.trim().toLowerCase() === num);
  }, [db.rfidCards, issueForm.cardNumber]);

  const handleIssueSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!issueForm.studentId) {
      toast.error(pick('একজন শিক্ষার্থী নির্বাচন করুন।', 'Select a student.'));
      return;
    }
    if (!issueForm.cardNumber.trim() || duplicateIssueNumber) {
      toast.error(
        duplicateIssueNumber
          ? pick('এই কার্ড নম্বরটি আগেই ব্যবহৃত হয়েছে।', 'This card number is already issued.')
          : pick('কার্ড নম্বর দিন।', 'Card number is required.')
      );
      return;
    }
    try {
      await issueCard({
        studentId: issueForm.studentId,
        cardNumber: issueForm.cardNumber.trim(),
        remarks: issueForm.remarks.trim() || null,
      }).unwrap();
      toast.success(
        `${pick('নতুন RFID কার্ড ইস্যু হয়েছে', 'RFID card issued')} (${issueForm.cardNumber.trim()})`
      );
      setIssueOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, pick('কার্ড ইস্যু করা যায়নি।', 'Could not issue card.')));
    }
  };

  // Open Status Modal
  const openStatusModal = (card: EnrichedCard) => {
    setStatusTarget(card);
    setNextStatus(card.status);
    setStatusRemarks(card.remarks ?? '');
  };

  const handleStatusSave = async () => {
    if (!statusTarget) return;
    try {
      await updateCardStatus({
        id: statusTarget.id,
        status: nextStatus,
        remarks: statusRemarks.trim() || null,
      }).unwrap();
      toast.success(pick('কার্ডের অবস্থা হালনাগাদ হয়েছে।', 'Card status updated.'));
      setStatusTarget(null);
    } catch (err) {
      toast.error(errorMessage(err, pick('অবস্থা হালনাগাদ হয়নি।', 'Could not update card status.')));
    }
  };

  // Open Replace Modal
  const openReplaceModal = (card: EnrichedCard) => {
    setReplaceTarget(card);
    setReplaceOldStatus(
      card.status === CardStatus.DAMAGED
        ? CardStatus.DAMAGED
        : card.status === CardStatus.BLOCKED
          ? CardStatus.BLOCKED
          : CardStatus.LOST
    );
    setReplaceNewNumber(suggestNextCardNumber(db, card.classNumeric));
    setReplaceRemarks('');
  };

  const duplicateReplaceNumber = useMemo(() => {
    const num = replaceNewNumber.trim().toLowerCase();
    if (!num) return false;
    return db.rfidCards.some((c) => c.cardNumber.trim().toLowerCase() === num);
  }, [db.rfidCards, replaceNewNumber]);

  const handleReplaceSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!replaceTarget) return;
    if (!replaceNewNumber.trim() || duplicateReplaceNumber) {
      toast.error(
        duplicateReplaceNumber
          ? pick('এই নতুন কার্ড নম্বরটি আগেই ব্যবহৃত হয়েছে।', 'This card number is already in use.')
          : pick('নতুন কার্ড নম্বর দিন।', 'New card number is required.')
      );
      return;
    }
    try {
      await replaceCard({
        oldCardId: replaceTarget.id,
        oldCardStatus: replaceOldStatus,
        newCardNumber: replaceNewNumber.trim(),
        remarks: replaceRemarks.trim() || null,
      }).unwrap();
      toast.success(
        pick(
          `পুরনো কার্ড বন্ধ করে নতুন কার্ড (${replaceNewNumber.trim()}) সক্রিয় করা হয়েছে।`,
          `Old card retired and new card (${replaceNewNumber.trim()}) activated.`
        )
      );
      setReplaceTarget(null);
    } catch (err) {
      toast.error(errorMessage(err, pick('কার্ড রিপ্লেস করা যায়নি।', 'Could not replace card.')));
    }
  };

  // Printable ID Cards payload
  const printableCards = useMemo(() => {
    if (!printCardIds || printCardIds.length === 0) return [];
    const validUntil = `${activeYear?.name ?? '2026'}-12-31`;
    return allCards
      .filter((c) => printCardIds.includes(c.id))
      .map((c) => ({
        code: `${c.studentCode} · ${c.cardNumber}`,
        name: locale === 'bn' ? c.studentNameBn : c.studentNameEn,
        subline: `${c.classLabel} (${c.sectionLabel}) · ${pick('রোল', 'Roll')}: ${formatNumber(c.roll, locale)}`,
        secondaryLine: `${pick('অভিভাবক:', 'Guardian:')} ${c.guardianPhone}`,
        bloodGroup: c.bloodGroup,
        phone: c.guardianPhone,
        validUntil,
      }));
  }, [printCardIds, allCards, activeYear, locale, pick]);

  const handleExportCsv = () => {
    if (activeTab === 'registry') {
      exportToCsv(
        filteredCards.map((c) => ({
          cardNumber: c.cardNumber,
          studentId: c.studentCode,
          nameBn: c.studentNameBn,
          nameEn: c.studentNameEn,
          class: c.classLabel,
          section: c.sectionLabel,
          roll: c.roll,
          status: c.status,
          issuedAt: c.issuedAt.slice(0, 10),
          remarks: c.remarks ?? '',
        })),
        'rfid-identity-cards.csv'
      );
    } else {
      exportToCsv(
        filteredUnassigned.map((s) => ({
          studentId: s.studentCode,
          nameBn: s.nameBn,
          nameEn: s.nameEn,
          class: s.classLabel,
          section: s.sectionLabel,
          roll: s.roll,
          guardianPhone: s.guardianPhone,
          previousCard: s.lastCard ? `${s.lastCard.cardNumber} (${s.lastCard.status})` : 'None',
        })),
        'students-without-rfid-card.csv'
      );
    }
  };

  const statusOptions: Array<{
    value: CardStatus;
    label: string;
    desc: string;
  }> = [
    {
      value: CardStatus.ACTIVE,
      label: pick('সক্রিয় (Active)', 'Active'),
      desc: pick('গেট RFID রিডারে স্ক্যান করলে হাজিরা গণনা হবে।', 'Works at school gate RFID attendance reader.'),
    },
    {
      value: CardStatus.LOST,
      label: pick('হারিয়ে গেছে (Lost)', 'Lost'),
      desc: pick('হারানো হিসেবে চিহ্নিত — গেটে স্ক্যান গ্রহণ করা হবে না।', 'Flagged lost — rejected at gate scanner.'),
    },
    {
      value: CardStatus.DAMAGED,
      label: pick('ক্ষতিগ্রস্ত (Damaged)', 'Damaged'),
      desc: pick('কার্ড ভেঙে গেছে বা চিপ রিড হচ্ছে না।', 'Card physically broken or chip unreadable.'),
    },
    {
      value: CardStatus.BLOCKED,
      label: pick('বন্ধ (Blocked)', 'Blocked'),
      desc: pick('প্রশাসনিকভাবে নিষ্ক্রিয় — রিপ্লেসমেন্ট বা টিসি-র ক্ষেত্রে।', 'Administratively disabled — replaced or transferred.'),
    },
  ];

  return (
    <div className="space-y-5">
      {/* 1. 4-Column Hairline-Divided Coverage & Card Health Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-3">
          <span className="text-base font-bold text-foreground">
            {pick('সক্রিয় RFID কার্ড', 'Active RFID Cards')}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">
              {formatNumber(activeCardCount, locale)}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              / {formatNumber(totalActiveStudents, locale)} {pick('সক্রিয় শিক্ষার্থী', 'active students')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            {pick(
              `মোট ${formatNumber(coveragePct, locale)}% শিক্ষার্থীর হাতে সক্রিয় কার্ড`,
              `${coveragePct}% active student gate coverage`
            )}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-3">
          <span className="text-base font-bold text-foreground">
            {pick('কার্ডবিহীন সক্রিয় শিক্ষার্থী', 'Unassigned Active Students')}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {formatNumber(unassignedStudents.length, locale)}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {pick('জনের কার্ড বাকি', 'pending card')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('unassigned')}
            className="text-sm font-semibold text-primary hover:underline text-left w-fit cursor-pointer"
          >
            {pick('কার্ডবিহীন তালিকা দেখুন →', 'View unassigned roster →')}
          </button>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-3">
          <span className="text-base font-bold text-foreground">
            {pick('হারানো ও ক্ষতিগ্রস্ত', 'Lost & Damaged')}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span
              className={cn(
                'text-2xl sm:text-3xl font-extrabold tracking-tight',
                lostOrDamagedCount > 0 ? 'text-warning' : 'text-foreground'
              )}
            >
              {formatNumber(lostOrDamagedCount, locale)}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {pick('টি রিপ্লেসমেন্ট প্রয়োজন', 'need replacement')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {pick('১-ক্লিকে নতুন কার্ড দিয়ে রিপ্লেস করা যায়', 'Replace in 1 click from card row')}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-3">
          <span className="text-base font-bold text-foreground">
            {pick('বন্ধকৃত কার্ড (Blocked)', 'Blocked Cards')}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {formatNumber(blockedCount, locale)}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {pick('টি নিষ্ক্রিয় রেকর্ড', 'deactivated records')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {pick('টিসি বা রিপ্লেসমেন্টে স্বয়ংক্রিয়ভাবে বন্ধ', 'Auto-blocked on transfer or replace')}
          </p>
        </Card>
      </div>

      {/* 2. Workspace Tabs & Unified Filter Toolbar */}
      <Card className="overflow-hidden">
        <div
          className="flex items-center gap-1 px-4 pt-3 border-b border-border overflow-x-auto"
          role="tablist"
          aria-label={pick('পরিচয়পত্র বিভাগ', 'Identity card sections')}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'registry'}
            onClick={() => setActiveTab('registry')}
            className={cn(
              'px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums',
              activeTab === 'registry'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {pick('ইস্যুকৃত কার্ড রেজিস্টার', 'Issued Card Registry')}{' '}
            <span className="text-xs opacity-75">({formatNumber(allCards.length, locale)})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'unassigned'}
            onClick={() => setActiveTab('unassigned')}
            className={cn(
              'px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums',
              activeTab === 'unassigned'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {pick('কার্ডবিহীন শিক্ষার্থী', 'Unassigned Active Students')}{' '}
            <span className="text-xs opacity-75">
              ({formatNumber(unassignedStudents.length, locale)})
            </span>
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative w-full lg:max-w-xs shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'registry'
                    ? pick(
                        'কার্ড নং, নাম বা আইডি খুঁজুন...',
                        'Search card no, name, or ID...'
                      )
                    : pick(
                        'নাম, আইডি বা রোল খুঁজুন...',
                        'Search name, ID, or roll...'
                      )
                }
                className="pl-9 pr-9 h-9 text-sm w-full"
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
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-auto min-w-[130px] h-9 text-sm"
                aria-label={pick('শ্রেণি', 'Class')}
              >
                <option value="ALL">{pick('সকল শ্রেণি', 'All classes')}</option>
                {sortedClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {locale === 'bn' ? cls.nameBn || cls.name : cls.name}
                  </option>
                ))}
              </Select>

              {activeTab === 'registry' && (
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'ALL' | CardStatus)}
                  className="w-auto min-w-[130px] h-9 text-sm"
                  aria-label={pick('কার্ডের অবস্থা', 'Card status')}
                >
                  <option value="ALL">{pick('সকল অবস্থা', 'All statuses')}</option>
                  <option value={CardStatus.ACTIVE}>{pick('সক্রিয়', 'Active')}</option>
                  <option value={CardStatus.LOST}>{pick('হারিয়ে গেছে', 'Lost')}</option>
                  <option value={CardStatus.DAMAGED}>{pick('ক্ষতিগ্রস্ত', 'Damaged')}</option>
                  <option value={CardStatus.BLOCKED}>{pick('বন্ধ', 'Blocked')}</option>
                </Select>
              )}

              {activeTab === 'registry' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  disabled={
                    selectedCardIds.length === 0 && allFilteredActiveIds.length === 0
                  }
                  onClick={() =>
                    setPrintCardIds(
                      selectedCardIds.length > 0 ? selectedCardIds : allFilteredActiveIds
                    )
                  }
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>
                    {selectedCardIds.length > 0
                      ? pick(
                          `নির্বাচিত প্রিন্ট (${formatNumber(selectedCardIds.length, locale)})`,
                          `Print Selected (${selectedCardIds.length})`
                        )
                      : pick('সক্রিয় কার্ড প্রিন্ট', 'Print Active Cards')}
                  </span>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={handleExportCsv}
                disabled={
                  activeTab === 'registry'
                    ? filteredCards.length === 0
                    : filteredUnassigned.length === 0
                }
              >
                <Download className="w-3.5 h-3.5" />
                <span>{pick('এক্সপোর্ট CSV', 'Export CSV')}</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                className="h-9"
                onClick={() => openIssueModal()}
                disabled={unassignedStudents.length === 0}
              >
                <Plus className="w-4 h-4" />
                <span>{pick('নতুন কার্ড ইস্যু', 'Issue Card')}</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border text-xs text-muted-foreground">
            <span className="tabular-nums">
              {activeTab === 'registry'
                ? pick(
                    `মোট ${formatNumber(allCards.length, locale)}টি কার্ডের মধ্যে ${formatNumber(filteredCards.length, locale)}টি দেখানো হচ্ছে · প্রতি শিক্ষার্থীর জন্য সর্বোচ্চ ১টি সক্রিয় কার্ড অনুমোদিত`,
                    `Showing ${filteredCards.length} of ${allCards.length} cards · Strictly 1 active card allowed per student`
                  )
                : pick(
                    `মোট ${formatNumber(unassignedStudents.length, locale)} জন সক্রিয় শিক্ষার্থীর এখনো কোনো সক্রিয় RFID কার্ড নেই`,
                    `${unassignedStudents.length} active students currently have no active RFID card`
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
        </div>
      </Card>

      {/* 3. Tab Content Tables */}
      {activeTab === 'registry' ? (
        <DataTable
          data={filteredCards}
          hideToolbar
          pageSize={15}
          emptyTitle={
            allCards.length === 0
              ? pick('এখনো কোনো RFID কার্ড ইস্যু করা হয়নি', 'No RFID cards issued yet')
              : pick('ফিল্টার অনুযায়ী কোনো কার্ড পাওয়া যায়নি', 'No matching RFID cards found')
          }
          emptyAction={
            allCards.length === 0 ? (
              <Button variant="primary" size="sm" onClick={() => openIssueModal()}>
                <Plus className="w-4 h-4" />
                <span>{pick('প্রথম কার্ড ইস্যু করুন', 'Issue first card')}</span>
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
              id: 'select',
              header: () => (
                <input
                  type="checkbox"
                  checked={
                    allFilteredActiveIds.length > 0 &&
                    allFilteredActiveIds.every((id) => selectedCardIds.includes(id))
                  }
                  onChange={toggleSelectAllFiltered}
                  aria-label={pick('সকল সক্রিয় কার্ড নির্বাচন', 'Select all active cards')}
                />
              ),
              enableSorting: false,
              cell: ({ row }) => (
                <input
                  type="checkbox"
                  checked={selectedCardIds.includes(row.original.id)}
                  onChange={() => toggleSelectCard(row.original.id)}
                  aria-label={row.original.cardNumber}
                />
              ),
            },
            {
              accessorKey: 'cardNumber',
              header: pick('কার্ড নম্বর ও ইস্যু', 'Card No. & Issued'),
              cell: ({ row }) => (
                <div className="whitespace-nowrap tabular-nums">
                  <span className="font-mono text-sm font-semibold text-foreground block">
                    {row.original.cardNumber}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateShort(row.original.issuedAt, locale)}
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
                      {row.original.studentStatus !== StudentStatus.ACTIVE && (
                        <span className="font-sans text-warning">
                          {' '}
                          · {pick('অসক্রিয় শিক্ষার্থী', 'Non-active')}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ),
            },
            {
              accessorKey: 'classNumeric',
              header: pick('শ্রেণি, শাখা ও রোল', 'Class, Section & Roll'),
              cell: ({ row }) => (
                <div className="whitespace-nowrap tabular-nums">
                  <span className="font-medium text-foreground">{row.original.classLabel}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    · {row.original.sectionLabel} · {pick('রোল', 'Roll')}{' '}
                    {formatNumber(row.original.roll, locale)}
                  </span>
                </div>
              ),
            },
            {
              accessorKey: 'status',
              header: pick('অবস্থা ও মন্তব্য', 'Status & Remarks'),
              cell: ({ row }) => (
                <div className="space-y-1 max-w-[240px]">
                  <StatusBadge enumName="CardStatus" value={row.original.status} />
                  {row.original.remarks && (
                    <span className="block text-xs text-muted-foreground truncate">
                      {row.original.remarks}
                    </span>
                  )}
                </div>
              ),
            },
            {
              id: 'actions',
              header: '',
              enableSorting: false,
              cell: ({ row }) => {
                const canReplace =
                  row.original.studentStatus === StudentStatus.ACTIVE &&
                  !row.original.hasOtherActiveCard;
                return (
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => openStatusModal(row.original)}
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>{pick('অবস্থা', 'Status')}</span>
                    </Button>

                    {canReplace && (
                      <Button
                        size="sm"
                        variant={
                          row.original.status === CardStatus.LOST ||
                          row.original.status === CardStatus.DAMAGED
                            ? 'primary'
                            : 'outline'
                        }
                        className="h-8 px-2.5 text-xs"
                        onClick={() => openReplaceModal(row.original)}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{pick('রিপ্লেস', 'Replace')}</span>
                      </Button>
                    )}

                    <button
                      type="button"
                      onClick={() => setPrintCardIds([row.original.id])}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      aria-label={pick('পরিচয়পত্র প্রিন্ট', 'Print ID card')}
                      title={pick('পরিচয়পত্র প্রিন্ট', 'Print ID card')}
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    <Link
                      href={`/admin/students/${row.original.studentId}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      aria-label={pick('শিক্ষার্থীর প্রোফাইল', 'View student profile')}
                      title={pick('শিক্ষার্থীর প্রোফাইল', 'View student profile')}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              },
            },
          ]}
        />
      ) : (
        <DataTable
          data={filteredUnassigned}
          hideToolbar
          pageSize={15}
          emptyTitle={
            unassignedStudents.length === 0
              ? pick(
                  'সকল সক্রিয় শিক্ষার্থীর হাতে ইতিমধ্যে RFID কার্ড রয়েছে',
                  'All active students already hold an active RFID card'
                )
              : pick('ফিল্টার অনুযায়ী কোনো শিক্ষার্থী পাওয়া যায়নি', 'No matching students found')
          }
          emptyAction={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{pick('ফিল্টার রিসেট করুন', 'Reset filters')}</span>
              </Button>
            ) : undefined
          }
          columns={[
            {
              accessorKey: 'roll',
              header: pick('রোল', 'Roll'),
              cell: ({ row }) => (
                <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
                  {String(row.original.roll).padStart(2, '0')}
                </span>
              ),
            },
            {
              accessorKey: 'nameBn',
              header: pick('শিক্ষার্থী ও আইডি', 'Student & ID'),
              cell: ({ row }) => (
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-[var(--radius)] flex items-center justify-center font-semibold text-xs shrink-0 border border-border',
                      row.original.gender === Gender.FEMALE
                        ? 'bg-secondary/10 text-secondary'
                        : 'bg-primary/10 text-primary'
                    )}
                  >
                    {studentInitials(row.original.nameEn)}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/students/${row.original.id}`}
                      className="font-semibold text-foreground hover:text-primary hover:underline block truncate leading-snug"
                    >
                      {row.original.nameBn}
                    </Link>
                    <span className="block text-xs font-mono text-muted-foreground truncate">
                      {row.original.studentCode}
                    </span>
                  </div>
                </div>
              ),
            },
            {
              accessorKey: 'classNumeric',
              header: pick('শ্রেণি ও শাখা', 'Class & Section'),
              cell: ({ row }) => (
                <div className="whitespace-nowrap">
                  <span className="font-medium text-foreground">{row.original.classLabel}</span>
                  <span className="text-muted-foreground"> · {row.original.sectionLabel}</span>
                </div>
              ),
            },
            {
              id: 'history',
              header: pick('পূর্ববর্তী কার্ড ইতিহাস', 'Previous Card History'),
              enableSorting: false,
              cell: ({ row }) =>
                row.original.lastCard ? (
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="font-mono text-xs text-foreground">
                      {row.original.lastCard.cardNumber}
                    </span>
                    <StatusBadge enumName="CardStatus" value={row.original.lastCard.status} />
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {pick('কখনো ইস্যু হয়নি', 'Never issued')}
                  </span>
                ),
            },
            {
              accessorKey: 'guardianPhone',
              header: pick('অভিভাবক মোবাইল', 'Guardian Phone'),
              cell: ({ row }) => (
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {row.original.guardianPhone}
                </span>
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
                    variant="primary"
                    className="h-8 px-3 text-xs"
                    onClick={() => openIssueModal(row.original.id)}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{pick('কার্ড ইস্যু করুন', 'Issue Card')}</span>
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* 4. Issue New RFID Card Modal */}
      <Modal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        title={pick('নতুন RFID পরিচয়পত্র ইস্যু করুন', 'Issue New RFID Card')}
        description={pick(
          'শুধুমাত্র সক্রিয় ও কার্ডবিহীন শিক্ষার্থীদের তালিকা দেখানো হচ্ছে। USB রিডার দিয়ে সরাসরি কার্ড স্ক্যান করেও নম্বর বসানো যাবে।',
          'Only active students without an active card are listed. You can also scan a card directly using a USB RFID reader.'
        )}
      >
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          <FormField label={pick('শিক্ষার্থী নির্বাচন', 'Select Student')} required>
            <Select
              value={issueForm.studentId}
              onChange={(e) => {
                const sid = e.target.value;
                const meta = studentLookup.get(sid);
                setIssueForm((prev) => ({
                  ...prev,
                  studentId: sid,
                  cardNumber: prev.cardNumber || suggestNextCardNumber(db, meta?.classNumeric),
                }));
              }}
            >
              <option value="">{pick('শিক্ষার্থী বেছে নিন...', 'Choose a student...')}</option>
              {unassignedStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameBn} · {s.classLabel} ({s.sectionLabel}, {pick('রোল', 'Roll')} {s.roll}) —{' '}
                  {s.studentCode}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label={pick('RFID কার্ড নম্বর / UID', 'RFID Card Number / UID')}
            required
            error={
              duplicateIssueNumber
                ? pick('এই কার্ড নম্বরটি আগেই ব্যবহৃত হয়েছে।', 'This card number is already issued.')
                : undefined
            }
          >
            <div className="flex items-center gap-2">
              <Input
                value={issueForm.cardNumber}
                onChange={(e) => setIssueForm({ ...issueForm, cardNumber: e.target.value })}
                className="font-mono flex-1"
                placeholder="RFID-10-8848"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 shrink-0"
                onClick={() => {
                  const meta = issueForm.studentId ? studentLookup.get(issueForm.studentId) : null;
                  setIssueForm((prev) => ({
                    ...prev,
                    cardNumber: suggestNextCardNumber(db, meta?.classNumeric),
                  }));
                }}
              >
                {pick('অটো নম্বর', 'Suggest')}
              </Button>
            </div>
          </FormField>

          <FormField label={pick('প্রশাসনিক মন্তব্য', 'Remarks')}>
            <Input
              value={issueForm.remarks}
              onChange={(e) => setIssueForm({ ...issueForm, remarks: e.target.value })}
              placeholder={pick('যেমন: ২০২৬ শিক্ষাবর্ষের নতুন স্মার্ট কার্ড', 'e.g., 2026 session smart ID card')}
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIssueOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={issuing || !issueForm.studentId || duplicateIssueNumber}
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {issuing ? pick('ইস্যু হচ্ছে...', 'Issuing...') : pick('কার্ড সক্রিয় করুন', 'Activate Card')}
              </span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Update Card Status Modal */}
      <Modal
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        title={pick('কার্ডের অবস্থা পরিবর্তন করুন', 'Update RFID Card Status')}
      >
        {statusTarget && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-[var(--radius)] bg-surface-muted/60 border border-border flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-mono text-sm font-semibold text-foreground">
                  {statusTarget.cardNumber}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {statusTarget.studentNameBn} · {statusTarget.classLabel} (
                  {statusTarget.sectionLabel}) · {statusTarget.studentCode}
                </p>
              </div>
              <StatusBadge enumName="CardStatus" value={statusTarget.status} />
            </div>

            {statusTarget.studentStatus !== StudentStatus.ACTIVE && (
              <div className="flex items-start gap-2 p-3 rounded-[var(--radius)] border border-warning/40 bg-warning/5 text-xs text-warning">
                <ShieldOff className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {pick(
                    'এই শিক্ষার্থী বর্তমানে সক্রিয় নয় (স্থানান্তরিত বা প্রাক্তন)। তাই এই কার্ড পুনরায় সক্রিয় (ACTIVE) করা যাবে না।',
                    'This student is no longer active (transferred or graduated). Reactivating this card is disabled.'
                  )}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-sm font-bold text-foreground block">
                {pick('নতুন অবস্থা নির্বাচন করুন', 'Select new status')}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {statusOptions.map((opt) => {
                  const disabled =
                    opt.value === CardStatus.ACTIVE &&
                    (statusTarget.studentStatus !== StudentStatus.ACTIVE ||
                      statusTarget.hasOtherActiveCard);
                  const selected = nextStatus === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => setNextStatus(opt.value)}
                      className={cn(
                        'p-3 rounded-[var(--radius)] border text-left transition-colors cursor-pointer',
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-surface hover:bg-surface-muted/50',
                        disabled && 'opacity-45 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                        {selected && <Check className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <FormField label={pick('কারণ / মন্তব্য', 'Reason / Remarks')}>
              <Textarea
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
                placeholder={pick(
                  'যেমন: শিক্ষার্থী কার্ড হারিয়েছে বলে অভিভাবক জানিয়েছে...',
                  'e.g., Guardian reported card lost on way to school...'
                )}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setStatusTarget(null)}>
                {pick('বাতিল', 'Cancel')}
              </Button>
              <Button variant="primary" disabled={updating} onClick={handleStatusSave}>
                {updating ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('সংরক্ষণ করুন', 'Save Status')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 6. Atomic Card Replacement Modal */}
      <Modal
        open={Boolean(replaceTarget)}
        onClose={() => setReplaceTarget(null)}
        title={pick('কার্ড রিপ্লেস করুন (পুরনো বন্ধ + নতুন ইস্যু)', 'Replace RFID Card')}
        description={pick(
          'এক ক্লিকে পুরনো কার্ডটি নিষ্ক্রিয় করে একই শিক্ষার্থীর নামে নতুন কার্ড চালু করুন।',
          'Retire the previous card and activate a replacement card for the student in one step.'
        )}
      >
        {replaceTarget && (
          <form onSubmit={handleReplaceSubmit} className="space-y-4">
            <div className="p-3.5 rounded-[var(--radius)] bg-surface-muted/60 border border-border flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <p className="font-semibold text-foreground">{replaceTarget.studentNameBn}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {pick('পূর্বের কার্ড:', 'Previous Card:')} {replaceTarget.cardNumber} ·{' '}
                  {replaceTarget.classLabel} ({replaceTarget.sectionLabel})
                </p>
              </div>
              <StatusBadge enumName="CardStatus" value={replaceTarget.status} />
            </div>

            <FormField label={pick('পূর্বের কার্ডের চূড়ান্ত অবস্থা', 'Final Status of Old Card')} required>
              <Select
                value={replaceOldStatus}
                onChange={(e) =>
                  setReplaceOldStatus(
                    e.target.value as CardStatus.LOST | CardStatus.DAMAGED | CardStatus.BLOCKED
                  )
                }
              >
                <option value={CardStatus.LOST}>{pick('হারিয়ে গেছে (LOST)', 'Lost')}</option>
                <option value={CardStatus.DAMAGED}>{pick('ক্ষতিগ্রস্ত (DAMAGED)', 'Damaged')}</option>
                <option value={CardStatus.BLOCKED}>{pick('বন্ধ (BLOCKED)', 'Blocked')}</option>
              </Select>
            </FormField>

            <FormField
              label={pick('নতুন RFID কার্ড নম্বর', 'New RFID Card Number')}
              required
              error={
                duplicateReplaceNumber
                  ? pick('এই কার্ড নম্বরটি আগেই ব্যবহৃত হয়েছে।', 'This card number is already in use.')
                  : undefined
              }
            >
              <Input
                value={replaceNewNumber}
                onChange={(e) => setReplaceNewNumber(e.target.value)}
                className="font-mono"
                placeholder="RFID-10-8850"
              />
            </FormField>

            <FormField label={pick('রিপ্লেসমেন্ট মন্তব্য', 'Replacement Note')}>
              <Input
                value={replaceRemarks}
                onChange={(e) => setReplaceRemarks(e.target.value)}
                placeholder={pick(
                  'যেমন: পুরনো কার্ড হারানো যাওয়ায় নতুন কার্ড প্রদান',
                  'e.g., Replacement issued for lost card'
                )}
              />
            </FormField>

            <div className="flex items-start gap-2 p-3 rounded-[var(--radius)] border border-border bg-surface-muted/40 text-xs text-muted-foreground">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-warning" />
              <span>
                {pick(
                  `পূর্বের কার্ড (${replaceTarget.cardNumber}) স্থায়ীভাবে নিষ্ক্রিয় হবে এবং নতুন কার্ড (${replaceNewNumber || '—'}) তাৎক্ষণিক গেট হাজিরায় সক্রিয় হবে।`,
                  `Old card (${replaceTarget.cardNumber}) will be retired and the new card (${replaceNewNumber || '—'}) will be active immediately for gate attendance.`
                )}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setReplaceTarget(null)}>
                {pick('বাতিল', 'Cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={replacing || !replaceNewNumber.trim() || duplicateReplaceNumber}
              >
                <RefreshCw className="w-4 h-4" />
                <span>
                  {replacing
                    ? pick('রিপ্লেস হচ্ছে...', 'Replacing...')
                    : pick('রিপ্লেসমেন্ট নিশ্চিত করুন', 'Confirm Replacement')}
                </span>
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* 7. Batch / Single Printable ID Card Sheet Modal */}
      <Modal
        open={Boolean(printCardIds && printableCards.length > 0)}
        onClose={() => setPrintCardIds(null)}
        title={pick(
          `শিক্ষার্থী পরিচয়পত্র প্রিন্ট শিট (${formatNumber(printableCards.length, locale)}টি)`,
          `Student Identity Card Print Sheet (${printableCards.length})`
        )}
        maxWidth="max-w-5xl"
      >
        {printableCards.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-border no-print">
              <span className="text-xs text-muted-foreground">
                {pick(
                  'A4 পেপারে প্রিন্ট করার উপযোগী গ্রিড লেআউট।',
                  'A4 print-ready grid layout for laminated PVC / paper cards.'
                )}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPrintCardIds(null)}>
                  {pick('বন্ধ করুন', 'Close')}
                </Button>
                <Button variant="primary" size="sm" onClick={triggerPrint}>
                  <Printer className="w-4 h-4" />
                  <span>{pick('প্রিন্ট করুন', 'Print Sheet')}</span>
                </Button>
              </div>
            </div>
            <PrintableIdCardSheet
              school={db.schoolProfile}
              holderType="STUDENT"
              cards={printableCards}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
