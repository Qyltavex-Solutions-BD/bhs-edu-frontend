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

export function ParentDashboardPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { parent, children } = useParentChildren(db);
  const { locale, pick } = useI18n();
  const [selectedId, setSelectedId] = useState<string>('stu-10-1');

  if (isLoading || !db || !parent) return <LoadingSkeleton rows={6} />;

  const active = children.find((c) => c.student.id === selectedId) ?? children[0];
  if (!active) {
    return <EmptyState title={pick('কোনো সন্তান সংযুক্ত নেই', 'No linked children found')} />;
  }

  const att = db.attendances.filter((a) => a.studentEnrollmentId === active.enrollment.id);
  const presentCount = att.filter(
    (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE
  ).length;
  const attPct = att.length > 0 ? Math.round((presentCount / att.length) * 100) : 0;

  const publishedSummaries = db.resultSummaries.filter((r) => {
    const ex = db.exams.find((e) => e.id === r.examId);
    return (
      r.studentEnrollmentId === active.enrollment.id &&
      ex?.resultStatus === ResultPublicationStatus.PUBLISHED
    );
  });
  const latestResult = publishedSummaries[0];

  const mySms = db.attendanceSmsLogs.filter(
    (s) => s.parentId === parent.id || s.phone === parent.phone
  );
  const upcomingExams = db.exams.filter((e) => e.classId === active.enrollment.classId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick(`অভিভাবক ড্যাশবোর্ড — ${parent.name}`, `Parent Dashboard — ${parent.name}`)}
        description={pick(
          'আপনার সন্তানের হাজিরা, প্রকাশিত ফলাফল, ক্লাস রুটিন ও SMS নোটিফিকেশন এক নজরে দেখুন',
          'Track attendance, published exam results, class routines, and guardian SMS alerts'
        )}
      />

      <ChildSwitcherBar
        childrenList={children}
        selectedStudentId={active.student.id}
        onChange={setSelectedId}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={pick('নির্বাচিত শিক্ষার্থী', 'Selected Student')}
          value={locale === 'bn' ? active.student.nameBn || active.student.nameEn : active.student.nameEn}
          meta={`${locale === 'bn' ? active.cls?.nameBn || active.cls?.name : active.cls?.name} (${active.sec?.name}) · ${pick('রোল', 'Roll')} ${formatNumber(active.enrollment.roll, locale)}`}
          accent="primary"
        />
        <StatCard
          label={pick('উপস্থিতির হার', 'Attendance Rate')}
          value={`${formatNumber(attPct, locale)}%`}
          meta={pick(
            `${formatNumber(presentCount, locale)}/${formatNumber(att.length, locale)} কার্যদিবস`,
            `${presentCount}/${att.length} school days`
          )}
          accent="success"
        />
        <StatCard
          label={pick('সর্বশেষ প্রকাশিত জিপিএ', 'Latest Published GPA')}
          value={
            latestResult?.gpa !== null && latestResult?.gpa !== undefined
              ? formatNumber(latestResult.gpa, locale, 2)
              : '—'
          }
          meta={
            latestResult?.meritPosition
              ? pick(
                  `মেধা স্থান: #${formatNumber(latestResult.meritPosition, locale)}`,
                  `Merit Position: #${latestResult.meritPosition}`
                )
              : pick('ফলাফল অপেক্ষমাণ', 'Pending publication')
          }
        />
        <StatCard
          label={pick('প্রাপ্ত হাজিরা SMS', 'Attendance SMS Alerts')}
          value={formatNumber(mySms.length, locale)}
          meta={parent.phone}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">
              {pick('সাম্প্রতিক হাজিরা ও SMS বার্তা', 'Recent Attendance & SMS History')}
            </h2>
            <Link href="/parent/sms-history" className="text-sm font-medium text-primary hover:underline">
              {pick('সব SMS দেখুন', 'View All SMS')}
            </Link>
          </div>
          {mySms.length === 0 ? (
            <EmptyState title={pick('কোনো SMS লগ নেই', 'No SMS alerts yet')} />
          ) : (
            <div className="divide-y divide-border">
              {mySms.slice(0, 4).map((sms) => (
                <div key={sms.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatDateLong(sms.sentAt ?? sms.createdAt, locale)}
                    </span>
                    <StatusBadge enumName="SmsStatus" value={sms.status} />
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{sms.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">
              {pick('পরীক্ষার সূচি ও ফলাফল', 'Examinations & Results')}
            </h2>
            <Link href="/parent/results" className="text-sm font-medium text-primary hover:underline">
              {pick('মার্কশিট দেখুন', 'Open Marksheets')}
            </Link>
          </div>
          <div className="divide-y divide-border">
            {upcomingExams.map((ex) => (
              <div key={ex.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">{ex.name}</p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {formatDateShort(ex.startDate, locale)} – {formatDateShort(ex.endDate, locale)}
                  </p>
                </div>
                <StatusBadge enumName="ResultPublicationStatus" value={ex.resultStatus} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function ParentProfilePage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { parent, children } = useParentChildren(db);
  const { locale, pick } = useI18n();
  if (isLoading || !db || !parent) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('অভিভাবক প্রোফাইল', 'Guardian Profile')}
        description={pick('নিবন্ধিত যোগাযোগ ও সংযুক্ত সন্তানদের তথ্য', 'Registered contact information and linked wards')}
      />
      <Card className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
        <div>
          <p className="text-sm text-muted-foreground">{pick('অভিভাবকের নাম', 'Full Name')}</p>
          <p className="font-semibold mt-0.5">{parent.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{pick('মোবাইল নম্বর (SMS)', 'Mobile Number (SMS)')}</p>
          <p className="font-mono mt-0.5">{parent.phone}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{pick('ইমেইল', 'Email')}</p>
          <p className="mt-0.5">{parent.email ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{pick('পেশা', 'Occupation')}</p>
          <p className="mt-0.5">{parent.occupation ?? '—'}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-sm text-muted-foreground">{pick('ঠিকানা', 'Address')}</p>
          <p className="mt-0.5">{parent.address ?? '—'}</p>
        </div>
      </Card>

      <CommonProfilePanel
        roleLabel={pick('নিবন্ধিত অভিভাবক (Parent / Guardian)', 'Registered Parent / Guardian')}
        extraMeta={parent.phone}
      />

      <Card className="p-5">
        <h2 className="text-base font-semibold mb-3">
          {pick('সংযুক্ত শিক্ষার্থীসমূহ', 'Linked Children')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {children.map((c) => (
            <Link
              key={c.student.id}
              href={`/parent/children/${c.student.id}`}
              className="p-4 rounded-[var(--radius)] border border-border hover:border-primary/50 transition-colors"
            >
              <p className="text-base font-semibold">
                {locale === 'bn' ? c.student.nameBn || c.student.nameEn : c.student.nameEn}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
                {locale === 'bn' ? c.cls?.nameBn || c.cls?.name : c.cls?.name} ({c.sec?.name}) ·{' '}
                {pick('রোল:', 'Roll:')} {formatNumber(c.enrollment.roll, locale)} · ID:{' '}
                {c.student.studentId}
              </p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
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

export function ParentAttendancePage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { children } = useParentChildren(db);
  const { locale, pick } = useI18n();
  const [selectedId, setSelectedId] = useState('stu-10-1');

  if (isLoading || !db) return <LoadingSkeleton />;
  const active = children.find((c) => c.student.id === selectedId) ?? children[0];
  if (!active) return <EmptyState title={pick('কোনো তথ্য নেই', 'No data')} />;

  const records = db.attendances
    .filter((a) => a.studentEnrollmentId === active.enrollment.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const present = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
  const late = records.filter((r) => r.status === AttendanceStatus.LATE).length;
  const absent = records.filter((r) => r.status === AttendanceStatus.ABSENT).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('সন্তানের হাজিরা ক্যালেন্ডার', 'Child Attendance Calendar')}
        description={pick('মাসিক ক্যালেন্ডার হিট-ভিউ ও দৈনিক RFID/ম্যানুয়াল লগ', 'Monthly calendar heat view and daily attendance log')}
      />

      <ChildSwitcherBar
        childrenList={children}
        selectedStudentId={active.student.id}
        onChange={setSelectedId}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={pick('উপস্থিত', 'Present')}
          value={formatNumber(present, locale)}
          accent="success"
        />
        <StatCard
          label={pick('বিলম্বে উপস্থিত', 'Late')}
          value={formatNumber(late, locale)}
          accent="warning"
        />
        <StatCard
          label={pick('অনুপস্থিত', 'Absent')}
          value={formatNumber(absent, locale)}
          accent="destructive"
        />
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold mb-1">
          {pick('নভেম্বর ২০২৬ — মাসিক হাজিরা গ্রিড', 'November 2026 — Monthly Attendance Grid')}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {pick('P = উপস্থিত, L = বিলম্ব, A = অনুপস্থিত, LV = অনুমোদিত ছুটি', 'P = Present, L = Late, A = Absent, LV = Leave')}
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2.5 tabular-nums">
          {records
            .slice()
            .reverse()
            .map((r) => {
              const code =
                r.status === AttendanceStatus.PRESENT
                  ? 'P'
                  : r.status === AttendanceStatus.LATE
                    ? 'L'
                    : r.status === AttendanceStatus.ABSENT
                      ? 'A'
                      : 'LV';
              const tone =
                r.status === AttendanceStatus.PRESENT
                  ? 'border-success/40 bg-success/10 text-success'
                  : r.status === AttendanceStatus.LATE
                    ? 'border-warning/40 bg-warning/10 text-warning'
                    : r.status === AttendanceStatus.ABSENT
                      ? 'border-destructive/40 bg-destructive/10 text-destructive'
                      : 'border-info/40 bg-info/10 text-info';
              return (
                <div key={r.id} className={`p-3 rounded-[var(--radius)] border ${tone}`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{r.date.slice(8)} Nov</span>
                    <span>{code}</span>
                  </div>
                  <p className="text-xs mt-1 opacity-85">
                    {r.method} {r.inTime ? `· ${r.inTime.slice(0, 5)}` : ''}
                  </p>
                </div>
              );
            })}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted/70 text-sm text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">{pick('তারিখ', 'Date')}</th>
                <th className="px-4 py-3 text-left">{pick('অবস্থা', 'Status')}</th>
                <th className="px-4 py-3 text-left">{pick('পদ্ধতি', 'Method')}</th>
                <th className="px-4 py-3 text-left">{pick('প্রবেশ / প্রস্থান', 'Check-in / Out')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2.5 font-medium">{formatDateLong(r.date, locale)}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge enumName="AttendanceStatus" value={r.status} />
                  </td>
                  <td className="px-4 py-2.5 text-sm">{r.method}</td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">
                    {r.inTime ? formatTime12h(r.inTime, locale) : '—'} /{' '}
                    {r.outTime ? formatTime12h(r.outTime, locale) : '—'}
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

export function ParentResultsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { children } = useParentChildren(db);
  const { locale, pick } = useI18n();
  const [selectedId, setSelectedId] = useState('stu-10-1');
  const [selectedExamId, setSelectedExamId] = useState('');

  if (isLoading || !db) return <LoadingSkeleton />;
  const active = children.find((c) => c.student.id === selectedId) ?? children[0];
  if (!active) return <EmptyState title={pick('কোনো তথ্য নেই', 'No data')} />;

  const publishedExams = db.exams.filter(
    (e) =>
      e.classId === active.enrollment.classId &&
      e.resultStatus === ResultPublicationStatus.PUBLISHED
  );
  const activeExam = publishedExams.find((e) => e.id === selectedExamId) ?? publishedExams[0];
  const summary = activeExam
    ? db.resultSummaries.find(
        (r) => r.examId === activeExam.id && r.studentEnrollmentId === active.enrollment.id
      )
    : null;

  const subjects =
    activeExam && summary
      ? db.studentSubjectResults
          .filter((sr) => sr.examId === activeExam.id && sr.studentEnrollmentId === active.enrollment.id)
          .map((sr) => {
            const es = db.examSubjects.find((x) => x.id === sr.examSubjectId);
            const sub = db.subjects.find((x) => x.id === es?.subjectId);
            const mk = db.marks.find(
              (m) => m.examSubjectId === sr.examSubjectId && m.studentEnrollmentId === active.enrollment.id
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
          })
      : [];

  const trendData = publishedExams.map((ex) => {
    const s = db.resultSummaries.find(
      (r) => r.examId === ex.id && r.studentEnrollmentId === active.enrollment.id
    );
    return {
      exam: ex.name.slice(0, 18),
      gpa: s?.gpa ?? 0,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('প্রকাশিত ফলাফল ও মার্কশিট', 'Published Results & Marksheet')}
        description={pick(
          'শুধুমাত্র প্রকাশিত পরীক্ষার ফলাফল ও প্রিন্টযোগ্য একাডেমিক ট্রান্সক্রিপ্ট',
          'Published examination results and A4 printable academic transcripts'
        )}
        actions={
          summary ? (
            <Button variant="primary" size="sm" onClick={() => triggerPrint()} className="no-print">
              <Printer className="w-4 h-4" />
              {pick('মার্কশিট প্রিন্ট করুন', 'Print Marksheet')}
            </Button>
          ) : undefined
        }
      />

      <div className="no-print space-y-4">
        <ChildSwitcherBar
          childrenList={children}
          selectedStudentId={active.student.id}
          onChange={(id) => {
            setSelectedId(id);
            setSelectedExamId('');
          }}
        />

        {publishedExams.length > 0 && (
          <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
            <Select
              value={activeExam?.id ?? ''}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="max-w-sm"
            >
              {publishedExams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </Select>
            {activeExam && (
              <StatusBadge enumName="ResultPublicationStatus" value={activeExam.resultStatus} />
            )}
          </Card>
        )}
      </div>

      {!activeExam || !summary ? (
        <EmptyState
          title={pick('কোনো প্রকাশিত ফলাফল পাওয়া যায়নি', 'No published results yet')}
          description={pick(
            'খসড়া বা স্থগিত ফলাফল এখানে প্রদর্শিত হয় না।',
            'Draft or withheld examinations are not displayed.'
          )}
        />
      ) : (
        <>
          <PrintableMarksheet
            school={db.schoolProfile}
            examName={activeExam.name}
            student={{
              studentId: active.student.studentId,
              nameEn: active.student.nameEn,
              nameBn: active.student.nameBn,
              roll: active.enrollment.roll,
              className: active.cls?.name ?? '',
              classNameBn: active.cls?.nameBn ?? active.cls?.name ?? '',
              sectionName: active.sec?.name ?? '',
              groupName: active.grp?.name,
              groupNameBn: active.grp?.nameBn ?? active.grp?.name,
              academicYear: active.yr?.name ?? '2026',
            }}
            summary={summary}
            subjects={subjects}
          />

          <Card className="p-5 no-print">
            <h2 className="text-base font-semibold mb-3">
              {pick('জিপিএ অগ্রগতি চার্ট', 'GPA Performance Trend')}
            </h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="exam" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="gpa"
                    stroke="#0B7A34"
                    fill="#16A34A"
                    fillOpacity={0.22}
                    name="GPA"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
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

export function ParentExaminationsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { children } = useParentChildren(db);
  const { locale, pick } = useI18n();
  const [selectedId, setSelectedId] = useState('stu-10-1');

  if (isLoading || !db) return <LoadingSkeleton />;
  const active = children.find((c) => c.student.id === selectedId) ?? children[0];
  if (!active) return <EmptyState title={pick('কোনো তথ্য নেই', 'No data')} />;

  const exams = db.exams.filter((e) => e.classId === active.enrollment.classId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('পরীক্ষার সূচি', 'Examination Schedule')}
        description={pick('আসন্ন ও সম্পন্ন পরীক্ষাসমূহ', 'Upcoming and completed examinations')}
      />
      <ChildSwitcherBar
        childrenList={children}
        selectedStudentId={active.student.id}
        onChange={setSelectedId}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map((ex) => (
          <Card key={ex.id} className="p-5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-bold">{ex.name}</h3>
              <StatusBadge enumName="ResultPublicationStatus" value={ex.resultStatus} />
            </div>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatDateLong(ex.startDate, locale)} – {formatDateLong(ex.endDate, locale)}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ParentResourcesPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('শিক্ষা রিসোর্স', 'Academic Resources')}
        description={pick('সন্তানদের পাঠ্যসহায়ক ডিজিটাল কনটেন্ট', 'Class learning materials and study sheets')}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {db.digitalResources.map((r) => {
          const cls = db.classes.find((c) => c.id === r.classId);
          return (
            <Card key={r.id} className="p-5 flex flex-col justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-primary flex items-center gap-1">
                  <MonitorPlay className="w-3.5 h-3.5" />
                  {r.resourceType} · {locale === 'bn' ? cls?.nameBn || cls?.name : cls?.name}
                </p>
                <h3 className="text-base font-bold mt-2">{r.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info(pick('ডাউনলোড প্রস্তুত', 'Download ready'))}
              >
                {pick('দেখুন', 'View')}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function ParentNoticesPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('বিদ্যালয় নোটিশ', 'School Notices')}
        description={pick('অভিভাবকদের জন্য গুরুত্বপূর্ণ ঘোষণা', 'Announcements for parents and guardians')}
      />
      <div className="space-y-3">
        {db.notices.map((n) => (
          <Card key={n.id} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold">{n.title}</h3>
                <p className="text-xs text-muted-foreground tabular-nums">
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

export function ParentNotificationsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <LoadingSkeleton />;

  const items = db.notifications.filter((n) => n.targetRoles.includes('PARENT'));
  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('নোটিফিকেশন', 'Notifications')}
        actions={
          <Button variant="outline" size="sm" onClick={() => markRead({})}>
            {pick('সব পঠিত করুন', 'Mark All Read')}
          </Button>
        }
      />
      <div className="space-y-3">
        {items.map((n) => (
          <Card key={n.id} className={`p-4 ${!n.isRead ? 'border-primary/40 bg-primary/5' : ''}`}>
            <p className="text-base font-semibold">{locale === 'bn' ? n.titleBn : n.titleEn}</p>
            <p className="text-sm text-muted-foreground mt-1">{locale === 'bn' ? n.bodyBn : n.bodyEn}</p>
            <p className="text-xs text-muted-foreground mt-2 tabular-nums">
              {formatDateLong(n.createdAt, locale)}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ParentSmsHistoryPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { parent } = useParentChildren(db);
  const { locale, pick } = useI18n();
  if (isLoading || !db || !parent) return <LoadingSkeleton />;

  const logs = db.attendanceSmsLogs.filter(
    (s) => s.parentId === parent.id || s.phone === parent.phone
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('হাজিরা SMS ইতিহাস', 'Attendance SMS History')}
        description={pick(
          `আপনার নিবন্ধিত নম্বর (${parent.phone}) এ প্রেরিত স্বয়ংক্রিয় SMS তালিকা`,
          `Automated attendance alerts sent to your registered phone (${parent.phone})`
        )}
      />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted/70 text-sm text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">{pick('তারিখ ও সময়', 'Date & Time')}</th>
                <th className="px-4 py-3 text-left">{pick('বার্তা', 'Message')}</th>
                <th className="px-4 py-3 text-left">{pick('অবস্থা', 'Delivery Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {formatDateLong(log.sentAt ?? log.createdAt, locale)}
                  </td>
                  <td className="px-4 py-3 text-sm leading-relaxed">{log.message}</td>
                  <td className="px-4 py-3">
                    <StatusBadge enumName="SmsStatus" value={log.status} />
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
