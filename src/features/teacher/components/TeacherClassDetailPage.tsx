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

export function TeacherClassDetailPage() {
  const { id } = useParams();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const teacher = useCurrentTeacher(db);
  const { locale, pick } = useI18n();

  if (isLoading || !db || !teacher) return <LoadingSkeleton />;
  const sec = db.sections.find((s) => s.id === id);
  if (!sec) {
    return <EmptyState title={pick('শাখা পাওয়া যায়নি', 'Section not found')} />;
  }
  const cls = db.classes.find((c) => c.id === sec.classId);
  const enrollments = db.enrollments
    .filter((e) => e.sectionId === sec.id)
    .sort((a, b) => a.roll - b.roll);
  const publishedExam = db.exams.find(
    (e) => e.classId === sec.classId && e.resultStatus === ResultPublicationStatus.PUBLISHED
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${locale === 'bn' ? cls?.nameBn || cls?.name : cls?.name} — ${pick('শাখা', 'Section')} ${sec.name}`}
        description={pick(
          'শিক্ষার্থী তালিকা, অভিভাবক যোগাযোগ ও প্রকাশিত পরীক্ষার মেধাক্রম',
          'Section roster, parent contacts, and published exam standing'
        )}
        actions={
          <Link href="/teacher/classes">
            <Button variant="outline" size="sm">
              {pick('সব শ্রেণি', 'Back to Classes')}
            </Button>
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted/70 text-sm text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">{pick('রোল', 'Roll')}</th>
                <th className="px-4 py-3 text-left">{pick('শিক্ষার্থী', 'Student')}</th>
                <th className="px-4 py-3 text-left">{pick('অভিভাবক ও ফোন', 'Parent Contact')}</th>
                <th className="px-4 py-3 text-right">{pick('সর্বশেষ জিপিএ', 'Latest GPA')}</th>
                <th className="px-4 py-3 text-right">{pick('মেধা স্থান', 'Merit')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {enrollments.map((enr) => {
                const stu = db.students.find((s) => s.id === enr.studentId);
                const parentLink = db.parentStudents.find((l) => l.studentId === enr.studentId && l.isPrimary);
                const parent = db.parents.find((p) => p.id === parentLink?.parentId);
                const summary = publishedExam
                  ? db.resultSummaries.find(
                      (r) => r.examId === publishedExam.id && r.studentEnrollmentId === enr.id
                    )
                  : null;
                return (
                  <tr key={enr.id}>
                    <td className="px-4 py-3 font-semibold">{formatNumber(enr.roll, locale)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{locale === 'bn' ? stu?.nameBn || stu?.nameEn : stu?.nameEn}</p>
                      <p className="text-xs text-muted-foreground font-mono">{stu?.studentId}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <p className="font-medium">{parent?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{parent?.phone ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">
                      {summary?.gpa !== null && summary?.gpa !== undefined
                        ? formatNumber(summary.gpa, locale, 2)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {summary?.meritPosition ? `#${formatNumber(summary.meritPosition, locale)}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

