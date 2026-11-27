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
      nameBn: 'ভোজেশ্বর উচ্চ বিদ্যালয়',
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
            targetClassName: foundClass?.nameBn ?? '',
            groupName: foundGroup ? (foundGroup.nameBn) : null,
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
        title={'ভর্তি আবেদনের অবস্থা যাচাই ও ফরম ডাউনলোড'}
        description={'আবেদন নম্বর (যেমন: BHS-ADM-2027-0001) বা জন্ম নিবন্ধন নম্বর দিয়ে খুঁজুন।'}
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
            {'যাচাই করুন'}
          </Button>
        </form>
      </Card>

      {searching && <LoadingSkeleton />}

      {searched && !searching && !found && (
        <Card className="p-8 text-center text-base text-muted-foreground rounded-[4px]">
          {'এই নম্বরে কোনো আবেদন পাওয়া যায়নি। অনুগ্রহ করে সঠিক আবেদন নম্বর (যেমন: BHS-ADM-2027-0001) বা ১৭-ডিজিট জন্ম নিবন্ধন নম্বর দিন।'}
        </Card>
      )}

      {found && foundValues && foundMeta && (
        <div className="space-y-5">
          <div className="p-4 sm:p-5 rounded-[4px] border border-border bg-surface space-y-3 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{'আবেদনের বর্তমান অবস্থা'}</p>
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
                  {'প্রিন্ট করুন'}
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
                    ? 'PDF তৈরি হচ্ছে...'
                    : 'PDF ডাউনলোড করুন'}
                </Button>
              </div>
            </div>

            {found.status === 'APPROVED' && (
              <div className="p-4 rounded-[4px] border border-primary/30 bg-primary/5 space-y-2.5">
                <p className="text-sm font-bold text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {'অভিনন্দন! আপনার আবেদনটি প্রাথমিকভাবে অনুমোদিত হয়েছে।'}
                </p>

                <p className="text-sm text-foreground leading-relaxed">
                  {found.reportingStartDate && found.reportingEndDate
                    ? `আগামী ${formatDateLong(found.reportingStartDate, 'bn')} থেকে ${formatDateLong(found.reportingEndDate, 'bn')}-এর মধ্যে নিচের মূল কাগজপত্র ও ভর্তি ফি নিয়ে স্বশরীরে বিদ্যালয় অফিসে উপস্থিত হতে হবে। অন্যথায় আপনার প্রাথমিক অনুমোদন বাতিল বলে গণ্য হবে।`
                    : found.reportingEndDate
                    ? `আগামী ${formatDateLong(found.reportingEndDate, 'bn')}-এর মধ্যে নিচের মূল কাগজপত্র ও ভর্তি ফি নিয়ে স্বশরীরে বিদ্যালয় অফিসে উপস্থিত হতে হবে। অন্যথায় আপনার প্রাথমিক অনুমোদন বাতিল বলে গণ্য হবে।`
                    : 'নির্ধারিত সময়ের মধ্যে নিচের মূল কাগজপত্র ও ভর্তি ফি নিয়ে স্বশরীরে বিদ্যালয় অফিসে উপস্থিত হতে হবে।'}
                </p>

                <div className="space-y-1.5 pt-1 border-t border-primary/15">
                  <p className="text-sm font-semibold text-foreground">
                    {'বিদ্যালয়ে যে সকল মূল কাগজপত্র নিয়ে আসতে হবে:'}
                  </p>
                  <ul className="space-y-1.5 text-sm text-foreground">
                    {getRequiredDocumentChecklist(
                      foundClass?.numericValue ?? 6,
                      found.admissionType ?? (found.isReadmission ? 'READMISSION' : 'NEW'),
                      found.fatherAlive === false || found.motherAlive === false
                    ).map((doc) => (
                      <li key={doc.key} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{doc.labelBn}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {(found.status === 'NEW' || found.status === 'UNDER_REVIEW') && (
              <p className="text-sm text-muted-foreground">
                {'আপনার আবেদনটি বর্তমানে বিদ্যালয় অফিসে প্রাথমিক যাচাইয়ের অপেক্ষায় রয়েছে। অনুমোদিত হলে এখানেই উপস্থিতির তারিখ ও প্রয়োজনীয় মূল কাগজপত্রের তালিকা দেখতে পাবেন।'}
              </p>
            )}

            {found.status === 'ADMITTED' && (
              <p className="text-sm font-medium text-success">
                {'আপনার চূড়ান্ত ভর্তি সম্পন্ন হয়েছে এবং বিদ্যালয়ের নিয়মিত শিক্ষার্থী হিসেবে শাখা ও রোল বরাদ্দ করা হয়েছে।'}
              </p>
            )}

            {found.status === 'REJECTED' && (
              <p className="text-sm font-medium text-destructive">
                {'দুঃখিত, আপনার আবেদনটি বাতিল করা হয়েছে। বিস্তারিত জানতে বিদ্যালয় অফিসে যোগাযোগ করুন।'}
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
                  {'পূর্ণাঙ্গ আবেদনপত্র'}
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
                {'ভর্তি পরীক্ষার প্রবেশপত্র'}
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
                targetClassName={foundClass?.nameBn ?? ''}
                groupName={foundGroup ? (foundGroup.nameBn) : null}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

