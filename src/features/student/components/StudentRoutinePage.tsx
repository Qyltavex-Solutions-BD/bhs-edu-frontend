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

export function StudentRoutinePage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const me = useCurrentStudent(db);
  const { locale, pick } = useI18n();
  if (isLoading || !db || !me || !me.enrollment) return <LoadingSkeleton />;

  const routines = db.classRoutines.filter((r) => r.sectionId === me.enrollment!.sectionId);
  return (
    <div className="space-y-6">
      <PageHeader title={pick('আমার ক্লাস রুটিন', 'My Class Routine')} />
      <div className="space-y-4">
        {DAYS_ORDER.map((day) => {
          const items = routines
            .filter((r) => r.day === day)
            .sort((a, b) => a.periodNumber - b.periodNumber);
          const dayMeta = ENUM_LABELS.WeekDay?.[day];
          return (
            <Card key={day} className="p-4">
              <h3 className="text-base font-bold text-primary mb-2">
                {locale === 'bn' ? dayMeta?.bn ?? day : dayMeta?.en ?? day}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {items.map((r) => {
                  const ta = db.teacherAssignments.find((a) => a.id === r.teacherAssignmentId);
                  const cs = db.classSubjects.find((x) => x.id === ta?.classSubjectId);
                  const sub = db.subjects.find((s) => s.id === cs?.subjectId);
                  return (
                    <div key={r.id} className="p-3 rounded border border-border bg-surface-muted/40">
                      <p className="text-xs font-semibold text-primary tabular-nums">
                        {formatTime12h(r.startTime, locale)} – {formatTime12h(r.endTime, locale)}
                      </p>
                      <p className="text-base font-semibold mt-1">
                        {locale === 'bn' ? sub?.nameBn || sub?.name : sub?.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

