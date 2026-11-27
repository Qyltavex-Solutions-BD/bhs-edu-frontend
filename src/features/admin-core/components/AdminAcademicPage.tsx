'use client';

import React, { useState } from 'react';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import {
  AcademicFoundation,
  useAcademicYearSelection,
} from '@/src/views/admin/AcademicFoundation';
import { useGetAcademicYearsQuery } from '@/src/services/academic';
import { AcademicShell } from '@/src/views/admin/AcademicShell';
import { AcademicCalendar } from '@/src/views/admin/AcademicCalendar';
import { AcademicCurriculum } from '@/src/views/admin/AcademicCurriculum';
import { AcademicRoutine } from '@/src/views/admin/AcademicRoutine';
import { SyllabusPanel } from '@/src/features/academic/components/admin/SyllabusPanel';
import { AcademicStaffing } from '@/src/views/admin/AcademicStaffing';

type AcademicTab =
  | 'years'
  | 'groups'
  | 'classes'
  | 'sections'
  | 'subjects'
  | 'catalog'
  | 'books'
  | 'class-teachers'
  | 'assignments'
  | 'routines'
  | 'events'
  | 'documents';

const PAGE_COPY: Record<
  AcademicTab,
  { titleBn: string; titleEn: string; descBn: string; descEn: string; year: boolean }
> = {
  years: {
    titleBn: 'শিক্ষাবর্ষ',
    titleEn: 'Academic years',
    descBn: 'এক সময়ে একটি বছর চলতি সেশন। অন্য বছর খুলে আগের সেশনের তথ্য দেখা যায়।',
    descEn: 'One year is the current session. Open another year to review a previous session.',
    year: false,
  },
  groups: {
    titleBn: 'শ্রেণি ও শাখা (৬ষ্ঠ–১০ম)',
    titleEn: 'Classes & Sections (6–10)',
    descBn: '৬ষ্ঠ থেকে ১০ম শ্রেণি এবং ৯ম–১০ম শ্রেণির বিভাগসমূহ নির্ধারিত। প্রতিটি শ্রেণির শাখা এখান থেকেই পরিচালনা করুন।',
    descEn: 'Classes 6–10 and streams for 9–10 are fixed. Manage sections directly per class.',
    year: false,
  },
  classes: {
    titleBn: 'শ্রেণি ও শাখা (৬ষ্ঠ–১০ম)',
    titleEn: 'Classes & Sections (6–10)',
    descBn: '৬ষ্ঠ থেকে ১০ম শ্রেণি এবং ৯ম–১০ম শ্রেণির বিভাগসমূহ নির্ধারিত। প্রতিটি শ্রেণির শাখা এখান থেকেই পরিচালনা করুন।',
    descEn: 'Classes 6–10 and streams for 9–10 are fixed. Manage sections directly per class.',
    year: false,
  },
  sections: {
    titleBn: 'শ্রেণি ও শাখা (৬ষ্ঠ–১০ম)',
    titleEn: 'Classes & Sections (6–10)',
    descBn: '৬ষ্ঠ থেকে ১০ম শ্রেণি এবং ৯ম–১০ম শ্রেণির বিভাগসমূহ নির্ধারিত। প্রতিটি শ্রেণির শাখা এখান থেকেই পরিচালনা করুন।',
    descEn: 'Classes 6–10 and streams for 9–10 are fixed. Manage sections directly per class.',
    year: false,
  },
  catalog: {
    titleBn: 'বিষয় ও পাঠ্যবই',
    titleEn: 'Subjects & Books',
    descBn: 'এই শিক্ষাবর্ষে কোন শ্রেণি কোন বিষয় পড়বে ও পাঠ্যবই এক জায়গা থেকে পরিচালনা করুন।',
    descEn: 'Manage class subjects and textbooks for this academic year from one place.',
    year: true,
  },
  subjects: {
    titleBn: 'বিষয় ও পাঠ্যবই',
    titleEn: 'Subjects & Books',
    descBn: 'এই শিক্ষাবর্ষে কোন শ্রেণি কোন বিষয় পড়বে ও পাঠ্যবই এক জায়গা থেকে পরিচালনা করুন।',
    descEn: 'Manage class subjects and textbooks for this academic year from one place.',
    year: true,
  },
  books: {
    titleBn: 'বিষয় ও পাঠ্যবই',
    titleEn: 'Subjects & Books',
    descBn: 'এই শিক্ষাবর্ষে কোন শ্রেণি কোন বিষয় পড়বে ও পাঠ্যবই এক জায়গা থেকে পরিচালনা করুন।',
    descEn: 'Manage class subjects and textbooks for this academic year from one place.',
    year: true,
  },
  'class-teachers': {
    titleBn: 'শিক্ষক বণ্টন',
    titleEn: 'Teacher Allocation',
    descBn: 'একই জায়গা থেকে প্রতিটি শাখার শ্রেণি শিক্ষক ও বিষয় শিক্ষক নির্ধারণ করুন।',
    descEn: 'Assign class teachers and subject teachers for each section in one place.',
    year: true,
  },
  assignments: {
    titleBn: 'শিক্ষক বণ্টন',
    titleEn: 'Teacher Allocation',
    descBn: 'একই জায়গা থেকে প্রতিটি শাখার শ্রেণি শিক্ষক ও বিষয় শিক্ষক নির্ধারণ করুন।',
    descEn: 'Assign class teachers and subject teachers for each section in one place.',
    year: true,
  },
  routines: {
    titleBn: 'ক্লাস রুটিন',
    titleEn: 'Class timetable',
    descBn: 'পাবলিক রুটিনের মতো সাপ্তাহিক সময়সূচি। পিরিয়ড যোগ, সরানো ও মুছা যায়।',
    descEn: 'The weekly timetable, in the same layout as the public page.',
    year: true,
  },
  events: {
    titleBn: 'একাডেমিক ক্যালেন্ডার',
    titleEn: 'Academic calendar',
    descBn: 'ছুটি, অনুষ্ঠান ও ভর্তির তারিখ এই শিক্ষাবর্ষে থাকে।',
    descEn: 'Holidays, events, and admission dates for this academic year.',
    year: true,
  },
  documents: {
    titleBn: 'সিলেবাস',
    titleEn: 'Syllabus',
    descBn: 'অধ্যায়ের তালিকা ও অফিসিয়াল ফাইল। বিষয় এই বছরের পাঠ্যক্রম থেকে আসে।',
    descEn: 'Chapter lists and official files. Subjects come from this year’s curriculum.',
    year: true,
  },
};

