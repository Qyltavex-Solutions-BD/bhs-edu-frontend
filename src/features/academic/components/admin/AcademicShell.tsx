'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppDispatch } from '@/src/store/hooks';
import { setSelectedAcademicYear } from '@/src/store/slices/uiSlice';
import { PageHeader } from '@/src/components/shared/Feedback';
import { Select } from '@/src/components/ui/primitives';
import { cn } from '@/src/lib/utils/cn';
import type { AcademicYear } from '@/src/types/entities';

type SubLink = { href: string; labelBn: string; labelEn: string };

const SUB_TAB_GROUPS: SubLink[][] = [
  [
    { href: '/admin/academic/documents', labelBn: 'সিলেবাস (PDF)', labelEn: 'Syllabus' },
    { href: '/admin/academic/events', labelBn: 'একাডেমিক ক্যালেন্ডার', labelEn: 'Academic Calendar' },
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
  const activeGroup = SUB_TAB_GROUPS.find((group) =>
    group.some((item) => item.href === pathname)
  );

  const yearSelect =
    showYear && selectedYear ? (
      <Select
        value={selectedYear.id}
        onChange={(event) => dispatch(setSelectedAcademicYear(event.target.value))}
        className="w-auto min-w-44 h-10 text-base font-semibold"
        aria-label={'শিক্ষাবর্ষ'}
      >
        {years.map((year) => (
          <option key={year.id} value={year.id}>
            {year.name}
            {year.isActive ? ' · চলতি' : ''}
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
                  'px-4 py-2.5 text-base font-medium border-b-2 whitespace-nowrap transition-colors',
                  active
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {item.labelBn}
              </Link>
            );
          })}
        </div>
      )}

      {children}
    </div>
  );
}
