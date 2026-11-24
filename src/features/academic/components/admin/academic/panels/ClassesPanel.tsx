'use client';

import React, { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  useCreateSchoolClassMutation,
  useGetSchoolClassesQuery,
  useGetSectionsQuery,
  useUpdateSchoolClassMutation,
} from '@/src/services/academic';
import { useAppSelector } from '@/src/store/hooks';
import { Button, Card, FormField, Input, Switch } from '@/src/components/ui';
import type { MockDatabase } from '@/src/mocks/seed';
import { errorMessage } from './shared';
import { useAcademicI18n } from '../academic.i18n';
import { classSchema, type ClassFormValues } from '../academic.schema';

const defaultValues: ClassFormValues = {
  name: '',
  nameBn: '',
  numericValue: '',
  sectionNames: '',
  isActive: true,
};

export function ClassesPanel({ db }: { db?: MockDatabase }) {
  const { isBn, t, dict } = useAcademicI18n();
  const selectedYearId = useAppSelector((state) => state.ui.selectedAcademicYearId);

  // Live classes and sections from backend
  const { data: realClasses, isLoading: loadingClasses } = useGetSchoolClassesQuery();
  const { data: realSections } = useGetSectionsQuery();
  const classList = realClasses && realClasses.length > 0 ? realClasses : (db?.classes ?? []);

  const [createSchoolClass, { isLoading: creating }] = useCreateSchoolClassMutation();
  const [updateSchoolClass, { isLoading: updating }] = useUpdateSchoolClassMutation();

  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues,
  });

  const isActive = watch('isActive');
  const saving = creating || updating;

  const startCreate = () => {
    setEditingId(null);
    reset(defaultValues);
  };

  const onSubmit = async (values: ClassFormValues) => {
    const trimmedName = values.name.trim();
    const trimmedNameBn = values.nameBn?.trim() || undefined;
    const numVal = parseInt(values.numericValue, 10);

    try {
      if (editingId) {
        await updateSchoolClass({
          id: editingId,
          name: trimmedName,
          nameBn: trimmedNameBn,
          numericValue: numVal,
          isActive: values.isActive,
        }).unwrap();
        toast.success(t(dict.classes.updateSuccess));
      } else {
        const sections = (values.sectionNames || '')
          .split(/[,،\n]/)
          .map((name) => name.trim())
          .filter(Boolean);

        await createSchoolClass({
          name: trimmedName,
          nameBn: trimmedNameBn,
          numericValue: numVal,
          isActive: values.isActive,
          sections,
        }).unwrap();
        toast.success(t(dict.classes.createSuccess));
      }
      startCreate();
    } catch (err) {
      toast.error(
        errorMessage(
          err,
          editingId ? t(dict.classes.updateFailed) : t(dict.classes.createFailed)
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-bold">
            {editingId ? t(dict.classes.editTitle) : t(dict.classes.newTitle)}
          </h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <FormField label={t(dict.classes.nameEnLabel)} required error={errors.name?.message}>
            <Input
              {...register('name')}
              placeholder={t(dict.classes.nameEnPlaceholder)}
            />
          </FormField>

          <FormField label={t(dict.classes.nameBnLabel)} error={errors.nameBn?.message}>
            <Input
              {...register('nameBn')}
              placeholder={t(dict.classes.nameBnPlaceholder)}
            />
          </FormField>

          <FormField label={t(dict.classes.numericLabel)} required error={errors.numericValue?.message}>
            <Input
              type="number"
              min={1}
              max={12}
              {...register('numericValue')}
              placeholder="e.g. 6"
            />
          </FormField>

          {!editingId && (
            <FormField label={t(dict.classes.sectionsLabel)} error={errors.sectionNames?.message}>
              <Input
                {...register('sectionNames')}
                placeholder={t(dict.classes.sectionsPlaceholder)}
              />
            </FormField>
          )}

          <div className="flex items-center gap-2 pb-1">
            <Switch
              checked={isActive}
              onChange={(val) => setValue('isActive', val)}
              label={t(dict.common.active)}
            />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loadingClasses && classList.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {t(dict.classes.loadingClasses)}
          </div>
        ) : (
          classList.map((schoolClass) => {
            const sections =
              schoolClass.sections && schoolClass.sections.length > 0
                ? schoolClass.sections
                : realSections && realSections.length > 0
                  ? realSections.filter((section) => section.classId === schoolClass.id)
                  : db?.sections?.filter((section) => section.classId === schoolClass.id) ?? [];

            const displayName = isBn
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
                      {t(dict.classes.numericBadge)}: {schoolClass.numericValue} ·{' '}
                      {schoolClass.isActive
                        ? t(dict.common.active)
                        : t(dict.common.inactive)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(schoolClass.id);
                        reset({
                          name: schoolClass.name,
                          nameBn: schoolClass.nameBn ?? '',
                          numericValue: String(schoolClass.numericValue),
                          sectionNames: '',
                          isActive: schoolClass.isActive,
                        });
                      }}
                      title={t(dict.common.edit)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm pt-1 border-t border-border/40">
                  <div className="text-xs font-semibold text-muted-foreground flex justify-between">
                    <span>{t(dict.classes.sectionsHeader)}</span>
                    {schoolClass._count?.enrollments !== undefined && (
                      <span>
                        {schoolClass._count.enrollments} {t(dict.classes.studentsCount)}
                      </span>
                    )}
                  </div>
                  {sections.length === 0 && (
                    <p className="text-muted-foreground text-xs">
                      {t(dict.classes.noSections)}
                    </p>
                  )}
                  {sections.map((section) => {
                    const classTeacher = db?.sectionClassTeachers?.find(
                      (assignment) =>
                        assignment.sectionId === section.id &&
                        assignment.academicYearId === selectedYearId
                    );
                    const teacher = classTeacher
                      ? db?.staff?.find((member) => member.id === classTeacher.staffId)
                      : null;
                    return (
                      <div
                        key={section.id}
                        className="flex justify-between items-center p-2 bg-surface-muted/50 rounded text-xs"
                      >
                        <span className="font-medium">
                          {t(dict.classes.secPrefix)} {section.name}
                          {!section.isActive ? t(dict.classes.offBadge) : ''}
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
