'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Wallet } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button, Card } from '@/src/components/ui/primitives';
import { formatTaka } from '@/src/features/accountant/components/finance-ui';
import type { FinanceOverviewResponse } from '@/src/features/accountant/api/finance.api';

export function AdminDashboardFinanceOverview({
  overview,
}: {
  overview?: FinanceOverviewResponse;
}) {
  const chartData = useMemo(
    () =>
      (overview?.monthlyTrend ?? []).map((item) => ({
        name: item.month,
        আয়: item.income,
        ব্যয়: item.expense,
      })),
    [overview?.monthlyTrend]
  );

  if (!overview) return null;

  return (
    <Card className="p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            {'আর্থিক সারসংক্ষেপ ও ৬ মাসের আয়-ব্যয় (অ্যাকাউন্টস বিভাগ)'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {'হিসাবরক্ষণ বিভাগ থেকে লাইভ ফি আদায়, বকেয়া, ব্যয় ও বেতনের তুলনামূলক চিত্র'}
          </p>
        </div>
        <Link href="/admin/finance">
          <Button variant="outline" size="sm">
            {'বিস্তারিত অর্থ ও হিসাব'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-muted/30 p-3.5">
          <p className="text-xs text-muted-foreground">{'আজকের ফি আদায়'}</p>
          <p className="text-lg font-bold text-primary tabular-nums mt-1">
            {formatTaka(overview.todayCollection)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-3.5">
          <p className="text-xs text-muted-foreground">{'চলতি মাসের মোট আয়'}</p>
          <p className="text-lg font-bold text-success tabular-nums mt-1">
            {formatTaka(overview.monthCollection)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-3.5">
          <p className="text-xs text-muted-foreground">{'চলতি মাসের ব্যয় ও বেতন'}</p>
          <p className="text-lg font-bold text-destructive tabular-nums mt-1">
            {formatTaka(overview.monthOutflow)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-3.5">
          <p className="text-xs text-muted-foreground">{'মোট বকেয়া ফি'}</p>
          <p className="text-lg font-bold text-warning tabular-nums mt-1">
            {formatTaka(overview.totalDue)}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          {'বিগত ৬ মাসের আয় বনাম ব্যয় তুলনা'}
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="আয়" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ব্যয়" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
