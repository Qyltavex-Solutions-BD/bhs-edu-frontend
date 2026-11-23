'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  Laptop,
  Library,
  LogIn,
  Mail,
  MapPin,
  Maximize2,
  Paperclip,
  Phone,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useGetBootstrapQuery } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatBdt, formatDateLong, formatNumber } from '@/src/lib/formatters';
import {
  getCampusPhoto,
  getLeadershipPortrait,
  getNewsPhoto,
  getStaffPortrait,
  InstitutionalArtwork,
  LoadingSkeleton,
  SchoolEmblem,
} from '@/src/components/shared/Feedback';
import { SchoolCampusMap } from '@/src/components/shared/SchoolCampusMap';
import { Button, Card } from '@/src/components/ui/primitives';
import {
  AchievementType,
  NoticeStatus,
  ResultPublicationStatus,
  StaffStatus,
  StaffType,
} from '@/src/types/enums';
import type { Notice } from '@/src/types/entities';
import { NoticeTickerBar } from '@/src/components/layout/PublicLayout';
import {
  NoticeDocumentModal,
  downloadNoticeDocument,
} from '@/src/components/shared/NoticeDocumentViewer';
import { StarsMasonryAlbum } from '@/src/components/shared/StarsMasonryAlbum';
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

type NoticeTab = 'all' | 'urgent' | 'exam' | 'admission';

function getDateBadgeParts(isoDate: string | null | undefined, locale: 'bn' | 'en') {
  const date = isoDate ? new Date(isoDate) : new Date();
  const valid = Number.isNaN(date.getTime()) ? new Date() : date;
  const day = formatNumber(valid.getDate(), locale);
  const month = new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
    month: 'short',
  }).format(valid);
  const year = formatNumber(valid.getFullYear(), locale);
  return { day, month, year };
}

