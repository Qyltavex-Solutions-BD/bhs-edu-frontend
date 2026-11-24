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

export function AboutFacilitiesPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <PageHeader
        title={pick('অবকাঠামো ও ক্যাম্পাস সুবিধা', 'Facilities & Infrastructure')}
        description={pick(
          'কনফিগারকৃত বিজ্ঞানাগার, কম্পিউটার ল্যাব, গ্রন্থাগার, মাল্টিমিডিয়া শ্রেণিকক্ষ ও খেলার মাঠ।',
          'Configured laboratories, digital classrooms, library, and playground facilities.'
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {db.facilities
          .filter((f) => f.isActive)
          .map((fac) => (
            <Card key={fac.id} className="overflow-hidden flex flex-col">
              <InstitutionalArtwork
                variant={
                  fac.type === 'LIBRARY'
                    ? 'library-room'
                    : fac.type === 'LAB'
                      ? 'science-lab'
                      : fac.type === 'PLAYGROUND'
                        ? 'sports-day'
                        : 'digital-classroom'
                }
                className="h-36 rounded-none"
              />
              <div className="p-5 space-y-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-bold text-foreground">{fac.name}</h2>
                  <StatusBadge enumName="FacilityType" value={fac.type} />
                </div>
                <p className="text-base text-muted-foreground leading-relaxed">{fac.description}</p>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}

