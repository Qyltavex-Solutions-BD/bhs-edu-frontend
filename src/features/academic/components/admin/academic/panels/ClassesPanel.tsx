'use client';

import React, { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  useCreateSchoolClassMutation,
  useGetClassTeachersQuery,
  useGetSchoolClassesQuery,
  useGetSectionsQuery,
  useUpdateSchoolClassMutation,
} from '@/src/services/academic';
import { useAppSelector } from '@/src/store/hooks';
import { Button, Card, FormField, Input, Modal, Switch } from '@/src/components/ui';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import type { SchoolClass } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';
import { errorMessage } from './shared';
import { useAcademicI18n } from '../academic.i18n';
import { classSchema, type ClassFormValues } from '../academic.schema';

const isUuid = (id?: string | null) =>
  Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

const defaultValues: ClassFormValues = {
  name: '',
  nameBn: '',
  numericValue: '',
  isActive: true,
};

export function ClassesPanel({ db }: { db?: MockDatabase }) {
  const { isBn, t, dict } = useAcademicI18n();
  const selectedYearId = useAppSelector((state) => state.ui.selectedAcademicYearId);

  const { data: realClasses, isLoading: loadingClasses } = useGetSchoolClassesQuery();
  const { data: realSections } = useGetSectionsQuery();
  const { data: realClassTeachers } = useGetClassTeachersQuery(
    isUuid(selectedYearId) ? { academicYearId: selectedYearId! } : undefined,
    { skip: !isUuid(selectedYearId) }
  );

  const classList = realClasses && realClasses.length > 0 ? realClasses : (db?.classes ?? []);

  const [createSchoolClass, { isLoading: creating }] = useCreateSchoolClassMutation();
  const [updateSchoolClass, { isLoading: updating }] = useUpdateSchoolClassMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
    setModalOpen(true);
  };

  const startEdit = (schoolClass: SchoolClass) => {
    setEditingId(schoolClass.id);
    reset({
      name: schoolClass.name,
      nameBn: schoolClass.nameBn ?? '',
      numericValue: String(schoolClass.numericValue),
      isActive: schoolClass.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingId(null);
    reset(defaultValues);
    setModalOpen(false);
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
        await createSchoolClass({
          name: trimmedName,
          nameBn: trimmedNameBn,
          numericValue: numVal,
          isActive: values.isActive,
        }).unwrap();
        toast.success(t(dict.classes.createSuccess));
      }
      closeModal();
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {isBn ? 'শ্রেণি ব্যবস্থাপনা' : 'Class Management'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isBn
              ? 'প্রতিষ্ঠানের শ্রেণিসমূহ তৈরি ও হালনাগাদ করুন। শাখা যুক্ত করতে পাশের "শাখা" ট্যাব ব্যবহার করুন।'
              : 'Create and manage classes. Use the "Sections" tab to add or manage sections.'}
          </p>
        </div>
        <Button type="button" variant="primary" onClick={startCreate}>
          <Plus className="w-4 h-4" />
          {t(dict.classes.newTitle)}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loadingClasses && classList.length === 0 ? (
          <div className="col-span-full text-center py-8 text-base text-muted-foreground">
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
              <Card key={schoolClass.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-primary">
                      {displayName}
                      {secondaryName && (
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          {secondaryName}
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {t(dict.classes.numericBadge)}: {schoolClass.numericValue}
                      </span>
                      <StatusBadge
                        value={schoolClass.isActive ? 'ACTIVE' : 'INACTIVE'}
                        customLabel={
                          schoolClass.isActive ? t(dict.common.active) : t(dict.common.inactive)
                        }
                        customTone={schoolClass.isActive ? 'success' : 'neutral'}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(schoolClass)}
                    title={t(dict.common.edit)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="text-sm font-semibold text-muted-foreground flex justify-between">
                    <span>{t(dict.classes.sectionsHeader)}</span>
                    {schoolClass._count?.enrollments !== undefined && (
                      <span>
                        {schoolClass._count.enrollments} {t(dict.classes.studentsCount)}
                      </span>
                    )}
                  </div>
                  {sections.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      {t(dict.classes.noSections)}
                    </p>
                  )}
                  {sections.map((section) => {
                    const realCt = realClassTeachers?.find(
                      (ct) => ct.sectionId === section.id
                    );
                    const mockCt = db?.sectionClassTeachers?.find(
                      (assignment) =>
                        assignment.sectionId === section.id &&
                        assignment.academicYearId === selectedYearId
                    );
                    const mockTeacher = mockCt
                      ? db?.staff?.find((member) => member.id === mockCt.staffId)
                      : null;
                    const teacherName = realCt?.staff?.name ?? mockTeacher?.name ?? '—';

                    return (
                      <div
                        key={section.id}
                        className="flex justify-between items-center p-2.5 bg-surface-muted/50 rounded-lg text-sm"
                      >
                        <span className="font-medium text-foreground">
                          {t(dict.classes.secPrefix)} {section.name}
                          {!section.isActive ? t(dict.classes.offBadge) : ''}
                        </span>
                        <span className="text-muted-foreground truncate max-w-[160px]">
                          {teacherName}
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

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? t(dict.classes.editTitle) : t(dict.classes.newTitle)}
        description={
          isBn
            ? 'শ্রেণির ইংরেজি ও বাংলা নাম এবং ক্রমিক শ্রেণি নম্বর নির্ধারণ করুন।'
            : 'Configure the class English/Bengali names and numeric value.'
        }
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              placeholder={isBn ? 'যেমন: ৬' : 'e.g. 6'}
            />
          </FormField>

          <div className="pt-1">
            <Switch
              checked={isActive}
              onChange={(val) => setValue('isActive', val)}
              label={t(dict.common.active)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={closeModal}>
              {t(dict.common.cancel)}
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? editingId
                  ? t(dict.common.updating)
                  : t(dict.common.saving)
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
