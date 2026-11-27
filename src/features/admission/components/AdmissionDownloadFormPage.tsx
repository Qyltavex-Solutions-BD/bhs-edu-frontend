'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Loader2,
  Printer,
  Search,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { useGetBootstrapQuery } from '@/src/store/api';
import { formatBdt, formatDateLong } from '@/src/lib/formatters';
import { LoadingSkeleton, PageHeader, SchoolEmblem } from '@/src/components/shared/Feedback';
import { Button, Card, Input } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { PrintableAdmissionAdmitCard } from '@/src/components/print/PrintDocuments';
import type { OnlineAdmissionApplication } from '@/src/types/proposed/future';
import {
  printDocumentNode,
  triggerPrint,
  type CertificatePrintPayload,
} from '@/src/lib/utils/cn';
import { exportNodeToA4Pdf } from '@/src/lib/utils/pdfExport';
import { UnifiedAdmissionForm } from '@/src/features/admission/components/UnifiedAdmissionForm';
import {
  AdmissionFormPreviewSheet,
  buildAdmissionFormPrintData,
} from '@/src/features/admission/components/AdmissionFormPreviewSheet';
import { buildDefaultAdmissionValues } from '@/src/features/admission/mappers';

export function AdmissionDownloadFormPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const adm = db.admissionContent;
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-center justify-between no-print">
        <PageHeader
          title={'মুদ্রণযোগ্য ভর্তি ফরম (১৩-দফা)'}
          description={'সরাসরি A4 কাগজে প্রিন্ট করে বিদ্যালয় অফিসে জমা দিন অথবা অনলাইনে আবেদন করুন।'}
        />
        <Button variant="primary" onClick={triggerPrint}>
          <Printer className="w-4 h-4" /> {'প্রিন্ট / পিডিএফ'}
        </Button>
      </div>

      <Card className="print-sheet p-8 space-y-5">
        <div className="flex items-center justify-center gap-4 border-b-2 border-[#0B7A34] pb-4 text-center">
          <SchoolEmblem size={66} />
          <div>
            <h2 className="text-xl font-bold text-[#0B7A34]">{adm.schoolNameBn}</h2>
            <p className="text-sm font-bold text-[#124B96]">{adm.schoolNameEn}</p>
            <p className="text-sm text-muted-foreground">{adm.schoolAddress}</p>
            <p className="text-sm tabular-nums">
              EIIN: {adm.eiin} · বিদ্যালয় কোড: {adm.schoolCode} · জেলা কোড: {adm.districtCode} · থানা কোড: {adm.thanaCode}
            </p>
          </div>
        </div>
        <h3 className="text-center font-bold text-base">
          {adm.title} — শিক্ষাবর্ষ {adm.academicSession}
        </h3>
        <ol className="space-y-3 text-sm">
          {[
            adm.studentNameNotice,
            adm.fatherInfoNotice,
            adm.motherInfoNotice,
            adm.addressInfoNotice,
            adm.dobNotice,
            adm.birthCertificateNotice,
            adm.religionNotice,
            adm.prevExamNotice,
            adm.prevSchoolNotice,
            adm.admissionTypeNotice,
            adm.classesAndSections,
            adm.availableGroups,
            adm.optionalSubjects,
          ].map((item, idx) => (
            <li key={idx} className="pb-2 border-b border-dashed border-border">
              {item}
            </li>
          ))}
        </ol>
        <div className="p-4 border border-border rounded text-sm leading-relaxed">
          <strong>অঙ্গীকারনামা:</strong> {adm.declarationText}
        </div>
      </Card>
    </div>
  );
}

