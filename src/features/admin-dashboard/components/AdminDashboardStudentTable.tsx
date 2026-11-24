'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const COLOR_PRIMARY = '#1C6440';
const COLOR_BLUE = '#124B96';
const TINT_GREEN = '#DCEFE0';

export interface DashboardStudentRow {
  id: string;
  roll: string;
  studentId: string;
  nameBn: string;
  nameEn?: string;
  className: string;
  sectionName: string;
  guardianName: string;
  guardianPhone: string;
  rate: number;
  status: string;
  avatarBg: string;
  avatarText: string;
  initials: string;
}

interface AdminDashboardStudentTableProps {
  rows: DashboardStudentRow[];
  pick: (bn: string, en: string) => string;
}

export function AdminDashboardStudentTable({
  rows,
  pick,
}: AdminDashboardStudentTableProps) {
  return (
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
            {rows.map((st) => (
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
  );
}
