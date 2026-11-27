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

const COLOR_PRIMARY = '#1C6440';
const COLOR_BLUE = '#124B96';

interface AdminDashboardAcademicChartsProps {
  classDistData: { name: string; students: number }[];
  subjectPerfData: { subject: string; avgPct: number }[];
  passRateData: { name: string; passRate: number }[];
}

export function AdminDashboardAcademicCharts({
  classDistData,
  subjectPerfData,
  passRateData,
  
}: AdminDashboardAcademicChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Class-wise Student Distribution BarChart */}
      <div className="bg-surface border border-border rounded-3xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-foreground">
            {'শ্রেণিভিত্তিক শিক্ষার্থী বণ্টন (২০২৬)'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {'ষষ্ঠ থেকে দশম শ্রেণিতে মোট নিবন্ধিত শিক্ষার্থী'}
          </p>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#88998F' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: '#88998F' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar
                dataKey="students"
                name={'শিক্ষার্থী'}
                fill={COLOR_PRIMARY}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Average Score & Pass Rate */}
      <div className="bg-surface border border-border rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-foreground">
            {'বিষয়ভিত্তিক গড় নম্বর (%) — অর্ধবার্ষিক ২০২৬ (১০ম)'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {'পরীক্ষায় বিভিন্ন বিষয়ের গড় প্রাপ্ত নম্বর হার'}
          </p>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectPerfData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.7} />
              <XAxis dataKey="subject" tick={{ fontSize: 13, fill: '#88998F' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 13, fill: '#88998F' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar
                dataKey="avgPct"
                name={'গড় %'}
                fill={COLOR_BLUE}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {passRateData.length > 0 && (
          <div className="pt-3 border-t border-border flex items-center justify-between text-base text-muted-foreground">
            <span>{'সর্বশেষ পরীক্ষার পাসের হার:'}</span>
            <strong className="text-[#1C6440] font-bold text-base tabular-nums">
              {passRateData[0].passRate}%
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}
