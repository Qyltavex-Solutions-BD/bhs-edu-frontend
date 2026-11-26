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
import {
  useGetPublicAdmissionCatalogQuery,
  useLazyGetPublicAdmissionStatusQuery,
} from '@/src/features/admission/api/admission.api';
import {
  getRequiredDocumentChecklist,
  type AdmissionCatalogData,
} from '@/src/features/admission/rules';
import type { SchoolProfile } from '@/src/types/entities';
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

export function AdmissionStatusPage() {
  const { data: catalogData } = useGetPublicAdmissionCatalogQuery();
  const [triggerLookup, { isFetching: searching }] =
    useLazyGetPublicAdmissionStatusQuery();
  const { locale, pick } = useI18n();
  const [query, setQuery] = useState('BHS-ADM-2027-0001');
  const [found, setFound] = useState<OnlineAdmissionApplication | null>(null);
  const [searched, setSearched] = useState(false);
  const [docTab, setDocTab] = useState<'form' | 'admit'>('form');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const statusDocRef = useRef<HTMLDivElement | null>(null);

  const schoolProfile: SchoolProfile =
    catalogData?.schoolProfile ??
    ({
      id: 'default',
      name: 'Bhojeshwar High School',
      nameBn: 'বজেশ্বর উচ্চ বিদ্যালয়',
      nameEn: 'Bhojeshwar High School',
      eiin: '113587',
      address: 'নড়িয়া, শরীয়তপুর',
      createdAt: '',
      updatedAt: '',
    } as SchoolProfile);

  const db: AdmissionCatalogData = {
    academicYears: catalogData?.academicYears ?? [],
    classes: catalogData?.classes ?? [],
    sections: catalogData?.sections ?? [],
    academicGroups: catalogData?.academicGroups ?? [],
    classSubjects: catalogData?.classSubjects ?? [],
    admissionContent: catalogData?.admissionContent,
    schoolProfile,
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearched(true);
    const isNumericOnly = /^\d+$/.test(q);
    try {
      const res = await triggerLookup(
        isNumericOnly ? { birthCertificateNo: q } : { applicationNumber: q }
      ).unwrap();
      setFound(res);
    } catch {
      setFound(null);
    }
  };

  const foundValues = found
    ? buildDefaultAdmissionValues(db, 'public', undefined, found)
    : null;
  const foundMeta = found
    ? {
        applicationNumber: found.applicationNumber,
        submittedAt: found.submittedAt,
        admissionTestRoll: found.admissionTestRoll,
        admissionTestDate: found.admissionTestDate,
      }
    : null;
  const foundClass = found ? db.classes.find((c) => c.id === found.targetClassId) : undefined;
  const foundGroup = found ? db.academicGroups.find((item) => item.id === found.targetGroupId) : undefined;

  const handleStatusPrint = () => {
    if (!found || !foundValues || !foundMeta) return;
    const title = `${docTab === 'form' ? 'BHS-Admission-Form' : 'BHS-Admit-Card'}-${found.applicationNumber}`;
    const payload: CertificatePrintPayload =
      docTab === 'form'
        ? {
            kind: 'ADMISSION_FORM',
            data: buildAdmissionFormPrintData(foundValues, db, 'public', foundMeta),
          }
        : {
            kind: 'ADMIT_CARD',
            school: schoolProfile,
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
        description={pick('আবেদন নম্বর (যেমন: BHS-ADM-2027-0001) বা জন্ম নিবন্ধন নম্বর দিয়ে খুঁজুন।', 'Search by Application No (e.g., BHS-ADM-2027-0001) or Birth Certificate No.')}
      />

      <Card className="p-5 no-print rounded-[4px]">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="BHS-ADM-2027-0001"
              className="pl-9 rounded-[4px]"
            />
          </div>
          <Button type="submit" variant="primary" className="rounded-[4px]" disabled={searching}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {pick('যাচাই করুন', 'Check Status')}
          </Button>
        </form>
      </Card>

      {searching && <LoadingSkeleton />}

      {searched && !searching && !found && (
        <Card className="p-8 text-center text-base text-muted-foreground rounded-[4px]">
          {pick('এই নম্বরে কোনো আবেদন পাওয়া যায়নি। অনুগ্রহ করে সঠিক আবেদন নম্বর (যেমন: BHS-ADM-2027-0001) বা ১৭-ডিজিট জন্ম নিবন্ধন নম্বর দিন।', 'No application matched. Please enter a valid Application No or 17-digit Birth Certificate No.')}
        </Card>
      )}

      {found && foundValues && foundMeta && (
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

            {found.status === 'APPROVED' && (
              <div className="p-4 rounded-[4px] border border-primary/30 bg-primary/5 space-y-2.5">
                <p className="text-sm font-bold text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {pick(
                    'অভিনন্দন! আপনার আবেদনটি প্রাথমিকভাবে অনুমোদিত হয়েছে।',
                    'Congratulations! Your application has been provisionally approved.'
                  )}
                </p>

                <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                  {found.reportingStartDate && found.reportingEndDate
                    ? pick(
                        `আগামী ${formatDateLong(found.reportingStartDate, 'bn')} থেকে ${formatDateLong(found.reportingEndDate, 'bn')}-এর মধ্যে নিচের মূল কাগজপত্র ও ভর্তি ফি নিয়ে স্বশরীরে বিদ্যালয় অফিসে উপস্থিত হতে হবে। অন্যথায় আপনার প্রাথমিক অনুমোদন বাতিল বলে গণ্য হবে।`,
                        `You must appear in person at the school office between ${formatDateLong(found.reportingStartDate, 'en')} and ${formatDateLong(found.reportingEndDate, 'en')} with the original documents below and admission fee. Otherwise, your initial approval will be cancelled.`
                      )
                    : found.reportingEndDate
                    ? pick(
                        `আগামী ${formatDateLong(found.reportingEndDate, 'bn')}-এর মধ্যে নিচের মূল কাগজপত্র ও ভর্তি ফি নিয়ে স্বশরীরে বিদ্যালয় অফিসে উপস্থিত হতে হবে। অন্যথায় আপনার প্রাথমিক অনুমোদন বাতিল বলে গণ্য হবে।`,
                        `You must appear in person at the school office by ${formatDateLong(found.reportingEndDate, 'en')} with the original documents below and admission fee. Otherwise, your initial approval will be cancelled.`
                      )
                    : pick(
                        'নির্ধারিত সময়ের মধ্যে নিচের মূল কাগজপত্র ও ভর্তি ফি নিয়ে স্বশরীরে বিদ্যালয় অফিসে উপস্থিত হতে হবে।',
                        'Please appear in person at the school office within the scheduled time with the original documents below and admission fee.'
                      )}
                </p>

                <div className="space-y-1.5 pt-1 border-t border-primary/15">
                  <p className="text-xs sm:text-sm font-semibold text-foreground">
                    {pick(
                      'বিদ্যালয়ে যে সকল মূল কাগজপত্র নিয়ে আসতে হবে:',
                      'Original documents you must bring to school:'
                    )}
                  </p>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-foreground">
                    {getRequiredDocumentChecklist(
                      foundClass?.numericValue ?? 6,
                      found.admissionType ?? (found.isReadmission ? 'READMISSION' : 'NEW'),
                      found.fatherAlive === false || found.motherAlive === false
                    ).map((doc) => (
                      <li key={doc.key} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{locale === 'bn' ? doc.labelBn : doc.labelEn}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {(found.status === 'NEW' || found.status === 'UNDER_REVIEW') && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                {pick(
                  'আপনার আবেদনটি বর্তমানে বিদ্যালয় অফিসে প্রাথমিক যাচাইয়ের অপেক্ষায় রয়েছে। অনুমোদিত হলে এখানেই উপস্থিতির তারিখ ও প্রয়োজনীয় মূল কাগজপত্রের তালিকা দেখতে পাবেন।',
                  'Your application is pending initial review. Once approved, the reporting date and required original documents will be shown here.'
                )}
              </p>
            )}

            {found.status === 'ADMITTED' && (
              <p className="text-xs sm:text-sm font-medium text-success">
                {pick(
                  'আপনার চূড়ান্ত ভর্তি সম্পন্ন হয়েছে এবং বিদ্যালয়ের নিয়মিত শিক্ষার্থী হিসেবে শাখা ও রোল বরাদ্দ করা হয়েছে।',
                  'Your final admission is complete and you have been enrolled with an assigned section and roll.'
                )}
              </p>
            )}

            {found.status === 'REJECTED' && (
              <p className="text-xs sm:text-sm font-medium text-destructive">
                {pick(
                  'দুঃখিত, আপনার আবেদনটি বাতিল করা হয়েছে। বিস্তারিত জানতে বিদ্যালয় অফিসে যোগাযোগ করুন।',
                  'Sorry, your application was rejected. Please contact the school office for details.'
                )}
              </p>
            )}

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
                school={schoolProfile}
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

