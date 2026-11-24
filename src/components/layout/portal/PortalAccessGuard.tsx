'use client';

import React from 'react';
import Link from 'next/link';
import { SchoolEmblem } from '@/src/components/shared/Feedback';
import { Button } from '@/src/components/ui/primitives';
import type { AppRole } from '@/src/store/slices/authSlice';

interface PortalStudentDisabledScreenProps {
  pick: (bn: string, en: string) => string;
}

export function PortalStudentDisabledScreen({ pick }: PortalStudentDisabledScreenProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-surface border border-border rounded-[var(--radius)] p-8 text-center space-y-4">
        <div className="flex justify-center">
          <SchoolEmblem size={56} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {pick('শিক্ষার্থী পোর্টাল বর্তমানে বন্ধ রাখা হয়েছে', 'Student Portal Is Currently Disabled')}
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          {pick(
            'প্রাথমিক রিলিজ পরিকল্পনা অনুযায়ী অ্যাডমিন, শিক্ষক ও অভিভাবক পোর্টাল সক্রিয় রয়েছে। শিক্ষার্থীরা কোনো লগইন ছাড়াই পাবলিক ফলাফল পৃষ্ঠা থেকে তাদের ফলাফল ও মার্কশিট দেখতে পারবেন।',
            'Per the initial release plan (VITE_ENABLE_STUDENT_PORTAL=false), Admin, Teacher, and Parent portals are active while students view results on the public result lookup page.'
          )}
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/results">
            <Button variant="primary">{pick('পাবলিক ফলাফল দেখুন', 'Go to Public Results')}</Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="outline">{pick('অ্যাডমিন সেটিংস থেকে চালু করুন', 'Enable in Admin Settings')}</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost">{pick('হোমপেজ', 'Home')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

interface PortalLoginRequiredScreenProps {
  defaultRole: AppRole;
  onLoginDemo: (role: AppRole) => void;
  pick: (bn: string, en: string) => string;
}

export function PortalLoginRequiredScreen({
  defaultRole,
  onLoginDemo,
  pick,
}: PortalLoginRequiredScreenProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-surface border border-border rounded-[var(--radius)] p-7 space-y-4 text-center">
        <div className="flex justify-center">
          <SchoolEmblem size={52} />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          {pick('এই পোর্টালে প্রবেশ করতে লগইন প্রয়োজন', 'Sign In Required for This Portal')}
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          {pick(
            'আপনি অনুমোদিত ভূমিকা দিয়ে সাইন ইন করে পোর্টালটি ব্যবহার করতে পারেন। ডেমো সেশন শুধুমাত্র প্রদর্শনের জন্য।',
            'Please sign in with an authorized account for this portal. Demo login is provided strictly for preview.'
          )}
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="primary"
            onClick={() => onLoginDemo(defaultRole)}
          >
            {pick(`ডেমো ${defaultRole} হিসেবে প্রবেশ করুন`, `Continue as Demo ${defaultRole}`)}
          </Button>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              {pick('লগইন পৃষ্ঠায় যান', 'Go to Login Page')}
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="w-full">
              {pick('পাবলিক ওয়েবসাইটে ফিরুন', 'Return to Public Website')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
