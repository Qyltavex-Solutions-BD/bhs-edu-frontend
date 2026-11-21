'use client';

import React from 'react';
import { SchoolEmblem } from '@/src/components/shared/Feedback';
import { formatDateLong, formatNumber } from '@/src/lib/formatters';
import type { SchoolProfile, Student, StudentTransferCertificate } from '@/src/types/entities';
import type { OnlineAdmissionApplication } from '@/src/types/proposed/future';
import { useI18n } from '@/src/lib/i18n';

export function SchoolLetterhead({
  school,
  docTitleBn,
  docTitleEn,
}: {
  school: SchoolProfile;
  docTitleBn: string;
  docTitleEn: string;
}) {
  const { locale } = useI18n();
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
            EIIN: {school.eiin ?? '113587'} · Est. {school.establishedYear ?? 1978} · “{school.motto ?? 'শিক্ষাই আলো, জ্ঞানই শক্তি'}”
          </p>
        </div>
      </div>
      <div className="mt-3 text-center">
        <span className="inline-block px-4 py-1 border border-[#124B96]/35 bg-[#EBF4EE] text-[#0B7A34] text-sm font-bold rounded">
          {locale === 'bn' ? docTitleBn : docTitleEn}
        </span>
      </div>
    </div>
  );
}

export function SignatureBlock() {
  const { pick } = useI18n();
  return (
    <div className="grid grid-cols-3 gap-6 mt-12 pt-4 text-center text-sm text-foreground">
      <div>
        <div className="border-t border-foreground/40 pt-1.5 font-medium">
          {pick('শ্রেণি শিক্ষক', 'Class Teacher')}
        </div>
      </div>
      <div>
        <div className="border-t border-foreground/40 pt-1.5 font-medium">
          {pick('পরীক্ষা নিয়ন্ত্রক / অভিভাবক', 'Exam Controller / Guardian')}
        </div>
      </div>
      <div>
        <div className="border-t border-foreground/40 pt-1.5 font-medium">
          {pick('প্রধান শিক্ষক', 'Head Teacher / Principal')}
        </div>
      </div>
    </div>
  );
}

