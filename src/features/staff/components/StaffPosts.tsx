'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useSaveStaffStructureMutation, useArchiveStaffStructureMutation } from '../api/staff.api';
import { useI18n } from '@/src/lib/i18n';
import { StaffTable, useStaffTable } from './StaffTable';
import { useGetSanctionedPostPageQuery } from '../api/staff.api';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, FormField, Input, Modal, Select } from '@/src/components/ui/primitives';
import { StaffType } from '@/src/types/enums';
import type { StaffWorkspace } from '../api/staff.api';
import type { StaffStructure } from '@/src/types/entities';


function errorMessage(err: unknown, fallback: string) {
  return (err as { message?: string })?.message || fallback;
}

export function StaffPosts({ db }: { db: StaffWorkspace }) {
  const { pick } = useI18n();
  const [savePost, { isLoading }] = useSaveStaffStructureMutation();
  const [toggleArchive, { isLoading: archiving }] = useArchiveStaffStructureMutation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffStructure | null>(null);
  const [form, setForm] = useState({ designation: '', staffType: StaffType.TEACHER as string, departmentId: '', totalPositions: '1' });

  const [staffType, setStaffType] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [vacancy, setVacancy] = useState('');
  const table = useStaffTable({
    staffType: staffType || undefined,
    departmentId: departmentId || undefined,
    hasVacancy: vacancy ? vacancy === 'open' : undefined,
  });
  const query = useGetSanctionedPostPageQuery(table.params);

  const start = (structure: StaffStructure | null) => {
    setEditing(structure);
    setForm({
      designation: structure?.designation ?? '',
      staffType: structure?.staffType ?? StaffType.TEACHER,
      departmentId: structure?.departmentId ?? '',
      totalPositions: String(structure?.totalPositions ?? 1),
    });
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await savePost({
        id: editing?.id,
        designation: form.designation.trim(),
        staffType: form.staffType as StaffType,
        departmentId: form.departmentId || null,
        totalPositions: Number(form.totalPositions),
      }).unwrap();
      toast.success(pick('পদ সংরক্ষিত হয়েছে।', 'Post saved.'));
      setOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, pick('সংরক্ষণ হয়নি।', 'Could not save the post.')));
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => start(null)}>{pick('নতুন পদ', 'New post')}</Button>
      </div>
      <StaffTable
        table={table}
        query={query}
        list="posts"
        searchPlaceholder={pick('পদবি দিয়ে খুঁজুন', 'Search by designation')}
        toolbarExtra={
          <div className="flex flex-wrap gap-2">
            <Select aria-label={pick('পদের ধরন', 'Post type')} value={staffType} onChange={(event) => { setStaffType(event.target.value); table.setPage(1); }}>
              <option value="">{pick('সকল ধরন', 'All types')}</option>
              <option value={StaffType.TEACHER}>{pick('শিক্ষক', 'Teacher')}</option>
              <option value={StaffType.OFFICER}>{pick('কর্মকর্তা', 'Officer')}</option>
              <option value={StaffType.EMPLOYEE}>{pick('কর্মচারী', 'Employee')}</option>
            </Select>
            <Select aria-label={pick('বিভাগ', 'Department')} value={departmentId} onChange={(event) => { setDepartmentId(event.target.value); table.setPage(1); }}>
              <option value="">{pick('সকল বিভাগ', 'All departments')}</option>
              {db.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </Select>
            <Select aria-label={pick('পদের শূন্যতা', 'Post availability')} value={vacancy} onChange={(event) => { setVacancy(event.target.value); table.setPage(1); }}>
              <option value="">{pick('সকল পদ', 'All posts')}</option>
              <option value="open">{pick('শূন্য পদ আছে', 'Has vacancies')}</option>
              <option value="full">{pick('সব পদ পূরণ হয়েছে', 'Fully staffed')}</option>
            </Select>
          </div>
        }
        exportFilename="posts.csv"
        columns={[
          { accessorKey: 'designation', header: pick('পদবি', 'Designation') },
          { accessorKey: 'department', header: pick('বিভাগ', 'Department'), cell: ({ row }) => row.original.department?.name ?? '—' },
          { accessorKey: 'staffType', header: pick('ধরন', 'Type'), cell: ({ row }) => <StatusBadge enumName="StaffType" value={row.original.staffType} /> },
          { accessorKey: 'filledPositions', header: pick('পূরণ', 'Filled') },
          { accessorKey: 'totalPositions', header: pick('আসন', 'Posts') },
          {
            id: 'edit',
            header: '',
            cell: ({ row }) => (
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => start(row.original)}>{pick('সম্পাদনা', 'Edit')}</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={archiving}
                  onClick={async () => {
                    try {
                      await toggleArchive(row.original.id).unwrap();
                      toast.success(pick('পদ আর্কাইভ হয়েছে।', 'Post archived.'));
                    } catch (err) {
                      toast.error(errorMessage(err, pick('আর্কাইভ হয়নি।', 'Could not archive the post.')));
                    }
                  }}
                >
                  {pick('আর্কাইভ', 'Archive')}
                </Button>
              </div>
            ),
          },
        ]}
      />
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? pick('পদ সম্পাদনা', 'Edit post') : pick('নতুন পদ', 'New post')}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label={pick('পদবি', 'Designation')} required>
            <Input required placeholder={pick('যেমন সহকারী শিক্ষক (গণিত)', 'e.g. Assistant Teacher (Math)')} value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} />
          </FormField>
          <FormField label={pick('ধরন', 'Type')}>
            <Select value={form.staffType} onChange={(event) => setForm({ ...form, staffType: event.target.value })}>
              <option value={StaffType.TEACHER}>{pick('শিক্ষক', 'Teacher')}</option>
              <option value={StaffType.OFFICER}>{pick('কর্মকর্তা', 'Officer')}</option>
              <option value={StaffType.EMPLOYEE}>{pick('কর্মচারী', 'Employee')}</option>
            </Select>
          </FormField>
          <FormField label={pick('বিভাগ', 'Department')}>
            <Select value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })}>
              <option value="">{pick('সাধারণ', 'General')}</option>
              {db.departments.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </Select>
          </FormField>
          <FormField label={pick('আসন সংখ্যা', 'Number of posts')} required>
            <Input type="number" min={1} placeholder={pick('অনুমোদিত পদের সংখ্যা লিখুন', 'Enter the approved number of posts')} value={form.totalPositions} onChange={(event) => setForm({ ...form, totalPositions: event.target.value })} />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={isLoading}>{pick('সংরক্ষণ', 'Save')}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
