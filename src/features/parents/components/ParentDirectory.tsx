'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { DataTable } from '@/src/components/shared/DataTable';
import { Button, Card } from '@/src/components/ui/primitives';
import { StudentStatus } from '@/src/types/enums';
import { shownPhone, ParentFormModal } from './ParentFormModal';
import type { MockDatabase } from '@/src/mocks/seed';

export function ParentDirectory({ db, createOpen }: { db: MockDatabase; createOpen: boolean }) {
  const { locale, pick } = useI18n();
  const [open, setOpen] = useState(createOpen);
  const rows = db.parents.map((parent) => {
    const links = db.parentStudents.filter((link) => link.parentId === parent.id);
    const children = links
      .map((link) => db.students.find((student) => student.id === link.studentId))
      .filter(Boolean)
      .map((student) => student?.nameBn || student?.nameEn)
      .join(', ');
    return {
      ...parent,
      phone: shownPhone(parent.phone) || '—',
      children: children || '—',
      childCount: links.length,
      smsCount: links.filter((link) => link.isSmsReceiver).length,
    };
  });

  const activeStudents = db.students.filter((s) => s.status === StudentStatus.ACTIVE);
  const linkedStudentIds = new Set(db.parentStudents.map((l) => l.studentId));
  const smsReceiverLinks = db.parentStudents.filter((l) => l.isSmsReceiver).length;
  const coverageGapCount = activeStudents.filter((s) => {
    const links = db.parentStudents.filter((l) => l.studentId === s.id);
    return !links.some((l) => l.isPrimary) || !links.some((l) => l.isSmsReceiver) || !links.some((l) => l.isEmergencyContact);
  }).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('মোট নিবন্ধিত অভিভাবক', 'Registered Guardians')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">{formatNumber(db.parents.length, (locale === 'bn' ? 'bn' : 'en'))}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('সংযুক্ত সক্রিয় শিক্ষার্থী', 'Linked Active Students')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary tabular-nums mt-1">
            {formatNumber(activeStudents.filter((s) => linkedStudentIds.has(s.id)).length, (locale === 'bn' ? 'bn' : 'en'))}
            <span className="text-sm font-semibold text-muted-foreground"> / {formatNumber(activeStudents.length, (locale === 'bn' ? 'bn' : 'en'))}</span>
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('সক্রিয় SMS প্রাপক সংযোগ', 'Active SMS Links')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-success tabular-nums mt-1">{formatNumber(smsReceiverLinks, (locale === 'bn' ? 'bn' : 'en'))}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('অসম্পূর্ণ তথ্য', 'Incomplete Records')}</p>
          <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums mt-1 ${coverageGapCount > 0 ? 'text-warning' : 'text-success'}`}>
            {formatNumber(coverageGapCount, (locale === 'bn' ? 'bn' : 'en'))}
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link href="/admin/parents/coverage">
          <Button variant="outline" size="sm">
            {pick('প্রাথমিক ও SMS কভারেজ', 'Primary & SMS Coverage')}
          </Button>
        </Link>
        <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
          {pick('নতুন অভিভাবক', 'New guardian')}
        </Button>
      </div>
      <DataTable
        data={rows}
        exportFilename="guardians.csv"
        columns={[
          {
            accessorKey: 'name',
            header: pick('নাম', 'Name'),
            cell: ({ row }) => (
              <Link href={`/admin/parents/${row.original.id}`} className="font-semibold text-primary hover:underline">
                {row.original.nameBn || row.original.name}
                <span className="block text-xs font-normal text-muted-foreground">{row.original.name}</span>
              </Link>
            ),
          },
          {
            accessorKey: 'phone',
            header: pick('মোবাইল', 'Phone'),
            cell: ({ row }) => <span className="font-mono text-sm tabular-nums">{row.original.phone}</span>,
          },
          { accessorKey: 'occupation', header: pick('পেশা', 'Occupation'), cell: ({ row }) => row.original.occupation || '—' },
          { accessorKey: 'children', header: pick('সন্তান', 'Children') },
          {
            accessorKey: 'smsCount',
            header: pick('SMS সংযোগ', 'SMS Links'),
            cell: ({ row }) => <span className="tabular-nums font-medium">{formatNumber(row.original.smsCount, (locale === 'bn' ? 'bn' : 'en'))}</span>,
          },
        ]}
      />
      <ParentFormModal open={open} onClose={() => setOpen(false)} parent={null} />
    </div>
  );
}
