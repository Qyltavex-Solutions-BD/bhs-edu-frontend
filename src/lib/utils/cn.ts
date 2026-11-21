import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  SchoolProfile,
  Student,
  StudentTestimonial,
  StudentTransferCertificate,
} from '@/src/types/entities';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function exportToCsv<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
) {
  if (!rows.length) return;
  const cols =
    headers ??
    Object.keys(rows[0]).map((k) => ({ key: k as keyof T, label: String(k) }));

  const escapeCell = (val: unknown) => {
    const str = val === null || val === undefined ? '' : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    cols.map((c) => escapeCell(c.label)).join(','),
    ...rows.map((r) => cols.map((c) => escapeCell(r[c.key])).join(',')),
  ];

  // UTF-8 BOM ensures Bangla renders properly in Excel
  const blob = new Blob(['\uFEFF' + lines.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type CertificatePrintPayload =
  | {
      kind: 'TC';
      school: SchoolProfile;
      tc: StudentTransferCertificate;
      student: Student;
      fatherName?: string | null;
      motherName?: string | null;
      sectionName?: string | null;
      roll?: number | null;
    }
  | {
      kind: 'TESTIMONIAL';
      school: SchoolProfile;
      testimonial: StudentTestimonial;
      student: Student;
      fatherName?: string | null;
      motherName?: string | null;
    };

export const CERT_PRINT_STORAGE_PREFIX = 'bhs_cert_print_';

function pruneStaleCertPrintPayloads() {
  try {
    const now = Date.now();
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(CERT_PRINT_STORAGE_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { createdAt?: number };
      if (!parsed.createdAt || now - parsed.createdAt > 10 * 60 * 1000) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage quota or serialization errors
  }
}

export function encodeCertificatePrintPayload(payload: CertificatePrintPayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeCertificatePrintPayload(encoded: string): CertificatePrintPayload | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (padded.length % 4)) % 4;
    const binary = atob(padded + '='.repeat(padLen));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as CertificatePrintPayload;
  } catch {
    return null;
  }
}

function openStandaloneCertificatePrintView(payload: CertificatePrintPayload) {
  pruneStaleCertPrintPayloads();
  const key = `${CERT_PRINT_STORAGE_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    localStorage.setItem(key, JSON.stringify({ payload, createdAt: Date.now() }));
  } catch {
    // Continue with URL hash transport even if storage is restricted
  }

  const hashData = encodeCertificatePrintPayload(payload);
  const link = document.createElement('a');
  link.href = `/print-certificate?key=${encodeURIComponent(key)}#p=${hashData}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

export function printCertificateNode(
  node: HTMLElement | null,
  payload?: CertificatePrintPayload
): boolean {
  if (typeof window === 'undefined' || !node) {
    if (typeof window !== 'undefined') window.print();
    return true;
  }

  const existing = document.getElementById('certificate-print-mount');
  if (existing) existing.remove();

  const mount = document.createElement('div');
  mount.id = 'certificate-print-mount';
  const clone = node.cloneNode(true) as HTMLElement;
  clone.removeAttribute('data-certificate-print-root');
  mount.appendChild(clone);
  document.body.appendChild(mount);
  document.documentElement.classList.add('printing-certificate');
  document.body.classList.add('printing-certificate');

  // Force synchronous reflow so print preview captures the mounted certificate immediately
  void mount.offsetHeight;

  let cleaned = false;
  let beforePrintFired = false;
  const mediaQuery =
    typeof window.matchMedia === 'function' ? window.matchMedia('print') : null;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    document.documentElement.classList.remove('printing-certificate');
    document.body.classList.remove('printing-certificate');
    mount.remove();
    window.removeEventListener('beforeprint', onBeforePrint);
    window.removeEventListener('afterprint', cleanup);
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', onMediaChange);
    }
  };

  const onBeforePrint = () => {
    beforePrintFired = true;
  };

  const onMediaChange = (event: MediaQueryListEvent) => {
    if (!event.matches) cleanup();
  };

  window.addEventListener('beforeprint', onBeforePrint);
  window.addEventListener('afterprint', cleanup);
  if (mediaQuery) {
    mediaQuery.addEventListener('change', onMediaChange);
  }

  // Call synchronously within the click gesture so normal browser tabs print directly
  try {
    window.focus();
  } catch {
    // Ignore cross-origin frame focus restrictions
  }
  window.print();

  // If an embedded preview iframe sandbox blocked window.print() (beforeprint never fired),
  // clean up and launch the dedicated same-origin /print-certificate view (NO file download)
  // which renders ONLY the exact certificate and automatically opens the Print Dialog.
  if (!beforePrintFired) {
    cleanup();
    if (payload) {
      openStandaloneCertificatePrintView(payload);
    }
    return false;
  }

  return true;
}

export function triggerCertificatePrint(payload: CertificatePrintPayload): boolean {
  if (typeof window === 'undefined') return false;
  const certNodes = Array.from(
    document.querySelectorAll<HTMLElement>('[data-certificate-print-root="true"]')
  ).filter((el) => el.offsetParent !== null || el.getBoundingClientRect().height > 0);
  if (certNodes.length > 0) {
    const target = certNodes[certNodes.length - 1];
    return printCertificateNode(target, payload);
  }
  return openStandaloneCertificatePrintView(payload);
}

export function triggerPrint(): boolean {
  if (typeof window === 'undefined') return false;
  const certNodes = Array.from(
    document.querySelectorAll<HTMLElement>('[data-certificate-print-root="true"]')
  ).filter((el) => el.offsetParent !== null || el.getBoundingClientRect().height > 0);
  if (certNodes.length > 0) {
    const target = certNodes[certNodes.length - 1];
    return printCertificateNode(target);
  }
  window.print();
  return true;
}
