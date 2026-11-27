'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import type { Gallery, GalleryMedia } from '@/src/types/entities';
import { getCampusPhoto, InstitutionalArtwork } from '@/src/components/shared/Feedback';
import { cn } from '@/src/lib/utils/cn';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

interface HomeCampusLifeSectionProps {
  galleries: Gallery[];
  galleryMedia: GalleryMedia[];
}

export function HomeCampusLifeSection({
  galleries,
  galleryMedia,
}: HomeCampusLifeSectionProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const galleryShowcase = useMemo(() => {
    const publishedGalleries = (galleries ?? []).filter((g) => g.isPublished);
    if (publishedGalleries.length === 0) return [];

    const combined: Array<{
      id: string;
      title: string;
      category: string;
      variant: string;
      to: string;
    }> = [];
    const usedMediaIds = new Set<string>();

    for (const gal of publishedGalleries) {
      const albumImages = [
        ...(galleryMedia ?? []).filter((m) => m.galleryId === gal.id && m.mediaType === 'IMAGE'),
      ].sort((a, b) => a.sortOrder - b.sortOrder);
      const cover = albumImages[0];
      if (!cover) continue;
      usedMediaIds.add(cover.id);
      combined.push({
        id: gal.id,
        title: gal.title,
        category: gal.category ?? 'ক্যাম্পাস',
        variant: cover.mediaUrl,
        to: `/gallery/${gal.id}`,
      });
    }

    if (combined.length < 5) {
      for (const gal of publishedGalleries) {
        const extraAlbumImages = [
          ...(galleryMedia ?? []).filter(
            (m) => m.galleryId === gal.id && m.mediaType === 'IMAGE' && !usedMediaIds.has(m.id)
          ),
        ].sort((a, b) => a.sortOrder - b.sortOrder);
        for (const media of extraAlbumImages) {
          if (combined.length >= 5) break;
          usedMediaIds.add(media.id);
          combined.push({
            id: media.id,
            title: media.caption || gal.title,
            category: gal.category ?? 'ক্যাম্পাস',
            variant: media.mediaUrl,
            to: `/gallery/${gal.id}`,
          });
        }
      }
    }

    const extraVisuals = [
      {
        id: 'vis-classroom',
        title: 'মাল্টিমিডিয়া স্মার্ট শ্রেণিকক্ষ',
        category: 'ডিজিটাল শিক্ষা',
        variant: 'digital-classroom',
        to: '/about/facilities',
      },
      {
        id: 'vis-lab',
        title: 'বিজ্ঞান ও আইসিটি গবেষণাগার',
        category: 'গবেষণাগার',
        variant: 'science-lab',
        to: '/about/facilities',
      },
      {
        id: 'vis-library',
        title: 'বিদ্যালয় পাঠাগার',
        category: 'পাঠাগার',
        variant: 'library-room',
        to: '/academics/library',
      },
      {
        id: 'vis-sports',
        title: 'বার্ষিক ক্রীড়া ও খেলার মাঠ',
        category: 'সহশিক্ষা',
        variant: 'sports-day',
        to: '/gallery',
      },
    ];

    const usedVariants = new Set(combined.map((i) => i.variant));
    for (const item of extraVisuals) {
      if (!usedVariants.has(item.variant) && combined.length < 5) {
        combined.push(item);
        usedVariants.add(item.variant);
      }
    }
    return combined;
  }, [galleries, galleryMedia]);

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {'ক্যাম্পাস অবকাঠামো ও ফটো গ্যালারি'}
            </h2>
            <p className="text-base text-muted-foreground mt-1">
              {'ঐতিহ্যবাহী ভবন, স্মার্ট শ্রেণিকক্ষ, বিজ্ঞান গবেষণাগার, পাঠাগার ও খেলার মাঠ।'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/about/facilities" className="text-primary hover:underline">
              {'সব সুবিধা'}
            </Link>
            <Link href="/gallery" className="text-primary hover:underline">
              {'সম্পূর্ণ গ্যালারি'}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {galleryShowcase.slice(0, 5).map((item, idx) => {
            const spanClass =
              idx === 0
                ? 'md:col-span-7 h-72 sm:h-80'
                : idx === 1
                  ? 'md:col-span-5 h-72 sm:h-80'
                  : 'md:col-span-4 h-56';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setLightboxIdx(idx)}
                className={cn(
                  'group relative rounded-xl overflow-hidden text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-primary',
                  spanClass
                )}
              >
                <InstitutionalArtwork
                  variant={item.variant}
                  title={item.title}
                  subtitle={item.category}
                  className="w-full h-full"
                />
                <span
                  aria-hidden="true"
                  className="absolute top-3 right-3 h-8 w-8 rounded-lg bg-black/45 backdrop-blur-md text-white/90 inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </motion.section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIdx !== null && galleryShowcase[lightboxIdx] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={() => setLightboxIdx(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="relative max-w-4xl w-full bg-[#0A140F] border border-white/15 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close lightbox"
                onClick={() => setLightboxIdx(null)}
                className="absolute top-3 right-3 z-20 h-9 w-9 rounded-lg bg-black/55 hover:bg-black/75 text-white inline-flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="aspect-[16/10] w-full bg-black relative">
                <img
                  src={getCampusPhoto(galleryShowcase[lightboxIdx].variant).src}
                  alt={galleryShowcase[lightboxIdx].title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-4 sm:p-5 flex items-center justify-between gap-4 text-white">
                <div>
                  <p className="text-sm text-white/70">{galleryShowcase[lightboxIdx].category}</p>
                  <h3 className="text-lg font-bold mt-0.5">
                    {galleryShowcase[lightboxIdx].title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={() =>
                      setLightboxIdx(
                        (prev) =>
                          ((prev ?? 0) - 1 + galleryShowcase.length) % galleryShowcase.length
                      )
                    }
                    className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={() =>
                      setLightboxIdx((prev) => ((prev ?? 0) + 1) % galleryShowcase.length)
                    }
                    className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
