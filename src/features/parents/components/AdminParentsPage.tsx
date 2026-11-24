'use client';

import React from 'react';
import { useParams } from '@/src/lib/navigation';
import { useGetBootstrapQuery } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { ParentsShell } from './ParentsShell';
import { ParentDirectory } from './ParentDirectory';
import { ParentCoverage } from './ParentCoverage';
import { ParentProfile } from './ParentProfile';

export function AdminParentsPage({
  section = 'directory',
  createOpen = false,
}: {
  section?: 'directory' | 'coverage' | 'profile';
  createOpen?: boolean;
}) {
  const { id } = useParams<{ id?: string }>();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  if (isLoading || !db) return <LoadingSkeleton />;

  const copy = {
    directory: {
      title: pick('অভিভাবক ডিরেক্টরি', 'Guardian directory'),
      description: pick('একজন অভিভাবকের একাধিক সন্তান থাকতে পারে। নাম খুলে সংযোগ দেখা যায়।', 'One guardian can have several children. Open a name to see the links.'),
    },
    coverage: {
      title: pick('প্রাথমিক অভিভাবক ও SMS', 'Primary guardian and SMS'),
      description: pick('সক্রিয় শিক্ষার্থীর একজন প্রাথমিক অভিভাবক, একজন জরুরি যোগাযোগ এবং একজন SMS প্রাপক থাকতে হবে।', 'Every active student needs one primary guardian, one emergency contact, and one SMS receiver.'),
    },
    profile: {
      title: pick('অভিভাবকের প্রোফাইল', 'Guardian profile'),
      description: pick('যোগাযোগের তথ্য এবং কোন সন্তানের সঙ্গে কী সম্পর্ক।', 'Contact details and how this person is related to each child.'),
    },
  }[section];

  return (
    <ParentsShell title={copy.title} description={copy.description}>
      {section === 'directory' && <ParentDirectory db={db} createOpen={createOpen} />}
      {section === 'coverage' && <ParentCoverage db={db} />}
      {section === 'profile' && <ParentProfile db={db} parentId={id ?? ''} />}
    </ParentsShell>
  );
}
