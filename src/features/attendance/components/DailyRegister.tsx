'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  RotateCcw,
  Save,
  Search,
  UserCheck,
  UserX,
} from 'lucide-react';
import { toast } from 'sonner';
import { AttendanceMethod, AttendanceStatus } from '@/src/types/enums';
import { useI18n } from '@/src/lib/i18n';
import { localToday, shiftDate } from '@/src/lib/schoolDay';
import { EmptyState } from '@/src/components/shared/Feedback';
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';
import type { SchoolClass, Section } from '@/src/types/entities';
import {
  useGetDailyAttendanceQuery,
  useSaveAttendanceBatchMutation,
} from '../api/attendance.api';
import { AttendancePagination } from './AttendancePagination';
import {
  downloadCsv,
  errorMessage,
  formatClockTime,
  getStatusLabel,
  STATUS_OPTIONS,
  ToneBadge,
} from './attendanceShared';
import { GateMonitor } from './GateMonitor';

const PAGE_SIZE = 25;

export function DailyRegister({
  yearId,
  classes,
  sections,
}: {
  yearId: string;
  classes: SchoolClass[];
  sections: Section[];
}) {
  const { locale, pick } = useI18n();
  const [workspaceTab, setWorkspaceTab] = useState<'register' | 'gate'>('register');
  const [date, setDate] = useState(() => localToday());
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'UNMARKED'
  >('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [drafts, setDrafts] = useState<Record<string, AttendanceStatus>>({});
  const [remarksDrafts, setRemarksDrafts] = useState<Record<string, string>>({});

  const availableSections = useMemo(
    () => (classId ? sections.filter((s) => s.classId === classId) : sections),
    [classId, sections]
  );

  const { data, isFetching } = useGetDailyAttendanceQuery({
    academicYearId: yearId,
    date,
    classId: classId || undefined,
    sectionId: sectionId || undefined,
    status: statusFilter,
    search: search.trim() || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const [saveBatch, { isLoading: saving }] = useSaveAttendanceBatchMutation();

  const items = data?.items ?? [];
  const stats = data?.stats ?? {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    unmarked: 0,
    rfidCount: 0,
    manualCount: 0,
  };

  const dirtyCount = Object.keys(drafts).length + Object.keys(remarksDrafts).length;

  function clearDrafts() {
    setDrafts({});
    setRemarksDrafts({});
  }

  function stepDate(delta: -1 | 1) {
    const next = shiftDate(date, delta);
    if (next <= localToday()) {
      setDate(next);
      setPage(1);
      clearDrafts();
    }
  }

  function applyVisibleStatus(status: AttendanceStatus) {
    const next = { ...drafts };
    for (const item of items) {
      next[item.studentEnrollmentId] = status;
    }
    setDrafts(next);
  }

  async function saveChanges() {
    const enrollmentIds = new Set([
      ...Object.keys(drafts),
      ...Object.keys(remarksDrafts),
    ]);
    if (enrollmentIds.size === 0) return;

    const itemMap = new Map(items.map((i) => [i.studentEnrollmentId, i]));
    const entries = Array.from(enrollmentIds)
      .map((enrollmentId) => {
        const existing = itemMap.get(enrollmentId);
        const status = drafts[enrollmentId] ?? existing?.attendance?.status;
        if (!status) return null;
        return {
          studentEnrollmentId: enrollmentId,
          status,
          method: AttendanceMethod.MANUAL,
          remarks:
            remarksDrafts[enrollmentId] !== undefined
              ? remarksDrafts[enrollmentId]
              : (existing?.attendance?.remarks ?? undefined),
        };
      })
      .filter((e): e is NonNullable<typeof e> => Boolean(e));

    if (entries.length === 0) return;

    try {
      const res = await saveBatch({
        date,
        academicYearId: yearId,
        entries,
      }).unwrap();
      toast.success(
        pick(
          `${res.saved} জনের হাজিরা সংরক্ষিত এবং ${res.smsQueued}টি SMS পাঠানো হয়েছে`,
          `Saved ${res.saved} records, ${res.smsQueued} SMS queued`
        )
      );
      clearDrafts();
    } catch (err) {
      toast.error(errorMessage(err, pick('হাজিরা সংরক্ষণ ব্যর্থ হয়েছে', 'Save failed')));
    }
  }

  function exportCsv() {
    downloadCsv(
      `daily-attendance-${date}-page-${page}.csv`,
      [
        pick('রোল', 'Roll'),
        pick('শিক্ষার্থী', 'Student'),
        pick('শ্রেণি', 'Class'),
        pick('অবস্থা', 'Status'),
        pick('পদ্ধতি', 'Method'),
        pick('প্রবেশ', 'In Time'),
        pick('প্রস্থান', 'Out Time'),
      ],
      items.map((row) => [
        row.roll,
        row.nameBn || row.nameEn,
        `${row.className} (${row.sectionName})`,
        getStatusLabel(drafts[row.studentEnrollmentId] ?? row.attendance?.status, locale),
        row.attendance?.method ?? '—',
        formatClockTime(row.attendance?.inTime),
        formatClockTime(row.attendance?.outTime),
      ])
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setWorkspaceTab('register')}
            className={`rounded-lg px-4 py-2 text-base font-semibold transition ${
              workspaceTab === 'register'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {pick('শ্রেণিভিত্তিক দৈনিক হাজিরা', 'Class Daily Register')}
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceTab('gate')}
            className={`rounded-lg px-4 py-2 text-base font-semibold transition ${
              workspaceTab === 'gate'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {pick('লাইভ গেট ফিড ও বাকি তালিকা', 'Live Gate & Pending List')}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={() => stepDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={date}
              max={localToday()}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
                clearDrafts();
              }}
              className="w-auto pl-9"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={date >= localToday()}
            onClick={() => stepDate(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {data?.isClosedDay && (
        <div className="flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-base text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {pick(
              `বন্ধের দিন (${data.closedReason ?? 'ছুটি'}) — তবুও জরুরি প্রয়োজনে হাজিরা সংশোধন করা যাবে।`,
              `Closed day (${data.closedReason ?? 'Holiday'}) — overrides remain available if needed.`
            )}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">{pick('মোট শিক্ষার্থী', 'Total')}</div>
          <div className="mt-1 text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{pick('উপস্থিত', 'Present')}</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <div className="mt-1 text-2xl font-bold text-success">{stats.present}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{pick('দেরি', 'Late')}</span>
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <div className="mt-1 text-2xl font-bold text-warning">{stats.late}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{pick('অনুপস্থিত', 'Absent')}</span>
            <UserX className="h-4 w-4 text-destructive" />
          </div>
          <div className="mt-1 text-2xl font-bold text-destructive">{stats.absent}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">
            {pick('অচিহ্নিত / ছুটি', 'Unmarked / Leave')}
          </div>
          <div className="mt-1 text-2xl font-bold">
            {stats.unmarked} <span className="text-sm font-normal text-info">/ {stats.leave}</span>
          </div>
        </Card>
      </div>

      {workspaceTab === 'gate' ? (
        <GateMonitor yearId={yearId} date={date} classes={classes} sections={sections} />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {pick('দৈনিক হাজিরা রেজিস্টার', 'Daily Attendance Register')}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {isFetching
                  ? pick('লোড হচ্ছে...', 'Loading...')
                  : pick(
                      `RFID: ${stats.rfidCount} · ম্যানুয়াল: ${stats.manualCount}`,
                      `RFID: ${stats.rfidCount} · Manual: ${stats.manualCount}`
                    )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyVisibleStatus(AttendanceStatus.PRESENT)}
                disabled={items.length === 0}
              >
                <UserCheck className="h-4 w-4 text-success" />
                {pick('সবাইকে উপস্থিত', 'All Present')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyVisibleStatus(AttendanceStatus.ABSENT)}
                disabled={items.length === 0}
              >
                <UserX className="h-4 w-4 text-destructive" />
                {pick('সবাইকে অনুপস্থিত', 'All Absent')}
              </Button>
              {dirtyCount > 0 && (
                <>
                  <Button size="sm" variant="outline" onClick={clearDrafts}>
                    <RotateCcw className="h-4 w-4" />
                    {pick('রিসেট', 'Reset')}
                  </Button>
                  <Button size="sm" disabled={saving} onClick={saveChanges}>
                    <Save className="h-4 w-4" />
                    {saving
                      ? pick('সংরক্ষণ হচ্ছে...', 'Saving...')
                      : pick(`সংরক্ষণ করুন (${dirtyCount})`, `Save Changes (${dirtyCount})`)}
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={exportCsv}
                disabled={items.length === 0}
              >
                <Download className="h-4 w-4" />
                {pick('CSV', 'CSV')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 border-b border-border/70 px-5 py-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={pick('নাম, রোল, আইডি বা RFID...', 'Search name, roll, ID, RFID...')}
                className="pl-9"
              />
            </div>
            <Select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSectionId('');
                setPage(1);
                clearDrafts();
              }}
            >
              <option value="">{pick('সব শ্রেণি', 'All Classes')}</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.nameBn || cls.name}
                </option>
              ))}
            </Select>
            <Select
              value={sectionId}
              onChange={(e) => {
                setSectionId(e.target.value);
                setPage(1);
                clearDrafts();
              }}
            >
              <option value="">{pick('সব শাখা', 'All Sections')}</option>
              {availableSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                setPage(1);
              }}
            >
              <option value="ALL">{pick('সব অবস্থা', 'All Statuses')}</option>
              <option value="PRESENT">{pick('উপস্থিত', 'Present')}</option>
              <option value="LATE">{pick('দেরি', 'Late')}</option>
              <option value="ABSENT">{pick('অনুপস্থিত', 'Absent')}</option>
              <option value="LEAVE">{pick('ছুটি', 'Leave')}</option>
              <option value="UNMARKED">{pick('অচিহ্নিত', 'Unmarked')}</option>
            </Select>
          </div>

          {items.length === 0 ? (
            <EmptyState
              title={pick('কোনো শিক্ষার্থী পাওয়া যায়নি', 'No students found')}
              description={pick(
                'ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।',
                'Try adjusting your search or class/section filters.'
              )}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                <thead className="border-b border-border/70 bg-muted/40 text-sm font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{pick('রোল', 'Roll')}</th>
                    <th className="px-4 py-3">{pick('শিক্ষার্থী', 'Student')}</th>
                    <th className="px-4 py-3">{pick('শ্রেণি ও শাখা', 'Class & Section')}</th>
                    <th className="px-4 py-3">{pick('পদ্ধতি ও সময়', 'Method & Time')}</th>
                    <th className="px-4 py-3">{pick('অবস্থা', 'Status')}</th>
                    <th className="px-4 py-3">{pick('মন্তব্য', 'Remarks')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {items.map((row) => {
                    const activeStatus =
                      drafts[row.studentEnrollmentId] ?? row.attendance?.status;
                    const activeRemarks =
                      remarksDrafts[row.studentEnrollmentId] ??
                      row.attendance?.remarks ??
                      '';
                    return (
                      <tr key={row.studentEnrollmentId} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono font-semibold">{row.roll}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">
                            {row.nameBn || row.nameEn}
                          </div>
                          <div className="font-mono text-sm text-muted-foreground">
                            {row.studentCode}
                            {row.rfidCardNumber ? ` · ${row.rfidCardNumber}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {row.className} ({row.sectionName})
                        </td>
                        <td className="px-4 py-3">
                          {row.attendance ? (
                            <div className="space-y-0.5 text-sm">
                              <ToneBadge
                                tone={
                                  row.attendance.method === AttendanceMethod.RFID
                                    ? 'primary'
                                    : 'neutral'
                                }
                              >
                                {row.attendance.method}
                              </ToneBadge>
                              <div className="text-muted-foreground">
                                {formatClockTime(row.attendance.inTime)}
                                {row.attendance.outTime
                                  ? ` → ${formatClockTime(row.attendance.outTime)}`
                                  : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {pick('অচিহ্নিত', 'Unmarked')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {STATUS_OPTIONS.map((opt) => {
                              const selected = activeStatus === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() =>
                                    setDrafts((prev) => ({
                                      ...prev,
                                      [row.studentEnrollmentId]: opt.value,
                                    }))
                                  }
                                  className={`rounded-md border px-2.5 py-1 text-sm font-semibold transition ${
                                    selected
                                      ? opt.on
                                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  {locale === 'bn' ? opt.shortBn : opt.shortEn}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={activeRemarks}
                            onChange={(e) =>
                              setRemarksDrafts((prev) => ({
                                ...prev,
                                [row.studentEnrollmentId]: e.target.value,
                              }))
                            }
                            placeholder={pick('মন্তব্য...', 'Remarks...')}
                            className="h-8 min-w-32 text-sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <AttendancePagination meta={data?.meta} onPageChange={setPage} />
        </Card>
      )}
    </div>
  );
}
