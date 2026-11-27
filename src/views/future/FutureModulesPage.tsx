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
import { LoadingSkeleton, PageHeader } from '@/src/components/shared/Feedback';
import { Button, Card, SegmentedTabs } from '@/src/components/ui/primitives';
import { formatBdt, formatDateShort, formatNumber } from '@/src/lib/formatters';

export function FutureModulesPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [tab, setTab] = useState<
    'fees' | 'homework' | 'leave' | 'library' | 'ops' | 'messaging' | 'certificates' | 'health'
  >('fees');

  if (isLoading || !db) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={'ভবিষ্যৎ-প্রস্তুত মডিউল (Backend-Pending প্রিভিউ)'}
        description={'ভবিষ্যৎ সম্প্রসারণের জন্য প্রস্তুতকৃত মডিউল ইন্টারফেস — ব্যাকএন্ড API সংযুক্ত হলে তাৎক্ষণিক সক্রিয় হবে'}
      />

      <div className="p-3.5 rounded-[var(--radius)] border border-accent/40 bg-accent/10 text-sm flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p>
          {'দ্রষ্টব্য: এই মডিউলগুলো প্রস্তাবিত টাইপ কন্ট্রাক্ট (BACKEND-PENDING) দ্বারা পরিচালিত। এগুলো মূল ৬৪-টেবিল ডাটাবেস স্কিমার বাইরে ভবিষ্যৎ আপগ্রেডের জন্য সংরক্ষিত।'}
        </p>
      </div>

      <SegmentedTabs
        value={tab}
        onChange={(v) => setTab(v as typeof tab)}
        items={[
          { value: 'fees', label: 'বেতন ও পেমেন্ট' },
          { value: 'homework', label: 'হোমওয়ার্ক ডায়েরি' },
          { value: 'leave', label: 'ছুটির আবেদন' },
          { value: 'library', label: 'বই লেনদেন' },
          { value: 'ops', label: 'পরিবহন ও ইনভেন্টরি' },
          { value: 'messaging', label: 'বার্তালাপ' },
          { value: 'certificates', label: 'সনদপত্র' },
          { value: 'health', label: 'সিস্টেম হেলথ' },
        ]}
      />

      {tab === 'fees' && (
        <Card className="p-5">
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            {'ইনভয়েস ও মোবাইল ব্যাংকিং (bKash / Nagad / Rocket)'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="text-sm text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2 text-left">{'ইনভয়েস নং'}</th>
                  <th className="py-2 text-left">{'শিক্ষার্থী'}</th>
                  <th className="py-2 text-left">{'মাস'}</th>
                  <th className="py-2 text-right">{'টাকা'}</th>
                  <th className="py-2 text-left">{'মাধ্যম'}</th>
                  <th className="py-2 text-right">{'অ্যাকশন'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {db.feeInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2.5 font-mono text-sm">{inv.invoiceNo}</td>
                    <td className="py-2.5">
                      <p className="font-medium">{inv.studentName}</p>
                      <p className="text-sm text-muted-foreground">{inv.className}</p>
                    </td>
                    <td className="py-2.5">{inv.monthLabel}</td>
                    <td className="py-2.5 text-right font-semibold">{formatBdt(inv.amountBdt, 'bn')}</td>
                    <td className="py-2.5 text-sm">
                      {inv.paymentGateway ?? '—'} ({inv.status})
                    </td>
                    <td className="py-2.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toast.info(
                            'bKash/Nagad গেটওয়ে ব্যাকএন্ড সংযুক্তির অপেক্ষায়'
                          )
                        }
                      >
                        {inv.status === 'PAID' ? 'রসিদ' : 'পেমেন্ট প্রিভিউ'}
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
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="font-semibold text-primary">
                  {hw.subjectName} · {hw.teacherName}
                </span>
                <span className="tabular-nums">
                  {'জমার শেষ তারিখ:'} {formatDateShort(hw.dueDate, 'bn')}
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
                  {formatDateShort(lv.fromDate, 'bn')} – {formatDateShort(lv.toDate, 'bn')} · {lv.reason}
                </p>
              </div>
              <span className="text-sm font-semibold px-2.5 py-1 rounded border border-border">
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
                  {ln.borrowerName} ({ln.borrowerRole}) · {'ইস্যু:'}{' '}
                  {formatDateShort(ln.issuedDate, 'bn')} · {'ফেরত তারিখ:'}{' '}
                  {formatDateShort(ln.dueDate, 'bn')}
                </p>
              </div>
              <span className="text-sm font-semibold">
                {ln.status} · {'জরিমানা:'} {formatBdt(ln.fineBdt, 'bn')}
              </span>
            </Card>
          ))}
        </div>
      )}

      {tab === 'ops' && (
        <Card className="p-6 space-y-2">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Bus className="w-5 h-5 text-primary" />
            {'পরিবহন, হোস্টেল ও ল্যাব ইনভেন্টরি'}
          </h3>
          <p className="text-base text-muted-foreground">
            {'নড়িয়া–ভোজেশ্বর–মশুরা রুট পরিকল্পনা, বিজ্ঞান ল্যাব ও কম্পিউটার ল্যাব সম্পদ তালিকা এবং ভেন্ডর ব্যবস্থাপনা ব্যাকএন্ড API সংযুক্তির জন্য প্রস্তুত।'}
          </p>
        </Card>
      )}

      {tab === 'messaging' && (
        <Card className="p-6 space-y-2">
          <h3 className="text-base font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            {'অভিভাবক–শিক্ষক বার্তালাপ'}
          </h3>
          <p className="text-base text-muted-foreground">
            {'নিরাপদ থ্রেড-ভিত্তিক অভিভাবক ও শ্রেণি শিক্ষক যোগাযোগ চ্যানেল (ব্যাকএন্ড WebSocket/REST অপেক্ষমাণ)।'}
          </p>
        </Card>
      )}

      {tab === 'certificates' && (
        <Card className="p-6 space-y-3">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            {'প্রত্যয়নপত্র, চরিত্র সনদ ও প্রশংসাপত্র জেনারেটর'}
          </h3>
          <p className="text-base text-muted-foreground">
            {'টিসি (Transfer Certificate) ইতিমধ্যেই শিক্ষার্থী মডিউলে সক্রিয় রয়েছে। অতিরিক্ত প্রত্যয়নপত্র টেমপ্লেট এখান থেকে যুক্ত করা যাবে।'}
          </p>
        </Card>
      )}

      {tab === 'health' && (
        <Card className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-base">
          <div className="p-4 rounded border border-border">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-success" />
              {'মক অ্যাডাপ্টার অবস্থা'}
            </p>
            <p className="font-bold mt-1">{'সক্রিয় (ইন-মেমরি)'}</p>
          </div>
          <div className="p-4 rounded border border-border">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              {'ডাটাবেস স্কিমা কভারেজ'}
            </p>
            <p className="font-bold mt-1 tabular-nums">
              {formatNumber(64, 'bn')} {'টেবিল'} / {formatNumber(36, 'bn')}{' '}
              {'ইনাম'}
            </p>
          </div>
          <div className="p-4 rounded border border-border">
            <p className="text-sm text-muted-foreground">SMS Gateway</p>
            <p className="font-bold mt-1">{'সিমুলেটেড (রেডি)'}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
