'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from '@/src/lib/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Mail,
  MapPin,
  Maximize2,
  Phone,
  Printer,
  Search,
  X,
} from 'lucide-react';
import { useGetBootstrapQuery } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import {
  EmptyState,
  getCampusPhoto,
  getCommitteePortrait,
  getLeadershipPortrait,
  getStaffPortrait,
  InstitutionalArtwork,
  LoadingSkeleton,
  PageHeader,
  SchoolEmblem,
} from '@/src/components/shared/Feedback';
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { formatDateLong, formatNumber } from '@/src/lib/formatters';
import { InstitutionContentType, StaffStatus, StaffType } from '@/src/types/enums';
import { triggerPrint } from '@/src/lib/utils/cn';

export function AboutOverviewPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();

  useEffect(() => {
    if (isLoading || typeof window === 'undefined') return;
    if (window.location.hash === '#mission-vision') {
      document.getElementById('mission-vision')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isLoading]);

  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <PageHeader
        title={pick('বিদ্যালয় পরিচিতি', 'About Bhojeshwar High School (BHS)')}
        description={db.schoolProfile.address}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-5">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <SchoolEmblem size={64} />
              <div>
                <h2 className="text-xl font-bold text-primary">{db.schoolProfile.name}</h2>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {db.schoolProfile.nameEn} · EIIN: {db.schoolProfile.eiin} · Code: {db.schoolProfile.schoolCode} · Est.{' '}
                  {formatNumber(db.schoolProfile.establishedYear, locale)}
                </p>
              </div>
            </div>
            <p className="text-base text-foreground/90 leading-relaxed">{db.schoolProfile.description}</p>
            <p className="text-sm font-medium text-primary pt-3 border-t border-border">
              {pick('মূলমন্ত্র:', 'School Motto:')} “{db.schoolProfile.motto ?? 'শিক্ষাই আলো, জ্ঞানই শক্তি'}”
            </p>
          </Card>

          <section id="mission-vision" className="scroll-mt-24 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-6 space-y-2.5">
              <h3 className="text-lg font-bold text-primary">{pick('আমাদের লক্ষ্য (Mission)', 'Our Mission')}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{db.schoolProfile.mission}</p>
            </Card>
            <Card className="p-6 space-y-2.5">
              <h3 className="text-lg font-bold text-primary">{pick('আমাদের দৃষ্টিভঙ্গি (Vision)', 'Our Vision')}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{db.schoolProfile.vision}</p>
            </Card>
          </section>
        </div>
        <div className="lg:col-span-5 space-y-4">
          <InstitutionalArtwork variant="campus-heritage" title={db.schoolProfile.name} subtitle="Est. 1978 · BHS" className="h-56" />
          <Card className="p-5 space-y-3">
            <h3 className="text-base font-bold text-foreground">{pick('সম্পর্কিত বিভাগ', 'Explore More')}</h3>
            <div className="grid grid-cols-2 gap-2.5 text-sm">
              <Link href="/about/history" className="text-primary hover:underline">{pick('ইতিহাস ও ঐতিহ্য', 'History & Heritage')}</Link>
              <Link href="/about/facilities" className="text-primary hover:underline">{pick('ক্যাম্পাস সুবিধা', 'Campus Facilities')}</Link>
              <Link href="/about/leadership" className="text-primary hover:underline">{pick('নেতৃত্বের বাণী', 'Leadership Messages')}</Link>
              <Link href="/about/management-committee" className="text-primary hover:underline">{pick('ম্যানেজিং কমিটি', 'Managing Committee')}</Link>
              <Link href="/about/teachers" className="text-primary hover:underline">{pick('শিক্ষকমণ্ডলী', 'Teachers & Staff')}</Link>
              <Link href="/gallery" className="text-primary hover:underline">{pick('ফটো গ্যালারি', 'Photo Gallery')}</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function AboutHistoryPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const archivePhotos = useMemo(
    () => [
      {
        photo: getCampusPhoto('heritage-building'),
        titleBn: 'ঐতিহ্যবাহী মূল একাডেমিক ভবন ও প্রাঙ্গণ',
        titleEn: 'Historic Main Academic Building & Courtyard',
        categoryBn: 'প্রতিষ্ঠানের স্থাপত্য',
        categoryEn: 'Campus Architecture',
      },
      {
        photo: getCampusPhoto('morning-assembly'),
        titleBn: 'প্রাত্যহিক সমাবেশ ও জাতীয় পতাকা উত্তোলন',
        titleEn: 'Daily Morning Assembly & Flag Courtyard',
        categoryBn: 'শৃঙ্খলা ও ঐতিহ্য',
        categoryEn: 'Discipline & Heritage',
      },
      {
        photo: getCampusPhoto('debate-hall'),
        titleBn: 'বিতর্ক, সাহিত্য ও সহশিক্ষা সাংস্কৃতিক চর্চা',
        titleEn: 'Debate, Literary & Co-Curricular Sessions',
        categoryBn: 'সহশিক্ষা কার্যক্রম',
        categoryEn: 'Co-Curricular Life',
      },
      {
        photo: getCampusPhoto('digital-classroom'),
        titleBn: 'মাল্টিমিডিয়া স্মার্ট শ্রেণিকক্ষ ও পাঠদান',
        titleEn: 'Multimedia Smart Classroom Instruction',
        categoryBn: 'আধুনিক পাঠদান',
        categoryEn: 'Digital Learning',
      },
      {
        photo: getCampusPhoto('science-lab'),
        titleBn: 'সুসজ্জিত বিজ্ঞান ও ব্যবহারিক গবেষণাগার',
        titleEn: 'Equipped Science & Practical Laboratory',
        categoryBn: 'বিজ্ঞান চর্চা',
        categoryEn: 'Science Laboratory',
      },
      {
        photo: getCampusPhoto('library-room'),
        titleBn: 'সমৃদ্ধ বিদ্যালয় গ্রন্থাগার ও পাঠকক্ষ',
        titleEn: 'School Library & Quiet Reading Room',
        categoryBn: 'জ্ঞানচর্চা ও গ্রন্থাগার',
        categoryEn: 'School Library',
      },
    ],
    []
  );

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null);
      if (e.key === 'ArrowRight') {
        setLightboxIdx((prev) => (prev === null ? null : (prev + 1) % archivePhotos.length));
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIdx((prev) =>
          prev === null ? null : (prev - 1 + archivePhotos.length) % archivePhotos.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIdx, archivePhotos.length]);

  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton rows={6} /></div>;

  const historyItems = db.institutionContents.filter(
    (c) =>
      c.isPublished &&
      [InstitutionContentType.HISTORY, InstitutionContentType.TRADITION, InstitutionContentType.INFRASTRUCTURE].includes(
        c.type
      )
  );

  const establishedYear = db.schoolProfile.establishedYear ?? 1978;
  const yearsSinceEst = 2026 - establishedYear;
  const activeStaffCount = db.staff.filter((s) => s.status === StaffStatus.ACTIVE).length;
  const activeFacilities = db.facilities.filter((f) => f.isActive);
  const heroPhoto = getCampusPhoto('heritage-building');

  const getChapterMeta = (type: InstitutionContentType, index: number) => {
    const chapterNum = formatNumber(index + 1, locale).padStart(2, locale === 'bn' ? '০' : '0');
    if (type === InstitutionContentType.HISTORY) {
      return {
        kicker: `${chapterNum} · ${pick('প্রতিষ্ঠার ইতিহাস', 'Founding Heritage')}`,
        photo: getCampusPhoto('morning-assembly'),
        captionBn: 'বিদ্যালয় প্রাঙ্গণে প্রাত্যহিক সমাবেশ ও শৃঙ্খলাবদ্ধ শিক্ষাজীবন।',
        captionEn: 'Morning assembly and disciplined campus life on the school courtyard.',
        archiveIndex: 1,
        points: [
          pick(`প্রতিষ্ঠাকাল: ১ জানুয়ারি ${formatNumber(establishedYear, 'bn')} খ্রিস্টাব্দ`, `Founded: January 1, ${establishedYear}`),
          pick('অবস্থান: ভোজেশ্বর, নড়িয়া, শরীয়তপুর', 'Location: Bhojeshwar, Noria, Shariatpur'),
          pick(`EIIN: ${db.schoolProfile.eiin ?? '113587'} · কোড: ${db.schoolProfile.schoolCode ?? 'BHS'}`, `EIIN: ${db.schoolProfile.eiin ?? '113587'} · Code: ${db.schoolProfile.schoolCode ?? 'BHS'}`),
        ],
      };
    }
    if (type === InstitutionContentType.TRADITION) {
      return {
        kicker: `${chapterNum} · ${pick('ঐতিহ্য ও সহশিক্ষা', 'Tradition & Co-Curricular')}`,
        photo: getCampusPhoto('debate-hall'),
        captionBn: 'আন্তঃশ্রেণি বিতর্ক, সাহিত্য ও সাংস্কৃতিক প্রতিযোগিতায় শিক্ষার্থীদের অংশগ্রহণ।',
        captionEn: 'Students participating in inter-class debate, literary, and cultural programs.',
        archiveIndex: 2,
        points: [
          pick('নিয়মিত বিতর্ক, সাহিত্য চর্চা ও বিজ্ঞান মেলা', 'Regular debate, literary clubs, and science fairs'),
          pick('স্কাউটিং, বার্ষিক ক্রীড়া ও জাতীয় দিবস উদযাপন', 'Scouting, annual athletics, and national observances'),
          pick('নৈতিক মূল্যবোধ ও নেতৃত্বগুণের ধারাবাহিক বিকাশ', 'Sustained development of ethics and leadership'),
        ],
      };
    }
    return {
      kicker: `${chapterNum} · ${pick('অবকাঠামো ও ক্যাম্পাস', 'Infrastructure & Campus')}`,
      photo: getCampusPhoto('digital-classroom'),
      captionBn: 'মাল্টিমিডিয়া স্মার্ট শ্রেণিকক্ষ ও আধুনিক শিক্ষা উপকরণে পাঠদান।',
      captionEn: 'Interactive instruction in multimedia smart classrooms.',
      archiveIndex: 3,
      points: activeFacilities.slice(0, 3).map((f) => f.name),
    };
  };

  const milestones = [
    {
      phaseBn: `০১ · ${formatNumber(establishedYear, 'bn')}`,
      phaseEn: `01 · ${establishedYear}`,
      titleBn: 'প্রতিষ্ঠালগ্ন ও যাত্রা শুরু',
      titleEn: 'Foundation & Beginnings',
      descBn:
        'ভোজেশ্বর, নড়িয়া, শরীয়তপুরের শিক্ষানুরাগী ব্যক্তিবর্গের উদ্যোগে এলাকার শিক্ষার্থীদের মাধ্যমিক শিক্ষার সুযোগ বিস্তারে বিদ্যালয়টি প্রতিষ্ঠিত হয়।',
      descEn:
        'Established through local community initiative in Bhojeshwar, Noria, Shariatpur to widen access to secondary education.',
    },
    {
      phaseBn: '০২ · একাডেমিক সম্প্রসারণ',
      phaseEn: '02 · Academic Expansion',
      titleBn: 'পূর্ণাঙ্গ মাধ্যমিক ও তিন বিভাগ',
      titleEn: 'Full Secondary & Three Streams',
      descBn:
        '৬ষ্ঠ থেকে ১০ম শ্রেণি পর্যন্ত পাঠদান এবং ৯ম–১০ম শ্রেণিতে বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা বিভাগে বোর্ড অনুমোদিত পাঠ্যক্রম চালু হয়।',
      descEn:
        'Expanded across Classes 6–10 with structured Science, Humanities, and Business Studies streams for secondary board candidates.',
    },
    {
      phaseBn: '০৩ · ক্যাম্পাস ও সহশিক্ষা',
      phaseEn: '03 · Campus & Co-Curricular',
      titleBn: 'গবেষণাগার, গ্রন্থাগার ও ক্রীড়া',
      titleEn: 'Labs, Library & Athletics',
      descBn:
        'বিজ্ঞান গবেষণাগার, সমৃদ্ধ বিদ্যালয় গ্রন্থাগার, প্রশস্ত খেলার মাঠ এবং নিয়মিত বিতর্ক, বিজ্ঞান মেলা ও বার্ষিক ক্রীড়া ঐতিহ্য গড়ে ওঠে।',
      descEn:
        'Developed equipped science laboratories, a dedicated library, an open sports ground, and active debate and athletic traditions.',
    },
    {
      phaseBn: '০৪ · বর্তমান পর্যায়',
      phaseEn: '04 · Modern Digital Era',
      titleBn: 'ডিজিটাল শিক্ষা ও স্মার্ট ব্যবস্থাপনা',
      titleEn: 'Digital Learning & Smart Campus',
      descBn:
        'মাল্টিমিডিয়া স্মার্ট শ্রেণিকক্ষ, কম্পিউটার ল্যাব, ডিজিটাল হাজিরা (RFID) এবং অনলাইন ফলাফল ও ভর্তি সেবার মাধ্যমে আধুনিকায়ন অব্যাহত রয়েছে।',
      descEn:
        'Continues modernizing with multimedia classrooms, ICT computer labs, RFID attendance, online admission, and digital result access.',
    },
  ];

  const activeLightbox = lightboxIdx !== null ? archivePhotos[lightboxIdx] : null;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-12">
      {/* Top Breadcrumb & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            {pick('হোম', 'Home')}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/about" className="hover:text-primary transition-colors">
            {pick('বিদ্যালয় পরিচিতি', 'About School')}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground font-medium">{pick('ইতিহাস ও ঐতিহ্য', 'History & Heritage')}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/about/facilities">
            <Button variant="outline" size="sm">
              {pick('ক্যাম্পাস সুবিধা', 'Facilities')}
            </Button>
          </Link>
          <Link href="/about/leadership">
            <Button variant="outline" size="sm">
              {pick('নেতৃত্বের বাণী', 'Leadership')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Editorial Split Heritage Hero */}
      <section className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 p-6 sm:p-9 lg:p-11 flex flex-col justify-between gap-7">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-medium text-muted-foreground tabular-nums">
                <span className="font-semibold text-primary">
                  {pick(`স্থাপিত: ${formatNumber(establishedYear, 'bn')} খ্রি.`, `Est. ${establishedYear}`)}
                </span>
                <span aria-hidden="true">·</span>
                <span>EIIN: {db.schoolProfile.eiin ?? '113587'}</span>
                <span aria-hidden="true">·</span>
                <span>{pick('ভোজেশ্বর, নড়িয়া, শরীয়তপুর', 'Bhojeshwar, Noria, Shariatpur')}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight text-balance">
                {pick('ইতিহাস ও গৌরবময় ঐতিহ্য', 'Institutional History & Heritage')}
              </h1>

              <p className="text-base text-foreground/90 leading-[1.8] max-w-[65ch]">
                {db.schoolProfile.description}
              </p>

              <div className="py-3.5 border-y border-border/80">
                <p className="text-base font-medium text-foreground">
                  “{db.schoolProfile.motto ?? 'শিক্ষাই আলো, জ্ঞানই শক্তি'}” —{' '}
                  <span className="text-muted-foreground font-normal">
                    {pick(
                      `${formatNumber(yearsSinceEst, 'bn')}+ বছর ধরে নড়িয়া ও শরীয়তপুর অঞ্চলে মানসম্মত মাধ্যমিক শিক্ষার নির্ভরযোগ্য বিদ্যাপীঠ।`,
                      `Over ${yearsSinceEst} years of dedicated secondary education in Noria, Shariatpur.`
                    )}
                  </span>
                </p>
              </div>
            </div>

            {/* Verified Institutional Snapshot (Strictly Real DB Facts) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 tabular-nums">
              <div>
                <p className="text-xs text-muted-foreground">{pick('প্রতিষ্ঠাকাল', 'Established')}</p>
                <p className="text-lg font-bold text-primary mt-0.5">
                  {formatNumber(establishedYear, locale)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{pick('শিক্ষা স্তর', 'Academic Levels')}</p>
                <p className="text-lg font-bold text-foreground mt-0.5">
                  {pick('৬ষ্ঠ–১০ম', 'Classes 6–10')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{pick('বিভাগসমূহ', 'Streams')}</p>
                <p className="text-lg font-bold text-foreground mt-0.5">
                  {formatNumber(db.academicGroups.length, locale)} {pick('টি', '')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{pick('শিক্ষক ও কর্মচারী', 'Faculty & Staff')}</p>
                <p className="text-lg font-bold text-foreground mt-0.5">
                  {formatNumber(activeStaffCount, locale)} {pick('জন', '')}
                </p>
              </div>
            </div>
          </div>

          {/* Right Hero Campus Architecture Photograph */}
          <div className="lg:col-span-6 relative min-h-[280px] sm:min-h-[380px] lg:min-h-full bg-surface-muted overflow-hidden group">
            <img
              src={heroPhoto.src}
              alt={locale === 'bn' ? heroPhoto.altBn : heroPhoto.altEn}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-white/80">
                  {pick('চিত্র ০১ · মূল ক্যাম্পাস', 'Fig. 01 · Main Campus')}
                </p>
                <p className="text-sm sm:text-base font-semibold text-white mt-0.5">
                  {pick('ভোজেশ্বর উচ্চ বিদ্যালয় মূল একাডেমিক ভবন ও প্রাঙ্গণ', 'Bhojeshwar High School Main Academic Building & Courtyard')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxIdx(0)}
                aria-label={pick('ছবি বড় করে দেখুন', 'View full photo')}
                className="h-9 w-9 rounded-lg bg-black/45 hover:bg-black/65 border border-white/25 text-white inline-flex items-center justify-center shrink-0 backdrop-blur-sm transition-colors cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Alternating Editorial Narrative Chapters (DB Institution Contents + Documentary Photography) */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            {pick('প্রতিষ্ঠানের পথচলা ও মূল স্তম্ভসমূহ', 'Founding Story & Core Pillars')}
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl">
            {pick(
              'প্রতিষ্ঠার ইতিহাস, নৈতিক ও সহশিক্ষা ঐতিহ্য এবং আধুনিক একাডেমিক পরিবেশের সমন্বয়ে গড়ে উঠেছে আমাদের বিদ্যালয়।',
              'Built on founding heritage, disciplined co-curricular tradition, and a supportive learning environment.'
            )}
          </p>
        </div>

        <div className="space-y-6">
          {historyItems.map((item, idx) => {
            const meta = getChapterMeta(item.type, idx);
            const reverseOnDesktop = idx % 2 === 1;
            return (
              <article
                key={item.id}
                className="bg-surface border border-border rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch"
              >
                <div
                  className={`lg:col-span-5 relative aspect-[4/3] lg:aspect-auto lg:min-h-[320px] bg-surface-muted overflow-hidden group ${
                    reverseOnDesktop ? 'lg:order-2' : ''
                  }`}
                >
                  <img
                    src={meta.photo.src}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 px-4 py-3 flex items-end justify-between gap-2">
                    <p className="text-xs sm:text-sm text-white/95 leading-snug">
                      {locale === 'bn' ? meta.captionBn : meta.captionEn}
                    </p>
                    <button
                      type="button"
                      onClick={() => setLightboxIdx(meta.archiveIndex)}
                      aria-label={pick('ছবি বড় করে দেখুন', 'Expand image')}
                      className="h-8 w-8 rounded-lg bg-black/45 hover:bg-black/65 border border-white/25 text-white inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div
                  className={`lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center space-y-4 ${
                    reverseOnDesktop ? 'lg:order-1' : ''
                  }`}
                >
                  <p className="text-sm font-semibold text-primary tabular-nums">{meta.kicker}</p>
                  <h3 className="text-2xl font-bold text-foreground tracking-tight leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-base text-muted-foreground leading-[1.85] max-w-[65ch]">
                    {item.description}
                  </p>
                  {meta.points.length > 0 && (
                    <ul className="pt-4 border-t border-border/80 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-foreground/90">
                      {meta.points.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2">
                          <span className="text-primary font-bold" aria-hidden="true">·</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Chronological Institutional Journey */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {pick('ধারাবাহিক অগ্রযাত্রার ধাপসমূহ', 'Institutional Milestones')}
            </h2>
            <p className="text-base text-muted-foreground">
              {pick(
                '১৯৭৮ সাল থেকে বর্তমান ডিজিটাল ক্যাম্পাস পর্যন্ত বিবর্তনের প্রধান অধ্যায়।',
                'Key stages of growth from our 1978 founding to today’s digital campus.'
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {milestones.map((m, i) => (
            <Card key={i} className="p-6 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-primary tabular-nums">
                  {locale === 'bn' ? m.phaseBn : m.phaseEn}
                </p>
                <h3 className="text-lg font-bold text-foreground leading-snug">
                  {locale === 'bn' ? m.titleBn : m.titleEn}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {locale === 'bn' ? m.descBn : m.descEn}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Curated Campus Visual Archive with Interactive Lightbox */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {pick('ক্যাম্পাস চিত্রশালা', 'Campus Visual Archive')}
            </h2>
            <p className="text-base text-muted-foreground">
              {pick(
                'একাডেমিক ভবন, প্রাত্যহিক সমাবেশ, বিতর্ক ও সাংস্কৃতিক প্রাঙ্গণ, স্মার্ট ক্লাসরুম, বিজ্ঞানাগার ও গ্রন্থাগারের নির্বাচিত স্থিরচিত্র। যেকোনো ছবিতে ক্লিক করে বড় করে দেখুন।',
                'Selected views of our academic buildings, assembly courtyard, debate hall, smart classrooms, laboratories, and library. Click any photograph to inspect full size.'
              )}
            </p>
          </div>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline whitespace-nowrap"
          >
            <span>{pick('সম্পূর্ণ ফটো গ্যালারি', 'Full Photo Gallery')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {archivePhotos.map((entry, idx) => (
            <figure
              key={idx}
              className="group bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/45 transition-colors"
            >
              <button
                type="button"
                onClick={() => setLightboxIdx(idx)}
                className="block w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-muted">
                  <img
                    src={entry.photo.src}
                    alt={locale === 'bn' ? entry.titleBn : entry.titleEn}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="h-10 w-10 rounded-full bg-black/55 text-white border border-white/25 inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-4 h-4" />
                    </span>
                  </div>
                </div>
                <figcaption className="p-4 space-y-1">
                  <p className="text-xs font-medium text-primary tabular-nums">
                    {pick(`চিত্র ০${formatNumber(idx + 1, 'bn')}`, `Fig. 0${idx + 1}`)} ·{' '}
                    {locale === 'bn' ? entry.categoryBn : entry.categoryEn}
                  </p>
                  <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                    {locale === 'bn' ? entry.titleBn : entry.titleEn}
                  </p>
                </figcaption>
              </button>
            </figure>
          ))}
        </div>
      </section>

      {/* Verified Institutional Identity Fact Sheet & Next Links */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Card className="lg:col-span-8 p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3.5 pb-4 border-b border-border">
            <SchoolEmblem size={48} />
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {pick('প্রতিষ্ঠানের মৌলিক তথ্যপঞ্জি', 'Verified Institutional Record')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {db.schoolProfile.name} · {db.schoolProfile.nameEn}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm sm:text-base tabular-nums">
            <div className="pb-3 border-b border-border/70">
              <dt className="text-xs text-muted-foreground">{pick('প্রতিষ্ঠাকাল', 'Established')}</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {pick(`১ জানুয়ারি ${formatNumber(establishedYear, 'bn')} খ্রিস্টাব্দ`, `January 1, ${establishedYear}`)}
              </dd>
            </div>
            <div className="pb-3 border-b border-border/70">
              <dt className="text-xs text-muted-foreground">{pick('EIIN ও বিদ্যালয় কোড', 'EIIN & School Code')}</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                EIIN: {db.schoolProfile.eiin ?? '113587'} · {pick('কোড:', 'Code:')} {db.admissionContent.schoolCode ?? db.schoolProfile.schoolCode ?? 'BHS'}
              </dd>
            </div>
            <div className="pb-3 border-b border-border/70">
              <dt className="text-xs text-muted-foreground">{pick('শিক্ষা স্তর ও বিভাগ', 'Classes & Streams')}</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {pick('৬ষ্ঠ–১০ম শ্রেণি · বিজ্ঞান, মানবিক, ব্যবসায় শিক্ষা', 'Classes 6–10 · Science, Humanities, Business')}
              </dd>
            </div>
            <div className="pb-3 border-b border-border/70">
              <dt className="text-xs text-muted-foreground">{pick('জেলা ও থানা কোড', 'District & Upazila Code')}</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {pick('জেলা:', 'District:')} {db.admissionContent.districtCode ?? '—'} · {pick('থানা:', 'Thana:')} {db.admissionContent.thanaCode ?? '—'}
              </dd>
            </div>
            <div className="sm:col-span-2 pb-1">
              <dt className="text-xs text-muted-foreground">{pick('ঠিকানা ও অবস্থান', 'Campus Address')}</dt>
              <dd className="font-semibold text-foreground mt-0.5">{db.schoolProfile.address}</dd>
            </div>
          </dl>
        </Card>

        <Card className="lg:col-span-4 p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            {pick('আরও জানুন', 'Continue Exploring')}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {pick(
              'বিদ্যালয়ের নেতৃত্ব, পরিচালনা পর্ষদ, অভিজ্ঞ শিক্ষকমণ্ডলী ও ক্যাম্পাস সুযোগ-সুবিধা সম্পর্কে বিস্তারিত দেখুন।',
              'Explore school leadership, governing body, faculty members, and campus facilities.'
            )}
          </p>
          <div className="divide-y divide-border text-sm">
            {[
              { to: '/about', label: pick('বিদ্যালয় পরিচিতি, লক্ষ্য ও দৃষ্টিভঙ্গি', 'About, Mission & Vision') },
              { to: '/about/facilities', label: pick('অবকাঠামো ও ক্যাম্পাস সুবিধা', 'Facilities & Infrastructure') },
              { to: '/about/leadership', label: pick('প্রধান শিক্ষক ও সভাপতির বাণী', 'Leadership Messages') },
              { to: '/about/management-committee', label: pick('বিদ্যালয় ম্যানেজিং কমিটি', 'Managing Committee') },
              { to: '/about/teachers', label: pick('শিক্ষকমণ্ডলী ও কর্মচারী তালিকা', 'Teachers & Staff Directory') },
            ].map((lnk) => (
              <Link
                key={lnk.to}
                href={lnk.to}
                className="flex items-center justify-between py-2.5 font-medium text-foreground hover:text-primary transition-colors"
              >
                <span>{lnk.label}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </Card>
      </section>

      {/* Accessible Full-Screen Photo Lightbox */}
      {activeLightbox && lightboxIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={locale === 'bn' ? activeLightbox.titleBn : activeLightbox.titleEn}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setLightboxIdx(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-[#0A140F] border border-white/15 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-white/15 text-white">
              <div className="min-w-0">
                <p className="text-xs text-white/70 tabular-nums">
                  {formatNumber(lightboxIdx + 1, locale)} / {formatNumber(archivePhotos.length, locale)} ·{' '}
                  {locale === 'bn' ? activeLightbox.categoryBn : activeLightbox.categoryEn}
                </p>
                <p className="text-base font-semibold truncate">
                  {locale === 'bn' ? activeLightbox.titleBn : activeLightbox.titleEn}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxIdx(null)}
                aria-label={pick('বন্ধ করুন', 'Close')}
                className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-black flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={activeLightbox.photo.src}
                alt={locale === 'bn' ? activeLightbox.titleBn : activeLightbox.titleEn}
                referrerPolicy="no-referrer"
                className="w-full max-h-[75vh] object-contain"
              />
              <button
                type="button"
                onClick={() =>
                  setLightboxIdx((lightboxIdx - 1 + archivePhotos.length) % archivePhotos.length)
                }
                aria-label={pick('পূর্ববর্তী ছবি', 'Previous photo')}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 border border-white/25 text-white inline-flex items-center justify-center cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxIdx((lightboxIdx + 1) % archivePhotos.length)}
                aria-label={pick('পরবর্তী ছবি', 'Next photo')}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 border border-white/25 text-white inline-flex items-center justify-center cursor-pointer transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AboutFacilitiesPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <PageHeader
        title={pick('অবকাঠামো ও ক্যাম্পাস সুবিধা', 'Facilities & Infrastructure')}
        description={pick(
          'কনফিগারকৃত বিজ্ঞানাগার, কম্পিউটার ল্যাব, গ্রন্থাগার, মাল্টিমিডিয়া শ্রেণিকক্ষ ও খেলার মাঠ।',
          'Configured laboratories, digital classrooms, library, and playground facilities.'
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {db.facilities
          .filter((f) => f.isActive)
          .map((fac) => (
            <Card key={fac.id} className="overflow-hidden flex flex-col">
              <InstitutionalArtwork
                variant={
                  fac.type === 'LIBRARY'
                    ? 'library-room'
                    : fac.type === 'LAB'
                      ? 'science-lab'
                      : fac.type === 'PLAYGROUND'
                        ? 'sports-day'
                        : 'digital-classroom'
                }
                className="h-36 rounded-none"
              />
              <div className="p-5 space-y-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-bold text-foreground">{fac.name}</h2>
                  <StatusBadge enumName="FacilityType" value={fac.type} />
                </div>
                <p className="text-base text-muted-foreground leading-relaxed">{fac.description}</p>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}

export function AboutLeadershipPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const published = db.leadershipMessages.filter((m) => m.isPublished);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <PageHeader
        title={pick('প্রধান শিক্ষক ও সভাপতির বাণী', 'Leadership Messages')}
        description={pick(
          'ভোজেশ্বর উচ্চ বিদ্যালয়ের প্রাতিষ্ঠানিক নেতৃত্ব, শিক্ষা দর্শন ও দিকনির্দেশনা।',
          'Institutional leadership, educational philosophy, and messages from Bhojeshwar High School.'
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {published.map((msg) => {
          const portrait = getLeadershipPortrait(msg.photo, msg.type);
          const roleKicker =
            msg.type === 'PRINCIPAL'
              ? pick('প্রধান শিক্ষকের বাণী', "Headteacher's Message")
              : pick('সভাপতির বাণী', "Chairman's Message");
          return (
            <Card key={msg.id} className="overflow-hidden flex flex-col justify-between">
              <div>
                <Link
                  href={`/about/leadership/${msg.id}`}
                  className="block relative aspect-[4/3] w-full overflow-hidden bg-surface-muted group"
                >
                  <img
                    src={portrait}
                    alt={msg.personName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                  <span className="absolute bottom-3 left-5 text-sm font-semibold text-white">
                    {roleKicker}
                  </span>
                </Link>
                <div className="p-6 space-y-3">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      <Link href={`/about/leadership/${msg.id}`} className="hover:text-primary transition-colors">
                        {msg.personName}
                      </Link>
                    </h2>
                    <p className="text-sm text-primary font-medium">{msg.designation}</p>
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed line-clamp-4">
                    “{msg.message.split('\n')[0]}”
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 pt-3 border-t border-border/80 flex items-center justify-between">
                <Link
                  href={`/about/leadership/${msg.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  <span>{pick('সম্পূর্ণ বাণী পড়ুন', 'Read Full Message')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-xs text-muted-foreground">{db.schoolProfile.schoolCode ?? 'BHS'}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function AboutLeadershipDetailPage() {
  const { id } = useParams();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();

  if (isLoading || !db) {
    return (
      <div className="max-w-[1440px] mx-auto p-6">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  const published = db.leadershipMessages.filter((m) => m.isPublished);
  const msg = published.find((m) => m.id === id);

  if (!msg) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12 space-y-4">
        <Link href="/about/leadership" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>{pick('সকল বাণীতে ফিরে যান', 'Back to Leadership Messages')}</span>
        </Link>
        <EmptyState />
      </div>
    );
  }

  const portrait = getLeadershipPortrait(msg.photo, msg.type);
  const isPrincipal = msg.type === 'PRINCIPAL';
  const roleTitle = isPrincipal
    ? pick('প্রধান শিক্ষকের বাণী', "Message from the Headteacher")
    : pick('সভাপতির বাণী', "Message from the Chairman");
  const paragraphs = msg.message
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);
  const otherLeaders = published.filter((item) => item.id !== msg.id);
  const activeTeachersCount = db.staff.filter(
    (s) => s.staffType === StaffType.TEACHER && s.status === StaffStatus.ACTIVE
  ).length;
  const yearsSinceEst = 2026 - (db.schoolProfile.establishedYear ?? 1978);

  const campusShowcase = [
    {
      photo: getCampusPhoto('campus-heritage'),
      captionBn: 'ঐতিহ্যবাহী মূল ক্যাম্পাস প্রাঙ্গণ (স্থাপিত ১৯৭৮)',
      captionEn: 'Heritage campus courtyard (Est. 1978)',
    },
    {
      photo: getCampusPhoto('digital-classroom'),
      captionBn: 'মাল্টিমিডিয়া স্মার্ট শ্রেণিকক্ষ ও পাঠদান',
      captionEn: 'Multimedia smart classroom session',
    },
    {
      photo: getCampusPhoto('science-lab'),
      captionBn: 'আধুনিক বিজ্ঞান ও আইসিটি গবেষণাগার',
      captionEn: 'Science & ICT practical laboratory',
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* Top Breadcrumb & Print Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            {pick('হোম', 'Home')}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/about/leadership" className="hover:text-primary transition-colors">
            {pick('নেতৃত্বের বাণী', 'Leadership')}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground font-medium">{roleTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/about/leadership"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{pick('সব বাণী', 'All Messages')}</span>
          </Link>
          <span className="text-border" aria-hidden="true">|</span>
          <button
            type="button"
            onClick={triggerPrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-sm font-medium text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{pick('প্রিন্ট করুন', 'Print')}</span>
          </button>
        </div>
      </div>

      {/* Editorial Leader Profile Header (Full Portrait + Identity + School Motto) */}
      <section className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Full Clear Editorial Portrait */}
          <div className="lg:col-span-4 relative bg-surface-muted min-h-[320px] sm:min-h-[380px] lg:min-h-[420px]">
            <img
              src={portrait}
              alt={msg.personName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
          </div>

          {/* Editorial Intro & Institutional Identity */}
          <div className="lg:col-span-8 p-6 sm:p-9 lg:p-10 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-medium text-muted-foreground tabular-nums">
                <span className="font-semibold text-primary">{roleTitle}</span>
                <span aria-hidden="true">·</span>
                <span>{db.schoolProfile.name}</span>
                <span aria-hidden="true">·</span>
                <span>EIIN: {db.schoolProfile.eiin ?? '113587'}</span>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight text-balance">
                  {msg.personName}
                </h1>
                <p className="text-base font-medium text-primary">
                  {msg.designation}
                </p>
              </div>

              {/* Clean Pull-Quote Highlight separated by subtle hairlines */}
              <div className="py-4 my-2 border-y border-border/80">
                <p className="text-base sm:text-lg font-medium text-foreground/95 leading-relaxed">
                  “{db.schoolProfile.motto ?? 'শিক্ষাই আলো, জ্ঞানই শক্তি'}” —{' '}
                  <span className="text-muted-foreground font-normal text-base">
                    {isPrincipal
                      ? pick(
                          'মানসম্মত মাধ্যমিক শিক্ষা, বিজ্ঞানমনস্ক চর্চা ও নৈতিক মূল্যবোধের সমন্বয়ে আগামীর আলোকিত প্রজন্ম গড়ে তোলাই আমাদের অঙ্গীকার।',
                          'Building an enlightened generation through quality secondary education, scientific curiosity, and enduring ethical values.'
                        )
                      : pick(
                          'সুশৃঙ্খল, নিরাপদ ও আধুনিক শিক্ষার পরিবেশ নিশ্চিত করে ভোজেশ্বর উচ্চ বিদ্যালয়কে জেলার আদর্শ প্রতিষ্ঠানে রূপান্তরিত করাই আমাদের লক্ষ্য।',
                          'Ensuring a disciplined, safe, and modern campus environment to uphold Bhojeshwar High School as an exemplary institution.'
                        )}
                  </span>
                </p>
              </div>
            </div>

            {/* Quiet Institutional Metadata Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm tabular-nums">
              <div>
                <p className="text-xs text-muted-foreground">{pick('প্রতিষ্ঠান স্থাপিত', 'Established')}</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {formatNumber(db.schoolProfile.establishedYear ?? 1978, locale)} {pick('খ্রি.', '')} ({formatNumber(yearsSinceEst, locale)}+ {pick('বছর', 'yrs')})
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{pick('অবস্থান', 'Location')}</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {pick('ভোজেশ্বর, নড়িয়া, শরীয়তপুর', 'Bhojeshwar, Noria, Shariatpur')}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-muted-foreground">{pick('শিক্ষা স্তর', 'Academic Scope')}</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {pick('৬ষ্ঠ–১০ম শ্রেণি (৩ বিভাগ)', 'Classes 6–10 (3 Streams)')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Asymmetric Editorial Reading Body + Institutional Context Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Cols: Complete Individual Message + Signature + Campus Visual Gallery */}
        <div className="lg:col-span-8 space-y-8">
          <article className="bg-surface border border-border rounded-2xl p-6 sm:p-9 space-y-6">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <SchoolEmblem size={42} />
                <div>
                  <h2 className="text-lg font-bold text-foreground">{roleTitle}</h2>
                  <p className="text-sm text-muted-foreground">
                    {db.schoolProfile.name} · {pick('ভোজেশ্বর, নড়িয়া, শরীয়তপুর', 'Bhojeshwar, Noria, Shariatpur')}
                  </p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground tabular-nums hidden sm:inline">
                {formatDateLong(msg.updatedAt, locale)}
              </span>
            </div>

            {/* Individual Full Message Paragraphs */}
            <div className="space-y-4 text-base text-foreground/90 leading-[1.85] max-w-[68ch]">
              {paragraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            {/* Dignified Institutional Sign-Off */}
            <div className="pt-6 mt-6 border-t border-border flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{pick('শুভেচ্ছান্তে,', 'With warm regards,')}</p>
                <svg
                  viewBox="0 0 160 40"
                  className="w-28 h-7 text-secondary/80 my-1"
                  aria-hidden="true"
                >
                  <path
                    d="M12 28 C25 10, 38 11, 44 24 C49 34, 60 15, 72 17 C82 19, 80 28, 92 23 C106 18, 120 13, 134 21 C141 24, 148 19, 152 17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-base font-bold text-foreground">{msg.personName}</p>
                <p className="text-sm text-muted-foreground">{msg.designation}</p>
                <p className="text-sm text-muted-foreground">{db.schoolProfile.name}</p>
              </div>

              <div className="flex flex-wrap gap-2 no-print">
                <Link href="/admission">
                  <Button variant="primary" size="sm">
                    {pick('ভর্তি তথ্য দেখুন', 'Admission Info')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" size="sm">
                    {pick('যোগাযোগ করুন', 'Contact Office')}
                  </Button>
                </Link>
              </div>
            </div>
          </article>

          {/* Campus Visuals Showcase (Living Context of the Institution) */}
          <div className="space-y-4 no-print">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {pick('আমাদের ক্যাম্পাস ও শিক্ষার পরিবেশ', 'Our Campus & Learning Environment')}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {pick(
                    'ঐতিহ্যবাহী একাডেমিক ভবন, স্মার্ট শ্রেণিকক্ষ ও আধুনিক গবেষণাগার।',
                    'Heritage academic campus, multimedia classrooms, and equipped laboratories.'
                  )}
                </p>
              </div>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline whitespace-nowrap"
              >
                <span>{pick('ফটো গ্যালারি', 'Photo Gallery')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {campusShowcase.map((item, i) => (
                <figure
                  key={i}
                  className="bg-surface border border-border rounded-xl overflow-hidden"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-surface-muted">
                    <img
                      src={item.photo.src}
                      alt={locale === 'bn' ? item.captionBn : item.captionEn}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <figcaption className="px-3.5 py-2.5 text-sm text-muted-foreground leading-snug">
                    {locale === 'bn' ? item.captionBn : item.captionEn}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Institutional Context, Mission/Vision, Contact & Other Leadership */}
        <aside className="lg:col-span-4 space-y-5 no-print">
          {/* School Snapshot Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <SchoolEmblem size={46} />
              <div className="min-w-0">
                <h3 className="text-base font-bold text-foreground truncate">
                  {db.schoolProfile.name}
                </h3>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {pick('স্থাপিত ১৯৭৮ · EIIN ১১৩৫৮৭', 'Est. 1978 · EIIN 113587')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border text-sm tabular-nums">
              <div className="p-3 rounded-lg bg-surface-muted/60">
                <p className="text-xl font-bold text-primary">{formatNumber(yearsSinceEst, locale)}+</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pick('বছরের ঐতিহ্য', 'Years Heritage')}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-surface-muted/60">
                <p className="text-xl font-bold text-primary">{formatNumber(activeTeachersCount, locale)}+</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pick('অভিজ্ঞ শিক্ষক', 'Faculty Members')}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{db.schoolProfile.address}</span>
              </p>
              {db.contactInfo.phone && (
                <a
                  href={`tel:${db.contactInfo.phone}`}
                  className="flex items-center gap-2 hover:text-primary transition-colors tabular-nums"
                >
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span>{db.contactInfo.phone}</span>
                </a>
              )}
              {db.contactInfo.email && (
                <a
                  href={`mailto:${db.contactInfo.email}`}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{db.contactInfo.email}</span>
                </a>
              )}
            </div>
          </Card>

          {/* Mission & Vision Summary Card */}
          <Card className="p-5 space-y-3.5">
            <h3 className="text-base font-bold text-foreground">
              {pick('লক্ষ্য ও দৃষ্টিভঙ্গি', 'Mission & Vision')}
            </h3>
            <div className="space-y-2.5 text-sm leading-relaxed">
              <div>
                <p className="font-semibold text-primary mb-0.5">{pick('আমাদের লক্ষ্য', 'Mission')}</p>
                <p className="text-muted-foreground">{db.schoolProfile.mission}</p>
              </div>
              <div className="pt-2.5 border-t border-border">
                <p className="font-semibold text-primary mb-0.5">{pick('আমাদের দৃষ্টিভঙ্গি', 'Vision')}</p>
                <p className="text-muted-foreground">{db.schoolProfile.vision}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-border flex flex-wrap gap-3 text-sm font-semibold text-primary">
              <Link href="/about/history" className="hover:underline inline-flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                <span>{pick('ইতিহাস', 'History')}</span>
              </Link>
              <Link href="/about/teachers" className="hover:underline inline-flex items-center gap-1">
                <GraduationCap className="w-4 h-4" />
                <span>{pick('শিক্ষকমণ্ডলী', 'Faculty')}</span>
              </Link>
              <Link href="/academics/academic-calendar" className="hover:underline inline-flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{pick('ক্যালেন্ডার', 'Calendar')}</span>
              </Link>
            </div>
          </Card>

          {/* Other Leadership Message Navigation */}
          {otherLeaders.length > 0 && (
            <Card className="p-5 space-y-3.5">
              <h3 className="text-base font-bold text-foreground">
                {pick('অন্যান্য নেতৃত্বের বাণী', 'Other Leadership Messages')}
              </h3>
              <div className="space-y-3">
                {otherLeaders.map((other) => (
                  <Link
                    key={other.id}
                    href={`/about/leadership/${other.id}`}
                    className="group flex items-center gap-3 p-2.5 -mx-2.5 rounded-xl hover:bg-surface-muted/70 transition-colors"
                  >
                    <img
                      src={getLeadershipPortrait(other.photo, other.type)}
                      alt={other.personName}
                      referrerPolicy="no-referrer"
                      className="w-14 h-16 rounded-lg object-cover object-top border border-border shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs font-semibold text-primary">
                        {other.type === 'PRINCIPAL'
                          ? pick('প্রধান শিক্ষকের বাণী', "Headteacher's Message")
                          : pick('সভাপতির বাণী', "Chairman's Message")}
                      </p>
                      <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {other.personName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{other.designation}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

export function AboutCommitteePage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const members = db.managingCommittee;
  const executiveMembers = members.slice(0, 2);
  const generalMembers = members.slice(2);
  const chairmanMsg = db.leadershipMessages.find((m) => m.isPublished && m.type === 'CHAIRMAN');
  const principalMsg = db.leadershipMessages.find((m) => m.isPublished && m.type === 'PRINCIPAL');

  const getExecutiveLink = (memberId: string, idx: number) => {
    if (memberId === 'mc-1' || idx === 0) {
      return chairmanMsg
        ? { to: `/about/leadership/${chairmanMsg.id}`, label: pick('সভাপতির বাণী পড়ুন', "Read Chairman's Message") }
        : null;
    }
    if (memberId === 'mc-2' || idx === 1) {
      return principalMsg
        ? { to: `/about/leadership/${principalMsg.id}`, label: pick('প্রধান শিক্ষকের বাণী পড়ুন', "Read Headteacher's Message") }
        : null;
    }
    return null;
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-10">
      <PageHeader
        title={pick('বিদ্যালয় ম্যানেজিং কমিটি', 'Managing Committee')}
        description={pick(
          'ভোজেশ্বর উচ্চ বিদ্যালয় পরিচালনা পর্ষদ · প্রতিষ্ঠানের সুশাসন, একাডেমিক মানোন্নয়ন ও অবকাঠামোগত অগ্রযাত্রায় নিবেদিতপ্রাণ কার্যনির্বাহী পরিষদ।',
          'Governing body of Bhojeshwar High School overseeing institutional governance, academic quality, and campus development.'
        )}
        actions={
          <>
            <Link href="/about/leadership">
              <Button variant="outline" size="sm">
                {pick('নেতৃত্বের বাণী', 'Leadership Messages')}
              </Button>
            </Link>
            <Link href="/about/teachers">
              <Button variant="outline" size="sm">
                {pick('শিক্ষকমণ্ডলী', 'Faculty Directory')}
              </Button>
            </Link>
          </>
        }
      />

      {/* Executive Leadership Tier: Chairman & Member Secretary */}
      {executiveMembers.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              {pick('পরিচালনা পর্ষদের প্রধান নেতৃত্ব', 'Executive Leadership')}
            </h2>
            <p className="text-sm text-muted-foreground tabular-nums">
              {pick('কার্যনির্বাহী সদস্য:', 'Total Members:')} {formatNumber(members.length, locale)}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {executiveMembers.map((member, idx) => {
              const portraitSrc = getCommitteePortrait(member.photo, member.id, member.designation);
              const execLink = getExecutiveLink(member.id, idx);
              const roleKicker =
                idx === 0
                  ? pick('সভাপতি · পরিচালনা পর্ষদ', 'Chairman · Governing Body')
                  : pick('সদস্য সচিব · প্রধান শিক্ষক', 'Member Secretary · Headteacher');
              return (
                <article
                  key={member.id}
                  className="group bg-surface border border-border rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 items-stretch hover:border-primary/45 transition-colors"
                >
                  <div className="sm:col-span-5 relative aspect-[4/4.2] sm:aspect-auto sm:min-h-[290px] overflow-hidden bg-surface-muted">
                    <img
                      src={portraitSrc}
                      alt={member.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 via-black/15 to-transparent sm:hidden pointer-events-none" />
                  </div>

                  <div className="sm:col-span-7 p-6 flex flex-col justify-between gap-5">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-primary">
                        {roleKicker}
                      </p>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-foreground leading-snug">
                          {member.name}
                        </h3>
                        <p className="text-sm font-medium text-muted-foreground">
                          {member.designation}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border/80 space-y-2 text-sm text-muted-foreground tabular-nums">
                        {(member.startDate || member.endDate) && (
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary shrink-0" />
                            <span>
                              {pick('মেয়াদ:', 'Term:')} {formatDateLong(member.startDate, locale)} – {formatDateLong(member.endDate, locale)}
                            </span>
                          </p>
                        )}
                        {member.phone && (
                          <a
                            href={`tel:${member.phone}`}
                            className="flex items-center gap-2 hover:text-primary transition-colors"
                          >
                            <Phone className="w-4 h-4 text-primary shrink-0" />
                            <span>{member.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {execLink && (
                      <div className="pt-3 border-t border-border/80">
                        <Link
                          href={execLink.to}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                        >
                          <span>{execLink.label}</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* General Governing Body Members — Full Editorial Portrait Cards */}
      {generalMembers.length > 0 && (
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              {pick('সম্মানিত সদস্যবৃন্দ', 'Committee Members')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {pick(
                'শিক্ষানুরাগী ও নির্বাচিত অভিভাবক প্রতিনিধি সদস্যবৃন্দ।',
                'Education patrons and elected guardian representatives.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {generalMembers.map((member) => {
              const portraitSrc = getCommitteePortrait(member.photo, member.id, member.designation);
              return (
                <article
                  key={member.id}
                  className="group bg-surface border border-border rounded-2xl overflow-hidden flex flex-col justify-between hover:border-primary/45 transition-colors"
                >
                  <div>
                    <div className="relative aspect-[4/4.2] w-full overflow-hidden bg-surface-muted">
                      <img
                        src={portraitSrc}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none" />
                      <span className="absolute bottom-3 left-4 right-4 text-sm font-semibold text-white/95 leading-snug">
                        {member.designation}
                      </span>
                    </div>

                    <div className="p-5 space-y-2">
                      <h3 className="text-lg font-bold text-foreground leading-snug">
                        {member.name}
                      </h3>
                      <p className="text-sm font-medium text-primary">
                        {member.designation}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-border/80 space-y-1.5 text-sm text-muted-foreground tabular-nums">
                    {(member.startDate || member.endDate) && (
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                        <span>
                          {formatDateLong(member.startDate, locale)} – {formatDateLong(member.endDate, locale)}
                        </span>
                      </p>
                    )}
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <Phone className="w-4 h-4 text-primary shrink-0" />
                        <span>{member.phone}</span>
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Quiet Institutional Governance Footer Strip */}
      <Card className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            {pick('পরিচালনা পর্ষদ ও বিদ্যালয় প্রশাসনের সাথে যোগাযোগ', 'Contact Governing Body & School Office')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {pick(
              'বিদ্যালয়ের নীতিগত বিষয়, অবকাঠামো উন্নয়ন অথবা অভিভাবক পরামর্শের জন্য প্রধান শিক্ষকের কার্যালয়ে যোগাযোগ করুন।',
              'For governance inquiries, campus development proposals, or guardian consultations, please contact the school office.'
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link href="/contact">
            <Button variant="primary" size="sm">
              {pick('যোগাযোগ করুন', 'Contact Office')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="outline" size="sm">
              {pick('বিদ্যালয় পরিচিতি', 'About School')}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export function PublicTeachersListPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const deptFilter = searchParams.get('dept') ?? 'ALL';
  const typeFilter = searchParams.get('type') ?? 'ALL';

  const setFilterParam = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams);
    if (!val || val === 'ALL') next.delete(key);
    else next.set(key, val);
    setSearchParams(next, { replace: true });
  };
  const setSearch = (v: string) => setFilterParam('q', v);
  const setDeptFilter = (v: string) => setFilterParam('dept', v);
  const setTypeFilter = (v: string) => setFilterParam('type', v);

  const filtered = useMemo(() => {
    if (!db) return [];
    return db.staff
      .filter((s) => s.status === StaffStatus.ACTIVE)
      .filter((s) => (typeFilter === 'ALL' ? true : s.staffType === typeFilter))
      .filter((s) => (deptFilter === 'ALL' ? true : s.departmentId === deptFilter))
      .filter((s) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.designation.toLowerCase().includes(q) ||
          (s.qualification ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [db, search, deptFilter, typeFilter]);

  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader
        title={pick('শিক্ষকমণ্ডলী ও কর্মচারীবৃন্দ', 'Teachers & Staff Directory')}
        description={pick(
          'অত্র বিদ্যালয়ের দক্ষ ও নিবেদিতপ্রাণ শিক্ষকমণ্ডলী ও প্রশাসনিক কর্মকর্তাবৃন্দ।',
          'Public faculty and administrative staff directory.'
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={pick('নাম বা পদবি খুঁজুন...', 'Search by name or designation...')}
            className="pl-9"
          />
        </div>
        <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="ALL">{pick('সকল বিভাগ', 'All Departments')}</option>
          {db.departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="ALL">{pick('সকল ধরন', 'All Staff Types')}</option>
          <option value={StaffType.TEACHER}>{pick('শিক্ষক', 'Teachers')}</option>
          <option value={StaffType.OFFICER}>{pick('কর্মকর্তা', 'Officers')}</option>
          <option value={StaffType.EMPLOYEE}>{pick('কর্মচারী', 'Employees')}</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={pick('কোনো শিক্ষক বা কর্মচারী পাওয়া যায়নি', 'No matching staff found')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((member) => {
            const dept = db.departments.find((d) => d.id === member.departmentId);
            const portraitSrc = getStaffPortrait(member.photo, member.gender, member.id);
            return (
              <Link
                key={member.id}
                href={`/about/teachers/${member.id}`}
                className="group bg-surface border border-border rounded-xl overflow-hidden flex flex-col justify-between hover:border-primary/45 transition-colors"
              >
                <div>
                  <div className="relative aspect-[4/4.2] w-full overflow-hidden bg-surface-muted">
                    <img
                      src={portraitSrc}
                      alt={member.name}
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

                  <div className="p-4 space-y-1.5">
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {member.name}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-snug">
                      {member.designation}
                    </p>
                    {member.qualification && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                        <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{member.qualification}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-3.5 pt-2.5 border-t border-border/70 flex items-center justify-between text-sm font-semibold text-primary">
                  <span>{pick('বিস্তারিত প্রোফাইল', 'View Profile')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PublicTeacherDetailPage() {
  const { id } = useParams();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const teacher = db.staff.find((s) => s.id === id);
  if (!teacher) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12">
        <EmptyState
          title={pick('শিক্ষকের তথ্য পাওয়া যায়নি', 'Teacher profile not found')}
          action={
            <Link href="/about/teachers">
              <Button variant="outline">{pick('তালিকায় ফিরুন', 'Back to Directory')}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const dept = db.departments.find((d) => d.id === teacher.departmentId);
  const assignments = db.teacherAssignments.filter((ta) => ta.staffId === teacher.id && ta.isActive);
  const portraitSrc = getStaffPortrait(teacher.photo, teacher.gender, teacher.id);
  const otherTeachers = db.staff
    .filter((s) => s.status === StaffStatus.ACTIVE && s.staffType === StaffType.TEACHER && s.id !== teacher.id)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 4);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Link href="/about/teachers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          {pick('শিক্ষকমণ্ডলীর তালিকায় ফিরুন', 'Back to Teachers Directory')}
        </Link>
        <span className="text-sm text-muted-foreground tabular-nums">
          {db.schoolProfile.name}
        </span>
      </div>

      {/* Editorial Portrait Profile Card */}
      <section className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
          <div className="md:col-span-4 bg-surface-muted min-h-[300px] sm:min-h-[340px]">
            <img
              src={portraitSrc}
              alt={teacher.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
          </div>

          <div className="md:col-span-8 p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {dept && <span className="font-semibold text-primary">{dept.name}</span>}
                {dept && <span aria-hidden="true">·</span>}
                <span>{db.schoolProfile.name}</span>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {teacher.name}
                </h1>
                <p className="text-base font-medium text-primary">
                  {teacher.designation}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border text-sm">
                {teacher.qualification && (
                  <div>
                    <p className="text-xs text-muted-foreground">{pick('শিক্ষাগত যোগ্যতা', 'Qualification')}</p>
                    <p className="font-semibold text-foreground mt-0.5">{teacher.qualification}</p>
                  </div>
                )}
                {teacher.joiningDate && (
                  <div className="tabular-nums">
                    <p className="text-xs text-muted-foreground">{pick('যোগদানের তারিখ', 'Date of Joining')}</p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {formatDateLong(teacher.joiningDate, locale)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Public-safe contact details */}
            <div className="pt-4 border-t border-border flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {teacher.email && (
                <a
                  href={`mailto:${teacher.email}`}
                  className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4 text-primary" />
                  <span>{teacher.email}</span>
                </a>
              )}
              {teacher.phone && (
                <a
                  href={`tel:${teacher.phone}`}
                  className="inline-flex items-center gap-2 hover:text-primary transition-colors tabular-nums"
                >
                  <Phone className="w-4 h-4 text-primary" />
                  <span>{teacher.phone}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Assigned Classes & Subjects */}
      {assignments.length > 0 && (
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            {pick('বর্তমান পাঠদানকৃত শ্রেণি ও বিষয়', 'Assigned Classes & Subjects')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {assignments.map((a) => {
              const cls = db.classes.find((c) => c.id === a.classId);
              const sec = db.sections.find((s) => s.id === a.sectionId);
              const cs = db.classSubjects.find((x) => x.id === a.classSubjectId);
              const sub = cs ? db.subjects.find((s) => s.id === cs.subjectId) : null;
              return (
                <div key={a.id} className="p-3.5 border border-border rounded-xl bg-surface-muted/40 text-sm">
                  <p className="font-semibold text-foreground text-base">
                    {locale === 'bn' ? sub?.nameBn ?? sub?.name : sub?.name}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {locale === 'bn' ? cls?.nameBn : cls?.name} — {pick('শাখা', 'Section')} {sec?.name}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Other Faculty Members Strip */}
      {otherTeachers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              {pick('অন্যান্য শিক্ষকমণ্ডলী', 'Other Faculty Members')}
            </h2>
            <Link href="/about/teachers" className="text-sm font-semibold text-primary hover:underline">
              {pick('সকল শিক্ষক দেখুন', 'View All')}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {otherTeachers.map((other) => (
              <Link
                key={other.id}
                href={`/about/teachers/${other.id}`}
                className="group flex items-center gap-3 p-3 rounded-xl bg-surface border border-border hover:border-primary/45 transition-colors"
              >
                <img
                  src={getStaffPortrait(other.photo, other.gender, other.id)}
                  alt={other.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-14 rounded-lg object-cover object-top border border-border shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                    {other.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {other.designation}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
