'use client';

import React, { useEffect, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  useCreateSectionMutation,
  useGetSchoolClassesQuery,
  useGetSectionsQuery,
  useUpdateSectionMutation,
} from '@/src/services/academic';
import { Button, Card, FormField, Input, Modal, Select, Switch } from '@/src/components/ui';
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

  const { data: realClasses } = useGetSchoolClassesQuery();
  const classList = realClasses && realClasses.length > 0 ? realClasses : (db?.classes ?? []);

  const { data: realSections, isLoading: loadingSections } = useGetSectionsQuery();
  const sectionList = realSections && realSections.length > 0 ? realSections : (db?.sections ?? []);

  const [createSection, { isLoading: creating }] = useCreateSectionMutation();
  const [updateSection, { isLoading: updating }] = useUpdateSectionMutation();

  const [classFilter, setClassFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
      classId: classFilter !== 'all' ? classFilter : (classList[0]?.id ?? ''),
    });
    setModalOpen(true);
  };

  const startEdit = (section: Section) => {
    setEditingId(section.id);
    reset({
      classId: section.classId,
      name: section.name,
      isActive: section.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingId(null);
    reset({
      ...defaultValues,
      classId: classList[0]?.id ?? '',
    });
    setModalOpen(false);
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
      closeModal();
    } catch (err) {
      toast.error(
        errorMessage(
          err,
          editingId ? t(dict.sections.updateFailed) : t(dict.sections.createFailed)
        )
      );
    }
  };

  const visibleSections =
    classFilter === 'all'
      ? sectionList
      : sectionList.filter((s) => s.classId === classFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {isBn ? 'শাখা ব্যবস্থাপনা' : 'Section Management'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isBn
              ? 'প্রতিটি শ্রেণির জন্য ক, খ বা প্রয়োজনমতো শাখা যুক্ত ও পরিচালনা করুন।'
              : 'Add and manage sections (e.g., A, B) for each school class.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-44"
          >
            <option value="all">{isBn ? 'সকল শ্রেণি' : 'All classes'}</option>
            {classList.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {className(cls)}
              </option>
            ))}
          </Select>

          <Button type="button" variant="primary" onClick={startCreate}>
            <Plus className="w-4 h-4" />
            {t(dict.sections.newTitle)}
          </Button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-base">
          <thead className="bg-surface-muted text-sm text-muted-foreground">
            <tr>
              <th className="p-3.5 text-left">{t(dict.sections.classColumn)}</th>
              <th className="p-3.5 text-left">{t(dict.sections.sectionColumn)}</th>
              <th className="p-3.5 text-left">{t(dict.common.status)}</th>
              <th className="p-3.5 text-right">{t(dict.sections.actionColumn)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loadingSections && visibleSections.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-base text-muted-foreground">
                  {t(dict.sections.loadingSections)}
                </td>
              </tr>
            ) : visibleSections.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-base text-muted-foreground">
                  {isBn ? 'এই শ্রেণিতে কোনো শাখা পাওয়া যায়নি।' : 'No sections found.'}
                </td>
              </tr>
            ) : (
              visibleSections.map((section) => {
                const schoolClass = classList.find((item) => item.id === section.classId);
                return (
                  <tr key={section.id} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="p-3.5 font-medium text-foreground">
                      {className(schoolClass) ?? '—'}
                    </td>
                    <td className="p-3.5 font-semibold text-primary">{section.name}</td>
                    <td className="p-3.5">
                      <StatusBadge
                        value={section.isActive ? 'ACTIVE' : 'INACTIVE'}
                        customLabel={section.isActive ? t(dict.common.active) : t(dict.common.inactive)}
                        customTone={section.isActive ? 'success' : 'neutral'}
                      />
                    </td>
                    <td className="p-3.5 text-right">
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

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? t(dict.sections.editTitle) : t(dict.sections.newTitle)}
        description={
          isBn
            ? 'সংশ্লিষ্ট শ্রেণি নির্বাচন করে শাখার নাম নির্ধারণ করুন।'
            : 'Select the class and enter the section name.'
        }
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
