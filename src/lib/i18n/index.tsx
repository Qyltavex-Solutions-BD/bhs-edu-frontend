'use client';

import React, { createContext, useContext } from 'react';

export type Locale = 'bn';

const DICTIONARY: Record<string, string> = {
  'school.name': 'ভোজেশ্বর উচ্চ বিদ্যালয়',
  'school.shortName': 'ভোজেশ্বর উচ্চ বিদ্যালয় (BHS)',
  'school.motto': 'শিক্ষাই আলো, জ্ঞানই শক্তি',
  'school.location': 'ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
  'school.est': 'স্থাপিত: ১৯৭৮ খ্রি.',
  'nav.home': 'হোম',
  'nav.about': 'পরিচিতি',
  'nav.academics': 'একাডেমিক',
  'nav.administration': 'প্রশাসন',
  'nav.admission': 'ভর্তি',
  'nav.notices': 'নোটিশ বোর্ড',
  'nav.newsEvents': 'সংবাদ ও অনুষ্ঠান',
  'nav.gallery': 'গ্যালারি',
  'nav.contact': 'যোগাযোগ',
  'nav.results': 'ফলাফল',
  'nav.portal': 'পোর্টাল লগইন',
  'nav.dashboard': 'ড্যাশবোর্ড',
  'cta.applyOnline': 'অনলাইন ভর্তি আবেদন',
  'cta.checkResult': 'ফলাফল দেখুন',
  'cta.exploreSchool': 'বিদ্যালয় জানুন',
  'cta.viewAll': 'সব দেখুন',
  'cta.readMore': 'বিস্তারিত পড়ুন',
  'cta.print': 'প্রিন্ট / পিডিএফ',
  'cta.save': 'সংরক্ষণ করুন',
  'cta.cancel': 'বাতিল',
  'cta.submit': 'জমা দিন',
  'cta.search': 'অনুসন্ধান...',
  'cta.reset': 'রিসেট',
  'cta.exportCsv': 'CSV ডাউনলোড',
  'cta.back': 'ফিরে যান',
  'demo.banner': 'ডেমো ডেটা — শুধুমাত্র প্রদর্শনের জন্য (অফিসিয়াল স্কুল তথ্য কনফিগারযোগ্য)',
  'status.loading': 'তথ্য লোড হচ্ছে...',
  'status.empty': 'কোনো তথ্য পাওয়া যায়নি',
  'status.error': 'তথ্য লোড করতে সমস্যা হয়েছে',
  'status.retry': 'পুনরায় চেষ্টা করুন',
  'portal.admin': 'অ্যাডমিন পোর্টাল',
  'portal.teacher': 'শিক্ষক পোর্টাল',
  'portal.parent': 'অভিভাবক পোর্টাল',
  'portal.student': 'শিক্ষার্থী পোর্টাল',
  'common.signOut': 'লগ আউট',
  'common.profile': 'প্রোফাইল',
  'common.notifications': 'নোটিফিকেশন',
  'common.settings': 'সেটিংস',
  'common.commandHint': 'দ্রুত খুঁজুন (Ctrl+K)',
  'common.demoMode': 'ডেমো সেশন',
};

interface I18nContextValue {
  locale: Locale;
  t: (key: string) => string;
  pick: (bn: string, en?: string) => string;
}

const I18N: I18nContextValue = {
  locale: 'bn',
  t: (key) => DICTIONARY[key] ?? key,
  pick: (bn) => bn,
};

const I18nContext = createContext<I18nContextValue>(I18N);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  return <I18nContext.Provider value={I18N}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
