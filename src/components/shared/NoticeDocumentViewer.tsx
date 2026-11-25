'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  Printer,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/src/lib/i18n';
import { formatDateLong } from '@/src/lib/formatters';
import { SchoolEmblem, SCHOOL_LOGO_SRC } from '@/src/components/shared/Feedback';
import type { Notice, NoticeAttachmentType, SchoolProfile } from '@/src/types/entities';
import { cn, triggerPrint } from '@/src/lib/utils/cn';

export function resolveNoticeFormat(notice: Notice): NoticeAttachmentType {
  if (notice.attachmentType) return notice.attachmentType;
  if (notice.attachment) {
    const lower = notice.attachment.toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')) {
      return 'IMAGE';
    }
    return 'PDF';
  }
  return 'OFFICIAL_PAD';
}

export function NoticeFormatBadge({
  notice,
  showSize = false,
  className,
}: {
  notice: Notice;
  showSize?: boolean;
  className?: string;
}) {
  const { pick } = useI18n();

  if (!notice.attachment && !notice.attachmentType && !notice.attachmentUrl) {
    return null;
  }

  const format = resolveNoticeFormat(notice);

  if (format === 'PDF') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border leading-none whitespace-nowrap',
          'bg-destructive/8 text-destructive border-destructive/20',
          className
        )}
      >
        <FileText className="w-3.5 h-3.5 shrink-0" />
        <span>PDF</span>
        {showSize && notice.attachmentSize && (
          <span className="opacity-75 font-normal tabular-nums">· {notice.attachmentSize}</span>
        )}
      </span>
    );
  }

  if (format === 'IMAGE') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border leading-none whitespace-nowrap',
          'bg-secondary/10 text-secondary border-secondary/20',
          className
        )}
      >
        <ImageIcon className="w-3.5 h-3.5 shrink-0" />
        <span>{pick('ইমেজ', 'Image')}</span>
        {showSize && notice.attachmentSize && (
          <span className="opacity-75 font-normal tabular-nums">· {notice.attachmentSize}</span>
        )}
      </span>
    );
  }

  return null;
}

