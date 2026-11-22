'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer } from 'lucide-react';
import {
  PrintableTestimonialCertificate,
  PrintableTransferCertificate,
} from '@/src/components/print/PrintDocuments';
import { Button } from '@/src/components/ui/primitives';
import { useI18n } from '@/src/lib/i18n';
import {
  CERT_PRINT_STORAGE_PREFIX,
  decodeCertificatePrintPayload,
  type CertificatePrintPayload,
} from '@/src/lib/utils/cn';

function PrintCertificateContent() {
  const searchParams = useSearchParams();
  const { pick } = useI18n();
  const key = searchParams.get('key');
  const [payload, setPayload] = useState<CertificatePrintPayload | null>(null);
  const [loaded, setLoaded] = useState(false);
  const autoPrintedRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    let resolved: CertificatePrintPayload | null = null;

    if (key && key.startsWith(CERT_PRINT_STORAGE_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as { payload?: CertificatePrintPayload };
          if (parsed.payload) {
            resolved = parsed.payload;
          }
        }
      } catch {
        // Ignore storage errors and fall back to URL hash
      }
    }

    if (!resolved && typeof window !== 'undefined' && window.location.hash) {
      const match = window.location.hash.match(/[#&]p=([^&]+)/);
      if (match?.[1]) {
        resolved = decodeCertificatePrintPayload(match[1]);
      }
    }

    if (resolved) {
      setPayload(resolved);
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!payload || autoPrintedRef.current) return;
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

      const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('img'));
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
            window.focus();
            window.print();
          }
        }, 120);
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
            {pick('প্রিন্টের জন্য সনদপত্র পাওয়া যায়নি।', 'Certificate data for printing was not found.')}
          </p>
          <p className="text-sm text-neutral-600">
            {pick(
              'অনুগ্রহ করে মূল পাতা থেকে আবার "প্রিন্ট করুন" বাটনে ক্লিক করুন।',
              'Please click "Print Certificate" again from the main registry page.'
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#111111] py-6 px-4 print:p-0 print:min-h-0">
      <div className="max-w-[794px] mx-auto mb-4 flex items-center justify-end no-print">
        <Button type="button" variant="primary" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          <span>{pick('প্রিন্ট করুন', 'Print Certificate')}</span>
        </Button>
      </div>

      {payload.kind === 'TC' ? (
        <PrintableTransferCertificate
          school={payload.school}
          tc={payload.tc}
          student={payload.student}
          fatherName={payload.fatherName}
          motherName={payload.motherName}
          sectionName={payload.sectionName}
          roll={payload.roll}
        />
      ) : (
        <PrintableTestimonialCertificate
          school={payload.school}
          testimonial={payload.testimonial}
          student={payload.student}
          fatherName={payload.fatherName}
          motherName={payload.motherName}
        />
      )}
    </main>
  );
}

export default function PrintCertificatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <PrintCertificateContent />
    </Suspense>
  );
}
