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
import { getYouTubeEmbedUrl, isDirectVideoSource } from '../utils/media';

type NoticeTab = 'all' | 'urgent' | 'exam' | 'admission';

export function PublicGalleryDetailPage() {
  const { id } = useParams();
  const { data: db, isLoading } = useGetBootstrapQuery();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;
  const gal = db.galleries.find((g) => g.id === id && g.isPublished);
  if (!gal) return <div className="max-w-[1440px] mx-auto p-6"><EmptyState /></div>;
  const items = [...db.galleryMedia.filter((m) => m.galleryId === gal.id)].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Link href="/gallery" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> {'গ্যালারিতে ফিরুন'}
      </Link>
      <PageHeader
        title={gal.title}
        description={
          [gal.category, gal.description].filter(Boolean).join(' · ') || undefined
        }
      />
      {items.length === 0 ? (
        <EmptyState
          title={'এই অ্যালবামে এখনো কোনো ছবি বা ভিডিও নেই'}
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
                        {'ভিডিও দেখুন'}
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

