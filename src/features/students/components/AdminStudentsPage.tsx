'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useParams } from '@/src/lib/navigation';
import { useGetBootstrapQuery } from '@/src/store/api';
import { useGetAcademicYearsQuery } from '@/src/services/academic/year.api';
import { useAcademicYearSelection } from '@/src/views/admin/AcademicFoundation';
import { useI18n } from '@/src/lib/i18n';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { Button } from '@/src/components/ui/primitives';

import { StudentsShell } from './StudentsShell';
import { StudentDirectory } from './admin/StudentDirectory';
import { StudentProfile } from './admin/StudentProfile';
import { StudentEnrollments } from './admin/StudentEnrollments';
import { StudentPromotions } from './admin/StudentPromotions';
import { StudentTransfers } from './admin/StudentTransfers';
import { StudentTestimonials } from './admin/StudentTestimonials';
import { StudentRfidCards } from './admin/StudentRfidCards';
import { StudentRegister } from './StudentRegister';
import { StudentAdmissionInbox } from './StudentAdmissionInbox';
import { StudentImporter } from './StudentImporter';

type SectionKey =
  | 'directory'
  | 'create'
  | 'admissions'
  | 'enrollments'
  | 'promotions'
  | 'transfers'
  | 'testimonials'
  | 'cards'
  | 'import'
  | 'profile';

const TAB_SECTION: Record<string, SectionKey> = {
  directory: 'directory',
  create: 'create',
  admissions: 'admissions',
  enrollments: 'enrollments',
  promotions: 'promotions',
  transfers: 'transfers',
  testimonials: 'testimonials',
  rfid: 'cards',
  import: 'import',
};

