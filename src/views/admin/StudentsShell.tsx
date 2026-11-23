'use client';

import React from 'react';
import { useAppDispatch } from '@/src/store/hooks';
import { setSelectedAcademicYear } from '@/src/store/slices/uiSlice';
import { useI18n } from '@/src/lib/i18n';
import { PageHeader } from '@/src/components/shared/Feedback';
import { Select } from '@/src/components/ui/primitives';
import type { AcademicYear } from '@/src/types/entities';

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
  const dispatch = useAppDispatch();
  const { pick } = useI18n();
  const yearSelect = showYear && selectedYear ? (
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
      <PageHeader title={title} description={description} actions={<>{yearSelect}{actions}</>} />
      {children}
    </div>
  );
}
