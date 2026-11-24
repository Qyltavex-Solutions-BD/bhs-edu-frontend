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

