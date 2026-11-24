'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from '@/src/lib/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Mail,
  Paperclip,
  Printer,
  Search,
  ExternalLink,
  Download,
  Eye,
  FileText,
  Film,
  GraduationCap,
  Maximize2,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { MasonryPhotoAlbum } from 'react-photo-album';

import { useGetBootstrapQuery } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatDateLong, formatDateShort, formatNumber } from '@/src/lib/formatters';
import {
  EmptyState,
  getCampusPhoto,
  getNewsPhoto,
  InstitutionalArtwork,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { SchoolCampusMap } from '@/src/components/shared/SchoolCampusMap';
import { PublicFaqView } from '@/src/components/public/PublicFaqView';
import {
  NoticeDocumentModal,
  NoticeDocumentViewer,
  downloadNoticeDocument,
} from '@/src/components/shared/NoticeDocumentViewer';
import { ChromePdfViewer } from '@/src/components/shared/ChromePdfViewer';
import { Button, Card, FormField, Input, Select, Textarea } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { AchievementType, MediaType, NoticeStatus, PublicationType } from '@/src/types/enums';
import type { Achievement, Notice } from '@/src/types/entities';
import { cn } from '@/src/lib/utils/cn';

type NoticeTab = 'all' | 'urgent' | 'exam' | 'admission';

export function PublicEventDetailPage() {
  const { id } = useParams();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  if (isLoading) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;
  const ev = db?.events.find((e) => e.id === id);
  if (!ev || !db) return <div className="max-w-[1440px] mx-auto p-6"><EmptyState /></div>;

  const cat = db.eventCategories.find((c) => c.id === ev.categoryId);
  const isMultiDay = Boolean(ev.endDate && ev.endDate !== ev.startDate);
  const paragraphs = (ev.description ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const otherEvents = [...db.events]
    .filter((e) => e.isPublished && e.id !== ev.id)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> {pick('সব অনুষ্ঠানে ফিরুন', 'Back to All Events')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <article className="lg:col-span-8 bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="relative aspect-[16/9] bg-surface-muted overflow-hidden">
            <img
              src={getNewsPhoto(ev.image, ev.id)}
              alt={ev.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              {cat && <StatusBadge enumName="EventCategoryType" value={cat.type} />}
              <span className="text-sm text-muted-foreground tabular-nums inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                {formatDateLong(ev.startDate, locale)}
                {isMultiDay ? ` – ${formatDateLong(ev.endDate, locale)}` : ''}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-snug">
              {ev.title}
            </h1>

            <div className="space-y-4 pt-2 border-t border-border text-base text-foreground/90 leading-relaxed">
              {paragraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>
        </article>

        <aside className="lg:col-span-4 space-y-5">
          <Card className="p-5 space-y-3.5">
            <h2 className="text-base font-bold text-foreground">
              {pick('অনুষ্ঠানের তথ্য', 'Event Schedule & Venue')}
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <dt className="font-semibold text-foreground">{pick('তারিখ', 'Date')}</dt>
                  <dd className="text-muted-foreground tabular-nums mt-0.5">
                    {formatDateLong(ev.startDate, locale)}
                    {isMultiDay ? ` – ${formatDateLong(ev.endDate, locale)}` : ''}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <dt className="font-semibold text-foreground">{pick('স্থান', 'Venue')}</dt>
                  <dd className="text-muted-foreground mt-0.5">
                    {pick('ভোজেশ্বর উচ্চ বিদ্যালয় প্রাঙ্গণ, নড়িয়া, শরীয়তপুর', db.contactInfo.address)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <dt className="font-semibold text-foreground">{pick('যোগাযোগ', 'Inquiries')}</dt>
                  <dd className="text-muted-foreground tabular-nums mt-0.5">
                    {db.contactInfo.phone}
                  </dd>
                </div>
              </div>
            </dl>
            <Link href="/academics/academic-calendar" className="block pt-2 border-t border-border">
              <Button variant="outline" size="sm" className="w-full">
                <span>{pick('পূর্ণ একাডেমিক ক্যালেন্ডার দেখুন', 'View Academic Calendar')}</span>
              </Button>
            </Link>
          </Card>

          {otherEvents.length > 0 && (
            <Card className="p-5 space-y-3.5">
              <h2 className="text-base font-bold text-foreground">
                {pick('অন্যান্য আসন্ন অনুষ্ঠান', 'Other Upcoming Events')}
              </h2>
              <div className="space-y-3">
                {otherEvents.map((other) => (
                  <Link
                    key={other.id}
                    href={`/events/${other.id}`}
                    className="group block pb-3 border-b border-border last:border-none last:pb-0"
                  >
                    <p className="text-xs text-primary font-semibold tabular-nums">
                      {formatDateLong(other.startDate, locale)}
                    </p>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors mt-0.5 leading-snug">
                      {other.title}
                    </p>
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

