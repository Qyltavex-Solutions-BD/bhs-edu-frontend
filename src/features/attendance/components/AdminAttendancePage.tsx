'use client';

import React from 'react';
import { useGetBootstrapQuery } from '@/src/store/api';
import { useAcademicYearSelection } from '@/src/views/admin/AcademicFoundation';
import { useI18n } from '@/src/lib/i18n';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { AttendanceShell } from './AttendanceShell';
import { DailyRegister } from './DailyRegister';
import { GateMonitor } from './GateMonitor';
import { AttendanceReports } from './AttendanceReports';
import { AttendanceSmsLogs } from './AttendanceSmsLogs';
import { AttendanceSettings } from './AttendanceSettings';

export function AdminAttendancePage({
  defaultTab = 'daily',
}: {
  defaultTab?: 'daily' | 'reports' | 'sms' | 'settings' | 'gate';
}) {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  const year = useAcademicYearSelection(db?.academicYears);

  if (isLoading || !db || !year) return <LoadingSkeleton />;

  const copy = {
    daily: {
      title: pick('দৈনিক হাজিরা রেজিস্টার', 'Daily Attendance Register'),
      description: pick(
        'তারিখ, শ্রেণি ও শাখা অনুযায়ী দৈনিক হাজিরা গ্রহণ, সংশোধন এবং বিদ্যালয়ব্যাপী অগ্রগতি পর্যবেক্ষণ।',
        'Record daily section attendance, track school-wide completion, and dispatch absent guardian alerts.'
      ),
    },
    gate: {
      title: pick('RFID গেট মনিটর', 'RFID Gate Monitor'),
      description: pick(
        'সক্রিয় RFID কার্ডে প্রবেশ-প্রস্থান স্ক্যান, প্রবেশ বাকি শিক্ষার্থীদের তালিকা এবং লাইভ গেট ফিড।',
        'Live RFID card entry/exit scanning, pending student tracking, and end-of-morning roll closure.'
      ),
    },
    reports: {
      title: pick('মাসিক উপস্থিতি রিপোর্ট', 'Monthly Attendance Report'),
      description: pick(
        'শাখাভিত্তিক বিস্তারিত পরিসংখ্যান, শ্রেণিভিত্তিক সারসংক্ষেপ এবং ৭৫%-এর নিচে ঝুঁকিপূর্ণ শিক্ষার্থী শনাক্তকরণ।',
        'Monthly section register breakdown, school-wide class summary, and <75% attendance risk tracking.'
      ),
    },
    sms: {
      title: pick('হাজিরা এসএমএস লগ', 'Attendance SMS Logs'),
      description: pick(
        'অভিভাবকদের কাছে প্রেরিত অনুপস্থিতি ও গেট নোটিফিকেশন ইতিহাস; ব্যর্থ বার্তা এক ক্লিকে পুনরায় পাঠান।',
        'Audit guardian absent and gate alerts with filtering and single or batch retry for failed deliveries.'
      ),
    },
    settings: {
      title: pick('হাজিরা পদ্ধতি ও নিয়ম', 'Attendance Method & Rules'),
      description: pick(
        'শ্রেণিভেদে হাতে বা RFID পদ্ধতি, কার্ড প্রস্তুতি, দেরির সময়সীমা এবং স্বয়ংক্রিয় SMS ট্রিগার নির্ধারণ।',
        'Configure manual vs RFID attendance, verify card coverage, late cutoffs, and automated SMS rules.'
      ),
    },
  }[defaultTab];

  return (
    <AttendanceShell
      title={copy.title}
      description={copy.description}
      years={db.academicYears}
      selectedYear={year}
      showYear={defaultTab !== 'sms'}
    >
      {defaultTab === 'daily' && <DailyRegister db={db} yearId={year.id} />}
      {defaultTab === 'gate' && <GateMonitor db={db} yearId={year.id} />}
      {defaultTab === 'reports' && <AttendanceReports db={db} yearId={year.id} />}
      {defaultTab === 'sms' && <AttendanceSmsLogs db={db} />}
      {defaultTab === 'settings' && <AttendanceSettings db={db} yearId={year.id} />}
    </AttendanceShell>
  );
}
