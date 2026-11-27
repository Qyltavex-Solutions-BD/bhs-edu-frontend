'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  Eye,
  Lock,
  Pencil,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { formatNumber } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils/cn';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { DataTable } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import {
  Button,
  Card,
  FormField,
  Input,
  Modal,
  Select,
  Textarea,
} from '@/src/components/ui/primitives';
import { useUpdateEnrollmentMutation } from '@/src/store/api';
import { useGetEnrollmentsQuery } from '@/src/features/students/api/students.api';
import { useGetAcademicYearsQuery } from '@/src/services/academic/year.api';
import { useGetSchoolClassesQuery } from '@/src/services/academic/class.api';
import { useGetSectionsQuery } from '@/src/services/academic/section.api';
import { useGetAcademicGroupsQuery } from '@/src/services/academic/group.api';
import { useGetClassSubjectsQuery } from '@/src/services/academic/class-subject.api';
import { EnrollmentStatus, Gender } from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import type { StudentEnrollment } from '@/src/types/entities';
import { errorMessage, studentInitials } from './studentShared';

interface EnrichedEnrollment extends StudentEnrollment {
  studentNameBn: string;
  studentNameEn: string;
  studentCode: string;
  studentGender: Gender;
  classNumeric: number;
  classLabel: string;
  sectionLabel: string;
  groupLabel: string;
  optionalSubjectLabel: string;
}

