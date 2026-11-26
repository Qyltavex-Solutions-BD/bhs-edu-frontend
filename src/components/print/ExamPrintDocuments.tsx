'use client';

import React from 'react';
import { SCHOOL_LOGO_SRC, SchoolEmblem } from '@/src/components/shared/Feedback';
import { formatDateLong, formatDateShort, formatNumber, formatTime, formatYear } from '@/src/lib/formatters';
import type { GradeRange, SchoolProfile } from '@/src/types/entities';
import { useI18n } from '@/src/lib/i18n';

const DEFAULT_NCTB_LEGEND = [
  { range: '80–100', grade: 'A+', gp: '5.00' },
  { range: '70–79', grade: 'A', gp: '4.00' },
  { range: '60–69', grade: 'A-', gp: '3.50' },
  { range: '50–59', grade: 'B', gp: '3.00' },
  { range: '40–49', grade: 'C', gp: '2.00' },
  { range: '33–39', grade: 'D', gp: '1.00' },
  { range: '00–32', grade: 'F', gp: '0.00' },
];

/**
 * Shared Institutional Exam Document Shell.
 * Faithfully matches the formal Bangladeshi school aesthetic of PrintableTransferCertificate
 * and PrintableTestimonialCertificate (FormalCertificateShell):
 * - Pure white paper (#FFFFFF) & crisp black ink (#111111 / #18181B)
 * - Classic double-border institutional frame (2px outer + 1px inner)
 * - Subtle centered school crest watermark (7% opacity)
 * - Full-color emblem letterhead with double bottom border
 * - Supports both Portrait A4 and Landscape A4 print orientation
 */
