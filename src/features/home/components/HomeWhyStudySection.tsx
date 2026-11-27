'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Building2,
  Cpu,
  FileCheck,
  GraduationCap,
  Landmark,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import type { SchoolProfile } from '@/src/types/entities';
import { formatNumber, formatYear } from '@/src/lib/formatters';
import { getCampusPhoto } from '@/src/components/shared/Feedback';
import { cn } from '@/src/lib/utils/cn';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

interface HomeWhyStudySectionProps {
  schoolProfile: SchoolProfile;
}

export function HomeWhyStudySection({ schoolProfile }: HomeWhyStudySectionProps) {
  const [activeReasonIdx, setActiveReasonIdx] = useState(0);
  const [activeRfidStep, setActiveRfidStep] = useState(0);
  const [isRfidPaused, setIsRfidPaused] = useState(false);

  useEffect(() => {
    if (isRfidPaused) return;
    const timer = setInterval(() => {
      setActiveRfidStep((prev) => (prev + 1) % 4);
    }, 3200);
    return () => clearInterval(timer);
  }, [isRfidPaused]);

  const estYear = schoolProfile?.establishedYear ?? 1978;
  const yearsSinceEst = 2026 - estYear;
  const eiin = schoolProfile?.eiin ?? '113587';

  const whyStudyReasons = useMemo(() => {
    return [
      {
        num: '০১',
        numEn: '01',
        tagBn: 'ঐতিহ্য ও ভিত্তি',
        tagEn: 'Heritage & Trust',
        shortBn: `ঐতিহ্য ও ভিত্তি • ${formatYear(estYear, 'bn')} সাল থেকে`,
        shortEn: `Heritage & Trust • Since ${estYear}`,
        titleBn: `${formatNumber(yearsSinceEst, 'bn')}+ বছরের গৌরবময় ঐতিহ্য ও নির্ভরযোগ্যতা`,
        titleEn: `${yearsSinceEst}+ Years of Heritage & Trust`,
        descBn: `${formatYear(estYear, 'bn')} সাল থেকে নড়িয়া ও শরীয়তপুর অঞ্চলে মানসম্মত, সুশৃঙ্খল ও নৈতিক মাধ্যমিক শিক্ষার বিশ্বস্ত কেন্দ্র হিসেবে শিক্ষার্থীদের সার্বিক বিকাশ নিশ্চিত করছে।`,
        descEn: 'A trusted center for quality, disciplined, and value-based secondary education in Naria and Shariatpur since 1978.',
        metrics: [
          { valBn: `${formatYear(estYear, 'bn')}`, valEn: String(estYear), labelBn: 'প্রতিষ্ঠা সন', labelEn: 'Established' },
          { valBn: `${formatNumber(yearsSinceEst, 'bn')}+ বছর`, valEn: `${yearsSinceEst}+ Yrs`, labelBn: 'শিক্ষা ঐতিহ্য', labelEn: 'Academic Legacy' },
          { valBn: eiin, valEn: eiin, labelBn: 'EIIN নম্বর', labelEn: 'EIIN Code' },
        ],
        icon: Landmark,
        link: '/about',
        ctaBn: 'বিদ্যালয় পরিচিতি',
        ctaEn: 'About School',
      },
      {
        num: '০২',
        numEn: '02',
        tagBn: 'দক্ষ শিক্ষকমণ্ডলী',
        tagEn: 'Expert Faculty',
        shortBn: 'দক্ষ শিক্ষকমণ্ডলী • ২০+ শিক্ষক',
        shortEn: 'Expert Faculty • 20+ Teachers',
        titleBn: 'বিষয়ভিত্তিক অভিজ্ঞ শিক্ষক ও নিবিড় মূল্যায়ন',
        titleEn: 'Subject-Specialist Faculty & Continuous Mentoring',
        descBn: 'স্নাতকোত্তর ও বিএড প্রশিক্ষণপ্রাপ্ত শিক্ষকদের প্রত্যক্ষ তত্ত্বাবধান, সাপ্তাহিক মূল্যায়ন এবং পিছিয়ে পড়া শিক্ষার্থীদের বিশেষ যত্নে মেধা বিকাশ।',
        descEn: 'Master’s & B.Ed certified teachers providing active guidance, weekly tests, and tailored attention for every student.',
        metrics: [
          { valBn: '২০+ জন', valEn: '20+', labelBn: 'প্রশিক্ষিত শিক্ষক', labelEn: 'Faculty Members' },
          { valBn: 'সাপ্তাহিক', valEn: 'Weekly', labelBn: 'শ্রেণি মূল্যায়ন', labelEn: 'Evaluations' },
          { valBn: 'বিশেষ যত্ন', valEn: 'Remedial', labelBn: 'দুর্বল শিক্ষার্থীদের', labelEn: 'Student Care' },
        ],
        icon: GraduationCap,
        link: '/about/teachers',
        ctaBn: 'শিক্ষক তালিকা',
        ctaEn: 'View Faculty',
      },
      {
        num: '০৩',
        numEn: '03',
        tagBn: 'আধুনিক ক্যাম্পাস ও পরিকাঠামো',
        tagEn: 'Campus & Infrastructure',
        shortBn: 'ভবন, জমি, শ্রেণিকক্ষ, ল্যাব ও লাইব্রেরি',
        shortEn: 'Buildings, Land, Classrooms & Labs',
        titleBn: 'ভবন, জমি, শ্রেণিকক্ষ, ল্যাব ও গ্রন্থাগার',
        titleEn: 'Campus Land, Buildings, Classrooms, Labs & Library',
        descBn: '৩.৮৫ একরের সুপরিসর সবুজ ক্যাম্পাসে রয়েছে ৪টি পাকা ভবন, ১৮টি আধুনিক শ্রেণিকক্ষ, উন্নত বিজ্ঞান ও আইসিটি ল্যাব এবং ৩,৫০০+ বইয়ের লাইব্রেরি।',
        descEn: 'Spacious 3.85-acre campus equipped with 4 pucca buildings, 18 modern classrooms, well-equipped science & computer labs, and 3,500+ library books.',
        metrics: [
          { valBn: '১৮টি শ্রেণিকক্ষ', valEn: '18 Classrooms', labelBn: 'আধুনিক শ্রেণিকক্ষ', labelEn: 'Classrooms' },
          { valBn: '৪টি পাকা ভবন', valEn: '4 Buildings', labelBn: '৩.৮৫ একর ক্যাম্পাস', labelEn: '3.85 Acre Campus' },
          { valBn: '৪টি ল্যাব ও লাইব্রেরি', valEn: '4 Labs & Library', labelBn: '৩,৫০০+ বইয়ের সংগ্রহ', labelEn: '3,500+ Books' },
        ],
        icon: Building2,
        link: '/about/facilities',
        ctaBn: 'ক্যাম্পাস পরিকাঠামো',
        ctaEn: 'View Facilities',
      },
      {
        num: '০৪',
        numEn: '04',
        tagBn: 'ডিজিটাল নিরাপত্তা',
        tagEn: 'Digital Security',
        shortBn: 'ডিজিটাল নিরাপত্তা • RFID স্মার্ট',
        shortEn: 'Digital Security • RFID Attendance',
        titleBn: 'RFID হাজিরা, SMS ও অভিভাবক পোর্টাল',
        titleEn: 'RFID Gate Attendance, Instant SMS & Parent Portal',
        descBn: 'প্রবেশ ও প্রস্থানে স্বয়ংক্রিয় অভিভাবক এসএমএস, রিয়েল-টাইম অনলাইন ফলাফল এবং সার্বক্ষণিক সিসিটিভি নিয়ন্ত্রিত শতভাগ নিরাপদ ক্যাম্পাস।',
        descEn: 'Instant entry/exit notifications to parents via SMS, live online report cards, and 24/7 CCTV surveillance.',
        metrics: [
          { valBn: 'RFID', valEn: 'RFID', labelBn: 'স্বয়ংক্রিয় হাজিরা', labelEn: 'Gate Attendance' },
          { valBn: 'তাৎক্ষণিক', valEn: 'Instant', labelBn: 'অভিভাবক SMS', labelEn: 'Parent SMS' },
          { valBn: 'সার্বক্ষণিক', valEn: '24/7', labelBn: 'সিসিটিভি নিরাপত্তা', labelEn: 'CCTV Security' },
        ],
        icon: ShieldCheck,
        link: '/about/facilities',
        ctaBn: 'নিরাপত্তা ব্যবস্থা',
        ctaEn: 'Security System',
      },
    ];
  }, [estYear, yearsSinceEst, eiin, 'bn']);

  const whyStudyRfidSteps = useMemo(() => {
    return [
      {
        id: 1,
        stepBn: '১',
        stepEn: '1',
        titleBn: '১. গেটে কার্ড স্ক্যান',
        titleEn: '1. Gate Card Scan',
        subtitleBn: 'প্রবেশ ও প্রস্থান',
        subtitleEn: 'Entry & Exit',
        noteBn: 'শিক্ষার্থী বিদ্যালয় গেটে RFID স্মার্ট আইডি কার্ড স্ক্যান করলেই মুহূর্তের মধ্যে ডিজিটাল হাজিরা নথিভুক্ত হয়।',
        noteEn: 'When students tap their RFID ID card at the entry gate, attendance is instantly logged.',
        icon: ScanLine,
      },
      {
        id: 2,
        stepBn: '২',
        stepEn: '2',
        titleBn: '২. স্বয়ংক্রিয় হাজিরা',
        titleEn: '2. Auto Server Sync',
        subtitleBn: 'সিস্টেমে নথিভুক্ত',
        subtitleEn: 'Database Logged',
        noteBn: 'হাজিরা স্বয়ংক্রিয়ভাবে সেন্ট্রাল সার্ভারে জমা হয় — খাতা-কলমের বিলম্ব বা ভুলের কোনো সুযোগ নেই।',
        noteEn: 'Attendance records are stored digitally in real-time, eliminating manual registry errors.',
        icon: Cpu,
      },
      {
        id: 3,
        stepBn: '৩',
        stepEn: '3',
        titleBn: '৩. তাৎক্ষণিক SMS',
        titleEn: '3. Instant Parent SMS',
        subtitleBn: 'অভিভাবকের মোবাইলে',
        subtitleEn: 'To Mobile Phone',
        noteBn: 'সঙ্গে সঙ্গেই অভিভাবকের মোবাইলে বাংলা SMS চলে যায় — সন্তান নিরাপদে বিদ্যালয়ে পৌঁছেছে কি না নিশ্চিত হওয়া যায়।',
        noteEn: 'An automated SMS is sent directly to the guardian’s registered mobile phone ensuring complete peace of mind.',
        icon: Smartphone,
      },
      {
        id: 4,
        stepBn: '৪',
        stepEn: '4',
        titleBn: '৪. পোর্টালে ফলাফল',
        titleEn: '4. Portal & Live Results',
        subtitleBn: 'অনলাইন ফলাফল ও নোটিশ',
        subtitleEn: 'Reports & Notices',
        noteBn: 'অভিভাবক পোর্টালে ঘরে বসেই উপস্থিতি পরিসংখ্যান, পরীক্ষার ফলাফল ও নোটিশ দেখা যায়, আর পুরো ক্যাম্পাস সার্বক্ষণিক সিসিটিভি নিয়ন্ত্রিত।',
        noteEn: 'Parents can log in to the portal to track attendance history, test marks, and institutional announcements.',
        icon: FileCheck,
      },
    ];
  }, []);

  const activeReason = whyStudyReasons[activeReasonIdx];
  const ActiveIcon = activeReason.icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className="space-y-6 sm:space-y-8"
    >
      {/* Section Heading & Action Links */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 text-primary font-bold text-sm sm:text-base tracking-wide">
            <span className="w-6 h-0.5 rounded-full bg-accent" />
            {'কেন এই বিদ্যালয়'}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight text-balance">
            {'কেন '}
            <span className="text-primary">{'ভোজেশ্বর উচ্চ বিদ্যালয়ে'}</span>
            {' পড়বেন?'}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            {'ঐতিহ্যবাহী বিদ্যাপীঠ হিসেবে ভোজেশ্বর উচ্চ বিদ্যালয় আধুনিক প্রযুক্তি, মানসম্মত সাধারণ শিক্ষা, সমৃদ্ধ বিজ্ঞানাগার এবং সুশৃঙ্খল নৈতিকতার এক অনন্য কেন্দ্র।'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface border border-border/80 text-foreground hover:border-primary/50 hover:text-primary transition-all text-sm sm:text-base font-semibold shadow-2xs"
          >
            <span>{'ইতিহাস ও ঐতিহ্য'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/about#mission"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all text-sm sm:text-base font-bold shadow-2xs"
          >
            <span>{'লক্ষ্য ও উদ্দেশ্য'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 2-Column Balanced Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-surface shadow-xs group flex-1 min-h-[360px] sm:min-h-[420px] flex flex-col justify-between p-6 sm:p-7">
            <img
              src={getCampusPhoto('digital-classroom').src}
              alt={'ভোজেশ্বর উচ্চ বিদ্যালয় ক্যাম্পাস ও স্মার্ট শ্রেণিকক্ষ'}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />

            <div className="relative z-10 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/95 dark:bg-surface-muted/95 backdrop-blur-md text-foreground text-sm font-bold border border-border/80 shadow-xs">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>{'মূল ক্যাম্পাস · স্মার্ট শ্রেণিকক্ষ'}</span>
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/95 dark:bg-surface-muted/95 backdrop-blur-md text-foreground text-sm font-bold border border-border/80 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>{'নিরাপদ ক্যাম্পাস · RFID হাজিরা'}</span>
              </span>
            </div>

            <div className="relative z-10 space-y-2">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {schoolProfile.name}
              </h3>
              <p className="text-sm sm:text-base text-white/95 line-clamp-2 leading-relaxed font-medium">
                {'ভোজেশ্বর, নড়িয়া, শরীয়তপুরের সুপরিসর ক্যাম্পাস, সবুজ খেলার মাঠ ও আধুনিক শিক্ষার অনন্য সমন্বয়।'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {whyStudyReasons.map((reason, idx) => {
              const isActive = activeReasonIdx === idx;
              return (
                <button
                  key={reason.num}
                  type="button"
                  onClick={() => setActiveReasonIdx(idx)}
                  className={cn(
                    'group p-3.5 sm:p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer',
                    isActive
                      ? 'bg-primary/10 dark:bg-primary/20 border-primary ring-2 ring-primary/25 shadow-xs'
                      : 'bg-surface hover:bg-surface-muted/60 border-border/80 hover:border-primary/40'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors font-extrabold text-sm',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                    )}
                  >
                    <span className="tabular-nums">{reason.num}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-base font-bold truncate leading-snug', isActive ? 'text-primary' : 'text-foreground')}>
                      {reason.titleBn}
                    </p>
                    <p className="text-sm text-foreground/75 truncate mt-1 font-medium">
                      {reason.shortBn}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/8 via-surface to-surface dark:from-primary/15 dark:via-surface dark:to-surface p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-xs flex-1 min-h-[300px]">
            <span className="text-8xl sm:text-9xl font-black text-primary/8 select-none pointer-events-none absolute right-2 -top-4 tabular-nums">
              {activeReason.num}
            </span>

            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-amber-900 dark:text-amber-200 text-sm font-bold">
                  <ActiveIcon className="w-4 h-4 text-accent" />
                  <span>{activeReason.tagBn}</span>
                </span>
                <Link
                  href={activeReason.link}
                  className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-primary hover:underline"
                >
                  <span>{activeReason.ctaBn}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
                {activeReason.titleBn}
              </h3>
              <p className="text-base sm:text-lg text-foreground/85 leading-relaxed max-w-2xl font-normal">
                {activeReason.descBn}
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-3 pt-4 border-t border-border/80">
              {activeReason.metrics.map((m, mIdx) => (
                <div
                  key={mIdx}
                  className="bg-surface/95 dark:bg-surface-muted/95 backdrop-blur-xs border border-border/80 rounded-xl p-3 sm:p-3.5 text-center shadow-2xs"
                >
                  <p className="text-base sm:text-lg lg:text-xl font-black text-primary tabular-nums">
                    {m.valBn}
                  </p>
                  <p className="text-sm text-foreground/75 font-semibold mt-1 truncate">
                    {m.labelBn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Digital Security: RFID Gate Attendance & Notification Flow */}
      <div
        onMouseEnter={() => setIsRfidPaused(true)}
        onMouseLeave={() => setIsRfidPaused(false)}
        className="bg-surface border border-border/80 rounded-2xl p-5 sm:p-7 space-y-6 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-2 text-primary font-bold text-sm sm:text-base tracking-wide">
              <span className="w-6 h-0.5 rounded-full bg-accent" />
              {'ডিজিটাল নিরাপত্তা ও উপস্থিতি ট্র্যাকিং'}
            </span>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight mt-1.5">
              {'স্কুলে ঢোকা থেকে ফলাফল — প্রতিটি ধাপে স্বয়ংক্রিয় খবর'}
            </h3>
            <p className="text-sm sm:text-base text-foreground/80 mt-1 max-w-2xl leading-relaxed">
              {'RFID গেট হাজিরা কীভাবে কাজ করে দেখুন। স্বয়ংক্রিয়ভাবে একটির পর একটি ধাপ প্রদর্শিত হচ্ছে, যেকোনো ধাপে ক্লিকও করতে পারেন।'}
            </p>
          </div>
          <div className="shrink-0 text-sm font-semibold text-foreground/80">
            {'সার্বক্ষণিক সিসিটিভি নিয়ন্ত্রিত ক্যাম্পাস'}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {whyStudyRfidSteps.map((step, idx) => {
            const StepIcon = step.icon;
            const isActive = activeRfidStep === idx;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setActiveRfidStep(idx);
                  setIsRfidPaused(false);
                }}
                className={cn(
                  'relative p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3.5 cursor-pointer group',
                  isActive
                    ? 'bg-primary/10 dark:bg-primary/20 border-primary shadow-xs'
                    : 'bg-surface-muted/60 hover:bg-surface border-border hover:border-primary/40'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={cn(
                      'w-11 h-11 rounded-lg flex items-center justify-center transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                    )}
                  >
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <span
                    className={cn(
                      'text-sm font-bold px-3 py-1 rounded-full border',
                      isActive
                        ? 'bg-primary text-primary-foreground border-transparent'
                        : 'bg-surface text-foreground/80 border-border'
                    )}
                  >
                    {`ধাপ ${step.stepBn}`}
                  </span>
                </div>
                <div>
                  <p className={cn('text-base font-bold leading-tight', isActive ? 'text-primary' : 'text-foreground')}>
                    {step.titleBn}
                  </p>
                  <p className="text-sm text-foreground/75 mt-1 font-medium">
                    {step.subtitleBn}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-surface-muted/90 border border-border/80 rounded-xl p-4 text-center text-sm sm:text-base text-foreground flex flex-col sm:flex-row items-center justify-center gap-2 shadow-2xs">
          <span className="font-black text-primary text-base whitespace-nowrap">
            {`ধাপ ${whyStudyRfidSteps[activeRfidStep].stepBn} —`}
          </span>
          <span className="text-foreground text-base leading-relaxed">
            {whyStudyRfidSteps[activeRfidStep].noteBn}
          </span>
        </div>
      </div>
    </motion.section>
  );
}
