'use client';

import React from 'react';
import Link from 'next/link';
import { Megaphone, ArrowUpRight } from 'lucide-react';
import type { Notice } from '@/src/types/entities';

export function NoticeTickerBar({ notices }: { notices: Notice[] }) {
  if (!notices.length) return null;

  return (
    <div className="bg-[#093B1F] text-white border-b border-white/10 no-print">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-10 flex items-center gap-3 overflow-hidden">
        <Link
          href="/notices"
          className="shrink-0 inline-flex items-center gap-1.5 pr-3 border-r border-white/20 text-sm font-semibold text-white hover:opacity-85 transition-opacity whitespace-nowrap"
        >
          <Megaphone className="w-3.5 h-3.5 opacity-85" />
          <span>{'সর্বশেষ বিজ্ঞপ্তি'}</span>
        </Link>
        <div className="relative flex-1 overflow-hidden">
          <div className="animate-notice-marquee items-center gap-8 text-sm">
            {[...notices, ...notices].map((notice, idx) => (
              <Link
                key={`${notice.id}-${idx}`}
                href={`/notices/${notice.id}`}
                className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                {notice.isUrgent && (
                  <span className="px-2 py-0.5 rounded bg-[#C81E24] text-white text-xs font-semibold leading-none">
                    {'জরুরি'}
                  </span>
                )}
                <span>{notice.title}</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                <span className="text-white/25 pl-4" aria-hidden="true">
                  /
                </span>
              </Link>
            ))}
          </div>
        </div>
        <Link
          href="/notices"
          className="hidden sm:inline-flex shrink-0 text-sm font-medium text-white/80 hover:text-white transition-colors whitespace-nowrap pl-3 border-l border-white/20"
        >
          {'সব দেখুন'}
        </Link>
      </div>
    </div>
  );
}
