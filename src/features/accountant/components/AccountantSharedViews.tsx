'use client';

import React from 'react';
import { CommonProfilePanel } from '@/src/components/shared/CommonProfilePanel';
import { PageHeader } from '@/src/components/shared/Feedback';
import { PortalNoticesView } from '@/src/components/shared/PortalNoticesView';
import { Card } from '@/src/components/ui/primitives';
import { useAppSelector } from '@/src/store/hooks';

export function AccountantNoticesPage() {
  return (
    <PortalNoticesView
      titleBn="অ্যাকাউন্ট্যান্ট নোটিশ বোর্ড"
      titleEn="Accountant & School Notice Board"
      descriptionBn="অর্থ, পরীক্ষা ফি ও বিদ্যালয় সংক্রান্ত সকল অভ্যন্তরীণ ও পাবলিক বিজ্ঞপ্তি।"
      descriptionEn="Official school announcements and fee-related notices."
    />
  );
}

export function AccountantProfilePage() {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <div className="space-y-6">
      <PageHeader
        title={'আমার অ্যাকাউন্ট্যান্ট প্রোফাইল'}
        description={'হিসাবরক্ষক অ্যাকাউন্ট পরিচিতি ও নিরাপত্তা ব্যবস্থাপনা'}
      />

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
          <div>
            <p className="text-sm text-muted-foreground">{'পূর্ণ নাম'}</p>
            <p className="font-semibold mt-0.5">{user?.name ?? 'অ্যাকাউন্ট্যান্ট'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'ভূমিকা (Role)'}</p>
            <p className="font-medium mt-0.5">{'হিসাবরক্ষক (Accountant)'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'ইমেইল'}</p>
            <p className="mt-0.5">{user?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'মোবাইল নম্বর'}</p>
            <p className="tabular-nums mt-0.5">{user?.phone ?? '—'}</p>
          </div>
        </div>
      </Card>

      <CommonProfilePanel
        roleLabel="হিসাবরক্ষক (অ্যাকাউন্ট্যান্ট)"
        extraMeta={user?.email ?? user?.phone ?? undefined}
      />
    </div>
  );
}
