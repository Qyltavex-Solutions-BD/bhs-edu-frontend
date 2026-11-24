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

export function TeacherResourcesPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('ডিজিটাল শিক্ষা রিসোর্স', 'Academic & Digital Resources')}
        description={pick('শ্রেণিভিত্তিক লেকচার শিট, পাঠ্যবই ও মাল্টিমিডিয়া কনটেন্ট', 'Class-wise learning materials and digital slides')}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {db.digitalResources.map((r) => {
          const cls = db.classes.find((c) => c.id === r.classId);
          return (
            <Card key={r.id} className="p-5 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-2">
                  <span className="inline-flex items-center gap-1 font-medium text-primary">
                    <MonitorPlay className="w-3.5 h-3.5" />
                    {r.resourceType}
                  </span>
                  <span>{locale === 'bn' ? cls?.nameBn || cls?.name : cls?.name}</span>
                </div>
                <h3 className="text-base font-bold">{r.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info(pick('রিসোর্স প্রিভিউ প্রস্তুত', 'Resource preview ready'))}
              >
                {pick('রিসোর্স খুলুন', 'Open Material')}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

