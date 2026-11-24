import {
  FacilityType,
  InstitutionContentType,
} from '@/src/types/enums';
import type {
  SchoolProfile,
  InstitutionContent,
  SchoolFacility,
  Administrator,
  ManagingCommitteeMember,
  QuickLink,
  AdmissionContent,
  ContactInformation,
} from '@/src/types/entities';
import { NOW } from './common';

export function createInstitutionFixtures() {
  // 2. Institution (Bhojeshwar High School — BHS)
  const schoolProfile: SchoolProfile = {
    id: 'school-profile-1',
    name: 'ভোজেশ্বর উচ্চ বিদ্যালয়',
    nameEn: 'Bhojeshwar High School',
    motto: 'শিক্ষাই আলো, জ্ঞানই শক্তি',
    eiin: '113587',
    schoolCode: 'BHS',
    logo: '/assets/aistudio/15f910cc-7969-442c-abd0-8fbf9bc3081d_9580ab1b.jpg',
    establishedYear: 1978,
    address: 'ডাকঘর: ভোজেশ্বর (মশুরা), উপজেলা: নড়িয়া, জেলা: শরীয়তপুর।',
    phone: '+880 1700-000000',
    email: 'info@bhs.edu.bd',
    website: 'https://bhojeshwarhighschool.edu.bd',
    description:
      '১৯৭৮ সালে প্রতিষ্ঠিত ভোজেশ্বর উচ্চ বিদ্যালয় (BHS) শরীয়তপুর জেলার নড়িয়া উপজেলার ভোজেশ্বরের একটি অন্যতম ঐতিহ্যবাহী ও সুনামধন্য মাধ্যমিক শিক্ষা প্রতিষ্ঠান। ষষ্ঠ থেকে দশম শ্রেণি পর্যন্ত মানসম্মত পাঠদান, নৈতিক শিক্ষা ও আধুনিক ডিজিটাল শিক্ষাব্যবস্থার সমন্বয়ে আমরা আলোকিত মানুষ গড়ার লক্ষ্যে কাজ করছি।',
    mission:
      'ভোজেশ্বর, নড়িয়া ও আশপাশের অঞ্চলের শিক্ষার্থীদের জন্য আধুনিক, অন্তর্ভুক্তিমূলক ও প্রযুক্তিনির্ভর মাধ্যমিক শিক্ষা নিশ্চিত করা এবং নৈতিক মূল্যবোধ, বিজ্ঞানমনস্কতা ও নেতৃত্বগুণ বিকাশ ঘটানো।',
    vision:
      'ঐতিহ্য ও আধুনিকতার মেলবন্ধনে একটি আদর্শ ডিজিটাল স্মার্ট বিদ্যালয় হিসেবে প্রতিটি শিক্ষার্থীর সৃজনশীলতা ও মেধার পূর্ণ বিকাশ নিশ্চিত করা।',
    socialLinks: {
      facebook: 'https://facebook.com',
      youtube: 'https://youtube.com',
    },
    createdAt: NOW,
    updatedAt: NOW,
  };

  const institutionContents: InstitutionContent[] = [
    {
      id: 'ic-1',
      type: InstitutionContentType.HISTORY,
      title: 'ঐতিহ্য ও প্রতিষ্ঠার ইতিহাস (১৯৭৮)',
      description:
        '১৯৭৮ খ্রিস্টাব্দের ১ জানুয়ারি শরীয়তপুর জেলার নড়িয়া উপজেলার ভোজেশ্বর ইউনিয়নে শিক্ষানুরাগী ব্যক্তিবর্গের উদ্যোগে ভোজেশ্বর উচ্চ বিদ্যালয় (BHS) প্রতিষ্ঠিত হয়। প্রতিষ্ঠার পর থেকে প্রায় অর্ধশতাব্দী ধরে অত্র প্রতিষ্ঠানটি এই জনপদে মাধ্যমিক শিক্ষার আলো ছড়িয়ে আসছে।',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ic-2',
      type: InstitutionContentType.TRADITION,
      title: 'নৈতিকতা, শৃঙ্খলা ও সহশিক্ষা কার্যক্রম',
      description:
        'পাঠ্যবইয়ের পাশাপাশি বিতর্ক, বিজ্ঞান মেলা, স্কাউটিং, ক্রীড়া ও সাংস্কৃতিক চর্চার মাধ্যমে শিক্ষার্থীদের সামগ্রিক বিকাশ এই বিদ্যালয়ের দীর্ঘদিনের ঐতিহ্য।',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ic-3',
      type: InstitutionContentType.INFRASTRUCTURE,
      title: 'একাডেমিক ভবন ও শিক্ষার পরিবেশ',
      description:
        'সুপরিসর শ্রেণিকক্ষ, মাল্টিমিডিয়া স্মার্ট ক্লাসরুম, বিজ্ঞান গবেষণাগার, গ্রন্থাগার, খেলার মাঠ এবং নিরাপদ ক্যাম্পাস শিক্ষার্থীদের অনুকূল শিক্ষার পরিবেশ প্রদান করে।',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const facilities: SchoolFacility[] = [
    { id: 'fac-1', name: 'শেখ রাসেল ডিজিটাল ও কম্পিউটার ল্যাব', type: FacilityType.LAB, description: 'আধুনিক কম্পিউটার ও ইন্টারনেট সংযোগসহ তথ্য ও যোগাযোগ প্রযুক্তি ব্যবহারিক ল্যাব।', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'fac-2', name: 'পদার্থ, রসায়ন ও জীববিজ্ঞান গবেষণাগার', type: FacilityType.LAB, description: 'নবম-দশম শ্রেণির বিজ্ঞান বিভাগের শিক্ষার্থীদের ব্যবহারিক পরীক্ষার সুসজ্জিত বিজ্ঞানাগার।', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'fac-3', name: 'সমৃদ্ধ বিদ্যালয় গ্রন্থাগার', type: FacilityType.LIBRARY, description: 'পাঠ্যবই, সাহিত্য, ইতিহাস, বিজ্ঞান ও রেফারেন্স বইসমৃদ্ধ শান্ত পাঠকক্ষ।', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'fac-4', name: 'মাল্টিমিডিয়া স্মার্ট শ্রেণিকক্ষ', type: FacilityType.MULTIMEDIA, description: 'প্রজেক্টর ও ডিজিটাল কনটেন্ট ব্যবহারের মাধ্যমে ইন্টারেক্টিভ পাঠদান ব্যবস্থা।', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'fac-5', name: 'প্রশস্ত খেলার মাঠ', type: FacilityType.PLAYGROUND, description: 'বার্ষিক ক্রীড়া প্রতিযোগিতা, ফুটবল, ক্রিকেট ও প্রাত্যহিক সমাবেশের জন্য উন্মুক্ত মাঠ।', isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  const quickLinks: QuickLink[] = [
    { id: 'ql-1', title: 'ভর্তি তথ্য ও নির্দেশিকা', url: '/admission', isButton: false, sortOrder: 1, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ql-2', title: 'ক্লাস রুটিন', url: '/academics/routines', isButton: false, sortOrder: 2, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ql-3', title: 'পরীক্ষার রুটিন', url: '/academics/examination', isButton: false, sortOrder: 3, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ql-4', title: 'একাডেমিক ক্যালেন্ডার', url: '/academics/academic-calendar', isButton: false, sortOrder: 4, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ql-5', title: 'অনলাইন ফলাফল', url: '/results', isButton: true, sortOrder: 5, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ql-6', title: 'পাঠ্যসূচি (সিলেবাস)', url: '/academics/syllabus', isButton: false, sortOrder: 6, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ql-7', title: 'ভর্তি ফরম ডাউনলোড', url: '/admission/download-form', isButton: false, sortOrder: 7, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ql-8', title: 'পোর্টাল লগইন', url: '/login', isButton: true, sortOrder: 8, isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  const administrators: Administrator[] = [
    { id: 'adm-1', staffId: 'staff-1', name: 'মোঃ শফিকুর রহমান', designation: 'প্রধান শিক্ষক', message: 'শিক্ষার্থীদের মেধা ও নৈতিক বিকাশে আমরা প্রতিশ্রুতিবদ্ধ।', startDate: '2021-01-01', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'adm-2', staffId: 'staff-2', name: 'অনুপমা রায়', designation: 'সহকারী প্রধান শিক্ষক', message: 'শৃঙ্খলা ও নিয়মিত অধ্যবসায় সাফল্যের মূল চাবিকাঠি।', startDate: '2022-01-01', isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  const managingCommittee: ManagingCommitteeMember[] = [
    { id: 'mc-1', name: 'আলহাজ্ব মোঃ নুরুল আমিন', designation: 'সভাপতি, ম্যানেজিং কমিটি', photo: '/images/chairman_portrait_1795154662402.jpg', phone: '01711-300001', startDate: '2024-07-01', endDate: '2026-06-30', createdAt: NOW, updatedAt: NOW },
    { id: 'mc-2', name: 'মোঃ শফিকুর রহমান', designation: 'সদস্য সচিব (পদাধিকারবলে প্রধান শিক্ষক)', photo: '/images/headteacher_clean_portrait_1795154685112.jpg', phone: '01711-200101', startDate: '2024-07-01', endDate: '2026-06-30', createdAt: NOW, updatedAt: NOW },
    { id: 'mc-3', name: 'অ্যাডভোকেট সুব্রত দাস', designation: 'শিক্ষানুরাগী সদস্য', photo: '/images/committee_subrata_portrait_1795171029609.jpg', phone: '01711-300003', startDate: '2024-07-01', endDate: '2026-06-30', createdAt: NOW, updatedAt: NOW },
    { id: 'mc-4', name: 'মোঃ হাবিবুর রহমান', designation: 'অভিভাবক প্রতিনিধি', photo: '/images/committee_habibur_portrait_1795170999277.jpg', phone: '01711-300004', startDate: '2024-07-01', endDate: '2026-06-30', createdAt: NOW, updatedAt: NOW },
    { id: 'mc-5', name: 'মিসেস রেহানা বেগম', designation: 'সংরক্ষিত মহিলা অভিভাবক সদস্য', photo: '/images/committee_rehana_portrait_1795170999363.jpg', phone: '01711-300005', startDate: '2024-07-01', endDate: '2026-06-30', createdAt: NOW, updatedAt: NOW },
  ];

  const admissionContent: AdmissionContent = {
    id: 'adm-content-1',
    title: 'ভর্তির আবেদন ফরম ও নির্দেশিকা',
    academicSession: '২০২৭',
    admissionStatus: 'OPEN',
    showOnHomepage: true,
    bannerTitle: '২০২৭ শিক্ষাবর্ষে ৬ষ্ঠ থেকে ৯ম শ্রেণিতে ভর্তি চলছে',
    bannerSubtitle:
      'ভোজেশ্বর উচ্চ বিদ্যালয়ে নতুন শিক্ষাবর্ষের ভর্তি কার্যক্রম শুরু হয়েছে। অনলাইনে আবেদন সম্পন্ন করে আবেদন নম্বর ও প্রবেশপত্র সংগ্রহ করুন।',
    eligibleClasses: '৬ষ্ঠ–৯ম শ্রেণি (বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা)',
    schoolNameBn: 'ভোজেশ্বর উচ্চ বিদ্যালয়',
    schoolNameEn: 'BHOJESHWAR HIGH SCHOOL (BHS)',
    schoolCode: 'BHS',
    districtCode: '৩০',
    thanaCode: '২৪১',
    eiin: '113587',
    schoolAddress: 'ডাকঘর : ভোজেশ্বর, উপজেলা : নড়িয়া, জেলা : শরীয়তপুর। স্থাপিত : ১৯৭৮ খ্রি.',
    studentNameNotice: '০১. শিক্ষার্থীর নাম (বাংলা ও ইংরেজিতে)',
    fatherInfoNotice: '০২. পিতার নাম (বাংলা ও ইংরেজিতে), পেশা, পিতার এনআইডি নং',
    motherInfoNotice: '০৩. মাতার নাম (বাংলা ও ইংরেজিতে), পেশা, মাতার এনআইডি নং',
    addressInfoNotice: '০৪. বর্তমান ও স্থায়ী ঠিকানা (গ্রাম, ডাকঘর, পোস্ট কোড, উপজেলা, জেলা)',
    dobNotice: '০৫. শিক্ষার্থীর জন্ম তারিখ',
    birthCertificateNotice: '০৬. শিক্ষার্থীর ১৭ ডিজিটের ডিজিটাল জন্ম সনদ নং',
    religionNotice: '০৭. শিক্ষার্থীর ধর্ম',
    prevExamNotice: '০৮. পি.এস.সি / জে.এস.সি পাসের সন, রোল নম্বর, রেজিঃ নং, প্রাপ্ত জি.পি.এ.',
    prevSchoolNotice: '০৯. পূর্বে অধ্যয়নরত বিদ্যালয়ের নাম, শ্রেণি, শিক্ষাবর্ষ, প্রাপ্ত গ্রেড, জি.পি.এ. ও ঠিকানা',
    admissionTypeNotice: '১০. নতুন ভর্তি / পুনঃ ভর্তি (টিক চিহ্ন)',
    classesAndSections: '১১. ৬ষ্ঠ / ৭ম / ৮ম / ৯ম শ্রেণি : শাখা ক / খ / গ / ঘ, রোল নং',
    availableGroups: '১২. ৯ম শ্রেণির শাখা : বিজ্ঞান / মানবিক / ব্যবসায় শিক্ষা শাখা',
    optionalSubjects: '১৩. ৪র্থ বিষয় : উচ্চতর গণিত / কৃষি শিক্ষা / গার্হস্থ্য অর্থনীতি / কম্পিউটার শিক্ষা',
    declarationText:
      'আমি এই মর্মে অঙ্গীকার করিতেছি যে, আমার পুত্র / কন্যা / আত্মীয় অন্য কোন বিদ্যালয়ে ভর্তি হয় নাই। সে অত্র বিদ্যালয়ের সকল প্রকার বিধি-বিধান মানিয়া চলিতে বাধ্য থাকিবে এবং আমার উপরে বর্ণিত সকল তথ্যাবলী সঠিক।',
    admitCardNotice: 'ভর্তি পরীক্ষার প্রবেশপত্র (রোল নং, পরীক্ষার তারিখ, প্রধান শিক্ষকের স্বাক্ষর)',
    admissionTestDate: '2026-12-24',
    startDate: '2026-11-15',
    endDate: '2026-12-20',
    applicationFee: 200,
    helplinePhone: '01711-200201',
    formPdfUrl: '#official-admission-form',
    requiredDocuments: [
      'শিক্ষার্থীর ১৭ ডিজিটের ডিজিটাল জন্ম নিবন্ধন সনদের সত্যায়িত ফটোকপি',
      'পিতা ও মাতার জাতীয় পরিচয়পত্রের (NID) ফটোকপি',
      'শিক্ষার্থীর সদ্য তোলা ২ কপি পাসপোর্ট সাইজ ও ২ কপি স্ট্যাম্প সাইজ রঙিন ছবি',
      'পূর্ববর্তী বিদ্যালয়ের ছাড়পত্র (TC) ও সর্বশেষ পরীক্ষার নম্বরপত্র (৭ম–৯ম শ্রেণির জন্য)',
      'অভিভাবকের সচল বাংলাদেশি মোবাইল নম্বর (SMS নোটিফিকেশনের জন্য)',
    ],
    isPublished: true,
    createdAt: NOW,
    updatedAt: NOW,
  };

  const contactInfo: ContactInformation = {
    id: 'contact-1',
    address: 'ভোজেশ্বর উচ্চ বিদ্যালয়, ডাকঘর: ভোজেশ্বর (মশুরা), উপজেলা: নড়িয়া, জেলা: শরীয়তপুর।',
    phone: '+880 1711-200201',
    email: 'info@bhs.edu.bd',
    mapUrl: 'https://maps.google.com/?q=Bhojeshwar,Noria,Shariatpur,Bangladesh',
    createdAt: NOW,
    updatedAt: NOW,
  };


  return {
    schoolProfile,
    institutionContents,
    facilities,
    administrators,
    managingCommittee,
    quickLinks,
    admissionContent,
    contactInfo,
  };
}
