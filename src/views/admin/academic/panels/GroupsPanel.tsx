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

const emptyGroup = { name: '', nameBn: '', description: '', isActive: true };

export function GroupsPanel({ groups }: { groups: AcademicGroup[] }) {
  const { locale, pick } = useI18n();

  // Load groups from real backend with fallback
  const { data: realGroups } = useGetAcademicGroupsQuery();
  const groupList = realGroups && realGroups.length > 0 ? realGroups : (groups ?? []);

  const [createGroup, { isLoading: creating }] = useCreateAcademicGroupMutation();
  const [updateGroup, { isLoading: updating }] = useUpdateAcademicGroupMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyGroup);

  const saving = creating || updating;

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyGroup);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = form.name.trim();

    if (!trimmedName) {
      toast.error(pick('ইংরেজি নাম আবশ্যক।', 'English name is required.'));
      return;
    }

    if (trimmedName.length > 100) {
      toast.error(
        pick('ইংরেজি নাম ১০০ অক্ষরের বেশি হতে পারবে না।', 'English name cannot exceed 100 characters.')
      );
      return;
    }

    const trimmedNameBn = form.nameBn.trim();
    if (trimmedNameBn.length > 100) {
      toast.error(
        pick('বাংলা নাম ১০০ অক্ষরের বেশি হতে পারবে না।', 'Bangla name cannot exceed 100 characters.')
      );
      return;
    }

    const trimmedDesc = form.description.trim();
    if (trimmedDesc.length > 500) {
      toast.error(
        pick('বিবরণ ৫০০ অক্ষরের বেশি হতে পারবে না।', 'Description cannot exceed 500 characters.')
      );
      return;
    }

    try {
      if (editingId) {
        await updateGroup({
          id: editingId,
          name: trimmedName,
          nameBn: trimmedNameBn || undefined,
          description: trimmedDesc || undefined,
          isActive: form.isActive,
        }).unwrap();
        toast.success(
          pick('বিভাগ হালনাগাদ হয়েছে।', 'Group updated.')
        );
      } else {
        await createGroup({
          name: trimmedName,
          nameBn: trimmedNameBn || undefined,
          description: trimmedDesc || undefined,
          isActive: form.isActive,
        }).unwrap();
        toast.success(
          pick('নতুন বিভাগ যুক্ত হয়েছে।', 'Group created.')
        );
      }
      startCreate();
    } catch (err) {
      toast.error(errorMessage(err, pick('বিভাগ সংরক্ষণ হয়নি।', 'Could not save the group.')));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-bold">
            {editingId ? pick('বিভাগ সম্পাদনা', 'Edit group') : pick('নতুন বিভাগ (৯ম–১০ম)', 'New group (classes 9–10)')}
          </h3>
          {editingId && (
            <Button type="button" variant="outline" size="sm" onClick={startCreate}>
              <Plus className="w-4 h-4" /> {pick('নতুন', 'New')}
            </Button>
          )}
        </div>
        <form onSubmit={handleSave} className="space-y-3">
          <FormField label={pick('ইংরেজি নাম', 'English name')}>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Science" />
          </FormField>
          <FormField label={pick('বাংলা নাম', 'Bangla name')}>
            <Input value={form.nameBn} onChange={(event) => setForm({ ...form, nameBn: event.target.value })} placeholder="বিজ্ঞান" />
          </FormField>
          <FormField label={pick('বিবরণ', 'Description')}>
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </FormField>
          <Switch
            checked={form.isActive}
            onChange={(isActive) => setForm({ ...form, isActive })}
            label={pick('সক্রিয়', 'Active')}
          />
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('সংরক্ষণ করুন', 'Save')}
          </Button>
        </form>
      </Card>
      <Card className="divide-y divide-border">
        {groupList.map((group) => (
          <div key={group.id} className="p-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{locale === 'bn' ? group.nameBn || group.name : group.name}</p>
              <p className="text-sm text-muted-foreground">{group.description}</p>
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
                    nameBn: group.nameBn ?? '',
                    description: group.description ?? '',
                    isActive: group.isActive,
                  });
                }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
