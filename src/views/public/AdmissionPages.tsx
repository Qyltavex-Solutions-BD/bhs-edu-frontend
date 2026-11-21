'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Printer,
  Search,
  FileText,
} from 'lucide-react';
import {
  useGetBootstrapQuery,
  useSubmitAdmissionApplicationMutation,
} from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import {
  admissionApplicationSchema,
  type AdmissionApplicationFormValues,
} from '@/src/lib/validations/schemas';
import { formatBdt, formatDateLong } from '@/src/lib/formatters';
import { LoadingSkeleton, PageHeader, SchoolEmblem } from '@/src/components/shared/Feedback';
import { Button, Card, FormField, Input, Select, Textarea } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { PrintableAdmissionAdmitCard } from '@/src/components/print/PrintDocuments';
import { Gender, Religion } from '@/src/types/enums';
import type { OnlineAdmissionApplication } from '@/src/types/proposed/future';
import { triggerPrint } from '@/src/lib/utils/cn';

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
    'শিক্ষার্থীর ১৭ ডিজিটের ডিজিটাল জন্ম নিবন্ধন সনদের সত্যায়িত ফটোকপি',
    'পিতা ও মাতার জাতীয় পরিচয়পত্রের (NID) ফটোকপি',
    'শিক্ষার্থীর সদ্য তোলা ২ কপি পাসপোর্ট সাইজ ও ২ কপি স্ট্যাম্প সাইজ রঙিন ছবি',
    'পূর্ববর্তী বিদ্যালয়ের ছাড়পত্র (TC) ও সর্বশেষ পরীক্ষার নম্বরপত্র (৭ম–৯ম শ্রেণির জন্য)',
    'অভিভাবকের সচল বাংলাদেশি মোবাইল নম্বর (SMS নোটিফিকেশনের জন্য)',
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
  const [submitApp, { isLoading: submitting }] = useSubmitAdmissionApplicationMutation();
  const { locale, pick } = useI18n();
  const [step, setStep] = useState(1);
  const [submittedApp, setSubmittedApp] = useState<OnlineAdmissionApplication | null>(null);

  const form = useForm<AdmissionApplicationFormValues>({
    resolver: zodResolver(admissionApplicationSchema) as never,
    defaultValues: {
      studentNameBn: '',
      studentNameEn: '',
      fatherNameBn: '',
      fatherNameEn: '',
      fatherOccupation: '',
      fatherNid: '',
      motherNameBn: '',
      motherNameEn: '',
      motherOccupation: '',
      motherNid: '',
      guardianPhone: '',
      presentAddress: '',
      permanentAddress: '',
      dateOfBirth: '2014-01-15',
      gender: Gender.MALE,
      birthCertificateNo: '',
      religion: Religion.ISLAM,
      previousSchoolName: '',
      previousClass: '৫ম শ্রেণি',
      isReadmission: false,
      targetClassId: 'cls-6',
      preferredSection: 'ক',
      targetGroupId: '',
      optionalSubjectName: '',
      declarationAccepted: false,
    },
  });

  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

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

  const targetClassId = form.watch('targetClassId');
  const isNineOrTen = targetClassId === 'cls-9' || targetClassId === 'cls-10';

  const onSubmit = async (values: AdmissionApplicationFormValues) => {
    try {
      const created = await submitApp({
        ...values,
        academicSession: db.admissionContent.academicSession ?? '২০২৭',
        targetGroupId: isNineOrTen ? values.targetGroupId || 'grp-sci' : null,
      }).unwrap();
      setSubmittedApp(created);
      toast.success(
        pick(
          `আবেদন সফলভাবে জমা হয়েছে! আবেদন নম্বর: ${created.applicationNumber}`,
          `Application submitted! Application No: ${created.applicationNumber}`
        )
      );
    } catch {
      toast.error(pick('আবেদন জমা দিতে সমস্যা হয়েছে।', 'Submission failed.'));
    }
  };

  if (submittedApp) {
    const cls = db.classes.find((c) => c.id === submittedApp.targetClassId);
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
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={triggerPrint}>
                <Printer className="w-4 h-4" /> {pick('প্রবেশপত্র প্রিন্ট', 'Print Admit Card')}
              </Button>
              <Link href="/admission/status">
                <Button variant="outline" size="sm">{pick('অবস্থা যাচাই', 'Track Status')}</Button>
              </Link>
            </div>
          </div>
        </Card>

        <PrintableAdmissionAdmitCard
          school={db.schoolProfile}
          application={submittedApp}
          targetClassName={locale === 'bn' ? cls?.nameBn ?? '' : cls?.name ?? ''}
        />
      </div>
    );
  }

  const steps = [
    { num: 1, label: pick('০১. শিক্ষার্থী ও জন্ম তথ্য', '1. Student Bio') },
    { num: 2, label: pick('০২. পিতা-মাতা ও ঠিকানা', '2. Parents & Address') },
    { num: 3, label: pick('০৩. পূর্ববর্তী ও ভর্তিচ্ছু শ্রেণি', '3. Academic & Class') },
    { num: 4, label: pick('০৪. যাচাই ও অঙ্গীকারনামা', '4. Review & Submit') },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageHeader
        title={pick('অনলাইন ভর্তি আবেদন ফরম (১৩-দফা)', 'Online Admission Application (13-Point Form)')}
        description={pick(
          'সকল তথ্য জন্ম সনদ ও এনআইডি অনুযায়ী সঠিকভাবে পূরণ করুন। (ডেমো মোড — ব্যাকএন্ড মডিউল সংযোজনের জন্য প্রস্তুত)',
          'Fill all 13 official school admission points carefully. (Mock adapter enabled for preview)'
        )}
      />

      {/* Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {steps.map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num)}
            className={`px-3 py-2.5 text-sm font-semibold rounded-[var(--radius)] border text-left cursor-pointer ${
              step === s.num
                ? 'bg-primary text-primary-foreground border-primary'
                : step > s.num
                  ? 'bg-success/10 text-success border-success/30'
                  : 'bg-surface text-muted-foreground border-border'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="p-6 space-y-6">
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={pick('০১. শিক্ষার্থীর নাম (বাংলায়)', '01. Student Name (Bangla)')} required error={form.formState.errors.studentNameBn?.message}>
                <Input {...form.register('studentNameBn')} placeholder="যেমন: রাফিউল ইসলাম" />
              </FormField>
              <FormField label={pick('০১. শিক্ষার্থীর নাম (ইংরেজিতে)', '01. Student Name (English)')} required error={form.formState.errors.studentNameEn?.message}>
                <Input {...form.register('studentNameEn')} placeholder="e.g. Rafiul Islam" />
              </FormField>
              <FormField label={pick('০৫. জন্ম তারিখ', '05. Date of Birth')} required error={form.formState.errors.dateOfBirth?.message}>
                <Input type="date" {...form.register('dateOfBirth')} />
              </FormField>
              <FormField label={pick('০৬. ১৭ ডিজিটের ডিজিটাল জন্ম সনদ নং', '06. 17-Digit Birth Certificate No')} required error={form.formState.errors.birthCertificateNo?.message}>
                <Input {...form.register('birthCertificateNo')} placeholder="20148614500012345" maxLength={17} />
              </FormField>
              <FormField label={pick('লিঙ্গ', 'Gender')} required>
                <Select {...form.register('gender')}>
                  <option value={Gender.MALE}>{pick('ছাত্র (Male)', 'Male')}</option>
                  <option value={Gender.FEMALE}>{pick('ছাত্রী (Female)', 'Female')}</option>
                  <option value={Gender.OTHER}>{pick('অন্যান্য', 'Other')}</option>
                </Select>
              </FormField>
              <FormField label={pick('০৭. ধর্ম', '07. Religion')} required>
                <Select {...form.register('religion')}>
                  <option value={Religion.ISLAM}>{pick('ইসলাম', 'Islam')}</option>
                  <option value={Religion.HINDUISM}>{pick('হিন্দু', 'Hinduism')}</option>
                  <option value={Religion.BUDDHISM}>{pick('বৌদ্ধ', 'Buddhism')}</option>
                  <option value={Religion.CHRISTIANITY}>{pick('খ্রিস্টান', 'Christianity')}</option>
                  <option value={Religion.OTHER}>{pick('অন্যান্য', 'Other')}</option>
                </Select>
              </FormField>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={pick('০২. পিতার নাম (বাংলায়)', '02. Father Name (Bangla)')} required error={form.formState.errors.fatherNameBn?.message}>
                <Input {...form.register('fatherNameBn')} />
              </FormField>
              <FormField label={pick('পিতার নাম (ইংরেজিতে)', 'Father Name (English)')} required error={form.formState.errors.fatherNameEn?.message}>
                <Input {...form.register('fatherNameEn')} />
              </FormField>
              <FormField label={pick('পিতার পেশা', 'Father Occupation')} required error={form.formState.errors.fatherOccupation?.message}>
                <Input {...form.register('fatherOccupation')} />
              </FormField>
              <FormField label={pick('পিতার এনআইডি নম্বর', 'Father NID Number')} required error={form.formState.errors.fatherNid?.message}>
                <Input {...form.register('fatherNid')} />
              </FormField>
              <FormField label={pick('০৩. মাতার নাম (বাংলায়)', '03. Mother Name (Bangla)')} required error={form.formState.errors.motherNameBn?.message}>
                <Input {...form.register('motherNameBn')} />
              </FormField>
              <FormField label={pick('মাতার নাম (ইংরেজিতে)', 'Mother Name (English)')} required error={form.formState.errors.motherNameEn?.message}>
                <Input {...form.register('motherNameEn')} />
              </FormField>
              <FormField label={pick('মাতার পেশা', 'Mother Occupation')} required error={form.formState.errors.motherOccupation?.message}>
                <Input {...form.register('motherOccupation')} />
              </FormField>
              <FormField label={pick('মাতার এনআইডি নম্বর', 'Mother NID Number')} required error={form.formState.errors.motherNid?.message}>
                <Input {...form.register('motherNid')} />
              </FormField>
              <FormField label={pick('অভিভাবকের মোবাইল নম্বর', 'Guardian Mobile Phone')} required error={form.formState.errors.guardianPhone?.message}>
                <Input {...form.register('guardianPhone')} placeholder="017XXXXXXXX" />
              </FormField>
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={pick('০৪. বর্তমান ঠিকানা', '04. Present Address')} required error={form.formState.errors.presentAddress?.message}>
                  <Textarea {...form.register('presentAddress')} placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা" />
                </FormField>
                <FormField label={pick('০৪. স্থায়ী ঠিকানা', '04. Permanent Address')} required error={form.formState.errors.permanentAddress?.message}>
                  <Textarea {...form.register('permanentAddress')} placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা" />
                </FormField>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={pick('০৯. পূর্বে অধ্যয়নরত বিদ্যালয়ের নাম', '09. Previous School Name')}>
                <Input {...form.register('previousSchoolName')} />
              </FormField>
              <FormField label={pick('পূর্ববর্তী শ্রেণি ও প্রাপ্ত গ্রেড', 'Previous Class & Grade')}>
                <Input {...form.register('previousGrade')} placeholder="যেমন: ৫ম শ্রেণি, A+" />
              </FormField>
              <FormField label={pick('০৮. পি.এস.সি / জে.এস.সি পাসের সন', '08. Previous Exam Year')}>
                <Input type="number" {...form.register('prevExamPassingYear')} placeholder="2025" />
              </FormField>
              <FormField label={pick('পূর্ববর্তী পরীক্ষার রোল / জিপিএ', 'Previous Exam Roll')}>
                <Input {...form.register('prevExamRoll')} />
              </FormField>
              <FormField label={pick('১১. ভর্তিচ্ছু শ্রেণি', '11. Applying for Class')} required>
                <Select {...form.register('targetClassId')}>
                  {db.classes.filter((c) => c.numericValue <= 9).map((c) => (
                    <option key={c.id} value={c.id}>{locale === 'bn' ? c.nameBn : c.name}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label={pick('১০. ভর্তির ধরন', '10. Admission Type')}>
                <Select
                  value={form.watch('isReadmission') ? 'READMISSION' : 'NEW'}
                  onChange={(e) => form.setValue('isReadmission', e.target.value === 'READMISSION')}
                >
                  <option value="NEW">{pick('নতুন ভর্তি', 'New Admission')}</option>
                  <option value="READMISSION">{pick('পুনঃভর্তি', 'Re-admission')}</option>
                </Select>
              </FormField>
              {isNineOrTen && (
                <>
                  <FormField label={pick('১২. ৯ম শ্রেণির বিভাগ', '12. Academic Group')}>
                    <Select {...form.register('targetGroupId')}>
                      {db.academicGroups.map((g) => (
                        <option key={g.id} value={g.id}>{locale === 'bn' ? g.nameBn : g.name}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label={pick('১৩. ৪র্থ বিষয় (ঐচ্ছিক)', '13. 4th / Optional Subject')}>
                    <Select {...form.register('optionalSubjectName')}>
                      <option value="উচ্চতর গণিত">{pick('উচ্চতর গণিত', 'Higher Mathematics')}</option>
                      <option value="কৃষি শিক্ষা">{pick('কৃষি শিক্ষা', 'Agriculture Studies')}</option>
                      <option value="কম্পিউটার শিক্ষা">{pick('কম্পিউটার শিক্ষা', 'Computer Studies')}</option>
                    </Select>
                  </FormField>
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-surface-muted/50 border border-border rounded space-y-2 text-base">
                <h3 className="font-bold text-foreground">{pick('আবেদনের সারসংক্ষেপ', 'Application Summary')}</h3>
                <p><strong>{pick('শিক্ষার্থী:', 'Student:')}</strong> {form.watch('studentNameBn')} ({form.watch('studentNameEn')})</p>
                <p><strong>{pick('পিতা / মাতা:', 'Parents:')}</strong> {form.watch('fatherNameBn')} / {form.watch('motherNameBn')}</p>
                <p className="tabular-nums"><strong>{pick('জন্ম সনদ:', 'Birth Cert:')}</strong> {form.watch('birthCertificateNo')}</p>
                <p className="tabular-nums"><strong>{pick('মোবাইল:', 'Phone:')}</strong> {form.watch('guardianPhone')}</p>
              </div>
              <div className="p-4 border border-border rounded text-sm leading-relaxed bg-surface">
                <p className="font-semibold text-foreground mb-2">{pick('অঙ্গীকারনামা', 'Declaration')}</p>
                <p className="text-muted-foreground">{db.admissionContent.declarationText}</p>
                <label className="mt-3 flex items-center gap-2 text-base font-medium text-foreground cursor-pointer">
                  <input type="checkbox" {...form.register('declarationAccepted')} className="w-4 h-4 accent-primary" />
                  <span>{pick('আমি উপরের অঙ্গীকারনামায় সম্মত এবং সকল তথ্য সঠিক।', 'I agree to the declaration and confirm all information is accurate.')}</span>
                </label>
                {form.formState.errors.declarationAccepted && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.declarationAccepted.message}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button
              variant="outline"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              {pick('পূর্ববর্তী ধাপ', 'Previous')}
            </Button>
            {step < 4 ? (
              <Button variant="primary" onClick={() => setStep((s) => Math.min(4, s + 1))}>
                {pick('পরবর্তী ধাপ', 'Next Step')}
              </Button>
            ) : (
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? pick('জমা হচ্ছে...', 'Submitting...') : pick('আবেদন জমা দিন', 'Submit Application')}
              </Button>
            )}
          </div>
        </Card>
      </form>
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
          />
        </div>
      )}
    </div>
  );
}
