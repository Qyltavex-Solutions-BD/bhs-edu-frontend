'use client';

import React, { useState } from 'react';
import { useGetAdminNoticesQuery } from '@/src/features/notices/api/notices.api';
import { useGetFinanceOverviewQuery } from '@/src/features/accountant/api/finance.api';
import { formatNumber } from '@/src/lib/formatters';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import {
  useGetDashboardAttendanceInsightsQuery,
  useGetDashboardAttendanceTrendQuery,
  useGetDashboardExamPerformanceQuery,
  useGetDashboardOperationsQuery,
  useGetDashboardOverviewQuery,
} from '../api/admin-dashboard.api';
import { AdminDashboardHero } from './AdminDashboardHero';
import { AdminDashboardKpiCards } from './AdminDashboardKpiCards';
import { AdminDashboardAttendanceGenderCharts } from './AdminDashboardAttendanceGenderCharts';
import { AdminDashboardAcademicCharts } from './AdminDashboardAcademicCharts';
import { AdminDashboardAttendanceInsights } from './AdminDashboardAttendanceInsights';
import { AdminDashboardFinanceOverview } from './AdminDashboardFinanceOverview';
import { AdminDashboardWidgets, type DashboardPendingAction } from './AdminDashboardWidgets';

const COLOR_PRIMARY = '#1C6440';
const COLOR_BLUE = '#124B96';
const TINT_GREEN = '#DCEFE0';
const TINT_BLUE = '#DCEAF8';
const TINT_CORAL = '#F4DAD5';