export function StudentEnrollments({
  db,
  yearId,
}: {
  db?: MockDatabase;
  yearId: string;
}) {
  const [updateEnrollment, { isLoading }] = useUpdateEnrollmentMutation();
  const { data: liveEnrollments, isLoading: loadingEnrollments } =
    useGetEnrollmentsQuery({ academicYearId: yearId }, { skip: !yearId });
  const { data: liveYears = [] } = useGetAcademicYearsQuery();
  const { data: liveClasses = [] } = useGetSchoolClassesQuery();
  const { data: liveSections = [] } = useGetSectionsQuery();
  const { data: liveGroups = [] } = useGetAcademicGroupsQuery();
  const { data: liveClassSubjects = [] } = useGetClassSubjectsQuery({
    academicYearId: yearId,
    isActive: true,
  });

  const academicYears = liveYears.length ? liveYears : db?.academicYears ?? [];
  const classes = liveClasses.length ? liveClasses : db?.classes ?? [];
  const sections = liveSections.length ? liveSections : db?.sections ?? [];
  const academicGroups = liveGroups.length ? liveGroups : db?.academicGroups ?? [];
  const classSubjects = liveClassSubjects.length
    ? liveClassSubjects
    : db?.classSubjects ?? [];

  const [classId, setClassId] = useState('ALL');
  const [sectionId, setSectionId] = useState('ALL');
  const [groupId, setGroupId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [editing, setEditing] = useState<EnrichedEnrollment | null>(null);
  const [form, setForm] = useState({
    sectionId: '',
    groupId: '',
    roll: '',
    optionalClassSubjectId: '',
    isRepeater: false,
    isReadmission: false,
    remarks: '',
  });

  const yearObj = academicYears.find((y) => y.id === yearId);
  const sortedClasses = useMemo(
    () => [...classes].sort((a, b) => a.numericValue - b.numericValue),
    [classes]
  );

  // All enrollments for selected academic year
  const sessionEnrollments = useMemo<EnrichedEnrollment[]>(() => {
    const source =
      liveEnrollments ??
      (db?.enrollments ?? []).filter((item) => item.academicYearId === yearId);

    return source.map((raw) => {
      const item = raw as StudentEnrollment & {
        student?: {
          id: string;
          studentId: string;
          nameEn: string;
          nameBn?: string | null;
          gender: Gender;
        };
        schoolClass?: {
          id: string;
          name: string;
          nameBn?: string | null;
          numericValue: number;
        };
        section?: { id: string; name: string };
        group?: { id: string; name: string; nameBn?: string | null } | null;
        optionalClassSubject?: {
          subject?: { id: string; name: string; nameBn?: string | null };
        } | null;
      };
      const student =
        item.student ?? db?.students.find((row) => row.id === item.studentId);
      const cls =
        classes.find((row) => row.id === item.classId) ?? item.schoolClass;
      const section =
        sections.find((row) => row.id === item.sectionId) ?? item.section;
      const group =
        (item.groupId
          ? academicGroups.find((row) => row.id === item.groupId)
          : null) ?? item.group;
      const optCs = item.optionalClassSubjectId
        ? classSubjects.find((row) => row.id === item.optionalClassSubjectId)
        : null;
      const optSub =
        item.optionalClassSubject?.subject ??
        optCs?.subject ??
        (optCs ? db?.subjects.find((row) => row.id === optCs.subjectId) : null);

      return {
        ...item,
        studentNameBn: student?.nameBn || student?.nameEn || '—',
        studentNameEn: student?.nameEn || '',
        studentCode: student?.studentId ?? '',
        studentGender: student?.gender ?? Gender.MALE,
        classNumeric: cls?.numericValue ?? 99,
        classLabel: cls
          ? cls.nameBn || cls.name
          : '—',
        sectionLabel: section?.name ?? '—',
        groupLabel: group
          ? group.nameBn || group.name
          : '',
        optionalSubjectLabel: optSub
          ? optSub.nameBn || optSub.name
          : '',
      };
    });
  }, [
    liveEnrollments,
    db,
    yearId,
    'bn',
    classes,
    sections,
    academicGroups,
    classSubjects,
  ]);

  // Summary metrics
  const totalCount = sessionEnrollments.length;
  const activeCount = sessionEnrollments.filter((r) => r.status === EnrollmentStatus.ACTIVE).length;
  const promotedCount = sessionEnrollments.filter(
    (r) => r.status === EnrollmentStatus.PROMOTED
  ).length;
  const completedOrOtherCount = totalCount - activeCount - promotedCount;

  const populatedClasses = new Set(sessionEnrollments.map((r) => r.classId)).size;
  const populatedSections = new Set(sessionEnrollments.map((r) => r.sectionId)).size;
  const avgPerSection =
    populatedSections > 0 ? Math.round(totalCount / populatedSections) : 0;
  const seniorTotalCount = sessionEnrollments.filter(
    (r) => r.classNumeric >= 9
  ).length;
  const readmissionCount = sessionEnrollments.filter((r) => r.isReadmission).length;
  const repeaterCount = sessionEnrollments.filter((r) => r.isRepeater).length;
  const regularNewCount = totalCount - readmissionCount - repeaterCount;

  const streamCounts = useMemo(() => {
    const map = new Map<string, number>();
    sessionEnrollments.forEach((r) => {
      if (r.groupId) map.set(r.groupId, (map.get(r.groupId) ?? 0) + 1);
    });
    return academicGroups.map((g) => ({
      id: g.id,
      label: g.nameBn || g.name,
      count: map.get(g.id) ?? 0,
    }));
  }, [sessionEnrollments, academicGroups, 'bn']);

  // Class counts sorted 6 -> 10
  const classCounts = useMemo(() => {
    const counts = new Map<string, number>();
    sessionEnrollments.forEach((row) => {
      counts.set(row.classId, (counts.get(row.classId) ?? 0) + 1);
    });
    return sortedClasses.map((cls) => ({
      id: cls.id,
      numericValue: cls.numericValue,
      label: cls.nameBn || cls.name,
      count: counts.get(cls.id) ?? 0,
    }));
  }, [sessionEnrollments, sortedClasses, 'bn']);

  const selectedClassObj = sortedClasses.find((c) => c.id === classId);
  const showStreamFilter = (selectedClassObj?.numericValue ?? 0) >= 9;
  const showStreamColumn = classId === 'ALL' || showStreamFilter;

  const availableSections = useMemo(
    () => sections.filter((item) => classId === 'ALL' || item.classId === classId),
    [sections, classId]
  );

  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sessionEnrollments
      .filter((row) => (classId === 'ALL' ? true : row.classId === classId))
      .filter((row) => (sectionId === 'ALL' ? true : row.sectionId === sectionId))
      .filter((row) => (groupId === 'ALL' ? true : (row.groupId ?? '') === groupId))
      .filter((row) => (statusFilter === 'ALL' ? true : row.status === statusFilter))
      .filter((row) => {
        if (!q) return true;
        return (
          row.studentNameBn.toLowerCase().includes(q) ||
          row.studentNameEn.toLowerCase().includes(q) ||
          row.studentCode.toLowerCase().includes(q) ||
          String(row.roll).includes(q) ||
          row.sectionLabel.toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          a.classNumeric - b.classNumeric ||
          a.sectionLabel.localeCompare(b.sectionLabel) ||
          a.roll - b.roll
      );
  }, [sessionEnrollments, classId, sectionId, groupId, statusFilter, searchQuery]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    classId !== 'ALL' ||
    sectionId !== 'ALL' ||
    groupId !== 'ALL' ||
    statusFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setClassId('ALL');
    setSectionId('ALL');
    setGroupId('ALL');
    setStatusFilter('ALL');
  };

  const startEdit = (row: EnrichedEnrollment) => {
    setEditing(row);
    setForm({
      sectionId: row.sectionId,
      groupId: row.groupId ?? '',
      roll: String(row.roll),
      optionalClassSubjectId: row.optionalClassSubjectId ?? '',
      isRepeater: row.isRepeater,
      isReadmission: row.isReadmission,
      remarks: row.remarks ?? '',
    });
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    try {
      await updateEnrollment({
        id: editing.id,
        sectionId: form.sectionId,
        groupId: editingNeedsGroup ? form.groupId || null : null,
        roll: Number(form.roll),
        optionalClassSubjectId: editingNeedsGroup
          ? form.optionalClassSubjectId || null
          : null,
        isRepeater: form.isRepeater,
        isReadmission: form.isReadmission,
        remarks: form.remarks,
      }).unwrap();
      toast.success('এনরোলমেন্ট অবস্থান হালনাগাদ হয়েছে।');
      setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err, 'হালনাগাদ করা যায়নি।'));
    }
  };

  const editingNeedsGroup = (editing?.classNumeric ?? 0) >= 9;
  const editingOptionals = classSubjects.filter(
    (row) =>
      editing &&
      row.isOptional &&
      row.isActive &&
      row.academicYearId === editing.academicYearId &&
      row.classId === editing.classId &&
      (!row.groupId || row.groupId === form.groupId)
  );

  if (loadingEnrollments && !liveEnrollments) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-5">
      {/* 1. 4-Column Session Placement Summary Strip */}
      <Card className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col gap-1.5">
          <span className="text-sm font-bold text-foreground">
            {'সেশন এনরোলমেন্ট'}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {formatNumber(totalCount, 'bn')}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {`সেশন ${yearObj?.name ?? ''}`}
            </span>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            {`সক্রিয় ${formatNumber(activeCount, 'bn')} · উত্তীর্ণ ${formatNumber(promotedCount, 'bn')} · অন্যান্য ${formatNumber(completedOrOtherCount, 'bn')}`}
          </p>
        </div>

        <div className="p-4 sm:p-5 flex flex-col gap-1.5">
          <span className="text-sm font-bold text-foreground">
            {'শ্রেণি ও শাখা বিন্যাস'}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {formatNumber(populatedSections, 'bn')}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {'টি সক্রিয় শাখা'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            {`${formatNumber(populatedClasses, 'bn')}টি শ্রেণিতে · গড়ে ${formatNumber(avgPerSection, 'bn')} জন/শাখা`}
          </p>
        </div>

        <div className="p-4 sm:p-5 flex flex-col gap-1.5">
          <span className="text-sm font-bold text-foreground">
            {'বিভাগ বণ্টন (৯ম–১০ম)'}
          </span>
          <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 tabular-nums py-0.5">
            {streamCounts.map((st) => (
              <div key={st.id} className="text-sm">
                <span className="text-xl font-extrabold text-foreground">
                  {formatNumber(st.count, 'bn')}
                </span>{' '}
                <span className="text-muted-foreground font-medium">{st.label}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            {`৯ম ও ১০ম শ্রেণিতে মোট ${formatNumber(seniorTotalCount, 'bn')} জন`}
          </p>
        </div>

        <div className="p-4 sm:p-5 flex flex-col gap-1.5">
          <span className="text-sm font-bold text-foreground">
            {'ভর্তির ধরন ও প্রমোশন'}
          </span>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {formatNumber(regularNewCount, 'bn')}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {`নতুন · পুনঃভর্তি ${formatNumber(readmissionCount, 'bn')} · রিপিটার ${formatNumber(repeaterCount, 'bn')}`}
            </span>
          </div>
          <Link
            href="/admin/students/promotions"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline w-fit"
          >
            <span>{'প্রমোশন কনসোলে যান'}</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </Card>

      {/* 2. Class Tabs & Filter Bar */}
      <Card className="overflow-hidden">
        <div
          className="flex items-center gap-1 px-4 pt-3 border-b border-border overflow-x-auto"
          role="tablist"
          aria-label={'শ্রেণি অনুযায়ী ফিল্টার'}
        >
          <button
            type="button"
            role="tab"
            aria-selected={classId === 'ALL'}
            onClick={() => {
              setClassId('ALL');
              setSectionId('ALL');
              setGroupId('ALL');
            }}
            className={cn(
              'px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums',
              classId === 'ALL'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {'সকল শ্রেণি'}{' '}
            <span className="text-sm opacity-75">({formatNumber(totalCount, 'bn')})</span>
          </button>

          {classCounts.map((cls) => {
            const active = classId === cls.id;
            return (
              <button
                key={cls.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setClassId(cls.id);
                  setSectionId('ALL');
                  if (cls.numericValue < 9) {
                    setGroupId('ALL');
                  }
                }}
                className={cn(
                  'px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums',
                  active
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {cls.label}{' '}
                <span className="text-sm opacity-75">({formatNumber(cls.count, 'bn')})</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 space-y-3">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
            <div className="relative w-full xl:w-72 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={'নাম, আইডি বা রোল খুঁজুন...'}
                className="pl-9 pr-9 h-9 text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label={'মুছুন'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-auto min-w-[128px] h-9 text-sm"
                aria-label={'শাখা'}
              >
                <option value="ALL">{'সকল শাখা'}</option>
                {availableSections.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>

              {showStreamFilter && (
                <Select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-auto min-w-[144px] h-9 text-sm"
                  aria-label={'বিভাগ'}
                >
                  <option value="ALL">{'সকল বিভাগ'}</option>
                  {academicGroups.map((grp) => (
                    <option key={grp.id} value={grp.id}>
                      {grp.nameBn || grp.name}
                    </option>
                  ))}
                </Select>
              )}

              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-auto min-w-[136px] h-9 text-sm"
                aria-label={'এনরোলমেন্ট অবস্থা'}
              >
                <option value="ALL">{'সকল অবস্থা'}</option>
                <option value={EnrollmentStatus.ACTIVE}>{'সক্রিয়'}</option>
                <option value={EnrollmentStatus.PROMOTED}>{'উত্তীর্ণ'}</option>
                <option value={EnrollmentStatus.COMPLETED}>{'সমাপ্ত'}</option>
                <option value={EnrollmentStatus.TRANSFERRED}>
                  {'স্থানান্তরিত'}
                </option>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border text-sm text-muted-foreground">
            <span className="tabular-nums">
              {hasActiveFilters
                ? `মোট ${formatNumber(totalCount, 'bn')}টি এনরোলমেন্টের মধ্যে ${formatNumber(rows.length, 'bn')}টি দেখানো হচ্ছে`
                : `শুধুমাত্র সক্রিয় (ACTIVE) এনরোলমেন্টের শাখা, রোল ও বিভাগ পরিবর্তন করা যায় · উত্তীর্ণ বা সমাপ্ত রেকর্ড ইতিহাস হিসেবে সংরক্ষিত থাকে`}
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{'ফিল্টার রিসেট করুন'}</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* 3. High-Density Session Enrollment Table */}
      <DataTable
        data={rows}
        hideToolbar
        pageSize={15}
        emptyTitle={
          totalCount === 0
            ? `${yearObj?.name ?? ''} শিক্ষাবর্ষে এখনো কোনো এনরোলমেন্ট নেই`
            : 'কোনো এনরোলমেন্ট পাওয়া যায়নি'
        }
        emptyAction={
          totalCount === 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/admin/students/promotions">
                <Button variant="primary" size="sm">
                  {'আগের সেশন থেকে প্রমোশন করুন'}
                </Button>
              </Link>
              <Link href="/admin/students/create">
                <Button variant="outline" size="sm">
                  {'নতুন ভর্তি'}
                </Button>
              </Link>
            </div>
          ) : hasActiveFilters ? (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw className="w-3.5 h-3.5" />
              {'ফিল্টার রিসেট করুন'}
            </Button>
          ) : undefined
        }
        columns={[
          {
            accessorKey: 'roll',
            header: 'রোল',
            cell: ({ row }) => (
              <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
                {String(row.original.roll).padStart(2, '0')}
              </span>
            ),
          },
          {
            accessorKey: 'studentNameBn',
            header: 'শিক্ষার্থী ও আইডি',
            cell: ({ row }) => (
              <div className="flex items-center gap-3 min-w-[200px]">
                <div
                  className={cn(
                    'w-8 h-8 rounded-[var(--radius)] flex items-center justify-center font-semibold text-sm shrink-0 border border-border',
                    row.original.studentGender === Gender.FEMALE
                      ? 'bg-secondary/10 text-secondary'
                      : 'bg-primary/10 text-primary'
                  )}
                >
                  {studentInitials(row.original.studentNameEn)}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/admin/students/${row.original.studentId}`}
                    className="font-semibold text-foreground hover:text-primary hover:underline block truncate leading-snug"
                  >
                    {row.original.studentNameBn}
                  </Link>
                  <span className="block text-sm font-mono text-muted-foreground truncate">
                    {row.original.studentCode}
                  </span>
                  {(row.original.isRepeater || row.original.isReadmission) && (
                    <span className="inline-block mt-0.5 text-sm font-medium text-warning">
                      {[
                        row.original.isRepeater ? 'পুনরাবৃত্তি' : null,
                        row.original.isReadmission ? 'পুনঃভর্তি' : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
                </div>
              </div>
            ),
          },
          {
            accessorKey: 'classNumeric',
            header: 'শ্রেণি ও শাখা',
            cell: ({ row }) => (
              <div className="whitespace-nowrap">
                <span className="font-medium text-foreground">{row.original.classLabel}</span>
                <span className="text-muted-foreground"> · {row.original.sectionLabel}</span>
              </div>
            ),
          },
          ...(showStreamColumn
            ? [
                {
                  accessorKey: 'groupLabel',
                  header: 'বিভাগ ও ৪র্থ বিষয়',
                  cell: ({ row }: { row: { original: EnrichedEnrollment } }) => (
                    <div className="whitespace-nowrap">
                      <span className="text-foreground">
                        {row.original.groupLabel || '—'}
                      </span>
                      {row.original.optionalSubjectLabel && (
                        <span className="block text-sm text-muted-foreground mt-0.5">
                          {'৪র্থ:'} {row.original.optionalSubjectLabel}
                        </span>
                      )}
                    </div>
                  ),
                },
              ]
            : []),
          {
            accessorKey: 'status',
            header: 'অবস্থা',
            cell: ({ row }) => (
              <StatusBadge enumName="EnrollmentStatus" value={row.original.status} />
            ),
          },
          {
            id: 'actions',
            header: () => (
              <div className="text-right">{'কাজ'}</div>
            ),
            enableSorting: false,
            cell: ({ row }) => {
              const editable = row.original.status === EnrollmentStatus.ACTIVE;
              return (
                <div className="flex items-center justify-end gap-1.5">
                  {editable ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-sm"
                      onClick={() => startEdit(row.original)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>{'সম্পাদনা'}</span>
                    </Button>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 px-2 text-sm text-muted-foreground whitespace-nowrap"
                      title={'উত্তীর্ণ বা সমাপ্ত সেশনের এনরোলমেন্ট সংরক্ষিত থাকে'}
                    >
                      <Lock className="w-3 h-3" />
                      <span>{'সংরক্ষিত'}</span>
                    </span>
                  )}
                  <Link
                    href={`/admin/students/${row.original.studentId}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    aria-label={'শিক্ষার্থীর প্রোফাইল'}
                    title={'শিক্ষার্থীর প্রোফাইল'}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            },
          },
        ]}
      />

      {/* 4. Session Placement Adjustment Modal */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={'চলতি সেশনের প্লেসমেন্ট সম্পাদনা'}
        description={'শাখা পরিবর্তন, রোল সংশোধন, বিভাগ বা ঐচ্ছিক বিষয় হালনাগাদ করুন। শ্রেণি পরিবর্তনের জন্য প্রমোশন কনসোল ব্যবহার করুন।'}
      >
        {editing && (
          <form onSubmit={saveEdit} className="space-y-5">
            {/* Context summary strip */}
            <div className="p-3.5 rounded-[var(--radius)] bg-surface-muted/60 border border-border flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <p className="font-semibold text-foreground">{editing.studentNameBn}</p>
                <p className="text-sm text-muted-foreground font-mono mt-0.5">
                  {editing.studentCode} · {editing.classLabel} · {yearObj?.name ?? ''}
                </p>
              </div>
              <StatusBadge enumName="EnrollmentStatus" value={editing.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={'শাখা'} required>
                <Select
                  value={form.sectionId}
                  onChange={(event) => setForm({ ...form, sectionId: event.target.value })}
                >
                  {sections
                    .filter((item) => item.classId === editing.classId)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </Select>
              </FormField>

              <FormField label={'রোল নম্বর'} required>
                <Input placeholder="রোল নম্বর লিখুন"
                  type="number"
                  min={1}
                  value={form.roll}
                  onChange={(event) => setForm({ ...form, roll: event.target.value })}
                />
              </FormField>

              {editingNeedsGroup && (
                <>
                  <FormField label={'বিভাগ (স্ট্রিম)'} required>
                    <Select
                      value={form.groupId}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          groupId: event.target.value,
                          optionalClassSubjectId: '',
                        })
                      }
                    >
                      <option value="">{'নির্বাচন করুন'}</option>
                      {academicGroups.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nameBn || item.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label={'৪র্থ / ঐচ্ছিক বিষয়'}>
                    <Select
                      value={form.optionalClassSubjectId}
                      onChange={(event) =>
                        setForm({ ...form, optionalClassSubjectId: event.target.value })
                      }
                    >
                      <option value="">{'নেই'}</option>
                      {editingOptionals.map((row) => {
                        const subject =
                          row.subject ??
                          db?.subjects.find((item) => item.id === row.subjectId);
                        return (
                          <option key={row.id} value={row.id}>
                            {subject?.nameBn || subject?.name}
                          </option>
                        );
                      })}
                    </Select>
                  </FormField>
                </>
              )}

              <div className="sm:col-span-2 flex flex-wrap items-center gap-6 pt-1">
                <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isRepeater}
                    onChange={(event) => setForm({ ...form, isRepeater: event.target.checked })}
                  />
                  <span>{'পুনরাবৃত্তি শিক্ষার্থী (Repeater)'}</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isReadmission}
                    onChange={(event) => setForm({ ...form, isReadmission: event.target.checked })}
                  />
                  <span>{'পুনঃভর্তি (Readmission)'}</span>
                </label>
              </div>

              <div className="sm:col-span-2">
                <FormField label={'প্রশাসনিক মন্তব্য'}>
                  <Textarea
                    value={form.remarks}
                    onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                    placeholder={'যেমন: অভিভাবকের আবেদনে শাখা পরিবর্তন...'}
                  />
                </FormField>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                {'বাতিল'}
              </Button>
              <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
