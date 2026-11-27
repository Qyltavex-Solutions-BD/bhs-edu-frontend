'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Select } from '@/src/components/ui/primitives';

const COLOR_PRIMARY = '#1C6440';
const COLOR_BLUE = '#124B96';

interface AdminDashboardAcademicChartsProps {
  activeYearName?: string;
  classDistData: { name: string; students: number }[];
  subjectPerfData: { subject: string; avgPct: number }[];
  passRateData: { name: string; passRate: number }[];
  selectedExamKey: string;
  onSelectExamKey: (val: string) => void;
  examOptions: Array<{ key: string; label: string }>;
}

export function AdminDashboardAcademicCharts({
  activeYearName,
  classDistData,
  subjectPerfData,
  passRateData,
  selectedExamKey,
  onSelectExamKey,
  examOptions,
}: AdminDashboardAcademicChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Class-wise Student Distribution BarChart */}
      <div className="bg-surface border border-border rounded-3xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-foreground">
            {`শ্রেণিভিত্তিক শিক্ষার্থী বণ্টন (${activeYearName ?? '—'})`}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {'ষষ্ঠ থেকে দশম শ্রেণিতে মোট নিবন্ধিত শিক্ষার্থী'}
          </p>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 13, fill: '#88998F' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 13, fill: '#88998F' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Bar dataKey="students" name={'শিক্ষার্থী'} fill={COLOR_PRIMARY} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Average Score & Pass Rate with Interactive Exam/Class Selector */}
      <div className="bg-surface border border-border rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              {'বিষয়ভিত্তিক গড় নম্বর (%)'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {'শ্রেণি ও পরীক্ষা অনুযায়ী বিষয়ের গড় প্রাপ্ত নম্বর'}
            </p>
          </div>
          <Select
            value={selectedExamKey}
            onChange={(e) => onSelectExamKey(e.target.value)}
            className="w-full sm:w-52 text-sm"
          >
            {examOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="h-56 w-full">
          {subjectPerfData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
              {'নির্বাচিত পরীক্ষার বিষয়ভিত্তিক ফলাফল এখনো প্রকাশিত/প্রক্রিয়াকৃত হয়নি'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectPerfData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.7} />
                <XAxis
                  dataKey="subject"
                  tick={{ fontSize: 13, fill: '#88998F' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 13, fill: '#88998F' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Bar dataKey="avgPct" name={'গড় %'} fill={COLOR_BLUE} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {passRateData.length > 0 && (
          <div className="pt-3 border-t border-border flex items-center justify-between text-base text-muted-foreground">
            <span>{'নির্বাচিত পরীক্ষার সামগ্রিক পাসের হার:'}</span>
            <strong className="text-[#1C6440] font-bold text-base tabular-nums">
              {passRateData[0].passRate}%
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}
