'use client';

import React from 'react';
import Link from 'next/link';
import {
  Menu,
  Home,
  ChevronRight,
  Search,
  Calendar,
  Sun,
  Moon,
} from 'lucide-react';
import { PortalNotificationMenu } from './PortalNotificationMenu';
import type { NavContextResult } from './portal-nav.data';
import type { AuthUser } from '@/src/store/slices/authSlice';
import type { AppNotification } from '@/src/types/proposed/future';

interface PortalHeaderProps {
  onOpenMobileNav: () => void;
  isDashboardRoot: boolean;
  portal: string;
  currentNavContext: NavContextResult | null;
  user: AuthUser | null;
  role?: string;
  onOpenSearch: () => void;
  notifications: AppNotification[];
  unreadCount: number;
  notifOpen: boolean;
  onToggleNotif: () => void;
  onMarkNotificationRead: (args: { id?: string }) => void;
  theme: string;
  onToggleTheme: () => void;
  locale: string;
  pick: (bn: string, en: string) => string;
}

export function PortalHeader({
  onOpenMobileNav,
  isDashboardRoot,
  portal,
  currentNavContext,
  user,
  role,
  onOpenSearch,
  notifications,
  unreadCount,
  notifOpen,
  onToggleNotif,
  onMarkNotificationRead,
  theme,
  onToggleTheme,
  locale,
  pick,
}: PortalHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/70 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 no-print">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="lg:hidden p-2 rounded-xl border border-border bg-surface hover:bg-surface-muted shadow-xs shrink-0 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {isDashboardRoot ? (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                {pick('সার্বিক ড্যাশবোর্ড ওভারভিউ', 'Main Dashboard Overview')}
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-foreground flex items-center gap-1.5 truncate mt-0.5">
              {pick(`শুভ সকাল, ${user?.name ?? 'অ্যাডমিন'} 👋`, `Good morning, ${user?.name ?? 'Admin'} 👋`)}
            </h1>
          </div>
        ) : (
          <div className="min-w-0 space-y-0.5">
            {/* Clean modern breadcrumb navigation */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"
            >
              <Link
                href={portal === 'admin' ? '/admin' : `/${portal}/dashboard`}
                className="hover:text-primary transition-colors flex items-center gap-1 shrink-0"
                title={pick('ড্যাশবোর্ড', 'Dashboard')}
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{pick('হোম', 'Home')}</span>
              </Link>

              {currentNavContext?.groupLabel && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                  <span className="truncate max-w-[110px] sm:max-w-none text-muted-foreground/85">
                    {currentNavContext.groupLabel}
                  </span>
                </>
              )}

              {currentNavContext?.parentLabel && currentNavContext.parentLabel !== currentNavContext.pageTitle && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                  <Link
                    href={currentNavContext.parentTo ?? '#'}
                    className="hover:text-primary transition-colors truncate max-w-[120px] sm:max-w-none text-muted-foreground/85"
                  >
                    {currentNavContext.parentLabel}
                  </Link>
                </>
              )}

              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
              <span className="text-foreground font-semibold truncate max-w-[150px] sm:max-w-none">
                {currentNavContext?.pageTitle ?? pick('বিবরণ', 'Details')}
              </span>
            </nav>

            {/* Prominent Page Title */}
            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight truncate">
              {currentNavContext?.pageTitle ?? pick('বিবরণ', 'Details')}
            </h1>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {/* Search Capsule */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden md:inline-flex items-center gap-3 h-10 px-4 text-xs text-muted-foreground bg-surface border border-border/80 rounded-full hover:bg-surface-muted shadow-xs cursor-pointer min-w-[200px] lg:min-w-[240px] justify-between transition"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{pick('কিছু খুঁজুন...', 'Search anything...')}</span>
          </div>
          <kbd className="font-mono text-[11px] text-muted-foreground bg-surface-muted border border-border px-1.5 py-0.5 rounded-md">⌘K</kbd>
        </button>

        {/* Calendar Button */}
        <Link href="/admin/academic/events" className="hidden sm:inline-flex">
          <button
            type="button"
            title={pick('ক্যালেন্ডার', 'Calendar')}
            className="h-10 w-10 inline-flex items-center justify-center bg-surface border border-border/80 rounded-full hover:bg-surface-muted shadow-xs text-foreground cursor-pointer transition"
          >
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </button>
        </Link>

        {/* Notifications */}
        <PortalNotificationMenu
          notifications={notifications}
          unreadCount={unreadCount}
          isOpen={notifOpen}
          onToggle={onToggleNotif}
          onMarkRead={onMarkNotificationRead}
          locale={locale}
          pick={pick}
        />

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={pick('থিম পরিবর্তন করুন', 'Toggle theme')}
          className="h-10 w-10 inline-flex items-center justify-center bg-surface border border-border/80 rounded-full hover:bg-surface-muted shadow-xs text-foreground cursor-pointer transition"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile Capsule */}
        <div className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-surface border border-border/80 hover:bg-surface-muted transition shadow-xs cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#1C6440] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-foreground leading-tight truncate max-w-[110px]">
              {user?.name ?? 'Admin'}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight uppercase font-medium">
              {role ?? 'Super Admin'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
