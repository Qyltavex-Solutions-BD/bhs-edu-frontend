'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { setSelectedAcademicYear } from '@/src/store/slices/uiSlice';
import { useI18n } from '@/src/lib/i18n';
import { Card, FormField, Select } from '@/src/components/ui';
import type { AcademicYear } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';

import { YearsPanel } from './panels/YearsPanel';
import { GroupsPanel } from './panels/GroupsPanel';
import { ClassesPanel } from './panels/ClassesPanel';
import { SectionsPanel } from './panels/SectionsPanel';

export type FoundationTab = 'years' | 'groups' | 'classes' | 'sections';

export { YearsPanel, GroupsPanel, ClassesPanel, SectionsPanel };

export function useAcademicYearSelection(years: AcademicYear[] | undefined) {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((state) => state.ui.selectedAcademicYearId);
  const resolved =
    years?.find((year) => year.id === selectedId) ??
    years?.find((year) => year.isActive) ??
    years?.[0];

  useEffect(() => {
    if (!years?.length || !resolved) return;
    if (selectedId && years.some((year) => year.id === selectedId)) return;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem('bhs_academic_year');
    } catch {
      stored = null;
    }
    const storedYear = stored ? years.find((year) => year.id === stored) : undefined;
    dispatch(setSelectedAcademicYear(storedYear?.id ?? resolved.id));
  }, [dispatch, resolved, selectedId, years]);

  return resolved;
}

export function AcademicYearBar({
  years,
  selected,
}: {
  years: AcademicYear[];
  selected?: AcademicYear;
}) {
  const dispatch = useAppDispatch();
  const { pick } = useI18n();
  if (!selected) return null;

  return (
    <Card className="p-4 flex flex-wrap items-end justify-between gap-3">
      <FormField label={pick('যে শিক্ষাবর্ষ নিয়ে কাজ করছেন', 'Academic year in view')}>
        <Select
          value={selected.id}
          onChange={(event) => dispatch(setSelectedAcademicYear(event.target.value))}
          className="min-w-52"
        >
          {years.map((year) => (
            <option key={year.id} value={year.id}>
              {year.name}
              {year.isActive ? pick(' · সক্রিয়', ' · Active') : ''}
            </option>
          ))}
        </Select>
      </FormField>
      <p className="text-sm text-muted-foreground pb-2">
        {pick(
          'রুটিন, বিষয় বণ্টন ও শিক্ষক তালিকা এই বছর অনুযায়ী দেখাবে। সক্রিয় বছর আলাদা — সেটাই চলতি সেশন।',
          'Routines, subject maps, and teacher lists follow this year. The active year is the current session.'
        )}
      </p>
    </Card>
  );
}

export function AcademicFoundation({
  tab,
  db,
}: {
  tab: FoundationTab;
  db?: MockDatabase;
}) {
  if (tab === 'years') return <YearsPanel years={db?.academicYears} />;
  if (tab === 'groups') return <GroupsPanel groups={db?.academicGroups} />;
  if (tab === 'classes') return <ClassesPanel db={db} />;
  return <SectionsPanel db={db} />;
}
