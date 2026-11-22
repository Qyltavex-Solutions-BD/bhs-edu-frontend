'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronDown,
  Menu,
  Moon,
  Sun,
  X,
  Phone,
  Mail,
  MapPin,
  LogIn,
  Megaphone,
  ArrowUpRight,
  ArrowRight,
  Search,
  Building2,
  History,
  Landmark,
  Quote,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  FileText,
  Clock,
  ClipboardCheck,
  Calendar,
  MonitorPlay,
  Library,
  Award,
  UserPlus,
  BookMarked,
  CheckCircle2,
  Download,
  FileCheck2,
  Newspaper,
  Sparkles,
  Image as ImageIcon,
  BookCopy,
  Trophy,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';
import { useI18n } from '@/src/lib/i18n';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { toggleTheme } from '@/src/store/slices/uiSlice';
import { useGetBootstrapQuery } from '@/src/store/api';
import { SchoolEmblem } from '@/src/components/shared/Feedback';
import { Button } from '@/src/components/ui/primitives';
import { NoticeStatus, StaffStatus } from '@/src/types/enums';
import type { Notice } from '@/src/types/entities';
import { cn } from '@/src/lib/utils/cn';

interface NavChildItem {
  labelBn: string;
  labelEn: string;
  descBn: string;
  descEn: string;
  to: string;
  icon: LucideIcon;
}

interface NavGroup {
  id: string;
  labelBn: string;
  labelEn: string;
  to?: string;
  matchPrefixes?: string[];
  align?: 'left' | 'center' | 'right';
  children?: NavChildItem[];
}

