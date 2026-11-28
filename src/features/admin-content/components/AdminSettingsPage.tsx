'use client';

import React from 'react';
import { PageHeader } from '@/src/components/shared/Feedback';
import { CommonProfilePanel } from '@/src/components/shared/CommonProfilePanel';

export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title={'সিস্টেম সেটিংস ও প্রোফাইল'}
        description={'প্রোফাইল, পাসওয়ার্ড, সক্রিয় সেশন ও থিম কনফিগার করুন।'}
      />

      <CommonProfilePanel
        roleLabel={'প্রধান প্রশাসক (Admin / Head Teacher)'}
      />
    </div>
  );
}