export function AdminStudentsPage({
  defaultTab = 'directory',
}: {
  defaultTab?: keyof typeof TAB_SECTION;
}) {
  const { id } = useParams<{ id?: string }>();
  const pathname = usePathname();
  const section: SectionKey = id ? 'profile' : TAB_SECTION[defaultTab] ?? 'directory';
  const usesLiveApi =
    section === 'create' ||
    section === 'directory' ||
    section === 'profile' ||
    section === 'enrollments' ||
    section === 'admissions' ||
    section === 'transfers' ||
    section === 'testimonials' ||
    section === 'cards';
  const { data: db, isLoading } = useGetBootstrapQuery(undefined, {
    skip: usesLiveApi,
  });
  const { data: liveYears = [], isLoading: loadingYears } =
    useGetAcademicYearsQuery(undefined, { skip: !usesLiveApi });
  const { pick } = useI18n();
  const academicYears = usesLiveApi ? liveYears : db?.academicYears;
  const year = useAcademicYearSelection(academicYears);

  if (usesLiveApi && loadingYears) return <LoadingSkeleton />;
  if (!usesLiveApi && (isLoading || !db || !year)) return <LoadingSkeleton />;

  const copy: Record<SectionKey, { title: string; description: string; year: boolean }> = {
    directory: {
      title: pick('শিক্ষার্থী ডিরেক্টরি', 'Student Directory'),
      description: pick(
        'নির্বাচিত শিক্ষাবর্ষের ভর্তি শিক্ষার্থী, শ্রেণি ও শাখাভিত্তিক তালিকা, উপস্থিতির হার এবং অভিভাবক যোগাযোগ।',
        'Enrolled student roster, class and section breakdown, attendance rates, and guardian contacts for the selected session.'
      ),
      year: true,
    },
    create: {
      title: pick('নতুন ভর্তি (৬ষ্ঠ – ১০ম শ্রেণি)', 'New Admission (Classes 6–10)'),
      description: pick(
        'একীভূত ভর্তি ফরম: শ্রেণি ও বিভাগ নির্বাচন, শিক্ষার্থীর পরিচয় ও ছবি, অভিভাবক ও ঠিকানা এবং শাখা-রোল ও কাগজপত্র যাচাই।',
        'Unified admission engine: class & stream rules, student identity & photo, parents & structured address, and office placement.'
      ),
      year: false,
    },
    admissions: {
      title: pick('অনলাইন ভর্তি আবেদন ইনবক্স', 'Online Admissions Inbox'),
      description: pick(
        'অনলাইন আবেদন যাচাই করে অনুমোদন, বাতিল, দ্রুত ভর্তি অথবা পূর্ণ ফর্মে সম্পাদনা করে ভর্তি নিশ্চিত করুন।',
        'Review online applications, verify documents, and quick-admit or open in the full admission form.'
      ),
      year: true,
    },
    enrollments: {
      title: pick('এনরোলমেন্ট রেজিস্টার', 'Session Enrollments'),
      description: pick(
        'নির্বাচিত শিক্ষাবর্ষে প্রতিটি শিক্ষার্থীর শ্রেণি, শাখা, রোল, বিভাগ ও ঐচ্ছিক বিষয়ের তালিকা এবং চলতি সেশনের প্লেসমেন্ট সংশোধন।',
        'Class, section, roll, stream, and optional subject registry for the selected academic year.'
      ),
      year: true,
    },
    promotions: {
      title: pick('শ্রেণি উত্তরণ ও প্রমোশন', 'Class Promotion Console'),
      description: pick(
        'প্রকাশিত পরীক্ষার ফলাফল ও মেধাক্রম যাচাই করে পরবর্তী শিক্ষাবর্ষে উত্তীর্ণ, অকৃতকার্য (Retained) অথবা দশম শ্রেণি সমাপ্ত করুন।',
        'Promote, retain, or graduate students into the next academic year with published exam result guidance.'
      ),
      year: true,
    },
    transfers: {
      title: pick('ছাড়পত্র (TC) রেজিস্টার', 'Transfer Certificates'),
      description: pick(
        'অফিসিয়াল ছাড়পত্র ইস্যু, প্রিন্ট ও বকেয়া নিষ্পত্তি। টিসি ইস্যু হলে শিক্ষার্থীর চলতি ভর্তি ও সক্রিয় RFID কার্ড স্বয়ংক্রিয়ভাবে বন্ধ হয়।',
        'Issue and print official Transfer Certificates. Issuing a TC closes active enrollment and auto-blocks active RFID cards.'
      ),
      year: false,
    },
    testimonials: {
      title: pick('প্রত্যয়নপত্র ও প্রশংসাপত্র (Testimonial)', 'Testimonial Certificates'),
      description: pick(
        'অধ্যয়ন ও চারিত্রিক প্রত্যয়নপত্র এবং এসএসসি প্রশংসাপত্র ইস্যু, স্মারক সংরক্ষণ ও আনুষ্ঠানিক A4 প্রিন্ট।',
        'Issue, track, and print official Study & Character certificates and SSC Graduate testimonials.'
      ),
      year: false,
    },
    cards: {
      title: pick('RFID ও পরিচয়পত্র ডেস্ক', 'Identity & RFID Cards'),
      description: pick(
        'সক্রিয় শিক্ষার্থীদের স্মার্ট কার্ড ইস্যু, হারানো/ক্ষতিগ্রস্ত কার্ড রিপ্লেসমেন্ট, স্ট্যাটাস নিয়ন্ত্রণ এবং ব্যাচ প্রিন্ট। (হাজিরা গেট পাতা থেকে নেওয়া হয়)',
        'Issue smart RFID cards, track unassigned students, replace lost or damaged cards, and print ID sheets. Attendance scanning is handled separately.'
      ),
      year: false,
    },
    import: {
      title: pick('CSV আমদানি', 'CSV import'),
      description: pick('ফাইল মিলিয়ে দেখে, তারপর শুধু সঠিক সারি ভর্তি হয়।', 'Check the file, then only valid rows are admitted.'),
      year: true,
    },
    profile: {
      title: pick('শিক্ষার্থীর প্রোফাইল', 'Student Profile'),
      description: pick(
        'শিক্ষার্থীর পূর্ণাঙ্গ একাডেমিক ও ব্যক্তিগত নথি, উপস্থিতি বিশ্লেষণ, পরীক্ষার ফলাফল এবং অভিভাবক তথ্য।',
        'Complete academic and personal dossier, attendance record, exam results, and guardian contacts.'
      ),
      year: true,
    },
  };

  const page = copy[section];
  const headerActions =
    section === 'directory' ? (
      <>
        <Link href="/admin/students/import">
          <Button variant="outline" size="sm">
            {pick('CSV আমদানি', 'CSV import')}
          </Button>
        </Link>
        <Link href="/admin/students/create">
          <Button variant="primary" size="sm">
            {pick('নতুন ভর্তি', 'New admission')}
          </Button>
        </Link>
      </>
    ) : undefined;

  return (
    <StudentsShell
      title={page.title}
      description={page.description}
      actions={headerActions}
      years={academicYears ?? []}
      selectedYear={year ?? { id: '', name: '', startDate: '', endDate: '', isActive: true, createdAt: '', updatedAt: '' }}
      showYear={page.year}
    >
      {section === 'create' && <StudentRegister yearId={year?.id} />}
      {section === 'directory' && <StudentDirectory yearId={year?.id ?? ''} />}
      {section === 'enrollments' && <StudentEnrollments yearId={year?.id ?? ''} />}
      {section === 'admissions' && <StudentAdmissionInbox yearId={year?.id ?? ''} />}
      {section === 'profile' && (
        <StudentProfile
          studentId={id ?? ''}
          yearId={year?.id ?? ''}
          startEditing={pathname.endsWith('/edit')}
        />
      )}
      {section === 'transfers' && <StudentTransfers />}
      {section === 'testimonials' && <StudentTestimonials />}
      {section === 'cards' && <StudentRfidCards />}
      {db && year && (
        <>
          {section === 'promotions' && <StudentPromotions db={db} yearId={year.id} />}
          {section === 'import' && <StudentImporter db={db} yearId={year.id} />}
        </>
      )}
    </StudentsShell>
  );
}
