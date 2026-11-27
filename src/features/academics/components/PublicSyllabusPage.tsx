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
import { SYLLABUS_TERM_LABELS } from '../model/syllabus';

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

export function PublicSyllabusPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
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
          title={'সিলেবাস ও বিদ্যালয় নীতিমালা'}
          description={'২০২৬ শিক্ষাবর্ষের শ্রেণি ও পরীক্ষাভিত্তিক অধ্যায়-তালিকা, অফিসিয়াল সিলেবাস পিডিএফ ডাউনলোড এবং বিদ্যালয়ের আচরণবিধি ও ড্রেস কোড।'}
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
            {'শ্রেণি ও পরীক্ষাভিত্তিক সিলেবাস (২০২৬)'}
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
            {'বিদ্যালয় নীতিমালা ও ড্রেস কোড'}
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
                  {'শ্রেণি নির্বাচন করুন'}
                </label>
                <Select
                  value={activeClass?.id ?? 'cls-10'}
                  onChange={(e) => handleClassChange(e.target.value)}
                >
                  {sortedClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn ?? c.name}
                    </option>
                  ))}
                </Select>
              </div>

              {supportsGroups && (
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {'বিভাগ (৯ম–১০ম)'}
                  </label>
                  <Select value={effectiveGroup} onChange={(e) => setGroupFilter(e.target.value)}>
                    <option value="ALL">{'সকল বিভাগ'}</option>
                    {db.academicGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nameBn ?? g.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              <div className={supportsGroups ? 'md:col-span-6' : 'md:col-span-9'}>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {'পরীক্ষার পর্ব'}
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
                        {label.bn}
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
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground tabular-nums">
                          <span className="font-semibold text-primary">
                            {file.fileType === 'PDF'
                              ? 'অফিসিয়াল সিলেবাস PDF'
                              : 'সিলেবাস সংযুক্তি (ছবি)'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{file.fileSize}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {'প্রকাশ:'} {formatDateLong(file.publishedAt, 'bn')}
                          </span>
                          {fileGroup && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{fileGroup.nameBn}</span>
                            </>
                          )}
                        </div>
                        <h2 className="text-base font-bold text-foreground leading-snug">
                          {file.title}
                        </h2>
                        <p className="text-sm font-mono text-muted-foreground truncate">
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
                            {'প্রিভিউ দেখুন'}
                          </Button>
                          <a href={file.fileUrl} download={file.fileName}>
                            <Button variant="primary" size="sm" className="whitespace-nowrap">
                              <Download className="w-4 h-4" />
                              {'ফাইল ডাউনলোড'}
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
                          {'পিডিএফ ডাউনলোড / প্রিন্ট'}
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
                    {db.schoolProfile.name}
                  </p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {`স্থাপিত: ${formatNumber(db.schoolProfile.establishedYear, 'bn')} · EIIN: ${db.schoolProfile.eiin} · ${db.schoolProfile.address}`}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={triggerPrint} className="no-print whitespace-nowrap">
                <Printer className="w-4 h-4" />
                {'প্রিন্ট / পিডিএফ'}
              </Button>
            </div>

            {/* Syllabus Heading & Summary Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                  {`${activeClass?.nameBn ?? activeClass?.name} — ${SYLLABUS_TERM_LABELS[effectiveTerm].bn} সিলেবাস ২০২৬`}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground tabular-nums">
                  <span>
                    {activeGroupObj
                      ? `বিভাগ: ${activeGroupObj.nameBn ?? activeGroupObj.name}`
                      : supportsGroups
                        ? 'সকল বিভাগ (আবশ্যিক ও বিভাগীয় বিষয়)'
                        : 'সাধারণ মাধ্যমিক পাঠ্যক্রম (এনসিটিবি)'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {`মোট তালিকাভুক্ত বিষয়: ${formatNumber(matchingEntries.length, 'bn')}টি`}
                  </span>
                </div>
              </div>
            </div>

            {/* Chapter-wise Syllabus Table */}
            {matchingEntries.length === 0 ? (
              <EmptyState
                title={'এই শ্রেণি ও পরীক্ষার সিলেবাস এখনও যুক্ত করা হয়নি'}
                description={'অ্যাডমিন প্যানেল থেকে অধ্যায়ভিত্তিক সিলেবাস অথবা অফিসিয়াল পিডিএফ আপলোড করা হলে এখানে প্রদর্শিত হবে।'}
              />
            ) : (
              <div className="overflow-x-auto border border-border rounded-[var(--radius)]">
                <table className="w-full text-base border-collapse">
                  <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                        {'বোর্ড কোড'}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                        {'বিষয়ের নাম'}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        {'নির্ধারিত অধ্যায় ও পাঠ্যসীমা'}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                        {'মানবণ্টন ও মূল্যায়ন'}
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
                              {sub?.nameBn ?? sub?.name}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {grp
                                ? `${grp.nameBn ?? grp.name} বিভাগ`
                                : 'আবশ্যিক বিষয়'}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-foreground leading-relaxed min-w-[280px]">
                            {entry.chaptersBn}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground tabular-nums whitespace-nowrap">
                            {entry.marksBreakdownBn}
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
                {'অনুমোদনক্রমে: প্রধান শিক্ষক, ভোজেশ্বর উচ্চ বিদ্যালয় · এনসিটিবি অনুমোদিত পাঠ্যসূচি'}
              </span>
              <div className="flex flex-wrap items-center gap-4 no-print">
                <Link href="/academics/subjects" className="font-semibold text-primary hover:underline whitespace-nowrap">
                  {'বিষয় ও বোর্ড কোড'}
                </Link>
                <Link href="/academics/examination" className="font-semibold text-primary hover:underline whitespace-nowrap">
                  {'পরীক্ষার রুটিন ও গ্রেডিং →'}
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
                        {db.schoolProfile.name}
                      </p>
                      <p className="text-sm text-muted-foreground tabular-nums">
                        {`স্থাপিত: ${formatNumber(db.schoolProfile.establishedYear, 'bn')} · EIIN: ${db.schoolProfile.eiin} · ${db.schoolProfile.address}`}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={triggerPrint} className="no-print whitespace-nowrap">
                    <Printer className="w-4 h-4" /> {'প্রিন্ট / পিডিএফ সংরক্ষণ'}
                  </Button>
                </div>

                {/* Title & Summary */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge enumName="AcademicDocumentType" value={activeDoc.type} />
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {'কার্যকর শিক্ষাবর্ষ: ২০২৬'}
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
                        {sec.headingBn}
                      </h3>
                      <ul className="space-y-2.5">
                        {(sec.pointsBn).map((pt, i) => (
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
                    {'অনুমোদনক্রমে: প্রধান শিক্ষক, ভোজেশ্বর উচ্চ বিদ্যালয়'}
                  </span>
                  <Link href="/academics/classes" className="font-semibold text-primary hover:underline no-print">
                    {'শ্রেণিভিত্তিক বিষয় ও পাঠ্যবই দেখুন →'}
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
        title={previewFile?.title ?? 'সিলেবাস প্রিভিউ'}
        maxWidth="max-w-4xl"
      >
        {previewFile && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border text-sm text-muted-foreground">
              <span className="font-mono text-sm">{previewFile.fileName} · {previewFile.fileSize}</span>
              {previewFile.fileUrl && (
                <a href={previewFile.fileUrl} download={previewFile.fileName}>
                  <Button variant="primary" size="sm">
                    <Download className="w-4 h-4" />
                    {'ডাউনলোড করুন'}
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