export function AdminAcademicPage({
  defaultTab = 'years',
}: {
  defaultTab?: AcademicTab;
}) {
  const { data: yearList = [], isLoading: loadingYears } = useGetAcademicYearsQuery();
  const selectedYear = useAcademicYearSelection(yearList);
  const [tab] = useState(defaultTab);

  if (loadingYears) return <LoadingSkeleton />;

  return (
    <AcademicShell
      title={PAGE_COPY[tab].titleBn}
      description={PAGE_COPY[tab].descBn}
      years={yearList}
      selectedYear={selectedYear}
      showYear={PAGE_COPY[tab].year}
    >

      {(tab === 'years' || tab === 'groups' || tab === 'classes' || tab === 'sections') && (
        <AcademicFoundation tab={tab} />
      )}

      {tab === 'subjects' && selectedYear && <AcademicCurriculum year={selectedYear} section="curriculum" />}

      {tab === 'catalog' && selectedYear && <AcademicCurriculum year={selectedYear} section="catalog" />}

      {tab === 'books' && selectedYear && <AcademicCurriculum year={selectedYear} section="books" />}

      {tab === 'class-teachers' && selectedYear && (
        <AcademicStaffing mode="class-teachers" year={selectedYear} />
      )}

      {tab === 'assignments' && selectedYear && (
        <AcademicStaffing mode="assignments" year={selectedYear} />
      )}

      {tab === 'events' && selectedYear && <AcademicCalendar year={selectedYear} />}

      {tab === 'routines' && selectedYear && <AcademicRoutine year={selectedYear} />}

      {tab === 'documents' && selectedYear && <SyllabusPanel year={selectedYear} />}
    </AcademicShell>
  );
}

