import { AttendanceStatus } from '@/src/types/enums';
import { closedDay, localToday, shiftDate } from '@/src/lib/schoolDay';
import type { MockDatabase } from '@/src/mocks/seed';

export function errorMessage(err: unknown, fallback: string): string {
  const e = err as { message?: string; data?: { message?: string } } | null | undefined;
  return e?.data?.message || e?.message || fallback;
}

export const STATUS_OPTIONS = [
  {
    value: AttendanceStatus.PRESENT,
    bn: 'উপস্থিত',
    en: 'Present',
    shortBn: 'উপ.',
    shortEn: 'P',
    on: 'bg-success text-white border-success',
  },
  {
    value: AttendanceStatus.ABSENT,
    bn: 'অনুপস্থিত',
    en: 'Absent',
    shortBn: 'অনু.',
    shortEn: 'A',
    on: 'bg-destructive text-white border-destructive',
  },
  {
    value: AttendanceStatus.LATE,
    bn: 'দেরি',
    en: 'Late',
    shortBn: 'দেরি',
    shortEn: 'L',
    on: 'bg-warning text-white border-warning',
  },
  {
    value: AttendanceStatus.LEAVE,
    bn: 'ছুটি',
    en: 'Leave',
    shortBn: 'ছুটি',
    shortEn: 'LV',
    on: 'bg-info text-white border-info',
  },
] as const;

export function formatClockTime(iso?: string | null): string {
  if (!iso) return '—';
  // Handle both "2026-11-19T09:52:00" and full ISO "2026-11-19T09:52:00.000Z" cleanly
  const match = iso.match(/T(\d{2}:\d{2})/);
  if (match) return match[1];
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatScanDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const datePart = iso.slice(0, 10);
  const timePart = formatClockTime(iso);
  return `${datePart} · ${timePart}`;
}

export function attendanceRateTone(rate: number | null): string {
  if (rate === null) return 'text-muted-foreground';
  if (rate >= 85) return 'text-success';
  if (rate >= 75) return 'text-foreground';
  return 'text-destructive';
}

export function attendanceBarTone(rate: number | null): string {
  if (rate === null) return 'bg-border';
  if (rate >= 85) return 'bg-success';
  if (rate >= 75) return 'bg-warning';
  return 'bg-destructive';
}

export function shiftOpenDay(
  db: MockDatabase,
  fromIso: string,
  yearId: string,
  direction: -1 | 1
): string | null {
  const today = localToday();
  let cursor = shiftDate(fromIso, direction);
  for (let i = 0; i < 30; i += 1) {
    if (cursor > today) return null;
    if (!closedDay(db, cursor, yearId)) return cursor;
    cursor = shiftDate(cursor, direction);
  }
  return null;
}

export function getStatusLabel(status: AttendanceStatus | undefined, locale: 'bn' | 'en'): string {
  const found = STATUS_OPTIONS.find((item) => item.value === status);
  if (!found) return locale === 'bn' ? 'অচিহ্নিত' : 'Unmarked';
  return locale === 'bn' ? found.bn : found.en;
}
