import React from 'react';
import {
  Banknote,
  Bell,
  BookOpen,
  Calculator,
  Calendar,
  ClipboardCheck,
  FileBarChart2,
  FileSpreadsheet,
  Globe,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  MonitorPlay,
  Receipt,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react';

export type PortalKind = 'admin' | 'accountant' | 'teacher' | 'parent' | 'student';

export interface NavChild {
  to: string;
  labelBn: string;
  labelEn: string;
}

export interface NavEntry {
  to: string;
  labelBn: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  children?: NavChild[];
  badge?: string | number;
}

export interface NavGroup {
  id: string;
  labelBn: string;
  labelEn: string;
  items: NavEntry[];
}

export const ADMIN_NAV_GROUPS: NavGroup[] = [
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
          { to: '/admin/academic/classes', labelBn: 'শ্রেণি ও শাখা', labelEn: 'Classes & sections' },
          { to: '/admin/academic/class-subjects', labelBn: 'বিষয় ও পাঠ্যবই', labelEn: 'Subjects & books' },
          { to: '/admin/academic/teacher-assignments', labelBn: 'শিক্ষক বণ্টন', labelEn: 'Teacher allocation' },
          { to: '/admin/academic/class-routines', labelBn: 'ক্লাস রুটিন', labelEn: 'Class timetable' },
          { to: '/admin/academic/documents', labelBn: 'সিলেবাস ও ক্যালেন্ডার', labelEn: 'Syllabus & calendar' },
        ],
      },
      {
        to: '/admin/attendance',
        labelBn: 'হাজিরা ও SMS',
        labelEn: 'Attendance & SMS',
        icon: ClipboardCheck,
        children: [
          { to: '/admin/attendance/daily', labelBn: 'দৈনিক হাজিরা', labelEn: 'Daily attendance' },
          { to: '/admin/attendance/reports', labelBn: 'মাসিক রিপোর্ট', labelEn: 'Monthly report' },
          { to: '/admin/attendance/sms-logs', labelBn: 'এসএমএস লগ', labelEn: 'SMS logs' },
          { to: '/admin/attendance/settings', labelBn: 'নিয়ম ও সময়সীমা', labelEn: 'Rules & cutoff' },
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
      { to: '/admin/notices', labelBn: 'নোটিশ ও ইভেন্ট', labelEn: 'Notices & Circulars', icon: MessageSquare },
      { to: '/admin/website/home', labelBn: 'ওয়েবসাইট CMS', labelEn: 'Website CMS', icon: Globe },
    ],
  },
  {
    id: 'system',
    labelBn: 'প্রশাসন ও সিস্টেম',
    labelEn: 'SYSTEM',
    items: [
      { to: '/admin/finance', labelBn: 'অর্থ ও হিসাব (নজরদারি)', labelEn: 'Finance Oversight', icon: Wallet },
      { to: '/admin/users', labelBn: 'ব্যবহারকারী ও অ্যাক্সেস', labelEn: 'Users & Access', icon: ShieldCheck },
      { to: '/admin/audit-logs', labelBn: 'অডিট লগ', labelEn: 'Audit Logs', icon: FileBarChart2 },
      { to: '/admin/reports', labelBn: 'রিপোর্ট ও অডিট', labelEn: 'Reports & Audit', icon: FileBarChart2 },
      { to: '/admin/settings', labelBn: 'সেটিংস ও প্রোফাইল', labelEn: 'Settings & Profile', icon: Settings },
    ],
  },
];