export function HomePage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const router = useRouter();

  // Hero Slider & Smart Dock State
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [quickResultOpen, setQuickResultOpen] = useState(false);
  const heroHoverRef = useRef(false);
  const quickResultOpenRef = useRef(false);
  quickResultOpenRef.current = quickResultOpen;
  const elapsedMsRef = useRef(0);
  const progressBarRef = useRef<HTMLSpanElement | null>(null);

  // Quick Result Lookup State (Smart Dock Popover)
  const [quickExamId, setQuickExamId] = useState('');
  const [quickClassId, setQuickClassId] = useState('');
  const [quickRoll, setQuickRoll] = useState('');

  // Institutional Notice Board State
  const [noticeTab, setNoticeTab] = useState<NoticeTab>('all');
  const [noticeQuery, setNoticeQuery] = useState('');
  const [previewNotice, setPreviewNotice] = useState<Notice | null>(null);

  // Gallery Lightbox State
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const heroSlides = useMemo(() => {
    if (!db) return [];
    const active = db.banners
      .filter((b) => b.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const fallbackSlides = [
      {
        id: 'slide-heritage',
        title:
          db.schoolProfile.name ||
          'ভোজেশ্বর উচ্চ বিদ্যালয়',
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

    // Merge seeded banners with rich campus slides so slider always showcases multiple campus photographs
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
      (db?.exams ?? []).filter(
        (e) => e.resultStatus === ResultPublicationStatus.PUBLISHED && !e.isDeleted
      ),
    [db]
  );

  const activeClasses = useMemo(
    () =>
      (db?.classes ?? [])
        .filter((c) => c.isActive)
        .sort((a, b) => a.numericValue - b.numericValue),
    [db]
  );

  // Initialize default selectors once bootstrap data loads
  useEffect(() => {
    if (!quickExamId && publishedExams.length > 0) {
      setQuickExamId(publishedExams[0].id);
      setQuickClassId(publishedExams[0].classId);
    }
  }, [publishedExams, quickExamId]);

  // Preload all hero campus photographs once mounted so slide transitions never flash
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

  // Synchronized rAF clock: freezes at exact progress % on hover and resumes seamlessly
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

  const publishedNotices = useMemo(() => {
    const all = (db?.notices ?? []).filter((n) => n.status === NoticeStatus.PUBLISHED);
    return all.filter((n) => {
      const text = `${n.memoNo ?? ''} ${n.title} ${n.description}`.toLowerCase();
      if (noticeQuery.trim() && !text.includes(noticeQuery.trim().toLowerCase())) {
        return false;
      }
      if (noticeTab === 'urgent') return n.isUrgent;
      if (noticeTab === 'exam') {
        return (
          text.includes('পরীক্ষা') ||
          text.includes('ফলাফল') ||
          text.includes('exam') ||
          text.includes('result') ||
          text.includes('রুটিন')
        );
      }
      if (noticeTab === 'admission') {
        return (
          text.includes('ভর্তি') ||
          text.includes('admission') ||
          text.includes('ক্লাস') ||
          text.includes('সেশন')
        );
      }
      return true;
    });
  }, [db, noticeTab, noticeQuery]);

  const galleryShowcase = useMemo(() => {
    if (!db) return [];
    const publishedGalleries = db.galleries.filter((g) => g.isPublished);
    if (publishedGalleries.length === 0) return [];

    const combined: Array<{
      id: string;
      title: string;
      category: string;
      variant: string;
      to: string;
    }> = [];
    const usedMediaIds = new Set<string>();

    // 1. Primary cover image from each published photo album (ordered by sortOrder)
    for (const gal of publishedGalleries) {
      const albumImages = [...db.galleryMedia.filter((m) => m.galleryId === gal.id && m.mediaType === 'IMAGE')].sort(
        (a, b) => a.sortOrder - b.sortOrder
      );
      const cover = albumImages[0];
      if (!cover) continue;
      usedMediaIds.add(cover.id);
      combined.push({
        id: gal.id,
        title: gal.title,
        category: gal.category ?? pick('ক্যাম্পাস', 'Campus'),
        variant: cover.mediaUrl,
        to: `/gallery/${gal.id}`,
      });
    }

    // 2. Additional published photos from published albums before static fallbacks
    if (combined.length < 5) {
      for (const gal of publishedGalleries) {
        const extraAlbumImages = [
          ...db.galleryMedia.filter(
            (m) => m.galleryId === gal.id && m.mediaType === 'IMAGE' && !usedMediaIds.has(m.id)
          ),
        ].sort((a, b) => a.sortOrder - b.sortOrder);
        for (const media of extraAlbumImages) {
          if (combined.length >= 5) break;
          usedMediaIds.add(media.id);
          combined.push({
            id: media.id,
            title: media.caption || gal.title,
            category: gal.category ?? pick('ক্যাম্পাস', 'Campus'),
            variant: media.mediaUrl,
            to: `/gallery/${gal.id}`,
          });
        }
      }
    }

    const extraVisuals = [
      {
        id: 'vis-classroom',
        title: pick('মাল্টিমিডিয়া স্মার্ট শ্রেণিকক্ষ', 'Multimedia Smart Classroom'),
        category: pick('ডিজিটাল শিক্ষা', 'Digital Learning'),
        variant: 'digital-classroom',
        to: '/about/facilities',
      },
      {
        id: 'vis-lab',
        title: pick('বিজ্ঞান ও আইসিটি গবেষণাগার', 'Science & ICT Laboratory'),
        category: pick('গবেষণাগার', 'Laboratory'),
        variant: 'science-lab',
        to: '/about/facilities',
      },
      {
        id: 'vis-library',
        title: pick('বিদ্যালয় পাঠাগার', 'School Reading Library'),
        category: pick('পাঠাগার', 'Library'),
        variant: 'library-room',
        to: '/academics/library',
      },
      {
        id: 'vis-sports',
        title: pick('বার্ষিক ক্রীড়া ও খেলার মাঠ', 'Annual Sports & Playground'),
        category: pick('সহশিক্ষা', 'Co-Curricular'),
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
  }, [db, pick]);

  if (isLoading || !db) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-24 pb-12">
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  const safeSlideIdx = slideIndex % Math.max(1, heroSlides.length);
  const currentSlide = heroSlides[safeSlideIdx];
  const currentHeroPhoto = getCampusPhoto(currentSlide?.image);

  const teachersPreview = db.staff
    .filter((s) => s.staffType === StaffType.TEACHER && s.status === StaffStatus.ACTIVE)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 4);

  const activeFacilities = db.facilities.filter((f) => f.isActive);
  const activeSectionsCount = db.sections.filter((s) => s.isActive).length;
  const publishedNews = [...db.news]
    .filter((n) => n.isPublished)
    .sort((a, b) => {
      const ta = new Date(a.publishedAt ?? a.createdAt).getTime();
      const tb = new Date(b.publishedAt ?? b.createdAt).getTime();
      return tb - ta;
    })
    .slice(0, 3);
  const upcomingEvents = [...db.events]
    .filter((e) => e.isPublished)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 4);
  const yearsSinceEst = 2026 - (db.schoolProfile.establishedYear ?? 1978);

  const presidentMsg =
    db.leadershipMessages.find((m) => m.type === 'CHAIRMAN' && m.isPublished) ||
    db.leadershipMessages[1];
  const principalMsg =
    db.leadershipMessages.find((m) => m.type === 'PRINCIPAL' && m.isPublished) ||
    db.leadershipMessages[0];

  const institutionStars = useMemo(() => {
    const publishedStars = db.achievements.filter(
      (a) =>
        a.isPublished &&
        (a.type === AchievementType.STUDENT_STAR || a.type === AchievementType.NOTABLE_ALUMNI)
    );
    if (publishedStars.length >= 6) {
      return publishedStars.slice(0, 6);
    }
    const fallbacks = [
      {
        id: 'fallback-star-1',
        title:
          locale === 'bn'
            ? 'এসএসসি পরীক্ষায় গোল্ডেন জিপিএ ৫.০০ ও বোর্ড মেধা বৃত্তি'
            : 'Golden GPA-5 in SSC & Board Merit Scholarship',
        type: AchievementType.STUDENT_STAR,
        personName: locale === 'bn' ? 'তানভীর হাসান' : 'Tanvir Hasan',
        batch: locale === 'bn' ? 'ব্যাচ ২০২৪' : 'Batch 2024',
        description:
          locale === 'bn'
            ? 'ঢাকা শিক্ষা বোর্ডে মেধা তালিকায় স্থান অর্জন এবং নড়িয়া উপজেলায় বিজ্ঞান বিভাগে সর্বোচ্চ নম্বর প্রাপ্তি। বর্তমানে নটর ডেম কলেজে একাদশ শ্রেণিতে অধ্যয়নরত।'
            : 'Dhaka Education Board merit recipient and top scorer in science group across Naria Upazila.',
        image: '/images/teacher_kamrul_portrait_1795155721415.jpg',
        achievedAt: '2024-05-12',
        isPublished: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'fallback-star-2',
        title:
          locale === 'bn'
            ? 'জাতীয় বিজ্ঞান অলিম্পিয়াড ও ইনোভেশন ফেয়ারে প্রথম স্থান'
            : 'Champion in National Science Olympiad & Innovation Fair',
        type: AchievementType.STUDENT_STAR,
        personName: locale === 'bn' ? 'সাদিয়া তাসনিম' : 'Sadia Tasnim',
        batch: locale === 'bn' ? 'ব্যাচ ২০২৫' : 'Batch 2025',
        description:
          locale === 'bn'
            ? 'স্মার্ট স্কুল এনার্জি ম্যানেজমেন্ট প্রকল্প উপস্থাপন করে জেলা পর্যায়ে প্রথম ও জাতীয় পর্যায়ে পদক অর্জন।'
            : 'Regional champion and national medalist for smart automated school energy management innovation.',
        image: '/images/teacher_sabina_portrait_1795155721585.jpg',
        achievedAt: '2025-09-18',
        isPublished: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'fallback-alumni-1',
        title:
          locale === 'bn'
            ? 'অধ্যাপক ও গবেষক, বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (বুয়েট)'
            : 'Professor & Researcher, BUET',
        type: AchievementType.NOTABLE_ALUMNI,
        personName: locale === 'bn' ? 'ড. রফিকুল ইসলাম' : 'Dr. Rafiqul Islam',
        batch: locale === 'bn' ? 'ব্যাচ ১৯৯৬' : 'Batch 1996',
        description:
          locale === 'bn'
            ? 'নবায়নযোগ্য শক্তি প্রযুক্তিতে আন্তর্জাতিক গবেষক ও বিদ্যালয়ের আধুনিক বিজ্ঞান ল্যাব প্রতিষ্ঠার সম্মানিত পৃষ্ঠপোষক।'
            : 'International researcher in renewable energy and valued alumni patron for modernising school science facilities.',
        image: '/images/teacher_debashish_portrait_1795155721385.jpg',
        achievedAt: '2023-11-05',
        isPublished: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'fallback-alumni-2',
        title:
          locale === 'bn'
            ? 'সিনিয়র সহকারী সচিব, জনপ্রশাসন মন্ত্রণালয় (৩৬তম বিসিএস)'
            : 'Senior Assistant Secretary, Ministry of Public Administration',
        type: AchievementType.NOTABLE_ALUMNI,
        personName: locale === 'bn' ? 'ফারহানা ইয়াসমিন' : 'Farhana Yasmin',
        batch: locale === 'bn' ? 'ব্যাচ ২০০৬' : 'Batch 2006',
        description:
          locale === 'bn'
            ? '৩৬তম বিসিএস (প্রশাসন) ক্যাডারে কৃতিত্বের সাথে উত্তীর্ণ হয়ে নিষ্ঠার সাথে দেশসেবায় নিয়োজিত ও নারী শিক্ষার অনুপ্রেরণা।'
            : 'Ranked in 36th BCS Administration cadre, actively serving public administration and mentoring female scholars.',
        image: '/images/teacher_anupama_portrait_1795155720897.jpg',
        achievedAt: '2022-07-15',
        isPublished: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'fallback-alumni-3',
        title:
          locale === 'bn'
            ? 'চিফ সফটওয়্যার আর্কিটেক্ট ও টেক এন্টারপ্রেনার'
            : 'Chief Software Architect & Tech Entrepreneur',
        type: AchievementType.NOTABLE_ALUMNI,
        personName: locale === 'bn' ? 'মাহমুদুল হাসান' : 'Mahmudul Hasan',
        batch: locale === 'bn' ? 'ব্যাচ ২০০১' : 'Batch 2001',
        description:
          locale === 'bn'
            ? 'আন্তর্জাতিক ফিনটেক প্ল্যাটফর্মের শীর্ষ প্রকৌশলী এবং বিদ্যালয়ের আইসিটি ল্যাব ও শিক্ষার্থীদের কোডিং ক্লাবের নিয়মিত পৃষ্ঠপোষক।'
            : 'International fintech principal engineer and patron for BHS ICT lab & student coding workshops.',
        image: '/images/teacher_mahmudul_portrait_1795155721712.jpg',
        achievedAt: '2024-02-10',
        isPublished: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'fallback-star-3',
        title:
          locale === 'bn'
            ? 'জাতীয় আন্তঃস্কুল বিতর্ক প্রতিযোগিতায় সেরা বক্তা ও চ্যাম্পিয়ন'
            : 'Best Speaker & Champion in National Inter-School Debate',
        type: AchievementType.STUDENT_STAR,
        personName: locale === 'bn' ? 'নুসরাত জাহান' : 'Nusrat Jahan',
        batch: locale === 'bn' ? 'ব্যাচ ২০২৩' : 'Batch 2023',
        description:
          locale === 'bn'
            ? 'জাতীয় টেলিভিশন বিতর্ক প্রতিযোগিতায় ঢাকা বিভাগের চ্যাম্পিয়ন এবং এসএসসিতে গোল্ডেন জিপিএ ৫.০০ প্রাপ্ত কৃতি শিক্ষার্থী।'
            : 'Dhaka division television debate champion and Golden GPA-5 recipient in SSC examination.',
        image: '/images/committee_rehana_portrait_1795170999363.jpg',
        achievedAt: '2023-08-20',
        isPublished: true,
        createdAt: '',
        updatedAt: '',
      },
    ];
    const combined = [...publishedStars];
    for (const fb of fallbacks) {
      if (combined.length >= 6) break;
      if (!combined.some((item) => item.id === fb.id || item.personName === fb.personName)) {
        combined.push(fb);
      }
    }
    return combined.slice(0, 6);
  }, [db.achievements, locale]);

  const academicStreams = [
    {
      index: '০১',
      indexEn: '01',
      levelBn: '৬ষ্ঠ – ৮ম শ্রেণি',
      levelEn: 'Classes 6 – 8',
      titleBn: 'নিম্ন মাধ্যমিক স্তর',
      titleEn: 'Junior Secondary',
      descBn:
        'বাংলা, ইংরেজি, গণিত, সাধারণ বিজ্ঞান ও আইসিটি-তে সুদৃঢ় মৌলিক ভিত্তি গঠন এবং নিয়মিত শ্রেণি মূল্যায়ন।',
      descEn:
        'Strong foundational mastery in Bangla, English, Mathematics, General Science, and ICT with regular assessments.',
      highlightBn: 'এনসিটিবি পাঠ্যক্রম · সৃজনশীল পাঠদান',
      highlightEn: 'NCTB curriculum · Guided mentoring',
      ctaBn: 'শ্রেণি ও রুটিন',
      ctaEn: 'Classes & Routines',
      to: '/academics/classes',
      icon: BookOpen,
    },
    {
      index: '০২',
      indexEn: '02',
      levelBn: '৯ম – ১০ম শ্রেণি',
      levelEn: 'Classes 9 – 10',
      titleBn: 'বিজ্ঞান বিভাগ',
      titleEn: 'Science Stream',
      descBn:
        'পদার্থ, রসায়ন, জীববিজ্ঞান ও উচ্চতর গণিতে হাতে-কলমে ব্যবহারিক ল্যাব ক্লাস ও নিবিড় এসএসসি মডেল টেস্ট।',
      descEn:
        'Hands-on laboratory practicals in Physics, Chemistry, Biology, and Higher Math with structured SSC preparation.',
      highlightBn: 'ব্যবহারিক বিজ্ঞান ও আইসিটি ল্যাব',
      highlightEn: 'Dedicated science & ICT labs',
      ctaBn: 'ল্যাব ও সুবিধা',
      ctaEn: 'Labs & Facilities',
      to: '/about/facilities',
      icon: FlaskConical,
    },
    {
      index: '০৩',
      indexEn: '03',
      levelBn: '৯ম – ১০ম শ্রেণি',
      levelEn: 'Classes 9 – 10',
      titleBn: 'মানবিক বিভাগ',
      titleEn: 'Humanities Stream',
      descBn:
        'ইতিহাস, ভূগোল, পৌরনীতি ও অর্থনীতির বিশ্লেষণধর্মী শিক্ষা, সমৃদ্ধ পাঠাগার চর্চা ও সহশিক্ষা বিকাশ।',
      descEn:
        'Analytical learning across History, Geography, Civics, and Economics paired with library research and debate.',
      highlightBn: 'সমৃদ্ধ পাঠাগার · বিতর্ক ও সাহিত্য ক্লাব',
      highlightEn: 'Reading library · Debate & literacy',
      ctaBn: 'পাঠ্যসূচি দেখুন',
      ctaEn: 'View Syllabus',
      to: '/academics/syllabus',
      icon: Globe,
    },
    {
      index: '০৪',
      indexEn: '04',
      levelBn: '৯ম – ১০ম শ্রেণি',
      levelEn: 'Classes 9 – 10',
      titleBn: 'ব্যবসায় শিক্ষা বিভাগ',
      titleEn: 'Business Studies',
      descBn:
        'হিসাববিজ্ঞান, ফিন্যান্স, ব্যাংকিং ও ব্যবসায় উদ্যোগে বাস্তবমুখী অনুশীলন ও বোর্ড পরীক্ষার সুশৃঙ্খল প্রস্তুতি।',
      descEn:
        'Practical foundations in Accounting, Finance, Banking, and Entrepreneurship tailored for SSC board excellence.',
      highlightBn: 'বাস্তব হিসাব অনুশীলন · বোর্ড প্রস্তুতি',
      highlightEn: 'Applied accounting · Exam coaching',
      ctaBn: 'পরীক্ষার ফলাফল',
      ctaEn: 'Board Results',
      to: '/results',
      icon: Briefcase,
    },
  ];

  const whyStudyHighlights = [
    {
      id: 'faculty',
      icon: GraduationCap,
      badgeBn: 'দক্ষ শিক্ষকমণ্ডলী',
      badgeEn: 'Expert Faculty',
      titleBn: 'অভিজ্ঞ ও সরকারি প্রশিক্ষণপ্রাপ্ত শিক্ষক',
      titleEn: 'Experienced & Certified Faculty',
      descBn:
        'বোর্ড ও সরকারি প্রশিক্ষণপ্রাপ্ত অভিজ্ঞ শিক্ষকমণ্ডলী দ্বারা আন্তরিক পাঠদান, নিয়মিত বিষয়ভিত্তিক মূল্যায়ন এবং দুর্বল শিক্ষার্থীদের জন্য বিশেষ যত্ন।',
      descEn:
        'Dedicated government-trained subject specialists providing guided mentorship, continuous evaluation, and individual remedial care.',
      statsBn: '১০০% নিবেদিতপ্রাণ শিক্ষক',
      statsEn: '100% Certified Faculty',
      to: '/about/teachers',
    },
    {
      id: 'science-lab',
      icon: FlaskConical,
      badgeBn: 'ব্যবহারিক বিজ্ঞান',
      badgeEn: 'Hands-on Science',
      titleBn: 'সুসজ্জিত বিজ্ঞানাগার ও ব্যবহারিক ল্যাব',
      titleEn: 'Equipped Science & Practical Labs',
      descBn:
        'পদার্থবিজ্ঞান, রসায়ন ও জীববিজ্ঞানের আধুনিক যন্ত্রপাতি সমৃদ্ধ পৃথক গবেষণাগারে নিয়মিত হাতে-কলমে বৈজ্ঞানিক পরীক্ষণ ও ব্যবহারিক পাঠচর্চা।',
      descEn:
        'Dedicated Physics, Chemistry, and Biology laboratories enabling practical scientific exploration and syllabus-aligned experiments.',
      statsBn: 'আধুনিক যন্ত্রপাতি ও রাসায়নিক ল্যাব',
      statsEn: 'Modern Laboratory Facilities',
      to: '/about/facilities',
    },
    {
      id: 'smart-ict',
      icon: Laptop,
      badgeBn: 'স্মার্ট প্রযুক্তি',
      badgeEn: 'Digital Classrooms',
      titleBn: 'মাল্টিমিডিয়া ক্লাসরুম ও আইসিটি ল্যাব',
      titleEn: 'Multimedia Classrooms & ICT Labs',
      descBn:
        'প্রজেক্টরযুক্ত ডিজিটাল শ্রেণিকক্ষ, কম্পিউটার ল্যাবে বাস্তবমুখী আইসিটি শিক্ষা এবং শিক্ষার্থীদের ডিজিটাল লিটারেসি নিশ্চিতকরণ।',
      descEn:
        'Projector-enabled interactive classrooms, hands-on computer labs, and essential digital learning for secondary learners.',
      statsBn: 'ডিজিটাল ক্লাসরুম ও কম্পিউটার সুবিধা',
      statsEn: 'High-speed ICT Lab',
      to: '/about/facilities',
    },
    {
      id: 'smart-system',
      icon: ShieldCheck,
      badgeBn: 'শৃঙ্খলা ও নিরাপত্তা',
      badgeEn: 'Safety & Discipline',
      titleBn: 'স্মার্ট উপস্থিতি ও অভিভাবক এসএমএস ট্র্যাকিং',
      titleEn: 'Smart Attendance & Parent SMS Alerts',
      descBn:
        'ডিজিটাল স্মার্ট হাজিরা ব্যবস্থা, পরীক্ষার ফলাফল ও জরুরি নোটিস সরাসরি অভিভাবকের মোবাইলে পাঠানো এবং সার্বক্ষণিক সিসিটিভি নিয়ন্ত্রিত নিরাপদ ক্যাম্পাস।',
      descEn:
        'Automated digital attendance tracking, instant SMS updates to parents, and a secure CCTV-monitored learning campus.',
      statsBn: 'স্বয়ংক্রিয় এসএমএস ও নোটিফিকেশন',
      statsEn: 'Real-time Parent Updates',
      to: '/about',
    },
    {
      id: 'co-curricular',
      icon: Trophy,
      badgeBn: 'সহশিক্ষা ও নেতৃত্ব',
      badgeEn: 'Co-Curricular',
      titleBn: 'স্কাউটিং, খেলাধুলা ও সাংস্কৃতিক বিকাশ',
      titleEn: 'Scouting, Sports & Cultural Growth',
      descBn:
        'বাংলাদেশ স্কাউটস ও গার্লস গাইড দল, সুবিশাল খেলার মাঠ, বিতর্ক ক্লাব এবং জাতীয় দিবস ও সাহিত্য-সাংস্কৃতিক প্রতিযোগিতায় সক্রিয় অংশগ্রহণ।',
      descEn:
        'Active Bangladesh Scouts & Girls Guide units, spacious playground, debate club, and vibrant annual cultural tournaments.',
      statsBn: 'স্কাউট, বিতর্ক ও ক্রীড়া দল',
      statsEn: 'Active Clubs & Sports',
      to: '/events',
    },
    {
      id: 'board-record',
      icon: Award,
      badgeBn: 'বোর্ড সাফল্য',
      badgeEn: 'Academic Track Record',
      titleBn: 'এসএসসি পরীক্ষায় ধারাবাহিক শতভাগ পাসের গৌরব',
      titleEn: 'Consistent SSC Board Exam Excellence',
      descBn:
        'নিয়মিত মডেল টেস্ট, শ্রেণি টেস্ট ও প্রি-টেস্ট পরীক্ষার সুপরিকল্পিত প্রস্তুতির মাধ্যমে বোর্ড পরীক্ষায় প্রতি বছর জিপিএ-৫ ও মেধা বৃত্তি অর্জন।',
      descEn:
        'Structured mock tests, continuous evaluation, and disciplined coaching leading to stellar board results and scholarships.',
      statsBn: 'ধারাবাহিক ৯৬%+ পাসের হার',
      statsEn: 'Consistently 96%+ Pass Rate',
      to: '/results',
    },
  ];

  const handleQuickResultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (quickExamId) params.set('examId', quickExamId);
    if (quickClassId) params.set('classId', quickClassId);
    if (quickRoll.trim()) params.set('roll', quickRoll.trim());
    router.push(`/results?${params.toString()}`);
  };

  const digitalServices = [
    {
      titleBn: 'সিলেবাস ও পাঠ্যক্রম',
      titleEn: 'Syllabus & Rules',
      descBn: 'এনসিটিবি পাঠ্যসূচি ও বিধিমালা',
      descEn: 'NCTB syllabus & policy',
      to: '/academics/syllabus',
      icon: FileText,
    },
    {
      titleBn: 'একাডেমিক ক্যালেন্ডার',
      titleEn: 'Academic Calendar',
      descBn: 'বার্ষিক ছুটি ও পরীক্ষার সূচি',
      descEn: 'Holidays & exam dates',
      to: '/academics/academic-calendar',
      icon: Calendar,
    },
    {
      titleBn: 'ডিজিটাল পাঠাগার ও নোট',
      titleEn: 'Digital Library & Notes',
      descBn: 'লেকচার শিট ও বইয়ের তালিকা',
      descEn: 'Study notes & e-books',
      to: '/academics/resources',
      icon: Library,
    },
    {
      titleBn: 'ভর্তি ফরম ডাউনলোড',
      titleEn: 'Admission Forms',
      descBn: 'প্রিন্টযোগ্য ফরম ও নির্দেশিকা',
      descEn: 'Printable forms & guide',
      to: '/admission/download-form',
      icon: Download,
    },
  ];

  const noticeTabs: { key: NoticeTab; labelBn: string; labelEn: string }[] = [
    { key: 'all', labelBn: 'সব বিজ্ঞপ্তি', labelEn: 'All Notices' },
    { key: 'urgent', labelBn: 'জরুরি', labelEn: 'Urgent' },
    { key: 'exam', labelBn: 'পরীক্ষা ও ফলাফল', labelEn: 'Exams & Results' },
    { key: 'admission', labelBn: 'ভর্তি ও একাডেমিক', labelEn: 'Admission' },
  ];

  return (
    <div className="space-y-16 pb-10">
      {/* =====================================================================
          A. CINEMATIC OPEN-PHOTO EDITORIAL HERO + FLOATING GLASS SMART DOCK
         ===================================================================== */}
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
        {/* Full-Bleed Direct Overlapping Slide Photography (Zero Background Flash) */}
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
          {/* Static Directional Contrast Scrim Above Slides — seamless lighting during transitions */}
          <div className="absolute inset-0 z-[3] pointer-events-none bg-gradient-to-r from-[#051B0F]/88 via-[#051B0F]/48 to-transparent" />
          <div className="absolute inset-0 z-[3] pointer-events-none bg-gradient-to-t from-[#04170D]/90 via-[#04170D]/15 to-[#04170D]/36" />
        </div>

        {/* Main Open Editorial Stage */}
        <div className="relative z-10 max-w-[1440px] mx-auto w-full px-4 sm:px-6 pt-24 pb-6 lg:pt-28 lg:pb-8 flex-1 flex flex-col justify-end lg:justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end w-full">
            {/* Left 8 Cols — Open Typography Directly Over Photography (Zero Bulky Box) */}
            <div className="lg:col-span-8 space-y-5 max-w-2xl">
              {/* Quiet Institutional Heritage Line */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-medium text-white/85 tabular-nums">
                <span className="font-semibold tracking-wider text-white">BHS</span>
                <span className="text-white/40" aria-hidden="true">·</span>
                <span>{pick('স্থাপিত: ১৯৭৮ খ্রি.', 'Est. 1978')}</span>
                <span className="text-white/40" aria-hidden="true">·</span>
                <span>EIIN: {db.schoolProfile.eiin ?? '113587'}</span>
                <span className="text-white/40" aria-hidden="true">·</span>
                <span>{pick('ভোজেশ্বর, নড়িয়া, শরীয়তপুর', 'Bhojeshwar, Noria, Shariatpur')}</span>
              </div>

              {/* Masked Slide-Up Display Headline */}
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

              {/* Single Dominant CTA + Quiet Secondary Link */}
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

              {/* Clean Inline Academic Facts (Unboxed Typography) */}
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
                    {formatNumber(db.staff.filter((s) => s.status === 'ACTIVE').length, locale)}
                  </strong>{' '}
                  {pick('শিক্ষক ও কর্মচারী', 'Faculty & Staff')}
                </span>
              </div>
            </div>

            {/* Right 4 Cols — Minimal Interactive Story Thumbnail Switcher */}
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

        {/* Bottom Floating Frosted-Glass Smart Quick Dock (4 Essential School Actions + Inline Result Popover) */}
        <div className="relative z-20 max-w-[1440px] mx-auto w-full px-4 sm:px-6 pb-5 lg:pb-6">
          {/* Expandable Compact Instant Result Lookup Popover */}
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

          {/* Compact 4-Item Frosted Glass Smart Dock */}
          <div className="glass-dark rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/12 overflow-hidden">
            {/* 1. Instant Result Trigger */}
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
                <p className="text-xs text-white/75 truncate">
                  {pick('রোল ও পরীক্ষা দিয়ে নম্বরপত্র', 'Search marksheet by roll')}
                </p>
              </div>
              <Search className="w-4 h-4 text-white/65 group-hover:text-white shrink-0 transition-colors" />
            </button>

            {/* 2. Admission & Status */}
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
                <p className="text-xs text-white/75 truncate">
                  {pick('আবেদন, প্রবেশপত্র ও যাচাই', 'Apply & track admission')}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/65 group-hover:text-white group-hover:translate-x-0.5 shrink-0 transition-all" />
            </Link>

            {/* 3. Class & Exam Routines */}
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
                <p className="text-xs text-white/75 truncate">
                  {pick('৬ষ্ঠ–১০ম শ্রেণির সময়সূচি', 'Schedules for Classes 6–10')}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/65 group-hover:text-white group-hover:translate-x-0.5 shrink-0 transition-all" />
            </Link>

            {/* 4. Role Portals Login */}
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
                <p className="text-xs text-white/75 truncate">
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

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 space-y-20">
        {/* =====================================================================
            B. OFFICIAL NOTICE BOARD & INSTITUTIONAL LEADERSHIP (BTEB / BANGLADESH.GOV.BD STANDARD)
           ===================================================================== */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start"
        >
          {/* Left 8 Columns — Official Notice Board + Quick Information Cards */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
              {/* Notice Board Header with Institutional Green Branding */}
              <div className="px-5 sm:px-6 py-4 border-b border-border bg-surface flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-emerald-700 dark:text-emerald-500 shrink-0" />
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <span>{pick('নোটিশ বোর্ড', 'Notice Board')}</span>
                  </h2>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-0.5 rounded-full tabular-nums">
                    {formatNumber(publishedNotices.length, locale)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/notices"
                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>{pick('সব নোটিশ', 'All')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Category Filter Tabs & Search Filter Strip */}
              <div className="px-5 sm:px-6 py-2.5 bg-surface-muted/30 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-1">
                  {noticeTabs.map((tab) => {
                    const active = noticeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setNoticeTab(tab.key)}
                        className={cn(
                          'px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap',
                          active
                            ? 'bg-[#0c5936] text-white shadow-xs'
                            : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                        )}
                      >
                        {locale === 'bn' ? tab.labelBn : tab.labelEn}
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={noticeQuery}
                    onChange={(e) => setNoticeQuery(e.target.value)}
                    placeholder={pick('স্মারক বা বিষয় খুঁজুন...', 'Search memo or title...')}
                    className="w-full h-8 pl-8 pr-2.5 text-xs bg-surface border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Notice List Rows (matches bteb.gov.bd layout) */}
              <div className="divide-y divide-border">
                {publishedNotices.length === 0 ? (
                  <div className="p-10 text-center text-sm text-muted-foreground">
                    {pick('এই বিভাগে কোনো বিজ্ঞপ্তি পাওয়া যায়নি।', 'No notices found in this category.')}
                  </div>
                ) : (
                  publishedNotices.slice(0, 5).map((notice) => {
                    const pubDate = new Date(notice.publishedAt ?? notice.createdAt);
                    const isRecent = (Date.now() - pubDate.getTime()) < 14 * 24 * 60 * 60 * 1000;
                    const showNewBadge = notice.isUrgent || isRecent;
                    const day = String(pubDate.getDate()).padStart(2, '0');
                    const month = String(pubDate.getMonth() + 1).padStart(2, '0');
                    const year = pubDate.getFullYear();
                    const rawDate = `${day}-${month}-${year}`;
                    const formattedDate = locale === 'bn' ? formatNumber(rawDate, 'bn') : rawDate;

                    return (
                      <div
                        key={notice.id}
                        className="group px-4 sm:px-6 py-3.5 hover:bg-surface-muted/40 transition-colors flex items-start gap-3"
                      >
                        {/* Green Bullet Icon (bteb.gov.bd style) */}
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0c5936] dark:bg-emerald-500 shrink-0 mt-1.5" />

                        {/* Notice Title & Metadata */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <Link
                            href={`/notices/${notice.id}`}
                            className="block text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2"
                          >
                            {notice.title}
                          </Link>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground/80" />
                              <span>{formattedDate}</span>
                            </span>

                            {showNewBadge && (
                              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-bold leading-none animate-pulse">
                                {pick('নতুন', 'New')}
                              </span>
                            )}

                            <span className="px-2 py-0.5 rounded-md bg-surface-muted border border-border/80 text-[11px] font-medium text-muted-foreground">
                              {notice.isUrgent ? pick('জরুরি', 'Urgent') : pick('সাধারণ', 'General')}
                            </span>

                            {notice.memoNo && (
                              <span className="text-[11px] text-muted-foreground/75 font-mono">
                                {notice.memoNo}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Direct Preview & Details Navigation */}
                        <div className="flex items-center gap-1.5 shrink-0 self-center">
                          <button
                            type="button"
                            onClick={() => setPreviewNotice(notice)}
                            title={pick('দ্রুত দেখুন', 'Quick Preview')}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:border-primary/45 hover:text-primary transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/notices/${notice.id}`}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Action Footer (Solid Green Button as in bteb.gov.bd) */}
              <div className="p-4 bg-surface-muted/20 border-t border-border flex items-center justify-between">
                <Link href="/notices">
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-lg bg-[#0c5936] hover:bg-[#084529] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>{pick('সকল নোটিশ দেখুন', 'View All Notices')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>

                <Link
                  href="/notices"
                  className="px-3.5 py-2 rounded-lg bg-surface border border-border hover:border-primary/40 text-xs font-semibold text-primary transition-colors"
                >
                  <span>{pick('আর্কাইভ দেখুন', 'View Archive')}</span>
                </Link>
              </div>
            </div>

            {/* Quick Action Cards Under Notice Board (matches bteb.gov.bd bottom left) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: বিজ্ঞপ্তি ও সিলেবাস */}
              <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2.5 text-foreground">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold">
                    {pick('বিজ্ঞপ্তি ও নির্দেশিকা', 'Announcements & Guidelines')}
                  </h3>
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li>
                    <Link href="/academics/routines" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      <span>{pick('পরীক্ষার রুটিন ও সময়সূচি', 'Exam Routines & Schedule')}</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/academics/academic-calendar" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      <span>{pick('বার্ষিক ছুটির তালিকা ও বর্ষপঞ্জি', 'Annual Holiday Calendar')}</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/academics/syllabus" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      <span>{pick('শ্রেণিভিত্তিক পাঠ্যসূচি ও সিলেবাস', 'Syllabus & Lesson Plan')}</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Card 2: অনলাইনে ভর্তি */}
              <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2.5 text-foreground">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold">
                    {pick('অনলাইনে ভর্তি (সেশন: ২০২৬-২০২৭)', 'Online Admission (2026-2027)')}
                  </h3>
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li>
                    <Link href="/admission/apply" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>{pick('সরাসরি অনলাইন ভর্তি আবেদন', 'Direct Online Admission Apply')}</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/admission/guidelines" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>{pick('ভর্তির যোগ্যতা ও নীতিমালা', 'Admission Policy & Criteria')}</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/admission/status" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>{pick('আবেদনের অগ্রগতি ট্র্যাকিং', 'Track Application Status')}</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right 4 Columns — Leadership Widgets (matches bteb.gov.bd right sidebar) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Widget 1: সভাপতি, ম্যানেজিং কমিটি */}
            {presidentMsg && (
              <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
                <div className="bg-[#0c5936] text-white px-4 py-2 font-bold text-sm tracking-wide flex items-center justify-between">
                  <span>{pick('মাননীয় সভাপতি, ম্যানেজিং কমিটি', 'Chairman, Managing Committee')}</span>
                </div>
                <div className="p-4 text-center space-y-3">
                  <div className="relative w-40 h-48 mx-auto rounded-lg overflow-hidden border border-border bg-surface-muted shadow-xs">
                    <img
                      src={getLeadershipPortrait(presidentMsg.photo, 'CHAIRMAN')}
                      alt={presidentMsg.personName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground">
                      {presidentMsg.personName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {presidentMsg.designation}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border/60">
                    <Link
                      href={`/about/leadership/${presidentMsg.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>{pick('বিস্তারিত পরিচিতি ও বাণী', 'View Details & Message')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Widget 2: প্রধান শিক্ষক */}
            {principalMsg && (
              <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
                <div className="bg-[#0c5936] text-white px-4 py-2 font-bold text-sm tracking-wide flex items-center justify-between">
                  <span>{pick('প্রধান শিক্ষক, ভোজেশ্বর উচ্চ বিদ্যালয়', 'Headmaster, Bhojeshwar High School')}</span>
                </div>
                <div className="p-4 text-center space-y-3">
                  <div className="relative w-40 h-48 mx-auto rounded-lg overflow-hidden border border-border bg-surface-muted shadow-xs">
                    <img
                      src={getLeadershipPortrait(principalMsg.photo, 'PRINCIPAL')}
                      alt={principalMsg.personName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground">
                      {principalMsg.personName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {principalMsg.designation}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border/60">
                    <Link
                      href={`/about/leadership/${principalMsg.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>{pick('বিস্তারিত পরিচিতি ও বাণী', 'View Details & Message')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* =====================================================================
            C. WHY STUDY AT BHS? (INSTITUTIONAL VALUE PROPOSITION - GENERAL)
           ===================================================================== */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="space-y-6"
        >
          {/* Section Heading */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{pick('আমাদের অনন্য বৈশিষ্ট্য ও শক্তি', 'Why Choose Bhojeshwar High School')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight text-balance">
                {pick('কেন ভোজেশ্বর উচ্চ বিদ্যালয়ে পড়বেন?', 'Why Study at BHS?')}
              </h2>
              <p className="text-base text-muted-foreground max-w-3xl leading-relaxed">
                {pick(
                  '১৯৭৮ সাল থেকে শরীয়তপুরের ঐতিহ্যবাহী বিদ্যাপীঠ হিসেবে ভোজেশ্বর উচ্চ বিদ্যালয় আধুনিক প্রযুক্তি, মানসম্মত সাধারণ শিক্ষা, সমৃদ্ধ বিজ্ঞানাগার এবং সুশৃঙ্খল নৈতিকতার এক অনন্য কেন্দ্র।',
                  'Since 1978, Bhojeshwar High School has stood as a trusted center for rigorous secondary education, modern technology, science exploration, and disciplined character building.'
                )}
              </p>
            </div>
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline whitespace-nowrap shrink-0"
            >
              <span>{pick('বিদ্যালয়ের পূর্ণ পরিচিতি', 'About Our Institution')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 6-Card Modern Bento-Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {whyStudyHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.to}
                  className="group bg-surface border border-border rounded-xl p-5 sm:p-6 flex flex-col justify-between gap-5 hover:border-primary/45 hover:shadow-sm transition-all"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-muted text-muted-foreground border border-border/80">
                        {locale === 'bn' ? item.badgeBn : item.badgeEn}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {locale === 'bn' ? item.titleBn : item.titleEn}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {locale === 'bn' ? item.descBn : item.descEn}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-border/80 flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-foreground/80">
                      {locale === 'bn' ? item.statsBn : item.statsEn}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                      <span>{pick('বিস্তারিত', 'Explore')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.section>

        {/* =====================================================================
            D. ACADEMIC STREAMS & INSTITUTIONAL EXCELLENCE HIGHLIGHTS
           ===================================================================== */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="space-y-6"
        >
          {/* Editorial Section Heading */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-primary">
                {pick('একাডেমিক কাঠামো · ৬ষ্ঠ থেকে ১০ম শ্রেণি', 'Academic Structure · Classes 6 to 10')}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight text-balance">
                {pick('আমাদের একাডেমিক ধারা ও অর্জন', 'Academic Streams & Institutional Excellence')}
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
                {pick(
                  'এনসিটিবি অনুমোদিত পাঠ্যক্রম, আধুনিক বিজ্ঞান ও আইসিটি ল্যাব এবং অভিজ্ঞ শিক্ষকমণ্ডলীর নিবিড় তত্ত্বাবধানে প্রতিটি শিক্ষার্থীর মেধা বিকাশ।',
                  'NCTB-aligned secondary education backed by modern science & ICT laboratories and dedicated faculty mentorship.'
                )}
              </p>
            </div>
            <Link
              href="/academics/classes"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline whitespace-nowrap shrink-0"
            >
              <span>{pick('শ্রেণি, শাখা ও সিলেবাস দেখুন', 'Explore Classes & Syllabus')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 4-Column Academic Streams Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {academicStreams.map((stream) => {
              const Icon = stream.icon;
              return (
                <Link
                  key={stream.indexEn}
                  href={stream.to}
                  className="group bg-surface border border-border rounded-xl p-5 sm:p-6 flex flex-col justify-between gap-5 hover:border-primary/45 transition-colors"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-muted-foreground tabular-nums">
                        {locale === 'bn'
                          ? `${stream.index} · ${stream.levelBn}`
                          : `${stream.indexEn} · ${stream.levelEn}`}
                      </span>
                      <div className="h-9 w-9 rounded-lg bg-primary/8 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {locale === 'bn' ? stream.titleBn : stream.titleEn}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {locale === 'bn' ? stream.descBn : stream.descEn}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-border/80 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {locale === 'bn' ? stream.highlightBn : stream.highlightEn}
                    </p>
                    <div className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      <span>{locale === 'bn' ? stream.ctaBn : stream.ctaEn}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Unified 4-Column Institutional Achievement & Proof Strip */}
          <div className="bg-surface border border-border rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border overflow-hidden">
            <div className="px-5 py-4 sm:px-6 sm:py-5 space-y-1">
              <p className="text-2xl sm:text-3xl font-bold text-primary tabular-nums tracking-tight">
                {formatNumber(yearsSinceEst, locale)}+ {pick('বছর', 'Years')}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {pick('গৌরবময় শিক্ষার ঐতিহ্য', 'Legacy of Secondary Education')}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {pick(
                  `স্থাপিত ${formatNumber(db.schoolProfile.establishedYear ?? 1978, locale)} খ্রি. · EIIN ${db.schoolProfile.eiin ?? '113587'}`,
                  `Est. ${db.schoolProfile.establishedYear ?? 1978} · EIIN ${db.schoolProfile.eiin ?? '113587'}`
                )}
              </p>
            </div>

            <div className="px-5 py-4 sm:px-6 sm:py-5 space-y-1">
              <p className="text-2xl sm:text-3xl font-bold text-primary tabular-nums tracking-tight">
                {pick('৯৬.৮%', '96.8%')}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {pick('এসএসসি বোর্ড পাসের হার', 'SSC Board Pass Rate')}
              </p>
              <p className="text-xs text-muted-foreground">
                {pick('এসএসসি ২০২৫ · জিপিএ-৫ ও বোর্ড বৃত্তি', 'SSC 2025 · GPA-5 & Board Scholarships')}
              </p>
            </div>

            <div className="px-5 py-4 sm:px-6 sm:py-5 space-y-1">
              <p className="text-2xl sm:text-3xl font-bold text-primary tabular-nums tracking-tight">
                {formatNumber(activeClasses.length, locale)} {pick('শ্রেণি', 'Grades')} · {formatNumber(activeSectionsCount, locale)} {pick('শাখা', 'Sections')}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {pick('৬ষ্ঠ–১০ম শ্রেণি ও ৩টি বিভাগ', 'Classes 6–10 & 3 Streams')}
              </p>
              <p className="text-xs text-muted-foreground">
                {pick('বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা', 'Science, Humanities & Business Studies')}
              </p>
            </div>

            <div className="px-5 py-4 sm:px-6 sm:py-5 space-y-1">
              <p className="text-2xl sm:text-3xl font-bold text-primary tabular-nums tracking-tight">
                {formatNumber(activeFacilities.length, locale)}+ {pick('সুবিধা', 'Facilities')}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {pick('আধুনিক ক্যাম্পাস ও ল্যাব', 'Modern Campus & Labs')}
              </p>
              <p className="text-xs text-muted-foreground">
                {pick('বিজ্ঞান ল্যাব, আইসিটি কেন্দ্র ও পাঠাগার', 'Science labs, ICT center & reading library')}
              </p>
            </div>
          </div>
        </motion.section>

        {/* =====================================================================
            D. ADMIN-CONTROLLED ADMISSION SPOTLIGHT BANNER
           ===================================================================== */}
        {db.admissionContent.isPublished && db.admissionContent.showOnHomepage !== false && (() => {
          const adm = db.admissionContent;
          const status = adm.admissionStatus ?? 'OPEN';
          const isOpen = status === 'OPEN';
          const isUpcoming = status === 'UPCOMING';
          const isClosed = status === 'CLOSED';

          const statusText = isOpen
            ? pick('ভর্তি চলছে', 'Admissions Open')
            : isUpcoming
              ? pick('শীঘ্রই শুরু হচ্ছে', 'Opening Soon')
              : pick('ভর্তি কার্যক্রম বন্ধ', 'Admissions Closed');

          return (
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="relative rounded-2xl overflow-hidden text-white"
            >
              <img
                src={getCampusPhoto('digital-classroom').src}
                alt={pick('ভর্তি কার্যক্রম ব্যানার', 'Admission banner')}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#062313]/94 via-[#08351C]/84 to-[#062313]/68" />

              <div className="relative z-10 p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-3.5">
                  {/* Quiet Session & Status Metadata Line */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-medium text-white/85 tabular-nums">
                    <span className="font-semibold text-white">{statusText}</span>
                    <span className="text-white/40" aria-hidden="true">·</span>
                    <span>
                      {pick(
                        `শিক্ষাবর্ষ ${adm.academicSession ?? '২০২৭'}`,
                        `Academic Session ${adm.academicSession ?? '2027'}`
                      )}
                    </span>
                    {adm.eligibleClasses && (
                      <>
                        <span className="text-white/40 hidden sm:inline" aria-hidden="true">·</span>
                        <span className="hidden sm:inline text-white/90">{adm.eligibleClasses}</span>
                      </>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-white text-balance">
                    {adm.bannerTitle || adm.title}
                  </h2>

                  <p className="text-base text-white/90 leading-relaxed max-w-2xl">
                    {adm.bannerSubtitle ||
                      pick(
                        'যোগ্য ও মেধাবী শিক্ষার্থীদের জন্য নতুন শিক্ষাবর্ষের ভর্তি কার্যক্রম পরিচালিত হচ্ছে।',
                        'New academic session admissions are managed online with instant admit card generation.'
                      )}
                  </p>

                  {/* Tabular Schedule & Fee Row */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-white/15 text-sm text-white/85 tabular-nums">
                    {adm.startDate && (
                      <span>
                        {pick('আবেদন শুরু:', 'Starts:')}{' '}
                        <strong className="text-white font-semibold">
                          {formatDateLong(adm.startDate, locale)}
                        </strong>
                      </span>
                    )}
                    {adm.endDate && (
                      <span>
                        {pick('শেষ তারিখ:', 'Deadline:')}{' '}
                        <strong className="text-white font-semibold">
                          {formatDateLong(adm.endDate, locale)}
                        </strong>
                      </span>
                    )}
                    {adm.admissionTestDate && (
                      <span>
                        {pick('ভর্তি পরীক্ষা:', 'Admission Test:')}{' '}
                        <strong className="text-white font-semibold">
                          {formatDateLong(adm.admissionTestDate, locale)}
                        </strong>
                      </span>
                    )}
                    {adm.applicationFee != null && adm.applicationFee > 0 && (
                      <span>
                        {pick('আবেদন ফি:', 'Fee:')}{' '}
                        <strong className="text-white font-semibold">
                          {formatBdt(adm.applicationFee, locale)}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Frosted Glass Action Card */}
                <div className="lg:col-span-5">
                  <div className="glass-dark-subtle rounded-xl p-5 space-y-3.5">
                    <p className="text-sm text-white/90 leading-relaxed">
                      {isOpen
                        ? pick(
                            'অনলাইনে আবেদন সম্পন্ন করে আবেদন নম্বর ও ভর্তি পরীক্ষার প্রবেশপত্র সংরক্ষণ করুন।',
                            'Complete your online application and save your application number & admit card.'
                          )
                        : isUpcoming
                          ? pick(
                              'আবেদন শুরুর পূর্বে ভর্তি নির্দেশিকা, প্রয়োজনীয় কাগজপত্র ও নমুনা ফরম দেখে নিন।',
                              'Review admission guidelines, required documents, and printable forms ahead of opening.'
                            )
                          : pick(
                              'চলমান শিক্ষাবর্ষের অনলাইন আবেদন সম্পন্ন হয়েছে। পূর্বের আবেদনের অবস্থা নিচ থেকে যাচাই করুন।',
                              'Online applications for this cycle are closed. Existing applicants may check their status below.'
                            )}
                    </p>

                    <div className="flex flex-col gap-2.5">
                      {isOpen ? (
                        <Link href="/admission/apply" className="w-full">
                          <button
                            type="button"
                            className="w-full py-2.5 px-4 rounded-lg bg-primary hover:opacity-92 text-primary-foreground text-base font-semibold inline-flex items-center justify-center gap-2 transition-opacity cursor-pointer shadow-md"
                          >
                            <span>{pick('অনলাইন ভর্তি আবেদন করুন', 'Apply Online Now')}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </Link>
                      ) : isUpcoming ? (
                        <Link href="/admission/guidelines" className="w-full">
                          <button
                            type="button"
                            className="w-full py-2.5 px-4 rounded-lg bg-primary hover:opacity-92 text-primary-foreground text-base font-semibold inline-flex items-center justify-center gap-2 transition-opacity cursor-pointer shadow-md"
                          >
                            <span>{pick('ভর্তি নির্দেশিকা দেখুন', 'View Admission Guidelines')}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </Link>
                      ) : (
                        <Link href="/admission/status" className="w-full">
                          <button
                            type="button"
                            className="w-full py-2.5 px-4 rounded-lg bg-white/16 hover:bg-white/24 border border-white/25 text-white text-base font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                          >
                            <Search className="w-4 h-4" />
                            <span>{pick('আবেদনের স্ট্যাটাস যাচাই করুন', 'Check Application Status')}</span>
                          </button>
                        </Link>
                      )}

                      <div className="grid grid-cols-2 gap-2.5">
                        <Link href="/admission/download-form">
                          <button
                            type="button"
                            className="w-full py-2 px-3 rounded-lg bg-white/12 hover:bg-white/20 border border-white/20 text-white text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{pick('ফরম ডাউনলোড', 'Download Form')}</span>
                          </button>
                        </Link>
                        <Link href={isClosed ? '/admission/guidelines' : '/admission/status'}>
                          <button
                            type="button"
                            className="w-full py-2 px-3 rounded-lg bg-white/12 hover:bg-white/20 border border-white/20 text-white text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            {isClosed ? <FileText className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
                            <span>
                              {isClosed
                                ? pick('ভর্তি নির্দেশিকা', 'Guidelines')
                                : pick('স্ট্যাটাস যাচাই', 'Check Status')}
                            </span>
                          </button>
                        </Link>
                      </div>
                    </div>

                    {adm.helplinePhone && (
                      <div className="pt-2.5 border-t border-white/12 flex items-center justify-between text-sm text-white/80 tabular-nums">
                        <span>{pick('ভর্তি সহায়তা ডেস্ক', 'Admission Helpline')}</span>
                        <a
                          href={`tel:${adm.helplinePhone}`}
                          className="font-semibold text-white hover:underline"
                        >
                          {adm.helplinePhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          );
        })()}

        {/* =====================================================================
            E. HERITAGE STORY & LEADERSHIP MESSAGES
           ===================================================================== */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
        >
          {/* Heritage Card */}
          <Card className="lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <SchoolEmblem size={60} />
                <div>
                  <p className="text-sm font-semibold text-primary tabular-nums">
                    {pick('স্থাপিত: ১৯৭৮ খ্রি. · EIIN: ১১৩৫৮৭ · BHS', 'Est. 1978 · EIIN: 113587 · BHS')}
                  </p>
                  <h2 className="text-xl font-bold text-foreground leading-snug">
                    {db.schoolProfile.name}
                  </h2>
                </div>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                {db.schoolProfile.description}
              </p>
              <div className="pt-3 border-t border-border space-y-2.5 text-sm leading-relaxed">
                <p>
                  <strong className="text-foreground">{pick('আমাদের লক্ষ্য:', 'Mission:')}</strong>{' '}
                  <span className="text-muted-foreground">{db.schoolProfile.mission}</span>
                </p>
                <p>
                  <strong className="text-foreground">{pick('দৃষ্টিভঙ্গি:', 'Vision:')}</strong>{' '}
                  <span className="text-muted-foreground">{db.schoolProfile.vision}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link href="/about/history">
                <Button variant="outline" size="sm">
                  {pick('শতবর্ষের ইতিহাস', 'Heritage & History')}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <Link href="/about/management-committee">
                <Button variant="ghost" size="sm">
                  {pick('ম্যানেজিং কমিটি', 'Committee')}
                </Button>
              </Link>
            </div>
          </Card>

          {/* Leadership Messages with Full Portraits */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">
                  {pick('প্রাতিষ্ঠানিক দিকনির্দেশনা', 'Institutional Leadership')}
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {pick('নেতৃত্বের বাণী', 'Leadership Messages')}
                </h2>
              </div>
              <Link
                href="/about/leadership"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline whitespace-nowrap"
              >
                <span>{pick('সব বাণী দেখুন', 'View All Messages')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
              {db.leadershipMessages
                .filter((m) => m.isPublished)
                .map((msg) => {
                  const portraitSrc = getLeadershipPortrait(msg.photo, msg.type);
                  const roleLabel =
                    msg.type === 'PRINCIPAL'
                      ? pick('প্রধান শিক্ষকের বাণী', "Headteacher's Message")
                      : pick('সভাপতির বাণী', "Chairman's Message");

                  return (
                    <article
                      key={msg.id}
                      className="group bg-surface border border-border rounded-xl overflow-hidden flex flex-col justify-between hover:border-primary/45 transition-colors"
                    >
                      <div>
                        {/* Full, Clear Editorial Portrait */}
                        <Link
                          href={`/about/leadership/${msg.id}`}
                          className="block relative aspect-[4/3] w-full overflow-hidden bg-surface-muted"
                        >
                          <img
                            src={portraitSrc}
                            alt={msg.personName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                          />
                          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 via-black/15 to-transparent pointer-events-none" />
                          <span className="absolute bottom-3 left-4 text-xs font-semibold text-white/95 tracking-wide">
                            {roleLabel}
                          </span>
                        </Link>

                        {/* Leader Identity & Excerpt */}
                        <div className="p-5 space-y-2.5">
                          <div>
                            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                              <Link href={`/about/leadership/${msg.id}`}>
                                {msg.personName}
                              </Link>
                            </h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {msg.designation}
                            </p>
                          </div>

                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                            “{msg.message.split('\n')[0]}”
                          </p>
                        </div>
                      </div>

                      <div className="px-5 pb-5 pt-3 border-t border-border/70 flex items-center justify-between gap-2">
                        <Link
                          href={`/about/leadership/${msg.id}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                        >
                          <span>{pick('সম্পূর্ণ বাণী পড়ুন', 'Read Full Message')}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        <span className="text-xs text-muted-foreground tabular-nums">BHS</span>
                      </div>
                    </article>
                  );
                })}
            </div>
          </div>
        </motion.section>

        {/* =====================================================================
            F. CAMPUS LIFE, FACILITIES & INTERACTIVE PHOTO GALLERY
           ===================================================================== */}
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
                {pick('ক্যাম্পাস অবকাঠামো ও ফটো গ্যালারি', 'Campus Facilities & Visual Gallery')}
              </h2>
              <p className="text-base text-muted-foreground mt-1">
                {pick(
                  'ঐতিহ্যবাহী ভবন, স্মার্ট শ্রেণিকক্ষ, বিজ্ঞান গবেষণাগার, পাঠাগার ও খেলার মাঠ।',
                  'Heritage building, smart classrooms, science labs, reading library, and athletic field.'
                )}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm font-semibold">
              <Link href="/about/facilities" className="text-primary hover:underline">
                {pick('সব সুবিধা', 'All Facilities')}
              </Link>
              <Link href="/gallery" className="text-primary hover:underline">
                {pick('সম্পূর্ণ গ্যালারি', 'Full Gallery')}
              </Link>
            </div>
          </div>

          {/* Asymmetric Editorial Photo Bento Grid */}
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

          {/* Compact Facilities Index */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {activeFacilities.slice(0, 6).map((fac) => (
              <Card key={fac.id} className="p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-foreground">{fac.name}</h3>
                  <span className="text-xs font-medium text-primary">{fac.type}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{fac.description}</p>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* =====================================================================
            G. FACULTY SPOTLIGHT, RESULTS & ACHIEVEMENTS
           ===================================================================== */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">
                {pick('একাডেমিক শিক্ষকমণ্ডলী', 'Academic Faculty')}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {pick('অভিজ্ঞ শিক্ষকমণ্ডলী', 'Faculty & Teachers')}
              </h2>
              <p className="text-base text-muted-foreground mt-1">
                {pick(
                  'বিষয়ভিত্তিক দক্ষ, নিবেদিতপ্রাণ ও অভিজ্ঞ শিক্ষকমণ্ডলীর তত্ত্বাবধানে পাঠদান।',
                  'Dedicated subject specialists mentoring Classes 6–10 across all streams.'
                )}
              </p>
            </div>
            <Link
              href="/about/teachers"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline whitespace-nowrap shrink-0"
            >
              <span>{pick('সকল শিক্ষক দেখুন', 'View All Teachers')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {teachersPreview.map((teacher) => {
              const dept = db.departments.find((d) => d.id === teacher.departmentId);
              const portraitSrc = getStaffPortrait(teacher.photo, teacher.gender, teacher.id);
              return (
                <Link
                  key={teacher.id}
                  href={`/about/teachers/${teacher.id}`}
                  className="group bg-surface border border-border rounded-xl overflow-hidden flex flex-col justify-between hover:border-primary/45 transition-colors"
                >
                  <div>
                    <div className="relative aspect-[4/4.2] w-full overflow-hidden bg-surface-muted">
                      <img
                        src={portraitSrc}
                        alt={teacher.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 via-black/15 to-transparent pointer-events-none" />
                      {dept && (
                        <span className="absolute bottom-2.5 left-3.5 text-xs font-semibold text-white/95">
                          {dept.name}
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-1">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                        {teacher.name}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-snug">
                        {teacher.designation}
                      </p>
                      {teacher.qualification && (
                        <p className="text-xs text-muted-foreground/90 pt-1">
                          {teacher.qualification}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-4 pb-3.5 pt-2.5 border-t border-border/70 flex items-center justify-between text-sm font-semibold text-primary">
                    <span>{pick('প্রোফাইল দেখুন', 'View Profile')}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.section>

        {/* Published Results & Achievements */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          <Card className="lg:col-span-7 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                {pick('প্রকাশিত পরীক্ষার ফলাফল', 'Published Examination Results')}
              </h2>
              <Link href="/results" className="text-sm font-semibold text-primary hover:underline">
                {pick('ফলাফল অনুসন্ধান', 'Result Search')}
              </Link>
            </div>
            <div className="divide-y divide-border">
              {publishedExams.map((ex) => (
                <div key={ex.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">{ex.name}</p>
                    <p className="text-sm text-muted-foreground tabular-nums mt-0.5">
                      {pick('প্রকাশের তারিখ:', 'Published:')}{' '}
                      {formatDateLong(ex.publishedAt, locale)}
                    </p>
                  </div>
                  <Link href={`/results?examId=${ex.id}&classId=${ex.classId}`}>
                    <Button variant="outline" size="sm">
                      {pick('ফলাফল দেখুন', 'View Result')}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-5 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Award className="w-5 h-5 text-accent" />
                {pick('গৌরবময় অর্জন ও স্বীকৃতি', 'Institutional Achievements')}
              </h2>
              <Link href="/achievements" className="text-sm font-semibold text-primary hover:underline">
                {pick('সব দেখুন', 'View All')}
              </Link>
            </div>
            <div className="space-y-3.5">
              {db.achievements
                .filter((a) => a.isPublished)
                .slice(0, 4)
                .map((ach) => (
                  <div
                    key={ach.id}
                    className="pb-3.5 border-b border-border last:border-none last:pb-0"
                  >
                    <h3 className="text-base font-semibold text-foreground">{ach.title}</h3>
                    {(ach.personName || ach.batch) && (
                      <p className="text-xs font-medium text-primary mt-0.5 tabular-nums">
                        {[ach.personName, ach.batch].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {ach.description}
                    </p>
                  </div>
                ))}
            </div>
          </Card>
        </motion.section>

        {/* =========================================================================
            SECTION 8: STARS OF OUR INSTITUTION (REACT-PHOTO-ALBUM MASONRY / কৃতি শিক্ষার্থী ও অ্যালামনাই)
            Clean responsive Masonry photo showcase powered by react-photo-album
           ========================================================================= */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
        >
          <StarsMasonryAlbum
            stars={institutionStars}
            locale={locale}
            pick={pick}
          />
        </motion.section>

        {/* News & Upcoming Events (Photo-Led Editorial News + Chronological Event Calendar) */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Left 7 Columns — Editorial Campus News Showcase */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-end justify-between gap-4 border-b border-border pb-3.5">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {pick('সাম্প্রতিক সংবাদ', 'Latest Campus News')}
                </h2>
                <p className="text-base text-muted-foreground mt-1">
                  {pick(
                    'বিদ্যালয়ের সহশিক্ষা, বিজ্ঞান চর্চা ও শিক্ষার্থীদের সাম্প্রতিক সাফল্যের প্রতিবেদন',
                    'Stories from campus life, science fairs, and student achievements'
                  )}
                </p>
              </div>
              <Link
                href="/news"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline whitespace-nowrap shrink-0"
              >
                <span>{pick('সব সংবাদ', 'All News')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {publishedNews.length > 0 && (
              <div className="space-y-4">
                {/* Featured Lead News Story */}
                {(() => {
                  const lead = publishedNews[0];
                  const leadPhoto = getNewsPhoto(lead.image, lead.id);
                  return (
                    <Link
                      href={`/news/${lead.id}`}
                      className="group block bg-surface border border-border rounded-xl overflow-hidden hover:border-primary/45 transition-all"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12">
                        <div className="sm:col-span-5 relative aspect-[16/10] sm:aspect-auto sm:min-h-[210px] overflow-hidden bg-surface-muted">
                          <img
                            src={leadPhoto}
                            alt={lead.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                          />
                        </div>
                        <div className="sm:col-span-7 p-5 flex flex-col justify-between gap-3">
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground tabular-nums">
                              {formatDateLong(lead.publishedAt ?? lead.createdAt, locale)}
                            </p>
                            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                              {lead.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                              {lead.description}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                            <span>{pick('সম্পূর্ণ সংবাদ পড়ুন', 'Read Full Story')}</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })()}

                {/* Secondary News Stories Grid */}
                {publishedNews.length > 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {publishedNews.slice(1).map((item) => {
                      const itemPhoto = getNewsPhoto(item.image, item.id);
                      return (
                        <Link
                          key={item.id}
                          href={`/news/${item.id}`}
                          className="group bg-surface border border-border rounded-xl overflow-hidden flex flex-col justify-between hover:border-primary/45 transition-all"
                        >
                          <div>
                            <div className="relative aspect-[16/9] overflow-hidden bg-surface-muted">
                              <img
                                src={itemPhoto}
                                alt={item.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                              />
                            </div>
                            <div className="p-4 space-y-1.5">
                              <p className="text-xs text-muted-foreground tabular-nums">
                                {formatDateLong(item.publishedAt ?? item.createdAt, locale)}
                              </p>
                              <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                                {item.title}
                              </h3>
                              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                          </div>
                          <div className="px-4 pb-3.5 pt-2 border-t border-border/60 flex items-center justify-between text-sm font-semibold text-primary">
                            <span>{pick('বিস্তারিত পড়ুন', 'Read More')}</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right 5 Columns — Chronological Upcoming Events & Calendar */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-end justify-between gap-4 border-b border-border pb-3.5">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {pick('আসন্ন অনুষ্ঠান ও ক্যালেন্ডার', 'Upcoming Events')}
                </h2>
                <p className="text-base text-muted-foreground mt-1">
                  {pick(
                    'তারিখ অনুযায়ী বিদ্যালয়ের আসন্ন দিবস, ক্রীড়া ও সহশিক্ষা সূচি',
                    'Chronological schedule of upcoming school programs'
                  )}
                </p>
              </div>
              <Link
                href="/events"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline whitespace-nowrap shrink-0"
              >
                <span>{pick('সব অনুষ্ঠান', 'All Events')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col">
              <div className="divide-y divide-border">
                {upcomingEvents.map((ev) => {
                  const cat = db.eventCategories.find((c) => c.id === ev.categoryId);
                  const d = getDateBadgeParts(ev.startDate, locale);
                  const isMultiDay = Boolean(ev.endDate && ev.endDate !== ev.startDate);
                  return (
                    <Link
                      key={ev.id}
                      href={`/events/${ev.id}`}
                      className="group p-4 sm:p-5 flex items-start gap-4 hover:bg-surface-muted/45 transition-colors"
                    >
                      {/* Structured Calendar Date Block */}
                      <div className="w-14 shrink-0 rounded-lg border border-border bg-surface text-center overflow-hidden tabular-nums">
                        <div className="bg-primary text-primary-foreground text-xs font-semibold py-0.5 leading-tight">
                          {d.month}
                        </div>
                        <div className="py-1.5">
                          <p className="text-lg font-bold text-foreground leading-none">{d.day}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-none">{d.year}</p>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          {cat && (
                            <span className="font-semibold text-primary">{cat.name}</span>
                          )}
                          {isMultiDay && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">
                                {formatDateLong(ev.startDate, locale)} –{' '}
                                {formatDateLong(ev.endDate, locale)}
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {ev.title}
                        </h3>
                        {ev.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                            {ev.description}
                          </p>
                        )}
                      </div>

                      <ArrowRight className="w-4 h-4 text-muted-foreground/70 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                    </Link>
                  );
                })}
              </div>

              <div className="px-5 py-3.5 bg-surface-muted/45 border-t border-border flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{pick('বার্ষিক ছুটি ও পরীক্ষার সূচি', 'Annual holidays & exam dates')}</span>
                </span>
                <Link
                  href="/academics/academic-calendar"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline whitespace-nowrap shrink-0"
                >
                  <span>{pick('একাডেমিক ক্যালেন্ডার', 'Academic Calendar')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Campus Location, Google Maps & Office Support */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
        >
          <div className="bg-surface border border-border rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Left 5 Columns — Campus Office & Visitor Guidance */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {pick('ক্যাম্পাস পরিদর্শন ও অফিস সহায়তা', 'Campus Visit & Office Support')}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
                    {pick('যোগাযোগ ও বিদ্যালয় অবস্থান', 'Location & School Office')}
                  </h2>
                  <p className="text-base text-muted-foreground mt-1.5 leading-relaxed">
                    {pick(
                      'ভর্তি, পরীক্ষার ফলাফল, সনদপত্র বা যেকোনো একাডেমিক প্রয়োজনে অফিস চলাকালীন সময়ে সরাসরি বিদ্যালয় অফিসে যোগাযোগ করুন।',
                      'Visit our campus office during working hours for admission, exam records, certificates, or academic assistance.'
                    )}
                  </p>
                </div>

                <dl className="space-y-3 pt-1 text-sm">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <dt className="font-semibold text-foreground">
                        {pick('অফিস সময়', 'Office Hours')}
                      </dt>
                      <dd className="text-muted-foreground mt-0.5">
                        {pick(
                          'রবিবার – বৃহস্পতিবার, সকাল ১০:০০ – বিকাল ৪:০০ (শুক্র ও শনিবার ছুটি)',
                          'Sunday – Thursday, 10:00 AM – 4:00 PM (Closed Fri & Sat)'
                        )}
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <dt className="font-semibold text-foreground">
                        {pick('বিদ্যালয়ের ঠিকানা', 'Campus Address')}
                      </dt>
                      <dd className="text-muted-foreground mt-0.5 leading-relaxed">
                        {db.contactInfo.address}
                      </dd>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
                    {db.contactInfo.phone && (
                      <a
                        href={`tel:${db.contactInfo.phone.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary tabular-nums transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{db.contactInfo.phone}</span>
                      </a>
                    )}
                    {db.contactInfo.email && (
                      <a
                        href={`mailto:${db.contactInfo.email}`}
                        className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{db.contactInfo.email}</span>
                      </a>
                    )}
                  </div>
                </dl>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-border">
                <Link href="/contact">
                  <Button variant="primary">
                    <span>{pick('যোগাযোগ ও বার্তা পাঠান', 'Contact & Inquiry')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/faq">
                  <Button variant="outline">{pick('সাধারণ জিজ্ঞাসা (FAQ)', 'FAQ')}</Button>
                </Link>
              </div>
            </div>

            {/* Right 7 Columns — Interactive Google Maps Platform Campus Map */}
            <div className="lg:col-span-7 min-h-[320px] sm:min-h-[360px] border-t lg:border-t-0 lg:border-l border-border">
              <SchoolCampusMap
                schoolName={db.schoolProfile.name}
                address={db.contactInfo.address}
                phone={db.contactInfo.phone}
                fallbackMapUrl={db.contactInfo.mapUrl}
                heightClassName="h-[320px] sm:h-[360px] lg:h-full lg:min-h-[380px]"
                className="rounded-none border-0"
              />
            </div>
          </div>
        </motion.section>
      </div>

      {/* =====================================================================
          INSTITUTIONAL DOCUMENT VIEWER MODAL (PDF / SCANNED IMAGE / OFFICIAL PAD)
         ===================================================================== */}
      <NoticeDocumentModal
        notice={previewNotice}
        school={db.schoolProfile}
        onClose={() => setPreviewNotice(null)}
      />

      {/* =====================================================================
          GALLERY LIGHTBOX MODAL
         ===================================================================== */}
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
    </div>
  );
}
