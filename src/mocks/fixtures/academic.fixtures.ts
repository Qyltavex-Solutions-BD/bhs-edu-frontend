import {
  AcademicDocumentType,
  AcademicEventType,
  BookType,
  SubjectCategory,
} from '@/src/types/enums';
import type {
  AcademicYear,
  AcademicGroup,
  SchoolClass,
  Section,
  Subject,
  Book,
  ClassSubject,
  AcademicDocument,
  SyllabusFile,
  SyllabusChapterEntry,
  AcademicEvent,
} from '@/src/types/entities';
import { NOW } from './common';

export function createAcademicFixtures() {
  // 4. Academic Setup (2027 upcoming, 2026 active, 2025 previous; Classes 6–10; Sections ক, খ, গ; Groups)
  const academicYears: AcademicYear[] = [
    { id: 'ay-2027', name: '2027', startDate: '2027-01-01', endDate: '2027-12-31', isActive: false, createdAt: NOW, updatedAt: NOW },
    { id: 'ay-2026', name: '2026', startDate: '2026-01-01', endDate: '2026-12-31', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'ay-2025', name: '2025', startDate: '2025-01-01', endDate: '2025-12-31', isActive: false, createdAt: NOW, updatedAt: NOW },
  ];

  const academicGroups: AcademicGroup[] = [
    { id: 'grp-sci', name: 'Science', nameBn: 'বিজ্ঞান', description: 'পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান ও উচ্চতর গণিত', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'grp-hum', name: 'Humanities', nameBn: 'মানবিক', description: 'ইতিহাস, ভূগোল ও পরিবেশ, পৌরনীতি ও নাগরিকতা', isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'grp-bus', name: 'Business Studies', nameBn: 'ব্যবসায় শিক্ষা', description: 'হিসাববিজ্ঞান, ব্যবসায় উদ্যোগ ও ফিন্যান্স ও ব্যাংকিং', isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  const classes: SchoolClass[] = [
    { id: 'cls-6', name: 'Class 6', nameBn: '৬ষ্ঠ শ্রেণি', numericValue: 6, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'cls-7', name: 'Class 7', nameBn: '৭ম শ্রেণি', numericValue: 7, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'cls-8', name: 'Class 8', nameBn: '৮ম শ্রেণি', numericValue: 8, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'cls-9', name: 'Class 9', nameBn: '৯ম শ্রেণি', numericValue: 9, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'cls-10', name: 'Class 10', nameBn: '১০ম শ্রেণি (এসএসসি ব্যাচ)', numericValue: 10, isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  const sections: Section[] = [];
  classes.forEach((c) => {
    ['ক', 'খ'].forEach((secName, idx) => {
      sections.push({
        id: `sec-${c.numericValue}-${idx === 0 ? 'ka' : 'kha'}`,
        classId: c.id,
        name: secName,
        isActive: true,
        createdAt: NOW,
        updatedAt: NOW,
      });
    });
    if (c.numericValue >= 9) {
      sections.push({
        id: `sec-${c.numericValue}-ga`,
        classId: c.id,
        name: 'গ',
        isActive: true,
        createdAt: NOW,
        updatedAt: NOW,
      });
    }
  });

  const subjects: Subject[] = [
    { id: 'sub-ban', name: 'Bangla', nameBn: 'বাংলা', officialCode: '101', category: SubjectCategory.LANGUAGE, displayOrder: 1, isSystemDefault: true, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-eng', name: 'English', nameBn: 'ইংরেজি', officialCode: '107', category: SubjectCategory.LANGUAGE, displayOrder: 2, isSystemDefault: true, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-math', name: 'Mathematics', nameBn: 'গণিত', officialCode: '109', category: SubjectCategory.MATHEMATICS, displayOrder: 3, isSystemDefault: true, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-sci', name: 'General Science', nameBn: 'বিজ্ঞান', officialCode: '127', category: SubjectCategory.SCIENCE, displayOrder: 4, isSystemDefault: true, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-bgs', name: 'Bangladesh & Global Studies', nameBn: 'বাংলাদেশ ও বিশ্বপরিচয়', officialCode: '150', category: SubjectCategory.SOCIAL_SCIENCE, displayOrder: 5, isSystemDefault: true, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-ict', name: 'Information & Communication Technology', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', officialCode: '154', category: SubjectCategory.TECHNICAL, displayOrder: 6, isSystemDefault: true, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-rel', name: 'Religion & Moral Education', nameBn: 'ধর্ম ও নৈতিক শিক্ষা', officialCode: '111', category: SubjectCategory.RELIGION, displayOrder: 7, isSystemDefault: true, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-phy', name: 'Physics', nameBn: 'পদার্থবিজ্ঞান', officialCode: '136', category: SubjectCategory.SCIENCE, displayOrder: 8, isSystemDefault: false, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-che', name: 'Chemistry', nameBn: 'রসায়ন', officialCode: '137', category: SubjectCategory.SCIENCE, displayOrder: 9, isSystemDefault: false, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-bio', name: 'Biology', nameBn: 'জীববিজ্ঞান', officialCode: '138', category: SubjectCategory.SCIENCE, displayOrder: 10, isSystemDefault: false, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-hmath', name: 'Higher Mathematics', nameBn: 'উচ্চতর গণিত', officialCode: '126', category: SubjectCategory.MATHEMATICS, displayOrder: 11, isSystemDefault: false, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-agri', name: 'Agriculture Studies', nameBn: 'কৃষি শিক্ষা', officialCode: '134', category: SubjectCategory.GENERAL, displayOrder: 12, isSystemDefault: false, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-acc', name: 'Accounting', nameBn: 'হিসাববিজ্ঞান', officialCode: '146', category: SubjectCategory.COMMERCE, displayOrder: 13, isSystemDefault: false, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-his', name: 'History of Bangladesh & World', nameBn: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', officialCode: '153', category: SubjectCategory.SOCIAL_SCIENCE, displayOrder: 14, isSystemDefault: false, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sub-home', name: 'Home Science', nameBn: 'গার্হস্থ্য বিজ্ঞান', officialCode: '151', category: SubjectCategory.GENERAL, displayOrder: 15, isSystemDefault: false, isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  const books: Book[] = [
    { id: 'bk-1', subjectId: 'sub-ban', classId: 'cls-10', name: 'বাংলা সাহিত্য (নবম-দশম শ্রেণি)', bookCode: 'NCTB-101', type: BookType.TEXTBOOK, displayOrder: 1, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-2', subjectId: 'sub-eng', classId: 'cls-10', name: 'English For Today (Classes Nine-Ten)', bookCode: 'NCTB-107', type: BookType.TEXTBOOK, displayOrder: 2, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-3', subjectId: 'sub-math', classId: 'cls-10', name: 'গণিত (নবম-দশম শ্রেণি)', bookCode: 'NCTB-109', type: BookType.TEXTBOOK, displayOrder: 3, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-4', subjectId: 'sub-phy', classId: 'cls-10', name: 'পদার্থবিজ্ঞান (নবম-দশম শ্রেণি)', bookCode: 'NCTB-136', type: BookType.TEXTBOOK, displayOrder: 4, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-5', subjectId: 'sub-che', classId: 'cls-10', name: 'রসায়ন (নবম-দশম শ্রেণি)', bookCode: 'NCTB-137', type: BookType.TEXTBOOK, displayOrder: 5, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-6', subjectId: 'sub-ban', classId: 'cls-6', name: 'চারুপাঠ (ষষ্ঠ শ্রেণি)', bookCode: 'NCTB-601', type: BookType.TEXTBOOK, displayOrder: 1, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-7', subjectId: 'sub-math', classId: 'cls-8', name: 'গণিত (অষ্টম শ্রেণি)', bookCode: 'NCTB-809', type: BookType.TEXTBOOK, displayOrder: 3, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-8', subjectId: 'sub-eng', classId: 'cls-6', name: 'English For Today (Class Six)', bookCode: 'NCTB-607', type: BookType.TEXTBOOK, displayOrder: 2, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-9', subjectId: 'sub-math', classId: 'cls-6', name: 'গণিত (ষষ্ঠ শ্রেণি)', bookCode: 'NCTB-609', type: BookType.TEXTBOOK, displayOrder: 3, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-10', subjectId: 'sub-sci', classId: 'cls-6', name: 'বিজ্ঞান (ষষ্ঠ শ্রেণি)', bookCode: 'NCTB-627', type: BookType.TEXTBOOK, displayOrder: 4, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-11', subjectId: 'sub-ict', classId: 'cls-6', name: 'তথ্য ও যোগাযোগ প্রযুক্তি (ষষ্ঠ শ্রেণি)', bookCode: 'NCTB-654', type: BookType.TEXTBOOK, displayOrder: 5, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-12', subjectId: 'sub-ban', classId: 'cls-7', name: 'সপ্তবর্ণা (সপ্তম শ্রেণি)', bookCode: 'NCTB-701', type: BookType.TEXTBOOK, displayOrder: 1, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-13', subjectId: 'sub-eng', classId: 'cls-7', name: 'English For Today (Class Seven)', bookCode: 'NCTB-707', type: BookType.TEXTBOOK, displayOrder: 2, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-14', subjectId: 'sub-math', classId: 'cls-7', name: 'গণিত (সপ্তম শ্রেণি)', bookCode: 'NCTB-709', type: BookType.TEXTBOOK, displayOrder: 3, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-15', subjectId: 'sub-sci', classId: 'cls-7', name: 'বিজ্ঞান (সপ্তম শ্রেণি)', bookCode: 'NCTB-727', type: BookType.TEXTBOOK, displayOrder: 4, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-16', subjectId: 'sub-bgs', classId: 'cls-7', name: 'বাংলাদেশ ও বিশ্বপরিচয় (সপ্তম শ্রেণি)', bookCode: 'NCTB-750', type: BookType.TEXTBOOK, displayOrder: 5, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-17', subjectId: 'sub-ban', classId: 'cls-8', name: 'সাহিত্য কণিকা (অষ্টম শ্রেণি)', bookCode: 'NCTB-801', type: BookType.TEXTBOOK, displayOrder: 1, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-18', subjectId: 'sub-eng', classId: 'cls-8', name: 'English For Today (Class Eight)', bookCode: 'NCTB-807', type: BookType.TEXTBOOK, displayOrder: 2, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-19', subjectId: 'sub-sci', classId: 'cls-8', name: 'বিজ্ঞান (অষ্টম শ্রেণি)', bookCode: 'NCTB-827', type: BookType.TEXTBOOK, displayOrder: 4, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-20', subjectId: 'sub-ict', classId: 'cls-8', name: 'তথ্য ও যোগাযোগ প্রযুক্তি (অষ্টম শ্রেণি)', bookCode: 'NCTB-854', type: BookType.TEXTBOOK, displayOrder: 5, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-21', subjectId: 'sub-ban', classId: 'cls-9', name: 'বাংলা সাহিত্য (নবম-দশম শ্রেণি)', bookCode: 'NCTB-101', type: BookType.TEXTBOOK, displayOrder: 1, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-22', subjectId: 'sub-eng', classId: 'cls-9', name: 'English For Today (Classes Nine-Ten)', bookCode: 'NCTB-107', type: BookType.TEXTBOOK, displayOrder: 2, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-23', subjectId: 'sub-math', classId: 'cls-9', name: 'গণিত (নবম-দশম শ্রেণি)', bookCode: 'NCTB-109', type: BookType.TEXTBOOK, displayOrder: 3, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-24', subjectId: 'sub-phy', classId: 'cls-9', name: 'পদার্থবিজ্ঞান (নবম-দশম শ্রেণি)', bookCode: 'NCTB-136', type: BookType.TEXTBOOK, displayOrder: 4, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-25', subjectId: 'sub-bio', classId: 'cls-9', name: 'জীববিজ্ঞান (নবম-দশম শ্রেণি)', bookCode: 'NCTB-138', type: BookType.TEXTBOOK, displayOrder: 5, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-26', subjectId: 'sub-acc', classId: 'cls-9', name: 'হিসাববিজ্ঞান (নবম-দশম শ্রেণি)', bookCode: 'NCTB-146', type: BookType.TEXTBOOK, displayOrder: 6, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-27', subjectId: 'sub-his', classId: 'cls-9', name: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা (নবম-দশম)', bookCode: 'NCTB-153', type: BookType.TEXTBOOK, displayOrder: 7, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-28', subjectId: 'sub-bio', classId: 'cls-10', name: 'জীববিজ্ঞান (নবম-দশম শ্রেণি)', bookCode: 'NCTB-138', type: BookType.TEXTBOOK, displayOrder: 6, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-29', subjectId: 'sub-hmath', classId: 'cls-10', name: 'উচ্চতর গণিত (নবম-দশম শ্রেণি)', bookCode: 'NCTB-126', type: BookType.TEXTBOOK, displayOrder: 7, isActive: true, createdAt: NOW, updatedAt: NOW },
    { id: 'bk-30', subjectId: 'sub-acc', classId: 'cls-10', name: 'হিসাববিজ্ঞান (নবম-দশম শ্রেণি)', bookCode: 'NCTB-146', type: BookType.TEXTBOOK, displayOrder: 8, isActive: true, createdAt: NOW, updatedAt: NOW },
  ];

  // ClassSubject mappings for 2026
  const classSubjects: ClassSubject[] = [];
  const commonSubs = ['sub-ban', 'sub-eng', 'sub-math', 'sub-ict', 'sub-rel'];
  classes.forEach((cls) => {
    if (cls.numericValue <= 8) {
      [...commonSubs, 'sub-sci', 'sub-bgs', 'sub-agri'].forEach((subId, idx) => {
        classSubjects.push({
          id: `cs-${cls.numericValue}-${subId}`,
          academicYearId: 'ay-2026',
          classId: cls.id,
          subjectId: subId,
          groupId: null,
          isOptional: subId === 'sub-agri',
          displayOrder: idx + 1,
          isActive: true,
          createdAt: NOW,
          updatedAt: NOW,
        });
      });
    } else {
      // Classes 9 & 10: common + group subjects
      commonSubs.forEach((subId, idx) => {
        classSubjects.push({
          id: `cs-${cls.numericValue}-${subId}`,
          academicYearId: 'ay-2026',
          classId: cls.id,
          subjectId: subId,
          groupId: null,
          isOptional: false,
          displayOrder: idx + 1,
          isActive: true,
          createdAt: NOW,
          updatedAt: NOW,
        });
      });
      // Science (4th subject options: Higher Math, Agriculture Studies)
      ['sub-phy', 'sub-che', 'sub-bio', 'sub-hmath', 'sub-agri'].forEach((subId, idx) => {
        classSubjects.push({
          id: `cs-${cls.numericValue}-sci-${subId}`,
          academicYearId: 'ay-2026',
          classId: cls.id,
          subjectId: subId,
          groupId: 'grp-sci',
          isOptional: subId === 'sub-hmath' || subId === 'sub-agri',
          displayOrder: 6 + idx,
          isActive: true,
          createdAt: NOW,
          updatedAt: NOW,
        });
      });
      // Humanities (4th subject options: Agriculture Studies, Home Science)
      ['sub-his', 'sub-bgs', 'sub-agri', 'sub-home'].forEach((subId, idx) => {
        classSubjects.push({
          id: `cs-${cls.numericValue}-hum-${subId}`,
          academicYearId: 'ay-2026',
          classId: cls.id,
          subjectId: subId,
          groupId: 'grp-hum',
          isOptional: subId === 'sub-agri' || subId === 'sub-home',
          displayOrder: 6 + idx,
          isActive: true,
          createdAt: NOW,
          updatedAt: NOW,
        });
      });
      // Business Studies (4th subject options: Agriculture Studies, Home Science)
      ['sub-acc', 'sub-agri', 'sub-home'].forEach((subId, idx) => {
        classSubjects.push({
          id: `cs-${cls.numericValue}-bus-${subId}`,
          academicYearId: 'ay-2026',
          classId: cls.id,
          subjectId: subId,
          groupId: 'grp-bus',
          isOptional: subId === 'sub-agri' || subId === 'sub-home',
          displayOrder: 6 + idx,
          isActive: true,
          createdAt: NOW,
          updatedAt: NOW,
        });
      });
    }
  });

  const academicDocuments: AcademicDocument[] = [
    {
      id: 'adoc-1',
      type: AcademicDocumentType.CURRICULUM,
      title: 'ষষ্ঠ থেকে দশম শ্রেণি — ২০২৬ শিক্ষাবর্ষের পাঠ্যক্রম ও সিলেবাস',
      description:
        'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (এনসিটিবি) অনুমোদিত ২০২৬ শিক্ষাবর্ষের অধ্যায়ভিত্তিক পাঠ্যসূচি, অর্ধবার্ষিক ও বার্ষিক মূল্যায়ন কাঠামো এবং ব্যবহারিক পরীক্ষার মানবণ্টন নির্দেশিকা।',
      fileUrl: '#syllabus-2026',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'adoc-2',
      type: AcademicDocumentType.STUDENT_RULES,
      title: 'শিক্ষার্থীদের আচরণবিধি ও উপস্থিতি নীতিমালা',
      description:
        'প্রতিটি শিক্ষার্থীর ন্যূনতম ৮০% শ্রেণি উপস্থিতি, প্রাত্যহিক সমাবেশে সময়মতো অংশগ্রহণ, বিদ্যালয়ের শৃঙ্খলা রক্ষা এবং পরীক্ষার হলে করণীয় ও বর্জনীয় সংক্রান্ত পূর্ণাঙ্গ নীতিমালা।',
      fileUrl: '#student-rules',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'adoc-3',
      type: AcademicDocumentType.PARENT_GUIDELINES,
      title: 'অভিভাবকদের জন্য নির্দেশিকা ও ডিজিটাল পোর্টাল ব্যবহারবিধি',
      description:
        'সন্তানের দৈনিক উপস্থিতি, স্বয়ংক্রিয় RFID ও অনুপস্থিতি এসএমএস অ্যালার্ট, ফলাফল পর্যবেক্ষণ এবং অভিভাবক-শিক্ষক সমন্বয় সভার নিয়মিত নির্দেশিকা।',
      fileUrl: '#parent-guidelines',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'adoc-4',
      type: AcademicDocumentType.DRESS_CODE,
      title: 'বিদ্যালয়ের নির্ধারিত পোশাক বিধি (ড্রেস কোড)',
      description:
        'ছাত্রদের জন্য সাদা শার্ট, নেভি ব্লু ফুল প্যান্ট ও কালো জুতা; ছাত্রীদের জন্য নেভি ব্লু কামিজ, সাদা সালোয়ার ও সাদা ওড়না এবং সকল শিক্ষার্থীর জন্য বিদ্যালয়ের মনোগ্রামযুক্ত আইডি কার্ড ও ব্যাজ।',
      fileUrl: '#dress-code',
      isPublished: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  // Authentic Class-wise & Term-wise Official Syllabus Files (PDF attachments)
  const syllabusFiles: SyllabusFile[] = [
    { id: 'sf-10-hy', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'HALF_YEARLY', title: '১০ম শ্রেণি (এসএসসি) — অর্ধবার্ষিক পরীক্ষা ২০২৬ পূর্ণাঙ্গ সিলেবাস', fileName: 'BHS-Class-10-Half-Yearly-Syllabus-2026.pdf', fileSize: '342 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-01-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-10-ann', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'ANNUAL', title: '১০ম শ্রেণি (এসএসসি) — বার্ষিক / প্রাক-নির্বাচনি পরীক্ষা ২০২৬ সিলেবাস', fileName: 'BHS-Class-10-Annual-Syllabus-2026.pdf', fileSize: '388 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-07-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-10-sel', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'SELECTION', title: '১০ম শ্রেণি — এসএসসি নির্বাচনি (টেস্ট) পরীক্ষা ২০২৬ পূর্ণাঙ্গ বোর্ড সিলেবাস', fileName: 'BHS-SSC-Selection-Full-Syllabus-2026.pdf', fileSize: '416 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-09-01', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-9-hy', academicYearId: 'ay-2026', classId: 'cls-9', groupId: null, examTerm: 'HALF_YEARLY', title: '৯ম শ্রেণি — অর্ধবার্ষিক পরীক্ষা ২০২৬ সিলেবাস (সকল বিভাগ)', fileName: 'BHS-Class-9-Half-Yearly-Syllabus-2026.pdf', fileSize: '318 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-01-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-9-ann', academicYearId: 'ay-2026', classId: 'cls-9', groupId: null, examTerm: 'ANNUAL', title: '৯ম শ্রেণি — বার্ষিক পরীক্ষা ২০২৬ সিলেবাস (সকল বিভাগ)', fileName: 'BHS-Class-9-Annual-Syllabus-2026.pdf', fileSize: '334 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-07-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-8-hy', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'HALF_YEARLY', title: '৮ম শ্রেণি — অর্ধবার্ষিক পরীক্ষা ২০২৬ সিলেবাস', fileName: 'BHS-Class-8-Half-Yearly-Syllabus-2026.pdf', fileSize: '274 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-01-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-8-ann', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'ANNUAL', title: '৮ম শ্রেণি — বার্ষিক পরীক্ষা ২০২৬ সিলেবাস', fileName: 'BHS-Class-8-Annual-Syllabus-2026.pdf', fileSize: '286 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-07-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-7-hy', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'HALF_YEARLY', title: '৭ম শ্রেণি — অর্ধবার্ষিক পরীক্ষা ২০২৬ সিলেবাস', fileName: 'BHS-Class-7-Half-Yearly-Syllabus-2026.pdf', fileSize: '256 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-01-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-7-ann', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'ANNUAL', title: '৭ম শ্রেণি — বার্ষিক পরীক্ষা ২০২৬ সিলেবাস', fileName: 'BHS-Class-7-Annual-Syllabus-2026.pdf', fileSize: '264 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-07-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-6-hy', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'HALF_YEARLY', title: '৬ষ্ঠ শ্রেণি — অর্ধবার্ষিক পরীক্ষা ২০২৬ সিলেবাস', fileName: 'BHS-Class-6-Half-Yearly-Syllabus-2026.pdf', fileSize: '248 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-01-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
    { id: 'sf-6-ann', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'ANNUAL', title: '৬ষ্ঠ শ্রেণি — বার্ষিক পরীক্ষা ২০২৬ সিলেবাস', fileName: 'BHS-Class-6-Annual-Syllabus-2026.pdf', fileSize: '258 KB', fileType: 'PDF', fileUrl: null, publishedAt: '2026-07-20', isPublished: true, createdAt: NOW, updatedAt: NOW },
  ];

  // Authentic NCTB Chapter-wise Syllabus Entries across Classes 6–10 & Terms
  const syllabusEntries: SyllabusChapterEntry[] = [
    // Class 10 — Half-Yearly
    { id: 'se-10-hy-ban', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-ban', chaptersBn: 'গদ্য: সুভা, বইপড়া, অভাগীর স্বর্গ, প্রবাস বন্ধু; পদ্য: বঙ্গবাণী, কপোতাক্ষ নদ, জীবন-সঙ্গীত; ব্যাকরণ: ধ্বনিতত্ত্ব ও শব্দ প্রকরণ', chaptersEn: 'Prose: Shuvas, Boipora, Obhagir Swargo, Probash Bondhu; Poetry: Bongobani, Kopotakkho Nod, Jibon-Sangeet; Grammar: Phonology & Morphology', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-10-hy-eng', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-eng', chaptersBn: 'English For Today: Units 1–6; Grammar: Right Form of Verbs, Transformation, Narration, Connectors; Composition: Paragraph & Formal Letter', chaptersEn: 'English For Today: Units 1–6; Grammar: Right Form of Verbs, Transformation, Narration, Connectors; Composition: Paragraph & Formal Letter', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-10-hy-math', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ১ (বাস্তব সংখ্যা), অধ্যায় ২ (সেট ও ফাংশন), অধ্যায় ৩ (বীজগাণিতিক রাশি), অধ্যায় ৮ (বৃত্ত), অধ্যায় ১৭ (পরিসংখ্যান)', chaptersEn: 'Ch 1 (Real Numbers), Ch 2 (Sets & Functions), Ch 3 (Algebraic Expressions), Ch 8 (Circles), Ch 17 (Statistics)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-10-hy-ict', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-ict', chaptersBn: 'অধ্যায় ১ (তথ্য ও যোগাযোগ প্রযুক্তি এবং আমাদের বাংলাদেশ), অধ্যায় ২ (কম্পিউটার ও কম্পিউটার ব্যবহারকারীর নিরাপত্তা), অধ্যায় ৩ (আমার শিক্ষায় ইন্টারনেট)', chaptersEn: 'Ch 1 (ICT & Bangladesh), Ch 2 (Computer Security), Ch 3 (Internet in Education)', marksBreakdownBn: 'মোট ৫০ (বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 50 (MCQ 25 + Practical 25)', displayOrder: 4 },
    { id: 'se-10-hy-phy', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-sci', examTerm: 'HALF_YEARLY', subjectId: 'sub-phy', chaptersBn: 'অধ্যায় ১ (ভৌত রাশি ও পরিমাপ), অধ্যায় ২ (গতি), অধ্যায় ৩ (বল), অধ্যায় ৪ (কাজ, ক্ষমতা ও শক্তি), অধ্যায় ৫ (পদার্থের অবস্থা ও চাপ)', chaptersEn: 'Ch 1 (Physical Quantities), Ch 2 (Motion), Ch 3 (Force), Ch 4 (Work, Power & Energy), Ch 5 (State of Matter & Pressure)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 5 },
    { id: 'se-10-hy-che', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-sci', examTerm: 'HALF_YEARLY', subjectId: 'sub-che', chaptersBn: 'অধ্যায় ১–৫ (রসায়নের ধারণা, পদার্থের অবস্থা, পদার্থের গঠন, পর্যায় সারণি, রাসায়নিক বন্ধন)', chaptersEn: 'Chapters 1–5 (Concept of Chemistry, States & Structure of Matter, Periodic Table, Chemical Bonding)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 6 },
    { id: 'se-10-hy-bio', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-sci', examTerm: 'HALF_YEARLY', subjectId: 'sub-bio', chaptersBn: 'অধ্যায় ১ (জীবন পাঠ), অধ্যায় ২ (জীবকোষ ও টিস্যু), অধ্যায় ৩ (কোষ বিভাজন), অধ্যায় ৪ (জীবনীশক্তি)', chaptersEn: 'Ch 1 (Lessons on Life), Ch 2 (Cells & Tissues), Ch 3 (Cell Division), Ch 4 (Bioenergetics)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 7 },
    { id: 'se-10-hy-hmath', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-sci', examTerm: 'HALF_YEARLY', subjectId: 'sub-hmath', chaptersBn: 'অধ্যায় ১ (সেট ও ফাংশন), অধ্যায় ২ (বীজগাণিতিক রাশি), অধ্যায় ৩ (জ্যামিতি), অধ্যায় ৮ (ত্রিকোণমিতি)', chaptersEn: 'Ch 1 (Sets & Functions), Ch 2 (Algebraic Expressions), Ch 3 (Geometry), Ch 8 (Trigonometry)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 8 },
    { id: 'se-10-hy-his', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-hum', examTerm: 'HALF_YEARLY', subjectId: 'sub-his', chaptersBn: 'অধ্যায় ১–৬ (ইতিহাস পরিচিতি, বিশ্বসভ্যতা, প্রাচীন বাংলার জনপদ, মধ্যযুগের বাংলা)', chaptersEn: 'Chapters 1–6 (Introduction to History, World Civilizations, Ancient & Medieval Bengal)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 5 },
    { id: 'se-10-hy-bgs', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-hum', examTerm: 'HALF_YEARLY', subjectId: 'sub-bgs', chaptersBn: 'অধ্যায় ১–৭ (পূর্ব বাংলার আন্দোলন ও জাতীয়তাবাদের উত্থান, স্বাধীন বাংলাদেশ, সৌরজগৎ ও ভূমণ্ডল)', chaptersEn: 'Chapters 1–7 (Nationalist Movement, Independent Bangladesh, Solar System & Geography)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 6 },
    { id: 'se-10-hy-acc', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-bus', examTerm: 'HALF_YEARLY', subjectId: 'sub-acc', chaptersBn: 'অধ্যায় ১–৬ (হিসাববিজ্ঞান পরিচিতি, লেনদেন, দুতরফা দাখিলা পদ্ধতি, মূলধন ও মুনাফা জাতীয় লেনদেন, হিসাব, জাবেদা)', chaptersEn: 'Chapters 1–6 (Intro to Accounting, Transactions, Double Entry, Capital & Revenue, Accounts, Journal)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 5 },

    // Class 10 — Annual
    { id: 'se-10-ann-ban', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-ban', chaptersBn: 'গদ্য: মানুষ মুহম্মদ (স.), নিমগাছ, শিক্ষা ও মনুষ্যত্ব, একাত্তরের দিনগুলি; পদ্য: মানুষ, সেইদিন এই মাঠ, তোমাকে পাওয়ার জন্যে হে স্বাধীনতা; উপন্যাস: কাকতাড়ুয়া ও নাটক: বহিপীর', chaptersEn: 'Prose: Manush Muhammad (S), Nimgach, Shikkha o Monushotto, Ekattorer Dinguli; Poetry: Manush, Seidin Ei Math; Novel: Kaktarua & Drama: Bohipir', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-10-ann-eng', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-eng', chaptersBn: 'English For Today: Units 7–13; Grammar: Completing Sentences, Tag Questions, Punctuation, Suffix-Prefix; Composition: Essay, CV & Dialogue', chaptersEn: 'English For Today: Units 7–13; Grammar: Completing Sentences, Tag Questions, Punctuation; Composition: Essay, CV & Dialogue', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-10-ann-math', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ৪ (সূচক ও লগারিদম), অধ্যায় ৯ (ত্রিকোণমিতিক অনুপাত), অধ্যায় ১০ (দূরত্ব ও উচ্চতা), অধ্যায় ১৩ (সসীম ধারা), অধ্যায় ১৬ (পরিমিতি)', chaptersEn: 'Ch 4 (Exponents & Logs), Ch 9 (Trigonometry), Ch 10 (Distance & Height), Ch 13 (Finite Series), Ch 16 (Mensuration)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-10-ann-ict', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-ict', chaptersBn: 'অধ্যায় ৪ (আমার লেখালেখি ও হিসাব), অধ্যায় ৫ (মাল্টিমিডিয়া ও গ্রাফিক্স), অধ্যায় ৬ (ডেটাবেজের ব্যবহার)', chaptersEn: 'Ch 4 (Word Processing & Spreadsheets), Ch 5 (Multimedia & Graphics), Ch 6 (Database Usage)', marksBreakdownBn: 'মোট ৫০ (বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 50 (MCQ 25 + Practical 25)', displayOrder: 4 },
    { id: 'se-10-ann-phy', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-sci', examTerm: 'ANNUAL', subjectId: 'sub-phy', chaptersBn: 'অধ্যায় ৭ (তরঙ্গ ও শব্দ), অধ্যায় ৮ (আলোর প্রতিফলন), অধ্যায় ৯ (আলোর প্রতিসরণ), অধ্যায় ১১ (চলবিদ্যুৎ)', chaptersEn: 'Ch 7 (Waves & Sound), Ch 8 (Reflection of Light), Ch 9 (Refraction), Ch 11 (Current Electricity)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 5 },
    { id: 'se-10-ann-che', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-sci', examTerm: 'ANNUAL', subjectId: 'sub-che', chaptersBn: 'অধ্যায় ৬ (মোলের ধারণা ও রাসায়নিক গণনা), অধ্যায় ৭ (রাসায়নিক বিক্রিয়া), অধ্যায় ১১ (খনিজ সম্পদ: জীবাশ্ম)', chaptersEn: 'Ch 6 (Mole Concept), Ch 7 (Chemical Reactions), Ch 11 (Organic Chemistry & Fossil Fuels)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 6 },
    { id: 'se-10-ann-bio', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-sci', examTerm: 'ANNUAL', subjectId: 'sub-bio', chaptersBn: 'অধ্যায় ৬ (জীবে পরিবহন), অধ্যায় ৮ (রেচন প্রক্রিয়া), অধ্যায় ১১ (জীবের প্রজনন), অধ্যায় ১২ (জীবের বংশগতি ও বিবর্তন)', chaptersEn: 'Ch 6 (Transport in Organisms), Ch 8 (Excretion), Ch 11 (Reproduction), Ch 12 (Heredity & Evolution)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 7 },
    { id: 'se-10-ann-his', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-hum', examTerm: 'ANNUAL', subjectId: 'sub-his', chaptersBn: 'অধ্যায় ১০–১৪ (ইংরেজ শাসনামলে বাংলার স্বাধিকার আন্দোলন, ভাষা আন্দোলন ও ১৯৭১ সালের মহান মুক্তিযুদ্ধ)', chaptersEn: 'Chapters 10–14 (Anti-Colonial Movements, Language Movement & 1971 Liberation War)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 5 },
    { id: 'se-10-ann-acc', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-bus', examTerm: 'ANNUAL', subjectId: 'sub-acc', chaptersBn: 'অধ্যায় ৭ (খতিয়ান), অধ্যায় ৮ (নগদান বই), অধ্যায় ৯ (রেওয়ামিল), অধ্যায় ১০ (আর্থিক বিবরণী)', chaptersEn: 'Ch 7 (Ledger), Ch 8 (Cash Book), Ch 9 (Trial Balance), Ch 10 (Financial Statements)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 5 },

    // Class 10 — Selection (SSC Full Board Syllabus)
    { id: 'se-10-sel-ban', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'SELECTION', subjectId: 'sub-ban', chaptersBn: 'এসএসসি বোর্ড নির্ধারিত সম্পূর্ণ বাংলা ১ম ও ২য় পত্র পাঠ্যসূচি (সকল নির্বাচিত গদ্য, পদ্য, উপন্যাস, নাটক ও ব্যাকরণ)', chaptersEn: 'Complete SSC Board Syllabus for Bangla 1st & 2nd Paper (Prose, Poetry, Novel, Drama & Grammar)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-10-sel-eng', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'SELECTION', subjectId: 'sub-eng', chaptersBn: 'সম্পূর্ণ English For Today (Units 1–13) এবং সম্পূর্ণ এসএসসি গ্রামার ও কম্পোজিশন পাঠ্যসূচি', chaptersEn: 'Full English For Today (Units 1–13) & complete SSC Grammar and Composition syllabus', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-10-sel-math', academicYearId: 'ay-2026', classId: 'cls-10', groupId: null, examTerm: 'SELECTION', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ১ থেকে ১৭ পর্যন্ত সম্পূর্ণ সাধারণ গণিত বোর্ড সিলেবাস (বীজগণিত, জ্যামিতি, ত্রিকোণমিতি ও পরিসংখ্যান)', chaptersEn: 'Complete SSC General Mathematics Board Syllabus (Chapters 1–17)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-10-sel-phy', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-sci', examTerm: 'SELECTION', subjectId: 'sub-phy', chaptersBn: 'অধ্যায় ১–১৪ (সম্পূর্ণ পদার্থবিজ্ঞান বোর্ড সিলেবাস ও ব্যবহারিক খাতা)', chaptersEn: 'Complete SSC Physics Board Syllabus (Chapters 1–14) & Practical Notebook', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 4 },
    { id: 'se-10-sel-che', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-sci', examTerm: 'SELECTION', subjectId: 'sub-che', chaptersBn: 'অধ্যায় ১–১২ (সম্পূর্ণ রসায়ন বোর্ড সিলেবাস ও ব্যবহারিক পরীক্ষণ)', chaptersEn: 'Complete SSC Chemistry Board Syllabus (Chapters 1–12) & Lab Practicals', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 5 },
    { id: 'se-10-sel-his', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-hum', examTerm: 'SELECTION', subjectId: 'sub-his', chaptersBn: 'অধ্যায় ১–১৪ (সম্পূর্ণ বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা বোর্ড সিলেবাস)', chaptersEn: 'Complete History of Bangladesh & World Civilization Board Syllabus (Ch 1–14)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },
    { id: 'se-10-sel-acc', academicYearId: 'ay-2026', classId: 'cls-10', groupId: 'grp-bus', examTerm: 'SELECTION', subjectId: 'sub-acc', chaptersBn: 'অধ্যায় ১–১২ (সম্পূর্ণ হিসাববিজ্ঞান বোর্ড সিলেবাস ও আর্থিক বিবরণী)', chaptersEn: 'Complete Accounting Board Syllabus (Ch 1–12 & Financial Statements)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },

    // Class 9 — Half-Yearly & Annual
    { id: 'se-9-hy-ban', academicYearId: 'ay-2026', classId: 'cls-9', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-ban', chaptersBn: 'গদ্য: সুভা, বইপড়া, আম-আঁটির ভেঁপু; পদ্য: বঙ্গবাণী, কপোতাক্ষ নদ, মানুষ; ব্যাকরণ: বাংলা ভাষার ব্যাকরণ অধ্যায় ১–৩', chaptersEn: 'Prose: Shuvas, Boipora, Am-Atir Vepu; Poetry: Bongobani, Kopotakkho Nod, Manush; Grammar Ch 1–3', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-9-hy-eng', academicYearId: 'ay-2026', classId: 'cls-9', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-eng', chaptersBn: 'English For Today: Units 1–5; Grammar: Articles, Prepositions, Substitution Table, Tense; Writing: Paragraph & Email', chaptersEn: 'English For Today: Units 1–5; Grammar: Articles, Prepositions, Tense; Writing: Paragraph & Email', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-9-hy-math', academicYearId: 'ay-2026', classId: 'cls-9', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ১ (বাস্তব সংখ্যা), অধ্যায় ২ (সেট ও ফাংশন), অধ্যায় ৩ (বীজগাণিতিক রাশি), অধ্যায় ৬ (রেখা, কোণ ও ত্রিভুজ)', chaptersEn: 'Ch 1 (Real Numbers), Ch 2 (Sets & Functions), Ch 3 (Algebraic Expressions), Ch 6 (Lines, Angles & Triangles)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-9-hy-phy', academicYearId: 'ay-2026', classId: 'cls-9', groupId: 'grp-sci', examTerm: 'HALF_YEARLY', subjectId: 'sub-phy', chaptersBn: 'অধ্যায় ১ (ভৌত রাশি ও পরিমাপ), অধ্যায় ২ (গতি), অধ্যায় ৩ (বল)', chaptersEn: 'Ch 1 (Physical Quantities & Measurement), Ch 2 (Motion), Ch 3 (Force)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 4 },
    { id: 'se-9-hy-bio', academicYearId: 'ay-2026', classId: 'cls-9', groupId: 'grp-sci', examTerm: 'HALF_YEARLY', subjectId: 'sub-bio', chaptersBn: 'অধ্যায় ১ (জীবন পাঠ), অধ্যায় ২ (জীবকোষ ও টিস্যু), অধ্যায় ৩ (কোষ বিভাজন)', chaptersEn: 'Ch 1 (Lessons on Life), Ch 2 (Cells & Tissues), Ch 3 (Cell Division)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 5 },
    { id: 'se-9-hy-acc', academicYearId: 'ay-2026', classId: 'cls-9', groupId: 'grp-bus', examTerm: 'HALF_YEARLY', subjectId: 'sub-acc', chaptersBn: 'অধ্যায় ১–৪ (হিসাববিজ্ঞান পরিচিতি, লেনদেন, দুতরফা দাখিলা, মূলধন ও মুনাফা)', chaptersEn: 'Chapters 1–4 (Intro to Accounting, Transactions, Double Entry, Capital & Revenue)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },
    { id: 'se-9-hy-his', academicYearId: 'ay-2026', classId: 'cls-9', groupId: 'grp-hum', examTerm: 'HALF_YEARLY', subjectId: 'sub-his', chaptersBn: 'অধ্যায় ১–৫ (ইতিহাস পরিচিতি, বিশ্বসভ্যতা ও প্রাচীন বাংলা)', chaptersEn: 'Chapters 1–5 (Introduction to History, World Civilizations & Ancient Bengal)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },
    { id: 'se-9-ann-ban', academicYearId: 'ay-2026', classId: 'cls-9', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-ban', chaptersBn: 'গদ্য: মানুষ মুহম্মদ (স.), নিমগাছ, মমতাদি; পদ্য: প্রাণ, অন্ধবধূ, ঝর্ণার গান; ব্যাকরণ: সন্ধি, সমাস ও কারক', chaptersEn: 'Prose: Manush Muhammad (S), Nimgach, Momatadi; Poetry: Pran, Ondhobodu; Grammar: Shondhi, Shomas & Karok', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-9-ann-eng', academicYearId: 'ay-2026', classId: 'cls-9', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-eng', chaptersBn: 'English For Today: Units 6–10; Grammar: Changing Sentences, Voice, Narration; Composition: Story & Letter', chaptersEn: 'English For Today: Units 6–10; Grammar: Voice, Narration, Transformation; Composition: Story & Letter', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-9-ann-math', academicYearId: 'ay-2026', classId: 'cls-9', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ৪ (সূচক ও লগারিদম), অধ্যায় ৭ (ব্যবহারিক জ্যামিতি), অধ্যায় ৯ (ত্রিকোণমিতিক অনুপাত), অধ্যায় ১৭ (পরিসংখ্যান)', chaptersEn: 'Ch 4 (Exponents & Logs), Ch 7 (Practical Geometry), Ch 9 (Trigonometry), Ch 17 (Statistics)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-9-ann-phy', academicYearId: 'ay-2026', classId: 'cls-9', groupId: 'grp-sci', examTerm: 'ANNUAL', subjectId: 'sub-phy', chaptersBn: 'অধ্যায় ৪ (কাজ, ক্ষমতা ও শক্তি), অধ্যায় ৫ (পদার্থের অবস্থা ও চাপ), অধ্যায় ৬ (বস্তুর ওপর তাপের প্রভাব)', chaptersEn: 'Ch 4 (Work, Power & Energy), Ch 5 (State of Matter & Pressure), Ch 6 (Effect of Heat)', marksBreakdownBn: 'মোট ১০০ (লিখিত ৫০ + বহুনির্বাচনি ২৫ + ব্যবহারিক ২৫)', marksBreakdownEn: 'Total 100 (Written 50 + MCQ 25 + Practical 25)', displayOrder: 4 },
    { id: 'se-9-ann-acc', academicYearId: 'ay-2026', classId: 'cls-9', groupId: 'grp-bus', examTerm: 'ANNUAL', subjectId: 'sub-acc', chaptersBn: 'অধ্যায় ৫ (হিসাব), অধ্যায় ৬ (জাবেদা), অধ্যায় ৭ (খতিয়ান)', chaptersEn: 'Ch 5 (Accounts), Ch 6 (Journal), Ch 7 (Ledger)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },

    // Class 8 — Half-Yearly & Annual
    { id: 'se-8-hy-ban', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-ban', chaptersBn: 'সাহিত্য কণিকা: অতিথির স্মৃতি, ভাব ও কাজ, পড়ে পাওয়া; কবিতা: মানবধর্ম, বঙ্গভূমির প্রতি, দুই বিঘা জমি; ব্যাকরণ: ভাষা ও ধ্বনি', chaptersEn: 'Sahitya Konika: Otithir Smriti, Bhab o Kaj, Pore Pawa; Poems: Manobdhormo, Bongobhumir Proti', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-8-hy-eng', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-eng', chaptersBn: 'English For Today: Units 1–4; Grammar: Parts of Speech, Articles, Tense, Voice; Writing: Paragraph & Dialogue', chaptersEn: 'English For Today: Units 1–4; Grammar: Parts of Speech, Articles, Tense, Voice; Writing: Paragraph & Dialogue', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-8-hy-math', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ১ (প্যাটার্ন), অধ্যায় ২ (মুনাফা), অধ্যায় ৩ (পরিমাপ), অধ্যায় ৪ (বীজগণিতীয় সূত্রাবলি ও প্রয়োগ), অধ্যায় ৮ (চতুর্ভুজ)', chaptersEn: 'Ch 1 (Patterns), Ch 2 (Profit), Ch 3 (Measurement), Ch 4 (Algebraic Formulae), Ch 8 (Quadrilaterals)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-8-hy-sci', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-sci', chaptersBn: 'অধ্যায় ১ (প্রাণিজগতের শ্রেণিবিন্যাস), অধ্যায় ২ (জীবের বৃদ্ধি ও বংশগতি), অধ্যায় ৩ (ব্যাপন, অভিস্রবণ ও প্রস্বেদন), অধ্যায় ৬ (পরমাণুর গঠন)', chaptersEn: 'Ch 1 (Classification of Animals), Ch 2 (Growth & Heredity), Ch 3 (Diffusion & Osmosis), Ch 6 (Structure of Atom)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },
    { id: 'se-8-hy-ict', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-ict', chaptersBn: 'অধ্যায় ১ (তথ্য ও যোগাযোগ প্রযুক্তির গুরুত্ব), অধ্যায় ২ (কম্পিউটার নেটওয়ার্ক)', chaptersEn: 'Ch 1 (Importance of ICT), Ch 2 (Computer Networks)', marksBreakdownBn: 'মোট ৫০ (লিখিত ২৫ + বহুনির্বাচনি ২৫)', marksBreakdownEn: 'Total 50 (Written 25 + MCQ 25)', displayOrder: 5 },
    { id: 'se-8-ann-ban', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-ban', chaptersBn: 'গদ্য: তৈলচিত্রের ভূত, এবারের সংগ্রাম স্বাধীনতার সংগ্রাম, বাংলা নববর্ষ; কবিতা: পাছে লোকে কিছু বলে, নারী, আবার আসিব ফিরে', chaptersEn: 'Prose: Toilochitrer Bhut, Bangla Noboborsho; Poems: Pache Loke Kichu Bole, Nari, Abar Ashibo Phire', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-8-ann-eng', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-eng', chaptersBn: 'English For Today: Units 5–9; Grammar: Narration, Transformation, Punctuation; Composition: Essay & Application', chaptersEn: 'English For Today: Units 5–9; Grammar: Narration, Transformation, Punctuation; Composition: Essay & Application', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-8-ann-math', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ৫ (বীজগণিতীয় ভগ্নাংশ), অধ্যায় ৬ (সরল সহসমীকরণ), অধ্যায় ৯ (পিথাগোরাসের উপপাদ্য), অধ্যায় ১০ (বৃত্ত), অধ্যায় ১১ (তথ্য ও উপাত্ত)', chaptersEn: 'Ch 5 (Algebraic Fractions), Ch 6 (Simple Simultaneous Equations), Ch 9 (Pythagoras Theorem), Ch 10 (Circle), Ch 11 (Data)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-8-ann-sci', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-sci', chaptersBn: 'অধ্যায় ৭ (পৃথিবী ও মহাকর্ষ), অধ্যায় ৮ (রাসায়নিক বিক্রিয়া), অধ্যায় ৯ (বর্তনী ও চলবিদ্যুৎ), অধ্যায় ১০ (অম্ল, ক্ষারক ও লবণ)', chaptersEn: 'Ch 7 (Earth & Gravitation), Ch 8 (Chemical Reactions), Ch 9 (Circuits & Electricity), Ch 10 (Acids, Bases & Salts)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },
    { id: 'se-8-ann-ict', academicYearId: 'ay-2026', classId: 'cls-8', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-ict', chaptersBn: 'অধ্যায় ৩ (তথ্য ও যোগাযোগ প্রযুক্তির নিরাপদ ও নৈতিক ব্যবহার), অধ্যায় ৪ (স্প্রেডশিটের ব্যবহার), অধ্যায় ৫ (শিক্ষা ও দৈনন্দিন জীবনে ইন্টারনেট)', chaptersEn: 'Ch 3 (Safe & Ethical ICT), Ch 4 (Spreadsheets), Ch 5 (Internet in Daily Life)', marksBreakdownBn: 'মোট ৫০ (লিখিত ২৫ + বহুনির্বাচনি ২৫)', marksBreakdownEn: 'Total 50 (Written 25 + MCQ 25)', displayOrder: 5 },

    // Class 7 — Half-Yearly & Annual
    { id: 'se-7-hy-ban', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-ban', chaptersBn: 'সপ্তবর্ণা: কাবুলিওয়ালা, লখার একুশে, মরু-ভাস্কর; কবিতা: নতুন দেশ, কুলি-মজুর, আমার বাড়ি', chaptersEn: 'Soptoborna: Kabuliwala, Lokhar Ekushe, Moru-Bhaskor; Poems: Notun Desh, Kuli-Mojur, Amar Bari', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-7-hy-eng', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-eng', chaptersBn: 'English For Today: Units 1–4; Grammar: Noun, Pronoun, Verb, Tense, Articles; Composition: Paragraph & Informal Letter', chaptersEn: 'English For Today: Units 1–4; Grammar: Parts of Speech, Tense, Articles; Writing: Paragraph & Informal Letter', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-7-hy-math', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ১ (মূলদ ও অমূলদ সংখ্যা), অধ্যায় ২ (সমানুপাত ও লাভ-ক্ষতি), অধ্যায় ৪ (বীজগণিতীয় রাশির গুণ ও ভাগ), অধ্যায় ৮ (সমান্তরাল সরলরেখা)', chaptersEn: 'Ch 1 (Rational & Irrational Numbers), Ch 2 (Proportion & Profit-Loss), Ch 4 (Algebraic Multiplication/Division), Ch 8 (Parallel Lines)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-7-hy-sci', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-sci', chaptersBn: 'অধ্যায় ১ (নিম্নশ্রেণির জীব), অধ্যায় ২ (উদ্ভিদ ও প্রাণীর কোষীয় সংগঠন), অধ্যায় ৩ (উদ্ভিদের বাহ্যিক বৈশিষ্ট্য), অধ্যায় ৪ (শ্বসন)', chaptersEn: 'Ch 1 (Lower Organisms), Ch 2 (Cellular Organization), Ch 3 (External Features of Plants), Ch 4 (Respiration)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },
    { id: 'se-7-ann-ban', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-ban', chaptersBn: 'গদ্য: পিতৃপুরুষের গল্প, ছবির রং, সেই ছেলেটি; কবিতা: শ্রাবণে, গারো পাহাড়ের নিচে, সাম্য', chaptersEn: 'Prose: Pitripurusher Golpo, Chobir Rong; Poems: Shrabone, Samyo', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-7-ann-eng', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-eng', chaptersBn: 'English For Today: Units 5–9; Grammar: Preposition, Voice Change, Punctuation; Writing: Dialogue & Short Essay', chaptersEn: 'English For Today: Units 5–9; Grammar: Prepositions, Voice, Punctuation; Writing: Dialogue & Essay', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-7-ann-math', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ৫ (বীজগণিতীয় সূত্রাবলি), অধ্যায় ৭ (সরল সমীকরণ), অধ্যায় ৯ (ত্রিভুজ), অধ্যায় ১১ (তথ্য ও উপাত্ত)', chaptersEn: 'Ch 5 (Algebraic Formulae), Ch 7 (Simple Equations), Ch 9 (Triangles), Ch 11 (Information & Data)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-7-ann-sci', academicYearId: 'ay-2026', classId: 'cls-7', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-sci', chaptersBn: 'অধ্যায় ৬ (পদার্থের গঠন), অধ্যায় ৭ (শক্তির ব্যবহার), অধ্যায় ৮ (শব্দের কথা), অধ্যায় ৯ (তাপ ও তাপমাত্রা)', chaptersEn: 'Ch 6 (Structure of Matter), Ch 7 (Use of Energy), Ch 8 (Sound), Ch 9 (Heat & Temperature)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },

    // Class 6 — Half-Yearly & Annual
    { id: 'se-6-hy-ban', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-ban', chaptersBn: 'চারুপাঠ: সততার পুরস্কার, মিনু, নীলনদ আর পিরামিডের দেশ; কবিতা: জন্মভূমি, সুখ, মানুষ জাতি', chaptersEn: 'Charupath: Shototar Puroshkar, Minu, Nilnod ar Pyramider Desh; Poems: Jonmobhumi, Shukh, Manush Jati', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-6-hy-eng', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-eng', chaptersBn: 'English For Today: Lessons 1–12; Grammar: Sentence, Parts of Speech, Number, Gender, Articles; Writing: Paragraph', chaptersEn: 'English For Today: Lessons 1–12; Grammar: Sentence, Parts of Speech, Number, Gender, Articles; Writing: Paragraph', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-6-hy-math', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ১ (স্বাভাবিক সংখ্যা ও ভগ্নাংশ), অধ্যায় ২ (অনুপাত ও শতকরা), অধ্যায় ৩ (পূর্ণসংখ্যা), অধ্যায় ৬ (জ্যামিতির মৌলিক ধারণা)', chaptersEn: 'Ch 1 (Whole Numbers & Fractions), Ch 2 (Ratio & Percentage), Ch 3 (Integers), Ch 6 (Basic Geometry)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-6-hy-sci', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-sci', chaptersBn: 'অধ্যায় ১ (বৈজ্ঞানিক প্রক্রিয়া ও পরিমাপ), অধ্যায় ২ (জীবজগৎ), অধ্যায় ৩ (উদ্ভিদ ও প্রাণীর কোষীয় সংগঠন)', chaptersEn: 'Ch 1 (Scientific Process & Measurement), Ch 2 (Living World), Ch 3 (Cell Organization)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },
    { id: 'se-6-hy-ict', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'HALF_YEARLY', subjectId: 'sub-ict', chaptersBn: 'অধ্যায় ১ (তথ্য ও যোগাযোগ প্রযুক্তি পরিচিতি), অধ্যায় ২ (তথ্য ও যোগাযোগ প্রযুক্তি সংশ্লিষ্ট যন্ত্রপাতি)', chaptersEn: 'Ch 1 (Intro to ICT), Ch 2 (ICT Devices & Hardware)', marksBreakdownBn: 'মোট ৫০ (লিখিত ২৫ + বহুনির্বাচনি ২৫)', marksBreakdownEn: 'Total 50 (Written 25 + MCQ 25)', displayOrder: 5 },
    { id: 'se-6-ann-ban', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-ban', chaptersBn: 'গদ্য: আকাশ, কত দিকে কত কারিগর, অমর একুশে; কবিতা: মুজিব, বাঁচতে দাও, আসমানি; ব্যাকরণ ও রচনা', chaptersEn: 'Prose: Akash, Koto Dike Koto Karigor, Omor Ekushe; Poems: Mujib, Bachte Dao, Asmani', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 1 },
    { id: 'se-6-ann-eng', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-eng', chaptersBn: 'English For Today: Lessons 13–28; Grammar: Tense, Preposition, Punctuation; Writing: Application & Composition', chaptersEn: 'English For Today: Lessons 13–28; Grammar: Tense, Preposition, Punctuation; Writing: Application & Essay', marksBreakdownBn: 'মোট ১০০ (লিখিত ১০০)', marksBreakdownEn: 'Total 100 (Written 100)', displayOrder: 2 },
    { id: 'se-6-ann-math', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-math', chaptersBn: 'অধ্যায় ৪ (বীজগণিতীয় রাশি), অধ্যায় ৫ (সরল সমীকরণ), অধ্যায় ৭ (ব্যবহারিক জ্যামিতি), অধ্যায় ৮ (তথ্য ও উপাত্ত)', chaptersEn: 'Ch 4 (Algebraic Expressions), Ch 5 (Simple Equations), Ch 7 (Practical Geometry), Ch 8 (Data & Statistics)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 3 },
    { id: 'se-6-ann-sci', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-sci', chaptersBn: 'অধ্যায় ৬ (সংবেদী অঙ্গ), অধ্যায় ৭ (পদার্থের বৈশিষ্ট্য), অধ্যায় ৯ (আলোর ঘটনা), অধ্যায় ১০ (গতি)', chaptersEn: 'Ch 6 (Sensory Organs), Ch 7 (Properties of Matter), Ch 9 (Light Phenomena), Ch 10 (Motion)', marksBreakdownBn: 'মোট ১০০ (সৃজনশীল ৭০ + বহুনির্বাচনি ৩০)', marksBreakdownEn: 'Total 100 (Written 70 + MCQ 30)', displayOrder: 4 },
    { id: 'se-6-ann-ict', academicYearId: 'ay-2026', classId: 'cls-6', groupId: null, examTerm: 'ANNUAL', subjectId: 'sub-ict', chaptersBn: 'অধ্যায় ৩ (তথ্য ও যোগাযোগ প্রযুক্তির নিরাপদ ব্যবহার), অধ্যায় ৪ (ওয়ার্ড প্রসেসিং), অধ্যায় ৫ (ইন্টারনেট পরিচিতি)', chaptersEn: 'Ch 3 (Safe Use of ICT), Ch 4 (Word Processing), Ch 5 (Intro to Internet)', marksBreakdownBn: 'মোট ৫০ (লিখিত ২৫ + বহুনির্বাচনি ২৫)', marksBreakdownEn: 'Total 50 (Written 25 + MCQ 25)', displayOrder: 5 },
  ];

  const academicEvents: AcademicEvent[] = [
    { id: 'aev-1', academicYearId: 'ay-2026', title: 'নতুন শিক্ষাবর্ষ ও পাঠ্যপুস্তক উৎসব ২০২৬', description: 'ষষ্ঠ থেকে দশম শ্রেণির সকল শিক্ষার্থীর মাঝে বিনামূল্যে সরকারি পাঠ্যবই বিতরণ।', eventType: AcademicEventType.EVENT, startDate: '2026-01-01', endDate: '2026-01-01' },
    { id: 'aev-2', academicYearId: 'ay-2026', title: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস', description: 'প্রভাতফেরি, শহীদ মিনারে পুষ্পস্তবক অর্পণ, আলোচনা সভা ও রচনা প্রতিযোগিতা।', eventType: AcademicEventType.HOLIDAY, startDate: '2026-02-21', endDate: '2026-02-21' },
    { id: 'aev-6', academicYearId: 'ay-2026', title: 'মহান স্বাধীনতা ও জাতীয় দিবস উদযাপন', description: 'জাতীয় পতাকা উত্তোলন, কুচকাওয়াজ ও মুক্তিযুদ্ধভিত্তিক সাংস্কৃতিক অনুষ্ঠান।', eventType: AcademicEventType.HOLIDAY, startDate: '2026-03-26', endDate: '2026-03-26' },
    { id: 'aev-7', academicYearId: 'ay-2026', title: 'বাংলা নববর্ষ ১৪৩৩ উদযাপন', description: 'বিদ্যালয় প্রাঙ্গণে বৈশাখী সাংস্কৃতিক অনুষ্ঠান ও সরকারি ছুটি।', eventType: AcademicEventType.HOLIDAY, startDate: '2026-04-14', endDate: '2026-04-14' },
    { id: 'aev-8', academicYearId: 'ay-2026', title: 'গ্রীষ্মকালীন অবকাশ ও ঈদ-উল-আযহা ছুটি', description: 'শিক্ষা মন্ত্রণালয়ের বাৎসরিক ছুটির তালিকা অনুযায়ী গ্রীষ্মকালীন অবকাশ।', eventType: AcademicEventType.HOLIDAY, startDate: '2026-05-18', endDate: '2026-06-04' },
    { id: 'aev-3', academicYearId: 'ay-2026', title: 'অর্ধবার্ষিক পরীক্ষা ২০২৬', description: 'ষষ্ঠ থেকে দশম শ্রেণির অর্ধবার্ষিক মূল্যায়ন ও ব্যবহারিক পরীক্ষা।', eventType: AcademicEventType.EVENT, startDate: '2026-06-15', endDate: '2026-06-30' },
    { id: 'aev-9', academicYearId: 'ay-2026', title: 'অর্ধবার্ষিক ফলাফল প্রকাশ ও অভিভাবক সমাবেশ', description: 'অনলাইনে ফলাফল প্রকাশ ও শ্রেণিশিক্ষকদের সাথে অভিভাবক মতবিনিময়।', eventType: AcademicEventType.EVENT, startDate: '2026-07-15', endDate: '2026-07-15' },
    { id: 'aev-5', academicYearId: 'ay-2026', title: '২০২৭ শিক্ষাবর্ষের ভর্তি আবেদন গ্রহণ', description: '৬ষ্ঠ থেকে ৯ম শ্রেণিতে অনলাইন ও সরাসরি ভর্তি ফরম সংগ্রহ ও জমা।', eventType: AcademicEventType.ADMISSION, startDate: '2026-11-15', endDate: '2026-12-20' },
    { id: 'aev-4', academicYearId: 'ay-2026', title: 'বার্ষিক পরীক্ষা ২০২৬', description: 'সকল শ্রেণির বার্ষিক সমাপনী ও ১০ম শ্রেণির নির্বাচনি পরীক্ষা।', eventType: AcademicEventType.EVENT, startDate: '2026-11-22', endDate: '2026-12-08' },
    { id: 'aev-10', academicYearId: 'ay-2026', title: 'মহান বিজয় দিবস উদযাপন', description: 'বিজয় র‍্যালি, আলোচনা সভা ও ক্রীড়া প্রতিযোগিতা।', eventType: AcademicEventType.HOLIDAY, startDate: '2026-12-16', endDate: '2026-12-16' },
    { id: 'aev-11', academicYearId: 'ay-2026', title: 'বার্ষিক পরীক্ষার ফলাফল প্রকাশ ও পুরস্কার বিতরণী', description: 'মেধাবী ও নিয়মিত উপস্থিত শিক্ষার্থীদের সম্মাননা ও মার্কশিট বিতরণ।', eventType: AcademicEventType.EVENT, startDate: '2026-12-28', endDate: '2026-12-28' },
  ];


  return {
    academicYears,
    academicGroups,
    classes,
    sections,
    subjects,
    books,
    classSubjects,
    academicDocuments,
    syllabusFiles,
    syllabusEntries,
    academicEvents,
  };
}
