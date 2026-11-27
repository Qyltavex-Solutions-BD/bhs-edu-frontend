'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useParams } from '@/src/lib/navigation';
import { useGetAcademicYearsQuery } from '@/src/services/academic/year.api';
import { useAcademicYearSelection } from '@/src/views/admin/AcademicFoundation';
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
  const { data: academicYears = [], isLoading: loadingYears } =
    useGetAcademicYearsQuery();
  const year = useAcademicYearSelection(academicYears);

  if (loadingYears) return <LoadingSkeleton />;

  const copy: Record<SectionKey, { title: string; description: string; year: boolean }> = {
    directory: {
      title: 'শিক্ষার্থী ডিরেক্টরি',
      description: 'নির্বাচিত শিক্ষাবর্ষের ভর্তি শিক্ষার্থী, শ্রেণি ও শাখাভিত্তিক তালিকা, উপস্থিতির হার এবং অভিভাবক যোগাযোগ।',
      year: true,
    },
    create: {
      title: 'নতুন ভর্তি (৬ষ্ঠ – ১০ম শ্রেণি)',
      description: 'একীভূত ভর্তি ফরম: শ্রেণি ও বিভাগ নির্বাচন, শিক্ষার্থীর পরিচয় ও ছবি, অভিভাবক ও ঠিকানা এবং শাখা-রোল ও কাগজপত্র যাচাই।',
      year: false,
    },
    admissions: {
      title: 'অনলাইন ভর্তি আবেদন ইনবক্স',
      description: 'অনলাইন আবেদন যাচাই করে অনুমোদন, বাতিল, দ্রুত ভর্তি অথবা পূর্ণ ফর্মে সম্পাদনা করে ভর্তি নিশ্চিত করুন।',
      year: true,
    },
    enrollments: {
      title: 'এনরোলমেন্ট রেজিস্টার',
      description: 'নির্বাচিত শিক্ষাবর্ষে প্রতিটি শিক্ষার্থীর শ্রেণি, শাখা, রোল, বিভাগ ও ঐচ্ছিক বিষয়ের তালিকা এবং চলতি সেশনের প্লেসমেন্ট সংশোধন।',
      year: true,
    },
    promotions: {
      title: 'শ্রেণি উত্তরণ ও প্রমোশন',
      description: 'প্রকাশিত পরীক্ষার ফলাফল ও মেধাক্রম যাচাই করে পরবর্তী শিক্ষাবর্ষে উত্তীর্ণ, অকৃতকার্য (Retained) অথবা দশম শ্রেণি সমাপ্ত করুন।',
      year: true,
    },
    transfers: {
      title: 'ছাড়পত্র (TC) রেজিস্টার',
      description: 'অফিসিয়াল ছাড়পত্র ইস্যু, প্রিন্ট ও বকেয়া নিষ্পত্তি। টিসি ইস্যু হলে শিক্ষার্থীর চলতি ভর্তি ও সক্রিয় RFID কার্ড স্বয়ংক্রিয়ভাবে বন্ধ হয়।',
      year: false,
    },
    testimonials: {
      title: 'প্রত্যয়নপত্র ও প্রশংসাপত্র (Testimonial)',
      description: 'অধ্যয়ন ও চারিত্রিক প্রত্যয়নপত্র এবং এসএসসি প্রশংসাপত্র ইস্যু, স্মারক সংরক্ষণ ও আনুষ্ঠানিক A4 প্রিন্ট।',
      year: false,
    },
    cards: {
      title: 'RFID ও পরিচয়পত্র ডেস্ক',
      description: 'সক্রিয় শিক্ষার্থীদের স্মার্ট কার্ড ইস্যু, হারানো/ক্ষতিগ্রস্ত কার্ড রিপ্লেসমেন্ট, স্ট্যাটাস নিয়ন্ত্রণ এবং ব্যাচ প্রিন্ট। (হাজিরা গেট পাতা থেকে নেওয়া হয়)',
      year: false,
    },
    import: {
      title: 'CSV আমদানি',
      description: 'ফাইল মিলিয়ে দেখে, তারপর শুধু সঠিক সারি ভর্তি হয়।',
      year: true,
    },
    profile: {
      title: 'শিক্ষার্থীর প্রোফাইল',
      description: 'শিক্ষার্থীর পূর্ণাঙ্গ একাডেমিক ও ব্যক্তিগত নথি, উপস্থিতি বিশ্লেষণ, পরীক্ষার ফলাফল এবং অভিভাবক তথ্য।',
      year: true,
    },
  };

  const page = copy[section];
  const headerActions =
    section === 'directory' ? (
      <>
        <Link href="/admin/students/import">
          <Button variant="outline" size="sm">
            {'CSV আমদানি'}
          </Button>
        </Link>
        <Link href="/admin/students/create">
          <Button variant="primary" size="sm">
            {'নতুন ভর্তি'}
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
      {section === 'promotions' && <StudentPromotions yearId={year?.id ?? ''} />}
      {section === 'import' && <StudentImporter yearId={year?.id ?? ''} />}
    </StudentsShell>
  );
}
