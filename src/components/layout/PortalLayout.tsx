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
  MoreHorizontal,
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
  badge?: string | number;
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
    labelEn: 'OVERVIEW',
    items: [
      { to: '/admin', labelBn: 'ড্যাশবোর্ড', labelEn: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    id: 'people',
    labelBn: 'শিক্ষার্থী ও শিক্ষক',
    labelEn: 'PEOPLE',
    items: [
      {
        to: '/admin/students',
        labelBn: 'শিক্ষার্থী তালিকা',
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
      {
        to: '/admin/parents',
        labelBn: 'অভিভাবক',
        labelEn: 'Parents & Guardians',
        icon: UsersRound,
        children: [
          { to: '/admin/parents', labelBn: 'অভিভাবক তালিকা', labelEn: 'Directory' },
          { to: '/admin/parents/coverage', labelBn: 'প্রাথমিক ও SMS', labelEn: 'Primary & SMS' },
        ],
      },
      {
        to: '/admin/staff',
        labelBn: 'শিক্ষক ও কর্মচারী',
        labelEn: 'Staff & Teachers',
        icon: Users,
        children: [
          { to: '/admin/staff', labelBn: 'সকল স্টাফ', labelEn: 'All staff' },
          { to: '/admin/staff/teachers', labelBn: 'শিক্ষকমণ্ডলী', labelEn: 'Teachers' },
          { to: '/admin/staff/employees', labelBn: 'কর্মকর্তা ও কর্মচারী', labelEn: 'Employees' },
          { to: '/admin/staff/departments', labelBn: 'বিভাগসমূহ', labelEn: 'Departments' },
          { to: '/admin/staff/structures', labelBn: 'অনুমোদিত পদ', labelEn: 'Sanctioned posts' },
        ],
      },
    ],
  },
  {
    id: 'academics',
    labelBn: 'একাডেমিক ও পরীক্ষা',
    labelEn: 'ACADEMICS',
    items: [
      {
        to: '/admin/academic',
        labelBn: 'একাডেমিক ও রুটিন',
        labelEn: 'Academics & Routine',
        icon: Calendar,
        children: [
          { to: '/admin/academic/years', labelBn: 'শিক্ষাবর্ষ', labelEn: 'Academic years' },
          { to: '/admin/academic/classes', labelBn: 'শ্রেণি, শাখা ও বিভাগ', labelEn: 'Classes & sections' },
          { to: '/admin/academic/class-subjects', labelBn: 'বিষয় ও পাঠ্যবই', labelEn: 'Subjects & books' },
          { to: '/admin/academic/teacher-assignments', labelBn: 'শিক্ষক বণ্টন', labelEn: 'Teacher allocation' },
          { to: '/admin/academic/class-routines', labelBn: 'ক্লাস রুটিন', labelEn: 'Class timetable' },
          { to: '/admin/academic/documents', labelBn: 'সিলেবাস ও নীতিমালা', labelEn: 'Syllabus & policies' },
          { to: '/admin/academic/events', labelBn: 'একাডেমিক ক্যালেন্ডার', labelEn: 'Calendar' },
        ],
      },
      {
        to: '/admin/attendance',
        labelBn: 'হাজিরা ও SMS',
        labelEn: 'Attendance & SMS',
        icon: ClipboardCheck,
        children: [
          { to: '/admin/attendance/daily', labelBn: 'দৈনিক হাজিরা', labelEn: 'Daily register' },
          { to: '/admin/attendance/gate', labelBn: 'RFID গেট মনিটর', labelEn: 'RFID gate monitor' },
          { to: '/admin/attendance/reports', labelBn: 'মাসিক রিপোর্ট', labelEn: 'Monthly report' },
          { to: '/admin/attendance/sms-logs', labelBn: 'এসএমএস লগ', labelEn: 'SMS logs' },
          { to: '/admin/attendance/settings', labelBn: 'পদ্ধতি ও নিয়ম', labelEn: 'Method & rules' },
        ],
      },
      {
        to: '/admin/examinations',
        labelBn: 'পরীক্ষা ও সূচি',
        labelEn: 'Examinations',
        icon: FileSpreadsheet,
        children: [
          { to: '/admin/examinations', labelBn: 'পরীক্ষা ও বিষয়', labelEn: 'Exams & Subjects' },
          { to: '/admin/examinations/routines', labelBn: 'পরীক্ষার রুটিন', labelEn: 'Exam Routines' },
          { to: '/admin/examinations/admit-cards', labelBn: 'প্রবেশপত্র (Admit)', labelEn: 'Admit Cards' },
          { to: '/admin/examinations/seat-plan', labelBn: 'আসন ও হল হাজিরা', labelEn: 'Seat Plan & Hall' },
          { to: '/admin/examinations/marks-entry', labelBn: 'নম্বর এন্ট্রি ও ইম্পোর্ট', labelEn: 'Marks Entry' },
          { to: '/admin/examinations/grading-scales', labelBn: 'গ্রেডিং স্কেল ও নীতি', labelEn: 'Grading Scales' },
        ],
      },
      {
        to: '/admin/results',
        labelBn: 'ফলাফল ও মার্কশিট',
        labelEn: 'Results & Marksheets',
        icon: FileBarChart2,
        children: [
          { to: '/admin/results/publication', labelBn: 'প্রক্রিয়াকরণ ও প্রকাশ', labelEn: 'Process & Publish' },
          { to: '/admin/results/merit-list', labelBn: 'মেধাতালিকা ও মার্কশিট', labelEn: 'Merit & Marksheets' },
          { to: '/admin/results/consolidated', labelBn: 'সমন্বিত ফলাফল', labelEn: 'Consolidated' },
        ],
      },
    ],
  },
  {
    id: 'engagement',
    labelBn: 'ক্যাম্পাস ও রিসোর্স',
    labelEn: 'CAMPUS',
    items: [
      { to: '/admin/library', labelBn: 'গ্রন্থাগার', labelEn: 'Library', icon: BookOpen },
      { to: '/admin/digital-education/classrooms', labelBn: 'ডিজিটাল শিক্ষা', labelEn: 'Digital Education', icon: MonitorPlay },
    ],
  },
  {
    id: 'communication',
    labelBn: 'যোগাযোগ ও ওয়েবসাইট',
    labelEn: 'COMMUNICATION',
    items: [
      { to: '/admin/notices', labelBn: 'নোটিশ ও ইভেন্ট', labelEn: 'Notices & Circulars', icon: MessageSquare, badge: '8' },
      { to: '/admin/website/home', labelBn: 'ওয়েবসাইট CMS', labelEn: 'Website CMS', icon: Globe },
    ],
  },
  {
    id: 'system',
    labelBn: 'প্রশাসন ও সিস্টেম',
    labelEn: 'SYSTEM',
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
const STAFF_RESERVED = new Set(['teachers', 'employees', 'departments', 'structures']);
const EXAM_RESERVED = new Set(['routines', 'admit-cards', 'seat-plan', 'marks-entry', 'grading-scales', 'consolidated', 'results']);

function studentChildActive(pathname: string, to: string) {
  if (to === '/admin/students') {
    if (pathname === '/admin/students') return true;
    if (!pathname.startsWith('/admin/students/')) return false;
    const first = pathname.slice('/admin/students/'.length).split('/')[0];
    return Boolean(first) && !STUDENT_RESERVED.has(first);
  }
  if (to === '/admin/parents') {
    if (pathname === '/admin/parents' || pathname === '/admin/parents/create') return true;
    return pathname.startsWith('/admin/parents/') && !pathname.startsWith('/admin/parents/coverage');
  }
  if (to === '/admin/staff') {
    if (pathname === '/admin/staff' || pathname === '/admin/staff/create') return true;
    if (!pathname.startsWith('/admin/staff/')) return false;
    const first = pathname.slice('/admin/staff/'.length).split('/')[0];
    return Boolean(first) && !STAFF_RESERVED.has(first);
  }
  if (to === '/admin/academic/classes') {
    return ['/admin/academic/classes', '/admin/academic/sections', '/admin/academic/groups'].includes(pathname);
  }
  if (to === '/admin/academic/class-subjects') {
    return ['/admin/academic/class-subjects', '/admin/academic/subjects', '/admin/academic/books'].includes(pathname);
  }
  if (to === '/admin/academic/teacher-assignments') {
    return ['/admin/academic/teacher-assignments', '/admin/academic/class-teachers'].includes(pathname);
  }
  if (to === '/admin/academic/documents') {
    return ['/admin/academic/documents', '/admin/academic/policies'].includes(pathname);
  }
  if (to === '/admin/examinations') {
    if (
      pathname === '/admin/examinations' ||
      pathname === '/admin/examinations/create' ||
      pathname === '/admin/examinations/subjects'
    ) {
      return true;
    }
    if (!pathname.startsWith('/admin/examinations/')) return false;
    const first = pathname.slice('/admin/examinations/'.length).split('/')[0];
    return Boolean(first) && !EXAM_RESERVED.has(first);
  }
  if (to === '/admin/results/merit-list') {
    return (
      pathname === '/admin/results/merit-list' ||
      pathname === '/admin/results/merit-lists' ||
      pathname === '/admin/results/mark-sheets' ||
      (pathname.startsWith('/admin/results/') &&
        !['/admin/results/publication', '/admin/results/consolidated'].includes(pathname))
    );
  }
  if (to === '/admin/results/publication') {
    return (
      pathname === '/admin/results' ||
      pathname === '/admin/results/publication' ||
      pathname === '/admin/examinations/results'
    );
  }
  if (to === '/admin/results/consolidated') {
    return pathname === '/admin/results/consolidated' || pathname === '/admin/examinations/consolidated';
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

  const isDashboardRoot = useMemo(() => {
    return (
      pathname === '/admin' ||
      pathname === '/teacher' ||
      pathname === '/teacher/dashboard' ||
      pathname === '/parent' ||
      pathname === '/parent/dashboard' ||
      pathname === '/student' ||
      pathname === '/student/dashboard'
    );
  }, [pathname]);

  const currentNavContext = useMemo(() => {
    if (portal === 'admin') {
      for (const group of ADMIN_NAV_GROUPS) {
        for (const item of group.items) {
          if (item.children) {
            // Check exact child match first
            for (const child of item.children) {
              if (pathname === child.to) {
                return {
                  groupLabel: locale === 'bn' ? group.labelBn : group.labelEn,
                  parentLabel: locale === 'bn' ? item.labelBn : item.labelEn,
                  parentTo: item.to,
                  pageTitle: locale === 'bn' ? child.labelBn : child.labelEn,
                };
              }
            }
            // Check child prefix match
            for (const child of item.children) {
              if (child.to !== item.to && pathname.startsWith(`${child.to}/`)) {
                return {
                  groupLabel: locale === 'bn' ? group.labelBn : group.labelEn,
                  parentLabel: locale === 'bn' ? item.labelBn : item.labelEn,
                  parentTo: item.to,
                  pageTitle: locale === 'bn' ? child.labelBn : child.labelEn,
                };
              }
            }
          }
          if (item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)) {
            return {
              groupLabel: locale === 'bn' ? group.labelBn : group.labelEn,
              parentLabel: locale === 'bn' ? item.labelBn : item.labelEn,
              parentTo: item.to,
              pageTitle: locale === 'bn' ? item.labelBn : item.labelEn,
            };
          }
        }
      }
    } else {
      const list = portal === 'teacher' ? TEACHER_NAV : portal === 'parent' ? PARENT_NAV : STUDENT_NAV;
      const match = list.find((it) => it.end ? pathname === it.to : pathname === it.to || pathname.startsWith(`${it.to}/`));
      if (match) {
        return {
          groupLabel: pick('পোর্টাল', 'Portal'),
          parentLabel: locale === 'bn' ? match.labelBn : match.labelEn,
          parentTo: match.to,
          pageTitle: locale === 'bn' ? match.labelBn : match.labelEn,
        };
      }
    }
    return null;
  }, [portal, pathname, locale, pick]);

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
    <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-3.5 scrollbar-thin relative z-10">
      {navGroups.map((group, groupIdx) => (
        <div
          key={group.id}
          className={cn(
            groupIdx > 0 && sidebarCollapsed && !closeOnClick ? 'pt-2 border-t border-white/10' : ''
          )}
        >
          {group.labelEn && (!sidebarCollapsed || closeOnClick) && (
            <p className="px-3 pt-3.5 pb-1.5 text-xs sm:text-[13px] font-bold text-white uppercase tracking-wider">
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
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-base font-medium transition-all duration-150',
                      selfActive
                        ? 'bg-white text-[#1C6440] font-bold shadow-xs'
                        : 'text-white/95 hover:text-white hover:bg-white/10',
                      sidebarCollapsed && !closeOnClick ? 'justify-center px-2' : ''
                    )}
                    title={sidebarCollapsed ? (locale === 'bn' ? item.labelBn : item.labelEn) : undefined}
                  >
                    <Icon className={cn('w-4.5 h-4.5 shrink-0', selfActive ? 'text-[#1C6440]' : 'text-white/90')} />
                    {(!sidebarCollapsed || closeOnClick) && (
                      <span className="truncate flex-1">{locale === 'bn' ? item.labelBn : item.labelEn}</span>
                    )}
                    {item.badge && (!sidebarCollapsed || closeOnClick) && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#DF6153] text-white leading-none shrink-0">
                        {item.badge}
                      </span>
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
                      'flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl text-base font-medium transition-all duration-150 cursor-pointer',
                      selfActive
                        ? 'bg-white/15 text-white font-semibold'
                        : 'text-white/95 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0 text-white/90" />
                    <span className="truncate flex-1 text-left">{locale === 'bn' ? item.labelBn : item.labelEn}</span>
                    {item.badge && (
                      <span className="mr-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-[#DF6153] text-white leading-none shrink-0">
                        {item.badge}
                      </span>
                    )}
                    <ChevronDown className={cn('w-3.5 h-3.5 shrink-0 transition-transform opacity-75', open && 'rotate-180')} />
                  </button>
                  {open && (
                    <div className="mt-1 ml-3 pl-2.5 border-l border-white/20 space-y-0.5">
                      {item.children!.map((child) => {
                        const childActive = studentChildActive(pathname, child.to);
                        return (
                          <Link
                            key={child.to}
                            href={child.to}
                            onClick={() => closeOnClick && setMobileOpen(false)}
                            className={cn(
                              'block px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
                              childActive
                                ? 'bg-white text-[#1C6440] font-bold shadow-xs'
                                : 'text-white/85 hover:text-white hover:bg-white/10'
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
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex bg-background text-foreground">
      {/* Desktop Floating Green Capsule Sidebar (Fixed position in layout) */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-gradient-to-b from-[#185536] via-[#1C6440] to-[#14492E] text-white shrink-0 my-3 ml-3 lg:ml-4 rounded-3xl shadow-xl border border-white/10 h-[calc(100vh-1.5rem)] no-print z-40 transition-all duration-200 overflow-hidden relative',
          sidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Decorative Translucent Bubble Overlays matching reference image */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Top-Right Glowing Bubble Orb */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gradient-to-br from-[#2D8B59]/40 via-[#1C6440]/20 to-transparent blur-2xl" />
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full border border-white/[0.12] bg-white/[0.04] backdrop-blur-[1px]" />
          <div className="absolute top-2 -right-2 w-28 h-28 rounded-full border border-white/[0.08]" />

          {/* Middle-Left Organic Bubble Contour */}
          <div className="absolute top-[35%] -left-20 w-60 h-60 rounded-full bg-gradient-to-tr from-[#247A4D]/35 via-[#1C6440]/15 to-transparent blur-xl" />
          <div className="absolute top-[38%] -left-14 w-48 h-48 rounded-full border border-white/[0.08] bg-white/[0.03]" />
          <div className="absolute top-[42%] -left-4 w-32 h-32 rounded-full border border-white/[0.06]" />

          {/* Bottom-Right Soft Bubble Orb */}
          <div className="absolute bottom-28 -right-16 w-56 h-56 rounded-full bg-gradient-to-tl from-[#34A870]/30 via-[#1C6440]/15 to-transparent blur-2xl" />
          <div className="absolute bottom-32 -right-10 w-44 h-44 rounded-full border border-white/[0.12] bg-white/[0.04]" />

          {/* Subtle SVG Concentric Watermark Bubble Rings */}
          <svg
            className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
            viewBox="0 0 256 800"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="220" cy="110" r="140" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="220" cy="110" r="95" stroke="white" strokeWidth="1.2" />
            <circle cx="20" cy="420" r="120" stroke="white" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="20" cy="420" r="80" stroke="white" strokeWidth="1" />
            <circle cx="210" cy="650" r="130" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
        </div>

        {/* Top Header Inside Sidebar */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => dispatch(toggleSidebar())}
              aria-label="Toggle sidebar"
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition shrink-0"
            >
              <ChevronLeft className={cn('w-4 h-4 transition-transform', sidebarCollapsed && 'rotate-180')} />
            </button>
            {!sidebarCollapsed && (
              <Link href="/" className="min-w-0 flex items-center gap-2">
                <SchoolEmblem size={28} />
                <div className="min-w-0 leading-tight">
                  <span className="text-sm font-bold text-white tracking-tight truncate block">
                    {pick('ভোজেশ্বর উচ্চ বিদ্যালয়', 'Bhojeshwar High School')}
                  </span>
                  <span className="text-xs text-white/80 truncate block">
                    EIIN: 113587 · Admin
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {renderSidebarLinks(false)}

        {/* Mini Impact Widget Card */}
        {!sidebarCollapsed && (
          <div className="mx-3 mb-2.5 p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs text-white shrink-0 relative z-10">
            <div className="flex items-center gap-1.5 text-xs text-white/90 font-medium mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EBAF3E]" />
              {pick('সাপ্তাহিক সারসংক্ষেপ', 'Weekly Overview')}
            </div>
            <p className="font-bold text-base leading-snug">
              {pick('একাডেমিক অগ্রগতি ও\nদৈনিক উপস্থিতি ৯৪%', 'Academic Attendance &\nActive Session')}
            </p>
            <Link href="/admin/reports" className="block mt-2">
              <button
                type="button"
                className="w-full bg-white text-[#1C6440] hover:bg-white/90 text-sm font-semibold py-2 px-3 rounded-xl shadow-xs transition cursor-pointer"
              >
                {pick('রিপোর্ট দেখুন', 'View report')}
              </button>
            </Link>
          </div>
        )}

        {/* User Profile Pill at Bottom */}
        <div className="p-2.5 mx-2 mb-2 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#DCEFE0] text-[#1C6440] font-bold text-sm flex items-center justify-center shrink-0">
              {auth.user?.name ? auth.user.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 leading-tight">
                <p className="text-base font-bold text-white truncate">
                  {auth.user?.name ?? 'Admin'}
                </p>
                <p className="text-sm text-white/85 truncate">
                  {auth.user?.role ?? 'SUPER_ADMIN'}
                </p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => {
                dispatch(logout());
                router.push('/login');
              }}
              title={pick('লগ আউট', 'Sign Out')}
              className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-xs" onClick={() => setMobileOpen(false)}>
          <div
            className="w-72 max-w-[85vw] h-full bg-gradient-to-b from-[#185536] via-[#1C6440] to-[#14492E] text-white border-r border-white/10 flex flex-col relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative Translucent Bubble Overlays for Mobile Drawer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-[#2D8B59]/40 via-[#1C6440]/20 to-transparent blur-2xl" />
              <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full border border-white/[0.12] bg-white/[0.04]" />
              <div className="absolute top-[40%] -left-16 w-52 h-52 rounded-full bg-gradient-to-tr from-[#247A4D]/35 via-[#1C6440]/15 to-transparent blur-xl" />
              <div className="absolute top-[42%] -left-10 w-40 h-40 rounded-full border border-white/[0.08]" />
              <div className="absolute bottom-16 -right-12 w-44 h-44 rounded-full bg-gradient-to-tl from-[#34A870]/30 to-transparent blur-2xl" />
            </div>

            <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 relative z-10">
              <div className="flex items-center gap-2">
                <SchoolEmblem size={28} />
                <span className="text-sm font-bold text-white truncate">
                  {pick('ভোজেশ্বর উচ্চ বিদ্যালয়', 'Bhojeshwar High School')}
                </span>
              </div>
              <button type="button" onClick={() => setMobileOpen(false)} className="p-1.5 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderSidebarLinks(true)}
            <div className="p-3 border-t border-white/10 relative z-10">
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-white/10 text-white border-white/20 hover:bg-white/20"
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

      {/* Main Content Area (Independent scroll container) */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-y-auto">
        {/* Top Bar with Dynamic Breadcrumb & Context Header */}
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/70 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden p-2 rounded-xl border border-border bg-surface hover:bg-surface-muted shadow-xs shrink-0"
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
                  {pick(`শুভ সকাল, ${auth.user?.name ?? 'অ্যাডমিন'} 👋`, `Good morning, ${auth.user?.name ?? 'Admin'} 👋`)}
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
              onClick={() => dispatch(setCommandPaletteOpen(true))}
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
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
                className="relative h-10 w-10 inline-flex items-center justify-center bg-surface border border-border/80 rounded-full hover:bg-surface-muted shadow-xs text-foreground cursor-pointer transition"
              >
                <Bell className="w-4 h-4 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-[#DF6153] text-white text-[10px] font-bold flex items-center justify-center tabular-nums leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
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

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              aria-label={pick('থিম পরিবর্তন করুন', 'Toggle theme')}
              className="h-10 w-10 inline-flex items-center justify-center bg-surface border border-border/80 rounded-full hover:bg-surface-muted shadow-xs text-foreground cursor-pointer transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile Capsule */}
            <div className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-surface border border-border/80 hover:bg-surface-muted transition shadow-xs cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-[#1C6440] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                {auth.user?.name ? auth.user.name.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-semibold text-foreground leading-tight truncate max-w-[110px]">
                  {auth.user?.name ?? 'Admin'}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight uppercase font-medium">
                  {auth.role ?? 'Super Admin'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 px-4 sm:px-6 pt-4 sm:pt-5 pb-6 w-full space-y-6">
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