export function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [dismissedActions, setDismissedActions] = useState<string[]>([]);

  const { data: overview, isLoading: loadingOverview } = useGetDashboardOverviewQuery();
  const { data: trendData } = useGetDashboardAttendanceTrendQuery(timeRange);
  const { data: insightsData } = useGetDashboardAttendanceInsightsQuery();
  const { data: examPerf } = useGetDashboardExamPerformanceQuery(selectedExamId || undefined);
  const { data: opsData } = useGetDashboardOperationsQuery();
  const { data: financeOverview } = useGetFinanceOverviewQuery();
  const { data: recentNoticePage, isLoading: loadingRecentNotices } = useGetAdminNoticesQuery({
    limit: 5,
  });

  if (loadingOverview || !overview) return <LoadingSkeleton rows={8} />;

  const counts = opsData?.pendingCounts ?? {
    pendingAdmissions: 0,
    failedSms: 0,
    unpublishedExams: 0,
    studentsWithoutRfid: 0,
  };

  const pendingActions: DashboardPendingAction[] = [
    {
      id: 'act-adm',
      avatar: 'OA',
      avatarBg: TINT_GREEN,
      avatarText: COLOR_PRIMARY,
      title: 'অপেক্ষমাণ অনলাইন ভর্তি আবেদন',
      subtitle: `${formatNumber(counts.pendingAdmissions, 'bn')}টি আবেদন যাচাই বাকি`,
      link: '/admin/students/admissions',
    },
    {
      id: 'act-sms',
      avatar: 'SM',
      avatarBg: TINT_CORAL,
      avatarText: '#9E2F22',
      title: 'ব্যর্থ হাজিরা SMS পুনরায় প্রেরণ',
      subtitle: `${formatNumber(counts.failedSms, 'bn')}টি ব্যর্থ SMS রিট্রাই বাকি`,
      link: '/admin/attendance/sms-logs',
    },
    {
      id: 'act-exam',
      avatar: 'EX',
      avatarBg: TINT_BLUE,
      avatarText: COLOR_BLUE,
      title: 'অপ্রকাশিত পরীক্ষার ফলাফল',
      subtitle: `${formatNumber(counts.unpublishedExams, 'bn')}টি পরীক্ষা প্রকাশের অপেক্ষায়`,
      link: '/admin/results/publication',
    },
    {
      id: 'act-rfid',
      avatar: 'ID',
      avatarBg: TINT_BLUE,
      avatarText: COLOR_BLUE,
      title: 'RFID কার্ডবিহীন সক্রিয় শিক্ষার্থী',
      subtitle: `${formatNumber(counts.studentsWithoutRfid, 'bn')} জন শিক্ষার্থীর কার্ড ইস্যু বাকি`,
      link: '/admin/students/rfid-cards',
    },
  ].filter((a) => !dismissedActions.includes(a.id));

  const activeExamKey = selectedExamId || examPerf?.selectedExamId || '';

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-6">
      {/* 1. Hero Card */}
      <AdminDashboardHero
        activeYearName={overview.activeYearName}
        schoolName={overview.schoolName}
        eiin={overview.eiin}
        activeStudentsCount={overview.activeStudentsCount}
        presentRate={overview.presentRate}
        presentToday={overview.presentToday}
        pendingActionsCount={pendingActions.length}
        teachersCount={overview.teachersCount}
        otherStaffCount={overview.otherStaffCount}
        classesCount={overview.classesCount}
      />

      {/* 2. 4 Stat KPI Cards */}
      <AdminDashboardKpiCards
        activeStudentsCount={overview.activeStudentsCount}
        activeYearName={overview.activeYearName}
        classesCount={overview.classesCount}
        presentToday={overview.presentToday}
        todayAttTotal={overview.activeStudentsCount}
        presentRate={overview.presentRate}
        lateToday={overview.lateToday}
        absentToday={overview.absentToday}
        teachersCount={overview.teachersCount}
        otherStaffCount={overview.otherStaffCount}
        unpublishedExams={overview.unpublishedExams}
        smsSent={overview.smsSent}
        smsFailed={overview.smsFailed}
      />

      {/* 3. Attendance Trend (Day/Week/Month) & Gender Ratio */}
      <AdminDashboardAttendanceGenderCharts
        attTrendData={trendData?.items ?? []}
        presentRate={overview.presentRate}
        presentToday={overview.presentToday}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        genderData={[
          { name: 'ছাত্র', value: overview.gender.maleCount, color: COLOR_PRIMARY },
          { name: 'ছাত্রী', value: overview.gender.femaleCount, color: COLOR_BLUE },
        ]}
        totalStudentsCount={overview.gender.totalStudentsCount}
        maleCount={overview.gender.maleCount}
        femaleCount={overview.gender.femaleCount}
        activeYearName={overview.activeYearName}
      />

      {/* 4. Class Distribution & Dynamic Subject Performance */}
      <AdminDashboardAcademicCharts
        activeYearName={overview.activeYearName}
        classDistData={overview.classDistData}
        subjectPerfData={examPerf?.subjects ?? []}
        passRateData={
          examPerf && examPerf.passRate !== null
            ? [{ name: activeExamKey, passRate: examPerf.passRate }]
            : []
        }
        selectedExamKey={activeExamKey}
        onSelectExamKey={setSelectedExamId}
        examOptions={examPerf?.examOptions ?? []}
      />

      {/* 5. Finance Oversight Summary & 6-Month Chart */}
      <AdminDashboardFinanceOverview overview={financeOverview} />

      {/* 6. Class-wise Today Attendance, <75% At-Risk Students & Upcoming Schedule */}
      <AdminDashboardAttendanceInsights
        classAttendance={insightsData?.classAttendance ?? []}
        atRiskStudents={insightsData?.atRiskStudents ?? []}
        upcomingItems={insightsData?.upcomingItems ?? []}
      />

      {/* 6. Operational Widgets: Live Action Queue, Live Notices & Live Audit Logs */}
      <AdminDashboardWidgets
        pendingActions={pendingActions}
        onDismissAction={(id) => setDismissedActions((prev) => [...prev, id])}
        notices={recentNoticePage?.items ?? []}
        noticesLoading={loadingRecentNotices}
        auditLogs={opsData?.auditLogs ?? []}
      />
    </div>
  );
}