const PUBLIC_NAV: NavGroup[] = [
  { id: 'home', labelBn: 'হোম', labelEn: 'Home', to: '/' },
  {
    id: 'about',
    labelBn: 'পরিচিতি',
    labelEn: 'About',
    to: '/about',
    matchPrefixes: ['/about'],
    align: 'left',
    children: [
      {
        labelBn: 'বিদ্যালয় পরিচিতি',
        labelEn: 'About School',
        descBn: 'প্রতিষ্ঠানের পরিচিতি, লক্ষ্য ও দৃষ্টিভঙ্গি',
        descEn: 'Institutional profile, mission & vision',
        to: '/about',
        icon: Building2,
      },
      {
        labelBn: 'ইতিহাস ও ঐতিহ্য',
        labelEn: 'History & Heritage',
        descBn: '১৯৭৮ সাল থেকে গৌরবময় পথচলা',
        descEn: 'Legacy & milestones since 1978',
        to: '/about/history',
        icon: History,
      },
      {
        labelBn: 'অবকাঠামো ও সুবিধা',
        labelEn: 'Facilities',
        descBn: 'বিজ্ঞানাগার, কম্পিউটার ল্যাব ও মাঠ',
        descEn: 'Science labs, ICT & campus facilities',
        to: '/about/facilities',
        icon: Landmark,
      },
      {
        labelBn: 'নেতৃত্বের বাণী',
        labelEn: 'Leadership',
        descBn: 'প্রধান শিক্ষক ও সভাপতির বাণী',
        descEn: 'Messages from school leadership',
        to: '/about/leadership',
        icon: Quote,
      },
      {
        labelBn: 'ম্যানেজিং কমিটি',
        labelEn: 'Managing Committee',
        descBn: 'বিদ্যালয় পরিচালনা পর্ষদ',
        descEn: 'Governing body & members',
        to: '/about/management-committee',
        icon: Users,
      },
      {
        labelBn: 'শিক্ষকমণ্ডলী',
        labelEn: 'Teachers & Staff',
        descBn: 'অভিজ্ঞ শিক্ষক ও কর্মচারী তালিকা',
        descEn: 'Faculty & staff directory',
        to: '/about/teachers',
        icon: GraduationCap,
      },
    ],
  },
  {
    id: 'academics',
    labelBn: 'একাডেমিক',
    labelEn: 'Academics',
    to: '/academics',
    matchPrefixes: ['/academics', '/results'],
    align: 'center',
    children: [
      {
        labelBn: 'একাডেমিক সারসংক্ষেপ',
        labelEn: 'Academic Overview',
        descBn: 'পাঠদান পদ্ধতি ও শিক্ষাব্যবস্থা',
        descEn: 'Curriculum structure & overview',
        to: '/academics',
        icon: BookOpen,
      },
      {
        labelBn: 'শ্রেণি ও শাখা (৬ষ্ঠ–১০ম)',
        labelEn: 'Classes (6–10)',
        descBn: 'বিজ্ঞান, মানবিক ও ব্যবসায় শাখা',
        descEn: 'Science, Humanities & Business',
        to: '/academics/classes',
        icon: Layers,
      },
      {
        labelBn: 'বিষয়সমূহ',
        labelEn: 'Subjects',
        descBn: 'এনসিটিবি অনুমোদিত পাঠ্যবিষয়',
        descEn: 'NCTB approved subjects list',
        to: '/academics/subjects',
        icon: BookMarked,
      },
      {
        labelBn: 'সিলেবাস ও বিধিমালা',
        labelEn: 'Syllabus & Rules',
        descBn: 'বার্ষিক পাঠ্যসূচি ও আচরণবিধি',
        descEn: 'Annual syllabus & student policy',
        to: '/academics/syllabus',
        icon: FileText,
      },
      {
        labelBn: 'ক্লাস রুটিন',
        labelEn: 'Class Routines',
        descBn: 'শ্রেণি ও শাখাভিত্তিক সময়সূচি',
        descEn: 'Weekly class schedules',
        to: '/academics/routines',
        icon: Clock,
      },
      {
        labelBn: 'পরীক্ষা ও রুটিন',
        labelEn: 'Examinations',
        descBn: 'পরীক্ষার সময়সূচি ও মূল্যায়ন',
        descEn: 'Exam timetable & grading',
        to: '/academics/examination',
        icon: ClipboardCheck,
      },
      {
        labelBn: 'একাডেমিক ক্যালেন্ডার',
        labelEn: 'Academic Calendar',
        descBn: 'ছুটি, পরীক্ষা ও বর্ষপঞ্জি',
        descEn: 'Holidays & key academic dates',
        to: '/academics/academic-calendar',
        icon: Calendar,
      },
      {
        labelBn: 'ডিজিটাল শিক্ষা ও রিসোর্স',
        labelEn: 'Digital Resources',
        descBn: 'লেকচার শিট ও অনলাইন নোট',
        descEn: 'Study notes & e-learning materials',
        to: '/academics/resources',
        icon: MonitorPlay,
      },
      {
        labelBn: 'গ্রন্থাগার',
        labelEn: 'Library',
        descBn: 'সমৃদ্ধ বইয়ের তালিকা ও পাঠাগার',
        descEn: 'Book catalog & reading room',
        to: '/academics/library',
        icon: Library,
      },
      {
        labelBn: 'অনলাইন ফলাফল',
        labelEn: 'Public Results',
        descBn: 'রোল ও শ্রেণি দিয়ে তাৎক্ষণিক ফলাফল',
        descEn: 'Instant grade sheet & merit lookup',
        to: '/results',
        icon: Award,
      },
    ],
  },
  {
    id: 'admission',
    labelBn: 'ভর্তি',
    labelEn: 'Admission',
    to: '/admission',
    matchPrefixes: ['/admission'],
    align: 'center',
    children: [
      {
        labelBn: 'ভর্তি তথ্য',
        labelEn: 'Admission Overview',
        descBn: 'নতুন শিক্ষাবর্ষের ভর্তি সারসংক্ষেপ',
        descEn: 'New session admission summary',
        to: '/admission',
        icon: UserPlus,
      },
      {
        labelBn: 'ভর্তি নির্দেশিকা',
        labelEn: 'Guidelines',
        descBn: 'ধাপে ধাপে ভর্তি প্রক্রিয়া',
        descEn: 'Step-by-step admission guide',
        to: '/admission/guidelines',
        icon: BookOpen,
      },
      {
        labelBn: 'যোগ্যতা ও কাগজপত্র',
        labelEn: 'Requirements',
        descBn: 'প্রয়োজনীয় সনদ ও যোগ্যতা',
        descEn: 'Eligibility & required documents',
        to: '/admission/requirements',
        icon: CheckCircle2,
      },
      {
        labelBn: 'ভর্তি ফরম ডাউনলোড',
        labelEn: 'Download Form',
        descBn: 'প্রিন্টযোগ্য ভর্তি ফরম সংগ্রহ',
        descEn: 'Printable admission form',
        to: '/admission/download-form',
        icon: Download,
      },
      {
        labelBn: 'অনলাইন ভর্তি আবেদন',
        labelEn: 'Apply Online',
        descBn: 'ঘরে বসে ডিজিটাল আবেদন ফরম পূরণ',
        descEn: 'Submit online admission application',
        to: '/admission/apply',
        icon: FileCheck2,
      },
      {
        labelBn: 'আবেদনের অবস্থা যাচাই',
        labelEn: 'Application Status',
        descBn: 'আবেদন নম্বর দিয়ে স্ট্যাটাস দেখুন',
        descEn: 'Track application by tracking ID',
        to: '/admission/status',
        icon: Search,
      },
    ],
  },
  {
    id: 'notices',
    labelBn: 'নোটিশ ও মিডিয়া',
    labelEn: 'Notices',
    to: '/notices',
    matchPrefixes: [
      '/notices',
      '/news',
      '/events',
      '/gallery',
      '/publications',
      '/achievements',
      '/careers',
    ],
    align: 'right',
    children: [
      {
        labelBn: 'নোটিশ বোর্ড',
        labelEn: 'Notice Board',
        descBn: 'বিদ্যালয়ের সকল অফিসিয়াল বিজ্ঞপ্তি',
        descEn: 'Official circulars & announcements',
        to: '/notices',
        icon: Megaphone,
      },
      {
        labelBn: 'সংবাদ ও আপডেট',
        labelEn: 'News',
        descBn: 'ক্যাম্পাস সংবাদ ও গুরুত্বপূর্ণ খবর',
        descEn: 'Campus stories & press updates',
        to: '/news',
        icon: Newspaper,
      },
      {
        labelBn: 'অনুষ্ঠান ও কার্যক্রম',
        labelEn: 'Events',
        descBn: 'বার্ষিক ক্রীড়া, সাংস্কৃতিক ও দিবস',
        descEn: 'Cultural programs & school events',
        to: '/events',
        icon: Sparkles,
      },
      {
        labelBn: 'ছবি গ্যালারি',
        labelEn: 'Photo Gallery',
        descBn: 'ক্যাম্পাস ও অনুষ্ঠানের আলোকচিত্র',
        descEn: 'Campus & event photo archive',
        to: '/gallery',
        icon: ImageIcon,
      },
      {
        labelBn: 'প্রকাশনা',
        labelEn: 'Publications',
        descBn: 'বার্ষিকী, ম্যাগাজিন ও স্মরণিকা',
        descEn: 'School magazines & annual reports',
        to: '/publications',
        icon: BookCopy,
      },
      {
        labelBn: 'অর্জনসমূহ',
        labelEn: 'Achievements',
        descBn: 'বোর্ড ফলাফল ও সহশিক্ষা সাফল্য',
        descEn: 'Board merits & co-curricular awards',
        to: '/achievements',
        icon: Trophy,
      },
      {
        labelBn: 'নিয়োগ বিজ্ঞপ্তি',
        labelEn: 'Careers',
        descBn: 'শিক্ষক ও কর্মচারী নিয়োগ তথ্য',
        descEn: 'Open faculty & staff positions',
        to: '/careers',
        icon: Briefcase,
      },
    ],
  },
  { id: 'contact', labelBn: 'যোগাযোগ', labelEn: 'Contact', to: '/contact' },
];

