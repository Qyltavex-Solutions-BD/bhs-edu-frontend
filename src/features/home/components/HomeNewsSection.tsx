'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { News } from '@/src/types/entities';
import { useI18n } from '@/src/lib/i18n';
import { formatDateLong } from '@/src/lib/formatters';
import { getNewsPhoto } from '@/src/components/shared/Feedback';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

interface HomeNewsSectionProps {
  news: News[];
}

export function HomeNewsSection({ news }: HomeNewsSectionProps) {
  const { locale, pick } = useI18n();

  const publishedNews = [...(news ?? [])]
    .filter((n) => n.isPublished)
    .sort((a, b) => {
      const ta = new Date(a.publishedAt ?? a.createdAt).getTime();
      const tb = new Date(b.publishedAt ?? b.createdAt).getTime();
      return tb - ta;
    })
    .slice(0, 3);

  if (publishedNews.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className="space-y-6"
    >
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

      <div className="space-y-6">
        {/* Featured Lead News Story */}
        {(() => {
          const lead = publishedNews[0];
          const leadPhoto = getNewsPhoto(lead.image, lead.id);
          return (
            <Link
              href={`/news/${lead.id}`}
              className="group block bg-surface border border-border rounded-xl overflow-hidden hover:border-primary/45 transition-all shadow-xs"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-6 relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:min-h-[260px] overflow-hidden bg-surface-muted">
                  <img
                    src={leadPhoto}
                    alt={lead.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <div className="lg:col-span-6 p-6 sm:p-7 flex flex-col justify-between gap-4">
                  <div className="space-y-2.5">
                    <p className="text-sm text-primary font-semibold tabular-nums">
                      {formatDateLong(lead.publishedAt ?? lead.createdAt, locale)}
                    </p>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {lead.title}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed line-clamp-3">
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

        {/* Second Row: 1 Vertical Card (Col 4) + 1 Wide Horizontal Card (Col 8) */}
        {publishedNews.length > 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {publishedNews[1] && (() => {
              const item = publishedNews[1];
              const itemPhoto = getNewsPhoto(item.image, item.id);
              return (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="group lg:col-span-4 bg-surface border border-border rounded-xl overflow-hidden flex flex-col justify-between hover:border-primary/45 transition-all shadow-xs"
                >
                  <div>
                    <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
                      <img
                        src={itemPhoto}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-5 space-y-2">
                      <p className="text-sm font-semibold text-primary tabular-nums">
                        {formatDateLong(item.publishedAt ?? item.createdAt, locale)}
                      </p>
                      <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="px-5 pb-4 pt-2 border-t border-border/60 flex items-center justify-between text-sm font-semibold text-primary">
                    <span>{pick('বিস্তারিত পড়ুন', 'Read More')}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })()}

            {publishedNews[2] && (() => {
              const item = publishedNews[2];
              const itemPhoto = getNewsPhoto(item.image, item.id);
              return (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="group lg:col-span-8 bg-surface border border-border rounded-xl overflow-hidden hover:border-primary/45 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 h-full">
                    <div className="md:col-span-7 p-6 sm:p-7 flex flex-col justify-between gap-4 order-2 md:order-1">
                      <div className="space-y-2.5">
                        <p className="text-sm font-semibold text-primary tabular-nums">
                          {formatDateLong(item.publishedAt ?? item.createdAt, locale)}
                        </p>
                        <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                        <span>{pick('সম্পূর্ণ সংবাদ পড়ুন', 'Read Full Story')}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>

                    <div className="md:col-span-5 relative aspect-[16/10] md:aspect-auto md:min-h-[220px] overflow-hidden bg-surface-muted order-1 md:order-2">
                      <img
                        src={itemPhoto}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    </div>
                  </div>
                </Link>
              );
            })()}
          </div>
        )}
      </div>
    </motion.section>
  );
}
