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
import { sectionSchema, type SectionFormValues } from '../academic.schema';

const defaultValues: SectionFormValues = {
  classId: '',
  name: '',
  isActive: true,
};

export function SectionsPanel({ db }: { db?: MockDatabase }) {

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
    schoolClass?.nameBn || schoolClass?.name;

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
        toast.success('শাখা সফলভাবে আপডেট হয়েছে।');
      } else {
        await createSection({
          classId: values.classId,
          name: trimmedName,
          isActive: values.isActive,
        }).unwrap();
        toast.success('নতুন শাখা সফলভাবে যুক্ত হয়েছে।');
      }
      closeModal();
    } catch (err) {
      toast.error(
        errorMessage(
          err,
          editingId ? 'শাখা আপডেট করা যায়নি।' : 'শাখা তৈরি করা যায়নি।'
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
            {'শাখা ব্যবস্থাপনা'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {'প্রতিটি শ্রেণির জন্য ক, খ বা প্রয়োজনমতো শাখা যুক্ত ও পরিচালনা করুন।'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-44"
          >
            <option value="all">{'সকল শ্রেণি'}</option>
            {classList.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {className(cls)}
              </option>
            ))}
          </Select>

          <Button type="button" variant="primary" onClick={startCreate}>
            <Plus className="w-4 h-4" />
            {'নতুন শাখা তৈরি'}
          </Button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-base">
          <thead className="bg-surface-muted text-sm text-muted-foreground">
            <tr>
              <th className="p-3.5 text-left">{'শ্রেণি'}</th>
              <th className="p-3.5 text-left">{'শাখা'}</th>
              <th className="p-3.5 text-left">{'অবস্থা'}</th>
              <th className="p-3.5 text-right">{'কাজ'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loadingSections && visibleSections.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-base text-muted-foreground">
                  {'শাখার তালিকা লোড হচ্ছে...'}
                </td>
              </tr>
            ) : visibleSections.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-base text-muted-foreground">
                  {'এই শ্রেণিতে কোনো শাখা পাওয়া যায়নি।'}
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
                        customLabel={section.isActive ? 'সক্রিয়' : 'বন্ধ'}
                        customTone={section.isActive ? 'success' : 'neutral'}
                      />
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(section)}
                        title={'সম্পাদনা'}
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
        title={editingId ? 'শাখা সম্পাদনা' : 'নতুন শাখা তৈরি'}
        description={
          'সংশ্লিষ্ট শ্রেণি নির্বাচন করে শাখার নাম নির্ধারণ করুন।'
        }
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label={'শ্রেণি'} required error={errors.classId?.message}>
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

          <FormField label={'শাখার নাম'} required error={errors.name?.message}>
            <Input
              {...register('name')}
              placeholder={'যেমন: ক, খ, A, B'}
              maxLength={50}
            />
          </FormField>

          <div className="pt-1">
            <Switch
              checked={isActive}
              onChange={(val) => setValue('isActive', val)}
              label={'সক্রিয়'}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={closeModal}>
              {'বাতিল'}
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? editingId
                  ? 'আপডেট হচ্ছে...'
                  : 'সংরক্ষণ হচ্ছে...'
                : editingId
                  ? 'হালনাগাদ করুন'
                  : 'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
