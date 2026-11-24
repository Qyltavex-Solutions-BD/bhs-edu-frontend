'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from '@/src/lib/navigation';
import { MonitorPlay, Printer, Users } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
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
import { Button, Card, Select } from '@/src/components/ui/primitives';
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

function useParentChildren(db: MockDatabase | undefined) {
  const auth = useAppSelector((s) => s.auth);
  return useMemo(() => {
    if (!db) return { parent: null, children: [] };
    const parent =
      (auth.user?.parentId ? db.parents.find((p) => p.id === auth.user?.parentId) : null) ??
      db.parents[0] ??
      null;
    if (!parent) return { parent: null, children: [] };
    const links = db.parentStudents.filter((l) => l.parentId === parent.id);
    const children = links
      .map((l) => {
        const student = db.students.find((s) => s.id === l.studentId);
        const enrollment = db.enrollments.find((e) => e.studentId === l.studentId);
        const cls = db.classes.find((c) => c.id === enrollment?.classId);
        const sec = db.sections.find((s) => s.id === enrollment?.sectionId);
        const grp = db.academicGroups.find((g) => g.id === enrollment?.groupId);
        const yr = db.academicYears.find((y) => y.id === enrollment?.academicYearId);
        if (!student || !enrollment) return null;
        return { link: l, student, enrollment, cls, sec, grp, yr };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
    return { parent, children };
  }, [db, auth.user?.parentId]);
}

function ChildSwitcherBar({
  childrenList,
  selectedStudentId,
  onChange,
}: {
  childrenList: ReturnType<typeof useParentChildren>['children'];
  selectedStudentId: string;
  onChange: (id: string) => void;
}) {
  const { locale, pick } = useI18n();
  if (childrenList.length <= 1) return null;
  return (
    <Card className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-surface-muted/40">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Users className="w-4 h-4 text-primary" />
        <span>{pick('সন্তান নির্বাচন করুন:', 'Select Child:')}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {childrenList.map((c) => {
          const active = c.student.id === selectedStudentId;
          return (
            <button
              key={c.student.id}
              type="button"
              onClick={() => onChange(c.student.id)}
              className={`px-3 py-1.5 rounded-[var(--radius)] text-sm font-semibold border transition-colors cursor-pointer ${
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-surface text-foreground border-border hover:bg-surface-muted'
              }`}
            >
              {locale === 'bn' ? c.student.nameBn || c.student.nameEn : c.student.nameEn} ·{' '}
              {locale === 'bn' ? c.cls?.nameBn || c.cls?.name : c.cls?.name} ({c.sec?.name})
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export function ParentChildrenPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { children } = useParentChildren(db);
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('আমার সন্তানসমূহ', 'My Children')}
        description={pick('অধ্যয়নরত সন্তানদের একাডেমিক প্রোফাইল', 'Academic profiles of your enrolled children')}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {children.map((c) => {
          const attCfg = db.classAttendanceConfigs.find((x) => x.classId === c.enrollment.classId);
          return (
            <Card key={c.student.id} className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-primary">
                    {locale === 'bn' ? c.student.nameBn || c.student.nameEn : c.student.nameEn}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {c.student.nameEn} · ID: <span className="font-mono">{c.student.studentId}</span>
                  </p>
                </div>
                <StatusBadge enumName="StudentStatus" value={c.student.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm bg-surface-muted/40 p-3 rounded-[var(--radius)] tabular-nums">
                <div>
                  <span className="text-muted-foreground">{pick('শ্রেণি ও শাখা:', 'Class & Section:')}</span>
                  <p className="font-semibold mt-0.5">
                    {locale === 'bn' ? c.cls?.nameBn || c.cls?.name : c.cls?.name} ({c.sec?.name})
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{pick('রোল নম্বর:', 'Roll Number:')}</span>
                  <p className="font-semibold mt-0.5">{formatNumber(c.enrollment.roll, locale)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{pick('বিভাগ:', 'Group:')}</span>
                  <p className="font-semibold mt-0.5">
                    {c.grp ? (locale === 'bn' ? c.grp.nameBn || c.grp.name : c.grp.name) : pick('সাধারণ', 'General')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{pick('হাজিরা পদ্ধতি:', 'Attendance Mode:')}</span>
                  <p className="font-semibold mt-0.5">{attCfg?.method ?? 'MANUAL'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/parent/children/${c.student.id}`}>
                  <Button variant="primary" size="sm">
                    {pick('বিস্তারিত প্রোফাইল', 'View Details')}
                  </Button>
                </Link>
                <Link href="/parent/attendance">
                  <Button variant="outline" size="sm">
                    {pick('হাজিরা', 'Attendance')}
                  </Button>
                </Link>
                <Link href="/parent/results">
                  <Button variant="outline" size="sm">
                    {pick('ফলাফল', 'Results')}
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

