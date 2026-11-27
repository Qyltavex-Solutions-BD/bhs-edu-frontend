'use client';

import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  useCreateSubjectMutation,
  useDeleteSubjectMutation,
  useGetSubjectsPaginatedQuery,
  useUpdateSubjectMutation,
} from '@/src/services/academic';
import { ConfirmDialog } from '@/src/components/shared/Feedback';
import { Button, Card, FormField, Input, Modal, Select, Switch, Textarea } from '@/src/components/ui';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { formatNumber } from '@/src/lib/formatters';
import { SubjectCategory } from '@/src/types/enums';
import type { Subject } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';
import { errorMessage } from './shared';
import { CATEGORY_LABELS } from '../academic.labels';
import { subjectSchema, type SubjectFormValues } from '../academic.schema';

const defaultValues: SubjectFormValues = {
  name: '',
  nameBn: '',
  officialCode: '',
  category: SubjectCategory.GENERAL,
  description: '',
  isActive: true,
};

export function SubjectCatalogPanel({ db: _db }: { db?: MockDatabase }) {

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: paginatedSubjects, isLoading, isFetching } = useGetSubjectsPaginatedQuery({
    page,
    limit: 12,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(categoryFilter !== 'all' ? { category: categoryFilter as SubjectCategory } : {}),
  });

  const subjectList: Subject[] = paginatedSubjects?.items ?? [];
  const meta = paginatedSubjects?.meta ?? {
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const [createSubject, { isLoading: creating }] = useCreateSubjectMutation();
  const [updateSubject, { isLoading: updating }] = useUpdateSubjectMutation();
  const [deleteSubject, { isLoading: deleting }] = useDeleteSubjectMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues,
  });

  const isActive = watch('isActive');
  const selectedCategory = watch('category');
  const saving = creating || updating;

  const startCreate = () => {
    setEditingId(null);
    reset(defaultValues);
    setOpen(true);
  };

  const close = () => {
    setEditingId(null);
    reset(defaultValues);
    setOpen(false);
  };

  const startEdit = (subject: Subject) => {
    setEditingId(subject.id);
    reset({
      name: subject.name,
      nameBn: subject.nameBn ?? '',
      officialCode: subject.officialCode ?? '',
      category: subject.category ?? SubjectCategory.GENERAL,
      description: subject.description ?? '',
      isActive: subject.isActive,
    });
    setOpen(true);
  };

  const onSubmit = async (values: SubjectFormValues) => {
    try {
      if (editingId) {
        await updateSubject({
          id: editingId,
          name: values.name.trim(),
          nameBn: values.nameBn.trim() || undefined,
          officialCode: values.officialCode.trim() || undefined,
          category: values.category,
          description: values.description.trim() || undefined,
          isActive: values.isActive,
        }).unwrap();
        toast.success('বিষয় সফলভাবে আপডেট হয়েছে।');
      } else {
        await createSubject({
          name: values.name.trim(),
          nameBn: values.nameBn.trim() || undefined,
          officialCode: values.officialCode.trim() || undefined,
          category: values.category,
          description: values.description.trim() || undefined,
          isActive: values.isActive,
        }).unwrap();
        toast.success('নতুন বিষয় ক্যাটালগে যুক্ত হয়েছে।');
      }
      close();
    } catch (err) {
      toast.error(errorMessage(err, 'বিষয় সংরক্ষণ করা যায়নি।'));
    }
  };

  const handleToggleActive = async (subject: Subject) => {
    try {
      await updateSubject({
        id: subject.id,
        isActive: !subject.isActive,
      }).unwrap();
      toast.success('বিষয় সফলভাবে আপডেট হয়েছে।');
    } catch (err) {
      toast.error(errorMessage(err, 'বিষয় সংরক্ষণ করা যায়নি।'));
    }
  };

  const handleDelete = (subject: Subject) => {
    setDeleteTarget(subject);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSubject(deleteTarget.id).unwrap();
      toast.success('বিষয় ক্যাটালগ থেকে মুছে ফেলা হয়েছে।');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(errorMessage(err, 'বিষয় মোছা যায়নি।'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={'বিষয় বা কোড খুঁজুন...'}
              className="pl-9"
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-44"
          >
            <option value="all">{'সকল ক্যাটাগরি'}</option>
            {Object.values(SubjectCategory).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat] ? (CATEGORY_LABELS[cat]) : cat}
              </option>
            ))}
          </Select>
        </div>

        <Button type="button" variant="primary" onClick={startCreate}>
          <Plus className="w-4 h-4" /> {'নতুন বিষয়'}
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-base">
          <thead className="bg-surface-muted text-sm text-muted-foreground">
            <tr>
              <th className="p-3.5 text-left">{'কোড'}</th>
              <th className="p-3.5 text-left">{'বিষয়'}</th>
              <th className="p-3.5 text-left">{'ধরন'}</th>
              <th className="p-3.5 text-left">{'অবস্থা'}</th>
              <th className="p-3.5 text-right">{'কাজ'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {subjectList.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-base text-muted-foreground">
                  {isLoading || isFetching ? 'লোড হচ্ছে...' : 'কোনো বিষয় পাওয়া যায়নি।'}
                </td>
              </tr>
            ) : (
              subjectList.map((subject) => {
                const displayName = subject.nameBn || subject.name;
                const secondaryName =
                  subject.nameBn && subject.nameBn !== displayName
                    ? ` (${subject.nameBn})`
                    : subject.name !== displayName
                      ? ` (${subject.name})`
                      : '';
                const categoryLabel = CATEGORY_LABELS[subject.category]
                  ? CATEGORY_LABELS[subject.category]
                  : subject.category;

                return (
                  <tr key={subject.id} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="p-3.5 tabular-nums text-sm text-muted-foreground">
                      {subject.officialCode || '—'}
                    </td>
                    <td className="p-3.5 font-medium">
                      <span className="text-foreground">{displayName}</span>
                      {secondaryName && (
                        <span className="text-sm text-muted-foreground ml-1">
                          {secondaryName}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-muted text-muted-foreground border border-border">
                        {categoryLabel}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(subject)}
                        title={'অবস্থা পরিবর্তন করুন'}
                        className="cursor-pointer"
                      >
                        <StatusBadge
                          value={subject.isActive ? 'ACTIVE' : 'INACTIVE'}
                          customLabel={
                            subject.isActive
                              ? 'সক্রিয়'
                              : 'বন্ধ'
                          }
                          customTone={subject.isActive ? 'success' : 'neutral'}
                        />
                      </button>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(subject)}
                      >
                        <Pencil className="w-4 h-4" />
                        {'সম্পাদনা'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={deleting}
                        onClick={() => handleDelete(subject)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {meta.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {`মোট ${formatNumber(meta.total, 'bn')} টি বিষয় · পৃষ্ঠা ${formatNumber(meta.page, 'bn')} / ${formatNumber(meta.totalPages, 'bn')}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!meta.hasPreviousPage || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {'পূর্ববর্তী'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!meta.hasNextPage || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              {'পরবর্তী'}
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={open}
        onClose={close}
        title={editingId ? 'বিষয় সম্পাদনা' : 'নতুন বিষয়'}
        description={'বিষয় তৈরি করার পর তা শ্রেণির পাঠ্যক্রমে বসাতে হবে। ব্যবহৃত বিষয় মুছা যায় না।'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={'ইংরেজি নাম'} required error={errors.name?.message}>
              <Input
                {...register('name')}
                placeholder={'যেমন: Physics, General Mathematics'}
              />
            </FormField>

            <FormField label={'বাংলা নাম'} required error={errors.nameBn?.message}>
              <Input
                {...register('nameBn')}
                placeholder={'যেমন: পদার্থবিজ্ঞান, সাধারণ গণিত'}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={'বোর্ড কোড'} error={errors.officialCode?.message}>
              <Input
                {...register('officialCode')}
                placeholder={'যেমন: 101, 109, 136'}
              />
            </FormField>

            <FormField label={'ধরন / ক্যাটাগরি'} required error={errors.category?.message}>
              <Select
                value={selectedCategory}
                onChange={(e) => setValue('category', e.target.value as SubjectCategory, { shouldValidate: true })}
              >
                {Object.values(SubjectCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat] ? (CATEGORY_LABELS[cat]) : cat}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label={'বিবরণ'} error={errors.description?.message}>
            <Textarea
              {...register('description')}
              placeholder={'বিষয়ের সংক্ষিপ্ত বিবরণ...'}
            />
          </FormField>

          <Switch
            checked={isActive}
            onChange={(val) => setValue('isActive', val)}
            label={'সক্রিয়'}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={close}>
              {'বাতিল'}
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? 'সংরক্ষণ হচ্ছে...'
                : editingId
                  ? 'হালনাগাদ করুন'
                  : 'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={'বিষয় মুছে ফেলুন'}
        description={
          `আপনি কি নিশ্চিতভাবে "${deleteTarget?.nameBn || deleteTarget?.name || ''}" বিষয়টি তালিকা থেকে মুছতে চান?`
        }
        confirmLabel={'মুছে ফেলুন'}
        destructive
        loading={deleting}
      />
    </div>
  );
}
