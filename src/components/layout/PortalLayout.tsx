'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell,
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileBarChart2,
  FileSpreadsheet,
  Globe,
  GraduationCap,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  MonitorPlay,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
  dismissSessionExpired,
  loginWithDemoRole,
  logout,
  type AppRole,
} from '@/src/store/slices/authSlice';
import { setCommandPaletteOpen, toggleSidebar, toggleTheme } from '@/src/store/slices/uiSlice';
import { useGetBootstrapQuery, useMarkNotificationReadMutation } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { SchoolEmblem } from '@/src/components/shared/Feedback';
import { Button, Modal } from '@/src/components/ui/primitives';
import { cn } from '@/src/lib/utils/cn';
import { formatDateShort } from '@/src/lib/formatters';

export type PortalKind = 'admin' | 'teacher' | 'parent' | 'student';

interface NavChild {
  to: string;
  labelBn: string;
  labelEn: string;
}

interface NavEntry {
  to: string;
  labelBn: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  children?: NavChild[];
}

interface NavGroup {
  id: string;
  labelBn: string;
  labelEn: string;
  items: NavEntry[];
}

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    labelBn: 'ওভারভিউ',
    labelEn: 'Overview',
    items: [
      { to: '/admin', labelBn: 'ড্যাশবোর্ড', labelEn: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    id: 'operations',
    labelBn: 'একাডেমিক ও অপারেশন',
    labelEn: 'School Operations',
    items: [
      {
        to: '/admin/students',
        labelBn: 'শিক্ষার্থী',
        labelEn: 'Students',
        icon: GraduationCap,
        children: [
          { to: '/admin/students', labelBn: 'তালিকা', labelEn: 'Directory' },
          { to: '/admin/students/create', labelBn: 'নতুন ভর্তি', labelEn: 'New admission' },
          { to: '/admin/students/admissions', labelBn: 'অনলাইন আবেদন', labelEn: 'Applications' },
          { to: '/admin/students/import', labelBn: 'CSV আমদানি', labelEn: 'CSV import' },
          { to: '/admin/students/enrollments', labelBn: 'এনরোলমেন্ট', labelEn: 'Enrollments' },
          { to: '/admin/students/promotions', labelBn: 'প্রমোশন', labelEn: 'Promotion' },
          { to: '/admin/students/transfers', labelBn: 'ছাড়পত্র', labelEn: 'Transfer certificates' },
          { to: '/admin/students/testimonials', labelBn: 'প্রত্যয়নপত্র', labelEn: 'Testimonials' },
          { to: '/admin/students/rfid-cards', labelBn: 'পরিচয়পত্র', labelEn: 'ID cards' },
        ],
      },
      { to: '/admin/parents', labelBn: 'অভিভাবক', labelEn: 'Parents', icon: UsersRound },
      { to: '/admin/staff', labelBn: 'শিক্ষক ও কর্মচারী', labelEn: 'Staff & Teachers', icon: UserCheck },
      { to: '/admin/academic/years', labelBn: 'একাডেমিক ও রুটিন', labelEn: 'Academics & Syllabus', icon: Calendar },
      { to: '/admin/attendance/daily', labelBn: 'হাজিরা ও SMS', labelEn: 'Attendance & SMS', icon: ClipboardCheck },
      { to: '/admin/examinations', labelBn: 'পরীক্ষা ও নম্বর', labelEn: 'Examinations', icon: FileSpreadsheet },
      { to: '/admin/results', labelBn: 'ফলাফল ও মার্কশিট', labelEn: 'Results & Marksheets', icon: FileBarChart2 },
      { to: '/admin/library', labelBn: 'গ্রন্থাগার', labelEn: 'Library', icon: BookOpen },
      { to: '/admin/digital-education/classrooms', labelBn: 'ডিজিটাল শিক্ষা', labelEn: 'Digital Education', icon: MonitorPlay },
    ],
  },
  {
    id: 'website-cms',
    labelBn: 'ওয়েবসাইট CMS',
    labelEn: 'Website CMS',
    items: [
      { to: '/admin/website/home', labelBn: 'হোম ও ব্র্যান্ডিং', labelEn: 'Home & Branding', icon: Globe },
      { to: '/admin/website/about', labelBn: 'পরিচিতি ও নেতৃত্ব', labelEn: 'About & Leadership', icon: Building2 },
      { to: '/admin/notices', labelBn: 'নোটিশ, সংবাদ ও ইভেন্ট', labelEn: 'Notices, News & Events', icon: MessageSquare },
      { to: '/admin/website/media', labelBn: 'মিডিয়া, ভর্তি ও প্রকাশনা', labelEn: 'Media, Admission & Press', icon: ImageIcon },
    ],
  },
  {
    id: 'system',
    labelBn: 'প্রশাসন ও সিস্টেম',
    labelEn: 'System & Access',
    items: [
      { to: '/admin/users', labelBn: 'ব্যবহারকারী ও রোল', labelEn: 'Users & Roles', icon: ShieldCheck },
      { to: '/admin/reports', labelBn: 'রিপোর্ট ও অডিট', labelEn: 'Reports & Audit', icon: FileBarChart2 },
      { to: '/admin/settings', labelBn: 'সেটিংস ও প্রোফাইল', labelEn: 'Settings & Profile', icon: Settings },
    ],
  },
];

