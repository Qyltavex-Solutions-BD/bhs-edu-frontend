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

