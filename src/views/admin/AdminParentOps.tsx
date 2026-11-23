'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from '@/src/lib/navigation';
import { toast } from 'sonner';
import {
  useGetBootstrapQuery,
  useLinkParentMutation,
  useRemoveParentMutation,
  useSaveParentMutation,
  useUnlinkParentMutation,
  useUpdateParentLinkMutation,
  useUpdateParentMutation,
} from '@/src/store/api';
import { ParentsShell } from '@/src/views/admin/ParentsShell';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { DataTable } from '@/src/components/shared/DataTable';
import { Button, Card, FormField, Input, Modal, Select, Textarea } from '@/src/components/ui/primitives';
import { RelationshipType, StudentStatus } from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import type { Parent, ParentStudent } from '@/src/types/entities';

function errorMessage(err: unknown, fallback: string) {
  return (err as { message?: string })?.message || fallback;
}

function shownPhone(phone?: string | null) {
  if (!phone || phone.startsWith('unused-')) return '';
  return phone;
}

const emptyParent = {
  name: '',
  nameBn: '',
  phone: '',
  email: '',
  nid: '',
  occupation: '',
  monthlyIncome: '',
  address: '',
};

function relationLabel(value: string, pick: (bn: string, en: string) => string) {
  if (value === RelationshipType.FATHER) return pick('পিতা', 'Father');
  if (value === RelationshipType.MOTHER) return pick('মাতা', 'Mother');
  if (value === RelationshipType.GUARDIAN) return pick('অভিভাবক', 'Guardian');
  return pick('অন্যান্য', 'Other');
}

export function AdminParentsPage({
  section = 'directory',
  createOpen = false,
}: {
  section?: 'directory' | 'coverage' | 'profile';
  createOpen?: boolean;
}) {
  const { id } = useParams<{ id?: string }>();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  if (isLoading || !db) return <LoadingSkeleton />;

  const copy = {
    directory: {
      title: pick('অভিভাবক ডিরেক্টরি', 'Guardian directory'),
      description: pick('একজন অভিভাবকের একাধিক সন্তান থাকতে পারে। নাম খুলে সংযোগ দেখা যায়।', 'One guardian can have several children. Open a name to see the links.'),
    },
    coverage: {
      title: pick('প্রাথমিক অভিভাবক ও SMS', 'Primary guardian and SMS'),
      description: pick('সক্রিয় শিক্ষার্থীর একজন প্রাথমিক অভিভাবক, একজন জরুরি যোগাযোগ এবং একজন SMS প্রাপক থাকতে হবে।', 'Every active student needs one primary guardian, one emergency contact, and one SMS receiver.'),
    },
    profile: {
      title: pick('অভিভাবকের প্রোফাইল', 'Guardian profile'),
      description: pick('যোগাযোগের তথ্য এবং কোন সন্তানের সঙ্গে কী সম্পর্ক।', 'Contact details and how this person is related to each child.'),
    },
  }[section];

  return (
    <ParentsShell title={copy.title} description={copy.description}>
      {section === 'directory' && <Directory db={db} createOpen={createOpen} />}
      {section === 'coverage' && <Coverage db={db} />}
      {section === 'profile' && <Profile db={db} parentId={id ?? ''} />}
    </ParentsShell>
  );
}

