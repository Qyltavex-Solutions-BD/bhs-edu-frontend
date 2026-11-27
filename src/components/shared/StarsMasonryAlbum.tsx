'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { MasonryPhotoAlbum } from 'react-photo-album';
import {
  ArrowRight,
  Award,
  ExternalLink,
  GraduationCap,
  Maximize2,
  Sparkles,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { AchievementType } from '@/src/types/enums';
import type { Achievement } from '@/src/types/entities';
import { Button } from '@/src/components/ui/primitives';

interface StarPhoto {
  src: string;
  width: number;
  height: number;
  key: string;
  achievement: Achievement;
}

interface StarsMasonryAlbumProps {
  stars: Achievement[];
}

// Preset visual dimensions to create an authentic, balanced Masonry flow
const MASONRY_DIMENSIONS = [
  { width: 800, height: 1050 }, // Portrait
  { width: 1200, height: 800 }, // Landscape
  { width: 900, height: 950 },  // Balanced Square
  { width: 850, height: 1100 }, // Tall Portrait
  { width: 1200, height: 850 }, // Landscape
  { width: 950, height: 900 },  // Square
];

export function StarsMasonryAlbum({ stars, }: StarsMasonryAlbumProps) {
  const [selectedStar, setSelectedStar] = useState<Achievement | null>(null);

  if (!stars || stars.length === 0) return null;

  // Convert achievements to react-photo-album photo items
  const photos: StarPhoto[] = stars.map((ach, idx) => {
    const dim = MASONRY_DIMENSIONS[idx % MASONRY_DIMENSIONS.length];
    return {
      src: ach.image || '/images/teacher_kamrul_portrait_1795155721415.jpg',
      width: dim.width,
      height: dim.height,
      key: ach.id,
      achievement: ach,
    };
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold tracking-wide uppercase">
            <Trophy className="w-3.5 h-3.5 text-primary" />
            <span>{'আমাদের গৌরব ও কীর্তি গ্যালারি'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            {'বিদ্যালয়ের কৃতি শিক্ষার্থী ও অ্যালামনাই'}
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl">
            {'ভোজেশ্বর উচ্চ বিদ্যালয়ের স্মরণীয় মুহূর্ত, জাতীয় ও মেধা তালিকায় স্থানপ্রাপ্ত কৃতি শিক্ষার্থী এবং বিশিষ্ট প্রাক্তন শিক্ষার্থীদের মেসনারি স্মৃতি গ্যালারি।'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/achievements"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface hover:bg-surface-muted text-sm font-semibold text-primary border border-border hover:border-primary/40 transition-all group"
          >
            <span>{'সব কৃতি শিক্ষার্থী ও অর্জন'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* =========================================================================
          REACT-PHOTO-ALBUM MASONRY GRID (Clean layout, NO heavy background canvas)
         ========================================================================= */}
      <div className="w-full">
        <MasonryPhotoAlbum<StarPhoto>
          photos={photos}
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

              return (
                <div
                  onClick={() => setSelectedStar(ach)}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface shadow-sm hover:shadow-xl hover:border-primary/45 transition-all duration-300 flex flex-col"
                >
                  {/* Photo Visual Frame */}
                  <div className="relative w-full overflow-hidden bg-surface-muted aspect-[var(--aspect)]">
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
                          <span>{'কৃতি প্রাক্তন শিক্ষার্থী'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-md backdrop-blur-sm">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{'কৃতি শিক্ষার্থী'}</span>
                        </span>
                      )}
                    </div>

                    {/* Top Right: Batch Pill */}
                    {ach.batch && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-black/60 text-white border border-white/20 backdrop-blur-md tabular-nums">
                          {ach.batch}
                        </span>
                      </div>
                    )}

                    {/* Bottom Floating Info inside Image */}
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white z-10">
                      <p className="text-lg font-bold leading-tight drop-shadow-sm group-hover:text-primary-foreground">
                        {ach.personName}
                      </p>
                      <p className="text-sm font-medium text-white/95 line-clamp-1 mt-0.5">
                        {ach.title}
                      </p>
                    </div>

                    {/* Hover Click-to-Expand Badge */}
                    <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[2px]">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-sm font-bold shadow-xl">
                        <Maximize2 className="w-4 h-4 text-primary" />
                        <span>{'বিস্তারিত সাফল্যগাথা'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom Description Block */}
                  {ach.description && (
                    <div className="p-4 bg-surface border-t border-border flex flex-col justify-between gap-2.5 flex-1">
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {ach.description}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-sm font-semibold text-primary">
                        <span className="inline-flex items-center gap-1 group-hover:underline">
                          <span>{'সম্পূর্ণ বিবরণী'}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                        {ach.achievedAt && (
                          <span className="text-sm text-muted-foreground tabular-nums">
                            {ach.achievedAt.split('-')[0]}
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



      {/* =========================================================================
          LIGHTBOX MODAL (On clicking any star in the masonry album)
         ========================================================================= */}
      <AnimatePresence>
        {selectedStar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedStar(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-2xl w-full bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setSelectedStar(null)}
                className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-12">
                {/* Photo Side */}
                <div className="sm:col-span-5 relative aspect-square sm:aspect-auto min-h-[260px] bg-neutral-900">
                  <img
                    src={selectedStar.image || '/images/teacher_kamrul_portrait_1795155721415.jpg'}
                    alt={selectedStar.personName ?? selectedStar.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Details Side */}
                <div className="sm:col-span-7 p-6 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedStar.type === AchievementType.NOTABLE_ALUMNI ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>{'বিশিষ্ট প্রাক্তন শিক্ষার্থী'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{'কৃতি শিক্ষার্থী'}</span>
                        </span>
                      )}

                      {selectedStar.batch && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-muted border border-border text-foreground tabular-nums">
                          {selectedStar.batch}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {selectedStar.personName}
                      </h3>
                      <p className="text-sm font-semibold text-primary mt-0.5">
                        {selectedStar.title}
                      </p>
                    </div>

                    {selectedStar.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedStar.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <Link
                      href="/achievements"
                      onClick={() => setSelectedStar(null)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    >
                      <span>{'সকল অর্জন তালিকায় দেখুন'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStar(null)}
                    >
                      {'বন্ধ করুন'}
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
