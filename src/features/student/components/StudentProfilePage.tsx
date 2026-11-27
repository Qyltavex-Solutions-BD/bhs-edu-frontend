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

export function StudentProfilePage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const me = useCurrentStudent(db);
  if (isLoading || !db || !me) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader title={'আমার প্রোফাইল'} />
      <Card className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
        <div>
          <p className="text-sm text-muted-foreground">{'নাম (বাংলা)'}</p>
          <p className="font-semibold mt-0.5">{me.student.nameBn ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{'নাম (ইংরেজি)'}</p>
          <p className="font-semibold mt-0.5">{me.student.nameEn}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{'শিক্ষার্থী আইডি'}</p>
          <p className="font-mono mt-0.5">{me.student.studentId}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{'জন্ম তারিখ'}</p>
          <p className="tabular-nums mt-0.5">{formatDateLong(me.student.dateOfBirth, 'bn')}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{'রক্তের গ্রুপ'}</p>
          <p className="mt-0.5">{me.student.bloodGroup ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{'ঠিকানা'}</p>
          <p className="mt-0.5">{me.student.presentAddress ?? me.student.permanentAddress ?? '—'}</p>
        </div>
      </Card>

      <CommonProfilePanel
        roleLabel={'শিক্ষার্থী (Student)'}
        extraMeta={`ID: ${me.student.studentId}`}
      />
    </div>
  );
}

