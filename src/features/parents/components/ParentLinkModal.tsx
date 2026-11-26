'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/src/lib/i18n';
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
  const { pick } = useI18n();
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
      toast.success(pick('সংযোগ হালনাগাদ হয়েছে।', 'Link updated.'));
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, pick('হালনাগাদ হয়নি।', 'Could not update the link.')));
    }
  };

  return (
    <Modal open={Boolean(link)} onClose={onClose} title={pick('সংযোগ সম্পাদনা', 'Edit link')}>
      <form onSubmit={save} className="space-y-4">
        <FormField label={pick('সম্পর্ক', 'Relationship')}>
          <Select
            value={form.relationship}
            onChange={(event) => setForm({ ...form, relationship: event.target.value })}
          >
            <option value={RelationshipType.FATHER}>{pick('পিতা', 'Father')}</option>
            <option value={RelationshipType.MOTHER}>{pick('মাতা', 'Mother')}</option>
            <option value={RelationshipType.GUARDIAN}>{pick('অভিভাবক', 'Guardian')}</option>
            <option value={RelationshipType.OTHER}>{pick('অন্যান্য', 'Other')}</option>
          </Select>
        </FormField>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPrimary}
            onChange={(event) => setForm({ ...form, isPrimary: event.target.checked })}
          />
          {pick('প্রাথমিক অভিভাবক', 'Primary guardian')}
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.isEmergencyContact}
            onChange={(event) =>
              setForm({ ...form, isEmergencyContact: event.target.checked })
            }
          />
          {pick('জরুরি যোগাযোগ', 'Emergency contact')}
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.isSmsReceiver}
            onChange={(event) => setForm({ ...form, isSmsReceiver: event.target.checked })}
          />
          {pick('SMS পাবেন', 'Receives SMS')}
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {pick('বাতিল', 'Cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('সংরক্ষণ', 'Save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
