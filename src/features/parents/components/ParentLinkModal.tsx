'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button, FormField, Modal, Select } from '@/src/components/ui/primitives';
import { RelationshipType } from '@/src/types/enums';
import { useUpdateParentLinkMutation, type ParentChildLink } from '../api/parents.api';

function errorMessage(err: unknown, fallback: string) {
  const e = err as { data?: { message?: string }; message?: string };
  return e?.data?.message || e?.message || fallback;
}

export function ParentLinkEditModal({
  link,
  onClose,
}: {
  link: ParentChildLink | null;
  onClose: () => void;
}) {
  const [updateLink, { isLoading: saving }] = useUpdateParentLinkMutation();
  const [form, setForm] = useState({
    relationship: RelationshipType.FATHER as string,
    isPrimary: false,
    isEmergencyContact: false,
    isSmsReceiver: false,
  });
  const [loaded, setLoaded] = useState<string | null>(null);

  if (!link && loaded) setLoaded(null);
  if (link && link.mappingId !== loaded) {
    setLoaded(link.mappingId);
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
        id: link.mappingId,
        relationship: form.relationship as RelationshipType,
        isPrimary: form.isPrimary,
        isEmergencyContact: form.isEmergencyContact,
        isSmsReceiver: form.isSmsReceiver,
      }).unwrap();
      toast.success('সংযোগ হালনাগাদ হয়েছে।');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'হালনাগাদ হয়নি।'));
    }
  };

  return (
    <Modal open={Boolean(link)} onClose={onClose} title={'সংযোগ সম্পাদনা'}>
      <form onSubmit={save} className="space-y-4">
        <FormField label={'সম্পর্ক'}>
          <Select
            value={form.relationship}
            onChange={(event) => setForm({ ...form, relationship: event.target.value })}
          >
            <option value={RelationshipType.FATHER}>{'পিতা'}</option>
            <option value={RelationshipType.MOTHER}>{'মাতা'}</option>
            <option value={RelationshipType.GUARDIAN}>{'অভিভাবক'}</option>
            <option value={RelationshipType.OTHER}>{'অন্যান্য'}</option>
          </Select>
        </FormField>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPrimary}
            onChange={(event) => setForm({ ...form, isPrimary: event.target.checked })}
          />
          {'প্রাথমিক অভিভাবক'}
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.isEmergencyContact}
            onChange={(event) =>
              setForm({ ...form, isEmergencyContact: event.target.checked })
            }
          />
          {'জরুরি যোগাযোগ'}
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.isSmsReceiver}
            onChange={(event) => setForm({ ...form, isSmsReceiver: event.target.checked })}
          />
          {'SMS পাবেন'}
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {'বাতিল'}
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
