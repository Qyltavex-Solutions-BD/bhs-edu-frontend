'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  useAssignClassTeacherMutation,
  useAssignTeacherMutation,
  useGetAcademicGroupsQuery,
  useGetClassSubjectsQuery,
  useGetClassTeachersQuery,
  useGetSchoolClassesQuery,
  useGetSectionsQuery,
  useGetTeacherAssignmentsPaginatedQuery,
  useGetTeacherAssignmentsQuery,
  useReleaseTeacherAssignmentMutation,
  useRemoveClassTeacherMutation,
  useUpdateTeacherAssignmentMutation,
  type TeacherAssignmentItem,
} from '@/src/services/academic';
import { ConfirmDialog } from '@/src/components/shared/Feedback';
import { useGetStaffQuery } from '@/src/features/staff/api/staff.api';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { Button, Card, FormField, Input, Modal, SegmentedTabs, Select } from '@/src/components/ui/primitives';
import { Search, Plus, Trash2, BookOpen, CheckCircle2, RotateCcw, Pencil } from 'lucide-react';
import type { AcademicYear } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';
import { StaffStatus, StaffType } from '@/src/types/enums';

function errorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return fallback;
}

export function AcademicStaffing({
  mode,
  db,
  year,
}: {
  mode: 'class-teachers' | 'assignments';
  db: MockDatabase;
  year: AcademicYear;
}) {
  const { locale, pick } = useI18n();
  const { data: realStaff } = useGetStaffQuery({
    staffType: StaffType.TEACHER,
    status: StaffStatus.ACTIVE,
    limit: 100,
  });
  const { data: realClasses } = useGetSchoolClassesQuery();
  const { data: realSections } = useGetSectionsQuery();

  const teachers = useMemo(() => {
    if (realStaff && realStaff.length > 0) return realStaff;
    return db.staff.filter(
      (member) => member.staffType === StaffType.TEACHER && member.status === StaffStatus.ACTIVE
    );
  }, [realStaff, db.staff]);

  const classes = useMemo(
    () => (realClasses && realClasses.length > 0 ? realClasses : db.classes),
    [realClasses, db.classes]
  );

  const sections = useMemo(() => {
    const source = realSections && realSections.length > 0 ? realSections : db.sections;
    return source.filter((section) => section.isActive);
  }, [realSections, db.sections]);

  const [activeTab, setActiveTab] = useState<'assignments' | 'class-teachers'>(
    mode === 'class-teachers' ? 'class-teachers' : 'assignments'
  );

  const classLabel = (classId: string) => {
    const schoolClass = classes.find((item) => item.id === classId);
    return locale === 'bn' ? schoolClass?.nameBn || schoolClass?.name : schoolClass?.name;
  };
  const teacherName = (staffId: string) =>
    teachers.find((member) => member.id === staffId)?.name ?? '—';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <SegmentedTabs
          value={activeTab}
          onChange={(val) => setActiveTab(val as 'assignments' | 'class-teachers')}
          items={[
            {
              value: 'assignments',
              label: pick('বিষয় শিক্ষক বণ্টন', 'Subject Teachers'),
            },
            {
              value: 'class-teachers',
              label: pick('শ্রেণি শিক্ষক', 'Class Teachers'),
            },
          ]}
        />
      </div>

      {activeTab === 'class-teachers' ? (
        <ClassTeachers
          db={db}
          year={year}
          teachers={teachers}
          sections={sections}
          classLabel={classLabel}
          teacherName={teacherName}
        />
      ) : (
        <SubjectTeachers
          db={db}
          year={year}
          teachers={teachers}
          classes={classes}
          sections={sections}
          classLabel={classLabel}
          teacherName={teacherName}
        />
      )}
    </div>
  );
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (val?: string) => Boolean(val && UUID_REGEX.test(val));

