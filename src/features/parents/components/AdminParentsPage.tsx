'use client';

import React from 'react';
import { useParams } from '@/src/lib/navigation';
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
  const copy = {
    directory: {
      title: 'অভিভাবক ডিরেক্টরি',
      description: 'শিক্ষার্থী ভর্তির মাধ্যমে যুক্ত হওয়া সকল অভিভাবকের তালিকা। প্রোফাইলে গিয়ে তথ্য সংশোধন বা পোর্টাল অ্যাক্সেস পরিচালনা করা যায়।',
    },
    coverage: {
      title: 'প্রাথমিক অভিভাবক ও SMS কভারেজ',
      description: 'সক্রিয় প্রতিটি শিক্ষার্থীর একজন প্রাথমিক অভিভাবক, একজন জরুরি যোগাযোগ এবং একজন SMS প্রাপক নির্ধারিত আছে কি না তা যাচাই করুন।',
    },
    profile: {
      title: 'অভিভাবকের প্রোফাইল',
      description: 'যোগাযোগের তথ্য, পোর্টাল অ্যাক্সেস এবং সন্তানের সাথে সম্পর্কের বিবরণ।',
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
