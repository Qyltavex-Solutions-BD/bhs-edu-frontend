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

