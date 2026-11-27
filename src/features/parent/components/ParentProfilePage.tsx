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
  if (childrenList.length <= 1) return null;
  return (
    <Card className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-surface-muted/40">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Users className="w-4 h-4 text-primary" />
        <span>{'সন্তান নির্বাচন করুন:'}</span>
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
              {c.student.nameBn || c.student.nameEn} ·{' '}
              {c.cls?.nameBn || c.cls?.name} ({c.sec?.name})
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export function ParentProfilePage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { parent, children } = useParentChildren(db);
  if (isLoading || !db || !parent) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={'অভিভাবক প্রোফাইল'}
        description={'নিবন্ধিত যোগাযোগ ও সংযুক্ত সন্তানদের তথ্য'}
      />
      <Card className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
        <div>
          <p className="text-sm text-muted-foreground">{'অভিভাবকের নাম'}</p>
          <p className="font-semibold mt-0.5">{parent.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{'মোবাইল নম্বর (SMS)'}</p>
          <p className="font-mono mt-0.5">{parent.phone}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{'ইমেইল'}</p>
          <p className="mt-0.5">{parent.email ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{'পেশা'}</p>
          <p className="mt-0.5">{parent.occupation ?? '—'}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-sm text-muted-foreground">{'ঠিকানা'}</p>
          <p className="mt-0.5">{parent.address ?? '—'}</p>
        </div>
      </Card>

      <CommonProfilePanel
        roleLabel={'নিবন্ধিত অভিভাবক (Parent / Guardian)'}
        extraMeta={parent.phone}
      />

      <Card className="p-5">
        <h2 className="text-base font-semibold mb-3">
          {'সংযুক্ত শিক্ষার্থীসমূহ'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {children.map((c) => (
            <Link
              key={c.student.id}
              href={`/parent/children/${c.student.id}`}
              className="p-4 rounded-[var(--radius)] border border-border hover:border-primary/50 transition-colors"
            >
              <p className="text-base font-semibold">
                {c.student.nameBn || c.student.nameEn}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
                {c.cls?.nameBn || c.cls?.name} ({c.sec?.name}) ·{' '}
                {'রোল:'} {formatNumber(c.enrollment.roll, 'bn')} · ID:{' '}
                {c.student.studentId}
              </p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

