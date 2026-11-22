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

type SubLink = { href: string; labelBn: string; labelEn: string };

const SUB_TAB_GROUPS: SubLink[][] = [
  [
    { href: '/admin/academic/classes', labelBn: 'শ্রেণি', labelEn: 'Classes' },
    { href: '/admin/academic/sections', labelBn: 'শাখা', labelEn: 'Sections' },
    { href: '/admin/academic/groups', labelBn: 'বিভাগ (Streams)', labelEn: 'Streams' },
  ],
  [
    { href: '/admin/academic/class-subjects', labelBn: 'শ্রেণির বিষয়', labelEn: 'Class Subjects' },
    { href: '/admin/academic/subjects', labelBn: 'বিষয় তালিকা', labelEn: 'Subject Catalog' },
    { href: '/admin/academic/books', labelBn: 'পাঠ্যবই', labelEn: 'Textbooks' },
  ],
  [
    { href: '/admin/academic/teacher-assignments', labelBn: 'বিষয় শিক্ষক', labelEn: 'Subject Teachers' },
    { href: '/admin/academic/class-teachers', labelBn: 'শ্রেণিশিক্ষক', labelEn: 'Class Teachers' },
  ],
  [
    { href: '/admin/academic/documents', labelBn: 'সিলেবাস', labelEn: 'Syllabus' },
    { href: '/admin/academic/policies', labelBn: 'নীতিমালা', labelEn: 'Policies' },
  ],
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

  const activeGroup = SUB_TAB_GROUPS.find((group) =>
    group.some((item) => item.href === pathname)
  );

  const yearSelect =
    showYear && selectedYear ? (
      <Select
        value={selectedYear.id}
        onChange={(event) => dispatch(setSelectedAcademicYear(event.target.value))}
        className="w-auto min-w-44 h-9 text-sm"
        aria-label={pick('শিক্ষাবর্ষ', 'Academic year')}
      >
        {years.map((year) => (
          <option key={year.id} value={year.id}>
            {year.name}
            {year.isActive ? pick(' · চলতি', ' · Current') : ''}
          </option>
        ))}
      </Select>
    ) : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        description={description}
        actions={
          yearSelect || actions ? (
            <>
              {yearSelect}
              {actions}
            </>
          ) : undefined
        }
      />

      {activeGroup && (
        <div className="border-b border-border flex items-center gap-1 overflow-x-auto no-print">
          {activeGroup.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3.5 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
                  active
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {pick(item.labelBn, item.labelEn)}
              </Link>
            );
          })}
        </div>
      )}

      {children}
    </div>
  );
}
