'use client';

import React from 'react';
import Link from 'next/link';
import { SchoolEmblem } from '@/src/components/shared/Feedback';
import { Button } from '@/src/components/ui/primitives';

interface PortalStudentDisabledScreenProps {
}

export function PortalStudentDisabledScreen({ }: PortalStudentDisabledScreenProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-surface border border-border rounded-[var(--radius)] p-8 text-center space-y-4">
        <div className="flex justify-center">
          <SchoolEmblem size={56} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {'শিক্ষার্থী পোর্টাল বর্তমানে বন্ধ রাখা হয়েছে'}
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          {'প্রাথমিক রিলিজ পরিকল্পনা অনুযায়ী অ্যাডমিন, শিক্ষক ও অভিভাবক পোর্টাল সক্রিয় রয়েছে। শিক্ষার্থীরা কোনো লগইন ছাড়াই পাবলিক ফলাফল পৃষ্ঠা থেকে তাদের ফলাফল ও মার্কশিট দেখতে পারবেন।'}
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/results">
            <Button variant="primary">{'পাবলিক ফলাফল দেখুন'}</Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="outline">{'অ্যাডমিন সেটিংস থেকে চালু করুন'}</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost">{'হোমপেজ'}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