function Directory({ db, createOpen }: { db: MockDatabase; createOpen: boolean }) {
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
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">{formatNumber(db.parents.length, locale)}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('সংযুক্ত সক্রিয় শিক্ষার্থী', 'Linked Active Students')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary tabular-nums mt-1">
            {formatNumber(activeStudents.filter((s) => linkedStudentIds.has(s.id)).length, locale)}
            <span className="text-sm font-semibold text-muted-foreground"> / {formatNumber(activeStudents.length, locale)}</span>
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('সক্রিয় SMS প্রাপক সংযোগ', 'Active SMS Links')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-success tabular-nums mt-1">{formatNumber(smsReceiverLinks, locale)}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('অসম্পূর্ণ তথ্য', 'Incomplete Records')}</p>
          <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums mt-1 ${coverageGapCount > 0 ? 'text-warning' : 'text-success'}`}>
            {formatNumber(coverageGapCount, locale)}
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
            cell: ({ row }) => <span className="tabular-nums font-medium">{formatNumber(row.original.smsCount, locale)}</span>,
          },
        ]}
      />
      <ParentForm db={db} open={open} onClose={() => setOpen(false)} parent={null} />
    </div>
  );
}

function ParentForm({
  open,
  onClose,
  parent,
}: {
  db: MockDatabase;
  open: boolean;
  onClose: () => void;
  parent: Parent | null;
}) {
  const { pick } = useI18n();
  const [saveParent, { isLoading: creating }] = useSaveParentMutation();
  const [updateParent, { isLoading: updating }] = useUpdateParentMutation();
  const [form, setForm] = useState(emptyParent);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  if (open && (parent?.id ?? 'new') !== loadedId) {
    setLoadedId(parent?.id ?? 'new');
    setForm(
      parent
        ? {
            name: parent.name,
            nameBn: parent.nameBn ?? '',
            phone: shownPhone(parent.phone),
            email: parent.email ?? '',
            nid: parent.nid ?? '',
            occupation: parent.occupation ?? '',
            monthlyIncome: parent.monthlyIncome != null ? String(parent.monthlyIncome) : '',
            address: parent.address ?? '',
          }
        : emptyParent
    );
  }
  if (!open && loadedId) setLoadedId(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = {
      ...form,
      monthlyIncome: form.monthlyIncome ? Number(form.monthlyIncome) : null,
    };
    try {
      if (parent) await updateParent({ id: parent.id, ...body }).unwrap();
      else await saveParent(body).unwrap();
      toast.success(pick('অভিভাবক সংরক্ষিত হয়েছে।', 'Guardian saved.'));
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, pick('সংরক্ষণ হয়নি।', 'Could not save the guardian.')));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={parent ? pick('প্রোফাইল সম্পাদনা', 'Edit profile') : pick('নতুন অভিভাবক', 'New guardian')}>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label={pick('ইংরেজি নাম', 'Name in English')} required>
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </FormField>
        <FormField label={pick('বাংলা নাম', 'Name in Bangla')}>
          <Input value={form.nameBn} onChange={(event) => setForm({ ...form, nameBn: event.target.value })} />
        </FormField>
        <FormField label={pick('মোবাইল', 'Phone')} required>
          <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </FormField>
        <FormField label={pick('ইমেইল', 'Email')}>
          <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </FormField>
        <FormField label={pick('এনআইডি', 'NID')}>
          <Input value={form.nid} onChange={(event) => setForm({ ...form, nid: event.target.value })} />
        </FormField>
        <FormField label={pick('পেশা', 'Occupation')}>
          <Input value={form.occupation} onChange={(event) => setForm({ ...form, occupation: event.target.value })} />
        </FormField>
        <FormField label={pick('মাসিক আয়', 'Monthly income')}>
          <Input type="number" min={0} value={form.monthlyIncome} onChange={(event) => setForm({ ...form, monthlyIncome: event.target.value })} />
        </FormField>
        <FormField label={pick('ঠিকানা', 'Address')}>
          <Textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
        </FormField>
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" variant="primary" disabled={creating || updating}>
            {pick('সংরক্ষণ', 'Save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Profile({ db, parentId }: { db: MockDatabase; parentId: string }) {
  const { pick } = useI18n();
  const parent = db.parents.find((item) => item.id === parentId);
  const [editOpen, setEditOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ParentStudent | null>(null);
  const [removeParent, { isLoading: removing }] = useRemoveParentMutation();
  if (!parent) return <p className="text-sm text-muted-foreground">{pick('অভিভাবক পাওয়া যায়নি।', 'Guardian was not found.')}</p>;

  const links = db.parentStudents.filter((link) => link.parentId === parent.id);

  const remove = async () => {
    try {
      await removeParent({ id: parent.id }).unwrap();
      toast.success(pick('প্রোফাইল মুছে ফেলা হয়েছে।', 'Profile removed.'));
    } catch (err) {
      toast.error(errorMessage(err, pick('মুছা যায়নি।', 'Could not remove the profile.')));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{parent.nameBn || parent.name}</h2>
          <p className="text-sm text-muted-foreground">{parent.name}{shownPhone(parent.phone) ? ` · ${shownPhone(parent.phone)}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>{pick('সম্পাদনা', 'Edit')}</Button>
          <Button size="sm" variant="primary" onClick={() => setLinkOpen(true)}>{pick('সন্তান যোগ', 'Link a child')}</Button>
          <Button size="sm" variant="ghost" disabled={removing || links.length > 0} onClick={remove}>{pick('মুছুন', 'Remove')}</Button>
          <Link href="/admin/parents"><Button size="sm" variant="ghost">{pick('তালিকায়', 'Back to list')}</Button></Link>
        </div>
      </div>
      <Card className="p-4 text-sm space-y-1">
        <p>{pick('এনআইডি', 'NID')}: {parent.nid || '—'}</p>
        <p>{pick('ইমেইল', 'Email')}: {parent.email || '—'}</p>
        <p>{pick('পেশা', 'Occupation')}: {parent.occupation || '—'}</p>
        <p>{pick('ঠিকানা', 'Address')}: {parent.address || '—'}</p>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="p-3 text-left">{pick('সন্তান', 'Child')}</th>
              <th className="p-3 text-left">{pick('সম্পর্ক', 'Relationship')}</th>
              <th className="p-3 text-left">{pick('প্রাথমিক', 'Primary')}</th>
              <th className="p-3 text-left">{pick('জরুরি', 'Emergency')}</th>
              <th className="p-3 text-left">SMS</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {links.map((link) => {
              const student = db.students.find((item) => item.id === link.studentId);
              return (
                <tr key={link.id}>
                  <td className="p-3">
                    <Link href={`/admin/students/${link.studentId}`} className="font-medium text-primary hover:underline">
                      {student?.nameBn || student?.nameEn}
                    </Link>
                    <span className="block text-xs text-muted-foreground font-mono">{student?.studentId}</span>
                  </td>
                  <td className="p-3">{relationLabel(link.relationship, pick)}</td>
                  <td className="p-3">{link.isPrimary ? pick('হ্যাঁ', 'Yes') : '—'}</td>
                  <td className="p-3">{link.isEmergencyContact ? pick('হ্যাঁ', 'Yes') : '—'}</td>
                  <td className="p-3">{link.isSmsReceiver ? pick('হ্যাঁ', 'Yes') : '—'}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditingLink(link)}>{pick('সম্পাদনা', 'Edit')}</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!links.length && <p className="p-4 text-sm text-muted-foreground">{pick('এখনো কোনো সন্তান যুক্ত নেই।', 'No child is linked yet.')}</p>}
      </Card>
      <ParentForm db={db} open={editOpen} onClose={() => setEditOpen(false)} parent={parent} />
      <LinkModal db={db} open={linkOpen} onClose={() => setLinkOpen(false)} parentId={parent.id} />
      <LinkEditModal link={editingLink} onClose={() => setEditingLink(null)} />
    </div>
  );
}

function LinkModal({
  db,
  open,
  onClose,
  parentId,
  studentId,
}: {
  db: MockDatabase;
  open: boolean;
  onClose: () => void;
  parentId?: string;
  studentId?: string;
}) {
  const { pick } = useI18n();
  const [linkParent, { isLoading }] = useLinkParentMutation();
  const [form, setForm] = useState({
    parentId: parentId ?? '',
    studentId: studentId ?? '',
    relationship: RelationshipType.FATHER as string,
    isPrimary: true,
    isEmergencyContact: true,
    isSmsReceiver: true,
  });
  const [loaded, setLoaded] = useState('');
  const key = open ? `${parentId ?? ''}:${studentId ?? ''}` : '';
  if (!open && loaded) setLoaded('');
  if (key && key !== loaded) {
    setLoaded(key);
    setForm({
      parentId: parentId ?? '',
      studentId: studentId ?? '',
      relationship: RelationshipType.FATHER,
      isPrimary: true,
      isEmergencyContact: true,
      isSmsReceiver: true,
    });
  }

  const linkedStudentIds = new Set(db.parentStudents.filter((link) => link.parentId === (parentId || form.parentId)).map((link) => link.studentId));
  const linkedParentIds = new Set(db.parentStudents.filter((link) => link.studentId === (studentId || form.studentId)).map((link) => link.parentId));
  const students = db.students.filter((student) => student.status === StudentStatus.ACTIVE && !linkedStudentIds.has(student.id));
  const parents = db.parents.filter((parent) => !linkedParentIds.has(parent.id));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await linkParent({
        parentId: parentId || form.parentId,
        studentId: studentId || form.studentId,
        relationship: form.relationship as RelationshipType,
        isPrimary: form.isPrimary,
        isEmergencyContact: form.isEmergencyContact,
        isSmsReceiver: form.isSmsReceiver,
      }).unwrap();
      toast.success(pick('সন্তান যুক্ত হয়েছে।', 'Child linked.'));
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, pick('যোগ হয়নি।', 'Could not link.')));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={pick('সন্তান যোগ', 'Link a child')}>
      <form onSubmit={submit} className="space-y-4">
        {!parentId && (
          <FormField label={pick('অভিভাবক', 'Guardian')} required>
            <Select value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })}>
              <option value="">{pick('বেছে নিন', 'Choose')}</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>{parent.nameBn || parent.name}{shownPhone(parent.phone) ? ` · ${shownPhone(parent.phone)}` : ''}</option>
              ))}
            </Select>
          </FormField>
        )}
        {!studentId && (
          <FormField label={pick('শিক্ষার্থী', 'Student')} required>
            <Select value={form.studentId} onChange={(event) => setForm({ ...form, studentId: event.target.value })}>
              <option value="">{pick('বেছে নিন', 'Choose')}</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.nameBn || student.nameEn} ({student.studentId})</option>
              ))}
            </Select>
          </FormField>
        )}
        <FormField label={pick('সম্পর্ক', 'Relationship')} required>
          <Select value={form.relationship} onChange={(event) => setForm({ ...form, relationship: event.target.value })}>
            <option value={RelationshipType.FATHER}>{pick('পিতা', 'Father')}</option>
            <option value={RelationshipType.MOTHER}>{pick('মাতা', 'Mother')}</option>
            <option value={RelationshipType.GUARDIAN}>{pick('অভিভাবক', 'Guardian')}</option>
            <option value={RelationshipType.OTHER}>{pick('অন্যান্য', 'Other')}</option>
          </Select>
        </FormField>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isPrimary} onChange={(event) => setForm({ ...form, isPrimary: event.target.checked })} />
          {pick('প্রাথমিক অভিভাবক', 'Primary guardian')}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isEmergencyContact} onChange={(event) => setForm({ ...form, isEmergencyContact: event.target.checked })} />
          {pick('জরুরি যোগাযোগ', 'Emergency contact')}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isSmsReceiver} onChange={(event) => setForm({ ...form, isSmsReceiver: event.target.checked })} />
          {pick('SMS পাবেন', 'Receives SMS')}
        </label>
        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={isLoading}>{pick('যোগ করুন', 'Link')}</Button>
        </div>
      </form>
    </Modal>
  );
}

