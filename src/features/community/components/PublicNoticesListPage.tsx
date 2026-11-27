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

import { useGetPublicNoticesQuery } from '@/src/features/notices/api/notices.api';
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

type NoticeTab = 'all' | 'urgent';

export function PublicNoticesListPage() {
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
  ];

  const { currentData: notices, isFetching, isError, refetch } = useGetPublicNoticesQuery({
    page: pageIndex + 1,
    limit: pageSize,
    search: noticeQuery.trim() || undefined,
    urgent: noticeTab === 'urgent' ? true : undefined,
  });

  const { data: totals } = useGetPublicNoticesQuery({ limit: 1 });
  const { data: urgentTotals } = useGetPublicNoticesQuery({ limit: 1, urgent: true });

  const totalFiltered = notices?.meta.total ?? 0;
  const pageCount = Math.max(1, notices?.meta.totalPages ?? 1);
  const safePageIndex = pageIndex;
  const startIndex = safePageIndex * pageSize;
  const pagedRows = notices?.items ?? [];

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

  const paginationSummary = `মোট ${formatNumber(totalFiltered, 'bn')} টি তথ্য · পৃষ্ঠা ${formatNumber(safePageIndex + 1, 'bn')} / ${formatNumber(pageCount, 'bn')}`;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* 1. Header with Valid Institutional Data & Stats */}
      <div className="bg-surface border border-border rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>{'অফিসিয়াল নোটিশ পোর্টাল'}</span>
              <span className="text-muted-foreground/40" aria-hidden="true">·</span>
              <span>{'ভোজেশ্বর উচ্চ বিদ্যালয়'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <FileText className="w-8 h-8 text-[#0c5936] dark:text-emerald-500 shrink-0" />
              <span>{'প্রাতিষ্ঠানিক নোটিশ বোর্ড'}</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-3xl leading-relaxed">
              {'ভোজেশ্বর উচ্চ বিদ্যালয়ের সকল প্রাতিষ্ঠানিক আদেশ, পরীক্ষা, ফলাফল, ভর্তি ও শিক্ষা বোর্ডের জরুরি বিজ্ঞপ্তি সমূহ।'}
            </p>
          </div>

          {/* Valid Institutional Stats */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-5 py-3 rounded-xl bg-surface-muted/60 border border-border text-center min-w-[110px]">
              <span className="block text-sm text-muted-foreground font-medium">
                {'মোট বিজ্ঞপ্তি'}
              </span>
              <span className="text-xl font-bold text-[#0c5936] dark:text-emerald-400 tabular-nums">
                {totals ? formatNumber(totals.meta.total, 'bn') : '?'}
              </span>
            </div>
            <div className="px-5 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-center min-w-[110px]">
              <span className="block text-sm text-destructive font-medium">
                {'জরুরি বিজ্ঞপ্তি'}
              </span>
              <span className="text-xl font-bold text-destructive tabular-nums">
                {urgentTotals ? formatNumber(urgentTotals.meta.total, 'bn') : '?'}
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
                    aria-pressed={active}
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
                  {tab.labelBn}
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
              placeholder={'স্মারক বা বিষয় খুঁজুন...'}
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
                  {'নং'}
                </th>
                <th className="py-3.5 px-6 text-left border-r border-border">
                  {'বিজ্ঞপ্তির বিষয় ও স্মারক'}
                </th>
                <th className="py-3.5 px-4 text-center border-r border-border w-36 sm:w-44 shrink-0">
                  {'প্রকাশের তারিখ'}
                </th>
                <th className="py-3.5 px-5 text-center w-40 shrink-0">
                  {'কার্যকলাপ'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!isFetching && !isError && pagedRows.map((n, idx) => {
                  const serial = startIndex + idx + 1;
                  const pubDate = new Date(n.publishedAt ?? n.createdAt);
                  const isRecent = Date.now() - pubDate.getTime() < 14 * 24 * 60 * 60 * 1000;
                  const showNewBadge = n.isUrgent || isRecent;
                  const day = String(pubDate.getDate()).padStart(2, '0');
                  const month = String(pubDate.getMonth() + 1).padStart(2, '0');
                  const year = pubDate.getFullYear();
                  const rawDate = `${day}-${month}-${year}`;
                  const formattedDate = formatNumber(rawDate, 'bn');

                  return (
                    <tr
                      key={n.id}
                      className="group hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors"
                    >
                      {/* নং */}
                      <td className="py-4 px-3 text-center border-r border-border tabular-nums font-semibold text-base text-foreground">
                        <span className="inline-block pl-4">
                          {formatNumber(serial, 'bn')}
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

                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              {showNewBadge && (
                                <span className="px-2 py-0.5 rounded-sm bg-[#D32F2F] text-white text-xs font-bold leading-none">
                                  {'নতুন'}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-sm bg-surface-muted border border-border text-xs font-medium text-foreground">
                                {n.isUrgent ? 'জরুরি' : 'সাধারণ'}
                              </span>
                              {n.memoNo && (
                                <span className="text-sm text-muted-foreground font-mono">
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
                            <span>{'বিস্তারিত'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          <span className="text-muted-foreground/30">|</span>
                          <button
                            type="button"
                            onClick={() => downloadNoticeDocument(n, undefined, 'bn', false)}
                            title={'ডাউনলোড করুন'}
                            className="inline-flex items-center gap-1 text-base font-semibold text-primary hover:underline cursor-pointer transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{'ডাউনলোড'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {(isFetching || isError || pagedRows.length === 0) && (
          <div className="border-t border-border px-4 py-16 text-center text-base text-muted-foreground">
            {isFetching ? <LoadingSkeleton /> : isError ? (
              <div role="alert" className="flex flex-wrap items-center justify-center gap-3">
                <span>{'বিজ্ঞপ্তি লোড করা যায়নি।'}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                  {'আবার চেষ্টা'}
                </Button>
              </div>
            ) : 'কোনো বিজ্ঞপ্তি পাওয়া যায়নি।'}
          </div>
        )}

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
              <span>{'পূর্ববর্তী'}</span>
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
                  {formatNumber(pageNum, 'bn')}
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
              <span>{'পরবর্তী'}</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

