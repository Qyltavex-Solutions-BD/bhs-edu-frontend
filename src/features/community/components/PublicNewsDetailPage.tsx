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

export function PublicNewsDetailPage() {
  const { id } = useParams();
  const { data: db, isLoading } = useGetBootstrapQuery();
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
        <ArrowLeft className="w-4 h-4" /> {'সব সংবাদে ফিরুন'}
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
                {formatDateLong(item.publishedAt ?? item.createdAt, 'bn')}
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
                  {'অন্যান্য সাম্প্রতিক সংবাদ'}
                </h2>
                <Link href="/news" className="text-sm font-semibold text-primary hover:underline">
                  {'সব দেখুন'}
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
                      <p className="text-sm text-muted-foreground tabular-nums">
                        {formatDateLong(other.publishedAt ?? other.createdAt, 'bn')}
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
              {'দ্রুত সংযোগ'}
            </h2>
            <div className="space-y-2 text-sm">
              <Link
                href="/events"
                className="flex items-center justify-between py-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <span>{'আসন্ন অনুষ্ঠান ও ক্যালেন্ডার'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/notices"
                className="flex items-center justify-between py-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <span>{'প্রাতিষ্ঠানিক নোটিশ বোর্ড'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/gallery"
                className="flex items-center justify-between py-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <span>{'ছবি ও ক্যাম্পাস গ্যালারি'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

