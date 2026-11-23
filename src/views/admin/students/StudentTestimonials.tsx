'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Award,
  Download,
  Eye,
  FileCheck2,
  GraduationCap,
  Plus,
  Printer,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { cn, exportToCsv, triggerCertificatePrint } from '@/src/lib/utils/cn';
import { localToday } from '@/src/lib/schoolDay';
import { DataTable } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { PrintableTestimonialCertificate } from '@/src/components/print/PrintDocuments';
import {
  Button,
  Card,
  FormField,
  Input,
  Modal,
  Select,
} from '@/src/components/ui/primitives';
import { useIssueTestimonialMutation } from '@/src/store/api';
import { RelationshipType, StudentStatus, TestimonialType } from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import type { StudentTestimonial } from '@/src/types/entities';
import { errorMessage, studentInitials } from './studentShared';

interface EnrichedTestimonial extends StudentTestimonial {
  studentNameBn: string;
  studentNameEn: string;
  studentCode: string;
  fatherName: string;
  classSummary: string;
  purposeOrResult: string;
}

const PURPOSE_PRESETS = [
  {
    bn: 'উপবৃত্তি ও মেধাবৃত্তি আবেদনের জন্য',
    en: 'For scholarship & stipend application',
  },
  {
    bn: 'পাসপোর্ট / জন্ম নিবন্ধন দাপ্তরিক কার্যক্রমের জন্য',
    en: 'For passport / birth registration verification',
  },
  {
    bn: 'ব্যাংক হিসাব খোলার উদ্দেশ্যে',
    en: 'For opening a student bank account',
  },
  {
    bn: 'অভিভাবকের দাপ্তরিক প্রয়োজনের জন্য',
    en: 'For guardian official documentation',
  },
];

const LETTER_GRADES = ['A+', 'A', 'A-', 'B', 'C', 'D'];

