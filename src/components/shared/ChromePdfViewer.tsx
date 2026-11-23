'use client';

import React, { useRef, useState } from 'react';
import {
  Download,
  FileText,
  Maximize2,
  Menu,
  Minimize2,
  Minus,
  Plus,
  Printer,
  RotateCw,
  Search,
  Sparkles,
} from 'lucide-react';
import type { Notice, SchoolProfile } from '@/src/types/entities';
import { SchoolEmblem, SCHOOL_LOGO_SRC } from '@/src/components/shared/Feedback';
import { downloadNoticeDocument } from '@/src/components/shared/NoticeDocumentViewer';
import { useI18n } from '@/src/lib/i18n';
import { formatDateLong, formatNumber } from '@/src/lib/formatters';

interface ChromePdfViewerProps {
  notice: Notice;
  school?: SchoolProfile | null;
}

export function ChromePdfViewer({ notice, school }: ChromePdfViewerProps) {
  const { locale, pick } = useI18n();
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 15, 160));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 15, 60));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    downloadNoticeDocument(notice, school, locale);
  };

  const pubDate = new Date(notice.publishedAt ?? notice.createdAt);
  const day = String(pubDate.getDate()).padStart(2, '0');
  const month = String(pubDate.getMonth() + 1).padStart(2, '0');
  const year = pubDate.getFullYear();
  const formattedDate = locale === 'bn' ? formatNumber(`${day}-${month}-${year}`, 'bn') : `${day}-${month}-${year}`;

  const memoNo = notice.memoNo || `ভউবি/প্রশা/${year}/${String(Math.abs(notice.id.split('').reduce((a, b) => a + b.charCodeAt(0), 101)) % 900 + 100)}`;
  const fileName = `${notice.memoNo?.replace(/\//g, '-') || 'Circular'}-2026.pdf`;

  // Parse body paragraphs
  const paragraphs = (notice.description || notice.title)
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-xl overflow-hidden border border-[#323639] shadow-2xl flex flex-col bg-[#525659] text-white ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* =======================================================================
          1. CHROME PDF VIEWER DARK TOOLBAR (Matches Image 2 from bteb.gov.bd)
         ======================================================================= */}
      <div className="bg-[#282C34] text-[#E8EAED] px-3 sm:px-4 py-2 flex items-center justify-between border-b border-black/40 select-none text-xs sm:text-sm shrink-0 z-20 shadow-md">
        {/* Left Toolbar Section: Menu & Filename */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            title="Menu"
            aria-label="Menu"
            className="p-1 rounded hover:bg-white/10 text-[#9AA0A6] hover:text-white transition-colors cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 truncate">
            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium text-xs sm:text-sm text-[#F1F3F4] truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {fileName}
            </span>
          </div>
        </div>

        {/* Center Toolbar Section: Page Count & Zoom Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Page Counter */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/35 text-xs text-[#E8EAED] border border-white/10 tabular-nums">
            <span className="font-bold text-white">1</span>
            <span className="text-white/50">/</span>
            <span>1</span>
          </div>

          <div className="h-4 w-px bg-white/20 hidden sm:block" />

          {/* Zoom Out (-) */}
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom Out"
            disabled={zoom <= 60}
            className="p-1.5 rounded hover:bg-white/10 text-[#BDC1C6] hover:text-white transition-colors cursor-pointer disabled:opacity-40"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Level Indicator */}
          <span className="text-xs font-semibold tabular-nums px-1 text-[#E8EAED] min-w-[42px] text-center">
            {zoom}%
          </span>

          {/* Zoom In (+) */}
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom In"
            disabled={zoom >= 160}
            className="p-1.5 rounded hover:bg-white/10 text-[#BDC1C6] hover:text-white transition-colors cursor-pointer disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-white/20 hidden md:block" />

          {/* Rotate Clockwise Button */}
          <button
            type="button"
            onClick={handleRotate}
            title="Rotate Clockwise"
            aria-label="Rotate Clockwise"
            className="p-1.5 rounded hover:bg-white/10 text-[#BDC1C6] hover:text-white transition-colors cursor-pointer hidden sm:inline-flex"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Toolbar Section: Print, Download, Fullscreen */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            title="Print Document"
            aria-label="Print Document"
            className="p-1.5 rounded hover:bg-white/10 text-[#BDC1C6] hover:text-white transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            title="Download PDF"
            aria-label="Download PDF"
            className="p-1.5 rounded hover:bg-white/10 text-[#BDC1C6] hover:text-white transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
            className="p-1.5 rounded hover:bg-white/10 text-[#BDC1C6] hover:text-white transition-colors cursor-pointer hidden md:inline-flex"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* =======================================================================
          2. PDF VIEWPORT WITH GENUINE A4 DOCUMENT (Chrome Canvas Background #525659)
         ======================================================================= */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 md:p-12 min-h-[750px] max-h-[85vh] flex justify-center items-start">
        <div
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
          }}
          className="relative w-full max-w-[850px] bg-white text-[#111827] shadow-[0_10px_35px_rgba(0,0,0,0.5)] border border-black/15 p-8 sm:p-14 select-text font-serif leading-relaxed"
        >
          {/* Faint Official Watermark */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035]"
          >
            <img
              src={SCHOOL_LOGO_SRC}
              alt=""
              className="w-80 h-80 object-contain grayscale"
            />
          </div>

          <div className="relative z-10 space-y-6">
            {/* Government & School Official Letterhead Header */}
            <div className="text-center pb-4 border-b-2 border-black/80 space-y-1">
              <div className="flex items-center justify-center gap-3">
                <SchoolEmblem size={54} className="bg-white p-0.5 rounded-full border border-black/20" />
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#094724] tracking-tight">
                    {school?.name ?? 'ভোজেশ্বর উচ্চ বিদ্যালয়'}
                  </h2>
                  <p className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-700">
                    {school?.nameEn ?? 'BHOJESHWAR HIGH SCHOOL'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 pt-1">
                {school?.address ?? 'ডাকঘর: ভোজেশ্বর, উপজেলা: নড়িয়া, জেলা: শরীয়তপুর'}
              </p>
              <p className="text-[11px] text-slate-500 font-sans tabular-nums">
                স্থাপিত: ১৯৭৮ খ্রি. · EIIN: {school?.eiin ?? '১১৩৫৮৭'} · কোড: ৪১২৫
              </p>
            </div>

            {/* Memo Number & Date Row */}
            <div className="flex items-center justify-between text-xs sm:text-sm font-sans pt-1 tabular-nums font-medium text-slate-800">
              <p>
                <span className="font-bold">স্মারক নং:</span> {memoNo}
              </p>
              <p>
                <span className="font-bold">তারিখ:</span> {formattedDate} খ্রি.
              </p>
            </div>

            {/* Official Heading */}
            <div className="text-center pt-2">
              <span className="inline-block px-4 py-1 text-base sm:text-lg font-bold tracking-wider text-black border-b-2 border-black uppercase">
                {notice.isUrgent ? 'জরুরি বিজ্ঞপ্তি' : 'বিজ্ঞপ্তি'}
              </span>
            </div>

            {/* Subject Line (matches bteb.gov.bd layout in Image 2) */}
            <div className="text-sm sm:text-base font-bold text-black bg-slate-50 border-l-4 border-[#0c5936] px-4 py-2.5 leading-snug">
              <span className="font-extrabold text-[#0c5936]">বিষয়:</span> {notice.title}
            </div>

            {/* Formal Circular Body Paragraphs */}
            <div className="space-y-3.5 text-sm sm:text-base text-slate-800 leading-[1.85] text-justify font-sans">
              {paragraphs.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            {/* Official Table Schedule (Structured institutional circular table) */}
            <div className="pt-2">
              <table className="w-full text-xs sm:text-sm border-collapse border border-slate-400 font-sans">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold">
                    <th className="border border-slate-400 px-3 py-2 text-center w-16">ক্রম</th>
                    <th className="border border-slate-400 px-3 py-2 text-left">বিবরণ / বিষয়</th>
                    <th className="border border-slate-400 px-3 py-2 text-center">কার্যকর তারিখ</th>
                    <th className="border border-slate-400 px-3 py-2 text-left">দায়িত্বপ্রাপ্ত শাখা</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  <tr>
                    <td className="border border-slate-400 px-3 py-2 text-center tabular-nums">১.</td>
                    <td className="border border-slate-400 px-3 py-2 font-medium">{notice.title}</td>
                    <td className="border border-slate-400 px-3 py-2 text-center tabular-nums">{formattedDate}</td>
                    <td className="border border-slate-400 px-3 py-2">অফিস ও একাডেমিক প্রশাসন</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 px-3 py-2 text-center tabular-nums">২.</td>
                    <td className="border border-slate-400 px-3 py-2">সকল সংশ্লিষ্ট শিক্ষক ও শিক্ষার্থীদের জ্ঞাতার্থে কার্যকরকরণ</td>
                    <td className="border border-slate-400 px-3 py-2 text-center">তাত্ক্ষণিক</td>
                    <td className="border border-slate-400 px-3 py-2">বিদ্যালয় নোটিশ বোর্ড</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Official Distribution & Signatures Block */}
            <div className="pt-10 mt-6 border-t border-slate-300 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 font-sans">
              {/* Distribution List */}
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">অনুলিপি (সদয় অবগতি ও প্রয়োজনীয় কার্যার্থে):</p>
                <p>১. সভাপতি, ম্যানেজিং কমিটি, ভোজেশ্বর উচ্চ বিদ্যালয়।</p>
                <p>২. উপজেলা মাধ্যমিক শিক্ষা অফিসার, নড়িয়া, শরীয়তপুর।</p>
                <p>৩. সকল সহকারী শিক্ষক/শিক্ষিকা ও সংশ্লিষ্ট শ্রেণি শিক্ষক।</p>
                <p>৪. বিদ্যালয়ের অফিশিয়াল নোটিশ বোর্ড ও ডিজিটাল ওয়েবসাইট।</p>
                <p>৫. অফিস নথি সংরক্ষণ।</p>
              </div>

              {/* Rubber Stamp Seal & Principal Signature */}
              <div className="flex items-end gap-3 self-end sm:self-auto text-center">
                {/* Authentic Blue Rubber Stamp Seal */}
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#1a4f8b] flex flex-col items-center justify-center text-[9px] text-[#1a4f8b] font-bold p-1 select-none -rotate-12 opacity-85">
                  <span>ভোজেশ্বর উচ্চ বিদ্যালয়</span>
                  <span className="text-[7px]">স্থাপিত: ১৯৭৮</span>
                  <span className="text-[8px]">নড়িয়া, শরীয়তপুর</span>
                </div>

                {/* Signature Box */}
                <div className="space-y-1 text-center min-w-[150px]">
                  <div className="h-9 flex items-center justify-center text-primary font-serif italic text-lg font-bold">
                    মোঃ শফিকুর রহমান
                  </div>
                  <div className="border-t border-black/80 pt-1">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      মোঃ শফিকুর রহমান
                    </p>
                    <p className="text-[11px] text-slate-600 leading-tight">
                      প্রধান শিক্ষক
                    </p>
                    <p className="text-[10px] text-slate-500">
                      ভোজেশ্বর উচ্চ বিদ্যালয়
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
