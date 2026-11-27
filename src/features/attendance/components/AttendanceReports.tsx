'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Download,
  Printer,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import { EmptyState } from '@/src/components/shared/Feedback';
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';
import type { SchoolClass, Section } from '@/src/types/entities';
import { useGetAttendanceReportsQuery } from '../api/attendance.api';
import { AttendancePagination } from './AttendancePagination';
import {
  attendanceBarTone,
  attendanceRateTone,
  downloadCsv,
  ToneBadge,
} from './attendanceShared';

const PAGE_SIZE = 20;

export function AttendanceReports({
  yearId,
  classes,
  sections,
}: {
  yearId: string;
  classes: SchoolClass[];
  sections: Section[];
}) {
  const [view, setView] = useState<'section' | 'summary'>('section');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [onlyAtRisk, setOnlyAtRisk] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const availableSections = useMemo(
    () => (classId ? sections.filter((s) => s.classId === classId) : sections),
    [classId, sections]
  );

  const { data, isFetching } = useGetAttendanceReportsQuery({
    academicYearId: yearId,
    month,
    view,
    classId: classId || undefined,
    sectionId: sectionId || undefined,
    onlyAtRisk,
    search: search.trim() || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const sectionData = data?.view === 'section' ? data : null;
  const summaryData = data?.view === 'summary' ? data : null;

  function exportCsv() {
    if (view === 'section' && sectionData) {
      downloadCsv(
        `attendance-report-${month}-page-${page}.csv`,
        [
          'রোল',
          'শিক্ষার্থী',
          'শ্রেণি',
          'উপস্থিত',
          'দেরি',
          'অনুপস্থিত',
          'ছুটি',
          'হার (%)',
        ],
        sectionData.items.map((r) => [
          r.roll,
          r.nameBn || r.nameEn,
          `${r.className} (${r.sectionName})`,
          r.presentDays,
          r.lateDays,
          r.absentDays,
          r.leaveDays,
          r.rate ?? '—',
        ])
      );
    } else if (summaryData) {
      downloadCsv(
        `attendance-summary-${month}.csv`,
        [
          'শ্রেণি',
          'মোট শিক্ষার্থী',
          'উপস্থিত',
          'দেরি',
          'অনুপস্থিত',
          'ছুটি',
          'হার (%)',
        ],
        summaryData.summaryRows.map((r) => [
          r.className,
          r.totalStudents,
          r.presentCount,
          r.lateCount,
          r.absentCount,
          r.leaveCount,
          r.rate ?? '—',
        ])
      );
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => {
              setView('section');
              setPage(1);
            }}
            className={`rounded-lg px-4 py-2 text-base font-semibold transition ${
              view === 'section'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {'শিক্ষার্থীভিত্তিক রিপোর্ট'}
          </button>
          <button
            type="button"
            onClick={() => setView('summary')}
            className={`rounded-lg px-4 py-2 text-base font-semibold transition ${
              view === 'summary'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {'শ্রেণিভিত্তিক সারসংক্ষেপ'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="তথ্য লিখুন"
            type="month"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setPage(1);
            }}
            className="w-auto"
          />
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            {'প্রিন্ট'}
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            {'CSV এক্সপোর্ট'}
          </Button>
        </div>
      </div>

      {view === 'section' && sectionData && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{'কার্যদিবস'}</span>
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-1 text-2xl font-bold">{sectionData.summary.workingDays}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{'গড় উপস্থিতি'}</span>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div className="mt-1 text-2xl font-bold">
                {sectionData.summary.avgRate !== null ? `${sectionData.summary.avgRate}%` : '—'}
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{'মোট শিক্ষার্থী'}</span>
                <Users className="h-4 w-4 text-info" />
              </div>
              <div className="mt-1 text-2xl font-bold">{sectionData.summary.totalStudents}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{'ঝুঁকিপূর্ণ (<৭৫%)'}</span>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div className="mt-1 text-2xl font-bold text-destructive">
                {sectionData.summary.atRiskCount}
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-border/70 px-5 py-4">
              <h3 className="text-lg font-semibold text-foreground">
                {'মাসিক উপস্থিতি পরিসংখ্যান'}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {isFetching
                  ? 'লোড হচ্ছে...'
                  : 'ব্যাকএন্ড ফিল্টার ও প্যাজিনেশন সক্রিয়'}
              </p>
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
                  placeholder={'নাম, রোল বা আইডি...'}
                  className="pl-9"
                />
              </div>
              <Select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setSectionId('');
                  setPage(1);
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
                }}
              >
                <option value="">{'সব শাখা'}</option>
                {availableSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </Select>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-base">
                <input
                  type="checkbox"
                  checked={onlyAtRisk}
                  onChange={(e) => {
                    setOnlyAtRisk(e.target.checked);
                    setPage(1);
                  }}
                  className="h-4 w-4 accent-destructive"
                />
                <span>{'শুধু <৭৫% ঝুঁকিপূর্ণ'}</span>
              </label>
            </div>

            {sectionData.items.length === 0 ? (
              <EmptyState
                title={'কোনো রিপোর্ট তথ্য নেই'}
                description={'নির্বাচিত মাস বা ফিল্টারে কোনো তথ্য পাওয়া যায়নি।'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-base">
                  <thead className="border-b border-border/70 bg-muted/40 text-sm font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">{'রোল'}</th>
                      <th className="px-4 py-3">{'শিক্ষার্থী'}</th>
                      <th className="px-4 py-3">{'শ্রেণি ও শাখা'}</th>
                      <th className="px-4 py-3">{'উপস্থিত'}</th>
                      <th className="px-4 py-3">{'দেরি'}</th>
                      <th className="px-4 py-3">{'অনুপস্থিত'}</th>
                      <th className="px-4 py-3">{'ছুটি'}</th>
                      <th className="px-4 py-3">{'উপস্থিতির হার'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {sectionData.items.map((row) => (
                      <tr key={row.studentEnrollmentId} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono font-semibold">{row.roll}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">
                            {row.nameBn || row.nameEn}
                          </div>
                          <div className="font-mono text-sm text-muted-foreground">
                            {row.studentCode}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {row.className} ({row.sectionName})
                        </td>
                        <td className="px-4 py-3 font-semibold text-success">{row.presentDays}</td>
                        <td className="px-4 py-3 font-semibold text-warning">{row.lateDays}</td>
                        <td className="px-4 py-3 font-semibold text-destructive">
                          {row.absentDays}
                        </td>
                        <td className="px-4 py-3 font-semibold text-info">{row.leaveDays}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${attendanceRateTone(row.rate)}`}>
                              {row.rate !== null ? `${row.rate}%` : '—'}
                            </span>
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full ${attendanceBarTone(row.rate)}`}
                                style={{ width: `${row.rate ?? 0}%` }}
                              />
                            </div>
                            {row.rate !== null && row.rate < 75 && (
                              <ToneBadge tone="danger">{'ঝুঁকি'}</ToneBadge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <AttendancePagination meta={sectionData.meta} onPageChange={setPage} />
          </Card>
        </>
      )}

      {view === 'summary' && summaryData && (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {'শ্রেণিভিত্তিক মাসিক সারসংক্ষেপ'}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{month}</p>
            </div>
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead className="border-b border-border/70 bg-muted/40 text-sm font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{'শ্রেণি'}</th>
                  <th className="px-4 py-3">{'মোট শিক্ষার্থী'}</th>
                  <th className="px-4 py-3">{'উপস্থিত'}</th>
                  <th className="px-4 py-3">{'দেরি'}</th>
                  <th className="px-4 py-3">{'অনুপস্থিত'}</th>
                  <th className="px-4 py-3">{'ছুটি'}</th>
                  <th className="px-4 py-3">{'উপস্থিতির হার'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {summaryData.summaryRows.map((row) => (
                  <tr key={row.classId} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-semibold text-foreground">{row.className}</td>
                    <td className="px-4 py-3">{row.totalStudents}</td>
                    <td className="px-4 py-3 font-semibold text-success">{row.presentCount}</td>
                    <td className="px-4 py-3 font-semibold text-warning">{row.lateCount}</td>
                    <td className="px-4 py-3 font-semibold text-destructive">{row.absentCount}</td>
                    <td className="px-4 py-3 font-semibold text-info">{row.leaveCount}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${attendanceRateTone(row.rate)}`}>
                        {row.rate !== null ? `${row.rate}%` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
