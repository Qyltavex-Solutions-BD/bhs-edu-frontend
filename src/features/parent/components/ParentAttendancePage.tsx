'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from '@/src/lib/navigation';
import { MonitorPlay, Printer, Users } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { toast } from 'sonner';
import { useGetBootstrapQuery, useMarkNotificationReadMutation } from '@/src/store/api';
import { useAppSelector } from '@/src/store/hooks';
import { useI18n } from '@/src/lib/i18n';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { CommonProfilePanel } from '@/src/components/shared/CommonProfilePanel';
import { PrintableMarksheet } from '@/src/components/print/PrintDocuments';
import { Button, Card, Select } from '@/src/components/ui/primitives';
import {
  formatDateLong,
  formatDateShort,
  formatNumber,
  formatTime12h,
} from '@/src/lib/formatters';
import { ENUM_LABELS } from '@/src/lib/constants/enums';
import { triggerPrint } from '@/src/lib/utils/cn';
import { AttendanceStatus, ResultPublicationStatus, WeekDay } from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';

const DAYS_ORDER: WeekDay[] = [
  WeekDay.SUNDAY,
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
];

function useParentChildren(db: MockDatabase | undefined) {
  const auth = useAppSelector((s) => s.auth);
  return useMemo(() => {
    if (!db) return { parent: null, children: [] };
    const parent =
      (auth.user?.parentId ? db.parents.find((p) => p.id === auth.user?.parentId) : null) ??
      db.parents[0] ??
      null;
    if (!parent) return { parent: null, children: [] };
    const links = db.parentStudents.filter((l) => l.parentId === parent.id);
    const children = links
      .map((l) => {
        const student = db.students.find((s) => s.id === l.studentId);
        const enrollment = db.enrollments.find((e) => e.studentId === l.studentId);
        const cls = db.classes.find((c) => c.id === enrollment?.classId);
        const sec = db.sections.find((s) => s.id === enrollment?.sectionId);
        const grp = db.academicGroups.find((g) => g.id === enrollment?.groupId);
        const yr = db.academicYears.find((y) => y.id === enrollment?.academicYearId);
        if (!student || !enrollment) return null;
        return { link: l, student, enrollment, cls, sec, grp, yr };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
    return { parent, children };
  }, [db, auth.user?.parentId]);
}

function ChildSwitcherBar({
  childrenList,
  selectedStudentId,
  onChange,
}: {
  childrenList: ReturnType<typeof useParentChildren>['children'];
  selectedStudentId: string;
  onChange: (id: string) => void;
}) {
  const { locale, pick } = useI18n();
  if (childrenList.length <= 1) return null;
  return (
    <Card className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-surface-muted/40">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Users className="w-4 h-4 text-primary" />
        <span>{pick('সন্তান নির্বাচন করুন:', 'Select Child:')}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {childrenList.map((c) => {
          const active = c.student.id === selectedStudentId;
          return (
            <button
              key={c.student.id}
              type="button"
              onClick={() => onChange(c.student.id)}
              className={`px-3 py-1.5 rounded-[var(--radius)] text-sm font-semibold border transition-colors cursor-pointer ${
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-surface text-foreground border-border hover:bg-surface-muted'
              }`}
            >
              {locale === 'bn' ? c.student.nameBn || c.student.nameEn : c.student.nameEn} ·{' '}
              {locale === 'bn' ? c.cls?.nameBn || c.cls?.name : c.cls?.name} ({c.sec?.name})
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export function ParentAttendancePage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { children } = useParentChildren(db);
  const { locale, pick } = useI18n();
  const [selectedId, setSelectedId] = useState('stu-10-1');

  if (isLoading || !db) return <LoadingSkeleton />;
  const active = children.find((c) => c.student.id === selectedId) ?? children[0];
  if (!active) return <EmptyState title={pick('কোনো তথ্য নেই', 'No data')} />;

  const records = db.attendances
    .filter((a) => a.studentEnrollmentId === active.enrollment.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const present = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
  const late = records.filter((r) => r.status === AttendanceStatus.LATE).length;
  const absent = records.filter((r) => r.status === AttendanceStatus.ABSENT).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('সন্তানের হাজিরা ক্যালেন্ডার', 'Child Attendance Calendar')}
        description={pick('মাসিক ক্যালেন্ডার হিট-ভিউ ও দৈনিক RFID/ম্যানুয়াল লগ', 'Monthly calendar heat view and daily attendance log')}
      />

      <ChildSwitcherBar
        childrenList={children}
        selectedStudentId={active.student.id}
        onChange={setSelectedId}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={pick('উপস্থিত', 'Present')}
          value={formatNumber(present, locale)}
          accent="success"
        />
        <StatCard
          label={pick('বিলম্বে উপস্থিত', 'Late')}
          value={formatNumber(late, locale)}
          accent="warning"
        />
        <StatCard
          label={pick('অনুপস্থিত', 'Absent')}
          value={formatNumber(absent, locale)}
          accent="destructive"
        />
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold mb-1">
          {pick('নভেম্বর ২০২৬ — মাসিক হাজিরা গ্রিড', 'November 2026 — Monthly Attendance Grid')}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {pick('P = উপস্থিত, L = বিলম্ব, A = অনুপস্থিত, LV = অনুমোদিত ছুটি', 'P = Present, L = Late, A = Absent, LV = Leave')}
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2.5 tabular-nums">
          {records
            .slice()
            .reverse()
            .map((r) => {
              const code =
                r.status === AttendanceStatus.PRESENT
                  ? 'P'
                  : r.status === AttendanceStatus.LATE
                    ? 'L'
                    : r.status === AttendanceStatus.ABSENT
                      ? 'A'
                      : 'LV';
              const tone =
                r.status === AttendanceStatus.PRESENT
                  ? 'border-success/40 bg-success/10 text-success'
                  : r.status === AttendanceStatus.LATE
                    ? 'border-warning/40 bg-warning/10 text-warning'
                    : r.status === AttendanceStatus.ABSENT
                      ? 'border-destructive/40 bg-destructive/10 text-destructive'
                      : 'border-info/40 bg-info/10 text-info';
              return (
                <div key={r.id} className={`p-3 rounded-[var(--radius)] border ${tone}`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{r.date.slice(8)} Nov</span>
                    <span>{code}</span>
                  </div>
                  <p className="text-xs mt-1 opacity-85">
                    {r.method} {r.inTime ? `· ${r.inTime.slice(0, 5)}` : ''}
                  </p>
                </div>
              );
            })}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted/70 text-sm text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">{pick('তারিখ', 'Date')}</th>
                <th className="px-4 py-3 text-left">{pick('অবস্থা', 'Status')}</th>
                <th className="px-4 py-3 text-left">{pick('পদ্ধতি', 'Method')}</th>
                <th className="px-4 py-3 text-left">{pick('প্রবেশ / প্রস্থান', 'Check-in / Out')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2.5 font-medium">{formatDateLong(r.date, locale)}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge enumName="AttendanceStatus" value={r.status} />
                  </td>
                  <td className="px-4 py-2.5 text-sm">{r.method}</td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">
                    {r.inTime ? formatTime12h(r.inTime, locale) : '—'} /{' '}
                    {r.outTime ? formatTime12h(r.outTime, locale) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