export function downloadNoticeDocument(
  notice: Notice,
  school?: SchoolProfile | null,
  locale: 'bn' | 'en' = 'bn',
  showToast: boolean = true
) {
  const effectiveUrl = notice.attachmentUrl;

  // 1. If an actual uploaded PDF or Image data URL exists, download the exact uploaded binary file
  if (effectiveUrl) {
    const a = document.createElement('a');
    a.href = effectiveUrl.endsWith(`/notices/${notice.id}/document`)
      ? `${effectiveUrl}?download=true`
      : effectiveUrl;
    a.download = notice.attachment || `BHS-Notice-${notice.id}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (showToast) {
      toast.success(
        locale === 'bn'
          ? `${notice.attachment || 'বিজ্ঞপ্তি'} ডাউনলোড শুরু হয়েছে।`
          : `Downloading ${notice.attachment || 'notice document'}.`
      );
    }
    return;
  }

  if (!notice.description?.trim()) {
    toast.error(locale === 'bn' ? '\u09a8\u09a5\u09bf \u09aa\u09be\u0993\u09af\u09bc\u09be \u09af\u09be\u09af\u09bc\u09a8\u09bf\u0964' : 'The document is unavailable.');
    return;
  }

  // 2. Otherwise generate a clean standalone printable Official BHS A4 Circular HTML file
  const schoolName = school?.name ?? 'ভোজেশ্বর উচ্চ বিদ্যালয়';
  const schoolNameEn = school?.nameEn ?? 'Bhojeshwar High School';
  const address = school?.address ?? 'ডাকঘর: ভোজেশ্বর, উপজেলা: নড়িয়া, জেলা: শরীয়তপুর';
  const eiin = school?.eiin ?? '113587';
  const memo = notice.memoNo ?? `ভউবি/নোটিশ/২০২৬/${notice.id.slice(-3)}`;
  const dateText = formatDateLong(notice.publishedAt ?? notice.createdAt, locale);
  const safeBody = notice.description
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

  const html = `<!doctype html>
<html lang="bn">
<head>
  <meta charset="utf-8" />
  <title>${notice.title} — ${schoolName}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    body { font-family: "Noto Sans Bengali", "SolaimanLipi", system-ui, sans-serif; color: #111827; margin: 0; padding: 32px; background: #f3f5f4; }
    .sheet { max-width: 794px; margin: 0 auto; background: #ffffff; padding: 48px 54px; border: 1px solid #d1d5db; box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
    .head { text-align: center; border-bottom: 3px double #0A6E31; padding-bottom: 14px; margin-bottom: 18px; }
    .head h1 { margin: 0; font-size: 24px; color: #094724; }
    .head h2 { margin: 2px 0 6px; font-size: 14px; letter-spacing: 0.08em; color: #374151; text-transform: uppercase; }
    .head p { margin: 0; font-size: 13px; color: #4b5563; }
    .meta { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 22px; color: #374151; }
    .heading { text-align: center; font-size: 20px; font-weight: 700; text-decoration: underline; margin: 0 0 18px; color: #094724; }
    .subject { font-size: 16px; font-weight: 700; margin-bottom: 14px; line-height: 1.5; }
    .body { font-size: 16px; line-height: 1.85; text-align: justify; margin-bottom: 42px; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; font-size: 13px; }
    .sig { text-align: center; min-width: 180px; }
    .sig-line { border-top: 1px solid #374151; padding-top: 6px; font-weight: 700; }
    @media print { body { background: #fff; padding: 0; } .sheet { border: none; box-shadow: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <h1>${schoolName}</h1>
      <h2>${schoolNameEn}</h2>
      <p>${address} · স্থাপিত: ১৯৭৮ খ্রি. · EIIN: ${eiin}</p>
    </div>
    <div class="meta">
      <div>স্মারক নং: <strong>${memo}</strong></div>
      <div>তারিখ: <strong>${dateText}</strong></div>
    </div>
    <div class="heading">${notice.isUrgent ? 'জরুরি বিজ্ঞপ্তি' : 'বিজ্ঞপ্তি'}</div>
    <div class="subject">বিষয়: ${notice.title}</div>
    <div class="body">${safeBody}</div>
    <div class="footer">
      <div>
        <strong>অনুলিপি (সদয় অবগতি ও কার্যার্থে):</strong><br/>
        ১. সভাপতি, ম্যানেজিং কমিটি, ${schoolName}।<br/>
        ২. সকল শ্রেণি শিক্ষক ও বিভাগীয় প্রধান।<br/>
        ৩. অফিস নোটিশ বোর্ড ও বিদ্যালয় ওয়েবসাইট।
      </div>
      <div class="sig">
        <div class="sig-line">প্রধান শিক্ষক</div>
        <div>${schoolName}</div>
        <div>নড়িয়া, শরীয়তপুর</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const baseName = (notice.attachment ?? `BHS-Notice-${notice.id}`).replace(/\.(pdf|jpg|jpeg|png)$/i, '');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}-Official-Circular.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  if (showToast) {
    toast.success(
      locale === 'bn'
        ? 'অফিসিয়াল বিজ্ঞপ্তির কপি ডাউনলোড হয়েছে (প্রিন্ট/PDF সেভ করতে ফাইলটি খুলুন)।'
        : 'Official circular copy downloaded.'
    );
  }
}

/**
 * Official BHS Signed A4 Circular Document Renderer
 * Used when displaying PDF/Image seeded notices or digital official letterhead circulars
 */
function OfficialCircularSheet({
  notice,
  school,
}: {
  notice: Notice;
  school?: SchoolProfile | null;
}) {
  const { locale, pick } = useI18n();
  const dateText = formatDateLong(notice.publishedAt ?? notice.createdAt, locale);
  const memoNo = notice.memoNo ?? `ভউবি/নোটিশ/২০২৬/${notice.id.slice(-3)}`;

  const paragraphs = notice.description
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="relative mx-auto w-full max-w-[740px] rounded-sm bg-white text-[#111827] border border-black/12 shadow-[0_22px_50px_-14px_rgba(0,0,0,0.28)] overflow-hidden">
      {/* Subtle Top Institutional Heritage Bar */}
      <div className="h-1.5 bg-[#0A6E31] w-full" />

      {/* Faint Centered BHS Watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]"
      >
        <img
          src={SCHOOL_LOGO_SRC}
          alt=""
          className="w-72 h-72 object-contain grayscale"
        />
      </div>

      {/* Main A4 Paper Content */}
      <div className="relative z-[1] px-6 py-7 sm:px-11 sm:py-10 space-y-6">
        {/* Official BHS Letterhead Header */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pb-4 border-b-[3px] border-double border-[#0A6E31] text-center sm:text-left">
          <SchoolEmblem size={58} className="ring-1 ring-[#0A6E31]/25 shrink-0 bg-white" />
          <div className="space-y-0.5">
            <h3 className="text-xl sm:text-2xl font-bold text-[#094724] tracking-tight leading-tight">
              {school?.name ?? 'ভোজেশ্বর উচ্চ বিদ্যালয়'}
            </h3>
            <p className="text-xs font-bold tracking-[0.12em] uppercase text-[#374151]">
              {school?.nameEn ?? 'BHOJESHWAR HIGH SCHOOL'}
            </p>
            <p className="text-xs text-[#4B5563] tabular-nums">
              {school?.address ?? 'ডাকঘর: ভোজেশ্বর, উপজেলা: নড়িয়া, জেলা: শরীয়তপুর'} ·{' '}
              {pick('স্থাপিত: ১৯৭৮ খ্রি.', 'Est. 1978')} · EIIN: {school?.eiin ?? '113587'}
            </p>
          </div>
        </div>

        {/* Memo Number & Published Date Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[#374151] tabular-nums">
          <p>
            <span className="text-[#6B7280]">{pick('স্মারক নং:', 'Memo No:')}</span>{' '}
            <strong className="font-semibold text-[#111827]">{memoNo}</strong>
          </p>
          <p>
            <span className="text-[#6B7280]">{pick('তারিখ:', 'Date:')}</span>{' '}
            <strong className="font-semibold text-[#111827]">{dateText}</strong>
          </p>
        </div>

        {/* Centered Official Circular Heading */}
        <div className="text-center pt-1">
          <span
            className={cn(
              'inline-block text-base sm:text-lg font-bold tracking-wide pb-1 border-b-2',
              notice.isUrgent
                ? 'text-[#B91C1C] border-[#B91C1C]'
                : 'text-[#094724] border-[#094724]'
            )}
          >
            {notice.isUrgent
              ? pick('জরুরি বিজ্ঞপ্তি', 'URGENT NOTICE')
              : pick('অফিসিয়াল বিজ্ঞপ্তি', 'OFFICIAL NOTICE')}
          </span>
        </div>

        {/* Subject Line */}
        <div className="text-base font-bold text-[#111827] leading-relaxed bg-[#F8FAF9] border-l-3 border-[#0A6E31] px-3.5 py-2.5">
          <span className="text-[#094724]">{pick('বিষয়:', 'Subject:')}</span> {notice.title}
        </div>

        {/* Circular Body Paragraphs */}
        <div className="space-y-3 text-base text-[#1F2937] leading-[1.85] text-justify">
          {paragraphs.map((line, i) => {
            const isBullet = line.startsWith('•') || line.startsWith('-');
            return isBullet ? (
              <p key={i} className="pl-4 text-left">
                {line}
              </p>
            ) : (
              <p key={i}>{line}</p>
            );
          })}
        </div>

        {/* Official Footer: Distribution Copy + Institutional Seal + Headteacher Signature */}
        <div className="pt-8 mt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          {/* Distribution List */}
          <div className="text-xs text-[#4B5563] leading-relaxed space-y-0.5">
            <p className="font-semibold text-[#111827] mb-1">
              {pick('অনুলিপি (সদয় অবগতি ও কার্যার্থে):', 'Copy for kind information & action:')}
            </p>
            <p>১. {pick('সভাপতি, ম্যানেজিং কমিটি, ভোজেশ্বর উচ্চ বিদ্যালয়।', 'President, Managing Committee, BHS.')}</p>
            <p>২. {pick('সকল শ্রেণি শিক্ষক ও সংশ্লিষ্ট বিভাগ।', 'All Class Teachers & Departments.')}</p>
            <p>৩. {pick('অফিস নোটিশ বোর্ড ও ডিজিটাল ওয়েবসাইট।', 'Office Notice Board & Official Website.')}</p>
          </div>

          {/* Authentic Round Institutional Stamp + Signature Block */}
          <div className="relative flex items-end gap-4 self-end">
            {/* Official Round Rubber Stamp SVG */}
            <svg
              viewBox="0 0 110 110"
              className="w-20 h-20 text-[#124B96]/65 -rotate-12 shrink-0 select-none"
              aria-hidden="true"
            >
              <circle cx="55" cy="55" r="50" fill="none" stroke="currentColor" strokeWidth="2.4" />
              <circle cx="55" cy="55" r="44" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="55" cy="55" r="24" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <text x="55" y="25" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="currentColor">
                BHOJESHWAR
              </text>
              <text x="55" y="53" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="currentColor">
                BHS
              </text>
              <text x="55" y="64" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor">
                EST. 1978
              </text>
              <text x="55" y="90" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="currentColor">
                SHARIATPUR
              </text>
            </svg>

            {/* Headteacher Signature */}
            <div className="text-center min-w-[148px]">
              {/* Subtle Handwritten Signature Stroke SVG */}
              <svg
                viewBox="0 0 160 44"
                className="w-28 h-8 mx-auto text-[#124B96]/85 mb-0.5"
                aria-hidden="true"
              >
                <path
                  d="M14 31 C26 10, 38 11, 42 26 C46 37, 56 16, 68 18 C78 20, 76 31, 88 26 C100 21, 114 14, 128 22 C136 26, 144 21, 150 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M28 36 C56 32, 96 31, 138 33"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </svg>
              <div className="border-t border-[#374151] pt-1">
                <p className="text-sm font-bold text-[#111827]">
                  {pick('প্রধান শিক্ষক', 'Headteacher')}
                </p>
                <p className="text-xs text-[#4B5563]">
                  {school?.name ?? 'ভোজেশ্বর উচ্চ বিদ্যালয়'}
                </p>
                <p className="text-xs text-[#6B7280]">
                  {pick('ভোজেশ্বর, নড়িয়া, শরীয়তপুর', 'Bhojeshwar, Noria, Shariatpur')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NoticeDocumentViewer({
  notice,
  school,
  showFullPageLink = false,
  onNavigateFullPage,
}: {
  notice: Notice;
  school?: SchoolProfile | null;
  showFullPageLink?: boolean;
  onNavigateFullPage?: () => void;
}) {
  const { locale, pick } = useI18n();
  const [zoom, setZoom] = useState(100);
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);

  const format = resolveNoticeFormat(notice);
  const pdfUrl = notice.attachmentUrl;
  const hasRealPdf = format === 'PDF' && Boolean(pdfUrl);
  const hasRealImage = format === 'IMAGE' && Boolean(notice.attachmentUrl);

  // Reset zoom whenever a new notice is opened
  useEffect(() => {
    setZoom(100);
  }, [notice.id]);

  const handlePrint = () => {
    if (hasRealPdf && pdfUrl) {
      // 1. Try to invoke print on the embedded PDF iframe contentWindow (prints ONLY the PDF in Chrome)
      const iframe = pdfIframeRef.current;
      if (iframe?.contentWindow) {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          return;
        } catch {
          // If browser PDF plugin or cross-origin sandbox prevents direct access, proceed to fallback
        }
      }

      // 2. Off-screen print iframe approach
      try {
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'fixed';
        printFrame.style.left = '-9999px';
        printFrame.style.top = '-9999px';
        printFrame.style.width = '1000px';
        printFrame.style.height = '1000px';
        printFrame.style.opacity = '0';
        printFrame.style.pointerEvents = 'none';
        printFrame.src = pdfUrl;
        document.body.appendChild(printFrame);

        printFrame.onload = () => {
          setTimeout(() => {
            try {
              printFrame.contentWindow?.focus();
              printFrame.contentWindow?.print();
            } catch {
              window.open(pdfUrl, '_blank');
            }
            setTimeout(() => printFrame.remove(), 60000);
          }, 350);
        };
        return;
      } catch {
        window.open(pdfUrl, '_blank');
        return;
      }
    }

    triggerPrint();
  };

  return (
    <div className="flex flex-col bg-surface border border-border rounded-xl overflow-hidden">
      {/* Clean Document Toolbar */}
      <div className="px-3.5 sm:px-4 py-2.5 bg-surface-muted/75 border-b border-border flex flex-wrap items-center justify-between gap-2.5 no-print">
        {/* Left: Notice Reference & Published Date */}
        <div className="flex items-center gap-2 min-w-0 text-sm text-muted-foreground tabular-nums">
          <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-[300px]">
            {notice.memoNo ?? pick('প্রাতিষ্ঠানিক বিজ্ঞপ্তি', 'Official Notice')}
          </span>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <span className="hidden sm:inline shrink-0">
            {formatDateLong(notice.publishedAt ?? notice.createdAt, locale)}
          </span>
        </div>

        {/* Right: Zoom Controls + Download, Print & Full Page Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {!hasRealPdf && (
            <div className="hidden sm:inline-flex items-center gap-0.5 px-1 py-0.5 rounded-lg bg-surface border border-border text-xs tabular-nums mr-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(70, z - 15))}
                aria-label={pick('জুম আউট', 'Zoom out')}
                className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-surface-muted text-foreground/80 hover:text-foreground cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-xs font-medium text-muted-foreground min-w-[42px] text-center">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(145, z + 15))}
                aria-label={pick('জুম ইন', 'Zoom in')}
                className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-surface-muted text-foreground/80 hover:text-foreground cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {zoom !== 100 && (
                <button
                  type="button"
                  onClick={() => setZoom(100)}
                  aria-label={pick('রিসেট জুম', 'Reset zoom')}
                  className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-surface-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => downloadNoticeDocument(notice, school, locale)}
            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-92 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{pick('ডাউনলোড', 'Download')}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg bg-surface border border-border text-sm font-medium text-foreground hover:bg-surface-muted transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{pick('প্রিন্ট', 'Print')}</span>
          </button>

          {showFullPageLink && (
            <Link
              href={`/notices/${notice.id}`}
              onClick={onNavigateFullPage}
              title={pick('পূর্ণ পৃষ্ঠায় দেখুন', 'Open Full Page')}
              className="h-8 px-3 inline-flex items-center gap-1 rounded-lg bg-surface border border-border text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{pick('পূর্ণ পৃষ্ঠা', 'Full Page')}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Direct Submitted Document Viewport */}
      <div className="bg-[#E5EAE7] dark:bg-[#131B17] p-3 sm:p-6 overflow-auto max-h-[70vh] min-h-[420px]">
        {hasRealPdf && pdfUrl ? (
          <div className="w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-border bg-[#525659] shadow-lg">
            <object
              data={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              type="application/pdf"
              className="w-full h-[650px] sm:h-[750px] block"
            >
              <iframe
                ref={pdfIframeRef}
                src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                title={notice.title}
                className="w-full h-[650px] sm:h-[750px] border-0"
              >
                <div className="p-8 text-center text-white bg-[#525659]">
                  <p className="mb-4">
                    {pick(
                      'ব্রাউজারে সরাসরি পিডিএফ দেখতে নিচের বাটনে ক্লিক করুন:',
                      'Click below to view the PDF directly in browser:'
                    )}
                  </p>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block px-5 py-2.5 rounded-lg bg-[#0c5936] text-white font-medium"
                  >
                    {pick('পিডিএফ ফাইল ডাউনলোড / ওপেন করুন', 'Download / Open PDF File')}
                  </a>
                </div>
              </iframe>
            </object>
          </div>
        ) : hasRealImage && notice.attachmentUrl ? (
          <div className="flex justify-center">
            <div
              data-certificate-print-root="true"
              data-print-orientation="portrait"
              style={{ width: `${zoom}%`, maxWidth: zoom > 100 ? 'none' : '740px' }}
              className="certificate-paper transition-[width] duration-200 bg-white p-2 rounded-sm shadow-2xl border border-black/12"
            >
              <img
                src={notice.attachmentUrl}
                alt={notice.title}
                className="w-full h-auto block rounded-xs"
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              data-certificate-print-root="true"
              data-print-orientation="portrait"
              style={{
                transform: zoom === 100 ? undefined : `scale(${zoom / 100})`,
                transformOrigin: 'top center',
              }}
              className="w-full transition-transform duration-200"
            >
              {notice.description?.trim() ? <OfficialCircularSheet notice={notice} school={school} /> : <p role="status">{pick('\u09a8\u09a5\u09bf \u09aa\u09be\u0993\u09af\u09bc\u09be \u09af\u09be\u09af\u09bc\u09a8\u09bf\u0964', 'The document is unavailable.')}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Full Studio Document Preview Modal for clicking any Notice on Homepage or Notice Board
 */
export function NoticeDocumentModal({
  notice,
  school,
  onClose,
}: {
  notice: Notice | null;
  school?: SchoolProfile | null;
  onClose: () => void;
}) {
  const { pick } = useI18n();

  useEffect(() => {
    if (!notice) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [notice, onClose]);

  return (
    <AnimatePresence>
      {notice && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 no-print"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={notice.title}
            className="w-full max-w-5xl max-h-[92vh] bg-surface text-foreground border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-5 py-3.5 border-b border-border flex items-start justify-between gap-4 bg-surface shrink-0">
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-primary">
                    {pick('প্রাতিষ্ঠানিক বিজ্ঞপ্তি ভিউয়ার', 'Official Notice Viewer')}
                  </span>
                  {notice.memoNo && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{notice.memoNo}</span>
                    </>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug line-clamp-1">
                  {notice.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label={pick('বন্ধ করুন', 'Close')}
                className="h-8 w-8 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Embedded Document Viewer */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-1 bg-background">
              <NoticeDocumentViewer
                notice={notice}
                school={school}
                showFullPageLink
                onNavigateFullPage={onClose}
              />
            </div>

            {/* Compact Footer */}
            <div className="px-4 sm:px-5 py-3 border-t border-border bg-surface-muted/40 flex items-center justify-between gap-3 text-sm shrink-0">
              <Link
                href={`/notices/${notice.id}`}
                onClick={onClose}
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                <span>{pick('পূর্ণ নোটিশ পৃষ্ঠায় যান', 'Open Full Notice Page')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-md border border-border bg-surface text-foreground hover:bg-surface-muted font-medium cursor-pointer"
              >
                {pick('বন্ধ করুন', 'Close')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
