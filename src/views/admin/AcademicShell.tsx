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

type NavItem = {
  href: string;
  labelBn: string;
  labelEn: string;
};

const GROUPS: { labelBn: string; labelEn: string; items: NavItem[] }[] = [
  {
    labelBn: 'সেশন',
    labelEn: 'Session',
    items: [{ href: '/admin/academic/years', labelBn: 'শিক্ষাবর্ষ', labelEn: 'Academic years' }],
  },
  {
    labelBn: 'কাঠামো',
    labelEn: 'Structure',
    items: [
      { href: '/admin/academic/groups', labelBn: 'বিভাগ', labelEn: 'Streams' },
      { href: '/admin/academic/classes', labelBn: 'শ্রেণি', labelEn: 'Classes' },
      { href: '/admin/academic/sections', labelBn: 'শাখা', labelEn: 'Sections' },
    ],
  },
  {
    labelBn: 'পাঠ্যক্রম',
    labelEn: 'Curriculum',
    items: [
      { href: '/admin/academic/subjects', labelBn: 'বিষয় তালিকা', labelEn: 'Subject catalog' },
      { href: '/admin/academic/class-subjects', labelBn: 'শ্রেণির বিষয়', labelEn: 'Class subjects' },
      { href: '/admin/academic/books', labelBn: 'পাঠ্যবই', labelEn: 'Textbooks' },
    ],
  },
  {
    labelBn: 'শিক্ষক',
    labelEn: 'Teachers',
    items: [
      { href: '/admin/academic/class-teachers', labelBn: 'শ্রেণি শিক্ষক', labelEn: 'Class teachers' },
      { href: '/admin/academic/teacher-assignments', labelBn: 'বিষয় শিক্ষক', labelEn: 'Subject teachers' },
    ],
  },
  {
    labelBn: 'সময়সূচি',
    labelEn: 'Schedule',
    items: [
      { href: '/admin/academic/class-routines', labelBn: 'ক্লাস রুটিন', labelEn: 'Timetable' },
      { href: '/admin/academic/events', labelBn: 'ক্যালেন্ডার', labelEn: 'Calendar' },
    ],
  },
  {
    labelBn: 'পাঠদান',
    labelEn: 'Learning',
    items: [
      { href: '/admin/academic/documents', labelBn: 'সিলেবাস', labelEn: 'Syllabus' },
      { href: '/admin/academic/policies', labelBn: 'নীতিমালা', labelEn: 'Policies' },
    ],
  },
];

export function AcademicShell({
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
      <nav className="w-full lg:w-52 shrink-0 lg:sticky lg:top-4" aria-label={pick('একাডেমিক মেনু', 'Academic menu')}>
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
                        active
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-foreground hover:bg-surface-muted'
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
                  ? pick('এটি চলতি সেশন।', 'This is the current session.')
                  : pick('এটি চলতি সেশন নয়। দেখা ও সম্পাদনা এই বছরের জন্য।', 'This is not the current session. Edits stay on this year.')}
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
