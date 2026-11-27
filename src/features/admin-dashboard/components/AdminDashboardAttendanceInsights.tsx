'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CalendarClock, ClipboardCheck } from 'lucide-react';

export interface ClassTodayAttendanceRow {
  className: string;
  total: number;
  present: number;
  absent: number;
  unmarked: number;
  rate: number | null;
}

export interface AtRiskStudentRow {
  id: string;
  nameBn: string;
  className: string;
  roll: number;
  rate: number;
  absentDays: number;
}

export interface UpcomingScheduleItem {
  id: string;
  dateLabel: string;
  title: string;
  type: 'HOLIDAY' | 'EVENT' | 'EXAM';
  link: string;
}

export function AdminDashboardAttendanceInsights({
  classAttendance,
  atRiskStudents,
  upcomingItems,
}: {
  classAttendance: ClassTodayAttendanceRow[];
  atRiskStudents: AtRiskStudentRow[];
  upcomingItems: UpcomingScheduleItem[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Class-wise Today Attendance Snapshot (5 cols) */}
      <div className="lg:col-span-5 bg-surface border border-border rounded-3xl p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-border">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#1C6440]" />
                {'শ্রেণিভিত্তিক আজকের হাজিরা'}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {'কোন শ্রেণিতে উপস্থিতি কত ও কোথায় হাজিরা বাকি'}
              </p>
            </div>
            <Link
              href="/admin/attendance/daily"
              className="text-sm font-semibold text-[#1C6440] hover:underline shrink-0"
            >
              {'বিস্তারিত'}
            </Link>
          </div>

          <div className="mt-4 space-y-3.5">
            {classAttendance.map((row) => (
              <div key={row.className} className="space-y-1.5">
                <div className="flex items-center justify-between text-base">
                  <span className="font-semibold text-foreground">{row.className}</span>
                  <div className="flex items-center gap-2 text-sm tabular-nums">
                    <span className="text-muted-foreground">
                      {row.present}/{row.total} জন
                    </span>
                    {row.unmarked > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-warning/15 text-warning">
                        {row.unmarked} অচিহ্নিত
                      </span>
                    ) : (
                      <span className="text-destructive font-medium">
                        {row.absent} অনুপস্থিত
                      </span>
                    )}
                    <strong className="text-[#1C6440] font-bold">
                      {row.rate !== null ? `${row.rate}%` : '—'}
                    </strong>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#1C6440] transition-all"
                    style={{ width: `${row.rate ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle: <75% At-Risk Students Alert (4 cols) */}
      <div className="lg:col-span-4 bg-surface border border-border rounded-3xl p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-border">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#DF6153]" />
                {'ঝুঁকিপূর্ণ উপস্থিতি (<৭৫%)'}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {'চলতি মাসে ৭৫%-এর কম উপস্থিত শিক্ষার্থী'}
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F4DAD5] text-[#DF6153]">
              {atRiskStudents.length} জন
            </span>
          </div>

          <div className="divide-y divide-border/60 mt-1">
            {atRiskStudents.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {'চলতি মাসে ৭৫%-এর কম উপস্থিত শিক্ষার্থী নেই'}
              </p>
            ) : (
              atRiskStudents.map((st) => (
                <div key={st.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-foreground truncate">{st.nameBn}</p>
                    <p className="text-sm text-muted-foreground">
                      {st.className} · রোল {st.roll} · {st.absentDays} দিন অনুপস্থিত
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-sm font-bold bg-[#F4DAD5] text-[#9E2F22] tabular-nums shrink-0">
                    {st.rate}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-3.5 border-t border-border mt-2">
          <Link
            href="/admin/attendance/reports"
            className="text-base font-semibold text-[#1C6440] hover:underline flex items-center justify-between"
          >
            <span>{'পূর্ণাঙ্গ ঝুঁকিপূর্ণ তালিকা দেখুন'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Right: Upcoming Events & Exam Routines (3 cols) */}
      <div className="lg:col-span-3 bg-surface border border-border rounded-3xl p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-border">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-[#124B96]" />
              {'আসন্ন সূচি'}
            </h3>
            <span className="text-sm text-muted-foreground">{'১৪ দিন'}</span>
          </div>

          <div className="divide-y divide-border/60 mt-1">
            {upcomingItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {'আগামী ১৪ দিনে কোনো ইভেন্ট বা পরীক্ষা নির্ধারিত নেই'}
              </p>
            ) : (
              upcomingItems.map((ev) => (
                <Link
                  key={ev.id}
                  href={ev.link}
                  className="py-3 flex flex-col gap-1 hover:bg-surface-muted/30 rounded-xl px-1 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground">{ev.dateLabel}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        ev.type === 'HOLIDAY'
                          ? 'bg-[#F4DAD5] text-[#9E2F22]'
                          : ev.type === 'EXAM'
                            ? 'bg-[#DCEAF8] text-[#124B96]'
                            : 'bg-[#DCEFE0] text-[#1C6440]'
                      }`}
                    >
                      {ev.type === 'HOLIDAY' ? 'ছুটি' : ev.type === 'EXAM' ? 'পরীক্ষা' : 'ইভেন্ট'}
                    </span>
                  </div>
                  <p className="text-base font-semibold text-foreground line-clamp-1">{ev.title}</p>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="pt-3.5 border-t border-border mt-2">
          <Link
            href="/admin/academic/events"
            className="text-base font-semibold text-[#124B96] hover:underline flex items-center justify-between"
          >
            <span>{'একাডেমিক ক্যালেন্ডার'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
