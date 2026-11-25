'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  BookOpen,
  CheckCircle2,
  Copy,
  Filter,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  useAssignClassSubjectMutation,
  useDeleteClassSubjectMutation,
  useGetAcademicGroupsQuery,
  useGetAcademicYearsQuery,
  useGetBooksQuery,
  useGetClassSubjectsQuery,
  useGetSchoolClassesQuery,
  useGetSubjectsQuery,
  useRolloverClassSubjectsMutation,
  useToggleClassSubjectActiveMutation,
  useUpdateClassSubjectMutation,
} from '@/src/services/academic';
import { Button, Card, FormField, Input, Modal, Select, Switch } from '@/src/components/ui';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { formatNumber } from '@/src/lib/formatters';
import type { AcademicGroup, AcademicYear, ClassSubject, SchoolClass, Subject } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';
import { errorMessage } from './shared';
import { CATEGORY_LABELS, useAcademicI18n } from '../academic.i18n';
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
  const { data: realClasses, isLoading: loadingClasses } = useGetSchoolClassesQuery();
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

  // Filter States
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'compulsory' | 'optional'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fromYearId, setFromYearId] = useState<string>('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [rolloverModalOpen, setRolloverModalOpen] = useState(false);

  // Synchronize selectedYearId with real years from backend database
  useEffect(() => {
    if (realYears && realYears.length > 0) {
      const match =
        realYears.find((y) => y.id === year?.id) ||
        realYears.find((y) => y.name === year?.name || y.name.includes(year?.name || '')) ||
        realYears.find((y) => y.isActive) ||
        realYears[0];
      if (match && selectedYearId !== match.id) {
        setSelectedYearId(match.id);
      }
    } else if (year?.id && !selectedYearId) {
      setSelectedYearId(year.id);
    }
  }, [realYears, year, selectedYearId]);

  // Set default classId once classes load and keep synchronized with real database classes
  useEffect(() => {
    if (realClasses && realClasses.length > 0) {
      const match =
        realClasses.find((c) => c.id === selectedClassId) ||
        realClasses.find((c) => c.numericValue === classList.find((x) => x.id === selectedClassId)?.numericValue) ||
        realClasses[0];
      if (match && selectedClassId !== match.id) {
        setSelectedClassId(match.id);
      }
    } else if (!selectedClassId && classList.length > 0) {
      setSelectedClassId(classList[0].id);
    }
  }, [realClasses, classList, selectedClassId]);

  // Set default fromYearId for rollover
  useEffect(() => {
    if (!fromYearId && yearList.length > 0) {
      const otherYear = yearList.find((item) => item.id !== selectedYearId);
      if (otherYear) {
        setFromYearId(otherYear.id);
      }
    }
  }, [yearList, selectedYearId, fromYearId]);

  // Class subjects query for this year & selected class (GET API Integration)
  const {
    data: realClassSubjects,
    isLoading: loadingClassSubjects,
    isFetching: fetchingClassSubjects,
    refetch: refetchClassSubjects,
  } = useGetClassSubjectsQuery(
    selectedYearId
      ? selectedClassId
        ? { academicYearId: selectedYearId, classId: selectedClassId }
        : { academicYearId: selectedYearId }
      : undefined,
    { skip: !selectedYearId }
  );

  // When real API responds, use realClassSubjects directly (even if [] for an empty class), else fallback to mock
  const rawList: ClassSubject[] =
    realClassSubjects !== undefined
      ? realClassSubjects
      : (db?.classSubjects ?? []);

  // All class subjects for selected academic year and class
  const classSubjectsAll = useMemo(() => {
    return (rawList || []).filter((item) => {
      const matchYear = selectedYearId ? item.academicYearId === selectedYearId : true;
      const matchClass = selectedClassId ? item.classId === selectedClassId : true;
      return matchYear && matchClass;
    });
  }, [rawList, selectedYearId, selectedClassId]);

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
      subjectId: '',
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

  // Subject label resolver (prefers joined relation from backend, falls back to subject catalog lookup)
  const resolveSubject = (item: ClassSubject) => {
    const catalogItem = subjectList.find((entry) => entry.id === item.subjectId);
    const nameBn = item.subject?.nameBn || catalogItem?.nameBn;
    const nameEn = item.subject?.name || catalogItem?.name || item.subjectId;
    const code = item.subject?.officialCode || catalogItem?.officialCode;
    const category = item.subject?.category || catalogItem?.category;

    return {
      nameBn,
      nameEn,
      displayTitle: isBn ? nameBn || nameEn : nameEn,
      subtitle: isBn && nameBn && nameEn !== nameBn ? nameEn : undefined,
      code,
      category,
    };
  };

  const groupLabel = (groupId?: string | null) => {
    if (!groupId) return t(dict.classSubjects.commonGroup);
    const item = groupList.find((entry) => entry.id === groupId);
    return isBn ? item?.nameBn || item?.name || groupId : item?.name || groupId;
  };

  // Set of already assigned subject IDs for current class & selected group
  const assignedSubjectIdsForCurrentGroup = useMemo(() => {
    return new Set(
      rawList
        .filter(
          (item) =>
            (!selectedYearId || item.academicYearId === selectedYearId) &&
            item.classId === selectedClassId &&
            (usesGroup ? (item.groupId ?? '') === (formGroupId || '') : true)
        )
        .map((item) => item.subjectId)
    );
  }, [rawList, selectedYearId, selectedClassId, usesGroup, formGroupId]);

  // Books prescribed for the selected class (from the Books catalog)
  const { data: realBooks } = useGetBooksQuery(
    selectedClassId ? { classId: selectedClassId } : undefined,
    { skip: !selectedClassId }
  );

  const booksForSelectedClass = useMemo(() => {
    if (realBooks !== undefined) return realBooks;
    return (db?.books ?? []).filter((b) => b.classId === selectedClassId);
  }, [realBooks, db?.books, selectedClassId]);

  // Subject IDs that are actually prescribed for this class in the Books catalog
  const classPrescribedSubjectIds = useMemo(() => {
    return new Set(booksForSelectedClass.map((b) => b.subjectId));
  }, [booksForSelectedClass]);

  // Subjects that legitimately belong to the selected class
  const classRelevantSubjects = useMemo(() => {
    if (classPrescribedSubjectIds.size > 0) {
      return subjectList.filter((s) => classPrescribedSubjectIds.has(s.id));
    }
    // Fallback: If no books defined yet, filter out SSC-only subjects for junior classes (Class 6-8)
    if (!usesGroup) {
      const sscOnlyOfficialCodes = new Set(['126', '136', '137', '138', '140', '141', '143', '146', '152', '153', '156']);
      return subjectList.filter((s) => !s.officialCode || !sscOnlyOfficialCodes.has(s.officialCode));
    }
    return subjectList;
  }, [subjectList, classPrescribedSubjectIds, usesGroup]);

  // Available (unassigned) subjects for the current class & group
  const availableSubjects = useMemo(() => {
    return classRelevantSubjects.filter(
      (s) => s.isActive && !assignedSubjectIdsForCurrentGroup.has(s.id)
    );
  }, [classRelevantSubjects, assignedSubjectIdsForCurrentGroup]);

  // Set initial subjectId to first available (unassigned) subject, or empty if all assigned
  useEffect(() => {
    if (availableSubjects.length > 0) {
      const isValid = availableSubjects.some((s) => s.id === formSubjectId);
      if (!isValid) {
        setValue('subjectId', availableSubjects[0].id);
      }
    } else {
      setValue('subjectId', '');
    }
  }, [availableSubjects, formSubjectId, setValue]);

  // Filtered and sorted class subjects for the table
  const filteredSubjects = useMemo(() => {
    return classSubjectsAll
      .filter((item) => {
        if (!usesGroup || groupFilter === 'all') return true;
        if (groupFilter === 'common') return !item.groupId;
        return item.groupId === groupFilter;
      })
      .filter((item) => {
        if (typeFilter === 'compulsory') return !item.isOptional;
        if (typeFilter === 'optional') return item.isOptional;
        return true;
      })
      .filter((item) => {
        if (statusFilter === 'active') return item.isActive;
        if (statusFilter === 'inactive') return !item.isActive;
        return true;
      })
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const resolved = resolveSubject(item);
        const matchTitle = (resolved.displayTitle || '').toLowerCase().includes(q);
        const matchSub = (resolved.subtitle || '').toLowerCase().includes(q);
        const matchCode = usesGroup && (resolved.code || '').toLowerCase().includes(q);
        return matchTitle || matchSub || matchCode;
      })
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [classSubjectsAll, usesGroup, groupFilter, typeFilter, statusFilter, searchQuery, subjectList, isBn]);

  const hasActiveFilters =
    groupFilter !== 'all' ||
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setGroupFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
  };

  const onAssign = async (values: AssignClassSubjectFormValues) => {
    try {
      await assignSubject({
        academicYearId: selectedYearId || year.id,
        classId: values.classId,
        subjectId: values.subjectId,
        groupId: usesGroup && values.groupId?.trim() ? values.groupId.trim() : null,
        isOptional: values.isOptional,
        displayOrder: classSubjectsAll.length + 1,
      }).unwrap();
      toast.success(t(dict.classSubjects.assignSuccess));
      setValue('isOptional', false);
      setAddModalOpen(false);
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

  const handleRemove = async (item: ClassSubject) => {
    const resolved = resolveSubject(item);
    const confirmPrompt = isBn
      ? `আপনি কি নিশ্চিতভাবে '${resolved.displayTitle}' বিষয়টিকে পাঠ্যক্রম থেকে সরাতে চান?`
      : `Are you sure you want to remove '${resolved.displayTitle}' from this curriculum?`;

    if (!window.confirm(confirmPrompt)) {
      return;
    }
    try {
      await deleteSubject(item.id).unwrap();
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
        toAcademicYearId: selectedYearId || year.id,
      }).unwrap();
      toast.success(
        isBn
          ? `${formatNumber(result.copiedCount, 'bn')}টি বিষয় কপি হয়েছে, ${formatNumber(result.skippedCount, 'bn')}টি আগে থেকে ছিল।`
          : `Copied ${result.copiedCount} subjects. ${result.skippedCount} were already present.`
      );
      setRolloverModalOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, t(dict.classSubjects.rolloverFailed)));
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Clean Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {isBn ? 'শ্রেণিভিত্তিক বিষয় ও পাঠ্যক্রম' : 'Class Subjects & Curriculum'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {usesGroup
              ? t(dict.classSubjects.streamGuidance910)
              : t(dict.classSubjects.streamGuidanceGeneral)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setRolloverModalOpen(true)}
            disabled={yearList.filter((item) => item.id !== selectedYearId).length === 0}
          >
            <Copy className="w-4 h-4" />
            <span>{t(dict.classSubjects.copyButton)}</span>
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => setAddModalOpen(true)}
            disabled={!selectedClassId}
          >
            <Plus className="w-4 h-4" />
            <span>{t(dict.classSubjects.addButton)}</span>
          </Button>
        </div>
      </div>

      {/* 2. Responsive Class Selector & Filter Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground mr-1">
              {t(dict.classSubjects.classLabel)}:
            </span>
            {classList.map((cls) => {
              const isSelected = cls.id === selectedClassId;
              const clsName = isBn ? cls.nameBn || cls.name : cls.name;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    setGroupFilter('all');
                    setValue('classId', cls.id);
                    setValue('groupId', '');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-surface-muted hover:bg-surface text-foreground border border-border'
                  }`}
                >
                  {clsName}
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={fetchingClassSubjects}
            onClick={() => refetchClassSubjects()}
            className="gap-1.5"
            title={isBn ? 'রিফ্রেশ' : 'Refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${fetchingClassSubjects ? 'animate-spin' : ''}`} />
            <span>{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
          </Button>
        </div>

        <div className="pt-3 border-t border-border flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1 lg:max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(dict.classSubjects.searchPlaceholder)}
              className="pl-10 pr-9"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-wrap items-center gap-2">
            {usesGroup && (
              <Select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full lg:w-44"
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
            )}

            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full lg:w-36"
            >
              <option value="all">{isBn ? 'সকল ধরন' : 'All Types'}</option>
              <option value="compulsory">{t(dict.classSubjects.compulsoryBadge)}</option>
              <option value="optional">{t(dict.classSubjects.optionalBadge)}</option>
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full lg:w-36"
            >
              <option value="all">{t(dict.classSubjects.allStatuses)}</option>
              <option value="active">{t(dict.classSubjects.activeOnly)}</option>
              <option value="inactive">{t(dict.classSubjects.inactiveOnly)}</option>
            </Select>

            {hasActiveFilters && (
              <Button type="button" variant="outline" size="sm" onClick={handleResetFilters}>
                {t(dict.classSubjects.resetFilters)}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 3. Class Subjects Table */}
      <Card className="overflow-x-auto shadow-sm">
        <table className="w-full text-base">
          <thead className="bg-surface-muted/80 border-b border-border text-sm text-muted-foreground">
            <tr>
              <th className="p-3.5 text-center w-14">{t(dict.classSubjects.orderColumn)}</th>
              <th className="p-3.5 text-left w-24">{t(dict.classSubjects.codeColumn)}</th>
              <th className="p-3.5 text-left">{t(dict.classSubjects.subjectColumn)}</th>
              <th className="p-3.5 text-left">{t(dict.classSubjects.groupColumn)}</th>
              <th className="p-3.5 text-left">{t(dict.classSubjects.typeColumn)}</th>
              <th className="p-3.5 text-left">{t(dict.classSubjects.statusColumn)}</th>
              <th className="p-3.5 text-right">{t(dict.classSubjects.actionColumn)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loadingClassSubjects ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  <td className="p-3.5 text-center">
                    <div className="h-4 w-6 bg-border/60 rounded mx-auto" />
                  </td>
                  <td className="p-3.5">
                    <div className="h-5 w-14 bg-border/60 rounded-full" />
                  </td>
                  <td className="p-3.5">
                    <div className="h-4 w-40 bg-border/60 rounded mb-1" />
                    <div className="h-3 w-20 bg-border/40 rounded" />
                  </td>
                  <td className="p-3.5">
                    <div className="h-4 w-24 bg-border/60 rounded" />
                  </td>
                  <td className="p-3.5">
                    <div className="h-6 w-20 bg-border/60 rounded-full" />
                  </td>
                  <td className="p-3.5">
                    <div className="h-6 w-16 bg-border/60 rounded-full" />
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="h-8 w-16 bg-border/60 rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : filteredSubjects.length === 0 ? (
              <tr>
                <td className="p-10 text-center" colSpan={7}>
                  <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center text-muted-foreground border border-border">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <p className="text-base font-semibold text-foreground">
                      {hasActiveFilters
                        ? t(dict.classSubjects.noFilterResults)
                        : t(dict.classSubjects.emptyClassSubjects)}
                    </p>
                    <p className="text-sm text-muted-foreground text-center">
                      {hasActiveFilters
                        ? isBn
                          ? 'ফিল্টারের শর্ত পরিবর্তন করুন অথবা ফিল্টার রিসেট করুন।'
                          : 'Try adjusting your filters or reset them to view all subjects.'
                        : isBn
                          ? 'ওপরের "+ নতুন বিষয় যুক্ত করুন" বাটনে ক্লিক করে পাঠ্যক্রমে বিষয় যুক্ত করুন।'
                          : 'Click "Add subject" above to assign subjects to this class.'}
                    </p>
                    {hasActiveFilters && (
                      <Button type="button" variant="outline" size="sm" onClick={handleResetFilters}>
                        {t(dict.classSubjects.resetFilters)}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredSubjects.map((item, index) => {
                const resolved = resolveSubject(item);
                const categoryObj = resolved.category
                  ? CATEGORY_LABELS[resolved.category]
                  : undefined;
                const categoryLabel = categoryObj ? t(categoryObj) : undefined;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-surface-muted/40 transition-colors group"
                  >
                    <td className="p-3.5 text-center text-sm font-semibold text-muted-foreground">
                      <span className="tabular-nums">
                        {formatNumber(item.displayOrder || index + 1, locale)}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {usesGroup && resolved.code ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono bg-surface-muted text-foreground border border-border">
                          {resolved.code}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold text-foreground">
                            {resolved.displayTitle}
                          </span>
                          {categoryLabel && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                              {categoryLabel}
                            </span>
                          )}
                        </div>
                        {resolved.subtitle && (
                          <span className="text-sm text-muted-foreground mt-0.5">
                            {resolved.subtitle}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 text-sm text-muted-foreground">
                      {usesGroup ? (
                        item.groupId ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-surface-muted border border-border text-foreground">
                            <Layers className="w-3.5 h-3.5 text-primary" />
                            <span>{groupLabel(item.groupId)}</span>
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground">
                            {t(dict.classSubjects.commonGroup)}
                          </span>
                        )
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <button
                        type="button"
                        className="cursor-pointer transition-transform active:scale-95"
                        onClick={() => handleToggleOptional(item)}
                        title={
                          isBn
                            ? 'ক্লিক করে আবশ্যিক/ঐচ্ছিক পরিবর্তন করুন'
                            : 'Click to toggle compulsory/optional'
                        }
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

                    <td className="p-3.5">
                      <button
                        type="button"
                        className="cursor-pointer transition-transform active:scale-95"
                        onClick={() => handleToggleActive(item)}
                        title={
                          isBn
                            ? 'ক্লিক করে সক্রিয়/নিষ্ক্রিয় পরিবর্তন করুন'
                            : 'Click to toggle active status'
                        }
                      >
                        <StatusBadge
                          value={item.isActive ? 'ACTIVE' : 'INACTIVE'}
                          customLabel={
                            item.isActive ? t(dict.common.active) : t(dict.common.inactive)
                          }
                          customTone={item.isActive ? 'success' : 'neutral'}
                        />
                      </button>
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={removing}
                        onClick={() => handleRemove(item)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{t(dict.classSubjects.removeButton)}</span>
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {/* 4. Add Subject Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={isBn ? 'পাঠ্যক্রমে নতুন বিষয় যুক্ত করুন' : 'Add Subject to Curriculum'}
        description={
          isBn
            ? `${currentClass?.nameBn || currentClass?.name || ''} শ্রেণির জন্য নতুন বিষয় নির্বাচন করুন।`
            : `Select a subject to add to ${currentClass?.name || 'this class'}.`
        }
        size="md"
      >
        <form onSubmit={handleSubmit(onAssign)} className="space-y-4">
          <FormField
            label={t(dict.classSubjects.subjectLabel)}
            required
            error={errors.subjectId?.message}
          >
            <Select
              value={formSubjectId}
              onChange={(e) => setValue('subjectId', e.target.value, { shouldValidate: true })}
              disabled={availableSubjects.length === 0}
            >
              {availableSubjects.length === 0 ? (
                <option value="">
                  {isBn
                    ? '— সব বিষয় যুক্ত আছে'
                    : '— All subjects assigned —'}
                </option>
              ) : (
                <>
                  <option value="" disabled>
                    {t(dict.classSubjects.selectSubjectPlaceholder)}
                  </option>
                  {availableSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {isBn ? subject.nameBn || subject.name : subject.name}
                    </option>
                  ))}
                </>
              )}
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

          <div className="pt-1">
            <Switch
              checked={formIsOptional}
              onChange={(val) => setValue('isOptional', val)}
              label={t(dict.classSubjects.optionalSwitch)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
              {t(dict.common.cancel)}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={assigning || !selectedClassId || !formSubjectId || availableSubjects.length === 0}
            >
              <Plus className="w-4 h-4" />
              <span>{assigning ? t(dict.classSubjects.adding) : t(dict.classSubjects.addButton)}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Rollover Modal */}
      <Modal
        open={rolloverModalOpen}
        onClose={() => setRolloverModalOpen(false)}
        title={t(dict.classSubjects.copyButton)}
        description={t(dict.classSubjects.rolloverNotice)}
        size="md"
      >
        <div className="space-y-4">
          <FormField label={t(dict.classSubjects.copyFromLabel)}>
            <Select
              value={fromYearId}
              onChange={(e) => setFromYearId(e.target.value)}
            >
              {yearList
                .filter((item) => item.id !== selectedYearId)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </Select>
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setRolloverModalOpen(false)}>
              {t(dict.common.cancel)}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={copying || !fromYearId}
              onClick={handleRollover}
            >
              <Copy className="w-4 h-4" />
              <span>{copying ? t(dict.classSubjects.copying) : t(dict.classSubjects.copyButton)}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