export function PrintableMarksheet({
  school,
  examName,
  student,
  summary,
  subjects,
}: {
  school: SchoolProfile;
  examName: string;
  student: {
    studentId: string;
    nameEn: string;
    nameBn?: string | null;
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
    totalMarks: number;
    letterGrade?: string | null;
    gradePoint?: number | null;
    isPassed: boolean;
    isOptional: boolean;
    bonusGradePoint: number;
    isAbsent: boolean;
  }>;
}) {
  const { locale, pick } = useI18n();
  return (
    <div className="print-sheet bg-surface border border-border rounded-[var(--radius)] p-6 sm:p-8 text-foreground">
      <SchoolLetterhead
        school={school}
        docTitleBn={`একাডেমিক ট্রান্সক্রিপ্ট / নম্বরপত্র — ${examName}`}
        docTitleEn={`Academic Transcript / Marksheet — ${examName}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-5 pb-4 border-b border-border">
        <div className="space-y-1">
          <p>
            <span className="text-muted-foreground">{pick('শিক্ষার্থীর নাম:', 'Student Name:')}</span>{' '}
            <strong className="font-semibold">
              {locale === 'bn' ? student.nameBn || student.nameEn : student.nameEn}
            </strong>
          </p>
          <p className="tabular-nums">
            <span className="text-muted-foreground">{pick('শিক্ষার্থী আইডি:', 'Student ID:')}</span>{' '}
            {student.studentId}
          </p>
          <p>
            <span className="text-muted-foreground">{pick('শ্রেণি ও শাখা:', 'Class & Section:')}</span>{' '}
            {locale === 'bn' ? student.classNameBn : student.className} ({student.sectionName})
            {student.groupName ? ` · ${locale === 'bn' ? student.groupNameBn : student.groupName}` : ''}
          </p>
        </div>
        <div className="space-y-1 sm:text-right tabular-nums">
          <p>
            <span className="text-muted-foreground">{pick('রোল নম্বর:', 'Roll No:')}</span>{' '}
            <strong className="font-semibold">{formatNumber(student.roll, locale)}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">{pick('শিক্ষাবর্ষ:', 'Academic Year:')}</span>{' '}
            {formatNumber(student.academicYear, locale)}
          </p>
          <p>
            <span className="text-muted-foreground">{pick('ফলাফলের অবস্থা:', 'Final Status:')}</span>{' '}
            <strong
              className={
                summary.resultStatus === 'PASS' ? 'text-success font-bold' : 'text-destructive font-bold'
              }
            >
              {summary.resultStatus}
            </strong>
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm border border-border border-collapse">
          <thead className="bg-surface-muted text-foreground">
            <tr>
              <th className="border border-border px-2.5 py-2 text-left">{pick('কোড', 'Code')}</th>
              <th className="border border-border px-2.5 py-2 text-left">{pick('বিষয়ের নাম', 'Subject')}</th>
              <th className="border border-border px-2.5 py-2 text-right">{pick('পূর্ণমান', 'Full')}</th>
              <th className="border border-border px-2.5 py-2 text-right">{pick('লিখিত', 'Written')}</th>
              <th className="border border-border px-2.5 py-2 text-right">{pick('বহুনির্বাচনি', 'MCQ')}</th>
              <th className="border border-border px-2.5 py-2 text-right">{pick('ব্যবহারিক', 'Prac')}</th>
              <th className="border border-border px-2.5 py-2 text-right">{pick('মোট', 'Total')}</th>
              <th className="border border-border px-2.5 py-2 text-center">{pick('গ্রেড', 'Grade')}</th>
              <th className="border border-border px-2.5 py-2 text-right">{pick('জিপি', 'GP')}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {subjects.map((sub, idx) => (
              <tr key={idx}>
                <td className="border border-border px-2.5 py-2">{sub.subjectCode}</td>
                <td className="border border-border px-2.5 py-2 font-medium">
                  {locale === 'bn' ? sub.subjectNameBn : sub.subjectName}
                  {sub.isOptional && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      ({pick('৪র্থ বিষয়', 'Optional')})
                    </span>
                  )}
                </td>
                <td className="border border-border px-2.5 py-2 text-right">{formatNumber(sub.fullMarks, locale)}</td>
                <td className="border border-border px-2.5 py-2 text-right">{formatNumber(sub.writtenMarks, locale)}</td>
                <td className="border border-border px-2.5 py-2 text-right">{formatNumber(sub.mcqMarks, locale)}</td>
                <td className="border border-border px-2.5 py-2 text-right">{formatNumber(sub.practicalMarks, locale)}</td>
                <td className="border border-border px-2.5 py-2 text-right font-semibold">
                  {sub.isAbsent ? 'AB' : formatNumber(sub.totalMarks, locale)}
                </td>
                <td
                  className={`border border-border px-2.5 py-2 text-center font-semibold ${
                    sub.isPassed ? '' : 'text-destructive'
                  }`}
                >
                  {sub.letterGrade ?? '—'}
                </td>
                <td className="border border-border px-2.5 py-2 text-right">
                  {sub.gradePoint !== null && sub.gradePoint !== undefined
                    ? formatNumber(sub.gradePoint, locale, 2)
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 p-4 bg-surface-muted/60 border border-border rounded-[var(--radius)] text-center tabular-nums">
        <div>
          <p className="text-xs text-muted-foreground">{pick('মোট নম্বর', 'Total Marks')}</p>
          <p className="text-base font-bold">
            {formatNumber(summary.totalMarks, locale)} / {formatNumber(summary.totalFullMarks, locale)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{pick('অর্জিত জিপিএ', 'GPA (With 4th)')}</p>
          <p className="text-base font-bold text-primary">
            {summary.gpa !== null && summary.gpa !== undefined
              ? formatNumber(summary.gpa, locale, 2)
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{pick('৪র্থ বিষয় ছাড়া জিপিএ', 'GPA (Without 4th)')}</p>
          <p className="text-base font-bold">
            {summary.gpaWithoutOptional !== null && summary.gpaWithoutOptional !== undefined
              ? formatNumber(summary.gpaWithoutOptional, locale, 2)
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{pick('গ্রেড', 'Letter Grade')}</p>
          <p className="text-base font-bold">{summary.letterGrade ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{pick('মেধা স্থান', 'Merit Position')}</p>
          <p className="text-base font-bold">
            {summary.meritPosition ? `#${formatNumber(summary.meritPosition, locale)}` : '—'}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        {pick(
          'দ্রষ্টব্য: জিপিএ ও ৪র্থ বিষয়ের বোনাস পয়েন্ট (জিপি - ২.০০) বিদ্যালয়ের কনফিগারকৃত গ্রেডিং স্কেল অনুযায়ী নির্ণীত।',
          'Note: GPA and optional subject bonus (GP − 2.00) are calculated from the school-configured GradingScale policy.'
        )}
      </p>

      <SignatureBlock />
    </div>
  );
}

