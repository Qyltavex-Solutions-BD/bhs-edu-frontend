'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button, FormField, Input, Modal, Textarea } from '@/src/components/ui/primitives';
import { useUpdateParentMutation, type ParentDetailData } from '../api/parents.api';

export function shownPhone(phone?: string | null) {
  if (!phone || phone === 'N/A' || phone.startsWith('unused-')) return '';
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
  const e = err as { data?: { message?: string }; message?: string };
  return e?.data?.message || e?.message || fallback;
}

export function ParentFormModal({
  open,
  onClose,
  parent,
}: {
  open: boolean;
  onClose: () => void;
  parent: ParentDetailData | null;
}) {
  const [updateParent, { isLoading: updating }] = useUpdateParentMutation();
  const [form, setForm] = useState(emptyParent);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  if (open && parent && parent.id !== loadedId) {
    setLoadedId(parent.id);
    setForm({
      name: parent.name,
      nameBn: parent.nameBn ?? '',
      phone: shownPhone(parent.phone),
      email: parent.email ?? '',
      nid: parent.nid ?? '',
      occupation: parent.occupation ?? '',
      monthlyIncome: parent.monthlyIncome != null ? String(parent.monthlyIncome) : '',
      address: parent.address ?? '',
    });
  }
  if (!open && loadedId) setLoadedId(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!parent) return;
    try {
      await updateParent({
        id: parent.id,
        name: form.name.trim(),
        nameBn: form.nameBn.trim() || undefined,
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        nid: form.nid.trim() || undefined,
        occupation: form.occupation.trim() || undefined,
        monthlyIncome: form.monthlyIncome ? Number(form.monthlyIncome) : null,
        address: form.address.trim() || undefined,
      }).unwrap();
      toast.success('অভিভাবকের তথ্য সংরক্ষিত হয়েছে।');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'সংরক্ষণ হয়নি।'));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={'অভিভাবক প্রোফাইল সম্পাদনা'}>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label={'ইংরেজি নাম'} required>
          <Input
            required
            value={form.name}
            placeholder={'যেমন: Md. Rafiqul Islam'}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </FormField>
        <FormField label={'বাংলা নাম'}>
          <Input
            value={form.nameBn}
            placeholder={'যেমন: মো. রফিকুল ইসলাম'}
            onChange={(event) => setForm({ ...form, nameBn: event.target.value })}
          />
        </FormField>
        <FormField label={'মোবাইল'} required>
          <Input
            required
            value={form.phone}
            placeholder={'যেমন: 01711223344'}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </FormField>
        <FormField label={'ইমেইল'}>
          <Input
            type="email"
            value={form.email}
            placeholder={'যেমন: guardian@example.com'}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </FormField>
        <FormField label={'এনআইডি'}>
          <Input
            value={form.nid}
            placeholder={'১০ বা ১৭ সংখ্যার এনআইডি নম্বর'}
            onChange={(event) => setForm({ ...form, nid: event.target.value })}
          />
        </FormField>
        <FormField label={'পেশা'}>
          <Input
            value={form.occupation}
            placeholder={'যেমন: ব্যবসা / চাকরি / শিক্ষকতা'}
            onChange={(event) => setForm({ ...form, occupation: event.target.value })}
          />
        </FormField>
        <FormField label={'মাসিক আয়'}>
          <Input
            type="number"
            min={0}
            value={form.monthlyIncome}
            placeholder={'যেমন: 35000'}
            onChange={(event) => setForm({ ...form, monthlyIncome: event.target.value })}
          />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label={'ঠিকানা'}>
            <Textarea
              value={form.address}
              placeholder={'গ্রাম/বাড়ি নং, ডাকঘর, উপজেলা, জেলা লিখুন...'}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
            />
          </FormField>
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {'বাতিল'}
          </Button>
          <Button type="submit" variant="primary" disabled={updating}>
            {updating ? 'সংরক্ষণ হচ্ছে...' : 'হালনাগাদ করুন'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
