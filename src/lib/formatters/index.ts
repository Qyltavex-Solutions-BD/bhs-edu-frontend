import type { GradeRange, GradingScale } from '@/src/types/entities';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const BN_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function toBnDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

export function formatNumber(
  value: number | string | null | undefined,
  locale: 'bn' | 'en',
  decimals?: number
): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  const formatted =
    decimals !== undefined ? num.toFixed(decimals) : num.toLocaleString('en-US');
  return locale === 'bn' ? toBnDigits(formatted) : formatted;
}

export function formatBdt(amount: number, locale: 'bn' | 'en'): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return locale === 'bn' ? `৳${toBnDigits(formatted)}` : `BDT ${formatted}`;
}

export function formatBdPhone(phone?: string | null, locale: 'bn' | 'en' = 'en'): string {
  if (!phone) return '—';
  const cleaned = phone.replace(/[^\d+]/g, '');
  return locale === 'bn' ? toBnDigits(cleaned) : cleaned;
}

export function formatDateLong(
  dateInput: string | Date | null | undefined,
  locale: 'bn' | 'en'
): string {
  if (!dateInput) return '—';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return String(dateInput);
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();
  if (locale === 'bn') {
    return `${toBnDigits(day)} ${BN_MONTHS[month]} ${toBnDigits(year)}`;
  }
  return `${day} ${EN_MONTHS[month]} ${year}`;
}

export function formatDateShort(
  dateInput: string | Date | null | undefined,
  locale: 'bn' | 'en'
): string {
  if (!dateInput) return '—';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return String(dateInput);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  const out = `${dd}/${mm}/${yyyy}`;
  return locale === 'bn' ? toBnDigits(out) : out;
}

export function formatTime12h(timeStr?: string | null, locale: 'bn' | 'en' = 'bn'): string {
  if (!timeStr) return '—';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hh = Number(parts[0]);
  const mm = parts[1].slice(0, 2);
  if (Number.isNaN(hh)) return timeStr;
  const isPm = hh >= 12;
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  const str = `${String(h12).padStart(2, '0')}:${mm}`;
  if (locale === 'bn') {
    const period = hh < 12 ? 'সকাল' : hh < 15 ? 'দুপুর' : hh < 18 ? 'বিকাল' : 'সন্ধ্যা';
    return `${period} ${toBnDigits(str)}`;
  }
  return `${str} ${isPm ? 'PM' : 'AM'}`;
}

/**
 * Configurable Grade & GPA Calculator driven strictly by GradingScale & GradeRange.
 * Optional subject bonus policy: as noted in DBML `StudentSubjectResult.bonusGradePoint`,
 * bonus = max(0, gradePoint - 2.00) when optional subject is passed (school policy configurable).
 */
export function resolveGradeFromScale(
  obtainedMarks: number,
  fullMarks: number,
  ranges: GradeRange[],
  isAbsent: boolean,
  passMarks?: number
): { letterGrade: string; gradePoint: number; isPassed: boolean; percentage: number } {
  const activeRanges = ranges
    .filter((r) => !r.isDeleted)
    .sort((a, b) => b.minPercentage - a.minPercentage);

  const failRange = activeRanges.find((r) => r.isFailGrade) ?? {
    letterGrade: 'F',
    gradePoint: 0.0,
  };

  if (isAbsent || fullMarks <= 0) {
    return {
      letterGrade: failRange.letterGrade,
      gradePoint: failRange.gradePoint,
      isPassed: false,
      percentage: 0,
    };
  }

  const percentage = Math.round((obtainedMarks / fullMarks) * 10000) / 100;
  if (passMarks !== undefined && obtainedMarks < passMarks) {
    return {
      letterGrade: failRange.letterGrade,
      gradePoint: failRange.gradePoint,
      isPassed: false,
      percentage,
    };
  }

  const matched = activeRanges.find(
    (r) => percentage >= r.minPercentage && percentage <= r.maxPercentage + 0.001
  );

  if (!matched || matched.isFailGrade) {
    return {
      letterGrade: failRange.letterGrade,
      gradePoint: failRange.gradePoint,
      isPassed: false,
      percentage,
    };
  }

  return {
    letterGrade: matched.letterGrade,
    gradePoint: matched.gradePoint,
    isPassed: true,
    percentage,
  };
}

export function calculateOverallGpa(
  subjectResults: Array<{
    gradePoint: number;
    isPassed: boolean;
    isOptional: boolean;
  }>,
  scale: Pick<GradingScale, 'maxGpa'>,
  ranges: GradeRange[],
  optionalBonusThreshold = 2.0
): {
  gpa: number;
  gpaWithoutOptional: number;
  letterGrade: string;
  failedSubjectCount: number;
  isPassed: boolean;
} {
  const compulsory = subjectResults.filter((s) => !s.isOptional);
  const optional = subjectResults.filter((s) => s.isOptional);

  const failedSubjectCount = compulsory.filter((s) => !s.isPassed).length;
  const activeRanges = ranges
    .filter((r) => !r.isDeleted)
    .sort((a, b) => b.gradePoint - a.gradePoint);

  if (compulsory.length === 0 || failedSubjectCount > 0) {
    return {
      gpa: 0.0,
      gpaWithoutOptional: 0.0,
      letterGrade: activeRanges.find((r) => r.isFailGrade)?.letterGrade ?? 'F',
      failedSubjectCount,
      isPassed: false,
    };
  }

  const compulsoryPoints = compulsory.reduce((sum, s) => sum + s.gradePoint, 0);
  const gpaWithoutOptional = Math.round((compulsoryPoints / compulsory.length) * 100) / 100;

  const bonusPoints = optional.reduce((sum, s) => {
    if (!s.isPassed) return sum;
    return sum + Math.max(0, s.gradePoint - optionalBonusThreshold);
  }, 0);

  const rawWithBonus = (compulsoryPoints + bonusPoints) / compulsory.length;
  const gpa = Math.min(scale.maxGpa, Math.round(rawWithBonus * 100) / 100);

  const matchedLetter =
    activeRanges.find((r) => !r.isFailGrade && gpa >= r.gradePoint)?.letterGrade ??
    activeRanges[activeRanges.length - 2]?.letterGrade ??
    'D';

  return {
    gpa,
    gpaWithoutOptional,
    letterGrade: matchedLetter,
    failedSubjectCount: 0,
    isPassed: true,
  };
}
