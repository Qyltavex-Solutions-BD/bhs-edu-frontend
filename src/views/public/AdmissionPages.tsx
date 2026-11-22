'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Printer,
  Search,
  FileText,
} from 'lucide-react';
import { useGetBootstrapQuery } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatBdt, formatDateLong } from '@/src/lib/formatters';
import { LoadingSkeleton, PageHeader, SchoolEmblem } from '@/src/components/shared/Feedback';
import { Button, Card, Input } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { PrintableAdmissionAdmitCard } from '@/src/components/print/PrintDocuments';
import type { OnlineAdmissionApplication } from '@/src/types/proposed/future';
import { triggerPrint } from '@/src/lib/utils/cn';
import { UnifiedAdmissionForm } from '@/src/features/admission/components/UnifiedAdmissionForm';

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
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
        <Card className="p-6 border-success/40 bg-success/5 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-base font-bold text-success flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {pick('অনলাইন ভর্তি আবেদন সফলভাবে গৃহীত হয়েছে!', 'Online Admission Application Received!')}
              </p>
              <p className="text-sm text-muted-foreground">
                {pick('আপনার আবেদন নম্বর সংরক্ষণ করুন:', 'Save your application number:')}{' '}
                <strong className="font-mono text-foreground">{submittedApp.applicationNumber}</strong>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" size="sm" onClick={triggerPrint}>
                <Printer className="w-4 h-4" /> {pick('প্রবেশপত্র প্রিন্ট', 'Print Admit Card')}
              </Button>
              <Link href="/admission/status">
                <Button variant="outline" size="sm">{pick('অবস্থা যাচাই', 'Track Status')}</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => setSubmittedApp(null)}>
                {pick('নতুন আবেদন করুন', 'New Application')}
              </Button>
            </div>
          </div>
        </Card>

        <PrintableAdmissionAdmitCard
          school={db.schoolProfile}
          application={submittedApp}
          targetClassName={locale === 'bn' ? cls?.nameBn ?? '' : cls?.name ?? ''}
          groupName={grp ? (locale === 'bn' ? grp.nameBn : grp.name) : null}
        />
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
        onPublicSuccess={(created) => setSubmittedApp(created)}
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

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader
        title={pick('ভর্তি আবেদনের অবস্থা যাচাই ও প্রবেশপত্র', 'Check Admission Status & Reprint Admit Card')}
        description={pick('আবেদন নম্বর (যেমন: ADM-2027-001) বা অভিভাবকের মোবাইল নম্বর দিয়ে খুঁজুন।', 'Search by Application No (e.g., ADM-2027-001) or guardian phone.')}
      />

      <Card className="p-5 no-print">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ADM-2027-001"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="primary">{pick('যাচাই করুন', 'Check Status')}</Button>
        </form>
      </Card>

      {searched && !found && (
        <Card className="p-8 text-center text-base text-muted-foreground">
          {pick('এই নম্বরে কোনো আবেদন পাওয়া যায়নি। উদাহরণস্বরূপ ADM-2027-001 বা ADM-2027-002 দিয়ে চেষ্টা করুন।', 'No application matched. Try ADM-2027-001 or ADM-2027-002.')}
        </Card>
      )}

      {found && db && (
        <div className="space-y-5">
          <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
            <div>
              <p className="text-sm text-muted-foreground">{pick('আবেদনের বর্তমান অবস্থা', 'Current Status')}</p>
              <div className="mt-1 flex items-center gap-3">
                <span className="font-mono text-base font-bold text-foreground">{found.applicationNumber}</span>
                <StatusBadge enumName="AdmissionApplicationStatus" value={found.status} />
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={triggerPrint}>
              <FileText className="w-4 h-4" /> {pick('প্রবেশপত্র প্রিন্ট করুন', 'Print Admit Card')}
            </Button>
          </Card>

          <PrintableAdmissionAdmitCard
            school={db.schoolProfile}
            application={found}
            targetClassName={
              locale === 'bn'
                ? db.classes.find((c) => c.id === found.targetClassId)?.nameBn ?? ''
                : db.classes.find((c) => c.id === found.targetClassId)?.name ?? ''
            }
            groupName={(() => {
              const g = db.academicGroups.find((item) => item.id === found.targetGroupId);
              return g ? (locale === 'bn' ? g.nameBn : g.name) : null;
            })()}
          />
        </div>
      )}
    </div>
  );
}
