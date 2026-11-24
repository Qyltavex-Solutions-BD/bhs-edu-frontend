'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { DataTable } from '@/src/components/shared/DataTable';
import { Button, Card } from '@/src/components/ui/primitives';
import { StudentStatus } from '@/src/types/enums';
import { shownPhone } from './ParentFormModal';
import { ParentLinkModal } from './ParentLinkModal';
import type { MockDatabase } from '@/src/mocks/seed';

export function ParentCoverage({ db }: { db: MockDatabase }) {
  const { locale, pick } = useI18n();
  const [onlyGaps, setOnlyGaps] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const allRows = db.students
    .filter((student) => student.status === StudentStatus.ACTIVE)
    .map((student) => {
      const links = db.parentStudents.filter((link) => link.studentId === student.id);
      const primary = links.find((link) => link.isPrimary);
      const primaryParent = primary ? db.parents.find((parent) => parent.id === primary.parentId) : undefined;
      const sms = links.filter((link) => link.isSmsReceiver).length;
      const emergency = links.filter((link) => link.isEmergencyContact).length;
      const gap = !primary || sms === 0 || emergency === 0;
      return {
        id: student.id,
        name: student.nameBn || student.nameEn,
        studentId: student.studentId,
        primaryName: primaryParent ? primaryParent.nameBn || primaryParent.name : '—',
        phone: shownPhone(primaryParent?.phone) || '—',
        sms,
        emergency,
        gap,
      };
    });

  const completeCount = allRows.filter((r) => !r.gap).length;
  const gapCount = allRows.filter((r) => r.gap).length;
  const smsReadyCount = allRows.filter((r) => r.sms > 0).length;
  const rows = allRows.filter((row) => (onlyGaps ? row.gap : true));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('মোট সক্রিয় শিক্ষার্থী', 'Active Students')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">{formatNumber(allRows.length, (locale === 'bn' ? 'bn' : 'en'))}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('সম্পূর্ণ কভারেজ', 'Full Coverage')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-success tabular-nums mt-1">{formatNumber(completeCount, (locale === 'bn' ? 'bn' : 'en'))}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('SMS প্রাপক নির্ধারিত', 'SMS Ready')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary tabular-nums mt-1">{formatNumber(smsReadyCount, (locale === 'bn' ? 'bn' : 'en'))}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('তথ্য ঘাটতি (Gap)', 'Needs Attention')}</p>
          <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums mt-1 ${gapCount > 0 ? 'text-warning' : 'text-success'}`}>
            {formatNumber(gapCount, (locale === 'bn' ? 'bn' : 'en'))}
          </p>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setOnlyGaps((value) => !value)}>
          {onlyGaps ? pick('সকল শিক্ষার্থী দেখুন', 'Show all students') : pick('শুধু ঘাটতি দেখুন', 'Only gaps')}
        </Button>
      </div>
      <DataTable
        data={rows}
        exportFilename="guardian-coverage.csv"
        columns={[
          { accessorKey: 'studentId', header: pick('আইডি', 'ID'), cell: ({ row }) => <span className="font-mono text-sm">{row.original.studentId}</span> },
          {
            accessorKey: 'name',
            header: pick('শিক্ষার্থী', 'Student'),
            cell: ({ row }) => (
              <Link href={`/admin/students/${row.original.id}`} className="font-semibold text-primary hover:underline">{row.original.name}</Link>
            ),
          },
          { accessorKey: 'primaryName', header: pick('প্রাথমিক অভিভাবক', 'Primary Guardian') },
          {
            accessorKey: 'phone',
            header: pick('মোবাইল', 'Phone'),
            cell: ({ row }) => <span className="font-mono text-sm tabular-nums">{row.original.phone}</span>,
          },
          {
            accessorKey: 'emergency',
            header: pick('জরুরি', 'Emergency'),
            cell: ({ row }) => (
              <span className={`tabular-nums font-medium ${row.original.emergency === 0 ? 'text-destructive' : 'text-foreground'}`}>
                {formatNumber(row.original.emergency, (locale === 'bn' ? 'bn' : 'en'))}
              </span>
            ),
          },
          {
            accessorKey: 'sms',
            header: 'SMS',
            cell: ({ row }) => (
              <span className={`tabular-nums font-medium ${row.original.sms === 0 ? 'text-destructive' : 'text-success'}`}>
                {formatNumber(row.original.sms, (locale === 'bn' ? 'bn' : 'en'))}
              </span>
            ),
          },
          {
            id: 'link',
            header: '',
            cell: ({ row }) => (
              <Button size="sm" variant="outline" onClick={() => setStudentId(row.original.id)}>{pick('যোগ করুন', 'Link')}</Button>
            ),
          },
        ]}
      />
      <ParentLinkModal db={db} open={Boolean(studentId)} onClose={() => setStudentId(null)} studentId={studentId ?? undefined} />
    </div>
  );
}
