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
  useGetClassSubjectsPaginatedQuery,
  useGetClassSubjectsQuery,
  useGetSchoolClassesQuery,
  useGetSubjectsQuery,
  useRolloverClassSubjectsMutation,
  useToggleClassSubjectActiveMutation,
  useUpdateClassSubjectMutation,
} from '@/src/services/academic';
import { ConfirmDialog } from '@/src/components/shared/Feedback';
import { Button, Card, FormField, Input, Modal, Select, Switch } from '@/src/components/ui';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { formatNumber } from '@/src/lib/formatters';
import type { AcademicGroup, AcademicYear, ClassSubject, SchoolClass, Subject } from '@/src/types/entities';
import { errorMessage } from './shared';
import { CATEGORY_LABELS } from '../academic.labels';
import {
  assignClassSubjectSchema,
  type AssignClassSubjectFormValues,
} from '../academic.schema';

const isUuid = (val?: string) =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

export function ClassSubjectsPanel({
  year,
}: {
  year: AcademicYear;
}) {

  // Queries
  const { data: realClasses, isLoading: loadingClasses } = useGetSchoolClassesQuery();
  const classList: SchoolClass[] = realClasses ?? [];

  const { data: realGroups } = useGetAcademicGroupsQuery();
  const groupList: AcademicGroup[] = realGroups ?? [];

  const { data: realSubjects } = useGetSubjectsQuery();
  const subjectList: Subject[] = realSubjects ?? [];

  const { data: realYears } = useGetAcademicYearsQuery();
  const yearList: AcademicYear[] = realYears ?? [];

  // Filter States
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'compulsory' | 'optional'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [fromYearId, setFromYearId] = useState<string>('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [rolloverModalOpen, setRolloverModalOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ClassSubject[] | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [selectedYearId, selectedClassId, groupFilter, typeFilter, statusFilter]);

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

  const currentClass = classList.find((c) => c.id === selectedClassId);
  const usesGroup = (currentClass?.numericValue ?? 0) >= 9;

  // Paginated backend query for the main table
  const {
    data: paginatedClassSubjects,
    isLoading: loadingClassSubjects,
    isFetching: fetchingClassSubjects,
    refetch: refetchClassSubjects,
  } = useGetClassSubjectsPaginatedQuery(
    {
      academicYearId: selectedYearId,
      classId: selectedClassId,
      page,
      limit: 15,
      ...(usesGroup && groupFilter !== 'all' && groupFilter !== 'common'
        ? { groupId: groupFilter }
        : {}),
      ...(typeFilter !== 'all' ? { isOptional: typeFilter === 'optional' } : {}),
      ...(statusFilter !== 'all' ? { isActive: statusFilter === 'active' } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    },
    { skip: !isUuid(selectedYearId) || !isUuid(selectedClassId) }
  );

  // Full list for duplicate check in Add Modal
  const { data: realClassSubjects } = useGetClassSubjectsQuery(
    selectedYearId && selectedClassId
      ? { academicYearId: selectedYearId, classId: selectedClassId }
      : undefined,
    { skip: !isUuid(selectedYearId) || !isUuid(selectedClassId) }
  );

  const classSubjectsAll: ClassSubject[] = realClassSubjects ?? [];
  const paginatedItems: ClassSubject[] = paginatedClassSubjects?.items ?? [];
  const csMeta = paginatedClassSubjects?.meta ?? {
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  // Mutations
  const [assignSubject, { isLoading: assigning }] = useAssignClassSubjectMutation();
  const [updateSubject] = useUpdateClassSubjectMutation();
  const [toggleActive] = useToggleClassSubjectActiveMutation();
  const [rollover, { isLoading: copying }] = useRolloverClassSubjectsMutation();
  const [deleteSubject, { isLoading: removing }] = useDeleteClassSubjectMutation();

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
      displayTitle: nameBn || nameEn,
      subtitle: true && nameBn && nameEn !== nameBn ? nameEn : undefined,
      code,
      category,
    };
  };

  const groupLabel = (groupId?: string | null) => {
    if (!groupId) return 'কমন (সব বিভাগ)';
    const item = groupList.find((entry) => entry.id === groupId);
    return item?.nameBn || item?.name || groupId;
  };

  // Set of already assigned subject IDs for current class & selected group
  const assignedSubjectIdsForCurrentGroup = useMemo(() => {
    return new Set(
      classSubjectsAll
        .filter(
          (item) =>
            (!selectedYearId || item.academicYearId === selectedYearId) &&
            item.classId === selectedClassId &&
            (usesGroup ? (item.groupId ?? '') === (formGroupId || '') : true)
        )
        .map((item) => item.subjectId)
    );
  }, [classSubjectsAll, selectedYearId, selectedClassId, usesGroup, formGroupId]);

  // Books prescribed for the selected class (from the Books catalog)
  const { data: realBooks } = useGetBooksQuery(
    selectedClassId ? { classId: selectedClassId } : undefined,
    { skip: !isUuid(selectedClassId) }
  );

  const booksForSelectedClass = useMemo(() => {
    return realBooks ?? [];
  }, [realBooks]);

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
    if (usesGroup && groupFilter === 'common') {
      return paginatedItems.filter((item) => !item.groupId);
    }
    return paginatedItems;
  }, [paginatedItems, usesGroup, groupFilter]);

  const groupedSubjects = useMemo(() => {
    const map = new Map<string, { primary: ClassSubject; entries: ClassSubject[] }>();
    for (const item of filteredSubjects) {
      const existing = map.get(item.subjectId);
      if (existing) {
        existing.entries.push(item);
      } else {
        map.set(item.subjectId, { primary: item, entries: [item] });
      }
    }
    return Array.from(map.values());
  }, [filteredSubjects]);

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
    setPage(1);
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
      toast.success('বিষয় সফলভাবে পাঠ্যক্রমে যুক্ত হয়েছে।');
      setValue('isOptional', false);
      setAddModalOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, 'বিষয় যুক্ত করা যায়নি।'));
    }
  };

  const handleToggleOptional = async (entries: ClassSubject[]) => {
    const nextOptional = !entries[0]?.isOptional;
    try {
      await Promise.all(
        entries.map((entry) =>
          updateSubject({
            id: entry.id,
            isOptional: nextOptional,
          }).unwrap()
        )
      );
      toast.success('পাঠ্যক্রম সফলভাবে হালনাগাদ হয়েছে।');
    } catch (err) {
      toast.error(errorMessage(err, 'হালনাগাদ করা যায়নি।'));
    }
  };

  const handleToggleActive = async (entries: ClassSubject[]) => {
    const nextActive = !entries[0]?.isActive;
    try {
      await Promise.all(
        entries.map((entry) =>
          toggleActive({
            id: entry.id,
            isActive: nextActive,
          }).unwrap()
        )
      );
      toast.success('পাঠ্যক্রম সফলভাবে হালনাগাদ হয়েছে।');
    } catch (err) {
      toast.error(errorMessage(err, 'হালনাগাদ করা যায়নি।'));
    }
  };

  const handleRemove = (entries: ClassSubject[]) => {
    setRemoveTarget(entries);
  };

  const confirmRemove = async () => {
    if (!removeTarget || removeTarget.length === 0) return;
    try {
      await Promise.all(removeTarget.map((entry) => deleteSubject(entry.id).unwrap()));
      toast.success('বিষয় পাঠ্যক্রম থেকে সরানো হয়েছে।');
      setRemoveTarget(null);
    } catch (err) {
      toast.error(errorMessage(err, 'বিষয় সরানো যায়নি।'));
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
        `${formatNumber(result.copiedCount, 'bn')}টি বিষয় কপি হয়েছে, ${formatNumber(result.skippedCount, 'bn')}টি আগে থেকে ছিল।`
      );
      setRolloverModalOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, 'পাঠ্যক্রম কপি করা যায়নি।'));
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Guidance & Action Buttons (no duplicate title) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-base text-muted-foreground">
          {usesGroup
            ? '৯ম–১০ম শ্রেণিতে কমন বিষয় সবার, বিভাগের বিষয় শুধু নির্দিষ্ট বিভাগের। একাধিক বিষয় ঐচ্ছিক রাখা যায়; শিক্ষার্থী পরে একটি পছন্দ করবে।'
            : '৬ষ্ঠ–৮ম শ্রেণিতে বিভাগ নেই। সব বিষয় সব শিক্ষার্থীর জন্য প্রযোজ্য।'}
        </p>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setRolloverModalOpen(true)}
            disabled={yearList.filter((item) => item.id !== selectedYearId).length === 0}
          >
            <Copy className="w-4 h-4" />
            <span>{'সক্রিয় বিষয় কপি করুন'}</span>
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => setAddModalOpen(true)}
            disabled={!selectedClassId}
          >
            <Plus className="w-4 h-4" />
            <span>{'পাঠ্যক্রমে যুক্ত করুন'}</span>
          </Button>
        </div>
      </div>

      {/* 2. Responsive Class Selector & Filter Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground mr-1">
              {'শ্রেণি'}:
            </span>
            {classList.map((cls) => {
              const isSelected = cls.id === selectedClassId;
              const clsName = cls.nameBn || cls.name;
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
            title={'রিফ্রেশ'}
          >
            <RefreshCw className={`w-4 h-4 ${fetchingClassSubjects ? 'animate-spin' : ''}`} />
            <span>{'রিফ্রেশ'}</span>
          </Button>
        </div>

        <div className="pt-3 border-t border-border flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1 lg:max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={'বিষয় বা কোড দিয়ে খুঁজুন...'}
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
                <option value="all">{'সব বিষয়'}</option>
                <option value="common">{'কমন (সব বিভাগ)'}</option>
                {groupList
                  .filter((group) => group.isActive)
                  .map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.nameBn || group.name}
                    </option>
                  ))}
              </Select>
            )}

            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full lg:w-36"
            >
              <option value="all">{'সকল ধরন'}</option>
              <option value="compulsory">{'আবশ্যিক'}</option>
              <option value="optional">{'ঐচ্ছিক'}</option>
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full lg:w-36"
            >
              <option value="all">{'সকল অবস্থা'}</option>
              <option value="active">{'শুধু সক্রিয়'}</option>
              <option value="inactive">{'শুধু নিষ্ক্রিয়'}</option>
            </Select>

            {hasActiveFilters && (
              <Button type="button" variant="outline" size="sm" onClick={handleResetFilters}>
                {'ফিল্টার রিসেট করুন'}
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
              <th className="p-3.5 text-center w-14">{'ক্রম'}</th>
              <th className="p-3.5 text-left w-24">{'কোড'}</th>
              <th className="p-3.5 text-left">{'বিষয়'}</th>
              <th className="p-3.5 text-left">{'বিভাগ'}</th>
              <th className="p-3.5 text-left">{'ধরন'}</th>
              <th className="p-3.5 text-left">{'অবস্থা'}</th>
              <th className="p-3.5 text-right">{'কাজ'}</th>
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
            ) : groupedSubjects.length === 0 ? (
              <tr>
                <td className="p-10 text-center" colSpan={7}>
                  <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center text-muted-foreground border border-border">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <p className="text-base font-semibold text-foreground">
                      {hasActiveFilters
                        ? 'অনুসন্ধানের সাথে কোনো বিষয় মিলছে না।'
                        : 'এই শ্রেণিতে এখনো কোনো বিষয় যুক্ত করা হয়নি।'}
                    </p>
                    <p className="text-sm text-muted-foreground text-center">
                      {hasActiveFilters
                        ? 'ফিল্টারের শর্ত পরিবর্তন করুন অথবা ফিল্টার রিসেট করুন।'
                        : 'ওপরের "+ নতুন বিষয় যুক্ত করুন" বাটনে ক্লিক করে পাঠ্যক্রমে বিষয় যুক্ত করুন।'}
                    </p>
                    {hasActiveFilters && (
                      <Button type="button" variant="outline" size="sm" onClick={handleResetFilters}>
                        {'ফিল্টার রিসেট করুন'}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              groupedSubjects.map(({ primary: item, entries }, index) => {
                const resolved = resolveSubject(item);
                const categoryObj = resolved.category
                  ? CATEGORY_LABELS[resolved.category]
                  : undefined;
                const categoryLabel = categoryObj ? categoryObj : undefined;
                const uniqueGroupIds = Array.from(
                  new Set(entries.map((e) => e.groupId).filter((g): g is string => Boolean(g)))
                );

                return (
                  <tr
                    key={item.subjectId}
                    className="hover:bg-surface-muted/40 transition-colors group"
                  >
                    <td className="p-3.5 text-center text-sm font-semibold text-muted-foreground">
                      <span className="tabular-nums">
                        {formatNumber(index + 1, 'bn')}
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
                        uniqueGroupIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {uniqueGroupIds.map((gid) => (
                              <span
                                key={gid}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-surface-muted border border-border text-foreground"
                              >
                                <Layers className="w-3.5 h-3.5 text-primary" />
                                <span>{groupLabel(gid)}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground">
                            {'কমন (সব বিভাগ)'}
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
                        onClick={() => handleToggleOptional(entries)}
                        title={
                          'ক্লিক করে আবশ্যিক/ঐচ্ছিক পরিবর্তন করুন'
                        }
                      >
                        <StatusBadge
                          value={item.isOptional ? 'OPTIONAL' : 'COMPULSORY'}
                          customLabel={
                            item.isOptional
                              ? 'ঐচ্ছিক'
                              : 'আবশ্যিক'
                          }
                          customTone={item.isOptional ? 'warning' : 'success'}
                        />
                      </button>
                    </td>

                    <td className="p-3.5">
                      <button
                        type="button"
                        className="cursor-pointer transition-transform active:scale-95"
                        onClick={() => handleToggleActive(entries)}
                        title={
                          'ক্লিক করে সক্রিয়/নিষ্ক্রিয় পরিবর্তন করুন'
                        }
                      >
                        <StatusBadge
                          value={item.isActive ? 'ACTIVE' : 'INACTIVE'}
                          customLabel={
                            item.isActive ? 'সক্রিয়' : 'বন্ধ'
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
                        onClick={() => handleRemove(entries)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{'সরান'}</span>
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {csMeta.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {`মোট ${formatNumber(csMeta.total, 'bn')} টি বিষয় · পৃষ্ঠা ${formatNumber(csMeta.page, 'bn')} / ${formatNumber(csMeta.totalPages, 'bn')}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!csMeta.hasPreviousPage || fetchingClassSubjects}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {'পূর্ববর্তী'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!csMeta.hasNextPage || fetchingClassSubjects}
              onClick={() => setPage((p) => p + 1)}
            >
              {'পরবর্তী'}
            </Button>
          </div>
        </div>
      )}

      {/* 4. Add Subject Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={'পাঠ্যক্রমে নতুন বিষয় যুক্ত করুন'}
        description={
          `${currentClass?.nameBn || currentClass?.name || ''} শ্রেণির জন্য নতুন বিষয় নির্বাচন করুন।`
        }
        size="md"
      >
        <form onSubmit={handleSubmit(onAssign)} className="space-y-4">
          <FormField
            label={'বিষয়'}
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
                  {'— সব বিষয় যুক্ত আছে'}
                </option>
              ) : (
                <>
                  <option value="" disabled>
                    {'বিষয় নির্বাচন করুন'}
                  </option>
                  {availableSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.nameBn || subject.name}
                    </option>
                  ))}
                </>
              )}
            </Select>
          </FormField>

          {usesGroup && (
            <FormField label={'বিভাগ'}>
              <Select
                value={formGroupId}
                onChange={(e) => setValue('groupId', e.target.value)}
              >
                <option value="">{'কমন (সব বিভাগ)'}</option>
                {groupList
                  .filter((group) => group.isActive)
                  .map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.nameBn || group.name}
                    </option>
                  ))}
              </Select>
            </FormField>
          )}

          <div className="pt-1">
            <Switch
              checked={formIsOptional}
              onChange={(val) => setValue('isOptional', val)}
              label={'ঐচ্ছিক / চতুর্থ বিষয়'}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
              {'বাতিল'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={assigning || !selectedClassId || !formSubjectId || availableSubjects.length === 0}
            >
              <Plus className="w-4 h-4" />
              <span>{assigning ? 'যুক্ত হচ্ছে...' : 'পাঠ্যক্রমে যুক্ত করুন'}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Rollover Modal */}
      <Modal
        open={rolloverModalOpen}
        onClose={() => setRolloverModalOpen(false)}
        title={'সক্রিয় বিষয় কপি করুন'}
        description={'যে বিষয় এই শিক্ষাবর্ষে আগে থেকে যুক্ত আছে তা অপরিবর্তিত থাকবে।'}
        size="md"
      >
        <div className="space-y-4">
          <FormField label={'যে বছর থেকে কপি করবেন'}>
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
              {'বাতিল'}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={copying || !fromYearId}
              onClick={handleRollover}
            >
              <Copy className="w-4 h-4" />
              <span>{copying ? 'কপি হচ্ছে...' : 'সক্রিয় বিষয় কপি করুন'}</span>
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={confirmRemove}
        title={'বিষয় সরিয়ে ফেলুন'}
        description={
          removeTarget && removeTarget.length > 0
            ? `আপনি কি নিশ্চিতভাবে '${resolveSubject(removeTarget[0]).displayTitle}' বিষয়টিকে পাঠ্যক্রম থেকে সরাতে চান?`
            : ''
        }
        confirmLabel={'সরিয়ে ফেলুন'}
        destructive
        loading={removing}
      />
    </div>
  );
}
