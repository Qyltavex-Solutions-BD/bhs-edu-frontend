'use client';

import React, { useState } from 'react';
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
  CartesianGrid,
} from 'recharts';
import {
  ArrowRight,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  Plus,
  Bell,
  UserCheck,
  CheckCircle2,
  Users,
  ShieldCheck,
  FileText,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { useGetBootstrapQuery } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { cn } from '@/src/lib/utils/cn';
import { toast } from 'sonner';
import {
  AttendanceStatus,
  Gender,
  ResultPublicationStatus,
  ResultStatus,
  SmsStatus,
  StaffType,
} from '@/src/types/enums';

// 8 Theme Colors from Reference Design (Calibrated with Deep Academic Blue #124B96):
const COLOR_PRIMARY = '#1C6440'; // Forest Green
const COLOR_AMBER = '#EBAF3E';   // Amber Gold
const COLOR_BLUE = '#124B96';    // Deep Royal / Academic Blue
const COLOR_CORAL = '#DF6153';   // Coral Red
const TINT_GREEN = '#DCEFE0';    // Mint tint
const TINT_AMBER = '#FBE9C4';    // Amber tint
const TINT_BLUE = '#DCEAF8';     // Blue tint
const TINT_CORAL = '#F4DAD5';    // Coral tint

export function AdminDashboardPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();

  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [activeTab, setActiveTab] = useState<'overview' | 'students'>('overview');

  const [dismissedActions, setDismissedActions] = useState<string[]>([]);

  if (isLoading || !db) return <LoadingSkeleton rows={8} />;

  // 1. Core Data Flow: Academic Entities
  const activeYear = db.academicYears.find((y) => y.isActive);
  const activeStudents = db.students.filter((s) => s.status === 'ACTIVE');
  const teachers = db.staff.filter((s) => s.staffType === StaffType.TEACHER && s.status === 'ACTIVE');
  const otherStaff = db.staff.filter((s) => s.staffType !== StaffType.TEACHER && s.status === 'ACTIVE');

  // Attendance
  const todayDate = '2026-11-19';
  const todayAtt = db.attendances.filter((a) => a.date === todayDate);
  const presentToday = todayAtt.filter((a) => a.status === AttendanceStatus.PRESENT).length;
  const lateToday = todayAtt.filter((a) => a.status === AttendanceStatus.LATE).length;
  const absentToday = todayAtt.filter((a) => a.status === AttendanceStatus.ABSENT).length;
  const attTotal = todayAtt.length || 1;
  const presentRate = Math.round((presentToday / attTotal) * 100);

  // Exams, SMS & Admissions
  const unpublishedExams = db.exams.filter(
    (e) => !e.isDeleted && e.resultStatus !== ResultPublicationStatus.PUBLISHED
  ).length;
  const smsSent = db.attendanceSmsLogs.filter((s) => s.status === SmsStatus.SENT).length;
  const smsFailed = db.attendanceSmsLogs.filter((s) => s.status === SmsStatus.FAILED).length;
  const pendingAdmissions = db.onlineAdmissions.filter(
    (a) => a.status === 'NEW' || a.status === 'UNDER_REVIEW'
  ).length;

  // 2. Chart 1: Attendance Trend (last 10 school days)
  const attDates = Array.from(new Set(db.attendances.map((a) => a.date))).sort().slice(-10);
  const attTrendData = attDates.map((d) => {
    const dayRows = db.attendances.filter((a) => a.date === d);
    const pres = dayRows.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    return {
      date: d.slice(5),
      present: pres,
      late: dayRows.filter((r) => r.status === AttendanceStatus.LATE).length,
      absent: dayRows.filter((r) => r.status === AttendanceStatus.ABSENT).length,
    };
  });

  // 3. Chart 2: Gender Ratio (Donut Chart) - Harmonized with Primary & Secondary
  const maleCount = activeStudents.filter((s) => s.gender === Gender.MALE).length;
  const femaleCount = activeStudents.filter((s) => s.gender === Gender.FEMALE).length;
  const genderData = [
    { name: pick('ছাত্র (Male)', 'Male'), value: maleCount, color: COLOR_PRIMARY }, // Primary Forest Green (#1C6440)
    { name: pick('ছাত্রী (Female)', 'Female'), value: femaleCount, color: COLOR_BLUE }, // Secondary Steel/Academic Blue (#5E99D1)
  ];
  const totalStudentsCount = maleCount + femaleCount || activeStudents.length;

  // 4. Chart 3: Class-wise Student Distribution (2026)
  const classDistData = db.classes.map((cls) => ({
    name: locale === 'bn' ? cls.nameBn ?? cls.name : cls.name,
    students: db.enrollments.filter((e) => e.classId === cls.id && e.academicYearId === 'ay-2026').length,
  }));

  // 5. Chart 4: Subject Average Performance (Class 10 Half-Yearly)
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

  // 6. Chart 5: Enrollment Trend (2022–2026)
  const enrollmentTrendData = [
    { year: '2022', total: 14 },
    { year: '2023', total: 16 },
    { year: '2024', total: 17 },
    { year: '2025', total: 19 },
    { year: '2026', total: activeStudents.length },
  ];

  // 7. Chart 6: Result Pass-Rate by Exam
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

  // 8. Pending Action Items
  const pendingActions = [
    {
      id: 'act-exam',
      avatar: 'EX',
      avatarBg: TINT_BLUE,
      avatarText: COLOR_BLUE,
      title: pick('বার্ষিক পরীক্ষা ২০২৬ নম্বর এন্ট্রি', 'Annual Exam 2026 Marks Entry'),
      subtitle: pick('খসড়া অবস্থায় — যাচাই ও প্রকাশ করুন', 'Draft state — review & publish'),
      link: '/admin/examinations/marks-entry',
    },
    {
      id: 'act-adm',
      avatar: 'OA',
      avatarBg: TINT_GREEN,
      avatarText: COLOR_PRIMARY,
      title: pick('অনলাইন ভর্তি আবেদন পর্যালোচনা', 'Review Online Admissions'),
      subtitle: pick(
        `${formatNumber(pendingAdmissions, locale)}টি আবেদন অপেক্ষমাণ`,
        `${formatNumber(pendingAdmissions, locale)} pending applications`
      ),
      link: '/admin/students/admissions',
    },
    {
      id: 'act-sms',
      avatar: 'SM',
      avatarBg: TINT_CORAL,
      avatarText: '#9E2F22',
      title: pick('ব্যর্থ SMS পুনরায় প্রেরণ', 'Retry Failed Attendance SMS'),
      subtitle: pick(
        `${formatNumber(smsFailed, locale)}টি ব্যর্থ SMS`,
        `${formatNumber(smsFailed, locale)} failed SMS alerts`
      ),
      link: '/admin/attendance/sms-logs',
    },
    {
      id: 'act-tc',
      avatar: 'TC',
      avatarBg: TINT_BLUE,
      avatarText: COLOR_BLUE,
      title: pick('ছাড়পত্র ও প্রত্যয়নপত্র অনুমোদন', 'Verify Transfer Certificates'),
      subtitle: pick('২ জন শিক্ষার্থীর ছাড়পত্র প্রস্তুত', '2 certificates pending verification'),
      link: '/admin/students/transfers',
    },
  ].filter((a) => !dismissedActions.includes(a.id));

  // 9. Recent Students Table Preview (matching user screenshot)
  const studentTableRows = activeStudents.slice(0, 6).map((st, idx) => {
    const enr = db.enrollments.find((e) => e.studentId === st.id && e.academicYearId === 'ay-2026');
    const cls = db.classes.find((c) => c.id === enr?.classId);
    const sec = db.sections.find((s) => s.id === enr?.sectionId);
    const parentRel = db.parentStudents.find((ps) => ps.studentId === st.id && ps.isPrimary);
    const parent = parentRel ? db.parents.find((p) => p.id === parentRel.parentId) : null;
    const rates = [93, 100, 87, 90, 89, 96];
    const rate = rates[idx % rates.length];
    // Restrained palette: alternating Primary Green and Deep Royal Blue
    const tintBgs = [TINT_GREEN, TINT_BLUE];
    const tintTexts = [COLOR_PRIMARY, COLOR_BLUE];
    const initials = st.nameEn
      ? st.nameEn
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : `S${idx + 1}`;

    return {
      id: st.id,
      roll: enr?.roll ? String(enr.roll).padStart(2, '0') : `0${idx + 1}`,
      studentId: st.studentId,
      nameBn: st.nameBn ?? st.nameEn,
      nameEn: st.nameEn,
      className: locale === 'bn' ? cls?.nameBn ?? cls?.name ?? '৬ষ্ঠ শ্রেণি' : cls?.name ?? 'Class 6',
      sectionName: sec?.name ?? 'A',
      guardianName: parent ? (locale === 'bn' ? parent.nameBn ?? parent.name : parent.name) : 'মোঃ মাসুদ রানা',
      guardianPhone: parent?.phone || '01711000026',
      rate,
      status: st.status,
      avatarBg: tintBgs[idx % tintBgs.length],
      avatarText: tintTexts[idx % tintTexts.length],
      initials,
    };
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* 1. HERO BANNER CARD (Deep Forest Green Gradient with Frosted Right Pills) */}
      <div className="relative rounded-3xl p-6 lg:p-8 bg-gradient-to-r from-[#175234] via-[#1C6440] to-[#123E27] text-white overflow-hidden shadow-lg border border-[#236b47]/40">
        {/* Background decorative concentric watermark rings & organic bubbles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Middle translucent glowing bubble contours */}
          <div className="absolute top-1/2 left-[48%] -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-gradient-to-tr from-[#2D8B59]/25 via-white/[0.04] to-transparent blur-2xl" />
          <div className="absolute top-[-20px] left-[52%] w-48 h-48 rounded-full border border-white/[0.08] bg-white/[0.02]" />
          <div className="absolute bottom-[-30px] left-[42%] w-56 h-56 rounded-full border border-white/[0.06] bg-white/[0.02]" />

          {/* Right concentric watermark rings */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 overflow-hidden">
            <svg
              className="absolute right-[-80px] top-[-80px] w-[500px] h-[500px]"
              viewBox="0 0 500 500"
              fill="none"
            >
              <circle cx="250" cy="250" r="230" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" />
              <circle cx="250" cy="250" r="170" stroke="white" strokeWidth="1.5" />
              <circle cx="250" cy="250" r="110" stroke="white" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Text & CTA */}
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-sm font-medium text-white/95">
              <span className="w-2 h-2 rounded-full bg-[#96D0AB]" />
              <span>
                {pick(
                  `সক্রিয় শিক্ষাবর্ষ: ${activeYear?.name ?? '2026'} · ভোজেশ্বর উচ্চ বিদ্যালয় (EIIN: ${db.schoolProfile.eiin})`,
                  `Active Session: ${activeYear?.name ?? '2026'} · Bhojeshwar High School (EIIN: ${db.schoolProfile.eiin})`
                )}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
                {pick(
                  'উপস্থিতি ও একাডেমিক অগ্রগতি ১২% বৃদ্ধি পেয়েছে',
                  'Attendance & Academic Performance is up 12% this session'
                )}
              </h2>
              <p className="mt-2.5 text-base sm:text-lg text-white/90 font-normal leading-relaxed">
                {pick(
                  `${formatNumber(activeStudents.length, locale)} শিক্ষার্থী সক্রিয় · আজকের উপস্থিতি ${presentRate}% (${formatNumber(presentToday, locale)} জন) · ${pendingActions.length}টি প্রশাসনিক কাজ অপেক্ষমাণ`,
                  `${formatNumber(activeStudents.length, locale)} active students · ${presentRate}% attendance today · ${pendingActions.length} items waiting for your approval`
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/admin/students/create">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#1C6440] hover:bg-white/90 text-base font-semibold shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4.5 h-4.5" />
                  <span>{pick('নতুন শিক্ষার্থী ভর্তি →', 'Add Student →')}</span>
                </button>
              </Link>
              <Link href="/admin/attendance/daily">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-base font-medium backdrop-blur-xs transition cursor-pointer"
                >
                  <ClipboardCheck className="w-4.5 h-4.5" />
                  <span>{pick('দৈনিক হাজিরা', 'Daily Attendance')}</span>
                </button>
              </Link>
              <Link href="/admin/results/publication">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-base font-medium backdrop-blur-xs transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4.5 h-4.5" />
                  <span>{pick('ফলাফল প্রকাশনা', 'Publish Results')}</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Right 3 Frosted Stat Cards */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md min-w-[105px] sm:min-w-[130px] flex flex-col justify-between">
              <p className="text-sm font-semibold text-white/90 truncate">
                {pick('সক্রিয় শিক্ষার্থী', 'Active Students')}
              </p>
              <div className="my-1.5">
                <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
                  {formatNumber(activeStudents.length, locale)}
                </p>
              </div>
              <p className="text-sm font-bold text-[#96D0AB]">+4.2%</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md min-w-[105px] sm:min-w-[130px] flex flex-col justify-between">
              <p className="text-sm font-semibold text-white/90 truncate">
                {pick('শিক্ষক ও কর্মকর্তা', 'Teachers & Staff')}
              </p>
              <div className="my-1.5">
                <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
                  {formatNumber(teachers.length, locale)} / {formatNumber(otherStaff.length, locale)}
                </p>
              </div>
              <p className="text-sm font-semibold text-white/95">
                {pick('সবাই সক্রিয়', 'All active')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md min-w-[105px] sm:min-w-[130px] flex flex-col justify-between">
              <p className="text-sm font-semibold text-white/90 truncate">
                {pick('অনুমোদিত শ্রেণি', 'Classes & Batches')}
              </p>
              <div className="my-1.5">
                <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
                  {formatNumber(db.classes.length, locale)}
                </p>
              </div>
              <p className="text-sm font-bold text-[#96D0AB]">
                {pick('৬ষ্ঠ–১০ম শ্রেণি', 'Classes 6–10')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4 STAT KPI CARDS ROW (Exact reference styling with pastel squircles & sparklines) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Students (Green) */}
        <div className="bg-surface border border-border rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(28,100,64,0.06)] hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: TINT_GREEN, color: COLOR_PRIMARY }}
            >
              <GraduationCap className="w-5.5 h-5.5" />
            </div>
            <span
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{ backgroundColor: TINT_GREEN, color: COLOR_PRIMARY }}
            >
              ↑ 8.2%
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
                {formatNumber(activeStudents.length, locale)}
              </p>
              <p className="text-base text-foreground font-bold mt-1">
                {pick('মোট সক্রিয় শিক্ষার্থী', 'Active Students')}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pick(`৫টি শ্রেণি (৬ষ্ঠ–১০ম) · শিক্ষাবর্ষ ${activeYear?.name}`, `5 classes (6–10) · Session ${activeYear?.name}`)}
              </p>
            </div>
            {/* Green Sparkline */}
            <div className="w-20 h-9">
              <svg viewBox="0 0 80 36" className="w-full h-full overflow-visible">
                <path
                  d="M2,30 Q20,25 35,28 T65,8 T78,4"
                  fill="none"
                  stroke={COLOR_PRIMARY}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Attendance (Harmonized Deep Academic Blue) */}
        <div className="bg-surface border border-border rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(28,100,64,0.06)] hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: TINT_BLUE, color: COLOR_BLUE }}
            >
              <ClipboardCheck className="w-5.5 h-5.5" />
            </div>
            <span
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{ backgroundColor: TINT_BLUE, color: COLOR_BLUE }}
            >
              {presentRate}% {pick('হার', 'Rate')}
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
                {formatNumber(presentToday, locale)} / {formatNumber(todayAtt.length, locale)}
              </p>
              <p className="text-base text-foreground font-bold mt-1">
                {pick('আজকের উপস্থিতি', "Today's Attendance")}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pick(
                  `বিলম্ব: ${formatNumber(lateToday, locale)} · অনুপস্থিত: ${formatNumber(absentToday, locale)}`,
                  `Late: ${lateToday} · Absent: ${absentToday}`
                )}
              </p>
            </div>
            {/* Blue Sparkline */}
            <div className="w-20 h-9">
              <svg viewBox="0 0 80 36" className="w-full h-full overflow-visible">
                <path
                  d="M2,26 Q18,32 36,20 T62,12 T78,6"
                  fill="none"
                  stroke={COLOR_BLUE}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 3: Teachers & Staff (Primary Green Harmony) */}
        <div className="bg-surface border border-border rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(28,100,64,0.06)] hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: TINT_GREEN, color: COLOR_PRIMARY }}
            >
              <UserCheck className="w-5.5 h-5.5" />
            </div>
            <span
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{ backgroundColor: TINT_GREEN, color: COLOR_PRIMARY }}
            >
              ১০০% {pick('সক্রিয়', 'Active')}
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
                {formatNumber(teachers.length, locale)} / {formatNumber(otherStaff.length, locale)}
              </p>
              <p className="text-base text-foreground font-bold mt-1">
                {pick('শিক্ষক ও কর্মচারী', 'Teachers & Staff')}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pick('শিক্ষক / কর্মকর্তা-কর্মচারী', 'Teachers / Staff Officers')}
              </p>
            </div>
            {/* Green Sparkline */}
            <div className="w-20 h-9">
              <svg viewBox="0 0 80 36" className="w-full h-full overflow-visible">
                <path
                  d="M2,28 Q22,28 38,18 T64,15 T78,8"
                  fill="none"
                  stroke={COLOR_PRIMARY}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 4: Unpublished Exams & SMS (Coral) */}
        <div className="bg-surface border border-border rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(28,100,64,0.06)] hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: TINT_CORAL, color: COLOR_CORAL }}
            >
              <CheckCircle2 className="w-5.5 h-5.5" />
            </div>
            <span
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{ backgroundColor: TINT_CORAL, color: '#9E2F22' }}
            >
              {formatNumber(unpublishedExams, locale)} {pick('অপ্রকাশিত', 'Pending')}
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
                {formatNumber(unpublishedExams, locale)}
              </p>
              <p className="text-base text-foreground font-bold mt-1">
                {pick('অপ্রকাশিত পরীক্ষা ও SMS', 'Unpublished Exams & SMS')}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pick(
                  `SMS প্রেরিত: ${formatNumber(smsSent, locale)} · ব্যর্থ: ${formatNumber(smsFailed, locale)}`,
                  `SMS Sent: ${smsSent} · Failed: ${smsFailed}`
                )}
              </p>
            </div>
            {/* Coral Sparkline */}
            <div className="w-20 h-9">
              <svg viewBox="0 0 80 36" className="w-full h-full overflow-visible">
                <path
                  d="M2,12 Q20,10 38,18 T62,26 T78,28"
                  fill="none"
                  stroke={COLOR_CORAL}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE SECTION: ATTENDANCE TREND & GENDER RATIO (65% / 35% Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Daily Attendance Trend (AreaChart) */}
        <div className="lg:col-span-8 bg-surface border border-border rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                {pick('দৈনিক হাজিরা প্রবণতা (সাম্প্রতিক ১০ কর্মদিবস)', 'Daily Attendance Trend (Last 10 School Days)')}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {pick('উপস্থিত, বিলম্বিত ও অনুপস্থিত শিক্ষার্থীর সংখ্যা', 'Daily count of present, late, and absent students')}
              </p>
            </div>

            {/* Time Toggle Control (Day, Week, Month) */}
            <div className="inline-flex p-1 bg-[#F4F6F4] border border-[#E0E7E2] rounded-xl self-start sm:self-auto">
              {(['day', 'week', 'month'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all cursor-pointer',
                    timeRange === r
                      ? 'bg-surface text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {r === 'day' ? pick('দিন', 'Day') : r === 'week' ? pick('সপ্তাহ', 'Week') : pick('মাস', 'Month')}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Highlight */}
          <div className="flex items-center gap-3 my-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
              {presentRate}% {pick('গড় উপস্থিতি', 'Avg Attendance')}
            </span>
            <span
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{ backgroundColor: TINT_GREEN, color: COLOR_PRIMARY }}
            >
              ↑ ৪.৮% {pick('বিগত মাসের তুলনায়', 'vs last month')}
            </span>
          </div>

          {/* Area Chart with Gradient & Tooltip */}
          <div className="h-64 sm:h-72 w-full mt-2 relative">
            {/* Pinned callout indicator pill matching reference image */}
            <div className="absolute right-[8%] top-[20%] z-10 hidden sm:flex flex-col items-center pointer-events-none">
              <div className="bg-[#1C6440] text-white text-sm font-bold px-3.5 py-2 rounded-xl shadow-md border border-white/20 text-center leading-tight">
                <span className="text-xs text-white/90 block font-normal mb-0.5">
                  {pick('আজকের উপস্থিতি', "Today's Attendance")}
                </span>
                {formatNumber(presentToday, locale)} {pick('জন উপস্থিত', 'Present')}
              </div>
              <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#1C6440]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#1C6440] border-2 border-white mt-1 shadow-xs" />
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attTrendData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLOR_PRIMARY} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLOR_PRIMARY} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 13, fill: '#88998F' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 13, fill: '#88998F' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-surface border border-border rounded-xl px-3.5 py-2.5 shadow-lg text-sm space-y-1">
                          <p className="font-bold text-foreground">
                            {pick(`তারিখ: ${data.date}`, `Date: ${data.date}`)}
                          </p>
                          <p className="font-semibold text-[#1C6440]">
                            {pick(`উপস্থিত: ${data.present} জন`, `Present: ${data.present}`)}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {pick(
                              `বিলম্ব: ${data.late} · অনুপস্থিত: ${data.absent}`,
                              `Late: ${data.late} · Absent: ${data.absent}`
                            )}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="present"
                  stroke={COLOR_PRIMARY}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Card: Gender Ratio (Donut Chart) */}
        <div className="lg:col-span-4 bg-surface border border-border rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                {pick('ছাত্র-ছাত্রী অনুপাত', 'Gender Ratio')}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {pick(`শিক্ষাবর্ষ ${activeYear?.name ?? '2026'}`, `Session ${activeYear?.name ?? '2026'}`)}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-medium text-muted-foreground bg-[#F4F6F4] border border-[#E0E7E2] tabular-nums">
              {formatNumber(totalStudentsCount, locale)} {pick('মোট', 'total')}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-auto py-4">
            {/* Donut Chart with Centered Metric */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    dataKey="value"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={3}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none leading-tight">
                <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums">
                  {formatNumber(totalStudentsCount, locale)}
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  {pick('শিক্ষার্থী', 'students')}
                </span>
              </div>
            </div>

            {/* Custom Legend List */}
            <div className="space-y-3 w-full sm:w-auto">
              {genderData.map((item) => {
                const pct = Math.round((item.value / (totalStudentsCount || 1)) * 100);
                return (
                  <div key={item.name} className="flex items-center justify-between gap-4 text-base">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-foreground">{item.name}</span>
                    </div>
                    <span className="font-bold text-muted-foreground tabular-nums text-sm">
                      {formatNumber(item.value, locale)} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-base text-muted-foreground">
            <span>{pick('ছাত্র ও ছাত্রী অনুপাত:', 'Gender Breakdown:')}</span>
            <div className="flex items-center gap-2 font-bold">
              <span className="text-[#1C6440]">
                {pick('ছাত্র', 'Male')}: {Math.round((maleCount / (totalStudentsCount || 1)) * 100)}%
              </span>
              <span className="text-muted-foreground/60">·</span>
              <span className="text-[#124B96]">
                {pick('ছাত্রী', 'Female')}: {Math.round((femaleCount / (totalStudentsCount || 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SECONDARY ANALYTICS: CLASS DISTRIBUTION & SUBJECT PERFORMANCE (50% / 50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class-wise Student Distribution BarChart */}
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              {pick('শ্রেণিভিত্তিক শিক্ষার্থী বণ্টন (২০২৬)', 'Class-Wise Student Distribution (2026)')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {pick('ষষ্ঠ থেকে দশম শ্রেণিতে মোট নিবন্ধিত শিক্ষার্থী', 'Enrolled students across Classes 6–10')}
            </p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#88998F' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: '#88998F' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar
                  dataKey="students"
                  name={pick('শিক্ষার্থী', 'Students')}
                  fill={COLOR_PRIMARY}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Average Score & Pass Rate */}
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              {pick('বিষয়ভিত্তিক গড় নম্বর (%) — অর্ধবার্ষিক ২০২৬ (১০ম)', 'Subject Average Score (%) — Half-Yearly (Class 10)')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {pick('পরীক্ষায় বিভিন্ন বিষয়ের গড় প্রাপ্ত নম্বর হার', 'Average score percentage by subject')}
            </p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectPerfData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.7} />
                <XAxis dataKey="subject" tick={{ fontSize: 13, fill: '#88998F' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 13, fill: '#88998F' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar
                  dataKey="avgPct"
                  name={pick('গড় %', 'Avg %')}
                  fill={COLOR_BLUE}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {passRateData.length > 0 && (
            <div className="pt-3 border-t border-border flex items-center justify-between text-base text-muted-foreground">
              <span>{pick('সর্বশেষ পরীক্ষার পাসের হার:', 'Latest Exam Pass Rate:')}</span>
              <strong className="text-[#1C6440] font-bold text-base tabular-nums">
                {passRateData[0].passRate}%
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* 5. STUDENT DIRECTORY QUICK PREVIEW (Matching User Screenshot Layout) */}
      <div className="bg-surface border border-border rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              {pick('শিক্ষার্থী ডিরেক্টরি সারসংক্ষেপ', 'Student Directory Summary')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {pick(
                'নির্বাচিত শিক্ষাবর্ষের ভর্তি শিক্ষার্থী, শ্রেণি ও শাখাভিত্তিক তালিকা এবং অভিভাবক যোগাযোগ',
                'Enrolled students, section allocation, attendance rate and guardian contact'
              )}
            </p>
          </div>
          <Link href="/admin/students">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-foreground/90 hover:text-foreground border border-border hover:bg-surface-muted transition cursor-pointer"
            >
              <span>{pick('সকল শিক্ষার্থী দেখুন (২০)', 'View All Students (20)')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-base">
            <thead>
              <tr className="border-b border-border/80 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                <th className="pb-3.5 font-semibold">{pick('রোল', 'ROLL')}</th>
                <th className="pb-3.5 font-semibold">{pick('শিক্ষার্থী ও আইডি', 'STUDENT & ID')}</th>
                <th className="pb-3.5 font-semibold">{pick('শ্রেণি ও শাখা', 'CLASS & SECTION')}</th>
                <th className="pb-3.5 font-semibold">{pick('উপস্থিতি', 'ATTENDANCE')}</th>
                <th className="pb-3.5 font-semibold">{pick('অভিভাবক ও যোগাযোগ', 'GUARDIAN & CONTACT')}</th>
                <th className="pb-3.5 font-semibold text-right">{pick('অবস্থা', 'STATUS')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {studentTableRows.map((st) => (
                <tr key={st.id} className="hover:bg-surface-muted/40 transition-colors">
                  <td className="py-4 font-bold text-foreground tabular-nums text-base">{st.roll}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                        style={{ backgroundColor: st.avatarBg, color: st.avatarText }}
                      >
                        {st.initials}
                      </div>
                      <div className="leading-tight">
                        <p className="font-bold text-foreground text-base">{st.nameBn}</p>
                        <p className="text-sm text-muted-foreground font-mono mt-0.5">{st.studentId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 font-medium text-foreground text-base">
                    {st.className} · {st.sectionName}
                  </td>
                  <td className="py-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-base tabular-nums">
                        <span className="font-bold text-foreground">{st.rate}%</span>
                      </div>
                      <div className="w-24 h-2 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${st.rate}%`,
                            backgroundColor: st.rate >= 90 ? COLOR_PRIMARY : COLOR_BLUE,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 leading-tight">
                    <p className="font-medium text-foreground text-base">{st.guardianName}</p>
                    <p className="text-sm text-muted-foreground tabular-nums mt-0.5">{st.guardianPhone}</p>
                  </td>
                  <td className="py-4 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
                      style={{ backgroundColor: TINT_GREEN, color: COLOR_PRIMARY }}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#1C6440]" />
                      {st.status === 'ACTIVE' ? pick('সক্রিয়', 'Active') : st.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. OPERATIONAL WIDGETS (Pending Actions, Notices & Activity Logs) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Widget 1: Pending Actions (Exact Needs Your Approval Style) */}
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-border">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#1C6440]" />
                {pick('অপেক্ষমাণ কাজ ও অনুমোদন', 'Pending Actions')}
              </h3>
              <span
                className="px-3 py-1 rounded-full text-sm font-bold tabular-nums"
                style={{ backgroundColor: TINT_CORAL, color: COLOR_CORAL }}
              >
                {formatNumber(pendingActions.length, locale)} {pick('কাজ', 'pending')}
              </span>
            </div>

            <div className="divide-y divide-border/60">
              {pendingActions.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-surface-muted/30 transition-colors rounded-xl px-1"
                >
                  <Link href={item.link} className="flex items-center gap-3 min-w-0 flex-1 group">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                      style={{ backgroundColor: item.avatarBg, color: item.avatarText }}
                    >
                      {item.avatar}
                    </div>
                    <div className="min-w-0 leading-tight">
                      <p className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDismissedActions((prev) => [...prev, item.id])}
                      title={pick('বাতিল', 'Dismiss')}
                      className="w-8 h-8 rounded-full border border-border text-muted-foreground hover:text-[#DF6153] hover:bg-[#F4DAD5]/40 flex items-center justify-center transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <Link href={item.link}>
                      <button
                        type="button"
                        title={pick('দেখুন', 'Open')}
                        className="w-8 h-8 rounded-full bg-[#1C6440] hover:bg-[#154E31] text-white flex items-center justify-center shadow-xs transition cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3.5 border-t border-border mt-3">
            <Link
              href="/admin/students/admissions"
              className="text-base font-semibold text-[#1C6440] hover:underline flex items-center justify-between"
            >
              <span>{pick('সকল অপেক্ষমাণ আবেদন পর্যালোচনা', 'Manage all pending actions')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Widget 2: Recent Notices */}
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-border">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#1C6440]" />
                {pick('সাম্প্রতিক নোটিশ', 'Recent Notices')}
              </h3>
              <Link
                href="/admin/notices"
                className="text-sm font-semibold text-[#1C6440] hover:underline"
              >
                {pick('সব দেখুন', 'Manage')}
              </Link>
            </div>

            <div className="divide-y divide-border/60">
              {db.notices.slice(0, 4).map((n) => (
                <div key={n.id} className="py-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-foreground truncate">{n.title}</p>
                    <p className="text-sm text-muted-foreground tabular-nums mt-0.5">
                      {formatDateShort(n.createdAt, locale)}
                    </p>
                  </div>
                  <StatusBadge enumName="NoticeStatus" value={n.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3.5 border-t border-border mt-3">
            <Link
              href="/admin/notices"
              className="text-base font-semibold text-[#1C6440] hover:underline flex items-center justify-between"
            >
              <span>{pick('নতুন নোটিশ তৈরি করুন', 'Create New Notice')}</span>
              <Plus className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Widget 3: Recent Activity Log */}
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-border">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#1C6440]" />
                {pick('সাম্প্রতিক অডিট লগ', 'Recent Activity Log')}
              </h3>
              <Link
                href="/admin/audit-logs"
                className="text-sm font-semibold text-[#1C6440] hover:underline"
              >
                {pick('সম্পূর্ণ লগ', 'Full Log')}
              </Link>
            </div>

            <div className="divide-y divide-border/60">
              {db.auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="py-3 text-base">
                  <p className="font-semibold text-foreground truncate text-base">
                    {log.action} · <span className="text-[#1C6440]">{log.module}</span>
                  </p>
                  <p className="text-muted-foreground line-clamp-1 text-sm mt-0.5">{log.details}</p>
                  <p className="text-sm text-muted-foreground tabular-nums mt-0.5">
                    {formatDateShort(log.createdAt, locale)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3.5 border-t border-border mt-3">
            <Link
              href="/admin/audit-logs"
              className="text-base font-semibold text-[#1C6440] hover:underline flex items-center justify-between"
            >
              <span>{pick('অডিট ইতিহাস পরীক্ষা করুন', 'Inspect Audit History')}</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
