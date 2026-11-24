'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from '@/src/lib/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  Layers,
  Library,
  MapPin,
  MonitorPlay,
  Printer,
  RotateCcw,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useGetBootstrapQuery } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatDateLong, formatNumber, formatTime12h } from '@/src/lib/formatters';
import {
  EmptyState,
  InstitutionalArtwork,
  LoadingSkeleton,
  PageHeader,
  SchoolEmblem,
} from '@/src/components/shared/Feedback';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { getTodayWeekDay, PERIOD_META } from '@/src/lib/classRoutine';
import { triggerPrint } from '@/src/lib/utils/cn';
import {
  AcademicDocumentType,
  AcademicEventType,
  ResourceType,
  SubjectCategory,
  WeekDay,
} from '@/src/types/enums';
import type { SyllabusExamTerm, SyllabusFile } from '@/src/types/entities';

/* ────────────────────────────────────────────────────────────────────────── *
 * Helpers & Authentic Institutional Document Content
 * ────────────────────────────────────────────────────────────────────────── */

function getWeekdayLabel(dateStr: string, locale: 'bn' | 'en'): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
    weekday: 'long',
  }).format(d);
}

function getMonthLabel(yearMonth: string, locale: 'bn' | 'en'): string {
  const [y, m] = yearMonth.split('-').map(Number);
  if (!y || !m) return yearMonth;
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
    month: 'long',
  }).format(d);
}

function getDurationDays(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return 1;
  return Math.round((e - s) / 86400000) + 1;
}

interface StructuredDocSection {
  headingBn: string;
  headingEn: string;
  pointsBn: string[];
  pointsEn: string[];
}

