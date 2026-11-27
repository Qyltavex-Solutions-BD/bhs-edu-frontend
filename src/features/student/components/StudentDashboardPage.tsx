'use client';

import { useGetPublicNoticesQuery } from '@/src/features/notices/api/notices.api';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from '@/src/lib/navigation';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { useGetBootstrapQuery, useMarkNotificationReadMutation } from '@/src/store/api';
import { useAppSelector } from '@/src/store/hooks';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { CommonProfilePanel } from '@/src/components/shared/CommonProfilePanel';
import { PrintableMarksheet } from '@/src/components/print/PrintDocuments';
import { Button, Card } from '@/src/components/ui/primitives';
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

function useCurrentStudent(db: MockDatabase | undefined) {
  const auth = useAppSelector((s) => s.auth);
  return useMemo(() => {
    if (!db) return null;
    const student =
      (auth.user?.studentId ? db.students.find((s) => s.id === auth.user?.studentId) : null) ??
      db.students[0];
    if (!student) return null;
    const enrollment = db.enrollments.find((e) => e.studentId === student.id);
    const cls = db.classes.find((c) => c.id === enrollment?.classId);
    const sec = db.sections.find((s) => s.id === enrollment?.sectionId);
    const grp = db.academicGroups.find((g) => g.id === enrollment?.groupId);
    const yr = db.academicYears.find((y) => y.id === enrollment?.academicYearId);
    return { student, enrollment, cls, sec, grp, yr };
  }, [db, auth.user?.studentId]);
}

export function StudentDashboardPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { data: noticePage } = useGetPublicNoticesQuery({ limit: 20 });
  const me = useCurrentStudent(db);
  if (isLoading || !db || !me || !me.enrollment) return <LoadingSkeleton rows={6} />;

  const att = db.attendances.filter((a) => a.studentEnrollmentId === me.enrollment!.id);
  const present = att.filter(
    (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE
  ).length;
  const attPct = att.length > 0 ? Math.round((present / att.length) * 100) : 0;

  const publishedSummaries = db.resultSummaries.filter((r) => {
    const ex = db.exams.find((e) => e.id === r.examId);
    return (
      r.studentEnrollmentId === me.enrollment!.id &&
      ex?.resultStatus === ResultPublicationStatus.PUBLISHED
    );
  });
  const latest = publishedSummaries[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`স্বাগতম, ${me.student.nameBn || me.student.nameEn}`}
        description={`${me.cls?.nameBn || me.cls?.name} (${me.sec?.name}) · ${'রোল'} ${formatNumber(me.enrollment.roll, 'bn')} · ID: ${me.student.studentId}`}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={'উপস্থিতির হার'}
          value={`${formatNumber(attPct, 'bn')}%`}
          meta={`${formatNumber(present, 'bn')}/${formatNumber(att.length, 'bn')}`}
          accent="success"
        />
        <StatCard
          label={'সর্বশেষ জিপিএ'}
          value={latest?.gpa ? formatNumber(latest.gpa, 'bn', 2) : '—'}
          meta={
            latest?.meritPosition
              ? `মেধা: #${formatNumber(latest.meritPosition, 'bn')}`
              : '—'
          }
          accent="primary"
        />
        <StatCard
          label={'শিক্ষা রিসোর্স'}
          value={formatNumber(db.digitalResources.length, 'bn')}
        />
        <StatCard
          label={'গ্রন্থাগার বই'}
          value={formatNumber(db.libraryBooks.length, 'bn')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">{'আমার ফলাফলসমূহ'}</h2>
            <Link href="/student/results" className="text-sm font-medium text-primary hover:underline">
              {'সব দেখুন'}
            </Link>
          </div>
          {publishedSummaries.map((s) => {
            const ex = db.exams.find((e) => e.id === s.examId);
            return (
              <Link
                key={s.id}
                href={`/student/results/${s.id}`}
                className="flex items-center justify-between py-2.5 border-b last:border-0 border-border hover:text-primary"
              >
                <span className="text-sm font-medium">{ex?.name}</span>
                <span className="text-sm font-bold tabular-nums">
                  GPA {s.gpa ? formatNumber(s.gpa, 'bn', 2) : '—'}
                </span>
              </Link>
            );
          })}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">{'সাম্প্রতিক নোটিশ'}</h2>
            <Link href="/student/notices" className="text-sm font-medium text-primary hover:underline">
              {'সব নোটিশ'}
            </Link>
          </div>
          {(noticePage?.items ?? []).slice(0, 4).map((n) => (
            <div key={n.id} className="py-2 border-b last:border-0 border-border">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-sm text-muted-foreground tabular-nums">
                {formatDateShort(n.publishedAt ?? n.createdAt, 'bn')}
              </p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

