import React from 'react';
import { AttendanceStatus } from '@/src/types/enums';

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
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
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

export function getStatusLabel(status: AttendanceStatus | undefined, locale: 'bn' | 'en'): string {
  const found = STATUS_OPTIONS.find((item) => item.value === status);
  if (!found) return locale === 'bn' ? 'অচিহ্নিত' : 'Unmarked';
  return locale === 'bn' ? found.bn : found.en;
}

const TONE_CLASSES: Record<'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral', string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-info/10 text-info border-info/20',
  neutral: 'bg-muted text-muted-foreground border-border',
};

export function ToneBadge({
  tone = 'neutral',
  children,
}: {
  tone?: keyof typeof TONE_CLASSES;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
) {
  const escape = (val: string | number | null | undefined) => {
    const str = String(val ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
