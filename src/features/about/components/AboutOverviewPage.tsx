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

export function AboutOverviewPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();

  useEffect(() => {
    if (isLoading || typeof window === 'undefined') return;
    if (window.location.hash === '#mission-vision') {
      document.getElementById('mission-vision')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isLoading]);

  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <PageHeader
        title={pick('বিদ্যালয় পরিচিতি', 'About Bhojeshwar High School (BHS)')}
        description={db.schoolProfile.address}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-5">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <SchoolEmblem size={64} />
              <div>
                <h2 className="text-xl font-bold text-primary">{db.schoolProfile.name}</h2>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {db.schoolProfile.nameEn} · EIIN: {db.schoolProfile.eiin} · Code: {db.schoolProfile.schoolCode} · Est.{' '}
                  {formatNumber(db.schoolProfile.establishedYear, locale)}
                </p>
              </div>
            </div>
            <p className="text-base text-foreground/90 leading-relaxed">{db.schoolProfile.description}</p>
            <p className="text-sm font-medium text-primary pt-3 border-t border-border">
              {pick('মূলমন্ত্র:', 'School Motto:')} “{db.schoolProfile.motto ?? 'শিক্ষাই আলো, জ্ঞানই শক্তি'}”
            </p>
          </Card>

          <section id="mission-vision" className="scroll-mt-24 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-6 space-y-2.5">
              <h3 className="text-lg font-bold text-primary">{pick('আমাদের লক্ষ্য (Mission)', 'Our Mission')}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{db.schoolProfile.mission}</p>
            </Card>
            <Card className="p-6 space-y-2.5">
              <h3 className="text-lg font-bold text-primary">{pick('আমাদের দৃষ্টিভঙ্গি (Vision)', 'Our Vision')}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{db.schoolProfile.vision}</p>
            </Card>
          </section>
        </div>
        <div className="lg:col-span-5 space-y-4">
          <InstitutionalArtwork variant="campus-heritage" title={db.schoolProfile.name} subtitle="Est. 1978 · BHS" className="h-56" />
          <Card className="p-5 space-y-3">
            <h3 className="text-base font-bold text-foreground">{pick('সম্পর্কিত বিভাগ', 'Explore More')}</h3>
            <div className="grid grid-cols-2 gap-2.5 text-sm">
              <Link href="/about/history" className="text-primary hover:underline">{pick('ইতিহাস ও ঐতিহ্য', 'History & Heritage')}</Link>
              <Link href="/about/facilities" className="text-primary hover:underline">{pick('ক্যাম্পাস সুবিধা', 'Campus Facilities')}</Link>
              <Link href="/about/leadership" className="text-primary hover:underline">{pick('নেতৃত্বের বাণী', 'Leadership Messages')}</Link>
              <Link href="/about/management-committee" className="text-primary hover:underline">{pick('ম্যানেজিং কমিটি', 'Managing Committee')}</Link>
              <Link href="/about/teachers" className="text-primary hover:underline">{pick('শিক্ষকমণ্ডলী', 'Teachers & Staff')}</Link>
              <Link href="/gallery" className="text-primary hover:underline">{pick('ফটো গ্যালারি', 'Photo Gallery')}</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

