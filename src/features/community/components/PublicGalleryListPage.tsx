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

export function PublicGalleryListPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
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
        title={'ছবি ও ভিডিও গ্যালারি'}
        description={'বিদ্যালয়ের ক্যাম্পাস, বিজ্ঞান মেলা, ক্রীড়া ও সাংস্কৃতিক আয়োজনের নির্বাচিত অ্যালবামসমূহ।'}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={'অ্যালবামের নাম, ক্যাটাগরি বা ক্যাপশন দিয়ে খুঁজুন...'}
            className="pl-9"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full sm:w-56"
        >
          <option value="ALL">{'সব ক্যাটাগরি'}</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={'কোনো অ্যালবাম পাওয়া যায়নি'}
          description={'অনুগ্রহ করে অন্য শব্দ বা ক্যাটাগরি নির্বাচন করে চেষ্টা করুন।'}
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
                            <p className="text-sm font-medium text-white/75">{gal.category}</p>
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
                      {formatNumber(media.length, 'bn')} {'টি মিডিয়া'}
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

