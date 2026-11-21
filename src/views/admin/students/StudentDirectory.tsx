'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Eye,
  Filter,
  GraduationCap,
  LayoutGrid,
  List,
  Phone,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { DataTable } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';
import { localToday } from '@/src/lib/schoolDay';
import { AttendanceStatus, CardStatus, Gender, StudentStatus } from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import { BLOOD_LABEL, classLabel } from './studentShared';

export function StudentDirectory({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const { locale, pick } = useI18n();
  const [classId, setClassId] = useState('ALL');
  const [sectionId, setSectionId] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'ACTIVE' | 'PRESENT_TODAY' | 'ABSENT_TODAY' | 'NO_RFID' | 'SCIENCE' | 'HUMANITIES' | 'COMMERCE'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const today = localToday();
  const yearObj = db.academicYears.find((y) => y.id === yearId);

  const copyText = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(text);
      toast.success(`${label} ${pick('কপি করা হয়েছে।', 'copied to clipboard.')}`);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const enrolled = useMemo(() => {
    return db.enrollments
      .filter((enrollment) => enrollment.academicYearId === yearId)
      .map((enrollment) => {
        const student = db.students.find((item) => item.id === enrollment.studentId);
        if (!student) return null;
        const section = db.sections.find((item) => item.id === enrollment.sectionId);
        const group = enrollment.groupId ? db.academicGroups.find((item) => item.id === enrollment.groupId) : null;
        const guardianLink = db.parentStudents
          .filter((link) => link.studentId === student.id)
          .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))[0];
        const guardian = guardianLink ? db.parents.find((parent) => parent.id === guardianLink.parentId) : undefined;
        const todayMark = db.attendances.find(
          (att) => att.studentEnrollmentId === enrollment.id && att.date === today
        );
        const rfidCard = db.rfidCards.find((c) => c.studentId === student.id && c.status === CardStatus.ACTIVE);
        return {
          id: student.id,
          studentId: student.studentId,
          nameBn: student.nameBn || student.nameEn,
          nameEn: student.nameEn,
          gender: student.gender,
          classId: enrollment.classId,
          sectionId: enrollment.sectionId,
          groupId: enrollment.groupId,
          classLabel: classLabel(db, enrollment.classId, locale),
          sectionLabel: section?.name ?? '—',
          groupLabel: group ? (locale === 'bn' ? group.nameBn || group.name : group.name) : '—',
          roll: enrollment.roll,
          guardianName: guardian ? (guardian.nameBn || guardian.name) : '—',
          guardianPhone: guardian?.phone ?? '—',
          guardianRelationship: guardianLink?.relationship ?? '—',
          guardian: guardian ? `${guardian.nameBn || guardian.name} · ${guardian.phone}` : '—',
          status: student.status,
          presentAddress: student.presentAddress,
          bloodGroup: student.bloodGroup,
          hasActiveRfid: Boolean(rfidCard),
          rfidCardNumber: rfidCard?.cardNumber,
          todayAttendance: todayMark?.status,
          photo: student.photo,
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }, [db, yearId, locale, today]);

  // Statistics
  const totalEnrolled = enrolled.length;
  const activeCount = enrolled.filter((r) => r.status === StudentStatus.ACTIVE).length;
  const boysCount = enrolled.filter((r) => r.gender === Gender.MALE).length;
  const girlsCount = enrolled.filter((r) => r.gender === Gender.FEMALE).length;
  const boysPercent = totalEnrolled > 0 ? Math.round((boysCount / totalEnrolled) * 100) : 0;
  const girlsPercent = totalEnrolled > 0 ? 100 - boysPercent : 0;

  const presentTodayCount = enrolled.filter((r) => r.todayAttendance === AttendanceStatus.PRESENT).length;
  const absentTodayCount = enrolled.filter((r) => r.todayAttendance === AttendanceStatus.ABSENT).length;
  const todayAttendanceRate = totalEnrolled > 0 ? Math.round((presentTodayCount / totalEnrolled) * 100) : 0;

  const rfidActiveCount = enrolled.filter((r) => r.hasActiveRfid).length;
  const rfidPercent = totalEnrolled > 0 ? Math.round((rfidActiveCount / totalEnrolled) * 100) : 0;

  // Filtered rows
  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrolled
      .filter((row) => (classId === 'ALL' ? true : row.classId === classId))
      .filter((row) => (sectionId === 'ALL' ? true : row.sectionId === sectionId))
      .filter((row) => (status === 'ALL' ? true : row.status === status))
      .filter((row) => {
        if (quickFilter === 'ACTIVE') return row.status === StudentStatus.ACTIVE;
        if (quickFilter === 'PRESENT_TODAY') return row.todayAttendance === AttendanceStatus.PRESENT;
        if (quickFilter === 'ABSENT_TODAY') return row.todayAttendance === AttendanceStatus.ABSENT;
        if (quickFilter === 'NO_RFID') return !row.hasActiveRfid;
        if (quickFilter === 'SCIENCE') return row.groupId === 'grp-sci';
        if (quickFilter === 'HUMANITIES') return row.groupId === 'grp-hum';
        if (quickFilter === 'COMMERCE') return row.groupId === 'grp-com';
        return true;
      })
      .filter((row) => {
        if (!q) return true;
        return (
          row.nameBn.toLowerCase().includes(q) ||
          row.nameEn.toLowerCase().includes(q) ||
          row.studentId.toLowerCase().includes(q) ||
          String(row.roll).includes(q) ||
          row.guardianPhone.toLowerCase().includes(q) ||
          row.guardianName.toLowerCase().includes(q) ||
          (row.bloodGroup && BLOOD_LABEL[row.bloodGroup]?.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.classLabel.localeCompare(b.classLabel) || a.sectionLabel.localeCompare(b.sectionLabel) || a.roll - b.roll);
  }, [enrolled, classId, sectionId, status, quickFilter, searchQuery]);

  const initials = (name?: string | null) => {
    if (!name) return 'ST';
    const p = name.trim().split(/\s+/);
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-5">
      {/* 4 Bento KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-gradient-to-br from-surface to-surface-muted/50 border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {pick('মোট শিক্ষার্থী', 'Total Students')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {formatNumber(totalEnrolled, locale)}
            </span>
            <span className="text-xs text-muted-foreground">
              {pick('জন', 'students')}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            <span>{pick(`${formatNumber(activeCount, locale)} জন সক্রিয়`, `${formatNumber(activeCount, locale)} active`)}</span>
            <span>·</span>
            <span className="font-medium text-foreground">{yearObj?.name}</span>
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-surface to-surface-muted/50 border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {pick('ছাত্র-ছাত্রী অনুপাত', 'Gender Ratio')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-secondary flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between text-xs font-medium">
            <span className="text-primary font-semibold font-semibold">
              {pick('ছাত্র', 'Boys')}: {formatNumber(boysCount, locale)} ({formatNumber(boysPercent, locale)}%)
            </span>
            <span className="text-secondary font-semibold font-semibold">
              {pick('ছাত্রী', 'Girls')}: {formatNumber(girlsCount, locale)} ({formatNumber(girlsPercent, locale)}%)
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-surface-muted overflow-hidden flex">
            <div
              style={{ width: `${boysPercent}%` }}
              className="bg-primary h-full transition-all duration-300"
              title={`ছাত্র: ${boysPercent}%`}
            />
            <div
              style={{ width: `${girlsPercent}%` }}
              className="bg-secondary h-full transition-all duration-300"
              title={`ছাত্রী: ${girlsPercent}%`}
            />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-surface to-surface-muted/50 border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {pick('আজকের উপস্থিতি', 'Today’s Attendance')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {formatNumber(todayAttendanceRate, locale)}%
            </span>
            <span className="text-xs text-muted-foreground">
              {pick('হাজিরা হার', 'attendance rate')}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="text-primary font-medium font-medium">
              {formatNumber(presentTodayCount, locale)} {pick('উপস্থিত', 'present')}
            </span>
            {' · '}
            <span className="text-secondary font-semibold font-medium">
              {formatNumber(absentTodayCount, locale)} {pick('অনুপস্থিত', 'absent')}
            </span>
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-surface to-surface-muted/50 border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {pick('ডিজিটাল পরিচয়পত্র', 'RFID Coverage')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {formatNumber(rfidActiveCount, locale)}
            </span>
            <span className="text-xs text-muted-foreground">
              / {formatNumber(totalEnrolled, locale)} {pick('ইস্যুকৃত', 'issued')}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-surface-muted overflow-hidden">
            <div
              style={{ width: `${rfidPercent}%` }}
              className="bg-secondary h-full rounded-full transition-all duration-300"
            />
          </div>
        </Card>
      </div>

      {/* Filter and Omnisearch Card */}
      <Card className="p-4 space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={pick('শিক্ষার্থীর নাম, রোল, আইডি, অভিভাবকের ফোন দিয়ে খুঁজুন...', 'Search by student name, roll, ID, phone...')}
              className="pl-9 pr-8 h-10 w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={pick('মুছুন', 'Clear')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value);
                setSectionId('ALL');
              }}
              className="w-36 h-10 text-sm"
            >
              <option value="ALL">{pick('সকল শ্রেণি', 'All classes')}</option>
              {db.classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {locale === 'bn' ? item.nameBn || item.name : item.name}
                </option>
              ))}
            </Select>

            <Select
              value={sectionId}
              onChange={(event) => setSectionId(event.target.value)}
              className="w-32 h-10 text-sm"
            >
              <option value="ALL">{pick('সকল শাখা', 'All sections')}</option>
              {db.sections
                .filter((item) => classId === 'ALL' || item.classId === classId)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </Select>

            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-36 h-10 text-sm"
            >
              <option value="ALL">{pick('সকল অবস্থা', 'All statuses')}</option>
              <option value={StudentStatus.ACTIVE}>{pick('সক্রিয়', 'Active')}</option>
              <option value={StudentStatus.INACTIVE}>{pick('নিষ্ক্রিয়', 'Inactive')}</option>
              <option value={StudentStatus.TRANSFERRED}>{pick('স্থানান্তরিত', 'Transferred')}</option>
              <option value={StudentStatus.GRADUATED}>{pick('উত্তীর্ণ', 'Graduated')}</option>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-border p-0.5 bg-surface-muted/40 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1 font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-surface text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
                title={pick('তালিকা ভিউ', 'Table view')}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1 font-medium transition-colors ${
                  viewMode === 'grid' ? 'bg-surface text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
                title={pick('কার্ড ভিউ', 'Card grid view')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/60 text-xs">
          <span className="text-muted-foreground mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> {pick('ফিল্টার:', 'Quick:')}
          </span>
          {[
            { id: 'ALL', label: pick('সকল', 'All') },
            { id: 'ACTIVE', label: pick('সক্রিয়', 'Active') },
            { id: 'PRESENT_TODAY', label: pick('আজ উপস্থিত', 'Present today') },
            { id: 'ABSENT_TODAY', label: pick('আজ অনুপস্থিত', 'Absent today') },
            { id: 'NO_RFID', label: pick('কার্ডবিহীন', 'No RFID') },
            { id: 'SCIENCE', label: pick('বিজ্ঞান', 'Science') },
            { id: 'HUMANITIES', label: pick('মানবিক', 'Humanities') },
            { id: 'COMMERCE', label: pick('ব্যবসায় শিক্ষা', 'Commerce') },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setQuickFilter(chip.id as typeof quickFilter)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                quickFilter === chip.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-surface-muted hover:bg-surface-muted/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              {chip.label}
            </button>
          ))}
          {(searchQuery || classId !== 'ALL' || sectionId !== 'ALL' || status !== 'ALL' || quickFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setClassId('ALL');
                setSectionId('ALL');
                setStatus('ALL');
                setQuickFilter('ALL');
              }}
              className="ml-auto text-xs text-primary hover:underline font-medium"
            >
              {pick('ফিল্টার রিসেট', 'Reset filters')}
            </button>
          )}
        </div>
      </Card>

      {/* Rows Count and Quick Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          {pick(
            `মোট ${formatNumber(rows.length, locale)} জন শিক্ষার্থী প্রদর্শিত হচ্ছে`,
            `Showing ${formatNumber(rows.length, locale)} students`
          )}
        </span>
        <span className="text-[11px]">
          {pick('শিক্ষার্থীর নামের বা চোখের আইকনে চাপলে পূর্ণাঙ্গ প্রোফাইল খুলবে', 'Click name or eye icon to view 360° profile')}
        </span>
      </div>

      {/* Main Content: Table or Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rows.map((row) => (
            <Card key={row.id} className="p-4 hover:shadow-md transition-shadow duration-150 flex flex-col justify-between border-border">
              <div>
                {/* Card Top: ID and Status */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => copyText(row.studentId, 'Student ID')}
                    className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-surface-muted text-muted-foreground hover:text-foreground hover:bg-surface-muted/80 transition-colors"
                    title={pick('কপি করুন', 'Copy ID')}
                  >
                    {copiedId === row.studentId ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                    <span>{row.studentId}</span>
                  </button>
                  <StatusBadge enumName="StudentStatus" value={row.status} />
                </div>

                {/* Identity: Avatar + Names + Roll */}
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                    row.gender === Gender.FEMALE
                      ? 'bg-secondary/10 text-foreground border-border'
                      : 'bg-primary/10 text-foreground border-border'
                  }`}>
                    {initials(row.nameEn)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/students/${row.id}`} className="font-semibold text-foreground hover:text-primary transition-colors block truncate">
                      {row.nameBn}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">{row.nameEn}</p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        #{formatNumber(row.roll, locale)}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {row.classLabel} ({row.sectionLabel})
                      </span>
                      {row.groupLabel !== '—' && (
                        <span className="text-[11px] px-1.5 py-0.2 rounded bg-surface-muted text-muted-foreground">
                          {row.groupLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Guardian & Details */}
                <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{row.guardianName}</span>
                    {row.guardianPhone !== '—' && (
                      <a
                        href={`tel:${row.guardianPhone}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-mono"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{row.guardianPhone}</span>
                      </a>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {row.bloodGroup && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary/10 text-foreground">
                          {BLOOD_LABEL[row.bloodGroup] || row.bloodGroup}
                        </span>
                      )}
                      {row.hasActiveRfid && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary">
                          RFID
                        </span>
                      )}
                    </div>
                    {row.todayAttendance && (
                      <StatusBadge enumName="AttendanceStatus" value={row.todayAttendance} />
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="mt-3 pt-2">
                <Link href={`/admin/students/${row.id}`} className="block">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{pick('সম্পূর্ণ ফাইল দেখুন', 'View Full File')}</span>
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <DataTable
          data={rows}
          exportFilename="students.csv"
          columns={[
            {
              accessorKey: 'studentId',
              header: pick('আইডি', 'ID'),
              cell: ({ row }) => (
                <button
                  type="button"
                  onClick={() => copyText(row.original.studentId, 'Student ID')}
                  className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-surface-muted text-muted-foreground hover:text-foreground hover:bg-surface-muted/80 transition-colors"
                  title={pick('কপি করুন', 'Copy ID')}
                >
                  {copiedId === row.original.studentId ? (
                    <Check className="w-3 h-3 text-success" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{row.original.studentId}</span>
                </button>
              ),
            },
            {
              accessorKey: 'nameBn',
              header: pick('শিক্ষার্থী', 'Student'),
              cell: ({ row }) => (
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${
                    row.original.gender === Gender.FEMALE
                      ? 'bg-secondary/10 text-foreground border-border'
                      : 'bg-primary/10 text-foreground border-border'
                  }`}>
                    {initials(row.original.nameEn)}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/students/${row.original.id}`}
                      className="font-semibold text-primary hover:underline block truncate"
                    >
                      {row.original.nameBn}
                    </Link>
                    <span className="block text-xs font-normal text-muted-foreground truncate">
                      {row.original.nameEn}
                    </span>
                  </div>
                </div>
              ),
            },
            {
              accessorKey: 'classLabel',
              header: pick('শ্রেণি ও শাখা', 'Class & Section'),
              cell: ({ row }) => (
                <div>
                  <span className="font-medium text-foreground">{row.original.classLabel}</span>
                  <span className="text-xs text-muted-foreground ml-1">({row.original.sectionLabel})</span>
                  {row.original.groupLabel !== '—' && (
                    <span className="block text-[11px] text-muted-foreground">{row.original.groupLabel}</span>
                  )}
                </div>
              ),
            },
            {
              accessorKey: 'roll',
              header: pick('রোল', 'Roll'),
              cell: ({ row }) => (
                <span className="inline-flex items-center justify-center font-semibold text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary tabular-nums">
                  #{formatNumber(row.original.roll, locale)}
                </span>
              ),
            },
            {
              accessorKey: 'guardian',
              header: pick('অভিভাবক ও যোগাযোগ', 'Guardian & Contact'),
              cell: ({ row }) => (
                <div className="text-xs space-y-0.5">
                  <p className="font-medium text-foreground">{row.original.guardianName}</p>
                  {row.original.guardianPhone !== '—' ? (
                    <a
                      href={`tel:${row.original.guardianPhone}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-mono"
                    >
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span>{row.original.guardianPhone}</span>
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              ),
            },
            {
              accessorKey: 'bloodGroup',
              header: pick('রক্ত', 'Blood'),
              cell: ({ row }) =>
                row.original.bloodGroup ? (
                  <span className="inline-block px-1.5 py-0.5 rounded text-xs font-bold bg-secondary/10 text-foreground">
                    {BLOOD_LABEL[row.original.bloodGroup] || row.original.bloodGroup}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                ),
            },
            {
              id: 'todayAttendance',
              header: pick('আজকের হাজিরা', 'Today'),
              cell: ({ row }) =>
                row.original.todayAttendance ? (
                  <StatusBadge enumName="AttendanceStatus" value={row.original.todayAttendance} />
                ) : (
                  <span className="text-xs text-muted-foreground">{pick('ধরা হয়নি', 'Unmarked')}</span>
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
              id: 'view',
              header: '',
              cell: ({ row }) => (
                <Link
                  href={`/admin/students/${row.original.id}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary hover:bg-primary/10 transition-colors"
                  aria-label={pick('পুরো ফাইল', 'Full file')}
                  title={pick('সম্পূর্ণ ফাইল দেখুন', 'View Full File')}
                >
                  <Eye className="w-4 h-4" />
                </Link>
              ),
            },
          ]}
          renderMobileCard={(row) => (
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <Link href={`/admin/students/${row.id}`} className="font-semibold text-primary">
                  {row.nameBn}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {row.studentId} · {row.classLabel} ({row.sectionLabel}) · {pick('রোল', 'Roll')} #{row.roll}
                </p>
                {row.guardianPhone !== '—' && (
                  <p className="text-xs text-muted-foreground font-mono">{row.guardianPhone}</p>
                )}
              </div>
              <Link
                href={`/admin/students/${row.id}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary hover:bg-primary/10"
                aria-label={pick('পুরো ফাইল', 'Full file')}
              >
                <Eye className="w-4 h-4" />
              </Link>
            </div>
          )}
        />
      )}
    </div>
  );
}