export function PrintableAdmissionAdmitCard({
  school,
  application,
  targetClassName,
}: {
  school: SchoolProfile;
  application: OnlineAdmissionApplication;
  targetClassName: string;
}) {
  const { locale, pick } = useI18n();
  return (
    <div className="print-sheet bg-surface border border-border rounded-[var(--radius)] p-6 text-foreground">
      <SchoolLetterhead
        school={school}
        docTitleBn={`ভর্তি পরীক্ষার প্রবেশপত্র — শিক্ষাবর্ষ ${application.academicSession}`}
        docTitleEn={`Admission Test Admit Card — Session ${application.academicSession}`}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="space-y-1.5">
          <p>
            <span className="text-muted-foreground">{pick('আবেদন নম্বর:', 'Application No:')}</span>{' '}
            <strong className="font-mono">{application.applicationNumber}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">{pick('ভর্তি পরীক্ষার রোল:', 'Admission Test Roll:')}</span>{' '}
            <strong className="font-mono text-primary">{application.admissionTestRoll ?? 'TBA'}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">{pick('শিক্ষার্থীর নাম:', 'Applicant Name:')}</span>{' '}
            <strong>{application.studentNameBn} ({application.studentNameEn})</strong>
          </p>
          <p>
            <span className="text-muted-foreground">{pick('পিতার নাম:', 'Father Name:')}</span>{' '}
            {application.fatherNameBn}
          </p>
          <p>
            <span className="text-muted-foreground">{pick('মাতার নাম:', 'Mother Name:')}</span>{' '}
            {application.motherNameBn}
          </p>
        </div>
        <div className="space-y-1.5 sm:text-right">
          <p>
            <span className="text-muted-foreground">{pick('আবেদনকৃত শ্রেণি:', 'Applying for Class:')}</span>{' '}
            <strong>{targetClassName}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">{pick('ভর্তি পরীক্ষার তারিখ:', 'Test Date:')}</span>{' '}
            <strong>{formatDateLong(application.admissionTestDate, locale)}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">{pick('পরীক্ষার কেন্দ্র:', 'Venue:')}</span>{' '}
            {pick('ভোজেশ্বর উচ্চ বিদ্যালয় ক্যাম্পাস', 'Bhojeshwar High School Main Campus')}
          </p>
        </div>
      </div>
      <div className="mt-5 p-3 bg-surface-muted/60 border border-border rounded text-sm text-muted-foreground">
        {pick(
          'নির্দেশনা: পরীক্ষার দিন প্রবেশপত্রের প্রিন্ট কপি, ১৭ ডিজিটের জন্ম সনদের ফটোকপি এবং ২ কপি পাসপোর্ট সাইজ ছবি সঙ্গে আনতে হবে।',
          'Instructions: Bring this printed admit card, copy of 17-digit birth certificate, and 2 passport photographs on test day.'
        )}
      </div>
      <SignatureBlock />
    </div>
  );
}

