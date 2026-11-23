'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  Eye,
  Pencil,
  Phone,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { cn, exportToCsv } from '@/src/lib/utils/cn';
import { DataTable } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';
import { AttendanceStatus, Gender, StudentStatus } from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import { classLabel, studentInitials } from './studentShared';

export function StudentDirectory({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const { locale, pick } = useI18n();
  const [classId, setClassId] = useState('ALL');
  const [sectionId, setSectionId] = useState('ALL');
  const [groupId, setGroupId] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const yearObj = db.academicYears.find((y) => y.id === yearId);

  const sortedClasses = useMemo(
    () => [...db.classes].sort((a, b) => a.numericValue - b.numericValue),
    [db.classes]
  );

  const copyText = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(text);
      toast.success(`${label} ${pick('কপি করা হয়েছে।', 'copied.')}`);
      setTimeout(() => setCopiedId((prev) => (prev === text ? null : prev)), 1800);
    }
  };

  // Pre-aggregate attendance rates by enrollmentId in O(N) for fast table rendering
  const attendanceByEnrollment = useMemo(() => {
    const stats = new Map<string, { attended: number; total: number }>();
    for (const mark of db.attendances) {
      const current = stats.get(mark.studentEnrollmentId) ?? { attended: 0, total: 0 };
      current.total += 1;
      if (
        mark.status === AttendanceStatus.PRESENT ||
        mark.status === AttendanceStatus.LATE
      ) {
        current.attended += 1;
      }
      stats.set(mark.studentEnrollmentId, current);
    }
    return stats;
  }, [db.attendances]);

  const enrolled = useMemo(() => {
    return db.enrollments
      .filter((enrollment) => enrollment.academicYearId === yearId)
      .map((enrollment) => {
        const student = db.students.find((item) => item.id === enrollment.studentId);
        if (!student) return null;
        const cls = db.classes.find((item) => item.id === enrollment.classId);
        const section = db.sections.find((item) => item.id === enrollment.sectionId);
        const group = enrollment.groupId
          ? db.academicGroups.find((item) => item.id === enrollment.groupId)
          : null;
        const guardianLink = db.parentStudents
          .filter((link) => link.studentId === student.id)
          .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))[0];
        const guardian = guardianLink
          ? db.parents.find((parent) => parent.id === guardianLink.parentId)
          : undefined;

        const guardianPhone =
          guardian?.phone && !guardian.phone.startsWith('unused-') ? guardian.phone : '—';

        const att = attendanceByEnrollment.get(enrollment.id);
        const attendanceRate =
          att && att.total > 0 ? Math.round((att.attended / att.total) * 100) : null;

        return {
          id: student.id,
          enrollmentId: enrollment.id,
          studentId: student.studentId,
          nameBn: student.nameBn || student.nameEn,
          nameEn: student.nameEn,
          gender: student.gender,
          classId: enrollment.classId,
          classNumeric: cls?.numericValue ?? 99,
          sectionId: enrollment.sectionId,
          groupId: enrollment.groupId ?? '',
          classLabel: classLabel(db, enrollment.classId, locale),
          sectionLabel: section?.name ?? '—',
          groupLabel: group ? (locale === 'bn' ? group.nameBn || group.name : group.name) : '',
          roll: enrollment.roll,
          guardianName: guardian ? guardian.nameBn || guardian.name : '—',
          guardianPhone,
          attendanceRate,
          attendanceDays: att?.total ?? 0,
          status: student.status,
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }, [db, yearId, locale, attendanceByEnrollment]);

  // Institutional KPI metrics for selected academic session
  const totalEnrolled = enrolled.length;
  const activeCount = enrolled.filter((r) => r.status === StudentStatus.ACTIVE).length;
  const inactiveOrOtherCount = totalEnrolled - activeCount;
  const boysCount = enrolled.filter((r) => r.gender === Gender.MALE).length;
  const girlsCount = enrolled.filter((r) => r.gender === Gender.FEMALE).length;
  const boysPercent = totalEnrolled > 0 ? Math.round((boysCount / totalEnrolled) * 100) : 0;
  const girlsPercent = totalEnrolled > 0 ? 100 - boysPercent : 0;

  const attendanceTracked = enrolled.filter((r) => r.attendanceRate !== null);
  const avgAttendance =
    attendanceTracked.length > 0
      ? Math.round(
          attendanceTracked.reduce((sum, r) => sum + (r.attendanceRate ?? 0), 0) /
            attendanceTracked.length
        )
      : null;
  const lowAttendanceCount = attendanceTracked.filter((r) => (r.attendanceRate ?? 100) < 75).length;

  const pendingAdmissions = db.onlineAdmissions.filter(
    (app) => app.status === 'NEW' || app.status === 'UNDER_REVIEW'
  ).length;

  // Class-wise counts (sorted 6 -> 10)
  const classCounts = useMemo(() => {
    const counts = new Map<string, number>();
    enrolled.forEach((row) => {
      counts.set(row.classId, (counts.get(row.classId) ?? 0) + 1);
    });
    return sortedClasses.map((cls) => ({
      id: cls.id,
      label: locale === 'bn' ? cls.nameBn || cls.name : cls.name,
      count: counts.get(cls.id) ?? 0,
    }));
  }, [enrolled, sortedClasses, locale]);

  const availableSections = useMemo(
    () => db.sections.filter((item) => classId === 'ALL' || item.classId === classId),
    [db.sections, classId]
  );

  // Filtered and numerically ordered rows
  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrolled
      .filter((row) => (classId === 'ALL' ? true : row.classId === classId))
      .filter((row) => (sectionId === 'ALL' ? true : row.sectionId === sectionId))
      .filter((row) => (groupId === 'ALL' ? true : row.groupId === groupId))
      .filter((row) => (genderFilter === 'ALL' ? true : row.gender === genderFilter))
      .filter((row) => (status === 'ALL' ? true : row.status === status))
      .filter((row) => {
        if (!q) return true;
        return (
          row.nameBn.toLowerCase().includes(q) ||
          row.nameEn.toLowerCase().includes(q) ||
          row.studentId.toLowerCase().includes(q) ||
          String(row.roll).includes(q) ||
          row.guardianName.toLowerCase().includes(q) ||
          row.guardianPhone.toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          a.classNumeric - b.classNumeric ||
          a.sectionLabel.localeCompare(b.sectionLabel) ||
          a.roll - b.roll
      );
  }, [enrolled, classId, sectionId, groupId, genderFilter, status, searchQuery]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    classId !== 'ALL' ||
    sectionId !== 'ALL' ||
    groupId !== 'ALL' ||
    genderFilter !== 'ALL' ||
    status !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setClassId('ALL');
    setSectionId('ALL');
    setGroupId('ALL');
    setGenderFilter('ALL');
    setStatus('ALL');
  };

  const handleExportCsv = () => {
    exportToCsv(
      rows.map((r) => ({
        roll: r.roll,
        studentId: r.studentId,
        nameBn: r.nameBn,
        nameEn: r.nameEn,
        gender: r.gender,
        class: r.classLabel,
        section: r.sectionLabel,
        stream: r.groupLabel || '—',
        attendanceRate: r.attendanceRate !== null ? `${r.attendanceRate}%` : '—',
        guardian: r.guardianName,
        guardianPhone: r.guardianPhone,
        status: r.status,
      })),
      `students-${yearObj?.name ?? yearId}.csv`
    );
  };

  return (
    <div className="space-y-5">
      {/* 1. Institutional Summary Strip — Single flat container divided by hairlines */}
      <Card className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2">
          <span className="text-base font-bold text-foreground">
            {pick('মোট ভর্তি শিক্ষার্থী', 'Total Enrolled')}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tabular-nums text-foreground tracking-tight">
              {formatNumber(totalEnrolled, locale)}
            </span>
            <span className="text-sm text-muted-foreground">
              {pick(`সেশন ${yearObj?.name ?? ''}`, `Session ${yearObj?.name ?? ''}`)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            {pick(
              `সক্রিয় ${formatNumber(activeCount, locale)} · অন্যান্য ${formatNumber(inactiveOrOtherCount, locale)}`,
              `${activeCount} active · ${inactiveOrOtherCount} other`
            )}
          </p>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2">
          <span className="text-base font-bold text-foreground">
            {pick('ছাত্র ও ছাত্রী অনুপাত', 'Gender Ratio')}
          </span>
          <div className="flex items-baseline justify-between gap-3 tabular-nums">
            <div>
              <span className="text-2xl font-extrabold text-foreground tracking-tight">
                {formatNumber(boysCount, locale)}
              </span>
              <span className="ml-1.5 text-sm text-muted-foreground font-medium">
                {pick('ছাত্র', 'Boys')} ({formatNumber(boysPercent, locale)}%)
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-foreground tracking-tight">
                {formatNumber(girlsCount, locale)}
              </span>
              <span className="ml-1.5 text-sm text-muted-foreground font-medium">
                {pick('ছাত্রী', 'Girls')} ({formatNumber(girlsPercent, locale)}%)
              </span>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-muted overflow-hidden flex">
            <div style={{ width: `${boysPercent}%` }} className="bg-[#1C6440] h-full" />
            <div style={{ width: `${girlsPercent}%` }} className="bg-[#124B96] h-full" />
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2">
          <span className="text-base font-bold text-foreground">
            {pick('গড় বার্ষিক উপস্থিতি', 'Average Attendance')}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tabular-nums text-primary tracking-tight">
              {avgAttendance !== null ? `${formatNumber(avgAttendance, locale)}%` : '—'}
            </span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {lowAttendanceCount > 0
                ? pick(
                    `· ${formatNumber(lowAttendanceCount, locale)} জন ৭৫%-এর নিচে`,
                    `· ${lowAttendanceCount} below 75%`
                  )
                : pick('· নিয়মিত উপস্থিতি', '· Healthy standing')}
            </span>
          </div>
          <Link
            href="/admin/attendance/daily"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline w-fit"
          >
            <span>{pick('দৈনিক হাজিরা রেজিস্টার', 'Daily attendance register')}</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2">
          <span className="text-base font-bold text-foreground">
            {pick('অনলাইন ভর্তি আবেদন', 'Admission Queue')}
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                'text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight',
                pendingAdmissions > 0 ? 'text-[#124B96]' : 'text-foreground'
              )}
            >
              {formatNumber(pendingAdmissions, locale)}
            </span>
            <span className="text-sm text-muted-foreground">
              {pick('টি পর্যালোচনার অপেক্ষায়', 'pending review')}
            </span>
          </div>
          <Link
            href="/admin/students/admissions"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline w-fit"
          >
            <span>
              {pick(
                `আবেদন তালিকা (${formatNumber(db.onlineAdmissions.length, locale)})`,
                `Review applications (${db.onlineAdmissions.length})`
              )}
            </span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </Card>

      {/* 2. Class Navigation Strip & Unified Filter Toolbar */}
      <Card className="overflow-hidden">
        {/* Class tabs row */}
        <div
          className="flex items-center gap-1 px-4 pt-3 border-b border-border overflow-x-auto"
          role="tablist"
          aria-label={pick('শ্রেণি অনুযায়ী ফিল্টার', 'Filter by class')}
        >
          <button
            type="button"
            role="tab"
            aria-selected={classId === 'ALL'}
            onClick={() => {
              setClassId('ALL');
              setSectionId('ALL');
            }}
            className={cn(
              'px-4 py-2.5 text-base font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums',
              classId === 'ALL'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {pick('সকল শ্রেণি', 'All Classes')}{' '}
            <span className="text-sm font-medium opacity-80">({formatNumber(totalEnrolled, locale)})</span>
          </button>

          {classCounts.map((cls) => {
            const active = classId === cls.id;
            return (
              <button
                key={cls.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setClassId(cls.id);
                  setSectionId('ALL');
                }}
                className={cn(
                  'px-4 py-2.5 text-base font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums',
                  active
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {cls.label}{' '}
                <span className="text-sm font-medium opacity-80">({formatNumber(cls.count, locale)})</span>
              </button>
            );
          })}
        </div>

        {/* Search + Filter Controls Row */}
        <div className="p-4 space-y-3">
          <div className="flex flex-col xl:flex-row xl:items-center gap-2.5">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={pick(
                  'শিক্ষার্থীর নাম, রোল, আইডি, অভিভাবকের নাম বা মোবাইল নম্বর খুঁজুন...',
                  'Search student name, roll, ID, guardian or phone...'
                )}
                className="pl-9 pr-9 h-10 text-base"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label={pick('অনুসন্ধান মুছুন', 'Clear search')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={sectionId}
                onChange={(event) => setSectionId(event.target.value)}
                className="w-32 h-10 text-sm font-medium"
                aria-label={pick('শাখা', 'Section')}
              >
                <option value="ALL">{pick('সকল শাখা', 'All sections')}</option>
                {availableSections.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>

              <Select
                value={groupId}
                onChange={(event) => setGroupId(event.target.value)}
                className="w-34 h-10 text-sm font-medium"
                aria-label={pick('বিভাগ', 'Stream')}
              >
                <option value="ALL">{pick('সকল বিভাগ', 'All streams')}</option>
                {db.academicGroups.map((grp) => (
                  <option key={grp.id} value={grp.id}>
                    {locale === 'bn' ? grp.nameBn || grp.name : grp.name}
                  </option>
                ))}
              </Select>

              <Select
                value={genderFilter}
                onChange={(event) => setGenderFilter(event.target.value)}
                className="w-28 h-10 text-sm font-medium"
                aria-label={pick('লিঙ্গ', 'Gender')}
              >
                <option value="ALL">{pick('সকল লিঙ্গ', 'All')}</option>
                <option value={Gender.MALE}>{pick('ছাত্র', 'Boys')}</option>
                <option value={Gender.FEMALE}>{pick('ছাত্রী', 'Girls')}</option>
              </Select>

              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-32 h-10 text-sm font-medium"
                aria-label={pick('অবস্থা', 'Status')}
              >
                <option value="ALL">{pick('সকল অবস্থা', 'All statuses')}</option>
                <option value={StudentStatus.ACTIVE}>{pick('সক্রিয়', 'Active')}</option>
                <option value={StudentStatus.INACTIVE}>{pick('নিষ্ক্রিয়', 'Inactive')}</option>
                <option value={StudentStatus.TRANSFERRED}>{pick('স্থানান্তরিত', 'Transferred')}</option>
                <option value={StudentStatus.GRADUATED}>{pick('উত্তীর্ণ', 'Graduated')}</option>
              </Select>

              <Button
                variant="outline"
                size="sm"
                className="h-10 text-sm font-semibold"
                onClick={handleExportCsv}
                disabled={rows.length === 0}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{pick('এক্সপোর্ট CSV', 'Export CSV')}</span>
              </Button>
            </div>
          </div>

          {/* Quiet metadata strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border text-sm text-muted-foreground">
            <span className="tabular-nums">
              {hasActiveFilters
                ? pick(
                    `মোট ${formatNumber(totalEnrolled, locale)} জনের মধ্যে ${formatNumber(rows.length, locale)} জন শিক্ষার্থী দেখানো হচ্ছে`,
                    `Showing ${rows.length} of ${totalEnrolled} students`
                  )
                : pick(
                    `মোট ${formatNumber(rows.length, locale)} জন ভর্তি শিক্ষার্থী · শ্রেণি ও রোল অনুসারে সাজানো`,
                    `${rows.length} enrolled students · Sorted by class and roll`
                  )}
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-primary hover:underline font-semibold cursor-pointer text-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{pick('ফিল্টার রিসেট করুন', 'Reset filters')}</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* 3. High-Density Table View Only */}
      <DataTable
        data={rows}
        hideToolbar
        pageSize={15}
        emptyTitle={pick('কোনো শিক্ষার্থী পাওয়া যায়নি', 'No matching students found')}
        emptyAction={
          hasActiveFilters ? (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw className="w-3.5 h-3.5" />
              {pick('ফিল্টার রিসেট করুন', 'Reset filters')}
            </Button>
          ) : (
            <Link href="/admin/students/create">
              <Button variant="primary" size="sm">
                {pick('নতুন ভর্তি', 'New admission')}
              </Button>
            </Link>
          )
        }
        columns={[
          {
            accessorKey: 'roll',
            header: pick('রোল', 'Roll'),
            cell: ({ row }) => (
              <span className="font-mono text-base font-medium text-foreground tabular-nums">
                {String(row.original.roll).padStart(2, '0')}
              </span>
            ),
          },
          {
            accessorKey: 'nameBn',
            header: pick('শিক্ষার্থী ও আইডি', 'Student & ID'),
            cell: ({ row }) => (
              <div className="flex items-center gap-3 min-w-[220px]">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm shrink-0 border border-border',
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
                    className="font-semibold text-base text-foreground hover:text-primary hover:underline block truncate leading-snug"
                  >
                    {row.original.nameBn}
                  </Link>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                    <span className="truncate max-w-[140px]">{row.original.nameEn}</span>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(row.original.studentId, pick('শিক্ষার্থী আইডি', 'Student ID'))
                      }
                      className="inline-flex items-center gap-1 font-mono text-xs hover:text-foreground transition-colors cursor-pointer shrink-0"
                      title={pick('আইডি কপি করুন', 'Copy student ID')}
                    >
                      <span>{row.original.studentId}</span>
                      {copiedId === row.original.studentId ? (
                        <Check className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 opacity-60" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ),
          },
          {
            accessorKey: 'classNumeric',
            header: pick('শ্রেণি ও শাখা', 'Class & Section'),
            cell: ({ row }) => (
              <div className="whitespace-nowrap">
                <span className="font-medium text-base text-foreground">{row.original.classLabel}</span>
                <span className="text-base text-muted-foreground"> · {row.original.sectionLabel}</span>
                {row.original.groupLabel && (
                  <span className="block text-sm text-muted-foreground mt-0.5">
                    {row.original.groupLabel}
                  </span>
                )}
              </div>
            ),
          },
          {
            accessorKey: 'attendanceRate',
            header: pick('উপস্থিতি', 'Attendance'),
            cell: ({ row }) => {
              const rate = row.original.attendanceRate;
              if (rate === null) {
                return <span className="text-sm text-muted-foreground">—</span>;
              }
              const tone =
                rate >= 85
                  ? 'text-foreground'
                  : rate >= 75
                    ? 'text-warning'
                    : 'text-destructive';
              const barTone =
                rate >= 85
                  ? 'bg-primary'
                  : rate >= 75
                    ? 'bg-warning'
                    : 'bg-destructive';
              return (
                <div className="min-w-[84px] space-y-1">
                  <div className="flex items-baseline justify-between gap-2 tabular-nums">
                    <span className={cn('text-base font-semibold', tone)}>
                      {formatNumber(rate, locale)}%
                    </span>
                    <span className="text-sm font-medium text-muted-foreground tabular-nums">
                      {formatNumber(row.original.attendanceDays, locale)}d
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-muted overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, rate)}%` }}
                      className={cn('h-full', barTone)}
                    />
                  </div>
                </div>
              );
            },
          },
          {
            accessorKey: 'guardianName',
            header: pick('অভিভাবক ও যোগাযোগ', 'Guardian & Phone'),
            cell: ({ row }) => (
              <div className="whitespace-nowrap">
                <p className="text-base font-medium text-foreground leading-snug">{row.original.guardianName}</p>
                {row.original.guardianPhone !== '—' ? (
                  <a
                    href={`tel:${row.original.guardianPhone}`}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-mono mt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{row.original.guardianPhone}</span>
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            ),
          },
          {
            accessorKey: 'status',
            header: pick('অবস্থা', 'Status'),
            cell: ({ row }) => (
              <StatusBadge enumName="StudentStatus" value={row.original.status} />
            ),
          },
          {
            id: 'actions',
            header: '',
            enableSorting: false,
            cell: ({ row }) => (
              <div className="flex items-center justify-end gap-1">
                <Link
                  href={`/admin/students/${row.original.id}`}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-semibold text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{pick('প্রোফাইল', 'Profile')}</span>
                </Link>
                <Link
                  href={`/admin/students/${row.original.id}/edit`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
                  aria-label={pick('সম্পাদনা', 'Edit student')}
                  title={pick('সম্পাদনা', 'Edit student')}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Link>
              </div>
            ),
          },
        ]}
        renderMobileCard={(row) => (
          <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/admin/students/${row.id}`}
                  className="font-semibold text-foreground hover:text-primary block truncate"
                >
                  {row.nameBn}
                </Link>
                <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                  {row.studentId} · {row.classLabel} ({row.sectionLabel}) · {pick('রোল', 'Roll')}{' '}
                  {formatNumber(row.roll, locale)}
                </p>
              </div>
              <StatusBadge enumName="StudentStatus" value={row.status} />
            </div>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border text-xs">
              <div className="min-w-0">
                <span className="text-muted-foreground">{row.guardianName}</span>
                {row.guardianPhone !== '—' && (
                  <a
                    href={`tel:${row.guardianPhone}`}
                    className="block text-primary font-mono hover:underline"
                  >
                    {row.guardianPhone}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/admin/students/${row.id}`}
                  className="inline-flex h-9 px-2.5 items-center gap-1 rounded-md text-primary hover:bg-primary/10 font-medium"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{pick('প্রোফাইল', 'Profile')}</span>
                </Link>
                <Link
                  href={`/admin/students/${row.id}/edit`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-muted"
                  aria-label={pick('সম্পাদনা', 'Edit')}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}