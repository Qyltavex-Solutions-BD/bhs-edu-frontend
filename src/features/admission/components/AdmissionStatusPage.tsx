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

