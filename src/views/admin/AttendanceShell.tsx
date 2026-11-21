'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppDispatch } from '@/src/store/hooks';
import { setSelectedAcademicYear } from '@/src/store/slices/uiSlice';
import { useI18n } from '@/src/lib/i18n';
import { PageHeader } from '@/src/components/shared/Feedback';
import { Select } from '@/src/components/ui/primitives';
import { cn } from '@/src/lib/utils/cn';
import type { AcademicYear } from '@/src/types/entities';

const GROUPS = [
  {
    labelBn: 'দৈনিক',
    labelEn: 'Daily',
    items: [
      { href: '/admin/attendance/daily', labelBn: 'রেজিস্টার', labelEn: 'Register' },
      { href: '/admin/attendance/gate', labelBn: 'গেট', labelEn: 'Gate' },
    ],
  },
  {
    labelBn: 'নজর',
    labelEn: 'Review',
    items: [
      { href: '/admin/attendance/reports', labelBn: 'রিপোর্ট', labelEn: 'Report' },
      { href: '/admin/attendance/sms-logs', labelBn: 'এসএমএস', labelEn: 'SMS' },
    ],
  },
  {
    labelBn: 'নিয়ম',
    labelEn: 'Rules',
    items: [{ href: '/admin/attendance/settings', labelBn: 'পদ্ধতি', labelEn: 'Method' }],
  },
];

export function AttendanceShell({
  title,
  description,
  years,
  selectedYear,
  showYear,
  children,
}: {
  title: string;
  description?: string;
  years: AcademicYear[];
  selectedYear?: AcademicYear;
  showYear?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { pick } = useI18n();

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <nav className="w-full lg:w-52 shrink-0 lg:sticky lg:top-4" aria-label={pick('হাজিরা মেনু', 'Attendance menu')}>
        <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible pb-1">
          {GROUPS.map((group) => (
            <div key={group.labelEn} className="min-w-max lg:min-w-0">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {pick(group.labelBn, group.labelEn)}
              </p>
              <div className="mt-1 flex lg:flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'px-3 py-2 rounded-md text-sm whitespace-nowrap',
                        active ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-surface-muted'
                      )}
                    >
                      {pick(item.labelBn, item.labelEn)}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
      <div className="flex-1 min-w-0 w-full space-y-5">
        <PageHeader title={title} description={description} />
        {showYear && selectedYear && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-surface-muted/40 px-4 py-3">
            <p className="text-sm text-foreground">{pick('এই শিক্ষাবর্ষের ভর্তিতে হাজিরা।', 'Attendance uses enrollments from this year.')}</p>
            <Select
              value={selectedYear.id}
              onChange={(event) => dispatch(setSelectedAcademicYear(event.target.value))}
              className="min-w-44"
              aria-label={pick('শিক্ষাবর্ষ', 'Academic year')}
            >
              {years.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                  {year.isActive ? pick(' · চলতি', ' · Current') : ''}
                </option>
              ))}
            </Select>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
