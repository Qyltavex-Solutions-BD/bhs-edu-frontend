'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { DataTable } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Select } from '@/src/components/ui/primitives';
import { StaffStatus, StaffType } from '@/src/types/enums';
import { deptName } from './StaffDepartments';
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

  const rows = db.staff.filter((member) => {
    if (filter === 'teachers' && member.staffType !== StaffType.TEACHER) return false;
    if (filter === 'employees' && member.staffType === StaffType.TEACHER) return false;
    if (departmentId !== 'ALL' && member.departmentId !== departmentId) return false;
    if (status !== 'ALL' && member.status !== status) return false;
    return true;
  }).map((member) => ({ ...member, department: deptName(db, member.departmentId) }));

  const activeStaff = db.staff.filter((s) => s.status === StaffStatus.ACTIVE);
  const activeTeachers = activeStaff.filter((s) => s.staffType === StaffType.TEACHER).length;
  const activeEmployees = activeStaff.filter((s) => s.staffType !== StaffType.TEACHER).length;
  const totalPosts = db.staffStructures.reduce((sum, post) => sum + post.totalPositions, 0);
  const filledPosts = db.staffStructures.reduce((sum, post) => sum + post.filledPositions, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('মোট কর্মরত স্টাফ', 'Total Active Staff')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">{formatNumber(activeStaff.length, (locale === 'bn' ? 'bn' : 'en'))}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('শিক্ষকমণ্ডলী', 'Active Teachers')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary tabular-nums mt-1">{formatNumber(activeTeachers, (locale === 'bn' ? 'bn' : 'en'))}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('কর্মকর্তা ও কর্মচারী', 'Officers & Support')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">{formatNumber(activeEmployees, (locale === 'bn' ? 'bn' : 'en'))}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('অনুমোদিত পদ পূরণ', 'Sanctioned Posts Filled')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-success tabular-nums mt-1">
            {formatNumber(filledPosts, (locale === 'bn' ? 'bn' : 'en'))}
            <span className="text-sm font-semibold text-muted-foreground"> / {formatNumber(totalPosts, (locale === 'bn' ? 'bn' : 'en'))}</span>
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="primary" size="sm" onClick={() => setOpen(true)}>{pick('নতুন স্টাফ', 'Add staff')}</Button>
      </div>
      <DataTable
        data={rows}
        exportFilename="staff.csv"
        toolbarExtra={
          <div className="flex flex-wrap gap-2">
            <Select aria-label={pick('স্টাফের ধরন', 'Staff type')} value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="w-48 h-9">
              <option value="all">{pick('সব ধরনের স্টাফ', 'All staff types')}</option>
              <option value="teachers">{pick('শিক্ষক', 'Teachers')}</option>
              <option value="employees">{pick('কর্মকর্তা ও কর্মচারী', 'Officers and employees')}</option>
            </Select>
            <Select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="w-40 h-9">
              <option value="ALL">{pick('সকল বিভাগ', 'All departments')}</option>
              {departmentOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </Select>
            <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-36 h-9">
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
          { accessorKey: 'department', header: pick('বিভাগ', 'Department') },
          { accessorKey: 'staffType', header: pick('ধরন', 'Type'), cell: ({ row }) => <StatusBadge enumName="StaffType" value={row.original.staffType} /> },
          { accessorKey: 'employmentType', header: pick('নিয়োগ', 'Employment'), cell: ({ row }) => <StatusBadge enumName="EmploymentType" value={row.original.employmentType} /> },
          { accessorKey: 'status', header: pick('অবস্থা', 'Status'), cell: ({ row }) => <StatusBadge enumName="StaffStatus" value={row.original.status} /> },
        ]}
      />
      <StaffFormModal db={db} open={open} onClose={() => setOpen(false)} member={null} defaultType={filter === 'employees' ? StaffType.EMPLOYEE : StaffType.TEACHER} />
    </div>
  );
}
