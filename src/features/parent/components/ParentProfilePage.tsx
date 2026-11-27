'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useGetAuthProfileQuery } from '@/src/features/auth/api/auth.api';
import {
  useGetParentByIdQuery,
  useGetSchoolClassesQuery,
} from '@/src/services/academic';
import { useAppSelector } from '@/src/store/hooks';
import { CommonProfilePanel } from '@/src/components/shared/CommonProfilePanel';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { Card } from '@/src/components/ui/primitives';
import { formatNumber } from '@/src/lib/formatters';

export function ParentProfilePage() {
  const auth = useAppSelector((s) => s.auth);
  const { data: meData, isLoading: loadingMe } = useGetAuthProfileQuery();
  const { data: allClasses = [] } = useGetSchoolClassesQuery();

  const parentId = meData?.parent?.id || auth.user?.parentId || '';

  const {
    data: parentDetail,
    isLoading: loadingParent,
  } = useGetParentByIdQuery(parentId, { skip: !parentId });

  const classNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cls of allClasses) {
      map.set(cls.name, cls.nameBn || cls.name);
    }
    return map;
  }, [allClasses]);

  if (loadingMe || (Boolean(parentId) && loadingParent)) {
    return <LoadingSkeleton />;
  }

  if (!parentId || !parentDetail) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={'অভিভাবক প্রোফাইল'}
          description={'নিবন্ধিত যোগাযোগ ও সংযুক্ত সন্তানদের তথ্য'}
        />
        <EmptyState
          title={'অভিভাবক প্রোফাইল পাওয়া যায়নি'}
          description={'আপনার অ্যাকাউন্টের সাথে এখনো কোনো অভিভাবক প্রোফাইল যুক্ত করা হয়নি।'}
        />
      </div>
    );
  }

  const children = parentDetail.children ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={'অভিভাবক প্রোফাইল'}
        description={'নিবন্ধিত যোগাযোগ ও সংযুক্ত সন্তানদের তথ্য'}
      />

      <Card className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
        <div>
          <p className="text-sm text-muted-foreground">{'অভিভাবকের নাম'}</p>
          <p className="font-semibold mt-0.5">
            {parentDetail.nameBn || parentDetail.name}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{'মোবাইল নম্বর (SMS)'}</p>
          <p className="font-mono mt-0.5">{parentDetail.phone}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{'ইমেইল'}</p>
          <p className="mt-0.5">{parentDetail.email ?? meData?.email ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{'পেশা'}</p>
          <p className="mt-0.5">{parentDetail.occupation ?? '—'}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-sm text-muted-foreground">{'ঠিকানা'}</p>
          <p className="mt-0.5">{parentDetail.address ?? '—'}</p>
        </div>
      </Card>

      <CommonProfilePanel
        roleLabel={'নিবন্ধিত অভিভাবক (Parent / Guardian)'}
        extraMeta={parentDetail.phone}
      />

      <Card className="p-5">
        <h2 className="text-base font-semibold mb-3">
          {'সংযুক্ত শিক্ষার্থীসমূহ'}
        </h2>
        {children.length === 0 ? (
          <EmptyState
            title={'কোনো শিক্ষার্থী সংযুক্ত নেই'}
            description={'আপনার প্রোফাইলের সাথে এখনো কোনো সন্তান লিংক করা হয়নি।'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {children.map((c) => {
              const clsLabel = c.currentClass
                ? classNameMap.get(c.currentClass) ?? c.currentClass
                : '—';
              return (
                <Link
                  key={c.mappingId}
                  href={`/parent/children/${c.studentId}`}
                  className="p-3.5 rounded-[var(--radius)] border border-border hover:bg-muted/40 transition-colors"
                >
                  <p className="font-semibold text-primary">
                    {c.studentNameBn || c.studentNameEn}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {clsLabel}
                    {c.currentSection ? ` (${c.currentSection})` : ''} · {'রোল'}{' '}
                    {c.currentRoll != null ? formatNumber(c.currentRoll, 'bn') : '—'}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
