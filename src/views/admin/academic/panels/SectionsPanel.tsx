'use client';

import React, { useEffect, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  useCreateSectionMutation,
  useGetSchoolClassesQuery,
  useGetSectionsQuery,
  useUpdateSectionMutation,
} from '@/src/services/academic';
import { Button, Card, FormField, Input, Select, Switch } from '@/src/components/ui';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import type { SchoolClass, Section } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';
import { errorMessage } from './shared';
import { useAcademicI18n } from '../academic.i18n';
import { sectionSchema, type SectionFormValues } from '../academic.schema';

const defaultValues: SectionFormValues = {
  classId: '',
  name: '',
  isActive: true,
};

export function SectionsPanel({ db }: { db?: MockDatabase }) {
  const { isBn, t, dict } = useAcademicI18n();

  // Load classes and sections from backend
  const { data: realClasses } = useGetSchoolClassesQuery();
  const classList = realClasses && realClasses.length > 0 ? realClasses : (db?.classes ?? []);

  const { data: realSections, isLoading: loadingSections } = useGetSectionsQuery();
  const sectionList = realSections && realSections.length > 0 ? realSections : (db?.sections ?? []);

  const [createSection, { isLoading: creating }] = useCreateSectionMutation();
  const [updateSection, { isLoading: updating }] = useUpdateSectionMutation();

  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      ...defaultValues,
      classId: classList[0]?.id ?? '',
    },
  });

  const selectedClassId = watch('classId');
  const isActive = watch('isActive');
  const saving = creating || updating;

  useEffect(() => {
    if (!selectedClassId && classList.length > 0) {
      setValue('classId', classList[0].id, { shouldValidate: true });
    }
  }, [classList, selectedClassId, setValue]);

  const className = (schoolClass?: SchoolClass) =>
    isBn ? schoolClass?.nameBn || schoolClass?.name : schoolClass?.name;

  const startCreate = () => {
    setEditingId(null);
    reset({
      ...defaultValues,
      classId: classList[0]?.id ?? '',
    });
  };

  const startEdit = (section: Section) => {
    setEditingId(section.id);
    reset({
      classId: section.classId,
      name: section.name,
      isActive: section.isActive,
    });
  };

  const onSubmit = async (values: SectionFormValues) => {
    const trimmedName = values.name.trim();

    try {
      if (editingId) {
        await updateSection({
          id: editingId,
          name: trimmedName,
          isActive: values.isActive,
        }).unwrap();
        toast.success(t(dict.sections.updateSuccess));
      } else {
        await createSection({
          classId: values.classId,
          name: trimmedName,
          isActive: values.isActive,
        }).unwrap();
        toast.success(t(dict.sections.createSuccess));
      }
      startCreate();
    } catch (err) {
      toast.error(
        errorMessage(
          err,
          editingId ? t(dict.sections.updateFailed) : t(dict.sections.createFailed)
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="pb-3">
          <h3 className="text-base font-bold">
            {editingId ? t(dict.sections.editTitle) : t(dict.sections.newTitle)}
          </h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <FormField label={t(dict.sections.classLabel)} required error={errors.classId?.message}>
            <Select
              value={selectedClassId}
              onChange={(e) => setValue('classId', e.target.value, { shouldValidate: true })}
              disabled={Boolean(editingId)}
            >
              {classList.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {className(schoolClass)}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={t(dict.sections.sectionNameLabel)} required error={errors.name?.message}>
            <Input
              {...register('name')}
              placeholder={t(dict.sections.sectionPlaceholder)}
              maxLength={50}
            />
          </FormField>

          <div className="flex items-center gap-2 pb-1">
            <Switch
              checked={isActive}
              onChange={(val) => setValue('isActive', val)}
              label={t(dict.common.active)}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? editingId
                  ? t(dict.common.updating)
                  : t(dict.common.saving)
                : editingId
                  ? t(dict.common.update)
                  : t(dict.common.save)}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={startCreate}>
                <X className="w-4 h-4 mr-1" />
                {t(dict.common.cancel)}
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-sm text-muted-foreground">
            <tr>
              <th className="p-3 text-left">{t(dict.sections.classColumn)}</th>
              <th className="p-3 text-left">{t(dict.sections.sectionColumn)}</th>
              <th className="p-3 text-left">{t(dict.common.status)}</th>
              <th className="p-3 text-right">{t(dict.sections.actionColumn)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loadingSections && sectionList.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  {t(dict.sections.loadingSections)}
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
                        customLabel={section.isActive ? t(dict.common.active) : t(dict.common.inactive)}
                        customTone={section.isActive ? 'success' : 'neutral'}
                      />
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(section)}
                        title={t(dict.common.edit)}
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
