'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Calendar,
  Download,
  FileText,
  Search,
} from 'lucide-react';
import type { AdmissionContent } from '@/src/types/entities';
import { formatBdt, formatDateLong } from '@/src/lib/formatters';
import { getCampusPhoto } from '@/src/components/shared/Feedback';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

interface HomeAdmissionBannerProps {
  admissionContent: AdmissionContent;
}

export function HomeAdmissionBanner({ admissionContent }: HomeAdmissionBannerProps) {
  if (!admissionContent.isPublished || admissionContent.showOnHomepage === false) {
    return null;
  }

  const adm = admissionContent;
  const status = adm.admissionStatus ?? 'OPEN';
  const isOpen = status === 'OPEN';
  const isUpcoming = status === 'UPCOMING';
  const isClosed = status === 'CLOSED';

  const statusText = isOpen
    ? 'ভর্তি চলছে'
    : isUpcoming
      ? 'শীঘ্রই শুরু হচ্ছে'
      : 'ভর্তি কার্যক্রম বন্ধ';

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
        alt={'ভর্তি কার্যক্রম ব্যানার'}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#062313]/94 via-[#08351C]/84 to-[#062313]/68" />

      <div className="relative z-10 p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-medium text-white/85 tabular-nums">
            <span className="font-semibold text-white">{statusText}</span>
            <span className="text-white/40" aria-hidden="true">·</span>
            <span>
              {`শিক্ষাবর্ষ ${adm.academicSession ?? '২০২৭'}`}
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
              'যোগ্য ও মেধাবী শিক্ষার্থীদের জন্য নতুন শিক্ষাবর্ষের ভর্তি কার্যক্রম পরিচালিত হচ্ছে।'}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80 tabular-nums pt-1">
            {adm.startDate && (
              <span>
                {'আবেদন শুরু:'}{' '}
                <strong className="text-white font-semibold">
                  {formatDateLong(adm.startDate, 'bn')}
                </strong>
              </span>
            )}
            {adm.endDate && (
              <span>
                {'শেষ তারিখ:'}{' '}
                <strong className="text-white font-semibold">
                  {formatDateLong(adm.endDate, 'bn')}
                </strong>
              </span>
            )}
            {adm.admissionTestDate && (
              <span>
                {'ভর্তি পরীক্ষা:'}{' '}
                <strong className="text-white font-semibold">
                  {formatDateLong(adm.admissionTestDate, 'bn')}
                </strong>
              </span>
            )}
            {adm.applicationFee != null && adm.applicationFee > 0 && (
              <span>
                {'আবেদন ফি:'}{' '}
                <strong className="text-white font-semibold">
                  {formatBdt(adm.applicationFee, 'bn')}
                </strong>
              </span>
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="glass-dark-subtle rounded-xl p-5 space-y-3.5">
            <p className="text-sm text-white/90 leading-relaxed">
              {isOpen
                ? 'অনলাইনে আবেদন সম্পন্ন করে আবেদন নম্বর ও ভর্তি পরীক্ষার প্রবেশপত্র সংরক্ষণ করুন।'
                : isUpcoming
                  ? 'আবেদন শুরুর পূর্বে ভর্তি নির্দেশিকা, প্রয়োজনীয় কাগজপত্র ও নমুনা ফরম দেখে নিন।'
                  : 'চলমান শিক্ষাবর্ষের অনলাইন আবেদন সম্পন্ন হয়েছে। পূর্বের আবেদনের অবস্থা নিচ থেকে যাচাই করুন।'}
            </p>

            <div className="flex flex-col gap-2.5">
              {isOpen ? (
                <Link href="/admission/apply" className="w-full">
                  <button
                    type="button"
                    className="w-full py-2.5 px-4 rounded-lg bg-primary hover:opacity-92 text-primary-foreground text-base font-semibold inline-flex items-center justify-center gap-2 transition-opacity cursor-pointer shadow-md"
                  >
                    <span>{'অনলাইন ভর্তি আবেদন করুন'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              ) : isUpcoming ? (
                <Link href="/admission/guidelines" className="w-full">
                  <button
                    type="button"
                    className="w-full py-2.5 px-4 rounded-lg bg-primary hover:opacity-92 text-primary-foreground text-base font-semibold inline-flex items-center justify-center gap-2 transition-opacity cursor-pointer shadow-md"
                  >
                    <span>{'ভর্তি নির্দেশিকা দেখুন'}</span>
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
                    <span>{'আবেদনের স্ট্যাটাস যাচাই করুন'}</span>
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
                    <span>{'ফরম ডাউনলোড'}</span>
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
                        ? 'ভর্তি নির্দেশিকা'
                        : 'স্ট্যাটাস যাচাই'}
                    </span>
                  </button>
                </Link>
              </div>
            </div>

            {adm.helplinePhone && (
              <div className="pt-2.5 border-t border-white/12 flex items-center justify-between text-sm text-white/80 tabular-nums">
                <span>{'ভর্তি সহায়তা ডেস্ক'}</span>
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
}