const QUICK_SEARCH_SHORTCUTS: {
  labelBn: string;
  labelEn: string;
  descBn: string;
  descEn: string;
  to: string;
  icon: LucideIcon;
}[] = [
  {
    labelBn: 'অনলাইন ফলাফল অনুসন্ধান',
    labelEn: 'Online Result Search',
    descBn: 'শ্রেণি ও রোল নম্বর দিয়ে মার্কশিট দেখুন',
    descEn: 'View instant grade sheet by class & roll',
    to: '/results',
    icon: Award,
  },
  {
    labelBn: 'অনলাইন ভর্তি আবেদন',
    labelEn: 'Online Admission Apply',
    descBn: '৬ষ্ঠ–৯ম শ্রেণিতে নতুন ভর্তি আবেদন করুন',
    descEn: 'Submit new student admission online',
    to: '/admission/apply',
    icon: FileCheck2,
  },
  {
    labelBn: 'ক্লাস ও পরীক্ষার রুটিন',
    labelEn: 'Class & Exam Routines',
    descBn: 'সাপ্তাহিক ক্লাস ও পরীক্ষার সময়সূচি',
    descEn: 'Weekly class timetable & exam schedule',
    to: '/academics/routines',
    icon: Clock,
  },
  {
    labelBn: 'শিক্ষকমণ্ডলীর তালিকা',
    labelEn: 'Teachers & Staff Directory',
    descBn: 'বিদ্যালয়ের সকল অভিজ্ঞ শিক্ষকবৃন্দ',
    descEn: 'Browse faculty profiles & departments',
    to: '/about/teachers',
    icon: GraduationCap,
  },
  {
    labelBn: 'নোটিশ বোর্ড',
    labelEn: 'Official Notice Board',
    descBn: 'সর্বশেষ জরুরি ও সাধারণ বিজ্ঞপ্তি',
    descEn: 'All published circulars & notices',
    to: '/notices',
    icon: Megaphone,
  },
  {
    labelBn: 'যোগাযোগ ও অবস্থান',
    labelEn: 'Contact & Campus Location',
    descBn: 'ফোন, ইমেইল ও ভোজেশ্বর ক্যাম্পাস ঠিকানা',
    descEn: 'Phone, email & Bhojeshwar campus address',
    to: '/contact',
    icon: MapPin,
  },
];

