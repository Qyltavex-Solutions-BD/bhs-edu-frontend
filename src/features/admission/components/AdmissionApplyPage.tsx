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
import { useGetPublicAdmissionCatalogQuery } from '@/src/features/admission/api/admission.api';
import type { AdmissionCatalogData } from '@/src/features/admission/rules';
import type { SchoolProfile } from '@/src/types/entities';
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

export function AdmissionApplyPage() {
  const { data: catalogData, isLoading } = useGetPublicAdmissionCatalogQuery();
  const [submittedApp, setSubmittedApp] = useState<OnlineAdmissionApplication | null>(null);
  const [docTab, setDocTab] = useState<'form' | 'admit'>('form');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const submittedDocRef = useRef<HTMLDivElement | null>(null);

  if (isLoading || !catalogData) {
    return (
      <div className="max-w-[1440px] mx-auto p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  const schoolProfile: SchoolProfile =
    catalogData.schoolProfile ??
    ({
      id: 'default',
      name: 'Bhojeshwar High School',
      nameBn: 'ভোজেশ্বর উচ্চ বিদ্যালয়',
      nameEn: 'Bhojeshwar High School',
      eiin: '113587',
      address: 'নড়িয়া, শরীয়তপুর',
      createdAt: '',
      updatedAt: '',
    } as SchoolProfile);

  const db: AdmissionCatalogData = {
    academicYears: catalogData.academicYears ?? [],
    classes: catalogData.classes ?? [],
    sections: catalogData.sections ?? [],
    academicGroups: catalogData.academicGroups ?? [],
    classSubjects: catalogData.classSubjects ?? [],
    admissionContent: catalogData.admissionContent ?? {
      admissionStatus: 'OPEN',
      academicSession: '২০২৭',
      schoolNameBn: 'ভোজেশ্বর উচ্চ বিদ্যালয়',
      schoolNameEn: 'Bhojeshwar High School',
    },
    schoolProfile,
  };

  const admissionContent = db.admissionContent ?? {};
  const cycleStatus = admissionContent.admissionStatus ?? 'OPEN';
  if (cycleStatus !== 'OPEN') {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12 space-y-6">
        <PageHeader
          title={'অনলাইন ভর্তি আবেদন'}
          description={`${admissionContent.schoolNameBn ?? 'ভোজেশ্বর উচ্চ বিদ্যালয়'} · ${'শিক্ষাবর্ষ:'} ${admissionContent.academicSession ?? '২০২৭'}`}
        />
        <Card className="p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            {cycleStatus === 'UPCOMING'
              ? 'অনলাইন ভর্তি আবেদন শীঘ্রই শুরু হবে'
              : 'বর্তমান শিক্ষাবর্ষের অনলাইন ভর্তি আবেদন বন্ধ রয়েছে'}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {cycleStatus === 'UPCOMING'
              ? `নির্ধারিত তারিখ (${formatDateLong(admissionContent.startDate ?? '', 'bn')}) থেকে অনলাইন আবেদন গ্রহণ শুরু হবে। ইতোমধ্যে ভর্তি নির্দেশিকা ও প্রয়োজনীয় কাগজপত্রের তালিকা দেখে নিতে পারেন।`
              : 'চলমান শিক্ষাবর্ষের আবেদন গ্রহণের সময়সীমা শেষ হয়েছে। পূর্বে জমাকৃত আবেদনের অবস্থা জানতে স্ট্যাটাস যাচাই পেজ ব্যবহার করুন অথবা বিদ্যালয় অফিসে যোগাযোগ করুন।'}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/admission/status">
              <Button variant="primary">
                <Search className="w-4 h-4" />
                {'আবেদনের স্ট্যাটাস যাচাই'}
              </Button>
            </Link>
            <Link href="/admission/guidelines">
              <Button variant="outline">{'ভর্তি নির্দেশিকা'}</Button>
            </Link>
            <Link href="/admission/download-form">
              <Button variant="ghost">
                <Download className="w-4 h-4" />
                {'নমুনা ফরম দেখুন'}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (submittedApp) {
    const cls = db.classes.find((c) => c.id === submittedApp.targetClassId);
    const grp = db.academicGroups.find((g) => g.id === submittedApp.targetGroupId);
    const submittedValues = buildDefaultAdmissionValues(db, 'public', undefined, submittedApp);
    const submittedMeta = {
      applicationNumber: submittedApp.applicationNumber,
      submittedAt: submittedApp.submittedAt,
      admissionTestRoll: submittedApp.admissionTestRoll,
      admissionTestDate: submittedApp.admissionTestDate,
    };
    const docTitle =
      docTab === 'form'
        ? `BHS-Admission-Form-${submittedApp.applicationNumber}`
        : `BHS-Admit-Card-${submittedApp.applicationNumber}`;

    const fallbackPayload: CertificatePrintPayload =
      docTab === 'form'
        ? {
            kind: 'ADMISSION_FORM',
            data: buildAdmissionFormPrintData(submittedValues, db, 'public', submittedMeta),
          }
        : {
            kind: 'ADMIT_CARD',
            school: schoolProfile,
            application: submittedApp,
            targetClassName: cls?.nameBn ?? '',
            groupName: grp ? (grp.nameBn) : null,
          };

    const handlePrint = () => {
      printDocumentNode(submittedDocRef.current, docTitle, fallbackPayload);
    };

    const handleDownloadPdf = async () => {
      if (downloadingPdf) return;
      setDownloadingPdf(true);
      try {
        const ok = await exportNodeToA4Pdf(submittedDocRef.current, docTitle);
        if (ok) {
          toast.success(
            'A4 পিডিএফ (PDF) সফলভাবে ডাউনলোড হয়েছে।'
          );
        }
      } catch {
        toast.error(
          'পিডিএফ তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে প্রিন্ট বাটন থেকে Save as PDF ব্যবহার করুন।'
        );
      } finally {
        setDownloadingPdf(false);
      }
    };

    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
        <PageHeader
          title={'অনলাইন ভর্তি আবেদন গৃহীত হয়েছে'}
          description={`আবেদন নম্বর: ${submittedApp.applicationNumber} · নিচের অফিশিয়াল A4 কপিটি প্রিন্ট বা PDF ডাউনলোড করে সংরক্ষণ করুন।`}
        />

        {/* Crisp Confirmation & Action Bar */}
        <div className="p-4 sm:p-5 rounded-[4px] border border-primary/35 bg-primary/5 no-print space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-base font-bold text-primary flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                {'অনলাইন ভর্তি আবেদন সফলভাবে গৃহীত হয়েছে'}
              </p>
              <p className="text-sm text-muted-foreground">
                {'আবেদন নম্বর সংরক্ষণ করুন:'}{' '}
                <strong className="font-mono text-foreground">{submittedApp.applicationNumber}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                className="rounded-[4px]"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4" />
                {'প্রিন্ট করুন'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-[4px]"
                disabled={downloadingPdf}
                onClick={handleDownloadPdf}
              >
                {downloadingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {downloadingPdf
                  ? 'PDF তৈরি হচ্ছে...'
                  : 'PDF ডাউনলোড করুন'}
              </Button>
              <Link href="/admission/status">
                <Button variant="outline" size="sm" className="rounded-[4px]">
                  {'অবস্থা যাচাই'}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-[4px]"
                onClick={() => {
                  setSubmittedApp(null);
                  setDocTab('form');
                }}
              >
                {'নতুন আবেদন'}
              </Button>
            </div>
          </div>

          {/* Document View Switcher (Default: Exact Submitted Application Form) */}
          <div className="inline-flex border border-border rounded-[4px] overflow-hidden divide-x divide-border bg-surface text-sm">
            <button
              type="button"
              onClick={() => setDocTab('form')}
              className={`px-3.5 py-2 font-medium transition-colors cursor-pointer ${
                docTab === 'form'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-surface-muted/60'
              }`}
            >
              {'পূর্ণাঙ্গ আবেদনপত্র (Application Copy)'}
            </button>
            <button
              type="button"
              onClick={() => setDocTab('admit')}
              className={`px-3.5 py-2 font-medium transition-colors cursor-pointer ${
                docTab === 'admit'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-surface-muted/60'
              }`}
            >
              {'ভর্তি পরীক্ষার প্রবেশপত্র (Admit Card)'}
            </button>
          </div>
        </div>

        {/* Centered Official A4 Document Preview Tray */}
        <div
          ref={submittedDocRef}
          className="rounded-[4px] border border-border bg-surface-muted/40 p-3 sm:p-6"
        >
          {docTab === 'form' ? (
            <AdmissionFormPreviewSheet
              values={submittedValues}
              db={db}
              mode="public"
              submittedMeta={submittedMeta}
            />
          ) : (
            <PrintableAdmissionAdmitCard
              school={schoolProfile}
              application={submittedApp}
              targetClassName={cls?.nameBn ?? ''}
              groupName={grp ? (grp.nameBn) : null}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader
        title={'অনলাইন ভর্তি আবেদন ফরম (৬ষ্ঠ – ১০ম শ্রেণি)'}
        description={`${admissionContent.schoolNameBn ?? 'ভোজেশ্বর উচ্চ বিদ্যালয়'} · শিক্ষাবর্ষ ${admissionContent.academicSession ?? '২০২৭'} · জন্ম নিবন্ধন ও এনআইডি অনুযায়ী তথ্য পূরণ করুন।`}
      />

      <UnifiedAdmissionForm
        mode="public"
        db={db}
        onPublicSuccess={(created) => {
          setSubmittedApp(created);
          setDocTab('form');
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />
    </div>
  );
}

