import {
  LibraryDistributionType,
  ResourceType,
} from '@/src/types/enums';
import type {
  DigitalClassroom,
  DigitalResource,
  LibraryBook,
  LibraryDistributionInfo,
  LibraryProfile,
} from '@/src/types/entities';
import type { LibraryLoanRecord } from '@/src/types/proposed/future';
import { NOW } from './common';

export function createLibraryFixtures() {
  // 10. Library & Digital Education
  const libraryProfile: LibraryProfile = {
    id: 'lib-1',
    title: 'ভোজেশ্বর উচ্চ বিদ্যালয় কেন্দ্রীয় গ্রন্থাগার',
    description:
      'শিক্ষার্থীদের পাঠাভ্যাস গড়ে তুলতে গ্রন্থাগারে রয়েছে সাহিত্য, মুক্তিযুদ্ধ, বিজ্ঞান, বিশ্বকোষ ও এনসিটিবি সহায়ক বইয়ের সমৃদ্ধ সংগ্রহ। বিদ্যালয় চলাকালীন সকাল ১০:৩০ থেকে বিকাল ৩:৩০ পর্যন্ত পাঠকক্ষ উন্মুক্ত থাকে।',
    updatedAt: NOW,
  };

  const libraryBooks: LibraryBook[] = [
    { id: 'lb-1', title: 'অসমাপ্ত আত্মজীবনী', author: 'বঙ্গবন্ধু শেখ মুজিবুর রহমান', publisher: 'ইউনিভার্সিটি প্রেস লিমিটেড', category: 'ইতিহাস ও জীবনী', description: 'বাংলাদেশের ইতিহাসের অমূল্য দলিল।', createdAt: NOW, updatedAt: NOW },
    { id: 'lb-2', title: 'বিজ্ঞান ও আমাদের পৃথিবী', author: 'ড. মুহম্মদ জাফর ইকবাল', publisher: 'তাম্রলিপি', category: 'বিজ্ঞান', description: 'মাধ্যমিক শিক্ষার্থীদের জন্য সহজবোধ্য বিজ্ঞান গ্রন্থ।', createdAt: NOW, updatedAt: NOW },
    { id: 'lb-3', title: 'সঞ্চিতা', author: 'কাজী নজরুল ইসলাম', publisher: 'বাংলা একাডেমি', category: 'সাহিত্য', description: 'জাতীয় কবির নির্বাচিত কবিতা সংকলন।', createdAt: NOW, updatedAt: NOW },
    { id: 'lb-4', title: 'অঙ্ক ভাইয়া', author: 'চমক হাসান', publisher: 'আদর্শ', category: 'গণিত', description: 'আনন্দে গণিত শেখার সহায়ক বই।', createdAt: NOW, updatedAt: NOW },
    { id: 'lb-5', title: 'গল্পগুচ্ছ', author: 'রবীন্দ্রনাথ ঠাকুর', publisher: 'বিশ্বভারতী', category: 'সাহিত্য', description: 'বিশ্বকবির কালজয়ী ছোটগল্প সমগ্র।', createdAt: NOW, updatedAt: NOW },
    { id: 'lb-6', title: 'Oxford Advanced Learner’s Dictionary', author: 'A. S. Hornby', publisher: 'Oxford University Press', category: 'রেফারেন্স', description: 'ইংরেজি ভাষা চর্চার প্রামাণ্য অভিধান।', createdAt: NOW, updatedAt: NOW },
    { id: 'lb-7', title: 'লালসালু', author: 'সৈয়দ ওয়ালীউল্লাহ', publisher: 'নওরোজ কিতাবিস্তান', category: 'সাহিত্য', description: 'বাংলা কথাসাহিত্যের অন্যতম কালজয়ী উপন্যাস।', createdAt: NOW, updatedAt: NOW },
    { id: 'lb-8', title: 'মুক্তিযুদ্ধের ইতিহাস', author: 'ড. মুহম্মদ জাফর ইকবাল', publisher: 'প্রতীতি', category: 'ইতিহাস ও জীবনী', description: 'শিক্ষার্থীদের জন্য ১৯৭১ সালের মহান মুক্তিযুদ্ধের সংক্ষিপ্ত প্রামাণ্য ইতিহাস।', createdAt: NOW, updatedAt: NOW },
    { id: 'lb-9', title: 'মাধ্যমিক ব্যবহারিক বিজ্ঞান নির্দেশিকা', author: 'ড. শাহজাহান তপন', publisher: 'হাসান বুক হাউস', category: 'বিজ্ঞান', description: 'পদার্থ ও রসায়ন ব্যবহারিক পরীক্ষার সহায়ক গ্রন্থ।', createdAt: NOW, updatedAt: NOW },
  ];

  const libraryDistributions: LibraryDistributionInfo[] = [
    { id: 'ld-1', type: LibraryDistributionType.TEXTBOOK_DISTRIBUTION, title: 'বিনামূল্যে পাঠ্যপুস্তক বিতরণ উৎসব ২০২৬', description: 'ষষ্ঠ থেকে দশম শ্রেণির সকল শিক্ষার্থীর মাঝে নতুন বছরের পাঠ্যবই বিতরণ সম্পন্ন হয়েছে।', distributionDate: '2026-01-01', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ld-2', type: LibraryDistributionType.BOOK_DISTRIBUTION, title: 'বইপড়া কর্মসূচি ও সহায়ক গ্রন্থ বিতরণ', description: 'বিশ্বসাহিত্য কেন্দ্রের সহযোগিতায় ষষ্ঠ থেকে নবম শ্রেণির পাঠকদের মাঝে গল্পের বই বিতরণ।', distributionDate: '2026-03-10', isPublished: true, createdAt: NOW, updatedAt: NOW },
  ];

  const digitalClassrooms: DigitalClassroom[] = [
    { id: 'dc-1', name: 'মাল্টিমিডিয়া স্মার্ট ক্লাসরুম – ০১', description: 'ইন্টারেক্টিভ প্রজেক্টর, সাউন্ড সিস্টেম ও ডিজিটাল হোয়াইটবোর্ড সমৃদ্ধ কক্ষ।', location: 'নতুন একাডেমিক ভবন, ২য় তলা', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'dc-2', name: 'আইসিটি ও কম্পিউটার ল্যাব', description: '২০টি আধুনিক ডেস্কটপ কম্পিউটার এবং ব্রডব্যান্ড ইন্টারনেট সংযোগ।', location: 'বিজ্ঞান ভবন, নিচতলা', isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  const digitalResources: DigitalResource[] = [
    { id: 'dr-1', academicYearId: 'ay-2026', title: 'ত্রিকোণমিতিক অনুপাত — অধ্যায় ৯ (স্মার্ট ক্লাস লেকচার)', description: 'নবম ও দশম শ্রেণির গণিতের ত্রিকোণমিতি অধ্যায়ের ধাপে ধাপে অনুশীলন।', resourceType: ResourceType.SMART_CLASS_VIDEO, subjectId: 'sub-math', classId: 'cls-10', url: 'https://teachers.gov.bd', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'dr-2', academicYearId: 'ay-2026', title: 'গতি ও বল — পদার্থবিজ্ঞান মাল্টিমিডিয়া স্লাইড', description: 'নিউটনের গতিসূত্র ও গাণিতিক সমস্যার সমাধান।', resourceType: ResourceType.MULTIMEDIA_CONTENT, subjectId: 'sub-phy', classId: 'cls-10', url: 'https://muktopaath.gov.bd', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'dr-3', academicYearId: 'ay-2026', title: 'English Grammar: Completing Sentences & Connectors', description: 'Interactive worksheet and recorded revision lecture for Class 9–10.', resourceType: ResourceType.EDUCATIONAL_VIDEO, subjectId: 'sub-eng', classId: 'cls-9', url: 'https://teachers.gov.bd', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'dr-4', academicYearId: 'ay-2026', title: 'ষষ্ঠ শ্রেণি — সংখ্যা ও ভগ্নাংশের খেলা', description: 'নতুন শিক্ষাক্রমভিত্তিক প্রাথমিক গণিত অনুশীলনী।', resourceType: ResourceType.ONLINE_CLASS_LINK, subjectId: 'sub-math', classId: 'cls-6', url: 'https://teachers.gov.bd', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'dr-5', academicYearId: 'ay-2026', title: 'সপ্তম শ্রেণি — উদ্ভিদ ও প্রাণীর কোষীয় সংগঠন', description: 'চিত্রসহ জীবকোষ পরিচিতি ও অনুশীলনীমূলক মাল্টিমিডিয়া প্রেজেন্টেশন।', resourceType: ResourceType.MULTIMEDIA_CONTENT, subjectId: 'sub-sci', classId: 'cls-7', url: 'https://teachers.gov.bd', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'dr-6', academicYearId: 'ay-2026', title: 'অষ্টম শ্রেণি — স্প্রেডশিট বিশ্লেষণ ও ডেটাবেস পরিচিতি', description: 'আইসিটি ল্যাব অনুশীলনের জন্য ধাপে ধাপে ভিডিও টিউটোরিয়াল।', resourceType: ResourceType.SMART_CLASS_VIDEO, subjectId: 'sub-ict', classId: 'cls-8', url: 'https://muktopaath.gov.bd', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'dr-7', academicYearId: 'ay-2026', title: 'হিসাববিজ্ঞান — জাবেদা ও খতিয়ান প্রস্তুত প্রণালি', description: 'ব্যবসায় শিক্ষা বিভাগের ৯ম-১০ম শ্রেণির শিক্ষার্থীদের জন্য অনুশীলন লেকচার।', resourceType: ResourceType.EDUCATIONAL_VIDEO, subjectId: 'sub-acc', classId: 'cls-9', url: 'https://teachers.gov.bd', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'dr-8', academicYearId: 'ay-2026', title: 'জীববিজ্ঞান — কোষ বিভাজন ও বংশগতি (অনলাইন ক্লাস)', description: 'চিত্রভিত্তিক ব্যাখ্যা ও সৃজনশীল প্রশ্নোত্তর আলোচনা।', resourceType: ResourceType.ONLINE_CLASS_LINK, subjectId: 'sub-bio', classId: 'cls-10', url: 'https://teachers.gov.bd', isPublished: true, createdAt: NOW, updatedAt: NOW },
  ];

  const libraryLoans: LibraryLoanRecord[] = [
    { id: 'loan-1', bookTitle: 'বিজ্ঞান ও আমাদের পৃথিবী', borrowerName: 'তানভীর আহমেদ (১০ম)', borrowerRole: 'STUDENT', issuedDate: '2026-11-10', dueDate: '2026-11-24', fineBdt: 0, status: 'ISSUED' },
    { id: 'loan-2', bookTitle: 'অসমাপ্ত আত্মজীবনী', borrowerName: 'অনন্যা সাহা (৯ম)', borrowerRole: 'STUDENT', issuedDate: '2026-10-28', dueDate: '2026-11-11', fineBdt: 20, status: 'OVERDUE' },
  ];


  return {
    libraryProfile,
    libraryBooks,
    libraryDistributions,
    digitalClassrooms,
    digitalResources,
    libraryLoans,
  };
}
