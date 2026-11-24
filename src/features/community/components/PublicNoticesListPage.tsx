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
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
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
      <div className="bg-surface border border-border rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>{pick('অফিসিয়াল নোটিশ পোর্টাল', 'Official Circular Portal')}</span>
              <span className="text-muted-foreground/40" aria-hidden="true">·</span>
              <span className="tabular-nums">
                {pick(`EIIN: ${db.schoolProfile?.eiin || '১১৩৫৮৭'}`, `EIIN: ${db.schoolProfile?.eiin || '113587'}`)}
              </span>
              <span className="text-muted-foreground/40" aria-hidden="true">·</span>
              <span>{pick('ভোজেশ্বর উচ্চ বিদ্যালয়', 'Bhojeshwar High School')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <FileText className="w-8 h-8 text-[#0c5936] dark:text-emerald-500 shrink-0" />
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
            <div className="px-5 py-3 rounded-xl bg-surface-muted/60 border border-border text-center min-w-[110px]">
              <span className="block text-xs text-muted-foreground font-medium">
                {pick('মোট বিজ্ঞপ্তি', 'Total Notices')}
              </span>
              <span className="text-xl font-bold text-[#0c5936] dark:text-emerald-400 tabular-nums">
                {formatNumber(allPublished.length, locale)}
              </span>
            </div>
            <div className="px-5 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-center min-w-[110px]">
              <span className="block text-xs text-destructive font-medium">
                {pick('জরুরি বিজ্ঞপ্তি', 'Urgent Notices')}
              </span>
              <span className="text-xl font-bold text-destructive tabular-nums">
                {formatNumber(allPublished.filter((n) => n.isUrgent).length, locale)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Card containing Search/Filter Strip, Table & Pagination */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
        {/* Search & Filtering Strip */}
        <div className="px-5 sm:px-6 py-3.5 bg-surface-muted/40 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
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
                    'px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap',
                    active
                      ? 'bg-[#0c5936] text-white shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                  )}
                >
                  {locale === 'bn' ? tab.labelBn : tab.labelEn}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={noticeQuery}
              onChange={(e) => {
                setNoticeQuery(e.target.value);
                setPageIndex(0);
              }}
              placeholder={pick('স্মারক বা বিষয় খুঁজুন...', 'Search memo or title...')}
              className="w-full h-9 pl-9 pr-3 text-sm bg-surface border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-2xs"
            />
          </div>
        </div>

        {/* 3. Notice Table with Bullet, Title, Meta Badges & Download Action */}
        <div className="overflow-x-auto">
          <table className="w-full text-base border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-surface-muted/60 text-foreground font-bold text-base tracking-wide">
                <th className="py-3.5 px-4 text-center border-r border-border w-16 shrink-0">
                  {pick('নং', 'SL')}
                </th>
                <th className="py-3.5 px-6 text-left border-r border-border">
                  {pick('বিজ্ঞপ্তির বিষয় ও স্মারক', 'Notice Title & Memo')}
                </th>
                <th className="py-3.5 px-4 text-center border-r border-border w-36 sm:w-44 shrink-0">
                  {pick('প্রকাশের তারিখ', 'Publish Date')}
                </th>
                <th className="py-3.5 px-5 text-center w-40 shrink-0">
                  {pick('কার্যকলাপ', 'Action')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-base text-muted-foreground">
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
                      className="group hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors"
                    >
                      {/* নং */}
                      <td className="py-4 px-3 text-center border-r border-border tabular-nums font-semibold text-base text-foreground">
                        <span className="inline-block pl-4">
                          {formatNumber(serial, locale)}
                        </span>
                      </td>

                      {/* শিরোনাম */}
                      <td className="py-4 px-6 border-r border-border">
                        <div className="flex items-start gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0c5936] dark:bg-emerald-500 shrink-0 mt-1.5" />
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <Link
                              href={`/notices/${n.id}`}
                              className="text-base font-semibold text-foreground group-hover:text-[#0c5936] dark:group-hover:text-emerald-400 hover:underline leading-snug block transition-colors"
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
                        </div>
                      </td>

                      {/* প্রকাশের তারিখ */}
                      <td className="py-4 px-4 text-center border-r border-border tabular-nums whitespace-nowrap text-base font-medium text-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span>{formattedDate}</span>
                        </span>
                      </td>

                      {/* কার্যকলাপ */}
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-3">
                          <Link
                            href={`/notices/${n.id}`}
                            className="inline-flex items-center gap-1 text-base font-semibold text-primary hover:underline transition-colors"
                          >
                            <span>{pick('বিস্তারিত', 'View')}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          <span className="text-muted-foreground/30">|</span>
                          <button
                            type="button"
                            onClick={() => downloadNoticeDocument(n, db.schoolProfile, locale, false)}
                            title={pick('ডাউনলোড করুন', 'Download')}
                            className="inline-flex items-center gap-1 text-base font-semibold text-primary hover:underline cursor-pointer transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{pick('ডাউনলোড', 'Download')}</span>
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

        {/* 4. Pagination Bar */}
        <div className="p-4 sm:p-5 bg-surface-muted/30 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="tabular-nums font-medium">{paginationSummary}</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={safePageIndex <= 0}
              className="cursor-pointer text-sm"
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
                  className="min-w-[34px] px-2 tabular-nums cursor-pointer text-sm"
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
              className="cursor-pointer text-sm"
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

