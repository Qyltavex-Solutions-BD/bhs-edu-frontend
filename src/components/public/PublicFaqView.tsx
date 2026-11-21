'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  ChevronDown,
  Clock,
  FileText,
  GraduationCap,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useGetBootstrapQuery } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { Button, Card } from '@/src/components/ui/primitives';
import { cn } from '@/src/lib/utils/cn';

type FaqCategoryId = 'all' | 'admission' | 'results' | 'portal' | 'academics';

interface FaqItem {
  id: string;
  category: Exclude<FaqCategoryId, 'all'>;
  questionBn: string;
  questionEn: string;
  answerBn: string;
  answerEn: string;
  action?: {
    labelBn: string;
    labelEn: string;
    to: string;
  };
}

const FAQ_CATEGORIES: {
  id: FaqCategoryId;
  labelBn: string;
  labelEn: string;
}[] = [
  { id: 'all', labelBn: 'সকল প্রশ্ন', labelEn: 'All Questions' },
  { id: 'admission', labelBn: 'ভর্তি ও নিবন্ধন', labelEn: 'Admission' },
  { id: 'results', labelBn: 'পরীক্ষা ও ফলাফল', labelEn: 'Exams & Results' },
  { id: 'portal', labelBn: 'হাজিরা ও পোর্টাল', labelEn: 'Attendance & Portal' },
  { id: 'academics', labelBn: 'একাডেমিক ও সনদপত্র', labelEn: 'Academics & Office' },
];