function LinkEditModal({ link, onClose }: { link: ParentStudent | null; onClose: () => void }) {
  const { pick } = useI18n();
  const [updateLink, { isLoading: saving }] = useUpdateParentLinkMutation();
  const [unlink, { isLoading: removing }] = useUnlinkParentMutation();
  const [form, setForm] = useState({ relationship: RelationshipType.FATHER as string, isPrimary: false, isEmergencyContact: false, isSmsReceiver: false });
  const [loaded, setLoaded] = useState<string | null>(null);
  if (!link && loaded) setLoaded(null);
  if (link && link.id !== loaded) {
    setLoaded(link.id);
    setForm({
      relationship: link.relationship,
      isPrimary: link.isPrimary,
      isEmergencyContact: link.isEmergencyContact,
      isSmsReceiver: link.isSmsReceiver,
    });
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!link) return;
    try {
      await updateLink({
        id: link.id,
        relationship: form.relationship as RelationshipType,
        isPrimary: form.isPrimary,
        isEmergencyContact: form.isEmergencyContact,
        isSmsReceiver: form.isSmsReceiver,
      }).unwrap();
      toast.success(pick('সংযোগ হালনাগাদ হয়েছে।', 'Link updated.'));
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, pick('হালনাগাদ হয়নি।', 'Could not update the link.')));
    }
  };

  const remove = async () => {
    if (!link) return;
    try {
      await unlink({ id: link.id }).unwrap();
      toast.success(pick('সংযোগ সরানো হয়েছে।', 'Link removed.'));
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, pick('সরানো যায়নি।', 'Could not remove the link.')));
    }
  };

  return (
    <Modal open={Boolean(link)} onClose={onClose} title={pick('সংযোগ সম্পাদনা', 'Edit link')}>
      <form onSubmit={save} className="space-y-4">
        <FormField label={pick('সম্পর্ক', 'Relationship')}>
          <Select value={form.relationship} onChange={(event) => setForm({ ...form, relationship: event.target.value })}>
            <option value={RelationshipType.FATHER}>{pick('পিতা', 'Father')}</option>
            <option value={RelationshipType.MOTHER}>{pick('মাতা', 'Mother')}</option>
            <option value={RelationshipType.GUARDIAN}>{pick('অভিভাবক', 'Guardian')}</option>
            <option value={RelationshipType.OTHER}>{pick('অন্যান্য', 'Other')}</option>
          </Select>
        </FormField>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isPrimary} onChange={(event) => setForm({ ...form, isPrimary: event.target.checked })} />
          {pick('প্রাথমিক অভিভাবক', 'Primary guardian')}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isEmergencyContact} onChange={(event) => setForm({ ...form, isEmergencyContact: event.target.checked })} />
          {pick('জরুরি যোগাযোগ', 'Emergency contact')}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isSmsReceiver} onChange={(event) => setForm({ ...form, isSmsReceiver: event.target.checked })} />
          {pick('SMS পাবেন', 'Receives SMS')}
        </label>
        <div className="flex justify-between">
          <Button type="button" variant="outline" disabled={removing} onClick={remove}>{pick('সংযোগ সরান', 'Unlink')}</Button>
          <Button type="submit" variant="primary" disabled={saving}>{pick('সংরক্ষণ', 'Save')}</Button>
        </div>
      </form>
    </Modal>
  );
}

function Coverage({ db }: { db: MockDatabase }) {
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
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">{formatNumber(allRows.length, locale)}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('সম্পূর্ণ কভারেজ', 'Full Coverage')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-success tabular-nums mt-1">{formatNumber(completeCount, locale)}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('SMS প্রাপক নির্ধারিত', 'SMS Ready')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary tabular-nums mt-1">{formatNumber(smsReadyCount, locale)}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('তথ্য ঘাটতি (Gap)', 'Needs Attention')}</p>
          <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums mt-1 ${gapCount > 0 ? 'text-warning' : 'text-success'}`}>
            {formatNumber(gapCount, locale)}
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
                {formatNumber(row.original.emergency, locale)}
              </span>
            ),
          },
          {
            accessorKey: 'sms',
            header: 'SMS',
            cell: ({ row }) => (
              <span className={`tabular-nums font-medium ${row.original.sms === 0 ? 'text-destructive' : 'text-success'}`}>
                {formatNumber(row.original.sms, locale)}
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
      <LinkModal db={db} open={Boolean(studentId)} onClose={() => setStudentId(null)} studentId={studentId ?? undefined} />
    </div>
  );
}
