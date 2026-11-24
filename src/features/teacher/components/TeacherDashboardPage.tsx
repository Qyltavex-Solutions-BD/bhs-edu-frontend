'use client';

import { useGetPublicNoticesQuery } from '@/src/features/notices/api/notices.api';
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

export function TeacherDashboardPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { data: noticePage } = useGetPublicNoticesQuery({ limit: 20 });
  const teacher = useCurrentTeacher(db);
  const { locale, pick } = useI18n();

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
        title={pick(`স্বাগতম, ${teacher.name}`, `Welcome, ${teacher.name}`)}
        description={pick(
          `${teacher.designation} · কর্মচারী আইডি: ${teacher.employeeId ?? '—'}`,
          `${teacher.designation} · Employee ID: ${teacher.employeeId ?? '—'}`
        )}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/teacher/attendance">
              <Button variant="primary" size="sm">
                <ClipboardCheck className="w-4 h-4" />
                {pick('হাজিরা নিন', 'Take Attendance')}
              </Button>
            </Link>
            <Link href="/teacher/marks-entry">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="w-4 h-4" />
                {pick('নম্বর এন্ট্রি', 'Marks Entry')}
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={pick('নির্ধারিত বিষয় ও শাখা', 'Assigned Subjects')}
          value={formatNumber(myAssignments.length, locale)}
          meta={pick(
            `${formatNumber(mySectionIds.length, locale)}টি শাখায় পাঠদান`,
            `Teaching across ${mySectionIds.length} sections`
          )}
          accent="primary"
        />
        <StatCard
          label={pick('মোট নির্ধারিত শিক্ষার্থী', 'Assigned Students')}
          value={formatNumber(myEnrollments.length, locale)}
          meta={
            classTeacherSections.length > 0
              ? pick('শ্রেণি শিক্ষক: দশম-ক', 'Class Teacher: Class 10-Ka')
              : pick('বিষয়ভিত্তিক শিক্ষক', 'Subject Teacher')
          }
        />
        <StatCard
          label={pick('সাপ্তাহিক পিরিয়ড', 'Weekly Periods')}
          value={formatNumber(myRoutines.length, locale)}
          meta={pick(
            `আজকের ক্লাস: ${formatNumber(todayRoutines.length, locale)}টি`,
            `Today's periods: ${todayRoutines.length}`
          )}
        />
        <StatCard
          label={pick('চলমান নম্বর এন্ট্রি', 'Pending Marks Entry')}
          value={formatNumber(draftExams.length, locale)}
          meta={pick('খসড়া পরীক্ষা সক্রিয়', 'Draft exams open for entry')}
          accent="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">
                {pick('আজকের ক্লাস রুটিন (রবিবার)', "Today's Schedule (Sunday)")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {pick('আপনার নির্ধারিত পিরিয়ডসমূহ', 'Your assigned periods for today')}
              </p>
            </div>
            <Link href="/teacher/routines" className="text-sm font-medium text-primary hover:underline">
              {pick('পূর্ণ রুটিন দেখুন', 'Full Routine')}
            </Link>
          </div>
          {todayRoutines.length === 0 ? (
            <EmptyState title={pick('আজ কোনো পিরিয়ড নির্ধারিত নেই', 'No periods scheduled today')} />
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
                        {locale === 'bn' ? sub?.nameBn || sub?.name : sub?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {locale === 'bn' ? cls?.nameBn || cls?.name : cls?.name} ({sec?.name}) ·{' '}
                        {pick('কক্ষ:', 'Room:')} {r.room ?? '—'}
                      </p>
                    </div>
                    <div className="text-right tabular-nums">
                      <p className="text-sm font-semibold text-primary">
                        {formatTime12h(r.startTime, locale)} – {formatTime12h(r.endTime, locale)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pick(`পিরিয়ড ${formatNumber(r.periodNumber, locale)}`, `Period ${r.periodNumber}`)}
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
            {pick('শ্রেণির গড় জিপিএ প্রবণতা', 'Assigned Class GPA Trend')}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {pick('পরীক্ষাভিত্তিক ফলাফল তুলনা', 'Average GPA across examinations')}
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
                  name={pick('গড় জিপিএ', 'Avg GPA')}
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
              {pick('শ্রেণি শিক্ষক দায়িত্ব', 'Class Teacher Overview')}
            </h2>
            <Link href="/teacher/classes" className="text-sm font-medium text-primary hover:underline">
              {pick('সকল শ্রেণি', 'All Classes')}
            </Link>
          </div>
          {classTeacherSections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {pick('কোনো শাখার শ্রেণি শিক্ষক হিসেবে নির্ধারিত নন।', 'Not assigned as a class teacher.')}
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
                        {locale === 'bn' ? cls?.nameBn || cls?.name : cls?.name} — {pick('শাখা', 'Section')} {sec.name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
                        {pick('শিক্ষার্থী:', 'Students:')} {formatNumber(secEnrollments.length, locale)} ·{' '}
                        {pick('সর্বশেষ উপস্থিতি:', 'Latest Present:')}{' '}
                        {formatNumber(presentCount, locale)}/{formatNumber(secEnrollments.length, locale)}
                      </p>
                    </div>
                    <Link href={`/teacher/classes/${sec.id}`}>
                      <Button variant="outline" size="sm">
                        {pick('বিস্তারিত', 'Details')}
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
            <h2 className="text-base font-semibold">{pick('সাম্প্রতিক নোটিশ', 'Recent Notices')}</h2>
            <Link href="/teacher/notices" className="text-sm font-medium text-primary hover:underline">
              {pick('সব নোটিশ', 'All Notices')}
            </Link>
          </div>
          <div className="divide-y divide-border">
            {(noticePage?.items ?? []).slice(0, 4).map((n) => (
              <div key={n.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{n.title}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatDateShort(n.publishedAt ?? n.createdAt, locale)}
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

