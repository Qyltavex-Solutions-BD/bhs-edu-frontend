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
import 'react-photo-album/masonry.css';
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

export function PublicNoticesListPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [searchParams] = useSearchParams();

  const [noticeTab, setNoticeTab] = useState<NoticeTab>(
    searchParams.get('urgent') === '1' ? 'urgent' : 'all'
  );
  const [noticeQuery, setNoticeQuery] = useState(searchParams.get('q') ?? '');
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;

  const noticeTabs: { key: NoticeTab; labelBn: string; labelEn: string }[] = [
    { key: 'all', labelBn: 'সব বিজ্ঞপ্তি', labelEn: 'All Notices' },
    { key: 'urgent', labelBn: 'জরুরি', labelEn: 'Urgent' },
    { key: 'exam', labelBn: 'পরীক্ষা ও ফলাফল', labelEn: 'Exams & Results' },
    { key: 'admission', labelBn: 'ভর্তি ও একাডেমিক', labelEn: 'Admission' },
  ];

  if (isLoading || !db) {
    return (
      <div className="max-w-[1440px] mx-auto p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  const allPublished = (db.notices ?? []).filter((n) => n.status === NoticeStatus.PUBLISHED);

  const filteredNotices = allPublished.filter((n) => {
    const text = `${n.memoNo ?? ''} ${n.title} ${n.description}`.toLowerCase();
    if (noticeQuery.trim() && !text.includes(noticeQuery.trim().toLowerCase())) {
      return false;
    }
    if (noticeTab === 'urgent') return n.isUrgent;
    if (noticeTab === 'exam') {
      return (
        text.includes('পরীক্ষা') ||
        text.includes('routine') ||
        text.includes('exam') ||
        text.includes('ফলাফল') ||
        text.includes('প্রবেশপত্র') ||
        text.includes('নম্বরপত্র')
      );
    }
    if (noticeTab === 'admission') {
      return (
        text.includes('ভর্তি') ||
        text.includes('admission') ||
        text.includes('একাডেমিক') ||
        text.includes('ক্যালেন্ডার') ||
        text.includes('ক্লাস')
      );
    }
    return true;
  });

  const totalFiltered = filteredNotices.length;
  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const startIndex = safePageIndex * pageSize;
  const pagedRows = filteredNotices.slice(startIndex, startIndex + pageSize);

  // Pagination page numbers (same format with ellipsis support)
  const getPageNumbers = () => {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (safePageIndex + 1 <= 4) {
      for (let i = 1; i <= Math.min(5, pageCount); i++) pages.push(i);
      if (pageCount > 5) {
        pages.push('...');
        pages.push(pageCount);
      }
    } else if (safePageIndex + 1 >= pageCount - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = pageCount - 4; i <= pageCount; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(safePageIndex);
      pages.push(safePageIndex + 1);
      pages.push(safePageIndex + 2);
      pages.push('...');
      pages.push(pageCount);
    }
    return pages;
  };

  const paginationSummary = pick(
    `মোট ${formatNumber(totalFiltered, 'bn')} টি তথ্য · পৃষ্ঠা ${formatNumber(safePageIndex + 1, 'bn')} / ${formatNumber(pageCount, 'bn')}`,
    `Showing ${totalFiltered} records · Page ${safePageIndex + 1} of ${pageCount}`
  );

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* 1. Header with Valid Institutional Data & Stats */}
      <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>{pick('অফিসিয়াল সার্কুলার পোর্টাল', 'Official Circular Portal')}</span>
              <span className="text-muted-foreground/50">·</span>
              <span>{pick(`EIIN: ${db.schoolProfile?.eiin || '১১১৮৬৯'}`, `EIIN: ${db.schoolProfile?.eiin || '111869'}`)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <FileText className="w-7 h-7 text-[#0c5936] dark:text-emerald-500 shrink-0" />
              <span>{pick('প্রাতিষ্ঠানিক নোটিশ বোর্ড', 'Institutional Notice Board')}</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-3xl leading-relaxed">
              {pick(
                'ভোজেশ্বর উচ্চ বিদ্যালয়ের সকল প্রাতিষ্ঠানিক আদেশ, পরীক্ষা, ফলাফল, ভর্তি ও শিক্ষা বোর্ডের জরুরি বিজ্ঞপ্তি সমূহ।',
                'Official circulars, exam schedules, results, admissions, and educational board notices for Bhojeshwar High School.'
              )}
            </p>
          </div>

          {/* Valid Institutional Stats */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-lg bg-surface-muted/60 border border-border text-center min-w-[100px]">
              <span className="block text-xs text-muted-foreground font-medium">
                {pick('মোট বিজ্ঞপ্তি', 'Total Notices')}
              </span>
              <span className="text-lg font-bold text-[#0c5936] dark:text-emerald-400 tabular-nums">
                {formatNumber(allPublished.length, locale)}
              </span>
            </div>
            <div className="px-4 py-2.5 rounded-lg bg-surface-muted/60 border border-border text-center min-w-[100px]">
              <span className="block text-xs text-muted-foreground font-medium">
                {pick('জরুরি বিজ্ঞপ্তি', 'Urgent Notices')}
              </span>
              <span className="text-lg font-bold text-destructive tabular-nums">
                {formatNumber(allPublished.filter((n) => n.isUrgent).length, locale)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Card containing Search/Filter Strip, Table & Pagination */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
        {/* Search & Filtering Strip (Same format as HomePage) */}
        <div className="px-5 sm:px-6 py-3 bg-surface-muted/30 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {noticeTabs.map((tab) => {
              const active = noticeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setNoticeTab(tab.key);
                    setPageIndex(0);
                  }}
                  className={cn(
                    'px-3 py-1.5 text-base font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap',
                    active
                      ? 'bg-[#0c5936] text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                  )}
                >
                  {locale === 'bn' ? tab.labelBn : tab.labelEn}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={noticeQuery}
              onChange={(e) => {
                setNoticeQuery(e.target.value);
                setPageIndex(0);
              }}
              placeholder={pick('স্মারক বা বিষয় খুঁজুন...', 'Search memo or title...')}
              className="w-full h-9 pl-9 pr-3 text-base bg-surface border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* 3. Notice Table (4 columns: নং, শিরোনাম, প্রকাশের তারিখ, কার্যকলাপ) with base 16px font */}
        <div className="overflow-x-auto">
          <table className="w-full text-base border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-muted/50 text-foreground font-bold text-base">
                <th className="py-3 px-4 text-center border-r border-border w-16 shrink-0">
                  {pick('নং', 'SL')}
                </th>
                <th className="py-3 px-5 text-left border-r border-border">
                  {pick('শিরোনাম', 'Title')}
                </th>
                <th className="py-3 px-4 text-center border-r border-border w-36 sm:w-44 shrink-0">
                  {pick('প্রকাশের তারিখ', 'Publish Date')}
                </th>
                <th className="py-3 px-4 text-center w-36 shrink-0">
                  {pick('কার্যকলাপ', 'Action')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-base text-muted-foreground">
                    {pick('এই বিভাগে কোনো বিজ্ঞপ্তি পাওয়া যায়নি।', 'No notices found in this category.')}
                  </td>
                </tr>
              ) : (
                pagedRows.map((n, idx) => {
                  const serial = startIndex + idx + 1;
                  const pubDate = new Date(n.publishedAt ?? n.createdAt);
                  const isRecent = Date.now() - pubDate.getTime() < 14 * 24 * 60 * 60 * 1000;
                  const showNewBadge = n.isUrgent || isRecent;
                  const day = String(pubDate.getDate()).padStart(2, '0');
                  const month = String(pubDate.getMonth() + 1).padStart(2, '0');
                  const year = pubDate.getFullYear();
                  const rawDate = `${day}-${month}-${year}`;
                  const formattedDate = locale === 'bn' ? formatNumber(rawDate, 'bn') : rawDate;

                  return (
                    <tr
                      key={n.id}
                      className="hover:bg-emerald-50/30 dark:hover:bg-emerald-950/15 transition-colors"
                    >
                      {/* নং */}
                      <td className="py-4 px-3 text-center border-r border-border tabular-nums font-medium text-base text-foreground">
                        {formatNumber(serial, locale)}
                      </td>

                      {/* শিরোনাম */}
                      <td className="py-4 px-5 border-r border-border">
                        <div className="space-y-1.5">
                          <Link
                            href={`/notices/${n.id}`}
                            className="text-base font-medium text-foreground hover:text-[#0c5936] dark:hover:text-emerald-400 hover:underline leading-relaxed block transition-colors"
                          >
                            {n.title}
                          </Link>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {showNewBadge && (
                              <span className="px-2 py-0.5 rounded-sm bg-[#D32F2F] text-white text-[12px] font-bold leading-none">
                                {pick('নতুন', 'New')}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-sm bg-surface-muted border border-border text-[12px] font-medium text-foreground">
                              {n.isUrgent ? pick('জরুরি', 'Urgent') : pick('সাধারণ', 'General')}
                            </span>
                            {n.memoNo && (
                              <span className="text-[12px] text-muted-foreground font-mono">
                                {n.memoNo}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* প্রকাশের তারিখ */}
                      <td className="py-4 px-4 text-center border-r border-border tabular-nums whitespace-nowrap text-base text-foreground">
                        {formattedDate}
                      </td>

                      {/* কার্যকলাপ */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/notices/${n.id}`}
                            className="text-base font-semibold text-[#1a56db] dark:text-blue-400 hover:text-[#0c5936] dark:hover:text-emerald-400 hover:underline transition-colors"
                          >
                            {pick('দেখুন', 'View')}
                          </Link>
                          <span className="text-muted-foreground/40">|</span>
                          <button
                            type="button"
                            onClick={() => downloadNoticeDocument(n, db.schoolProfile, locale, false)}
                            title={pick('ডাউনলোড করুন', 'Download')}
                            className="text-base font-semibold text-[#0c5936] dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">{pick('ডাউনলোড', 'Download')}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Admin-Format Pagination */}
        <div className="p-4 bg-surface-muted/20 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-base text-muted-foreground">
          <span className="tabular-nums font-medium">{paginationSummary}</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={safePageIndex <= 0}
              className="cursor-pointer text-base"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{locale === 'bn' ? 'পূর্ববর্তী' : 'Prev'}</span>
            </Button>

            {/* Page number buttons */}
            {getPageNumbers().map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ell-${idx}`} className="px-2 text-muted-foreground select-none">
                    ...
                  </span>
                );
              }
              const pageNum = p as number;
              const isActive = pageNum === safePageIndex + 1;
              return (
                <Button
                  key={pageNum}
                  variant={isActive ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setPageIndex(pageNum - 1)}
                  className="min-w-[36px] px-2 tabular-nums cursor-pointer text-base"
                >
                  {formatNumber(pageNum, locale)}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePageIndex >= pageCount - 1}
              className="cursor-pointer text-base"
            >
              <span>{locale === 'bn' ? 'পরবর্তী' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
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

  const updatedDate = new Date(notice.updatedAt ?? notice.publishedAt ?? notice.createdAt);
  const dayName = new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'long' }).format(updatedDate);
  const dateFormatted = formatDateLong(notice.publishedAt ?? notice.createdAt, locale);

  const pubDate = new Date(notice.publishedAt ?? notice.createdAt);
  const day = String(pubDate.getDate()).padStart(2, '0');
  const month = String(pubDate.getMonth() + 1).padStart(2, '0');
  const year = pubDate.getFullYear();
  const rawDate = `${day}-${month}-${year}`;
  const formattedDateCode = locale === 'bn' ? formatNumber(rawDate, 'bn') : rawDate;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Top Meta Line: Last Updated (14px font, print icon removed) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border text-[14px] text-muted-foreground no-print">
        <Link
          href="/notices"
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{pick('সকল নোটিশ আর্কাইভ', 'All Notices Archive')}</span>
        </Link>

        <div>
          <span>
            {pick('কনটেন্টটি শেষ হাল-নাগাদ করা হয়েছে:', 'Content Last Updated:')}{' '}
            <strong className="font-semibold text-foreground">{dayName}, {dateFormatted}</strong>
          </span>
        </div>
      </div>

      {/* Official Notice Title (Large bold heading) */}
      <div className="space-y-3 no-print">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-snug">
          {notice.title}
        </h1>

        {/* Metadata Chips Strip */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="px-3 py-1 rounded-md bg-surface-muted border border-border text-foreground font-medium">
            {pick('কনটেন্ট: নোটিশ', 'Content: Notice')}
          </span>
          <span className="px-3 py-1 rounded-md bg-surface-muted border border-border text-foreground font-medium tabular-nums">
            {pick('প্রকাশের তারিখ:', 'Published:')} {formattedDateCode}
          </span>
          {notice.memoNo && (
            <span className="px-3 py-1 rounded-md bg-surface-muted border border-border text-foreground font-medium font-mono">
              {pick('স্মারক নং:', 'Memo No:')} {notice.memoNo}
            </span>
          )}
          <span className="px-3 py-1 rounded-md bg-surface-muted border border-border text-foreground font-medium">
            {pick('বিভাগ:', 'Category:')} {notice.isUrgent ? pick('জরুরি বিজ্ঞপ্তি', 'Urgent') : pick('সাধারণ নোটিশ', 'General')}
          </span>
        </div>
      </div>

      {/* Full Chrome-Like PDF Document Viewer (Embedded - matches Image 2 from bteb.gov.bd) */}
      <ChromePdfViewer notice={notice} school={db.schoolProfile} />

      {/* Other Recent Notices (matches bteb.gov.bd bottom list) */}
      {recentOthers.length > 0 && (
        <div className="pt-6 space-y-4 no-print border-t border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-500" />
              <span>{pick('অন্যান্য সাম্প্রতিক নোটিশ', 'Other Recent Notices')}</span>
            </h2>
            <Link href="/notices" className="text-xs font-semibold text-primary hover:underline">
              {pick('সব নোটিশ', 'View All')}
            </Link>
          </div>

          <div className="divide-y divide-border border border-border rounded-xl bg-surface overflow-hidden">
            {recentOthers.map((item) => {
              const itemDate = new Date(item.publishedAt ?? item.createdAt);
              const iDay = String(itemDate.getDate()).padStart(2, '0');
              const iMonth = String(itemDate.getMonth() + 1).padStart(2, '0');
              const iYear = itemDate.getFullYear();
              const iRaw = `${iDay}-${iMonth}-${iYear}`;
              const iFormatted = locale === 'bn' ? formatNumber(iRaw, 'bn') : iRaw;

              return (
                <div
                  key={item.id}
                  className="group px-4 py-3 hover:bg-surface-muted/40 transition-colors flex items-start gap-3"
                >
                  <span className="w-2 h-2 rounded-full bg-[#0c5936] shrink-0 mt-1.5" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <Link
                      href={`/notices/${item.id}`}
                      className="block text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1"
                    >
                      {item.title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
                      <span>{iFormatted}</span>
                      {item.isUrgent && (
                        <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[10px] font-bold">
                          {pick('জরুরি', 'Urgent')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/notices/${item.id}`}
                    className="text-muted-foreground group-hover:text-primary transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
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

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (parsed.pathname.startsWith('/embed/')) return url;
      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.replace('/shorts/', '').split('/')[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function isDirectVideoSource(url: string): boolean {
  const trimmed = url.trim();
  return (
    trimmed.startsWith('data:video/') ||
    trimmed.startsWith('blob:') ||
    /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed)
  );
}

export function PublicGalleryListPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const published = db.galleries.filter((g) => g.isPublished);
  const activeManagedCategories = [...(db.galleryCategories ?? [])]
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => c.name.trim())
    .filter(Boolean);
  const categories = Array.from(
    new Set([
      ...activeManagedCategories,
      ...published.map((g) => (g.category ?? '').trim()).filter(Boolean),
    ])
  );

  const filtered = published.filter((gal) => {
    if (category !== 'ALL' && (gal.category ?? '') !== category) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const captions = db.galleryMedia
      .filter((m) => m.galleryId === gal.id)
      .map((m) => m.caption ?? '')
      .join(' ');
    return `${gal.title} ${gal.category ?? ''} ${gal.description ?? ''} ${captions}`
      .toLowerCase()
      .includes(q);
  });

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader
        title={pick('ছবি ও ভিডিও গ্যালারি', 'Photo & Video Gallery')}
        description={pick(
          'বিদ্যালয়ের ক্যাম্পাস, বিজ্ঞান মেলা, ক্রীড়া ও সাংস্কৃতিক আয়োজনের নির্বাচিত অ্যালবামসমূহ।',
          'Browse campus life, science fairs, sports, and cultural program albums.'
        )}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={pick('অ্যালবামের নাম, ক্যাটাগরি বা ক্যাপশন দিয়ে খুঁজুন...', 'Search albums by title, category, or caption...')}
            className="pl-9"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full sm:w-56"
        >
          <option value="ALL">{pick('সব ক্যাটাগরি', 'All Categories')}</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={pick('কোনো অ্যালবাম পাওয়া যায়নি', 'No matching gallery albums')}
          description={pick('অনুগ্রহ করে অন্য শব্দ বা ক্যাটাগরি নির্বাচন করে চেষ্টা করুন।', 'Try another search keyword or category.')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filtered.map((gal) => {
            const media = [...db.galleryMedia.filter((m) => m.galleryId === gal.id)].sort(
              (a, b) => a.sortOrder - b.sortOrder
            );
            const coverImage = media.find((m) => m.mediaType === MediaType.IMAGE);
            const videoCount = media.filter((m) => m.mediaType === MediaType.VIDEO).length;
            return (
              <Link key={gal.id} href={`/gallery/${gal.id}`}>
                <Card className="overflow-hidden hover:border-primary/50 transition-colors h-full flex flex-col">
                  <div className="relative">
                    {!coverImage && videoCount > 0 ? (
                      <div className="h-48 bg-slate-900 text-white p-5 flex flex-col justify-between">
                        <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center">
                          <Film className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          {gal.category && (
                            <p className="text-xs font-medium text-white/75">{gal.category}</p>
                          )}
                          <h3 className="text-base font-bold leading-snug line-clamp-2 mt-0.5">
                            {gal.title}
                          </h3>
                        </div>
                      </div>
                    ) : (
                      <InstitutionalArtwork
                        variant={coverImage?.mediaUrl ?? 'campus-heritage'}
                        title={gal.title}
                        subtitle={gal.category ?? ''}
                        className="h-48 rounded-none"
                      />
                    )}
                    <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded bg-black/65 text-white text-xs font-medium tabular-nums inline-flex items-center gap-1.5">
                      {formatNumber(media.length, locale)} {pick('টি মিডিয়া', 'items')}
                      {videoCount > 0 && <Film className="w-3 h-3" />}
                    </span>
                  </div>
                  <div className="p-4 text-sm text-muted-foreground flex-1">{gal.description}</div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PublicGalleryDetailPage() {
  const { id } = useParams();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;
  const gal = db.galleries.find((g) => g.id === id && g.isPublished);
  if (!gal) return <div className="max-w-[1440px] mx-auto p-6"><EmptyState /></div>;
  const items = [...db.galleryMedia.filter((m) => m.galleryId === gal.id)].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Link href="/gallery" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> {pick('গ্যালারিতে ফিরুন', 'Back to Gallery')}
      </Link>
      <PageHeader
        title={gal.title}
        description={
          [gal.category, gal.description].filter(Boolean).join(' · ') || undefined
        }
      />
      {items.length === 0 ? (
        <EmptyState
          title={pick('এই অ্যালবামে এখনো কোনো ছবি বা ভিডিও নেই', 'No media items in this album yet')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((m) => {
            if (m.mediaType === MediaType.VIDEO) {
              const ytEmbed = getYouTubeEmbedUrl(m.mediaUrl);
              const isDirectVideo = isDirectVideoSource(m.mediaUrl);
              return (
                <Card key={m.id} className="overflow-hidden flex flex-col">
                  {ytEmbed ? (
                    <div className="aspect-video w-full bg-black">
                      <iframe
                        src={ytEmbed}
                        title={m.caption ?? gal.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : isDirectVideo ? (
                    <div className="aspect-video w-full bg-black">
                      <video
                        src={m.mediaUrl}
                        controls
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-60 bg-surface-muted/70 flex flex-col items-center justify-center gap-3 p-6 text-center">
                      <Film className="w-10 h-10 text-primary" />
                      <a
                        href={m.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {pick('ভিডিও দেখুন', 'Watch Video')}
                      </a>
                    </div>
                  )}
                  {m.caption && (
                    <div className="p-3.5 border-t border-border text-sm font-medium text-foreground">
                      {m.caption}
                    </div>
                  )}
                </Card>
              );
            }
            return (
              <Card key={m.id} className="overflow-hidden">
                <InstitutionalArtwork variant={m.mediaUrl} title={m.caption ?? ''} className="h-64 rounded-none" />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PublicPublicationsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const published = db.publications.filter((p) => p.isPublished);
  const years = Array.from(
    new Set(published.map((p) => p.publishYear).filter((y): y is number => Boolean(y)))
  ).sort((a, b) => b - a);

  const filtered = published.filter((pub) => {
    if (typeFilter !== 'ALL' && pub.type !== typeFilter) return false;
    if (yearFilter !== 'ALL' && String(pub.publishYear ?? '') !== yearFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${pub.title} ${pub.description ?? ''} ${pub.publishYear ?? ''}`
      .toLowerCase()
      .includes(q);
  });

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader
        title={pick('বিদ্যালয়ের প্রকাশনা ও ম্যাগাজিন', 'School Publications')}
        description={pick(
          'বার্ষিক ম্যাগাজিন, দেয়াল পত্রিকা, জার্নাল ও অন্যান্য প্রকাশনা খুঁজুন ও পড়ুন।',
          'Search and browse school magazines, wall magazines, journals, and special publications.'
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="relative sm:col-span-6">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={pick('প্রকাশনার শিরোনাম বা বিবরণ দিয়ে খুঁজুন...', 'Search publications by title or keyword...')}
            className="pl-9"
          />
        </div>
        <div className="sm:col-span-3">
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="ALL">{pick('সব ধরন', 'All Types')}</option>
            <option value={PublicationType.SCHOOL_MAGAZINE}>{pick('বিদ্যালয় ম্যাগাজিন', 'School Magazine')}</option>
            <option value={PublicationType.WALL_MAGAZINE}>{pick('দেয়াল পত্রিকা', 'Wall Magazine')}</option>
            <option value={PublicationType.JOURNAL}>{pick('বার্ষিকী / জার্নাল', 'Journal')}</option>
            <option value={PublicationType.OTHER}>{pick('অন্যান্য', 'Other')}</option>
          </Select>
        </div>
        <div className="sm:col-span-3">
          <Select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
            <option value="ALL">{pick('সব বছর', 'All Years')}</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {formatNumber(y, locale)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={pick('কোনো প্রকাশনা পাওয়া যায়নি', 'No publications matched your filter')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((pub) => {
            const hasDirectFile = Boolean(
              pub.fileUrl &&
                (pub.fileUrl.startsWith('http://') ||
                  pub.fileUrl.startsWith('https://') ||
                  pub.fileUrl.startsWith('/') ||
                  pub.fileUrl.startsWith('data:'))
            );
            return (
              <Card key={pub.id} className="p-6 flex flex-col sm:flex-row gap-4">
                {pub.coverImage && (
                  <img
                    src={getCampusPhoto(pub.coverImage).src}
                    alt={pub.title}
                    referrerPolicy="no-referrer"
                    className="w-full sm:w-28 h-40 sm:h-36 rounded object-cover border border-border shrink-0"
                  />
                )}
                <div className="flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge enumName="PublicationType" value={pub.type} />
                      {pub.publishYear && (
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {formatNumber(pub.publishYear, locale)}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-foreground">{pub.title}</h2>
                    <p className="text-base text-muted-foreground leading-relaxed">{pub.description}</p>
                  </div>
                  {pub.fileUrl && (
                    <div className="pt-2 border-t border-border">
                      {hasDirectFile ? (
                        <a href={pub.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                            {pick('পড়ুন / ডাউনলোড করুন', 'Read / Download')}
                          </Button>
                        </a>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toast.info(
                              pick(
                                'বিদ্যালয়ের মূল আর্কাইভ পিডিএফ সংযুক্ত হলে এখান থেকে সরাসরি ডাউনলোড করা যাবে।',
                                'PDF download will be available once the archive document URL is attached.'
                              )
                            )
                          }
                        >
                          <FileText className="w-4 h-4" />
                          {pick('ডিজিটাল কপি (আর্কাইভ)', 'Digital Copy (Archive)')}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PublicAchievementsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const filtered = db.achievements
    .filter((a) => a.isPublished)
    .filter((ach) => {
      if (typeFilter !== 'ALL' && ach.type !== typeFilter) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return `${ach.title} ${ach.personName ?? ''} ${ach.batch ?? ''} ${ach.description ?? ''}`
        .toLowerCase()
        .includes(q);
    });

  const MASONRY_DIMENSIONS = [
    { width: 800, height: 1050 },
    { width: 1200, height: 800 },
    { width: 900, height: 950 },
    { width: 850, height: 1100 },
    { width: 1200, height: 850 },
    { width: 950, height: 900 },
  ];

  const albumPhotos = filtered.map((ach, idx) => {
    const dim = MASONRY_DIMENSIONS[idx % MASONRY_DIMENSIONS.length];
    const photoSrc = ach.image ? getCampusPhoto(ach.image).src : '/images/teacher_kamrul_portrait_1795155721415.jpg';
    return {
      src: photoSrc,
      width: dim.width,
      height: dim.height,
      key: ach.id,
      achievement: ach,
    };
  });

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <PageHeader
        title={pick('অর্জন ও কৃতী শিক্ষার্থী', 'Achievements & Alumni')}
        description={pick(
          'ভোজেশ্বর উচ্চ বিদ্যালয়ের স্মরণীয় মুহূর্ত, জাতীয় ও মেধা তালিকায় স্থানপ্রাপ্ত কৃতি শিক্ষার্থী এবং বিশিষ্ট প্রাক্তন শিক্ষার্থীদের মেসনারি স্মৃতি গ্যালারি।',
          'A responsive masonry showcase honoring board toppers, science innovators, and distinguished alumni of Bhojeshwar High School.'
        )}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={pick('অর্জন, শিক্ষার্থী বা ব্যাচ দিয়ে খুঁজুন...', 'Search by title, student name, or batch...')}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-60"
        >
          <option value="ALL">{pick('সব ক্যাটাগরি', 'All Categories')}</option>
          <option value={AchievementType.INSTITUTION_ACHIEVEMENT}>{pick('প্রাতিষ্ঠানিক অর্জন', 'Institution Award')}</option>
          <option value={AchievementType.STUDENT_STAR}>{pick('কৃতী শিক্ষার্থী', 'Student Star')}</option>
          <option value={AchievementType.NOTABLE_ALUMNI}>{pick('কৃতী প্রাক্তন শিক্ষার্থী', 'Notable Alumni')}</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={pick('কোনো অর্জন পাওয়া যায়নি', 'No matching achievements found')}
        />
      ) : (
        <div className="w-full">
          <MasonryPhotoAlbum
            photos={albumPhotos}
            columns={(containerWidth) => {
              if (containerWidth < 640) return 1;
              if (containerWidth < 1024) return 2;
              return 3;
            }}
            spacing={24}
            render={{
              photo: ({ onClick }, { photo }) => {
                const ach = photo.achievement;
                const isAlumni = ach.type === AchievementType.NOTABLE_ALUMNI;
                const isStudentStar = ach.type === AchievementType.STUDENT_STAR;

                return (
                  <div
                    onClick={() => setSelectedAchievement(ach)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface shadow-sm hover:shadow-xl hover:border-primary/45 transition-all duration-300 flex flex-col"
                  >
                    {/* Photo Visual Frame */}
                    <div className="relative w-full overflow-hidden bg-surface-muted">
                      <img
                        src={photo.src}
                        alt={ach.personName ?? ach.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                        style={{
                          aspectRatio: `${photo.width} / ${photo.height}`,
                        }}
                      />

                      {/* Subtle Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                      {/* Top Left Badge: Category */}
                      <div className="absolute top-3 left-3 z-10">
                        {isAlumni ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-md backdrop-blur-sm">
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>{pick('কৃতি প্রাক্তন শিক্ষার্থী', 'Notable Alumni')}</span>
                          </span>
                        ) : isStudentStar ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-md backdrop-blur-sm">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{pick('কৃতি শিক্ষার্থী', 'Student Star')}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-md backdrop-blur-sm">
                            <Trophy className="w-3.5 h-3.5" />
                            <span>{pick('প্রাতিষ্ঠানিক স্বীকৃতি', 'Institution Milestone')}</span>
                          </span>
                        )}
                      </div>

                      {/* Top Right: Batch Pill */}
                      {ach.batch && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-black/60 text-white border border-white/20 backdrop-blur-md tabular-nums">
                            {ach.batch}
                          </span>
                        </div>
                      )}

                      {/* Bottom Floating Info inside Image */}
                      <div className="absolute inset-x-0 bottom-0 p-4 text-white z-10">
                        {ach.personName && (
                          <p className="text-lg font-bold leading-tight drop-shadow-sm group-hover:text-primary-foreground">
                            {ach.personName}
                          </p>
                        )}
                        <p className="text-xs font-medium text-white/90 line-clamp-1 mt-0.5">
                          {ach.title}
                        </p>
                      </div>

                      {/* Hover Click-to-Expand Badge */}
                      <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[2px]">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold shadow-xl">
                          <Maximize2 className="w-3.5 h-3.5 text-primary" />
                          <span>{pick('বিস্তারিত সাফল্যগাথা', 'View Story')}</span>
                        </span>
                      </div>
                    </div>

                    {/* Card Bottom Description Block */}
                    {ach.description && (
                      <div className="p-4 bg-surface border-t border-border flex flex-col justify-between gap-2.5 flex-1">
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {ach.description}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs font-semibold text-primary">
                          <span className="inline-flex items-center gap-1 group-hover:underline">
                            <span>{pick('সম্পূর্ণ বিবরণী', 'Full Details')}</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                          {ach.achievedAt && (
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                              {formatDateShort(ach.achievedAt, locale)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              },
            }}
          />
        </div>
      )}

      {/* Lightbox Modal on clicking any card */}
      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedAchievement(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-2xl w-full bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setSelectedAchievement(null)}
                className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-12">
                <div className="sm:col-span-5 relative aspect-square sm:aspect-auto min-h-[260px] bg-neutral-900">
                  <img
                    src={selectedAchievement.image ? getCampusPhoto(selectedAchievement.image).src : '/images/teacher_kamrul_portrait_1795155721415.jpg'}
                    alt={selectedAchievement.personName ?? selectedAchievement.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>

                <div className="sm:col-span-7 p-6 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedAchievement.type === AchievementType.NOTABLE_ALUMNI ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>{pick('কৃতি প্রাক্তন শিক্ষার্থী', 'Notable Alumni')}</span>
                        </span>
                      ) : selectedAchievement.type === AchievementType.STUDENT_STAR ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{pick('কৃতি শিক্ষার্থী', 'Student Star')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                          <Trophy className="w-3.5 h-3.5" />
                          <span>{pick('প্রাতিষ্ঠানিক স্বীকৃতি', 'Institution Milestone')}</span>
                        </span>
                      )}

                      {selectedAchievement.batch && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-muted border border-border text-foreground tabular-nums">
                          {selectedAchievement.batch}
                        </span>
                      )}

                      {selectedAchievement.achievedAt && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          · {formatDateShort(selectedAchievement.achievedAt, locale)}
                        </span>
                      )}
                    </div>

                    <div>
                      {selectedAchievement.personName && (
                        <h3 className="text-xl font-bold text-foreground">
                          {selectedAchievement.personName}
                        </h3>
                      )}
                      <p className="text-sm font-semibold text-primary mt-0.5">
                        {selectedAchievement.title}
                      </p>
                    </div>

                    {selectedAchievement.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedAchievement.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAchievement(null)}
                    >
                      {pick('বন্ধ করুন', 'Close')}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
