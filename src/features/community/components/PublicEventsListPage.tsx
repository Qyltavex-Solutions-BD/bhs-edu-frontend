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

export function PublicEventsListPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const sortedEvents = [...db.events]
    .filter((e) => e.isPublished)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader
        title={'অনুষ্ঠান ও সহশিক্ষা কার্যক্রম'}
        description={'তারিখ অনুযায়ী বিদ্যালয়ের আসন্ন জাতীয় দিবস, বিজ্ঞান মেলা, বার্ষিক ক্রীড়া ও সাংস্কৃতিক সূচি।'}
        actions={
          <Link href="/academics/academic-calendar">
            <Button variant="outline" size="sm">
              <Calendar className="w-3.5 h-3.5" />
              <span>{'একাডেমিক ক্যালেন্ডার'}</span>
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
                        {formatDateLong(ev.startDate, 'bn')}
                        {isMultiDay ? ` – ${formatDateLong(ev.endDate, 'bn')}` : ''}
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
                <span>{'অনুষ্ঠানের বিবরণ দেখুন'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

