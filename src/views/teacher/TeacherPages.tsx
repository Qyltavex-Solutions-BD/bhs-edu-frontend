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

export function TeacherDashboardPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
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
            {db.notices.slice(0, 4).map((n) => (
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

export function TeacherProfilePage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const teacher = useCurrentTeacher(db);
  const { locale, pick } = useI18n();

  if (isLoading || !db || !teacher) return <LoadingSkeleton />;
  const dept = db.departments.find((d) => d.id === teacher.departmentId);
  const myAssignments = db.teacherAssignments.filter((a) => a.staffId === teacher.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('আমার প্রোফাইল', 'My Profile')}
        description={pick('শিক্ষক পরিচিতি ও নির্ধারিত বিষয়ের বিবরণ', 'Faculty profile and teaching assignments')}
      />
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
          <div>
            <p className="text-sm text-muted-foreground">{pick('পূর্ণ নাম', 'Full Name')}</p>
            <p className="font-semibold mt-0.5">{teacher.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{pick('পদবি ও বিভাগ', 'Designation & Department')}</p>
            <p className="font-medium mt-0.5">
              {teacher.designation} · {dept?.name ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{pick('কর্মচারী আইডি', 'Employee ID')}</p>
            <p className="font-mono mt-0.5">{teacher.employeeId ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{pick('যোগদানের তারিখ', 'Joining Date')}</p>
            <p className="tabular-nums mt-0.5">{formatDateLong(teacher.joiningDate, locale)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{pick('শিক্ষাগত যোগ্যতা', 'Qualification')}</p>
            <p className="mt-0.5">{teacher.qualification ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{pick('যোগাযোগ', 'Contact')}</p>
            <p className="tabular-nums mt-0.5">
              {teacher.phone ?? '—'} · {teacher.email ?? '—'}
            </p>
          </div>
        </div>
      </Card>

      <CommonProfilePanel
        roleLabel={`${teacher.designation} · ${dept?.name ?? ''}`}
        extraMeta={`ID: ${teacher.employeeId ?? '—'}`}
      />

      <Card className="p-5">
        <h2 className="text-base font-semibold mb-3">
          {pick('নির্ধারিত বিষয় ও নম্বর এন্ট্রি অনুমতি', 'Subject Assignments & Mark Entry Rights')}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="py-2 pr-4">{pick('শ্রেণি ও শাখা', 'Class & Section')}</th>
                <th className="py-2 pr-4">{pick('বিষয়', 'Subject')}</th>
                <th className="py-2">{pick('নম্বর এন্ট্রি অনুমতি', 'Mark Entry Permission')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {myAssignments.map((a) => {
                const cls = db.classes.find((c) => c.id === a.classId);
                const sec = db.sections.find((s) => s.id === a.sectionId);
                const sub = getAssignmentSubject(db, a.classSubjectId);
                return (
                  <tr key={a.id}>
                    <td className="py-2.5 pr-4 font-medium">
                      {locale === 'bn' ? cls?.nameBn || cls?.name : cls?.name} ({sec?.name})
                    </td>
                    <td className="py-2.5 pr-4">{locale === 'bn' ? sub?.nameBn || sub?.name : sub?.name}</td>
                    <td className="py-2.5">
                      {a.canEnterMarks ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-success">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {pick('অনুমোদিত', 'Allowed')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground">
                          <Lock className="w-3.5 h-3.5" />
                          {pick('শুধুমাত্র পাঠদান (নম্বর এন্ট্রি সীমিত)', 'Teaching Only (Read-Only)')}
                        </span>
                      )}
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

export function TeacherClassesPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const teacher = useCurrentTeacher(db);
  const { locale, pick } = useI18n();

  if (isLoading || !db || !teacher) return <LoadingSkeleton />;

  const myAssignments = db.teacherAssignments.filter((a) => a.staffId === teacher.id);
  const sectionIds = Array.from(new Set(myAssignments.map((a) => a.sectionId)));

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('আমার নির্ধারিত শ্রেণিসমূহ', 'My Assigned Classes')}
        description={pick('আপনার নির্ধারিত শাখা ও বিষয়সমূহ', 'Sections and subjects scoped to your faculty assignment')}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sectionIds.map((secId) => {
          const sec = db.sections.find((s) => s.id === secId);
          const cls = db.classes.find((c) => c.id === sec?.classId);
          const secAssignments = myAssignments.filter((a) => a.sectionId === secId);
          const studentCount = db.enrollments.filter((e) => e.sectionId === secId).length;
          const isClassTeacher = db.sectionClassTeachers.some(
            (l) => l.sectionId === secId && l.staffId === teacher.id
          );

          return (
            <Card key={secId} className="p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-primary">
                      {locale === 'bn' ? cls?.nameBn || cls?.name : cls?.name} — {pick('শাখা', 'Section')} {sec?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
                      {pick('শিক্ষার্থী সংখ্যা:', 'Students:')} {formatNumber(studentCount, locale)}
                    </p>
                  </div>
                  {isClassTeacher && (
                    <span className="text-xs font-semibold text-foreground border border-accent/40 bg-accent/10 px-2 py-0.5 rounded">
                      {pick('শ্রেণি শিক্ষক', 'Class Teacher')}
                    </span>
                  )}
                </div>
                <div className="mt-4 space-y-1.5">
                  <p className="text-sm font-semibold text-muted-foreground">
                    {pick('নির্ধারিত বিষয়:', 'Assigned Subjects:')}
                  </p>
                  {secAssignments.map((a) => {
                    const sub = getAssignmentSubject(db, a.classSubjectId);
                    return (
                      <div key={a.id} className="flex items-center justify-between text-sm">
                        <span>{locale === 'bn' ? sub?.nameBn || sub?.name : sub?.name}</span>
                        <span className={a.canEnterMarks ? 'text-success font-medium' : 'text-muted-foreground'}>
                          {a.canEnterMarks
                            ? pick('নম্বর এন্ট্রি সক্রিয়', 'Can Enter Marks')
                            : pick('শুধু দেখুন', 'View Only')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <Link href={`/teacher/classes/${secId}`} className="flex-1">
                  <Button variant="primary" size="sm" className="w-full">
                    {pick('শাখা বিস্তারিত', 'Section Details')}
                  </Button>
                </Link>
                <Link href="/teacher/attendance">
                  <Button variant="outline" size="sm">
                    {pick('হাজিরা', 'Attendance')}
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

export function TeacherStudentsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const teacher = useCurrentTeacher(db);
  const { locale, pick } = useI18n();
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('ALL');

  if (isLoading || !db || !teacher) return <LoadingSkeleton />;

  const mySectionIds = Array.from(
    new Set(db.teacherAssignments.filter((a) => a.staffId === teacher.id).map((a) => a.sectionId))
  );
  const mySections = db.sections.filter((s) => mySectionIds.includes(s.id));

  const rows = db.enrollments
    .filter((e) => mySectionIds.includes(e.sectionId))
    .filter((e) => sectionFilter === 'ALL' || e.sectionId === sectionFilter)
    .map((e) => {
      const stu = db.students.find((s) => s.id === e.studentId)!;
      const cls = db.classes.find((c) => c.id === e.classId);
      const sec = db.sections.find((s) => s.id === e.sectionId);
      const pl = db.parentStudents.find((l) => l.studentId === e.studentId && l.isPrimary);
      const parent = db.parents.find((p) => p.id === pl?.parentId);
      return { enr: e, stu, cls, sec, parent };
    })
    .filter(
      (r) =>
        !search.trim() ||
        r.stu.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        (r.stu.nameBn ?? '').includes(search) ||
        r.stu.studentId.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('আমার নির্ধারিত শিক্ষার্থী', 'My Assigned Students')}
        description={pick('শুধুমাত্র আপনার পাঠদানকৃত শাখাসমূহের শিক্ষার্থী', 'Scoped to your assigned sections')}
      />
      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={pick('নাম বা শিক্ষার্থী আইডি দিয়ে খুঁজুন...', 'Search by name or student ID...')}
          className="sm:max-w-xs"
        />
        <Select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="sm:max-w-xs"
        >
          <option value="ALL">{pick('সকল নির্ধারিত শাখা', 'All Assigned Sections')}</option>
          {mySections.map((s) => {
            const cls = db.classes.find((c) => c.id === s.classId);
            return (
              <option key={s.id} value={s.id}>
                {locale === 'bn' ? cls?.nameBn || cls?.name : cls?.name} ({s.name})
              </option>
            );
          })}
        </Select>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted/70 text-sm text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">{pick('আইডি ও রোল', 'ID & Roll')}</th>
                <th className="px-4 py-3 text-left">{pick('শিক্ষার্থীর নাম', 'Student Name')}</th>
                <th className="px-4 py-3 text-left">{pick('শ্রেণি ও শাখা', 'Class & Section')}</th>
                <th className="px-4 py-3 text-left">{pick('অভিভাবক', 'Primary Guardian')}</th>
                <th className="px-4 py-3 text-left">{pick('অবস্থা', 'Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {rows.map(({ enr, stu, cls, sec, parent }) => (
                <tr key={enr.id}>
                  <td className="px-4 py-3">
                    <p className="font-mono text-sm">{stu.studentId}</p>
                    <p className="text-xs text-muted-foreground">
                      {pick('রোল:', 'Roll:')} {formatNumber(enr.roll, locale)}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {locale === 'bn' ? stu.nameBn || stu.nameEn : stu.nameEn}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {locale === 'bn' ? cls?.nameBn || cls?.name : cls?.name} ({sec?.name})
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <p>{parent?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{parent?.phone ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge enumName="StudentStatus" value={stu.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function TeacherAttendancePage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [saveBatch, { isLoading: saving }] = useSaveAttendanceBatchMutation();
  const teacher = useCurrentTeacher(db);
  const auth = useAppSelector((s) => s.auth);
  const { locale, pick } = useI18n();

  const mySectionIds = useMemo(
    () =>
      db && teacher
        ? Array.from(
            new Set(db.teacherAssignments.filter((a) => a.staffId === teacher.id).map((a) => a.sectionId))
          )
        : [],
    [db, teacher]
  );

  const [sectionId, setSectionId] = useState('sec-9-ka');
  const [date, setDate] = useState('2026-11-19');
  const [draftStatuses, setDraftStatuses] = useState<Record<string, AttendanceStatus>>({});

  if (isLoading || !db || !teacher) return <LoadingSkeleton />;

  const activeSecId = mySectionIds.includes(sectionId) ? sectionId : mySectionIds[0];
  const sec = db.sections.find((s) => s.id === activeSecId);
  const methodCfg = db.classAttendanceConfigs.find((c) => c.classId === sec?.classId);
  const isRfidPrimary = methodCfg?.method === AttendanceMethod.RFID;

  const enrollments = db.enrollments
    .filter((e) => e.sectionId === activeSecId)
    .sort((a, b) => a.roll - b.roll);

  const getStatus = (enrollmentId: string) => {
    if (draftStatuses[enrollmentId]) return draftStatuses[enrollmentId];
    const existing = db.attendances.find(
      (a) => a.studentEnrollmentId === enrollmentId && a.date === date
    );
    return existing?.status ?? AttendanceStatus.PRESENT;
  };

  const handleSave = async () => {
    try {
      const res = await saveBatch({
        date,
        academicYearId: enrollments[0]?.academicYearId ?? db.academicYears.find((year) => year.isActive)?.id ?? '',
        markedBy: auth.user?.id ?? 'user-teacher-1',
        entries: enrollments.map((e) => ({
          studentEnrollmentId: e.id,
          status: getStatus(e.id),
          method: isRfidPrimary ? AttendanceMethod.RFID : AttendanceMethod.MANUAL,
        })),
      }).unwrap();
      toast.success(
        pick(
          `${formatNumber(res.saved, locale)} জন শিক্ষার্থীর হাজিরা সংরক্ষিত হয়েছে। অনুপস্থিত SMS কিউ: ${formatNumber(res.smsQueued, locale)}`,
          `Saved attendance for ${res.saved} students. Absent SMS queued: ${res.smsQueued}`
        )
      );
    } catch {
      toast.error(pick('হাজিরা সংরক্ষণ করা যায়নি', 'Failed to save attendance'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('দৈনিক হাজিরা গ্রহণ', 'Take Daily Attendance')}
        description={pick(
          'নির্ধারিত শাখার হাজিরা নথিভুক্ত করুন; অনুপস্থিতিতে অভিভাবকের কাছে স্বয়ংক্রিয় SMS কিউ হবে',
          'Record section attendance; absences automatically queue guardian SMS alerts'
        )}
      />

      <Card className="p-4 flex flex-wrap items-end gap-4">
        <div className="w-56">
          <label className="text-sm font-medium text-muted-foreground block mb-1">
            {pick('শাখা নির্বাচন', 'Select Section')}
          </label>
          <Select value={activeSecId} onChange={(e) => setSectionId(e.target.value)}>
            {mySectionIds.map((sid) => {
              const s = db.sections.find((x) => x.id === sid);
              const c = db.classes.find((x) => x.id === s?.classId);
              return (
                <option key={sid} value={sid}>
                  {locale === 'bn' ? c?.nameBn || c?.name : c?.name} ({s?.name})
                </option>
              );
            })}
          </Select>
        </div>
        <div className="w-44">
          <label className="text-sm font-medium text-muted-foreground block mb-1">
            {pick('তারিখ', 'Date')}
          </label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex-1 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const all: Record<string, AttendanceStatus> = {};
              enrollments.forEach((e) => {
                all[e.id] = AttendanceStatus.PRESENT;
              });
              setDraftStatuses(all);
            }}
          >
            {pick('সবাইকে উপস্থিত করুন', 'Mark All Present')}
          </Button>
          <Button variant="primary" size="sm" disabled={saving} onClick={handleSave}>
            <Save className="w-4 h-4" />
            {pick('হাজিরা সংরক্ষণ', 'Save Attendance')}
          </Button>
        </div>
      </Card>

      {isRfidPrimary && (
        <div className="p-3.5 rounded-[var(--radius)] border border-info/40 bg-info/10 text-sm flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-info shrink-0 mt-0.5" />
          <p>
            {pick(
              'এই শ্রেণির জন্য প্রাথমিক হাজিরা পদ্ধতি RFID নির্ধারিত আছে। আপনি প্রয়োজনে ম্যানুয়াল ফলোব্যাক হিসেবে অনুপস্থিতি বা ছুটি হালনাগাদ করতে পারেন।',
              'This class uses RFID as its primary attendance method. You may still apply manual fallback corrections if needed.'
            )}
          </p>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted/70 text-sm text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">{pick('রোল', 'Roll')}</th>
                <th className="px-4 py-3 text-left">{pick('শিক্ষার্থী', 'Student')}</th>
                <th className="px-4 py-3 text-left">{pick('হাজিরার অবস্থা', 'Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {enrollments.map((enr) => {
                const stu = db.students.find((s) => s.id === enr.studentId);
                const status = getStatus(enr.id);
                return (
                  <tr key={enr.id}>
                    <td className="px-4 py-3 font-semibold">{formatNumber(enr.roll, locale)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{locale === 'bn' ? stu?.nameBn || stu?.nameEn : stu?.nameEn}</p>
                      <p className="text-xs text-muted-foreground font-mono">{stu?.studentId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          AttendanceStatus.PRESENT,
                          AttendanceStatus.ABSENT,
                          AttendanceStatus.LATE,
                          AttendanceStatus.LEAVE,
                        ].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setDraftStatuses((prev) => ({ ...prev, [enr.id]: st }))}
                            className={`px-2.5 py-1 rounded text-xs font-medium border cursor-pointer transition-colors ${
                              status === st
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-surface border-border hover:bg-surface-muted'
                            }`}
                          >
                            {locale === 'bn'
                              ? ENUM_LABELS.AttendanceStatus[st]?.bn ?? st
                              : ENUM_LABELS.AttendanceStatus[st]?.en ?? st}
                          </button>
                        ))}
                      </div>
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

export function TeacherRoutinesPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const teacher = useCurrentTeacher(db);
  const { locale, pick } = useI18n();

  if (isLoading || !db || !teacher) return <LoadingSkeleton />;
  const myRoutines = db.classRoutines.filter((r) => r.staffId === teacher.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('আমার সাপ্তাহিক ক্লাস রুটিন', 'My Weekly Class Routine')}
        description={pick('রবিবার থেকে বৃহস্পতিবার নির্ধারিত পিরিয়ড', 'Sunday through Thursday teaching timetable')}
      />
      <div className="space-y-4">
        {DAYS_ORDER.map((day) => {
          const dayItems = myRoutines
            .filter((r) => r.day === day)
            .sort((a, b) => a.periodNumber - b.periodNumber);
          const dayMeta = ENUM_LABELS.WeekDay?.[day];
          return (
            <Card key={day} className="p-4">
              <h3 className="text-base font-bold text-primary mb-3">
                {locale === 'bn' ? dayMeta?.bn ?? day : dayMeta?.en ?? day}
              </h3>
              {dayItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {pick('কোনো ক্লাস নির্ধারিত নেই', 'No periods assigned')}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dayItems.map((r) => {
                    const ta = db.teacherAssignments.find((a) => a.id === r.teacherAssignmentId);
                    const sub = ta ? getAssignmentSubject(db, ta.classSubjectId) : undefined;
                    const sec = db.sections.find((s) => s.id === r.sectionId);
                    const cls = db.classes.find((c) => c.id === sec?.classId);
                    return (
                      <div
                        key={r.id}
                        className="p-3 rounded-[var(--radius)] border border-border bg-surface-muted/40"
                      >
                        <p className="text-xs font-semibold text-primary tabular-nums">
                          {pick(`পিরিয়ড ${formatNumber(r.periodNumber, locale)}`, `Period ${r.periodNumber}`)} ·{' '}
                          {formatTime12h(r.startTime, locale)} – {formatTime12h(r.endTime, locale)}
                        </p>
                        <p className="text-base font-semibold mt-1">
                          {locale === 'bn' ? sub?.nameBn || sub?.name : sub?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {locale === 'bn' ? cls?.nameBn || cls?.name : cls?.name} ({sec?.name}) · {pick('কক্ষ:', 'Room:')}{' '}
                          {r.room ?? '—'}
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

export function TeacherMarksEntryPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [saveMarks, { isLoading: saving }] = useSaveMarksBatchMutation();
  const teacher = useCurrentTeacher(db);
  const auth = useAppSelector((s) => s.auth);
  const { locale, pick } = useI18n();

  const [selectedExamId, setSelectedExamId] = useState('exam-ann-10');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [edits, setEdits] = useState<
    Record<string, { written: number; mcq: number; practical: number; isAbsent: boolean }>
  >({});

  if (isLoading || !db || !teacher) return <LoadingSkeleton />;

  const myAssignments = db.teacherAssignments.filter((a) => a.staffId === teacher.id);
  const myClassIds = Array.from(new Set(myAssignments.map((a) => a.classId)));
  const myExams = db.exams.filter((e) => myClassIds.includes(e.classId));
  const exam = myExams.find((e) => e.id === selectedExamId) ?? myExams[0];

  const examAssignments = myAssignments.filter((a) => a.classId === exam?.classId);
  const activeAssignment =
    examAssignments.find((a) => a.id === selectedAssignmentId) ?? examAssignments[0];

  const activeSubject = activeAssignment
    ? getAssignmentSubject(db, activeAssignment.classSubjectId)
    : undefined;
  const examSubject = db.examSubjects.find(
    (es) => es.examId === exam?.id && es.subjectId === activeSubject?.id
  );
  const scale = db.gradingScales.find((g) => g.id === exam?.gradingScaleId) ?? db.gradingScales[0];
  const scaleRanges = db.gradeRanges.filter((g) => g.gradingScaleId === scale?.id);

  const enrollments = activeAssignment
    ? db.enrollments
        .filter((e) => e.sectionId === activeAssignment.sectionId)
        .sort((a, b) => a.roll - b.roll)
    : [];

  const canEdit =
    Boolean(activeAssignment?.canEnterMarks) &&
    Boolean(exam) &&
    !exam.isLocked &&
    exam.resultStatus !== ResultPublicationStatus.PUBLISHED;

  const getRow = (enrId: string) => {
    if (edits[enrId]) return edits[enrId];
    const existing = db.marks.find(
      (m) => m.examSubjectId === examSubject?.id && m.studentEnrollmentId === enrId
    );
    return {
      written: existing?.writtenMarks ?? 0,
      mcq: existing?.mcqMarks ?? 0,
      practical: existing?.practicalMarks ?? 0,
      isAbsent: existing?.isAbsent ?? false,
    };
  };

  const handleSave = async () => {
    if (!exam || !examSubject || !canEdit) return;
    try {
      const res = await saveMarks({
        examId: exam.id,
        examSubjectId: examSubject.id,
        enteredBy: auth.user?.id ?? 'user-teacher-1',
        entries: enrollments.map((enr) => {
          const r = getRow(enr.id);
          return {
            studentEnrollmentId: enr.id,
            writtenMarks: r.isAbsent ? 0 : r.written,
            mcqMarks: r.isAbsent ? 0 : r.mcq,
            practicalMarks: r.isAbsent ? 0 : r.practical,
            continuousAssessmentMarks: 0,
            isAbsent: r.isAbsent,
          };
        }),
      }).unwrap();
      toast.success(
        pick(
          `${formatNumber(res.savedCount, locale)} জন শিক্ষার্থীর নম্বর সংরক্ষিত হয়েছে`,
          `Saved marks for ${res.savedCount} students`
        )
      );
      setEdits({});
    } catch {
      toast.error(pick('নম্বর সংরক্ষণ ব্যর্থ হয়েছে', 'Failed to save marks'));
    }
  };

  const wMax = examSubject?.writtenFullMarks ?? 0;
  const mMax = examSubject?.mcqFullMarks ?? 0;
  const pMax = examSubject?.practicalFullMarks ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('শিক্ষক নম্বর এন্ট্রি (সীমাবদ্ধ)', 'Teacher Marks Entry (Scoped)')}
        description={pick(
          'শুধুমাত্র আপনার নির্ধারিত শ্রেণি, শাখা ও বিষয়ের নম্বর এন্ট্রি করুন (canEnterMarks অনুযায়ী)',
          'Strictly scoped to your assigned class, section, and subjects with mark-entry permission'
        )}
      />

      <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-1">
            {pick('পরীক্ষা নির্বাচন', 'Select Examination')}
          </label>
          <Select
            value={exam?.id ?? ''}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              setSelectedAssignmentId('');
              setEdits({});
            }}
          >
            {myExams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.resultStatus})
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-1">
            {pick('আপনার নির্ধারিত বিষয় ও শাখা', 'Your Assigned Subject & Section')}
          </label>
          <Select
            value={activeAssignment?.id ?? ''}
            onChange={(e) => {
              setSelectedAssignmentId(e.target.value);
              setEdits({});
            }}
          >
            {examAssignments.map((a) => {
              const sub = getAssignmentSubject(db, a.classSubjectId);
              const sec = db.sections.find((s) => s.id === a.sectionId);
              return (
                <option key={a.id} value={a.id}>
                  {locale === 'bn' ? sub?.nameBn || sub?.name : sub?.name} ({sec?.name})
                  {a.canEnterMarks ? '' : ' [Read-Only]'}
                </option>
              );
            })}
          </Select>
        </div>

        <div className="flex justify-end">
          <Button variant="primary" disabled={!canEdit || saving || !examSubject} onClick={handleSave}>
            <Save className="w-4 h-4" />
            {pick('নম্বর সংরক্ষণ করুন', 'Save Subject Marks')}
          </Button>
        </div>
      </Card>

      {activeAssignment && !activeAssignment.canEnterMarks && (
        <div className="p-4 rounded-[var(--radius)] border border-warning/40 bg-warning/10 flex items-start gap-3 text-sm">
          <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              {pick('এই বিষয়ের নম্বর এন্ট্রি অনুমতি আপনার জন্য সীমাবদ্ধ', 'Mark Entry Permission Restricted')}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pick(
                'TeacherAssignment.canEnterMarks = false হওয়ায় আপনি এই বিষয়ের নম্বর শুধুমাত্র দেখতে পারবেন, পরিবর্তন করতে পারবেন না।',
                'Your assignment for this subject has canEnterMarks = false. You may review marks in read-only mode only.'
              )}
            </p>
          </div>
        </div>
      )}

      {exam && (exam.isLocked || exam.resultStatus === ResultPublicationStatus.PUBLISHED) && (
        <div className="p-3.5 rounded-[var(--radius)] border border-border bg-surface-muted flex items-center gap-2.5 text-sm">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <span>
            {pick(
              'এই পরীক্ষার নম্বর লক বা প্রকাশিত হয়ে গেছে। পরিবর্তনের জন্য অ্যাডমিনের অনুমতি প্রয়োজন।',
              'This examination is locked or published. Contact Admin to unlock marks.'
            )}
          </span>
        </div>
      )}

      {!examSubject ? (
        <EmptyState
          title={pick('এই পরীক্ষায় বিষয়টি অন্তর্ভুক্ত নয়', 'Subject not scheduled in this exam')}
          description={pick('অন্য পরীক্ষা বা বিষয় নির্বাচন করুন।', 'Select another exam or assigned subject.')}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-muted/50 flex flex-wrap items-center justify-between gap-2 text-sm tabular-nums">
            <span className="font-semibold">
              {locale === 'bn' ? activeSubject?.nameBn || activeSubject?.name : activeSubject?.name} —{' '}
              {pick('পূর্ণমান:', 'Full:')} {formatNumber(examSubject.fullMarks, locale)} (
              {pick('লিখিত', 'Written')} {formatNumber(wMax, locale)} · MCQ {formatNumber(mMax, locale)} ·{' '}
              {pick('ব্যবহারিক', 'Prac')} {formatNumber(pMax, locale)})
            </span>
            <StatusBadge enumName="ResultPublicationStatus" value={exam.resultStatus} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted/70 text-sm text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-3 py-2.5 text-left">{pick('রোল', 'Roll')}</th>
                  <th className="px-3 py-2.5 text-left">{pick('শিক্ষার্থী', 'Student')}</th>
                  <th className="px-3 py-2.5 text-center">{pick('অনুপস্থিত', 'Absent')}</th>
                  <th className="px-3 py-2.5 text-right">{pick('লিখিত', 'Written')}</th>
                  <th className="px-3 py-2.5 text-right">MCQ</th>
                  <th className="px-3 py-2.5 text-right">{pick('ব্যবহারিক', 'Practical')}</th>
                  <th className="px-3 py-2.5 text-right">{pick('মোট', 'Total')}</th>
                  <th className="px-3 py-2.5 text-center">{pick('গ্রেড', 'Grade')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {enrollments.map((enr) => {
                  const stu = db.students.find((s) => s.id === enr.studentId);
                  const row = getRow(enr.id);
                  const total = row.isAbsent ? 0 : row.written + row.mcq + row.practical;
                  const grade = evaluateExamSubjectMark(
                    {
                      writtenMarks: row.written,
                      mcqMarks: row.mcq,
                      practicalMarks: row.practical,
                      continuousAssessmentMarks: 0,
                      isAbsent: row.isAbsent,
                    },
                    examSubject,
                    scaleRanges
                  );

                  return (
                    <tr key={enr.id}>
                      <td className="px-3 py-2 font-semibold">{formatNumber(enr.roll, locale)}</td>
                      <td className="px-3 py-2 font-medium">
                        {locale === 'bn' ? stu?.nameBn || stu?.nameEn : stu?.nameEn}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          disabled={!canEdit}
                          checked={row.isAbsent}
                          onChange={(e) =>
                            setEdits((prev) => ({
                              ...prev,
                              [enr.id]: { ...row, isAbsent: e.target.checked },
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          max={wMax}
                          disabled={!canEdit || row.isAbsent || wMax === 0}
                          value={row.written}
                          onChange={(e) => {
                            const v = Math.min(wMax, Math.max(0, Number(e.target.value) || 0));
                            setEdits((prev) => ({ ...prev, [enr.id]: { ...row, written: v } }));
                          }}
                          className="w-16 text-right px-2 py-1 border border-border rounded bg-surface disabled:opacity-50"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          max={mMax}
                          disabled={!canEdit || row.isAbsent || mMax === 0}
                          value={row.mcq}
                          onChange={(e) => {
                            const v = Math.min(mMax, Math.max(0, Number(e.target.value) || 0));
                            setEdits((prev) => ({ ...prev, [enr.id]: { ...row, mcq: v } }));
                          }}
                          className="w-16 text-right px-2 py-1 border border-border rounded bg-surface disabled:opacity-50"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          max={pMax}
                          disabled={!canEdit || row.isAbsent || pMax === 0}
                          value={row.practical}
                          onChange={(e) => {
                            const v = Math.min(pMax, Math.max(0, Number(e.target.value) || 0));
                            setEdits((prev) => ({ ...prev, [enr.id]: { ...row, practical: v } }));
                          }}
                          className="w-16 text-right px-2 py-1 border border-border rounded bg-surface disabled:opacity-50"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-bold">{formatNumber(total, locale)}</td>
                      <td
                        className={`px-3 py-2 text-center font-bold ${
                          grade.isPassed ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {row.isAbsent ? 'AB' : grade.letterGrade}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export function TeacherResultsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const teacher = useCurrentTeacher(db);
  const { locale, pick } = useI18n();
  const [examId, setExamId] = useState('exam-hy-10');
  const [previewSummaryId, setPreviewSummaryId] = useState<string | null>(null);

  if (isLoading || !db || !teacher) return <LoadingSkeleton />;
  const myClassIds = Array.from(
    new Set(db.teacherAssignments.filter((a) => a.staffId === teacher.id).map((a) => a.classId))
  );
  const myExams = db.exams.filter((e) => myClassIds.includes(e.classId));
  const exam = myExams.find((e) => e.id === examId) ?? myExams[0];
  const summaries = db.resultSummaries
    .filter((r) => r.examId === exam?.id)
    .sort((a, b) => (a.meritPosition ?? 999) - (b.meritPosition ?? 999));

  const selectedSummary = previewSummaryId
    ? summaries.find((s) => s.id === previewSummaryId)
    : null;

  const marksheetProps = useMemo(() => {
    if (!selectedSummary || !exam) return null;
    const enr = db.enrollments.find((e) => e.id === selectedSummary.studentEnrollmentId);
    const stu = db.students.find((s) => s.id === enr?.studentId);
    const cls = db.classes.find((c) => c.id === enr?.classId);
    const sec = db.sections.find((s) => s.id === enr?.sectionId);
    const grp = db.academicGroups.find((g) => g.id === enr?.groupId);
    const yr = db.academicYears.find((y) => y.id === enr?.academicYearId);
    if (!enr || !stu || !cls || !sec) return null;

    const subjects = db.studentSubjectResults
      .filter((sr) => sr.examId === exam.id && sr.studentEnrollmentId === enr.id)
      .map((sr) => {
        const es = db.examSubjects.find((x) => x.id === sr.examSubjectId);
        const sub = db.subjects.find((x) => x.id === es?.subjectId);
        const mk = db.marks.find(
          (m) => m.examSubjectId === sr.examSubjectId && m.studentEnrollmentId === enr.id
        );
        return {
          subjectCode: sub?.officialCode ?? '—',
          subjectName: sub?.name ?? 'Subject',
          subjectNameBn: sub?.nameBn ?? sub?.name ?? 'বিষয়',
          fullMarks: es?.fullMarks ?? 100,
          writtenMarks: mk?.writtenMarks ?? 0,
          mcqMarks: mk?.mcqMarks ?? 0,
          practicalMarks: mk?.practicalMarks ?? 0,
          totalMarks: sr.totalMarks,
          letterGrade: sr.letterGrade,
          gradePoint: sr.gradePoint,
          isPassed: sr.isPassed,
          isOptional: sr.isOptional,
          bonusGradePoint: sr.bonusGradePoint ?? 0,
          isAbsent: sr.isAbsent,
        };
      });

    return {
      school: db.schoolProfile,
      examName: exam.name,
      student: {
        studentId: stu.studentId,
        nameEn: stu.nameEn,
        nameBn: stu.nameBn,
        roll: enr.roll,
        className: cls.name,
        classNameBn: cls.nameBn ?? cls.name,
        sectionName: sec.name,
        groupName: grp?.name,
        groupNameBn: grp?.nameBn ?? grp?.name,
        academicYear: yr?.name ?? '2026',
      },
      summary: selectedSummary,
      subjects,
    };
  }, [selectedSummary, exam, db]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('শ্রেণির ফলাফল ও মেধাতালিকা', 'Class Results & Merit List')}
        description={pick('আপনার নির্ধারিত শ্রেণিসমূহের ফলাফল বিশ্লেষণ', 'Review exam standings for your classes')}
      />
      <Card className="p-4 flex items-center justify-between gap-4">
        <Select value={exam?.id ?? ''} onChange={(e) => setExamId(e.target.value)} className="max-w-sm">
          {myExams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} ({e.resultStatus})
            </option>
          ))}
        </Select>
        {exam && <StatusBadge enumName="ResultPublicationStatus" value={exam.resultStatus} />}
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted/70 text-sm text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">{pick('মেধা', 'Merit')}</th>
                <th className="px-4 py-3 text-left">{pick('রোল', 'Roll')}</th>
                <th className="px-4 py-3 text-left">{pick('শিক্ষার্থী', 'Student')}</th>
                <th className="px-4 py-3 text-right">{pick('মোট নম্বর', 'Total')}</th>
                <th className="px-4 py-3 text-right">GPA</th>
                <th className="px-4 py-3 text-center">{pick('গ্রেড', 'Grade')}</th>
                <th className="px-4 py-3 text-right">{pick('মার্কশিট', 'Marksheet')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {summaries.map((sum) => {
                const enr = db.enrollments.find((e) => e.id === sum.studentEnrollmentId);
                const stu = db.students.find((s) => s.id === enr?.studentId);
                return (
                  <tr key={sum.id}>
                    <td className="px-4 py-3 font-bold">
                      {sum.meritPosition ? `#${formatNumber(sum.meritPosition, locale)}` : '—'}
                    </td>
                    <td className="px-4 py-3">{enr ? formatNumber(enr.roll, locale) : '—'}</td>
                    <td className="px-4 py-3 font-medium">
                      {locale === 'bn' ? stu?.nameBn || stu?.nameEn : stu?.nameEn}
                    </td>
                    <td className="px-4 py-3 text-right">{formatNumber(sum.totalMarks, locale)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">
                      {sum.gpa !== null && sum.gpa !== undefined ? formatNumber(sum.gpa, locale, 2) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{sum.letterGrade ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => setPreviewSummaryId(sum.id)}>
                        {pick('দেখুন', 'View')}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={Boolean(marksheetProps)}
        onClose={() => setPreviewSummaryId(null)}
        title={pick('শিক্ষার্থীর মার্কশিট', 'Student Marksheet')}
        maxWidth="max-w-4xl"
      >
        {marksheetProps && (
          <div className="space-y-4">
            <div className="flex justify-end no-print">
              <Button variant="primary" size="sm" onClick={() => triggerPrint()}>
                <Printer className="w-4 h-4" />
                {pick('প্রিন্ট করুন', 'Print Marksheet')}
              </Button>
            </div>
            <PrintableMarksheet {...marksheetProps} />
          </div>
        )}
      </Modal>
    </div>
  );
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

export function TeacherNoticesPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('বিদ্যালয় নোটিশ বোর্ড', 'School Notice Board')}
        description={pick('শিক্ষক ও একাডেমিক সংক্রান্ত সকল ঘোষণা', 'Official announcements and faculty circulars')}
      />
      <div className="space-y-3">
        {db.notices.map((n) => (
          <Card key={n.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">{n.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                  {formatDateLong(n.publishedAt ?? n.createdAt, locale)}
                </p>
              </div>
              <StatusBadge enumName="NoticeStatus" value={n.status} />
            </div>
            <p className="text-base text-foreground/85 mt-3 leading-relaxed">{n.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
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