const TEACHER_NAV: NavEntry[] = [
  { to: '/teacher/dashboard', labelBn: 'ড্যাশবোর্ড', labelEn: 'Dashboard', icon: LayoutDashboard },
  { to: '/teacher/classes', labelBn: 'নির্ধারিত শ্রেণি', labelEn: 'My Classes', icon: Users },
  { to: '/teacher/students', labelBn: 'শিক্ষার্থী তালিকা', labelEn: 'Students', icon: GraduationCap },
  { to: '/teacher/attendance', labelBn: 'হাজিরা গ্রহণ', labelEn: 'Attendance', icon: ClipboardCheck },
  { to: '/teacher/routines', labelBn: 'ক্লাস রুটিন', labelEn: 'Class Routine', icon: Calendar },
  { to: '/teacher/examinations', labelBn: 'পরীক্ষা ও রুটিন', labelEn: 'Examinations', icon: FileSpreadsheet },
  { to: '/teacher/marks-entry', labelBn: 'নম্বর এন্ট্রি', labelEn: 'Marks Entry', icon: FileBarChart2 },
  { to: '/teacher/results', labelBn: 'ফলাফল', labelEn: 'Results', icon: FileBarChart2 },
  { to: '/teacher/academic-resources', labelBn: 'শিক্ষা রিসোর্স', labelEn: 'Resources', icon: MonitorPlay },
  { to: '/teacher/notices', labelBn: 'নোটিশ', labelEn: 'Notices', icon: MessageSquare },
  { to: '/teacher/notifications', labelBn: 'নোটিফিকেশন', labelEn: 'Notifications', icon: Bell },
  { to: '/teacher/profile', labelBn: 'আমার প্রোফাইল', labelEn: 'Profile', icon: Settings },
];

const PARENT_NAV: NavEntry[] = [
  { to: '/parent/dashboard', labelBn: 'ড্যাশবোর্ড', labelEn: 'Dashboard', icon: LayoutDashboard },
  { to: '/parent/children', labelBn: 'আমার সন্তান', labelEn: 'My Children', icon: UsersRound },
  { to: '/parent/attendance', labelBn: 'হাজিরা ক্যালেন্ডার', labelEn: 'Attendance', icon: ClipboardCheck },
  { to: '/parent/results', labelBn: 'ফলাফল ও মার্কশিট', labelEn: 'Results', icon: FileBarChart2 },
  { to: '/parent/routines', labelBn: 'ক্লাস রুটিন', labelEn: 'Routines', icon: Calendar },
  { to: '/parent/examinations', labelBn: 'পরীক্ষার সূচি', labelEn: 'Examinations', icon: FileSpreadsheet },
  { to: '/parent/sms-history', labelBn: 'SMS ইতিহাস', labelEn: 'SMS History', icon: MessageSquare },
  { to: '/parent/academic-resources', labelBn: 'শিক্ষা রিসোর্স', labelEn: 'Resources', icon: MonitorPlay },
  { to: '/parent/notices', labelBn: 'নোটিশ', labelEn: 'Notices', icon: Bell },
  { to: '/parent/profile', labelBn: 'প্রোফাইল', labelEn: 'Profile', icon: Settings },
];

