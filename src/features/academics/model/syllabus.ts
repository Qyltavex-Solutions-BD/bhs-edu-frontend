import type { SyllabusExamTerm } from '@/src/types/entities';

export const SYLLABUS_TERM_LABELS: Record<SyllabusExamTerm, { bn: string; en: string }> = {
  HALF_YEARLY: { bn: 'অর্ধবার্ষিক পরীক্ষা', en: 'Half-Yearly Exam' },
  ANNUAL: { bn: 'বার্ষিক পরীক্ষা', en: 'Annual Exam' },
  SELECTION: { bn: 'নির্বাচনি (এসএসসি)', en: 'Selection / SSC Test' },
};

