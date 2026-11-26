'use client';

import React from 'react';
import { useParams } from '@/src/lib/navigation';
import { useI18n } from '@/src/lib/i18n';
import { StaffShell } from './StaffShell';
import { StaffDirectory } from './StaffDirectory';
import { StaffProfile } from './StaffProfile';

export function AdminStaffPage({
  defaultTab: _defaultTab = 'all',
}: {
  defaultTab?: string;
}) {
  const { id } = useParams<{ id?: string }>();
  const { pick } = useI18n();

  const isProfile = Boolean(id);
  const title = isProfile
    ? pick('স্টাফ প্রোফাইল', 'Staff profile')
    : pick('শিক্ষক ও কর্মচারী', 'Staff & Teachers');
  const description = isProfile
    ? pick('চাকরি, যোগাযোগ এবং এই বছরের শিক্ষকতা।', 'Employment, contact details, and this year’s teaching duties.')
    : pick(
        'শিক্ষক, কর্মকর্তা, কর্মচারী ও প্রাক্তন শিক্ষক এক জায়গায় পরিচালনা করুন।',
        'Manage teachers, officers, employees, and former teachers in one place.'
      );

  return (
    <StaffShell title={title} description={description}>
      {isProfile ? (
        <StaffProfile staffId={id ?? ''} />
      ) : (
        <StaffDirectory kind="all" createOpen={false} />
      )}
    </StaffShell>
  );
}
