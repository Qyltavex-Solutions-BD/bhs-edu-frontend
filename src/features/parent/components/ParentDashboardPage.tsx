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

export function ParentDashboardPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { parent, children } = useParentChildren(db);
  const { locale, pick } = useI18n();
  const [selectedId, setSelectedId] = useState<string>('stu-10-1');

  if (isLoading || !db || !parent) return <LoadingSkeleton rows={6} />;

  const active = children.find((c) => c.student.id === selectedId) ?? children[0];
  if (!active) {
    return <EmptyState title={pick('কোনো সন্তান সংযুক্ত নেই', 'No linked children found')} />;
  }

  const att = db.attendances.filter((a) => a.studentEnrollmentId === active.enrollment.id);
  const presentCount = att.filter(
    (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE
  ).length;
  const attPct = att.length > 0 ? Math.round((presentCount / att.length) * 100) : 0;

  const publishedSummaries = db.resultSummaries.filter((r) => {
    const ex = db.exams.find((e) => e.id === r.examId);
    return (
      r.studentEnrollmentId === active.enrollment.id &&
      ex?.resultStatus === ResultPublicationStatus.PUBLISHED
    );
  });
  const latestResult = publishedSummaries[0];

  const mySms = db.attendanceSmsLogs.filter(
    (s) => s.parentId === parent.id || s.phone === parent.phone
  );
  const upcomingExams = db.exams.filter((e) => e.classId === active.enrollment.classId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick(`অভিভাবক ড্যাশবোর্ড — ${parent.name}`, `Parent Dashboard — ${parent.name}`)}
        description={pick(
          'আপনার সন্তানের হাজিরা, প্রকাশিত ফলাফল, ক্লাস রুটিন ও SMS নোটিফিকেশন এক নজরে দেখুন',
          'Track attendance, published exam results, class routines, and guardian SMS alerts'
        )}
      />

      <ChildSwitcherBar
        childrenList={children}
        selectedStudentId={active.student.id}
        onChange={setSelectedId}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={pick('নির্বাচিত শিক্ষার্থী', 'Selected Student')}
          value={locale === 'bn' ? active.student.nameBn || active.student.nameEn : active.student.nameEn}
          meta={`${locale === 'bn' ? active.cls?.nameBn || active.cls?.name : active.cls?.name} (${active.sec?.name}) · ${pick('রোল', 'Roll')} ${formatNumber(active.enrollment.roll, locale)}`}
          accent="primary"
        />
        <StatCard
          label={pick('উপস্থিতির হার', 'Attendance Rate')}
          value={`${formatNumber(attPct, locale)}%`}
          meta={pick(
            `${formatNumber(presentCount, locale)}/${formatNumber(att.length, locale)} কার্যদিবস`,
            `${presentCount}/${att.length} school days`
          )}
          accent="success"
        />
        <StatCard
          label={pick('সর্বশেষ প্রকাশিত জিপিএ', 'Latest Published GPA')}
          value={
            latestResult?.gpa !== null && latestResult?.gpa !== undefined
              ? formatNumber(latestResult.gpa, locale, 2)
              : '—'
          }
          meta={
            latestResult?.meritPosition
              ? pick(
                  `মেধা স্থান: #${formatNumber(latestResult.meritPosition, locale)}`,
                  `Merit Position: #${latestResult.meritPosition}`
                )
              : pick('ফলাফল অপেক্ষমাণ', 'Pending publication')
          }
        />
        <StatCard
          label={pick('প্রাপ্ত হাজিরা SMS', 'Attendance SMS Alerts')}
          value={formatNumber(mySms.length, locale)}
          meta={parent.phone}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">
              {pick('সাম্প্রতিক হাজিরা ও SMS বার্তা', 'Recent Attendance & SMS History')}
            </h2>
            <Link href="/parent/sms-history" className="text-sm font-medium text-primary hover:underline">
              {pick('সব SMS দেখুন', 'View All SMS')}
            </Link>
          </div>
          {mySms.length === 0 ? (
            <EmptyState title={pick('কোনো SMS লগ নেই', 'No SMS alerts yet')} />
          ) : (
            <div className="divide-y divide-border">
              {mySms.slice(0, 4).map((sms) => (
                <div key={sms.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatDateLong(sms.sentAt ?? sms.createdAt, locale)}
                    </span>
                    <StatusBadge enumName="SmsStatus" value={sms.status} />
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{sms.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">
              {pick('পরীক্ষার সূচি ও ফলাফল', 'Examinations & Results')}
            </h2>
            <Link href="/parent/results" className="text-sm font-medium text-primary hover:underline">
              {pick('মার্কশিট দেখুন', 'Open Marksheets')}
            </Link>
          </div>
          <div className="divide-y divide-border">
            {upcomingExams.map((ex) => (
              <div key={ex.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">{ex.name}</p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {formatDateShort(ex.startDate, locale)} – {formatDateShort(ex.endDate, locale)}
                  </p>
                </div>
                <StatusBadge enumName="ResultPublicationStatus" value={ex.resultStatus} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

