'use client';

// BACKEND-PENDING — Section 12-B Future-Ready Module Previews
// Hidden behind ui.enableFutureModules (default OFF) until corresponding backend tables & endpoints are finalized.
import React, { useState } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  Bus,
  CalendarClock,
  CreditCard,
  FileText,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useGetBootstrapQuery } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { LoadingSkeleton, PageHeader } from '@/src/components/shared/Feedback';
import { Button, Card, SegmentedTabs } from '@/src/components/ui/primitives';
import { formatBdt, formatDateShort, formatNumber } from '@/src/lib/formatters';

export function FutureModulesPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [tab, setTab] = useState<
    'fees' | 'homework' | 'leave' | 'library' | 'ops' | 'messaging' | 'certificates' | 'health'
  >('fees');

  if (isLoading || !db) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick(
          'ভবিষ্যৎ-প্রস্তুত মডিউল (Backend-Pending প্রিভিউ)',
          'Future-Ready Modules (Backend-Pending Preview)'
        )}
        description={pick(
          'ভবিষ্যৎ সম্প্রসারণের জন্য প্রস্তুতকৃত মডিউল ইন্টারফেস — ব্যাকএন্ড API সংযুক্ত হলে তাৎক্ষণিক সক্রিয় হবে',
          'Proposed contract interfaces ready for future backend rollout (feature-flagged off by default)'
        )}
      />

      <div className="p-3.5 rounded-[var(--radius)] border border-accent/40 bg-accent/10 text-sm flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p>
          {pick(
            'দ্রষ্টব্য: এই মডিউলগুলো প্রস্তাবিত টাইপ কন্ট্রাক্ট (BACKEND-PENDING) দ্বারা পরিচালিত। এগুলো মূল ৬৪-টেবিল ডাটাবেস স্কিমার বাইরে ভবিষ্যৎ আপগ্রেডের জন্য সংরক্ষিত।',
            'Note: These modules run on proposed frontend contracts (BACKEND-PENDING) outside the core 64-table DBML schema and are hidden by default.'
          )}
        </p>
      </div>

      <SegmentedTabs
        value={tab}
        onChange={(v) => setTab(v as typeof tab)}
        items={[
          { value: 'fees', label: pick('বেতন ও পেমেন্ট', 'Fees & Payments') },
          { value: 'homework', label: pick('হোমওয়ার্ক ডায়েরি', 'Homework Diary') },
          { value: 'leave', label: pick('ছুটির আবেদন', 'Leave Requests') },
          { value: 'library', label: pick('বই লেনদেন', 'Library Loans') },
          { value: 'ops', label: pick('পরিবহন ও ইনভেন্টরি', 'Transport & Ops') },
          { value: 'messaging', label: pick('বার্তালাপ', 'Messaging') },
          { value: 'certificates', label: pick('সনদপত্র', 'Certificates') },
          { value: 'health', label: pick('সিস্টেম হেলথ', 'System Health') },
        ]}
      />

      {tab === 'fees' && (
        <Card className="p-5">
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            {pick(
              'ইনভয়েস ও মোবাইল ব্যাংকিং (bKash / Nagad / Rocket)',
              'Invoices & Mobile Banking (bKash / Nagad / Rocket)'
            )}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-sm text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2 text-left">{pick('ইনভয়েস নং', 'Invoice')}</th>
                  <th className="py-2 text-left">{pick('শিক্ষার্থী', 'Student')}</th>
                  <th className="py-2 text-left">{pick('মাস', 'Month')}</th>
                  <th className="py-2 text-right">{pick('টাকা', 'Amount')}</th>
                  <th className="py-2 text-left">{pick('মাধ্যম', 'Gateway')}</th>
                  <th className="py-2 text-right">{pick('অ্যাকশন', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {db.feeInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2.5 font-mono text-sm">{inv.invoiceNo}</td>
                    <td className="py-2.5">
                      <p className="font-medium">{inv.studentName}</p>
                      <p className="text-xs text-muted-foreground">{inv.className}</p>
                    </td>
                    <td className="py-2.5">{inv.monthLabel}</td>
                    <td className="py-2.5 text-right font-semibold">{formatBdt(inv.amountBdt, locale)}</td>
                    <td className="py-2.5 text-sm">
                      {inv.paymentGateway ?? '—'} ({inv.status})
                    </td>
                    <td className="py-2.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toast.info(
                            pick(
                              'bKash/Nagad গেটওয়ে ব্যাকএন্ড সংযুক্তির অপেক্ষায়',
                              'Payment gateway awaiting backend integration'
                            )
                          )
                        }
                      >
                        {inv.status === 'PAID' ? pick('রসিদ', 'Receipt') : pick('পেমেন্ট প্রিভিউ', 'Pay Preview')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'homework' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {db.homeworks.map((hw) => (
            <Card key={hw.id} className="p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-primary">
                  {hw.subjectName} · {hw.teacherName}
                </span>
                <span className="tabular-nums">
                  {pick('জমার শেষ তারিখ:', 'Due:')} {formatDateShort(hw.dueDate, locale)}
                </span>
              </div>
              <h3 className="text-base font-bold">{hw.title}</h3>
              <p className="text-sm text-muted-foreground">{hw.description}</p>
            </Card>
          ))}
        </div>
      )}

      {tab === 'leave' && (
        <div className="space-y-3">
          {db.leaveApplications.map((lv) => (
            <Card key={lv.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-base font-semibold flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-primary" />
                  {lv.applicantName} ({lv.applicantType})
                </p>
                <p className="text-sm text-muted-foreground mt-1 tabular-nums">
                  {formatDateShort(lv.fromDate, locale)} – {formatDateShort(lv.toDate, locale)} · {lv.reason}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded border border-border">
                {lv.status}
              </span>
            </Card>
          ))}
        </div>
      )}

      {tab === 'library' && (
        <div className="space-y-3">
          {db.libraryLoans.map((ln) => (
            <Card key={ln.id} className="p-4 flex items-center justify-between gap-4 text-sm">
              <div>
                <p className="text-base font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  {ln.bookTitle}
                </p>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {ln.borrowerName} ({ln.borrowerRole}) · {pick('ইস্যু:', 'Issued:')}{' '}
                  {formatDateShort(ln.issuedDate, locale)} · {pick('ফেরত তারিখ:', 'Due:')}{' '}
                  {formatDateShort(ln.dueDate, locale)}
                </p>
              </div>
              <span className="text-sm font-semibold">
                {ln.status} · {pick('জরিমানা:', 'Fine:')} {formatBdt(ln.fineBdt, locale)}
              </span>
            </Card>
          ))}
        </div>
      )}

      {tab === 'ops' && (
        <Card className="p-6 space-y-2">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Bus className="w-5 h-5 text-primary" />
            {pick('পরিবহন, হোস্টেল ও ল্যাব ইনভেন্টরি', 'Transport, Hostel & Lab Inventory')}
          </h3>
          <p className="text-base text-muted-foreground">
            {pick(
              'নড়িয়া–ভোজেশ্বর–মশুরা রুট পরিকল্পনা, বিজ্ঞান ল্যাব ও কম্পিউটার ল্যাব সম্পদ তালিকা এবং ভেন্ডর ব্যবস্থাপনা ব্যাকএন্ড API সংযুক্তির জন্য প্রস্তুত।',
              'Noria–Bhojeshwar–Mashura transport routes, ICT/Science lab inventory register, and asset tracking ready for backend binding.'
            )}
          </p>
        </Card>
      )}

      {tab === 'messaging' && (
        <Card className="p-6 space-y-2">
          <h3 className="text-base font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            {pick('অভিভাবক–শিক্ষক বার্তালাপ', 'Parent–Teacher Direct Messaging')}
          </h3>
          <p className="text-base text-muted-foreground">
            {pick(
              'নিরাপদ থ্রেড-ভিত্তিক অভিভাবক ও শ্রেণি শিক্ষক যোগাযোগ চ্যানেল (ব্যাকএন্ড WebSocket/REST অপেক্ষমাণ)।',
              'Structured parent–class teacher conversation threads (awaiting backend messaging API).'
            )}
          </p>
        </Card>
      )}

      {tab === 'certificates' && (
        <Card className="p-6 space-y-3">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            {pick('প্রত্যয়নপত্র, চরিত্র সনদ ও প্রশংসাপত্র জেনারেটর', 'Bonafide, Character & Testimonial Generator')}
          </h3>
          <p className="text-base text-muted-foreground">
            {pick(
              'টিসি (Transfer Certificate) ইতিমধ্যেই শিক্ষার্থী মডিউলে সক্রিয় রয়েছে। অতিরিক্ত প্রত্যয়নপত্র টেমপ্লেট এখান থেকে যুক্ত করা যাবে।',
              'Transfer Certificate (TC) is already live under Students. Additional certificate templates are queued here.'
            )}
          </p>
        </Card>
      )}

      {tab === 'health' && (
        <Card className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-base">
          <div className="p-4 rounded border border-border">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-success" />
              {pick('মক অ্যাডাপ্টার অবস্থা', 'Mock Adapter State')}
            </p>
            <p className="font-bold mt-1">{pick('সক্রিয় (ইন-মেমরি)', 'Active (In-Memory)')}</p>
          </div>
          <div className="p-4 rounded border border-border">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              {pick('ডাটাবেস স্কিমা কভারেজ', 'Schema Coverage')}
            </p>
            <p className="font-bold mt-1 tabular-nums">
              {formatNumber(64, locale)} {pick('টেবিল', 'Tables')} / {formatNumber(36, locale)}{' '}
              {pick('ইনাম', 'Enums')}
            </p>
          </div>
          <div className="p-4 rounded border border-border">
            <p className="text-sm text-muted-foreground">SMS Gateway</p>
            <p className="font-bold mt-1">{pick('সিমুলেটেড (রেডি)', 'Simulated (Ready)')}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
