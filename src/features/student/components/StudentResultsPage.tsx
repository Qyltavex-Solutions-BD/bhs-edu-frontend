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

export function StudentResultsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const me = useCurrentStudent(db);
  if (isLoading || !db || !me || !me.enrollment) return <LoadingSkeleton />;

  const summaries = db.resultSummaries.filter((r) => {
    const ex = db.exams.find((e) => e.id === r.examId);
    return (
      r.studentEnrollmentId === me.enrollment!.id &&
      ex?.resultStatus === ResultPublicationStatus.PUBLISHED
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader title={'আমার প্রকাশিত ফলাফল'} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaries.map((s) => {
          const ex = db.exams.find((e) => e.id === s.examId);
          return (
            <Card key={s.id} className="p-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold">{ex?.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 tabular-nums">
                  GPA: {s.gpa ? formatNumber(s.gpa, 'bn', 2) : '—'} · {'গ্রেড:'}{' '}
                  {s.letterGrade ?? '—'}
                </p>
              </div>
              <Link href={`/student/results/${s.id}`}>
                <Button variant="primary" size="sm">
                  {'মার্কশিট'}
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

