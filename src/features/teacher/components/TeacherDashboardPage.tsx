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

export function TeacherDashboardPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const teacher = useCurrentTeacher(db);
  if (isLoading || !db || !teacher) return <LoadingSkeleton rows={6} />;

  const myAssignments = db.teacherAssignments.filter((a) => a.staffId === teacher.id);
  const mySectionIds = Array.from(new Set(myAssignments.map((a) => a.sectionId)));
  const myClassIds = Array.from(new Set(myAssignments.map((a) => a.classId)));
  const classTeacherLinks = db.sectionClassTeachers.filter((s) => s.staffId === teacher.id);
  const classTeacherSections = db.sections.filter((sec) =>
    classTeacherLinks.some((l) => l.sectionId === sec.id)
  );
  const myEnrollments = db.enrollments.filter((e) => mySectionIds.includes(e.sectionId));
  const myRoutines = db.classRoutines.filter((r) => r.staffId === teacher.id);
  const todayRoutines = myRoutines.filter((r) => r.day === WeekDay.SUNDAY);
  const draftExams = db.exams.filter(
    (e) => myClassIds.includes(e.classId) && e.resultStatus === ResultPublicationStatus.DRAFT
  );

  const progressData = db.exams
    .filter((e) => myClassIds.includes(e.classId))
    .map((exam) => {
      const summaries = db.resultSummaries.filter((r) => r.examId === exam.id);
      const avgGpa =
        summaries.length > 0
          ? Number(
              (summaries.reduce((acc, s) => acc + (s.gpa ?? 0), 0) / summaries.length).toFixed(2)
            )
          : 0;
      return {
        name: exam.name.replace(/2026/g, '').trim().slice(0, 18),
        avgGpa,
      };
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`স্বাগতম, ${teacher.name}`}
        description={`${teacher.designation} · কর্মচারী আইডি: ${teacher.employeeId ?? '—'}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/teacher/attendance">
              <Button variant="primary" size="sm">
                <ClipboardCheck className="w-4 h-4" />
                {'হাজিরা নিন'}
              </Button>
            </Link>
            <Link href="/teacher/marks-entry">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="w-4 h-4" />
                {'নম্বর এন্ট্রি'}
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={'নির্ধারিত বিষয় ও শাখা'}
          value={formatNumber(myAssignments.length, 'bn')}
          meta={`${formatNumber(mySectionIds.length, 'bn')}টি শাখায় পাঠদান`}
          accent="primary"
        />
        <StatCard
          label={'মোট নির্ধারিত শিক্ষার্থী'}
          value={formatNumber(myEnrollments.length, 'bn')}
          meta={
            classTeacherSections.length > 0
              ? 'শ্রেণি শিক্ষক: দশম-ক'
              : 'বিষয়ভিত্তিক শিক্ষক'
          }
        />
        <StatCard
          label={'সাপ্তাহিক পিরিয়ড'}
          value={formatNumber(myRoutines.length, 'bn')}
          meta={`আজকের ক্লাস: ${formatNumber(todayRoutines.length, 'bn')}টি`}
        />
        <StatCard
          label={'চলমান নম্বর এন্ট্রি'}
          value={formatNumber(draftExams.length, 'bn')}
          meta={'খসড়া পরীক্ষা সক্রিয়'}
          accent="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">
                {'আজকের ক্লাস রুটিন (রবিবার)'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {'আপনার নির্ধারিত পিরিয়ডসমূহ'}
              </p>
            </div>
            <Link href="/teacher/routines" className="text-sm font-medium text-primary hover:underline">
              {'পূর্ণ রুটিন দেখুন'}
            </Link>
          </div>
          {todayRoutines.length === 0 ? (
            <EmptyState title={'আজ কোনো পিরিয়ড নির্ধারিত নেই'} />
          ) : (
            <div className="divide-y divide-border">
              {todayRoutines.map((r) => {
                const ta = db.teacherAssignments.find((a) => a.id === r.teacherAssignmentId);
                const sub = ta ? getAssignmentSubject(db, ta.classSubjectId) : undefined;
                const sec = db.sections.find((s) => s.id === r.sectionId);
                const cls = db.classes.find((c) => c.id === sec?.classId);
                return (
                  <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold">
                        {sub?.nameBn || sub?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {cls?.nameBn || cls?.name} ({sec?.name}) ·{' '}
                        {'কক্ষ:'} {r.room ?? '—'}
                      </p>
                    </div>
                    <div className="text-right tabular-nums">
                      <p className="text-sm font-semibold text-primary">
                        {formatTime12h(r.startTime, 'bn')} – {formatTime12h(r.endTime, 'bn')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {`পিরিয়ড ${formatNumber(r.periodNumber, 'bn')}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold mb-1">
            {'শ্রেণির গড় জিপিএ প্রবণতা'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {'পরীক্ষাভিত্তিক ফলাফল তুলনা'}
          </p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="avgGpa"
                  stroke="#0B7A34"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#124B96' }}
                  name={'গড় জিপিএ'}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">
              {'শ্রেণি শিক্ষক দায়িত্ব'}
            </h2>
            <Link href="/teacher/classes" className="text-sm font-medium text-primary hover:underline">
              {'সকল শ্রেণি'}
            </Link>
          </div>
          {classTeacherSections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {'কোনো শাখার শ্রেণি শিক্ষক হিসেবে নির্ধারিত নন।'}
            </p>
          ) : (
            <div className="space-y-3">
              {classTeacherSections.map((sec) => {
                const cls = db.classes.find((c) => c.id === sec.classId);
                const secEnrollments = db.enrollments.filter((e) => e.sectionId === sec.id);
                const latestAtt = db.attendances.filter(
                  (a) =>
                    a.date === '2026-11-19' &&
                    secEnrollments.some((e) => e.id === a.studentEnrollmentId)
                );
                const presentCount = latestAtt.filter(
                  (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE
                ).length;
                return (
                  <div
                    key={sec.id}
                    className="p-4 rounded-[var(--radius)] border border-border bg-surface-muted/40 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-base font-semibold">
                        {cls?.nameBn || cls?.name} — {'শাখা'} {sec.name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
                        {'শিক্ষার্থী:'} {formatNumber(secEnrollments.length, 'bn')} ·{' '}
                        {'সর্বশেষ উপস্থিতি:'}{' '}
                        {formatNumber(presentCount, 'bn')}/{formatNumber(secEnrollments.length, 'bn')}
                      </p>
                    </div>
                    <Link href={`/teacher/classes/${sec.id}`}>
                      <Button variant="outline" size="sm">
                        {'বিস্তারিত'}
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">{'সাম্প্রতিক নোটিশ'}</h2>
            <Link href="/teacher/notices" className="text-sm font-medium text-primary hover:underline">
              {'সব নোটিশ'}
            </Link>
          </div>
          <div className="divide-y divide-border">
            {([] as Array<{ id: string; title: string; publishedAt?: string; createdAt: string; status: string }>).map((n) => (
              <div key={n.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{n.title}</p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {formatDateShort(n.publishedAt ?? n.createdAt, 'bn')}
                  </p>
                </div>
                <StatusBadge enumName="NoticeStatus" value={n.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

