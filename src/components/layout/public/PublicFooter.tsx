'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import { SchoolEmblem } from '@/src/components/shared/Feedback';
import type { SchoolProfile } from '@/src/types/entities';

interface PublicFooterProps {
  school?: SchoolProfile;
}

export function PublicFooter({ school, }: PublicFooterProps) {
  return (
    <footer className="bg-surface border-t-2 border-t-primary/25 mt-16 no-print">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <SchoolEmblem size={48} />
            <div>
              <h2 className="text-base font-bold text-primary leading-snug">
                {school?.name ?? 'ভোজেশ্বর উচ্চ বিদ্যালয়'}
              </h2>
              <p className="text-sm text-muted-foreground tabular-nums">
                {'স্থাপিত: ১৯৭৮ খ্রি. · EIIN: ১১৩৫৮৭ · BHS'}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            “{school?.motto ?? 'শিক্ষাই আলো, জ্ঞানই শক্তি'}” —{' '}
            {'শরীয়তপুর জেলার নড়িয়া উপজেলার ভোজেশ্বরের ঐতিহ্যবাহী মাধ্যমিক শিক্ষা প্রতিষ্ঠান (৬ষ্ঠ–১০ম শ্রেণি)।'}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">
            {'গুরুত্বপূর্ণ লিংক'}
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-primary">{'বিদ্যালয় পরিচিতি'}</Link></li>
            <li><Link href="/admission" className="hover:text-primary">{'ভর্তি তথ্য ও আবেদন'}</Link></li>
            <li><Link href="/results" className="hover:text-primary">{'অনলাইন ফলাফল'}</Link></li>
            <li><Link href="/notices" className="hover:text-primary">{'নোটিশ বোর্ড'}</Link></li>
            <li><Link href="/careers" className="hover:text-primary">{'নিয়োগ বিজ্ঞপ্তি'}</Link></li>
            <li><Link href="/faq" className="hover:text-primary">{'সাধারণ জিজ্ঞাসা (FAQ)'}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">
            {'একাডেমিক ও পোর্টাল'}
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/academics/classes" className="hover:text-primary">{'শ্রেণি ও বিষয়সমূহ'}</Link></li>
            <li><Link href="/academics/routines" className="hover:text-primary">{'ক্লাস রুটিন'}</Link></li>
            <li><Link href="/academics/academic-calendar" className="hover:text-primary">{'একাডেমিক ক্যালেন্ডার'}</Link></li>
            <li><Link href="/academics/library" className="hover:text-primary">{'গ্রন্থাগার'}</Link></li>
            <li><Link href="/login" className="hover:text-primary">{'অ্যাডমিন / শিক্ষক / অভিভাবক লগইন'}</Link></li>
          </ul>
        </div>

        <div className="space-y-2.5 text-sm text-muted-foreground">
          <h3 className="text-sm font-bold text-foreground mb-3">
            {'যোগাযোগ'}
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
            © {'২০২৬'} {school?.name ?? 'ভোজেশ্বর উচ্চ বিদ্যালয়'}।{' '}
            {'সর্বস্বত্ব সংরক্ষিত।'}
          </p>

          {/* Software Developer & Maintenance Credit */}
          <p className="inline-flex items-center gap-1.5 text-sm">
            <span>{'কারিগরি সহায়তা ও পরিচালনায়:'}</span>
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
              {'গোপনীয়তা নীতি'}
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-primary">
              {'শর্তাবলি'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
