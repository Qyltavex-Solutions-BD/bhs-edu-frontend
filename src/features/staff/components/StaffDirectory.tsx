'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Printer } from 'lucide-react';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { triggerPrint } from '@/src/lib/utils/cn';
import { DataTable } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { PrintableIdCardSheet } from '@/src/components/print/PrintDocuments';
import { Button, Card, Modal, Select } from '@/src/components/ui/primitives';
import { StaffStatus, StaffType } from '@/src/types/enums';
import { deptName } from './StaffDepartments';
import { StaffFormModal } from './StaffFormModal';
import type { MockDatabase } from '@/src/mocks/seed';

const ADMIN_DEPARTMENT_IDS = new Set(['dept-adm', 'dept-acc', 'dept-lib', 'dept-sec', 'dept-lab']);

export function StaffDirectory({
  db,
  kind,
  createOpen,
}: {
  db: MockDatabase;
  kind: 'all' | 'teachers' | 'employees';
  createOpen: boolean;
}) {
  const { locale, pick } = useI18n();
  const [open, setOpen] = useState(createOpen);
  const [printOpen, setPrintOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  const departmentOptions = useMemo(() => {
    if (kind === 'teachers') {
      return db.departments.filter((d) => !ADMIN_DEPARTMENT_IDS.has(d.id) || d.id === 'dept-adm');
    }
    if (kind === 'employees') {
      return db.departments.filter((d) => ADMIN_DEPARTMENT_IDS.has(d.id));
    }
    return db.departments;
  }, [db.departments, kind]);

  useEffect(() => {
    if (departmentId !== 'ALL' && !departmentOptions.some((d) => d.id === departmentId)) {
      setDepartmentId('ALL');
    }
  }, [departmentOptions, departmentId]);

  const rows = db.staff.filter((member) => {
    if (kind === 'teachers' && member.staffType !== StaffType.TEACHER) return false;
    if (kind === 'employees' && member.staffType === StaffType.TEACHER) return false;
    if (departmentId !== 'ALL' && member.departmentId !== departmentId) return false;
    if (status !== 'ALL' && member.status !== status) return false;
    return true;
  }).map((member) => ({ ...member, department: deptName(db, member.departmentId) }));

  const activeStaff = db.staff.filter((s) => s.status === StaffStatus.ACTIVE);
  const activeTeachers = activeStaff.filter((s) => s.staffType === StaffType.TEACHER).length;
  const activeEmployees = activeStaff.filter((s) => s.staffType !== StaffType.TEACHER).length;
  const totalPosts = db.staffStructures.filter((p) => !p.isDeleted).reduce((sum, p) => sum + p.totalPositions, 0);

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
            {formatNumber(activeStaff.length, (locale === 'bn' ? 'bn' : 'en'))}
            <span className="text-sm font-semibold text-muted-foreground"> / {formatNumber(totalPosts, (locale === 'bn' ? 'bn' : 'en'))}</span>
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Link href="/about/teachers" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4" /> {pick('পাবলিক শিক্ষক তালিকা', 'Public Teachers')}
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)} disabled={!rows.length}>
          <Printer className="w-4 h-4" /> {pick('পরিচয়পত্র', 'ID cards')}
        </Button>
        <Button variant="primary" size="sm" onClick={() => setOpen(true)}>{pick('নতুন স্টাফ', 'Add staff')}</Button>
      </div>
      <DataTable
        data={rows}
        exportFilename="staff.csv"
        toolbarExtra={
          <div className="flex gap-2">
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
      <StaffFormModal db={db} open={open} onClose={() => setOpen(false)} member={null} defaultType={kind === 'employees' ? StaffType.EMPLOYEE : StaffType.TEACHER} />
      <Modal open={printOpen} onClose={() => setPrintOpen(false)} title={pick('পরিচয়পত্র', 'ID cards')} maxWidth="max-w-5xl">
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={triggerPrint}><Printer className="w-4 h-4" /> {pick('প্রিন্ট', 'Print')}</Button>
          </div>
          <PrintableIdCardSheet
            school={db.schoolProfile}
            holderType="STAFF"
            cards={rows.slice(0, 12).map((member) => ({
              code: member.employeeId ?? member.id,
              name: member.nameBn || member.name,
              subline: member.designation,
              secondaryLine: member.qualification ?? undefined,
              phone: member.phone,
              validUntil: db.academicYears.find((year) => year.isActive)?.name ?? '',
            }))}
          />
        </div>
      </Modal>
    </div>
  );
}
