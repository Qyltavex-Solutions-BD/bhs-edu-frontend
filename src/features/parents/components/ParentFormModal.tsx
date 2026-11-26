'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/src/lib/i18n';
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
  const { pick } = useI18n();
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
      toast.success(pick('অভিভাবকের তথ্য সংরক্ষিত হয়েছে।', 'Guardian saved.'));
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, pick('সংরক্ষণ হয়নি।', 'Could not save the guardian.')));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={pick('অভিভাবক প্রোফাইল সম্পাদনা', 'Edit Guardian Profile')}>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label={pick('ইংরেজি নাম', 'Name in English')} required>
          <Input
            required
            value={form.name}
            placeholder={pick('যেমন: Md. Rafiqul Islam', 'e.g. Md. Rafiqul Islam')}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </FormField>
        <FormField label={pick('বাংলা নাম', 'Name in Bangla')}>
          <Input
            value={form.nameBn}
            placeholder={pick('যেমন: মো. রফিকুল ইসলাম', 'e.g. মো. রফিকুল ইসলাম')}
            onChange={(event) => setForm({ ...form, nameBn: event.target.value })}
          />
        </FormField>
        <FormField label={pick('মোবাইল', 'Phone')} required>
          <Input
            required
            value={form.phone}
            placeholder={pick('যেমন: 01711223344', 'e.g. 01711223344')}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </FormField>
        <FormField label={pick('ইমেইল', 'Email')}>
          <Input
            type="email"
            value={form.email}
            placeholder={pick('যেমন: guardian@example.com', 'e.g. guardian@example.com')}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </FormField>
        <FormField label={pick('এনআইডি', 'NID')}>
          <Input
            value={form.nid}
            placeholder={pick('১০ বা ১৭ সংখ্যার এনআইডি নম্বর', '10 or 17 digit NID number')}
            onChange={(event) => setForm({ ...form, nid: event.target.value })}
          />
        </FormField>
        <FormField label={pick('পেশা', 'Occupation')}>
          <Input
            value={form.occupation}
            placeholder={pick('যেমন: ব্যবসা / চাকরি / শিক্ষকতা', 'e.g. Business / Service')}
            onChange={(event) => setForm({ ...form, occupation: event.target.value })}
          />
        </FormField>
        <FormField label={pick('মাসিক আয়', 'Monthly Income')}>
          <Input
            type="number"
            min={0}
            value={form.monthlyIncome}
            placeholder={pick('যেমন: 35000', 'e.g. 35000')}
            onChange={(event) => setForm({ ...form, monthlyIncome: event.target.value })}
          />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label={pick('ঠিকানা', 'Address')}>
            <Textarea
              value={form.address}
              placeholder={pick('গ্রাম/বাড়ি নং, ডাকঘর, উপজেলা, জেলা লিখুন...', 'Enter village/house, post office, upazila, district...')}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
            />
          </FormField>
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {pick('বাতিল', 'Cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={updating}>
            {updating ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('হালনাগাদ করুন', 'Update')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
