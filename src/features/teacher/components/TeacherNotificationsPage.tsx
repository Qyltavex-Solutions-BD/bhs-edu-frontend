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

export function TeacherNotificationsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <LoadingSkeleton />;

  const items = db.notifications.filter((n) => n.targetRoles.includes('TEACHER'));

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('নোটিফিকেশন', 'Notifications')}
        description={pick('পরীক্ষা, হাজিরা ও প্রশাসনিক বার্তা', 'Exam, attendance, and administrative alerts')}
        actions={
          <Button variant="outline" size="sm" onClick={() => markRead({})}>
            {pick('সব পঠিত করুন', 'Mark All Read')}
          </Button>
        }
      />
      <div className="space-y-3">
        {items.map((n) => (
          <Card key={n.id} className={`p-4 ${!n.isRead ? 'border-primary/40 bg-primary/5' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold">{locale === 'bn' ? n.titleBn : n.titleEn}</p>
                <p className="text-sm text-muted-foreground mt-1">{locale === 'bn' ? n.bodyBn : n.bodyEn}</p>
                <p className="text-xs text-muted-foreground mt-2 tabular-nums">
                  {formatDateLong(n.createdAt, locale)}
                </p>
              </div>
              {!n.isRead && (
                <Button variant="ghost" size="sm" onClick={() => markRead({ id: n.id })}>
                  {pick('পঠিত', 'Mark Read')}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

