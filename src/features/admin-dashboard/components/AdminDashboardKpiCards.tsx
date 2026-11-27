'use client';

import React from 'react';
import { GraduationCap, ClipboardCheck, UserCheck, CheckCircle2 } from 'lucide-react';
import { formatNumber } from '@/src/lib/formatters';

const COLOR_PRIMARY = '#1C6440';
const COLOR_BLUE = '#124B96';
const COLOR_CORAL = '#DF6153';
const TINT_GREEN = '#DCEFE0';
const TINT_BLUE = '#DCEAF8';
const TINT_CORAL = '#F4DAD5';

interface AdminDashboardKpiCardsProps {
  activeStudentsCount: number;
  activeYearName?: string;
  classesCount: number;
  presentToday: number;
  todayAttTotal: number;
  presentRate: number;
  lateToday: number;
  absentToday: number;
  teachersCount: number;
  otherStaffCount: number;
  unpublishedExams: number;
  smsSent: number;
  smsFailed: number;
}

export function AdminDashboardKpiCards({
  activeStudentsCount,
  activeYearName,
  classesCount,
  presentToday,
  todayAttTotal,
  presentRate,
  lateToday,
  absentToday,
  teachersCount,
  otherStaffCount,
  unpublishedExams,
  smsSent,
  smsFailed,
}: AdminDashboardKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Active Students */}
      <div className="bg-surface border border-border rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(28,100,64,0.06)] hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: TINT_GREEN, color: COLOR_PRIMARY }}
          >
            <GraduationCap className="w-5.5 h-5.5" />
          </div>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: TINT_GREEN, color: COLOR_PRIMARY }}
          >
            {`${formatNumber(classesCount, 'bn')} শ্রেণি`}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums">
            {formatNumber(activeStudentsCount, 'bn')}
          </p>
          <p className="text-base text-foreground font-semibold mt-1">
            {'মোট সক্রিয় শিক্ষার্থী'}
          </p>
          <p className="text-sm font-normal text-muted-foreground mt-0.5">
            {`শিক্ষাবর্ষ ${activeYearName ?? '—'}`}
          </p>
        </div>
      </div>

      {/* Card 2: Today's Attendance */}
      <div className="bg-surface border border-border rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(28,100,64,0.06)] hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: TINT_BLUE, color: COLOR_BLUE }}
          >
            <ClipboardCheck className="w-5.5 h-5.5" />
          </div>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: TINT_BLUE, color: COLOR_BLUE }}
          >
            {formatNumber(presentRate, 'bn')}% {'হার'}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums">
            {formatNumber(presentToday, 'bn')} / {formatNumber(todayAttTotal, 'bn')}
          </p>
          <p className="text-base text-foreground font-semibold mt-1">
            {'আজকের উপস্থিতি'}
          </p>
          <p className="text-sm font-normal text-muted-foreground mt-0.5">
            {`বিলম্ব: ${formatNumber(lateToday, 'bn')} · অনুপস্থিত: ${formatNumber(absentToday, 'bn')}`}
          </p>
        </div>
      </div>

      {/* Card 3: Teachers & Staff */}
      <div className="bg-surface border border-border rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(28,100,64,0.06)] hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: TINT_GREEN, color: COLOR_PRIMARY }}
          >
            <UserCheck className="w-5.5 h-5.5" />
          </div>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: TINT_GREEN, color: COLOR_PRIMARY }}
          >
            {`মোট ${formatNumber(teachersCount + otherStaffCount, 'bn')} জন`}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums">
            {formatNumber(teachersCount, 'bn')} / {formatNumber(otherStaffCount, 'bn')}
          </p>
          <p className="text-base text-foreground font-semibold mt-1">
            {'শিক্ষক ও কর্মচারী'}
          </p>
          <p className="text-sm font-normal text-muted-foreground mt-0.5">
            {'শিক্ষক / কর্মকর্তা-কর্মচারী'}
          </p>
        </div>
      </div>

      {/* Card 4: Unpublished Exams & SMS */}
      <div className="bg-surface border border-border rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(28,100,64,0.06)] hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: TINT_CORAL, color: COLOR_CORAL }}
          >
            <CheckCircle2 className="w-5.5 h-5.5" />
          </div>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: TINT_CORAL, color: '#9E2F22' }}
          >
            {formatNumber(unpublishedExams, 'bn')} {'অপ্রকাশিত'}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums">
            {formatNumber(unpublishedExams, 'bn')}
          </p>
          <p className="text-base text-foreground font-semibold mt-1">
            {'অপ্রকাশিত পরীক্ষা ও SMS'}
          </p>
          <p className="text-sm font-normal text-muted-foreground mt-0.5">
            {`SMS প্রেরিত: ${formatNumber(smsSent, 'bn')} · ব্যর্থ: ${formatNumber(smsFailed, 'bn')}`}
          </p>
        </div>
      </div>
    </div>
  );
}
