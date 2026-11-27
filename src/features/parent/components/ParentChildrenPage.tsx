'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { BookOpen, Calendar, ClipboardCheck, FileBarChart2, PhoneCall, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { useGetAuthProfileQuery } from '@/src/features/auth/api/auth.api';
import {
  useGetParentByIdQuery,
  useGetSchoolClassesQuery,
} from '@/src/services/academic';
import { useAppSelector } from '@/src/store/hooks';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { Button, Card } from '@/src/components/ui/primitives';
import { formatNumber } from '@/src/lib/formatters';
import { ENUM_LABELS } from '@/src/lib/constants/enums';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function ParentChildrenPage() {
  const auth = useAppSelector((s) => s.auth);
  const { data: meData, isLoading: loadingMe } = useGetAuthProfileQuery();

  const parentId = meData?.parent?.id || auth.user?.parentId || '';

  const {
    data: parentDetail,
    isLoading: loadingParent,
  } = useGetParentByIdQuery(parentId, { skip: !parentId });

  const { data: allClasses = [] } = useGetSchoolClassesQuery();

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

  const children = parentDetail?.children ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={'আমার সন্তানসমূহ'}
        description={
          parentDetail
            ? `${parentDetail.nameBn || parentDetail.name} · আপনার অধীনে অধ্যয়নরত সন্তানদের একাডেমিক প্রোফাইল`
            : 'অধ্যয়নরত সন্তানদের একাডেমিক প্রোফাইল'
        }
      />

      {/* Summary KPIs */}
      {parentDetail && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label={'মোট নিবন্ধিত সন্তান'}
            value={formatNumber(children.length, 'bn')}
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            label={'প্রাথমিক অভিভাবকত্ব'}
            value={formatNumber(children.filter((c) => c.isPrimary).length, 'bn')}
            icon={<ShieldCheck className="w-5 h-5" />}
          />
          <StatCard
            label={'SMS বিজ্ঞপ্তি সক্রিয়'}
            value={formatNumber(children.filter((c) => c.isSmsReceiver).length, 'bn')}
            icon={<PhoneCall className="w-5 h-5" />}
          />
        </div>
      )}

      {!parentId ? (
        <EmptyState
          title={'অভিভাবক প্রোফাইল যুক্ত নেই'}
          description={'আপনার অ্যাকাউন্টের সাথে এখনো কোনো অভিভাবক প্রোফাইল লিংক করা হয়নি। অনুগ্রহ করে বিদ্যালয় অফিসে যোগাযোগ করুন।'}
        />
      ) : children.length === 0 ? (
        <EmptyState
          title={'কোনো সন্তান লিংক করা নেই'}
          description={'আপনার অভিভাবক প্রোফাইলের সাথে এখনো কোনো শিক্ষার্থীর তথ্য যুক্ত করা হয়নি।'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {children.map((child) => {
            const displayName = child.studentNameBn || child.studentNameEn || child.studentName;
            const classDisplay = child.currentClass
              ? classNameMap.get(child.currentClass) ?? child.currentClass
              : 'ভর্তি তথ্য নেই';
            const relationshipLabel =
              (ENUM_LABELS.RelationshipType as Record<string, { bn: string }> | undefined)?.[
                child.relationship
              ]?.bn ?? child.relationship;
            const genderLabel =
              (ENUM_LABELS.Gender as Record<string, { bn: string }> | undefined)?.[
                child.gender
              ]?.bn ?? child.gender;

            return (
              <Card key={child.mappingId} className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {child.photo ? (
                      <img
                        src={child.photo}
                        alt={displayName}
                        className="w-12 h-12 rounded-full object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                        {getInitials(child.studentNameEn || displayName)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-primary truncate">
                        {displayName}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {child.studentNameEn} · ID:{' '}
                        <span className="font-mono font-medium text-foreground">
                          {child.studentCustomId}
                        </span>
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary shrink-0">
                    <UserCheck className="w-3.5 h-3.5" />
                    {relationshipLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm bg-muted/40 p-3.5 rounded-[var(--radius)] tabular-nums">
                  <div>
                    <span className="text-xs text-muted-foreground">{'শ্রেণি ও শাখা'}</span>
                    <p className="font-semibold mt-0.5 text-foreground">
                      {classDisplay}
                      {child.currentSection ? ` (${child.currentSection})` : ''}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{'রোল নম্বর'}</span>
                    <p className="font-bold mt-0.5 text-foreground text-base">
                      {child.currentRoll != null ? formatNumber(child.currentRoll, 'bn') : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{'শিক্ষাবর্ষ'}</span>
                    <p className="font-semibold mt-0.5 text-foreground">
                      {child.academicYear || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{'লিঙ্গ'}</span>
                    <p className="font-semibold mt-0.5 text-foreground">{genderLabel || '—'}</p>
                  </div>
                </div>

                {(child.isPrimary || child.isEmergencyContact || child.isSmsReceiver) && (
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {child.isPrimary && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold">
                        {'প্রাথমিক অভিভাবক'}
                      </span>
                    )}
                    {child.isEmergencyContact && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold">
                        {'জরুরি যোগাযোগ'}
                      </span>
                    )}
                    {child.isSmsReceiver && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold">
                        {'SMS প্রাপক'}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Link href={`/parent/children/${child.studentId}`}>
                    <Button variant="primary" size="sm">
                      <BookOpen className="w-4 h-4" />
                      {'বিস্তারিত প্রোফাইল'}
                    </Button>
                  </Link>
                  <Link href="/parent/attendance">
                    <Button variant="outline" size="sm">
                      <ClipboardCheck className="w-4 h-4" />
                      {'হাজিরা'}
                    </Button>
                  </Link>
                  <Link href="/parent/results">
                    <Button variant="outline" size="sm">
                      <FileBarChart2 className="w-4 h-4" />
                      {'ফলাফল'}
                    </Button>
                  </Link>
                  <Link href="/parent/routines">
                    <Button variant="outline" size="sm">
                      <Calendar className="w-4 h-4" />
                      {'রুটিন'}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
