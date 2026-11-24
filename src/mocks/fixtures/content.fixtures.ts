import {
  AchievementType,
  EventCategoryType,
  LeadershipType,
  MediaType,
  PublicationType,
} from '@/src/types/enums';
import type {
  Achievement,
  Career,
  Event,
  EventCategory,
  Gallery,
  GalleryCategory,
  GalleryMedia,
  LeadershipMessage,
  News,
  Publication,
  WebsiteBanner,
} from '@/src/types/entities';
import { NOW } from './common';

export function createContentFixtures() {
  // 11. Notices, News, Events, Careers


  const news: News[] = [
    {
      id: 'news-1',
      title: 'উপজেলা পর্যায়ের বিজ্ঞান মেলায় শিক্ষার্থীদের সৌর সেচ প্রকল্পের প্রশংসা',
      description:
        'নড়িয়া উপজেলা বিজ্ঞান ও প্রযুক্তি মেলায় ভোজেশ্বর উচ্চ বিদ্যালয়ের বিজ্ঞান বিভাগের শিক্ষার্থীরা “নবায়নযোগ্য সৌর সেচ ও স্মার্ট পানি ব্যবস্থাপনা” প্রকল্প প্রদর্শন করে বিচারকদের বিশেষ প্রশংসা ও সেরা প্রদর্শনী সম্মাননা অর্জন করেছে।\n\nনবম ও দশম শ্রেণির শিক্ষার্থীদের যৌথ উদ্ভাবনে তৈরি এই মডেলে সৌরশক্তি ব্যবহার করে স্বয়ংক্রিয়ভাবে জমিতে সেচ প্রদানের কার্যকর পদ্ধতি উপস্থাপন করা হয়। প্রকল্প তত্ত্বাবধানে ছিলেন বিদ্যালয়ের বিজ্ঞান বিভাগের জ্যেষ্ঠ শিক্ষকবৃন্দ।\n\nপ্রধান শিক্ষক মোঃ শফিকুর রহমান অংশগ্রহণকারী শিক্ষার্থীদের অভিনন্দন জানিয়ে বলেন, হাতে-কলমে ব্যবহারিক বিজ্ঞান চর্চা শিক্ষার্থীদের সৃজনশীলতা ও বাস্তব সমস্যা সমাধানের দক্ষতা বৃদ্ধি করে।',
      image: '/images/news_science_fair_1795157433625.jpg',
      publishedAt: '2026-10-24T12:00:00.000Z',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'news-2',
      title: 'বিদ্যালয় প্রাঙ্গণে বৃক্ষরোপণ ও সবুজ ক্যাম্পাস সপ্তাহ উদযাপন',
      description:
        'সবুজ ও পরিবেশবান্ধব ক্যাম্পাস গড়ে তোলার লক্ষ্যে স্কাউটস, শিক্ষক ও শিক্ষার্থীদের স্বতঃস্ফূর্ত অংশগ্রহণে বিদ্যালয় প্রাঙ্গণের চারপাশে শতাধিক ফলজ, বনজ ও ঔষধি গাছের চারা রোপণ করা হয়েছে।\n\nকর্মসূচির উদ্বোধনী পর্বে পরিবেশের ভারসাম্য রক্ষায় বৃক্ষের ভূমিকা নিয়ে সংক্ষিপ্ত আলোচনা সভা অনুষ্ঠিত হয়। প্রতিটি শ্রেণির শিক্ষার্থীদের হাতে রোপণকৃত চারার নিয়মিত পরিচর্যার দায়িত্ব তুলে দেওয়া হয়েছে।',
      image: '/images/news_tree_plantation_1795157433367.jpg',
      publishedAt: '2026-09-18T10:00:00.000Z',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'news-3',
      title: 'আন্তঃবিদ্যালয় বিতর্ক ও পাঠাভ্যাস প্রতিযোগিতায় ভোজেশ্বর উচ্চ বিদ্যালয়ের সাফল্য',
      description:
        'নড়িয়া উপজেলা আন্তঃবিদ্যালয় বিতর্ক, কুইজ ও রচনা প্রতিযোগিতায় ভোজেশ্বর উচ্চ বিদ্যালয়ের শিক্ষার্থীরা চ্যাম্পিয়ন ও রানার-আপ হওয়ার গৌরব অর্জন করেছে।\n\nবিদ্যালয়ের সমৃদ্ধ পাঠাগার ও নিয়মিত বিতর্ক ক্লাবের অনুশীলনের ধারাবাহিকতায় শিক্ষার্থীরা যুক্তিনির্ভর উপস্থাপনা ও উপস্থিত বক্তৃতায় দক্ষতার স্বাক্ষর রেখেছে। বিজয়ীদের হাতে সনদ ও বই উপহার তুলে দেওয়া হয়।',
      image: '/images/hero_library_reading_1795136892122.jpg',
      publishedAt: '2026-08-22T09:00:00.000Z',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const eventCategories: EventCategory[] = [
    { id: 'ec-1', name: 'বার্ষিক ক্রীড়া', type: EventCategoryType.SPORTS, description: 'অ্যাথলেটিকস, ফুটবল ও ইনডোর গেমস' },
    { id: 'ec-2', name: 'বিজ্ঞান মেলা', type: EventCategoryType.SCIENCE_FAIR, description: 'শিক্ষার্থীদের বিজ্ঞান ও প্রযুক্তি উদ্ভাবন' },
    { id: 'ec-3', name: 'সাংস্কৃতিক অনুষ্ঠান', type: EventCategoryType.CULTURAL, description: 'কবিতা আবৃত্তি, সংগীত ও বার্ষিক পুরস্কার বিতরণী' },
    { id: 'ec-4', name: 'জাতীয় দিবস', type: EventCategoryType.NATIONAL_DAY, description: '২১ ফেব্রুয়ারি, ২৬ মার্চ ও ১৬ ডিসেম্বর উদযাপন' },
    { id: 'ec-5', name: 'বিতর্ক প্রতিযোগিতা', type: EventCategoryType.DEBATE, description: 'আন্তঃশ্রেণি ও উপজেলা বিতর্ক' },
  ];

  const events: Event[] = [
    {
      id: 'ev-3',
      categoryId: 'ec-2',
      title: 'আন্তঃশ্রেণি বিজ্ঞান ও গণিত অলিম্পিয়াড',
      description:
        'ষষ্ঠ থেকে দশম শ্রেণির শিক্ষার্থীদের অংশগ্রহণে সৃজনশীল বিজ্ঞান প্রকল্প প্রদর্শনী, গণিত অলিম্পিয়াড এবং কুইজ প্রতিযোগিতা।\n\nসকাল ১০:০০ ঘটিকায় বিজ্ঞান ভবন ও অডিটোরিয়ামে প্রদর্শনী শুরু হবে। অভিভাবক ও প্রাক্তন শিক্ষার্থীরা প্রদর্শনী পরিদর্শন করতে পারবেন।',
      startDate: '2026-12-12',
      endDate: '2026-12-12',
      image: '/images/news_science_fair_1795157433625.jpg',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ev-1',
      categoryId: 'ec-4',
      title: 'মহান বিজয় দিবস উদযাপন ও আলোচনা সভা',
      description:
        'যথাযোগ্য মর্যাদায় মহান বিজয় দিবস উদযাপন উপলক্ষে সূর্যোদয়ের সাথে সাথে জাতীয় পতাকা উত্তোলন, শহিদ মিনারে পুষ্পস্তবক অর্পণ, মুক্তিযুদ্ধভিত্তিক চিত্রাঙ্কন, রচনা ও দেশাত্মবোধক সংগীত অনুষ্ঠান।\n\nসকল শিক্ষার্থীকে সকাল ৮:৩০ ঘটিকার মধ্যে নির্ধারিত ইউনিফর্মে বিদ্যালয় প্রাঙ্গণে উপস্থিত থাকতে অনুরোধ করা হলো।',
      startDate: '2026-12-16',
      endDate: '2026-12-16',
      image: '/images/hero_campus_heritage_1795136893336.jpg',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ev-2',
      categoryId: 'ec-1',
      title: 'বার্ষিক ক্রীড়া ও পুরস্কার বিতরণী অনুষ্ঠান ২০২৭',
      description:
        'বিদ্যালয়ের বিশাল খেলার মাঠে দুই দিনব্যাপী কুচকাওয়াজ, দৌড়, লং জাম্প, উচ্চ লাফ, যেমন খুশি তেমন সাজো, শিক্ষক-অভিভাবক প্রীতি প্রতিযোগিতা ও বার্ষিক পুরস্কার বিতরণী অনুষ্ঠান।\n\nবিজয়ী ও কৃতি শিক্ষার্থীদের মাঝে সম্মাননা পদক ও সনদপত্র প্রদান করা হবে।',
      startDate: '2027-01-25',
      endDate: '2027-01-26',
      image: '/images/hero_sports_campus_1795136944347.jpg',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const careers: Career[] = [
    {
      id: 'car-1',
      title: 'খণ্ডকালীন সহকারী শিক্ষক (তথ্য ও যোগাযোগ প্রযুক্তি) নিয়োগ বিজ্ঞপ্তি',
      description:
        'ভোজেশ্বর উচ্চ বিদ্যালয়ের জন্য স্বীকৃত বিশ্ববিদ্যালয় থেকে সিএসই/আইসিটি বিষয়ে স্নাতক ডিগ্রিধারী একজন খণ্ডকালীন শিক্ষক নিয়োগ করা হবে। আগ্রহী প্রার্থীদের জীবনবৃত্তান্ত ও প্রয়োজনীয় সনদের সত্যায়িত কপিসহ প্রধান শিক্ষক বরাবর আবেদন করতে অনুরোধ করা হলো।',
      circularFile: 'ict-teacher-circular-2026.pdf',
      deadline: '2026-12-15',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  // 12. Website CMS Entities
  const banners: WebsiteBanner[] = [
    {
      id: 'ban-1',
      title: '১৯৭৮ সাল থেকে শিক্ষার আলো ছড়াচ্ছে ভোজেশ্বর উচ্চ বিদ্যালয়',
      subtitle: 'ভোজেশ্বর, নড়িয়া, শরীয়তপুর — ঐতিহ্য, নৈতিক শৃঙ্খলা এবং আধুনিক ডিজিটাল শিক্ষাব্যবস্থার অনন্য সমন্বয়।',
      image: 'campus-heritage',
      link: '/about',
      sortOrder: 1,
      isActive: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ban-2',
      title: 'ডিজিটাল ফলাফল, স্মার্ট হাজিরা ও সমন্বিত অভিভাবক পোর্টাল',
      subtitle: 'অনলাইনে তাৎক্ষণিক পরীক্ষার ফলাফল, শ্রেণি রুটিন ও শিক্ষার্থীর অগ্রগতি জানুন যেকোনো সময়।',
      image: 'digital-classroom',
      link: '/results',
      sortOrder: 2,
      isActive: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const leadershipMessages: LeadershipMessage[] = [
    {
      id: 'lm-1',
      personName: 'মোঃ শফিকুর রহমান',
      designation: 'প্রধান শিক্ষক, ভোজেশ্বর উচ্চ বিদ্যালয়',
      photo: '/images/headteacher_clean_portrait_1795154685112.jpg',
      message:
        '“শিক্ষাই আলো, জ্ঞানই শক্তি” — এই মূলমন্ত্রকে ধারণ করে ১৯৭৮ সাল থেকে ভোজেশ্বর উচ্চ বিদ্যালয় নড়িয়া অঞ্চলের শিক্ষার্থীদের আলোকিত, নৈতিক ও দক্ষ মানুষ হিসেবে গড়ে তুলছে। দীর্ঘ চার দশকেরও বেশি সময় ধরে আমাদের প্রাক্তন শিক্ষার্থীরা দেশ-বিদেশের বিভিন্ন গুরুত্বপূর্ণ ক্ষেত্রে সুনামের সাথে অবদান রেখে চলেছেন।\n\nআধুনিক তথ্যপ্রযুক্তির এই যুগে কেবল পাঠ্যবইনির্ভর শিক্ষা যথেষ্ট নয়; তাই আমরা নিয়মিত শ্রেণি পাঠদানের পাশাপাশি বিজ্ঞান ও আইসিটি ল্যাবে ব্যবহারিক শিক্ষা, সমৃদ্ধ পাঠাগার চর্চা, বিতর্ক, স্কাউটিং এবং ক্রীড়া কার্যক্রমে সমান গুরুত্ব দিয়ে থাকি। আমাদের অভিজ্ঞ ও নিবেদিতপ্রাণ শিক্ষকমণ্ডলী প্রতিটি শিক্ষার্থীর মেধা ও সৃজনশীলতা বিকাশে নিরলসভাবে কাজ করে যাচ্ছেন।\n\nঅভিভাবকদের সচেতন সহযোগিতা এবং বিদ্যালয়ের এই আধুনিক ডিজিটাল প্ল্যাটফর্মের মাধ্যমে হাজিরা, পরীক্ষার ফলাফল ও প্রাতিষ্ঠানিক যোগাযোগ আরও স্বচ্ছ ও গতিশীল হবে বলে আমার দৃঢ় বিশ্বাস। আসুন, সম্মিলিত প্রচেষ্টায় আমাদের সন্তানদের উজ্জ্বল ভবিষ্যৎ গড়ে তুলি।',
      type: LeadershipType.PRINCIPAL,
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'lm-2',
      personName: 'আলহাজ্ব মোঃ নুরুল আমিন',
      designation: 'সভাপতি, বিদ্যালয় ম্যানেজিং কমিটি',
      photo: '/images/chairman_portrait_1795154662402.jpg',
      message:
        'ভোজেশ্বর উচ্চ বিদ্যালয় কেবল একটি শিক্ষা প্রতিষ্ঠান নয়, এটি নড়িয়া ও শরীয়তপুর অঞ্চলের মানুষের গর্ব, ঐতিহ্য এবং আলোকিত সমাজ নির্মাণের অন্যতম কেন্দ্র। ১৯৭৮ সালে এলাকার শিক্ষানুরাগী ব্যক্তিবর্গের হাত ধরে যে মহৎ যাত্রা শুরু হয়েছিল, তা আজ হাজারো শিক্ষার্থীর স্বপ্ন পূরণের সোপানে পরিণত হয়েছে।\n\nবিদ্যালয়ের শিক্ষার মানোন্নয়ন, আধুনিক শ্রেণিকক্ষ ও অবকাঠামোগত উন্নয়ন, এবং শিক্ষার্থীদের জন্য একটি নিরাপদ, শৃঙ্খলাপূর্ণ ও আনন্দময় শিক্ষার পরিবেশ নিশ্চিত করতে ম্যানেজিং কমিটি সর্বদা অঙ্গীকারবদ্ধ। ডিজিটাল শিক্ষা সেবা, স্বচ্ছ প্রশাসনিক ব্যবস্থা এবং বিজ্ঞানমনস্ক পাঠদানের প্রসারে আমরা নিরবচ্ছিন্ন সহায়তা প্রদান করে যাচ্ছি।\n\nশিক্ষক, শিক্ষার্থী, অভিভাবক, প্রাক্তন ছাত্র-ছাত্রী ও এলাকার সর্বস্তরের সুধীজনের সম্মিলিত প্রচেষ্টায় ভোজেশ্বর উচ্চ বিদ্যালয় শরীয়তপুর জেলার একটি অনুকরণীয় আদর্শ শিক্ষা প্রতিষ্ঠানে পরিণত হবে — এই আমার একান্ত প্রত্যাশা।',
      type: LeadershipType.CHAIRMAN,
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const galleryCategories: GalleryCategory[] = [
    { id: 'gcat-1', name: 'ক্যাম্পাস', description: 'বিদ্যালয় প্রাঙ্গণ, ভবন ও প্রাত্যহিক সমাবেশ', isActive: true, sortOrder: 1, createdAt: NOW, updatedAt: NOW },
    { id: 'gcat-2', name: 'বিজ্ঞান মেলা', description: 'বিজ্ঞান ও প্রযুক্তি প্রদর্শনী এবং গবেষণাগার কার্যক্রম', isActive: true, sortOrder: 2, createdAt: NOW, updatedAt: NOW },
    { id: 'gcat-3', name: 'ক্রীড়া ও সংস্কৃতি', description: 'বার্ষিক ক্রীড়া, বিতর্ক ও সাংস্কৃতিক আয়োজন', isActive: true, sortOrder: 3, createdAt: NOW, updatedAt: NOW },
    { id: 'gcat-4', name: 'জাতীয় দিবস', description: 'স্বাধীনতা দিবস, বিজয় দিবস ও একুশে ফেব্রুয়ারি উদযাপন', isActive: true, sortOrder: 4, createdAt: NOW, updatedAt: NOW },
    { id: 'gcat-5', name: 'পাঠাগার ও ল্যাব', description: 'গ্রন্থাগার, স্মার্ট শ্রেণিকক্ষ ও আইসিটি ল্যাব', isActive: true, sortOrder: 5, createdAt: NOW, updatedAt: NOW },
  ];

  const galleries: Gallery[] = [
    { id: 'gal-1', title: 'বিদ্যালয় ক্যাম্পাস ও প্রাত্যহিক সমাবেশ', description: 'শতবর্ষী বিদ্যালয় প্রাঙ্গণ, একাডেমিক ভবন ও শিক্ষার্থীদের সমাবেশ।', category: 'ক্যাম্পাস', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'gal-2', title: 'বিজ্ঞান মেলা ও প্রজেক্ট প্রদর্শনী ২০২৬', description: 'নবম ও দশম শ্রেণির শিক্ষার্থীদের উদ্ভাবনী বিজ্ঞান প্রকল্প।', category: 'বিজ্ঞান মেলা', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'gal-3', title: 'বার্ষিক ক্রীড়া ও সাংস্কৃতিক অনুষ্ঠান', description: 'মাঠের ক্রীড়া প্রতিযোগিতা ও পুরস্কার বিতরণী মুহূর্ত।', category: 'ক্রীড়া ও সংস্কৃতি', isPublished: true, createdAt: NOW, updatedAt: NOW },
  ];

  const galleryMedia: GalleryMedia[] = [
    { id: 'gm-1', galleryId: 'gal-1', mediaUrl: 'campus-heritage', mediaType: MediaType.IMAGE, caption: 'মূল একাডেমিক ভবন ও খেলার মাঠ', sortOrder: 1, createdAt: NOW },
    { id: 'gm-2', galleryId: 'gal-1', mediaUrl: 'library-room', mediaType: MediaType.IMAGE, caption: 'বিদ্যালয়ের সমৃদ্ধ গ্রন্থাগার ও পাঠকক্ষ', sortOrder: 2, createdAt: NOW },
    { id: 'gm-3', galleryId: 'gal-2', mediaUrl: 'science-lab', mediaType: MediaType.IMAGE, caption: 'পদার্থ ও রসায়ন গবেষণাগারে ব্যবহারিক ক্লাস', sortOrder: 1, createdAt: NOW },
    { id: 'gm-4', galleryId: 'gal-3', mediaUrl: 'sports-day', mediaType: MediaType.IMAGE, caption: 'বার্ষিক ক্রীড়া ও সাংস্কৃতিক উৎসব', sortOrder: 1, createdAt: NOW },
  ];

  // Official DBML default AdmissionContent verbatim!
  const publications: Publication[] = [
    { id: 'pub-1', title: 'আলোকবর্তিকা — ভোজেশ্বর উচ্চ বিদ্যালয় বার্ষিক ম্যাগাজিন ২০২৬', type: PublicationType.SCHOOL_MAGAZINE, description: 'শিক্ষার্থীদের কবিতা, গল্প, প্রবন্ধ ও বিদ্যালয়ের বার্ষিক কার্যক্রমের সচিত্র সংকলন।', publishYear: 2026, fileUrl: '#alokbortika-2026', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'pub-2', title: 'একুশের দেয়ালিকা — ভাষা ও সংস্কৃতি সংখ্যা', type: PublicationType.WALL_MAGAZINE, description: 'মহান শহীদ দিবস উপলক্ষে শিক্ষার্থীদের স্বহস্তে রচিত দেয়াল পত্রিকা।', publishYear: 2026, fileUrl: '#wall-mag-2026', isPublished: true, createdAt: NOW, updatedAt: NOW },
  ];

  const achievements: Achievement[] = [
    {
      id: 'ach-1',
      title: 'গৌরবময় শিক্ষাসেবার ৪৮+ বছর (১৯৭৮–২০২৬)',
      type: AchievementType.INSTITUTION_ACHIEVEMENT,
      description: 'নড়িয়া উপজেলার ভোজেশ্বরের অন্যতম সুনামধন্য মাধ্যমিক বিদ্যালয় হিসেবে ধারাবাহিক সাফল্যের পথচলা। (অফিসিয়াল আর্কাইভ থেকে কনফিগারযোগ্য)',
      achievedAt: '2026-01-01',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ach-star-1',
      title: 'এসএসসি পরীক্ষায় গোল্ডেন জিপিএ ৫.০০ ও বোর্ড মেধা বৃত্তি',
      type: AchievementType.STUDENT_STAR,
      personName: 'তানভীর হাসান',
      batch: 'ব্যাচ ২০২৪',
      description: 'ঢাকা শিক্ষা বোর্ডে মেধা তালিকায় স্থান অর্জন এবং নড়িয়া উপজেলায় বিজ্ঞান বিভাগে সর্বোচ্চ নম্বর প্রাপ্তি। বর্তমানে নটর ডেম কলেজে একাদশ শ্রেণিতে অধ্যয়নরত।',
      image: '/images/teacher_kamrul_portrait_1795155721415.jpg',
      achievedAt: '2024-05-12',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ach-star-2',
      title: 'জাতীয় বিজ্ঞান অলিম্পিয়াড ও ইনোভেশন ফেয়ারে প্রথম স্থান',
      type: AchievementType.STUDENT_STAR,
      personName: 'সাদিয়া তাসনিম',
      batch: 'ব্যাচ ২০২৫',
      description: 'স্মার্ট স্কুল এনার্জি ম্যানেজমেন্ট প্রজেক্ট উপস্থাপন করে জেলা পর্যায়ে প্রথম ও জাতীয় পর্যায়ে পদক অর্জন।',
      image: '/images/teacher_sabina_portrait_1795155721585.jpg',
      achievedAt: '2025-09-18',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ach-alumni-1',
      title: 'অধ্যাপক ও গবেষক, বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (বুয়েট)',
      type: AchievementType.NOTABLE_ALUMNI,
      personName: 'ড. রফিকুল ইসলাম',
      batch: 'ব্যাচ ১৯৯৬',
      description: 'নবায়নযোগ্য শক্তি প্রযুক্তিতে আন্তর্জাতিক গবেষক ও বিদ্যালয়ের আধুনিক বিজ্ঞান ল্যাব প্রতিষ্ঠার সম্মানিত পৃষ্ঠপোষক।',
      image: '/images/teacher_debashish_portrait_1795155721385.jpg',
      achievedAt: '2023-11-05',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ach-alumni-2',
      title: 'সিনিয়র সহকারী সচিব, জনপ্রশাসন মন্ত্রণালয় (৩৬তম বিসিএস)',
      type: AchievementType.NOTABLE_ALUMNI,
      personName: 'ফারহানা ইয়াসমিন',
      batch: 'ব্যাচ ২০০৬',
      description: '৩৬তম বিসিএস (প্রশাসন) ক্যাডারে কৃতিত্বের সাথে উত্তীর্ণ হয়ে নিষ্ঠার সাথে দেশসেবায় নিয়োজিত ও নারী শিক্ষার অনুপ্রেরণা।',
      image: '/images/teacher_anupama_portrait_1795155720897.jpg',
      achievedAt: '2022-07-15',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ach-alumni-3',
      title: 'চিফ সফটওয়্যার আর্কিটেক্ট ও টেক এন্টারপ্রেনার',
      type: AchievementType.NOTABLE_ALUMNI,
      personName: 'মাহমুদুল হাসান',
      batch: 'ব্যাচ ২০০১',
      description: 'আন্তর্জাতিক ফিনটেক প্ল্যাটফর্মের শীর্ষ প্রকৌশলী এবং বিদ্যালয়ের আইসিটি ল্যাব ও শিক্ষার্থীদের কোডিং ক্লাবের নিয়মিত পৃষ্ঠপোষক।',
      image: '/images/teacher_mahmudul_portrait_1795155721712.jpg',
      achievedAt: '2024-02-10',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ach-star-3',
      title: 'জাতীয় আন্তঃস্কুল বিতর্ক প্রতিযোগিতায় চ্যাম্পিয়ন ও সেরা বক্তা',
      type: AchievementType.STUDENT_STAR,
      personName: 'নুসরাত জাহান',
      batch: 'ব্যাচ ২০২৩',
      description: 'জাতীয় টেলিভিশন বিতর্ক প্রতিযোগিতায় ঢাকা বিভাগের চ্যাম্পিয়ন এবং এসএসসিতে গোল্ডেন জিপিএ ৫.০০ প্রাপ্ত কৃতি শিক্ষার্থী।',
      image: '/images/committee_rehana_portrait_1795170999363.jpg',
      achievedAt: '2023-08-20',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'ach-2',
      title: 'উপজেলা বিজ্ঞান মেলা অংশগ্রহণ সম্মাননা',
      type: AchievementType.STUDENT_STAR,
      personName: 'বিজ্ঞান ক্লাব দল (ভোজেশ্বর)',
      batch: 'ব্যাচ ২০২৬',
      description: 'অভিভাবক ও শিক্ষার্থীর সম্মতি সাপেক্ষে কৃতী শিক্ষার্থীদের মেধা তালিকা ও সাফল্যগাথা এখানে নিয়মিত হালনাগাদ করা হয়।',
      achievedAt: '2026-10-24',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];


  return {
    news,
    eventCategories,
    events,
    careers,
    banners,
    leadershipMessages,
    galleryCategories,
    galleries,
    galleryMedia,
    publications,
    achievements,
  };
}
