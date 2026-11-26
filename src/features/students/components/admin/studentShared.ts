import type { SchoolProfile } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';

export function classLabel(db: MockDatabase, classId: string, locale: string) {
  const item = db.classes.find((row) => row.id === classId);
  if (!item) return '—';
  return locale === 'bn' ? item.nameBn || item.name : item.name;
}

export function errorMessage(err: unknown, fallback: string) {
  const e = err as { data?: { message?: string | string[] }; message?: string };
  const msg = e?.data?.message ?? e?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return msg || fallback;
}

export function resolveSchoolProfile(school?: SchoolProfile | null): SchoolProfile {
  return {
    id: school?.id || 'school-profile-1',
    name: school?.name || 'ভোজেশ্বর উচ্চ বিদ্যালয়',
    nameEn: school?.nameEn || 'Bhojeshwar High School',
    motto: school?.motto || 'শিক্ষাই আলো, জ্ঞানই শক্তি',
    eiin: school?.eiin || '113587',
    schoolCode: school?.schoolCode || 'BHS',
    address:
      school?.address || 'ডাকঘর: ভোজেশ্বর (মশুরা), উপজেলা: নড়িয়া, জেলা: শরীয়তপুর।',
    phone: school?.phone || '+880 1700-000000',
    email: school?.email || 'info@bhs.edu.bd',
    website: school?.website || 'https://bhojeshwarhighschool.edu.bd',
    logo: school?.logo ?? null,
    establishedYear: school?.establishedYear || 1978,
    createdAt: school?.createdAt || '',
    updatedAt: school?.updatedAt || '',
  };
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
