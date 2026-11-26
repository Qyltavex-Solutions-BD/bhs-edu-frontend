'use client';

import React from 'react';
import { useParams } from '@/src/lib/navigation';
import { useI18n } from '@/src/lib/i18n';
import { ParentsShell } from './ParentsShell';
import { ParentDirectory } from './ParentDirectory';
import { ParentCoverage } from './ParentCoverage';
import { ParentProfile } from './ParentProfile';

export function AdminParentsPage({
  section = 'directory',
}: {
  section?: 'directory' | 'coverage' | 'profile';
  createOpen?: boolean;
}) {
  const { id } = useParams<{ id?: string }>();
  const { pick } = useI18n();

  const copy = {
    directory: {
      title: pick('অভিভাবক ডিরেক্টরি', 'Guardian directory'),
      description: pick(
        'শিক্ষার্থী ভর্তির মাধ্যমে যুক্ত হওয়া সকল অভিভাবকের তালিকা। প্রোফাইলে গিয়ে তথ্য সংশোধন বা পোর্টাল অ্যাক্সেস পরিচালনা করা যায়।',
        'Directory of guardians linked through student admissions. Open any profile to manage details and portal access.'
      ),
    },
    coverage: {
      title: pick('প্রাথমিক অভিভাবক ও SMS কভারেজ', 'Primary guardian & SMS coverage'),
      description: pick(
        'সক্রিয় প্রতিটি শিক্ষার্থীর একজন প্রাথমিক অভিভাবক, একজন জরুরি যোগাযোগ এবং একজন SMS প্রাপক নির্ধারিত আছে কি না তা যাচাই করুন।',
        'Verify that every active student has one primary guardian, one emergency contact, and one SMS receiver.'
      ),
    },
    profile: {
      title: pick('অভিভাবকের প্রোফাইল', 'Guardian profile'),
      description: pick(
        'যোগাযোগের তথ্য, পোর্টাল অ্যাক্সেস এবং সন্তানের সাথে সম্পর্কের বিবরণ।',
        'Contact details, portal access, and linked student relationships.'
      ),
    },
  }[section];

  return (
    <ParentsShell title={copy.title} description={copy.description}>
      {section === 'directory' && <ParentDirectory />}
      {section === 'coverage' && <ParentCoverage />}
      {section === 'profile' && <ParentProfile parentId={id ?? ''} />}
    </ParentsShell>
  );
}
