'use client';

import React from 'react';
import Link from 'next/link';
import { SchoolEmblem } from '@/src/components/shared/Feedback';
import { Button } from '@/src/components/ui/primitives';

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
