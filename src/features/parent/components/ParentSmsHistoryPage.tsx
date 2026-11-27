'use client';

import React from 'react';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import { useGetAuthProfileQuery } from '@/src/features/auth/api/auth.api';
import { useGetParentSmsLogsQuery } from '@/src/features/attendance/api/attendance.api';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Card } from '@/src/components/ui/primitives';
import { formatDateLong, formatNumber } from '@/src/lib/formatters';
import { SmsStatus } from '@/src/types/enums';

export function ParentSmsHistoryPage() {
  const { data: meData, isLoading: loadingMe } = useGetAuthProfileQuery();
  const { data: smsData, isLoading: loadingSms } = useGetParentSmsLogsQuery({
    page: 1,
    limit: 50,
  });

  if (loadingMe || loadingSms) {
    return <LoadingSkeleton />;
  }

  const phone = smsData?.phone ?? meData?.parent?.phone ?? meData?.phone ?? '—';
  const logs = smsData?.items ?? [];
  const sentCount = logs.filter((l) => l.status === SmsStatus.SENT).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={'হাজিরা SMS ইতিহাস'}
        description={`আপনার নিবন্ধিত নম্বর (${phone}) এ প্রেরিত স্বয়ংক্রিয় SMS তালিকা`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label={'মোট SMS বার্তা'}
          value={formatNumber(smsData?.total ?? logs.length, 'bn')}
          icon={<MessageSquare className="w-5 h-5" />}
        />
        <StatCard
          label={'সফলভাবে প্রেরিত'}
          value={formatNumber(sentCount, 'bn')}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent="success"
        />
      </div>

      {logs.length === 0 ? (
        <EmptyState
          title={'কোনো SMS ইতিহাস পাওয়া যায়নি'}
          description={'আপনার সন্তানের অনুপস্থিতি বা প্রবেশ/প্রস্থানের কোনো SMS পাঠানো হলে এখানে দেখতে পাবেন।'}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left whitespace-nowrap">{'তারিখ ও সময়'}</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">{'শিক্ষার্থী'}</th>
                  <th className="px-4 py-3 text-left">{'বার্তা'}</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">{'অবস্থা'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDateLong(log.sentAt ?? log.createdAt, 'bn')}
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {log.studentName}
                    </td>
                    <td className="px-4 py-3 leading-relaxed">{log.message}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge enumName="SmsStatus" value={log.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
