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

export function StudentAcademicInfoPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const me = useCurrentStudent(db);
  if (isLoading || !db || !me || !me.enrollment) return <LoadingSkeleton />;

  const subjects = db.classSubjects
    .filter((cs) => cs.classId === me.enrollment!.classId)
    .map((cs) => db.subjects.find((s) => s.id === cs.subjectId))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader title={'একাডেমিক তথ্য'} />
      <Card className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-base tabular-nums">
        <div>
          <p className="text-sm text-muted-foreground">{'শ্রেণি'}</p>
          <p className="font-bold mt-0.5">{me.cls?.nameBn || me.cls?.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{'শাখা'}</p>
          <p className="font-bold mt-0.5">{me.sec?.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{'রোল নম্বর'}</p>
          <p className="font-bold mt-0.5">{formatNumber(me.enrollment.roll, 'bn')}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{'বিভাগ'}</p>
          <p className="font-bold mt-0.5">
            {me.grp ? (me.grp.nameBn || me.grp.name) : 'সাধারণ'}
          </p>
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="text-base font-semibold mb-3">{'পাঠ্য বিষয়সমূহ'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((sub) => (
            <div key={sub!.id} className="p-3 rounded-[var(--radius)] border border-border text-sm">
              <p className="text-base font-semibold">{sub!.nameBn || sub!.name}</p>
              <p className="text-sm text-muted-foreground font-mono mt-0.5">{sub!.officialCode ?? '—'}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

