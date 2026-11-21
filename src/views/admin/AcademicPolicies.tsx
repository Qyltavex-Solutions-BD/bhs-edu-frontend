'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useRemoveAcademicDocumentMutation, useSaveAcademicDocumentMutation } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { Button, FormField, Input, Modal, Select, Textarea } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import type { AcademicDocument } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';
import { AcademicDocumentType } from '@/src/types/enums';

function errorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return fallback;
}

const EMPTY = {
  id: '',
  type: AcademicDocumentType.STUDENT_RULES,
  title: '',
  description: '',
  isPublished: true,
};

const TYPE_LABEL: Record<AcademicDocumentType, [string, string]> = {
  [AcademicDocumentType.CURRICULUM]: ['পাঠ্যক্রম', 'Curriculum'],
  [AcademicDocumentType.STUDENT_RULES]: ['শিক্ষার্থী বিধি', 'Student rules'],
  [AcademicDocumentType.PARENT_GUIDELINES]: ['অভিভাবক নির্দেশনা', 'Parent guidelines'],
  [AcademicDocumentType.DRESS_CODE]: ['পোশাকবিধি', 'Dress code'],
};

export function AcademicPolicies({ db }: { db: MockDatabase }) {
  const { pick } = useI18n();
  const [saveDocument, { isLoading: saving }] = useSaveAcademicDocumentMutation();
  const [removeDocument, { isLoading: removing }] = useRemoveAcademicDocumentMutation();
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);

  const fill = (doc: AcademicDocument) => {
    setForm({
      id: doc.id,
      type: doc.type,
      title: doc.title,
      description: doc.description ?? '',
      isPublished: doc.isPublished,
    });
    setOpen(true);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveDocument({
        id: form.id || undefined,
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim() || null,
        isPublished: form.isPublished,
      }).unwrap();
      toast.success(form.id ? pick('নীতিমালা আপডেট হয়েছে।', 'Policy updated.') : pick('নীতিমালা প্রকাশ হয়েছে।', 'Policy published.'));
      setForm(EMPTY);
      setOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, pick('নীতিমালা সংরক্ষণ হয়নি।', 'Could not save the policy.')));
    }
  };

  const onRemove = async (id: string) => {
    try {
      await removeDocument({ id }).unwrap();
      if (form.id === id) setForm(EMPTY);
      toast.success(pick('নীতিমালা মুছে ফেলা হয়েছে।', 'Policy removed.'));
    } catch (err) {
      toast.error(errorMessage(err, pick('নীতিমালা মোছা যায়নি।', 'Could not remove the policy.')));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          onClick={() => {
            setForm(EMPTY);
            setOpen(true);
          }}
        >
          {pick('নীতিমালা যোগ', 'Add policy')}
        </Button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? pick('নীতিমালা সম্পাদনা', 'Edit policy') : pick('নীতিমালা যোগ', 'Add policy')}
        description={pick('প্রকাশিত হলে পাবলিক সিলেবাস পাতায় দেখা যায়।', 'Published policies appear on the public syllabus page.')}
      >
      <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
        <FormField label={pick('ধরন', 'Type')}>
          <Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as AcademicDocumentType })}>
            {Object.values(AcademicDocumentType).map((type) => (
              <option key={type} value={type}>
                {pick(TYPE_LABEL[type][0], TYPE_LABEL[type][1])}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={pick('শিরোনাম', 'Title')}>
          <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label={pick('সারাংশ', 'Summary')}>
            <Textarea rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </FormField>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(event) => setForm({ ...form, isPublished: event.target.checked })}
          />
          {pick('পাবলিক পাতায় প্রকাশ', 'Publish on the public page')}
        </label>
        <div className="flex gap-2">
          <Button type="submit" variant="primary" disabled={saving}>
            {form.id ? pick('আপডেট', 'Update') : pick('যোগ করুন', 'Add')}
          </Button>
          {form.id && (
            <Button type="button" variant="outline" onClick={() => setForm(EMPTY)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
          )}
        </div>
      </form>
      </Modal>
      <div className="space-y-2">
        {db.academicDocuments.map((doc) => (
          <div key={doc.id} className="p-3 border border-border rounded flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <StatusBadge enumName="AcademicDocumentType" value={doc.type} />
              <p className="text-sm font-semibold">{doc.title}</p>
              <p className="text-xs text-muted-foreground">
                {doc.isPublished ? pick('প্রকাশিত', 'Published') : pick('অপ্রকাশিত', 'Unpublished')}
              </p>
            </div>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => fill(doc)}>
                {pick('সম্পাদনা', 'Edit')}
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={removing} onClick={() => onRemove(doc.id)}>
                {pick('মুছুন', 'Remove')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