function isGroupActive(group: NavGroup, pathname: string): boolean {
  if (group.to === '/') return pathname === '/';
  if (group.matchPrefixes && group.matchPrefixes.length > 0) {
    return group.matchPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
  }
  return group.to ? pathname === group.to || pathname.startsWith(`${group.to}/`) : false;
}

export function NoticeTickerBar({ notices }: { notices: Notice[] }) {
  const { pick } = useI18n();
  if (!notices.length) return null;

  return (
    <div className="bg-[#093B1F] text-white border-b border-white/10 no-print">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-10 flex items-center gap-3 overflow-hidden">
        <Link
          href="/notices"
          className="shrink-0 inline-flex items-center gap-1.5 pr-3 border-r border-white/20 text-sm font-semibold text-white hover:opacity-85 transition-opacity whitespace-nowrap"
        >
          <Megaphone className="w-3.5 h-3.5 opacity-85" />
          <span>{pick('সর্বশেষ বিজ্ঞপ্তি', 'Latest Notices')}</span>
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
                    {pick('জরুরি', 'Urgent')}
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
          {pick('সব দেখুন', 'View All')}
        </Link>
      </div>
    </div>
  );
}

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

      {/* =====================================================================
          OPTION 3 HEADER: Seamless Hero-Blend Initially -> Smooth Sticky Dark Forest Glass
         ===================================================================== */}
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
                {locale === 'bn'
                  ? school?.name ?? t('school.name')
                  : school?.nameEn ?? 'Bhojeshwar High School'}
              </span>
              <span className="hidden sm:block text-xs font-medium text-white/95">
                <span className="font-semibold text-white">BHS</span>
                <span className="mx-1.5 text-white/75" aria-hidden="true">
                  ·
                </span>
                {pick('ভোজেশ্বর, নড়িয়া, শরীয়তপুর', 'Est. 1978 · Shariatpur')}
              </span>
            </div>
          </Link>

          {/* Center Desktop Navigation Links + Structured 2-Column Rich Mega-Menus */}
          <nav
            className="hidden lg:flex items-center gap-4 xl:gap-6"
            aria-label="Primary navigation"
          >
            {PUBLIC_NAV.map((item) => {
              const label = locale === 'bn' ? item.labelBn : item.labelEn;
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
                  onMouseEnter={() => handleOpenDropdown(item.id)}
                  onMouseLeave={handleScheduleCloseDropdown}
                >
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(isOpen ? null : item.id)}
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
                        onMouseEnter={() => handleOpenDropdown(item.id)}
                        onMouseLeave={handleScheduleCloseDropdown}
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
                                onClick={() => setOpenDropdown(null)}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                              >
                                <span>{pick('সব দেখুন', 'Explore all')}</span>
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
                                  onClick={() => setOpenDropdown(null)}
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
                                      {locale === 'bn' ? sub.labelBn : sub.labelEn}
                                    </span>
                                    <span className="block text-xs text-muted-foreground leading-snug line-clamp-1 mt-0.5">
                                      {locale === 'bn' ? sub.descBn : sub.descEn}
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
                                {pick(
                                  'স্থাপিত ১৯৭৮ · EIIN ১১৩৫৮৭ · ভোজেশ্বর, নড়িয়া',
                                  'Est. 1978 · EIIN 113587 · Noria, Shariatpur'
                                )}
                              </span>
                              <Link
                                href="/about/teachers"
                                onClick={() => setOpenDropdown(null)}
                                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline whitespace-nowrap"
                              >
                                <span>{pick('শিক্ষকমণ্ডলী', 'Meet Faculty')}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          )}

                          {item.id === 'academics' && (
                            <div className="px-4 py-2.5 bg-surface-muted/65 border-t border-border flex items-center justify-between gap-3 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                                <Award className="w-4 h-4 text-primary shrink-0" />
                                <span className="truncate">
                                  {pick(
                                    'রোল নম্বর দিয়ে তাৎক্ষণিক পরীক্ষার ফলাফল ও মার্কশিট দেখুন',
                                    'Look up instant exam results & grade sheets by roll number'
                                  )}
                                </span>
                              </div>
                              <Link
                                href="/results"
                                onClick={() => setOpenDropdown(null)}
                                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline whitespace-nowrap shrink-0"
                              >
                                <span>{pick('ফলাফল দেখুন', 'Check Results')}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          )}

                          {item.id === 'admission' && (
                            <div className="px-4 py-2.5 bg-surface-muted/65 border-t border-border flex items-center justify-between gap-3 text-sm">
                              <span className="text-muted-foreground">
                                {pick(
                                  '৬ষ্ঠ–৯ম শ্রেণিতে অনলাইন ভর্তি আবেদন ও স্ট্যাটাস যাচাই',
                                  'Online admission applications & live status tracking'
                                )}
                              </span>
                              <div className="flex items-center gap-3 shrink-0">
                                <Link
                                  href="/admission/status"
                                  onClick={() => setOpenDropdown(null)}
                                  className="font-medium text-foreground hover:text-primary whitespace-nowrap"
                                >
                                  {pick('স্ট্যাটাস যাচাই', 'Track Status')}
                                </Link>
                                <Link
                                  href="/admission/apply"
                                  onClick={() => setOpenDropdown(null)}
                                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline whitespace-nowrap"
                                >
                                  <span>{pick('আবেদন করুন', 'Apply Now')}</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          )}

                          {item.id === 'notices' && latestNotice && (
                            <div className="px-4 py-2.5 bg-surface-muted/65 border-t border-border flex items-center justify-between gap-3 text-sm">
                              <Link
                                href={`/notices/${latestNotice.id}`}
                                onClick={() => setOpenDropdown(null)}
                                className="flex items-center gap-2 min-w-0 group"
                              >
                                {latestNotice.isUrgent ? (
                                  <span className="px-2 py-0.5 rounded bg-[#C81E24] text-white text-xs font-semibold shrink-0 leading-none">
                                    {pick('জরুরি', 'Urgent')}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-primary/12 text-primary text-xs font-semibold shrink-0 leading-none">
                                    {pick('সর্বশেষ', 'Latest')}
                                  </span>
                                )}
                                <span className="truncate text-foreground/85 group-hover:text-primary font-medium transition-colors">
                                  {latestNotice.title}
                                </span>
                              </Link>
                              <Link
                                href="/notices"
                                onClick={() => setOpenDropdown(null)}
                                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline whitespace-nowrap shrink-0"
                              >
                                <span>{pick('সকল নোটিশ', 'All Notices')}</span>
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

          {/* Streamlined Action Zone (Clean Utility Icons + Quiet Portal + Single Primary CTA) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Quick Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={pick('অনুসন্ধান করুন', 'Search school site')}
              title={pick('অনুসন্ধান (Ctrl+K)', 'Search (Ctrl+K)')}
              className="h-8 w-8 inline-flex items-center justify-center rounded-[var(--radius)] text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Theme Switcher */}
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              aria-label={pick('থিম পরিবর্তন করুন', 'Toggle color theme')}
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
              <span>{auth.isAuthenticated ? t('nav.dashboard') : t('nav.portal')}</span>
            </Link>

            {/* Single Dominant Primary CTA */}
            <Link
              href="/admission/apply"
              className="hidden md:inline-flex items-center h-9 px-3.5 text-sm font-semibold rounded-[var(--radius)] bg-[#0E833C] hover:bg-[#119947] text-white border border-white/25 shadow-sm shadow-black/25 transition-colors whitespace-nowrap shrink-0"
            >
              {pick('ভর্তি আবেদন', 'Apply Now')}
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={handleOpenMobileDrawer}
              aria-label={pick('মেনু খুলুন', 'Open menu')}
              className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-[var(--radius)] text-white border border-white/30 hover:bg-white/15 transition-colors cursor-pointer shrink-0 ml-0.5"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* On inner pages, show the solid BHS Notice Ticker right under the sticky header.
          (On the Homepage, the ticker sits cleanly right beneath the full-bleed Hero.) */}
      {!isHome && <NoticeTickerBar notices={tickerNotices} />}

      {/* =====================================================================
          PUBLIC QUICK SEARCH MODAL (Ctrl+K / Cmd+K)
         ===================================================================== */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={pick('দ্রুত অনুসন্ধান', 'Quick search')}
              className="w-full max-w-xl bg-surface text-foreground border border-border rounded-[var(--radius)] shadow-2xl overflow-hidden"
            >
              {/* Search Input Row */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={pick(
                    'নোটিশ, শিক্ষক, শ্রেণি, বিষয় বা ফলাফল খুঁজুন...',
                    'Search notices, teachers, classes, subjects or results...'
                  )}
                  className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {pick('মুছুন', 'Clear')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label={pick('বন্ধ করুন', 'Close')}
                  className="h-7 w-7 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-surface-muted cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Results Body */}
              <div className="max-h-[68vh] overflow-y-auto p-3 space-y-4">
                {!hasAnySearchResult ? (
                  <div className="py-10 text-center space-y-1">
                    <p className="text-base font-medium text-foreground">
                      {pick('কোনো তথ্য পাওয়া যায়নি', 'No matching results found')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {pick(
                        'অন্য কোনো শব্দ লিখে চেষ্টা করুন (যেমন: ফলাফল, ভর্তি, রুটিন, নোটিশ)',
                        'Try another keyword such as results, admission, routine, or notice.'
                      )}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Quick Shortcuts */}
                    {searchResults.shortcuts.length > 0 && (
                      <div className="space-y-1">
                        <p className="px-2 text-xs font-semibold text-muted-foreground">
                          {searchQuery
                            ? pick('দ্রুত লিংক', 'Quick Links')
                            : pick('জনপ্রিয় সেবাসমূহ', 'Popular Shortcuts')}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {searchResults.shortcuts.map((item) => {
                            const Icon = item.icon;
                            return (
                              <button
                                key={item.to}
                                type="button"
                                onClick={() => navigateFromSearch(item.to)}
                                className="flex items-center gap-2.5 p-2 rounded-[var(--radius)] text-left hover:bg-surface-muted transition-colors cursor-pointer group"
                              >
                                <span className="h-8 w-8 rounded-lg bg-surface-muted text-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center shrink-0 transition-colors">
                                  <Icon className="w-4 h-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-semibold text-foreground group-hover:text-primary truncate">
                                    {locale === 'bn' ? item.labelBn : item.labelEn}
                                  </span>
                                  <span className="block text-xs text-muted-foreground truncate">
                                    {locale === 'bn' ? item.descBn : item.descEn}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Matching Notices */}
                    {searchResults.notices.length > 0 && (
                      <div className="space-y-1">
                        <p className="px-2 text-xs font-semibold text-muted-foreground">
                          {searchQuery
                            ? pick('বিজ্ঞপ্তি ও নোটিশ', 'Matching Notices')
                            : pick('সর্বশেষ বিজ্ঞপ্তি', 'Recent Notices')}
                        </p>
                        <div className="space-y-0.5">
                          {searchResults.notices.map((notice) => (
                            <button
                              key={notice.id}
                              type="button"
                              onClick={() => navigateFromSearch(`/notices/${notice.id}`)}
                              className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-[var(--radius)] text-left hover:bg-surface-muted transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Megaphone className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span className="text-sm font-medium text-foreground group-hover:text-primary truncate">
                                  {notice.title}
                                </span>
                                {notice.isUrgent && (
                                  <span className="px-2 py-0.5 rounded bg-[#C81E24] text-white text-xs font-semibold leading-none shrink-0">
                                    {pick('জরুরি', 'Urgent')}
                                  </span>
                                )}
                              </div>
                              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Staff */}
                    {searchResults.staff.length > 0 && (
                      <div className="space-y-1">
                        <p className="px-2 text-xs font-semibold text-muted-foreground">
                          {pick('শিক্ষকমণ্ডলী ও কর্মচারী', 'Teachers & Staff')}
                        </p>
                        <div className="space-y-0.5">
                          {searchResults.staff.map((person) => (
                            <button
                              key={person.id}
                              type="button"
                              onClick={() => navigateFromSearch('/about/teachers')}
                              className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-[var(--radius)] text-left hover:bg-surface-muted transition-colors cursor-pointer group"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground group-hover:text-primary truncate">
                                  {person.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {person.designation}
                                </p>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Classes & Subjects */}
                    {searchResults.academics.length > 0 && (
                      <div className="space-y-1">
                        <p className="px-2 text-xs font-semibold text-muted-foreground">
                          {pick('শ্রেণি ও পাঠ্যবিষয়', 'Classes & Subjects')}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {searchResults.academics.map((entry) => (
                            <button
                              key={entry.id}
                              type="button"
                              onClick={() => navigateFromSearch(entry.to)}
                              className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-[var(--radius)] text-left hover:bg-surface-muted transition-colors cursor-pointer group"
                            >
                              <span className="min-w-0">
                                <span className="block text-sm font-medium text-foreground group-hover:text-primary truncate">
                                  {entry.label}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  {entry.meta}
                                </span>
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Search Footer Hint */}
              <div className="px-4 py-2.5 border-t border-border bg-surface-muted/50 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {pick('ভোজেশ্বর উচ্চ বিদ্যালয় · দ্রুত নেভিগেশন', 'Bhojeshwar High School · Quick Navigation')}
                </span>
                <span className="hidden sm:inline font-mono text-xs">ESC</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          UPGRADED ACCORDION MOBILE DRAWER
         ===================================================================== */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 lg:hidden bg-black/55 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-[320px] max-w-[88vw] h-full bg-surface text-foreground border-r border-border flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Brand Header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-border shrink-0">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 min-w-0"
                >
                  <SchoolEmblem size={34} />
                  <div className="min-w-0 leading-tight">
                    <span className="block text-base font-bold text-primary truncate">
                      {pick('ভোজেশ্বর উচ্চ বিদ্যালয়', 'Bhojeshwar High School')}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      BHS · {pick('স্থাপিত ১৯৭৮', 'Est. 1978')}
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label={pick('মেনু বন্ধ করুন', 'Close menu')}
                  className="p-1.5 rounded-[var(--radius)] hover:bg-surface-muted cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Drawer Content */}
              <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                {/* Quick Search Trigger inside Drawer */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setSearchOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-muted-foreground bg-surface-muted/75 border border-border rounded-[var(--radius)] hover:text-foreground transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {pick('নোটিশ, ফলাফল বা শিক্ষক খুঁজুন...', 'Search notices, results, teachers...')}
                  </span>
                </button>

                {/* Primary Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/results" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Award className="w-3.5 h-3.5" />
                      {t('nav.results')}
                    </Button>
                  </Link>
                  <Link href="/admission/apply" onClick={() => setMobileOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">
                      {pick('ভর্তি আবেদন', 'Apply Now')}
                    </Button>
                  </Link>
                </div>

                {/* Collapsible Accordion Navigation */}
                <nav className="divide-y divide-border/70 border-t border-b border-border/70">
                  {PUBLIC_NAV.map((group) => {
                    const groupLabel = locale === 'bn' ? group.labelBn : group.labelEn;
                    const groupActive = isGroupActive(group, pathname);

                    if (!group.children) {
                      return (
                        <Link
                          key={group.id}
                          href={group.to!}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'flex items-center justify-between py-3 text-sm font-semibold transition-colors',
                            groupActive
                              ? 'text-primary'
                              : 'text-foreground hover:text-primary'
                          )}
                        >
                          <span>{groupLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                        </Link>
                      );
                    }

                    const expanded = mobileExpandedGroup === group.id;
                    return (
                      <div key={group.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setMobileExpandedGroup(expanded ? null : group.id)
                          }
                          aria-expanded={expanded}
                          className={cn(
                            'w-full flex items-center justify-between py-3 text-sm font-semibold transition-colors cursor-pointer',
                            groupActive || expanded
                              ? 'text-primary'
                              : 'text-foreground hover:text-primary'
                          )}
                        >
                          <span>{groupLabel}</span>
                          <ChevronDown
                            className={cn(
                              'w-4 h-4 opacity-70 transition-transform duration-200',
                              expanded && 'rotate-180 opacity-100'
                            )}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="pb-3 pl-1 space-y-0.5">
                                {group.children.map((sub) => {
                                  const SubIcon = sub.icon;
                                  const subActive = pathname === sub.to;
                                  return (
                                    <Link
                                      key={sub.to}
                                      href={sub.to}
                                      onClick={() => setMobileOpen(false)}
                                      className={cn(
                                        'flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius)] text-sm transition-colors',
                                        subActive
                                          ? 'bg-primary/10 text-primary font-semibold'
                                          : 'text-foreground/85 hover:bg-surface-muted hover:text-primary'
                                      )}
                                    >
                                      <SubIcon className="w-4 h-4 shrink-0 opacity-80" />
                                      <span>{locale === 'bn' ? sub.labelBn : sub.labelEn}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Footer Utility Bar */}
              <div className="p-4 border-t border-border bg-surface-muted/40 space-y-2.5 shrink-0">
                <Link href={portalUrl} onClick={() => setMobileOpen(false)} className="block">
                  <Button variant="secondary" className="w-full">
                    <LogIn className="w-4 h-4" />
                    {auth.isAuthenticated ? t('nav.dashboard') : t('nav.portal')}
                  </Button>
                </Link>
                <button
                    type="button"
                    onClick={() => dispatch(toggleTheme())}
                    className="h-9 w-full px-2.5 inline-flex items-center justify-center gap-1.5 text-sm font-medium border border-border bg-surface rounded-[var(--radius)] text-foreground hover:bg-surface-muted cursor-pointer"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="w-3.5 h-3.5" />
                        <span>{pick('লাইট মোড', 'Light')}</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-3.5 h-3.5" />
                        <span>{pick('ডার্ক মোড', 'Dark')}</span>
                      </>
                    )}
                  </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Institutional Footer */}
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
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>
              © {locale === 'bn' ? '২০২৬' : '2026'} {school?.name ?? t('school.name')}।{' '}
              {pick('সর্বস্বত্ব সংরক্ষিত।', 'All rights reserved.')}
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
    </div>
  );
}
