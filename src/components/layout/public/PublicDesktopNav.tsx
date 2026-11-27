'use client';

import React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ArrowRight, Award } from 'lucide-react';
import { PUBLIC_NAV, isGroupActive, type NavGroup } from './public-nav.data';
import { cn } from '@/src/lib/utils/cn';
import type { Notice } from '@/src/types/entities';

interface PublicDesktopNavProps {
  pathname: string;
  openDropdown: string | null;
  onOpenDropdown: (id: string) => void;
  onScheduleCloseDropdown: () => void;
  onCloseDropdown: () => void;
  latestNotice?: Notice;
}

export function PublicDesktopNav({
  pathname,
  openDropdown,
  onOpenDropdown,
  onScheduleCloseDropdown,
  onCloseDropdown,
  latestNotice,
  
  
}: PublicDesktopNavProps) {
  return (
    <nav
      className="hidden lg:flex items-center gap-4 xl:gap-6"
      aria-label="Primary navigation"
    >
      {PUBLIC_NAV.map((item) => {
        const label = item.labelBn;
        const active = isGroupActive(item, pathname);

        if (!item.children) {
          return (
            <Link
              key={item.id}
              href={item.to!}
              className={cn(
                'relative text-sm text-white transition-colors whitespace-nowrap shrink-0 py-1.5 border-b-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]',
                active
                  ? 'font-semibold border-white'
                  : 'font-medium border-transparent hover:border-white/55'
              )}
            >
              {label}
            </Link>
          );
        }

        const isOpen = openDropdown === item.id;
        const panelAlignClass =
          item.align === 'right'
            ? 'right-0'
            : item.align === 'center'
              ? 'left-1/2 -translate-x-1/2'
              : 'left-0';

        return (
          <div
            key={item.id}
            className="relative"
            onMouseEnter={() => onOpenDropdown(item.id)}
            onMouseLeave={onScheduleCloseDropdown}
          >
            <button
              type="button"
              onClick={() => (isOpen ? onCloseDropdown() : onOpenDropdown(item.id))}
              aria-expanded={isOpen}
              aria-haspopup="true"
              className={cn(
                'inline-flex items-center gap-1 text-sm text-white transition-colors whitespace-nowrap shrink-0 py-1.5 border-b-2 cursor-pointer drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]',
                active || isOpen
                  ? 'font-semibold border-white'
                  : 'font-medium border-transparent hover:border-white/55'
              )}
            >
              <span>{label}</span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 text-white transition-transform duration-150',
                  isOpen && 'rotate-180'
                )}
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  onMouseEnter={() => onOpenDropdown(item.id)}
                  onMouseLeave={onScheduleCloseDropdown}
                  className={cn(
                    'absolute top-full pt-2.5 z-50 w-[560px] xl:w-[600px]',
                    panelAlignClass
                  )}
                >
                  <div className="bg-surface/98 backdrop-blur-xl text-foreground border border-border rounded-[var(--radius)] shadow-2xl shadow-black/15 overflow-hidden">
                    {/* Mega-Menu Top Header */}
                    <div className="px-4 py-2.5 border-b border-border/70 flex items-center justify-between bg-surface-muted/40">
                      <span className="text-sm font-semibold text-muted-foreground tracking-wide">
                        {label}
                      </span>
                      {item.to && (
                        <Link
                          href={item.to}
                          onClick={onCloseDropdown}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                        >
                          <span>{'সব দেখুন'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>

                    {/* 2-Column Rich Navigation Grid */}
                    <div className="grid grid-cols-2 gap-1 p-2.5">
                      {item.children.map((sub) => {
                        const SubIcon = sub.icon;
                        const subActive = pathname === sub.to;
                        return (
                          <Link
                            key={sub.to}
                            href={sub.to}
                            onClick={onCloseDropdown}
                            className={cn(
                              'group flex items-start gap-3 p-2.5 rounded-[var(--radius)] transition-colors',
                              subActive
                                ? 'bg-primary/8 text-primary'
                                : 'hover:bg-surface-muted/85'
                            )}
                          >
                            <span
                              className={cn(
                                'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                                subActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-surface-muted text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                              )}
                            >
                              <SubIcon className="w-4 h-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span
                                className={cn(
                                  'block text-sm font-semibold leading-snug transition-colors',
                                  subActive
                                    ? 'text-primary'
                                    : 'text-foreground group-hover:text-primary'
                                )}
                              >
                                {sub.labelBn}
                              </span>
                              <span className="block text-sm text-muted-foreground leading-snug line-clamp-1 mt-0.5">
                                {sub.descBn}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Contextual Footer Highlight Strip */}
                    {item.id === 'about' && (
                      <div className="px-4 py-2.5 bg-surface-muted/65 border-t border-border flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground tabular-nums">
                          <strong className="text-foreground font-semibold">BHS</strong> ·{' '}
                          {'স্থাপিত ১৯৭৮ · EIIN ১১৩৫৮৭ · ভোজেশ্বর, নড়িয়া'}
                        </span>
                        <Link
                          href="/about/teachers"
                          onClick={onCloseDropdown}
                          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline whitespace-nowrap"
                        >
                          <span>{'শিক্ষকমণ্ডলী'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}

                    {item.id === 'academics' && (
                      <div className="px-4 py-2.5 bg-surface-muted/65 border-t border-border flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                          <Award className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate">
                            {'রোল নম্বর দিয়ে তাৎক্ষণিক পরীক্ষার ফলাফল ও মার্কশিট দেখুন'}
                          </span>
                        </div>
                        <Link
                          href="/results"
                          onClick={onCloseDropdown}
                          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline whitespace-nowrap shrink-0"
                        >
                          <span>{'ফলাফল দেখুন'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}

                    {item.id === 'admission' && (
                      <div className="px-4 py-2.5 bg-surface-muted/65 border-t border-border flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">
                          {'৬ষ্ঠ–৯ম শ্রেণিতে অনলাইন ভর্তি আবেদন ও স্ট্যাটাস যাচাই'}
                        </span>
                        <div className="flex items-center gap-3 shrink-0">
                          <Link
                            href="/admission/status"
                            onClick={onCloseDropdown}
                            className="font-medium text-foreground hover:text-primary whitespace-nowrap"
                          >
                            {'স্ট্যাটাস যাচাই'}
                          </Link>
                          <Link
                            href="/admission/apply"
                            onClick={onCloseDropdown}
                            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline whitespace-nowrap"
                          >
                            <span>{'আবেদন করুন'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    )}

                    {item.id === 'notices' && latestNotice && (
                      <div className="px-4 py-2.5 bg-surface-muted/65 border-t border-border flex items-center justify-between gap-3 text-sm">
                        <Link
                          href={`/notices/${latestNotice.id}`}
                          onClick={onCloseDropdown}
                          className="flex items-center gap-2 min-w-0 group"
                        >
                          {latestNotice.isUrgent ? (
                            <span className="px-2 py-0.5 rounded bg-[#C81E24] text-white text-xs font-semibold shrink-0 leading-none">
                              {'জরুরি'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-primary/12 text-primary text-xs font-semibold shrink-0 leading-none">
                              {'সর্বশেষ'}
                            </span>
                          )}
                          <span className="truncate text-foreground/85 group-hover:text-primary font-medium transition-colors">
                            {latestNotice.title}
                          </span>
                        </Link>
                        <Link
                          href="/notices"
                          onClick={onCloseDropdown}
                          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline whitespace-nowrap shrink-0"
                        >
                          <span>{'সকল নোটিশ'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}