export function PrintableTransferCertificate({
  school,
  tc,
  student,
  fatherName,
}: {
  school: SchoolProfile;
  tc: StudentTransferCertificate;
  student: Student;
  fatherName?: string | null;
}) {
  const { locale, pick } = useI18n();
  return (
    <div className="print-sheet bg-surface border border-border rounded-[var(--radius)] p-6 sm:p-8 text-foreground">
      <SchoolLetterhead
        school={school}
        docTitleBn="বিদ্যালয় পরিত্যাগের ছাড়পত্র (Transfer Certificate)"
        docTitleEn="School Transfer Certificate (TC)"
      />
      <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground mb-6 tabular-nums">
        <span>
          {pick('টিসি স্মারক নং:', 'TC Number:')}{' '}
          <strong className="text-foreground font-mono">{tc.tcNumber}</strong>
        </span>
        <span>
          {pick('ইস্যুর তারিখ:', 'Issue Date:')}{' '}
          <strong className="text-foreground">{formatDateLong(tc.issueDate, locale)}</strong>
        </span>
      </div>
      <div className="space-y-4 text-base leading-relaxed">
        <p>
          {pick(
            `এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, ${student.nameBn || student.nameEn} (${student.nameEn})${fatherName ? `, পিতা: ${fatherName}` : ''}, শিক্ষার্থী আইডি: ${student.studentId}, অত্র বিদ্যালয়ের ${tc.leavingClass ?? 'অধ্যয়নরত'} শ্রেণির একজন নিয়মিত শিক্ষার্থী ছিল।`,
            `This is to certify that ${student.nameEn}${fatherName ? ` (Father: ${fatherName})` : ''}, Student ID: ${student.studentId}, was a bona fide student of ${tc.leavingClass ?? 'this school'} at ${school.nameEn ?? school.name}.`
          )}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border border-border rounded bg-surface-muted/40 text-sm">
          <p>
            <span className="text-muted-foreground">{pick('জন্ম তারিখ:', 'Date of Birth:')}</span>{' '}
            <strong className="font-medium text-foreground">
              {student.dateOfBirth ? formatDateLong(student.dateOfBirth, locale) : '—'}
            </strong>
          </p>
          <p>
            <span className="text-muted-foreground">{pick('বিদ্যালয় ত্যাগের তারিখ:', 'Leaving Date:')}</span>{' '}
            <strong className="font-medium text-foreground">{formatDateLong(tc.leavingDate, locale)}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">{pick('শেষ অধ্যয়নরত শ্রেণি:', 'Leaving Class:')}</span>{' '}
            <strong className="font-medium text-foreground">{tc.leavingClass ?? '—'}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">{pick('পরবর্তী শ্রেণিতে উত্তীর্ণ:', 'Promoted to Next Class:')}</span>{' '}
            <strong className="font-medium text-foreground">
              {tc.promotedToNextClass ? pick('হ্যাঁ (উত্তীর্ণ)', 'Yes (Promoted)') : pick('না (মধ্য-সেশন)', 'No (Mid-session)')}
            </strong>
          </p>
          <p>
            <span className="text-muted-foreground">{pick('বকেয়া অবস্থা:', 'Dues Status:')}</span>{' '}
            <strong className="font-medium text-foreground">
              {tc.duesCleared ? pick('সকল বকেয়া পরিশোধিত', 'All dues cleared') : pick('অপরিশোধিত', 'Pending')}
            </strong>
          </p>
          <p>
            <span className="text-muted-foreground">{pick('আচরণ ও চরিত্র:', 'Conduct:')}</span>{' '}
            <strong className="font-medium text-foreground">{tc.conductRemarks || pick('উত্তম', 'Good')}</strong>
          </p>
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">{pick('গন্তব্য বিদ্যালয়:', 'Destination School:')}</span>{' '}
            <strong className="font-medium text-foreground">{tc.destinationSchool || '—'}</strong>
          </p>
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">{pick('বিদ্যালয় ত্যাগের কারণ:', 'Reason for Leaving:')}</span>{' '}
            {tc.reason}
          </p>
          {tc.remarks && (
            <p className="sm:col-span-2">
              <span className="text-muted-foreground">{pick('অতিরিক্ত মন্তব্য:', 'Remarks:')}</span>{' '}
              {tc.remarks}
            </p>
          )}
        </div>
        <p>
          {pick(
            'আমরা তার উজ্জ্বল ভবিষ্যৎ ও সর্বাঙ্গীণ মঙ্গল কামনা করছি।',
            'We wish the student every success in their future endeavors.'
          )}
        </p>
      </div>
      <SignatureBlock />
    </div>
  );
}