const STRUCTURED_DOC_SECTIONS: Record<AcademicDocumentType, StructuredDocSection[]> = {
  [AcademicDocumentType.CURRICULUM]: [
    {
      headingBn: '১. শ্রেণিভিত্তিক শিক্ষাক্রম কাঠামো (৬ষ্ঠ–১০ম)',
      headingEn: '1. Class-wise Curriculum Framework (Classes 6–10)',
      pointsBn: [
        'ষষ্ঠ থেকে অষ্টম শ্রেণি: বাংলা, ইংরেজি, গণিত, সাধারণ বিজ্ঞান, বাংলাদেশ ও বিশ্বপরিচয়, তথ্য ও যোগাযোগ প্রযুক্তি, ধর্ম ও নৈতিক শিক্ষা এবং কৃষি শিক্ষা (ঐচ্ছিক)।',
        'নবম ও দশম শ্রেণি (এসএসসি): সাধারণ আবশ্যিক বিষয়ের পাশাপাশি বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা বিভাগে বিভক্ত হয়ে বোর্ড নির্ধারিত পাঠ্যসূচি অনুসরণ।',
        'সকল শ্রেণিতে এনসিটিবি অনুমোদিত সরকারি পাঠ্যবই ও সৃজনশীল প্রশ্নপদ্ধতি অনুযায়ী পাঠদান পরিচালনা।',
      ],
      pointsEn: [
        'Classes 6–8: Bangla, English, Mathematics, General Science, Bangladesh & Global Studies, ICT, Religion & Moral Education, and Agriculture Studies.',
        'Classes 9–10 (SSC): Common compulsory subjects alongside three specialized streams — Science, Humanities, and Business Studies.',
        'All classes strictly follow NCTB-approved textbooks and secondary board assessment guidelines.',
      ],
    },
    {
      headingBn: '২. বার্ষিক মূল্যায়ন ও মানবণ্টন নীতিমালা',
      headingEn: '2. Annual Assessment & Marks Distribution',
      pointsBn: [
        'শিক্ষাবর্ষে দুটি প্রধান পরীক্ষা (অর্ধবার্ষিক ও বার্ষিক) এবং দশম শ্রেণির জন্য নির্বাচনি ও মডেল টেস্ট অনুষ্ঠিত হয়।',
        'তত্ত্বীয় (সৃজনশীল ও বহুনির্বাচনি) এবং বিজ্ঞান/আইসিটি বিষয়ের ব্যবহারিক অংশে পৃথকভাবে ন্যূনতম ৩৩% নম্বর অর্জন আবশ্যক।',
        'সমন্বিত চূড়ান্ত ফলাফলে অর্ধবার্ষিক পরীক্ষার ৩০% এবং বার্ষিক পরীক্ষার ৭০% গুরুত্ব বিবেচনা করা হয়।',
      ],
      pointsEn: [
        'Two major assessments (Half-Yearly and Annual) are conducted each academic year, plus Selection & Model Tests for SSC candidates.',
        'Students must achieve at least 33% separately in Written, MCQ, and Practical components where applicable.',
        'Consolidated final promotion combines 30% weightage from Half-Yearly and 70% from Annual examinations.',
      ],
    },
  ],
  [AcademicDocumentType.STUDENT_RULES]: [
    {
      headingBn: '১. উপস্থিতি ও সময়ানুবর্তিতা',
      headingEn: '1. Attendance & Punctuality',
      pointsBn: [
        'সকাল ৯:৪৫ ঘটিকার মধ্যে বিদ্যালয়ে উপস্থিত হয়ে প্রাত্যহিক সমাবেশে অংশগ্রহণ বাধ্যতামূলক।',
        'বার্ষিক পরীক্ষায় অংশগ্রহণের জন্য শিক্ষাবর্ষে ন্যূনতম ৮০% শ্রেণি উপস্থিতি নিশ্চিত করতে হবে।',
        'অসুস্থতা বা জরুরি কারণে অনুপস্থিত থাকলে অভিভাবকের স্বাক্ষরিত ছুটির আবেদনপত্র শ্রেণিশিক্ষকের নিকট জমা দিতে হবে।',
      ],
      pointsEn: [
        'Students must arrive by 9:45 AM and participate in the daily morning assembly.',
        'A minimum of 80% classroom attendance across the academic year is mandatory to sit for annual examinations.',
        'In case of illness or unavoidable absence, a guardian-signed leave application must be submitted to the class teacher.',
      ],
    },
    {
      headingBn: '২. শ্রেণিকক্ষ, ল্যাব ও পরীক্ষার শৃঙ্খলা',
      headingEn: '2. Classroom, Laboratory & Examination Discipline',
      pointsBn: [
        'বিদ্যালয় প্রাঙ্গণে মোবাইল ফোন বা অননুমোদিত ইলেকট্রনিক ডিভাইস বহন সম্পূর্ণ নিষিদ্ধ।',
        'বিজ্ঞান গবেষণাগার, কম্পিউটার ল্যাব ও গ্রন্থাগারের আসবাবপত্র ও যন্ত্রপাতি যত্নসহকারে ব্যবহার করতে হবে।',
        'পরীক্ষা হলে অসদুপায় অবলম্বন করলে সংশ্লিষ্ট বিষয়ের পরীক্ষা বাতিলসহ প্রাতিষ্ঠানিক শাস্তিমূলক ব্যবস্থা গ্রহণ করা হবে।',
      ],
      pointsEn: [
        'Mobile phones and unauthorized electronic gadgets are strictly prohibited on campus.',
        'Laboratory apparatus, ICT equipment, and library books must be handled responsibly.',
        'Any unfair means in examinations will lead to cancellation of the paper and disciplinary action.',
      ],
    },
  ],
  [AcademicDocumentType.PARENT_GUIDELINES]: [
    {
      headingBn: '১. ডিজিটাল হাজিরা ও এসএমএস পর্যবেক্ষণ',
      headingEn: '1. Digital Attendance & SMS Alert Monitoring',
      pointsBn: [
        'দশম শ্রেণির শিক্ষার্থীদের RFID কার্ড পাঞ্চ এবং সকল শ্রেণির অনুপস্থিতির তথ্য স্বয়ংক্রিয়ভাবে নিবন্ধিত অভিভাবক নম্বরে এসএমএস পাঠানো হয়।',
        'মোবাইল নম্বর পরিবর্তিত হলে দ্রুত বিদ্যালয় অফিসে যোগাযোগ করে তথ্য হালনাগাদ করার অনুরোধ করা হচ্ছে।',
        'অভিভাবক পোর্টালে লগইন করে সন্তানের মাসিক উপস্থিতি, পরীক্ষার মার্কশিট ও নোটিশ যেকোনো সময় দেখা যাবে।',
      ],
      pointsEn: [
        'Automated SMS notifications are sent to registered guardian numbers for Class 10 RFID entry/exit and all-class absences.',
        'Please notify the school office promptly if your registered mobile number changes.',
        'Guardians can log in to the Parent Portal anytime to review attendance records, marksheets, and school notices.',
      ],
    },
    {
      headingBn: '২. অভিভাবক-শিক্ষক সমন্বয়',
      headingEn: '2. Parent-Teacher Collaboration',
      pointsBn: [
        'অর্ধবার্ষিক ও বার্ষিক ফলাফল প্রকাশের পর নির্ধারিত অভিভাবক সমাবেশে উপস্থিত থাকা একান্ত কাম্য।',
        'বাড়িতে নিয়মিত পাঠাভ্যাস নিশ্চিতকরণ ও টিফিন/বিশ্রামের সুষম রুটিন বজায় রাখতে শিক্ষকদের সাথে যোগাযোগ রাখুন।',
      ],
      pointsEn: [
        'Guardians are encouraged to attend parent-teacher meetings following Half-Yearly and Annual result publication.',
        'Maintain regular communication with the class teacher to support consistent study habits at home.',
      ],
    },
  ],
  [AcademicDocumentType.DRESS_CODE]: [
    {
      headingBn: '১. ছাত্রদের নির্ধারিত পোশাক',
      headingEn: '1. Uniform Specification for Boys',
      pointsBn: [
        'সাদা রঙের হাফ/ফুল হাতা শার্ট (বাম পকেটে বিদ্যালয়ের মনোগ্রামযুক্ত ব্যাজ)।',
        'নেভি ব্লু রঙের ফুল প্যান্ট এবং কালো বেল্ট।',
        'কালো রঙের জুতা ও সাদা মোজা (শীতকালে নেভি ব্লু সোয়েটার/জ্যাকেট)।',
      ],
      pointsEn: [
        'White half-sleeve or full-sleeve shirt with the official school monogram badge on the left pocket.',
        'Navy blue full trousers with a plain black belt.',
        'Clean black shoes with white socks (navy blue sweater/jacket during winter).',
      ],
    },
    {
      headingBn: '২. ছাত্রীদের নির্ধারিত পোশাক ও আইডি কার্ড',
      headingEn: '2. Uniform Specification for Girls & ID Card',
      pointsBn: [
        'নেভি ব্লু রঙের কামিজ, সাদা সালোয়ার এবং সাদা ওড়না/স্কার্ফ।',
        'সাদা কেডস/কালো জুতা, সাদা মোজা এবং পরিচ্ছন্নভাবে বাঁধা চুল।',
        'সকল ছাত্র-ছাত্রীর জন্য গলায় বিদ্যালয়ের নির্ধারিত আইডি কার্ড পরিধান বাধ্যতামূলক।',
      ],
      pointsEn: [
        'Navy blue kameez with white salwar and white orna/scarf.',
        'White keds or black shoes with white socks and neatly tied hair.',
        'Wearing the official school ID card lanyard is mandatory for every student on campus.',
      ],
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────── *
 * 1. Academics Overview Page (`/academics`)
 * ────────────────────────────────────────────────────────────────────────── */

export function AcademicsOverviewPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const publishedSyllabusFiles = db.syllabusFiles.filter((f) => f.isPublished).length;
  const publishedResources = db.digitalResources.filter((r) => r.isPublished).length;
  const scheduledExamDays = db.examRoutines.filter((r) => !r.isDeleted).length;

  const modules = [
    {
      to: '/academics/classes',
      icon: GraduationCap,
      titleBn: 'শ্রেণি ও শাখা (৬ষ্ঠ–১০ম)',
      titleEn: 'Classes & Sections (6–10)',
      descBn: 'প্রতিটি শ্রেণির শাখা, শ্রেণিশিক্ষক, বিভাগ ও নির্ধারিত বিষয়সমূহ।',
      descEn: 'Sections, class teachers, streams, and configured subjects per class.',
      meta: pick(
        `${formatNumber(db.classes.length, 'bn')}টি শ্রেণি · ${formatNumber(db.sections.length, 'bn')}টি শাখা`,
        `${db.classes.length} Classes · ${db.sections.length} Sections`
      ),
    },
    {
      to: '/academics/subjects',
      icon: Layers,
      titleBn: 'বিষয়সমূহ ও বোর্ড কোড',
      titleEn: 'Subjects & Board Codes',
      descBn: 'এনসিটিবি অনুমোদিত বাধ্যতামূলক, বিভাগভিত্তিক ও ঐচ্ছিক বিষয়ের তালিকা।',
      descEn: 'NCTB compulsory, stream-specific, and optional subject catalog.',
      meta: pick(`${formatNumber(db.subjects.length, 'bn')}টি পাঠ্যবিষয়`, `${db.subjects.length} Subjects`),
    },
    {
      to: '/academics/syllabus',
      icon: FileText,
      titleBn: 'সিলেবাস ও বিদ্যালয় নীতিমালা',
      titleEn: 'Syllabus & School Policies',
      descBn: 'শ্রেণি ও পরীক্ষাভিত্তিক অধ্যায়-তালিকা, অফিসিয়াল পিডিএফ ডাউনলোড ও আচরণবিধি।',
      descEn: 'Class & exam chapter syllabus, official PDF downloads, and school rules.',
      meta: pick(
        `${formatNumber(publishedSyllabusFiles, 'bn')}টি সিলেবাস ফাইল`,
        `${publishedSyllabusFiles} Syllabus Files`
      ),
    },
    {
      to: '/academics/routines',
      icon: Clock,
      titleBn: 'সাপ্তাহিক ক্লাস রুটিন',
      titleEn: 'Weekly Class Routines',
      descBn: 'শ্রেণি ও শাখাভিত্তিক রবি–বৃহস্পতিবারের পূর্ণাঙ্গ পাঠদানের সময়সূচি।',
      descEn: 'Sunday–Thursday timetable by class, section, teacher, and classroom.',
      meta: pick(`${formatNumber(db.classRoutines.length, 'bn')}টি পিরিয়ড স্লট`, `${db.classRoutines.length} Routine Slots`),
    },
    {
      to: '/academics/examination',
      icon: ShieldCheck,
      titleBn: 'পরীক্ষা ও গ্রেডিং নীতিমালা',
      titleEn: 'Examinations & Grading',
      descBn: 'পরীক্ষার রুটিন, হল নির্দেশিকা, পাস নীতি ও ৫.০০ গ্রেডিং স্কেল।',
      descEn: 'Exam timetable, hall rules, pass criteria, and 5.00 GPA grading scale.',
      meta: pick(`${formatNumber(scheduledExamDays, 'bn')}টি নির্ধারিত পরীক্ষা`, `${scheduledExamDays} Scheduled Exams`),
    },
    {
      to: '/academics/academic-calendar',
      icon: Calendar,
      titleBn: 'একাডেমিক ক্যালেন্ডার ২০২৬',
      titleEn: 'Academic Calendar 2026',
      descBn: 'শিক্ষাবর্ষের সরকারি ছুটি, পরীক্ষা, ফলাফল ও ভর্তি কার্যক্রমের সময়সূচি।',
      descEn: 'Annual holidays, examinations, result days, and admission milestones.',
      meta: pick(`${formatNumber(db.academicEvents.length, 'bn')}টি বার্ষিক সূচি`, `${db.academicEvents.length} Annual Events`),
    },
    {
      to: '/academics/resources',
      icon: MonitorPlay,
      titleBn: 'ডিজিটাল শিক্ষা রিসোর্স',
      titleEn: 'Digital Education Resources',
      descBn: 'স্মার্ট ক্লাসরুম, আইসিটি ল্যাব এবং শ্রেণিভিত্তিক ডিজিটাল পাঠসামগ্রী।',
      descEn: 'Smart classrooms, ICT lab facilities, and curated multimedia lessons.',
      meta: pick(`${formatNumber(publishedResources, 'bn')}টি ডিজিটাল পাঠ`, `${publishedResources} Resources`),
    },
    {
      to: '/academics/library',
      icon: Library,
      titleBn: 'বিদ্যালয় গ্রন্থাগার',
      titleEn: 'School Library',
      descBn: 'পাঠকক্ষের সময়সূচি, অনুসন্ধানযোগ্য বইয়ের তালিকা ও পাঠ্যবই বিতরণ।',
      descEn: 'Reading room schedule, searchable book catalog, and textbook distributions.',
      meta: pick(`${formatNumber(db.libraryBooks.length, 'bn')}টি তালিকাভুক্ত বই`, `${db.libraryBooks.length} Catalog Books`),
    },
  ];

  const stats = [
    {
      label: pick('শ্রেণি কার্যক্রম', 'Academic Classes'),
      value: pick('৬ষ্ঠ – ১০ম', 'Classes 6–10'),
      sub: pick(`${formatNumber(db.sections.length, 'bn')}টি সক্রিয় শাখা`, `${db.sections.length} Active Sections`),
    },
    {
      label: pick('বোর্ড অনুমোদিত বিষয়', 'NCTB Subjects'),
      value: formatNumber(db.subjects.length, locale),
      sub: pick(`${formatNumber(db.books.length, 'bn')}টি নির্ধারিত পাঠ্যবই`, `${db.books.length} Configured Textbooks`),
    },
    {
      label: pick('মাধ্যমিক বিভাগ', 'SSC Streams'),
      value: formatNumber(db.academicGroups.length, locale),
      sub: pick('বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা', 'Science, Humanities & Business'),
    },
    {
      label: pick('ডিজিটাল ও ল্যাব সুবিধা', 'Smart Rooms & Labs'),
      value: formatNumber(db.digitalClassrooms.length + 1, locale),
      sub: pick('স্মার্ট ক্লাসরুম, আইসিটি ও বিজ্ঞান ল্যাব', 'Smart Room, ICT & Science Labs'),
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Editorial Split Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-border pb-10">
        <div className="lg:col-span-7 space-y-5">
          <p className="text-sm font-semibold text-primary tracking-wide">
            {pick('একাডেমিক কার্যক্রম · শিক্ষাবর্ষ ২০২৬', 'Academic Programs · Session 2026')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
            {pick(
              'ষষ্ঠ থেকে দশম শ্রেণির সুসংগঠিত মাধ্যমিক শিক্ষা কাঠামো',
              'Structured Secondary Education from Class 6 to Class 10'
            )}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
            {pick(
              'ভোজেশ্বর উচ্চ বিদ্যালয়ে জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (এনসিটিবি) অনুসৃত পাঠ্যসূচি, নিয়মিত শ্রেণি মূল্যায়ন, আধুনিক বিজ্ঞান ও কম্পিউটার গবেষণাগার এবং ডিজিটাল উপস্থিতি ব্যবস্থার মাধ্যমে প্রতিটি শিক্ষার্থীর মানসম্মত শিক্ষা নিশ্চিত করা হয়।',
              'Bhojeshwar High School delivers NCTB-aligned secondary education across Classes 6–10 with structured timetables, laboratory practicals, smart classrooms, and transparent assessment.'
            )}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link href="/academics/classes">
              <Button variant="primary">
                {pick('শ্রেণি ও শাখা দেখুন', 'Explore Classes')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/academics/routines">
              <Button variant="outline">{pick('সাপ্তাহিক রুটিন', 'Class Routines')}</Button>
            </Link>
            <Link href="/results">
              <Button variant="outline">{pick('অনলাইন ফলাফল', 'Search Results')}</Button>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5">
          <InstitutionalArtwork
            variant="digital-classroom"
            className="h-64 sm:h-80 w-full border border-border"
            title={pick('মাল্টিমিডিয়া স্মার্ট শ্রেণিকক্ষ ও নিয়মিত পাঠদান', 'Multimedia Smart Classroom & Active Learning')}
            subtitle={pick('ভোজেশ্বর উচ্চ বিদ্যালয় · স্থাপিত ১৯৭৮ · EIIN ১১৩৫৮৭', 'Bhojeshwar High School · Est. 1978 · EIIN 113587')}
          />
        </div>
      </section>

      {/* Academic Summary Metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5 space-y-1.5">
            <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
            <p className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </Card>
        ))}
      </section>

      {/* Secondary Streams (Classes 9–10) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {pick('মাধ্যমিক স্তরের বিভাগসমূহ (৯ম ও ১০ম শ্রেণি)', 'Secondary Academic Streams (Classes 9–10)')}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {pick(
                '৬ষ্ঠ থেকে ৮ম শ্রেণিতে সমন্বিত ভিত্তি শিক্ষার পর ৯ম শ্রেণিতে শিক্ষার্থীরা তিনটি বিভাগে ভর্তি হতে পারে।',
                'After a common foundation in Classes 6–8, students specialize in one of three secondary streams from Class 9.'
              )}
            </p>
          </div>
          <Link href="/academics/classes/cls-9" className="text-sm font-semibold text-primary hover:underline whitespace-nowrap">
            {pick('৯ম শ্রেণির বিষয়বিন্যাস দেখুন →', 'View Class 9 Subject Matrix →')}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {db.academicGroups.map((grp) => {
            const grpSubjects = db.classSubjects.filter(
              (cs) => cs.classId === 'cls-10' && cs.academicYearId === 'ay-2026' && cs.groupId === grp.id
            );
            return (
              <Card key={grp.id} className="p-5 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-foreground">
                      {locale === 'bn' ? grp.nameBn : grp.name}
                    </h3>
                    <span className="text-xs font-medium text-primary tabular-nums">
                      {pick(
                        `${formatNumber(grpSubjects.length, 'bn')}টি বিভাগীয় বিষয়`,
                        `${grpSubjects.length} Stream Subjects`
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{grp.description}</p>
                </div>
                <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>{pick('আবশ্যিক + বিভাগীয় + ঐচ্ছিক', 'Compulsory + Stream + Optional')}</span>
                  <Link href="/academics/classes/cls-10" className="font-semibold text-primary hover:underline">
                    {pick('বিস্তারিত', 'Details')}
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Complete Academic Modules Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {pick('একাডেমিক সেবা ও তথ্যভাণ্ডার', 'Academic Services & Directory')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {pick(
              'শ্রেণি, বিষয়, রুটিন, পরীক্ষা, ক্যালেন্ডার এবং পাঠাগার সংক্রান্ত সকল তথ্য এক স্থানে।',
              'Access classes, subjects, timetables, exams, calendar, resources, and library records.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.to} href={m.to} className="group block h-full">
                <Card className="p-5 h-full flex flex-col justify-between hover:border-primary/50 transition-colors space-y-4">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-[var(--radius)] bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {pick(m.titleBn, m.titleEn)}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {pick(m.descBn, m.descEn)}
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium tabular-nums">{m.meta}</span>
                    <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Direct Result Verification Strip */}
      <Card className="p-6 bg-surface-muted/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-[var(--radius)] bg-primary text-white flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {pick('বোর্ড স্টাইল অনলাইন ফলাফল ও প্রিন্টযোগ্য মার্কশিট', 'Board-Style Online Results & Printable Marksheet')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {pick(
                'লগইন ছাড়াই শ্রেণি ও রোল নম্বর বা শিক্ষার্থী আইডি দিয়ে প্রকাশিত পরীক্ষার পূর্ণাঙ্গ মার্কশিট যাচাই ও প্রিন্ট করুন।',
                'Verify and print published examination marksheets by class, roll number, or student ID without login.'
              )}
            </p>
          </div>
        </div>
        <Link href="/results" className="shrink-0">
          <Button variant="primary" className="whitespace-nowrap">
            {pick('ফলাফল অনুসন্ধান করুন', 'Search Results')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </Card>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── *
 * 2. Classes & Sections Directory (`/academics/classes`)
 * ────────────────────────────────────────────────────────────────────────── */

