'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { StaffTable, useStaffTable } from './StaffTable';
import { useGetStaffPageQuery, useGetStaffStatisticsQuery } from '../api/staff.api';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Select } from '@/src/components/ui/primitives';
import { StaffStatus, StaffType } from '@/src/types/enums';
import { StaffFormModal } from './StaffFormModal';
import type { StaffWorkspace } from '../api/staff.api';


export function StaffDirectory({
  db,
  kind,
  createOpen,
}: {
  db: StaffWorkspace;
  kind: 'all' | 'teachers' | 'employees';
  createOpen: boolean;
}) {
  const { locale, pick } = useI18n();
  const [open, setOpen] = useState(createOpen);
  const [departmentId, setDepartmentId] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  const [filter, setFilter] = useState(kind);
  const departmentOptions = db.departments;

  const table = useStaffTable({
    staffGroup: filter === 'all' ? undefined : filter,
    departmentId: departmentId === 'ALL' ? undefined : departmentId,
    status: status === 'ALL' ? undefined : status,
  });
  const query = useGetStaffPageQuery(table.params);
  const { data: stats, isError: statsError, refetch: retryStats } = useGetStaffStatisticsQuery();

  return (
    <div className="space-y-5">
      {statsError && <Button variant="outline" onClick={retryStats}>{pick('স্টাফ পরিসংখ্যান আবার লোড করুন', 'Retry staff statistics')}</Button>}
      {stats && !statsError && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('মোট কর্মরত স্টাফ', 'Total Active Staff')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">{formatNumber(stats.activeStaff, (locale === 'bn' ? 'bn' : 'en'))}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('শিক্ষকমণ্ডলী', 'Active Teachers')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary tabular-nums mt-1">{formatNumber(stats.activeTeachers, (locale === 'bn' ? 'bn' : 'en'))}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('কর্মকর্তা ও কর্মচারী', 'Officers & Support')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">{formatNumber(stats.activeNonTeachers, (locale === 'bn' ? 'bn' : 'en'))}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('অনুমোদিত পদ পূরণ', 'Sanctioned Posts Filled')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-success tabular-nums mt-1">
            {formatNumber(stats.posts.filled, (locale === 'bn' ? 'bn' : 'en'))}
            <span className="text-sm font-semibold text-muted-foreground"> / {formatNumber(stats.posts.total, (locale === 'bn' ? 'bn' : 'en'))}</span>
          </p>
        </Card>
      </div>}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="primary" size="sm" onClick={() => setOpen(true)}>{pick('নতুন স্টাফ', 'Add staff')}</Button>
      </div>
      <StaffTable
        table={table}
        query={query}
        list="staff"
        searchPlaceholder={pick('নাম, স্টাফ আইডি বা পদবি দিয়ে খুঁজুন', 'Search by name, staff ID or designation')}
        exportFilename="staff.csv"
        toolbarExtra={
          <div className="flex flex-wrap gap-2">
            <Select aria-label={pick('স্টাফের ধরন', 'Staff type')} value={filter} onChange={(event) => { setFilter(event.target.value as typeof filter); table.setPage(1); }} className="w-48 h-9">
              <option value="all">{pick('সব ধরনের স্টাফ', 'All staff types')}</option>
              <option value="teachers">{pick('শিক্ষক', 'Teachers')}</option>
              <option value="employees">{pick('কর্মকর্তা ও কর্মচারী', 'Officers and employees')}</option>
            </Select>
            <Select value={departmentId} onChange={(event) => { setDepartmentId(event.target.value); table.setPage(1); }} className="w-40 h-9">
              <option value="ALL">{pick('সকল বিভাগ', 'All departments')}</option>
              {departmentOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </Select>
            <Select value={status} onChange={(event) => { setStatus(event.target.value); table.setPage(1); }} className="w-36 h-9">
              <option value="ALL">{pick('সকল অবস্থা', 'All statuses')}</option>
              {Object.values(StaffStatus).map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </Select>
          </div>
        }
        columns={[
          { accessorKey: 'employeeId', header: pick('আইডি', 'ID'), cell: ({ row }) => <span className="font-mono text-sm">{row.original.employeeId}</span> },
          {
            accessorKey: 'name',
            header: pick('নাম', 'Name'),
            cell: ({ row }) => (
              <Link href={`/admin/staff/${row.original.id}`} className="font-semibold text-primary hover:underline">
                {row.original.nameBn || row.original.name}
                <span className="block text-xs font-normal text-muted-foreground">{row.original.designation}</span>
              </Link>
            ),
          },
          { accessorKey: 'department', header: pick('বিভাগ', 'Department'), cell: ({ row }) => row.original.department?.name ?? '—' },
          { accessorKey: 'staffType', header: pick('ধরন', 'Type'), cell: ({ row }) => <StatusBadge enumName="StaffType" value={row.original.staffType} /> },
          { accessorKey: 'employmentType', header: pick('নিয়োগ', 'Employment'), cell: ({ row }) => <StatusBadge enumName="EmploymentType" value={row.original.employmentType} /> },
          { accessorKey: 'status', header: pick('অবস্থা', 'Status'), cell: ({ row }) => <StatusBadge enumName="StaffStatus" value={row.original.status} /> },
        ]}
      />
      <StaffFormModal db={db} open={open} onClose={() => setOpen(false)} member={null} defaultType={filter === 'employees' ? StaffType.EMPLOYEE : StaffType.TEACHER} />
    </div>
  );
}
