'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Award,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  LogIn,
  Search,
  X,
} from 'lucide-react';
import type { MockDatabase } from '@/src/mocks/seed';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { getCampusPhoto } from '@/src/components/shared/Feedback';
import { NoticeTickerBar } from '@/src/components/layout/PublicLayout';
import { NoticeStatus, ResultPublicationStatus } from '@/src/types/enums';
import { cn } from '@/src/lib/utils/cn';

const SLIDE_DURATION_MS = 6500;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const HERO_SLIDE_VARIANTS = {
  enter: (direction: number) => ({
    x: direction >= 0 ? '100%' : '-100%',
    scale: 1.04,
    zIndex: 2,
  }),
  center: {
    x: '0%',
    scale: 1,
    zIndex: 2,
    transition: {
      x: { duration: 0.85, ease: EASE_OUT },
      scale: { duration: 1.2, ease: EASE_OUT },
    },
  },
  exit: (direction: number) => ({
    x: direction >= 0 ? '-24%' : '24%',
    scale: 1,
    zIndex: 1,
    transition: {
      x: { duration: 0.85, ease: EASE_OUT },
    },
  }),
};

interface HomeHeroSectionProps {
  db: MockDatabase;
}

export function HomeHeroSection({ db }: HomeHeroSectionProps) {
  const { locale, pick } = useI18n();
  const router = useRouter();

  const [slideIndex, setSlideIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [quickResultOpen, setQuickResultOpen] = useState(false);
  const heroHoverRef = useRef(false);
  const quickResultOpenRef = useRef(false);
  quickResultOpenRef.current = quickResultOpen;
  const elapsedMsRef = useRef(0);
  const progressBarRef = useRef<HTMLSpanElement | null>(null);

  const [quickExamId, setQuickExamId] = useState('');
  const [quickClassId, setQuickClassId] = useState('');
  const [quickRoll, setQuickRoll] = useState('');

  const heroSlides = useMemo(() => {
    const active = db.banners
      .filter((b) => b.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const fallbackSlides = [
      {
        id: 'slide-heritage',
        title: db.schoolProfile.name || 'ভোজেশ্বর উচ্চ বিদ্যালয়',
        subtitle: pick(
          '১৯৭৮ সাল থেকে শরীয়তপুরের নড়িয়া উপজেলার ভোজেশ্বরে ঐতিহ্য, শৃঙ্খলা ও মানসম্মত মাধ্যমিক শিক্ষার আলোকবর্তিকা।',
          'A beacon of academic excellence, discipline, and quality secondary education in Bhojeshwar, Noria, Shariatpur since 1978.'
        ),
        image: 'campus-heritage',
        link: '/about',
        ctaBn: 'বিদ্যালয় পরিচিতি',
        ctaEn: 'Explore Heritage',
        shortBn: 'ক্যাম্পাস ঐতিহ্য',
        shortEn: 'Heritage Campus',
      },
      {
        id: 'slide-digital',
        title: pick(
          'ডিজিটাল স্মার্ট শ্রেণিকক্ষ ও আধুনিক পাঠদান',
          'Smart Digital Classrooms & Modern Pedagogy'
        ),
        subtitle: pick(
          'মাল্টিমিডিয়া প্রজেক্টর, ইন্টারেক্টিভ কনটেন্ট ও অনলাইন রিসোর্স লাইব্রেরির মাধ্যমে ৬ষ্ঠ–১০ম শ্রেণির শিক্ষার্থীদের যুগোপযোগী প্রস্তুতি।',
          'Preparing Classes 6–10 through multimedia smart classrooms, curated digital resources, and interactive assessments.'
        ),
        image: 'digital-classroom',
        link: '/academics/resources',
        ctaBn: 'ডিজিটাল রিসোর্স',
        ctaEn: 'Digital Resources',
        shortBn: 'স্মার্ট শ্রেণিকক্ষ',
        shortEn: 'Smart Classroom',
      },
      {
        id: 'slide-science',
        title: pick(
          'সুসজ্জিত বিজ্ঞান গবেষণাগার ও আইসিটি ল্যাব',
          'Modern Science Laboratories & ICT Center'
        ),
        subtitle: pick(
          'পদার্থ, রসায়ন, জীববিজ্ঞান ও তথ্যপ্রযুক্তিতে হাতে-কলমে ব্যবহারিক শিক্ষার পূর্ণাঙ্গ সুবিধা।',
          'Hands-on practical education across Physics, Chemistry, Biology, and Information & Communication Technology.'
        ),
        image: 'science-lab',
        link: '/about/facilities',
        ctaBn: 'ল্যাব ও সুবিধা দেখুন',
        ctaEn: 'View Facilities',
        shortBn: 'বিজ্ঞান ও আইসিটি ল্যাব',
        shortEn: 'Science & ICT Lab',
      },
      {
        id: 'slide-library',
        title: pick(
          'সমৃদ্ধ পাঠাগার ও সহশিক্ষা কার্যক্রম',
          'Enriched Library & Co-Curricular Excellence'
        ),
        subtitle: pick(
          'বিতর্ক, বিজ্ঞান মেলা, স্কাউটিং ও বার্ষিক ক্রীড়া প্রতিযোগিতার মাধ্যমে শিক্ষার্থীদের সর্বাঙ্গীণ মেধা বিকাশ।',
          'Nurturing well-rounded learners through our sunlit reading room, debate club, science fairs, and athletics.'
        ),
        image: 'library-room',
        link: '/academics/library',
        ctaBn: 'পাঠাগার দেখুন',
        ctaEn: 'Explore Library',
        shortBn: 'পাঠাগার ও সহশিক্ষা',
        shortEn: 'Library & Clubs',
      },
    ];

    const resolveSlideCta = (
      link: string,
      fb: (typeof fallbackSlides)[number]
    ): { ctaBn: string; ctaEn: string } => {
      if (link === '/about') return { ctaBn: 'বিদ্যালয় পরিচিতি', ctaEn: 'About School' };
      if (link === '/results') return { ctaBn: 'অনলাইন ফলাফল', ctaEn: 'Online Results' };
      if (link === '/academics/resources') return { ctaBn: 'ডিজিটাল রিসোর্স', ctaEn: 'Digital Resources' };
      if (link === '/about/facilities') return { ctaBn: 'ল্যাব ও সুবিধা দেখুন', ctaEn: 'View Facilities' };
      if (link === '/academics/library') return { ctaBn: 'পাঠাগার দেখুন', ctaEn: 'Explore Library' };
      if (link === '/admission' || link === '/admission/guidelines') {
        return { ctaBn: 'ভর্তি তথ্য দেখুন', ctaEn: 'Admission Info' };
      }
      return { ctaBn: fb.ctaBn, ctaEn: fb.ctaEn };
    };

    if (active.length >= 3) {
      return active.map((b, i) => {
        const fb = fallbackSlides[i % fallbackSlides.length];
        const link = b.link || fb.link;
        const cta = resolveSlideCta(link, fb);
        return {
          id: b.id,
          title: b.title,
          subtitle: b.subtitle ?? fb.subtitle,
          image: b.image || fb.image,
          link,
          ctaBn: cta.ctaBn,
          ctaEn: cta.ctaEn,
          shortBn: fb.shortBn,
          shortEn: fb.shortEn,
        };
      });
    }

    const merged = active.map((b, idx) => {
      const fb = fallbackSlides[idx % fallbackSlides.length];
      const link = b.link || fb.link;
      const cta = resolveSlideCta(link, fb);
      return {
        id: b.id,
        title: b.title,
        subtitle: b.subtitle ?? fb.subtitle,
        image: b.image || fb.image,
        link,
        ctaBn: cta.ctaBn,
        ctaEn: cta.ctaEn,
        shortBn: fb.shortBn,
        shortEn: fb.shortEn,
      };
    });

    const usedImages = new Set(merged.map((m) => m.image));
    for (const s of fallbackSlides) {
      if (!usedImages.has(s.image) && merged.length < 4) {
        merged.push(s);
        usedImages.add(s.image);
      }
    }
    return merged;
  }, [db, pick]);

  const publishedExams = useMemo(
    () =>
      (db.exams ?? []).filter(
        (e) => e.resultStatus === ResultPublicationStatus.PUBLISHED && !e.isDeleted
      ),
    [db]
  );

  const activeClasses = useMemo(
    () =>
      (db.classes ?? [])
        .filter((c) => c.isActive)
        .sort((a, b) => a.numericValue - b.numericValue),
    [db]
  );

  useEffect(() => {
    if (!quickExamId && publishedExams.length > 0) {
      setQuickExamId(publishedExams[0].id);
      setQuickClassId(publishedExams[0].classId);
    }
  }, [publishedExams, quickExamId]);

  useEffect(() => {
    heroSlides.forEach((slide) => {
      const img = new window.Image();
      img.src = getCampusPhoto(slide.image).src;
    });
  }, [heroSlides]);

  const navigateSlide = useCallback(
    (nextIndex: number, direction?: number) => {
      if (heroSlides.length <= 1) return;
      const total = heroSlides.length;
      const normalized = ((nextIndex % total) + total) % total;
      setSlideIndex((prev) => {
        const computedDir =
          direction !== undefined ? direction : normalized >= prev ? 1 : -1;
        setSlideDirection(computedDir);
        return normalized;
      });
      elapsedMsRef.current = 0;
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = 'scaleX(0)';
      }
    },
    [heroSlides.length]
  );

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = Math.min(now - lastTime, 100);
      lastTime = now;

      if (!heroHoverRef.current && !quickResultOpenRef.current) {
        elapsedMsRef.current += delta;
        const progress = Math.min(elapsedMsRef.current / SLIDE_DURATION_MS, 1);
        if (progressBarRef.current) {
          progressBarRef.current.style.transform = `scaleX(${progress})`;
        }
        if (elapsedMsRef.current >= SLIDE_DURATION_MS) {
          elapsedMsRef.current = 0;
          if (progressBarRef.current) {
            progressBarRef.current.style.transform = 'scaleX(0)';
          }
          setSlideDirection(1);
          setSlideIndex((prev) => (prev + 1) % heroSlides.length);
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [heroSlides.length]);

  const handleQuickResultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (quickExamId) params.set('examId', quickExamId);
    if (quickClassId) params.set('classId', quickClassId);
    if (quickRoll.trim()) params.set('roll', quickRoll.trim());
    router.push(`/results?${params.toString()}`);
  };

  const safeSlideIdx = slideIndex % Math.max(1, heroSlides.length);
  const currentSlide = heroSlides[safeSlideIdx];
  const currentHeroPhoto = getCampusPhoto(currentSlide?.image);
  const yearsSinceEst = 2026 - (db.schoolProfile.establishedYear ?? 1978);

  return (
    <div>
      <section
        className="relative overflow-hidden bg-[#061F12] text-white min-h-[640px] lg:min-h-[660px] lg:h-[calc(100vh-40px)] lg:max-h-[820px] flex flex-col justify-between"
        onMouseEnter={() => {
          heroHoverRef.current = true;
        }}
        onMouseLeave={() => {
          heroHoverRef.current = false;
        }}
      >
        {/* Full-Bleed Direct Overlapping Slide Photography */}
        <div className="absolute inset-0 overflow-hidden bg-[#061F12]">
          <AnimatePresence initial={false} custom={slideDirection}>
            <motion.div
              key={currentSlide?.id ?? 'default'}
              custom={slideDirection}
              variants={HERO_SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 will-change-transform"
            >
              <img
                src={currentHeroPhoto.src}
                alt={locale === 'bn' ? currentHeroPhoto.altBn : currentHeroPhoto.altEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 z-[3] pointer-events-none bg-gradient-to-r from-[#051B0F]/88 via-[#051B0F]/48 to-transparent" />
          <div className="absolute inset-0 z-[3] pointer-events-none bg-gradient-to-t from-[#04170D]/90 via-[#04170D]/15 to-[#04170D]/36" />
        </div>

        {/* Main Open Editorial Stage */}
        <div className="relative z-10 max-w-[1440px] mx-auto w-full px-4 sm:px-6 pt-24 pb-6 lg:pt-28 lg:pb-8 flex-1 flex flex-col justify-end lg:justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end w-full">
            <div className="lg:col-span-8 space-y-5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-medium text-white/85 tabular-nums">
                <span className="font-semibold tracking-wider text-white">BHS</span>
                <span className="text-white/40" aria-hidden="true">·</span>
                <span>{pick('স্থাপিত: ১৯৭৮ খ্রি.', 'Est. 1978')}</span>
                <span className="text-white/40" aria-hidden="true">·</span>
                <span>EIIN: {db.schoolProfile.eiin ?? '113587'}</span>
                <span className="text-white/40" aria-hidden="true">·</span>
                <span>{pick('ভোজেশ্বর, নড়িয়া, শরীয়তপুর', 'Bhojeshwar, Noria, Shariatpur')}</span>
              </div>

              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={`hero-copy-${currentSlide?.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: EASE_OUT }}
                  className="space-y-3.5"
                >
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15] tracking-tight text-white drop-shadow-xs">
                    {currentSlide?.title ?? db.schoolProfile.name}
                  </h1>
                  <p className="text-base sm:text-lg text-white/90 leading-relaxed max-w-xl">
                    <span className="text-white font-semibold">
                      “{db.schoolProfile.motto ?? 'শিক্ষাই আলো, জ্ঞানই শক্তি'}”
                    </span>{' '}
                    — {currentSlide?.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href="/admission/apply">
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 px-5 py-3 text-base font-semibold rounded-[var(--radius)] bg-primary text-primary-foreground hover:opacity-92 transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-black/25"
                  >
                    <span>{pick('অনলাইন ভর্তি আবেদন', 'Apply for Admission')}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </Link>
                <Link href={currentSlide?.link ?? '/about'}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-5 py-3 text-base font-medium rounded-[var(--radius)] bg-white/10 hover:bg-white/18 text-white border border-white/25 backdrop-blur-md transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>
                      {locale === 'bn'
                        ? currentSlide?.ctaBn ?? 'বিদ্যালয় পরিচিতি'
                        : currentSlide?.ctaEn ?? 'Explore Campus'}
                    </span>
                  </button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-2 text-sm text-white/80 tabular-nums">
                <span>
                  <strong className="text-white font-semibold">
                    {formatNumber(yearsSinceEst, locale)}+
                  </strong>{' '}
                  {pick('বছরের গৌরবময় ঐতিহ্য', 'Years of Excellence')}
                </span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>
                  <strong className="text-white font-semibold">
                    {pick('৬ষ্ঠ–১০ম শ্রেণি', `Classes 6–10`)}
                  </strong>{' '}
                  {pick('(বিজ্ঞান · মানবিক · ব্যবসায়)', '(Science · Humanities · Business)')}
                </span>
                <span className="text-white/30 hidden sm:inline" aria-hidden="true">|</span>
                <span className="hidden sm:inline">
                  <strong className="text-white font-semibold">
                    {formatNumber(db.staff.length, locale)}+
                  </strong>{' '}
                  {pick('শিক্ষক ও কর্মচারী', 'Faculty & Staff')}
                </span>
              </div>
            </div>

            {heroSlides.length > 1 && (
              <div className="lg:col-span-4 flex flex-col lg:items-end justify-end gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white/75 tabular-nums mr-1">
                    {formatNumber(safeSlideIdx + 1, locale)} /{' '}
                    {formatNumber(heroSlides.length, locale)}
                  </span>
                  <button
                    type="button"
                    aria-label={pick('পূর্ববর্তী স্লাইড', 'Previous slide')}
                    onClick={() => navigateSlide(safeSlideIdx - 1, -1)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={pick('পরবর্তী স্লাইড', 'Next slide')}
                    onClick={() => navigateSlide(safeSlideIdx + 1, 1)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 w-full lg:max-w-[320px]">
                  {heroSlides.map((slide, idx) => {
                    const active = idx === safeSlideIdx;
                    const thumb = getCampusPhoto(slide.image);
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => {
                          if (idx !== safeSlideIdx) {
                            navigateSlide(idx, idx > safeSlideIdx ? 1 : -1);
                          }
                        }}
                        className={cn(
                          'group relative rounded-lg p-1.5 text-left transition-all cursor-pointer overflow-hidden backdrop-blur-md border',
                          active
                            ? 'bg-white/18 border-white/45'
                            : 'bg-black/28 border-white/12 hover:bg-white/12 hover:border-white/25'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={thumb.src}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-8 w-10 rounded object-cover shrink-0 opacity-90 group-hover:opacity-100"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-white/65 tabular-nums leading-none">
                              {formatNumber(idx + 1, locale).padStart(2, locale === 'bn' ? '০' : '0')}
                            </p>
                            <p className="text-xs font-medium text-white truncate mt-0.5">
                              {locale === 'bn' ? slide.shortBn : slide.shortEn}
                            </p>
                          </div>
                        </div>
                        {active && (
                          <span
                            ref={(el) => {
                              progressBarRef.current = el;
                              if (el) {
                                const currentRatio = Math.min(
                                  elapsedMsRef.current / SLIDE_DURATION_MS,
                                  1
                                );
                                el.style.transform = `scaleX(${currentRatio})`;
                              }
                            }}
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-white origin-left block will-change-transform"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Floating Frosted-Glass Smart Quick Dock */}
        <div className="relative z-20 max-w-[1440px] mx-auto w-full px-4 sm:px-6 pb-5 lg:pb-6">
          <AnimatePresence>
            {quickResultOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="mb-2.5 max-w-2xl glass-dark rounded-xl p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-white/15">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-white/85" />
                    <h2 className="text-base font-semibold text-white">
                      {pick('তাৎক্ষণিক প্রকাশিত ফলাফল অনুসন্ধান', 'Instant Published Result Lookup')}
                    </h2>
                  </div>
                  <button
                    type="button"
                    aria-label={pick('বন্ধ করুন', 'Close')}
                    onClick={() => setQuickResultOpen(false)}
                    className="h-7 w-7 rounded-md inline-flex items-center justify-center text-white/75 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    setQuickResultOpen(false);
                    handleQuickResultSubmit(e);
                  }}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
                >
                  <div className="sm:col-span-5">
                    <label
                      htmlFor="hero-exam"
                      className="block text-sm font-medium text-white/85 mb-1"
                    >
                      {pick('প্রকাশিত পরীক্ষা', 'Published Exam')}
                    </label>
                    <select
                      id="hero-exam"
                      value={quickExamId}
                      onChange={(e) => {
                        setQuickExamId(e.target.value);
                        const match = publishedExams.find((ex) => ex.id === e.target.value);
                        if (match) setQuickClassId(match.classId);
                      }}
                      className="w-full h-10 px-3 text-sm rounded-lg bg-white/10 border border-white/20 text-white focus:bg-[#072A17] focus:outline-none focus:border-white/50"
                    >
                      {publishedExams.map((ex) => (
                        <option key={ex.id} value={ex.id} className="bg-[#072A17] text-white">
                          {ex.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="hero-class"
                      className="block text-sm font-medium text-white/85 mb-1"
                    >
                      {pick('শ্রেণি', 'Class')}
                    </label>
                    <select
                      id="hero-class"
                      value={quickClassId}
                      onChange={(e) => setQuickClassId(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg bg-white/10 border border-white/20 text-white focus:bg-[#072A17] focus:outline-none focus:border-white/50"
                    >
                      {activeClasses.map((cls) => (
                        <option key={cls.id} value={cls.id} className="bg-[#072A17] text-white">
                          {locale === 'bn' ? cls.nameBn ?? cls.name : cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="hero-roll"
                      className="block text-sm font-medium text-white/85 mb-1"
                    >
                      {pick('রোল', 'Roll')}
                    </label>
                    <input
                      id="hero-roll"
                      type="text"
                      value={quickRoll}
                      onChange={(e) => setQuickRoll(e.target.value)}
                      placeholder={pick('১ / ১০১', 'e.g. 1')}
                      className="w-full h-10 px-3 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:bg-[#072A17] focus:outline-none focus:border-white/50 tabular-nums"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="w-full h-10 inline-flex items-center justify-center gap-1.5 text-sm font-semibold rounded-lg bg-white text-[#093B1F] hover:bg-[#F2F5F3] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{pick('খুঁজুন', 'Search')}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="glass-dark rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/12 overflow-hidden">
            <button
              type="button"
              onClick={() => setQuickResultOpen((v) => !v)}
              aria-expanded={quickResultOpen}
              className={cn(
                'group px-4 py-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer',
                quickResultOpen ? 'bg-white/14' : 'hover:bg-white/10'
              )}
            >
              <div className="h-9 w-9 rounded-lg bg-white/12 border border-white/15 text-white flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {pick('তাৎক্ষণিক ফলাফল', 'Instant Results')}
                </p>
                <p className="text-[13px] sm:text-sm text-white/90 truncate">
                  {pick('রোল ও পরীক্ষা দিয়ে নম্বরপত্র', 'Search marksheet by roll')}
                </p>
              </div>
              <Search className="w-4 h-4 text-white/80 group-hover:text-white shrink-0 transition-colors" />
            </button>

            <Link
              href="/admission"
              className="group px-4 py-3.5 flex items-center gap-3 hover:bg-white/10 transition-colors"
            >
              <div className="h-9 w-9 rounded-lg bg-white/12 border border-white/15 text-white flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {pick('ভর্তি তথ্য ও স্ট্যাটাস', 'Admission & Status')}
                </p>
                <p className="text-[13px] sm:text-sm text-white/90 truncate">
                  {pick('আবেদন, প্রবেশপত্র ও যাচাই', 'Apply & track admission')}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/80 group-hover:text-white group-hover:translate-x-0.5 shrink-0 transition-all" />
            </Link>

            <Link
              href="/academics/routines"
              className="group px-4 py-3.5 flex items-center gap-3 hover:bg-white/10 transition-colors"
            >
              <div className="h-9 w-9 rounded-lg bg-white/12 border border-white/15 text-white flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {pick('ক্লাস ও পরীক্ষার রুটিন', 'Class & Exam Routines')}
                </p>
                <p className="text-[13px] sm:text-sm text-white/90 truncate">
                  {pick('৬ষ্ঠ–১০ম শ্রেণির সময়সূচি', 'Schedules for Classes 6–10')}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/80 group-hover:text-white group-hover:translate-x-0.5 shrink-0 transition-all" />
            </Link>

            <Link
              href="/login"
              className="group px-4 py-3.5 flex items-center gap-3 hover:bg-white/10 transition-colors"
            >
              <div className="h-9 w-9 rounded-lg bg-white/12 border border-white/15 text-white flex items-center justify-center shrink-0">
                <LogIn className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {pick('শিক্ষক ও অভিভাবক পোর্টাল', 'Teacher & Parent Portal')}
                </p>
                <p className="text-[13px] sm:text-sm text-white/90 truncate">
                  {pick('হাজিরা, নম্বর ও ড্যাশবোর্ড', 'Attendance, marks & portal')}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/65 group-hover:text-white group-hover:translate-x-0.5 shrink-0 transition-all" />
            </Link>
          </div>
        </div>
      </section>
      <NoticeTickerBar
        notices={db.notices
          .filter((n) => n.status === NoticeStatus.PUBLISHED)
          .slice(0, 6)}
      />
    </div>
  );
}