export function PrintableTabulationSheet({
  school,
  examName,
  className,
  academicYear,
  subjects,
  rows,
}: {
  school: SchoolProfile;
  examName: string;
  className: string;
  academicYear: string;
  subjects: Array<{ id: string; code: string; nameBn: string; nameEn: string; fullMarks: number }>;
  rows: Array<{
    roll: number;
    studentId: string;
    studentName: string;
    sectionName: string;
    subjectMarks: Record<string, { total: number; grade: string; isAbsent?: boolean }>;
    totalMarks: number;
    totalFullMarks: number;
    gpa: number | null;
    letterGrade: string | null;
    meritPosition: number | null;
    resultStatus: string;
  }>;
}) {
  const { locale, pick } = useI18n();
  return (
    <div className="print-sheet print-landscape bg-surface border border-border rounded-[var(--radius)] p-5 text-foreground">
      <SchoolLetterhead
        school={school}
        docTitleBn={`ট্যাবুলেশন শিট (শ্রেণিভিত্তিক ফলাফল) — ${examName}`}
        docTitleEn={`Class Tabulation Sheet — ${examName}`}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground mb-4 tabular-nums">
        <span>
          {pick('শ্রেণি:', 'Class:')} <strong className="text-foreground">{className}</strong>
        </span>
        <span>
          {pick('শিক্ষাবর্ষ:', 'Academic Year:')}{' '}
          <strong className="text-foreground">{formatNumber(academicYear, locale)}</strong>
        </span>
        <span>
          {pick('মোট পরীক্ষার্থী:', 'Total Examinees:')}{' '}
          <strong className="text-foreground">{formatNumber(rows.length, locale)}</strong>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-border border-collapse tabular-nums">
          <thead className="bg-surface-muted text-foreground">
            <tr>
              <th className="border border-border px-2 py-1.5 text-center">{pick('মেধা', 'Merit')}</th>
              <th className="border border-border px-2 py-1.5 text-center">{pick('রোল', 'Roll')}</th>
              <th className="border border-border px-2 py-1.5 text-left">{pick('শিক্ষার্থী', 'Student')}</th>
              {subjects.map((sub) => (
                <th key={sub.id} className="border border-border px-1.5 py-1.5 text-center">
                  <div>{locale === 'bn' ? sub.nameBn : sub.nameEn}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    ({formatNumber(sub.fullMarks, locale)})
                  </div>
                </th>
              ))}
              <th className="border border-border px-2 py-1.5 text-right">{pick('মোট', 'Total')}</th>
              <th className="border border-border px-2 py-1.5 text-right">GPA</th>
              <th className="border border-border px-2 py-1.5 text-center">{pick('গ্রেড', 'Grade')}</th>
              <th className="border border-border px-2 py-1.5 text-center">{pick('অবস্থা', 'Status')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.studentId}>
                <td className="border border-border px-2 py-1.5 text-center font-bold text-primary">
                  {r.meritPosition ? `#${formatNumber(r.meritPosition, locale)}` : '—'}
                </td>
                <td className="border border-border px-2 py-1.5 text-center font-semibold">
                  {formatNumber(r.roll, locale)}
                </td>
                <td className="border border-border px-2 py-1.5 font-medium whitespace-nowrap">
                  {r.studentName}{' '}
                  <span className="text-xs text-muted-foreground">({r.sectionName})</span>
                </td>
                {subjects.map((sub) => {
                  const cell = r.subjectMarks[sub.id];
                  return (
                    <td key={sub.id} className="border border-border px-1.5 py-1.5 text-center">
                      {!cell ? (
                        '—'
                      ) : cell.isAbsent ? (
                        <span className="text-destructive font-semibold">AB</span>
                      ) : (
                        <span>
                          {formatNumber(cell.total, locale)}{' '}
                          <span className="text-xs text-muted-foreground">({cell.grade})</span>
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="border border-border px-2 py-1.5 text-right font-semibold">
                  {formatNumber(r.totalMarks, locale)}
                </td>
                <td className="border border-border px-2 py-1.5 text-right font-bold text-primary">
                  {r.gpa !== null ? formatNumber(r.gpa, locale, 2) : '—'}
                </td>
                <td className="border border-border px-2 py-1.5 text-center font-bold">
                  {r.letterGrade ?? '—'}
                </td>
                <td className="border border-border px-2 py-1.5 text-center font-semibold">
                  <span className={r.resultStatus === 'PASS' ? 'text-success' : 'text-destructive'}>
                    {r.resultStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SignatureBlock />
    </div>
  );
}

export function PrintableExamSeatPlan({
  school,
  examName,
  roomName,
  seats,
}: {
  school: SchoolProfile;
  examName: string;
  roomName: string;
  seats: Array<{
    seatNo: number;
    roll: number;
    studentId: string;
    studentName: string;
    className: string;
    sectionName: string;
  }>;
}) {
  const { locale, pick } = useI18n();
  return (
    <div className="print-sheet bg-surface border border-border rounded-[var(--radius)] p-6 text-foreground">
      <SchoolLetterhead
        school={school}
        docTitleBn={`পরীক্ষার আসন বিন্যাস (Seat Plan) — ${examName}`}
        docTitleEn={`Examination Seat Plan — ${examName}`}
      />
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4 tabular-nums">
        <span>
          {pick('পরীক্ষার কক্ষ:', 'Exam Room:')}{' '}
          <strong className="text-foreground">{roomName}</strong>
        </span>
        <span>
          {pick('মোট আসন:', 'Total Seats:')}{' '}
          <strong className="text-foreground">{formatNumber(seats.length, locale)}</strong>
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {seats.map((seat) => (
          <div
            key={`${seat.studentId}-${seat.seatNo}`}
            className="border border-border rounded-lg p-3 space-y-1.5 bg-surface-muted/30 break-inside-avoid"
          >
            <div className="flex items-center justify-between border-b border-border pb-1.5">
              <div className="flex items-center gap-1.5">
                <SchoolEmblem size={22} />
                <span className="text-xs font-bold text-primary">
                  {pick('আসন', 'Seat')} #{formatNumber(seat.seatNo, locale)}
                </span>
              </div>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {pick('রোল:', 'Roll:')} {formatNumber(seat.roll, locale)}
              </span>
            </div>
            <p className="text-sm font-bold text-foreground truncate">{seat.studentName}</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {seat.className} ({seat.sectionName}) · ID: {seat.studentId}
            </p>
          </div>
        ))}
      </div>
      <SignatureBlock />
    </div>
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
  }>;
}) {
  const { pick } = useI18n();
  return (
    <div className="print-sheet bg-surface border border-border rounded-[var(--radius)] p-6 text-foreground">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.code}
            className="border border-border rounded-xl overflow-hidden bg-surface flex flex-col justify-between break-inside-avoid"
          >
            {/* Card Header */}
            <div className="bg-[#0E6B35] text-white px-3.5 py-2.5 flex items-center gap-2.5">
              <SchoolEmblem size={34} />
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight truncate">{school.name}</p>
                <p className="text-xs text-white/85 tabular-nums truncate">
                  EIIN: {school.eiin ?? '113587'} ·{' '}
                  {holderType === 'STUDENT'
                    ? pick('শিক্ষার্থী পরিচয়পত্র', 'STUDENT ID CARD')
                    : pick('শিক্ষক / কর্মচারী পরিচয়পত্র', 'STAFF ID CARD')}
                </p>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-3.5 flex items-center gap-3">
              <div className="h-14 w-12 rounded-lg bg-surface-muted border border-border text-foreground font-bold text-base flex items-center justify-center shrink-0">
                {card.name.slice(0, 2)}
              </div>
              <div className="min-w-0 space-y-0.5 text-sm">
                <p className="font-bold text-foreground truncate">{card.name}</p>
                <p className="text-xs text-primary font-medium truncate">{card.subline}</p>
                {card.secondaryLine && (
                  <p className="text-xs text-muted-foreground truncate">{card.secondaryLine}</p>
                )}
                <p className="text-xs font-mono text-foreground pt-0.5">ID: {card.code}</p>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-3.5 py-2 bg-surface-muted/70 border-t border-border flex items-center justify-between text-xs text-muted-foreground tabular-nums">
              <span>
                {pick('রক্তের গ্রুপ:', 'Blood:')}{' '}
                <strong className="text-destructive">
                  {card.bloodGroup ? card.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-') : '—'}
                </strong>
              </span>
              <span>
                {pick('মেয়াদ:', 'Valid:')} {card.validUntil}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

