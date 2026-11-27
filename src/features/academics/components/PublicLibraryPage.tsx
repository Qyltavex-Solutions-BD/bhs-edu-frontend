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
  return new Intl.DateTimeFormat('bn-BD', {
    weekday: 'long',
  }).format(d);
}

function getMonthLabel(yearMonth: string, locale: 'bn' | 'en'): string {
  const [y, m] = yearMonth.split('-').map(Number);
  if (!y || !m) return yearMonth;
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat('bn-BD', {
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

export function PublicLibraryPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
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
            {'জ্ঞানচর্চা ও পাঠকক্ষ · ভোজেশ্বর উচ্চ বিদ্যালয়'}
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
              <p className="text-sm text-muted-foreground">{'পাঠকক্ষের সময়সূচি'}</p>
              <p className="text-sm font-bold text-foreground mt-1">
                {'রবি–বৃহঃ · ১০:৩০ – ৩:৩০'}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{'নির্বাচিত বইয়ের ক্যাটালগ'}</p>
              <p className="text-xl font-bold text-primary tabular-nums mt-0.5">
                {formatNumber(db.libraryBooks.length, 'bn')}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{'বিষয়ভিত্তিক বিভাগ'}</p>
              <p className="text-xl font-bold text-primary tabular-nums mt-0.5">
                {formatNumber(categories.length, 'bn')}
              </p>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-5">
          <InstitutionalArtwork
            variant="library-room"
            className="h-64 sm:h-80 w-full border border-border"
            title={'বিদ্যালয় কেন্দ্রীয় পাঠাগার ও অধ্যয়ন কক্ষ'}
            subtitle={'সাহিত্য, মুক্তিযুদ্ধ, বিজ্ঞান ও রেফারেন্স গ্রন্থের সংগ্রহ'}
          />
        </div>
      </section>

      {/* Searchable Book Catalog */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {'গ্রন্থাগারের নির্বাচিত বইয়ের তালিকা'}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
              {`প্রদর্শিত হচ্ছে ${formatNumber(filteredBooks.length, 'bn')} / ${formatNumber(db.libraryBooks.length, 'bn')}টি বই`}
            </p>
          </div>
        </div>

        <Card className="p-4 space-y-4">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={'বইয়ের নাম, লেখক বা প্রকাশনী খুঁজুন...'}
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
              {'সকল বিভাগ'}
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
            title={'কোনো বই পাওয়া যায়নি'}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('ALL');
                }}
              >
                <RotateCcw className="w-4 h-4" /> {'ফিল্টার রিসেট করুন'}
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
                    <span className="text-sm font-semibold">{book.category}</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground">{book.title}</h3>
                  <p className="text-sm font-medium text-foreground/80">{book.author}</p>
                  {book.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{book.description}</p>
                  )}
                </div>
                {book.publisher && (
                  <p className="text-sm text-muted-foreground pt-2 border-t border-border">
                    {'প্রকাশনী:'} {book.publisher}
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
            {'বই ও পাঠ্যপুস্তক বিতরণ কার্যক্রম'}
          </h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            {`${formatNumber(distributions.length, 'bn')}টি কর্মসূচি`}
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
                {formatDateLong(dist.distributionDate, 'bn')}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

