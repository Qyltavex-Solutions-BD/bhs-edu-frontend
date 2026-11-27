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

export function AboutHistoryPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
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
    const chapterNum = formatNumber(index + 1, 'bn').padStart(2, '০');
    if (type === InstitutionContentType.HISTORY) {
      return {
        kicker: `${chapterNum} · ${'প্রতিষ্ঠার ইতিহাস'}`,
        photo: getCampusPhoto('morning-assembly'),
        captionBn: 'বিদ্যালয় প্রাঙ্গণে প্রাত্যহিক সমাবেশ ও শৃঙ্খলাবদ্ধ শিক্ষাজীবন।',
        captionEn: 'Morning assembly and disciplined campus life on the school courtyard.',
        archiveIndex: 1,
        points: [
          `প্রতিষ্ঠাকাল: ১ জানুয়ারি ${formatNumber(establishedYear, 'bn')} খ্রিস্টাব্দ`,
          'অবস্থান: ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
          `EIIN: ${db.schoolProfile.eiin ?? '113587'} · কোড: ${db.schoolProfile.schoolCode ?? 'BHS'}`,
        ],
      };
    }
    if (type === InstitutionContentType.TRADITION) {
      return {
        kicker: `${chapterNum} · ${'ঐতিহ্য ও সহশিক্ষা'}`,
        photo: getCampusPhoto('debate-hall'),
        captionBn: 'আন্তঃশ্রেণি বিতর্ক, সাহিত্য ও সাংস্কৃতিক প্রতিযোগিতায় শিক্ষার্থীদের অংশগ্রহণ।',
        captionEn: 'Students participating in inter-class debate, literary, and cultural programs.',
        archiveIndex: 2,
        points: [
          'নিয়মিত বিতর্ক, সাহিত্য চর্চা ও বিজ্ঞান মেলা',
          'স্কাউটিং, বার্ষিক ক্রীড়া ও জাতীয় দিবস উদযাপন',
          'নৈতিক মূল্যবোধ ও নেতৃত্বগুণের ধারাবাহিক বিকাশ',
        ],
      };
    }
    return {
      kicker: `${chapterNum} · ${'অবকাঠামো ও ক্যাম্পাস'}`,
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
            {'হোম'}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/about" className="hover:text-primary transition-colors">
            {'বিদ্যালয় পরিচিতি'}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground font-medium">{'ইতিহাস ও ঐতিহ্য'}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/about/facilities">
            <Button variant="outline" size="sm">
              {'ক্যাম্পাস সুবিধা'}
            </Button>
          </Link>
          <Link href="/about/leadership">
            <Button variant="outline" size="sm">
              {'নেতৃত্বের বাণী'}
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
                  {`স্থাপিত: ${formatNumber(establishedYear, 'bn')} খ্রি.`}
                </span>
                <span aria-hidden="true">·</span>
                <span>EIIN: {db.schoolProfile.eiin ?? '113587'}</span>
                <span aria-hidden="true">·</span>
                <span>{'ভোজেশ্বর, নড়িয়া, শরীয়তপুর'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight text-balance">
                {'ইতিহাস ও গৌরবময় ঐতিহ্য'}
              </h1>

              <p className="text-base text-foreground/90 leading-[1.8] max-w-[65ch]">
                {db.schoolProfile.description}
              </p>

              <div className="py-3.5 border-y border-border/80">
                <p className="text-base font-medium text-foreground">
                  “{db.schoolProfile.motto ?? 'শিক্ষাই আলো, জ্ঞানই শক্তি'}” —{' '}
                  <span className="text-muted-foreground font-normal">
                    {`${formatNumber(yearsSinceEst, 'bn')}+ বছর ধরে নড়িয়া ও শরীয়তপুর অঞ্চলে মানসম্মত মাধ্যমিক শিক্ষার নির্ভরযোগ্য বিদ্যাপীঠ।`}
                  </span>
                </p>
              </div>
            </div>

            {/* Verified Institutional Snapshot (Strictly Real DB Facts) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 tabular-nums">
              <div>
                <p className="text-sm text-muted-foreground">{'প্রতিষ্ঠাকাল'}</p>
                <p className="text-lg font-bold text-primary mt-0.5">
                  {formatNumber(establishedYear, 'bn')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{'শিক্ষা স্তর'}</p>
                <p className="text-lg font-bold text-foreground mt-0.5">
                  {'৬ষ্ঠ–১০ম'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{'বিভাগসমূহ'}</p>
                <p className="text-lg font-bold text-foreground mt-0.5">
                  {formatNumber(db.academicGroups.length, 'bn')} {'টি'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{'শিক্ষক ও কর্মচারী'}</p>
                <p className="text-lg font-bold text-foreground mt-0.5">
                  {formatNumber(activeStaffCount, 'bn')} {'জন'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Hero Campus Architecture Photograph */}
          <div className="lg:col-span-6 relative min-h-[280px] sm:min-h-[380px] lg:min-h-full bg-surface-muted overflow-hidden group">
            <img
              src={heroPhoto.src}
              alt={heroPhoto.altBn}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white/80">
                  {'চিত্র ০১ · মূল ক্যাম্পাস'}
                </p>
                <p className="text-sm sm:text-base font-semibold text-white mt-0.5">
                  {'ভোজেশ্বর উচ্চ বিদ্যালয় মূল একাডেমিক ভবন ও প্রাঙ্গণ'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxIdx(0)}
                aria-label={'ছবি বড় করে দেখুন'}
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
            {'প্রতিষ্ঠানের পথচলা ও মূল স্তম্ভসমূহ'}
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl">
            {'প্রতিষ্ঠার ইতিহাস, নৈতিক ও সহশিক্ষা ঐতিহ্য এবং আধুনিক একাডেমিক পরিবেশের সমন্বয়ে গড়ে উঠেছে আমাদের বিদ্যালয়।'}
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
                    <p className="text-sm text-white/95 leading-snug">
                      {meta.captionBn}
                    </p>
                    <button
                      type="button"
                      onClick={() => setLightboxIdx(meta.archiveIndex)}
                      aria-label={'ছবি বড় করে দেখুন'}
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
              {'ধারাবাহিক অগ্রযাত্রার ধাপসমূহ'}
            </h2>
            <p className="text-base text-muted-foreground">
              {'১৯৭৮ সাল থেকে বর্তমান ডিজিটাল ক্যাম্পাস পর্যন্ত বিবর্তনের প্রধান অধ্যায়।'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {milestones.map((m, i) => (
            <Card key={i} className="p-6 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-primary tabular-nums">
                  {m.phaseBn}
                </p>
                <h3 className="text-lg font-bold text-foreground leading-snug">
                  {m.titleBn}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {m.descBn}
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
              {'ক্যাম্পাস চিত্রশালা'}
            </h2>
            <p className="text-base text-muted-foreground">
              {'একাডেমিক ভবন, প্রাত্যহিক সমাবেশ, বিতর্ক ও সাংস্কৃতিক প্রাঙ্গণ, স্মার্ট ক্লাসরুম, বিজ্ঞানাগার ও গ্রন্থাগারের নির্বাচিত স্থিরচিত্র। যেকোনো ছবিতে ক্লিক করে বড় করে দেখুন।'}
            </p>
          </div>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline whitespace-nowrap"
          >
            <span>{'সম্পূর্ণ ফটো গ্যালারি'}</span>
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
                    alt={entry.titleBn}
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
                  <p className="text-sm font-medium text-primary tabular-nums">
                    {`চিত্র ০${formatNumber(idx + 1, 'bn')}`} ·{' '}
                    {entry.categoryBn}
                  </p>
                  <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                    {entry.titleBn}
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
                {'প্রতিষ্ঠানের মৌলিক তথ্যপঞ্জি'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {db.schoolProfile.name} · {db.schoolProfile.nameEn}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm sm:text-base tabular-nums">
            <div className="pb-3 border-b border-border/70">
              <dt className="text-sm text-muted-foreground">{'প্রতিষ্ঠাকাল'}</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {`১ জানুয়ারি ${formatNumber(establishedYear, 'bn')} খ্রিস্টাব্দ`}
              </dd>
            </div>
            <div className="pb-3 border-b border-border/70">
              <dt className="text-sm text-muted-foreground">{'EIIN ও বিদ্যালয় কোড'}</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                EIIN: {db.schoolProfile.eiin ?? '113587'} · {'কোড:'} {db.admissionContent.schoolCode ?? db.schoolProfile.schoolCode ?? 'BHS'}
              </dd>
            </div>
            <div className="pb-3 border-b border-border/70">
              <dt className="text-sm text-muted-foreground">{'শিক্ষা স্তর ও বিভাগ'}</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {'৬ষ্ঠ–১০ম শ্রেণি · বিজ্ঞান, মানবিক, ব্যবসায় শিক্ষা'}
              </dd>
            </div>
            <div className="pb-3 border-b border-border/70">
              <dt className="text-sm text-muted-foreground">{'জেলা ও থানা কোড'}</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {'জেলা:'} {db.admissionContent.districtCode ?? '—'} · {'থানা:'} {db.admissionContent.thanaCode ?? '—'}
              </dd>
            </div>
            <div className="sm:col-span-2 pb-1">
              <dt className="text-sm text-muted-foreground">{'ঠিকানা ও অবস্থান'}</dt>
              <dd className="font-semibold text-foreground mt-0.5">{db.schoolProfile.address}</dd>
            </div>
          </dl>
        </Card>

        <Card className="lg:col-span-4 p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            {'আরও জানুন'}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {'বিদ্যালয়ের নেতৃত্ব, পরিচালনা পর্ষদ, অভিজ্ঞ শিক্ষকমণ্ডলী ও ক্যাম্পাস সুযোগ-সুবিধা সম্পর্কে বিস্তারিত দেখুন।'}
          </p>
          <div className="divide-y divide-border text-sm">
            {[
              { to: '/about', label: 'বিদ্যালয় পরিচিতি, লক্ষ্য ও দৃষ্টিভঙ্গি' },
              { to: '/about/facilities', label: 'অবকাঠামো ও ক্যাম্পাস সুবিধা' },
              { to: '/about/leadership', label: 'প্রধান শিক্ষক ও সভাপতির বাণী' },
              { to: '/about/management-committee', label: 'বিদ্যালয় ম্যানেজিং কমিটি' },
              { to: '/about/teachers', label: 'শিক্ষকমণ্ডলী ও কর্মচারী তালিকা' },
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
          aria-label={activeLightbox.titleBn}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setLightboxIdx(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-[#0A140F] border border-white/15 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-white/15 text-white">
              <div className="min-w-0">
                <p className="text-sm text-white/70 tabular-nums">
                  {formatNumber(lightboxIdx + 1, 'bn')} / {formatNumber(archivePhotos.length, 'bn')} ·{' '}
                  {activeLightbox.categoryBn}
                </p>
                <p className="text-base font-semibold truncate">
                  {activeLightbox.titleBn}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxIdx(null)}
                aria-label={'বন্ধ করুন'}
                className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-black flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={activeLightbox.photo.src}
                alt={activeLightbox.titleBn}
                referrerPolicy="no-referrer"
                className="w-full max-h-[75vh] object-contain"
              />
              <button
                type="button"
                onClick={() =>
                  setLightboxIdx((lightboxIdx - 1 + archivePhotos.length) % archivePhotos.length)
                }
                aria-label={'পূর্ববর্তী ছবি'}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 border border-white/25 text-white inline-flex items-center justify-center cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxIdx((lightboxIdx + 1) % archivePhotos.length)}
                aria-label={'পরবর্তী ছবি'}
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

