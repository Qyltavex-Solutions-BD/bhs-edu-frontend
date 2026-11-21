import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

export function triggerPrint() {
  window.print();
}
