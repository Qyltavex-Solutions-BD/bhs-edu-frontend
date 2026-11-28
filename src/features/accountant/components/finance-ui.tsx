'use client';

import React from 'react';
import { Printer, X } from 'lucide-react';
import { Button, Modal } from '@/src/components/ui/primitives';
import { formatDateLong, formatNumber } from '@/src/lib/formatters';
import { triggerPrint } from '@/src/lib/utils/cn';
import type {
  FeeFrequency,
  FeePaymentMethod,
  FeePaymentTransactionItem,
  FinanceContextResponse,
  InvoiceStatus,
  ReceiptStatus,
  WaiverType,
} from '../api/finance.api';

export function formatTaka(amount: number | string | null | undefined): string {
  const num = Number(amount ?? 0);
  return `৳ ${formatNumber(Number.isFinite(num) ? Math.round(num) : 0, 'bn')}`;
}

export const PAYMENT_METHOD_LABELS: Record<FeePaymentMethod, string> = {
  CASH: 'নগদ (ক্যাশ)',
  BKASH: 'বিকাশ (bKash)',
  NAGAD: 'নগদ (Nagad)',
  ROCKET: 'রকেট (Rocket)',
  BANK: 'ব্যাংক জমা',
};

export const FEE_FREQUENCY_LABELS: Record<FeeFrequency, string> = {
  MONTHLY: 'মাসিক',
  ONE_TIME: 'এককালীন',
  ANNUAL: 'বার্ষিক',
  PER_EXAM: 'প্রতি পরীক্ষা',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  UNPAID: 'বকেয়া',
  PARTIAL: 'আংশিক পরিশোধিত',
  PAID: 'পরিশোধিত',
  WAIVED: 'মওকুফ',
};

export const RECEIPT_STATUS_LABELS: Record<ReceiptStatus, string> = {
  ACTIVE: 'সক্রিয়',
  VOID: 'বাতিল (ভয়েড)',
};

export const WAIVER_TYPE_LABELS: Record<WaiverType, string> = {
  PERCENTAGE: 'শতাংশ (%)',
  FIXED: 'নির্দিষ্ট টাকা (৳)',
};

export const BN_MONTHS_LIST: Array<{ value: string; label: string }> = [
  { value: '01', label: 'জানুয়ারি' },
  { value: '02', label: 'ফেব্রুয়ারি' },
  { value: '03', label: 'মার্চ' },
  { value: '04', label: 'এপ্রিল' },
  { value: '05', label: 'মে' },
  { value: '06', label: 'জুন' },
  { value: '07', label: 'জুলাই' },
  { value: '08', label: 'আগস্ট' },
  { value: '09', label: 'সেপ্টেম্বর' },
  { value: '10', label: 'অক্টোবর' },
  { value: '11', label: 'নভেম্বর' },
  { value: '12', label: 'ডিসেম্বর' },
];

export const MISC_INCOME_CATEGORIES = [
  'ভর্তি ফরম বিক্রয়',
  'সনদ ও প্রশংসাপত্র ফি',
  'বিদ্যালয়ের সম্পদ ভাড়া',
  'অনুদান ও সরকারি সহায়তা',
  'পুরাতন সামগ্রী বিক্রয়',
  'অন্যান্য আয়',
];

export const EXPENSE_CATEGORIES = [
  'বিদ্যুৎ ও ইউটিলিটি বিল',
  'পরীক্ষা ও প্রশ্নপত্র মুদ্রণ',
  'স্টেশনারি ও অফিস সামগ্রী',
  'মেরামত ও রক্ষণাবেক্ষণ',
  'আপ্যায়ন ও অনুষ্ঠান ব্যয়',
  'ইন্টারনেট ও আইসিটি ব্যয়',
  'পরিবহন ও যাতায়াত',
  'অন্যান্য ব্যয়',
];

