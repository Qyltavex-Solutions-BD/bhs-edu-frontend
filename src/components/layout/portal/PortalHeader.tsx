'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  Home,
  ChevronRight,
  ChevronDown,
  Search,
  Sun,
  Moon,
  LayoutDashboard,
  UserCog,
  LogOut,
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
  onLogout: () => void;
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
  onLogout,
}: PortalHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [profileOpen]);

  const dashboardHref = portal === 'admin' ? '/admin' : `/${portal}/dashboard`;
  const profileHref = portal === 'admin' ? '/admin/settings' : `/${portal}/profile`;
  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/70 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 no-print">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="নেভিগেশন মেনু খুলুন"
          className="lg:hidden p-2 rounded-xl border border-border bg-surface hover:bg-surface-muted shadow-xs shrink-0 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {isDashboardRoot ? (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                {'সার্বিক ড্যাশবোর্ড ওভারভিউ'}
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-foreground flex items-center gap-1.5 truncate mt-0.5">
              {`শুভ সকাল, ${user?.name ?? 'অ্যাডমিন'} 👋`}
            </h1>
          </div>
        ) : (
          <div className="min-w-0 space-y-0.5">
            {/* Clean modern breadcrumb navigation */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium"
            >
              <Link
                href={portal === 'admin' ? '/admin' : `/${portal}/dashboard`}
                className="hover:text-primary transition-colors flex items-center gap-1 shrink-0"
                title={'ড্যাশবোর্ড'}
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{'হোম'}</span>
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
              <span className="text-foreground font-semibold truncate max-w-[160px] sm:max-w-none">
                {currentNavContext?.pageTitle ?? 'বিবরণ'}
              </span>
            </nav>
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
            <span>{'কিছু খুঁজুন...'}</span>
          </div>
          <kbd className="font-mono text-xs text-muted-foreground bg-surface-muted border border-border px-1.5 py-0.5 rounded-md">⌘K</kbd>
        </button>

        {/* Notifications */}
        <PortalNotificationMenu
          notifications={notifications}
          unreadCount={unreadCount}
          isOpen={notifOpen}
          onToggle={onToggleNotif}
          onMarkRead={onMarkNotificationRead}
        />

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={'থিম পরিবর্তন করুন'}
          className="h-10 w-10 inline-flex items-center justify-center bg-surface border border-border/80 rounded-full hover:bg-surface-muted shadow-xs text-foreground cursor-pointer transition"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full bg-surface border border-border/80 hover:bg-surface-muted transition shadow-xs cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#1C6440] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-sm font-semibold text-foreground leading-tight truncate max-w-[120px]">
                {user?.name ?? 'Admin'}
              </p>
              <p className="text-xs text-muted-foreground leading-tight uppercase font-medium">
                {role ?? 'Super Admin'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block shrink-0" />
          </button>

          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-60 rounded-2xl bg-surface border border-border shadow-xl py-2 z-50"
            >
              <div className="px-4 py-2.5 border-b border-border">
                <p className="text-base font-bold text-foreground truncate">
                  {user?.name ?? 'Admin'}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {role ?? 'SUPER_ADMIN'}
                </p>
              </div>
              <div className="py-1.5 px-1.5 space-y-0.5">
                <Link
                  href={dashboardHref}
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-primary shrink-0" />
                  <span>{'ড্যাশবোর্ড'}</span>
                </Link>
                <Link
                  href={profileHref}
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
                >
                  <UserCog className="w-4 h-4 text-primary shrink-0" />
                  <span>{'প্রোফাইল পরিচালনা'}</span>
                </Link>
              </div>
              <div className="pt-1.5 mt-1 border-t border-border px-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>{'লগআউট'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
