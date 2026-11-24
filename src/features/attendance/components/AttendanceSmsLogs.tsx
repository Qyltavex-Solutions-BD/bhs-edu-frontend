'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { MessageSquare, RefreshCw, RotateCw } from 'lucide-react';
import {
  useRetryAllAttendanceSmsMutation,
  useRetryAttendanceSmsMutation,
} from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils/cn';
import { DataTable, type DataColumn } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import { AttendanceSmsType, SmsStatus } from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import { errorMessage, formatClockTime } from './attendanceShared';

interface EnrichedSmsRow {
  id: string;
  createdAt: string;
  dateKey: string;
  sentAt: string | null;
  smsType: AttendanceSmsType;
  phone: string;
  message: string;
  status: SmsStatus;
  parentName: string;
  studentId: string | null;
  studentName: string;
}

export function AttendanceSmsLogs({ db }: { db: MockDatabase }) {
  const { locale, pick } = useI18n();
  const [retrySingle, { isLoading: retryingOne }] = useRetryAttendanceSmsMutation();
  const [retryAll, { isLoading: retryingAll }] = useRetryAllAttendanceSmsMutation();

  const [statusFilter, setStatusFilter] = useState<'ALL' | SmsStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | AttendanceSmsType>('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [previewSms, setPreviewSms] = useState<EnrichedSmsRow | null>(null);

  const enrichedRows = useMemo<EnrichedSmsRow[]>(() => {
    const attById = new Map(db.attendances.map((a) => [a.id, a]));
    const enrById = new Map(db.enrollments.map((e) => [e.id, e]));
    const studentById = new Map(db.students.map((s) => [s.id, s]));
    const parentById = new Map(db.parents.map((p) => [p.id, p]));

    return db.attendanceSmsLogs.map((log) => {
      const att = attById.get(log.attendanceId);
      const enr = att ? enrById.get(att.studentEnrollmentId) : undefined;
      const stu = enr ? studentById.get(enr.studentId) : undefined;
      const parent = parentById.get(log.parentId);
      return {
        id: log.id,
        createdAt: log.createdAt,
        dateKey: (log.createdAt || '').slice(0, 10),
        sentAt: log.sentAt ?? null,
        smsType: log.smsType,
        phone: log.phone,
        message: log.message,
        status: log.status,
        parentName:
          locale === 'bn'
            ? parent?.nameBn || parent?.name || '—'
            : parent?.name || parent?.nameBn || '—',
        studentId: stu?.id ?? null,
        studentName:
          locale === 'bn'
            ? stu?.nameBn || stu?.nameEn || '—'
            : stu?.nameEn || stu?.nameBn || '—',
      };
    });
  }, [db.attendanceSmsLogs, db.attendances, db.enrollments, db.students, db.parents, locale]);

  const metrics = useMemo(() => {
    const total = enrichedRows.length;
    const sent = enrichedRows.filter((r) => r.status === SmsStatus.SENT).length;
    const failed = enrichedRows.filter((r) => r.status === SmsStatus.FAILED).length;
    const absent = enrichedRows.filter((r) => r.smsType === AttendanceSmsType.ABSENT).length;
    const gate = total - absent;
    const deliveryRate = total > 0 ? Math.round((sent / total) * 100) : 100;
    return { total, sent, failed, absent, gate, deliveryRate };
  }, [enrichedRows]);

  const filteredRows = useMemo(() => {
    return enrichedRows.filter((row) => {
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && row.smsType !== typeFilter) return false;
      if (dateFilter && row.dateKey !== dateFilter) return false;
      return true;
    });
  }, [enrichedRows, statusFilter, typeFilter, dateFilter]);

  const handleRetryOne = async (id: string) => {
    try {
      await retrySingle({ id }).unwrap();
      toast.success(pick('এসএমএস পুনরায় পাঠানো হয়েছে।', 'SMS resent successfully.'));
    } catch (err) {
      toast.error(errorMessage(err, pick('পুনরায় পাঠানো যায়নি।', 'Failed to retry SMS.')));
    }
  };

  const handleRetryAll = async () => {
    try {
      const res = await retryAll().unwrap();
      toast.success(
        pick(
          `ব্যর্থ ${formatNumber(res.retried, 'bn')} টি এসএমএস সফলভাবে পুনরায় পাঠানো হয়েছে।`,
          `Retried ${res.retried} failed SMS messages successfully.`
        )
      );
    } catch (err) {
      toast.error(errorMessage(err, pick('ব্যর্থ এসএমএস পাঠানো যায়নি।', 'Batch retry failed.')));
    }
  };

  const typeLabel = (t: AttendanceSmsType) => {
    if (t === AttendanceSmsType.ABSENT) return pick('অনুপস্থিতি', 'Absent');
    if (t === AttendanceSmsType.ENTRY) return pick('গেট প্রবেশ', 'Gate Entry');
    return pick('গেট প্রস্থান', 'Gate Exit');
  };

  const columns: DataColumn<EnrichedSmsRow>[] = [
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: pick('তারিখ ও সময়', 'Date & Time'),
      cell: ({ row }) => (
        <div className="tabular-nums text-xs">
          <p className="font-medium text-foreground">
            {formatDateShort(row.original.createdAt, locale)}
          </p>
          <p className="text-muted-foreground font-mono">
            {formatClockTime(row.original.createdAt)}
          </p>
        </div>
      ),
    },
    {
      id: 'recipient',
      accessorKey: 'parentName',
      header: pick('অভিভাবক ও শিক্ষার্থী', 'Guardian & Student'),
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">{row.original.parentName}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">{row.original.phone}</span>
            {row.original.studentId && (
              <>
                <span>·</span>
                <Link
                  href={`/admin/students/${row.original.studentId}#attendance`}
                  className="text-primary hover:underline truncate max-w-[160px]"
                >
                  {row.original.studentName}
                </Link>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'smsType',
      accessorKey: 'smsType',
      header: pick('ধরন', 'Type'),
      cell: ({ row }) => (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-[var(--radius)] text-xs font-medium',
            row.original.smsType === AttendanceSmsType.ABSENT
              ? 'bg-destructive/10 text-destructive'
              : row.original.smsType === AttendanceSmsType.ENTRY
                ? 'bg-success/10 text-success'
                : 'bg-info/10 text-info'
          )}
        >
          {typeLabel(row.original.smsType)}
        </span>
      ),
    },
    {
      id: 'message',
      accessorKey: 'message',
      header: pick('বার্তা', 'Message'),
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setPreviewSms(row.original)}
          className="text-left max-w-md text-xs text-muted-foreground hover:text-foreground line-clamp-2 cursor-pointer"
          title={pick('সম্পূর্ণ বার্তা দেখুন', 'Click to view full message')}
        >
          {row.original.message}
        </button>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: pick('অবস্থা', 'Status'),
      cell: ({ row }) => <StatusBadge enumName="SmsStatus" value={row.original.status} />,
    },
    {
      id: 'actions',
      header: pick('কার্যক্রম', 'Action'),
      cell: ({ row }) =>
        row.original.status === SmsStatus.FAILED ? (
          <Button
            variant="outline"
            size="sm"
            disabled={retryingOne}
            onClick={() => handleRetryOne(row.original.id)}
          >
            <RotateCw className="w-3.5 h-3.5" />
            {pick('পুনরায় পাঠান', 'Retry')}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground tabular-nums">
            {row.original.sentAt ? formatClockTime(row.original.sentAt) : '—'}
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('মোট প্রেরিত লগ', 'Total SMS Logged')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(metrics.total, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {pick('হাজিরা ও গেট নোটিফিকেশন', 'Attendance & gate notifications')}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('সফলভাবে প্রেরিত', 'Delivered / Sent')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-success">
            {formatNumber(metrics.sent, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {pick(
              `সফলতার হার ${formatNumber(metrics.deliveryRate, 'bn')}%`,
              `Delivery rate ${metrics.deliveryRate}%`
            )}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('ব্যর্থ (পুনরায় পাঠান)', 'Failed (Action Needed)')}
          </p>
          <p
            className={cn(
              'mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums',
              metrics.failed > 0 ? 'text-destructive' : 'text-foreground'
            )}
          >
            {formatNumber(metrics.failed, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {metrics.failed > 0
              ? pick('নিচে থেকে এক ক্লিকে পুনরায় পাঠান', 'Use Retry All Failed below')
              : pick('সব বার্তা সফলভাবে পৌঁছেছে', 'All messages delivered')}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('ধরনভিত্তিক বিভাজন', 'Message Breakdown')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(metrics.absent, locale)}{' '}
            <span className="text-sm font-semibold text-muted-foreground">/</span>{' '}
            {formatNumber(metrics.gate, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {pick('অনুপস্থিতি বনাম গেট প্রবেশ/প্রস্থান', 'Absent alerts vs Gate scans')}
          </p>
        </Card>
      </div>

      {/* SMS Log Table */}
      <DataTable
        data={filteredRows}
        columns={columns}
        searchPlaceholder={pick('অভিভাবক, মোবাইল নম্বর, শিক্ষার্থী বা বার্তা খুঁজুন...', 'Search guardian, phone, student, or message...')}
        exportFilename="attendance-sms-logs.csv"
        pageSize={15}
        emptyTitle={pick('কোনো এসএমএস লগ পাওয়া যায়নি', 'No attendance SMS logs found')}
        toolbarExtra={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | SmsStatus)}
              className="w-32 h-9"
            >
              <option value="ALL">{pick('সব অবস্থা', 'All status')}</option>
              <option value={SmsStatus.SENT}>{pick('প্রেরিত', 'Sent')}</option>
              <option value={SmsStatus.FAILED}>{pick('ব্যর্থ', 'Failed')}</option>
              <option value={SmsStatus.PENDING}>{pick('অপেক্ষমাণ', 'Pending')}</option>
            </Select>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'ALL' | AttendanceSmsType)}
              className="w-36 h-9"
            >
              <option value="ALL">{pick('সব ধরন', 'All types')}</option>
              <option value={AttendanceSmsType.ABSENT}>{pick('অনুপস্থিতি', 'Absent')}</option>
              <option value={AttendanceSmsType.ENTRY}>{pick('গেট প্রবেশ', 'Gate Entry')}</option>
              <option value={AttendanceSmsType.EXIT}>{pick('গেট প্রস্থান', 'Gate Exit')}</option>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-36 h-9 tabular-nums"
              aria-label={pick('তারিখ ফিল্টার', 'Filter date')}
            />
            {dateFilter && (
              <Button variant="ghost" size="sm" onClick={() => setDateFilter('')}>
                {pick('মুছুন', 'Clear')}
              </Button>
            )}
            {metrics.failed > 0 && (
              <Button
                variant="primary"
                size="sm"
                disabled={retryingAll}
                onClick={handleRetryAll}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {pick(
                  `ব্যর্থ সব পুনরায় পাঠান (${formatNumber(metrics.failed, 'bn')})`,
                  `Retry all failed (${metrics.failed})`
                )}
              </Button>
            )}
          </div>
        }
      />

      {/* Full Message Preview Modal */}
      <Modal
        open={Boolean(previewSms)}
        onClose={() => setPreviewSms(null)}
        title={pick('এসএমএস বার্তার বিস্তারিত', 'SMS Message Details')}
        maxWidth="max-w-lg"
      >
        {previewSms && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 rounded-[var(--radius)] border border-border bg-surface-muted/40 p-3 text-xs">
              <div>
                <span className="text-muted-foreground block">{pick('অভিভাবক', 'Guardian')}</span>
                <span className="font-semibold text-foreground">{previewSms.parentName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{pick('মোবাইল নম্বর', 'Phone')}</span>
                <span className="font-mono font-semibold text-foreground">{previewSms.phone}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{pick('শিক্ষার্থী', 'Student')}</span>
                <span className="font-medium text-foreground">{previewSms.studentName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{pick('অবস্থা ও ধরন', 'Status & Type')}</span>
                <span className="font-medium text-foreground">
                  {typeLabel(previewSms.smsType)} · {previewSms.status}
                </span>
              </div>
            </div>

            <div className="rounded-[var(--radius)] border border-border bg-background p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <MessageSquare className="w-3.5 h-3.5" />
                {pick('প্রেরিত বার্তা', 'Message Body')}
              </div>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {previewSms.message}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              {previewSms.status === SmsStatus.FAILED && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={retryingOne}
                  onClick={async () => {
                    await handleRetryOne(previewSms.id);
                    setPreviewSms(null);
                  }}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  {pick('পুনরায় পাঠান', 'Retry now')}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setPreviewSms(null)}>
                {pick('বন্ধ করুন', 'Close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
