'use client';

import React from 'react';
import type { Notice, SchoolProfile } from '@/src/types/entities';
import { NoticeDocumentViewer, resolveNoticeFormat } from './NoticeDocumentViewer';

interface ChromePdfViewerProps {
  notice: Notice;
  school?: SchoolProfile | null;
}

export function ChromePdfViewer({ notice }: ChromePdfViewerProps) {
  const pdfUrl = notice.attachmentUrl;
  if (!pdfUrl || resolveNoticeFormat(notice) === 'IMAGE') {
    return <NoticeDocumentViewer notice={notice} />;
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border border-border bg-[#525659] shadow-lg">
      {/* Standard browser PDF embed — Chrome automatically loads its native Chromium PDF reader with toolbar, zoom, print & download */}
      <object
        data={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
        type="application/pdf"
        className="w-full h-[750px] sm:h-[850px] lg:h-[950px] block"
      >
        <iframe
          src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
          className="w-full h-[750px] sm:h-[850px] lg:h-[950px] border-0"
          title={notice.title}
        >
          <div className="p-8 text-center text-white bg-[#525659]">
            <p className="mb-4">ব্রাউজারে সরাসরি পিডিএফ দেখতে নিচের বাটনে ক্লিক করুন:</p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block px-5 py-2.5 rounded-lg bg-[#0c5936] text-white font-medium"
            >
              পিডিএফ ফাইল ডাউনলোড / ওপেন করুন
            </a>
          </div>
        </iframe>
      </object>
    </div>
  );
}
