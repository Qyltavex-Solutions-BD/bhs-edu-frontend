'use client';

import React, { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateAcademicGroupMutation,
  useGetAcademicGroupsQuery,
  useUpdateAcademicGroupMutation,
} from '@/src/services/academic/group.api';
import { useI18n } from '@/src/lib/i18n';
import { Button, Card, FormField, Input, Switch, Textarea } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import type { AcademicGroup } from '@/src/types/entities';
import { errorMessage } from './shared';

interface GroupFormState {
  name: string;
  description: string;
  isActive: boolean;
}

const emptyGroup: GroupFormState = { name: '', description: '', isActive: true };

export function GroupsPanel({ groups }: { groups?: AcademicGroup[] }) {
  const { locale, pick } = useI18n();

  // Load groups from real backend with fallback
  const { data: realGroups, isLoading: loadingGroups } = useGetAcademicGroupsQuery();
  const groupList = realGroups && realGroups.length > 0 ? realGroups : (groups ?? []);

  const [createGroup, { isLoading: creating }] = useCreateAcademicGroupMutation();
  const [updateGroup, { isLoading: updating }] = useUpdateAcademicGroupMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GroupFormState>(emptyGroup);

  const saving = creating || updating;

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyGroup);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = form.name.trim();

    if (!trimmedName) {
      toast.error(pick('বিভাগের নাম আবশ্যক।', 'Group name is required.'));
      return;
    }

    try {
      if (editingId) {
        await updateGroup({
          id: editingId,
          name: trimmedName,
          description: form.description.trim() || undefined,
          isActive: form.isActive,
        }).unwrap();
        toast.success(
          pick('বিভাগ সফলভাবে হালনাগাদ হয়েছে।', 'Group updated successfully.')
        );
      } else {
        await createGroup({
          name: trimmedName,
          description: form.description.trim() || undefined,
          isActive: form.isActive,
        }).unwrap();
        toast.success(
          pick('নতুন বিভাগ সফলভাবে যুক্ত হয়েছে।', 'Group created successfully.')
        );
      }
      startCreate();
    } catch (err) {
      toast.error(errorMessage(err, pick('বিভাগ সংরক্ষণ করা যায়নি।', 'Could not save the group.')));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-bold">
            {editingId
              ? pick('বিভাগ সম্পাদনা', 'Edit group')
              : pick('নতুন বিভাগ (৯ম–১০ম)', 'New group (classes 9–10)')}
          </h3>
          {editingId && (
            <Button type="button" variant="outline" size="sm" onClick={startCreate}>
              <Plus className="w-4 h-4" /> {pick('নতুন', 'New')}
            </Button>
          )}
        </div>
        <form onSubmit={handleSave} className="space-y-3">
          <FormField label={pick('বিভাগের নাম', 'Group name')}>
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder={pick(
                'যেমন: বিজ্ঞান, ব্যবসায় শিক্ষা, মানবিক',
                'e.g. Science, Business Studies, Humanities'
              )}
              required
            />
          </FormField>
          <FormField label={pick('বিবরণ (ঐচ্ছিক)', 'Description (optional)')}>
            <Textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder={pick(
                'বিভাগের সংক্ষিপ্ত বিবরণ...',
                'Brief description of the group...'
              )}
            />
          </FormField>
          <Switch
            checked={form.isActive}
            onChange={(isActive) => setForm({ ...form, isActive })}
            label={pick('সক্রিয়', 'Active')}
          />
          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? pick('সংরক্ষণ হচ্ছে...', 'Saving...')
                : editingId
                ? pick('হালনাগাদ করুন', 'Update')
                : pick('যুক্ত করুন', 'Add Group')}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={startCreate}>
                {pick('বাতিল', 'Cancel')}
              </Button>
            )}
          </div>
        </form>
      </Card>
      <Card className="divide-y divide-border">
        {loadingGroups && groupList.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {pick('লোড হচ্ছে...', 'Loading groups...')}
          </div>
        ) : groupList.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {pick('কোনো বিভাগ পাওয়া যায়নি।', 'No academic groups found.')}
          </div>
        ) : (
          groupList.map((group) => (
            <div key={group.id} className="p-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {locale === 'bn' ? group.nameBn || group.name : group.name}
                </p>
                {group.description && (
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  value={group.isActive ? 'ACTIVE' : 'INACTIVE'}
                  customLabel={group.isActive ? pick('সক্রিয়', 'Active') : pick('বন্ধ', 'Inactive')}
                  customTone={group.isActive ? 'success' : 'neutral'}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingId(group.id);
                    setForm({
                      name: group.name,
                      description: group.description ?? '',
                      isActive: group.isActive,
                    });
                  }}
                  title={pick('সম্পাদনা', 'Edit')}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
