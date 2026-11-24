'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  Search,
} from 'lucide-react';
import type { LeadershipMessage, Notice } from '@/src/types/entities';
import { NoticeStatus } from '@/src/types/enums';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { getLeadershipPortrait } from '@/src/components/shared/Feedback';
import { cn } from '@/src/lib/utils/cn';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

type NoticeTab = 'all' | 'urgent';

interface HomeNoticeSectionProps {
  notices: Notice[];
  loading?: boolean;
  loadFailed?: boolean;
  onRetry?: () => void;
  presidentMsg?: LeadershipMessage;
  principalMsg?: LeadershipMessage;
  onPreviewNotice?: (notice: Notice) => void;
}

export function HomeNoticeSection({
  notices,
  loading,
  loadFailed,
  onRetry,
  presidentMsg,
  principalMsg,
  onPreviewNotice,
}: HomeNoticeSectionProps) {
  const { locale, pick } = useI18n();
  const [noticeTab, setNoticeTab] = useState<NoticeTab>('all');
  const [noticeQuery, setNoticeQuery] = useState('');

  const noticeTabs: { key: NoticeTab; labelBn: string; labelEn: string }[] = [
    { key: 'all', labelBn: 'সব বিজ্ঞপ্তি', labelEn: 'All Notices' },
    { key: 'urgent', labelBn: 'জরুরি', labelEn: 'Urgent' },
  ];

  const publishedNotices = useMemo(() => {
    const all = (notices ?? []).filter((n) => n.status === NoticeStatus.PUBLISHED);
    return all.filter((n) => {
      const text = `${n.memoNo ?? ''} ${n.title} ${n.memoNo ?? ''}`.toLowerCase();
      if (noticeQuery.trim() && !text.includes(noticeQuery.trim().toLowerCase())) {
        return false;
      }
      if (noticeTab === 'urgent') return n.isUrgent;
      return true;
    });
  }, [notices, noticeTab, noticeQuery]);

  return (
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
          <div className="px-5 sm:px-6 py-4 border-b border-border bg-surface flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-emerald-700 dark:text-emerald-500 shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>{pick('নোটিশ বোর্ড', 'Notice Board')}</span>
              </h2>
              <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-0.5 rounded-full tabular-nums">
                {formatNumber(publishedNotices.length, locale)}
              </span>
            </div>
            <Link
              href="/notices"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-[#0c5936] dark:hover:text-emerald-400 transition-colors group"
            >
              <span className="group-hover:underline">{pick('সকল নোটিশ', 'All Notices')}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="px-5 sm:px-6 py-2.5 bg-surface-muted/30 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {noticeTabs.map((tab) => {
                const active = noticeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    aria-pressed={active}
                    type="button"
                    onClick={() => setNoticeTab(tab.key)}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap',
                      active
                        ? 'bg-[#0c5936] text-white shadow-xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                    )}
                  >
                    {locale === 'bn' ? tab.labelBn : tab.labelEn}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={noticeQuery}
                onChange={(e) => setNoticeQuery(e.target.value)}
                placeholder={pick('স্মারক বা বিষয় খুঁজুন...', 'Search memo or title...')}
                className="w-full h-9 pl-9 pr-2.5 text-sm bg-surface border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="divide-y divide-border">
            {loading || loadFailed ? (
              <div className="flex flex-wrap items-center justify-center gap-3 p-5 text-sm text-muted-foreground" role={loadFailed ? 'alert' : 'status'}>
                {loading ? pick('বিজ্ঞপ্তি লোড হচ্ছে…', 'Loading notices...') : pick('বিজ্ঞপ্তি লোড করা যায়নি।', 'Could not load notices.')}
                {loadFailed && <button type="button" onClick={onRetry} className="font-medium text-primary underline">{pick('আবার চেষ্টা', 'Retry')}</button>}
              </div>
            ) : publishedNotices.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                {pick('এই বিভাগে কোনো বিজ্ঞপ্তি পাওয়া যায়নি।', 'No notices found in this category.')}
              </div>
            ) : (
              publishedNotices.slice(0, 5).map((notice) => {
                const pubDate = new Date(notice.publishedAt ?? notice.createdAt);
                const isRecent = Date.now() - pubDate.getTime() < 14 * 24 * 60 * 60 * 1000;
                const showNewBadge = notice.isUrgent || isRecent;
                const day = String(pubDate.getDate()).padStart(2, '0');
                const month = String(pubDate.getMonth() + 1).padStart(2, '0');
                const year = pubDate.getFullYear();
                const rawDate = `${day}-${month}-${year}`;
                const formattedDate = locale === 'bn' ? formatNumber(rawDate, 'bn') : rawDate;

                return (
                  <Link
                    key={notice.id}
                    href={`/notices/${notice.id}`}
                    className="group flex items-start gap-3.5 px-4 sm:px-6 py-4 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0c5936] dark:bg-emerald-500 shrink-0 mt-2" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <h3 className="text-base font-normal text-foreground group-hover:text-[#0c5936] transition-colors leading-snug line-clamp-2">
                        {notice.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 tabular-nums font-medium">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>{formattedDate}</span>
                        </span>

                        {showNewBadge && (
                          <span className="px-2 py-0.5 rounded-sm bg-[#D32F2F] text-white text-[13px] font-bold leading-none">
                            {pick('নতুন', 'New')}
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-sm bg-surface-muted border border-border text-[13px] font-medium text-foreground">
                          {notice.isUrgent ? pick('জরুরি', 'Urgent') : pick('সাধারণ', 'General')}
                        </span>

                        {notice.memoNo && (
                          <span className="text-[13px] text-muted-foreground font-mono">
                            {notice.memoNo}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 self-center pl-2 text-muted-foreground group-hover:text-[#0c5936] group-hover:translate-x-1 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Action Cards Under Notice Board */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2.5 text-foreground">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="text-[18px] font-bold">
                {pick('শিক্ষা বোর্ড ও সরকারি পোর্টাল', 'Education Boards & Portals')}
              </h3>
            </div>
            <ul className="space-y-2.5 text-[14px] text-muted-foreground">
              <li>
                <a
                  href="https://dshe.gov.bd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between group hover:text-primary transition-colors py-0.5"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span className="truncate">
                      {pick(
                        'মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তর (মাউশি)',
                        'Directorate of Secondary and Higher Education'
                      )}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground/70 group-hover:text-primary shrink-0" />
                </a>
              </li>
              <li>
                <a
                  href="https://dhakaeducationboard.gov.bd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between group hover:text-primary transition-colors py-0.5"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span className="truncate">
                      {pick(
                        'মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড, ঢাকা',
                        'Dhaka Education Board'
                      )}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground/70 group-hover:text-primary shrink-0" />
                </a>
              </li>
              <li>
                <a
                  href="https://nctb.gov.bd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between group hover:text-primary transition-colors py-0.5"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span className="truncate">
                      {pick(
                        'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
                        'National Curriculum and Textbook Board'
                      )}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground/70 group-hover:text-primary shrink-0" />
                </a>
              </li>
              <li>
                <a
                  href="http://bteb.gov.bd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between group hover:text-primary transition-colors py-0.5"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span className="truncate">
                      {pick(
                        'বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB)',
                        'Bangladesh Technical Education Board'
                      )}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground/70 group-hover:text-primary shrink-0" />
                </a>
              </li>
            </ul>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2.5 text-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-[18px] font-bold">
                {pick('একাডেমিক তথ্য ও পাঠ্যক্রম', 'Academic Curriculum & Resources')}
              </h3>
            </div>
            <ul className="space-y-2.5 text-[14px] text-muted-foreground">
              <li>
                <Link
                  href="/academics/academic-calendar"
                  className="flex items-center justify-between group hover:text-primary transition-colors py-0.5"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="truncate">
                      {pick(
                        'বাৎসরিক একাডেমিক ক্যালেন্ডার ও বর্ষপঞ্জি',
                        'Academic Calendar & Holidays'
                      )}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/70 group-hover:text-primary shrink-0" />
                </Link>
              </li>
              <li>
                <Link
                  href="/academics/syllabus"
                  className="flex items-center justify-between group hover:text-primary transition-colors py-0.5"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="truncate">
                      {pick(
                        'শ্রেণিভিত্তিক পাঠ্যসূচি ও সিলেবাস',
                        'Class Syllabus & Outline'
                      )}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/70 group-hover:text-primary shrink-0" />
                </Link>
              </li>
              <li>
                <Link
                  href="/academics/library"
                  className="flex items-center justify-between group hover:text-primary transition-colors py-0.5"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="truncate">
                      {pick(
                        'ডিজিটাল পাঠাগার ও পাঠ্যবই কর্নার',
                        'Digital Library & Reading Corner'
                      )}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/70 group-hover:text-primary shrink-0" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right 4 Columns — Leadership Widgets */}
      <div className="lg:col-span-4 space-y-5">
        {presidentMsg && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="bg-[#0c5936] text-white px-4 py-2.5 font-bold text-[18px] tracking-wide flex items-center justify-between">
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
                <h3 className="text-[16px] font-bold text-foreground">
                  {presidentMsg.personName}
                </h3>
                <p className="text-[14px] text-muted-foreground">
                  {presidentMsg.designation}
                </p>
              </div>
              <div className="pt-2 border-t border-border/60">
                <Link
                  href={`/about/leadership/${presidentMsg.id}`}
                  className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:underline"
                >
                  <span>{pick('বিস্তারিত পরিচিতি ও বাণী', 'View Details & Message')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {principalMsg && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="bg-[#0c5936] text-white px-4 py-2.5 font-bold text-[18px] tracking-wide flex items-center justify-between">
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
                <h3 className="text-[16px] font-bold text-foreground">
                  {principalMsg.personName}
                </h3>
                <p className="text-[14px] text-muted-foreground">
                  {principalMsg.designation}
                </p>
              </div>
              <div className="pt-2 border-t border-border/60">
                <Link
                  href={`/about/leadership/${principalMsg.id}`}
                  className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:underline"
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
  );
}
