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

