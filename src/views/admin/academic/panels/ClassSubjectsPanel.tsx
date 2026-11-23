'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  useAssignClassSubjectMutation,
  useDeleteClassSubjectMutation,
  useGetAcademicGroupsQuery,
  useGetAcademicYearsQuery,
  useGetClassSubjectsQuery,
  useGetSchoolClassesQuery,
  useGetSubjectsQuery,
  useRolloverClassSubjectsMutation,
  useToggleClassSubjectActiveMutation,
  useUpdateClassSubjectMutation,
} from '@/src/services/academic';
import { Button, Card, FormField, Select, Switch } from '@/src/components/ui';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { formatNumber } from '@/src/lib/formatters';
import type { AcademicGroup, AcademicYear, ClassSubject, SchoolClass, Subject } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';
import { errorMessage } from './shared';
import { useAcademicI18n } from '../academic.i18n';
import {
  assignClassSubjectSchema,
  type AssignClassSubjectFormValues,
} from '../academic.schema';

export function ClassSubjectsPanel({
  db,
  year,
}: {
  db?: MockDatabase;
  year: AcademicYear;
}) {
  const { isBn, locale, t, dict } = useAcademicI18n();

  // Queries
  const { data: realClasses } = useGetSchoolClassesQuery();
  const classList: SchoolClass[] =
    realClasses && realClasses.length > 0
      ? realClasses
      : (db?.classes ?? []);

  const { data: realGroups } = useGetAcademicGroupsQuery();
  const groupList: AcademicGroup[] =
    realGroups && realGroups.length > 0
      ? realGroups
      : (db?.academicGroups ?? []);

  const { data: realSubjects } = useGetSubjectsQuery();
  const subjectList: Subject[] =
    realSubjects && realSubjects.length > 0
      ? realSubjects
      : (db?.subjects ?? []);

  const { data: realYears } = useGetAcademicYearsQuery();
  const yearList: AcademicYear[] =
    realYears && realYears.length > 0
      ? realYears
      : (db?.academicYears ?? []);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [fromYearId, setFromYearId] = useState<string>('');

  // Set default classId once classes load
  useEffect(() => {
    if (!selectedClassId && classList.length > 0) {
      setSelectedClassId(classList[0].id);
    }
  }, [classList, selectedClassId]);

  // Set default fromYearId for rollover
  useEffect(() => {
    if (!fromYearId && yearList.length > 0) {
      const otherYear = yearList.find((item) => item.id !== year.id);
      if (otherYear) {
        setFromYearId(otherYear.id);
      }
    }
  }, [yearList, year.id, fromYearId]);

  // Class subjects query for this year
  const { data: realClassSubjects, isLoading: loadingClassSubjects } =
    useGetClassSubjectsQuery(
      selectedClassId
        ? { academicYearId: year.id, classId: selectedClassId }
        : { academicYearId: year.id }
    );

  const rawList: ClassSubject[] =
    realClassSubjects && realClassSubjects.length > 0
      ? realClassSubjects
      : (db?.classSubjects ?? []);

  // Mutations
  const [assignSubject, { isLoading: assigning }] = useAssignClassSubjectMutation();
  const [updateSubject] = useUpdateClassSubjectMutation();
  const [toggleActive] = useToggleClassSubjectActiveMutation();
  const [rollover, { isLoading: copying }] = useRolloverClassSubjectsMutation();
  const [deleteSubject, { isLoading: removing }] = useDeleteClassSubjectMutation();

  const currentClass = classList.find((c) => c.id === selectedClassId);
  const usesGroup = (currentClass?.numericValue ?? 0) >= 9;

  // React Hook Form for assigning subject
  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AssignClassSubjectFormValues>({
    resolver: zodResolver(assignClassSubjectSchema),
    defaultValues: {
      classId: selectedClassId || classList[0]?.id || '',
      subjectId: subjectList[0]?.id || '',
      groupId: '',
      isOptional: false,
    },
  });

  const formSubjectId = watch('subjectId');
  const formGroupId = watch('groupId');
  const formIsOptional = watch('isOptional');

  // Keep form classId in sync with selectedClassId
  useEffect(() => {
    if (selectedClassId) {
      setValue('classId', selectedClassId);
    }
  }, [selectedClassId, setValue]);

  // Set initial subjectId when subjectList loads
  useEffect(() => {
    if (!formSubjectId && subjectList.length > 0) {
      setValue('subjectId', subjectList[0].id);
    }
  }, [subjectList, formSubjectId, setValue]);

  const subjectLabel = (id: string) => {
    const item = subjectList.find((entry) => entry.id === id);
    return isBn ? item?.nameBn || item?.name || id : item?.name || id;
  };

  const groupLabel = (id?: string | null) => {
    if (!id) return t(dict.classSubjects.commonGroup);
    const item = groupList.find((entry) => entry.id === id);
    return isBn ? item?.nameBn || item?.name || id : item?.name || id;
  };

  // Filter subjects for the selected class and group filter
  const filteredSubjects = useMemo(() => {
    return rawList
      .filter((item) => item.academicYearId === year.id && item.classId === selectedClassId)
      .filter((item) => {
        if (!usesGroup || groupFilter === 'all') return true;
        if (groupFilter === 'common') return !item.groupId;
        return item.groupId === groupFilter;
      })
      .sort((a, b) => a.displayOrder - b.displayOrder || subjectLabel(a.subjectId).localeCompare(subjectLabel(b.subjectId)));
  }, [rawList, year.id, selectedClassId, usesGroup, groupFilter, subjectList, isBn]);

  const onAssign = async (values: AssignClassSubjectFormValues) => {
    try {
      await assignSubject({
        academicYearId: year.id,
        classId: values.classId,
        subjectId: values.subjectId,
        groupId: usesGroup ? (values.groupId || null) : null,
        isOptional: values.isOptional,
        displayOrder: filteredSubjects.length + 1,
      }).unwrap();
      toast.success(t(dict.classSubjects.assignSuccess));
      setValue('isOptional', false);
    } catch (err) {
      toast.error(errorMessage(err, t(dict.classSubjects.assignFailed)));
    }
  };

  const handleToggleOptional = async (item: ClassSubject) => {
    try {
      await updateSubject({
        id: item.id,
        isOptional: !item.isOptional,
      }).unwrap();
      toast.success(t(dict.classSubjects.updateSuccess));
    } catch (err) {
      toast.error(errorMessage(err, t(dict.classSubjects.updateFailed)));
    }
  };

  const handleToggleActive = async (item: ClassSubject) => {
    try {
      await toggleActive({
        id: item.id,
        isActive: !item.isActive,
      }).unwrap();
      toast.success(t(dict.classSubjects.updateSuccess));
    } catch (err) {
      toast.error(errorMessage(err, t(dict.classSubjects.updateFailed)));
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm(isBn ? 'আপনি কি নিশ্চিতভাবে এই বিষয়টি পাঠ্যক্রম থেকে সরাতে চান?' : 'Are you sure you want to remove this subject from the curriculum?')) {
      return;
    }
    try {
      await deleteSubject(id).unwrap();
      toast.success(t(dict.classSubjects.removeSuccess));
    } catch (err) {
      toast.error(errorMessage(err, t(dict.classSubjects.removeFailed)));
    }
  };

  const handleRollover = async () => {
    if (!fromYearId) return;
    try {
      const result = await rollover({
        fromAcademicYearId: fromYearId,
        toAcademicYearId: year.id,
      }).unwrap();
      toast.success(
        isBn
          ? `${formatNumber(result.copiedCount, 'bn')}টি বিষয় কপি হয়েছে, ${formatNumber(result.skippedCount, 'bn')}টি আগে থেকে ছিল।`
          : `Copied ${result.copiedCount} subjects. ${result.skippedCount} were already present.`
      );
    } catch (err) {
      toast.error(errorMessage(err, t(dict.classSubjects.rolloverFailed)));
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Rollover card */}
      <Card className="p-5 flex flex-wrap items-end gap-3">
        <FormField label={t(dict.classSubjects.copyFromLabel)}>
          <Select
            value={fromYearId}
            onChange={(e) => setFromYearId(e.target.value)}
            className="min-w-40"
          >
            {yearList
              .filter((item) => item.id !== year.id)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </Select>
        </FormField>

        <Button
          type="button"
          variant="outline"
          disabled={copying || !fromYearId}
          onClick={handleRollover}
        >
          {copying ? t(dict.classSubjects.copying) : t(dict.classSubjects.copyButton)}
        </Button>

        <p className="text-sm text-muted-foreground pb-2">
          {t(dict.classSubjects.rolloverNotice)}
        </p>
      </Card>

      {/* 2. Assign Subject Form & Class Filter */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <FormField label={t(dict.classSubjects.classLabel)}>
            <Select
              value={selectedClassId}
              onChange={(e) => {
                const nextId = e.target.value;
                setSelectedClassId(nextId);
                setGroupFilter('all');
                setValue('classId', nextId);
                setValue('groupId', '');
              }}
              className="min-w-44"
            >
              {classList.map((item) => (
                <option key={item.id} value={item.id}>
                  {isBn ? item.nameBn || item.name : item.name}
                </option>
              ))}
            </Select>
          </FormField>

          {usesGroup && (
            <FormField label={t(dict.classSubjects.filterLabel)}>
              <Select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="min-w-44"
              >
                <option value="all">{t(dict.classSubjects.allGroups)}</option>
                <option value="common">{t(dict.classSubjects.commonGroup)}</option>
                {groupList
                  .filter((group) => group.isActive)
                  .map((group) => (
                    <option key={group.id} value={group.id}>
                      {isBn ? group.nameBn || group.name : group.name}
                    </option>
                  ))}
              </Select>
            </FormField>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {usesGroup
            ? t(dict.classSubjects.streamGuidance910)
            : t(dict.classSubjects.streamGuidanceGeneral)}
        </p>

        <form
          onSubmit={handleSubmit(onAssign)}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end"
        >
          <FormField label={t(dict.classSubjects.subjectLabel)} required error={errors.subjectId?.message}>
            <Select
              value={formSubjectId}
              onChange={(e) => setValue('subjectId', e.target.value, { shouldValidate: true })}
            >
              {subjectList
                .filter((subject) => subject.isActive)
                .map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.officialCode ? `${subject.officialCode} · ` : ''}
                    {isBn ? subject.nameBn || subject.name : subject.name}
                  </option>
                ))}
            </Select>
          </FormField>

          {usesGroup && (
            <FormField label={t(dict.classSubjects.groupLabel)}>
              <Select
                value={formGroupId}
                onChange={(e) => setValue('groupId', e.target.value)}
              >
                <option value="">{t(dict.classSubjects.commonGroup)}</option>
                {groupList
                  .filter((group) => group.isActive)
                  .map((group) => (
                    <option key={group.id} value={group.id}>
                      {isBn ? group.nameBn || group.name : group.name}
                    </option>
                  ))}
              </Select>
            </FormField>
          )}

          <div className="pb-2">
            <Switch
              checked={formIsOptional}
              onChange={(val) => setValue('isOptional', val)}
              label={t(dict.classSubjects.optionalSwitch)}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={assigning || !selectedClassId || !formSubjectId}
          >
            {assigning ? t(dict.classSubjects.adding) : t(dict.classSubjects.addButton)}
          </Button>
        </form>
      </Card>

      {/* 3. Class Subjects Table */}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-sm text-muted-foreground">
            <tr>
              <th className="p-3 text-left">{t(dict.classSubjects.subjectColumn)}</th>
              <th className="p-3 text-left">{t(dict.classSubjects.groupColumn)}</th>
              <th className="p-3 text-left">{t(dict.classSubjects.typeColumn)}</th>
              <th className="p-3 text-left">{t(dict.classSubjects.statusColumn)}</th>
              <th className="p-3 text-right">{t(dict.classSubjects.actionColumn)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredSubjects.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-muted-foreground" colSpan={5}>
                  {loadingClassSubjects
                    ? t(dict.common.loading)
                    : t(dict.classSubjects.emptyClassSubjects)}
                </td>
              </tr>
            ) : (
              filteredSubjects.map((item) => (
                <tr key={item.id}>
                  <td className="p-3 font-medium text-foreground">
                    {subjectLabel(item.subjectId)}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {usesGroup ? groupLabel(item.groupId) : '—'}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      className="cursor-pointer"
                      onClick={() => handleToggleOptional(item)}
                      title={isBn ? 'ক্লিক করে টাইপ পরিবর্তন করুন' : 'Click to toggle type'}
                    >
                      <StatusBadge
                        value={item.isOptional ? 'OPTIONAL' : 'COMPULSORY'}
                        customLabel={
                          item.isOptional
                            ? t(dict.classSubjects.optionalBadge)
                            : t(dict.classSubjects.compulsoryBadge)
                        }
                        customTone={item.isOptional ? 'warning' : 'success'}
                      />
                    </button>
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      className="cursor-pointer"
                      onClick={() => handleToggleActive(item)}
                      title={isBn ? 'ক্লিক করে স্ট্যাটাস পরিবর্তন করুন' : 'Click to toggle status'}
                    >
                      <StatusBadge
                        value={item.isActive ? 'ACTIVE' : 'INACTIVE'}
                        customLabel={
                          item.isActive
                            ? t(dict.common.active)
                            : t(dict.common.inactive)
                        }
                        customTone={item.isActive ? 'success' : 'neutral'}
                      />
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={removing}
                      onClick={() => handleRemove(item.id)}
                    >
                      {t(dict.classSubjects.removeButton)}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
