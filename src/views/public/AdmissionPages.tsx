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

export function AdmissionOverviewPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const adm = db.admissionContent;
  const isAdmissionOpen = (adm.admissionStatus ?? 'OPEN') === 'OPEN';

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <PageHeader
        title={adm.bannerTitle || adm.title}
        description={`${adm.schoolNameBn} · ${pick('শিক্ষাবর্ষ:', 'Session:')} ${adm.academicSession}`}
        actions={
          <>
            {isAdmissionOpen && (
              <Link href="/admission/apply">
                <Button variant="primary">
                  {pick('অনলাইন আবেদন করুন', 'Apply Online')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
            <Link href="/admission/status">
              <Button variant={isAdmissionOpen ? 'outline' : 'primary'}>
                {pick('আবেদনের অবস্থা যাচাই', 'Check Status')}
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 tabular-nums">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">{pick('ফরম বিতরণ শুরু', 'Start Date')}</p>
          <p className="text-base font-bold mt-1">{formatDateLong(adm.startDate, locale)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">{pick('আবেদনের শেষ তারিখ', 'Submission Deadline')}</p>
          <p className="text-base font-bold mt-1 text-destructive">{formatDateLong(adm.endDate, locale)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">{pick('ভর্তি পরীক্ষার তারিখ', 'Admission Test Date')}</p>
          <p className="text-base font-bold mt-1 text-primary">{formatDateLong(adm.admissionTestDate, locale)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">{pick('আবেদন ফরম ফি', 'Application Fee')}</p>
          <p className="text-base font-bold mt-1">{adm.applicationFee ? formatBdt(adm.applicationFee, locale) : '—'}</p>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-bold text-foreground">
          {pick('১৩-দফা ভর্তি ফরমের প্রয়োজনীয় তথ্যসমূহ', 'Official 13-Point Admission Checklist')}
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
          <Link href="/admission/guidelines"><Button variant="outline" size="sm">{pick('ভর্তি নির্দেশিকা', 'Guidelines')}</Button></Link>
          <Link href="/admission/requirements"><Button variant="outline" size="sm">{pick('কাগজপত্রের তালিকা', 'Requirements')}</Button></Link>
          <Link href="/admission/download-form"><Button variant="outline" size="sm"><Download className="w-4 h-4" /> {pick('ফরম প্রিন্ট / ডাউনলোড', 'Download Printable Form')}</Button></Link>
        </div>
      </Card>
    </div>
  );
}

export function AdmissionGuidelinesPage() {
  const { data: db } = useGetBootstrapQuery();
  const { pick } = useI18n();
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader
        title={pick('ভর্তি নির্দেশিকা', 'Admission Guidelines')}
        description={db?.admissionContent.schoolAddress ?? undefined}
      />
      <Card className="p-6 space-y-4 text-base leading-relaxed text-foreground/90">
        <p>{db?.admissionContent.classesAndSections}</p>
        <p>{db?.admissionContent.availableGroups}</p>
        <p>{db?.admissionContent.optionalSubjects}</p>
        <p>{db?.admissionContent.admitCardNotice}</p>
        <div className="p-4 bg-surface-muted/50 border border-border rounded">
          <p className="font-semibold text-foreground mb-1">{pick('অঙ্গীকারনামা', 'Guardian Declaration')}</p>
          <p className="text-muted-foreground text-sm sm:text-base">{db?.admissionContent.declarationText}</p>
        </div>
      </Card>
    </div>
  );
}

export function AdmissionRequirementsPage() {
  const { pick } = useI18n();
  const docs = [
    'শিক্ষার্থীর ১৭ ডিজিটের অনলাইন জন্ম নিবন্ধন সনদের ফটোকপি (বাংলা ও ইংরেজি — প্রথম ৪ ডিজিট জন্মসালের সাথে সামঞ্জস্যপূর্ণ)',
    'পিতা ও মাতার (অথবা উভয়েই মৃত হলে বৈধ অভিভাবকের) জাতীয় পরিচয়পত্রের (NID) ফটোকপি',
    'শিক্ষার্থীর সদ্য তোলা ২ কপি পাসপোর্ট সাইজ রঙিন ছবি (অনলাইন আবেদনে ১ কপি আপলোড আবশ্যক)',
    '৬ষ্ঠ শ্রেণির জন্য ৫ম শ্রেণি উত্তীর্ণ প্রত্যয়নপত্র; ৭ম–৯ম শ্রেণিতে বদলির জন্য পূর্ববর্তী বিদ্যালয়ের ছাড়পত্র (TC) ও বার্ষিক ফলাফল সনদ',
    '১০ম শ্রেণিতে ভর্তির জন্য শিক্ষা বোর্ডের অনুমোদিত e-TC অর্ডার ও ৯ম শ্রেণির বোর্ড রেজিস্ট্রেশন কার্ডের কপি বাধ্যতামূলক',
    'অভিভাবকের সচল ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর (SMS ও জরুরি যোগাযোগের জন্য)',
  ];
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader
        title={pick('ভর্তির যোগ্যতা ও প্রয়োজনীয় কাগজপত্র', 'Eligibility & Required Documents')}
      />
      <Card className="p-6 space-y-3">
        <ul className="space-y-3 text-base">
          {docs.map((d, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <span>{d}</span>
            </li>
          ))}
        </ul>
        <div className="pt-4">
          <Link href="/admission/apply">
            <Button variant="primary">{pick('অনলাইন আবেদন শুরু করুন', 'Start Online Application')}</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export function AdmissionDownloadFormPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const adm = db.admissionContent;
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-center justify-between no-print">
        <PageHeader
          title={pick('মুদ্রণযোগ্য ভর্তি ফরম (১৩-দফা)', 'Printable Official Admission Form')}
          description={pick('সরাসরি A4 কাগজে প্রিন্ট করে বিদ্যালয় অফিসে জমা দিন অথবা অনলাইনে আবেদন করুন।', 'Print on A4 paper or apply online.')}
        />
        <Button variant="primary" onClick={triggerPrint}>
          <Printer className="w-4 h-4" /> {pick('প্রিন্ট / পিডিএফ', 'Print / Save PDF')}
        </Button>
      </div>

      <Card className="print-sheet p-8 space-y-5">
        <div className="flex items-center justify-center gap-4 border-b-2 border-[#0B7A34] pb-4 text-center">
          <SchoolEmblem size={66} />
          <div>
            <h2 className="text-xl font-bold text-[#0B7A34]">{adm.schoolNameBn}</h2>
            <p className="text-xs font-bold text-[#124B96]">{adm.schoolNameEn}</p>
            <p className="text-xs text-muted-foreground">{adm.schoolAddress}</p>
            <p className="text-xs tabular-nums">
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

export function AdmissionStatusPage() {
  const { data: db } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [query, setQuery] = useState('ADM-2027-001');
  const [found, setFound] = useState<OnlineAdmissionApplication | null>(null);
  const [searched, setSearched] = useState(false);
  const [docTab, setDocTab] = useState<'form' | 'admit'>('form');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const statusDocRef = useRef<HTMLDivElement | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    const q = query.trim().toLowerCase();
    const match =
      db?.onlineAdmissions.find(
        (a) =>
          a.applicationNumber.toLowerCase() === q ||
          a.guardianPhone === query.trim() ||
          a.birthCertificateNo === query.trim()
      ) ?? null;
    setFound(match);
  };

  const foundValues =
    found && db ? buildDefaultAdmissionValues(db, 'public', undefined, found) : null;
  const foundMeta = found
    ? {
        applicationNumber: found.applicationNumber,
        submittedAt: found.submittedAt,
        admissionTestRoll: found.admissionTestRoll,
        admissionTestDate: found.admissionTestDate,
      }
    : null;
  const foundClass = found && db ? db.classes.find((c) => c.id === found.targetClassId) : undefined;
  const foundGroup =
    found && db ? db.academicGroups.find((item) => item.id === found.targetGroupId) : undefined;

  const handleStatusPrint = () => {
    if (!found || !db || !foundValues || !foundMeta) return;
    const title = `${docTab === 'form' ? 'BHS-Admission-Form' : 'BHS-Admit-Card'}-${found.applicationNumber}`;
    const payload: CertificatePrintPayload =
      docTab === 'form'
        ? {
            kind: 'ADMISSION_FORM',
            data: buildAdmissionFormPrintData(foundValues, db, 'public', foundMeta),
          }
        : {
            kind: 'ADMIT_CARD',
            school: db.schoolProfile,
            application: found,
            targetClassName: locale === 'bn' ? foundClass?.nameBn ?? '' : foundClass?.name ?? '',
            groupName: foundGroup ? (locale === 'bn' ? foundGroup.nameBn : foundGroup.name) : null,
          };
    printDocumentNode(statusDocRef.current, title, payload);
  };

  const handleStatusDownloadPdf = async () => {
    if (!found || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const title = `${docTab === 'form' ? 'BHS-Admission-Form' : 'BHS-Admit-Card'}-${found.applicationNumber}`;
      const ok = await exportNodeToA4Pdf(statusDocRef.current, title);
      if (ok) {
        toast.success(
          pick('A4 পিডিএফ (PDF) সফলভাবে ডাউনলোড হয়েছে।', 'A4 PDF downloaded successfully.')
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
        title={pick('ভর্তি আবেদনের অবস্থা যাচাই ও ফরম ডাউনলোড', 'Check Admission Status & Download Form')}
        description={pick('আবেদন নম্বর (যেমন: ADM-2027-001) বা অভিভাবকের মোবাইল নম্বর দিয়ে খুঁজুন।', 'Search by Application No (e.g., ADM-2027-001) or guardian phone.')}
      />

      <Card className="p-5 no-print rounded-[4px]">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ADM-2027-001"
              className="pl-9 rounded-[4px]"
            />
          </div>
          <Button type="submit" variant="primary" className="rounded-[4px]">
            {pick('যাচাই করুন', 'Check Status')}
          </Button>
        </form>
      </Card>

      {searched && !found && (
        <Card className="p-8 text-center text-base text-muted-foreground rounded-[4px]">
          {pick('এই নম্বরে কোনো আবেদন পাওয়া যায়নি। উদাহরণস্বরূপ ADM-2027-001 বা ADM-2027-002 দিয়ে চেষ্টা করুন।', 'No application matched. Try ADM-2027-001 or ADM-2027-002.')}
        </Card>
      )}

      {found && db && foundValues && foundMeta && (
        <div className="space-y-5">
          <div className="p-4 sm:p-5 rounded-[4px] border border-border bg-surface space-y-3 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{pick('আবেদনের বর্তমান অবস্থা', 'Current Status')}</p>
                <div className="mt-1 flex items-center gap-3">
                  <span className="font-mono text-base font-bold text-foreground">{found.applicationNumber}</span>
                  <StatusBadge enumName="AdmissionApplicationStatus" value={found.status} />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="rounded-[4px]"
                  onClick={handleStatusPrint}
                >
                  <Printer className="w-4 h-4" />
                  {pick('প্রিন্ট করুন', 'Print')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-[4px]"
                  disabled={downloadingPdf}
                  onClick={handleStatusDownloadPdf}
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
              </div>
            </div>

            <div className="inline-flex border border-border rounded-[4px] overflow-hidden divide-x divide-border text-sm">
              <button
                type="button"
                onClick={() => setDocTab('form')}
                className={`px-3.5 py-2 font-medium transition-colors cursor-pointer ${
                  docTab === 'form'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface text-foreground hover:bg-surface-muted/60'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {pick('পূর্ণাঙ্গ আবেদনপত্র', 'Full Application Form')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDocTab('admit')}
                className={`px-3.5 py-2 font-medium transition-colors cursor-pointer ${
                  docTab === 'admit'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface text-foreground hover:bg-surface-muted/60'
                }`}
              >
                {pick('ভর্তি পরীক্ষার প্রবেশপত্র', 'Admit Card')}
              </button>
            </div>
          </div>

          <div
            ref={statusDocRef}
            className="rounded-[4px] border border-border bg-surface-muted/40 p-3 sm:p-6"
          >
            {docTab === 'form' ? (
              <AdmissionFormPreviewSheet
                values={foundValues}
                db={db}
                mode="public"
                submittedMeta={foundMeta}
              />
            ) : (
              <PrintableAdmissionAdmitCard
                school={db.schoolProfile}
                application={found}
                targetClassName={locale === 'bn' ? foundClass?.nameBn ?? '' : foundClass?.name ?? ''}
                groupName={foundGroup ? (locale === 'bn' ? foundGroup.nameBn : foundGroup.name) : null}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
