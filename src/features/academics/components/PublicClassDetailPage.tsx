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

