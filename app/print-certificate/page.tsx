'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, Loader2, Printer } from 'lucide-react';
import {
  PrintableAdmissionAdmitCard,
  PrintableTestimonialCertificate,
  PrintableTransferCertificate,
} from '@/src/components/print/PrintDocuments';
import { PrintableAdmissionFormDocument } from '@/src/features/admission';
import { Button } from '@/src/components/ui/primitives';
import { useI18n } from '@/src/lib/i18n';
import {
  CERT_PRINT_STORAGE_PREFIX,
  decodeCertificatePrintPayload,
  type CertificatePrintPayload,
} from '@/src/lib/utils/cn';
import { exportNodeToA4Pdf } from '@/src/lib/utils/pdfExport';

function PrintCertificateContent() {
  const searchParams = useSearchParams();
  const { pick } = useI18n();
  const key = searchParams.get('key');
  const [payload, setPayload] = useState<CertificatePrintPayload | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const autoPrintedRef = useRef(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);

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
            {pick('প্রিন্টের জন্য ডকুমেন্ট পাওয়া যায়নি।', 'Document data for printing was not found.')}
          </p>
          <p className="text-sm text-neutral-600">
            {pick(
              'অনুগ্রহ করে মূল পাতা থেকে আবার "প্রিন্ট করুন" বাটনে ক্লিক করুন।',
              'Please click "Print" again from the main page.'
            )}
          </p>
        </div>
      </div>
    );
  }

  const pdfFilename =
    payload.kind === 'TC'
      ? `BHS-Transfer-Certificate-${payload.tc.tcNumber}`
      : payload.kind === 'TESTIMONIAL'
        ? `BHS-Testimonial-${payload.testimonial.refNumber}`
        : payload.kind === 'ADMISSION_FORM'
          ? `BHS-Admission-Form-${payload.data.submittedMeta.applicationNumber}`
          : `BHS-Admit-Card-${payload.application.applicationNumber}`;

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await exportNodeToA4Pdf(sheetRef.current, pdfFilename);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-[#111111] py-6 px-4 print:p-0 print:min-h-0">
      <div className="max-w-[794px] mx-auto mb-4 flex items-center justify-end gap-2 no-print">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={downloadingPdf}
          onClick={handleDownloadPdf}
        >
          {downloadingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{pick('PDF ডাউনলোড করুন', 'Download PDF')}</span>
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          <span>{pick('প্রিন্ট করুন', 'Print')}</span>
        </Button>
      </div>

      <div ref={sheetRef}>
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
        ) : payload.kind === 'TESTIMONIAL' ? (
          <PrintableTestimonialCertificate
            school={payload.school}
            testimonial={payload.testimonial}
            student={payload.student}
            fatherName={payload.fatherName}
            motherName={payload.motherName}
          />
        ) : payload.kind === 'ADMISSION_FORM' ? (
          <PrintableAdmissionFormDocument data={payload.data} />
        ) : (
          <PrintableAdmissionAdmitCard
            school={payload.school}
            application={payload.application}
            targetClassName={payload.targetClassName}
            groupName={payload.groupName}
          />
        )}
      </div>
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
