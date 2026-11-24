'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useI18n } from '@/src/lib/i18n';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { toggleTheme } from '@/src/store/slices/uiSlice';
import { useGetBootstrapQuery } from '@/src/store/api';
import { NoticeStatus, StaffStatus } from '@/src/types/enums';
import {
  NoticeTickerBar,
  PublicHeader,
  PublicQuickSearchModal,
  PublicMobileMenu,
  PublicFooter,
  PUBLIC_NAV,
  QUICK_SEARCH_SHORTCUTS,
  isGroupActive,
} from './public';

export { NoticeTickerBar };

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { locale, pick, t } = useI18n();
  const theme = useAppSelector((s) => s.ui.theme);
  const auth = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const { data: db } = useGetBootstrapQuery();
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpandedGroup, setMobileExpandedGroup] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const closeTimerRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const isHome = pathname === '/';
  const isAtHeroTop = isHome && !scrolled && !openDropdown && !mobileOpen;

  // Scroll listener for seamless Hero-Blend -> Sticky Glass transition
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close overlays automatically on route change
  useEffect(() => {
    setOpenDropdown(null);
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Global keyboard shortcuts: Ctrl/Cmd+K for Quick Search, Escape to close menus/modals
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpenDropdown(null);
        setMobileOpen(false);
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setOpenDropdown(null);
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Auto-focus search input when modal opens & reset query on close
  useEffect(() => {
    if (searchOpen) {
      const id = window.setTimeout(() => searchInputRef.current?.focus(), 40);
      return () => window.clearTimeout(id);
    } else {
      setSearchQuery('');
    }
  }, [searchOpen]);

  // Cleanup hover close timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleOpenDropdown = (id: string) => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenDropdown(id);
  };

  const handleScheduleCloseDropdown = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setOpenDropdown(null);
      closeTimerRef.current = null;
    }, 130);
  };

  const handleOpenMobileDrawer = () => {
    const activeGroup = PUBLIC_NAV.find(
      (g) => g.children && isGroupActive(g, pathname)
    );
    setMobileExpandedGroup(activeGroup ? activeGroup.id : 'academics');
    setMobileOpen(true);
  };

  const school = db?.schoolProfile;
  const portalUrl = auth.isAuthenticated
    ? auth.role === 'TEACHER'
      ? '/teacher/dashboard'
      : auth.role === 'PARENT'
        ? '/parent/dashboard'
        : auth.role === 'STUDENT'
          ? '/student/dashboard'
          : '/admin'
    : '/login';

  const tickerNotices = useMemo(
    () =>
      (db?.notices ?? [])
        .filter((n) => n.status === NoticeStatus.PUBLISHED)
        .slice(0, 6),
    [db?.notices]
  );

  const latestNotice = tickerNotices[0];

  // Live search results for Quick Search Modal
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return {
        shortcuts: QUICK_SEARCH_SHORTCUTS,
        notices: tickerNotices.slice(0, 3),
        staff: [] as { id: string; name: string; designation: string }[],
        academics: [] as { id: string; label: string; meta: string; to: string }[],
      };
    }

    const shortcuts = QUICK_SEARCH_SHORTCUTS.filter(
      (item) =>
        item.labelBn.toLowerCase().includes(q) ||
        item.labelEn.toLowerCase().includes(q) ||
        item.descBn.toLowerCase().includes(q) ||
        item.descEn.toLowerCase().includes(q)
    );

    const notices = (db?.notices ?? [])
      .filter(
        (n) =>
          n.status === NoticeStatus.PUBLISHED &&
          (n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q))
      )
      .slice(0, 4);

    const staff = (db?.staff ?? [])
      .filter(
        (s) =>
          s.status === StaffStatus.ACTIVE &&
          (s.name.toLowerCase().includes(q) ||
            (s.nameBn?.toLowerCase().includes(q) ?? false) ||
            s.designation.toLowerCase().includes(q))
      )
      .slice(0, 4)
      .map((s) => ({
        id: s.id,
        name: locale === 'bn' && s.nameBn ? s.nameBn : s.name,
        designation: s.designation,
      }));

    const matchedClasses = (db?.classes ?? [])
      .filter(
        (c) =>
          c.isActive &&
          (c.name.toLowerCase().includes(q) || (c.nameBn?.toLowerCase().includes(q) ?? false))
      )
      .slice(0, 3)
      .map((c) => ({
        id: `cls-${c.id}`,
        label: locale === 'bn' && c.nameBn ? c.nameBn : c.name,
        meta: pick('শ্রেণি', 'Class'),
        to: '/academics/classes',
      }));

    const matchedSubjects = (db?.subjects ?? [])
      .filter(
        (s) =>
          s.isActive &&
          (s.name.toLowerCase().includes(q) ||
            (s.nameBn?.toLowerCase().includes(q) ?? false) ||
            (s.officialCode?.toLowerCase().includes(q) ?? false))
      )
      .slice(0, 4)
      .map((s) => ({
        id: `sub-${s.id}`,
        label: locale === 'bn' && s.nameBn ? s.nameBn : s.name,
        meta: s.officialCode
          ? `${pick('বিষয় কোড', 'Code')}: ${s.officialCode}`
          : pick('পাঠ্যবিষয়', 'Subject'),
        to: '/academics/subjects',
      }));

    return {
      shortcuts,
      notices,
      staff,
      academics: [...matchedClasses, ...matchedSubjects],
    };
  }, [searchQuery, db?.notices, db?.staff, db?.classes, db?.subjects, tickerNotices, locale, pick]);

  const hasAnySearchResult =
    searchResults.shortcuts.length > 0 ||
    searchResults.notices.length > 0 ||
    searchResults.staff.length > 0 ||
    searchResults.academics.length > 0;

  const navigateFromSearch = (to: string) => {
    setSearchOpen(false);
    router.push(to);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded"
      >
        {pick('মূল বিষয়বস্তুতে যান', 'Skip to main content')}
      </a>

      {/* Header */}
      <PublicHeader
        isHome={isHome}
        isAtHeroTop={isAtHeroTop}
        school={school}
        locale={locale}
        pick={pick}
        t={t}
        pathname={pathname}
        openDropdown={openDropdown}
        onOpenDropdown={handleOpenDropdown}
        onScheduleCloseDropdown={handleScheduleCloseDropdown}
        onCloseDropdown={() => setOpenDropdown(null)}
        latestNotice={latestNotice}
        onOpenSearch={() => setSearchOpen(true)}
        theme={theme}
        onToggleTheme={() => dispatch(toggleTheme())}
        portalUrl={portalUrl}
        isAuthenticated={auth.isAuthenticated}
        onOpenMobileDrawer={handleOpenMobileDrawer}
      />

      {/* On inner pages, show the solid BHS Notice Ticker right under the sticky header */}
      {!isHome && <NoticeTickerBar notices={tickerNotices} />}

      {/* Quick Search Modal */}
      <PublicQuickSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
        hasAnySearchResult={hasAnySearchResult}
        onNavigate={navigateFromSearch}
        searchInputRef={searchInputRef}
        locale={locale}
        pick={pick}
      />

      {/* Mobile Drawer */}
      <PublicMobileMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        expandedGroup={mobileExpandedGroup}
        onToggleGroup={(id) =>
          setMobileExpandedGroup(mobileExpandedGroup === id ? null : id)
        }
        onOpenSearch={() => setSearchOpen(true)}
        pathname={pathname}
        portalUrl={portalUrl}
        isAuthenticated={auth.isAuthenticated}
        theme={theme}
        onToggleTheme={() => dispatch(toggleTheme())}
        locale={locale}
        pick={pick}
        t={t}
      />

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <PublicFooter
        school={school}
        locale={locale}
        pick={pick}
        t={t}
      />
    </div>
  );
}
