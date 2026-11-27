'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { formatNumber } from '@/src/lib/formatters';

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
}

export function AdminDashboardStudentTable({
  rows,
  
}: AdminDashboardStudentTableProps) {
  return (
    <div className="bg-surface border border-border rounded-3xl p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-foreground">
            {'শিক্ষার্থী ডিরেক্টরি সারসংক্ষেপ'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {'নির্বাচিত শিক্ষাবর্ষের ভর্তি শিক্ষার্থী, শ্রেণি ও শাখাভিত্তিক তালিকা এবং অভিভাবক যোগাযোগ'}
          </p>
        </div>
        <Link href="/admin/students">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-foreground/90 hover:text-foreground border border-border hover:bg-surface-muted transition cursor-pointer"
          >
            <span>{'সকল শিক্ষার্থী দেখুন'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-base">
          <thead>
            <tr className="border-b border-border/80 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="pb-3.5 font-semibold">{'রোল'}</th>
              <th className="pb-3.5 font-semibold">{'শিক্ষার্থী ও আইডি'}</th>
              <th className="pb-3.5 font-semibold">{'শ্রেণি ও শাখা'}</th>
              <th className="pb-3.5 font-semibold">{'উপস্থিতি'}</th>
              <th className="pb-3.5 font-semibold">{'অভিভাবক ও যোগাযোগ'}</th>
              <th className="pb-3.5 font-semibold text-right">{'অবস্থা'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((st) => (
              <tr key={st.id} className="hover:bg-surface-muted/40 transition-colors">
                <td className="py-4 font-medium text-foreground tabular-nums text-base">{st.roll}</td>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
                      style={{ backgroundColor: st.avatarBg, color: st.avatarText }}
                    >
                      {st.initials}
                    </div>
                    <div className="leading-tight">
                      <p className="font-semibold text-foreground text-base">{st.nameBn}</p>
                      <p className="text-sm text-muted-foreground font-mono mt-0.5">{st.studentId}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 font-normal text-foreground text-base">
                  {st.className} · {st.sectionName}
                </td>
                <td className="py-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-base tabular-nums">
                      <span className="font-semibold text-foreground">{formatNumber(st.rate, 'bn')}%</span>
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: TINT_GREEN, color: COLOR_PRIMARY }}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#1C6440]" />
                    {st.status === 'ACTIVE' ? 'সক্রিয়' : st.status}
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
