import {
  Building2,
  History,
  Landmark,
  Quote,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  BookMarked,
  FileText,
  Clock,
  ClipboardCheck,
  Calendar,
  MonitorPlay,
  Library,
  Award,
  UserPlus,
  CheckCircle2,
  Download,
  FileCheck2,
  Search,
  Megaphone,
  Newspaper,
  Sparkles,
  Image as ImageIcon,
  BookCopy,
  Trophy,
  Briefcase,
  MapPin,
  type LucideIcon,
} from 'lucide-react';

export interface NavChildItem {
  labelBn: string;
  labelEn: string;
  descBn: string;
  descEn: string;
  to: string;
  icon: LucideIcon;
}

export interface NavGroup {
  id: string;
  labelBn: string;
  labelEn: string;
  to?: string;
  matchPrefixes?: string[];
  align?: 'left' | 'center' | 'right';
  children?: NavChildItem[];
}

export const PUBLIC_NAV: NavGroup[] = [
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

export const QUICK_SEARCH_SHORTCUTS: {
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

export function isGroupActive(group: NavGroup, pathname: string): boolean {
  if (group.to === '/') return pathname === '/';
  if (group.matchPrefixes && group.matchPrefixes.length > 0) {
    return group.matchPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
  }
  return group.to ? pathname === group.to || pathname.startsWith(`${group.to}/`) : false;
}
