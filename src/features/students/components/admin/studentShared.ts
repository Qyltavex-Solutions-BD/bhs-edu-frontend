import type { MockDatabase } from '@/src/mocks/seed';

export function classLabel(db: MockDatabase, classId: string, locale: string) {
  const item = db.classes.find((row) => row.id === classId);
  if (!item) return '—';
  return locale === 'bn' ? item.nameBn || item.name : item.name;
}

export function errorMessage(err: unknown, fallback: string) {
  return (err as { message?: string })?.message || fallback;
}

export const BLOOD_LABEL: Record<string, string> = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A−',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B−',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O−',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB−',
};

export function getStudentAge(dob?: string | null, locale = 'bn') {
  if (!dob) return '—';
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (locale === 'bn') {
    const toBn = (n: number) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
    return `${toBn(years)} বছর ${toBn(months)} মাস`;
  }
  return `${years} yrs ${months} mos`;
}

export function studentInitials(name?: string | null) {
  if (!name) return 'ST';
  const p = name.trim().split(/\s+/);
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}
