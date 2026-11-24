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
import { useI18n } from '@/src/lib/i18n';
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
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [submittedApp, setSubmittedApp] = useState<OnlineAdmissionApplication | null>(null);
  const [docTab, setDocTab] = useState<'form' | 'admit'>('form');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const submittedDocRef = useRef<HTMLDivElement | null>(null);

  if (isLoading || !db) {
    return (
      <div className="max-w-[1440px] mx-auto p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  const cycleStatus = db.admissionContent.admissionStatus ?? 'OPEN';
  if (cycleStatus !== 'OPEN') {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12 space-y-6">
        <PageHeader
          title={pick('অনলাইন ভর্তি আবেদন', 'Online Admission Application')}
          description={`${db.admissionContent.schoolNameBn} · ${pick('শিক্ষাবর্ষ:', 'Session:')} ${db.admissionContent.academicSession}`}
        />
        <Card className="p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            {cycleStatus === 'UPCOMING'
              ? pick('অনলাইন ভর্তি আবেদন শীঘ্রই শুরু হবে', 'Online Admission Applications Opening Soon')
              : pick('বর্তমান শিক্ষাবর্ষের অনলাইন ভর্তি আবেদন বন্ধ রয়েছে', 'Online Admission Applications Are Currently Closed')}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {cycleStatus === 'UPCOMING'
              ? pick(
                  `নির্ধারিত তারিখ (${formatDateLong(db.admissionContent.startDate, locale)}) থেকে অনলাইন আবেদন গ্রহণ শুরু হবে। ইতোমধ্যে ভর্তি নির্দেশিকা ও প্রয়োজনীয় কাগজপত্রের তালিকা দেখে নিতে পারেন।`,
                  `Online applications will open on ${formatDateLong(db.admissionContent.startDate, locale)}. You can review guidelines and required documents in the meantime.`
                )
              : pick(
                  'চলমান শিক্ষাবর্ষের আবেদন গ্রহণের সময়সীমা শেষ হয়েছে। পূর্বে জমাকৃত আবেদনের অবস্থা জানতে স্ট্যাটাস যাচাই পেজ ব্যবহার করুন অথবা বিদ্যালয় অফিসে যোগাযোগ করুন।',
                  'The application window for this session has closed. Existing applicants may check their application status below or contact the school office.'
                )}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/admission/status">
              <Button variant="primary">
                <Search className="w-4 h-4" />
                {pick('আবেদনের স্ট্যাটাস যাচাই', 'Check Application Status')}
              </Button>
            </Link>
            <Link href="/admission/guidelines">
              <Button variant="outline">{pick('ভর্তি নির্দেশিকা', 'Admission Guidelines')}</Button>
            </Link>
            <Link href="/admission/download-form">
              <Button variant="ghost">
                <Download className="w-4 h-4" />
                {pick('নমুনা ফরম দেখুন', 'Preview Printable Form')}
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
            school: db.schoolProfile,
            application: submittedApp,
            targetClassName: locale === 'bn' ? cls?.nameBn ?? '' : cls?.name ?? '',
            groupName: grp ? (locale === 'bn' ? grp.nameBn : grp.name) : null,
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
            pick(
              'A4 পিডিএফ (PDF) সফলভাবে ডাউনলোড হয়েছে।',
              'A4 PDF downloaded successfully.'
            )
          );
        }
      } catch {
        toast.error(
          pick(
            'পিডিএফ তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে প্রিন্ট বাটন থেকে Save as PDF ব্যবহার করুন।',
            'Could not generate PDF. Please use Print → Save as PDF.'
          )
        );
      } finally {
        setDownloadingPdf(false);
      }
    };

    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
        <PageHeader
          title={pick('অনলাইন ভর্তি আবেদন গৃহীত হয়েছে', 'Online Admission Application Submitted')}
          description={pick(
            `আবেদন নম্বর: ${submittedApp.applicationNumber} · নিচের অফিশিয়াল A4 কপিটি প্রিন্ট বা PDF ডাউনলোড করে সংরক্ষণ করুন।`,
            `Application No: ${submittedApp.applicationNumber} · Print or download the official A4 PDF copy below.`
          )}
        />

        {/* Crisp Confirmation & Action Bar */}
        <div className="p-4 sm:p-5 rounded-[4px] border border-primary/35 bg-primary/5 no-print space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-base font-bold text-primary flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                {pick('অনলাইন ভর্তি আবেদন সফলভাবে গৃহীত হয়েছে', 'Online Admission Application Submitted')}
              </p>
              <p className="text-sm text-muted-foreground">
                {pick('আবেদন নম্বর সংরক্ষণ করুন:', 'Save your Application Number:')}{' '}
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
                {pick('প্রিন্ট করুন', 'Print')}
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
                  ? pick('PDF তৈরি হচ্ছে...', 'Generating PDF...')
                  : pick('PDF ডাউনলোড করুন', 'Download PDF')}
              </Button>
              <Link href="/admission/status">
                <Button variant="outline" size="sm" className="rounded-[4px]">
                  {pick('অবস্থা যাচাই', 'Track Status')}
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
                {pick('নতুন আবেদন', 'New Application')}
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
              {pick('পূর্ণাঙ্গ আবেদনপত্র (Application Copy)', 'Full Application Form')}
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
              {pick('ভর্তি পরীক্ষার প্রবেশপত্র (Admit Card)', 'Admission Test Admit Card')}
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
              school={db.schoolProfile}
              application={submittedApp}
              targetClassName={locale === 'bn' ? cls?.nameBn ?? '' : cls?.name ?? ''}
              groupName={grp ? (locale === 'bn' ? grp.nameBn : grp.name) : null}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader
        title={pick('অনলাইন ভর্তি আবেদন ফরম (৬ষ্ঠ – ১০ম শ্রেণি)', 'Online Admission Application (Classes 6–10)')}
        description={pick(
          `${db.admissionContent.schoolNameBn} · শিক্ষাবর্ষ ${db.admissionContent.academicSession} · জন্ম নিবন্ধন ও এনআইডি অনুযায়ী তথ্য পূরণ করুন।`,
          `${db.admissionContent.schoolNameEn || db.schoolProfile.nameEn} · Session ${db.admissionContent.academicSession} · Complete accurately per Birth Certificate & NID.`
        )}
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

