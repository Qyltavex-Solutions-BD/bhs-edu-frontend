'use client';

import React from 'react';
import { SCHOOL_LOGO_SRC, SchoolEmblem } from '@/src/components/shared/Feedback';
import { formatDateLong, formatNumber } from '@/src/lib/formatters';
import { TestimonialType } from '@/src/types/enums';
import type {
  SchoolProfile,
  Student,
  StudentTestimonial,
  StudentTransferCertificate,
} from '@/src/types/entities';
import type { OnlineAdmissionApplication } from '@/src/types/proposed/future';
export function SchoolLetterhead({
  school,
  docTitleBn,
  docTitleEn,
}: {
  school: SchoolProfile;
  docTitleBn: string;
  docTitleEn: string;
}) {
  return (
    <div className="border-b-2 border-[#0B7A34] pb-4 mb-5">
      <div className="flex items-center justify-center gap-4 text-center">
        <SchoolEmblem size={68} />
        <div>
          <h2 className="text-xl font-bold text-[#0B7A34] tracking-tight">
            {school.name}
          </h2>
          <p className="text-xs font-bold uppercase tracking-wider text-[#124B96]">
            {school.nameEn ?? 'BHOJESHWAR HIGH SCHOOL'}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">{school.address}</p>
          <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
            EIIN: {school.eiin ?? '113587'} · স্থাপিত: {school.establishedYear ?? 1978} · “{school.motto ?? 'শিক্ষাই আলো, জ্ঞানই শক্তি'}”
          </p>
        </div>
      </div>
      <div className="mt-3 text-center">
        <span className="inline-block px-4 py-1 border border-[#124B96]/35 bg-[#EBF4EE] text-[#0B7A34] text-sm font-bold rounded">
          {docTitleBn}
        </span>
      </div>
    </div>
  );
}

export function SignatureBlock() {
  return (
    <div className="grid grid-cols-3 gap-6 mt-12 pt-4 text-center text-sm text-foreground">
      <div>
        <div className="border-t border-foreground/40 pt-1.5 font-medium">
          {'শ্রেণি শিক্ষক'}
        </div>
      </div>
      <div>
        <div className="border-t border-foreground/40 pt-1.5 font-medium">
          {'পরীক্ষা নিয়ন্ত্রক / অভিভাবক'}
        </div>
      </div>
      <div>
        <div className="border-t border-foreground/40 pt-1.5 font-medium">
          {'প্রধান শিক্ষক'}
        </div>
      </div>
    </div>
  );
}

export {
  FormalExamDocumentShell,
  PrintableMarksheet,
  PrintableBulkMarksheets,
  PrintableTabulationSheet,
  PrintableExamRoutine,
  PrintableExamAdmitCard,
  PrintableBulkExamAdmitCards,
  PrintableExamSeatPlan,
  PrintableExamAttendanceSheet,
  PrintableConsolidatedResultSheet,
  type PrintableMarksheetProps,
  type PrintableExamAdmitCardProps,
  type SeatPlanRoomBlock,
} from './ExamPrintDocuments';