const STUDENT_NAV: NavEntry[] = [
  { to: '/student/dashboard', labelBn: 'ড্যাশবোর্ড', labelEn: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/academic-information', labelBn: 'একাডেমিক তথ্য', labelEn: 'Academic Info', icon: GraduationCap },
  { to: '/student/routine', labelBn: 'ক্লাস রুটিন', labelEn: 'Routine', icon: Calendar },
  { to: '/student/attendance', labelBn: 'আমার হাজিরা', labelEn: 'Attendance', icon: ClipboardCheck },
  { to: '/student/examinations', labelBn: 'পরীক্ষা', labelEn: 'Examinations', icon: FileSpreadsheet },
  { to: '/student/results', labelBn: 'আমার ফলাফল', labelEn: 'My Results', icon: FileBarChart2 },
  { to: '/student/academic-resources', labelBn: 'শিক্ষা রিসোর্স', labelEn: 'Resources', icon: MonitorPlay },
  { to: '/student/library', labelBn: 'গ্রন্থাগার', labelEn: 'Library', icon: BookOpen },
  { to: '/student/notices', labelBn: 'নোটিশ', labelEn: 'Notices', icon: MessageSquare },
  { to: '/student/profile', labelBn: 'প্রোফাইল', labelEn: 'Profile', icon: Settings },
];

const STUDENT_RESERVED = new Set(['create', 'admissions', 'import', 'enrollments', 'promotions', 'transfers', 'testimonials', 'rfid-cards']);

function studentChildActive(pathname: string, to: string) {
  if (to === '/admin/students') {
    if (pathname === '/admin/students') return true;
    if (!pathname.startsWith('/admin/students/')) return false;
    const first = pathname.slice('/admin/students/'.length).split('/')[0];
    return Boolean(first) && !STUDENT_RESERVED.has(first);
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function PortalLayout({ portal, children }: { portal: PortalKind; children: React.ReactNode }) {
  const { locale, pick } = useI18n();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAppSelector((s) => s.auth);
  const { sidebarCollapsed, theme, enableFutureModules, enableStudentPortal } = useAppSelector((s) => s.ui);
  const { data: db } = useGetBootstrapQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Auto-align demo role when navigating directly into a portal preview if unauthenticated
  // (Real backend integration uses route-level 401 redirect to /login)
  const expectedRoles: Record<PortalKind, AppRole[]> = {
    admin: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'],
    teacher: ['TEACHER'],
    parent: ['PARENT'],
    student: ['STUDENT'],
  };

  const navGroups = useMemo<NavGroup[]>(() => {
    if (portal === 'admin') {
      const groups = ADMIN_NAV_GROUPS.map((g) => ({ ...g, items: [...g.items] }));
      if (enableFutureModules) {
        groups[groups.length - 1].items.push({
          to: '/admin/future-modules',
          labelBn: 'ভবিষ্যৎ মডিউল (প্রিভিউ)',
          labelEn: 'Future Modules (Preview)',
          icon: Sparkles,
        });
      }
      return groups;
    }
    const items =
      portal === 'teacher'
        ? TEACHER_NAV
        : portal === 'parent'
          ? PARENT_NAV
          : STUDENT_NAV;
    return [{ id: portal, labelBn: '', labelEn: '', items }];
  }, [portal, enableFutureModules]);

  const roleNotifications = useMemo(() => {
    const list = db?.notifications ?? [];
    if (!auth.role) return list;
    return list.filter((n) => n.targetRoles.includes(auth.role!));
  }, [db?.notifications, auth.role]);

  const unreadCount = roleNotifications.filter((n) => !n.isRead).length;

  const breadcrumbs = useMemo(() => {
    const segs = (pathname ?? '').split('/').filter(Boolean);
    return segs.map((s, idx) => ({
      label: s.replace(/-/g, ' '),
      to: '/' + segs.slice(0, idx + 1).join('/'),
    }));
  }, [pathname]);

  // Student Portal Feature Flag Gate (Section 9)
  if (portal === 'student' && !enableStudentPortal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-surface border border-border rounded-[var(--radius)] p-8 text-center space-y-4">
          <div className="flex justify-center">
            <SchoolEmblem size={56} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {pick('শিক্ষার্থী পোর্টাল বর্তমানে বন্ধ রাখা হয়েছে', 'Student Portal Is Currently Disabled')}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            {pick(
              'প্রাথমিক রিলিজ পরিকল্পনা অনুযায়ী অ্যাডমিন, শিক্ষক ও অভিভাবক পোর্টাল সক্রিয় রয়েছে। শিক্ষার্থীরা কোনো লগইন ছাড়াই পাবলিক ফলাফল পৃষ্ঠা থেকে তাদের ফলাফল ও মার্কশিট দেখতে পারবেন।',
              'Per the initial release plan (VITE_ENABLE_STUDENT_PORTAL=false), Admin, Teacher, and Parent portals are active while students view results on the public result lookup page.'
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/results">
              <Button variant="primary">{pick('পাবলিক ফলাফল দেখুন', 'Go to Public Results')}</Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline">{pick('অ্যাডমিন সেটিংস থেকে চালু করুন', 'Enable in Admin Settings')}</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost">{pick('হোমপেজ', 'Home')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Auth / Role check with convenient demo switch option
  if (!auth.isAuthenticated || !auth.role || !expectedRoles[portal].includes(auth.role)) {
    const defaultRole: AppRole =
      portal === 'admin'
        ? 'SUPER_ADMIN'
        : portal === 'teacher'
          ? 'TEACHER'
          : portal === 'parent'
            ? 'PARENT'
            : 'STUDENT';
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface border border-border rounded-[var(--radius)] p-7 space-y-4 text-center">
          <div className="flex justify-center">
            <SchoolEmblem size={52} />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {pick('এই পোর্টালে প্রবেশ করতে লগইন প্রয়োজন', 'Sign In Required for This Portal')}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            {pick(
              'আপনি অনুমোদিত ভূমিকা দিয়ে সাইন ইন করে পোর্টালটি ব্যবহার করতে পারেন। ডেমো সেশন শুধুমাত্র প্রদর্শনের জন্য।',
              'Please sign in with an authorized account for this portal. Demo login is provided strictly for preview.'
            )}
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="primary"
              onClick={() => dispatch(loginWithDemoRole(defaultRole))}
            >
              {pick(`ডেমো ${defaultRole} হিসেবে প্রবেশ করুন`, `Continue as Demo ${defaultRole}`)}
            </Button>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                {pick('লগইন পৃষ্ঠায় যান', 'Go to Login Page')}
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full">
                {pick('পাবলিক ওয়েবসাইটে ফিরুন', 'Return to Public Website')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const portalLabel =
    portal === 'admin'
      ? pick('অ্যাডমিন পোর্টাল', 'Admin Portal')
      : portal === 'teacher'
        ? pick('শিক্ষক পোর্টাল', 'Teacher Portal')
        : portal === 'parent'
          ? pick('অভিভাবক পোর্টাল', 'Parent Portal')
          : pick('শিক্ষার্থী পোর্টাল', 'Student Portal');

  const renderSidebarLinks = (closeOnClick = false) => (
    <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
      {navGroups.map((group, groupIdx) => (
        <div
          key={group.id}
          className={cn(
            groupIdx > 0 && sidebarCollapsed && !closeOnClick ? 'pt-2 border-t border-border' : ''
          )}
        >
          {group.labelBn && (!sidebarCollapsed || closeOnClick) && (
            <p className="px-3 pb-1.5 text-xs font-semibold text-muted-foreground tracking-wide">
              {locale === 'bn' ? group.labelBn : group.labelEn}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const selfActive = item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
              const showChildren = Boolean(item.children?.length) && (!sidebarCollapsed || closeOnClick);
              if (!showChildren) {
                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    onClick={() => closeOnClick && setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius)] text-sm font-medium transition-colors',
                      selfActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground/80 hover:bg-surface-muted hover:text-foreground',
                      sidebarCollapsed && !closeOnClick ? 'justify-center px-2' : ''
                    )}
                    title={sidebarCollapsed ? (locale === 'bn' ? item.labelBn : item.labelEn) : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {(!sidebarCollapsed || closeOnClick) && (
                      <span className="truncate">{locale === 'bn' ? item.labelBn : item.labelEn}</span>
                    )}
                  </Link>
                );
              }
              const open = openMenus[item.to] ?? selfActive;
              return (
                <div key={item.to}>
                  <button
                    type="button"
                    onClick={() => setOpenMenus((prev) => ({ ...prev, [item.to]: !open }))}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 rounded-[var(--radius)] text-sm font-medium transition-colors cursor-pointer',
                      selfActive ? 'bg-primary/10 text-primary' : 'text-foreground/80 hover:bg-surface-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate flex-1 text-left">{locale === 'bn' ? item.labelBn : item.labelEn}</span>
                    <ChevronDown className={cn('w-4 h-4 shrink-0 transition-transform', open && 'rotate-180')} />
                  </button>
                  {open && (
                    <div className="mt-1 ml-4 pl-2 border-l border-border space-y-0.5">
                      {item.children!.map((child) => {
                        const childActive = studentChildActive(pathname, child.to);
                        return (
                          <Link
                            key={child.to}
                            href={child.to}
                            onClick={() => closeOnClick && setMobileOpen(false)}
                            className={cn(
                              'block px-2 py-1.5 rounded-md text-sm transition-colors',
                              childActive
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'text-foreground/80 hover:bg-surface-muted hover:text-foreground'
                            )}
                          >
                            {locale === 'bn' ? child.labelBn : child.labelEn}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-surface border-r border-border transition-all duration-150 shrink-0 sticky top-0 h-screen no-print',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="h-16 px-3 flex items-center justify-between border-t-2 border-t-primary border-b border-border">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <SchoolEmblem size={36} />
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-primary truncate">
                  {pick('ভোজেশ্বর উচ্চ বিদ্যালয়', 'Bhojeshwar High School')}
                </p>
                <p className="text-xs text-muted-foreground truncate">{portalLabel}</p>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => dispatch(toggleSidebar())}
            aria-label="Toggle sidebar"
            className="p-1.5 rounded-md text-muted-foreground hover:bg-surface-muted hover:text-foreground cursor-pointer"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {renderSidebarLinks(false)}

        <div className="p-3 border-t border-border space-y-1.5">
          <Link
            href="/"
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-muted rounded-[var(--radius)]',
              sidebarCollapsed ? 'justify-center px-2' : ''
            )}
          >
            <Home className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>{pick('পাবলিক ওয়েবসাইট', 'Public Website')}</span>}
          </Link>
          <button
            type="button"
            onClick={() => {
              dispatch(logout());
              router.push('/login');
            }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-[var(--radius)] cursor-pointer',
              sidebarCollapsed ? 'justify-center px-2' : ''
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>{pick('লগ আউট', 'Sign Out')}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/50" onClick={() => setMobileOpen(false)}>
          <div
            className="w-72 max-w-[85vw] h-full bg-surface border-r border-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-16 px-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <SchoolEmblem size={32} />
                <span className="text-sm font-bold text-primary">{portalLabel}</span>
              </div>
              <button type="button" onClick={() => setMobileOpen(false)} className="p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderSidebarLinks(true)}
            <div className="p-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setMobileOpen(false);
                  dispatch(logout());
                  router.push('/login');
                }}
              >
                <LogOut className="w-4 h-4" />
                {pick('লগ আউট', 'Sign Out')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-surface/95 backdrop-blur border-b border-border px-4 sm:px-6 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden p-2 rounded-md border border-border hover:bg-surface-muted"
            >
              <Menu className="w-4 h-4" />
            </button>
            <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground truncate">
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={b.to}>
                  {i > 0 && <span>/</span>}
                  <Link
                    href={b.to}
                    className={cn(
                      'capitalize hover:text-primary truncate',
                      i === breadcrumbs.length - 1 && 'text-foreground font-semibold'
                    )}
                  >
                    {b.label}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => dispatch(setCommandPaletteOpen(true))}
              className="hidden md:inline-flex items-center gap-2 h-9 px-3 text-sm text-muted-foreground border border-border rounded-[var(--radius)] hover:bg-surface-muted cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{pick('দ্রুত খুঁজুন', 'Quick Jump')}</span>
              <kbd className="font-mono text-xs border border-border rounded px-1">Ctrl+K</kbd>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
                className="relative h-9 w-9 inline-flex items-center justify-center border border-border rounded-[var(--radius)] hover:bg-surface-muted cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-destructive text-white text-xs font-bold flex items-center justify-center tabular-nums leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-[var(--radius)] shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {pick('নোটিফিকেশন', 'Notifications')}
                    </span>
                    <button
                      type="button"
                      onClick={() => markRead({})}
                      className="text-xs font-medium text-primary hover:underline cursor-pointer"
                    >
                      {pick('সব পঠিত করুন', 'Mark all read')}
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-border">
                    {roleNotifications.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">
                        {pick('কোনো নতুন নোটিফিকেশন নেই', 'No notifications')}
                      </p>
                    ) : (
                      roleNotifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            markRead({ id: n.id });
                            setNotifOpen(false);
                            if (n.link) router.push(n.link);
                          }}
                          className={cn(
                            'w-full text-left px-4 py-3 hover:bg-surface-muted transition-colors cursor-pointer',
                            !n.isRead && 'bg-primary/5'
                          )}
                        >
                          <p className="text-sm font-semibold text-foreground">
                            {locale === 'bn' ? n.titleBn : n.titleEn}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {locale === 'bn' ? n.bodyBn : n.bodyEn}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                            {formatDateShort(n.createdAt, locale)}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              aria-label={pick('থিম পরিবর্তন করুন', 'থিম')}
              className="h-9 w-9 inline-flex items-center justify-center border border-border rounded-[var(--radius)] hover:bg-surface-muted cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold text-foreground max-w-[150px] truncate">
                  {auth.user?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {auth.user?.isDemoSession ? pick('ডেমো সেশন', 'Demo Session') : auth.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 w-full">
          {children}
        </main>
      </div>

      {/* Session Expired Modal */}
      <Modal
        open={auth.sessionExpired}
        onClose={() => dispatch(dismissSessionExpired())}
        title={pick('সেশনের মেয়াদ শেষ হয়েছে', 'Session Expired')}
        maxWidth="max-w-md"
      >
        <p className="text-base text-muted-foreground">
          {pick(
            'নিরাপত্তার কারণে আপনার সেশনের মেয়াদ শেষ হয়েছে। পুনরায় লগইন করুন।',
            'Your session has expired for security reasons. Please sign in again.'
          )}
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <Button
            variant="primary"
            onClick={() => {
              dispatch(logout());
              router.push('/login');
            }}
          >
            {pick('পুনরায় লগইন', 'Sign In Again')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
