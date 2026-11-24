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

export function AboutCommitteePage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const members = db.managingCommittee;
  const executiveMembers = members.slice(0, 2);
  const generalMembers = members.slice(2);
  const chairmanMsg = db.leadershipMessages.find((m) => m.isPublished && m.type === 'CHAIRMAN');
  const principalMsg = db.leadershipMessages.find((m) => m.isPublished && m.type === 'PRINCIPAL');

  const getExecutiveLink = (memberId: string, idx: number) => {
    if (memberId === 'mc-1' || idx === 0) {
      return chairmanMsg
        ? { to: `/about/leadership/${chairmanMsg.id}`, label: pick('সভাপতির বাণী পড়ুন', "Read Chairman's Message") }
        : null;
    }
    if (memberId === 'mc-2' || idx === 1) {
      return principalMsg
        ? { to: `/about/leadership/${principalMsg.id}`, label: pick('প্রধান শিক্ষকের বাণী পড়ুন', "Read Headteacher's Message") }
        : null;
    }
    return null;
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-10">
      <PageHeader
        title={pick('বিদ্যালয় ম্যানেজিং কমিটি', 'Managing Committee')}
        description={pick(
          'ভোজেশ্বর উচ্চ বিদ্যালয় পরিচালনা পর্ষদ · প্রতিষ্ঠানের সুশাসন, একাডেমিক মানোন্নয়ন ও অবকাঠামোগত অগ্রযাত্রায় নিবেদিতপ্রাণ কার্যনির্বাহী পরিষদ।',
          'Governing body of Bhojeshwar High School overseeing institutional governance, academic quality, and campus development.'
        )}
        actions={
          <>
            <Link href="/about/leadership">
              <Button variant="outline" size="sm">
                {pick('নেতৃত্বের বাণী', 'Leadership Messages')}
              </Button>
            </Link>
            <Link href="/about/teachers">
              <Button variant="outline" size="sm">
                {pick('শিক্ষকমণ্ডলী', 'Faculty Directory')}
              </Button>
            </Link>
          </>
        }
      />

      {/* Executive Leadership Tier: Chairman & Member Secretary */}
      {executiveMembers.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              {pick('পরিচালনা পর্ষদের প্রধান নেতৃত্ব', 'Executive Leadership')}
            </h2>
            <p className="text-sm text-muted-foreground tabular-nums">
              {pick('কার্যনির্বাহী সদস্য:', 'Total Members:')} {formatNumber(members.length, locale)}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {executiveMembers.map((member, idx) => {
              const portraitSrc = getCommitteePortrait(member.photo, member.id, member.designation);
              const execLink = getExecutiveLink(member.id, idx);
              const roleKicker =
                idx === 0
                  ? pick('সভাপতি · পরিচালনা পর্ষদ', 'Chairman · Governing Body')
                  : pick('সদস্য সচিব · প্রধান শিক্ষক', 'Member Secretary · Headteacher');
              return (
                <article
                  key={member.id}
                  className="group bg-surface border border-border rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 items-stretch hover:border-primary/45 transition-colors"
                >
                  <div className="sm:col-span-5 relative aspect-[4/4.2] sm:aspect-auto sm:min-h-[290px] overflow-hidden bg-surface-muted">
                    <img
                      src={portraitSrc}
                      alt={member.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 via-black/15 to-transparent sm:hidden pointer-events-none" />
                  </div>

                  <div className="sm:col-span-7 p-6 flex flex-col justify-between gap-5">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-primary">
                        {roleKicker}
                      </p>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-foreground leading-snug">
                          {member.name}
                        </h3>
                        <p className="text-sm font-medium text-muted-foreground">
                          {member.designation}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border/80 space-y-2 text-sm text-muted-foreground tabular-nums">
                        {(member.startDate || member.endDate) && (
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary shrink-0" />
                            <span>
                              {pick('মেয়াদ:', 'Term:')} {formatDateLong(member.startDate, locale)} – {formatDateLong(member.endDate, locale)}
                            </span>
                          </p>
                        )}
                        {member.phone && (
                          <a
                            href={`tel:${member.phone}`}
                            className="flex items-center gap-2 hover:text-primary transition-colors"
                          >
                            <Phone className="w-4 h-4 text-primary shrink-0" />
                            <span>{member.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {execLink && (
                      <div className="pt-3 border-t border-border/80">
                        <Link
                          href={execLink.to}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                        >
                          <span>{execLink.label}</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* General Governing Body Members — Full Editorial Portrait Cards */}
      {generalMembers.length > 0 && (
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              {pick('সম্মানিত সদস্যবৃন্দ', 'Committee Members')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {pick(
                'শিক্ষানুরাগী ও নির্বাচিত অভিভাবক প্রতিনিধি সদস্যবৃন্দ।',
                'Education patrons and elected guardian representatives.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {generalMembers.map((member) => {
              const portraitSrc = getCommitteePortrait(member.photo, member.id, member.designation);
              return (
                <article
                  key={member.id}
                  className="group bg-surface border border-border rounded-2xl overflow-hidden flex flex-col justify-between hover:border-primary/45 transition-colors"
                >
                  <div>
                    <div className="relative aspect-[4/4.2] w-full overflow-hidden bg-surface-muted">
                      <img
                        src={portraitSrc}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none" />
                      <span className="absolute bottom-3 left-4 right-4 text-sm font-semibold text-white/95 leading-snug">
                        {member.designation}
                      </span>
                    </div>

                    <div className="p-5 space-y-2">
                      <h3 className="text-lg font-bold text-foreground leading-snug">
                        {member.name}
                      </h3>
                      <p className="text-sm font-medium text-primary">
                        {member.designation}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-border/80 space-y-1.5 text-sm text-muted-foreground tabular-nums">
                    {(member.startDate || member.endDate) && (
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                        <span>
                          {formatDateLong(member.startDate, locale)} – {formatDateLong(member.endDate, locale)}
                        </span>
                      </p>
                    )}
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <Phone className="w-4 h-4 text-primary shrink-0" />
                        <span>{member.phone}</span>
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Quiet Institutional Governance Footer Strip */}
      <Card className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            {pick('পরিচালনা পর্ষদ ও বিদ্যালয় প্রশাসনের সাথে যোগাযোগ', 'Contact Governing Body & School Office')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {pick(
              'বিদ্যালয়ের নীতিগত বিষয়, অবকাঠামো উন্নয়ন অথবা অভিভাবক পরামর্শের জন্য প্রধান শিক্ষকের কার্যালয়ে যোগাযোগ করুন।',
              'For governance inquiries, campus development proposals, or guardian consultations, please contact the school office.'
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link href="/contact">
            <Button variant="primary" size="sm">
              {pick('যোগাযোগ করুন', 'Contact Office')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="outline" size="sm">
              {pick('বিদ্যালয় পরিচিতি', 'About School')}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

