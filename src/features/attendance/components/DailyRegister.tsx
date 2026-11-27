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
        `${res.saved} জনের হাজিরা সংরক্ষিত এবং ${res.smsQueued}টি SMS পাঠানো হয়েছে`
      );
      clearDrafts();
    } catch (err) {
      toast.error(errorMessage(err, 'হাজিরা সংরক্ষণ ব্যর্থ হয়েছে'));
    }
  }

  function exportCsv() {
    downloadCsv(
      `daily-attendance-${date}-page-${page}.csv`,
      [
        'রোল',
        'শিক্ষার্থী',
        'শ্রেণি',
        'অবস্থা',
        'পদ্ধতি',
        'প্রবেশ',
        'প্রস্থান',
      ],
      items.map((row) => [
        row.roll,
        row.nameBn || row.nameEn,
        `${row.className} (${row.sectionName})`,
        getStatusLabel(drafts[row.studentEnrollmentId] ?? row.attendance?.status, 'bn'),
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
            {'শ্রেণিভিত্তিক দৈনিক হাজিরা'}
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
            {'লাইভ গেট ফিড ও বাকি তালিকা'}
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
            {`বন্ধের দিন (${data.closedReason ?? 'ছুটি'}) — তবুও জরুরি প্রয়োজনে হাজিরা সংশোধন করা যাবে।`}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">{'মোট শিক্ষার্থী'}</div>
          <div className="mt-1 text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{'উপস্থিত'}</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <div className="mt-1 text-2xl font-bold text-success">{stats.present}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{'দেরি'}</span>
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <div className="mt-1 text-2xl font-bold text-warning">{stats.late}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{'অনুপস্থিত'}</span>
            <UserX className="h-4 w-4 text-destructive" />
          </div>
          <div className="mt-1 text-2xl font-bold text-destructive">{stats.absent}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">
            {'অচিহ্নিত / ছুটি'}
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
                {'দৈনিক হাজিরা রেজিস্টার'}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {isFetching
                  ? 'লোড হচ্ছে...'
                  : `RFID: ${stats.rfidCount} · ম্যানুয়াল: ${stats.manualCount}`}
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
                {'সবাইকে উপস্থিত'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyVisibleStatus(AttendanceStatus.ABSENT)}
                disabled={items.length === 0}
              >
                <UserX className="h-4 w-4 text-destructive" />
                {'সবাইকে অনুপস্থিত'}
              </Button>
              {dirtyCount > 0 && (
                <>
                  <Button size="sm" variant="outline" onClick={clearDrafts}>
                    <RotateCcw className="h-4 w-4" />
                    {'রিসেট'}
                  </Button>
                  <Button size="sm" disabled={saving} onClick={saveChanges}>
                    <Save className="h-4 w-4" />
                    {saving
                      ? 'সংরক্ষণ হচ্ছে...'
                      : `সংরক্ষণ করুন (${dirtyCount})`}
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
                {'CSV'}
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
                placeholder={'নাম, রোল, আইডি বা RFID...'}
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
              <option value="">{'সব শ্রেণি'}</option>
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
              <option value="">{'সব শাখা'}</option>
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
              <option value="ALL">{'সব অবস্থা'}</option>
              <option value="PRESENT">{'উপস্থিত'}</option>
              <option value="LATE">{'দেরি'}</option>
              <option value="ABSENT">{'অনুপস্থিত'}</option>
              <option value="LEAVE">{'ছুটি'}</option>
              <option value="UNMARKED">{'অচিহ্নিত'}</option>
            </Select>
          </div>

          {items.length === 0 ? (
            <EmptyState
              title={'কোনো শিক্ষার্থী পাওয়া যায়নি'}
              description={'ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                <thead className="border-b border-border/70 bg-muted/40 text-sm font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{'রোল'}</th>
                    <th className="px-4 py-3">{'শিক্ষার্থী'}</th>
                    <th className="px-4 py-3">{'শ্রেণি ও শাখা'}</th>
                    <th className="px-4 py-3">{'পদ্ধতি ও সময়'}</th>
                    <th className="px-4 py-3">{'অবস্থা'}</th>
                    <th className="px-4 py-3">{'মন্তব্য'}</th>
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
                              {'অচিহ্নিত'}
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
                                  {opt.shortBn}
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
                            placeholder={'মন্তব্য...'}
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
