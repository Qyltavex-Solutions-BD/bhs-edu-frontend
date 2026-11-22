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

export function PublicClassesPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <PageHeader
        title={pick('শ্রেণি ও শাখাসমূহ (৬ষ্ঠ–১০ম)', 'Classes & Sections (6–10)')}
        description={pick(
          'প্রতিটি শ্রেণির সক্রিয় শাখা, দায়িত্বপ্রাপ্ত শ্রেণিশিক্ষক, নির্ধারিত বিষয় ও পাঠ্যপুস্তকের তথ্য দেখুন।',
          'Browse active sections, assigned class teachers, configured subjects, and textbooks for every class.'
        )}
        actions={
          <>
            <Link href="/academics/routines">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <Clock className="w-4 h-4" /> {pick('ক্লাস রুটিন', 'Class Routines')}
              </Button>
            </Link>
            <Link href="/academics/subjects">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <Layers className="w-4 h-4" /> {pick('সকল বিষয়', 'All Subjects')}
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {db.classes.map((cls) => {
          const secs = db.sections.filter((s) => s.classId === cls.id && s.isActive);
          const csList = db.classSubjects.filter((cs) => cs.classId === cls.id && cs.academicYearId === 'ay-2026');
          const classBooks = db.books.filter((b) => b.classId === cls.id && b.isActive);
          const leadSecTeacher = secs
            .map((sec) => {
              const sct = db.sectionClassTeachers.find(
                (t) => t.sectionId === sec.id && t.academicYearId === 'ay-2026'
              );
              const staff = sct ? db.staff.find((st) => st.id === sct.staffId) : null;
              return staff ? { secName: sec.name, teacherName: staff.name } : null;
            })
            .filter(Boolean) as Array<{ secName: string; teacherName: string }>;

          return (
            <Card key={cls.id} className="p-6 flex flex-col justify-between space-y-5 hover:border-primary/40 transition-colors">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-primary">
                      {cls.numericValue >= 9
                        ? pick('মাধ্যমিক স্তর (এসএসসি)', 'Secondary Level (SSC)')
                        : pick('নিম্ন মাধ্যমিক স্তর', 'Junior Secondary Level')}
                    </p>
                    <h2 className="text-xl font-bold text-foreground mt-1">
                      {locale === 'bn' ? cls.nameBn : cls.name}
                    </h2>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-[var(--radius)] bg-surface-muted border border-border text-foreground tabular-nums whitespace-nowrap">
                    {pick(`${formatNumber(secs.length, 'bn')}টি শাখা`, `${secs.length} Sections`)}
                  </span>
                </div>

                {/* Quick metrics */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-[var(--radius)] bg-surface-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground">{pick('নির্ধারিত বিষয়', 'Subjects')}</p>
                    <p className="text-base font-bold text-foreground tabular-nums mt-0.5">
                      {formatNumber(csList.length, locale)}
                    </p>
                  </div>
                  <div className="p-3 rounded-[var(--radius)] bg-surface-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground">{pick('পাঠ্যপুস্তক', 'Textbooks')}</p>
                    <p className="text-base font-bold text-foreground tabular-nums mt-0.5">
                      {formatNumber(classBooks.length, locale)}
                    </p>
                  </div>
                </div>

                {/* Sections & Class Teachers */}
                <div className="space-y-1.5 text-sm">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {pick('শাখা ও শ্রেণিশিক্ষক:', 'Sections & Class Teachers:')}
                  </p>
                  <div className="space-y-1">
                    {leadSecTeacher.slice(0, 2).map((item) => (
                      <div key={item.secName} className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium text-foreground">
                          {pick(`শাখা ${item.secName}`, `Section ${item.secName}`)}
                        </span>
                        <span className="text-muted-foreground truncate">{item.teacherName}</span>
                      </div>
                    ))}
                    {secs.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        {pick(
                          `সকল শাখা: ${secs.map((s) => s.name).join(', ')}`,
                          `All sections: ${secs.map((s) => s.name).join(', ')}`
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {cls.numericValue >= 9 && (
                  <p className="text-xs text-foreground bg-primary/5 border border-primary/15 rounded-[var(--radius)] px-3 py-2">
                    {pick(
                      'বিভাগসমূহ: বিজ্ঞান, মানবিক, ব্যবসায় শিক্ষা',
                      'Streams: Science, Humanities, Business Studies'
                    )}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between gap-2">
                <Link
                  href={`/academics/classes/${cls.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline whitespace-nowrap"
                >
                  {pick('বিস্তারিত ও বিষয় দেখুন', 'View Details & Subjects')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`/academics/routines?classId=${cls.id}`}
                  className="text-sm font-medium text-muted-foreground hover:text-primary whitespace-nowrap"
                >
                  {pick('রুটিন →', 'Routine →')}
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── *
 * 3. Class Detail Page (`/academics/classes/:id`) — ROUTE PARAM BUG FIXED
 * ────────────────────────────────────────────────────────────────────────── */

export function PublicClassDetailPage() {
  const { id, classId } = useParams();
  const targetClassId = id ?? classId;
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [groupFilter, setGroupFilter] = useState<string>('ALL');

  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const cls = db.classes.find((c) => c.id === targetClassId);
  if (!cls) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10">
        <EmptyState
          title={pick('শ্রেণির তথ্য পাওয়া যায়নি', 'Class Not Found')}
          description={pick('অনুরোধকৃত শ্রেণিটি বর্তমানে সক্রিয় তালিকায় নেই।', 'The requested class could not be found.')}
          action={
            <Link href="/academics/classes">
              <Button variant="primary" size="sm">{pick('সকল শ্রেণিতে ফিরে যান', 'Back to Classes')}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const secs = db.sections.filter((s) => s.classId === cls.id && s.isActive);
  const allMapped = db.classSubjects.filter((cs) => cs.classId === cls.id && cs.academicYearId === 'ay-2026');
  const hasGroups = cls.numericValue >= 9;

  const visibleSubjects = hasGroups
    ? allMapped.filter((cs) => (groupFilter === 'ALL' ? true : cs.groupId === null || cs.groupId === groupFilter))
    : allMapped;

  const classBooks = db.books
    .filter((b) => b.classId === cls.id && b.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">{pick('হোম', 'Home')}</Link>
        <span>/</span>
        <Link href="/academics" className="hover:text-primary">{pick('একাডেমিক', 'Academics')}</Link>
        <span>/</span>
        <Link href="/academics/classes" className="hover:text-primary">{pick('শ্রেণি ও শাখা', 'Classes')}</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{locale === 'bn' ? cls.nameBn : cls.name}</span>
      </nav>

      <PageHeader
        title={locale === 'bn' ? cls.nameBn ?? cls.name : cls.name}
        description={pick(
          `শিক্ষাবর্ষ ২০২৬ · মোট শাখা ${formatNumber(secs.length, 'bn')}টি · নির্ধারিত বিষয় ${formatNumber(allMapped.length, 'bn')}টি · এনসিটিবি পাঠ্যবই ${formatNumber(classBooks.length, 'bn')}টি।`,
          `Session 2026 · ${secs.length} Sections · ${allMapped.length} Configured Subjects · ${classBooks.length} NCTB Textbooks.`
        )}
        actions={
          <>
            <Link href={`/academics/routines?classId=${cls.id}`}>
              <Button variant="primary" size="sm" className="whitespace-nowrap">
                <Clock className="w-4 h-4" /> {pick('এই শ্রেণির রুটিন', 'Class Routine')}
              </Button>
            </Link>
            <Link href="/academics/classes">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <ArrowLeft className="w-4 h-4" /> {pick('সকল শ্রেণি', 'All Classes')}
              </Button>
            </Link>
          </>
        }
      />

      {/* Sections & Assigned Class Teachers */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">
          {pick('শাখা ও দায়িত্বপ্রাপ্ত শ্রেণিশিক্ষক', 'Sections & Assigned Class Teachers')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {secs.map((sec) => {
            const sct = db.sectionClassTeachers.find(
              (t) => t.sectionId === sec.id && t.academicYearId === 'ay-2026'
            );
            const teacher = sct ? db.staff.find((st) => st.id === sct.staffId) : null;
            const slotCount = db.classRoutines.filter((r) => r.sectionId === sec.id).length;

            return (
              <Card key={sec.id} className="p-4 flex items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-base font-bold text-foreground">
                    {pick(`শাখা: ${sec.name}`, `Section: ${sec.name}`)}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {teacher
                      ? `${pick('শ্রেণিশিক্ষক:', 'Class Teacher:')} ${teacher.name}`
                      : pick('শ্রেণিশিক্ষক: অফিস কর্তৃক নির্ধারিত', 'Class Teacher: Assigned by Office')}
                  </p>
                  {slotCount > 0 && (
                    <p className="text-xs text-primary tabular-nums">
                      {pick(`${formatNumber(slotCount, 'bn')}টি সাপ্তাহিক পিরিয়ড`, `${slotCount} Weekly Periods`)}
                    </p>
                  )}
                </div>
                <Link
                  href={`/academics/routines?classId=${cls.id}&sectionId=${sec.id}`}
                  className="text-sm font-semibold text-primary hover:underline whitespace-nowrap shrink-0"
                >
                  {pick('রুটিন →', 'Routine →')}
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Configured Subjects Table with Stream Filter for Classes 9–10 */}
      <Card className="p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {pick('নির্ধারিত বিষয়সমূহ', 'Configured Subjects')}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {hasGroups
                ? pick(
                    'বিভাগ নির্বাচন করে সাধারণ আবশ্যিক ও বিভাগীয় বিষয়সমূহ একসাথে দেখুন।',
                    'Filter by stream to view compulsory and group-specific subjects together.'
                  )
                : pick('সরকারি বোর্ড কোডসহ এই শ্রেণির সকল নির্ধারিত বিষয়।', 'All configured NCTB subjects for this class.')}
            </p>
          </div>

          {hasGroups && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={groupFilter === 'ALL' ? 'primary' : 'outline'}
                onClick={() => setGroupFilter('ALL')}
                className="whitespace-nowrap"
              >
                {pick('সকল বিভাগ', 'All Streams')}
              </Button>
              {db.academicGroups.map((g) => (
                <Button
                  key={g.id}
                  type="button"
                  size="sm"
                  variant={groupFilter === g.id ? 'primary' : 'outline'}
                  onClick={() => setGroupFilter(g.id)}
                  className="whitespace-nowrap"
                >
                  {locale === 'bn' ? g.nameBn : g.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-x-auto border border-border rounded-[var(--radius)]">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-surface-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left font-semibold">{pick('কোড', 'Code')}</th>
                <th className="p-3 text-left font-semibold">{pick('বিষয়ের নাম', 'Subject')}</th>
                <th className="p-3 text-left font-semibold">{pick('বিভাগ', 'Stream')}</th>
                <th className="p-3 text-left font-semibold">{pick('ধরন', 'Type')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleSubjects.map((cs) => {
                const sub = db.subjects.find((s) => s.id === cs.subjectId);
                const grp = db.academicGroups.find((g) => g.id === cs.groupId);
                return (
                  <tr key={cs.id} className="hover:bg-surface-muted/30">
                    <td className="p-3 font-mono tabular-nums text-muted-foreground">
                      {sub?.officialCode ?? '—'}
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-foreground">
                        {locale === 'bn' ? sub?.nameBn ?? sub?.name : sub?.name}
                      </p>
                      {locale === 'bn' && sub?.name && (
                        <p className="text-xs text-muted-foreground">{sub.name}</p>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {grp ? (locale === 'bn' ? grp.nameBn : grp.name) : pick('সাধারণ (সকল বিভাগ)', 'Common')}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-[var(--radius)] border ${
                          cs.isOptional
                            ? 'bg-surface-muted text-muted-foreground border-border'
                            : 'bg-primary/5 text-primary border-primary/20'
                        }`}
                      >
                        {cs.isOptional ? pick('ঐচ্ছিক (৪র্থ বিষয়)', 'Optional (4th)') : pick('বাধ্যতামূলক', 'Compulsory')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Textbooks Grid */}
      {classBooks.length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {pick('এনসিটিবি পাঠ্যপুস্তক তালিকা', 'NCTB Textbooks List')}
            </h2>
            <span className="text-sm text-muted-foreground tabular-nums">
              {pick(`মোট ${formatNumber(classBooks.length, 'bn')}টি বই`, `${classBooks.length} Books`)}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classBooks.map((b) => {
              const sub = db.subjects.find((s) => s.id === b.subjectId);
              return (
                <div
                  key={b.id}
                  className="p-4 border border-border rounded-[var(--radius)] bg-surface flex flex-col justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{b.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {locale === 'bn' ? sub?.nameBn ?? sub?.name : sub?.name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground tabular-nums">
                    <span>{pick('বোর্ড পাঠ্যবই', 'NCTB Textbook')}</span>
                    <span className="font-mono font-medium text-foreground">{b.bookCode}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── *
 * 4. Subjects Catalog Page (`/academics/subjects`)
 * ────────────────────────────────────────────────────────────────────────── */

export function PublicSubjectsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const selectedClass = useMemo(
    () => db?.classes.find((c) => c.id === classFilter) ?? null,
    [db, classFilter]
  );
  const supportsGroups = Boolean(selectedClass && selectedClass.numericValue >= 9);

  const categories = useMemo(() => {
    if (!db) return [];
    return Array.from(new Set(db.subjects.map((s) => s.category)));
  }, [db]);

  const filtered = useMemo(() => {
    if (!db) return [];
    const q = search.trim().toLowerCase();
    return db.subjects.filter((s) => {
      const catOk = categoryFilter === 'ALL' || s.category === categoryFilter;
      const qOk =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.nameBn ?? '').toLowerCase().includes(q) ||
        (s.officialCode ?? '').toLowerCase().includes(q);

      if (!catOk || !qOk) return false;
      if (classFilter === 'ALL') return true;

      const classMappings = db.classSubjects.filter(
        (cs) =>
          cs.academicYearId === 'ay-2026' &&
          cs.classId === classFilter &&
          cs.subjectId === s.id
      );
      if (classMappings.length === 0) return false;
      if (!supportsGroups || groupFilter === 'ALL') return true;

      return classMappings.some((cs) => cs.groupId === null || cs.groupId === groupFilter);
    });
  }, [db, search, classFilter, groupFilter, categoryFilter, supportsGroups]);

  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const hasActiveFilter =
    search.trim().length > 0 ||
    classFilter !== 'ALL' ||
    groupFilter !== 'ALL' ||
    categoryFilter !== 'ALL';

  const handleReset = () => {
    setSearch('');
    setClassFilter('ALL');
    setGroupFilter('ALL');
    setCategoryFilter('ALL');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader
        title={pick('বিষয়সমূহের তালিকা ও বোর্ড কোড', 'Subjects Catalog & Board Codes')}
        description={pick(
          'শ্রেণি, বিভাগ ও ক্যাটাগরি অনুযায়ী এনসিটিবি বোর্ড কোডসহ বিদ্যালয়ের সকল পাঠ্যবিষয় দেখুন।',
          'Filter school subjects by class, stream, and category with official NCTB board codes.'
        )}
      />

      {/* Search, Class/Stream & Category Filter Bar */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className={supportsGroups ? 'md:col-span-5 relative' : 'md:col-span-6 relative'}>
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={pick(
                'বিষয়ের নাম বা বোর্ড কোড খুঁজুন (যেমন: 109, গণিত)',
                'Search subject name or code (e.g. 109, Math)'
              )}
              className="pl-9"
            />
          </div>

          <div className={supportsGroups ? 'md:col-span-3' : 'md:col-span-3'}>
            <Select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setGroupFilter('ALL');
              }}
            >
              <option value="ALL">{pick('সকল শ্রেণি (৬ষ্ঠ–১০ম)', 'All Classes (6–10)')}</option>
              {db.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === 'bn' ? c.nameBn : c.name}
                </option>
              ))}
            </Select>
          </div>

          {supportsGroups && (
            <div className="md:col-span-2">
              <Select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
                <option value="ALL">{pick('সকল বিভাগ', 'All Streams')}</option>
                {db.academicGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {locale === 'bn' ? g.nameBn : g.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div
            className={`${
              supportsGroups ? 'md:col-span-2' : 'md:col-span-3'
            } flex items-center justify-between md:justify-end gap-2`}
          >
            <p className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
              {pick(
                `${formatNumber(filtered.length, 'bn')} / ${formatNumber(db.subjects.length, 'bn')}টি বিষয়`,
                `${filtered.length} / ${db.subjects.length} subjects`
              )}
            </p>
            {hasActiveFilter && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {pick('রিসেট', 'Reset')}
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
          <Button
            type="button"
            size="sm"
            variant={categoryFilter === 'ALL' ? 'primary' : 'outline'}
            onClick={() => setCategoryFilter('ALL')}
            className="whitespace-nowrap"
          >
            {pick('সকল ক্যাটাগরি', 'All Categories')}
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              type="button"
              size="sm"
              variant={categoryFilter === cat ? 'primary' : 'outline'}
              onClick={() => setCategoryFilter(cat)}
              className="whitespace-nowrap"
            >
              <StatusBadge enumName="SubjectCategory" value={cat as SubjectCategory} />
            </Button>
          ))}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title={pick('কোনো বিষয় পাওয়া যায়নি', 'No Matching Subjects')}
          description={pick(
            'শ্রেণি, বিভাগ বা ক্যাটাগরি পরিবর্তন করে পুনরায় চেষ্টা করুন।',
            'Try clearing your class, stream, or category filter.'
          )}
          action={
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" /> {pick('ফিল্টার রিসেট করুন', 'Reset Filters')}
            </Button>
          }
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-surface-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">{pick('বোর্ড কোড', 'Code')}</th>
                <th className="px-4 py-3 text-left font-semibold">{pick('বিষয়ের নাম (বাংলা)', 'Subject (Bangla)')}</th>
                <th className="px-4 py-3 text-left font-semibold">{pick('ইংরেজি নাম', 'Subject (English)')}</th>
                <th className="px-4 py-3 text-left font-semibold">{pick('ক্যাটাগরি', 'Category')}</th>
                <th className="px-4 py-3 text-left font-semibold">
                  {classFilter !== 'ALL'
                    ? pick('নির্বাচিত শ্রেণিতে ধরন', 'Status in Selected Class')
                    : pick('পাঠদান শ্রেণি', 'Taught In Classes')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => {
                const mappedClassIds = Array.from(
                  new Set(
                    db.classSubjects
                      .filter((cs) => cs.subjectId === s.id && cs.academicYearId === 'ay-2026')
                      .map((cs) => cs.classId)
                  )
                );
                const mappedClasses = db.classes
                  .filter((c) => mappedClassIds.includes(c.id))
                  .sort((a, b) => a.numericValue - b.numericValue);

                const selectedClassEntries =
                  classFilter !== 'ALL'
                    ? db.classSubjects.filter(
                        (cs) =>
                          cs.academicYearId === 'ay-2026' &&
                          cs.classId === classFilter &&
                          cs.subjectId === s.id &&
                          (!supportsGroups ||
                            groupFilter === 'ALL' ||
                            cs.groupId === null ||
                            cs.groupId === groupFilter)
                      )
                    : [];

                return (
                  <tr key={s.id} className="hover:bg-surface-muted/30">
                    <td className="px-4 py-3.5 font-mono text-sm font-semibold tabular-nums text-primary">
                      {s.officialCode ?? '—'}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-foreground">{s.nameBn ?? s.name}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{s.name}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge enumName="SubjectCategory" value={s.category} />
                    </td>
                    <td className="px-4 py-3.5">
                      {classFilter !== 'ALL' ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {selectedClassEntries.map((entry) => {
                            const grp = db.academicGroups.find((g) => g.id === entry.groupId);
                            return (
                              <span
                                key={entry.id}
                                className={`text-xs font-medium px-2.5 py-0.5 rounded-[var(--radius)] border whitespace-nowrap ${
                                  entry.isOptional
                                    ? 'bg-surface-muted text-muted-foreground border-border'
                                    : 'bg-primary/5 text-primary border-primary/20'
                                }`}
                              >
                                {grp
                                  ? `${locale === 'bn' ? grp.nameBn : grp.name} · `
                                  : ''}
                                {entry.isOptional
                                  ? pick('ঐচ্ছিক (৪র্থ)', 'Optional')
                                  : pick('বাধ্যতামূলক', 'Compulsory')}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {mappedClasses.map((c) => (
                            <Link
                              key={c.id}
                              href={`/academics/classes/${c.id}`}
                              className="text-xs font-medium px-2 py-0.5 rounded-[var(--radius)] border border-border bg-surface-muted/60 text-foreground hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
                            >
                              {locale === 'bn' ? `${formatNumber(c.numericValue, 'bn')}ম` : `Cls ${c.numericValue}`}
                            </Link>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── *
 * 5. Hybrid Syllabus & Institutional Policies (`/academics/syllabus`)
 * ────────────────────────────────────────────────────────────────────────── */

const SYLLABUS_TERM_LABELS: Record<SyllabusExamTerm, { bn: string; en: string }> = {
  HALF_YEARLY: { bn: 'অর্ধবার্ষিক পরীক্ষা', en: 'Half-Yearly Exam' },
  ANNUAL: { bn: 'বার্ষিক পরীক্ষা', en: 'Annual Exam' },
  SELECTION: { bn: 'নির্বাচনি (এসএসসি)', en: 'Selection / SSC Test' },
};

export function PublicSyllabusPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [searchParams] = useSearchParams();

  const initialTab = searchParams.get('tab') === 'guidelines' ? 'guidelines' : 'syllabus';
  const initialClass = searchParams.get('classId') ?? 'cls-10';
  const initialTerm = (searchParams.get('term') as SyllabusExamTerm | null) ?? 'HALF_YEARLY';

  const [activeTab, setActiveTab] = useState<'syllabus' | 'guidelines'>(initialTab);
  const [selectedClassId, setSelectedClassId] = useState(initialClass);
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [selectedTerm, setSelectedTerm] = useState<SyllabusExamTerm>(
    initialTerm === 'ANNUAL' || initialTerm === 'SELECTION' ? initialTerm : 'HALF_YEARLY'
  );
  const [previewFile, setPreviewFile] = useState<SyllabusFile | null>(null);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const sortedClasses = [...db.classes].sort((a, b) => a.numericValue - b.numericValue);
  const activeClass = sortedClasses.find((c) => c.id === selectedClassId) ?? sortedClasses[sortedClasses.length - 1];
  const supportsGroups = (activeClass?.numericValue ?? 0) >= 9;
  const supportsSelection = activeClass?.numericValue === 10;
  const effectiveGroup = supportsGroups ? groupFilter : 'ALL';
  const effectiveTerm: SyllabusExamTerm =
    selectedTerm === 'SELECTION' && !supportsSelection ? 'HALF_YEARLY' : selectedTerm;

  const availableTerms: SyllabusExamTerm[] = supportsSelection
    ? ['HALF_YEARLY', 'ANNUAL', 'SELECTION']
    : ['HALF_YEARLY', 'ANNUAL'];

  const matchingFiles = db.syllabusFiles.filter(
    (f) =>
      f.isPublished &&
      f.classId === activeClass?.id &&
      f.examTerm === effectiveTerm &&
      (!f.groupId || effectiveGroup === 'ALL' || f.groupId === effectiveGroup)
  );

  const matchingEntries = db.syllabusEntries
    .filter(
      (e) =>
        e.classId === activeClass?.id &&
        e.examTerm === effectiveTerm &&
        (e.groupId === null || e.groupId === undefined || effectiveGroup === 'ALL' || e.groupId === effectiveGroup)
    )
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const activeGroupObj =
    effectiveGroup !== 'ALL' ? db.academicGroups.find((g) => g.id === effectiveGroup) : null;

  const policyDocs = db.academicDocuments.filter(
    (d) => d.isPublished && d.type !== AcademicDocumentType.CURRICULUM
  );
  const activeDoc = policyDocs.find((d) => d.id === previewDocId) ?? policyDocs[0];
  const sections = activeDoc ? STRUCTURED_DOC_SECTIONS[activeDoc.type] ?? [] : [];

  const handleClassChange = (nextClassId: string) => {
    setSelectedClassId(nextClassId);
    const nextCls = db.classes.find((c) => c.id === nextClassId);
    if (!nextCls || nextCls.numericValue < 9) {
      setGroupFilter('ALL');
    }
    if ((!nextCls || nextCls.numericValue !== 10) && selectedTerm === 'SELECTION') {
      setSelectedTerm('HALF_YEARLY');
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="no-print space-y-5">
        <PageHeader
          title={pick('সিলেবাস ও বিদ্যালয় নীতিমালা', 'Syllabus & Institutional Policies')}
          description={pick(
            '২০২৬ শিক্ষাবর্ষের শ্রেণি ও পরীক্ষাভিত্তিক অধ্যায়-তালিকা, অফিসিয়াল সিলেবাস পিডিএফ ডাউনলোড এবং বিদ্যালয়ের আচরণবিধি ও ড্রেস কোড।',
            'Class and exam-wise 2026 chapter syllabus, official downloadable syllabus PDFs, student discipline rules, and uniform code.'
          )}
        />

        {/* Top 2-Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('syllabus')}
            className={`px-4 py-2 text-sm font-semibold rounded-[var(--radius)] border transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'syllabus'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-surface text-foreground border-border hover:border-primary/40'
            }`}
          >
            {pick('শ্রেণি ও পরীক্ষাভিত্তিক সিলেবাস (২০২৬)', 'Class & Exam Syllabus (2026)')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guidelines')}
            className={`px-4 py-2 text-sm font-semibold rounded-[var(--radius)] border transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'guidelines'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-surface text-foreground border-border hover:border-primary/40'
            }`}
          >
            {pick('বিদ্যালয় নীতিমালা ও ড্রেস কোড', 'School Rules & Dress Code')}
          </button>
        </div>
      </div>

      {activeTab === 'syllabus' && (
        <div className="space-y-6">
          {/* Class, Stream & Exam Term Filter Bar */}
          <Card className="p-4 sm:p-5 no-print">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {pick('শ্রেণি নির্বাচন করুন', 'Select Class')}
                </label>
                <Select
                  value={activeClass?.id ?? 'cls-10'}
                  onChange={(e) => handleClassChange(e.target.value)}
                >
                  {sortedClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {locale === 'bn' ? c.nameBn ?? c.name : c.name}
                    </option>
                  ))}
                </Select>
              </div>

              {supportsGroups && (
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {pick('বিভাগ (৯ম–১০ম)', 'Academic Stream')}
                  </label>
                  <Select value={effectiveGroup} onChange={(e) => setGroupFilter(e.target.value)}>
                    <option value="ALL">{pick('সকল বিভাগ', 'All Streams')}</option>
                    {db.academicGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {locale === 'bn' ? g.nameBn ?? g.name : g.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              <div className={supportsGroups ? 'md:col-span-6' : 'md:col-span-9'}>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {pick('পরীক্ষার পর্ব', 'Examination Term')}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {availableTerms.map((term) => {
                    const isSelected = effectiveTerm === term;
                    const label = SYLLABUS_TERM_LABELS[term];
                    return (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setSelectedTerm(term)}
                        className={`px-3.5 py-2 text-sm font-medium rounded-[var(--radius)] border transition-colors whitespace-nowrap cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 text-primary border-primary font-semibold'
                            : 'bg-surface text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
                        }`}
                      >
                        {pick(label.bn, label.en)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Official Syllabus File Attachment Strip */}
          {matchingFiles.length > 0 && (
            <div className="space-y-3 no-print">
              {matchingFiles.map((file) => {
                const fileGroup = file.groupId
                  ? db.academicGroups.find((g) => g.id === file.groupId)
                  : null;
                return (
                  <Card
                    key={file.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-[var(--radius)] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground tabular-nums">
                          <span className="font-semibold text-primary">
                            {file.fileType === 'PDF'
                              ? pick('অফিসিয়াল সিলেবাস PDF', 'Official Syllabus PDF')
                              : pick('সিলেবাস সংযুক্তি (ছবি)', 'Syllabus Image')}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{file.fileSize}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {pick('প্রকাশ:', 'Published:')} {formatDateLong(file.publishedAt, locale)}
                          </span>
                          {fileGroup && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{locale === 'bn' ? fileGroup.nameBn : fileGroup.name}</span>
                            </>
                          )}
                        </div>
                        <h2 className="text-base font-bold text-foreground leading-snug">
                          {file.title}
                        </h2>
                        <p className="text-xs font-mono text-muted-foreground truncate">
                          {file.fileName}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {file.fileUrl ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewFile(file)}
                            className="whitespace-nowrap"
                          >
                            <Eye className="w-4 h-4" />
                            {pick('প্রিভিউ দেখুন', 'Preview')}
                          </Button>
                          <a href={file.fileUrl} download={file.fileName}>
                            <Button variant="primary" size="sm" className="whitespace-nowrap">
                              <Download className="w-4 h-4" />
                              {pick('ফাইল ডাউনলোড', 'Download File')}
                            </Button>
                          </a>
                        </>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={triggerPrint}
                          className="whitespace-nowrap"
                        >
                          <Printer className="w-4 h-4" />
                          {pick('পিডিএফ ডাউনলোড / প্রিন্ট', 'Save PDF / Print')}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Printable Official A4 Chapter-wise Syllabus Table */}
          <Card className="print-sheet p-5 sm:p-8 space-y-6">
            {/* Institutional Letterhead */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
              <div className="flex items-center gap-3.5">
                <SchoolEmblem size={48} />
                <div>
                  <p className="text-base font-bold text-foreground">
                    {locale === 'bn' ? db.schoolProfile.name : db.schoolProfile.nameEn}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {pick(
                      `স্থাপিত: ${formatNumber(db.schoolProfile.establishedYear, 'bn')} · EIIN: ${db.schoolProfile.eiin} · ${db.schoolProfile.address}`,
                      `Est. ${db.schoolProfile.establishedYear} · EIIN: ${db.schoolProfile.eiin} · Bhojeshwar, Noria, Shariatpur`
                    )}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={triggerPrint} className="no-print whitespace-nowrap">
                <Printer className="w-4 h-4" />
                {pick('প্রিন্ট / পিডিএফ', 'Print / PDF')}
              </Button>
            </div>

            {/* Syllabus Heading & Summary Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                  {locale === 'bn'
                    ? `${activeClass?.nameBn ?? activeClass?.name} — ${SYLLABUS_TERM_LABELS[effectiveTerm].bn} সিলেবাস ২০২৬`
                    : `${activeClass?.name} — ${SYLLABUS_TERM_LABELS[effectiveTerm].en} Syllabus 2026`}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground tabular-nums">
                  <span>
                    {activeGroupObj
                      ? pick(
                          `বিভাগ: ${activeGroupObj.nameBn ?? activeGroupObj.name}`,
                          `Stream: ${activeGroupObj.name}`
                        )
                      : supportsGroups
                        ? pick('সকল বিভাগ (আবশ্যিক ও বিভাগীয় বিষয়)', 'All Streams (Compulsory & Group Subjects)')
                        : pick('সাধারণ মাধ্যমিক পাঠ্যক্রম (এনসিটিবি)', 'General Secondary Curriculum (NCTB)')}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {pick(
                      `মোট তালিকাভুক্ত বিষয়: ${formatNumber(matchingEntries.length, 'bn')}টি`,
                      `Total Listed Subjects: ${matchingEntries.length}`
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Chapter-wise Syllabus Table */}
            {matchingEntries.length === 0 ? (
              <EmptyState
                title={pick('এই শ্রেণি ও পরীক্ষার সিলেবাস এখনও যুক্ত করা হয়নি', 'No syllabus chapters listed yet')}
                description={pick(
                  'অ্যাডমিন প্যানেল থেকে অধ্যায়ভিত্তিক সিলেবাস অথবা অফিসিয়াল পিডিএফ আপলোড করা হলে এখানে প্রদর্শিত হবে।',
                  'Syllabus entries or official PDFs uploaded from the Admin Panel will appear here.'
                )}
              />
            ) : (
              <div className="overflow-x-auto border border-border rounded-[var(--radius)]">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                        {pick('বোর্ড কোড', 'Board Code')}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                        {pick('বিষয়ের নাম', 'Subject')}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        {pick('নির্ধারিত অধ্যায় ও পাঠ্যসীমা', 'Prescribed Chapters & Scope')}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                        {pick('মানবণ্টন ও মূল্যায়ন', 'Marks Breakdown')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {matchingEntries.map((entry) => {
                      const sub = db.subjects.find((s) => s.id === entry.subjectId);
                      const grp = entry.groupId
                        ? db.academicGroups.find((g) => g.id === entry.groupId)
                        : null;
                      return (
                        <tr key={entry.id} className="hover:bg-surface-muted/30 align-top">
                          <td className="px-4 py-3.5 font-mono text-sm font-semibold tabular-nums text-primary whitespace-nowrap">
                            {sub?.officialCode ?? '—'}
                          </td>
                          <td className="px-4 py-3.5 min-w-[180px]">
                            <p className="font-semibold text-foreground">
                              {locale === 'bn' ? sub?.nameBn ?? sub?.name : sub?.name ?? entry.subjectId}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {grp
                                ? pick(`${grp.nameBn ?? grp.name} বিভাগ`, `${grp.name} Stream`)
                                : pick('আবশ্যিক বিষয়', 'Compulsory Subject')}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-foreground leading-relaxed min-w-[280px]">
                            {locale === 'bn' ? entry.chaptersBn : entry.chaptersEn}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground tabular-nums whitespace-nowrap">
                            {locale === 'bn' ? entry.marksBreakdownBn : entry.marksBreakdownEn}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Authorization Line */}
            <div className="pt-5 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>
                {pick(
                  'অনুমোদনক্রমে: প্রধান শিক্ষক, ভোজেশ্বর উচ্চ বিদ্যালয় · এনসিটিবি অনুমোদিত পাঠ্যসূচি',
                  'Approved by: Head Teacher, Bhojeshwar High School · NCTB Curriculum'
                )}
              </span>
              <div className="flex flex-wrap items-center gap-4 no-print">
                <Link href="/academics/subjects" className="font-semibold text-primary hover:underline whitespace-nowrap">
                  {pick('বিষয় ও বোর্ড কোড', 'Subjects & Codes')}
                </Link>
                <Link href="/academics/examination" className="font-semibold text-primary hover:underline whitespace-nowrap">
                  {pick('পরীক্ষার রুটিন ও গ্রেডিং →', 'Exam Routine & Grading →')}
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'guidelines' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Document Selector Rail */}
          <div className="lg:col-span-4 space-y-3 no-print">
            {policyDocs.map((doc) => {
              const isSelected = activeDoc?.id === doc.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setPreviewDocId(doc.id)}
                  className={`w-full text-left p-4 rounded-[var(--radius)] border transition-colors cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-primary/5 border-primary'
                      : 'bg-surface border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge enumName="AcademicDocumentType" value={doc.type} />
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                  <h2 className="text-base font-bold text-foreground leading-snug">{doc.title}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">{doc.description}</p>
                </button>
              );
            })}
          </div>

          {/* Official Printable Document Viewer */}
          <div className="lg:col-span-8">
            {activeDoc && (
              <Card className="print-sheet p-6 sm:p-8 space-y-6">
                {/* Institutional Letterhead */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
                  <div className="flex items-center gap-3.5">
                    <SchoolEmblem size={48} />
                    <div>
                      <p className="text-base font-bold text-foreground">
                        {locale === 'bn' ? db.schoolProfile.name : db.schoolProfile.nameEn}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {pick(
                          `স্থাপিত: ${formatNumber(db.schoolProfile.establishedYear, 'bn')} · EIIN: ${db.schoolProfile.eiin} · ${db.schoolProfile.address}`,
                          `Est. ${db.schoolProfile.establishedYear} · EIIN: ${db.schoolProfile.eiin} · Bhojeshwar, Noria, Shariatpur`
                        )}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={triggerPrint} className="no-print whitespace-nowrap">
                    <Printer className="w-4 h-4" /> {pick('প্রিন্ট / পিডিএফ সংরক্ষণ', 'Print / Save PDF')}
                  </Button>
                </div>

                {/* Title & Summary */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge enumName="AcademicDocumentType" value={activeDoc.type} />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {pick('কার্যকর শিক্ষাবর্ষ: ২০২৬', 'Effective Session: 2026')}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                    {activeDoc.title}
                  </h2>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {activeDoc.description}
                  </p>
                </div>

                {/* Structured Institutional Sections */}
                <div className="space-y-5 pt-2">
                  {sections.map((sec) => (
                    <div
                      key={sec.headingEn}
                      className="p-5 rounded-[var(--radius)] bg-surface-muted/40 border border-border space-y-3"
                    >
                      <h3 className="text-base font-bold text-foreground">
                        {pick(sec.headingBn, sec.headingEn)}
                      </h3>
                      <ul className="space-y-2.5">
                        {(locale === 'bn' ? sec.pointsBn : sec.pointsEn).map((pt, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-base text-foreground/90 leading-relaxed">
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-1" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Footer Authorization Line */}
                <div className="pt-5 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>
                    {pick(
                      'অনুমোদনক্রমে: প্রধান শিক্ষক, ভোজেশ্বর উচ্চ বিদ্যালয়',
                      'Approved by: Head Teacher, Bhojeshwar High School'
                    )}
                  </span>
                  <Link href="/academics/classes" className="font-semibold text-primary hover:underline no-print">
                    {pick('শ্রেণিভিত্তিক বিষয় ও পাঠ্যবই দেখুন →', 'View Class-wise Subjects & Textbooks →')}
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Uploaded Syllabus File Preview Modal */}
      <Modal
        open={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        title={previewFile?.title ?? pick('সিলেবাস প্রিভিউ', 'Syllabus Preview')}
        maxWidth="max-w-4xl"
      >
        {previewFile && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border text-sm text-muted-foreground">
              <span className="font-mono text-xs">{previewFile.fileName} · {previewFile.fileSize}</span>
              {previewFile.fileUrl && (
                <a href={previewFile.fileUrl} download={previewFile.fileName}>
                  <Button variant="primary" size="sm">
                    <Download className="w-4 h-4" />
                    {pick('ডাউনলোড করুন', 'Download')}
                  </Button>
                </a>
              )}
            </div>
            {previewFile.fileUrl && previewFile.fileType === 'PDF' && (
              <iframe
                src={previewFile.fileUrl}
                title={previewFile.title}
                className="w-full h-[70vh] rounded-[var(--radius)] border border-border bg-surface-muted/30"
              />
            )}
            {previewFile.fileUrl && previewFile.fileType === 'IMAGE' && (
              <img
                src={previewFile.fileUrl}
                alt={previewFile.title}
                referrerPolicy="no-referrer"
                className="w-full max-h-[70vh] object-contain mx-auto rounded-[var(--radius)] border border-border"
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── *
 * 6. Weekly Class Routines (`/academics/routines`)
 * ────────────────────────────────────────────────────────────────────────── */

export function PublicRoutinesPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialClass = searchParams.get('classId') ?? 'cls-10';
  const initialSection = searchParams.get('sectionId') ?? '';

  const [selectedClassId, setSelectedClassId] = useState(initialClass);
  const [selectedSectionId, setSelectedSectionId] = useState(initialSection);

  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const validClassId = db.classes.some((c) => c.id === selectedClassId) ? selectedClassId : db.classes[0]?.id ?? 'cls-10';
  const classSections = db.sections.filter((s) => s.classId === validClassId && s.isActive);
  const effectiveSecId = classSections.some((s) => s.id === selectedSectionId)
    ? selectedSectionId
    : classSections[0]?.id ?? '';

  const activeClass = db.classes.find((c) => c.id === validClassId);
  const activeSection = classSections.find((s) => s.id === effectiveSecId);
  const activeYear = db.academicYears.find((year) => year.isActive) ?? db.academicYears[0];
  const sct = db.sectionClassTeachers.find(
    (t) => t.sectionId === effectiveSecId && t.academicYearId === activeYear?.id
  );
  const classTeacher = sct ? db.staff.find((st) => st.id === sct.staffId) : null;

  const days = [WeekDay.SUNDAY, WeekDay.MONDAY, WeekDay.TUESDAY, WeekDay.WEDNESDAY, WeekDay.THURSDAY];
  const todayDay = getTodayWeekDay();
  const routines = db.classRoutines.filter(
    (r) => r.sectionId === effectiveSecId && r.academicYearId === activeYear?.id
  );

  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    const firstSec = db.sections.find((s) => s.classId === newClassId && s.isActive);
    const nextSecId = firstSec?.id ?? '';
    setSelectedSectionId(nextSecId);
    setSearchParams({ classId: newClassId, ...(nextSecId ? { sectionId: nextSecId } : {}) });
  };

  const handleSectionChange = (newSecId: string) => {
    setSelectedSectionId(newSecId);
    setSearchParams({ classId: validClassId, sectionId: newSecId });
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="no-print">
        <PageHeader
          title={pick(`সাপ্তাহিক ক্লাস রুটিন ${activeYear?.name ?? ''}`, `Weekly Class Routine ${activeYear?.name ?? ''}`)}
          description={pick(
            'শ্রেণি ও শাখা নির্বাচন করে রবি থেকে বৃহস্পতিবারের পাঠদানের সময়সূচি দেখুন ও প্রিন্ট করুন।',
            'Select class and section to view or print the Sunday–Thursday classroom timetable.'
          )}
          actions={
            <Button variant="outline" size="sm" onClick={triggerPrint} className="whitespace-nowrap">
              <Printer className="w-4 h-4" /> {pick('রুটিন প্রিন্ট করুন', 'Print Routine')}
            </Button>
          }
        />
      </div>

      {/* Selector & Class Teacher Meta Strip */}
      <Card className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:max-w-md">
          <Select value={validClassId} onChange={(e) => handleClassChange(e.target.value)}>
            {db.classes.map((c) => (
              <option key={c.id} value={c.id}>{locale === 'bn' ? c.nameBn : c.name}</option>
            ))}
          </Select>
          <Select value={effectiveSecId} onChange={(e) => handleSectionChange(e.target.value)}>
            {classSections.map((s) => (
              <option key={s.id} value={s.id}>
                {pick('শাখা:', 'Section:')} {s.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary shrink-0" />
            <span className="text-muted-foreground">{pick('শ্রেণিশিক্ষক:', 'Class Teacher:')}</span>
            <span className="font-semibold text-foreground">
              {classTeacher ? classTeacher.name : pick('নির্ধারিত হয়নি', 'Assigned by Office')}
            </span>
          </div>
          <div className="flex items-center gap-2 tabular-nums">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span className="text-muted-foreground">{pick('সমাবেশ:', 'Assembly:')}</span>
            <span className="font-semibold text-foreground">{pick('সকাল ৯:৪৫', '9:45 AM')}</span>
          </div>
        </div>
      </Card>

      {/* Printable Letterhead (visible in print) */}
      <div className="hidden print:flex items-center justify-between border-b border-border pb-4 mb-4">
        <div className="flex items-center gap-3">
          <SchoolEmblem size={44} />
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {locale === 'bn' ? db.schoolProfile.name : db.schoolProfile.nameEn}
            </h1>
            <p className="text-xs text-muted-foreground">
              {pick(
                `সাপ্তাহিক ক্লাস রুটিন ${activeYear?.name ?? ''} · ${activeClass?.nameBn ?? ''} (শাখা: ${activeSection?.name ?? ''})`,
                `Weekly Class Routine ${activeYear?.name ?? ''} · ${activeClass?.name ?? ''} (Section: ${activeSection?.name ?? ''})`
              )}
            </p>
          </div>
        </div>
        {classTeacher && (
          <p className="text-xs text-muted-foreground">
            {pick('শ্রেণিশিক্ষক:', 'Class Teacher:')} {classTeacher.name}
          </p>
        )}
      </div>

      {/* Timetable Grid or Graceful Empty Section Guidance */}
      {routines.length === 0 ? (
        <EmptyState
          title={pick('এই শাখার রুটিন এখনো প্রকাশিত হয়নি', 'No Routine Published for This Section Yet')}
          description={pick(
            'বর্তমানে এই শ্রেণির "ক" শাখার পূর্ণাঙ্গ সাপ্তাহিক রুটিন প্রকাশিত রয়েছে। অন্য শাখা নির্বাচন করে রুটিন দেখুন অথবা বিদ্যালয় অফিসে যোগাযোগ করুন।',
            'The full timetable for Section ক of this class is published. Switch to Section ক or check with the school office.'
          )}
          action={
            classSections[0] && classSections[0].id !== effectiveSecId ? (
              <Button variant="primary" size="sm" onClick={() => handleSectionChange(classSections[0].id)}>
                {pick(`শাখা "${classSections[0].name}" দেখুন`, `View Section ${classSections[0].name}`)}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[980px]">
            <thead className="bg-surface-muted text-muted-foreground">
              <tr>
                <th className="p-3.5 border-b border-r border-border text-left font-semibold w-32">
                  {pick('বার / পিরিয়ড', 'Day / Period')}
                </th>
                {PERIOD_META.slice(0, 3).map((pm) => (
                  <th key={pm.period} className="p-3.5 border-b border-border text-left">
                    <div className="font-semibold text-foreground">{pick(pm.labelBn, pm.labelEn)}</div>
                    <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                      {pick(pm.timeBn, pm.timeEn)}
                    </div>
                  </th>
                ))}
                <th className="p-3 border-b border-x border-border text-center bg-surface-muted/80 w-24">
                  <div className="text-xs font-semibold text-primary">{pick('টিফিন বিরতি', 'Tiffin')}</div>
                  <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                    {pick('১২:১৫–১২:৪৫', '12:15–12:45')}
                  </div>
                </th>
                {PERIOD_META.slice(3).map((pm) => (
                  <th key={pm.period} className="p-3.5 border-b border-border text-left">
                    <div className="font-semibold text-foreground">{pick(pm.labelBn, pm.labelEn)}</div>
                    <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                      {pick(pm.timeBn, pm.timeEn)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {days.map((day, dayIdx) => {
                const isToday = todayDay === day;
                const renderCell = (p: number) => {
                  const slot = routines.find((r) => r.day === day && r.periodNumber === p);
                  if (!slot) {
                    return <td key={p} className="p-3.5 text-sm text-muted-foreground/60 align-top">—</td>;
                  }
                  const ta = db.teacherAssignments.find((x) => x.id === slot.teacherAssignmentId);
                  const cs = ta ? db.classSubjects.find((x) => x.id === ta.classSubjectId) : null;
                  const sub = cs ? db.subjects.find((x) => x.id === cs.subjectId) : null;
                  const staff = db.staff.find((x) => x.id === slot.staffId);
                  return (
                    <td key={p} className="p-3.5 align-top">
                      <p className="font-semibold text-foreground text-sm">
                        {locale === 'bn' ? sub?.nameBn ?? sub?.name : sub?.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{staff?.name}</p>
                      <p className="text-xs text-primary font-medium tabular-nums mt-1">
                        {slot.room}
                      </p>
                    </td>
                  );
                };

                return (
                  <tr key={day} className={isToday ? 'bg-primary/5' : undefined}>
                    <td className="p-3.5 font-semibold border-r border-border bg-surface-muted/30 whitespace-nowrap align-top">
                      <div className="flex flex-col gap-1">
                        <StatusBadge enumName="WeekDay" value={day} />
                        {isToday && (
                          <span className="text-xs font-semibold text-primary">
                            {pick('আজকের দিন', 'Today')}
                          </span>
                        )}
                      </div>
                    </td>
                    {renderCell(1)}
                    {renderCell(2)}
                    {renderCell(3)}
                    {dayIdx === 0 && (
                      <td
                        rowSpan={days.length}
                        className="p-3 border-x border-border bg-surface-muted/40 text-center align-middle"
                      >
                        <div className="flex flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>{pick('টিফিন', 'Tiffin')}</span>
                          <span className="tabular-nums">{pick('৩০ মি.', '30m')}</span>
                        </div>
                      </td>
                    )}
                    {PERIOD_META.slice(3).map((pm) => renderCell(pm.period))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── *
 * 7. Examinations & Grading Policy (`/academics/examination`)
 * ────────────────────────────────────────────────────────────────────────── */

export function PublicExaminationPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [selectedExamId, setSelectedExamId] = useState<string>('exam-ann-10');

  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const visibleExams = db.exams.filter((e) => !e.isDeleted);
  const activeExam = visibleExams.find((e) => e.id === selectedExamId) ?? visibleExams[0];
  const examRoutines = db.examRoutines
    .filter((r) => !r.isDeleted && r.examId === activeExam?.id)
    .sort((a, b) => a.examDate.localeCompare(b.examDate));

  const activeScale = db.gradingScales.find((g) => g.isDefault) ?? db.gradingScales[0];
  const ranges = db.gradeRanges
    .filter((r) => r.gradingScaleId === activeScale?.id && !r.isDeleted)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="no-print">
        <PageHeader
          title={pick('পরীক্ষা, সময়সূচি ও গ্রেডিং নীতিমালা', 'Examinations, Routine & Grading Policy')}
          description={pick(
            'চলমান ও আসন্ন পরীক্ষার রুটিন, পরীক্ষার হল নির্দেশাবলি, পাস নীতি এবং এনসিটিবি ৫.০০ গ্রেডিং স্কেল।',
            'Active examination timetable, exam hall instructions, board pass policy, and configured 5.00 grading scale.'
          )}
          actions={
            <>
              <Button variant="outline" size="sm" onClick={triggerPrint} className="whitespace-nowrap">
                <Printer className="w-4 h-4" /> {pick('রুটিন প্রিন্ট করুন', 'Print Routine')}
              </Button>
              <Link href="/results">
                <Button variant="primary" size="sm" className="whitespace-nowrap">
                  {pick('ফলাফল অনুসন্ধান', 'Search Results')}
                </Button>
              </Link>
            </>
          }
        />
      </div>

      {/* Exam Selector & Summary */}
      <Card className="p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">
              {activeExam?.name ?? pick('পরীক্ষার রুটিন ২০২৬', 'Examination Routine 2026')}
            </h2>
            {activeExam && (
              <div className="flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground tabular-nums">
                <span>
                  {formatDateLong(activeExam.startDate, locale)} – {formatDateLong(activeExam.endDate, locale)}
                </span>
                <StatusBadge enumName="ExamStatus" value={activeExam.status} />
                <StatusBadge enumName="ResultPublicationStatus" value={activeExam.resultStatus} />
              </div>
            )}
          </div>

          <div className="w-full lg:w-80 no-print">
            <Select value={activeExam?.id ?? ''} onChange={(e) => setSelectedExamId(e.target.value)}>
              {visibleExams.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </Select>
          </div>
        </div>

        {examRoutines.length === 0 ? (
          <EmptyState
            title={pick('এই পরীক্ষার বিস্তারিত রুটিন তালিকাভুক্ত নেই', 'No Detailed Schedule Listed for This Exam')}
            description={pick(
              'চলমান বার্ষিক/নির্বাচনি পরীক্ষার বিস্তারিত রুটিন দেখতে তালিকা থেকে "বার্ষিক / নির্বাচনি প্রস্তুতি পরীক্ষা ২০২৬" নির্বাচন করুন অথবা প্রকাশিত ফলাফল দেখুন।',
              'Select "Annual / Preparatory Examination 2026" to view the active schedule, or check published results directly.'
            )}
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                {selectedExamId !== 'exam-ann-10' && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedExamId('exam-ann-10')}>
                    {pick('বার্ষিক পরীক্ষার রুটিন দেখুন', 'View Annual Exam Routine')}
                  </Button>
                )}
                {activeExam?.resultStatus === 'PUBLISHED' && (
                  <Link href={`/results?examId=${activeExam.id}&classId=${activeExam.classId}`}>
                    <Button variant="primary" size="sm">{pick('প্রকাশিত ফলাফল দেখুন', 'View Published Results')}</Button>
                  </Link>
                )}
              </div>
            }
          />
        ) : (
          <div className="overflow-x-auto border border-border rounded-[var(--radius)]">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-surface-muted text-muted-foreground">
                <tr>
                  <th className="p-3.5 text-left font-semibold">{pick('তারিখ', 'Date')}</th>
                  <th className="p-3.5 text-left font-semibold">{pick('বিষয় ও কোড', 'Subject & Code')}</th>
                  <th className="p-3.5 text-left font-semibold">{pick('সময়', 'Time')}</th>
                  <th className="p-3.5 text-left font-semibold">{pick('কক্ষ', 'Room')}</th>
                  <th className="p-3.5 text-left font-semibold">{pick('বিশেষ নির্দেশাবলি', 'Instructions')}</th>
                  <th className="p-3.5 text-left font-semibold">{pick('অবস্থা', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {examRoutines.map((er) => {
                  const es = db.examSubjects.find((x) => x.id === er.examSubjectId);
                  const sub = es ? db.subjects.find((x) => x.id === es.subjectId) : null;
                  return (
                    <tr key={er.id} className="hover:bg-surface-muted/30">
                      <td className="p-3.5 font-semibold text-foreground whitespace-nowrap">
                        {formatDateLong(er.examDate, locale)}
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-foreground">
                          {locale === 'bn' ? sub?.nameBn ?? sub?.name : sub?.name}
                        </p>
                        {sub?.officialCode && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {pick('কোড:', 'Code:')} {sub.officialCode}
                          </p>
                        )}
                      </td>
                      <td className="p-3.5 text-muted-foreground whitespace-nowrap">
                        {formatTime12h(er.startTime, locale)} – {formatTime12h(er.endTime, locale)}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">{er.roomNo ?? '—'}</td>
                      <td className="p-3.5 text-sm text-muted-foreground max-w-xs">
                        {er.instructions ?? '—'}
                      </td>
                      <td className="p-3.5">
                        <StatusBadge enumName="ExamRoutineStatus" value={er.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Grading Scale & Board Pass Policy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {pick('কনফিগারকৃত গ্রেডিং স্কেল', 'Configured Grading Scale')}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">{activeScale?.name}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 tabular-nums">
            {ranges.map((r) => (
              <div
                key={r.id}
                className={`p-3 border rounded-[var(--radius)] text-center ${
                  r.isFailGrade
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-border bg-surface-muted/30'
                }`}
              >
                <p className={`text-lg font-bold ${r.isFailGrade ? 'text-destructive' : 'text-primary'}`}>
                  {r.letterGrade}
                </p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {formatNumber(r.gradePoint, locale, 2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(r.minPercentage, locale)}–{formatNumber(Math.floor(r.maxPercentage), locale)}%
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-5 p-6 space-y-3.5">
          <h2 className="text-lg font-bold text-foreground">
            {pick('পরীক্ষা হল ও উত্তীর্ণ হওয়ার নীতিমালা', 'Exam Hall & Pass Policy')}
          </h2>
          <ul className="space-y-2.5 text-sm text-muted-foreground leading-relaxed">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                {pick(
                  'প্রতিটি বিষয়ে ন্যূনতম ৩৩% নম্বর এবং সৃজনশীল, বহুনির্বাচনি ও ব্যবহারিক অংশে পৃথকভাবে উত্তীর্ণ হওয়া আবশ্যক।',
                  'Minimum 33% marks overall with separate passes required in Written, MCQ, and Practical sections.'
                )}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                {pick(
                  '৪র্থ (ঐচ্ছিক) বিষয়ে জিপিএ ২.০০ এর অতিরিক্ত পয়েন্ট চূড়ান্ত জিপিএ গণনায় বোনাস হিসেবে যুক্ত হয় (সর্বোচ্চ ৫.০০)।',
                  'Optional (4th) subject grade points above 2.00 are added as GPA bonus (capped at 5.00).'
                )}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                {pick(
                  'পরীক্ষা শুরুর অন্তত ৩০ মিনিট পূর্বে বৈধ প্রবেশপত্র ও নির্ধারিত ইউনিফর্মসহ আসন গ্রহণ করতে হবে।',
                  'Candidates must enter the examination hall at least 30 minutes prior with valid admit cards and school uniform.'
                )}
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── *
 * 8. Academic Calendar 2026 (`/academics/academic-calendar`)
 * ────────────────────────────────────────────────────────────────────────── */

export function PublicCalendarPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const availableMonths = useMemo(() => {
    if (!db) return [];
    return Array.from(
      new Set(
        db.academicEvents
          .map((ev) => ev.startDate.slice(0, 7))
          .filter((ym) => ym.length === 7)
      )
    ).sort();
  }, [db]);

  const sortedEvents = useMemo(() => {
    if (!db) return [];
    const q = search.trim().toLowerCase();
    return [...db.academicEvents]
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .filter((ev) => {
        const typeOk = typeFilter === 'ALL' || ev.eventType === typeFilter;
        const monthOk = monthFilter === 'ALL' || ev.startDate.slice(0, 7) === monthFilter;
        const qOk =
          !q ||
          ev.title.toLowerCase().includes(q) ||
          (ev.description ?? '').toLowerCase().includes(q);
        return typeOk && monthOk && qOk;
      });
  }, [db, typeFilter, monthFilter, search]);

  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const counts = {
    ALL: db.academicEvents.length,
    [AcademicEventType.EVENT]: db.academicEvents.filter((e) => e.eventType === AcademicEventType.EVENT).length,
    [AcademicEventType.HOLIDAY]: db.academicEvents.filter((e) => e.eventType === AcademicEventType.HOLIDAY).length,
    [AcademicEventType.ADMISSION]: db.academicEvents.filter((e) => e.eventType === AcademicEventType.ADMISSION).length,
  };

  const tabs = [
    { key: 'ALL', label: pick('সকল সূচি', 'All Events'), count: counts.ALL },
    { key: AcademicEventType.EVENT, label: pick('পরীক্ষা ও অনুষ্ঠান', 'Exams & Events'), count: counts[AcademicEventType.EVENT] },
    { key: AcademicEventType.HOLIDAY, label: pick('সরকারি ছুটি', 'Holidays'), count: counts[AcademicEventType.HOLIDAY] },
    { key: AcademicEventType.ADMISSION, label: pick('ভর্তি কার্যক্রম', 'Admission'), count: counts[AcademicEventType.ADMISSION] },
  ];

  const totalShownDays = sortedEvents.reduce(
    (sum, ev) => sum + getDurationDays(ev.startDate, ev.endDate),
    0
  );

  const hasActiveFilter = typeFilter !== 'ALL' || monthFilter !== 'ALL' || search.trim().length > 0;
  const resetFilters = () => {
    setTypeFilter('ALL');
    setMonthFilter('ALL');
    setSearch('');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="no-print">
        <PageHeader
          title={pick('একাডেমিক ক্যালেন্ডার ২০২৬', 'Academic Calendar 2026')}
          description={pick(
            '২০২৬ শিক্ষাবর্ষের সকল সরকারি ছুটি, পরীক্ষা, ফলাফল প্রকাশ, জাতীয় দিবস এবং ভর্তি কার্যক্রমের কালানুক্রমিক তালিকা।',
            'Chronological schedule of 2026 academic events, national holidays, examinations, and admission timelines.'
          )}
          actions={
            <Button variant="outline" size="sm" onClick={triggerPrint} className="whitespace-nowrap">
              <Printer className="w-4 h-4" /> {pick('ক্যালেন্ডার প্রিন্ট করুন', 'Print Calendar')}
            </Button>
          }
        />
      </div>

      {/* Printable Institutional Letterhead */}
      <div className="hidden print:flex items-center justify-between border-b border-border pb-4 mb-4">
        <div className="flex items-center gap-3">
          <SchoolEmblem size={44} />
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {locale === 'bn' ? db.schoolProfile.name : db.schoolProfile.nameEn}
            </h1>
            <p className="text-xs text-muted-foreground tabular-nums">
              {pick(
                `একাডেমিক ক্যালেন্ডার ২০২৬ · EIIN: ${db.schoolProfile.eiin} · ${db.schoolProfile.address}`,
                `Academic Calendar 2026 · EIIN: ${db.schoolProfile.eiin} · Bhojeshwar, Noria, Shariatpur`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs, Month Selector & Search */}
      <Card className="p-4 space-y-4 no-print">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              type="button"
              size="sm"
              variant={typeFilter === tab.key ? 'primary' : 'outline'}
              onClick={() => setTypeFilter(tab.key)}
              className="whitespace-nowrap tabular-nums"
            >
              {tab.label} ({formatNumber(tab.count, locale)})
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-1 border-t border-border">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={pick('অনুষ্ঠান বা ছুটির নাম খুঁজুন...', 'Search events or holidays...')}
              className="pl-9"
            />
          </div>
          <div className="md:col-span-3">
            <Select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
              <option value="ALL">{pick('সকল মাস (২০২৬)', 'All Months (2026)')}</option>
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {getMonthLabel(ym, locale)}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-2">
            <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
              {pick(
                `${formatNumber(sortedEvents.length, 'bn')}টি সূচি`,
                `${sortedEvents.length} Entries`
              )}
            </span>
            {hasActiveFilter && (
              <Button type="button" variant="outline" size="sm" onClick={resetFilters} className="whitespace-nowrap">
                <RotateCcw className="w-3.5 h-3.5" /> {pick('রিসেট', 'Reset')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Professional Institutional Calendar Table */}
      {sortedEvents.length === 0 ? (
        <EmptyState
          title={pick('কোনো ক্যালেন্ডার সূচি পাওয়া যায়নি', 'No Calendar Events Found')}
          description={pick(
            'ধরন, মাস বা অনুসন্ধান শব্দ পরিবর্তন করে পুনরায় চেষ্টা করুন।',
            'Try adjusting the category, month, or search query.'
          )}
          action={
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw className="w-4 h-4" /> {pick('ফিল্টার রিসেট করুন', 'Reset Filters')}
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[760px]">
              <thead className="bg-surface-muted text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3.5 text-left font-semibold w-16">
                    {pick('ক্রমিক', 'SL')}
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold w-64">
                    {pick('তারিখ ও বার', 'Date & Day')}
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold">
                    {pick('কার্যক্রম / ছুটির বিবরণ', 'Event / Holiday Details')}
                  </th>
                  <th className="px-4 py-3.5 text-center font-semibold w-28">
                    {pick('সময়কাল', 'Duration')}
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold w-40">
                    {pick('ধরন', 'Category')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedEvents.map((ev, idx) => {
                  const days = getDurationDays(ev.startDate, ev.endDate);
                  const isMultiDay = ev.endDate !== ev.startDate;
                  const startWeekday = getWeekdayLabel(ev.startDate, locale);
                  const endWeekday = isMultiDay ? getWeekdayLabel(ev.endDate, locale) : '';

                  return (
                    <tr key={ev.id} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="px-4 py-4 align-top font-mono text-sm font-semibold text-muted-foreground tabular-nums">
                        {formatNumber(idx + 1, locale).padStart(2, locale === 'bn' ? '০' : '0')}
                      </td>

                      <td className="px-4 py-4 align-top tabular-nums">
                        <p className="font-semibold text-foreground whitespace-nowrap">
                          {formatDateLong(ev.startDate, locale)}
                          {isMultiDay && ` – ${formatDateLong(ev.endDate, locale)}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isMultiDay ? `${startWeekday} – ${endWeekday}` : startWeekday}
                        </p>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <p className="font-semibold text-foreground text-base leading-snug">
                          {ev.title}
                        </p>
                        {ev.description && (
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            {ev.description}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4 align-top text-center tabular-nums whitespace-nowrap">
                        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-[var(--radius)] border border-border bg-surface-muted/60 text-foreground">
                          {days > 1
                            ? pick(`${formatNumber(days, 'bn')} দিন`, `${days} Days`)
                            : pick('১ দিন', '1 Day')}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-top whitespace-nowrap">
                        <StatusBadge enumName="AcademicEventType" value={ev.eventType} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-surface-muted/50 border-t border-border">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-sm font-medium text-muted-foreground">
                    {pick(
                      `মোট তালিকাভুক্ত সূচি: ${formatNumber(sortedEvents.length, 'bn')}টি`,
                      `Total Scheduled Entries: ${sortedEvents.length}`
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">
                    {pick(`${formatNumber(totalShownDays, 'bn')} দিন`, `${totalShownDays} Days`)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {pick('শিক্ষাবর্ষ ২০২৬', 'Session 2026')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── *
 * 9. Digital Resources & Smart Classrooms (`/academics/resources`)
 * ────────────────────────────────────────────────────────────────────────── */

export function PublicResourcesPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [classFilter, setClassFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const published = db.digitalResources.filter((r) => r.isPublished);
  const q = search.trim().toLowerCase();
  const list = published.filter((r) => {
    const clsOk = classFilter === 'ALL' || r.classId === classFilter;
    const typeOk = typeFilter === 'ALL' || r.resourceType === typeFilter;
    const qOk =
      !q ||
      r.title.toLowerCase().includes(q) ||
      (r.description ?? '').toLowerCase().includes(q);
    return clsOk && typeOk && qOk;
  });

  const resourceTypes = Object.values(ResourceType);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-10">
      <PageHeader
        title={pick('ডিজিটাল শিক্ষা রিসোর্স ও স্মার্ট ক্লাসরুম', 'Digital Education Resources & Smart Classrooms')}
        description={pick(
          'বিদ্যালয়ের মাল্টিমিডিয়া স্মার্ট শ্রেণিকক্ষ, আইসিটি ল্যাব এবং শ্রেণিভিত্তিক ডিজিটাল পাঠসামগ্রী।',
          'Explore our multimedia smart classrooms, ICT laboratory, and curated class-wise digital lessons.'
        )}
      />

      {/* Smart Classrooms & ICT Lab Showcase (Previously unused seed data!) */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">
          {pick('স্মার্ট ক্লাসরুম ও ডিজিটাল ল্যাব সুবিধাসমূহ', 'Smart Classrooms & ICT Facilities')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {db.digitalClassrooms
            .filter((dc) => dc.isActive)
            .map((dc, idx) => (
              <Card key={dc.id} className="overflow-hidden flex flex-col">
                <InstitutionalArtwork
                  variant={idx === 0 ? 'digital-classroom' : 'science-lab'}
                  className="h-52 w-full rounded-none"
                />
                <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-foreground">{dc.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{dc.description}</p>
                  </div>
                  {dc.location && (
                    <p className="text-xs font-medium text-primary flex items-center gap-1.5 pt-2 border-t border-border">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{dc.location}</span>
                    </p>
                  )}
                </div>
              </Card>
            ))}
        </div>
      </section>

      {/* Filterable Digital Learning Materials */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {pick('শ্রেণিভিত্তিক ডিজিটাল পাঠ ও ভিডিও লেকচার', 'Class-wise Digital Lessons & Videos')}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
              {pick(
                `প্রদর্শিত হচ্ছে ${formatNumber(list.length, 'bn')} / ${formatNumber(published.length, 'bn')}টি রিসোর্স`,
                `Showing ${list.length} of ${published.length} resources`
              )}
            </p>
          </div>
        </div>

        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-8 relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={pick('পাঠের শিরোনাম বা বিষয় খুঁজুন...', 'Search lesson title or topic...')}
                className="pl-9"
              />
            </div>
            <div className="md:col-span-4">
              <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                <option value="ALL">{pick('সকল শ্রেণি', 'All Classes')}</option>
                {db.classes.map((c) => (
                  <option key={c.id} value={c.id}>{locale === 'bn' ? c.nameBn : c.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={typeFilter === 'ALL' ? 'primary' : 'outline'}
              onClick={() => setTypeFilter('ALL')}
              className="whitespace-nowrap"
            >
              {pick('সকল ধরন', 'All Types')}
            </Button>
            {resourceTypes.map((rt) => (
              <Button
                key={rt}
                type="button"
                size="sm"
                variant={typeFilter === rt ? 'primary' : 'outline'}
                onClick={() => setTypeFilter(rt)}
                className="whitespace-nowrap"
              >
                <StatusBadge enumName="ResourceType" value={rt} />
              </Button>
            ))}
          </div>
        </Card>

        {list.length === 0 ? (
          <EmptyState
            title={pick('কোনো ডিজিটাল রিসোর্স পাওয়া যায়নি', 'No Digital Resources Found')}
            description={pick('শ্রেণি বা রিসোর্সের ধরন পরিবর্তন করে আবার চেষ্টা করুন।', 'Try resetting class or type filters.')}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setClassFilter('ALL');
                  setTypeFilter('ALL');
                  setSearch('');
                }}
              >
                <RotateCcw className="w-4 h-4" /> {pick('ফিল্টার রিসেট করুন', 'Reset Filters')}
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {list.map((res) => {
              const cls = db.classes.find((c) => c.id === res.classId);
              const sub = db.subjects.find((s) => s.id === res.subjectId);
              return (
                <Card key={res.id} className="p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge enumName="ResourceType" value={res.resourceType} />
                      <span className="text-xs font-medium text-muted-foreground">
                        {locale === 'bn' ? cls?.nameBn : cls?.name} · {locale === 'bn' ? sub?.nameBn : sub?.name}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground flex items-start gap-2 leading-snug">
                      <MonitorPlay className="w-4 h-4 text-primary shrink-0 mt-1" />
                      <span>{res.title}</span>
                    </h3>
                    {res.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{res.description}</p>
                    )}
                  </div>
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {pick('শিক্ষা বাতায়ন / মুক্তপাঠ', 'National Portal Resource')}
                    </span>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline whitespace-nowrap"
                    >
                      {pick('রিসোর্স খুলুন', 'Open Resource')} <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── *
 * 10. School Library (`/academics/library`)
 * ────────────────────────────────────────────────────────────────────────── */

export function PublicLibraryPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const categories = useMemo(() => {
    if (!db) return [];
    return Array.from(
      new Set(
        db.libraryBooks
          .map((b) => b.category)
          .filter((c): c is string => typeof c === 'string' && c.length > 0)
      )
    );
  }, [db]);

  const filteredBooks = useMemo(() => {
    if (!db) return [];
    const q = search.trim().toLowerCase();
    return db.libraryBooks.filter((b) => {
      const catOk = categoryFilter === 'ALL' || b.category === categoryFilter;
      const qOk =
        !q ||
        b.title.toLowerCase().includes(q) ||
        (b.author ?? '').toLowerCase().includes(q) ||
        (b.publisher ?? '').toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [db, search, categoryFilter]);

  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const distributions = db.libraryDistributions.filter((d) => d.isPublished);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Editorial Split Hero with Library Photography */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-border pb-10">
        <div className="lg:col-span-7 space-y-5">
          <p className="text-sm font-semibold text-primary tracking-wide">
            {pick('জ্ঞানচর্চা ও পাঠকক্ষ · ভোজেশ্বর উচ্চ বিদ্যালয়', 'Reading Room & Catalog · BHS')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
            {db.libraryProfile.title}
          </h1>
          {db.libraryProfile.description && (
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
              {db.libraryProfile.description}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">{pick('পাঠকক্ষের সময়সূচি', 'Reading Hours')}</p>
              <p className="text-sm font-bold text-foreground mt-1">
                {pick('রবি–বৃহঃ · ১০:৩০ – ৩:৩০', 'Sun–Thu · 10:30–3:30')}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">{pick('নির্বাচিত বইয়ের ক্যাটালগ', 'Catalog Entries')}</p>
              <p className="text-xl font-bold text-primary tabular-nums mt-0.5">
                {formatNumber(db.libraryBooks.length, locale)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">{pick('বিষয়ভিত্তিক বিভাগ', 'Book Categories')}</p>
              <p className="text-xl font-bold text-primary tabular-nums mt-0.5">
                {formatNumber(categories.length, locale)}
              </p>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-5">
          <InstitutionalArtwork
            variant="library-room"
            className="h-64 sm:h-80 w-full border border-border"
            title={pick('বিদ্যালয় কেন্দ্রীয় পাঠাগার ও অধ্যয়ন কক্ষ', 'Central Library & Study Room')}
            subtitle={pick('সাহিত্য, মুক্তিযুদ্ধ, বিজ্ঞান ও রেফারেন্স গ্রন্থের সংগ্রহ', 'Literature, Liberation War, Science & Reference Collection')}
          />
        </div>
      </section>

      {/* Searchable Book Catalog */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {pick('গ্রন্থাগারের নির্বাচিত বইয়ের তালিকা', 'Selected Library Book Catalog')}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
              {pick(
                `প্রদর্শিত হচ্ছে ${formatNumber(filteredBooks.length, 'bn')} / ${formatNumber(db.libraryBooks.length, 'bn')}টি বই`,
                `Showing ${filteredBooks.length} of ${db.libraryBooks.length} books`
              )}
            </p>
          </div>
        </div>

        <Card className="p-4 space-y-4">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={pick('বইয়ের নাম, লেখক বা প্রকাশনী খুঁজুন...', 'Search by book title, author, or publisher...')}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={categoryFilter === 'ALL' ? 'primary' : 'outline'}
              onClick={() => setCategoryFilter('ALL')}
              className="whitespace-nowrap"
            >
              {pick('সকল বিভাগ', 'All Categories')}
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                type="button"
                size="sm"
                variant={categoryFilter === cat ? 'primary' : 'outline'}
                onClick={() => setCategoryFilter(cat)}
                className="whitespace-nowrap"
              >
                {cat}
              </Button>
            ))}
          </div>
        </Card>

        {filteredBooks.length === 0 ? (
          <EmptyState
            title={pick('কোনো বই পাওয়া যায়নি', 'No Books Found')}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('ALL');
                }}
              >
                <RotateCcw className="w-4 h-4" /> {pick('ফিল্টার রিসেট করুন', 'Reset Filters')}
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="p-5 flex flex-col justify-between space-y-3 hover:border-primary/40 transition-colors">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-semibold">{book.category}</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground">{book.title}</h3>
                  <p className="text-sm font-medium text-foreground/80">{book.author}</p>
                  {book.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{book.description}</p>
                  )}
                </div>
                {book.publisher && (
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                    {pick('প্রকাশনী:', 'Publisher:')} {book.publisher}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Textbook & Book Distribution Activities */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {pick('বই ও পাঠ্যপুস্তক বিতরণ কার্যক্রম', 'Textbook & Book Distribution Activities')}
          </h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {pick(`${formatNumber(distributions.length, 'bn')}টি কর্মসূচি`, `${distributions.length} Programs`)}
          </span>
        </div>
        <div className="divide-y divide-border">
          {distributions.map((dist) => (
            <div key={dist.id} className="py-4 first:pt-1 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <StatusBadge enumName="LibraryDistributionType" value={dist.type} />
                <h3 className="text-base font-semibold text-foreground">{dist.title}</h3>
                {dist.description && <p className="text-sm text-muted-foreground">{dist.description}</p>}
              </div>
              <span className="text-sm font-medium text-muted-foreground tabular-nums shrink-0 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                {formatDateLong(dist.distributionDate, locale)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
