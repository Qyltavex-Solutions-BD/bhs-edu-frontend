'use client';

import React, { useState } from 'react';
import { useGetBootstrapQuery } from '@/src/store/api';
import { useGetAdminNoticesQuery } from '@/src/features/notices/api/notices.api';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import {
  AttendanceStatus,
  Gender,
  ResultPublicationStatus,
  ResultStatus,
  SmsStatus,
  StaffType,
} from '@/src/types/enums';
import { AdminDashboardHero } from './AdminDashboardHero';
import { AdminDashboardKpiCards } from './AdminDashboardKpiCards';
import { AdminDashboardAttendanceGenderCharts } from './AdminDashboardAttendanceGenderCharts';
import { AdminDashboardAcademicCharts } from './AdminDashboardAcademicCharts';
import { AdminDashboardStudentTable, type DashboardStudentRow } from './AdminDashboardStudentTable';
import { AdminDashboardWidgets, type DashboardPendingAction } from './AdminDashboardWidgets';

const COLOR_PRIMARY = '#1C6440';
const COLOR_BLUE = '#124B96';
const TINT_GREEN = '#DCEFE0';
const TINT_BLUE = '#DCEAF8';
const TINT_CORAL = '#F4DAD5';

export function AdminDashboardPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { data: recentNoticePage, isLoading: loadingRecentNotices } = useGetAdminNoticesQuery({ limit: 5 });
  const { locale, pick } = useI18n();

  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
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

  // 3. Chart 2: Gender Ratio (Donut Chart)
  const maleCount = activeStudents.filter((s) => s.gender === Gender.MALE).length;
  const femaleCount = activeStudents.filter((s) => s.gender === Gender.FEMALE).length;
  const genderData = [
    { name: pick('ছাত্র (Male)', 'Male'), value: maleCount, color: COLOR_PRIMARY },
    { name: pick('ছাত্রী (Female)', 'Female'), value: femaleCount, color: COLOR_BLUE },
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

  // 6. Chart 6: Result Pass-Rate by Exam
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

  // 7. Pending Action Items
  const pendingActions: DashboardPendingAction[] = [
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

  // 8. Recent Students Table Preview
  const studentTableRows: DashboardStudentRow[] = activeStudents.slice(0, 6).map((st, idx) => {
    const enr = db.enrollments.find((e) => e.studentId === st.id && e.academicYearId === 'ay-2026');
    const cls = db.classes.find((c) => c.id === enr?.classId);
    const sec = db.sections.find((s) => s.id === enr?.sectionId);
    const parentRel = db.parentStudents.find((ps) => ps.studentId === st.id && ps.isPrimary);
    const parent = parentRel ? db.parents.find((p) => p.id === parentRel.parentId) : null;
    const rates = [93, 100, 87, 90, 89, 96];
    const rate = rates[idx % rates.length];
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
    <div className="space-y-6 max-w-[1600px] mx-auto pb-6">
      {/* 1. Hero Card */}
      <AdminDashboardHero
        activeYearName={activeYear?.name}
        eiin={db.schoolProfile.eiin}
        activeStudentsCount={activeStudents.length}
        presentRate={presentRate}
        presentToday={presentToday}
        pendingActionsCount={pendingActions.length}
        teachersCount={teachers.length}
        otherStaffCount={otherStaff.length}
        classesCount={db.classes.length}
        locale={locale}
        pick={pick}
      />

      {/* 2. 4 Stat KPI Cards */}
      <AdminDashboardKpiCards
        activeStudentsCount={activeStudents.length}
        activeYearName={activeYear?.name}
        presentToday={presentToday}
        todayAttTotal={todayAtt.length}
        presentRate={presentRate}
        lateToday={lateToday}
        absentToday={absentToday}
        teachersCount={teachers.length}
        otherStaffCount={otherStaff.length}
        unpublishedExams={unpublishedExams}
        smsSent={smsSent}
        smsFailed={smsFailed}
        locale={locale}
        pick={pick}
      />

      {/* 3. Middle Section: Attendance Trend & Gender Ratio */}
      <AdminDashboardAttendanceGenderCharts
        attTrendData={attTrendData}
        presentRate={presentRate}
        presentToday={presentToday}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        genderData={genderData}
        totalStudentsCount={totalStudentsCount}
        maleCount={maleCount}
        femaleCount={femaleCount}
        activeYearName={activeYear?.name}
        locale={locale}
        pick={pick}
      />

      {/* 4. Secondary Analytics: Class Distribution & Subject Performance */}
      <AdminDashboardAcademicCharts
        classDistData={classDistData}
        subjectPerfData={subjectPerfData}
        passRateData={passRateData}
        locale={locale}
        pick={pick}
      />

      {/* 5. Student Directory Quick Preview Table */}
      <AdminDashboardStudentTable
        rows={studentTableRows}
        pick={pick}
      />

      {/* 6. Operational Widgets */}
      <AdminDashboardWidgets
        pendingActions={pendingActions}
        onDismissAction={(id) => setDismissedActions((prev) => [...prev, id])}
        notices={recentNoticePage?.items ?? []}
        noticesLoading={loadingRecentNotices}
        auditLogs={db.auditLogs}
        locale={locale}
        pick={pick}
      />
    </div>
  );
}