export const ACCOUNTANT_NAV_GROUPS: NavGroup[] = [
  {
    id: 'acc-overview',
    labelBn: 'ওভারভিউ',
    labelEn: 'OVERVIEW',
    items: [
      { to: '/accountant/dashboard', labelBn: 'ড্যাশবোর্ড', labelEn: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    id: 'acc-fees',
    labelBn: 'শিক্ষার্থী ফি ও আদায়',
    labelEn: 'STUDENT FEES',
    items: [
      { to: '/accountant/collect-fee', labelBn: 'ফি কালেকশন ডেস্ক', labelEn: 'Collect Fee', icon: Banknote },
      { to: '/accountant/transactions', labelBn: 'রসিদ ও লেনদেন', labelEn: 'Receipts & Transactions', icon: Receipt },
      { to: '/accountant/dues', labelBn: 'বকেয়া তালিকা', labelEn: 'Dues & Defaulters', icon: ClipboardCheck },
      { to: '/accountant/waivers', labelBn: 'ছাড় ও বৃত্তি', labelEn: 'Waivers & Discounts', icon: GraduationCap },
      { to: '/accountant/fee-setup', labelBn: 'ফি কাঠামো সেটআপ', labelEn: 'Fee Structure', icon: Calculator },
    ],
  },
  {
    id: 'acc-ledger',
    labelBn: 'আয়, ব্যয় ও বেতন',
    labelEn: 'INCOME & EXPENSE',
    items: [
      { to: '/accountant/other-income', labelBn: 'অন্যান্য আয়', labelEn: 'Other Income', icon: Wallet },
      { to: '/accountant/expenses', labelBn: 'ব্যয় ভাউচার', labelEn: 'Expenses', icon: FileSpreadsheet },
      { to: '/accountant/payroll', labelBn: 'বেতন-ভাতা রেজিস্টার', labelEn: 'Staff Payroll', icon: Users },
    ],
  },
  {
    id: 'acc-reports',
    labelBn: 'হিসাব ও রিপোর্ট',
    labelEn: 'REPORTS',
    items: [
      { to: '/accountant/cashbook', labelBn: 'দৈনিক ক্যাশবুক', labelEn: 'Daily Cashbook', icon: BookOpen },
      { to: '/accountant/reports', labelBn: 'আয়-ব্যয় রিপোর্ট', labelEn: 'Financial Reports', icon: FileBarChart2 },
    ],
  },
  {
    id: 'acc-general',
    labelBn: 'সাধারণ',
    labelEn: 'GENERAL',
    items: [
      { to: '/accountant/notices', labelBn: 'নোটিশ', labelEn: 'Notices', icon: MessageSquare },
      { to: '/accountant/profile', labelBn: 'আমার প্রোফাইল', labelEn: 'My Profile', icon: Settings },
    ],
  },
];

export const TEACHER_NAV: NavEntry[] = [
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

export const PARENT_NAV: NavEntry[] = [
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

export const STUDENT_NAV: NavEntry[] = [
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

const STUDENT_RESERVED = new Set([
  'create',
  'admissions',
  'import',
  'enrollments',
  'promotions',
  'transfers',
  'testimonials',
  'rfid-cards',
]);
const STAFF_RESERVED = new Set(['teachers', 'employees', 'departments', 'structures']);
const EXAM_RESERVED = new Set([
  'routines',
  'admit-cards',
  'seat-plan',
  'marks-entry',
  'grading-scales',
  'consolidated',
  'results',
]);

export function studentChildActive(pathname: string, to: string): boolean {
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
    return ['/admin/academic/documents', '/admin/academic/events'].includes(pathname);
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

export function getPortalNavGroups(portal: PortalKind, enableFutureModules?: boolean): NavGroup[] {
  if (portal === 'accountant') {
    return ACCOUNTANT_NAV_GROUPS;
  }
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
}

export interface NavContextResult {
  groupLabel: string;
  parentLabel: string;
  parentTo: string;
  pageTitle: string;
}

export function getCurrentNavContext(
  portal: PortalKind,
  pathname: string,
  locale: string,
  pick: (bn: string, en: string) => string
): NavContextResult | null {
  if (portal === 'admin') {
    for (const group of ADMIN_NAV_GROUPS) {
      for (const item of group.items) {
        if (item.children) {
          // Check exact child match first
          for (const child of item.children) {
            if (pathname === child.to) {
              return {
                groupLabel: group.labelBn,
                parentLabel: item.labelBn,
                parentTo: item.to,
                pageTitle: child.labelBn,
              };
            }
          }
          // Check child prefix match
          for (const child of item.children) {
            if (child.to !== item.to && pathname.startsWith(`${child.to}/`)) {
              return {
                groupLabel: group.labelBn,
                parentLabel: item.labelBn,
                parentTo: item.to,
                pageTitle: child.labelBn,
              };
            }
          }
        }
        if (item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)) {
          return {
            groupLabel: group.labelBn,
            parentLabel: item.labelBn,
            parentTo: item.to,
            pageTitle: item.labelBn,
          };
        }
      }
    }
  } else {
    const list = portal === 'teacher' ? TEACHER_NAV : portal === 'parent' ? PARENT_NAV : STUDENT_NAV;
    const match = list.find((it) => it.end ? pathname === it.to : pathname === it.to || pathname.startsWith(`${it.to}/`));
    if (match) {
      return {
        groupLabel: 'পোর্টাল',
        parentLabel: match.labelBn,
        parentTo: match.to,
        pageTitle: match.labelBn,
      };
    }
  }
  return null;
}
