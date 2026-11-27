'use client';

import React from 'react';
import { useParams } from '@/src/lib/navigation';
import { StaffShell } from './StaffShell';
import { StaffDirectory } from './StaffDirectory';
import { StaffProfile } from './StaffProfile';

export function AdminStaffPage({
  defaultTab: _defaultTab = 'all',
}: {
  defaultTab?: string;
}) {
  const { id } = useParams<{ id?: string }>();
  const isProfile = Boolean(id);
  const title = isProfile
    ? 'স্টাফ প্রোফাইল'
    : 'শিক্ষক ও কর্মচারী';
  const description = isProfile
    ? 'চাকরি, যোগাযোগ এবং এই বছরের শিক্ষকতা।'
    : 'শিক্ষক, কর্মকর্তা, কর্মচারী ও প্রাক্তন শিক্ষক এক জায়গায় পরিচালনা করুন।';

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
