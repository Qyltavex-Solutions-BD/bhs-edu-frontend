'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useLinkParentMutation, useUpdateParentLinkMutation, useUnlinkParentMutation } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { Button, FormField, Modal, Select } from '@/src/components/ui/primitives';
import { RelationshipType, StudentStatus } from '@/src/types/enums';
import { shownPhone } from './ParentFormModal';
import type { MockDatabase } from '@/src/mocks/seed';
import type { ParentStudent } from '@/src/types/entities';

function errorMessage(err: unknown, fallback: string) {
  return (err as { message?: string })?.message || fallback;
}

export function ParentLinkModal({
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

export function ParentLinkEditModal({ link, onClose }: { link: ParentStudent | null; onClose: () => void }) {
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
