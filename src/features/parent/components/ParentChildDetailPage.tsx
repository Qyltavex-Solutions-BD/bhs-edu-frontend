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

export function ParentChildDetailPage() {
  const { id } = useParams();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { children } = useParentChildren(db);
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <LoadingSkeleton />;

  const child = children.find((c) => c.student.id === id) ?? children[0];
  if (!child) return <EmptyState title={pick('শিক্ষার্থী পাওয়া যায়নি', 'Child not found')} />;

  const rfid = db.rfidCards.find((r) => r.studentId === child.student.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={locale === 'bn' ? child.student.nameBn || child.student.nameEn : child.student.nameEn}
        description={`${locale === 'bn' ? child.cls?.nameBn || child.cls?.name : child.cls?.name} (${child.sec?.name}) · ID: ${child.student.studentId}`}
        actions={
          <Link href="/parent/children">
            <Button variant="outline" size="sm">
              {pick('সকল সন্তান', 'All Children')}
            </Button>
          </Link>
        }
      />
      <Card className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-base">
        <div>
          <p className="text-sm text-muted-foreground">{pick('রোল নম্বর', 'Roll Number')}</p>
          <p className="font-semibold tabular-nums mt-0.5">
            {formatNumber(child.enrollment.roll, locale)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{pick('জন্ম তারিখ', 'Date of Birth')}</p>
          <p className="tabular-nums mt-0.5">{formatDateLong(child.student.dateOfBirth, locale)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{pick('রক্তের গ্রুপ', 'Blood Group')}</p>
          <p className="font-semibold mt-0.5">{child.student.bloodGroup ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{pick('RFID কার্ড নম্বর', 'RFID Card Number')}</p>
          <p className="font-mono mt-0.5">{rfid?.cardNumber ?? pick('ইস্যু করা হয়নি', 'Not Issued')}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{pick('শিক্ষাবর্ষ', 'Academic Session')}</p>
          <p className="tabular-nums mt-0.5">{formatNumber(child.yr?.name ?? '2026', locale)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{pick('বর্তমান ঠিকানা', 'Address')}</p>
          <p className="mt-0.5">{child.student.presentAddress ?? child.student.permanentAddress ?? '—'}</p>
        </div>
      </Card>
    </div>
  );
}

