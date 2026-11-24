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

