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
import { useAcademicI18n } from '../academic.i18n';
import { groupSchema, type GroupFormValues } from '../academic.schema';

const defaultValues: GroupFormValues = {
  name: '',
  nameBn: '',
  description: '',
  isActive: true,
};

export function GroupsPanel({ groups }: { groups?: AcademicGroup[] }) {
  const { isBn, t, dict } = useAcademicI18n();

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
        toast.success(t(dict.groups.updateSuccess));
      } else {
        await createGroup({
          name: values.name.trim(),
          nameBn: values.nameBn?.trim() || undefined,
          description: values.description?.trim() || undefined,
          isActive: values.isActive,
        }).unwrap();
        toast.success(t(dict.groups.createSuccess));
      }
      closeModal();
    } catch (err) {
      toast.error(errorMessage(err, t(dict.groups.saveFailed)));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {isBn ? 'বিভাগ ব্যবস্থাপনা' : 'Academic Groups'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isBn
              ? '৯ম ও ১০ম শ্রেণির বিভাগসমূহ (বিজ্ঞান, মানবিক, ব্যবসায় শিক্ষা) পরিচালনা করুন।'
              : 'Manage streams for classes 9 and 10 (Science, Humanities, Business Studies).'}
          </p>
        </div>
        <Button type="button" variant="primary" onClick={startCreate}>
          <Plus className="w-4 h-4" />
          {t(dict.groups.newTitle)}
        </Button>
      </div>

      <Card className="divide-y divide-border">
        {groupList.length === 0 ? (
          <div className="p-8 text-center text-base text-muted-foreground">
            {t(dict.groups.noGroups)}
          </div>
        ) : (
          groupList.map((group) => {
            const displayName = isBn ? group.nameBn || group.name : group.name;
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
                    customLabel={group.isActive ? t(dict.common.active) : t(dict.common.inactive)}
                    customTone={group.isActive ? 'success' : 'neutral'}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(group)}
                    title={t(dict.common.edit)}
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
        title={editingId ? t(dict.groups.editTitle) : t(dict.groups.newTitle)}
        description={
          isBn
            ? 'বিভাগের ইংরেজি ও বাংলা নাম এবং সংক্ষিপ্ত বিবরণ লিখুন।'
            : 'Enter the English and Bengali group names and description.'
        }
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label={t(dict.groups.nameEnLabel)} required error={errors.name?.message}>
            <Input
              {...register('name')}
              placeholder={t(dict.groups.nameEnPlaceholder)}
            />
          </FormField>

          <FormField label={t(dict.groups.nameBnLabel)} error={errors.nameBn?.message}>
            <Input
              {...register('nameBn')}
              placeholder={t(dict.groups.nameBnPlaceholder)}
            />
          </FormField>

          <FormField label={t(dict.groups.descLabel)} error={errors.description?.message}>
            <Textarea
              {...register('description')}
              placeholder={t(dict.groups.descPlaceholder)}
            />
          </FormField>

          <div className="pt-1">
            <Switch
              checked={isActive}
              onChange={(checked) => setValue('isActive', checked)}
              label={t(dict.common.active)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={closeModal}>
              {t(dict.common.cancel)}
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? t(dict.common.saving)
                : editingId
                  ? t(dict.common.update)
                  : t(dict.common.save)}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
