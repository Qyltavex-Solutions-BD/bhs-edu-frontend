'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useSaveDepartmentMutation, useRemoveDepartmentMutation } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { DataTable } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, FormField, Input, Modal, Select, Textarea } from '@/src/components/ui/primitives';
import { DepartmentStatus, StaffStatus } from '@/src/types/enums';
import type { StaffWorkspace } from '../api/staff.api';
import type { Department } from '@/src/types/entities';

export function deptName(db: StaffWorkspace, id?: string | null) {
  return db.departments.find((item) => item.id === id)?.name ?? '—';
}

function errorMessage(err: unknown, fallback: string) {
  return (err as { message?: string })?.message || fallback;
}

export function StaffDepartments({ db }: { db: StaffWorkspace }) {
  const { pick } = useI18n();
  const [saveDepartment, { isLoading }] = useSaveDepartmentMutation();
  const [removeDepartment, { isLoading: removing }] = useRemoveDepartmentMutation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', status: DepartmentStatus.ACTIVE as string });

  const start = (department: Department | null) => {
    setEditing(department);
    setForm({
      name: department?.name ?? '',
      code: department?.code ?? '',
      description: department?.description ?? '',
      status: department?.status ?? DepartmentStatus.ACTIVE,
    });
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveDepartment({ id: editing?.id, ...form, name: form.name.trim(), code: form.code.trim() || null, status: form.status as DepartmentStatus }).unwrap();
      toast.success(pick('বিভাগ সংরক্ষিত হয়েছে।', 'Department saved.'));
      setOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, pick('সংরক্ষণ হয়নি।', 'Could not save the department.')));
    }
  };

  const rows = db.departments.map((department) => ({
    ...department,
    people: db.staff.filter((member) => member.departmentId === department.id && member.status === StaffStatus.ACTIVE).length,
  }));

  return (
    <>
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => start(null)}>{pick('নতুন বিভাগ', 'New department')}</Button>
      </div>
      <DataTable
        data={rows}
        exportFilename="departments.csv"
        columns={[
          { accessorKey: 'name', header: pick('নাম', 'Name') },
          { accessorKey: 'code', header: pick('কোড', 'Code'), cell: ({ row }) => <span className="font-mono">{row.original.code || '—'}</span> },
          { accessorKey: 'people', header: pick('কর্মরত', 'Active') },
          { accessorKey: 'status', header: pick('অবস্থা', 'Status'), cell: ({ row }) => <StatusBadge enumName="DepartmentStatus" value={row.original.status} /> },
          {
            id: 'edit',
            header: '',
            cell: ({ row }) => (
              <Button size="sm" variant="ghost" onClick={() => start(row.original)}>{pick('সম্পাদনা', 'Edit')}</Button>
            ),
          },
        ]}
      />
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? pick('বিভাগ সম্পাদনা', 'Edit department') : pick('নতুন বিভাগ', 'New department')}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label={pick('নাম', 'Name')} required>
            <Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </FormField>
          <FormField label={pick('কোড', 'Code')}>
            <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
          </FormField>
          <FormField label={pick('বিবরণ', 'Description')}>
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </FormField>
          <FormField label={pick('অবস্থা', 'Status')}>
            <Select value={form.status} onChange={(event) => setForm({ ...form, name: form.name.trim(), code: form.code.trim() || null, status: event.target.value })}>
              <option value={DepartmentStatus.ACTIVE}>{pick('সক্রিয়', 'Active')}</option>
              <option value={DepartmentStatus.INACTIVE}>{pick('বন্ধ', 'Inactive')}</option>
            </Select>
          </FormField>
          <div className="flex justify-between">
            {editing ? (
              <Button
                type="button"
                variant="outline"
                disabled={removing}
                onClick={async () => {
                  try {
                    await removeDepartment({ id: editing.id }).unwrap();
                    toast.success(pick('বিভাগ মুছে ফেলা হয়েছে।', 'Department removed.'));
                    setOpen(false);
                  } catch (err) {
                    toast.error(errorMessage(err, pick('মুছা যায়নি।', 'Could not remove the department.')));
                  }
                }}
              >
                {pick('মুছুন', 'Remove')}
              </Button>
            ) : <span />}
            <Button type="submit" variant="primary" disabled={isLoading}>{pick('সংরক্ষণ', 'Save')}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
