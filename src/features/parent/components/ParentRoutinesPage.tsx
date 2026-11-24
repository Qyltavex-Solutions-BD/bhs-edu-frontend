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

export function ParentRoutinesPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { children } = useParentChildren(db);
  const { locale, pick } = useI18n();
  const [selectedId, setSelectedId] = useState('stu-10-1');

  if (isLoading || !db) return <LoadingSkeleton />;
  const active = children.find((c) => c.student.id === selectedId) ?? children[0];
  if (!active) return <EmptyState title={pick('কোনো তথ্য নেই', 'No data')} />;

  const routines = db.classRoutines.filter((r) => r.sectionId === active.enrollment.sectionId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('ক্লাস রুটিন', 'Class Routine')}
        description={`${locale === 'bn' ? active.cls?.nameBn || active.cls?.name : active.cls?.name} (${active.sec?.name})`}
      />
      <ChildSwitcherBar
        childrenList={children}
        selectedStudentId={active.student.id}
        onChange={setSelectedId}
      />
      <div className="space-y-4">
        {DAYS_ORDER.map((day) => {
          const dayItems = routines
            .filter((r) => r.day === day)
            .sort((a, b) => a.periodNumber - b.periodNumber);
          const dayMeta = ENUM_LABELS.WeekDay?.[day];
          return (
            <Card key={day} className="p-4">
              <h3 className="text-base font-bold text-primary mb-3">
                {locale === 'bn' ? dayMeta?.bn ?? day : dayMeta?.en ?? day}
              </h3>
              {dayItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">{pick('তালিকাভুক্ত ক্লাস নেই', 'No classes listed')}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dayItems.map((r) => {
                    const ta = db.teacherAssignments.find((a) => a.id === r.teacherAssignmentId);
                    const cs = db.classSubjects.find((x) => x.id === ta?.classSubjectId);
                    const sub = db.subjects.find((s) => s.id === cs?.subjectId);
                    const staff = db.staff.find((t) => t.id === r.staffId);
                    return (
                      <div key={r.id} className="p-3 rounded-[var(--radius)] border border-border bg-surface-muted/40">
                        <p className="text-xs font-semibold text-primary tabular-nums">
                          {formatTime12h(r.startTime, locale)} – {formatTime12h(r.endTime, locale)}
                        </p>
                        <p className="text-base font-semibold mt-1">
                          {locale === 'bn' ? sub?.nameBn || sub?.name : sub?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {staff?.name ?? '—'} · {pick('কক্ষ:', 'Room:')} {r.room ?? '—'}
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

