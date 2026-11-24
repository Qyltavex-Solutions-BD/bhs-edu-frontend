'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import { SchoolEmblem } from '@/src/components/shared/Feedback';
import type { SchoolProfile } from '@/src/types/entities';

interface PublicFooterProps {
  school?: SchoolProfile;
  locale: string;
  pick: (bn: string, en: string) => string;
  t: (key: string) => string;
}

export function PublicFooter({ school, locale, pick, t }: PublicFooterProps) {
  return (
    <footer className="bg-surface border-t-2 border-t-primary/25 mt-16 no-print">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <SchoolEmblem size={48} />
            <div>
              <h2 className="text-base font-bold text-primary leading-snug">
                {school?.name ?? t('school.name')}
              </h2>
              <p className="text-xs text-muted-foreground tabular-nums">
                {pick('স্থাপিত: ১৯৭৮ খ্রি. · EIIN: ১১৩৫৮৭ · BHS', 'Est. 1978 · EIIN: 113587 · BHS')}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            “{school?.motto ?? 'শিক্ষাই আলো, জ্ঞানই শক্তি'}” —{' '}
            {pick(
              'শরীয়তপুর জেলার নড়িয়া উপজেলার ভোজেশ্বরের ঐতিহ্যবাহী মাধ্যমিক শিক্ষা প্রতিষ্ঠান (৬ষ্ঠ–১০ম শ্রেণি)।',
              'Historic secondary school in Bhojeshwar, Noria, Shariatpur serving Classes 6–10 since 1978.'
            )}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">
            {pick('গুরুত্বপূর্ণ লিংক', 'Important Links')}
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-primary">{pick('বিদ্যালয় পরিচিতি', 'About School')}</Link></li>
            <li><Link href="/admission" className="hover:text-primary">{pick('ভর্তি তথ্য ও আবেদন', 'Admission & Apply')}</Link></li>
            <li><Link href="/results" className="hover:text-primary">{pick('অনলাইন ফলাফল', 'Public Result Search')}</Link></li>
            <li><Link href="/notices" className="hover:text-primary">{pick('নোটিশ বোর্ড', 'Notice Board')}</Link></li>
            <li><Link href="/careers" className="hover:text-primary">{pick('নিয়োগ বিজ্ঞপ্তি', 'Careers')}</Link></li>
            <li><Link href="/faq" className="hover:text-primary">{pick('সাধারণ জিজ্ঞাসা (FAQ)', 'FAQ')}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">
            {pick('একাডেমিক ও পোর্টাল', 'Academics & Portals')}
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/academics/classes" className="hover:text-primary">{pick('শ্রেণি ও বিষয়সমূহ', 'Classes & Subjects')}</Link></li>
            <li><Link href="/academics/routines" className="hover:text-primary">{pick('ক্লাস রুটিন', 'Class Routines')}</Link></li>
            <li><Link href="/academics/academic-calendar" className="hover:text-primary">{pick('একাডেমিক ক্যালেন্ডার', 'Academic Calendar')}</Link></li>
            <li><Link href="/academics/library" className="hover:text-primary">{pick('গ্রন্থাগার', 'School Library')}</Link></li>
            <li><Link href="/login" className="hover:text-primary">{pick('অ্যাডমিন / শিক্ষক / অভিভাবক লগইন', 'Portal Sign In')}</Link></li>
          </ul>
        </div>

        <div className="space-y-2.5 text-sm text-muted-foreground">
          <h3 className="text-sm font-bold text-foreground mb-3">
            {pick('যোগাযোগ', 'Contact Information')}
          </h3>
          <p className="flex items-start gap-2 text-sm leading-relaxed">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>{school?.address ?? 'ডাকঘর: ভোজেশ্বর, উপজেলা: নড়িয়া, জেলা: শরীয়তপুর।'}</span>
          </p>
          <p className="flex items-center gap-2 text-sm tabular-nums">
            <Phone className="w-4 h-4 text-primary shrink-0" />
            <span>{school?.phone ?? '+880 1711-200201'}</span>
          </p>
          <p className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-primary shrink-0" />
            <span>{school?.email ?? 'info@bhs.edu.bd'}</span>
          </p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            © {locale === 'bn' ? '২০২৬' : '2026'} {school?.name ?? t('school.name')}।{' '}
            {pick('সর্বস্বত্ব সংরক্ষিত।', 'All rights reserved.')}
          </p>

          {/* Software Developer & Maintenance Credit */}
          <p className="inline-flex items-center gap-1.5 text-xs sm:text-sm">
            <span>{pick('কারিগরি সহায়তা ও পরিচালনায়:', 'Developed & Maintained by:')}</span>
            <a
              href="https://www.qyltavex.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline hover:text-primary/90 transition-colors inline-flex items-center gap-1"
            >
              <span>Qyltavex Solutions BD</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </p>

          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-primary">
              {pick('গোপনীয়তা নীতি', 'Privacy Policy')}
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-primary">
              {pick('শর্তাবলি', 'Terms & Conditions')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
