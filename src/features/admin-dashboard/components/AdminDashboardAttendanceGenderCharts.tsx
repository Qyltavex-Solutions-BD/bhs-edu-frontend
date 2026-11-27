'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { formatNumber } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils/cn';

const COLOR_PRIMARY = '#1C6440';
const TINT_GREEN = '#DCEFE0';

interface AdminDashboardAttendanceGenderChartsProps {
  attTrendData: { date: string; present: number; late: number; absent: number }[];
  presentRate: number;
  presentToday: number;
  timeRange: 'day' | 'week' | 'month';
  setTimeRange: (r: 'day' | 'week' | 'month') => void;
  genderData: { name: string; value: number; color: string }[];
  totalStudentsCount: number;
  maleCount: number;
  femaleCount: number;
  activeYearName?: string;
}

export function AdminDashboardAttendanceGenderCharts({
  attTrendData,
  presentRate,
  presentToday,
  timeRange,
  setTimeRange,
  genderData,
  totalStudentsCount,
  maleCount,
  femaleCount,
  activeYearName,
  
  
}: AdminDashboardAttendanceGenderChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Card: Daily Attendance Trend (AreaChart) */}
      <div className="lg:col-span-8 bg-surface border border-border rounded-3xl p-6 shadow-xs flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              {'দৈনিক হাজিরা প্রবণতা (সাম্প্রতিক ১০ কর্মদিবস)'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {'উপস্থিত, বিলম্বিত ও অনুপস্থিত শিক্ষার্থীর সংখ্যা'}
            </p>
          </div>

          {/* Time Toggle Control */}
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
                {r === 'day' ? 'দিন' : r === 'week' ? 'সপ্তাহ' : 'মাস'}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Highlight */}
        <div className="flex items-center gap-3 my-3">
          <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums">
            {formatNumber(presentRate, 'bn')}% {'গড় উপস্থিতি'}
          </span>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: TINT_GREEN, color: COLOR_PRIMARY }}
          >
            ↑ ৪.৮% {'বিগত মাসের তুলনায়'}
          </span>
        </div>

        {/* Area Chart with Gradient & Tooltip */}
        <div className="h-64 sm:h-72 w-full mt-2 relative">
          <div className="absolute right-[8%] top-[20%] z-10 hidden sm:flex flex-col items-center pointer-events-none">
            <div className="bg-[#1C6440] text-white text-sm font-bold px-3.5 py-2 rounded-xl shadow-md border border-white/20 text-center leading-tight">
              <span className="text-sm text-white/90 block font-normal mb-0.5">
                {'আজকের উপস্থিতি'}
              </span>
              {formatNumber(presentToday, 'bn')} {'জন উপস্থিত'}
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
                          {`তারিখ: ${data.date}`}
                        </p>
                        <p className="font-semibold text-[#1C6440]">
                          {`উপস্থিত: ${data.present} জন`}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {`বিলম্ব: ${data.late} · অনুপস্থিত: ${data.absent}`}
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
              {'ছাত্র-ছাত্রী অনুপাত'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {`শিক্ষাবর্ষ ${activeYearName ?? '2026'}`}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-sm font-medium text-muted-foreground bg-[#F4F6F4] border border-[#E0E7E2] tabular-nums">
            {formatNumber(totalStudentsCount, 'bn')} {'মোট'}
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
                {formatNumber(totalStudentsCount, 'bn')}
              </span>
              <span className="text-sm text-muted-foreground font-medium">
                {'শিক্ষার্থী'}
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
                    <span className="font-medium text-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold text-foreground tabular-nums text-base">
                    {formatNumber(item.value, 'bn')} ({formatNumber(pct, 'bn')}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-between text-base text-muted-foreground">
          <span className="font-normal">{'ছাত্র ও ছাত্রী অনুপাত:'}</span>
          <div className="flex items-center gap-2 font-semibold">
            <span className="text-[#1C6440]">
              {'ছাত্র'}: {formatNumber(Math.round((maleCount / (totalStudentsCount || 1)) * 100), 'bn')}%
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-[#124B96]">
              {'ছাত্রী'}: {formatNumber(Math.round((femaleCount / (totalStudentsCount || 1)) * 100), 'bn')}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
