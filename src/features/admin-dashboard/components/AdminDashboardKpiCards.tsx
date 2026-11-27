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
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: TINT_GREEN, color: COLOR_PRIMARY }}
          >
            ↑ ৮.২%
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums">
              {formatNumber(activeStudentsCount, 'bn')}
            </p>
            <p className="text-base text-foreground font-semibold mt-1">
              {'মোট সক্রিয় শিক্ষার্থী'}
            </p>
            <p className="text-sm font-normal text-muted-foreground mt-0.5">
              {`৫টি শ্রেণি (৬ষ্ঠ–১০ম) · শিক্ষাবর্ষ ${activeYearName ?? formatNumber(2026, 'bn')}`}
            </p>
          </div>
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
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: TINT_BLUE, color: COLOR_BLUE }}
          >
            {formatNumber(presentRate, 'bn')}% {'হার'}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
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
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: TINT_GREEN, color: COLOR_PRIMARY }}
          >
            ১০০% {'সক্রিয়'}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
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
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: TINT_CORAL, color: '#9E2F22' }}
          >
            {formatNumber(unpublishedExams, 'bn')} {'অপ্রকাশিত'}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
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
  );
}
