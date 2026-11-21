// Bangla + English labels and semantic metadata for all 36 DBML Enums

export type SemanticTone = 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'destructive';

export interface EnumMeta {
  bn: string;
  en: string;
  tone?: SemanticTone;
}

export const ENUM_LABELS: Record<string, Record<string, EnumMeta>> = {
  AcademicDocumentType: {
    CURRICULUM: { bn: 'পাঠ্যক্রম', en: 'Curriculum', tone: 'primary' },
    STUDENT_RULES: { bn: 'শিক্ষার্থীর নিয়মাবলি', en: 'Student Rules', tone: 'info' },
    PARENT_GUIDELINES: { bn: 'অভিভাবক নির্দেশিকা', en: 'Parent Guidelines', tone: 'info' },
    DRESS_CODE: { bn: 'পোশাক বিধি', en: 'Dress Code', tone: 'neutral' },
  },
  AcademicEventType: {
    HOLIDAY: { bn: 'সরকারি ছুটি', en: 'Holiday', tone: 'destructive' },
    EVENT: { bn: 'বিদ্যালয় অনুষ্ঠান', en: 'School Event', tone: 'primary' },
    ADMISSION: { bn: 'ভর্তি কার্যক্রম', en: 'Admission', tone: 'success' },
    OTHER: { bn: 'অন্যান্য', en: 'Other', tone: 'neutral' },
  },
  AchievementType: {
    INSTITUTION_ACHIEVEMENT: { bn: 'প্রাতিষ্ঠানিক অর্জন', en: 'Institution Achievement', tone: 'primary' },
    STUDENT_STAR: { bn: 'কৃতী শিক্ষার্থী', en: 'Student Star', tone: 'success' },
    NOTABLE_ALUMNI: { bn: 'কৃতি প্রাক্তন শিক্ষার্থী', en: 'Notable Alumni', tone: 'info' },
  },
  AttendanceMethod: {
    MANUAL: { bn: 'ম্যানুয়াল', en: 'Manual', tone: 'neutral' },
    RFID: { bn: 'আরএফআইডি (RFID)', en: 'RFID', tone: 'info' },
    BIOMETRIC: { bn: 'বায়োমেট্রিক', en: 'Biometric', tone: 'primary' },
  },
  AttendanceSmsType: {
    ENTRY: { bn: 'প্রবেশ', en: 'Entry', tone: 'success' },
    EXIT: { bn: 'প্রস্থান', en: 'Exit', tone: 'info' },
    ABSENT: { bn: 'অনুপস্থিতি', en: 'Absent', tone: 'destructive' },
  },
  AttendanceStatus: {
    PRESENT: { bn: 'উপস্থিত', en: 'Present', tone: 'success' },
    ABSENT: { bn: 'অনুপস্থিত', en: 'Absent', tone: 'destructive' },
    LATE: { bn: 'বিলম্বিত', en: 'Late', tone: 'warning' },
    LEAVE: { bn: 'ছুটি', en: 'Leave', tone: 'info' },
  },
  BloodGroup: {
    A_POSITIVE: { bn: 'A+', en: 'A+' },
    A_NEGATIVE: { bn: 'A-', en: 'A-' },
    B_POSITIVE: { bn: 'B+', en: 'B+' },
    B_NEGATIVE: { bn: 'B-', en: 'B-' },
    O_POSITIVE: { bn: 'O+', en: 'O+' },
    O_NEGATIVE: { bn: 'O-', en: 'O-' },
    AB_POSITIVE: { bn: 'AB+', en: 'AB+' },
    AB_NEGATIVE: { bn: 'AB-', en: 'AB-' },
  },
  BookType: {
    TEXTBOOK: { bn: 'পাঠ্যবই', en: 'Textbook', tone: 'primary' },
    SUPPLEMENTARY: { bn: 'সহায়ক বই', en: 'Supplementary', tone: 'info' },
    GRAMMAR: { bn: 'ব্যাকরণ', en: 'Grammar', tone: 'neutral' },
    REFERENCE: { bn: 'রেফারেন্স', en: 'Reference', tone: 'neutral' },
  },
  CardStatus: {
    ACTIVE: { bn: 'সক্রিয়', en: 'Active', tone: 'success' },
    LOST: { bn: 'হারানো', en: 'Lost', tone: 'warning' },
    DAMAGED: { bn: 'ক্ষতিগ্রস্ত', en: 'Damaged', tone: 'warning' },
    BLOCKED: { bn: 'ব্লককৃত', en: 'Blocked', tone: 'destructive' },
  },
  DepartmentStatus: {
    ACTIVE: { bn: 'সক্রিয়', en: 'Active', tone: 'success' },
    INACTIVE: { bn: 'নিষ্ক্রিয়', en: 'Inactive', tone: 'neutral' },
  },
  EmploymentType: {
    PERMANENT: { bn: 'স্থায়ী', en: 'Permanent', tone: 'success' },
    PROBATIONARY: { bn: 'শিক্ষানবিশ', en: 'Probationary', tone: 'warning' },
    CONTRACTUAL: { bn: 'চুক্তিভিত্তিক', en: 'Contractual', tone: 'info' },
    PART_TIME: { bn: 'খণ্ডকালীন', en: 'Part-Time', tone: 'neutral' },
  },
  EnrollmentStatus: {
    ACTIVE: { bn: 'অধ্যয়নরত', en: 'Active', tone: 'success' },
    PROMOTED: { bn: 'উত্তীর্ণ', en: 'Promoted', tone: 'primary' },
    TRANSFERRED: { bn: 'বদলি / টিসি', en: 'Transferred', tone: 'warning' },
    COMPLETED: { bn: 'সম্পন্ন', en: 'Completed', tone: 'info' },
  },
  EventCategoryType: {
    SPORTS: { bn: 'ক্রীড়া', en: 'Sports', tone: 'success' },
    DEBATE: { bn: 'বিতর্ক', en: 'Debate', tone: 'primary' },
    SCIENCE_FAIR: { bn: 'বিজ্ঞান মেলা', en: 'Science Fair', tone: 'info' },
    CULTURAL: { bn: 'সাংস্কৃতিক', en: 'Cultural', tone: 'primary' },
    SCOUTS: { bn: 'স্কাউটস', en: 'Scouts', tone: 'success' },
    GIRL_GUIDES: { bn: 'গার্ল গাইডস', en: 'Girl Guides', tone: 'info' },
    TREE_PLANTATION: { bn: 'বৃক্ষরোপণ', en: 'Tree Plantation', tone: 'success' },
    NATIONAL_DAY: { bn: 'জাতীয় দিবস', en: 'National Day', tone: 'destructive' },
    OTHER: { bn: 'অন্যান্য', en: 'Other', tone: 'neutral' },
  },
  ExamRoutineStatus: {
    SCHEDULED: { bn: 'নির্ধারিত', en: 'Scheduled', tone: 'info' },
    POSTPONED: { bn: 'স্থগিত', en: 'Postponed', tone: 'warning' },
    CANCELLED: { bn: 'বাতিল', en: 'Cancelled', tone: 'destructive' },
    COMPLETED: { bn: 'সম্পন্ন', en: 'Completed', tone: 'success' },
  },
  ExamStatus: {
    UPCOMING: { bn: 'আসন্ন', en: 'Upcoming', tone: 'info' },
    ONGOING: { bn: 'চলমান', en: 'Ongoing', tone: 'warning' },
    COMPLETED: { bn: 'সম্পন্ন', en: 'Completed', tone: 'success' },
    CANCELLED: { bn: 'বাতিল', en: 'Cancelled', tone: 'destructive' },
  },
  ExamType: {
    HALF_YEARLY: { bn: 'অর্ধবার্ষিক', en: 'Half-Yearly', tone: 'primary' },
    ANNUAL: { bn: 'বার্ষিক', en: 'Annual', tone: 'primary' },
    MODEL_TEST: { bn: 'মডেল টেস্ট', en: 'Model Test', tone: 'info' },
    SELECTION: { bn: 'নির্বাচনি পরীক্ষা', en: 'Selection Exam', tone: 'warning' },
    CONSOLIDATED: { bn: 'সমন্বিত ফলাফল', en: 'Consolidated', tone: 'success' },
  },
  FacilityType: {
    LAB: { bn: 'বিজ্ঞানাগার ও ল্যাব', en: 'Laboratory', tone: 'info' },
    LIBRARY: { bn: 'গ্রন্থাগার', en: 'Library', tone: 'primary' },
    PLAYGROUND: { bn: 'খেলার মাঠ', en: 'Playground', tone: 'success' },
    MULTIMEDIA: { bn: 'মাল্টিমিডিয়া শ্রেণিকক্ষ', en: 'Multimedia', tone: 'info' },
    OTHER: { bn: 'অন্যান্য সুবিধা', en: 'Other Facility', tone: 'neutral' },
  },
  Gender: {
    MALE: { bn: 'ছাত্র / পুরুষ', en: 'Male' },
    FEMALE: { bn: 'ছাত্রী / নারী', en: 'Female' },
    OTHER: { bn: 'অন্যান্য', en: 'Other' },
  },
  InstitutionContentType: {
    HISTORY: { bn: 'ইতিহাস', en: 'History' },
    TRADITION: { bn: 'ঐতিহ্য', en: 'Tradition' },
    INFRASTRUCTURE: { bn: 'অবকাঠামো', en: 'Infrastructure' },
    INTRODUCTION: { bn: 'পরিচিতি', en: 'Introduction' },
  },
  LeadershipType: {
    PRINCIPAL: { bn: 'প্রধান শিক্ষক', en: 'Head Teacher / Principal' },
    CHAIRMAN: { bn: 'সভাপতি, ম্যানেজিং কমিটি', en: 'Chairman, Managing Committee' },
  },
  LibraryDistributionType: {
    BOOK_DISTRIBUTION: { bn: 'বই বিতরণ', en: 'Book Distribution', tone: 'primary' },
    TEXTBOOK_DISTRIBUTION: { bn: 'পাঠ্যপুস্তক উৎসব', en: 'Textbook Distribution', tone: 'success' },
    OTHER: { bn: 'অন্যান্য', en: 'Other', tone: 'neutral' },
  },
  MediaType: {
    IMAGE: { bn: 'ছবি', en: 'Image', tone: 'info' },
    VIDEO: { bn: 'ভিডিও', en: 'Video', tone: 'primary' },
  },
  NoticeStatus: {
    DRAFT: { bn: 'খসড়া', en: 'Draft', tone: 'warning' },
    PUBLISHED: { bn: 'প্রকাশিত', en: 'Published', tone: 'success' },
    ARCHIVED: { bn: 'আর্কাইভ', en: 'Archived', tone: 'neutral' },
  },
  PromotionType: {
    PROMOTED: { bn: 'উত্তীর্ণ', en: 'Promoted', tone: 'success' },
    RETAINED: { bn: 'অপরিবর্তিত', en: 'Retained', tone: 'warning' },
    DOUBLE_PROMOTED: { bn: 'দ্বৈত উত্তীর্ণ', en: 'Double Promoted', tone: 'primary' },
  },
  PublicationType: {
    SCHOOL_MAGAZINE: { bn: 'বিদ্যালয় ম্যাগাজিন', en: 'School Magazine', tone: 'primary' },
    WALL_MAGAZINE: { bn: 'দেয়াল পত্রিকা', en: 'Wall Magazine', tone: 'info' },
    JOURNAL: { bn: 'জার্নাল', en: 'Journal', tone: 'neutral' },
    OTHER: { bn: 'অন্যান্য প্রকাশনা', en: 'Other', tone: 'neutral' },
  },
  RelationshipType: {
    FATHER: { bn: 'পিতা', en: 'Father' },
    MOTHER: { bn: 'মাতা', en: 'Mother' },
    GUARDIAN: { bn: 'অভিভাবক', en: 'Guardian' },
    OTHER: { bn: 'অন্যান্য', en: 'Other' },
  },
  Religion: {
    ISLAM: { bn: 'ইসলাম', en: 'Islam' },
    HINDUISM: { bn: 'হিন্দু', en: 'Hinduism' },
    BUDDHISM: { bn: 'বৌদ্ধ', en: 'Buddhism' },
    CHRISTIANITY: { bn: 'খ্রিস্টান', en: 'Christianity' },
    OTHER: { bn: 'অন্যান্য', en: 'Other' },
  },
  ResourceType: {
    SMART_CLASS_VIDEO: { bn: 'স্মার্ট ক্লাস ভিডিও', en: 'Smart Class Video', tone: 'primary' },
    ONLINE_CLASS_LINK: { bn: 'অনলাইন ক্লাস লিংক', en: 'Online Class Link', tone: 'info' },
    EDUCATIONAL_VIDEO: { bn: 'শিক্ষামূলক ভিডিও', en: 'Educational Video', tone: 'success' },
    MULTIMEDIA_CONTENT: { bn: 'মাল্টিমিডিয়া কন্টেন্ট', en: 'Multimedia Content', tone: 'warning' },
  },
  ResultPublicationStatus: {
    DRAFT: { bn: 'খসড়া (অপ্রকাশিত)', en: 'Draft', tone: 'warning' },
    PUBLISHED: { bn: 'প্রকাশিত', en: 'Published', tone: 'success' },
    WITHHELD: { bn: 'স্থগিত (Withheld)', en: 'Withheld', tone: 'destructive' },
  },
  ResultStatus: {
    PASS: { bn: 'উত্তীর্ণ (PASS)', en: 'PASS', tone: 'success' },
    FAIL: { bn: 'অনুত্তীর্ণ (FAIL)', en: 'FAIL', tone: 'destructive' },
    INCOMPLETE: { bn: 'অসম্পূর্ণ', en: 'INCOMPLETE', tone: 'warning' },
  },
  SmsStatus: {
    PENDING: { bn: 'অপেক্ষমাণ', en: 'Pending', tone: 'warning' },
    SENT: { bn: 'প্রেরিত', en: 'Sent', tone: 'success' },
    FAILED: { bn: 'ব্যর্থ', en: 'Failed', tone: 'destructive' },
  },
  StaffStatus: {
    ACTIVE: { bn: 'কর্মরত', en: 'Active', tone: 'success' },
    RESIGNED: { bn: 'পদত্যাগ', en: 'Resigned', tone: 'warning' },
    RETIRED: { bn: 'অবসরপ্রাপ্ত', en: 'Retired', tone: 'neutral' },
    TERMINATED: { bn: 'অব্যাহতিপ্রাপ্ত', en: 'Terminated', tone: 'destructive' },
  },
  StaffType: {
    TEACHER: { bn: 'শিক্ষক', en: 'Teacher', tone: 'primary' },
    OFFICER: { bn: 'কর্মকর্তা', en: 'Officer', tone: 'info' },
    EMPLOYEE: { bn: 'কর্মচারী', en: 'Employee', tone: 'neutral' },
  },
  StudentStatus: {
    ACTIVE: { bn: 'সক্রিয়', en: 'Active', tone: 'success' },
    INACTIVE: { bn: 'নিষ্ক্রিয়', en: 'Inactive', tone: 'neutral' },
    GRADUATED: { bn: 'উত্তীর্ণ (প্রাক্তন)', en: 'Graduated', tone: 'primary' },
    TRANSFERRED: { bn: 'বদলিকৃত (টিসি)', en: 'Transferred', tone: 'warning' },
  },
  SubjectCategory: {
    GENERAL: { bn: 'সাধারণ', en: 'General' },
    LANGUAGE: { bn: 'ভাষা', en: 'Language' },
    MATHEMATICS: { bn: 'গণিত', en: 'Mathematics' },
    SCIENCE: { bn: 'বিজ্ঞান', en: 'Science' },
    SOCIAL_SCIENCE: { bn: 'সমাজবিজ্ঞান', en: 'Social Science' },
    RELIGION: { bn: 'ধর্ম ও নৈতিক শিক্ষা', en: 'Religion' },
    COMMERCE: { bn: 'ব্যবসায় শিক্ষা', en: 'Business Studies' },
    TECHNICAL: { bn: 'তথ্য ও কারিগরি', en: 'Technical / ICT' },
  },
  WeekDay: {
    SATURDAY: { bn: 'শনিবার', en: 'Saturday' },
    SUNDAY: { bn: 'রবিবার', en: 'Sunday' },
    MONDAY: { bn: 'সোমবার', en: 'Monday' },
    TUESDAY: { bn: 'মঙ্গলবার', en: 'Tuesday' },
    WEDNESDAY: { bn: 'বুধবার', en: 'Wednesday' },
    THURSDAY: { bn: 'বৃহস্পতিবার', en: 'Thursday' },
    FRIDAY: { bn: 'শুক্রবার', en: 'Friday' },
  },
  AdmissionApplicationStatus: {
    NEW: { bn: 'নতুন আবেদন', en: 'New', tone: 'info' },
    UNDER_REVIEW: { bn: 'পর্যালোচনাধীন', en: 'Under Review', tone: 'warning' },
    APPROVED: { bn: 'অনুমোদিত', en: 'Approved', tone: 'primary' },
    REJECTED: { bn: 'প্রত্যাখ্যাত', en: 'Rejected', tone: 'destructive' },
    ADMITTED: { bn: 'ভর্তি সম্পন্ন', en: 'Admitted', tone: 'success' },
  },
  TestimonialType: {
    STUDY_CHARACTER: { bn: 'অধ্যয়ন ও চারিত্রিক', en: 'Study & Character', tone: 'neutral' },
    SSC_GRADUATE: { bn: 'এসএসসি প্রশংসাপত্র', en: 'SSC Testimonial', tone: 'primary' },
  },
};

export function getEnumMeta(enumName: string, value: string): EnumMeta {
  return (
    ENUM_LABELS[enumName]?.[value] ?? {
      bn: value,
      en: value,
      tone: 'neutral',
    }
  );
}
