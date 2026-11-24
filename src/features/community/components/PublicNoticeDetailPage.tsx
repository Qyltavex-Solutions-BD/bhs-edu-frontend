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

