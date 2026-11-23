'use client';

import React, { useEffect, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { useGetSchoolClassesQuery } from '@/src/services/academic/class.api';
import {
  useCreateSectionMutation,
  useGetSectionsQuery,
  useUpdateSectionMutation,
} from '@/src/services/academic/section.api';
import { useI18n } from '@/src/lib/i18n';
import { Button, Card, FormField, Input, Select, Switch } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import type { SchoolClass, Section } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';
import { errorMessage } from './shared';

const emptySection = { classId: '', name: '', isActive: true };

export function SectionsPanel({ db }: { db: MockDatabase }) {
  const { locale, pick } = useI18n();

  // Load classes for the dropdown
  const { data: realClasses } = useGetSchoolClassesQuery();
  const classList = realClasses && realClasses.length > 0 ? realClasses : db.classes;

  // Load sections from real backend with fallback
  const { data: realSections, isLoading: loadingSections } = useGetSectionsQuery();
  const sectionList = realSections && realSections.length > 0 ? realSections : db.sections;

  const [createSection, { isLoading: creating }] = useCreateSectionMutation();
  const [updateSection, { isLoading: updating }] = useUpdateSectionMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof emptySection>({
    ...emptySection,
    classId: classList[0]?.id ?? '',
  });

  const saving = creating || updating;

  useEffect(() => {
    if (!form.classId && classList.length > 0) {
      setForm((prev) => ({ ...prev, classId: classList[0].id }));
    }
  }, [classList, form.classId]);

  const className = (schoolClass?: SchoolClass) =>
    locale === 'bn' ? schoolClass?.nameBn || schoolClass?.name : schoolClass?.name;

  const startCreate = () => {
    setEditingId(null);
    setForm({ ...emptySection, classId: classList[0]?.id ?? '' });
  };

  const startEdit = (section: Section) => {
    setEditingId(section.id);
    setForm({ classId: section.classId, name: section.name, isActive: section.isActive });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = form.name.trim();

    if (!form.classId) {
      toast.error(pick('শ্রেণি নির্বাচন করুন।', 'Please select a class.'));
      return;
    }

    if (!trimmedName) {
      toast.error(pick('শাখার নাম আবশ্যক।', 'Section name is required.'));
      return;
    }

    try {
      if (editingId) {
        await updateSection({
          id: editingId,
          name: trimmedName,
          isActive: form.isActive,
        }).unwrap();
        toast.success(pick('শাখা সফলভাবে আপডেট হয়েছে।', 'Section updated successfully.'));
      } else {
        await createSection({
          classId: form.classId,
          name: trimmedName,
          isActive: form.isActive,
        }).unwrap();
        toast.success(pick('নতুন শাখা সফলভাবে যুক্ত হয়েছে।', 'Section created successfully.'));
      }
      startCreate();
    } catch (err) {
      toast.error(
        errorMessage(
          err,
          editingId
            ? pick('শাখা আপডেট করা যায়নি।', 'Could not update the section.')
            : pick('শাখা তৈরি করা যায়নি।', 'Could not create the section.')
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="pb-3">
          <h3 className="text-base font-bold">
            {editingId ? pick('শাখা সম্পাদনা', 'Edit section') : pick('নতুন শাখা তৈরি', 'New section')}
          </h3>
        </div>
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <FormField label={pick('শ্রেণি', 'Class')}>
            <Select
              value={form.classId}
              onChange={(event) => setForm({ ...form, classId: event.target.value })}
              disabled={Boolean(editingId)}
            >
              {classList.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {className(schoolClass)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={pick('শাখার নাম', 'Section name')}>
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="e.g. ক, খ, A, B"
              maxLength={50}
              required
            />
          </FormField>
          <div className="flex items-center gap-2 pb-1">
            <Switch
              checked={form.isActive}
              onChange={(isActive) => setForm({ ...form, isActive })}
              label={pick('সক্রিয়', 'Active')}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? editingId
                  ? pick('আপডেট হচ্ছে...', 'Updating...')
                  : pick('সংরক্ষণ হচ্ছে...', 'Saving...')
                : editingId
                  ? pick('আপডেট করুন', 'Update')
                  : pick('শাখা যুক্ত করুন', 'Add section')}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={startCreate}>
                <X className="w-4 h-4 mr-1" />
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
            {loadingSections && sectionList.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  {pick('শাখার তালিকা লোড হচ্ছে...', 'Loading sections...')}
                </td>
              </tr>
            ) : (
              sectionList.map((section) => {
                const schoolClass = classList.find((item) => item.id === section.classId);
                return (
                  <tr key={section.id}>
                    <td className="p-3 font-medium">{className(schoolClass) ?? '—'}</td>
                    <td className="p-3 font-semibold text-primary">{section.name}</td>
                    <td className="p-3">
                      <StatusBadge
                        value={section.isActive ? 'ACTIVE' : 'INACTIVE'}
                        customLabel={section.isActive ? pick('সক্রিয়', 'Active') : pick('বন্ধ', 'Inactive')}
                        customTone={section.isActive ? 'success' : 'neutral'}
                      />
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(section)}
                        title={pick('সম্পাদনা করুন', 'Edit')}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
