'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from '@/src/lib/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Paperclip,
  Search,
  ExternalLink,
  Download,
  Eye,
} from 'lucide-react';
import { useGetBootstrapQuery } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatDateLong } from '@/src/lib/formatters';
import {
  EmptyState,
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
import { Button, Card, FormField, Input, Textarea } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { NoticeStatus } from '@/src/types/enums';
import type { Notice } from '@/src/types/entities';

export function PublicNoticesListPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [previewNotice, setPreviewNotice] = useState<Notice | null>(null);
  const search = searchParams.get('q') ?? '';
  const urgentOnly = searchParams.get('urgent') === '1';

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const list = db.notices
    .filter((n) => n.status === NoticeStatus.PUBLISHED)
    .filter((n) => (urgentOnly ? n.isUrgent : true))
    .filter(
      (n) =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.description.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader
        title={pick('প্রাতিষ্ঠানিক নোটিশ বোর্ড', 'Official Notice Board')}
        description={pick('বিদ্যালয়ের প্রকাশিত সকল সরকারি, পরীক্ষা, ভর্তি ও একাডেমিক বিজ্ঞপ্তি।', 'All published institutional, exam, admission, and academic circulars.')}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setParam('q', e.target.value || null)}
            placeholder={pick('নোটিশ খুঁজুন...', 'Search notices...')}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-surface-muted rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setParam('urgent', null)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors ${!urgentOnly ? 'bg-surface text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {pick('সকল বিজ্ঞপ্তি', 'All Notices')}
          </button>
          <button
            type="button"
            onClick={() => setParam('urgent', '1')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors ${urgentOnly ? 'bg-destructive text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {pick('শুধু জরুরি', 'Urgent Only')}
          </button>
        </div>
      </div>
      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {list.map((n) => {
            const d = new Date(n.publishedAt ?? n.createdAt);
            const day = new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-US').format(d.getDate());
            const month = new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-US', { month: 'short' }).format(d);
            const year = new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-US', { useGrouping: false }).format(d.getFullYear());
            return (
              <div
                key={n.id}
                className="group flex items-center gap-4 p-4 sm:px-5 hover:bg-surface-muted/40 transition-colors"
              >
                <div className="w-14 shrink-0 rounded-lg border border-border bg-surface text-center overflow-hidden tabular-nums">
                  <div
                    className={`text-xs font-semibold py-0.5 border-b leading-tight ${
                      n.isUrgent
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : 'bg-secondary/10 text-secondary border-secondary/15'
                    }`}
                  >
                    {month}
                  </div>
                  <div className="py-1">
                    <p className="text-base font-bold text-foreground leading-none">{day}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-none">{year}</p>
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  {(n.isUrgent || n.memoNo) && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground tabular-nums">
                      {n.isUrgent && (
                        <span className="px-2 py-0.5 rounded bg-destructive text-white text-xs font-semibold leading-none">
                          {pick('জরুরি', 'Urgent')}
                        </span>
                      )}
                      {n.memoNo && <span className="font-mono">{n.memoNo}</span>}
                    </div>
                  )}
                  <Link
                    href={`/notices/${n.id}`}
                    className="block text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug"
                  >
                    {n.title}
                  </Link>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewNotice(n)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{pick('প্রিভিউ', 'Preview')}</span>
                  </Button>
                  <button
                    type="button"
                    onClick={() => downloadNoticeDocument(n, db.schoolProfile, locale)}
                    aria-label={pick('ডাউনলোড', 'Download')}
                    title={pick('ডাউনলোড করুন', 'Download')}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:text-primary hover:border-primary/45 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <NoticeDocumentModal
        notice={previewNotice}
        school={db.schoolProfile}
        onClose={() => setPreviewNotice(null)}
      />
    </div>
  );
}

export function PublicNoticeDetailPage() {
  const { id } = useParams();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const notice = db.notices.find((n) => n.id === id && n.status === NoticeStatus.PUBLISHED);
  if (!notice) return <div className="max-w-[1440px] mx-auto p-6"><EmptyState /></div>;

  const recentOthers = db.notices
    .filter((n) => n.status === NoticeStatus.PUBLISHED && n.id !== notice.id)
    .slice(0, 4);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Link href="/notices" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> {pick('সকল নোটিশ আর্কাইভ', 'All Notices Archive')}
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted-foreground tabular-nums">
          {notice.memoNo && <span className="font-mono font-medium text-foreground">{notice.memoNo}</span>}
          <span>·</span>
          <span>{formatDateLong(notice.publishedAt ?? notice.createdAt, locale)}</span>
        </div>
      </div>

      <div className="space-y-2 no-print">
        {notice.isUrgent && (
          <span className="inline-block px-2.5 py-0.5 rounded bg-destructive text-white text-xs font-semibold">
            {pick('জরুরি বিজ্ঞপ্তি', 'Urgent Notice')}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug">{notice.title}</h1>
      </div>

      {/* Full Interactive Document Viewer (PDF / Scanned Image / Official A4 Circular) */}
      <NoticeDocumentViewer notice={notice} school={db.schoolProfile} />

      {/* Other Recent Notices */}
      {recentOthers.length > 0 && (
        <div className="pt-4 space-y-3 no-print">
          <h2 className="text-base font-bold text-foreground">
            {pick('অন্যান্য সাম্প্রতিক বিজ্ঞপ্তি', 'Other Recent Notices')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentOthers.map((item) => (
              <Link
                key={item.id}
                href={`/notices/${item.id}`}
                className="group p-4 rounded-xl bg-surface border border-border hover:border-primary/45 transition-colors flex items-start justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    {item.isUrgent && (
                      <span className="px-2 py-0.5 rounded bg-destructive text-white text-xs font-semibold leading-none">
                        {pick('জরুরি', 'Urgent')}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatDateLong(item.publishedAt ?? item.createdAt, locale)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary line-clamp-2">
                    {item.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PublicNewsListPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const sortedNews = [...db.news]
    .filter((n) => n.isPublished)
    .sort(
      (a, b) =>
        new Date(b.publishedAt ?? b.createdAt).getTime() -
        new Date(a.publishedAt ?? a.createdAt).getTime()
    );

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader
        title={pick('সংবাদ ও প্রতিবেদন', 'School News & Updates')}
        description={pick(
          'ভোজেশ্বর উচ্চ বিদ্যালয়ের ক্যাম্পাস কার্যক্রম, বিজ্ঞান মেলা, সহশিক্ষা ও সাম্প্রতিক সাফল্যের সংবাদ।',
          'Campus stories, science exhibitions, co-curricular programs, and student achievements.'
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sortedNews.map((item) => (
          <Link
            key={item.id}
            href={`/news/${item.id}`}
            className="group bg-surface border border-border rounded-xl overflow-hidden flex flex-col justify-between hover:border-primary/45 transition-all"
          >
            <div>
              <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
                <img
                  src={getNewsPhoto(item.image, item.id)}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5 space-y-2">
                <p className="text-sm text-muted-foreground tabular-nums">
                  {formatDateLong(item.publishedAt ?? item.createdAt, locale)}
                </p>
                <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                  {item.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {item.description}
                </p>
              </div>
            </div>
            <div className="px-5 pb-4 pt-3 border-t border-border/60 flex items-center justify-between text-sm font-semibold text-primary">
              <span>{pick('সম্পূর্ণ সংবাদ পড়ুন', 'Read Full Story')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PublicNewsDetailPage() {
  const { id } = useParams();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  if (isLoading) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;
  const item = db?.news.find((n) => n.id === id);
  if (!item || !db) return <div className="max-w-[1440px] mx-auto p-6"><EmptyState /></div>;

  const paragraphs = item.description
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const otherNews = db.news
    .filter((n) => n.isPublished && n.id !== item.id)
    .sort(
      (a, b) =>
        new Date(b.publishedAt ?? b.createdAt).getTime() -
        new Date(a.publishedAt ?? a.createdAt).getTime()
    )
    .slice(0, 4);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Link
        href="/news"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> {pick('সব সংবাদে ফিরুন', 'Back to All News')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <article className="lg:col-span-8 bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="relative aspect-[16/9] bg-surface-muted overflow-hidden">
            <img
              src={getNewsPhoto(item.image, item.id)}
              alt={item.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground tabular-nums">
              <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                <Calendar className="w-4 h-4" />
                {formatDateLong(item.publishedAt ?? item.createdAt, locale)}
              </span>
              <span aria-hidden="true">·</span>
              <span>{db.schoolProfile.name}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-snug">
              {item.title}
            </h1>

            <div className="space-y-4 pt-2 border-t border-border text-base text-foreground/90 leading-relaxed">
              {paragraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>
        </article>

        <aside className="lg:col-span-4 space-y-5">
          {otherNews.length > 0 && (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">
                  {pick('অন্যান্য সাম্প্রতিক সংবাদ', 'More Campus News')}
                </h2>
                <Link href="/news" className="text-sm font-semibold text-primary hover:underline">
                  {pick('সব দেখুন', 'View All')}
                </Link>
              </div>
              <div className="space-y-3.5">
                {otherNews.map((other) => (
                  <Link
                    key={other.id}
                    href={`/news/${other.id}`}
                    className="group flex items-start gap-3 pb-3.5 border-b border-border last:border-none last:pb-0"
                  >
                    <img
                      src={getNewsPhoto(other.image, other.id)}
                      alt={other.title}
                      referrerPolicy="no-referrer"
                      className="w-20 h-14 rounded-lg object-cover shrink-0 bg-surface-muted"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatDateLong(other.publishedAt ?? other.createdAt, locale)}
                      </p>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mt-0.5 leading-snug">
                        {other.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5 space-y-3">
            <h2 className="text-base font-bold text-foreground">
              {pick('দ্রুত সংযোগ', 'Quick Links')}
            </h2>
            <div className="space-y-2 text-sm">
              <Link
                href="/events"
                className="flex items-center justify-between py-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <span>{pick('আসন্ন অনুষ্ঠান ও ক্যালেন্ডার', 'Upcoming Events')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/notices"
                className="flex items-center justify-between py-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <span>{pick('প্রাতিষ্ঠানিক নোটিশ বোর্ড', 'Official Notice Board')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/gallery"
                className="flex items-center justify-between py-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <span>{pick('ছবি ও ক্যাম্পাস গ্যালারি', 'Campus Photo Gallery')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export function PublicEventsListPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const sortedEvents = [...db.events]
    .filter((e) => e.isPublished)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader
        title={pick('অনুষ্ঠান ও সহশিক্ষা কার্যক্রম', 'Events & Co-Curricular Activities')}
        description={pick(
          'তারিখ অনুযায়ী বিদ্যালয়ের আসন্ন জাতীয় দিবস, বিজ্ঞান মেলা, বার্ষিক ক্রীড়া ও সাংস্কৃতিক সূচি।',
          'Chronological schedule of upcoming school programs, sports, science fairs, and national observances.'
        )}
        actions={
          <Link href="/academics/academic-calendar">
            <Button variant="outline" size="sm">
              <Calendar className="w-3.5 h-3.5" />
              <span>{pick('একাডেমিক ক্যালেন্ডার', 'Academic Calendar')}</span>
            </Button>
          </Link>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sortedEvents.map((ev) => {
          const cat = db.eventCategories.find((c) => c.id === ev.categoryId);
          const isMultiDay = Boolean(ev.endDate && ev.endDate !== ev.startDate);
          return (
            <Link
              key={ev.id}
              href={`/events/${ev.id}`}
              className="group bg-surface border border-border rounded-xl overflow-hidden flex flex-col justify-between hover:border-primary/45 transition-all"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
                  <img
                    src={getNewsPhoto(ev.image, ev.id)}
                    alt={ev.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground tabular-nums inline-flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary shrink-0" />
                      <span>
                        {formatDateLong(ev.startDate, locale)}
                        {isMultiDay ? ` – ${formatDateLong(ev.endDate, locale)}` : ''}
                      </span>
                    </span>
                    {cat && <StatusBadge enumName="EventCategoryType" value={cat.type} />}
                  </div>
                  <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                    {ev.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {ev.description}
                  </p>
                </div>
              </div>
              <div className="px-5 pb-4 pt-3 border-t border-border/60 flex items-center justify-between text-sm font-semibold text-primary">
                <span>{pick('অনুষ্ঠানের বিবরণ দেখুন', 'View Event Details')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

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

export function PublicGalleryListPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader title={pick('ছবি ও ভিডিও গ্যালারি', 'Photo & Media Gallery')} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {db.galleries.filter((g) => g.isPublished).map((gal) => {
          const media = db.galleryMedia.filter((m) => m.galleryId === gal.id);
          return (
            <Link key={gal.id} href={`/gallery/${gal.id}`}>
              <Card className="overflow-hidden hover:border-primary/50 transition-colors">
                <InstitutionalArtwork
                  variant={media[0]?.mediaUrl ?? 'campus-heritage'}
                  title={gal.title}
                  subtitle={gal.category ?? ''}
                  className="h-48 rounded-none"
                />
                <div className="p-4 text-sm text-muted-foreground">{gal.description}</div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function PublicGalleryDetailPage() {
  const { id } = useParams();
  const { data: db } = useGetBootstrapQuery();
  const { pick } = useI18n();
  const gal = db?.galleries.find((g) => g.id === id);
  if (!gal || !db) return <div className="max-w-[1440px] mx-auto p-6"><EmptyState /></div>;
  const items = db.galleryMedia.filter((m) => m.galleryId === gal.id);
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Link href="/gallery" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> {pick('গ্যালারিতে ফিরুন', 'Back to Gallery')}
      </Link>
      <PageHeader title={gal.title} description={gal.description ?? undefined} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((m) => (
          <Card key={m.id} className="overflow-hidden">
            <InstitutionalArtwork variant={m.mediaUrl} title={m.caption ?? ''} className="h-60 rounded-none" />
          </Card>
        ))}
      </div>
    </div>
  );
}

export function PublicPublicationsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader title={pick('বিদ্যালয়ের প্রকাশনা ও ম্যাগাজিন', 'School Publications')} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {db.publications.filter((p) => p.isPublished).map((pub) => (
          <Card key={pub.id} className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <StatusBadge enumName="PublicationType" value={pub.type} />
              <span className="text-sm text-muted-foreground tabular-nums">{pub.publishYear}</span>
            </div>
            <h2 className="text-lg font-bold text-foreground">{pub.title}</h2>
            <p className="text-base text-muted-foreground leading-relaxed">{pub.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function PublicAchievementsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader
        title={pick('অর্জন ও কৃতী শিক্ষার্থী', 'Achievements & Alumni')}
        description={pick('প্রাতিষ্ঠানিক অর্জন ও সম্মতিপ্রাপ্ত কৃতী শিক্ষার্থীদের তালিকা।', 'Institutional milestones and consented student recognitions.')}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {db.achievements.filter((a) => a.isPublished).map((ach) => (
          <Card key={ach.id} className="p-6 space-y-2.5">
            <StatusBadge enumName="AchievementType" value={ach.type} />
            <h2 className="text-lg font-bold text-foreground">{ach.title}</h2>
            {ach.personName && (
              <p className="text-sm text-primary font-medium">
                {ach.personName} {ach.batch ? `· ${ach.batch}` : ''}
              </p>
            )}
            <p className="text-base text-muted-foreground leading-relaxed">{ach.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function PublicCareersListPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader title={pick('নিয়োগ বিজ্ঞপ্তি (Careers)', 'Careers & Recruitment')} />
      <div className="space-y-4">
        {db.careers.filter((c) => c.isPublished).map((car) => (
          <Link key={car.id} href={`/careers/${car.id}`} className="block">
            <Card className="p-6 hover:border-primary/50 transition-colors space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-foreground">{car.title}</h2>
                <span className="text-sm text-destructive font-semibold tabular-nums">
                  {pick('শেষ তারিখ:', 'Deadline:')} {formatDateLong(car.deadline, locale)}
                </span>
              </div>
              <p className="text-base text-muted-foreground line-clamp-2">{car.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PublicCareerDetailPage() {
  const { id } = useParams();
  const { data: db } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const car = db?.careers.find((c) => c.id === id);
  if (!car) return <div className="max-w-[1440px] mx-auto p-6"><EmptyState /></div>;
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Link href="/careers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> {pick('সকল বিজ্ঞপ্তি', 'All Careers')}
      </Link>
      <Card className="p-8 space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{car.title}</h1>
        <p className="text-sm text-destructive font-semibold tabular-nums">
          {pick('আবেদনের শেষ তারিখ:', 'Application Deadline:')} {formatDateLong(car.deadline, locale)}
        </p>
        <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-line">{car.description}</p>
      </Card>
    </div>
  );
}

export function PublicContactPage() {
  const { data: db } = useGetBootstrapQuery();
  const { pick } = useI18n();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !msg.trim()) {
      toast.error(pick('অনুগ্রহ করে নাম ও বার্তা লিখুন।', 'Please enter your name and message.'));
      return;
    }
    toast.success(
      pick(
        'আপনার বার্তা গ্রহণ করা হয়েছে। (দ্রষ্টব্য: ইনবক্স ব্যাকএন্ড সংযোজনের পর সংরক্ষিত হবে)',
        'Message recorded in preview mode (Backend contact inbox pending).'
      )
    );
    setName('');
    setPhone('');
    setMsg('');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <PageHeader title={pick('যোগাযোগ', 'Contact Us')} description={db?.contactInfo.address} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">{pick('বিদ্যালয় অফিস', 'School Office')}</h2>
          <p className="flex items-start gap-2.5 text-base text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-1" />
            <span>{db?.contactInfo.address}</span>
          </p>
          <p className="flex items-center gap-2.5 text-base text-muted-foreground tabular-nums">
            <Phone className="w-4 h-4 text-primary shrink-0" />
            <span>{db?.contactInfo.phone}</span>
          </p>
          <p className="flex items-center gap-2.5 text-base text-muted-foreground">
            <Mail className="w-4 h-4 text-primary shrink-0" />
            <span>{db?.contactInfo.email}</span>
          </p>
          <p className="text-sm text-muted-foreground pt-3 border-t border-border">
            {pick('অফিস সময়: রবিবার – বৃহস্পতিবার, সকাল ১০:০০ থেকে বিকাল ৪:০০ (শুক্রবার ও শনিবার সাপ্তাহিক ছুটি)।', 'Office Hours: Sunday – Thursday, 10:00 AM to 4:00 PM.')}
          </p>
          {db?.contactInfo.mapUrl && (
            <a
              href={db.contactInfo.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              {pick('গুগল ম্যাপে অবস্থান দেখুন', 'Open Location in Google Maps')}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </Card>

        <Card className="lg:col-span-7 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">{pick('বার্তা পাঠান', 'Send an Inquiry')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={pick('আপনার নাম', 'Your Name')} required>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>
              <FormField label={pick('মোবাইল নম্বর', 'Phone Number')}>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="017XXXXXXXX" />
              </FormField>
            </div>
            <FormField label={pick('আপনার বার্তা', 'Message')} required>
              <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} />
            </FormField>
            <Button type="submit" variant="primary">{pick('বার্তা পাঠান', 'Send Message')}</Button>
          </form>
        </Card>
      </div>

      {/* Interactive Google Maps Platform Campus Location */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {pick('গুগল ম্যাপে বিদ্যালয়ের অবস্থান', 'Campus Location on Google Maps')}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pick(
              'ভোজেশ্বর উচ্চ বিদ্যালয়, নড়িয়া, শরীয়তপুর — মানচিত্রে অবস্থান দেখুন ও দিকনির্দেশনা নিন।',
              'Explore campus location and get directions via Google Maps.'
            )}
          </p>
        </div>
        <SchoolCampusMap
          schoolName={db?.schoolProfile.name}
          address={db?.contactInfo.address}
          phone={db?.contactInfo.phone}
          fallbackMapUrl={db?.contactInfo.mapUrl}
          heightClassName="h-[340px] sm:h-[400px]"
        />
      </section>
    </div>
  );
}

export function LegalAndFaqPage({ mode }: { mode: 'privacy' | 'terms' | 'faq' }) {
  const { pick } = useI18n();

  if (mode === 'faq') {
    return <PublicFaqView />;
  }

  const title =
    mode === 'privacy'
      ? pick('গোপনীয়তা নীতি (Privacy Policy)', 'Privacy Policy')
      : pick('ব্যবহারের শর্তাবলি (Terms & Conditions)', 'Terms & Conditions');

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader title={title} />
      <Card className="p-6 sm:p-8 space-y-4 text-base leading-relaxed text-foreground/90">
        {mode === 'privacy' && (
          <>
            <p>ভোজেশ্বর উচ্চ বিদ্যালয় শিক্ষার্থী ও অভিভাবকদের ব্যক্তিগত তথ্যের গোপনীয়তা রক্ষায় প্রতিশ্রুতিবদ্ধ।</p>
            <p>শিক্ষার্থীর জন্ম সনদ নম্বর, জাতীয় পরিচয়পত্র (NID), বাসার ঠিকানা এবং অভিভাবকের মোবাইল নম্বর কখনোই পাবলিক ওয়েবসাইটে প্রদর্শন করা হয় না। শুধুমাত্র প্রকাশিত পরীক্ষার ফলাফল, শ্রেণি, রোল ও অর্জিত গ্রেড পাবলিক ফলাফল পৃষ্ঠায় দেখা যায়।</p>
            <p>
              ক্যাম্পাসের অবস্থান প্রদর্শনের জন্য এই ওয়েবসাইটে Google Maps Platform ব্যবহৃত হয়েছে, যা{' '}
              <a
                href="https://policies.google.com/privacy?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Privacy Policy
              </a>
              -এর আওতাভুক্ত।
            </p>
          </>
        )}
        {mode === 'terms' && (
          <>
            <p>এই ডিজিটাল প্ল্যাটফর্মটি ভোজেশ্বর উচ্চ বিদ্যালয়ের একাডেমিক ও প্রশাসনিক কার্যক্রম পরিচালনার জন্য নির্মিত।</p>
            <p>অননুমোদিত প্রবেশ, তথ্য বিকৃতি বা অপব্যবহার বিদ্যালয় ও প্রচলিত আইনের পরিপন্থী।</p>
            <p>
              এই অ্যাপ্লিকেশনের মানচিত্র সেবা Google Maps Platform দ্বারা পরিচালিত এবং ব্যবহারকারীরা{' '}
              <a
                href="https://maps.google.com/help/terms_maps/?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Maps/Google Earth Additional Terms of Service
              </a>{' '}
              ও{' '}
              <a
                href="https://policies.google.com/privacy?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Privacy Policy
              </a>
              -এর শর্তাবলির অধীন।
            </p>
          </>
        )}
      </Card>
    </div>
  );
}

export function NotFoundPage() {
  const { pick } = useI18n();
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <p className="text-4xl font-bold text-primary tabular-nums">404</p>
        <h1 className="text-xl font-bold text-foreground">{pick('পৃষ্ঠাটি পাওয়া যায়নি', 'Page Not Found')}</h1>
        <p className="text-base text-muted-foreground">
          {pick('আপনি যে ঠিকানাটি খুঁজছেন তা বিদ্যমান নয় অথবা স্থানান্তরিত হয়েছে।', 'The page you requested does not exist or has been moved.')}
        </p>
        <Link href="/" className="inline-block">
          <Button variant="primary">{pick('হোমপেজে ফিরে যান', 'Return Home')}</Button>
        </Link>
      </Card>
    </div>
  );
}
