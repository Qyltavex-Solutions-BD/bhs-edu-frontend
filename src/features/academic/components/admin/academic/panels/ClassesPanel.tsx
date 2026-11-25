'use client';

import React, { useMemo, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  useCreateSectionMutation,
  useGetAcademicGroupsQuery,
  useGetClassTeachersQuery,
  useGetSchoolClassesQuery,
  useGetSectionsQuery,
  useUpdateSectionMutation,
} from '@/src/services/academic';
import { useAppSelector } from '@/src/store/hooks';
import { Button, Card, FormField, Input, Modal, Switch } from '@/src/components/ui';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import type { SchoolClass, Section } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';
import { errorMessage } from './shared';
import { useAcademicI18n } from '../academic.i18n';
import { sectionSchema, type SectionFormValues } from '../academic.schema';

const isUuid = (id?: string | null) =>
  Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

const defaultSectionValues: SectionFormValues = {
  classId: '',
  name: '',
  isActive: true,
};

export function ClassesPanel({ db }: { db?: MockDatabase }) {
  const { isBn, t, dict } = useAcademicI18n();
  const selectedYearId = useAppSelector((state) => state.ui.selectedAcademicYearId);

  const { data: realClasses, isLoading: loadingClasses } = useGetSchoolClassesQuery();
  const { data: realSections } = useGetSectionsQuery();
  const { data: realGroups } = useGetAcademicGroupsQuery();
  const { data: realClassTeachers } = useGetClassTeachersQuery(
    isUuid(selectedYearId) ? { academicYearId: selectedYearId! } : undefined,
    { skip: !isUuid(selectedYearId) },
  );

  const classList = useMemo(() => {
    const raw = realClasses && realClasses.length > 0 ? realClasses : (db?.classes ?? []);
    const secondary = raw.filter((c) => c.numericValue >= 6 && c.numericValue <= 10);
    const list = secondary.length > 0 ? secondary : raw;
    return [...list].sort((a, b) => a.numericValue - b.numericValue);
  }, [realClasses, db?.classes]);

  const groupList = useMemo(() => {
    const raw = realGroups && realGroups.length > 0 ? realGroups : (db?.academicGroups ?? []);
    return raw.filter((g) => g.isActive);
  }, [realGroups, db?.academicGroups]);

  const [createSection, { isLoading: creatingSection }] = useCreateSectionMutation();
  const [updateSection, { isLoading: updatingSection }] = useUpdateSectionMutation();

  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [targetClass, setTargetClass] = useState<SchoolClass | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: defaultSectionValues,
  });

  const isSectionActive = watch('isActive');
  const savingSection = creatingSection || updatingSection;

  const openAddSection = (schoolClass: SchoolClass) => {
    setEditingSection(null);
    setTargetClass(schoolClass);
    reset({
      classId: schoolClass.id,
      name: '',
      isActive: true,
    });
    setSectionModalOpen(true);
  };

  const openEditSection = (schoolClass: SchoolClass, section: Section) => {
    setEditingSection(section);
    setTargetClass(schoolClass);
    reset({
      classId: section.classId,
      name: section.name,
      isActive: section.isActive,
    });
    setSectionModalOpen(true);
  };

  const closeSectionModal = () => {
    setEditingSection(null);
    setTargetClass(null);
    reset(defaultSectionValues);
    setSectionModalOpen(false);
  };

  const onSubmitSection = async (values: SectionFormValues) => {
    const trimmedName = values.name.trim();
    try {
      if (editingSection) {
        await updateSection({
          id: editingSection.id,
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
      closeSectionModal();
    } catch (err) {
      toast.error(
        errorMessage(
          err,
          editingSection ? t(dict.sections.updateFailed) : t(dict.sections.createFailed),
        ),
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  : (db?.sections?.filter((section) => section.classId === schoolClass.id) ?? []);

            const displayName = isBn
              ? schoolClass.nameBn || schoolClass.name
              : schoolClass.name;
            const secondaryName =
              schoolClass.nameBn && schoolClass.nameBn !== displayName
                ? ` (${schoolClass.nameBn})`
                : schoolClass.name !== displayName
                  ? ` (${schoolClass.name})`
                  : '';

            const isSeniorClass = schoolClass.numericValue >= 9;

            return (
              <Card key={schoolClass.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-primary">
                      {displayName}
                      {secondaryName && (
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          {secondaryName}
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <StatusBadge
                        value={schoolClass.isActive ? 'ACTIVE' : 'INACTIVE'}
                        customLabel={
                          schoolClass.isActive ? t(dict.common.active) : t(dict.common.inactive)
                        }
                        customTone={schoolClass.isActive ? 'success' : 'neutral'}
                      />
                      {schoolClass._count?.enrollments !== undefined && (
                        <span>
                          · {schoolClass._count.enrollments} {t(dict.classes.studentsCount)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openAddSection(schoolClass)}
                  >
                    <Plus className="w-4 h-4" />
                    {isBn ? 'শাখা যোগ' : 'Add section'}
                  </Button>
                </div>

                {isSeniorClass && groupList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-sm font-medium text-muted-foreground mr-1">
                      {isBn ? 'বিভাগ:' : 'Streams:'}
                    </span>
                    {groupList.map((group) => (
                      <span
                        key={group.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary"
                      >
                        {isBn ? group.nameBn || group.name : group.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="text-sm font-semibold text-muted-foreground">
                    {t(dict.classes.sectionsHeader)} ({sections.length})
                  </div>
                  {sections.length === 0 ? (
                    <p className="text-muted-foreground text-base">{t(dict.classes.noSections)}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {sections.map((section) => {
                        const realCt = realClassTeachers?.find(
                          (ct) => ct.sectionId === section.id,
                        );
                        const mockCt = db?.sectionClassTeachers?.find(
                          (assignment) =>
                            assignment.sectionId === section.id &&
                            assignment.academicYearId === selectedYearId,
                        );
                        const mockTeacher = mockCt
                          ? db?.staff?.find((member) => member.id === mockCt.staffId)
                          : null;
                        const teacherName = realCt?.staff?.name ?? mockTeacher?.name ?? '—';

                        return (
                          <div
                            key={section.id}
                            className="flex justify-between items-center gap-2 p-2.5 bg-surface-muted/50 rounded-lg text-base"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-medium text-foreground">
                                {t(dict.classes.secPrefix)} {section.name}
                              </span>
                              {!section.isActive && (
                                <span className="text-xs text-muted-foreground">
                                  {t(dict.classes.offBadge)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground truncate max-w-[160px]">
                                {teacherName}
                              </span>
                              <button
                                type="button"
                                onClick={() => openEditSection(schoolClass, section)}
                                className="p-1.5 rounded hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
                                title={t(dict.common.edit)}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Modal
        open={sectionModalOpen}
        onClose={closeSectionModal}
        title={
          editingSection
            ? `${targetClass ? (isBn ? targetClass.nameBn || targetClass.name : targetClass.name) + ' · ' : ''}${t(dict.sections.editTitle)}`
            : `${targetClass ? (isBn ? targetClass.nameBn || targetClass.name : targetClass.name) + ' · ' : ''}${t(dict.sections.newTitle)}`
        }
        description={
          isBn
            ? 'একই শ্রেণিতে শাখার নাম আলাদা হতে হবে (যেমন: ক, খ, গ)।'
            : 'Section names must be unique within the same class (e.g., A, B, C).'
        }
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmitSection)} className="space-y-4">
          <input type="hidden" {...register('classId')} />

          <FormField
            label={isBn ? 'শাখার নাম' : 'Section Name'}
            required
            error={errors.name?.message}
          >
            <Input
              {...register('name')}
              placeholder={isBn ? 'যেমন: ক, খ, গ' : 'e.g. A, B, C'}
            />
          </FormField>

          <div className="pt-1">
            <Switch
              checked={isSectionActive}
              onChange={(val) => setValue('isActive', val)}
              label={t(dict.common.active)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={closeSectionModal}>
              {t(dict.common.cancel)}
            </Button>
            <Button type="submit" variant="primary" disabled={savingSection}>
              {savingSection
                ? editingSection
                  ? t(dict.common.updating)
                  : t(dict.common.saving)
                : editingSection
                  ? t(dict.common.update)
                  : t(dict.common.save)}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
