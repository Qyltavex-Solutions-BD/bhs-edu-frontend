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

export function AdmissionOverviewPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const adm = db.admissionContent;
  const isAdmissionOpen = (adm.admissionStatus ?? 'OPEN') === 'OPEN';

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <PageHeader
        title={adm.bannerTitle || adm.title}
        description={`${adm.schoolNameBn} · ${'শিক্ষাবর্ষ:'} ${adm.academicSession}`}
        actions={
          <>
            {isAdmissionOpen && (
              <Link href="/admission/apply">
                <Button variant="primary">
                  {'অনলাইন আবেদন করুন'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
            <Link href="/admission/status">
              <Button variant={isAdmissionOpen ? 'outline' : 'primary'}>
                {'আবেদনের অবস্থা যাচাই'}
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 tabular-nums">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">{'ফরম বিতরণ শুরু'}</p>
          <p className="text-base font-bold mt-1">{formatDateLong(adm.startDate, 'bn')}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">{'আবেদনের শেষ তারিখ'}</p>
          <p className="text-base font-bold mt-1 text-destructive">{formatDateLong(adm.endDate, 'bn')}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">{'ভর্তি পরীক্ষার তারিখ'}</p>
          <p className="text-base font-bold mt-1 text-primary">{formatDateLong(adm.admissionTestDate, 'bn')}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">{'আবেদন ফরম ফি'}</p>
          <p className="text-base font-bold mt-1">{adm.applicationFee ? formatBdt(adm.applicationFee, 'bn') : '—'}</p>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-bold text-foreground">
          {'১৩-দফা ভর্তি ফরমের প্রয়োজনীয় তথ্যসমূহ'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base text-foreground/90">
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
          ]
            .filter(Boolean)
            .map((line, i) => (
              <div key={i} className="p-3.5 bg-surface-muted/40 border border-border rounded text-sm sm:text-base">
                {line}
              </div>
            ))}
        </div>
        <div className="flex flex-wrap gap-3 pt-3 border-t border-border">
          <Link href="/admission/guidelines"><Button variant="outline" size="sm">{'ভর্তি নির্দেশিকা'}</Button></Link>
          <Link href="/admission/requirements"><Button variant="outline" size="sm">{'কাগজপত্রের তালিকা'}</Button></Link>
          <Link href="/admission/download-form"><Button variant="outline" size="sm"><Download className="w-4 h-4" /> {'ফরম প্রিন্ট / ডাউনলোড'}</Button></Link>
        </div>
      </Card>
    </div>
  );
}