const FAQ_ITEMS: FaqItem[] = [
  // Admission
  {
    id: 'faq-adm-1',
    category: 'admission',
    questionBn: 'নতুন শিক্ষাবর্ষে কোন কোন শ্রেণিতে ভর্তি আবেদন করা যায়?',
    questionEn: 'Which classes are open for new admission?',
    answerBn:
      'ভোজেশ্বর উচ্চ বিদ্যালয়ে নির্ধারিত ভর্তি সময়সূচি অনুযায়ী সাধারণত ৬ষ্ঠ থেকে ৯ম শ্রেণিতে নতুন শিক্ষার্থী ভর্তি করা হয়। ৯ম শ্রেণিতে ভর্তির ক্ষেত্রে বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা — এই তিনটি বিভাগের যেকোনো একটি নির্বাচন করা যায়।',
    answerEn:
      'Admissions are generally open for Classes 6 through 9 according to the annual admission schedule. For Class 9, applicants can choose from Science, Humanities, or Business Studies.',
    action: {
      labelBn: 'ভর্তি তথ্য ও নির্দেশিকা দেখুন',
      labelEn: 'View Admission Overview',
      to: '/admission',
    },
  },
  {
    id: 'faq-adm-2',
    category: 'admission',
    questionBn: 'অনলাইনে ভর্তি আবেদন করার নিয়ম ও প্রয়োজনীয় কাগজপত্র কী কী?',
    questionEn: 'How do I apply online and what documents are required?',
    answerBn:
      'ওয়েবসাইটের “অনলাইন ভর্তি আবেদন” পাতায় গিয়ে শিক্ষার্থীর নাম, ১৭ ডিজিটের ডিজিটাল জন্ম নিবন্ধন নম্বর, পিতা-মাতার এনআইডি ও মোবাইল নম্বর, পূর্ববর্তী বিদ্যালয়ের তথ্য এবং শ্রেণি/বিভাগ পূরণ করে আবেদন জমা দিতে হবে। ভর্তির সময় জন্ম সনদের কপি, পূর্ববর্তী বিদ্যালয়ের ছাড়পত্র (TC), প্রশংসাপত্র, ২ কপি পাসপোর্ট সাইজ ছবি এবং অভিভাবকের এনআইডি কপি অফিসে জমা দিতে হয়।',
    answerEn:
      'Complete the online form with student details, 17-digit digital birth certificate number, parent NID and mobile number, and previous school information. At final enrollment, submit copies of the birth certificate, Transfer Certificate (TC), testimonial, 2 passport photos, and guardian NID.',
    action: {
      labelBn: 'অনলাইন ভর্তি আবেদন করুন',
      labelEn: 'Apply Online Now',
      to: '/admission/apply',
    },
  },
  {
    id: 'faq-adm-3',
    category: 'admission',
    questionBn: 'ভর্তি আবেদনের বর্তমান অবস্থা (Status) এবং প্রবেশপত্র কীভাবে সংগ্রহ করব?',
    questionEn: 'How can I check admission status and collect the admit card?',
    answerBn:
      'অনলাইন আবেদন জমা দেওয়ার পর আপনি একটি নির্দিষ্ট আবেদন ট্র্যাকিং নম্বর পাবেন। “আবেদনের অবস্থা যাচাই” পেজে গিয়ে সেই ট্র্যাকিং নম্বর বা অভিভাবকের মোবাইল নম্বর দিয়ে আবেদনের বর্তমান অবস্থা দেখতে এবং প্রিন্টযোগ্য ফরম/প্রবেশপত্র সংগ্রহ করতে পারবেন।',
    answerEn:
      'After submitting the online form, you receive a unique tracking number. Visit the Application Status page and enter your tracking ID or mobile number to verify your application status and print the form/admit card.',
    action: {
      labelBn: 'আবেদনের অবস্থা যাচাই করুন',
      labelEn: 'Track Application Status',
      to: '/admission/status',
    },
  },
  {
    id: 'faq-adm-4',
    category: 'admission',
    questionBn: 'আমি কি প্রিন্টযোগ্য ভর্তি ফরম ডাউনলোড করে সরাসরি অফিসে জমা দিতে পারব?',
    questionEn: 'Can I download a printable admission form and submit it offline?',
    answerBn:
      'হ্যাঁ, “ভর্তি ফরম ডাউনলোড” পাতা থেকে বিদ্যালয়ের নির্ধারিত অফিসিয়াল ভর্তি ফরম প্রিন্ট করে হাতে পূরণ করেও অফিস চলাকালীন সময়ে সরাসরি বিদ্যালয় অফিসে জমা দেওয়া যাবে।',
    answerEn:
      'Yes, you can print the official admission form from the Download Form page, fill it out manually, and submit it directly to the school office during working hours.',
    action: {
      labelBn: 'ভর্তি ফরম ডাউনলোড করুন',
      labelEn: 'Download Official Form',
      to: '/admission/download-form',
    },
  },

  // Results & Exams
  {
    id: 'faq-res-1',
    category: 'results',
    questionBn: 'লগইন ছাড়াই অনলাইনে পরীক্ষার ফলাফল ও মার্কশিট কীভাবে দেখব?',
    questionEn: 'How do I check exam results and marksheets without logging in?',
    answerBn:
      'ওয়েবসাইটের “ফলাফল” মেনুতে অথবা হোমপেজের “তাৎক্ষণিক ফলাফল” অংশে গিয়ে প্রকাশিত পরীক্ষা, শ্রেণি এবং শিক্ষার্থীর রোল নম্বর নির্বাচন করে অনুসন্ধান করলেই বিষয়ভিত্তিক নম্বর, গ্রেড, জিপিএ ও মেধাক্রমসহ পূর্ণাঙ্গ মার্কশিট দেখা ও প্রিন্ট করা যায়।',
    answerEn:
      'Go to the Results page (or use Instant Results on the homepage), select the published exam, class, and student roll number to instantly view and print the detailed subject-wise marksheet with GPA and merit position.',
    action: {
      labelBn: 'ফলাফল অনুসন্ধান করুন',
      labelEn: 'Search Exam Results',
      to: '/results',
    },
  },
  {
    id: 'faq-res-2',
    category: 'results',
    questionBn: 'বিদ্যালয়ের গ্রেডিং পদ্ধতি এবং জিপিএ হিসাব কীভাবে করা হয়?',
    questionEn: 'What grading scale and GPA calculation method is followed?',
    answerBn:
      'ভোজেশ্বর উচ্চ বিদ্যালয় জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB) এবং ঢাকা মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ডের ৫.০০ স্কেল অনুসরণ করে (৮০–১০০ = A+ / ৫.০০, ৭০–৭৯ = A / ৪.০০, ৬০–৬৯ = A- / ৩.৫০, ৫০–৫৯ = B / ৩.০০, ৪০–৪৯ = C / ২.০০, ৩৩–৩৯ = D / ১.০০ এবং ৩৩-এর নিচে অকৃতকার্য)। ৯ম–১০ম শ্রেণিতে চতুর্থ (ঐচ্ছিক) বিষয়ের বোনাস পয়েন্ট বোর্ডের নিয়ম অনুযায়ী যোগ হয়।',
    answerEn:
      'BHS follows the official NCTB and Dhaka Education Board 5.00 GPA scale (80–100 = A+ / 5.00 down to 33–39 = D / 1.00; below 33 is Fail). For Classes 9–10, optional (4th) subject GPA bonus is calculated strictly per board policy.',
    action: {
      labelBn: 'পরীক্ষা ও মূল্যায়ন নীতিমালা দেখুন',
      labelEn: 'View Exam System',
      to: '/academics/examinations',
    },
  },
  {
    id: 'faq-res-3',
    category: 'results',
    questionBn: 'ফলাফলে কোনো নম্বর বা তথ্যে অসঙ্গতি মনে হলে কী করণীয়?',
    questionEn: 'What should I do if there is any discrepancy in a published marksheet?',
    answerBn:
      'প্রকাশিত ফলাফলে শিক্ষার্থীর নাম, রোল বা কোনো বিষয়ের নম্বরে অসঙ্গতি দেখা গেলে ফলাফল প্রকাশের ৭ কর্মদিবসের মধ্যে প্রিন্টকৃত মার্কশিটের কপিসহ শ্রেণি শিক্ষক বা বিদ্যালয় অফিসে লিখিত আবেদন করতে হবে।',
    answerEn:
      'If you notice any error in student name, roll, or subject marks, please submit a written request along with a copy of the marksheet to the class teacher or school office within 7 working days of publication.',
  },

  // Attendance & Parent Portal
  {
    id: 'faq-por-1',
    category: 'portal',
    questionBn: 'কোন কোন শ্রেণিতে ডিজিটাল RFID হাজিরা চালু আছে এবং অভিভাবক কি SMS পান?',
    questionEn: 'Which classes use digital RFID attendance and do parents receive SMS?',
    answerBn:
      'বর্তমানে ১০ম শ্রেণির (এসএসসি পরীক্ষার্থী ব্যাচ) জন্য স্বয়ংক্রিয় RFID স্মার্ট কার্ড হাজিরা এবং ৬ষ্ঠ থেকে ৯ম শ্রেণির জন্য দৈনিক শ্রেণিকক্ষ হাজিরা ব্যবস্থা চালু আছে। শিক্ষার্থী বিদ্যালয়ে অনুপস্থিত থাকলে বা দেরিতে উপস্থিত হলে নিবন্ধিত অভিভাবকের মোবাইল নম্বরে স্বয়ংক্রিয়ভাবে SMS পাঠানো হয়।',
    answerEn:
      'Currently Class 10 (SSC batch) operates on automated RFID smart card attendance while Classes 6–9 use daily classroom attendance. Automated SMS alerts are sent to registered guardian numbers for absences or late arrivals.',
  },
  {
    id: 'faq-por-2',
    category: 'portal',
    questionBn: 'অভিভাবক পোর্টালে কীভাবে লগইন করব এবং কী কী তথ্য দেখা যাবে?',
    questionEn: 'How do parents sign in to the Parent Portal and what can they monitor?',
    answerBn:
      'বিদ্যালয় অফিস থেকে প্রদত্ত অভিভাবক আইডি/মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে “পোর্টাল লগইন” থেকে প্রবেশ করা যায়। একটি অ্যাকাউন্ট থেকেই একাধিক সন্তানের দৈনিক হাজিরার রিপোর্ট, প্রাপ্ত SMS-এর ইতিহাস, ক্লাস রুটিন, নোটিশ এবং পরীক্ষার ফলাফল দেখা যায়।',
    answerEn:
      'Guardians can log in via Portal Sign In using credentials issued by the school office. From a single account, parents can track daily attendance, SMS alert logs, class routines, notices, and exam results for all linked children.',
    action: {
      labelBn: 'অভিভাবক পোর্টালে লগইন করুন',
      labelEn: 'Go to Portal Login',
      to: '/login',
    },
  },
  {
    id: 'faq-por-3',
    category: 'portal',
    questionBn: 'পাবলিক ওয়েবসাইটে কি শিক্ষার্থীর ব্যক্তিগত তথ্য প্রকাশ করা হয়?',
    questionEn: 'Is private student information shown on the public website?',
    answerBn:
      'না। শিক্ষার্থী ও অভিভাবকদের গোপনীয়তা আমাদের সর্বোচ্চ অগ্রাধিকার। জন্ম নিবন্ধন নম্বর, এনআইডি, বাসার ঠিকানা এবং অভিভাবকের ব্যক্তিগত মোবাইল নম্বর কখনোই পাবলিক ওয়েবসাইটে প্রদর্শন করা হয় না।',
    answerEn:
      'No. Student and guardian privacy is strictly protected. Birth certificate numbers, NIDs, home addresses, and guardian phone numbers are never displayed on the public website.',
    action: {
      labelBn: 'গোপনীয়তা নীতি পড়ুন',
      labelEn: 'Read Privacy Policy',
      to: '/privacy-policy',
    },
  },

  // Academics & Certificates
  {
    id: 'faq-aca-1',
    category: 'academics',
    questionBn: 'ক্লাস রুটিন, পরীক্ষার সময়সূচি ও সিলেবাস কোথা থেকে পাব?',
    questionEn: 'Where can I find class routines, exam schedules, and syllabuses?',
    answerBn:
      'ওয়েবসাইটের “একাডেমিক” মেনু থেকে ৬ষ্ঠ–১০ম শ্রেণির সাপ্তাহিক ক্লাস রুটিন, পরীক্ষার রুটিন, এনসিটিবি পাঠ্যসূচি (সিলেবাস), বার্ষিক একাডেমিক ক্যালেন্ডার এবং শিক্ষকদের তৈরি সহায়ক নোট ও ডিজিটাল রিসোর্স যেকোনো সময় দেখা ও ডাউনলোড করা যায়।',
    answerEn:
      'Under the Academics menu, you can view and download weekly class routines, exam schedules, NCTB syllabuses, the annual academic calendar, and teacher-prepared study resources for Classes 6–10.',
    action: {
      labelBn: 'ক্লাস ও পরীক্ষার রুটিন দেখুন',
      labelEn: 'View Class Routines',
      to: '/academics/routines',
    },
  },
  {
    id: 'faq-aca-2',
    category: 'academics',
    questionBn: 'ছাড়পত্র (TC), প্রত্যয়নপত্র বা প্রশংসাপত্র নেওয়ার প্রক্রিয়া কী?',
    questionEn: 'How do I apply for a Transfer Certificate (TC) or Testimonial?',
    answerBn:
      'ছাড়পত্র (Transfer Certificate), অধ্যয়ন প্রত্যয়নপত্র বা এসএসসি প্রশংসাপত্রের জন্য অভিভাবকের স্বাক্ষরসহ প্রধান শিক্ষক বরাবর নির্ধারিত ফরমে আবেদন করতে হয়। বিদ্যালয়ের সকল বকেয়া ও গ্রন্থাগারের বই পরিশোধ সাপেক্ষে সাধারণত ২–৩ কর্মদিবসের মধ্যে সনদপত্র প্রদান করা হয়।',
    answerEn:
      'Submit an application signed by the guardian addressed to the Headteacher. Subject to clearance of school dues and library books, certificates are generally issued within 2–3 working days.',
  },
  {
    id: 'faq-aca-3',
    category: 'academics',
    questionBn: 'বিদ্যালয়ের শ্রেণি কার্যক্রম ও অফিসের সময়সূচি কী?',
    questionEn: 'What are the school class timings and office hours?',
    answerBn:
      'বিদ্যালয়ের নিয়মিত ক্লাস ও অফিস কার্যক্রম রবিবার থেকে বৃহস্পতিবার সকাল ১০:০০ ঘটিকা থেকে বিকাল ৪:০০ ঘটিকা পর্যন্ত পরিচালিত হয়। শুক্রবার, শনিবার এবং সরকারি ঘোষিত ছুটির দিনগুলোতে বিদ্যালয় বন্ধ থাকে।',
    answerEn:
      'Regular classes and office operations run Sunday through Thursday from 10:00 AM to 4:00 PM. The school remains closed on Fridays, Saturdays, and government-declared public holidays.',
    action: {
      labelBn: 'বার্ষিক একাডেমিক ক্যালেন্ডার দেখুন',
      labelEn: 'View Academic Calendar',
      to: '/academics/academic-calendar',
    },
  },
  {
    id: 'faq-aca-4',
    category: 'academics',
    questionBn: 'বিদ্যালয়ে কি বিজ্ঞান ল্যাব, কম্পিউটার ল্যাব ও পাঠাগার সুবিধা রয়েছে?',
    questionEn: 'Does the school have science labs, ICT labs, and a library?',
    answerBn:
      'হ্যাঁ, ভোজেশ্বর উচ্চ বিদ্যালয়ে পদার্থ, রসায়ন ও জীববিজ্ঞানের ব্যবহারিক বিজ্ঞান গবেষণাগার, আধুনিক কম্পিউটার ও আইসিটি ল্যাব, মাল্টিমিডিয়া স্মার্ট শ্রেণিকক্ষ, সমৃদ্ধ পাঠাগার এবং বিশাল খেলার মাঠ রয়েছে।',
    answerEn:
      'Yes, BHS features dedicated Physics, Chemistry, and Biology laboratories, a modern Computer & ICT lab, multimedia smart classrooms, a well-stocked reading library, and a spacious sports playground.',
    action: {
      labelBn: 'ক্যাম্পাস সুবিধাসমূহ দেখুন',
      labelEn: 'Explore Campus Facilities',
      to: '/about/facilities',
    },
  },
];

