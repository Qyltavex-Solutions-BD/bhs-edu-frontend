'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  MessageSquare,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { SmsStatus } from '@/src/types/enums';
import { EmptyState } from '@/src/components/shared/Feedback';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import {
  useGetAttendanceSmsLogsQuery,
  useRetryAllAttendanceSmsMutation,
  useRetryAttendanceSmsMutation,
  type AttendanceSmsLogItem,
} from '../api/attendance.api';
import { AttendancePagination } from './AttendancePagination';
import { downloadCsv, errorMessage, formatScanDateTime, ToneBadge } from './attendanceShared';

const PAGE_SIZE = 20;

export function AttendanceSmsLogs() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SENT' | 'PENDING' | 'FAILED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'ENTRY' | 'EXIT' | 'ABSENT'>('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [previewItem, setPreviewItem] = useState<AttendanceSmsLogItem | null>(null);

  const { data, isFetching } = useGetAttendanceSmsLogsQuery({
    status: statusFilter,
    smsType: typeFilter,
    date: dateFilter || undefined,
    search: search.trim() || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const [retrySms, { isLoading: retryingOne }] = useRetryAttendanceSmsMutation();
  const [retryAllSms, { isLoading: retryingAll }] = useRetryAllAttendanceSmsMutation();

  const items = data?.items ?? [];
  const stats = data?.stats ?? { total: 0, sent: 0, pending: 0, failed: 0 };

  async function handleRetryOne(id: string) {
    try {
      await retrySms({ id }).unwrap();
      toast.success('SMS সফলভাবে পাঠানো হয়েছে');
    } catch (err) {
      toast.error(errorMessage(err, 'SMS পুনরায় পাঠানো যায়নি'));
    }
  }

  async function handleRetryAll() {
    try {
      const res = await retryAllSms().unwrap();
      toast.success(
        `${res.retried}টি ব্যর্থ SMS পাঠানো হয়েছে`
      );
    } catch (err) {
      toast.error(errorMessage(err, 'ব্যাচ রিট্রাই ব্যর্থ হয়েছে'));
    }
  }

  function exportCsv() {
    downloadCsv(
      `attendance-sms-logs-page-${page}.csv`,
      [
        'শিক্ষার্থী',
        'শ্রেণি',
        'অভিভাবক',
        'মোবাইল',
        'ধরন',
        'অবস্থা',
        'বার্তা',
        'সময়',
      ],
      items.map((l) => [
        l.studentName,
        `${l.className} (${l.sectionName})`,
        l.parentName,
        l.phone,
        l.smsType,
        l.status,
        l.message,
        l.sentAt || l.createdAt,
      ])
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{'মোট SMS'}</span>
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-1 text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{'সফল (Sent)'}</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <div className="mt-1 text-2xl font-bold text-success">{stats.sent}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{'অপেক্ষমাণ'}</span>
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <div className="mt-1 text-2xl font-bold text-warning">{stats.pending}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{'ব্যর্থ (Failed)'}</span>
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
          <div className="mt-1 text-2xl font-bold text-destructive">{stats.failed}</div>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {'অভিভাবক SMS লগ'}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isFetching
                ? 'লোড হচ্ছে...'
                : 'ব্যাকএন্ড ফিল্টার ও প্যাজিনেশন সক্রিয়'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.failed > 0 && (
              <Button
                size="sm"
                variant="destructive"
                disabled={retryingAll}
                onClick={handleRetryAll}
              >
                <RefreshCw className="h-4 w-4" />
                {`সব ব্যর্থ পাঠান (${stats.failed})`}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={items.length === 0}>
              <Download className="h-4 w-4" />
              {'CSV এক্সপোর্ট'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-border/70 px-5 py-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={'নাম, মোবাইল বা বার্তা খুঁজুন...'}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(1);
            }}
          >
            <option value="ALL">{'সব স্ট্যাটাস'}</option>
            <option value="SENT">{'সফল (SENT)'}</option>
            <option value="PENDING">{'অপেক্ষমাণ (PENDING)'}</option>
            <option value="FAILED">{'ব্যর্থ (FAILED)'}</option>
          </Select>
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as typeof typeFilter);
              setPage(1);
            }}
          >
            <option value="ALL">{'সব ধরন'}</option>
            <option value="ABSENT">{'অনুপস্থিত (ABSENT)'}</option>
            <option value="ENTRY">{'প্রবেশ (ENTRY)'}</option>
            <option value="EXIT">{'প্রস্থান (EXIT)'}</option>
          </Select>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {items.length === 0 ? (
          <EmptyState
            title={'কোনো SMS লগ পাওয়া যায়নি'}
            description={'ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead className="border-b border-border/70 bg-muted/40 text-sm font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{'শিক্ষার্থী ও শ্রেণি'}</th>
                  <th className="px-4 py-3">{'অভিভাবক ও মোবাইল'}</th>
                  <th className="px-4 py-3">{'ধরন'}</th>
                  <th className="px-4 py-3">{'স্ট্যাটাস'}</th>
                  <th className="px-4 py-3">{'সময়'}</th>
                  <th className="px-4 py-3 text-right">{'অ্যাকশন'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{log.studentName}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.className} ({log.sectionName}) · {'রোল'} {log.roll}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{log.parentName}</div>
                      <div className="font-mono text-sm text-muted-foreground">{log.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <ToneBadge
                        tone={
                          log.smsType === 'ABSENT'
                            ? 'danger'
                            : log.smsType === 'ENTRY'
                              ? 'success'
                              : 'info'
                        }
                      >
                        {log.smsType}
                      </ToneBadge>
                    </td>
                    <td className="px-4 py-3">
                      <ToneBadge
                        tone={
                          log.status === SmsStatus.SENT
                            ? 'success'
                            : log.status === SmsStatus.FAILED
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {log.status}
                      </ToneBadge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatScanDateTime(log.sentAt || log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => setPreviewItem(log)}>
                          <Eye className="h-3.5 w-3.5" />
                          {'বার্তা'}
                        </Button>
                        {log.status === SmsStatus.FAILED && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={retryingOne}
                            onClick={() => handleRetryOne(log.id)}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            {'পুনরায়'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AttendancePagination meta={data?.meta} onPageChange={setPage} />
      </Card>

      <Modal
        open={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        title={'SMS বার্তা প্রিভিউ'}
        size="md"
      >
        {previewItem && (
          <div className="space-y-3 text-base">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3 text-sm">
              <div>
                <span className="text-muted-foreground">{'প্রাপক:'}</span>{' '}
                <strong>{previewItem.parentName}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">{'মোবাইল:'}</span>{' '}
                <strong className="font-mono">{previewItem.phone}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">{'শিক্ষার্থী:'}</span>{' '}
                <strong>{previewItem.studentName}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">{'স্ট্যাটাস:'}</span>{' '}
                <strong>{previewItem.status}</strong>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 leading-relaxed">
              {previewItem.message}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
