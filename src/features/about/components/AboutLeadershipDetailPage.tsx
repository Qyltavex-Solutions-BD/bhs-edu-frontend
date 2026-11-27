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

export function AboutLeadershipDetailPage() {
  const { id } = useParams();
  const { data: db, isLoading } = useGetBootstrapQuery();
  if (isLoading || !db) {
    return (
      <div className="max-w-[1440px] mx-auto p-6">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  const published = db.leadershipMessages.filter((m) => m.isPublished);
  const msg = published.find((m) => m.id === id);

  if (!msg) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12 space-y-4">
        <Link href="/about/leadership" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>{'সকল বাণীতে ফিরে যান'}</span>
        </Link>
        <EmptyState />
      </div>
    );
  }

  const portrait = getLeadershipPortrait(msg.photo, msg.type);
  const isPrincipal = msg.type === 'PRINCIPAL';
  const roleTitle = isPrincipal
    ? 'প্রধান শিক্ষকের বাণী'
    : 'সভাপতির বাণী';
  const paragraphs = msg.message
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);
  const otherLeaders = published.filter((item) => item.id !== msg.id);
  const activeTeachersCount = db.staff.filter(
    (s) => s.staffType === StaffType.TEACHER && s.status === StaffStatus.ACTIVE
  ).length;
  const yearsSinceEst = 2026 - (db.schoolProfile.establishedYear ?? 1978);

  const campusShowcase = [
    {
      photo: getCampusPhoto('campus-heritage'),
      captionBn: 'ঐতিহ্যবাহী মূল ক্যাম্পাস প্রাঙ্গণ (স্থাপিত ১৯৭৮)',
      captionEn: 'Heritage campus courtyard (Est. 1978)',
    },
    {
      photo: getCampusPhoto('digital-classroom'),
      captionBn: 'মাল্টিমিডিয়া স্মার্ট শ্রেণিকক্ষ ও পাঠদান',
      captionEn: 'Multimedia smart classroom session',
    },
    {
      photo: getCampusPhoto('science-lab'),
      captionBn: 'আধুনিক বিজ্ঞান ও আইসিটি গবেষণাগার',
      captionEn: 'Science & ICT practical laboratory',
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* Top Breadcrumb & Print Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            {'হোম'}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/about/leadership" className="hover:text-primary transition-colors">
            {'নেতৃত্বের বাণী'}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground font-medium">{roleTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/about/leadership"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{'সব বাণী'}</span>
          </Link>
          <span className="text-border" aria-hidden="true">|</span>
          <button
            type="button"
            onClick={triggerPrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-sm font-medium text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{'প্রিন্ট করুন'}</span>
          </button>
        </div>
      </div>

      {/* Editorial Leader Profile Header (Full Portrait + Identity + School Motto) */}
      <section className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Full Clear Editorial Portrait */}
          <div className="lg:col-span-4 relative bg-surface-muted min-h-[320px] sm:min-h-[380px] lg:min-h-[420px]">
            <img
              src={portrait}
              alt={msg.personName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
          </div>

          {/* Editorial Intro & Institutional Identity */}
          <div className="lg:col-span-8 p-6 sm:p-9 lg:p-10 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-medium text-muted-foreground tabular-nums">
                <span className="font-semibold text-primary">{roleTitle}</span>
                <span aria-hidden="true">·</span>
                <span>{db.schoolProfile.name}</span>
                <span aria-hidden="true">·</span>
                <span>EIIN: {db.schoolProfile.eiin ?? '113587'}</span>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight text-balance">
                  {msg.personName}
                </h1>
                <p className="text-base font-medium text-primary">
                  {msg.designation}
                </p>
              </div>

              {/* Clean Pull-Quote Highlight separated by subtle hairlines */}
              <div className="py-4 my-2 border-y border-border/80">
                <p className="text-base sm:text-lg font-medium text-foreground/95 leading-relaxed">
                  “{db.schoolProfile.motto ?? 'শিক্ষাই আলো, জ্ঞানই শক্তি'}” —{' '}
                  <span className="text-muted-foreground font-normal text-base">
                    {isPrincipal
                      ? 'মানসম্মত মাধ্যমিক শিক্ষা, বিজ্ঞানমনস্ক চর্চা ও নৈতিক মূল্যবোধের সমন্বয়ে আগামীর আলোকিত প্রজন্ম গড়ে তোলাই আমাদের অঙ্গীকার।'
                      : 'সুশৃঙ্খল, নিরাপদ ও আধুনিক শিক্ষার পরিবেশ নিশ্চিত করে ভোজেশ্বর উচ্চ বিদ্যালয়কে জেলার আদর্শ প্রতিষ্ঠানে রূপান্তরিত করাই আমাদের লক্ষ্য।'}
                  </span>
                </p>
              </div>
            </div>

            {/* Quiet Institutional Metadata Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm tabular-nums">
              <div>
                <p className="text-sm text-muted-foreground">{'প্রতিষ্ঠান স্থাপিত'}</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {formatNumber(db.schoolProfile.establishedYear ?? 1978, 'bn')} {'খ্রি.'} ({formatNumber(yearsSinceEst, 'bn')}+ {'বছর'})
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{'অবস্থান'}</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {'ভোজেশ্বর, নড়িয়া, শরীয়তপুর'}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-sm text-muted-foreground">{'শিক্ষা স্তর'}</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {'৬ষ্ঠ–১০ম শ্রেণি (৩ বিভাগ)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Asymmetric Editorial Reading Body + Institutional Context Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Cols: Complete Individual Message + Signature + Campus Visual Gallery */}
        <div className="lg:col-span-8 space-y-8">
          <article className="bg-surface border border-border rounded-2xl p-6 sm:p-9 space-y-6">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <SchoolEmblem size={42} />
                <div>
                  <h2 className="text-lg font-bold text-foreground">{roleTitle}</h2>
                  <p className="text-sm text-muted-foreground">
                    {db.schoolProfile.name} · {'ভোজেশ্বর, নড়িয়া, শরীয়তপুর'}
                  </p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground tabular-nums hidden sm:inline">
                {formatDateLong(msg.updatedAt, 'bn')}
              </span>
            </div>

            {/* Individual Full Message Paragraphs */}
            <div className="space-y-4 text-base text-foreground/90 leading-[1.85] max-w-[68ch]">
              {paragraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            {/* Dignified Institutional Sign-Off */}
            <div className="pt-6 mt-6 border-t border-border flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{'শুভেচ্ছান্তে,'}</p>
                <svg
                  viewBox="0 0 160 40"
                  className="w-28 h-7 text-secondary/80 my-1"
                  aria-hidden="true"
                >
                  <path
                    d="M12 28 C25 10, 38 11, 44 24 C49 34, 60 15, 72 17 C82 19, 80 28, 92 23 C106 18, 120 13, 134 21 C141 24, 148 19, 152 17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-base font-bold text-foreground">{msg.personName}</p>
                <p className="text-sm text-muted-foreground">{msg.designation}</p>
                <p className="text-sm text-muted-foreground">{db.schoolProfile.name}</p>
              </div>

              <div className="flex flex-wrap gap-2 no-print">
                <Link href="/admission">
                  <Button variant="primary" size="sm">
                    {'ভর্তি তথ্য দেখুন'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" size="sm">
                    {'যোগাযোগ করুন'}
                  </Button>
                </Link>
              </div>
            </div>
          </article>

          {/* Campus Visuals Showcase (Living Context of the Institution) */}
          <div className="space-y-4 no-print">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {'আমাদের ক্যাম্পাস ও শিক্ষার পরিবেশ'}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {'ঐতিহ্যবাহী একাডেমিক ভবন, স্মার্ট শ্রেণিকক্ষ ও আধুনিক গবেষণাগার।'}
                </p>
              </div>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline whitespace-nowrap"
              >
                <span>{'ফটো গ্যালারি'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {campusShowcase.map((item, i) => (
                <figure
                  key={i}
                  className="bg-surface border border-border rounded-xl overflow-hidden"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-surface-muted">
                    <img
                      src={item.photo.src}
                      alt={item.captionBn}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <figcaption className="px-3.5 py-2.5 text-sm text-muted-foreground leading-snug">
                    {item.captionBn}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Institutional Context, Mission/Vision, Contact & Other Leadership */}
        <aside className="lg:col-span-4 space-y-5 no-print">
          {/* School Snapshot Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <SchoolEmblem size={46} />
              <div className="min-w-0">
                <h3 className="text-base font-bold text-foreground truncate">
                  {db.schoolProfile.name}
                </h3>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {'স্থাপিত ১৯৭৮ · EIIN ১১৩৫৮৭'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border text-sm tabular-nums">
              <div className="p-3 rounded-lg bg-surface-muted/60">
                <p className="text-xl font-bold text-primary">{formatNumber(yearsSinceEst, 'bn')}+</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {'বছরের ঐতিহ্য'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-surface-muted/60">
                <p className="text-xl font-bold text-primary">{formatNumber(activeTeachersCount, 'bn')}+</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {'অভিজ্ঞ শিক্ষক'}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{db.schoolProfile.address}</span>
              </p>
              {db.contactInfo.phone && (
                <a
                  href={`tel:${db.contactInfo.phone}`}
                  className="flex items-center gap-2 hover:text-primary transition-colors tabular-nums"
                >
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span>{db.contactInfo.phone}</span>
                </a>
              )}
              {db.contactInfo.email && (
                <a
                  href={`mailto:${db.contactInfo.email}`}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{db.contactInfo.email}</span>
                </a>
              )}
            </div>
          </Card>

          {/* Mission & Vision Summary Card */}
          <Card className="p-5 space-y-3.5">
            <h3 className="text-base font-bold text-foreground">
              {'লক্ষ্য ও দৃষ্টিভঙ্গি'}
            </h3>
            <div className="space-y-2.5 text-sm leading-relaxed">
              <div>
                <p className="font-semibold text-primary mb-0.5">{'আমাদের লক্ষ্য'}</p>
                <p className="text-muted-foreground">{db.schoolProfile.mission}</p>
              </div>
              <div className="pt-2.5 border-t border-border">
                <p className="font-semibold text-primary mb-0.5">{'আমাদের দৃষ্টিভঙ্গি'}</p>
                <p className="text-muted-foreground">{db.schoolProfile.vision}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-border flex flex-wrap gap-3 text-sm font-semibold text-primary">
              <Link href="/about/history" className="hover:underline inline-flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                <span>{'ইতিহাস'}</span>
              </Link>
              <Link href="/about/teachers" className="hover:underline inline-flex items-center gap-1">
                <GraduationCap className="w-4 h-4" />
                <span>{'শিক্ষকমণ্ডলী'}</span>
              </Link>
              <Link href="/academics/academic-calendar" className="hover:underline inline-flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{'ক্যালেন্ডার'}</span>
              </Link>
            </div>
          </Card>

          {/* Other Leadership Message Navigation */}
          {otherLeaders.length > 0 && (
            <Card className="p-5 space-y-3.5">
              <h3 className="text-base font-bold text-foreground">
                {'অন্যান্য নেতৃত্বের বাণী'}
              </h3>
              <div className="space-y-3">
                {otherLeaders.map((other) => (
                  <Link
                    key={other.id}
                    href={`/about/leadership/${other.id}`}
                    className="group flex items-center gap-3 p-2.5 -mx-2.5 rounded-xl hover:bg-surface-muted/70 transition-colors"
                  >
                    <img
                      src={getLeadershipPortrait(other.photo, other.type)}
                      alt={other.personName}
                      referrerPolicy="no-referrer"
                      className="w-14 h-16 rounded-lg object-cover object-top border border-border shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-sm font-semibold text-primary">
                        {other.type === 'PRINCIPAL'
                          ? 'প্রধান শিক্ষকের বাণী'
                          : 'সভাপতির বাণী'}
                      </p>
                      <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {other.personName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{other.designation}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