const QUICK_HELP_LINKS = [
  {
    labelBn: 'অনলাইন ভর্তি আবেদন',
    labelEn: 'Online Admission Apply',
    to: '/admission/apply',
    icon: GraduationCap,
  },
  {
    labelBn: 'তাৎক্ষণিক ফলাফল অনুসন্ধান',
    labelEn: 'Instant Result Lookup',
    to: '/results',
    icon: Award,
  },
  {
    labelBn: 'ক্লাস ও পরীক্ষার রুটিন',
    labelEn: 'Class & Exam Routines',
    to: '/academics/routines',
    icon: BookOpen,
  },
  {
    labelBn: 'একাডেমিক ক্যালেন্ডার',
    labelEn: 'Academic Calendar',
    to: '/academics/academic-calendar',
    icon: Calendar,
  },
  {
    labelBn: 'প্রাতিষ্ঠানিক নোটিশ বোর্ড',
    labelEn: 'Official Notice Board',
    to: '/notices',
    icon: FileText,
  },
];

export function PublicFaqView() {
  const { data: db } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();

  const [activeCategory, setActiveCategory] = useState<FaqCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    'faq-adm-1': true,
    'faq-res-1': true,
  });

  const categoryCounts = useMemo(() => {
    const counts: Record<FaqCategoryId, number> = {
      all: FAQ_ITEMS.length,
      admission: 0,
      results: 0,
      portal: 0,
      academics: 0,
    };
    for (const item of FAQ_ITEMS) {
      counts[item.category] += 1;
    }
    return counts;
  }, []);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.questionBn.toLowerCase().includes(q) ||
        item.questionEn.toLowerCase().includes(q) ||
        item.answerBn.toLowerCase().includes(q) ||
        item.answerEn.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, searchQuery]);

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allVisibleOpen =
    filteredItems.length > 0 && filteredItems.every((item) => Boolean(openIds[item.id]));

  const handleToggleAll = () => {
    if (allVisibleOpen) {
      setOpenIds({});
    } else {
      const next: Record<string, boolean> = { ...openIds };
      for (const item of filteredItems) {
        next[item.id] = true;
      }
      setOpenIds(next);
    }
  };

  const getCategoryLabel = (catId: Exclude<FaqCategoryId, 'all'>) => {
    const found = FAQ_CATEGORIES.find((c) => c.id === catId);
    if (!found) return '';
    return locale === 'bn' ? found.labelBn : found.labelEn;
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Editorial Header + Instant Search */}
      <section className="bg-surface border border-border rounded-2xl p-6 sm:p-8 lg:p-10 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-7 space-y-2.5">
            <p className="text-sm font-semibold text-primary">
              {pick(
                'ভোজেশ্বর উচ্চ বিদ্যালয় · সহায়তা ও তথ্য কেন্দ্র',
                'Bhojeshwar High School · Help & Information Center'
              )}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {pick('সাধারণ জিজ্ঞাসা (FAQ)', 'Frequently Asked Questions')}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
              {pick(
                'ভর্তি প্রক্রিয়া, পরীক্ষার ফলাফল, RFID হাজিরা, অভিভাবক পোর্টাল এবং সনদপত্র সংক্রান্ত শিক্ষার্থী ও অভিভাবকদের সর্বাধিক জিজ্ঞাসিত প্রশ্নোত্তর এখানে সাজানো হয়েছে।',
                'Clear answers to the most common questions from parents and students regarding admissions, exam results, attendance, parent portal, and school certificates.'
              )}
            </p>
          </div>

          {/* Live Search Input */}
          <div className="lg:col-span-5">
            <label htmlFor="faq-search" className="sr-only">
              {pick('প্রশ্ন অনুসন্ধান করুন', 'Search questions')}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="faq-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={pick(
                  'প্রশ্ন খুঁজুন... (যেমন: ভর্তি, ফলাফল, হাজিরা, ছাড়পত্র)',
                  'Search topics... (e.g. admission, result, RFID, TC)'
                )}
                className="w-full h-11 pl-10 pr-10 text-base bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label={pick('অনুসন্ধান মুছুন', 'Clear search')}
                  className="h-7 w-7 rounded-md absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-muted cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Strip */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5" role="tablist">
            {FAQ_CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5',
                    active
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-surface-muted/60 text-muted-foreground hover:text-foreground hover:bg-surface-muted'
                  )}
                >
                  <span>{locale === 'bn' ? cat.labelBn : cat.labelEn}</span>
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      active ? 'text-primary-foreground/80' : 'text-muted-foreground/80'
                    )}
                  >
                    ({formatNumber(categoryCounts[cat.id], locale)})
                  </span>
                </button>
              );
            })}
          </div>

          {filteredItems.length > 0 && (
            <button
              type="button"
              onClick={handleToggleAll}
              className="text-sm font-semibold text-primary hover:underline cursor-pointer whitespace-nowrap"
            >
              {allVisibleOpen
                ? pick('সব উত্তর বন্ধ করুন', 'Collapse All')
                : pick('সব উত্তর খুলুন', 'Expand All')}
            </button>
          )}
        </div>
      </section>

      {/* Main 12-Col Body: Accordion Questions (8 cols) + Office Support Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Columns — Interactive FAQ Accordion */}
        <div className="lg:col-span-8 space-y-3">
          {filteredItems.length === 0 ? (
            <Card className="p-10 text-center space-y-3">
              <div className="h-11 w-11 rounded-full bg-surface-muted text-muted-foreground flex items-center justify-center mx-auto">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">
                  {pick('কোনো মিল পাওয়া যায়নি', 'No matching questions found')}
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {pick(
                    'আপনার অনুসন্ধানকৃত শব্দের সাথে কোনো প্রশ্ন মেলেনি। অন্য শব্দ দিয়ে খুঁজুন অথবা সরাসরি বিদ্যালয় অফিসে যোগাযোগ করুন।',
                    'Try searching with a different keyword or reach out directly to the school office.'
                  )}
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                >
                  {pick('ফিল্টার রিসেট করুন', 'Reset Filters')}
                </Button>
                <Link href="/contact">
                  <Button variant="primary" size="sm">
                    <span>{pick('সরাসরি প্রশ্ন পাঠান', 'Ask the Office')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border">
              {filteredItems.map((item, idx) => {
                const isOpen = Boolean(openIds[item.id]);
                const numLabel = formatNumber(idx + 1, locale).padStart(
                  2,
                  locale === 'bn' ? '০' : '0'
                );

                return (
                  <div key={item.id} className="transition-colors">
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${item.id}`}
                      className={cn(
                        'w-full px-5 sm:px-6 py-4 sm:py-5 flex items-start justify-between gap-4 text-left cursor-pointer transition-colors',
                        isOpen ? 'bg-surface-muted/35' : 'hover:bg-surface-muted/30'
                      )}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <span
                          className={cn(
                            'text-sm font-bold tabular-nums pt-0.5 shrink-0',
                            isOpen ? 'text-primary' : 'text-muted-foreground'
                          )}
                        >
                          {numLabel}
                        </span>
                        <div className="min-w-0 space-y-1">
                          <p className="text-xs font-semibold text-primary/90">
                            {getCategoryLabel(item.category)}
                          </p>
                          <h2 className="text-base font-bold text-foreground leading-snug">
                            {locale === 'bn' ? item.questionBn : item.questionEn}
                          </h2>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all',
                          isOpen
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-surface border-border text-muted-foreground'
                        )}
                      >
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 transition-transform duration-200',
                            isOpen && 'rotate-180'
                          )}
                        />
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`faq-panel-${item.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 sm:px-6 pb-5 pt-1 pl-12 sm:pl-[3.35rem] space-y-3 bg-surface-muted/20">
                            <p className="text-base text-foreground/85 leading-relaxed">
                              {locale === 'bn' ? item.answerBn : item.answerEn}
                            </p>
                            {item.action && (
                              <div>
                                <Link
                                  href={item.action.to}
                                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                                >
                                  <span>
                                    {locale === 'bn' ? item.action.labelBn : item.action.labelEn}
                                  </span>
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
            </div>
          )}
        </div>

        {/* Right 4 Columns — School Helpdesk & Quick Services Sidebar */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          {/* Office Support Card */}
          <Card className="p-5 sm:p-6 space-y-4 border-t-2 border-t-primary">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">
                {pick('আপনার প্রশ্নটি এখানে নেই?', 'Still Have a Question?')}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {pick(
                  'অফিস চলাকালীন সময়ে সরাসরি কল করুন অথবা অনলাইনে বার্তা পাঠান — আমাদের অফিস সহায়ক দ্রুত উত্তর দেবেন।',
                  'Call us during school office hours or send an online inquiry for personalized assistance.'
                )}
              </p>
            </div>

            <div className="space-y-2.5 text-sm pt-2 border-t border-border">
              <p className="flex items-start gap-2.5 text-muted-foreground">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  {pick(
                    'রবিবার – বৃহস্পতিবার, সকাল ১০:০০ – বিকাল ৪:০০',
                    'Sunday – Thursday, 10:00 AM – 4:00 PM'
                  )}
                </span>
              </p>
              {db?.contactInfo.phone && (
                <a
                  href={`tel:${db.contactInfo.phone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-2.5 text-foreground font-semibold hover:text-primary tabular-nums transition-colors"
                >
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span>{db.contactInfo.phone}</span>
                </a>
              )}
              {db?.contactInfo.email && (
                <a
                  href={`mailto:${db.contactInfo.email}`}
                  className="flex items-center gap-2.5 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span>{db.contactInfo.email}</span>
                </a>
              )}
              {db?.contactInfo.address && (
                <p className="flex items-start gap-2.5 text-muted-foreground leading-relaxed">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{db.contactInfo.address}</span>
                </p>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link href="/contact" className="block">
                <Button variant="primary" className="w-full">
                  <span>{pick('যোগাযোগ ও বার্তা পাঠান', 'Contact School Office')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Popular Digital Services Card */}
          <Card className="p-5 space-y-3.5">
            <h2 className="text-base font-bold text-foreground">
              {pick('প্রয়োজনীয় ডিজিটাল সেবা', 'Quick Academic Services')}
            </h2>
            <div className="divide-y divide-border/70">
              {QUICK_HELP_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    href={link.to}
                    className="group py-2.5 flex items-center justify-between gap-3 text-sm font-medium text-foreground/90 hover:text-primary transition-colors"
                  >
                    <span className="inline-flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate">
                        {locale === 'bn' ? link.labelBn : link.labelEn}
                      </span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                );
              })}
            </div>
          </Card>

          {/* Institutional Trust Note */}
          <div className="rounded-xl bg-surface-muted/50 border border-border p-4 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground">
                {db?.schoolProfile.name ?? pick('ভোজেশ্বর উচ্চ বিদ্যালয়', 'Bhojeshwar High School')}
              </p>
              <p className="mt-0.5 tabular-nums text-xs">
                {pick(
                  `EIIN: ${db?.schoolProfile.eiin ?? '113587'} · স্থাপিত: ১৯৭৮ খ্রি. · ৬ষ্ঠ–১০ম শ্রেণি`,
                  `EIIN: ${db?.schoolProfile.eiin ?? '113587'} · Est. 1978 · Classes 6–10`
                )}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