function ClassTeachers({
  db,
  year,
  teachers,
  sections,
  classLabel,
  teacherName,
}: {
  db: MockDatabase;
  year: AcademicYear;
  teachers: MockDatabase['staff'];
  sections: MockDatabase['sections'];
  classLabel: (classId: string) => string | undefined;
  teacherName: (staffId: string) => string;
}) {
  const { pick } = useI18n();
  const { data: realClassTeachers, isLoading: loadingClassTeachers } =
    useGetClassTeachersQuery(isUuid(year?.id) ? { academicYearId: year.id } : undefined, {
      skip: !isUuid(year?.id),
    });
  const [assignClassTeacher, { isLoading: saving }] = useAssignClassTeacherMutation();
  const [removeClassTeacher, { isLoading: removing }] = useRemoveClassTeacherMutation();
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '');
  const [staffId, setStaffId] = useState(teachers[0]?.id ?? '');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sections.length > 0 && (!sectionId || !sections.some((s) => s.id === sectionId))) {
      setSectionId(sections[0].id);
    }
  }, [sections, sectionId]);

  useEffect(() => {
    if (teachers.length > 0 && (!staffId || !teachers.some((t) => t.id === staffId))) {
      setStaffId(teachers[0].id);
    }
  }, [teachers, staffId]);

  const assignmentsList = useMemo(() => {
    if (realClassTeachers !== undefined) return realClassTeachers;
    return db.sectionClassTeachers.filter((item) => item.academicYearId === year.id);
  }, [realClassTeachers, db.sectionClassTeachers, year.id]);

  const rows = useMemo(
    () =>
      sections.map((section) => ({
        section,
        assignment: assignmentsList.find((item) => item.sectionId === section.id),
      })),
    [sections, assignmentsList]
  );

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await assignClassTeacher({
        academicYearId: year.id,
        sectionId,
        staffId,
      }).unwrap();
      toast.success(pick('শ্রেণি শিক্ষক বসানো হয়েছে।', 'Class teacher saved.'));
      setOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, pick('শ্রেণি শিক্ষক বসানো যায়নি।', 'Could not save the class teacher.')));
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeClassTeacher(id).unwrap();
      toast.success(pick('শ্রেণি শিক্ষক সরানো হয়েছে।', 'Class teacher removed.'));
    } catch (err) {
      toast.error(errorMessage(err, pick('সরানো যায়নি।', 'Could not remove the class teacher.')));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base text-muted-foreground max-w-2xl">
          {pick(
            `${year.name} সালে এক শাখায় একজন শ্রেণি শিক্ষক। একজন শিক্ষক একই বছরে একটি শাখার শ্রেণি শিক্ষক হতে পারবেন।`,
            `In ${year.name}, each section has one class teacher. A teacher can hold only one section that year.`
          )}
        </p>
        <Button type="button" variant="primary" onClick={() => setOpen(true)}>
          {pick('শ্রেণি শিক্ষক বসান', 'Assign class teacher')}
        </Button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={pick('শ্রেণি শিক্ষক', 'Class teacher')}
        description={pick('শাখায় আগে থেকে কেউ থাকলে সেই জায়গায় নতুন শিক্ষক বসবে।', 'If the section already has a class teacher, this replaces them.')}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <FormField label={pick('শাখা', 'Section')}>
            <Select value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {classLabel(section.classId)} — {section.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={pick('শিক্ষক', 'Teacher')}>
            <Select value={staffId} onChange={(event) => setStaffId(event.target.value)}>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} · {teacher.designation}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{pick('বাতিল', 'Cancel')}</Button>
            <Button type="submit" variant="primary" disabled={saving || !sectionId || !staffId}>
              {saving ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('সংরক্ষণ করুন', 'Save')}
            </Button>
          </div>
        </form>
      </Modal>
      <Card className="overflow-x-auto">
        <table className="w-full text-base">
          <thead className="bg-surface-muted text-sm text-muted-foreground">
            <tr>
              <th className="p-3.5 text-left font-semibold">{pick('শ্রেণি', 'Class')}</th>
              <th className="p-3.5 text-left font-semibold">{pick('শাখা', 'Section')}</th>
              <th className="p-3.5 text-left font-semibold">{pick('শ্রেণি শিক্ষক', 'Class teacher')}</th>
              <th className="p-3.5 text-right font-semibold">{pick('কাজ', 'Action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loadingClassTeachers ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={`ct-skel-${idx}`} className="animate-pulse">
                  <td className="p-3.5"><div className="h-5 w-28 rounded bg-surface-muted" /></td>
                  <td className="p-3.5"><div className="h-5 w-16 rounded bg-surface-muted" /></td>
                  <td className="p-3.5"><div className="h-5 w-44 rounded bg-surface-muted" /></td>
                  <td className="p-3.5 text-right"><div className="inline-block h-8 w-16 rounded bg-surface-muted" /></td>
                </tr>
              ))
            ) : (
              rows.map(({ section, assignment }) => {
                const assignedName =
                  assignment && 'staff' in assignment && assignment.staff?.name
                    ? assignment.staff.name
                    : assignment
                      ? teacherName(assignment.staffId)
                      : '—';
                return (
                  <tr key={section.id}>
                    <td className="p-3.5">{classLabel(section.classId)}</td>
                    <td className="p-3.5 font-medium">{section.name}</td>
                    <td className="p-3.5 font-medium text-foreground">{assignedName}</td>
                    <td className="p-3.5 text-right">
                      {assignment && (
                        <Button type="button" variant="outline" size="sm" disabled={removing} onClick={() => handleRemove(assignment.id)}>
                          {pick('সরান', 'Remove')}
                        </Button>
                      )}
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

function SubjectTeachers({
  db,
  year,
  teachers,
  classes,
  sections,
  classLabel,
  teacherName,
}: {
  db: MockDatabase;
  year: AcademicYear;
  teachers: MockDatabase['staff'];
  classes: MockDatabase['classes'];
  sections: MockDatabase['sections'];
  classLabel: (classId: string) => string | undefined;
  teacherName: (staffId: string) => string;
}) {
  const { locale, pick } = useI18n();
  const [assignTeacher, { isLoading: saving }] = useAssignTeacherMutation();
  const [updateAssignment, { isLoading: updating }] = useUpdateTeacherAssignmentMutation();
  const [releaseAssignment, { isLoading: removing }] = useReleaseTeacherAssignmentMutation();

  // Filtering & pagination states (backend-driven)
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [removeTarget, setRemoveTarget] = useState<TeacherAssignmentItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [year.id, classFilter, sectionFilter]);

  const { data: realClassSubjects } = useGetClassSubjectsQuery(
    isUuid(year?.id) ? { academicYearId: year.id } : undefined,
    { skip: !isUuid(year?.id) }
  );
  const { data: realGroups } = useGetAcademicGroupsQuery();
  const { data: realAssignments } = useGetTeacherAssignmentsQuery(
    isUuid(year?.id) ? { academicYearId: year.id, isActive: true, limit: 500 } : undefined,
    { skip: !isUuid(year?.id) }
  );
  const {
    data: paginatedAssignments,
    isLoading: loadingAssignments,
    isFetching: fetchingAssignments,
  } = useGetTeacherAssignmentsPaginatedQuery(
    {
      academicYearId: year.id,
      isActive: true,
      page,
      limit: 15,
      ...(classFilter !== 'ALL' ? { classId: classFilter } : {}),
      ...(sectionFilter !== 'ALL' ? { sectionId: sectionFilter } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    },
    { skip: !isUuid(year?.id) }
  );

  const filteredRows: TeacherAssignmentItem[] = paginatedAssignments?.items ?? [];
  const assignmentsMeta = paginatedAssignments?.meta ?? {
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const classSubjectsList = useMemo(
    () =>
      realClassSubjects !== undefined
        ? realClassSubjects
        : db.classSubjects.filter((item) => item.academicYearId === year.id),
    [realClassSubjects, db.classSubjects, year.id]
  );

  const groupsList = useMemo(
    () => (realGroups && realGroups.length > 0 ? realGroups : db.academicGroups),
    [realGroups, db.academicGroups]
  );

  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '');
  useEffect(() => {
    if (sections.length > 0 && (!sectionId || !sections.some((s) => s.id === sectionId))) {
      setSectionId(sections[0].id);
    }
  }, [sections, sectionId]);

  const section = sections.find((item) => item.id === sectionId);
  const subjects = classSubjectsList.filter(
    (item) => item.academicYearId === year.id && item.classId === section?.classId && item.isActive
  );
  const [classSubjectId, setClassSubjectId] = useState(subjects[0]?.id ?? '');
  const [staffId, setStaffId] = useState(teachers[0]?.id ?? '');
  useEffect(() => {
    if (teachers.length > 0 && (!staffId || !teachers.some((t) => t.id === staffId))) {
      setStaffId(teachers[0].id);
    }
  }, [teachers, staffId]);

  const [canEnterMarks, setCanEnterMarks] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<TeacherAssignmentItem | null>(null);
  const selectedSubjectId = subjects.some((item) => item.id === classSubjectId) ? classSubjectId : subjects[0]?.id ?? '';

  const subjectLabel = (classSubjectIdValue: string, row?: TeacherAssignmentItem) => {
    if (row?.classSubject?.subject) {
      const sub = row.classSubject.subject;
      return locale === 'bn' ? sub.nameBn || sub.name : sub.name;
    }
    const classSubject = classSubjectsList.find((item) => item.id === classSubjectIdValue);
    const subject = classSubject?.subject ?? db.subjects.find((item) => item.id === classSubject?.subjectId);
    const group = classSubject?.groupId
      ? groupsList.find((item) => item.id === classSubject.groupId)
      : undefined;
    const name = locale === 'bn' ? subject?.nameBn || subject?.name : subject?.name;
    const groupName = group ? (locale === 'bn' ? group.nameBn || group.name : group.name) : '';
    return groupName ? `${name} · ${groupName}` : name ?? '—';
  };

  const allAssignments = useMemo<TeacherAssignmentItem[]>(() => {
    if (realAssignments !== undefined) {
      return realAssignments.filter((item) => item.isActive);
    }
    return db.teacherAssignments
      .filter((item) => item.academicYearId === year.id && item.isActive)
      .map((item) => ({
        ...item,
        assignedDate: item.assignedDate || new Date().toISOString(),
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      }));
  }, [realAssignments, db.teacherAssignments, year.id]);

  const activeClasses = useMemo(
    () => [...classes].filter((c) => c.isActive).sort((a, b) => a.numericValue - b.numericValue),
    [classes]
  );

  // Dynamic statistics based on classFilter & sectionFilter (per section-subject slot)
  const relevantSections = useMemo(() => {
    return sections.filter(
      (s) =>
        (classFilter === 'ALL' ? true : s.classId === classFilter) &&
        (sectionFilter === 'ALL' ? true : s.id === sectionFilter)
    );
  }, [sections, classFilter, sectionFilter]);

  const totalRequiredSlots = useMemo(() => {
    return relevantSections.reduce((sum, sec) => {
      const count = classSubjectsList.filter(
        (cs) => cs.academicYearId === year.id && cs.classId === sec.classId && cs.isActive
      ).length;
      return sum + count;
    }, 0);
  }, [relevantSections, classSubjectsList, year.id]);

  const relevantAssignments = useMemo(() => {
    return allAssignments.filter(
      (a) =>
        (classFilter === 'ALL' ? true : a.classId === classFilter) &&
        (sectionFilter === 'ALL' ? true : a.sectionId === sectionFilter)
    );
  }, [allAssignments, classFilter, sectionFilter]);

  const assignedSlotKeys = useMemo(() => {
    return new Set(relevantAssignments.map((a) => `${a.sectionId}:${a.classSubjectId}`));
  }, [relevantAssignments]);

  const pendingSlotsCount = Math.max(0, totalRequiredSlots - assignedSlotKeys.size);

  const relevantTeachingTeachers = useMemo(() => {
    return new Set(relevantAssignments.map((a) => a.staffId));
  }, [relevantAssignments]);

  const freeTeachersCount = Math.max(0, teachers.length - relevantTeachingTeachers.size);

  const openCreateModal = () => {
    setEditingRow(null);
    if (sectionFilter !== 'ALL' && sections.some((s) => s.id === sectionFilter)) {
      setSectionId(sectionFilter);
    } else if (classFilter !== 'ALL') {
      const firstSec = sections.find((s) => s.classId === classFilter);
      if (firstSec) setSectionId(firstSec.id);
    }
    setCanEnterMarks(true);
    setOpen(true);
  };

  const openEditModal = (row: TeacherAssignmentItem) => {
    setEditingRow(row);
    setSectionId(row.sectionId);
    setClassSubjectId(row.classSubjectId);
    setStaffId(row.staffId);
    setCanEnterMarks(row.canEnterMarks);
    setOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingRow) {
        await updateAssignment({
          id: editingRow.id,
          staffId,
          canEnterMarks,
        }).unwrap();
        toast.success(pick('বিষয় শিক্ষক বণ্টন হালনাগাদ হয়েছে।', 'Subject teacher assignment updated.'));
      } else {
        if (!section?.classId) return;
        await assignTeacher({
          academicYearId: year.id,
          classId: section.classId,
          sectionId,
          classSubjectId: selectedSubjectId,
          staffId,
          canEnterMarks,
          replaceExisting: true,
        }).unwrap();
        toast.success(pick('বিষয় শিক্ষক বণ্টন সম্পন্ন হয়েছে।', 'Subject teacher assigned.'));
      }
      setOpen(false);
      setEditingRow(null);
    } catch (err) {
      toast.error(errorMessage(err, pick('বণ্টন হয়নি।', 'Could not assign the teacher.')));
    }
  };

  const handleToggleMarks = async (row: TeacherAssignmentItem) => {
    try {
      await updateAssignment({
        id: row.id,
        canEnterMarks: !row.canEnterMarks,
      }).unwrap();
      toast.success(
        !row.canEnterMarks
          ? pick('নম্বর এন্ট্রির অনুমতি দেওয়া হয়েছে।', 'Marks entry permission enabled.')
          : pick('নম্বর এন্ট্রির অনুমতি বন্ধ করা হয়েছে।', 'Marks entry permission disabled.')
      );
    } catch (err) {
      toast.error(errorMessage(err, pick('অনুমতি পরিবর্তন করা যায়নি।', 'Could not update permission.')));
    }
  };

  const handleRemove = (row: TeacherAssignmentItem) => {
    setRemoveTarget(row);
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    try {
      await releaseAssignment({ id: removeTarget.id }).unwrap();
      toast.success(pick('বণ্টন সরানো হয়েছে।', 'Assignment released.'));
      setRemoveTarget(null);
    } catch (err) {
      toast.error(errorMessage(err, pick('বণ্টন সরানো যায়নি।', 'Could not remove the assignment.')));
    }
  };

  const isFiltered = classFilter !== 'ALL' || sectionFilter !== 'ALL' || searchQuery.trim() !== '';
  const resetFilters = () => {
    setClassFilter('ALL');
    setSectionFilter('ALL');
    setSearchQuery('');
    setPage(1);
  };

  const filterSections = useMemo(() => {
    if (classFilter === 'ALL') return sections;
    return sections.filter((s) => s.classId === classFilter);
  }, [sections, classFilter]);

  return (
    <div className="space-y-6">
      {/* 1. Top Actionable KPI Summary Cards */}
      <div className="bg-surface border border-border rounded-[var(--radius)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border shadow-xs">
        <div className="p-4 sm:p-5">
          <p className="text-sm font-medium text-muted-foreground">{pick('বিষয় বণ্টন অগ্রগতি', 'Subject Allocation Progress')}</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums mt-1.5">
            {formatNumber(assignedSlotKeys.size, locale)}
            <span className="text-sm sm:text-base font-normal text-muted-foreground"> / {formatNumber(totalRequiredSlots, locale)} {pick('টি বিষয়', 'slots')}</span>
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-normal">
            {pick(`মোট বরাদ্দ: ${formatNumber(relevantAssignments.length, locale)}টি পাঠদান`, `Total: ${formatNumber(relevantAssignments.length, locale)} assignments`)}
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-sm font-medium text-muted-foreground">{pick('শিক্ষকহীন বাকি বিষয়', 'Pending / Unassigned Subjects')}</p>
          <p className={`text-2xl sm:text-3xl font-bold tabular-nums mt-1.5 flex items-center gap-1.5 ${pendingSlotsCount > 0 ? 'text-amber-500' : 'text-success'}`}>
            {formatNumber(pendingSlotsCount, locale)}
            <span className="text-sm sm:text-base font-normal text-muted-foreground">{pick('টি বিষয় বাকি', 'subjects pending')}</span>
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-normal">
            {pendingSlotsCount > 0
              ? pick('এগুলোতে এখনও কোনো শিক্ষক বসানো হয়নি', 'Needs teacher allocation')
              : pick('সব বিষয়ে শিক্ষক বরাদ্দ সম্পন্ন হয়েছে', 'All curriculum subjects allocated')}
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-sm font-medium text-muted-foreground">{pick('শ্রেণিকক্ষে শিক্ষক', 'Teachers in Classroom')}</p>
          <p className="text-2xl sm:text-3xl font-bold text-primary tabular-nums mt-1.5">
            {formatNumber(relevantTeachingTeachers.size, locale)}
            <span className="text-sm sm:text-base font-normal text-muted-foreground"> / {formatNumber(teachers.length, locale)} {pick('জন', 'teachers')}</span>
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-normal">
            {pick('সক্রিয়ভাবে পাঠদানে যুক্ত আছেন', 'Actively assigned to classes')}
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-sm font-medium text-muted-foreground">{pick('দায়িত্বহীন / ফ্রি শিক্ষক', 'Available / Free Teachers')}</p>
          <p className={`text-2xl sm:text-3xl font-bold tabular-nums mt-1.5 ${freeTeachersCount > 0 ? 'text-foreground' : 'text-success'}`}>
            {formatNumber(freeTeachersCount, locale)}
            <span className="text-sm sm:text-base font-normal text-muted-foreground ml-1">{pick('জন শিক্ষক', 'free teachers')}</span>
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-normal">
            {freeTeachersCount > 0
              ? pick('এখনও কোনো বিষয়ে ক্লাস বরাদ্দ পাননি', 'No class allocated yet')
              : pick('সকল শিক্ষককে ক্লাসে যুক্ত করা হয়েছে', 'All teachers deployed')}
          </p>
        </div>
      </div>

      {/* 2. Toolbar Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative w-72 sm:w-84">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={pick('শিক্ষক বা বিষয় খুঁজুন...', 'Search teacher or subject...')}
              className="pl-9 h-10 text-sm"
            />
          </div>

          {isFiltered && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="h-10 px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              {pick('রিসেট', 'Reset')}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setSectionFilter('ALL');
            }}
            className="w-48 h-10 text-sm"
          >
            <option value="ALL">{pick('সকল শ্রেণি', 'All Classes')}</option>
            {activeClasses.map((cls) => {
              const count = allAssignments.filter((a) => a.classId === cls.id).length;
              return (
                <option key={cls.id} value={cls.id}>
                  {classLabel(cls.id) || cls.name} ({formatNumber(count, locale)}টি)
                </option>
              );
            })}
          </Select>

          <Select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="w-40 h-10 text-sm"
          >
            <option value="ALL">{pick('সকল শাখা', 'All Sections')}</option>
            {filterSections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {classFilter === 'ALL' ? `${classLabel(sec.classId)} — ` : ''}
                {sec.name} {pick('শাখা', 'Sec')}
              </option>
            ))}
          </Select>

          <Button type="button" variant="primary" size="sm" onClick={openCreateModal} className="h-10 text-sm px-4">
            <Plus className="w-4 h-4 mr-1.5" />
            {pick('নতুন শিক্ষক বণ্টন', 'Assign Subject Teacher')}
          </Button>
        </div>
      </div>

      {/* 4. Modal to Assign or Edit Subject Teacher */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingRow(null);
        }}
        title={
          editingRow
            ? pick('বিষয় শিক্ষক সম্পাদনা', 'Edit Subject Teacher')
            : pick('বিষয় শিক্ষক বণ্টন', 'Assign Subject Teacher')
        }
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label={pick('শ্রেণি ও শাখা', 'Class & Section')} required>
            <Select
              value={sectionId}
              disabled={Boolean(editingRow)}
              onChange={(event) => {
                setSectionId(event.target.value);
                setClassSubjectId('');
              }}
            >
              {sections.map((item) => (
                <option key={item.id} value={item.id}>
                  {classLabel(item.classId)} — {item.name} শাখা
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={pick('পাঠ্যক্রমের বিষয়', 'Curriculum Subject')} required>
            <Select
              value={selectedSubjectId}
              disabled={Boolean(editingRow)}
              onChange={(event) => setClassSubjectId(event.target.value)}
            >
              {subjects.length === 0 && <option value="">{pick('এই শ্রেণিতে কোনো সক্রিয় বিষয় নেই', 'No active subjects')}</option>}
              {subjects.map((item) => {
                const existingForSlot = !editingRow
                  ? allAssignments.find(
                      (a) => a.sectionId === sectionId && a.classSubjectId === item.id
                    )
                  : undefined;
                return (
                  <option key={item.id} value={item.id}>
                    {subjectLabel(item.id)}
                    {existingForSlot
                      ? ` (${pick('বর্তমান', 'Current')}: ${existingForSlot.staff?.name || teacherName(existingForSlot.staffId)})`
                      : ''}
                  </option>
                );
              })}
            </Select>
          </FormField>
          <FormField label={pick('মনোনীত শিক্ষক', 'Assigned Teacher')} required>
            <Select value={staffId} onChange={(event) => setStaffId(event.target.value)}>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.nameBn || teacher.name} ({teacher.designation})
                </option>
              ))}
            </Select>
          </FormField>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="canEnterMarks"
              checked={canEnterMarks}
              onChange={(e) => setCanEnterMarks(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
            />
            <label htmlFor="canEnterMarks" className="text-sm text-foreground font-medium cursor-pointer">
              {pick('পরীক্ষার নম্বর এন্ট্রি ও সংশোধনের অনুমতি দিন', 'Allow marks entry for examinations')}
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setEditingRow(null);
              }}
            >
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving || updating || !selectedSubjectId || !staffId}
            >
              {saving || updating
                ? pick('সংরক্ষণ হচ্ছে...', 'Saving...')
                : pick('সংরক্ষণ করুন', 'Save Assignment')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Main Assignment Table */}
      <Card className="overflow-x-auto border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-muted-foreground border-b border-border">
            <tr>
              <th className="p-3.5 text-left font-semibold text-foreground/80">{pick('শ্রেণি ও শাখা', 'Class & Section')}</th>
              <th className="p-3.5 text-left font-semibold text-foreground/80">{pick('বিষয় ও গ্রুপ', 'Subject & Group')}</th>
              <th className="p-3.5 text-left font-semibold text-foreground/80">{pick('দায়িত্বপ্রাপ্ত শিক্ষক', 'Assigned Teacher')}</th>
              <th className="p-3.5 text-center font-semibold text-foreground/80">{pick('নম্বর এন্ট্রি', 'Marks Entry')}</th>
              <th className="p-3.5 text-right font-semibold text-foreground/80">{pick('কাজ', 'Action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loadingAssignments ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`ta-skel-${idx}`} className="animate-pulse">
                  <td className="p-3.5"><div className="h-5 w-36 rounded bg-surface-muted" /></td>
                  <td className="p-3.5"><div className="h-5 w-40 rounded bg-surface-muted" /></td>
                  <td className="p-3.5"><div className="h-5 w-44 rounded bg-surface-muted" /></td>
                  <td className="p-3.5 text-center"><div className="inline-block h-6 w-24 rounded-full bg-surface-muted" /></td>
                  <td className="p-3.5 text-right"><div className="inline-block h-8 w-18 rounded bg-surface-muted" /></td>
                </tr>
              ))
            ) : filteredRows.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-muted-foreground" colSpan={5}>
                  <BookOpen className="w-9 h-9 mx-auto mb-2 opacity-40 text-muted-foreground" />
                  <p className="text-base font-semibold text-foreground">{pick('কোনো বিষয় শিক্ষক বণ্টন পাওয়া যায়নি', 'No subject assignments found')}</p>
                  <p className="text-sm mt-1.5 text-muted-foreground">
                    {isFiltered
                      ? pick('ফিল্টারের সাথে মেলে এমন কোনো রেকর্ড নেই। ফিল্টার রিসেট করে দেখুন।', 'No records match the current filter.')
                      : pick('এই শিক্ষাবর্ষের জন্য কোনো শিক্ষক বণ্টন করা হয়নি। উপরের বাটনে ক্লিক করে বণ্টন করুন।', 'No teacher assignments made yet.')}
                  </p>
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const sectionRow = sections.find((item) => item.id === row.sectionId);
                const teacher = teachers.find((item) => item.id === row.staffId);
                const clsTitle = row.schoolClass?.name || classLabel(row.classId) || '—';
                const sectionTitle = row.section?.name || sectionRow?.name || '';
                const teacherDisplay =
                  teacher?.nameBn || teacher?.name || row.staff?.name || teacherName(row.staffId);
                const teacherDesig = teacher?.designation || row.staff?.designation;

                return (
                  <tr key={row.id} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-base">{clsTitle}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-muted text-xs font-medium text-muted-foreground border border-border">
                          {sectionTitle} {pick('শাখা', 'Sec')}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-foreground text-base">
                        {subjectLabel(row.classSubjectId, row)}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div>
                        <p className="font-semibold text-primary text-base">
                          {teacherDisplay}
                        </p>
                        {teacherDesig && (
                          <p className="text-sm text-muted-foreground mt-0.5">{teacherDesig}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() => handleToggleMarks(row)}
                        title={pick('ক্লিক করে অনুমতি পরিবর্তন করুন', 'Click to toggle marks entry permission')}
                        className="cursor-pointer disabled:opacity-60"
                      >
                        {row.canEnterMarks ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {pick('অনুমোদিত', 'Allowed')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-surface-muted text-muted-foreground border border-border hover:bg-surface-muted/80 transition-colors">
                            {pick('অনুমতি নেই', 'Not allowed')}
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={updating || removing}
                          onClick={() => openEditModal(row)}
                          className="text-xs sm:text-sm"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                          {pick('সম্পাদনা', 'Edit')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={removing}
                          onClick={() => handleRemove(row)}
                          className="text-xs sm:text-sm text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          {pick('সরান', 'Remove')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {assignmentsMeta.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {locale === 'bn'
              ? `মোট ${formatNumber(assignmentsMeta.total, 'bn')} টি বণ্টন · পৃষ্ঠা ${formatNumber(assignmentsMeta.page, 'bn')} / ${formatNumber(assignmentsMeta.totalPages, 'bn')}`
              : `Total ${assignmentsMeta.total} assignments · Page ${assignmentsMeta.page} / ${assignmentsMeta.totalPages}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!assignmentsMeta.hasPreviousPage || fetchingAssignments}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {pick('পূর্ববর্তী', 'Previous')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!assignmentsMeta.hasNextPage || fetchingAssignments}
              onClick={() => setPage((p) => p + 1)}
            >
              {pick('পরবর্তী', 'Next')}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={confirmRemove}
        title={pick('শিক্ষক বণ্টন সরান', 'Remove Teacher Assignment')}
        description={
          removeTarget
            ? pick(
                `আপনি কি নিশ্চিতভাবে "${removeTarget.staff?.name || teacherName(removeTarget.staffId)}"-কে "${subjectLabel(removeTarget.classSubjectId, removeTarget)}" থেকে সরাতে চান?`,
                `Are you sure you want to remove "${removeTarget.staff?.name || teacherName(removeTarget.staffId)}" from "${subjectLabel(removeTarget.classSubjectId, removeTarget)}"?`,
              )
            : ''
        }
        confirmLabel={pick('সরান', 'Remove')}
        destructive
        loading={removing}
      />
    </div>
  );
}
