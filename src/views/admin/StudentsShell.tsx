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

type NavItem = { href: string; labelBn: string; labelEn: string };

const GROUPS: { labelBn: string; labelEn: string; items: NavItem[] }[] = [
  {
    labelBn: 'তালিকা',
    labelEn: 'Records',
    items: [{ href: '/admin/students', labelBn: 'ডিরেক্টরি', labelEn: 'Directory' }],
  },
  {
    labelBn: 'ভর্তি',
    labelEn: 'Admission',
    items: [
      { href: '/admin/students/create', labelBn: 'নতুন ভর্তি', labelEn: 'New admission' },
      { href: '/admin/students/admissions', labelBn: 'অনলাইন আবেদন', labelEn: 'Applications' },
      { href: '/admin/students/import', labelBn: 'CSV আমদানি', labelEn: 'CSV import' },
    ],
  },
  {
    labelBn: 'সেশন',
    labelEn: 'Session',
    items: [{ href: '/admin/students/enrollments', labelBn: 'এনরোলমেন্ট', labelEn: 'Enrollments' }],
  },
  {
    labelBn: 'উত্তরণ',
    labelEn: 'Movement',
    items: [
      { href: '/admin/students/promotions', labelBn: 'প্রমোশন', labelEn: 'Promotion' },
      { href: '/admin/students/transfers', labelBn: 'ছাড়পত্র', labelEn: 'Transfer certificates' },
    ],
  },
  {
    labelBn: 'পরিচয়',
    labelEn: 'Identity',
    items: [{ href: '/admin/students/rfid-cards', labelBn: 'পরিচয়পত্র', labelEn: 'ID cards' }],
  },
];

export function StudentsShell({
  title,
  description,
  actions,
  years,
  selectedYear,
  showYear,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
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
      <nav className="w-full lg:w-52 shrink-0 lg:sticky lg:top-4" aria-label={pick('শিক্ষার্থী মেনু', 'Student menu')}>
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
        <PageHeader title={title} description={description} actions={actions} />
        {showYear && selectedYear && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-surface-muted/40 px-4 py-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{pick('কাজের শিক্ষাবর্ষ', 'Working year')}</p>
              <p className="text-sm text-foreground">
                {selectedYear.isActive
                  ? pick('তালিকা ও ভর্তি এই সেশনের।', 'Lists and admissions use this session.')
                  : pick('এটি চলতি সেশন নয়। এই বছরের রেকর্ড দেখা যাচ্ছে।', 'This is not the current session. Records shown are for this year.')}
              </p>
            </div>
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
