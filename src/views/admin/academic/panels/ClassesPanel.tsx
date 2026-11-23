'use client';

import React, { useState } from 'react';
import { Pencil, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateSchoolClassMutation,
  useGetSchoolClassesQuery,
  useUpdateSchoolClassMutation,
} from '@/src/services/academic/class.api';
import { useAppSelector } from '@/src/store/hooks';
import { useI18n } from '@/src/lib/i18n';
import { Button, Card, FormField, Input, Switch } from '@/src/components/ui/primitives';
import type { MockDatabase } from '@/src/mocks/seed';
import { errorMessage } from './shared';

const emptyClass = { name: '', nameBn: '', numericValue: '', sectionNames: '', isActive: true };

export function ClassesPanel({ db }: { db: MockDatabase }) {
  const { locale, pick } = useI18n();
  const selectedYearId = useAppSelector((state) => state.ui.selectedAcademicYearId);
  const { data: realClasses, isLoading: loadingClasses } = useGetSchoolClassesQuery();
  const [createSchoolClass, { isLoading: creating }] = useCreateSchoolClassMutation();
  const [updateSchoolClass, { isLoading: updating }] = useUpdateSchoolClassMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyClass);

  const saving = creating || updating;

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyClass);
  };

  const classList = realClasses && realClasses.length > 0 ? realClasses : db.classes;

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = form.name.trim();
    const trimmedNameBn = form.nameBn.trim() || undefined;
    const numVal = parseInt(form.numericValue, 10);

    if (!trimmedName) {
      toast.error(pick('শ্রেণির নাম আবশ্যক।', 'Class name is required.'));
      return;
    }

    if (isNaN(numVal) || numVal < 1) {
      toast.error(pick('শ্রেণি নম্বর ১ বা তার বেশি হতে হবে।', 'Class number must be 1 or greater.'));
      return;
    }

    try {
      if (editingId) {
        // Class Update API Call (PATCH /academic/classes/:id)
        await updateSchoolClass({
          id: editingId,
          name: trimmedName,
          nameBn: trimmedNameBn,
          numericValue: numVal,
          isActive: form.isActive,
        }).unwrap();

        toast.success(pick('শ্রেণি সফলভাবে হালনাগাদ হয়েছে।', 'Class updated successfully.'));
      } else {
        // Class Create API Call (POST /academic/classes)
        const sections = form.sectionNames
          .split(/[,،\n]/)
          .map((name) => name.trim())
          .filter(Boolean);

        await createSchoolClass({
          name: trimmedName,
          nameBn: trimmedNameBn,
          numericValue: numVal,
          isActive: form.isActive,
          sections,
        }).unwrap();

        toast.success(pick('নতুন শ্রেণি সফলভাবে যুক্ত হয়েছে।', 'Class created successfully.'));
      }
      startCreate();
    } catch (err) {
      toast.error(
        errorMessage(
          err,
          editingId
            ? pick('শ্রেণি হালনাগাদ করা যায়নি।', 'Could not update the class.')
            : pick('শ্রেণি সংরক্ষণ করা যায়নি।', 'Could not save the class.')
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-bold">
            {editingId ? pick('শ্রেণি সম্পাদনা', 'Edit class') : pick('নতুন শ্রেণি তৈরি', 'New class')}
          </h3>
        </div>
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <FormField label={pick('ইংরেজি নাম', 'English name')}>
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="e.g. Class 6"
              maxLength={50}
              required
            />
          </FormField>
          <FormField label={pick('বাংলা নাম', 'Bangla name')}>
            <Input
              value={form.nameBn}
              onChange={(event) => setForm({ ...form, nameBn: event.target.value })}
              placeholder="যেমন: ৬ষ্ঠ শ্রেণি"
              maxLength={50}
            />
          </FormField>
          <FormField label={pick('শ্রেণি নম্বর (ক্রমিক)', 'Class number')}>
            <Input
              type="number"
              min={1}
              max={12}
              value={form.numericValue}
              onChange={(event) => setForm({ ...form, numericValue: event.target.value })}
              placeholder="e.g. 6"
              required
            />
          </FormField>
          {!editingId && (
            <FormField label={pick('শাখা (কমা দিয়ে পৃথক করুন)', 'Sections (comma separated)')}>
              <Input
                value={form.sectionNames}
                onChange={(event) => setForm({ ...form, sectionNames: event.target.value })}
                placeholder="A, B, C বা ক, খ"
              />
            </FormField>
          )}
          <div className="flex items-center gap-2 pb-1">
            <Switch
              checked={form.isActive}
              onChange={(isActive) => setForm({ ...form, isActive })}
              label={pick('সক্রিয়', 'Active')}
            />
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? editingId
                  ? pick('আপডেট হচ্ছে...', 'Updating...')
                  : pick('সংরক্ষণ হচ্ছে...', 'Saving...')
                : editingId
                  ? pick('আপডেট করুন', 'Update')
                  : pick('সংরক্ষণ করুন', 'Save')}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loadingClasses && classList.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {pick('শ্রেণির তালিকা লোড হচ্ছে...', 'Loading classes...')}
          </div>
        ) : (
          classList.map((schoolClass) => {
            const sections =
              schoolClass.sections && schoolClass.sections.length > 0
                ? schoolClass.sections
                : db.sections.filter((section) => section.classId === schoolClass.id);

            const displayName =
              locale === 'bn'
                ? schoolClass.nameBn || schoolClass.name
                : schoolClass.name;
            const secondaryName =
              schoolClass.nameBn && schoolClass.nameBn !== displayName
                ? ` (${schoolClass.nameBn})`
                : schoolClass.name !== displayName
                  ? ` (${schoolClass.name})`
                  : '';

            return (
              <Card key={schoolClass.id} className="p-5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-primary">
                      {displayName}
                      {secondaryName && (
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          {secondaryName}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {pick('নম্বর', 'Numeric')}: {schoolClass.numericValue} ·{' '}
                      {schoolClass.isActive
                        ? pick('সক্রিয়', 'Active')
                        : pick('নিষ্ক্রিয়', 'Inactive')}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(schoolClass.id);
                        setForm({
                          name: schoolClass.name,
                          nameBn: schoolClass.nameBn ?? '',
                          numericValue: String(schoolClass.numericValue),
                          sectionNames: '',
                          isActive: schoolClass.isActive,
                        });
                      }}
                      title={pick('সম্পাদনা করুন', 'Edit')}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm pt-1 border-t border-border/40">
                  <div className="text-xs font-semibold text-muted-foreground flex justify-between">
                    <span>{pick('শাখা সমূহ', 'Sections')}</span>
                    {schoolClass._count?.enrollments !== undefined && (
                      <span>
                        {schoolClass._count.enrollments} {pick('শিক্ষার্থী', 'students')}
                      </span>
                    )}
                  </div>
                  {sections.length === 0 && (
                    <p className="text-muted-foreground text-xs">
                      {pick('এখনো কোনো শাখা নেই।', 'No sections yet.')}
                    </p>
                  )}
                  {sections.map((section) => {
                    const classTeacher = db.sectionClassTeachers?.find(
                      (assignment) =>
                        assignment.sectionId === section.id &&
                        assignment.academicYearId === selectedYearId
                    );
                    const teacher = classTeacher
                      ? db.staff?.find((member) => member.id === classTeacher.staffId)
                      : null;
                    return (
                      <div
                        key={section.id}
                        className="flex justify-between items-center p-2 bg-surface-muted/50 rounded text-xs"
                      >
                        <span className="font-medium">
                          {pick('শাখা', 'Sec')} {section.name}
                          {!section.isActive ? pick(' (বন্ধ)', ' (off)') : ''}
                        </span>
                        <span className="text-muted-foreground truncate max-w-[140px]">
                          {teacher?.name ?? '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