export function PrintableAdmissionAdmitCard({
  school,
  application,
  targetClassName,
  groupName,
}: {
  school: SchoolProfile;
  application: OnlineAdmissionApplication;
  targetClassName: string;
  groupName?: string | null;
}) {
  const isTransfer = application.admissionType === 'TRANSFER';
  return (
    <div className="w-full overflow-x-auto pb-1">
      <div
        data-certificate-print-root="true"
        className="certificate-paper bg-white text-[#111111] w-[794px] mx-auto p-3 border border-neutral-300"
      >
        <div className="border-[2px] border-[#18181B] p-[4px] bg-white">
          <div className="relative overflow-hidden border border-[#52525B] px-7 py-6 bg-white">
            {/* Subtle Full-Color School Logo Watermark (জলছাপ) */}
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute inset-0 flex items-center justify-center z-0"
            >
              <img
                src={SCHOOL_LOGO_SRC}
                alt=""
                referrerPolicy="no-referrer"
                className="w-[260px] h-[260px] object-contain opacity-[0.07]"
              />
            </div>

            <div className="relative z-10 space-y-5">
              {/* Institutional Letterhead */}
              <div className="border-b-[3px] border-double border-[#27272A] pb-4 flex flex-row items-center justify-between gap-4">
                <div className="shrink-0 w-[82px] flex items-center justify-start">
                  <SchoolEmblem size={68} className="ring-0 bg-transparent p-0" />
                </div>
                <div className="flex-1 text-center space-y-0.5">
                  <h1 className="text-[25px] font-bold tracking-tight text-[#111111] leading-tight">
                    {school.name}
                  </h1>
                  <p className="text-[13.5px] font-semibold uppercase tracking-[0.12em] text-[#27272A]">
                    {school.nameEn ?? 'BHOJESHWAR HIGH SCHOOL'}
                  </p>
                  <p className="text-[13.5px] text-[#3F3F46]">{school.address}</p>
                  <p className="text-[12px] text-[#52525B] tabular-nums">
                    EIIN: {school.eiin ?? '113587'} · {'স্থাপিত:'}{' '}
                    {String(school.establishedYear ?? 1978).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)])}
                  </p>
                </div>
                <div className="w-[84px] h-[102px] border border-[#27272A] bg-[#FAFAFA] overflow-hidden flex items-center justify-center shrink-0">
                  {application.photoPreview ? (
                    <img
                      src={application.photoPreview}
                      alt={application.studentNameEn}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[11.5px] text-[#71717A] text-center px-1">
                      {'পাসপোর্ট ছবি'}
                    </span>
                  )}
                </div>
              </div>

              {/* Centered Formal Document Title */}
              <div className="text-center">
                <h2 className="inline-block text-[19px] font-bold tracking-wide text-[#111111] border-b-[1.5px] border-[#18181B] pb-1 px-5">
                  {isTransfer
                    ? `ভর্তি ও বদলি (TC) প্রবেশপত্র — শিক্ষাবর্ষ ${application.academicSession}`
                    : `ভর্তি পরীক্ষার প্রবেশপত্র — শিক্ষাবর্ষ ${application.academicSession}`}
                </h2>
              </div>

              {/* Structured Admit Card Table */}
              <div className="border border-[#52525B] grid grid-cols-2 divide-x divide-[#D4D4D8] text-[14px]">
                <div className="divide-y divide-[#D4D4D8]">
                  <div className="grid grid-cols-[144px_1fr]">
                    <div className="px-3 py-2 bg-[#F4F4F5] text-[13.5px] text-[#3F3F46] font-medium border-r border-[#D4D4D8]">
                      {'আবেদন নম্বর'}
                    </div>
                    <div className="px-3 py-2 font-mono font-bold tabular-nums text-[#111111]">
                      {application.applicationNumber}
                    </div>
                  </div>
                  <div className="grid grid-cols-[144px_1fr]">
                    <div className="px-3 py-2 bg-[#F4F4F5] text-[13.5px] text-[#3F3F46] font-medium border-r border-[#D4D4D8]">
                      {'ভর্তি পরীক্ষার রোল'}
                    </div>
                    <div className="px-3 py-2 font-mono font-bold tabular-nums text-[#0A6E31]">
                      {application.admissionTestRoll ?? 'TBA'}
                    </div>
                  </div>
                  <div className="grid grid-cols-[144px_1fr]">
                    <div className="px-3 py-2 bg-[#F4F4F5] text-[13.5px] text-[#3F3F46] font-medium border-r border-[#D4D4D8]">
                      {'শিক্ষার্থীর নাম'}
                    </div>
                    <div className="px-3 py-2 text-[#111111]">
                      <strong className="font-bold block">{application.studentNameBn}</strong>
                      <span className="text-[12px] font-mono uppercase text-[#52525B]">
                        {application.studentNameEn}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-[144px_1fr]">
                    <div className="px-3 py-2 bg-[#F4F4F5] text-[13.5px] text-[#3F3F46] font-medium border-r border-[#D4D4D8]">
                      {'পিতার নাম'}
                    </div>
                    <div className="px-3 py-2 text-[#111111]">{application.fatherNameBn}</div>
                  </div>
                  <div className="grid grid-cols-[144px_1fr]">
                    <div className="px-3 py-2 bg-[#F4F4F5] text-[13.5px] text-[#3F3F46] font-medium border-r border-[#D4D4D8]">
                      {'মাতার নাম'}
                    </div>
                    <div className="px-3 py-2 text-[#111111]">{application.motherNameBn}</div>
                  </div>
                </div>

                <div className="divide-y divide-[#D4D4D8]">
                  <div className="grid grid-cols-[144px_1fr]">
                    <div className="px-3 py-2 bg-[#F4F4F5] text-[13.5px] text-[#3F3F46] font-medium border-r border-[#D4D4D8]">
                      {'ভর্তিচ্ছু শ্রেণি'}
                    </div>
                    <div className="px-3 py-2 font-bold text-[#111111]">{targetClassName}</div>
                  </div>
                  {groupName && (
                    <div className="grid grid-cols-[144px_1fr]">
                      <div className="px-3 py-2 bg-[#F4F4F5] text-[13.5px] text-[#3F3F46] font-medium border-r border-[#D4D4D8]">
                        {'বিভাগ ও ৪র্থ বিষয়'}
                      </div>
                      <div className="px-3 py-2 text-[#111111]">
                        <strong className="font-semibold">{groupName}</strong>
                        {application.optionalSubjectName
                          ? ` · ${application.optionalSubjectName}`
                          : ''}
                      </div>
                    </div>
                  )}
                  {application.boardRegistrationNo && (
                    <div className="grid grid-cols-[144px_1fr]">
                      <div className="px-3 py-2 bg-[#F4F4F5] text-[13.5px] text-[#3F3F46] font-medium border-r border-[#D4D4D8]">
                        {'বোর্ড রেজিস্ট্রেশন'}
                      </div>
                      <div className="px-3 py-2 font-mono font-semibold tabular-nums text-[#111111]">
                        {application.boardRegistrationNo}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-[144px_1fr]">
                    <div className="px-3 py-2 bg-[#F4F4F5] text-[13.5px] text-[#3F3F46] font-medium border-r border-[#D4D4D8]">
                      {'পরীক্ষার তারিখ'}
                    </div>
                    <div className="px-3 py-2 font-semibold text-[#111111]">
                      {formatDateLong(application.admissionTestDate, 'bn')}
                    </div>
                  </div>
                  <div className="grid grid-cols-[144px_1fr]">
                    <div className="px-3 py-2 bg-[#F4F4F5] text-[13.5px] text-[#3F3F46] font-medium border-r border-[#D4D4D8]">
                      {'অভিভাবক মোবাইল'}
                    </div>
                    <div className="px-3 py-2 font-mono tabular-nums text-[#111111]">
                      {application.guardianPhone}
                    </div>
                  </div>
                </div>
              </div>

              {/* Exam Day Instructions */}
              <div className="p-3.5 bg-[#FAFAFA] border border-[#D4D4D8] text-[13.5px] text-[#27272A] leading-relaxed">
                <strong className="text-[#111111]">{'নির্দেশনা:'}</strong>{' '}
                {'পরীক্ষার/ভর্তির দিন এই প্রবেশপত্রের প্রিন্ট কপি, ১৭ ডিজিটের অনলাইন জন্ম সনদের ফটোকপি, পিতা-মাতার এনআইডি কপি, ২ কপি পাসপোর্ট সাইজ ছবি এবং প্রযোজ্য ক্ষেত্রে ছাড়পত্র (TC) / বোর্ড রেজিস্ট্রেশন কপি সঙ্গে আনতে হবে।'}
              </div>

              {/* Clean 2-Column Institutional Signature Footer */}
              <div className="flex items-end justify-between gap-8 pt-12 text-center text-[13px] text-[#18181B]">
                <div className="w-52 space-y-0.5">
                  <div className="border-t border-[#27272A] pt-1.5 font-semibold">
                    {'আহ্বায়ক, ভর্তি কমিটি'}
                  </div>
                  <p className="text-[12px] text-[#52525B]">
                    {'তারিখ ও স্বাক্ষর'}
                  </p>
                </div>
                <div className="w-56 space-y-0.5">
                  <div className="border-t border-[#27272A] pt-1.5 font-semibold">
                    {'প্রধান শিক্ষক'}
                  </div>
                  <p className="text-[12px] text-[#52525B]">{school.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Official Admission Confirmation & Tear-Off Student ID Card Info Slip (inspired by BHS admission form).
 */
export function PrintableAdmissionConfirmationSlip({
  school,
  student,
  enrollment,
  classNameLabel,
  sectionName,
  groupName,
  academicYearName,
  fatherName,
  motherName,
  guardianPhone,
  optionalSubjectName,
}: {
  school: SchoolProfile;
  student: Student;
  enrollment: {
    roll: number;
    formSerialNo?: string | null;
    remarks?: string | null;
  };
  classNameLabel: string;
  sectionName: string;
  groupName?: string | null;
  academicYearName: string;
  fatherName: string;
  motherName: string;
  guardianPhone: string;
  optionalSubjectName?: string | null;
}) {
  const bloodDisplay = student.bloodGroup
    ? student.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')
    : '—';

  return (
    <div className="print-sheet bg-surface border border-border rounded-[var(--radius)] p-6 text-foreground space-y-6">
      <SchoolLetterhead
        school={school}
        docTitleBn={`ভর্তি নিশ্চয়ন ও আইডি কার্ড তথ্য স্লিপ — শিক্ষাবর্ষ ${academicYearName}`}
        docTitleEn={`Admission Confirmation & ID Card Info Slip — Session ${academicYearName}`}
      />

      <div className="flex flex-col sm:flex-row items-start justify-between gap-5 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 flex-1">
          <p className="tabular-nums">
            <span className="text-muted-foreground">{'শিক্ষার্থী আইডি:'}</span>{' '}
            <strong className="font-mono text-primary">{student.studentId}</strong>
          </p>
          <p className="tabular-nums">
            <span className="text-muted-foreground">{'শ্রেণি ও শাখা:'}</span>{' '}
            <strong>
              {classNameLabel} ({sectionName})
            </strong>
          </p>
          <p>
            <span className="text-muted-foreground">{'শিক্ষার্থীর নাম:'}</span>{' '}
            <strong>{student.nameBn || student.nameEn}</strong>
            <span className="block text-xs font-mono uppercase text-muted-foreground">
              {student.nameEn}
            </span>
          </p>
          <p className="tabular-nums">
            <span className="text-muted-foreground">{'রোল নম্বর:'}</span>{' '}
            <strong className="font-mono text-base">{formatNumber(enrollment.roll, 'bn')}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">{'পিতার নাম:'}</span>{' '}
            {fatherName}
          </p>
          <p>
            <span className="text-muted-foreground">{'মাতার নাম:'}</span>{' '}
            {motherName}
          </p>
          <p className="tabular-nums">
            <span className="text-muted-foreground">{'অভিভাবক মোবাইল:'}</span>{' '}
            <strong className="font-mono">{guardianPhone}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">{'রক্তের গ্রুপ:'}</span>{' '}
            <strong className="text-destructive">{bloodDisplay}</strong>
          </p>
          {groupName && (
            <p>
              <span className="text-muted-foreground">{'বিভাগ ও ৪র্থ বিষয়:'}</span>{' '}
              <strong>{groupName}</strong>
              {optionalSubjectName ? ` · ${optionalSubjectName}` : ''}
            </p>
          )}
          {enrollment.formSerialNo && (
            <p className="tabular-nums">
              <span className="text-muted-foreground">{'ফরম নং:'}</span>{' '}
              <span className="font-mono">{enrollment.formSerialNo}</span>
            </p>
          )}
          {enrollment.remarks && (
            <p className="sm:col-span-2 text-xs text-muted-foreground">
              {'অফিস নোট / ফি তথ্য:'} {enrollment.remarks}
            </p>
          )}
        </div>

        <div className="w-24 h-28 border border-border rounded bg-surface-muted/40 overflow-hidden flex items-center justify-center shrink-0">
          {student.photo ? (
            <img
              src={student.photo}
              alt={student.nameEn}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[11px] text-muted-foreground text-center px-1">
              {'পাসপোর্ট ছবি'}
            </span>
          )}
        </div>
      </div>

      <SignatureBlock />
    </div>
  );
}

/**
 * Bold inline token for dynamic student/certificate data inside formal prose.
 */
function CertField({
  children,
  mono = false,
}: {
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <span
      className={`font-bold text-[#09090B] px-0.5 border-b border-dotted border-[#52525B] ${
        mono ? 'font-mono tabular-nums' : ''
      }`}
    >
      {children}
    </span>
  );
}

/**
 * Authentic Bangladeshi Institutional Certificate Frame & Letterhead
 * - Pure crisp white paper & black institutional typography (no loud color banners/pills)
 * - Natural full-color school emblem in letterhead + subtle centered watermark (জলছাপ)
 * - Clean 2-column formal signature row (no seal circle)
 * - Marked with data-certificate-print-root="true" so triggerPrint() prints ONLY this exact A4 sheet.
 */
function FormalCertificateShell({
  school,
  refLabel,
  refValue,
  dateLabel,
  dateValue,
  titleBn,
  titleEn,
  children,
}: {
  school: SchoolProfile;
  refLabel: string;
  refValue: string;
  dateLabel: string;
  dateValue: string;
  titleBn: string;
  titleEn: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-certificate-print-root="true"
      className="certificate-paper bg-white text-[#111111] max-w-[794px] mx-auto p-3 sm:p-4 border border-neutral-300"
    >
      {/* Classic Formal Double-Border Frame */}
      <div className="border-[2px] border-[#18181B] p-[4px]">
        <div className="relative overflow-hidden border border-[#52525B] px-7 sm:px-12 py-7 sm:py-10 flex flex-col justify-between min-h-[900px]">
          {/* Subtle Full-Color School Logo Watermark (জলছাপ) */}
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute inset-0 flex items-center justify-center z-0"
          >
            <img
              src={SCHOOL_LOGO_SRC}
              alt=""
              referrerPolicy="no-referrer"
              className="w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] object-contain opacity-[0.08]"
            />
          </div>

          <div className="relative z-10">
            {/* 1. Institutional Letterhead (Full-Color School Logo, Formal Ink Typography) */}
            <div className="border-b-[3px] border-double border-[#27272A] pb-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 text-center">
                <div className="shrink-0">
                  <SchoolEmblem size={68} className="ring-0 bg-transparent p-0" />
                </div>
                <div className="space-y-0.5">
                  <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#111111] leading-tight">
                    {school.name}
                  </h1>
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.12em] text-[#27272A]">
                    {school.nameEn ?? 'BHOJESHWAR HIGH SCHOOL'}
                  </p>
                  <p className="text-xs text-[#3F3F46] pt-0.5">{school.address}</p>
                  <p className="text-[11px] text-[#52525B] tabular-nums">
                    EIIN: {school.eiin ?? '113587'} ·{' '}
                    {'স্থাপিত:'}{' '}
                    {String(school.establishedYear ?? 1978).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)])}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Reference Number & Date Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-5 pb-6 text-xs sm:text-[13px] text-[#27272A] tabular-nums">
              <div>
                <span className="text-[#52525B]">{refLabel}</span>{' '}
                <span className="font-mono font-semibold text-[#111111] border-b border-dotted border-[#52525B] pb-0.5">
                  {refValue}
                </span>
              </div>
              <div>
                <span className="text-[#52525B]">{dateLabel}</span>{' '}
                <span className="font-semibold text-[#111111] border-b border-dotted border-[#52525B] pb-0.5">
                  {dateValue}
                </span>
              </div>
            </div>

            {/* 3. Formal Centered Document Title */}
            <div className="text-center mb-8">
              <h2 className="inline-block text-lg sm:text-[22px] font-bold tracking-wide text-[#111111] border-b-[1.5px] border-[#18181B] pb-1 px-5">
                {titleBn}
              </h2>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#52525B] mt-1.5">
                {titleEn}
              </p>
            </div>

            {/* 4. Certificate Formal Prose Body */}
            <div className="text-[#18181B]">{children}</div>
          </div>

          {/* 5. Clean 2-Column Institutional Signature Footer (No Seal Circle) */}
          <div className="relative z-10 mt-16 pt-6">
            <div className="flex items-end justify-between gap-8 text-center text-xs sm:text-[13px] text-[#18181B]">
              <div className="w-48 space-y-1">
                <div className="h-12" />
                <div className="border-t border-[#27272A] pt-1.5 font-semibold">
                  {'প্রস্তুতকারক / অফিস সহকারী'}
                </div>
                <p className="text-[11px] text-[#52525B]">
                  {'তারিখ ও স্বাক্ষর'}
                </p>
              </div>

              <div className="w-56 space-y-1">
                <div className="h-12" />
                <div className="border-t border-[#27272A] pt-1.5 font-semibold">
                  {'প্রধান শিক্ষক'}
                </div>
                <p className="text-[11px] text-[#52525B]">{school.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrintableTransferCertificate({
  school,
  tc,
  student,
  fatherName,
  motherName,
  sectionName,
  roll,
}: {
  school: SchoolProfile;
  tc: StudentTransferCertificate;
  student: Student;
  fatherName?: string | null;
  motherName?: string | null;
  sectionName?: string | null;
  roll?: number | null;
}) {
  const studentNameBn = student.nameBn || student.nameEn;
  const studentNameDisplay =
    `${studentNameBn}${student.nameBn && student.nameEn ? ` (${student.nameEn})` : ''}`;
  const addressText = student.permanentAddress || student.presentAddress || '—';
  const dobText = student.dateOfBirth ? formatDateLong(student.dateOfBirth, 'bn') : '—';
  const admissionDateText = student.admissionDate ? formatDateLong(student.admissionDate, 'bn') : '—';
  const leavingDateText = formatDateLong(tc.leavingDate, 'bn');
  const conductText = tc.conductRemarks || 'উত্তম ও শৃঙ্খলাপরায়ণ';

  return (
    <FormalCertificateShell
      school={school}
      refLabel={'টিসি স্মারক নং:'}
      refValue={tc.tcNumber}
      dateLabel={'তারিখ:'}
      dateValue={formatDateLong(tc.issueDate, 'bn')}
      titleBn="বিদ্যালয় পরিত্যাগের ছাড়পত্র"
      titleEn="TRANSFER CERTIFICATE"
    >
      {(
        <div className="space-y-6 text-[15px] sm:text-[16px] leading-[2.15] text-justify">
          <p>
            এই মর্মে প্রত্যয়ন করা যাইতেছে যে, <CertField>{studentNameDisplay}</CertField>
            {fatherName ? (
              <>
                , পিতা: <CertField>{fatherName}</CertField>
              </>
            ) : null}
            {motherName ? (
              <>
                , মাতা: <CertField>{motherName}</CertField>
              </>
            ) : null}
            , ঠিকানা: <CertField>{addressText}</CertField>, শিক্ষার্থী আইডি:{' '}
            <CertField mono>{student.studentId}</CertField>, অত্র বিদ্যালয়ের একজন নিয়মিত শিক্ষার্থী
            ছিল। বিদ্যালয়ের ভর্তি রেজিস্টার অনুযায়ী তাহার জন্ম তারিখ{' '}
            <CertField>{dobText}</CertField>
            {student.birthCertificateNo ? (
              <>
                {' '}
                (জন্ম নিবন্ধন নং: <CertField mono>{student.birthCertificateNo}</CertField>)
              </>
            ) : null}{' '}
            এবং সে <CertField>{admissionDateText}</CertField> তারিখে অত্র বিদ্যালয়ে ভর্তি হইয়া{' '}
            <CertField>{tc.leavingClass || '—'}</CertField> শ্রেণিতে
            {sectionName ? (
              <>
                , শাখা: <CertField>{sectionName}</CertField>
              </>
            ) : null}
            {roll ? (
              <>
                , রোল নং: <CertField mono>{formatNumber(roll, 'bn')}</CertField>
              </>
            ) : null}
            -এ <CertField>{leavingDateText}</CertField> তারিখ পর্যন্ত নিয়মিত অধ্যয়ন করিয়াছে।
          </p>

          <p>
            বিদ্যালয় ত্যাগকালে সে{' '}
            <CertField>
              {tc.promotedToNextClass
                ? 'পরবর্তী শ্রেণিতে উত্তীর্ণ হইয়াছে'
                : 'মধ্য-সেশনে বিদ্যালয় ত্যাগ করিয়াছে'}
            </CertField>{' '}
            এবং অদ্য পর্যন্ত বিদ্যালয়ের{' '}
            <CertField>
              {tc.duesCleared
                ? 'সকল পাওনা ও বেতন-ভাতা পরিশোধ করিয়াছে'
                : 'পাওনা অপরিশোধিত রহিয়াছে'}
            </CertField>
            । <CertField>{tc.reason}</CertField> — এই কারণে
            {tc.destinationSchool ? (
              <>
                {' '}
                (গন্তব্য বিদ্যালয়: <CertField>{tc.destinationSchool}</CertField>)
              </>
            ) : null}{' '}
            তাহার আবেদনক্রমে অদ্য এই বিদ্যালয় পরিত্যাগের ছাড়পত্র প্রদান করা হইল।
            {tc.remarks ? (
              <>
                {' '}
                দাপ্তরিক মন্তব্য: <CertField>{tc.remarks}</CertField>।
              </>
            ) : null}
          </p>

          <p>
            অত্র বিদ্যালয়ে অধ্যয়নকালে তাহার স্বভাব ও চরিত্র <CertField>{conductText}</CertField>{' '}
            ছিল। আমার জানামতে সে রাষ্ট্রবিরোধী কিংবা বিদ্যালয়ের শৃঙ্খলা পরিপন্থী কোনো কার্যকলাপে
            কখনো লিপ্ত ছিল না। আমি তাহার উজ্জ্বল ভবিষ্যৎ, সুস্বাস্থ্য ও জীবনের সর্বাঙ্গীণ মঙ্গল কামনা
            করি।
          </p>
        </div>
      )}
    </FormalCertificateShell>
  );
}

export function PrintableTestimonialCertificate({
  school,
  testimonial,
  student,
  fatherName,
  motherName,
}: {
  school: SchoolProfile;
  testimonial: StudentTestimonial;
  student: Student;
  fatherName?: string | null;
  motherName?: string | null;
}) {
  const isSsc = testimonial.type === TestimonialType.SSC_GRADUATE;

  const studentNameDisplay =
    `${student.nameBn || student.nameEn}${student.nameBn && student.nameEn ? ` (${student.nameEn})` : ''}`;

  const dobText = student.dateOfBirth ? formatDateLong(student.dateOfBirth, 'bn') : '—';
  const addressText = student.permanentAddress || student.presentAddress || '—';
  const conductText =
    testimonial.conductRemarks || 'উত্তম ও শৃঙ্খলাপরায়ণ';
  const regNo = testimonial.registrationNo || student.boardRegistrationNo || null;

  return (
    <FormalCertificateShell
      school={school}
      refLabel={'স্মারক নং:'}
      refValue={testimonial.refNumber}
      dateLabel={'তারিখ:'}
      dateValue={formatDateLong(testimonial.issueDate, 'bn')}
      titleBn={isSsc ? 'প্রশংসাপত্র' : 'অধ্যয়ন ও চারিত্রিক প্রত্যয়নপত্র'}
      titleEn={isSsc ? 'TESTIMONIAL' : 'STUDY & CHARACTER CERTIFICATE'}
    >
      {isSsc ? (
        (
          <div className="space-y-6 text-[15px] sm:text-[16px] leading-[2.15] text-justify">
            <p>
              এই মর্মে প্রত্যয়ন করা যাইতেছে যে, <CertField>{studentNameDisplay}</CertField>
              {fatherName ? (
                <>
                  , পিতা: <CertField>{fatherName}</CertField>
                </>
              ) : null}
              {motherName ? (
                <>
                  , মাতা: <CertField>{motherName}</CertField>
                </>
              ) : null}
              , ঠিকানা: <CertField>{addressText}</CertField>, শিক্ষার্থী আইডি:{' '}
              <CertField mono>{student.studentId}</CertField>, অত্র বিদ্যালয়ের একজন নিয়মিত শিক্ষার্থী
              ছিল। বিদ্যালয়ের ভর্তি রেজিস্টার অনুযায়ী তাহার জন্ম তারিখ{' '}
              <CertField>{dobText}</CertField>।
            </p>

            <p>
              সে{' '}
              <CertField>
                {testimonial.boardName || 'মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড, ঢাকা'}
              </CertField>
              -এর অধীনে অনুষ্ঠিত{' '}
              <CertField mono>{formatNumber(testimonial.passingYear || '—', 'bn')}</CertField> সনের
              মাধ্যমিক স্কুল সার্টিফিকেট (এসএসসি) পরীক্ষায়{' '}
              <CertField mono>{testimonial.academicSession}</CertField> শিক্ষাবর্ষে{' '}
              <CertField>{testimonial.groupName || 'সাধারণ'}</CertField> বিভাগ হইতে বোর্ড রোল নং{' '}
              <CertField mono>{testimonial.boardRoll || '—'}</CertField>
              {regNo ? (
                <>
                  {' '}
                  এবং রেজিস্ট্রেশন নং <CertField mono>{regNo}</CertField>
                </>
              ) : null}{' '}
              লইয়া অংশগ্রহণ করিয়া{' '}
              {testimonial.gpa ? (
                <>
                  জিপিএ <CertField mono>{testimonial.gpa}</CertField>
                  {testimonial.letterGrade ? (
                    <>
                      {' '}
                      (লেটার গ্রেড: <CertField mono>{testimonial.letterGrade}</CertField>)
                    </>
                  ) : null}{' '}
                  অর্জন করিয়া{' '}
                </>
              ) : null}
              সফলতার সহিত উত্তীর্ণ হইয়াছে।
            </p>

            <p>
              বিদ্যালয়ে অধ্যয়নকালে তাহার স্বভাব ও চরিত্র <CertField>{conductText}</CertField> ছিল।
              আমার জানামতে সে রাষ্ট্রবিরোধী কিংবা বিদ্যালয়ের শৃঙ্খলা পরিপন্থী কোনো কার্যকলাপে কখনো
              অংশগ্রহণ করে নাই।
            </p>

            <p>
              আমি তাহার উজ্জ্বল ভবিষ্যৎ, সুস্বাস্থ্য ও জীবনের উত্তরোত্তর সাফল্য কামনা করি।
            </p>
          </div>
        )
      ) : (
        <div className="space-y-6 text-[15px] sm:text-[16px] leading-[2.15] text-justify">
          <p>
            এই মর্মে প্রত্যয়ন করা যাইতেছে যে, <CertField>{studentNameDisplay}</CertField>
            {fatherName ? (
              <>
                , পিতা: <CertField>{fatherName}</CertField>
              </>
            ) : null}
            {motherName ? (
              <>
                , মাতা: <CertField>{motherName}</CertField>
              </>
            ) : null}
            , ঠিকানা: <CertField>{addressText}</CertField>, অত্র বিদ্যালয়ের{' '}
            <CertField mono>{testimonial.academicSession}</CertField> শিক্ষাবর্ষে{' '}
            <CertField>{testimonial.className}</CertField> শ্রেণির
            {testimonial.sectionName ? (
              <>
                {' '}
                <CertField>{testimonial.sectionName}</CertField> শাখার
              </>
            ) : null}
            {testimonial.roll ? (
              <>
                {' '}
                রোল নং <CertField mono>{formatNumber(testimonial.roll, 'bn')}</CertField>
              </>
            ) : null}
            {testimonial.groupName ? (
              <>
                {' '}
                (বিভাগ: <CertField>{testimonial.groupName}</CertField>)
              </>
            ) : null}
            -এর একজন নিয়মিত অধ্যয়নরত শিক্ষার্থী। বিদ্যালয়ের ভর্তি রেজিস্টার অনুযায়ী তাহার শিক্ষার্থী
            আইডি <CertField mono>{student.studentId}</CertField> এবং জন্ম তারিখ{' '}
            <CertField>{dobText}</CertField>।
          </p>

          <p>
            আমার জানামতে তাহার স্বভাব ও চারিত্রিক বৈশিষ্ট্য <CertField>{conductText}</CertField>{' '}
            এবং সে রাষ্ট্রবিরোধী কিংবা বিদ্যালয়ের শৃঙ্খলা পরিপন্থী কোনো কার্যকলাপে কখনো লিপ্ত ছিল না।
            {testimonial.purpose ? (
              <>
                {' '}
                <CertField>{testimonial.purpose}</CertField> অদ্য এই প্রত্যয়নপত্র প্রদান করা হইল।
              </>
            ) : (
              <> তাহার আবেদনক্রমে অদ্য এই প্রত্যয়নপত্র প্রদান করা হইল।</>
            )}
          </p>

          <p>
            আমি তাহার সার্বিক সুস্বাস্থ্য, দীর্ঘায়ু এবং জীবনের উত্তরোত্তর সাফল্য ও মঙ্গল কামনা করি।
          </p>
        </div>
      )}
    </FormalCertificateShell>
  );
}



export function PrintableIdCardSheet({
  school,
  holderType,
  cards,
}: {
  school: SchoolProfile;
  holderType: 'STUDENT' | 'STAFF';
  cards: Array<{
    code: string;
    name: string;
    subline: string;
    secondaryLine?: string;
    bloodGroup?: string | null;
    phone?: string | null;
    validUntil: string;
    photo?: string | null;
    studentIdCode?: string;
    rfidNumber?: string;
    className?: string;
    sectionName?: string;
    roll?: string | number;
    guardianPhone?: string | null;
  }>;
}) {
  return (
    <div className="print-sheet bg-white border border-border rounded-[var(--radius)] p-6 text-foreground [-webkit-print-color-adjust:exact] [print-color-adjust:exact]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 print:grid-cols-2 print:gap-4">
        {cards.map((card) => {
          const bloodLabel = card.bloodGroup
            ? card.bloodGroup
                .replace('_POSITIVE', '+')
                .replace('_NEGATIVE', '−')
                .replace('POSITIVE', '+')
                .replace('NEGATIVE', '−')
            : '—';
          const displayId = card.studentIdCode || card.code;
          const displayPhone = card.guardianPhone || card.phone || '—';

          return (
            <div
              key={card.code}
              className="relative rounded-xl overflow-hidden border border-[#0E6B35]/30 bg-white shadow-sm flex flex-col justify-between break-inside-avoid print:shadow-none"
            >
              {/* Institutional Header */}
              <div className="bg-[#0E6B35] text-white px-4 py-3 border-b-2 border-[#D4AF37] flex items-center gap-3">
                <div className="shrink-0 bg-white rounded-full p-0.5 shadow-sm">
                  <SchoolEmblem size={36} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold leading-snug tracking-tight truncate">
                    {school.name}
                  </p>
                  <div className="flex items-center justify-between gap-2 text-xs text-white/90 mt-0.5">
                    <span className="truncate">
                      {school.address || 'বাংলাদেশ'}
                    </span>
                    <span className="font-mono shrink-0 bg-white/15 px-1.5 py-0.5 rounded">
                      EIIN: {school.eiin || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Type Ribbon */}
              <div className="bg-[#0E6B35]/8 border-b border-[#0E6B35]/15 px-4 py-1 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0E6B35]">
                  {holderType === 'STUDENT'
                    ? 'শিক্ষার্থী পরিচয়পত্র'
                    : 'শিক্ষক ও কর্মচারী পরিচয়পত্র'}
                </span>
                {card.rfidNumber && (
                  <span className="text-xs font-mono font-semibold text-foreground/80">
                    {card.rfidNumber}
                  </span>
                )}
              </div>

              {/* Main Card Body */}
              <div className="p-4 flex items-start gap-4 flex-1 bg-white">
                {/* Portrait Photo Frame */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="h-24 w-20 rounded-lg border-2 border-[#0E6B35]/25 bg-slate-50 overflow-hidden flex items-center justify-center">
                    {card.photo ? (
                      <img
                        src={card.photo}
                        alt={card.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-[#0E6B35]">
                        {card.name
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join('')
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 tabular-nums">
                    {'রক্ত:'} {bloodLabel}
                  </span>
                </div>

                {/* Structured Details */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <h4 className="text-base font-bold text-slate-900 leading-snug truncate">
                    {card.name}
                  </h4>

                  <div className="grid grid-cols-1 gap-1 text-sm text-slate-700">
                    {card.className ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-slate-500 shrink-0">{'শ্রেণি:'}</span>
                        <span className="font-semibold text-slate-900 truncate">
                          {card.className}
                          {card.sectionName ? ` (${card.sectionName})` : ''}
                          {card.roll !== undefined && card.roll !== null && card.roll !== 0
                            ? ` · ${'রোল'}: ${card.roll}`
                            : ''}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-[#0E6B35] truncate">{card.subline}</p>
                    )}

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-slate-500 shrink-0">{'আইডি:'}</span>
                      <span className="font-mono font-semibold text-slate-900 truncate">
                        {displayId}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-slate-500 shrink-0">
                        {holderType === 'STUDENT'
                          ? 'অভিভাবক:'
                          : 'মোবাইল:'}
                      </span>
                      <span className="font-mono font-medium text-slate-800 truncate">
                        {displayPhone}
                      </span>
                    </div>

                    {!card.className && card.secondaryLine && (
                      <p className="text-sm text-slate-600 truncate">{card.secondaryLine}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer & Authority Signature */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-end justify-between gap-3 text-xs text-slate-600">
                <div className="tabular-nums">
                  <span className="text-slate-500">{'মেয়াদ উত্তীর্ণ:'}</span>{' '}
                  <strong className="text-slate-800">{card.validUntil}</strong>
                </div>
                <div className="text-center pt-2">
                  <div className="w-28 border-t border-slate-400 pt-0.5 font-semibold text-slate-700">
                    {'প্রধান শিক্ষক'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