function suggestNextRefNumber(db: MockDatabase, yearStr: string): string {
  const prefix = `BHS/TEST/${yearStr}/`;
  let maxSeq = 0;
  db.testimonials.forEach((item) => {
    const match = item.refNumber.match(/(\d+)$/);
    if (item.refNumber.toUpperCase().startsWith(prefix.toUpperCase()) && match) {
      const n = Number(match[1]);
      if (Number.isFinite(n) && n > maxSeq) maxSeq = n;
    }
  });
  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

export function StudentTestimonials({ db }: { db: MockDatabase }) {
  const { locale, pick } = useI18n();
  const [issueTestimonial, { isLoading }] = useIssueTestimonialMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TestimonialType>('ALL');
  const [issueOpen, setIssueOpen] = useState(false);
  const [printId, setPrintId] = useState<string | null>(null);

  const activeYear = db.academicYears.find((y) => y.isActive) ?? db.academicYears[0];
  const activeYearName = activeYear?.name ?? '2026';

  const [form, setForm] = useState({
    type: TestimonialType.STUDY_CHARACTER as TestimonialType,
    studentId: '',
    refNumber: '',
    issueDate: '',
    purpose: '',
    boardName: 'মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড, ঢাকা',
    passingYear: activeYearName,
    boardRoll: '',
    registrationNo: '',
    gpa: '5.00',
    letterGrade: 'A+',
    groupName: '',
    conductRemarks: 'উত্তম ও শৃঙ্খলাপরায়ণ',
    remarks: '',
  });

  const getParents = (studentId: string) => {
    const links = db.parentStudents.filter((ps) => ps.studentId === studentId);
    const fatherLink =
      links.find((l) => l.relationship === RelationshipType.FATHER) ??
      links.find((l) => l.isPrimary) ??
      links[0];
    const motherLink = links.find((l) => l.relationship === RelationshipType.MOTHER);
    const father = fatherLink ? db.parents.find((p) => p.id === fatherLink.parentId) : null;
    const mother = motherLink ? db.parents.find((p) => p.id === motherLink.parentId) : null;
    return {
      fatherName: father ? (locale === 'bn' ? father.nameBn || father.name : father.name) : null,
      motherName: mother ? (locale === 'bn' ? mother.nameBn || mother.name : mother.name) : null,
    };
  };

  // Build candidate students with latest enrollment context (ACTIVE or GRADUATED/TRANSFERRED)
  const studentOptions = useMemo(() => {
    return db.students
      .map((student) => {
        const latestEnr =
          db.enrollments.find((e) => e.studentId === student.id && e.academicYearId === activeYear?.id) ??
          db.enrollments
            .filter((e) => e.studentId === student.id)
            .sort((a, b) => b.id.localeCompare(a.id))[0];
        const cls = latestEnr ? db.classes.find((c) => c.id === latestEnr.classId) : null;
        const sec = latestEnr ? db.sections.find((s) => s.id === latestEnr.sectionId) : null;
        const grp = latestEnr?.groupId
          ? db.academicGroups.find((g) => g.id === latestEnr.groupId)
          : null;
        const yr = latestEnr ? db.academicYears.find((y) => y.id === latestEnr.academicYearId) : null;

        return {
          student,
          enrollment: latestEnr,
          classNameBn: cls ? cls.nameBn || cls.name : '—',
          classNameEn: cls ? cls.name : '—',
          classNumeric: cls?.numericValue ?? 0,
          sectionName: sec?.name ?? null,
          groupNameBn: grp ? grp.nameBn || grp.name : '',
          groupNameEn: grp ? grp.name : '',
          sessionName: yr?.name ?? activeYearName,
          roll: latestEnr?.roll ?? null,
        };
      })
      .sort((a, b) => {
        if (b.classNumeric !== a.classNumeric) return b.classNumeric - a.classNumeric;
        return (a.roll ?? 999) - (b.roll ?? 999);
      });
  }, [db.students, db.enrollments, db.classes, db.sections, db.academicGroups, db.academicYears, activeYear?.id, activeYearName]);

  const activeStudentsCount = useMemo(
    () => db.students.filter((s) => s.status === StudentStatus.ACTIVE).length,
    [db.students]
  );

  // Enrich testimonials registry
  const rows = useMemo<EnrichedTestimonial[]>(() => {
    return [...db.testimonials]
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.id.localeCompare(a.id))
      .map((item) => {
        const student = db.students.find((s) => s.id === item.studentId);
        const parents = getParents(item.studentId);
        const classSummary = [
          item.className,
          item.sectionName ? `${pick('শাখা', 'Sec')}: ${item.sectionName}` : null,
          item.roll ? `${pick('রোল', 'Roll')}: ${formatNumber(item.roll, locale)}` : null,
        ]
          .filter(Boolean)
          .join(' · ');

        const purposeOrResult =
          item.type === TestimonialType.SSC_GRADUATE
            ? [
                item.passingYear ? `${pick('এসএসসি', 'SSC')} ${formatNumber(item.passingYear, locale)}` : null,
                item.gpa ? `GPA ${item.gpa}` : null,
                item.letterGrade ? `(${item.letterGrade})` : null,
                item.boardRoll ? `${pick('রোল', 'Roll')}: ${item.boardRoll}` : null,
              ]
                .filter(Boolean)
                .join(' · ')
            : item.purpose || pick('অধ্যয়ন ও চারিত্রিক প্রত্যয়ন', 'Study & character verification');

        return {
          ...item,
          studentNameBn: student?.nameBn || student?.nameEn || '—',
          studentNameEn: student?.nameEn || '—',
          studentCode: student?.studentId || '—',
          fatherName: parents.fatherName || '—',
          classSummary: classSummary || '—',
          purposeOrResult,
        };
      });
  }, [db.testimonials, db.students, db.parentStudents, db.parents, locale, pick]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (typeFilter !== 'ALL' && row.type !== typeFilter) return false;
      if (!q) return true;
      const haystack = [
        row.refNumber,
        row.studentNameBn,
        row.studentNameEn,
        row.studentCode,
        row.classSummary,
        row.purposeOrResult,
        row.boardRoll ?? '',
        row.registrationNo ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, searchQuery, typeFilter]);

  // KPI metrics
  const totalIssued = db.testimonials.length;
  const issuedThisYear = db.testimonials.filter((t) => t.issueDate.startsWith(activeYearName)).length;
  const studyCount = db.testimonials.filter((t) => t.type === TestimonialType.STUDY_CHARACTER).length;
  const sscCount = db.testimonials.filter((t) => t.type === TestimonialType.SSC_GRADUATE).length;

  const selectedStudentMeta = useMemo(
    () => studentOptions.find((item) => item.student.id === form.studentId) ?? null,
    [studentOptions, form.studentId]
  );

  const duplicateRefNumber = useMemo(() => {
    const ref = form.refNumber.trim().toLowerCase();
    if (!ref) return false;
    return db.testimonials.some((item) => item.refNumber.trim().toLowerCase() === ref);
  }, [db.testimonials, form.refNumber]);

  const openIssueModal = (presetType: TestimonialType = TestimonialType.STUDY_CHARACTER) => {
    const today = localToday();
    const defaultCandidate =
      presetType === TestimonialType.SSC_GRADUATE
        ? studentOptions.find((item) => item.classNumeric >= 10) ?? studentOptions[0]
        : studentOptions.find((item) => item.student.status === StudentStatus.ACTIVE) ?? studentOptions[0];

    setForm({
      type: presetType,
      studentId: defaultCandidate?.student.id ?? '',
      refNumber: suggestNextRefNumber(db, activeYearName),
      issueDate: today,
      purpose:
        presetType === TestimonialType.STUDY_CHARACTER
          ? pick('উপবৃত্তি ও মেধাবৃত্তি আবেদনের জন্য', 'For scholarship & stipend application')
          : '',
      boardName: pick(
        'মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড, ঢাকা',
        'Board of Intermediate and Secondary Education, Dhaka'
      ),
      passingYear: activeYearName,
      boardRoll: '',
      registrationNo: defaultCandidate?.student.boardRegistrationNo ?? '',
      gpa: '5.00',
      letterGrade: 'A+',
      groupName: defaultCandidate
        ? locale === 'bn'
          ? defaultCandidate.groupNameBn
          : defaultCandidate.groupNameEn
        : '',
      conductRemarks: pick('উত্তম ও শৃঙ্খলাপরায়ণ', 'Good and disciplined'),
      remarks: '',
    });
    setIssueOpen(true);
  };

  const handleStudentChange = (studentId: string) => {
    const meta = studentOptions.find((item) => item.student.id === studentId);
    setForm((prev) => ({
      ...prev,
      studentId,
      registrationNo: meta?.student.boardRegistrationNo ?? prev.registrationNo,
      groupName: meta ? (locale === 'bn' ? meta.groupNameBn : meta.groupNameEn) : '',
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.studentId) {
      toast.error(pick('একজন শিক্ষার্থী নির্বাচন করুন।', 'Please select a student.'));
      return;
    }
    if (!form.refNumber.trim() || duplicateRefNumber) {
      toast.error(
        duplicateRefNumber
          ? pick('এই স্মারক নম্বরটি আগেই ব্যবহৃত হয়েছে।', 'This reference number is already in use.')
          : pick('স্মারক নম্বর দিন।', 'Reference number is required.')
      );
      return;
    }
    if (form.type === TestimonialType.SSC_GRADUATE && (!form.passingYear.trim() || !form.boardRoll.trim())) {
      toast.error(
        pick(
          'এসএসসি প্রশংসাপত্রের জন্য পাসের সন ও বোর্ড রোল নম্বর আবশ্যক।',
          'Passing year and board roll are required for SSC Graduate testimonials.'
        )
      );
      return;
    }

    try {
      const created = await issueTestimonial({
        studentId: form.studentId,
        type: form.type,
        refNumber: form.refNumber.trim(),
        issueDate: form.issueDate,
        academicSession: selectedStudentMeta?.sessionName ?? activeYearName,
        className: selectedStudentMeta
          ? locale === 'bn'
            ? selectedStudentMeta.classNameBn
            : selectedStudentMeta.classNameEn
          : null,
        sectionName: selectedStudentMeta?.sectionName ?? null,
        roll: selectedStudentMeta?.roll ?? null,
        groupName: form.groupName.trim() || null,
        purpose: form.type === TestimonialType.STUDY_CHARACTER ? form.purpose.trim() || null : null,
        boardName: form.type === TestimonialType.SSC_GRADUATE ? form.boardName.trim() || null : null,
        passingYear: form.type === TestimonialType.SSC_GRADUATE ? form.passingYear.trim() || null : null,
        boardRoll: form.type === TestimonialType.SSC_GRADUATE ? form.boardRoll.trim() || null : null,
        registrationNo: form.registrationNo.trim() || null,
        gpa: form.type === TestimonialType.SSC_GRADUATE ? form.gpa.trim() || null : null,
        letterGrade: form.type === TestimonialType.SSC_GRADUATE ? form.letterGrade.trim() || null : null,
        conductRemarks: form.conductRemarks.trim() || null,
        remarks: form.remarks.trim() || null,
      }).unwrap();

      toast.success(
        `${pick('প্রত্যয়নপত্র ইস্যু সম্পন্ন হয়েছে', 'Testimonial certificate issued')} (${created.refNumber})`
      );
      setIssueOpen(false);
      setPrintId(created.id);
    } catch (err) {
      toast.error(errorMessage(err, pick('প্রত্যয়নপত্র ইস্যু করা যায়নি।', 'Could not issue testimonial.')));
    }
  };

  const handleExportCsv = () => {
    exportToCsv(
      rows.map((r) => ({
        refNumber: r.refNumber,
        type: r.type,
        issueDate: r.issueDate,
        studentId: r.studentCode,
        nameBn: r.studentNameBn,
        nameEn: r.studentNameEn,
        classSummary: r.classSummary,
        purposeOrResult: r.purposeOrResult,
        conduct: r.conductRemarks ?? '',
      })),
      `testimonials-registry-${activeYearName}.csv`
    );
  };

  const printedItem = db.testimonials.find((item) => item.id === printId) ?? null;
  const printedStudent = printedItem
    ? db.students.find((item) => item.id === printedItem.studentId) ?? null
    : null;
  const printedParents = printedStudent ? getParents(printedStudent.id) : null;

  const hasFilters = Boolean(searchQuery.trim()) || typeFilter !== 'ALL';

  return (
    <div className="space-y-5">
      {/* 1. 4-Column Hairline-Divided Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-3">
          <span className="text-base font-bold text-foreground">
            {pick('মোট ইস্যুকৃত প্রত্যয়নপত্র', 'Total Issued Certificates')}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {formatNumber(totalIssued, locale)}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {pick(
                `${activeYearName} সেশনে ${formatNumber(issuedThisYear, locale)}টি`,
                `${issuedThisYear} in ${activeYearName}`
              )}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {pick('ক্রমিক স্মারক নং সহ দাপ্তরিক রেজিস্টার', 'Official registry with sequential Ref. No.')}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-3">
          <span className="text-base font-bold text-foreground">
            {pick('অধ্যয়ন ও চারিত্রিক প্রত্যয়ন', 'Study & Character')}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {formatNumber(studyCount, locale)}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {pick('টি ইস্যুকৃত', 'issued')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {pick('উপবৃত্তি, পাসপোর্ট ও ব্যাংক হিসাবের জন্য', 'For stipends, passport & official use')}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-3">
          <span className="text-base font-bold text-foreground">
            {pick('এসএসসি প্রশংসাপত্র', 'SSC Testimonials')}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {formatNumber(sscCount, locale)}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {pick('টি বোর্ড প্রশংসাপত্র', 'graduate copies')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {pick('বোর্ড রোল, রেজিস্ট্রেশন ও জিপিএ যুক্ত', 'Includes board roll, reg. & GPA')}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-3">
          <span className="text-base font-bold text-foreground">
            {pick('বর্তমান সক্রিয় শিক্ষার্থী', 'Active Student Roster')}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">
              {formatNumber(activeStudentsCount, locale)}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {pick('জন অধ্যয়নরত', 'active students')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {pick('প্রত্যয়নপত্র ইস্যুতে ভর্তি স্ট্যাটাস অপরিবর্তিত থাকে', 'Issuing never closes active enrollment')}
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
              placeholder={pick(
                'স্মারক নং, নাম বা আইডি খুঁজুন...',
                'Search ref no, name, or ID...'
              )}
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'ALL' | TestimonialType)}
              className="h-9 text-sm w-auto min-w-[190px]"
            >
              <option value="ALL">{pick('ধরন: সব প্রত্যয়নপত্র', 'Type: All Certificates')}</option>
              <option value={TestimonialType.STUDY_CHARACTER}>
                {pick('অধ্যয়ন ও চারিত্রিক প্রত্যয়নপত্র', 'Study & Character Certificate')}
              </option>
              <option value={TestimonialType.SSC_GRADUATE}>
                {pick('এসএসসি প্রশংসাপত্র', 'SSC / Graduate Testimonial')}
              </option>
            </Select>

            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('ALL');
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{pick('রিসেট', 'Reset')}</span>
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="w-3.5 h-3.5" />
              <span>{pick('CSV রপ্তানি', 'Export CSV')}</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => openIssueModal(TestimonialType.STUDY_CHARACTER)}
            >
              <Plus className="w-4 h-4" />
              <span>{pick('নতুন প্রত্যয়নপত্র ইস্যু', 'Issue Testimonial')}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. High-Density Testimonial Registry Table */}
      <DataTable
        data={filteredRows}
        hideToolbar
        emptyTitle={pick(
          'এই ফিল্টারে কোনো ইস্যুকৃত প্রত্যয়নপত্র পাওয়া যায়নি।',
          'No issued testimonials match the selected filters.'
        )}
        columns={[
          {
            accessorKey: 'refNumber',
            header: pick('স্মারক ও তারিখ', 'Ref. No & Date'),
            cell: ({ row }) => (
              <div className="space-y-0.5 tabular-nums">
                <span className="font-mono text-xs font-semibold text-foreground block">
                  {row.original.refNumber}
                </span>
                <span className="text-xs text-muted-foreground block">
                  {formatDateShort(`${row.original.issueDate}T12:00:00`, locale)}
                </span>
              </div>
            ),
          },
          {
            accessorKey: 'studentNameBn',
            header: pick('শিক্ষার্থী', 'Student'),
            cell: ({ row }) => (
              <div className="flex items-center gap-2.5 min-w-[190px]">
                <span className="w-8 h-8 rounded-[var(--radius)] bg-surface-muted border border-border text-xs font-semibold text-foreground inline-flex items-center justify-center shrink-0">
                  {studentInitials(row.original.studentNameEn)}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/admin/students/${row.original.studentId}`}
                    className="font-medium text-foreground hover:text-primary truncate block"
                  >
                    {locale === 'bn' ? row.original.studentNameBn : row.original.studentNameEn}
                  </Link>
                  <span className="text-xs text-muted-foreground font-mono tabular-nums block">
                    {row.original.studentCode}
                  </span>
                </div>
              </div>
            ),
          },
          {
            accessorKey: 'type',
            header: pick('ধরন ও শ্রেণি', 'Type & Class'),
            cell: ({ row }) => (
              <div className="space-y-1">
                <StatusBadge enumName="TestimonialType" value={row.original.type} />
                <span className="text-xs text-muted-foreground block tabular-nums">
                  {row.original.classSummary}
                </span>
              </div>
            ),
          },
          {
            accessorKey: 'purposeOrResult',
            header: pick('উদ্দেশ্য / বোর্ড ফলাফল', 'Purpose / Board Result'),
            cell: ({ row }) => (
              <div className="max-w-[260px]">
                <p className="text-xs text-foreground line-clamp-2">{row.original.purposeOrResult}</p>
                {row.original.conductRemarks && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {pick('আচরণ:', 'Conduct:')} {row.original.conductRemarks}
                  </p>
                )}
              </div>
            ),
          },
          {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPrintId(row.original.id)}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{pick('দেখুন ও প্রিন্ট', 'Preview & Print')}</span>
                </Button>
                <Link href={`/admin/students/${row.original.studentId}`}>
                  <Button size="sm" variant="ghost" aria-label={pick('প্রোফাইল', 'Profile')}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            ),
          },
        ]}
      />

      {/* 4. Smart Issue Testimonial Modal */}
      <Modal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        title={pick('নতুন প্রত্যয়নপত্র / প্রশংসাপত্র ইস্যু করুন', 'Issue Official Testimonial Certificate')}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Certificate Type Segmented Switch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  type: TestimonialType.STUDY_CHARACTER,
                  purpose:
                    prev.purpose ||
                    pick('উপবৃত্তি ও মেধাবৃত্তি আবেদনের জন্য', 'For scholarship & stipend application'),
                }))
              }
              className={cn(
                'p-3 rounded-[var(--radius)] border text-left transition-colors cursor-pointer flex items-start gap-2.5',
                form.type === TestimonialType.STUDY_CHARACTER
                  ? 'border-primary bg-primary/[0.06] text-foreground'
                  : 'border-border bg-surface hover:bg-surface-muted/40 text-muted-foreground'
              )}
            >
              <Award
                className={cn(
                  'w-4 h-4 mt-0.5 shrink-0',
                  form.type === TestimonialType.STUDY_CHARACTER ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {pick('অধ্যয়ন ও চারিত্রিক প্রত্যয়নপত্র', 'Study & Character Certificate')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pick('বর্তমান শিক্ষার্থীদের বৃত্তি, পাসপোর্ট বা দাপ্তরিক প্রয়োজনে।', 'For active students (stipend, passport, bank, official use).')}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  type: TestimonialType.SSC_GRADUATE,
                }))
              }
              className={cn(
                'p-3 rounded-[var(--radius)] border text-left transition-colors cursor-pointer flex items-start gap-2.5',
                form.type === TestimonialType.SSC_GRADUATE
                  ? 'border-primary bg-primary/[0.06] text-foreground'
                  : 'border-border bg-surface hover:bg-surface-muted/40 text-muted-foreground'
              )}
            >
              <GraduationCap
                className={cn(
                  'w-4 h-4 mt-0.5 shrink-0',
                  form.type === TestimonialType.SSC_GRADUATE ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {pick('এসএসসি প্রশংসাপত্র (Testimonial)', 'SSC / Graduate Testimonial')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pick('বোর্ড পরীক্ষার রোল, রেজিস্ট্রেশন, সন ও জিপিএ যুক্ত প্রশংসাপত্র।', 'Formal graduate testimonial with board roll, reg. & GPA.')}
                </p>
              </div>
            </button>
          </div>

          <FormField label={pick('শিক্ষার্থী নির্বাচন করুন', 'Select Student')} required>
            <Select value={form.studentId} onChange={(e) => handleStudentChange(e.target.value)}>
              <option value="">{pick('শিক্ষার্থী বাছাই করুন...', 'Choose a student...')}</option>
              {studentOptions.map((item) => (
                <option key={item.student.id} value={item.student.id}>
                  {locale === 'bn' ? item.student.nameBn || item.student.nameEn : item.student.nameEn} ·{' '}
                  {locale === 'bn' ? item.classNameBn : item.classNameEn}
                  {item.sectionName ? ` (${item.sectionName})` : ''}
                  {item.roll ? ` · ${pick('রোল', 'Roll')} ${formatNumber(item.roll, locale)}` : ''} ·{' '}
                  {item.student.studentId}
                </option>
              ))}
            </Select>
          </FormField>

          {selectedStudentMeta && (
            <div className="p-3 rounded-[var(--radius)] border border-border bg-surface-muted/40 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs tabular-nums">
              <div>
                <span className="text-muted-foreground block">{pick('শ্রেণি ও শাখা', 'Class & Section')}</span>
                <span className="font-semibold text-foreground">
                  {locale === 'bn' ? selectedStudentMeta.classNameBn : selectedStudentMeta.classNameEn}
                  {selectedStudentMeta.sectionName ? ` · ${selectedStudentMeta.sectionName}` : ''}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">{pick('রোল ও সেশন', 'Roll & Session')}</span>
                <span className="font-semibold text-foreground">
                  {selectedStudentMeta.roll ? formatNumber(selectedStudentMeta.roll, locale) : '—'} ·{' '}
                  {selectedStudentMeta.sessionName}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">{pick('বিভাগ', 'Group')}</span>
                <span className="font-semibold text-foreground">
                  {(locale === 'bn' ? selectedStudentMeta.groupNameBn : selectedStudentMeta.groupNameEn) ||
                    pick('সাধারণ', 'General')}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">{pick('পিতার নাম', "Father's Name")}</span>
                <span className="font-semibold text-foreground truncate block">
                  {getParents(selectedStudentMeta.student.id).fatherName || '—'}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField
              label={pick('স্মারক নম্বর (Ref. No)', 'Reference Number')}
              required
              error={
                duplicateRefNumber
                  ? pick('এই স্মারক নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে।', 'This reference number already exists.')
                  : undefined
              }
            >
              <Input
                value={form.refNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, refNumber: e.target.value }))}
                className="font-mono"
                placeholder="BHS/TEST/2026/003"
              />
            </FormField>

            <FormField label={pick('ইস্যুর তারিখ', 'Issue Date')} required>
              <Input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, issueDate: e.target.value }))}
              />
            </FormField>
          </div>

          {form.type === TestimonialType.STUDY_CHARACTER ? (
            <div className="space-y-2">
              <FormField label={pick('প্রত্যয়নপত্র গ্রহণের উদ্দেশ্য', 'Purpose of Certificate')}>
                <Input
                  value={form.purpose}
                  onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
                  placeholder={pick('যেমন: উপবৃত্তি আবেদনের জন্য', 'e.g., For scholarship application')}
                />
              </FormField>
              <div className="flex flex-wrap gap-1.5">
                {PURPOSE_PRESETS.map((preset) => {
                  const text = locale === 'bn' ? preset.bn : preset.en;
                  return (
                    <button
                      key={preset.en}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, purpose: text }))}
                      className="text-xs px-2.5 py-1 rounded border border-border bg-surface hover:bg-surface-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {text}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 p-3.5 rounded-[var(--radius)] border border-border bg-surface-muted/30">
              <p className="text-xs font-semibold text-foreground">
                {pick('বোর্ড পরীক্ষার তথ্য (এসএসসি প্রশংসাপত্র)', 'Board Examination Details (SSC Testimonial)')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label={pick('শিক্ষা বোর্ড', 'Education Board')}>
                  <Input
                    value={form.boardName}
                    onChange={(e) => setForm((prev) => ({ ...prev, boardName: e.target.value }))}
                  />
                </FormField>
                <FormField label={pick('বিভাগ (Group)', 'Academic Group')}>
                  <Input
                    value={form.groupName}
                    onChange={(e) => setForm((prev) => ({ ...prev, groupName: e.target.value }))}
                    placeholder={pick('বিজ্ঞান / মানবিক / ব্যবসায় শিক্ষা', 'Science / Humanities / Business')}
                  />
                </FormField>
                <FormField label={pick('পাসের সন', 'Passing Year')} required>
                  <Input
                    value={form.passingYear}
                    onChange={(e) => setForm((prev) => ({ ...prev, passingYear: e.target.value }))}
                    className="font-mono"
                    placeholder="2026"
                  />
                </FormField>
                <FormField label={pick('বোর্ড রোল নম্বর', 'Board Roll Number')} required>
                  <Input
                    value={form.boardRoll}
                    onChange={(e) => setForm((prev) => ({ ...prev, boardRoll: e.target.value }))}
                    className="font-mono"
                    placeholder="241509"
                  />
                </FormField>
                <FormField label={pick('বোর্ড রেজিস্ট্রেশন নম্বর', 'Board Registration No.')}>
                  <Input
                    value={form.registrationNo}
                    onChange={(e) => setForm((prev) => ({ ...prev, registrationNo: e.target.value }))}
                    className="font-mono"
                    placeholder="2110924810"
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-2.5">
                  <FormField label={pick('অর্জিত জিপিএ', 'GPA')}>
                    <Input
                      value={form.gpa}
                      onChange={(e) => setForm((prev) => ({ ...prev, gpa: e.target.value }))}
                      className="font-mono"
                      placeholder="5.00"
                    />
                  </FormField>
                  <FormField label={pick('গ্রেড', 'Grade')}>
                    <Select
                      value={form.letterGrade}
                      onChange={(e) => setForm((prev) => ({ ...prev, letterGrade: e.target.value }))}
                    >
                      {LETTER_GRADES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label={pick('স্বভাব ও চারিত্রিক মন্তব্য', 'Conduct & Character')}>
              <Input
                value={form.conductRemarks}
                onChange={(e) => setForm((prev) => ({ ...prev, conductRemarks: e.target.value }))}
              />
            </FormField>
            <FormField label={pick('দাপ্তরিক নোট (ঐচ্ছিক)', 'Office Note (Optional)')}>
              <Input
                value={form.remarks}
                onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                placeholder={pick('রেজিস্টারের অভ্যন্তরীণ নোট', 'Internal register note')}
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIssueOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !form.studentId || duplicateRefNumber}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>
                {isLoading
                  ? pick('ইস্যু হচ্ছে...', 'Issuing...')
                  : pick('প্রত্যয়নপত্র ইস্যু ও প্রিন্ট করুন', 'Issue & Open Print Copy')}
              </span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Formal Monochrome A4 Print Preview Modal */}
      <Modal
        open={Boolean(printedItem && printedStudent)}
        onClose={() => setPrintId(null)}
        title={
          printedItem
            ? `${pick('অফিসিয়াল প্রত্যয়নপত্র', 'Official Testimonial Certificate')} · ${printedItem.refNumber}`
            : pick('প্রত্যয়নপত্র', 'Testimonial Certificate')
        }
        maxWidth="max-w-4xl"
      >
        {printedItem && printedStudent && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border no-print">
              <Link
                href={`/admin/students/${printedStudent.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{pick('শিক্ষার্থীর প্রোফাইল দেখুন', 'Open student dossier')}</span>
              </Link>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() =>
                  triggerCertificatePrint({
                    kind: 'TESTIMONIAL',
                    school: db.schoolProfile,
                    testimonial: printedItem,
                    student: printedStudent,
                    fatherName: printedParents?.fatherName ?? null,
                    motherName: printedParents?.motherName ?? null,
                  })
                }
              >
                <Printer className="w-4 h-4" />
                <span>{pick('প্রিন্ট করুন', 'Print Certificate')}</span>
              </Button>
            </div>
            <PrintableTestimonialCertificate
              school={db.schoolProfile}
              testimonial={printedItem}
              student={printedStudent}
              fatherName={printedParents?.fatherName}
              motherName={printedParents?.motherName}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
