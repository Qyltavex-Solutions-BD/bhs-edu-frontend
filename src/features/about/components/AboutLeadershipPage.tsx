'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from '@/src/lib/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Mail,
  MapPin,
  Maximize2,
  Phone,
  Printer,
  Search,
  X,
} from 'lucide-react';
import { useGetBootstrapQuery } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import {
  EmptyState,
  getCampusPhoto,
  getCommitteePortrait,
  getLeadershipPortrait,
  getStaffPortrait,
  InstitutionalArtwork,
  LoadingSkeleton,
  PageHeader,
  SchoolEmblem,
} from '@/src/components/shared/Feedback';
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { formatDateLong, formatNumber } from '@/src/lib/formatters';
import { InstitutionContentType, StaffStatus, StaffType } from '@/src/types/enums';
import { triggerPrint } from '@/src/lib/utils/cn';

export function AboutLeadershipPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const published = db.leadershipMessages.filter((m) => m.isPublished);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <PageHeader
        title={pick('প্রধান শিক্ষক ও সভাপতির বাণী', 'Leadership Messages')}
        description={pick(
          'ভোজেশ্বর উচ্চ বিদ্যালয়ের প্রাতিষ্ঠানিক নেতৃত্ব, শিক্ষা দর্শন ও দিকনির্দেশনা।',
          'Institutional leadership, educational philosophy, and messages from Bhojeshwar High School.'
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {published.map((msg) => {
          const portrait = getLeadershipPortrait(msg.photo, msg.type);
          const roleKicker =
            msg.type === 'PRINCIPAL'
              ? pick('প্রধান শিক্ষকের বাণী', "Headteacher's Message")
              : pick('সভাপতির বাণী', "Chairman's Message");
          return (
            <Card key={msg.id} className="overflow-hidden flex flex-col justify-between">
              <div>
                <Link
                  href={`/about/leadership/${msg.id}`}
                  className="block relative aspect-[4/3] w-full overflow-hidden bg-surface-muted group"
                >
                  <img
                    src={portrait}
                    alt={msg.personName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                  <span className="absolute bottom-3 left-5 text-sm font-semibold text-white">
                    {roleKicker}
                  </span>
                </Link>
                <div className="p-6 space-y-3">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      <Link href={`/about/leadership/${msg.id}`} className="hover:text-primary transition-colors">
                        {msg.personName}
                      </Link>
                    </h2>
                    <p className="text-sm text-primary font-medium">{msg.designation}</p>
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed line-clamp-4">
                    “{msg.message.split('\n')[0]}”
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 pt-3 border-t border-border/80 flex items-center justify-between">
                <Link
                  href={`/about/leadership/${msg.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  <span>{pick('সম্পূর্ণ বাণী পড়ুন', 'Read Full Message')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-xs text-muted-foreground">{db.schoolProfile.schoolCode ?? 'BHS'}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

