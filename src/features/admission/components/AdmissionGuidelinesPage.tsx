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

export function AdmissionGuidelinesPage() {
  const { data: db } = useGetBootstrapQuery();
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader
        title={'ভর্তি নির্দেশিকা'}
        description={db?.admissionContent.schoolAddress ?? undefined}
      />
      <Card className="p-6 space-y-4 text-base leading-relaxed text-foreground/90">
        <p>{db?.admissionContent.classesAndSections}</p>
        <p>{db?.admissionContent.availableGroups}</p>
        <p>{db?.admissionContent.optionalSubjects}</p>
        <p>{db?.admissionContent.admitCardNotice}</p>
        <div className="p-4 bg-surface-muted/50 border border-border rounded">
          <p className="font-semibold text-foreground mb-1">{'অঙ্গীকারনামা'}</p>
          <p className="text-muted-foreground text-sm sm:text-base">{db?.admissionContent.declarationText}</p>
        </div>
      </Card>
    </div>
  );
}

