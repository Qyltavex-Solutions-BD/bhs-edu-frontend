'use client';

import React from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  ArrowRight,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  Plus,
  Bell,
} from 'lucide-react';
import { useGetBootstrapQuery } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import {
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { Button, Card } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import {
  AttendanceStatus,
  Gender,
  ResultPublicationStatus,
  ResultStatus,
  SmsStatus,
  StaffType,
} from '@/src/types/enums';

// BHS Emblem chart palette: Heritage Emerald, Royal Blue, Crest Crimson, Bright Leaf, Sky Shapla, Flame Amber
const CHART_COLORS = ['#0B7A34', '#124B96', '#D32229', '#16A34A', '#2563EB', '#D97706'];

export function AdminDashboardPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();

  if (isLoading || !db) return <LoadingSkeleton rows={8} />;

  const activeYear = db.academicYears.find((y) => y.isActive);
  const activeStudents = db.students.filter((s) => s.status === 'ACTIVE');
  const teachers = db.staff.filter((s) => s.staffType === StaffType.TEACHER && s.status === 'ACTIVE');
  const otherStaff = db.staff.filter((s) => s.staffType !== StaffType.TEACHER && s.status === 'ACTIVE');

  const todayDate = '2026-11-19';
  const todayAtt = db.attendances.filter((a) => a.date === todayDate);
  const presentToday = todayAtt.filter((a) => a.status === AttendanceStatus.PRESENT).length;
  const lateToday = todayAtt.filter((a) => a.status === AttendanceStatus.LATE).length;
  const absentToday = todayAtt.filter((a) => a.status === AttendanceStatus.ABSENT).length;

  const unpublishedExams = db.exams.filter(
    (e) => !e.isDeleted && e.resultStatus !== ResultPublicationStatus.PUBLISHED
  ).length;
  const smsSent = db.attendanceSmsLogs.filter((s) => s.status === SmsStatus.SENT).length;
  const smsFailed = db.attendanceSmsLogs.filter((s) => s.status === SmsStatus.FAILED).length;
  const pendingAdmissions = db.onlineAdmissions.filter(
    (a) => a.status === 'NEW' || a.status === 'UNDER_REVIEW'
  ).length;

  // Chart 1: Class-wise Student Distribution
  const classDistData = db.classes.map((cls) => ({
    name: locale === 'bn' ? cls.nameBn ?? cls.name : cls.name,
    students: db.enrollments.filter((e) => e.classId === cls.id && e.academicYearId === 'ay-2026').length,
  }));

  // Chart 2: Attendance Trend (last 10 school days)
  const attDates = Array.from(new Set(db.attendances.map((a) => a.date))).sort().slice(-10);
  const attTrendData = attDates.map((d) => {
    const dayRows = db.attendances.filter((a) => a.date === d);
    return {
      date: d.slice(5),
      present: dayRows.filter((r) => r.status === AttendanceStatus.PRESENT).length,
      late: dayRows.filter((r) => r.status === AttendanceStatus.LATE).length,
      absent: dayRows.filter((r) => r.status === AttendanceStatus.ABSENT).length,
    };
  });

  // Chart 3: Gender Ratio
  const genderData = [
    { name: pick('ছাত্র (Male)', 'Male'), value: activeStudents.filter((s) => s.gender === Gender.MALE).length },
    { name: pick('ছাত্রী (Female)', 'Female'), value: activeStudents.filter((s) => s.gender === Gender.FEMALE).length },
  ];

  // Chart 4: Enrollment Trend (2022–2026 Demo)
  const enrollmentTrendData = [
    { year: '2022', total: 14 },
    { year: '2023', total: 16 },
    { year: '2024', total: 17 },
    { year: '2025', total: 19 },
    { year: '2026', total: activeStudents.length },
  ];

  // Chart 5: Result Pass-Rate by Exam
  const passRateData = db.exams
    .filter((e) => !e.isDeleted && db.resultSummaries.some((r) => r.examId === e.id))
    .map((ex) => {
      const list = db.resultSummaries.filter((r) => r.examId === ex.id);
      const passed = list.filter((r) => r.resultStatus === ResultStatus.PASS).length;
      return {
        name: ex.name.slice(0, 18),
        passRate: list.length ? Math.round((passed / list.length) * 100) : 0,
      };
    });

  // Chart 6: Subject Average Performance (Class 10 Half-Yearly)
  const subjectPerfData = db.examSubjects
    .filter((es) => es.examId === 'exam-hy-10')
    .map((es) => {
      const sub = db.subjects.find((s) => s.id === es.subjectId);
      const res = db.studentSubjectResults.filter((r) => r.examSubjectId === es.id);
      const avg = res.length
        ? Math.round((res.reduce((acc, r) => acc + (r.totalMarks / es.fullMarks) * 100, 0) / res.length) * 10) / 10
        : 0;
      return {
        subject: (locale === 'bn' ? sub?.nameBn : sub?.name)?.slice(0, 10) ?? '',
        avgPct: avg,
      };
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('প্রশাসনিক ড্যাশবোর্ড (Overview)', 'Admin Overview Dashboard')}
        description={pick(
          `সক্রিয় শিক্ষাবর্ষ: ${activeYear?.name ?? '2026'} · ভোজেশ্বর উচ্চ বিদ্যালয় (EIIN: ${db.schoolProfile.eiin})`,
          `Active Academic Year: ${activeYear?.name ?? '2026'} · Bhojeshwar High School (EIIN: ${db.schoolProfile.eiin})`
        )}
        actions={
          <>
            <Link href="/admin/students/create">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4" /> {pick('নতুন শিক্ষার্থী', 'Add Student')}
              </Button>
            </Link>
            <Link href="/admin/attendance/daily">
              <Button variant="outline" size="sm">
                <ClipboardCheck className="w-4 h-4" /> {pick('দৈনিক হাজিরা', 'Daily Attendance')}
              </Button>
            </Link>
            <Link href="/admin/results/publication">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="w-4 h-4" /> {pick('ফলাফল প্রকাশনা', 'Publish Results')}
              </Button>
            </Link>
          </>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={pick('মোট সক্রিয় শিক্ষার্থী', 'Active Students')}
          value={formatNumber(activeStudents.length, locale)}
          meta={pick(`৫টি শ্রেণি (৬ষ্ঠ–১০ম) · শিক্ষাবর্ষ ${activeYear?.name}`, `5 classes (6–10) · Session ${activeYear?.name}`)}
          accent="primary"
        />
        <StatCard
          label={pick('শিক্ষক ও কর্মচারী', 'Teachers & Staff')}
          value={`${formatNumber(teachers.length, locale)} / ${formatNumber(otherStaff.length, locale)}`}
          meta={pick('শিক্ষক / কর্মকর্তা-কর্মচারী', 'Teachers / Officers & Staff')}
        />
        <StatCard
          label={pick('আজকের উপস্থিতি', "Today's Attendance")}
          value={`${formatNumber(presentToday, locale)} / ${formatNumber(todayAtt.length, locale)}`}
          meta={pick(
            `বিলম্ব: ${formatNumber(lateToday, 'bn')} · অনুপস্থিত: ${formatNumber(absentToday, 'bn')}`,
            `Late: ${lateToday} · Absent: ${absentToday}`
          )}
          accent="success"
        />
        <StatCard
          label={pick('অপ্রকাশিত পরীক্ষা ও SMS', 'Unpublished Exams & SMS')}
          value={formatNumber(unpublishedExams, locale)}
          meta={pick(
            `SMS প্রেরিত: ${formatNumber(smsSent, 'bn')} · ব্যর্থ: ${formatNumber(smsFailed, 'bn')}`,
            `SMS Sent: ${smsSent} · Failed: ${smsFailed}`
          )}
          accent={smsFailed > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Charts Grid (6 Responsive Recharts Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {pick('দৈনিক হাজিরা প্রবণতা (সাম্প্রতিক ১০ কর্মদিবস)', 'Attendance Trend (Recent 10 School Days)')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {pick('উপস্থিত, বিলম্বিত ও অনুপস্থিত শিক্ষার্থীর সংখ্যা', 'Daily count of present, late, and absent students')}
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="present" name={pick('উপস্থিত', 'Present')} stroke="#0B7A34" fill="#0B7A34" fillOpacity={0.22} />
                <Area type="monotone" dataKey="late" name={pick('বিলম্বিত', 'Late')} stroke="#D97706" fill="#D97706" fillOpacity={0.2} />
                <Area type="monotone" dataKey="absent" name={pick('অনুপস্থিত', 'Absent')} stroke="#D32229" fill="#D32229" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {pick('শ্রেণিভিত্তিক শিক্ষার্থী বণ্টন (২০২৬)', 'Class-Wise Student Distribution (2026)')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {pick('ষষ্ঠ থেকে দশম শ্রেণিতে মোট নিবন্ধিত শিক্ষার্থী', 'Enrolled students across Classes 6–10')}
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classDistData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="students" name={pick('শিক্ষার্থী', 'Students')} fill="#0B7A34" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {pick('বিষয়ভিত্তিক গড় নম্বর (%) — অর্ধবার্ষিক ২০২৬ (১০ম)', 'Subject Average Score (%) — Half-Yearly 2026 (Class 10)')}
            </h2>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectPerfData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="avgPct" name={pick('গড় %', 'Avg %')} fill="#124B96" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="p-5 space-y-2">
            <h2 className="text-base font-bold text-foreground">
              {pick('ছাত্র-ছাত্রী অনুপাত', 'Gender Ratio')}
            </h2>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3}>
                    {genderData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5 space-y-2">
            <h2 className="text-base font-bold text-foreground">
              {pick('ভর্তি প্রবণতা ও পাসের হার', 'Enrollment Trend')}
            </h2>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={enrollmentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" name={pick('মোট', 'Total')} stroke="#0B7A34" strokeWidth={2.5} dot={{ r: 4, fill: '#124B96' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {passRateData.length > 0 && (
              <div className="pt-2 border-t border-border text-sm text-muted-foreground flex justify-between tabular-nums">
                <span>{pick('সর্বশেষ পাসের হার:', 'Latest Pass Rate:')}</span>
                <strong className="text-success">{passRateData[0].passRate}%</strong>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Actionable Operational Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Tasks */}
        <Card className="p-5 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            {pick('অপেক্ষমাণ কাজ ও দ্রুত লিংক', 'Pending Actions')}
          </h2>
          <div className="space-y-2.5 text-sm">
            <Link href="/admin/examinations/marks-entry" className="flex items-center justify-between p-3 border border-border rounded hover:bg-surface-muted/50">
              <div>
                <p className="font-semibold text-sm">{pick('বার্ষিক পরীক্ষা ২০২৬ নম্বর এন্ট্রি', 'Annual Exam 2026 Marks Entry')}</p>
                <p className="text-xs text-muted-foreground">{pick('খসড়া অবস্থায় — যাচাই ও প্রকাশ করুন', 'Draft state — review & publish')}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-primary" />
            </Link>
            <Link href="/admin/students/admissions" className="flex items-center justify-between p-3 border border-border rounded hover:bg-surface-muted/50">
              <div>
                <p className="font-semibold text-sm">{pick('অনলাইন ভর্তি আবেদন পর্যালোচনা', 'Review Online Admissions')}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatNumber(pendingAdmissions, locale)} {pick('টি আবেদন অপেক্ষমাণ', 'pending applications')}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-primary" />
            </Link>
            <Link href="/admin/attendance/sms-logs" className="flex items-center justify-between p-3 border border-border rounded hover:bg-surface-muted/50">
              <div>
                <p className="font-semibold text-sm">{pick('ব্যর্থ SMS পুনরায় প্রেরণ', 'Retry Failed Attendance SMS')}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatNumber(smsFailed, locale)} {pick('টি ব্যর্থ SMS', 'failed SMS alerts')}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-primary" />
            </Link>
          </div>
        </Card>

        {/* Recent Notices */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              {pick('সাম্প্রতিক নোটিশ', 'Recent Notices')}
            </h2>
            <Link href="/admin/notices" className="text-sm font-medium text-primary hover:underline">{pick('সব দেখুন', 'Manage')}</Link>
          </div>
          <div className="divide-y divide-border">
            {db.notices.slice(0, 4).map((n) => (
              <div key={n.id} className="py-2.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{formatDateShort(n.createdAt, locale)}</p>
                </div>
                <StatusBadge enumName="NoticeStatus" value={n.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Audit Activity */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              {pick('সাম্প্রতিক অডিট লগ', 'Recent Activity Log')}
            </h2>
            <Link href="/admin/audit-logs" className="text-sm font-medium text-primary hover:underline">{pick('সম্পূর্ণ লগ', 'Full Log')}</Link>
          </div>
          <div className="divide-y divide-border">
            {db.auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="py-2 text-sm">
                <p className="font-semibold text-foreground">{log.action} · <span className="text-primary">{log.module}</span></p>
                <p className="text-muted-foreground line-clamp-1">{log.details}</p>
                <p className="text-xs text-muted-foreground tabular-nums mt-0.5">{formatDateShort(log.createdAt, locale)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
