'use client';

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

export function StudentNotificationsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [markRead] = useMarkNotificationReadMutation();
  if (isLoading || !db) return <LoadingSkeleton />;
  const items = db.notifications.filter((n) => n.targetRoles.includes('STUDENT'));
  return (
    <div className="space-y-6">
      <PageHeader
        title={'নোটিফিকেশন'}
        actions={
          <Button variant="outline" size="sm" onClick={() => markRead({})}>
            {'সব পঠিত করুন'}
          </Button>
        }
      />
      <div className="space-y-3">
        {items.map((n) => (
          <Card key={n.id} className="p-4">
            <p className="text-base font-semibold">{n.titleBn}</p>
            <p className="text-sm text-muted-foreground mt-1">{n.bodyBn}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