export function FormalExamDocumentShell({
  school,
  titleBn,
  titleEn,
  subtitleBn,
  subtitleEn,
  refLabel,
  dateLabel,
  orientation = 'portrait',
  compact = false,
  allowFlow = false,
  isPrintRoot = true,
  pageBreakAfter = false,
  signatures,
  children,
}: {
  school: SchoolProfile;
  titleBn: string;
  titleEn: string;
  subtitleBn?: string;
  subtitleEn?: string;
  refLabel?: React.ReactNode;
  dateLabel?: React.ReactNode;
  orientation?: 'portrait' | 'landscape';
  compact?: boolean;
  allowFlow?: boolean;
  isPrintRoot?: boolean;
  pageBreakAfter?: boolean;
  signatures?: Array<{ titleBn: string; titleEn: string; subtitle?: string }>;
  children: React.ReactNode;
}) {
  const { locale, pick } = useI18n();
  const isLandscape = orientation === 'landscape';
  const useFlow = isLandscape || allowFlow;
  const defaultSignatures = signatures ?? [
    { titleBn: 'শ্রেণি শিক্ষক', titleEn: 'Class Teacher' },
    { titleBn: 'পরীক্ষা নিয়ন্ত্রক', titleEn: 'Controller of Examinations' },
    { titleBn: 'প্রধান শিক্ষক', titleEn: 'Head Teacher' },
  ];

  return (
    <div
      data-certificate-print-root={isPrintRoot ? 'true' : undefined}
      data-print-orientation={isPrintRoot ? orientation : undefined}
      className={`${
        useFlow
          ? `certificate-paper-flow ${isLandscape ? 'print-landscape max-w-[1120px]' : 'max-w-[820px]'}`
          : 'certificate-paper max-w-[820px]'
      } ${pageBreakAfter ? 'print-page-break' : ''} mx-auto bg-white text-[#111111] shadow-sm border border-[#D4D4D8] print:shadow-none print:border-0 print:max-w-none print:w-full p-2.5 sm:p-4 print:p-0`}
    >
      {/* Classic Double-Border Formal Institutional Frame */}
      <div className="border-[2px] border-[#18181B] p-[4px] bg-white">
        <div
          className={`relative border border-[#52525B] overflow-hidden print:overflow-visible flex flex-col justify-between ${
            compact
              ? 'px-4 sm:px-6 py-4 sm:py-5 print:px-5 print:py-4'
              : isLandscape
                ? 'px-5 sm:px-7 py-5 sm:py-6 min-h-[620px] print:min-h-[186mm] print:px-5 print:py-4'
                : allowFlow
                  ? 'px-5 sm:px-8 py-5 sm:py-6 min-h-[960px] print:min-h-[273mm] print:px-6 print:py-5'
                  : 'px-5 sm:px-9 py-5 sm:py-7 min-h-[960px] print:min-h-[273mm] print:px-7 print:py-5'
          }`}
        >
          {/* Subtle Centered School Crest Watermark */}
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute inset-0 flex items-center justify-center"
          >
            <img
              src={SCHOOL_LOGO_SRC}
              alt=""
              className={`${
                isLandscape ? 'w-[280px] h-[280px]' : 'w-[300px] sm:w-[340px] h-[300px] sm:h-[340px]'
              } object-contain opacity-[0.065]`}
            />
          </div>

          <div className="relative z-10">
            {/* Institutional Letterhead */}
            <header className="text-center border-b-[3px] border-double border-[#27272A] pb-3 mb-3.5 print:pb-2.5 print:mb-3">
              <div className="flex flex-col sm:flex-row print:flex-row items-center justify-center gap-3">
                <SchoolEmblem size={compact ? 52 : 58} />
                <div className="text-center sm:text-left print:text-left">
                  <h1 className="text-xl sm:text-2xl print:text-[20px] font-bold tracking-tight text-[#111111] leading-snug">
                    {school.name}
                  </h1>
                  <p className="text-[11px] sm:text-xs print:text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#27272A] mt-0.5">
                    {school.nameEn ?? 'BHOJESHWAR HIGH SCHOOL'}
                  </p>
                  <p className="text-xs print:text-[11px] text-[#3F3F46] mt-0.5">{school.address}</p>
                  <p className="text-[11px] print:text-[10px] text-[#52525B] tabular-nums mt-0.5">
                    EIIN: {school.eiin ?? '113587'} &nbsp;|&nbsp;{' '}
                    {pick('স্থাপিত:', 'Est:')} {formatYear(school.establishedYear ?? 1978, locale)}
                    {school.schoolCode ? ` | ${pick('বিদ্যালয় কোড:', 'Code:')} ${school.schoolCode}` : ''}
                    {school.phone ? ` | ${pick('ফোন:', 'Phone:')} ${school.phone}` : ''}
                  </p>
                </div>
              </div>

              {/* Centered Formal Document Title Box */}
              <div className="mt-2.5 flex flex-col items-center">
                <div className="inline-block border-[1.5px] border-[#18181B] px-5 py-1 bg-white">
                  <h2 className="text-sm sm:text-base print:text-[13px] font-bold tracking-wide text-[#111111] uppercase">
                    {locale === 'bn' ? titleBn : titleEn}
                  </h2>
                </div>
                {(subtitleBn || subtitleEn) && (
                  <p className="text-xs print:text-[11.5px] font-semibold text-[#27272A] mt-1">
                    {locale === 'bn' ? subtitleBn || subtitleEn : subtitleEn || subtitleBn}
                  </p>
                )}
              </div>
            </header>

            {/* Optional Reference & Date Metadata Bar */}
            {(refLabel || dateLabel) && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs print:text-[11px] text-[#27272A] mb-3 tabular-nums">
                <div>{refLabel}</div>
                <div>{dateLabel}</div>
              </div>
            )}

            {/* Main Document Body */}
            {children}
          </div>

          {/* Formal Signature Footer */}
          <footer className="relative z-10 mt-6 print:mt-5 pt-3 break-inside-avoid">
            <div
              className={`grid gap-6 text-center text-xs sm:text-sm print:text-[11.5px] text-[#111111] ${
                defaultSignatures.length === 2
                  ? 'grid-cols-2'
                  : defaultSignatures.length === 4
                    ? 'grid-cols-2 sm:grid-cols-4 print:grid-cols-4'
                    : 'grid-cols-3'
              }`}
            >
              {defaultSignatures.map((sig, i) => (
                <div key={i} className="pt-7 print:pt-6">
                  <div className="border-t border-[#18181B] pt-1.5 mx-auto max-w-[190px]">
                    <p className="font-bold text-[#111111]">
                      {locale === 'bn' ? sig.titleBn : sig.titleEn}
                    </p>
                    {sig.subtitle && (
                      <p className="text-[11px] print:text-[10px] text-[#52525B] mt-0.5">{sig.subtitle}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3.5 pt-2 border-t border-[#E4E4E7] flex flex-wrap items-center justify-between gap-2 text-[10px] print:text-[9px] text-[#71717A]">
              <span>
                {pick(
                  'প্রাতিষ্ঠানিক কম্পিউটারাইজড কপি — প্রতিষ্ঠান প্রধানের স্বাক্ষর ও সীল ব্যতীত অকার্যকর',
                  'Official Institutional Record — Valid with authorized signature and school seal'
                )}
              </span>
              <span className="tabular-nums">
                {school.nameEn ?? 'Bhojeshwar High School'} · EIIN {school.eiin ?? '113587'}
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 1. Institutional Academic Transcript / Marksheet (Single & Bulk)
// ============================================================================

export interface PrintableMarksheetProps {
  school: SchoolProfile;
  examName: string;
  student: {
    studentId: string;
    nameEn: string;
    nameBn?: string | null;
    fatherName?: string | null;
    motherName?: string | null;
    dateOfBirth?: string | null;
    roll: number;
    className: string;
    classNameBn: string;
    sectionName: string;
    groupName?: string | null;
    groupNameBn?: string | null;
    academicYear: string;
  };
  summary: {
    totalFullMarks: number;
    totalMarks: number;
    gpa?: number | null;
    gpaWithoutOptional?: number | null;
    letterGrade?: string | null;
    meritPosition?: number | null;
    sectionMeritPosition?: number | null;
    failedSubjectCount: number;
    resultStatus: string;
    teacherRemarks?: string | null;
    publishedAt?: string | null;
  };
  subjects: Array<{
    subjectCode: string;
    subjectName: string;
    subjectNameBn: string;
    fullMarks: number;
    writtenMarks: number;
    mcqMarks: number;
    practicalMarks: number;
    continuousAssessmentMarks?: number;
    highestMarks?: number | null;
    totalMarks: number;
    letterGrade?: string | null;
    gradePoint?: number | null;
    isPassed: boolean;
    isOptional: boolean;
    bonusGradePoint: number;
    isAbsent: boolean;
  }>;
  gradeRanges?: GradeRange[];
  attendance?: { presentDays: number; workingDays: number } | null;
  isPrintRoot?: boolean;
  pageBreakAfter?: boolean;
}

export function PrintableMarksheet({
  school,
  examName,
  student,
  summary,
  subjects,
  gradeRanges,
  attendance,
  isPrintRoot = true,
  pageBreakAfter = false,
}: PrintableMarksheetProps) {
  const { locale, pick } = useI18n();
  const hasCaColumn = subjects.some((s) => (s.continuousAssessmentMarks ?? 0) > 0);
  const hasHighestColumn = subjects.some((s) => s.highestMarks !== undefined && s.highestMarks !== null);

  const legendRows =
    gradeRanges && gradeRanges.length > 0
      ? [...gradeRanges]
          .filter((r) => !r.isDeleted)
          .sort((a, b) => b.minPercentage - a.minPercentage)
          .map((r) => ({
            range: `${formatNumber(r.minPercentage, locale)}–${formatNumber(Math.floor(r.maxPercentage), locale)}`,
            grade: r.letterGrade,
            gp: formatNumber(r.gradePoint, locale, 2),
          }))
      : DEFAULT_NCTB_LEGEND.map((r) => ({
          range: r.range,
          grade: r.grade,
          gp: formatNumber(Number(r.gp), locale, 2),
        }));

  const compulsorySubjects = subjects.filter((s) => !s.isOptional);
  const optionalSubjects = subjects.filter((s) => s.isOptional);
  const issueDate = summary.publishedAt
    ? formatDateLong(summary.publishedAt, locale)
    : formatDateLong(new Date().toISOString().slice(0, 10), locale);

  const attendancePct =
    attendance && attendance.workingDays > 0
      ? Math.round((attendance.presentDays / attendance.workingDays) * 100)
      : null;

  return (
    <FormalExamDocumentShell
      school={school}
      titleBn="একাডেমিক ট্রান্সক্রিপ্ট / নম্বরপত্র"
      titleEn="ACADEMIC TRANSCRIPT / PROGRESS REPORT"
      subtitleBn={examName}
      subtitleEn={examName}
      refLabel={
        <span>
          <strong>{pick('আইডি নং:', 'Student ID:')}</strong>{' '}
          <span className="font-mono">{student.studentId}</span>
        </span>
      }
      dateLabel={
        <span>
          <strong>{pick('প্রকাশের তারিখ:', 'Date of Issue:')}</strong> {issueDate}
        </span>
      }
      isPrintRoot={isPrintRoot}
      pageBreakAfter={pageBreakAfter}
      signatures={[
        { titleBn: 'অভিভাবকের স্বাক্ষর', titleEn: 'Guardian Signature' },
        { titleBn: 'শ্রেণি শিক্ষক', titleEn: 'Class Teacher' },
        { titleBn: 'প্রধান শিক্ষক', titleEn: 'Head Teacher', subtitle: school.name },
      ]}
    >
      {/* Top Info Section: Student Profile (Left) + Official NCTB Grading Scale Legend (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-3.5 mb-3.5 items-start">
        <div className="md:col-span-8 print:col-span-8 border border-[#52525B] p-2.5 text-xs print:text-[11.5px] space-y-1">
          <div className="grid grid-cols-12 gap-1">
            <span className="col-span-4 text-[#52525B]">{pick('শিক্ষার্থীর নাম', 'Name of Student')}</span>
            <span className="col-span-8 font-bold text-[#111111]">
              : {locale === 'bn' ? student.nameBn || student.nameEn : student.nameEn}
            </span>
          </div>
          {student.fatherName && (
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-4 text-[#52525B]">{pick('পিতার নাম', "Father's Name")}</span>
              <span className="col-span-8 font-medium">: {student.fatherName}</span>
            </div>
          )}
          {student.motherName && (
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-4 text-[#52525B]">{pick('মাতার নাম', "Mother's Name")}</span>
              <span className="col-span-8 font-medium">: {student.motherName}</span>
            </div>
          )}
          <div className="grid grid-cols-12 gap-1 tabular-nums">
            <span className="col-span-4 text-[#52525B]">{pick('শ্রেণি ও শাখা', 'Class & Section')}</span>
            <span className="col-span-8 font-semibold">
              : {locale === 'bn' ? student.classNameBn : student.className} ({student.sectionName})
              {student.groupName
                ? ` · ${locale === 'bn' ? student.groupNameBn || student.groupName : student.groupName}`
                : ''}
            </span>
          </div>
          <div className="grid grid-cols-12 gap-1 tabular-nums">
            <span className="col-span-4 text-[#52525B]">{pick('রোল নম্বর', 'Roll Number')}</span>
            <span className="col-span-8 font-bold">
              : {formatNumber(student.roll, locale)} &nbsp;&nbsp;|&nbsp;&nbsp;{' '}
              <span className="text-[#52525B] font-normal">{pick('শিক্ষাবর্ষ:', 'Session:')}</span>{' '}
              {formatYear(student.academicYear, locale)}
            </span>
          </div>
          {attendance && attendance.workingDays > 0 && (
            <div className="grid grid-cols-12 gap-1 tabular-nums">
              <span className="col-span-4 text-[#52525B]">{pick('শ্রেণি উপস্থিতি', 'Attendance')}</span>
              <span className="col-span-8 font-medium">
                : {formatNumber(attendance.presentDays, locale)} / {formatNumber(attendance.workingDays, locale)}{' '}
                {pick('কার্যদিবস', 'days')} ({formatNumber(attendancePct ?? 0, locale)}%)
              </span>
            </div>
          )}
        </div>

        {/* Compact Official Grading Scale Table (Bangladeshi Board Transcript Standard) */}
        <div className="md:col-span-4 print:col-span-4">
          <table className="w-full text-[10px] border border-[#18181B] border-collapse tabular-nums">
            <thead>
              <tr className="bg-[#F4F4F5] text-[#111111]">
                <th className="border border-[#52525B] px-1.5 py-0.5 text-center font-bold">
                  {pick('নম্বর (%)', 'Marks %')}
                </th>
                <th className="border border-[#52525B] px-1.5 py-0.5 text-center font-bold">
                  {pick('গ্রেড', 'Grade')}
                </th>
                <th className="border border-[#52525B] px-1.5 py-0.5 text-center font-bold">
                  {pick('পয়েন্ট', 'GP')}
                </th>
              </tr>
            </thead>
            <tbody>
              {legendRows.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-[#52525B] px-1.5 py-0.5 text-center">{row.range}</td>
                  <td className="border border-[#52525B] px-1.5 py-0.5 text-center font-semibold">{row.grade}</td>
                  <td className="border border-[#52525B] px-1.5 py-0.5 text-center">{row.gp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subject-wise Marks Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-[#18181B] border-collapse tabular-nums">
          <thead>
            <tr className="bg-[#F4F4F5] text-[#111111]">
              <th className="border border-[#18181B] px-2 py-1.5 text-center w-12">
                {pick('কোড', 'Code')}
              </th>
              <th className="border border-[#18181B] px-2.5 py-1.5 text-left">
                {pick('বিষয়ের নাম', 'Name of Subject')}
              </th>
              <th className="border border-[#18181B] px-2 py-1.5 text-right">
                {pick('পূর্ণমান', 'Full')}
              </th>
              <th className="border border-[#18181B] px-2 py-1.5 text-right">
                {pick('সৃজনশীল/লিখিত', 'Written')}
              </th>
              <th className="border border-[#18181B] px-2 py-1.5 text-right">MCQ</th>
              <th className="border border-[#18181B] px-2 py-1.5 text-right">
                {pick('ব্যবহারিক', 'Prac')}
              </th>
              {hasCaColumn && (
                <th className="border border-[#18181B] px-2 py-1.5 text-right">
                  {pick('ধারাবাহিক', 'CA')}
                </th>
              )}
              <th className="border border-[#18181B] px-2 py-1.5 text-right font-bold">
                {pick('মোট প্রাপ্ত', 'Total')}
              </th>
              {hasHighestColumn && (
                <th className="border border-[#18181B] px-2 py-1.5 text-right">
                  {pick('সর্বোচ্চ', 'High')}
                </th>
              )}
              <th className="border border-[#18181B] px-2 py-1.5 text-center">
                {pick('লেটার গ্রেড', 'Grade')}
              </th>
              <th className="border border-[#18181B] px-2 py-1.5 text-right">
                {pick('গ্রেড পয়েন্ট', 'GP')}
              </th>
            </tr>
          </thead>
          <tbody>
            {compulsorySubjects.map((sub, idx) => (
              <tr key={`comp-${idx}`}>
                <td className="border border-[#52525B] px-2 py-1.5 text-center font-mono">
                  {sub.subjectCode}
                </td>
                <td className="border border-[#52525B] px-2.5 py-1.5 font-medium">
                  {locale === 'bn' ? sub.subjectNameBn : sub.subjectName}
                </td>
                <td className="border border-[#52525B] px-2 py-1.5 text-right">
                  {formatNumber(sub.fullMarks, locale)}
                </td>
                <td className="border border-[#52525B] px-2 py-1.5 text-right">
                  {sub.isAbsent ? 'AB' : formatNumber(sub.writtenMarks, locale)}
                </td>
                <td className="border border-[#52525B] px-2 py-1.5 text-right">
                  {sub.isAbsent ? 'AB' : formatNumber(sub.mcqMarks, locale)}
                </td>
                <td className="border border-[#52525B] px-2 py-1.5 text-right">
                  {sub.isAbsent ? 'AB' : formatNumber(sub.practicalMarks, locale)}
                </td>
                {hasCaColumn && (
                  <td className="border border-[#52525B] px-2 py-1.5 text-right">
                    {sub.isAbsent ? 'AB' : formatNumber(sub.continuousAssessmentMarks ?? 0, locale)}
                  </td>
                )}
                <td className="border border-[#52525B] px-2 py-1.5 text-right font-bold">
                  {sub.isAbsent ? 'AB' : formatNumber(sub.totalMarks, locale)}
                </td>
                {hasHighestColumn && (
                  <td className="border border-[#52525B] px-2 py-1.5 text-right text-[#52525B]">
                    {sub.highestMarks !== null && sub.highestMarks !== undefined
                      ? formatNumber(sub.highestMarks, locale)
                      : '—'}
                  </td>
                )}
                <td
                  className={`border border-[#52525B] px-2 py-1.5 text-center font-bold ${
                    sub.isPassed ? 'text-[#111111]' : 'text-[#991B1B]'
                  }`}
                >
                  {sub.letterGrade ?? '—'}
                </td>
                <td className="border border-[#52525B] px-2 py-1.5 text-right font-semibold">
                  {sub.gradePoint !== null && sub.gradePoint !== undefined
                    ? formatNumber(sub.gradePoint, locale, 2)
                    : '—'}
                </td>
              </tr>
            ))}

            {optionalSubjects.length > 0 && (
              <>
                <tr className="bg-[#FAFAFA]">
                  <td
                    colSpan={9 + (hasCaColumn ? 1 : 0) + (hasHighestColumn ? 1 : 0)}
                    className="border border-[#52525B] px-2.5 py-1 text-[11px] font-bold text-[#27272A]"
                  >
                    {pick('ঐচ্ছিক / ৪র্থ বিষয় (GP ২.০০-এর অতিরিক্ত পয়েন্ট বোনাস হিসেবে যুক্ত)', 'Additional / 4th Subject (GP above 2.00 added as bonus)')}
                  </td>
                </tr>
                {optionalSubjects.map((sub, idx) => (
                  <tr key={`opt-${idx}`}>
                    <td className="border border-[#52525B] px-2 py-1.5 text-center font-mono">
                      {sub.subjectCode}
                    </td>
                    <td className="border border-[#52525B] px-2.5 py-1.5 font-medium">
                      {locale === 'bn' ? sub.subjectNameBn : sub.subjectName}
                      {sub.bonusGradePoint > 0 && (
                        <span className="ml-1.5 text-[11px] text-[#3F3F46]">
                          (+{formatNumber(sub.bonusGradePoint, locale, 2)} {pick('বোনাস', 'bonus')})
                        </span>
                      )}
                    </td>
                    <td className="border border-[#52525B] px-2 py-1.5 text-right">
                      {formatNumber(sub.fullMarks, locale)}
                    </td>
                    <td className="border border-[#52525B] px-2 py-1.5 text-right">
                      {sub.isAbsent ? 'AB' : formatNumber(sub.writtenMarks, locale)}
                    </td>
                    <td className="border border-[#52525B] px-2 py-1.5 text-right">
                      {sub.isAbsent ? 'AB' : formatNumber(sub.mcqMarks, locale)}
                    </td>
                    <td className="border border-[#52525B] px-2 py-1.5 text-right">
                      {sub.isAbsent ? 'AB' : formatNumber(sub.practicalMarks, locale)}
                    </td>
                    {hasCaColumn && (
                      <td className="border border-[#52525B] px-2 py-1.5 text-right">
                        {sub.isAbsent ? 'AB' : formatNumber(sub.continuousAssessmentMarks ?? 0, locale)}
                      </td>
                    )}
                    <td className="border border-[#52525B] px-2 py-1.5 text-right font-bold">
                      {sub.isAbsent ? 'AB' : formatNumber(sub.totalMarks, locale)}
                    </td>
                    {hasHighestColumn && (
                      <td className="border border-[#52525B] px-2 py-1.5 text-right text-[#52525B]">
                        {sub.highestMarks !== null && sub.highestMarks !== undefined
                          ? formatNumber(sub.highestMarks, locale)
                          : '—'}
                      </td>
                    )}
                    <td className="border border-[#52525B] px-2 py-1.5 text-center font-bold">
                      {sub.letterGrade ?? '—'}
                    </td>
                    <td className="border border-[#52525B] px-2 py-1.5 text-right font-semibold">
                      {sub.gradePoint !== null && sub.gradePoint !== undefined
                        ? formatNumber(sub.gradePoint, locale, 2)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Formal Summary Box */}
      <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-6 print:grid-cols-6 border border-[#18181B] divide-y sm:divide-y-0 sm:divide-x print:divide-y-0 print:divide-x divide-[#52525B] text-center tabular-nums">
        <div className="p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-[#52525B]">{pick('মোট নম্বর', 'Total Marks')}</p>
          <p className="text-sm font-bold mt-0.5">
            {formatNumber(summary.totalMarks, locale)} / {formatNumber(summary.totalFullMarks, locale)}
          </p>
        </div>
        <div className="p-2.5 bg-[#FAFAFA]">
          <p className="text-[10px] uppercase tracking-wide text-[#52525B]">{pick('অর্জিত জিপিএ', 'Final GPA')}</p>
          <p className="text-sm font-bold mt-0.5">
            {summary.gpa !== null && summary.gpa !== undefined ? formatNumber(summary.gpa, locale, 2) : '—'}
          </p>
        </div>
        <div className="p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-[#52525B]">{pick('৪র্থ ছাড়া জিপিএ', 'GPA (w/o 4th)')}</p>
          <p className="text-sm font-bold mt-0.5">
            {summary.gpaWithoutOptional !== null && summary.gpaWithoutOptional !== undefined
              ? formatNumber(summary.gpaWithoutOptional, locale, 2)
              : '—'}
          </p>
        </div>
        <div className="p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-[#52525B]">{pick('লেটার গ্রেড', 'Grade')}</p>
          <p className="text-sm font-bold mt-0.5">{summary.letterGrade ?? '—'}</p>
        </div>
        <div className="p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-[#52525B]">{pick('মেধাক্রম (শ্রেণি/শাখা)', 'Merit (Cls/Sec)')}</p>
          <p className="text-sm font-bold mt-0.5">
            {summary.meritPosition ? `#${formatNumber(summary.meritPosition, locale)}` : '—'}
            {summary.sectionMeritPosition ? ` / #${formatNumber(summary.sectionMeritPosition, locale)}` : ''}
          </p>
        </div>
        <div className="p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-[#52525B]">{pick('ফলাফল', 'Status')}</p>
          <p
            className={`text-sm font-bold mt-0.5 ${
              summary.resultStatus === 'PASS' ? 'text-[#111111]' : 'text-[#991B1B]'
            }`}
          >
            {summary.resultStatus === 'PASS'
              ? pick('উত্তীর্ণ (PASS)', 'PASSED')
              : summary.resultStatus === 'FAIL'
                ? pick('অনুত্তীর্ণ (FAIL)', 'FAILED')
                : summary.resultStatus}
          </p>
        </div>
      </div>

      {/* Class Teacher's Remarks Box */}
      <div className="mt-3.5 border border-[#52525B] px-3.5 py-2.5 text-xs">
        <span className="font-bold text-[#111111]">
          {pick('শ্রেণি শিক্ষকের মন্তব্য:', "Class Teacher's Remarks:")}
        </span>{' '}
        <span className="text-[#27272A]">
          {summary.teacherRemarks ||
            (summary.resultStatus === 'PASS'
              ? pick(
                  'সন্তোষজনক ফলাফল। নিয়মিত অধ্যবসায় ও শৃঙ্খলা বজায় রাখার পরামর্শ দেওয়া হলো।',
                  'Satisfactory academic progress. Encouraged to maintain regular study and discipline.'
                )
              : pick(
                  'অনুত্তীর্ণ বিষয়ে অতিরিক্ত মনোযোগ, নিয়মিত ক্লাস উপস্থিতি ও অভিভাবকের তদারকি প্রয়োজন।',
                  'Requires focused revision in failed subjects, regular attendance, and guardian supervision.'
                ))}
        </span>
      </div>
    </FormalExamDocumentShell>
  );
}

export function PrintableBulkMarksheets({
  items,
}: {
  items: PrintableMarksheetProps[];
}) {
  return (
    <div data-certificate-print-root="true" data-print-orientation="portrait" className="space-y-6 print:space-y-0">
      {items.map((item, idx) => (
        <PrintableMarksheet
          key={`${item.student.studentId}-${idx}`}
          {...item}
          isPrintRoot={false}
          pageBreakAfter={idx < items.length - 1}
        />
      ))}
    </div>
  );
}

// ============================================================================
// 2. Institutional Landscape A4 Tabulation Sheet
// ============================================================================

export function PrintableTabulationSheet({
  school,
  examName,
  className,
  sectionLabel,
  academicYear,
  subjects,
  rows,
}: {
  school: SchoolProfile;
  examName: string;
  className: string;
  sectionLabel?: string;
  academicYear: string;
  subjects: Array<{ id: string; code: string; nameBn: string; nameEn: string; fullMarks: number }>;
  rows: Array<{
    roll: number;
    studentId: string;
    studentName: string;
    sectionName: string;
    groupName?: string | null;
    subjectMarks: Record<string, { total: number; grade: string; isAbsent?: boolean; isPassed?: boolean }>;
    totalMarks: number;
    totalFullMarks: number;
    gpa: number | null;
    gpaWithoutOptional?: number | null;
    letterGrade: string | null;
    meritPosition: number | null;
    resultStatus: string;
  }>;
}) {
  const { locale, pick } = useI18n();
  const passedCount = rows.filter((r) => r.resultStatus === 'PASS').length;
  const failedCount = rows.filter((r) => r.resultStatus === 'FAIL').length;
  const gpa5Count = rows.filter((r) => r.resultStatus === 'PASS' && (r.gpa ?? 0) >= 5.0).length;
  const passRate = rows.length > 0 ? Math.round((passedCount / rows.length) * 100) : 0;

  return (
    <FormalExamDocumentShell
      school={school}
      orientation="landscape"
      titleBn="ট্যাবুলেশন শিট (শ্রেণিভিত্তিক ফলাফল রেজিস্টার)"
      titleEn="OFFICIAL CLASS TABULATION SHEET"
      subtitleBn={`${examName} — ${className}${sectionLabel ? ` (${sectionLabel})` : ''}`}
      subtitleEn={`${examName} — ${className}${sectionLabel ? ` (${sectionLabel})` : ''}`}
      refLabel={
        <span>
          <strong>{pick('শিক্ষাবর্ষ:', 'Academic Year:')}</strong> {formatNumber(academicYear, locale)} &nbsp;|&nbsp;{' '}
          <strong>{pick('মোট পরীক্ষার্থী:', 'Examinees:')}</strong> {formatNumber(rows.length, locale)}
        </span>
      }
      dateLabel={
        <span>
          <strong>{pick('প্রস্তুতের তারিখ:', 'Prepared On:')}</strong>{' '}
          {formatDateLong(new Date().toISOString().slice(0, 10), locale)}
        </span>
      }
      signatures={[
        { titleBn: 'ট্যাবুলেটর / শ্রেণি শিক্ষক', titleEn: 'Tabulator / Class Teacher' },
        { titleBn: 'পরীক্ষা নিয়ন্ত্রক', titleEn: 'Controller of Examinations' },
        { titleBn: 'প্রধান শিক্ষক', titleEn: 'Head Teacher', subtitle: school.name },
      ]}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] border border-[#18181B] border-collapse tabular-nums">
          <thead>
            <tr className="bg-[#F4F4F5] text-[#111111]">
              <th className="border border-[#18181B] px-1 py-1 text-center w-9">
                {pick('মেধা', 'Merit')}
              </th>
              <th className="border border-[#18181B] px-1 py-1 text-center w-9">
                {pick('রোল', 'Roll')}
              </th>
              <th className="border border-[#18181B] px-1.5 py-1 text-left min-w-[115px]">
                {pick('শিক্ষার্থীর নাম ও শাখা', 'Student Name & Section')}
              </th>
              {subjects.map((sub) => (
                <th key={sub.id} className="border border-[#18181B] px-1 py-1 text-center leading-tight">
                  <div className="font-bold">{locale === 'bn' ? sub.nameBn : sub.nameEn}</div>
                  <div className="text-[9px] font-normal text-[#52525B] whitespace-nowrap">
                    {sub.code} · ({formatNumber(sub.fullMarks, locale)})
                  </div>
                </th>
              ))}
              <th className="border border-[#18181B] px-1 py-1 text-right">{pick('মোট', 'Total')}</th>
              <th className="border border-[#18181B] px-1 py-1 text-right">GPA</th>
              <th className="border border-[#18181B] px-1 py-1 text-center">{pick('গ্রেড', 'Grade')}</th>
              <th className="border border-[#18181B] px-1 py-1 text-center">{pick('অবস্থা', 'Status')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.studentId}>
                <td className="border border-[#52525B] px-1 py-1 text-center font-bold">
                  {r.meritPosition ? formatNumber(r.meritPosition, locale) : '—'}
                </td>
                <td className="border border-[#52525B] px-1 py-1 text-center font-semibold">
                  {formatNumber(r.roll, locale)}
                </td>
                <td className="border border-[#52525B] px-1.5 py-1 font-medium whitespace-nowrap">
                  <span>{r.studentName}</span>{' '}
                  <span className="text-[9px] text-[#52525B]">
                    ({r.sectionName}{r.groupName ? `, ${r.groupName}` : ''})
                  </span>
                </td>
                {subjects.map((sub) => {
                  const cell = r.subjectMarks[sub.id];
                  return (
                    <td key={sub.id} className="border border-[#52525B] px-1 py-1 text-center whitespace-nowrap">
                      {!cell ? (
                        <span className="text-[#A1A1AA]">—</span>
                      ) : cell.isAbsent ? (
                        <span className="font-bold text-[#991B1B]">AB</span>
                      ) : (
                        <span className={cell.grade === 'F' || cell.isPassed === false ? 'font-bold text-[#991B1B]' : ''}>
                          {formatNumber(cell.total, locale)}{' '}
                          <span className="text-[9px]">({cell.grade})</span>
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="border border-[#52525B] px-1 py-1 text-right font-bold">
                  {formatNumber(r.totalMarks, locale)}
                </td>
                <td className="border border-[#52525B] px-1 py-1 text-right font-bold">
                  {r.gpa !== null ? formatNumber(r.gpa, locale, 2) : '—'}
                </td>
                <td className="border border-[#52525B] px-1 py-1 text-center font-bold">
                  {r.letterGrade ?? '—'}
                </td>
                <td className="border border-[#52525B] px-1 py-1 text-center font-bold whitespace-nowrap">
                  <span
                    className={
                      r.resultStatus === 'PASS'
                        ? 'text-[#111111]'
                        : r.resultStatus === 'INCOMPLETE'
                          ? 'text-[#B45309]'
                          : 'text-[#991B1B]'
                    }
                  >
                    {r.resultStatus === 'PASS'
                      ? pick('উত্তীর্ণ', 'PASS')
                      : r.resultStatus === 'INCOMPLETE'
                        ? pick('অসম্পূর্ণ', 'INCOMPLETE')
                        : pick('অনুত্তীর্ণ', 'FAIL')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tabulation Statistical Summary Strip */}
      <div className="mt-3.5 grid grid-cols-5 border border-[#18181B] divide-x divide-[#52525B] text-center text-xs tabular-nums">
        <div className="py-2 px-2">
          <span className="text-[#52525B]">{pick('মোট পরীক্ষার্থী:', 'Total:')}</span>{' '}
          <strong>{formatNumber(rows.length, locale)}</strong>
        </div>
        <div className="py-2 px-2">
          <span className="text-[#52525B]">{pick('উত্তীর্ণ:', 'Passed:')}</span>{' '}
          <strong>{formatNumber(passedCount, locale)}</strong>
        </div>
        <div className="py-2 px-2">
          <span className="text-[#52525B]">{pick('অনুত্তীর্ণ:', 'Failed:')}</span>{' '}
          <strong className="text-[#991B1B]">{formatNumber(failedCount, locale)}</strong>
        </div>
        <div className="py-2 px-2">
          <span className="text-[#52525B]">{pick('পাসের হার:', 'Pass Rate:')}</span>{' '}
          <strong>{formatNumber(passRate, locale)}%</strong>
        </div>
        <div className="py-2 px-2">
          <span className="text-[#52525B]">{pick('জিপিএ ৫.০০:', 'GPA 5.00:')}</span>{' '}
          <strong>{formatNumber(gpa5Count, locale)}</strong>
        </div>
      </div>
    </FormalExamDocumentShell>
  );
}

// ============================================================================
// 3. Institutional Official Examination Routine
// ============================================================================

export function PrintableExamRoutine({
  school,
  examName,
  className,
  academicYear,
  routines,
}: {
  school: SchoolProfile;
  examName: string;
  className: string;
  academicYear: string;
  routines: Array<{
    id: string;
    examDate: string;
    startTime: string;
    endTime: string;
    subjectCode: string;
    subjectName: string;
    fullMarks: number;
    roomNo?: string | null;
    sectionName?: string | null;
    instructions?: string | null;
  }>;
}) {
  const { locale, pick } = useI18n();

  return (
    <FormalExamDocumentShell
      school={school}
      titleBn="পরীক্ষার সময়সূচি (EXAMINATION ROUTINE)"
      titleEn="OFFICIAL EXAMINATION ROUTINE"
      subtitleBn={`${examName} — ${className}`}
      subtitleEn={`${examName} — ${className}`}
      refLabel={
        <span>
          <strong>{pick('শিক্ষাবর্ষ:', 'Session:')}</strong> {formatNumber(academicYear, locale)}
        </span>
      }
      dateLabel={
        <span>
          <strong>{pick('প্রকাশের তারিখ:', 'Issued On:')}</strong>{' '}
          {formatDateLong(new Date().toISOString().slice(0, 10), locale)}
        </span>
      }
      signatures={[
        { titleBn: 'পরীক্ষা নিয়ন্ত্রক', titleEn: 'Controller of Examinations' },
        { titleBn: 'প্রধান শিক্ষক', titleEn: 'Head Teacher', subtitle: school.name },
      ]}
    >
      <table className="w-full text-xs sm:text-[13px] border border-[#18181B] border-collapse tabular-nums">
        <thead>
          <tr className="bg-[#F4F4F5] text-[#111111]">
            <th className="border border-[#18181B] px-2 py-2 text-center w-10">{pick('ক্রম', 'Sl')}</th>
            <th className="border border-[#18181B] px-2.5 py-2 text-left">{pick('তারিখ ও বার', 'Date')}</th>
            <th className="border border-[#18181B] px-2.5 py-2 text-left">{pick('বিষয় ও কোড', 'Subject & Code')}</th>
            <th className="border border-[#18181B] px-2 py-2 text-center">{pick('পূর্ণমান', 'Full')}</th>
            <th className="border border-[#18181B] px-2.5 py-2 text-center">{pick('সময়', 'Time')}</th>
            <th className="border border-[#18181B] px-2.5 py-2 text-left">{pick('পরীক্ষার কক্ষ', 'Room / Hall')}</th>
          </tr>
        </thead>
        <tbody>
          {routines.map((rt, idx) => (
            <tr key={rt.id}>
              <td className="border border-[#52525B] px-2 py-2 text-center font-semibold">
                {formatNumber(idx + 1, locale)}
              </td>
              <td className="border border-[#52525B] px-2.5 py-2 font-semibold whitespace-nowrap">
                {formatDateShort(rt.examDate, locale)}
              </td>
              <td className="border border-[#52525B] px-2.5 py-2">
                <span className="font-bold">{rt.subjectName}</span>{' '}
                <span className="text-[11px] font-mono text-[#52525B]">({rt.subjectCode})</span>
                {rt.sectionName && (
                  <span className="block text-[11px] text-[#52525B]">
                    {pick('শাখা:', 'Section:')} {rt.sectionName}
                  </span>
                )}
              </td>
              <td className="border border-[#52525B] px-2 py-2 text-center">
                {formatNumber(rt.fullMarks, locale)}
              </td>
              <td className="border border-[#52525B] px-2.5 py-2 text-center whitespace-nowrap">
                {formatTime(rt.startTime, locale)} – {formatTime(rt.endTime, locale)}
              </td>
              <td className="border border-[#52525B] px-2.5 py-2">
                {rt.roomNo || pick('নির্ধারিত হল', 'Assigned Hall')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Official General Instructions */}
      <div className="mt-5 border border-[#52525B] p-3.5 text-xs space-y-1.5">
        <p className="font-bold uppercase tracking-wide text-[#111111] border-b border-[#D4D4D8] pb-1">
          {pick('পরীক্ষার্থীদের জন্য বিশেষ নির্দেশাবলী:', 'Important Instructions for Examinees:')}
        </p>
        <ol className="list-decimal list-inside space-y-1 text-[#27272A]">
          <li>
            {pick(
              'পরীক্ষা শুরু হওয়ার অন্তত ৩০ মিনিট পূর্বে প্রবেশপত্রসহ নির্ধারিত আসনে উপস্থিত থাকতে হবে।',
              'Examinees must be seated in the assigned hall at least 30 minutes before the examination starts with their Admit Card.'
            )}
          </li>
          <li>
            {pick(
              'মোবাইল ফোন, স্মার্টওয়াচ বা যেকোনো অননুমোদিত ইলেকট্রনিক ডিভাইস পরীক্ষার হলে সম্পূর্ণ নিষিদ্ধ।',
              'Mobile phones, smartwatches, or any unauthorized electronic devices are strictly prohibited inside the hall.'
            )}
          </li>
          <li>
            {pick(
              'ব্যবহারিক পরীক্ষার তারিখ ও সময়সূচি সংশ্লিষ্ট বিভাগীয় শিক্ষকের মাধ্যমে জানিয়ে দেওয়া হবে।',
              'Practical examination dates and batches will be notified by the respective subject department.'
            )}
          </li>
          <li>
            {pick(
              'বিদ্যালয় কর্তৃপক্ষ অনিবার্য কারণে পরীক্ষার সময়সূচি পরিবর্তনের অধিকার সংরক্ষণ করে।',
              'The school authority reserves the right to reschedule any examination under unavoidable circumstances.'
            )}
          </li>
        </ol>
      </div>
    </FormalExamDocumentShell>
  );
}

// ============================================================================
// 4. Institutional Examination Admit Card (Single & Bulk)
// ============================================================================

export interface PrintableExamAdmitCardProps {
  school: SchoolProfile;
  examName: string;
  academicYear: string;
  student: {
    studentId: string;
    nameBn?: string | null;
    nameEn: string;
    fatherName?: string | null;
    motherName?: string | null;
    photo?: string | null;
    roll: number;
    className: string;
    sectionName: string;
    groupName?: string | null;
    hallRoom?: string | null;
    seatNo?: number | null;
  };
  schedule: Array<{
    examDate: string;
    startTime: string;
    endTime: string;
    subjectCode: string;
    subjectName: string;
    roomNo?: string | null;
  }>;
  isPrintRoot?: boolean;
  pageBreakAfter?: boolean;
}

export function PrintableExamAdmitCard({
  school,
  examName,
  academicYear,
  student,
  schedule,
  isPrintRoot = true,
  pageBreakAfter = false,
}: PrintableExamAdmitCardProps) {
  const { locale, pick } = useI18n();

  return (
    <FormalExamDocumentShell
      school={school}
      titleBn="প্রবেশপত্র (ADMIT CARD)"
      titleEn="EXAMINATION ADMIT CARD"
      subtitleBn={`${examName} · ${pick('শিক্ষাবর্ষ', 'Session')} ${formatNumber(academicYear, locale)}`}
      subtitleEn={`${examName} · Session ${formatNumber(academicYear, locale)}`}
      refLabel={
        <span>
          <strong>{pick('রোল নং:', 'Roll No:')}</strong> {formatNumber(student.roll, locale)}
        </span>
      }
      dateLabel={
        <span>
          <strong>{pick('আইডি:', 'ID:')}</strong> <span className="font-mono">{student.studentId}</span>
        </span>
      }
      isPrintRoot={isPrintRoot}
      pageBreakAfter={pageBreakAfter}
      signatures={[
        { titleBn: 'পরীক্ষার্থীর স্বাক্ষর', titleEn: 'Examinee Signature' },
        { titleBn: 'শ্রেণি শিক্ষক', titleEn: 'Class Teacher' },
        { titleBn: 'প্রধান শিক্ষক', titleEn: 'Head Teacher', subtitle: school.name },
      ]}
    >
      {/* Examinee Identity Grid + Passport Photo Box */}
      <div className="flex flex-col sm:flex-row print:flex-row gap-4 mb-4 items-start">
        <div className="flex-1 w-full border border-[#18181B] p-3 text-xs sm:text-[13px] space-y-1.5">
          <div className="grid grid-cols-12 gap-1">
            <span className="col-span-4 text-[#52525B]">{pick('পরীক্ষার্থীর নাম', 'Name of Examinee')}</span>
            <span className="col-span-8 font-bold text-[#111111]">
              : {locale === 'bn' ? student.nameBn || student.nameEn : student.nameEn}
            </span>
          </div>
          {student.fatherName && (
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-4 text-[#52525B]">{pick('পিতার নাম', "Father's Name")}</span>
              <span className="col-span-8">: {student.fatherName}</span>
            </div>
          )}
          {student.motherName && (
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-4 text-[#52525B]">{pick('মাতার নাম', "Mother's Name")}</span>
              <span className="col-span-8">: {student.motherName}</span>
            </div>
          )}
          <div className="grid grid-cols-12 gap-1 tabular-nums">
            <span className="col-span-4 text-[#52525B]">{pick('শ্রেণি ও শাখা', 'Class & Section')}</span>
            <span className="col-span-8 font-semibold">
              : {student.className} ({student.sectionName})
              {student.groupName ? ` · ${student.groupName}` : ''}
            </span>
          </div>
          <div className="grid grid-cols-12 gap-1 tabular-nums">
            <span className="col-span-4 text-[#52525B]">{pick('পরীক্ষার কক্ষ ও আসন', 'Exam Room & Seat')}</span>
            <span className="col-span-8 font-semibold">
              : {student.hallRoom || pick('নোটিশ বোর্ড দ্রষ্টব্য', 'See Notice Board')}
              {student.seatNo ? ` · ${pick('আসন', 'Seat')} #${formatNumber(student.seatNo, locale)}` : ''}
            </span>
          </div>
        </div>

        {/* Formal Photo Frame */}
        <div className="w-[106px] h-[126px] border-[1.5px] border-[#18181B] flex flex-col items-center justify-center shrink-0 overflow-hidden bg-[#FAFAFA] mx-auto sm:mx-0">
          {student.photo ? (
            <img
              src={student.photo}
              alt={student.nameEn}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-center px-2 text-[10px] text-[#52525B] leading-tight">
              <p className="font-semibold">{pick('সত্যায়িত ছবি', 'Attested Photo')}</p>
              <p className="mt-1">35mm × 45mm</p>
            </div>
          )}
        </div>
      </div>

      {/* Personal Applicable Exam Timetable */}
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#111111] mb-1.5">
          {pick('নির্ধারিত পরীক্ষার বিষয় ও সময়সূচি:', 'Scheduled Examination Subjects & Timetable:')}
        </p>
        {schedule.length === 0 ? (
          <div className="border border-[#52525B] p-3 text-xs text-[#52525B] text-center">
            {pick(
              'এই পরীক্ষার সময়সূচি বিদ্যালয় নোটিশ বোর্ডে প্রকাশিত রুটিন অনুযায়ী প্রযোজ্য হবে।',
              'Subject timetable will follow the official routine published on the school notice board.'
            )}
          </div>
        ) : (
          <table className="w-full text-xs border border-[#18181B] border-collapse tabular-nums">
            <thead>
              <tr className="bg-[#F4F4F5] text-[#111111]">
                <th className="border border-[#18181B] px-2 py-1.5 text-left">{pick('তারিখ', 'Date')}</th>
                <th className="border border-[#18181B] px-2 py-1.5 text-center w-14">{pick('কোড', 'Code')}</th>
                <th className="border border-[#18181B] px-2 py-1.5 text-left">{pick('বিষয়', 'Subject')}</th>
                <th className="border border-[#18181B] px-2 py-1.5 text-center">{pick('সময়', 'Time')}</th>
                <th className="border border-[#18181B] px-2 py-1.5 text-left">{pick('কক্ষ', 'Room')}</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row, i) => (
                <tr key={i}>
                  <td className="border border-[#52525B] px-2 py-1.5 whitespace-nowrap font-medium">
                    {formatDateShort(row.examDate, locale)}
                  </td>
                  <td className="border border-[#52525B] px-2 py-1.5 text-center font-mono">
                    {row.subjectCode}
                  </td>
                  <td className="border border-[#52525B] px-2 py-1.5 font-semibold">{row.subjectName}</td>
                  <td className="border border-[#52525B] px-2 py-1.5 text-center whitespace-nowrap">
                    {formatTime(row.startTime, locale)} – {formatTime(row.endTime, locale)}
                  </td>
                  <td className="border border-[#52525B] px-2 py-1.5">
                    {row.roomNo || student.hallRoom || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Hall Directives */}
      <div className="border border-[#52525B] p-3 text-[11px] space-y-1 text-[#27272A]">
        <p className="font-bold text-[#111111]">
          {pick('পরীক্ষা হলের নিয়মাবলী:', 'Examination Hall Directives:')}
        </p>
        <p>
          ১. {pick('প্রতিদিন পরীক্ষায় অংশগ্রহণের সময় এই মূল প্রবেশপত্রটি সাথে আনতে হবে।', 'Bring this original Admit Card to every examination session.')}
        </p>
        <p>
          ২. {pick('পরীক্ষা শুরুর ৩০ মিনিট পূর্বে কক্ষে প্রবেশ করে নির্ধারিত আসনে বসতে হবে।', 'Enter the hall and take your assigned seat 30 minutes prior to commencement.')}
        </p>
        <p>
          ৩. {pick('হাজিরা খাতায় স্বাক্ষর ও উত্তরপত্রের ওএমআর/কভার পৃষ্ঠায় রোল নম্বর সঠিকভাবে লিখতে হবে।', 'Sign the attendance sheet and fill in your Roll No. accurately on the answer script.')}
        </p>
      </div>
    </FormalExamDocumentShell>
  );
}

export function PrintableBulkExamAdmitCards({
  items,
}: {
  items: PrintableExamAdmitCardProps[];
}) {
  return (
    <div data-certificate-print-root="true" data-print-orientation="portrait" className="space-y-6 print:space-y-0">
      {items.map((item, idx) => (
        <PrintableExamAdmitCard
          key={`${item.student.studentId}-${idx}`}
          {...item}
          isPrintRoot={false}
          pageBreakAfter={idx < items.length - 1}
        />
      ))}
    </div>
  );
}

// ============================================================================
// 5. Institutional Multi-Room Examination Seat Plan
// ============================================================================

export interface SeatPlanRoomBlock {
  roomNo: string;
  buildingName?: string | null;
  capacity: number;
  invigilatorName?: string | null;
  assistantInvigilatorName?: string | null;
  seats: Array<{
    seatNo: number;
    roll: number;
    studentId: string;
    studentName: string;
    className: string;
    sectionName: string;
    groupName?: string | null;
  }>;
}

export function PrintableExamSeatPlan({
  school,
  examName,
  academicYear,
  roomName,
  seats,
  rooms,
}: {
  school: SchoolProfile;
  examName: string;
  academicYear?: string;
  roomName?: string;
  seats?: SeatPlanRoomBlock['seats'];
  rooms?: SeatPlanRoomBlock[];
}) {
  const { locale, pick } = useI18n();

  const normalizedRooms: SeatPlanRoomBlock[] =
    rooms && rooms.length > 0
      ? rooms
      : [
          {
            roomNo: roomName || pick('হল রুম ১০১', 'Hall Room 101'),
            capacity: seats?.length ?? 0,
            seats: seats ?? [],
          },
        ];

  return (
    <div data-certificate-print-root="true" data-print-orientation="portrait" className="space-y-6 print:space-y-0">
      {normalizedRooms.map((room, roomIdx) => {
        const rolls = room.seats.map((s) => s.roll);
        const minRoll = rolls.length > 0 ? Math.min(...rolls) : null;
        const maxRoll = rolls.length > 0 ? Math.max(...rolls) : null;

        return (
          <FormalExamDocumentShell
            key={`${room.roomNo}-${roomIdx}`}
            school={school}
            titleBn="পরীক্ষার আসন বিন্যাস (SEAT PLAN)"
            titleEn="OFFICIAL EXAMINATION SEAT PLAN"
            subtitleBn={`${examName}${academicYear ? ` · ${pick('শিক্ষাবর্ষ', 'Session')} ${formatNumber(academicYear, locale)}` : ''}`}
            subtitleEn={`${examName}${academicYear ? ` · Session ${formatNumber(academicYear, locale)}` : ''}`}
            allowFlow={room.seats.length > 18}
            isPrintRoot={false}
            pageBreakAfter={roomIdx < normalizedRooms.length - 1}
            signatures={[
              { titleBn: 'কক্ষ পরিদর্শক', titleEn: 'Room Invigilator', subtitle: room.invigilatorName || undefined },
              { titleBn: 'পরীক্ষা নিয়ন্ত্রক', titleEn: 'Controller of Examinations' },
              { titleBn: 'প্রধান শিক্ষক', titleEn: 'Head Teacher' },
            ]}
          >
            {/* Room & Invigilator Metadata Table */}
            <table className="w-full text-xs border border-[#18181B] border-collapse mb-4 tabular-nums">
              <tbody>
                <tr>
                  <td className="border border-[#52525B] bg-[#F4F4F5] px-2.5 py-1.5 font-bold w-1/5">
                    {pick('পরীক্ষার কক্ষ', 'Exam Room')}
                  </td>
                  <td className="border border-[#52525B] px-2.5 py-1.5 font-bold w-3/10">
                    {room.roomNo}
                    {room.buildingName ? ` (${room.buildingName})` : ''}
                  </td>
                  <td className="border border-[#52525B] bg-[#F4F4F5] px-2.5 py-1.5 font-bold w-1/5">
                    {pick('আসন / পরীক্ষার্থী', 'Capacity / Seated')}
                  </td>
                  <td className="border border-[#52525B] px-2.5 py-1.5 font-semibold w-3/10">
                    {formatNumber(room.seats.length, locale)} / {formatNumber(room.capacity, locale)}
                    {minRoll !== null && maxRoll !== null
                      ? ` (${pick('রোল', 'Roll')} ${formatNumber(minRoll, locale)}–${formatNumber(maxRoll, locale)})`
                      : ''}
                  </td>
                </tr>
                <tr>
                  <td className="border border-[#52525B] bg-[#F4F4F5] px-2.5 py-1.5 font-bold">
                    {pick('প্রধান পরিদর্শক', 'Chief Invigilator')}
                  </td>
                  <td className="border border-[#52525B] px-2.5 py-1.5">
                    {room.invigilatorName || pick('নির্ধারিত হয়নি', 'To be assigned')}
                  </td>
                  <td className="border border-[#52525B] bg-[#F4F4F5] px-2.5 py-1.5 font-bold">
                    {pick('সহকারী পরিদর্শক', 'Asst. Invigilator')}
                  </td>
                  <td className="border border-[#52525B] px-2.5 py-1.5">
                    {room.assistantInvigilatorName || '—'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Crisp Institutional Seat Matrix (No colorful cards, clean formal ink grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 print:grid-cols-3 gap-2 tabular-nums">
              {room.seats.map((seat) => (
                <div
                  key={`${seat.studentId}-${seat.seatNo}`}
                  className="border-[1.5px] border-[#18181B] p-2.5 bg-white break-inside-avoid"
                >
                  <div className="flex items-center justify-between border-b border-[#52525B] pb-1 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#27272A]">
                      {pick('আসন', 'Seat')} #{formatNumber(seat.seatNo, locale)}
                    </span>
                    <span className="text-xs font-bold text-[#111111] border border-[#18181B] px-1.5 py-0.2">
                      {pick('রোল:', 'Roll:')} {formatNumber(seat.roll, locale)}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#111111] truncate">{seat.studentName}</p>
                  <p className="text-[11px] text-[#3F3F46] mt-0.5 truncate">
                    {seat.className} ({seat.sectionName})
                    {seat.groupName ? ` · ${seat.groupName}` : ''}
                  </p>
                  <p className="text-[10px] font-mono text-[#52525B] mt-0.5">
                    ID: {seat.studentId}
                  </p>
                </div>
              ))}
            </div>
          </FormalExamDocumentShell>
        );
      })}
    </div>
  );
}

// ============================================================================
// 6. Institutional Exam Hall Attendance & Answer Script Register
// ============================================================================

export function PrintableExamAttendanceSheet({
  school,
  examName,
  academicYear,
  subjectLabel,
  examDate,
  examTime,
  rooms,
}: {
  school: SchoolProfile;
  examName: string;
  academicYear: string;
  subjectLabel: string;
  examDate?: string | null;
  examTime?: string | null;
  rooms: SeatPlanRoomBlock[];
}) {
  const { locale, pick } = useI18n();

  return (
    <div data-certificate-print-root="true" data-print-orientation="portrait" className="space-y-6 print:space-y-0">
      {rooms.map((room, roomIdx) => (
        <FormalExamDocumentShell
          key={`att-${room.roomNo}-${roomIdx}`}
          school={school}
          titleBn="পরীক্ষা কক্ষের উপস্থিতি ও উত্তরপত্র স্বাক্ষর শিট"
          titleEn="EXAMINATION HALL ATTENDANCE & SCRIPT REGISTER"
          subtitleBn={`${examName} · ${pick('শিক্ষাবর্ষ', 'Session')} ${formatNumber(academicYear, locale)}`}
          subtitleEn={`${examName} · Session ${formatNumber(academicYear, locale)}`}
          allowFlow={room.seats.length > 18}
          isPrintRoot={false}
          pageBreakAfter={roomIdx < rooms.length - 1}
          signatures={[
            { titleBn: 'কক্ষ পরিদর্শকের স্বাক্ষর', titleEn: 'Invigilator Signature', subtitle: room.invigilatorName || undefined },
            { titleBn: 'হল সুপার / কেন্দ্র সচিব', titleEn: 'Hall Superintendent' },
          ]}
        >
          {/* Session & Hall Header Strip */}
          <table className="w-full text-xs border border-[#18181B] border-collapse mb-3.5 tabular-nums">
            <tbody>
              <tr>
                <td className="border border-[#52525B] bg-[#F4F4F5] px-2.5 py-1.5 font-bold w-1/6">
                  {pick('বিষয়', 'Subject')}
                </td>
                <td className="border border-[#52525B] px-2.5 py-1.5 font-bold w-2/6">{subjectLabel}</td>
                <td className="border border-[#52525B] bg-[#F4F4F5] px-2.5 py-1.5 font-bold w-1/6">
                  {pick('তারিখ ও সময়', 'Date & Time')}
                </td>
                <td className="border border-[#52525B] px-2.5 py-1.5 w-2/6">
                  {examDate ? formatDateShort(examDate, locale) : '________________'}
                  {examTime ? ` · ${examTime}` : ''}
                </td>
              </tr>
              <tr>
                <td className="border border-[#52525B] bg-[#F4F4F5] px-2.5 py-1.5 font-bold">
                  {pick('কক্ষ নম্বর', 'Room No.')}
                </td>
                <td className="border border-[#52525B] px-2.5 py-1.5 font-semibold">
                  {room.roomNo}
                  {room.buildingName ? ` (${room.buildingName})` : ''}
                </td>
                <td className="border border-[#52525B] bg-[#F4F4F5] px-2.5 py-1.5 font-bold">
                  {pick('পরিদর্শক', 'Invigilator')}
                </td>
                <td className="border border-[#52525B] px-2.5 py-1.5">
                  {room.invigilatorName || '____________________'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Examinee Sign-in & Answer Script Serial Table */}
          <table className="w-full text-xs border border-[#18181B] border-collapse tabular-nums">
            <thead>
              <tr className="bg-[#F4F4F5] text-[#111111]">
                <th className="border border-[#18181B] px-1.5 py-2 text-center w-9">{pick('ক্রম', 'Sl')}</th>
                <th className="border border-[#18181B] px-2 py-2 text-center w-14">{pick('রোল', 'Roll')}</th>
                <th className="border border-[#18181B] px-2 py-2 text-left">{pick('পরীক্ষার্থীর নাম ও শাখা', 'Examinee Name')}</th>
                <th className="border border-[#18181B] px-2 py-2 text-center w-32">
                  {pick('মূল উত্তরপত্র ক্রমিক নং', 'Main Script Sl. No.')}
                </th>
                <th className="border border-[#18181B] px-2 py-2 text-center w-16">
                  {pick('অতিরিক্ত পাতা', 'Loose')}
                </th>
                <th className="border border-[#18181B] px-2 py-2 text-center w-32">
                  {pick('পরীক্ষার্থীর স্বাক্ষর', 'Examinee Signature')}
                </th>
              </tr>
            </thead>
            <tbody>
              {room.seats.map((seat, idx) => (
                <tr key={seat.studentId}>
                  <td className="border border-[#52525B] px-1.5 py-2.5 text-center">
                    {formatNumber(idx + 1, locale)}
                  </td>
                  <td className="border border-[#52525B] px-2 py-2.5 text-center font-bold">
                    {formatNumber(seat.roll, locale)}
                  </td>
                  <td className="border border-[#52525B] px-2 py-2.5">
                    <span className="font-semibold">{seat.studentName}</span>
                    <span className="block text-[10px] text-[#52525B]">
                      {seat.className} ({seat.sectionName}) · {seat.studentId}
                    </span>
                  </td>
                  <td className="border border-[#52525B] px-2 py-2.5">&nbsp;</td>
                  <td className="border border-[#52525B] px-2 py-2.5">&nbsp;</td>
                  <td className="border border-[#52525B] px-2 py-2.5">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tally Box for Hall Invigilator */}
          <div className="mt-4 grid grid-cols-3 border border-[#18181B] divide-x divide-[#52525B] text-xs tabular-nums">
            <div className="p-2.5">
              <strong>{pick('মোট পরীক্ষার্থী:', 'Total Examinees:')}</strong>{' '}
              {formatNumber(room.seats.length, locale)}
            </div>
            <div className="p-2.5">
              <strong>{pick('উপস্থিত:', 'Present:')}</strong> _______________
            </div>
            <div className="p-2.5">
              <strong>{pick('অনুপস্থিত (রোল নং):', 'Absent (Rolls):')}</strong> _______________
            </div>
          </div>
        </FormalExamDocumentShell>
      ))}
    </div>
  );
}

// ============================================================================
// 7. Institutional Consolidated Final Result Sheet (Landscape A4)
// ============================================================================

export function PrintableConsolidatedResultSheet({
  school,
  title,
  className,
  academicYear,
  sources,
  rows,
}: {
  school: SchoolProfile;
  title: string;
  className: string;
  academicYear: string;
  sources: Array<{ examId: string; name: string; weightagePercentage: number }>;
  rows: Array<{
    merit: number | null;
    roll: number;
    studentName: string;
    sectionName: string;
    sourceScores: Record<string, { marks: number | null; gpa: number | null; status: string }>;
    weightedMarks: number;
    weightedGpa: number;
    letterGrade: string;
    isPassed: boolean;
  }>;
}) {
  const { locale, pick } = useI18n();
  const passedCount = rows.filter((r) => r.isPassed).length;

  return (
    <FormalExamDocumentShell
      school={school}
      orientation="landscape"
      titleBn="সমন্বিত চূড়ান্ত ফলাফল ও মেধাতালিকা"
      titleEn="CONSOLIDATED FINAL RESULT & MERIT REGISTER"
      subtitleBn={`${title} — ${className}`}
      subtitleEn={`${title} — ${className}`}
      refLabel={
        <span>
          <strong>{pick('শিক্ষাবর্ষ:', 'Academic Year:')}</strong> {formatNumber(academicYear, locale)} &nbsp;|&nbsp;{' '}
          <strong>{pick('মোট শিক্ষার্থী:', 'Students:')}</strong> {formatNumber(rows.length, locale)}
        </span>
      }
      dateLabel={
        <span>
          <strong>{pick('উত্তীর্ণ:', 'Passed:')}</strong> {formatNumber(passedCount, locale)} /{' '}
          {formatNumber(rows.length, locale)}
        </span>
      }
      signatures={[
        { titleBn: 'শ্রেণি শিক্ষক', titleEn: 'Class Teacher' },
        { titleBn: 'পরীক্ষা নিয়ন্ত্রক', titleEn: 'Controller of Examinations' },
        { titleBn: 'প্রধান শিক্ষক', titleEn: 'Head Teacher', subtitle: school.name },
      ]}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-[#18181B] border-collapse tabular-nums">
          <thead>
            <tr className="bg-[#F4F4F5] text-[#111111]">
              <th className="border border-[#18181B] px-2 py-2 text-center w-12">{pick('মেধা', 'Merit')}</th>
              <th className="border border-[#18181B] px-2 py-2 text-center w-12">{pick('রোল', 'Roll')}</th>
              <th className="border border-[#18181B] px-2.5 py-2 text-left">{pick('শিক্ষার্থীর নাম ও শাখা', 'Student & Section')}</th>
              {sources.map((src) => (
                <th key={src.examId} className="border border-[#18181B] px-2 py-2 text-center">
                  <div>{src.name}</div>
                  <div className="text-[10px] font-normal text-[#52525B]">
                    ({formatNumber(src.weightagePercentage, locale)}%)
                  </div>
                </th>
              ))}
              <th className="border border-[#18181B] px-2 py-2 text-right">{pick('সমন্বিত নম্বর', 'Weighted Marks')}</th>
              <th className="border border-[#18181B] px-2 py-2 text-right">{pick('সমন্বিত জিপিএ', 'Final GPA')}</th>
              <th className="border border-[#18181B] px-2 py-2 text-center">{pick('গ্রেড', 'Grade')}</th>
              <th className="border border-[#18181B] px-2 py-2 text-center">{pick('অবস্থা', 'Status')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.roll}-${i}`}>
                <td className="border border-[#52525B] px-2 py-1.5 text-center font-bold">
                  {r.merit ? `#${formatNumber(r.merit, locale)}` : '—'}
                </td>
                <td className="border border-[#52525B] px-2 py-1.5 text-center font-semibold">
                  {formatNumber(r.roll, locale)}
                </td>
                <td className="border border-[#52525B] px-2.5 py-1.5 font-medium whitespace-nowrap">
                  {r.studentName} <span className="text-[11px] text-[#52525B]">({r.sectionName})</span>
                </td>
                {sources.map((src) => {
                  const sc = r.sourceScores[src.examId];
                  return (
                    <td key={src.examId} className="border border-[#52525B] px-2 py-1.5 text-center">
                      {!sc || sc.marks === null ? (
                        <span className="text-[#A1A1AA]">—</span>
                      ) : (
                        <span>
                          {formatNumber(sc.marks, locale)}{' '}
                          <span className="text-[10px] text-[#52525B]">
                            (GPA {sc.gpa !== null ? formatNumber(sc.gpa, locale, 2) : '—'})
                          </span>
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="border border-[#52525B] px-2 py-1.5 text-right font-bold">
                  {formatNumber(r.weightedMarks, locale, 1)}
                </td>
                <td className="border border-[#52525B] px-2 py-1.5 text-right font-bold">
                  {formatNumber(r.weightedGpa, locale, 2)}
                </td>
                <td className="border border-[#52525B] px-2 py-1.5 text-center font-bold">
                  {r.letterGrade}
                </td>
                <td className="border border-[#52525B] px-2 py-1.5 text-center font-bold">
                  <span className={r.isPassed ? 'text-[#111111]' : 'text-[#991B1B]'}>
                    {r.isPassed ? pick('উত্তীর্ণ', 'PASS') : pick('অনুত্তীর্ণ', 'FAIL')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FormalExamDocumentShell>
  );
}
