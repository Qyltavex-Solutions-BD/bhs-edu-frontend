'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, ClipboardCheck, FileSpreadsheet } from 'lucide-react';
import { formatNumber } from '@/src/lib/formatters';

interface AdminDashboardHeroProps {
  activeYearName?: string;
  eiin?: string;
  activeStudentsCount: number;
  presentRate: number;
  presentToday: number;
  pendingActionsCount: number;
  teachersCount: number;
  otherStaffCount: number;
  classesCount: number;
  locale: 'bn' | 'en';
  pick: (bn: string, en: string) => string;
}

export function AdminDashboardHero({
  activeYearName,
  eiin,
  activeStudentsCount,
  presentRate,
  presentToday,
  pendingActionsCount,
  teachersCount,
  otherStaffCount,
  classesCount,
  locale,
  pick,
}: AdminDashboardHeroProps) {
  return (
    <div className="relative rounded-3xl p-6 lg:p-8 bg-gradient-to-r from-[#175234] via-[#1C6440] to-[#123E27] text-white overflow-hidden shadow-lg border border-[#236b47]/40">
      {/* Background decorative concentric watermark rings & organic bubbles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-[48%] -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-gradient-to-tr from-[#2D8B59]/25 via-white/[0.04] to-transparent blur-2xl" />
        <div className="absolute top-[-20px] left-[52%] w-48 h-48 rounded-full border border-white/[0.08] bg-white/[0.02]" />
        <div className="absolute bottom-[-30px] left-[42%] w-56 h-56 rounded-full border border-white/[0.06] bg-white/[0.02]" />

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
                `সক্রিয় শিক্ষাবর্ষ: ${activeYearName ?? '2026'} · ভোজেশ্বর উচ্চ বিদ্যালয় (EIIN: ${eiin ?? '113587'})`,
                `Active Session: ${activeYearName ?? '2026'} · Bhojeshwar High School (EIIN: ${eiin ?? '113587'})`
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
                `${formatNumber(activeStudentsCount, locale)} শিক্ষার্থী সক্রিয় · আজকের উপস্থিতি ${presentRate}% (${formatNumber(presentToday, locale)} জন) · ${pendingActionsCount}টি প্রশাসনিক কাজ অপেক্ষমাণ`,
                `${formatNumber(activeStudentsCount, locale)} active students · ${presentRate}% attendance today · ${pendingActionsCount} items waiting for your approval`
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
                {formatNumber(activeStudentsCount, locale)}
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
                {formatNumber(teachersCount, locale)} / {formatNumber(otherStaffCount, locale)}
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
                {formatNumber(classesCount, locale)}
              </p>
            </div>
            <p className="text-sm font-bold text-[#96D0AB]">
              {pick('৬ষ্ঠ–১০ম শ্রেণি', 'Classes 6–10')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
