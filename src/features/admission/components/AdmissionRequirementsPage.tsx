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

export function AdmissionRequirementsPage() {
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
        title={'ভর্তির যোগ্যতা ও প্রয়োজনীয় কাগজপত্র'}
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
            <Button variant="primary">{'অনলাইন আবেদন শুরু করুন'}</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

