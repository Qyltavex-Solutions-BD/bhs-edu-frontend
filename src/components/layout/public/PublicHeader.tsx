'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Moon, Sun, LogIn, Menu } from 'lucide-react';
import { SchoolEmblem } from '@/src/components/shared/Feedback';
import { PublicDesktopNav } from './PublicDesktopNav';
import { cn } from '@/src/lib/utils/cn';
import type { SchoolProfile, Notice } from '@/src/types/entities';

interface PublicHeaderProps {
  isHome: boolean;
  isAtHeroTop: boolean;
  school?: SchoolProfile;
  pathname: string;
  openDropdown: string | null;
  onOpenDropdown: (id: string) => void;
  onScheduleCloseDropdown: () => void;
  onCloseDropdown: () => void;
  latestNotice?: Notice;
  onOpenSearch: () => void;
  theme: string;
  onToggleTheme: () => void;
  portalUrl: string;
  isAuthenticated: boolean;
  onOpenMobileDrawer: () => void;
}

export function PublicHeader({
  isHome,
  isAtHeroTop,
  school,
  
  
  
  pathname,
  openDropdown,
  onOpenDropdown,
  onScheduleCloseDropdown,
  onCloseDropdown,
  latestNotice,
  onOpenSearch,
  theme,
  onToggleTheme,
  portalUrl,
  isAuthenticated,
  onOpenMobileDrawer,
}: PublicHeaderProps) {
  return (
    <header
      className={cn(
        'z-40 no-print text-white',
        isHome ? 'fixed top-0 inset-x-0' : 'sticky top-0'
      )}
    >
      {/* Layer 1: Seamless Hero-Top Scrim (zero box, zero border — blends directly into Hero photo) */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#071709]/48 via-[#071709]/14 to-transparent transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          isAtHeroTop ? 'opacity-100' : 'opacity-0'
        )}
      />
      {/* Layer 2: Sticky Deep Forest Frosted Glass (visibly translucent blur + deep BHS tone) */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 bg-[#061408]/82 backdrop-blur-2xl backdrop-saturate-[1.9] border-b border-white/18 shadow-[0_12px_36px_rgba(4,16,8,0.28),inset_0_1px_0_rgba(255,255,255,0.16)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          isAtHeroTop ? 'opacity-0' : 'opacity-100'
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-black/[0.10]" />
      </div>

      <div
        className={cn(
          'max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 transition-[height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          isAtHeroTop ? 'h-[72px]' : 'h-16'
        )}
      >
        {/* Brand Zone */}
        <Link href="/" className="flex items-center gap-2.5 min-w-0 shrink-0 group">
          <SchoolEmblem
            size={40}
            className="ring-1 ring-white/40 bg-white shadow-sm transition-transform group-hover:scale-[1.03]"
          />
          <div className="min-w-0 leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
            <span className="block font-bold text-sm sm:text-base text-white tracking-tight whitespace-nowrap truncate max-w-[200px] sm:max-w-[265px]">
              {school?.name ?? 'ভোজেশ্বর উচ্চ বিদ্যালয়'}
            </span>
            <span className="hidden sm:block text-sm font-medium text-white/95">
              <span className="font-semibold text-white">BHS</span>
              <span className="mx-1.5 text-white/75" aria-hidden="true">
                ·
              </span>
              {'ভোজেশ্বর, নড়িয়া, শরীয়তপুর'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <PublicDesktopNav
          pathname={pathname}
          openDropdown={openDropdown}
          onOpenDropdown={onOpenDropdown}
          onScheduleCloseDropdown={onScheduleCloseDropdown}
          onCloseDropdown={onCloseDropdown}
          latestNotice={latestNotice}
        />

        {/* Action Zone */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Quick Search Trigger */}
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label={'অনুসন্ধান করুন'}
            title={'অনুসন্ধান (Ctrl+K)'}
            className="h-8 w-8 inline-flex items-center justify-center rounded-[var(--radius)] text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={'থিম পরিবর্তন করুন'}
            className="h-9 w-9 inline-flex items-center justify-center rounded-[var(--radius)] text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Hairline Divider */}
          <span
            className="hidden sm:block h-4 w-px mx-1 bg-white/30"
            aria-hidden="true"
          />

          {/* Quiet Portal Link */}
          <Link
            href={portalUrl}
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-2.5 text-sm font-medium rounded-[var(--radius)] text-white hover:bg-white/15 transition-colors whitespace-nowrap shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{isAuthenticated ? 'ড্যাশবোর্ড' : 'পোর্টাল লগইন'}</span>
          </Link>

          {/* Single Dominant Primary CTA */}
          <Link
            href="/admission/apply"
            className="hidden md:inline-flex items-center h-9 px-3.5 text-sm font-semibold rounded-[var(--radius)] bg-[#0E833C] hover:bg-[#119947] text-white border border-white/25 shadow-sm shadow-black/25 transition-colors whitespace-nowrap shrink-0"
          >
            {'ভর্তি আবেদন'}
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={onOpenMobileDrawer}
            aria-label={'মেনু খুলুন'}
            className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-[var(--radius)] text-white border border-white/30 hover:bg-white/15 transition-colors cursor-pointer shrink-0 ml-0.5"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
