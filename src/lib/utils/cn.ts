import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  SchoolProfile,
  Student,
  StudentTestimonial,
  StudentTransferCertificate,
} from '@/src/types/entities';
import type { OnlineAdmissionApplication } from '@/src/types/proposed/future';
import type { UnifiedAdmissionFormValues } from '@/src/features/admission/schema';

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

export interface AdmissionFormPrintData {
  school: SchoolProfile;
  values: UnifiedAdmissionFormValues;
  targetClassNameBn: string;
  targetClassNameEn: string;
  numericClass: number;
  groupNameBn?: string | null;
  groupNameEn?: string | null;
  optionalSubjectLabel?: string | null;
  sessionLabel: string;
  declarationText?: string | null;
  submittedMeta: {
    applicationNumber: string;
    submittedAt: string;
    admissionTestRoll?: string;
    admissionTestDate?: string;
  };
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
    }
  | {
      kind: 'ADMISSION_FORM';
      data: AdmissionFormPrintData;
    }
  | {
      kind: 'ADMIT_CARD';
      school: SchoolProfile;
      application: OnlineAdmissionApplication;
      targetClassName: string;
      groupName?: string | null;
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

  // Keep URL hash compact (omit large base64 dataUrls from hash while preserving them in localStorage)
  const hashPayload =
    payload.kind === 'ADMISSION_FORM'
      ? {
          ...payload,
          data: {
            ...payload.data,
            values: {
              ...payload.data.values,
              photoPreview:
                payload.data.values.photoPreview &&
                payload.data.values.photoPreview.length < 4000
                  ? payload.data.values.photoPreview
                  : '',
              attachments: {},
            },
          },
        }
      : payload.kind === 'ADMIT_CARD'
        ? {
            ...payload,
            application: {
              ...payload.application,
              photoPreview:
                payload.application.photoPreview &&
                payload.application.photoPreview.length < 4000
                  ? payload.application.photoPreview
                  : undefined,
            },
          }
        : payload;

  const hashData = encodeCertificatePrintPayload(hashPayload);
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

export const DOC_PRINT_STORAGE_PREFIX = 'bhs_doc_print_';

export interface StandaloneDocumentPrintPayload {
  html: string;
  orientation: 'portrait' | 'landscape';
  title: string;
  createdAt: number;
}

function pruneStaleDocPrintPayloads(keepNewest = 3) {
  try {
    const now = Date.now();
    const entries: Array<{ key: string; createdAt: number }> = [];
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(DOC_PRINT_STORAGE_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) {
        localStorage.removeItem(key);
        continue;
      }
      try {
        const parsed = JSON.parse(raw) as { createdAt?: number };
        const createdAt = parsed.createdAt ?? 0;
        if (!createdAt || now - createdAt > 15 * 60 * 1000) {
          localStorage.removeItem(key);
        } else {
          entries.push({ key, createdAt });
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
    if (entries.length > keepNewest) {
      entries
        .sort((a, b) => a.createdAt - b.createdAt)
        .slice(0, entries.length - keepNewest)
        .forEach((e) => localStorage.removeItem(e.key));
    }
  } catch {
    // Ignore storage access restrictions
  }
}

function resolvePrintOrientation(node: HTMLElement): 'portrait' | 'landscape' {
  if (
    node.getAttribute('data-print-orientation') === 'landscape' ||
    node.classList.contains('print-landscape') ||
    Boolean(node.querySelector('[data-print-orientation="landscape"], .print-landscape'))
  ) {
    return 'landscape';
  }
  return 'portrait';
}

function buildCleanPrintableClone(node: HTMLElement): HTMLElement {
  const clone = node.cloneNode(true) as HTMLElement;
  clone.removeAttribute('data-certificate-print-root');
  clone.querySelectorAll('.no-print').forEach((el) => el.remove());
  return clone;
}

function openStandaloneDocumentPrintView(
  node: HTMLElement,
  orientation: 'portrait' | 'landscape'
): boolean {
  pruneStaleDocPrintPayloads(2);
  const clone = buildCleanPrintableClone(node);
  const key = `${DOC_PRINT_STORAGE_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const record: StandaloneDocumentPrintPayload = {
    html: clone.outerHTML,
    orientation,
    title: typeof document !== 'undefined' ? document.title : 'Institutional Document',
    createdAt: Date.now(),
  };

  try {
    localStorage.setItem(key, JSON.stringify(record));
  } catch {
    // Clear older print keys and retry once if storage quota was hit
    pruneStaleDocPrintPayloads(0);
    try {
      localStorage.setItem(key, JSON.stringify(record));
    } catch {
      return false;
    }
  }

  const link = document.createElement('a');
  link.href = `/print-document?key=${encodeURIComponent(key)}`;
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
  if (typeof window === 'undefined') return false;
  if (!node) {
    window.print();
    return true;
  }

  const existing = document.getElementById('certificate-print-mount');
  if (existing) existing.remove();
  const existingOrientation = document.getElementById('certificate-print-orientation');
  if (existingOrientation) existingOrientation.remove();

  const orientation = resolvePrintOrientation(node);
  const isLandscape = orientation === 'landscape';

  const orientationStyle = document.createElement('style');
  orientationStyle.id = 'certificate-print-orientation';
  orientationStyle.textContent = isLandscape
    ? '@media print { @page { size: A4 landscape; margin: 8mm; } }'
    : '@media print { @page { size: A4 portrait; margin: 8mm; } }';
  document.head.appendChild(orientationStyle);

  const mount = document.createElement('div');
  mount.id = 'certificate-print-mount';
  mount.setAttribute('data-print-orientation', orientation);
  const clone = buildCleanPrintableClone(node);
  mount.appendChild(clone);
  document.body.appendChild(mount);
  document.documentElement.classList.add('printing-certificate');
  document.body.classList.add('printing-certificate');
  if (isLandscape) {
    document.documentElement.classList.add('printing-landscape');
  }

  // Force synchronous reflow so print preview captures the mounted document immediately
  void mount.offsetHeight;

  let cleaned = false;
  let beforePrintFired = false;
  const mediaQuery =
    typeof window.matchMedia === 'function' ? window.matchMedia('print') : null;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    document.documentElement.classList.remove('printing-certificate', 'printing-landscape');
    document.body.classList.remove('printing-certificate');
    mount.remove();
    orientationStyle.remove();
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
  // clean up and launch the dedicated same-origin standalone print tab which renders
  // ONLY the exact A4 document and automatically opens the native browser Print Dialog.
  if (!beforePrintFired) {
    cleanup();
    if (payload) {
      return openStandaloneCertificatePrintView(payload);
    }
    return openStandaloneDocumentPrintView(node, orientation);
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

  const isVisible = (el: HTMLElement) =>
    el.offsetParent !== null || el.getBoundingClientRect().height > 0;

  // 1. Prefer explicitly marked A4 institutional print roots (e.g. inside open print modals)
  const certNodes = Array.from(
    document.querySelectorAll<HTMLElement>('[data-certificate-print-root="true"]')
  ).filter(isVisible);
  if (certNodes.length > 0) {
    return printCertificateNode(certNodes[certNodes.length - 1]);
  }

  // 2. Next prefer .print-sheet containers
  const sheetNodes = Array.from(
    document.querySelectorAll<HTMLElement>('.print-sheet')
  ).filter(isVisible);
  if (sheetNodes.length > 0) {
    return printCertificateNode(sheetNodes[sheetNodes.length - 1]);
  }

  // 3. Fallback to primary <main> content container so iframe print buttons always work cleanly
  const mainEl = document.querySelector<HTMLElement>('main');
  if (mainEl && isVisible(mainEl)) {
    return printCertificateNode(mainEl);
  }

  window.print();
  return true;
}

/**
 * Prints an exact official A4 DOM element using the isolated #certificate-print-mount
 * (with automatic /print-certificate or /print-document standalone fallback inside sandboxed iframes),
 * and sets document.title so Save-as-PDF uses the official document filename.
 */
export function printDocumentNode(
  node: HTMLElement | null,
  docTitle?: string,
  fallbackPayload?: CertificatePrintPayload
): boolean {
  if (typeof window === 'undefined') return false;
  const previousTitle = document.title;
  if (docTitle) {
    document.title = docTitle;
  }
  const restoreTitle = () => {
    document.title = previousTitle;
    window.removeEventListener('afterprint', restoreTitle);
  };
  window.addEventListener('afterprint', restoreTitle);

  const targetNode =
    node?.matches('[data-certificate-print-root="true"]')
      ? node
      : node?.querySelector<HTMLElement>('[data-certificate-print-root="true"]') ?? node;

  const ok = printCertificateNode(targetNode, fallbackPayload);
  if (!ok) {
    document.title = previousTitle;
  }
  return ok;
}
