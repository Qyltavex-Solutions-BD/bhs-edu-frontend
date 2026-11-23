'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
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

interface StarsScrapbookGalleryProps {
  stars: Achievement[];
  locale: 'bn' | 'en';
  pick: (bn: string, en?: string) => string;
}

export function StarsScrapbookGallery({ stars, locale, pick }: StarsScrapbookGalleryProps) {
  const [selectedStar, setSelectedStar] = useState<Achievement | null>(null);

  if (!stars || stars.length === 0) return null;

  // We assign the 6 star items to the 6 distinct photo frames in the collage
  const f1 = stars[0];
  const f2 = stars[1] || stars[0];
  const f3 = stars[2] || stars[0];
  const f4 = stars[3] || stars[1] || stars[0];
  const f5 = stars[4] || stars[2] || stars[0];
  const f6 = stars[5] || stars[3] || stars[0];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header Pill */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold tracking-wide uppercase">
            <Trophy className="w-3.5 h-3.5 text-primary" />
            <span>{pick('আমাদের গৌরব ও কীর্তি গ্যালারি', 'Hall of Fame & Pride Gallery')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            {pick('বিদ্যালয়ের কৃতি শিক্ষার্থী ও অ্যালামনাই', 'Stars of Our Institution')}
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl">
            {pick(
              'ভোজেশ্বর উচ্চ বিদ্যালয়ের স্মরণীয় মুহূর্ত, জাতীয় ও মেধা তালিকায় স্থানপ্রাপ্ত কৃতি শিক্ষার্থী এবং বিশিষ্ট প্রাক্তন শিক্ষার্থীদের সচিত্র স্মৃতিমালা।',
              'An editorial visual gallery celebrating board toppers, science innovators, and distinguished alumni who illuminate the heritage of Bhojeshwar High School.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/achievements"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface hover:bg-surface-muted text-sm font-semibold text-primary border border-border hover:border-primary/40 transition-all group"
          >
            <span>{pick('সব কৃতি শিক্ষার্থী ও অর্জন', 'View All Stars & Achievements')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* =========================================================================
          THE ASYMMETRICAL EDITORIAL SCRAPBOOK CANVAS (Matches Reference Screenshot)
         ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1E252B] via-[#182025] to-[#12171B] border border-white/10 p-6 sm:p-8 lg:p-12 shadow-2xl text-slate-100">
        {/* Subtle Ambient Canvas Vignette & Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Desktop 12-Column Asymmetrical Grid / Mobile Responsive Staggered Layout */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 items-start">
          
          {/* =====================================================================
              LEFT CLUSTER (Columns 1 to 4)
              - Text Block 1 (Top)
              - Photo Frame 1 (Landscape)
              - Photo Frame 2 (Portrait with Bottom-Left Washi Tape)
             ===================================================================== */}
          <div className="lg:col-span-4 flex flex-col gap-8 justify-between">
            {/* Editorial Text Block 1 */}
            <div className="space-y-3 pt-2">
              <p className="font-serif italic text-2xl sm:text-3xl text-emerald-400 font-normal leading-tight">
                {pick('আমাদের সোনালী প্রজন্ম', 'Inspiring Excellence')}
              </p>
              <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed font-normal">
                {pick(
                  'ভোজেশ্বর উচ্চ বিদ্যালয়ের শিক্ষার্থীরা শুধু শ্রেণিকক্ষেই নয়, জাতীয় ও আঞ্চলিক পর্যায়ে বোর্ড মেধা তালিকা, বিজ্ঞান অলিম্পিয়াড ও বিতর্ক প্রতিযোগিতায় প্রতিনিয়ত শ্রেষ্ঠত্বের স্বাক্ষর রেখে চলেছে।',
                  'Our students consistently demonstrate excellence across board merit ranks, national science fairs, and debating championships, carrying forward decades of heritage.'
                )}
              </p>
            </div>

            {/* Photo Frame 1 (Landscape Polaroid) */}
            {f1 && (
              <PolaroidCard
                item={f1}
                aspectRatio="aspect-[16/11]"
                rotation="rotate-[-2deg]"
                pick={pick}
                onSelect={() => setSelectedStar(f1)}
              />
            )}

            {/* Photo Frame 2 (Portrait Polaroid with Washi Tape Banner) */}
            {f2 && (
              <div className="relative pt-2">
                <PolaroidCard
                  item={f2}
                  aspectRatio="aspect-[3/3.8]"
                  rotation="rotate-[1.8deg]"
                  pick={pick}
                  onSelect={() => setSelectedStar(f2)}
                />
                {/* Terracotta/Amber Washi Tape Sticker (as seen in screenshot) */}
                <div className="absolute -bottom-3 -left-2 z-20 px-3.5 py-1 bg-[#9B4D31] text-white text-[11px] font-bold rounded-sm shadow-lg rotate-[-3deg] tracking-wide pointer-events-none border-t border-white/20 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>{f2.batch ?? pick('বোর্ড মেধা বৃত্তি', 'Board Merit')}</span>
                </div>
              </div>
            )}
          </div>

          {/* =====================================================================
              CENTER CLUSTER (Columns 5 to 8)
              - Photo Frame 3 (Large Elevated Square Frame)
              - Photo Frame 4 (Offset Large Square Frame)
             ===================================================================== */}
          <div className="lg:col-span-4 flex flex-col gap-8 lg:-mt-3">
            {/* Photo Frame 3 (Elevated Hero Frame) */}
            {f3 && (
              <PolaroidCard
                item={f3}
                aspectRatio="aspect-square"
                rotation="rotate-[-1deg]"
                isElevated
                pick={pick}
                onSelect={() => setSelectedStar(f3)}
              />
            )}

            {/* Photo Frame 4 (Offset Staggered Frame) */}
            {f4 && (
              <div className="relative lg:pt-3">
                <PolaroidCard
                  item={f4}
                  aspectRatio="aspect-square"
                  rotation="rotate-[1.5deg]"
                  pick={pick}
                  onSelect={() => setSelectedStar(f4)}
                />
              </div>
            )}
          </div>

          {/* =====================================================================
              RIGHT CLUSTER (Columns 9 to 12)
              - Photo Frame 5 (Landscape Frame with Top Washi Tape)
              - Photo Frame 6 (Square Frame)
              - Text Block 2 (Bottom with CTA Button)
             ===================================================================== */}
          <div className="lg:col-span-4 flex flex-col gap-8 justify-between">
            {/* Photo Frame 5 (Landscape Polaroid with Top Washi Tape) */}
            {f5 && (
              <div className="relative">
                {/* Washi Tape Badge on Top Edge (as seen in screenshot) */}
                <div className="absolute -top-3.5 right-6 z-20 px-3.5 py-1 bg-[#23583C] text-white text-[11px] font-bold rounded-sm shadow-lg rotate-[2deg] tracking-wide pointer-events-none border-t border-white/20 flex items-center gap-1.5">
                  <GraduationCap className="w-3 h-3" />
                  <span>{f5.batch ?? pick('কৃতি অ্যালামনাই', 'Notable Alumni')}</span>
                </div>
                <PolaroidCard
                  item={f5}
                  aspectRatio="aspect-[16/11]"
                  rotation="rotate-[-1.8deg]"
                  pick={pick}
                  onSelect={() => setSelectedStar(f5)}
                />
              </div>
            )}

            {/* Photo Frame 6 (Square Frame) */}
            {f6 && (
              <PolaroidCard
                item={f6}
                aspectRatio="aspect-square"
                rotation="rotate-[1.2deg]"
                pick={pick}
                onSelect={() => setSelectedStar(f6)}
              />
            )}

            {/* Editorial Text Block 2 + CTA Button */}
            <div className="space-y-4 pt-2">
              <p className="font-serif italic text-2xl sm:text-3xl text-amber-300 font-normal leading-tight">
                {pick('অনুপ্রেরণাদায়ী দিকপাল', 'Hall of Achievement')}
              </p>
              <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed font-normal">
                {pick(
                  'আমাদের প্রাক্তন শিক্ষার্থীরা দেশ-বিদেশে সরকারি প্রশাসন, বিশ্ববিদ্যালয় শিক্ষকতা, বিজ্ঞান গবেষণা এবং সফটওয়্যার প্রযুক্তিতে সফলতার সাথে নেতৃত্ব দিয়ে বিদ্যালয়ের মুখ উজ্জ্বল করছেন।',
                  'Our alumni lead with honor in civil administration, university professorship, science research, and software entrepreneurship globally.'
                )}
              </p>
              <div className="pt-1">
                <Link href="/achievements">
                  <Button
                    variant="primary"
                    className="w-full sm:w-auto shadow-lg hover:shadow-primary/30"
                  >
                    <span>{pick('সকল কৃতি শিক্ষার্থী ও অর্জন দেখুন', 'Explore Full Hall of Fame')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Interactive Community Banner */}
        <div className="relative z-10 mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/15">
              <Users className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {pick(
                  'আপনিও কি ভোজেশ্বর উচ্চ বিদ্যালয়ের প্রাক্তন শিক্ষার্থী বা কৃতি অর্জনকারী?',
                  'Are you an alumnus or distinguished achiever of Bhojeshwar High School?'
                )}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {pick(
                  'আমাদের অ্যালামনাই ডিরেক্টরিতে নাম নিবন্ধন করুন অথবা আপনার সাফল্যগাথা শেয়ার করুন।',
                  'Register your profile in our alumni network or share your achievements with us.'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <Link href="/alumni" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors"
              >
                {pick('অ্যালামনাই নিবন্ধন', 'Join Alumni')}
              </button>
            </Link>
            <Link href="/achievements" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{pick('অর্জন বিবরণী', 'Achievements')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE LIGHTBOX MODAL (Click any photo to view story)
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
                <div className="sm:col-span-5 relative aspect-square sm:aspect-auto min-h-[240px] bg-neutral-900">
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
                          <span>{pick('বিশিষ্ট প্রাক্তন শিক্ষার্থী', 'Notable Alumni')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{pick('কৃতি শিক্ষার্থী', 'Student Star')}</span>
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
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>{pick('সকল অর্জন তালিকায় দেখুন', 'View in Achievements list')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStar(null)}
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

{/* =========================================================================
    POLAROID CARD COMPONENT (With White Passe-partout Frame & Tilt Dynamics)
   ========================================================================= */}
interface PolaroidCardProps {
  item: Achievement;
  aspectRatio: string;
  rotation: string;
  isElevated?: boolean;
  pick: (bn: string, en?: string) => string;
  onSelect: () => void;
}

function PolaroidCard({
  item,
  aspectRatio,
  rotation,
  isElevated,
  pick,
  onSelect,
}: PolaroidCardProps) {
  const photoSrc = item.image || '/images/teacher_kamrul_portrait_1795155721415.jpg';
  const isAlumni = item.type === AchievementType.NOTABLE_ALUMNI;

  return (
    <motion.div
      whileHover={{ scale: 1.03, rotate: 0, zIndex: 30 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      onClick={onSelect}
      className={`group cursor-pointer select-none bg-white text-slate-900 p-2.5 sm:p-3 pb-4 sm:pb-5 rounded-sm shadow-xl transition-shadow hover:shadow-2xl hover:shadow-black/40 ${rotation} ${
        isElevated ? 'lg:scale-[1.03] lg:z-10' : ''
      }`}
    >
      {/* Inner Image Container with Vignette */}
      <div className={`relative ${aspectRatio} w-full overflow-hidden bg-neutral-100 rounded-[2px]`}>
        <img
          src={photoSrc}
          alt={item.personName ?? item.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Hover Click-to-Expand Indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-sm text-white text-xs font-semibold shadow-md">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{pick('বিস্তারিত দেখুন', 'View Details')}</span>
          </span>
        </div>

        {/* Mini Corner Badge */}
        <div className="absolute top-2 left-2">
          {isAlumni ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/95 text-white shadow-sm backdrop-blur-sm">
              <GraduationCap className="w-3 h-3" />
              <span>{pick('অ্যালামনাই', 'Alumni')}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0D6236]/95 text-white shadow-sm backdrop-blur-sm">
              <Sparkles className="w-3 h-3" />
              <span>{pick('কৃতি শিক্ষার্থী', 'Star')}</span>
            </span>
          )}
        </div>
      </div>

      {/* Polaroid Bottom Caption Area (White Board) */}
      <div className="pt-3 px-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-900 leading-tight truncate">
            {item.personName}
          </p>
          {item.batch && (
            <span className="text-[11px] font-semibold text-slate-500 tabular-nums shrink-0">
              {item.batch}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600 line-clamp-1 leading-snug">
          {item.title}
        </p>
      </div>
    </motion.div>
  );
}
