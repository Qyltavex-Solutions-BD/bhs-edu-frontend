'use client';

import React from 'react';
import { useAcademicYearSelection } from '@/src/views/admin/AcademicFoundation';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import {
  useGetAttendanceAcademicYearsQuery,
  useGetAttendanceClassesQuery,
  useGetAttendanceSectionsQuery,
} from '../api/attendance.api';
import { AttendanceShell } from './AttendanceShell';
import { DailyRegister } from './DailyRegister';
import { AttendanceReports } from './AttendanceReports';
import { AttendanceSmsLogs } from './AttendanceSmsLogs';
import { AttendanceSettings } from './AttendanceSettings';

export function AdminAttendancePage({
  defaultTab = 'daily',
}: {
  defaultTab?: 'daily' | 'reports' | 'sms' | 'settings';
}) {
  const { data: years = [], isLoading: loadingYears } = useGetAttendanceAcademicYearsQuery();
  const { data: classes = [], isLoading: loadingClasses } = useGetAttendanceClassesQuery();
  const { data: sections = [], isLoading: loadingSections } = useGetAttendanceSectionsQuery();
  const year = useAcademicYearSelection(years);

  if (loadingYears || loadingClasses || loadingSections || !year) {
    return <LoadingSkeleton />;
  }

  const copy = {
    daily: {
      title: 'দৈনিক হাজিরা ও গেট',
      description: 'RFID গেট পাঞ্চের অটোমেটেড হাজিরা, ডিভাইস ত্রুটিতে ম্যানুয়াল ওভাররাইড এবং লাইভ গেট ফিড।',
    },
    reports: {
      title: 'মাসিক উপস্থিতি রিপোর্ট',
      description: 'শাখাভিত্তিক বিস্তারিত পরিসংখ্যান, শ্রেণিভিত্তিক সারসংক্ষেপ এবং ৭৫%-এর নিচে ঝুঁকিপূর্ণ শিক্ষার্থী শনাক্তকরণ।',
    },
    sms: {
      title: 'হাজিরা এসএমএস লগ',
      description: 'অভিভাবকদের কাছে প্রেরিত অনুপস্থিতি নোটিফিকেশন ইতিহাস; ব্যর্থ বার্তা এক ক্লিকে পুনরায় পাঠান।',
    },
    settings: {
      title: 'হাজিরা নিয়ম ও সময়সীমা',
      description: 'দেরির সময়সীমা, RFID কার্ড প্রস্তুতি এবং অনুপস্থিতিতে স্বয়ংক্রিয় SMS নিয়ম নির্ধারণ।',
    },
  }[defaultTab];

  return (
    <AttendanceShell
      title={copy.title}
      description={copy.description}
      years={years}
      selectedYear={year}
      showYear={defaultTab === 'daily' || defaultTab === 'reports' || defaultTab === 'settings'}
    >
      {defaultTab === 'daily' && (
        <DailyRegister yearId={year.id} classes={classes} sections={sections} />
      )}
      {defaultTab === 'reports' && (
        <AttendanceReports yearId={year.id} classes={classes} sections={sections} />
      )}
      {defaultTab === 'sms' && <AttendanceSmsLogs />}
      {defaultTab === 'settings' && <AttendanceSettings yearId={year.id} />}
    </AttendanceShell>
  );
}
