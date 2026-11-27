'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, X } from 'lucide-react';
import { Button } from '@/src/components/ui/primitives';
import {
  DOC_PRINT_STORAGE_PREFIX,
  type StandaloneDocumentPrintPayload,
} from '@/src/lib/utils/cn';

function PrintDocumentContent() {
  const searchParams = useSearchParams();
  const key = searchParams.get('key');
  const [payload, setPayload] = useState<StandaloneDocumentPrintPayload | null>(null);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const autoPrintedRef = useRef(false);

  // Always force crisp light-mode paper when rendering A4 print document
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    let resolved: StandaloneDocumentPrintPayload | null = null;
    if (key && key.startsWith(DOC_PRINT_STORAGE_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as StandaloneDocumentPrintPayload;
          if (parsed && typeof parsed.html === 'string') {
            resolved = parsed;
          }
        }
      } catch {
        // Ignore storage read errors
      }
    }
    if (resolved) {
      setPayload(resolved);
      if (resolved.title) {
        document.title = resolved.title;
      }
    }
    setLoaded(true);
  }, [key]);

  // Inject exact A4 Portrait / Landscape @page rule and trigger print once fonts & images load
  useEffect(() => {
    if (!payload) return;
    const isLandscape = payload.orientation === 'landscape';
    if (isLandscape) {
      document.documentElement.classList.add('printing-landscape');
    } else {
      document.documentElement.classList.remove('printing-landscape');
    }
    const style = document.createElement('style');
    style.id = 'standalone-a4-page-rule';
    style.textContent = isLandscape
      ? '@media print { @page { size: A4 landscape; margin: 8mm; } }'
      : '@media print { @page { size: A4 portrait; margin: 8mm; } }';
    document.head.appendChild(style);

    return () => {
      style.remove();
      document.documentElement.classList.remove('printing-landscape');
    };
  }, [payload]);

  // Parse, sanitize, and mount document HTML safely without dangerouslySetInnerHTML,
  // then wait for fonts & images before launching the browser print dialog.
  useEffect(() => {
    if (!payload) return;

    const host = containerRef.current;
    if (host) {
      const parser = new DOMParser();
      const parsedDoc = parser.parseFromString(payload.html, 'text/html');
      parsedDoc
        .querySelectorAll('script, iframe, object, embed, link[rel="import"], base')
        .forEach((el) => el.remove());
      parsedDoc.querySelectorAll('*').forEach((el) => {
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase();
          const val = attr.value.trim().toLowerCase();
          if (
            name.startsWith('on') ||
            ((name === 'href' || name === 'src' || name === 'xlink:href') &&
              val.startsWith('javascript:'))
          ) {
            el.removeAttribute(attr.name);
          }
        }
      });
      const fragment = document.createDocumentFragment();
      Array.from(parsedDoc.body.childNodes).forEach((node) => {
        fragment.appendChild(document.importNode(node, true));
      });
      host.replaceChildren(fragment);
    }

    if (autoPrintedRef.current) return;
    autoPrintedRef.current = true;

    let cancelled = false;
    const runAutoPrint = async () => {
      try {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
      } catch {
        // Ignore font readiness errors
      }

      // Allow layout paint before querying images
      await new Promise((resolve) => setTimeout(resolve, 60));

      const root = containerRef.current ?? document;
      const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
      await Promise.all(
        imgs.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          });
        })
      );

      if (!cancelled) {
        setTimeout(() => {
          if (!cancelled) {
            try {
              window.focus();
            } catch {
              // Ignore focus errors
            }
            window.print();
          }
        }, 140);
      }
    };

    void runAutoPrint();
    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (!loaded) {
    return <div className="min-h-screen bg-white" />;
  }

  if (!payload) {
    return (
      <div className="min-h-screen bg-white text-[#111111] flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-2 border border-neutral-300 rounded-md p-6">
          <p className="text-base font-semibold">
            {'প্রিন্টের জন্য ডকুমেন্ট পাওয়া যায়নি।'}
          </p>
          <p className="text-sm text-neutral-600">
            {'অনুগ্রহ করে মূল পাতা থেকে আবার "প্রিন্ট" বাটনে ক্লিক করুন।'}
          </p>
        </div>
      </div>
    );
  }

  const isLandscape = payload.orientation === 'landscape';

  return (
    <main className="min-h-screen bg-[#F4F4F5] text-[#111111] py-6 px-4 print:bg-white print:p-0 print:min-h-0">
      {/* Screen-only Print Toolbar */}
      <div
        className={`${
          isLandscape ? 'max-w-[297mm]' : 'max-w-[210mm]'
        } mx-auto mb-4 flex flex-wrap items-center justify-between gap-3 bg-white border border-neutral-300 rounded-md px-4 py-2.5 shadow-xs no-print`}
      >
        <div className="text-sm text-neutral-700">
          <span className="font-semibold text-[#111111]">
            {isLandscape
              ? 'A4 ল্যান্ডস্কেপ প্রিন্ট প্রিভিউ (২৯৭ × ২১০ মিমি)'
              : 'A4 পোর্ট্রেট প্রিন্ট প্রিভিউ (২১০ × ২৯৭ মিমি)'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => window.close()}>
            <X className="w-4 h-4" />
            <span>{'বন্ধ করুন'}</span>
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            <span>{'প্রিন্ট / PDF সংরক্ষণ'}</span>
          </Button>
        </div>
      </div>

      {/* True-to-Scale A4 Canvas */}
      <div
        ref={containerRef}
        data-print-orientation={payload.orientation}
        className={`a4-print-canvas ${
          isLandscape ? 'a4-landscape max-w-[297mm]' : 'a4-portrait max-w-[210mm]'
        } mx-auto bg-white print:max-w-none print:w-full print:m-0`}
      />
    </main>
  );
}

export default function PrintDocumentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <PrintDocumentContent />
    </Suspense>
  );
}
