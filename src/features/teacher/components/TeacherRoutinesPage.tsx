'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from '@/src/lib/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileSpreadsheet,
  Lock,
  MonitorPlay,
  Printer,
  Save,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { toast } from 'sonner';
import { CommonProfilePanel } from '@/src/components/shared/CommonProfilePanel';
import {
  useGetBootstrapQuery,
  useMarkNotificationReadMutation,
  useSaveAttendanceBatchMutation,
  useSaveMarksBatchMutation,
} from '@/src/store/api';
import { useAppSelector } from '@/src/store/hooks';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { PrintableMarksheet } from '@/src/components/print/PrintDocuments';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import {
  formatDateLong,
  formatDateShort,
  formatNumber,
  formatTime12h,
  evaluateExamSubjectMark,
} from '@/src/lib/formatters';
import { ENUM_LABELS } from '@/src/lib/constants/enums';
import { triggerPrint } from '@/src/lib/utils/cn';
import {
  AttendanceMethod,
  AttendanceStatus,
  ResultPublicationStatus,
  WeekDay,
} from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';

const DAYS_ORDER: WeekDay[] = [
  WeekDay.SUNDAY,
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
];

function useCurrentTeacher(db: MockDatabase | undefined) {
  const auth = useAppSelector((s) => s.auth);
  return useMemo(() => {
    if (!db) return null;
    const byId = auth.user?.staffId ? db.staff.find((s) => s.id === auth.user?.staffId) : null;
    return byId ?? db.staff.find((s) => s.id === 'staff-3') ?? db.staff[0] ?? null;
  }, [db, auth.user?.staffId]);
}

function getAssignmentSubject(db: MockDatabase, classSubjectId: string) {
  const cs = db.classSubjects.find((x) => x.id === classSubjectId);
  return cs ? db.subjects.find((s) => s.id === cs.subjectId) : undefined;
}

export function TeacherRoutinesPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const teacher = useCurrentTeacher(db);
  if (isLoading || !db || !teacher) return <LoadingSkeleton />;
  const myRoutines = db.classRoutines.filter((r) => r.staffId === teacher.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={'আমার সাপ্তাহিক ক্লাস রুটিন'}
        description={'রবিবার থেকে বৃহস্পতিবার নির্ধারিত পিরিয়ড'}
      />
      <div className="space-y-4">
        {DAYS_ORDER.map((day) => {
          const dayItems = myRoutines
            .filter((r) => r.day === day)
            .sort((a, b) => a.periodNumber - b.periodNumber);
          const dayMeta = ENUM_LABELS.WeekDay?.[day];
          return (
            <Card key={day} className="p-4">
              <h3 className="text-base font-bold text-primary mb-3">
                {dayMeta?.bn ?? day}
              </h3>
              {dayItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {'কোনো ক্লাস নির্ধারিত নেই'}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dayItems.map((r) => {
                    const ta = db.teacherAssignments.find((a) => a.id === r.teacherAssignmentId);
                    const sub = ta ? getAssignmentSubject(db, ta.classSubjectId) : undefined;
                    const sec = db.sections.find((s) => s.id === r.sectionId);
                    const cls = db.classes.find((c) => c.id === sec?.classId);
                    return (
                      <div
                        key={r.id}
                        className="p-3 rounded-[var(--radius)] border border-border bg-surface-muted/40"
                      >
                        <p className="text-sm font-semibold text-primary tabular-nums">
                          {`পিরিয়ড ${formatNumber(r.periodNumber, 'bn')}`} ·{' '}
                          {formatTime12h(r.startTime, 'bn')} – {formatTime12h(r.endTime, 'bn')}
                        </p>
                        <p className="text-base font-semibold mt-1">
                          {sub?.nameBn || sub?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {cls?.nameBn || cls?.name} ({sec?.name}) · {'কক্ষ:'}{' '}
                          {r.room ?? '—'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