export function MoneyReceiptModal({
  transaction,
  schoolProfile,
  onClose,
}: {
  transaction: FeePaymentTransactionItem | null;
  schoolProfile?: FinanceContextResponse['schoolProfile'] | null;
  onClose: () => void;
}) {
  if (!transaction) return null;

  const student = transaction.enrollment?.student;
  const cls = transaction.enrollment?.schoolClass;
  const sec = transaction.enrollment?.section;

  return (
    <Modal
      open={Boolean(transaction)}
      onClose={onClose}
      title={`মানি রসিদ — ${transaction.receiptNo}`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 no-print">
          <span className="text-sm text-muted-foreground">
            {transaction.status === 'VOID'
              ? 'এই রসিদটি বাতিল (VOID) করা হয়েছে।'
              : 'রসিদটি প্রিন্ট করে শিক্ষার্থীকে প্রদান করতে পারেন।'}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => triggerPrint()}>
              <Printer className="w-4 h-4" />
              {'রসিদ প্রিন্ট করুন'}
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
              {'বন্ধ করুন'}
            </Button>
          </div>
        </div>

        <div
          data-certificate-print-root="true"
          className="bg-white text-slate-900 border border-slate-300 rounded-lg p-6 space-y-5 print:border-0 print:p-0"
        >
          {/* Header */}
          <div className="text-center border-b-2 border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-slate-900">
              {schoolProfile?.nameBn || schoolProfile?.name || 'ভোজেশ্বর উচ্চ বিদ্যালয়'}
            </h2>
            {schoolProfile?.address && (
              <p className="text-sm text-slate-600 mt-0.5">{schoolProfile.address}</p>
            )}
            <div className="inline-block mt-2 px-4 py-1 bg-slate-900 text-white text-sm font-semibold rounded">
              {'টাকা জমার রসিদ (MONEY RECEIPT)'}
            </div>
          </div>

          {transaction.status === 'VOID' && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded text-sm font-semibold text-center">
              {`বাতিলকৃত রসিদ (VOID) — কারণ: ${transaction.voidReason || 'উল্লেখ নেই'}`}
            </div>
          )}

          {/* Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-slate-50 p-3.5 rounded border border-slate-200">
            <div className="space-y-1">
              <p>
                <span className="font-semibold">{'রসিদ নম্বর:'}</span>{' '}
                <span className="font-mono font-bold">{transaction.receiptNo}</span>
              </p>
              <p>
                <span className="font-semibold">{'শিক্ষার্থীর নাম:'}</span>{' '}
                {student?.nameBn || student?.nameEn || '—'}
              </p>
              <p>
                <span className="font-semibold">{'শিক্ষার্থী আইডি:'}</span>{' '}
                <span className="font-mono">{student?.studentId ?? '—'}</span>
              </p>
            </div>
            <div className="space-y-1">
              <p>
                <span className="font-semibold">{'তারিখ:'}</span>{' '}
                {formatDateLong(transaction.paidAt, 'bn')}
              </p>
              <p>
                <span className="font-semibold">{'শ্রেণি ও শাখা:'}</span>{' '}
                {cls?.nameBn ?? cls?.name ?? '—'}
                {sec ? ` (${sec.nameBn ?? sec.name})` : ''} · {'রোল:'}{' '}
                {transaction.enrollment?.roll ?? '—'}
              </p>
              <p>
                <span className="font-semibold">{'পেমেন্ট মাধ্যম:'}</span>{' '}
                {PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
                {transaction.referenceNo ? ` (${transaction.referenceNo})` : ''}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800">
                  <th className="border border-slate-300 px-3 py-2 text-left">{'ক্রমিক'}</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">{'ফি বিবরণ'}</th>
                  <th className="border border-slate-300 px-3 py-2 text-right">{'নির্ধারিত'}</th>
                  <th className="border border-slate-300 px-3 py-2 text-right">{'ছাড়'}</th>
                  <th className="border border-slate-300 px-3 py-2 text-right">{'পরিশোধিত'}</th>
                </tr>
              </thead>
              <tbody>
                {(transaction.items ?? []).map((item, idx) => (
                  <tr key={item.id}>
                    <td className="border border-slate-300 px-3 py-2 tabular-nums">
                      {formatNumber(idx + 1, 'bn')}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 font-medium">
                      {item.title}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">
                      {formatTaka(item.amount)}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">
                      {formatTaka(item.discount)}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-right font-semibold tabular-nums">
                      {formatTaka(item.netPaid)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td colSpan={2} className="border border-slate-300 px-3 py-2 text-right">
                    {'সর্বমোট:'}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">
                    {formatTaka(transaction.totalGross)}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">
                    {formatTaka(transaction.totalDiscount)}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right text-emerald-700 tabular-nums">
                    {formatTaka(transaction.totalPaid)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {transaction.remarks && (
            <p className="text-sm text-slate-700">
              <span className="font-semibold">{'মন্তব্য:'}</span> {transaction.remarks}
            </p>
          )}

          {/* Signatures */}
          <div className="pt-8 flex items-end justify-between text-sm text-slate-700">
            <div>
              <p className="border-t border-slate-400 pt-1 px-4">
                {'অভিভাবক / শিক্ষার্থীর স্বাক্ষর'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium text-slate-900 mb-1">
                {transaction.collectedBy?.name ?? 'অ্যাকাউন্ট্যান্ট'}
              </p>
              <p className="border-t border-slate-400 pt-1 px-4">
                {'আদায়কারীর স্বাক্ষর ও সিল'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
