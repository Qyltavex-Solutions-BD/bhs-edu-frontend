'use client';

import React from 'react';
import { useParams } from '@/src/lib/navigation';
import { useGetStaffWorkspaceQuery } from '../api/staff.api';
import { useI18n } from '@/src/lib/i18n';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { StaffShell } from './StaffShell';
import { StaffDirectory } from './StaffDirectory';
import { StaffDepartments } from './StaffDepartments';
import { StaffPosts } from './StaffPosts';
import { StaffProfile } from './StaffProfile';

type SectionKey = 'all' | 'teachers' | 'employees' | 'departments' | 'structures' | 'profile';

const TAB: Record<string, SectionKey> = {
  all: 'all',
  teachers: 'teachers',
  employees: 'employees',
  departments: 'departments',
  structures: 'structures',
  create: 'all',
};

export function AdminStaffPage({
  defaultTab = 'all',
}: {
  defaultTab?: keyof typeof TAB;
}) {
  const { id } = useParams<{ id?: string }>();
  const { pick } = useI18n();
  const section: SectionKey = id ? 'profile' : TAB[defaultTab] ?? 'all';
  const { data: db, isLoading, error, refetch } = useGetStaffWorkspaceQuery(undefined, { skip: section === 'departments' });
  if (isLoading) return <LoadingSkeleton />;
  if (section !== 'departments' && (error || !db)) return (
    <div role="alert" className="space-y-2">
      <p>{pick('স্টাফের তথ্য লোড করা যায়নি', 'Could not load staff data.')} {error && 'message' in error ? error.message : ''}</p>
      <button type="button" className="underline" onClick={refetch}>{pick('আবার চেষ্টা করুন', 'Retry')}</button>
    </div>
  );

  const copy: Record<SectionKey, { title: string; description: string }> = {
    all: {
      title: pick('সকল স্টাফ', 'All staff'),
      description: pick('শিক্ষক, কর্মকর্তা ও কর্মচারী এক তালিকায়। নাম খুলে প্রোফাইল।', 'Teachers, officers, and employees in one list. Open a name for the profile.'),
    },
    teachers: {
      title: pick('শিক্ষক', 'Teachers'),
      description: pick('যাঁরা ক্লাস নেন। শ্রেণি ও বিষয় বণ্টন একাডেমিক মেনুতে।', 'People who teach. Class and subject assignment stays in Academics.'),
    },
    employees: {
      title: pick('কর্মকর্তা ও কর্মচারী', 'Officers and employees'),
      description: pick('শিক্ষক ছাড়া অফিস ও সাপোর্ট স্টাফ।', 'Office and support staff other than teachers.'),
    },
    departments: {
      title: pick('বিভাগ', 'Departments'),
      description: pick('বিজ্ঞান, হিসাব, অফিস — স্টাফ কোন বিভাগে।', 'Science, accounts, office — which unit a person belongs to.'),
    },
    structures: {
      title: pick('অনুমোদিত পদ', 'Sanctioned posts'),
      description: pick('কয়টি আসন আছে এবং কয়টিতে লোক আছেন। আসন পূর্ণ হলে নতুন নিয়োগ হয় না।', 'How many posts exist and how many are filled. A full post cannot take another person.'),
    },
    profile: {
      title: pick('স্টাফ প্রোফাইল', 'Staff profile'),
      description: pick('চাকরি, যোগাযোগ এবং এই বছরের শিক্ষকতা।', 'Employment, contact details, and this year’s teaching duties.'),
    },
  };

  return (
    <StaffShell title={copy[section].title} description={copy[section].description}>
      {db && (section === 'all' || section === 'teachers' || section === 'employees') && (
        <StaffDirectory db={db} kind={section} createOpen={defaultTab === 'create'} />
      )}
      {section === 'departments' && <StaffDepartments />}
      {db && section === 'structures' && <StaffPosts db={db} />}
      {db && section === 'profile' && <StaffProfile db={db} staffId={id ?? ''} />}
    </StaffShell>
  );
}
