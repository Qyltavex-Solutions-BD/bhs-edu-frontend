import { BookType, SubjectCategory } from '@/src/types/enums';

export const BOOK_TYPE_LABELS: Record<BookType, string> = {
  [BookType.TEXTBOOK]: 'মূল পাঠ্যবই',
  [BookType.SUPPLEMENTARY]: 'সহপাঠ / দ্রুতপঠন',
  [BookType.GRAMMAR]: 'ব্যাকরণ ও নির্মিতি',
  [BookType.REFERENCE]: 'সহায়ক বই',
};

export const CATEGORY_LABELS: Record<SubjectCategory, string> = {
  [SubjectCategory.GENERAL]: 'সাধারণ',
  [SubjectCategory.LANGUAGE]: 'ভাষা',
  [SubjectCategory.MATHEMATICS]: 'গণিত',
  [SubjectCategory.SCIENCE]: 'বিজ্ঞান',
  [SubjectCategory.SOCIAL_SCIENCE]: 'সমাজবিজ্ঞান',
  [SubjectCategory.RELIGION]: 'ধর্ম ও নৈতিক শিক্ষা',
  [SubjectCategory.COMMERCE]: 'ব্যবসায় শিক্ষা',
  [SubjectCategory.TECHNICAL]: 'তথ্য ও কারিগরি',
};
