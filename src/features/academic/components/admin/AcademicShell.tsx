'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
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
    { href: '/admin/academic/teacher-assignments', labelBn: 'বিষয় শিক্ষক বণ্টন', labelEn: 'Subject Teachers' },
    { href: '/admin/academic/class-teachers', labelBn: 'শ্রেণি শিক্ষক', labelEn: 'Class Teachers' },
  ],
  [
    { href: '/admin/academic/documents', labelBn: 'সিলেবাস (PDF)', labelEn: 'Syllabus' },
    { href: '/admin/academic/events', labelBn: 'একাডেমিক ক্যালেন্ডার', labelEn: 'Academic Calendar' },
  ],
];

const WORKFLOW_STEPS = [
  {
    step: 1,
    href: '/admin/academic/years',
    match: ['/admin/academic/years'],
    labelBn: '১. শিক্ষাবর্ষ',
    labelEn: '1. Academic Year',
  },
  {
    step: 2,
    href: '/admin/academic/classes',
    match: ['/admin/academic/classes', '/admin/academic/sections', '/admin/academic/groups'],
    labelBn: '২. শ্রেণি ও শাখা',
    labelEn: '2. Classes & Sections',
  },
  {
    step: 3,
    href: '/admin/academic/class-subjects',
    match: ['/admin/academic/class-subjects', '/admin/academic/subjects', '/admin/academic/books'],
    labelBn: '৩. বিষয় ও বই',
    labelEn: '3. Subjects & Books',
  },
  {
    step: 4,
    href: '/admin/academic/teacher-assignments',
    match: ['/admin/academic/teacher-assignments', '/admin/academic/class-teachers'],
    labelBn: '৪. শিক্ষক বণ্টন',
    labelEn: '4. Teachers',
  },
  {
    step: 5,
    href: '/admin/academic/class-routines',
    match: ['/admin/academic/class-routines'],
    labelBn: '৫. ক্লাস রুটিন',
    labelEn: '5. Class Routine',
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

  const activeGroup = SUB_TAB_GROUPS.find((group) =>
    group.some((item) => item.href === pathname)
  );

  const currentStepIdx = WORKFLOW_STEPS.findIndex((s) => s.match.includes(pathname));
  const nextStep =
    currentStepIdx >= 0 && currentStepIdx < WORKFLOW_STEPS.length - 1
      ? WORKFLOW_STEPS[currentStepIdx + 1]
      : null;

  const yearSelect =
    showYear && selectedYear ? (
      <Select
        value={selectedYear.id}
        onChange={(event) => dispatch(setSelectedAcademicYear(event.target.value))}
        className="w-auto min-w-44 h-10 text-base font-semibold"
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

      {/* Guided Academic Setup Flow Bar */}
      {currentStepIdx >= 0 && (
        <div className="bg-surface border border-border rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
            {WORKFLOW_STEPS.map((step, idx) => {
              const isCurrent = idx === currentStepIdx;
              const isDone = idx < currentStepIdx;
              return (
                <React.Fragment key={step.href}>
                  <Link
                    href={step.href}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                      isCurrent
                        ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                        : isDone
                          ? 'bg-primary/10 text-primary hover:bg-primary/15'
                          : 'text-muted-foreground hover:text-foreground hover:bg-surface-muted'
                    )}
                  >
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    <span>{pick(step.labelBn, step.labelEn)}</span>
                  </Link>
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 hidden sm:block" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {nextStep && (
            <Link
              href={nextStep.href}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline px-2 whitespace-nowrap ml-auto"
            >
              <span>{pick(`পরবর্তী: ${nextStep.labelBn}`, `Next: ${nextStep.labelEn}`)}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

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
