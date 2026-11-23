'use client';

import React, { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useSaveAcademicGroupMutation } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { Button, Card, FormField, Input, Switch, Textarea } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import type { AcademicGroup } from '@/src/types/entities';
import { errorMessage } from './shared';

const emptyGroup = { name: '', nameBn: '', description: '', isActive: true };

export function GroupsPanel({ groups }: { groups: AcademicGroup[] }) {
  const { locale, pick } = useI18n();
  const [saveGroup, { isLoading: saving }] = useSaveAcademicGroupMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyGroup);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyGroup);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveGroup({
        id: editingId ?? undefined,
        name: form.name,
        nameBn: form.nameBn,
        description: form.description,
        isActive: form.isActive,
      }).unwrap();
      toast.success(
        editingId ? pick('বিভাগ হালনাগাদ হয়েছে।', 'Group updated.') : pick('নতুন বিভাগ যুক্ত হয়েছে।', 'Group created.')
      );
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
        {groups.map((group) => (
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
