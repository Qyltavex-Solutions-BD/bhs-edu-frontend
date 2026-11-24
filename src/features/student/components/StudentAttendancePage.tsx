'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from '@/src/lib/navigation';
import { Printer } from 'lucide-react';
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

export function StudentAttendancePage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const me = useCurrentStudent(db);
  const { locale, pick } = useI18n();
  if (isLoading || !db || !me || !me.enrollment) return <LoadingSkeleton />;

  const records = db.attendances
    .filter((a) => a.studentEnrollmentId === me.enrollment!.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <PageHeader title={pick('আমার হাজিরা', 'My Attendance')} />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted/70 text-sm text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left">{pick('তারিখ', 'Date')}</th>
              <th className="px-4 py-3 text-left">{pick('অবস্থা', 'Status')}</th>
              <th className="px-4 py-3 text-left">{pick('পদ্ধতি', 'Method')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border tabular-nums">
            {records.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5">{formatDateLong(r.date, locale)}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge enumName="AttendanceStatus" value={r.status} />
                </td>
                <td className="px-4 py-2.5 text-sm">{r.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

