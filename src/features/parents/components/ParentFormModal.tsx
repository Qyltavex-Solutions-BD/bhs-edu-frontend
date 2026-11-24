'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useSaveParentMutation, useUpdateParentMutation } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { Button, FormField, Input, Modal, Textarea } from '@/src/components/ui/primitives';
import type { Parent } from '@/src/types/entities';

export function shownPhone(phone?: string | null) {
  if (!phone || phone.startsWith('unused-')) return '';
  return phone;
}

export const emptyParent = {
  name: '',
  nameBn: '',
  phone: '',
  email: '',
  nid: '',
  occupation: '',
  monthlyIncome: '',
  address: '',
};

function errorMessage(err: unknown, fallback: string) {
  return (err as { message?: string })?.message || fallback;
}

export function ParentFormModal({
  open,
  onClose,
  parent,
}: {
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
