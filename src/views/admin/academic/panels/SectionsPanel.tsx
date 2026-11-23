'use client';

import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useSaveSectionMutation } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { Button, Card, FormField, Input, Select, Switch } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import type { SchoolClass, Section } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';
import { errorMessage } from './shared';

const emptySection = { classId: '', name: '', isActive: true };

export function SectionsPanel({ db }: { db: MockDatabase }) {
  const { locale, pick } = useI18n();
  const [saveSection, { isLoading: saving }] = useSaveSectionMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof emptySection>({
    ...emptySection,
    classId: db.classes[0]?.id ?? '',
  });

  const className = (schoolClass?: SchoolClass) =>
    locale === 'bn' ? schoolClass?.nameBn || schoolClass?.name : schoolClass?.name;

  const startCreate = () => {
    setEditingId(null);
    setForm({ ...emptySection, classId: db.classes[0]?.id ?? '' });
  };

  const startEdit = (section: Section) => {
    setEditingId(section.id);
    setForm({ classId: section.classId, name: section.name, isActive: section.isActive });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveSection({
        id: editingId ?? undefined,
        classId: form.classId,
        name: form.name,
        isActive: form.isActive,
      }).unwrap();
      toast.success(
        editingId ? pick('শাখা হালনাগাদ হয়েছে।', 'Section updated.') : pick('নতুন শাখা যুক্ত হয়েছে।', 'Section created.')
      );
      startCreate();
    } catch (err) {
      toast.error(errorMessage(err, pick('শাখা সংরক্ষণ হয়নি।', 'Could not save the section.')));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <FormField label={pick('শ্রেণি', 'Class')}>
            <Select value={form.classId} onChange={(event) => setForm({ ...form, classId: event.target.value })}>
              {db.classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {className(schoolClass)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={pick('শাখার নাম', 'Section name')}>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="ক" />
          </FormField>
          <Switch checked={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} label={pick('সক্রিয়', 'Active')} />
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : editingId ? pick('হালনাগাদ', 'Update') : pick('শাখা যুক্ত করুন', 'Add section')}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={startCreate}>
                {pick('বাতিল', 'Cancel')}
              </Button>
            )}
          </div>
        </form>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-sm text-muted-foreground">
            <tr>
              <th className="p-3 text-left">{pick('শ্রেণি', 'Class')}</th>
              <th className="p-3 text-left">{pick('শাখা', 'Section')}</th>
              <th className="p-3 text-left">{pick('অবস্থা', 'Status')}</th>
              <th className="p-3 text-right">{pick('কাজ', 'Action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {db.sections.map((section) => {
              const schoolClass = db.classes.find((item) => item.id === section.classId);
              return (
                <tr key={section.id}>
                  <td className="p-3">{className(schoolClass)}</td>
                  <td className="p-3 font-medium">{section.name}</td>
                  <td className="p-3">
                    <StatusBadge
                      value={section.isActive ? 'ACTIVE' : 'INACTIVE'}
                      customLabel={section.isActive ? pick('সক্রিয়', 'Active') : pick('বন্ধ', 'Inactive')}
                      customTone={section.isActive ? 'success' : 'neutral'}
                    />
                  </td>
                  <td className="p-3 text-right">
                    <Button type="button" variant="outline" size="sm" onClick={() => startEdit(section)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
