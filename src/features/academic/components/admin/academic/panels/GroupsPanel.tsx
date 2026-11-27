'use client';

import React, { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  useCreateAcademicGroupMutation,
  useGetAcademicGroupsQuery,
  useUpdateAcademicGroupMutation,
} from '@/src/services/academic';
import { Button, Card, FormField, Input, Modal, Switch, Textarea } from '@/src/components/ui';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import type { AcademicGroup } from '@/src/types/entities';
import { errorMessage } from './shared';
import { groupSchema, type GroupFormValues } from '../academic.schema';

const defaultValues: GroupFormValues = {
  name: '',
  nameBn: '',
  description: '',
  isActive: true,
};

export function GroupsPanel({ groups }: { groups?: AcademicGroup[] }) {

  const { data: realGroups } = useGetAcademicGroupsQuery();
  const groupList = realGroups && realGroups.length > 0 ? realGroups : (groups ?? []);

  const [createGroup, { isLoading: creating }] = useCreateAcademicGroupMutation();
  const [updateGroup, { isLoading: updating }] = useUpdateAcademicGroupMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues,
  });

  const isActive = watch('isActive');
  const saving = creating || updating;

  const startCreate = () => {
    setEditingId(null);
    reset(defaultValues);
    setModalOpen(true);
  };

  const startEdit = (group: AcademicGroup) => {
    setEditingId(group.id);
    reset({
      name: group.name,
      nameBn: group.nameBn ?? '',
      description: group.description ?? '',
      isActive: group.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingId(null);
    reset(defaultValues);
    setModalOpen(false);
  };

  const onSubmit = async (values: GroupFormValues) => {
    try {
      if (editingId) {
        await updateGroup({
          id: editingId,
          name: values.name.trim(),
          nameBn: values.nameBn?.trim() || undefined,
          description: values.description?.trim() || undefined,
          isActive: values.isActive,
        }).unwrap();
        toast.success('বিভাগ হালনাগাদ হয়েছে।');
      } else {
        await createGroup({
          name: values.name.trim(),
          nameBn: values.nameBn?.trim() || undefined,
          description: values.description?.trim() || undefined,
          isActive: values.isActive,
        }).unwrap();
        toast.success('নতুন বিভাগ যুক্ত হয়েছে।');
      }
      closeModal();
    } catch (err) {
      toast.error(errorMessage(err, 'বিভাগ সংরক্ষণ হয়নি।'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {'বিভাগ ব্যবস্থাপনা'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {'৯ম ও ১০ম শ্রেণির বিভাগসমূহ (বিজ্ঞান, মানবিক, ব্যবসায় শিক্ষা) পরিচালনা করুন।'}
          </p>
        </div>
        <Button type="button" variant="primary" onClick={startCreate}>
          <Plus className="w-4 h-4" />
          {'নতুন বিভাগ (৯ম–১০ম)'}
        </Button>
      </div>

      <Card className="divide-y divide-border">
        {groupList.length === 0 ? (
          <div className="p-8 text-center text-base text-muted-foreground">
            {'কোনো বিভাগ পাওয়া যায়নি।'}
          </div>
        ) : (
          groupList.map((group) => {
            const displayName = group.nameBn || group.name;
            const secondaryName =
              group.nameBn && group.nameBn !== displayName
                ? ` (${group.nameBn})`
                : group.name !== displayName
                  ? ` (${group.name})`
                  : '';

            return (
              <div
                key={group.id}
                className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-surface-muted/40 transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">
                    {displayName}
                    {secondaryName && (
                      <span className="text-sm font-normal text-muted-foreground ml-1.5">
                        {secondaryName}
                      </span>
                    )}
                  </p>
                  {group.description && (
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge
                    value={group.isActive ? 'ACTIVE' : 'INACTIVE'}
                    customLabel={group.isActive ? 'সক্রিয়' : 'বন্ধ'}
                    customTone={group.isActive ? 'success' : 'neutral'}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(group)}
                    title={'সম্পাদনা'}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'বিভাগ সম্পাদনা' : 'নতুন বিভাগ (৯ম–১০ম)'}
        description={
          'বিভাগের ইংরেজি ও বাংলা নাম এবং সংক্ষিপ্ত বিবরণ লিখুন।'
        }
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label={'ইংরেজি নাম'} required error={errors.name?.message}>
            <Input
              {...register('name')}
              placeholder="যেমন: Science"
            />
          </FormField>

          <FormField label={'বাংলা নাম'} error={errors.nameBn?.message}>
            <Input
              {...register('nameBn')}
              placeholder={'বিজ্ঞান'}
            />
          </FormField>

          <FormField label={'বিবরণ'} error={errors.description?.message}>
            <Textarea
              {...register('description')}
              placeholder={'বিভাগের সংক্ষিপ্ত বিবরণ...'}
            />
          </FormField>

          <div className="pt-1">
            <Switch
              checked={isActive}
              onChange={(checked) => setValue('isActive', checked)}
              label={'সক্রিয়'}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={closeModal}>
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
    </div>
  );
}
