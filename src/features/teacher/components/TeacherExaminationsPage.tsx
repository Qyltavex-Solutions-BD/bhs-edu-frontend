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
import { useI18n } from '@/src/lib/i18n';
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

export function TeacherExaminationsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const teacher = useCurrentTeacher(db);
  const { locale, pick } = useI18n();

  if (isLoading || !db || !teacher) return <LoadingSkeleton />;
  const myClassIds = Array.from(
    new Set(db.teacherAssignments.filter((a) => a.staffId === teacher.id).map((a) => a.classId))
  );
  const myExams = db.exams.filter((e) => myClassIds.includes(e.classId));

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('পরীক্ষা ও সময়সূচি', 'Examinations & Schedules')}
        description={pick('আপনার নির্ধারিত শ্রেণিসমূহের পরীক্ষাসমূহ', 'Examinations for your assigned classes')}
        actions={
          <Link href="/teacher/marks-entry">
            <Button variant="primary" size="sm">
              <FileSpreadsheet className="w-4 h-4" />
              {pick('নম্বর এন্ট্রি করুন', 'Go to Marks Entry')}
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {myExams.map((ex) => {
          const cls = db.classes.find((c) => c.id === ex.classId);
          return (
            <Card key={ex.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold">{ex.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'bn' ? cls?.nameBn || cls?.name : cls?.name} ·{' '}
                    {formatDateShort(ex.startDate, locale)} – {formatDateShort(ex.endDate, locale)}
                  </p>
                </div>
                <StatusBadge enumName="ResultPublicationStatus" value={ex.resultStatus} />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border">
                <span>
                  {ex.isLocked
                    ? pick('নম্বর লক করা আছে', 'Marks Locked')
                    : pick('নম্বর এন্ট্রি উন্মুক্ত', 'Marks Entry Open')}
                </span>
                <Link href="/teacher/marks-entry" className="text-primary font-semibold hover:underline">
                  {pick('নম্বর দেখুন / এন্ট্রি করুন', 'Open Marks Sheet')}
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

