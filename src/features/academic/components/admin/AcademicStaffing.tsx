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
  useGetSubjectsQuery,
  useGetTeacherAssignmentsQuery,
  useReleaseTeacherAssignmentMutation,
  useRemoveClassTeacherMutation,
  useUpdateTeacherAssignmentMutation,
  type TeacherAssignmentItem,
} from '@/src/services/academic';
import { ConfirmDialog } from '@/src/components/shared/Feedback';
import { useGetStaffQuery } from '@/src/features/staff/api/staff.api';
import { formatNumber } from '@/src/lib/formatters';
import { Button, Card, FormField, Input, Modal, SegmentedTabs, Select } from '@/src/components/ui/primitives';
import { Search, Plus, Trash2, BookOpen, CheckCircle2, RotateCcw, Pencil, Save } from 'lucide-react';
import type { AcademicYear, SchoolClass, Section, Staff } from '@/src/types/entities';
import { StaffStatus, StaffType } from '@/src/types/enums';

function errorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return fallback;
}

export function AcademicStaffing({
  mode,
  year,
}: {
  mode: 'class-teachers' | 'assignments';
  year: AcademicYear;
}) {
  const { data: realStaff } = useGetStaffQuery({
    staffType: StaffType.TEACHER,
    status: StaffStatus.ACTIVE,
    limit: 100,
  });
  const { data: realClasses } = useGetSchoolClassesQuery();
  const { data: realSections } = useGetSectionsQuery();

  const teachers = useMemo(() => realStaff ?? [], [realStaff]);

  const classes = useMemo(() => realClasses ?? [], [realClasses]);

  const sections = useMemo(
    () => (realSections ?? []).filter((section) => section.isActive),
    [realSections]
  );

  const [activeTab, setActiveTab] = useState<'assignments' | 'class-teachers'>(
    mode === 'class-teachers' ? 'class-teachers' : 'assignments'
  );

  const classLabel = (classId: string) => {
    const schoolClass = classes.find((item) => item.id === classId);
    return schoolClass?.nameBn || schoolClass?.name;
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
              label: 'বিষয় শিক্ষক বণ্টন',
            },
            {
              value: 'class-teachers',
              label: 'শ্রেণি শিক্ষক',
            },
          ]}
        />
      </div>

      {activeTab === 'class-teachers' ? (
        <ClassTeachers
          year={year}
          teachers={teachers}
          sections={sections}
          classLabel={classLabel}
          teacherName={teacherName}
        />
      ) : (
        <SubjectTeachers
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
  year,
  teachers,
  sections,
  classLabel,
  teacherName,
}: {
  year: AcademicYear;
  teachers: Staff[];
  sections: Section[];
  classLabel: (classId: string) => string | undefined;
  teacherName: (staffId: string) => string;
}) {
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

  const assignmentsList = useMemo(
    () => realClassTeachers ?? [],
    [realClassTeachers]
  );

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
      toast.success('শ্রেণি শিক্ষক বসানো হয়েছে।');
      setOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, 'শ্রেণি শিক্ষক বসানো যায়নি।'));
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeClassTeacher(id).unwrap();
      toast.success('শ্রেণি শিক্ষক সরানো হয়েছে।');
    } catch (err) {
      toast.error(errorMessage(err, 'সরানো যায়নি।'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base text-muted-foreground max-w-2xl">
          {`${year.name} সালে এক শাখায় একজন শ্রেণি শিক্ষক। একজন শিক্ষক একই বছরে একটি শাখার শ্রেণি শিক্ষক হতে পারবেন।`}
        </p>
        <Button type="button" variant="primary" onClick={() => setOpen(true)}>
          {'শ্রেণি শিক্ষক বসান'}
        </Button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={'শ্রেণি শিক্ষক'}
        description={'শাখায় আগে থেকে কেউ থাকলে সেই জায়গায় নতুন শিক্ষক বসবে।'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <FormField label={'শাখা'}>
            <Select value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {classLabel(section.classId)} — {section.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={'শিক্ষক'}>
            <Select value={staffId} onChange={(event) => setStaffId(event.target.value)}>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} · {teacher.designation}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{'বাতিল'}</Button>
            <Button type="submit" variant="primary" disabled={saving || !sectionId || !staffId}>
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>
      <Card className="overflow-x-auto">
        <table className="w-full text-base">
          <thead className="bg-surface-muted text-sm text-muted-foreground">
            <tr>
              <th className="p-3.5 text-left font-semibold">{'শ্রেণি'}</th>
              <th className="p-3.5 text-left font-semibold">{'শাখা'}</th>
              <th className="p-3.5 text-left font-semibold">{'শ্রেণি শিক্ষক'}</th>
              <th className="p-3.5 text-right font-semibold">{'কাজ'}</th>
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
                          {'সরান'}
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
  year,
  teachers,
  classes,
  sections,
  classLabel,
  teacherName,
}: {
  year: AcademicYear;
  teachers: Staff[];
  classes: SchoolClass[];
  sections: Section[];
  classLabel: (classId: string) => string | undefined;
  teacherName: (staffId: string) => string;
}) {
  const [assignTeacher, { isLoading: saving }] = useAssignTeacherMutation();
  const [updateAssignment, { isLoading: updating }] = useUpdateTeacherAssignmentMutation();
  const [releaseAssignment, { isLoading: removing }] = useReleaseTeacherAssignmentMutation();

  // Filtering & pagination states (backend-driven)
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [matrixClassId, setMatrixClassId] = useState<string>('');
  const [matrixDrafts, setMatrixDrafts] = useState<
    Record<string, { staffId: string; canEnterMarks: boolean }>
  >({});
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [editGroup, setEditGroup] = useState<{
    classId: string;
    classSubjectId: string;
    classTitle: string;
    subjectTitle: string;
  } | null>(null);
  const [editDrafts, setEditDrafts] = useState<
    Record<string, { staffId: string; canEnterMarks: boolean }>
  >({});
  const [savingGroupEdit, setSavingGroupEdit] = useState(false);
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [removeGroupTarget, setRemoveGroupTarget] = useState<{
    classTitle: string;
    subjectTitle: string;
    assignments: TeacherAssignmentItem[];
  } | null>(null);

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
    isUuid(year?.id) ? { academicYearId: year.id, limit: 200 } : undefined,
    { skip: !isUuid(year?.id) }
  );
  const { data: realGroups } = useGetAcademicGroupsQuery();
  const { data: realSubjects = [] } = useGetSubjectsQuery();
  const { data: realAssignments, isLoading: loadingAssignments } = useGetTeacherAssignmentsQuery(
    isUuid(year?.id) ? { academicYearId: year.id, isActive: true, limit: 500 } : undefined,
    { skip: !isUuid(year?.id) }
  );

  const classSubjectsList = useMemo(
    () => realClassSubjects ?? [],
    [realClassSubjects]
  );

  const groupsList = useMemo(
    () => realGroups ?? [],
    [realGroups]
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
      return sub.nameBn || sub.name;
    }
    const classSubject = classSubjectsList.find((item) => item.id === classSubjectIdValue);
    const subject = classSubject?.subject ?? realSubjects.find((item) => item.id === classSubject?.subjectId);
    const group = classSubject?.groupId
      ? groupsList.find((item) => item.id === classSubject.groupId)
      : undefined;
    const name = subject?.nameBn || subject?.name;
    const groupName = group ? (group.nameBn || group.name) : '';
    return groupName ? `${name} · ${groupName}` : name ?? '—';
  };

  const allAssignments = useMemo<TeacherAssignmentItem[]>(() => {
    return (realAssignments ?? []).filter((item) => item.isActive);
  }, [realAssignments]);

  const activeClasses = useMemo(
    () => [...classes].filter((c) => c.isActive).sort((a, b) => a.numericValue - b.numericValue),
    [classes]
  );

  useEffect(() => {
    if (activeClasses.length > 0 && (!matrixClassId || !activeClasses.some((c) => c.id === matrixClassId))) {
      setMatrixClassId(activeClasses[0].id);
    }
  }, [activeClasses, matrixClassId]);

  const matrixSections = useMemo(
    () => sections.filter((s) => s.classId === matrixClassId),
    [sections, matrixClassId]
  );

  const matrixSubjects = useMemo(
    () =>
      classSubjectsList.filter(
        (cs) => cs.academicYearId === year.id && cs.classId === matrixClassId && cs.isActive
      ),
    [classSubjectsList, year.id, matrixClassId]
  );

  const assignmentBySlot = useMemo(() => {
    const map = new Map<string, TeacherAssignmentItem>();
    for (const a of allAssignments) {
      map.set(`${a.sectionId}:${a.classSubjectId}`, a);
    }
    return map;
  }, [allAssignments]);

  const dirtyMatrixEntries = useMemo(() => {
    return Object.entries(matrixDrafts).filter(([key, draft]) => {
      const existing = assignmentBySlot.get(key);
      const origStaffId = existing?.staffId ?? '';
      const origCanEnter = existing?.canEnterMarks ?? true;
      if (!origStaffId && !draft.staffId) return false;
      return draft.staffId !== origStaffId || (Boolean(draft.staffId) && draft.canEnterMarks !== origCanEnter);
    });
  }, [matrixDrafts, assignmentBySlot]);

  const setMatrixCell = (
    secId: string,
    csId: string,
    patch: Partial<{ staffId: string; canEnterMarks: boolean }>
  ) => {
    const key = `${secId}:${csId}`;
    const existing = assignmentBySlot.get(key);
    setMatrixDrafts((prev) => {
      const current = prev[key] ?? {
        staffId: existing?.staffId ?? '',
        canEnterMarks: existing?.canEnterMarks ?? true,
      };
      return {
        ...prev,
        [key]: { ...current, ...patch },
      };
    });
  };

  const handleSaveMatrix = async () => {
    if (dirtyMatrixEntries.length === 0) {
      toast.info('কোনো নতুন পরিবর্তন নেই।');
      setMatrixOpen(false);
      return;
    }
    setSavingMatrix(true);
    let successCount = 0;
    const failedKeys: string[] = [];

    for (const [key, draft] of dirtyMatrixEntries) {
      const [secId, csId] = key.split(':');
      const existing = assignmentBySlot.get(key);
      try {
        if (!draft.staffId) {
          if (existing) {
            await releaseAssignment({ id: existing.id }).unwrap();
          }
        } else if (existing && existing.staffId === draft.staffId) {
          await updateAssignment({
            id: existing.id,
            canEnterMarks: draft.canEnterMarks,
          }).unwrap();
        } else {
          await assignTeacher({
            academicYearId: year.id,
            classId: matrixClassId,
            sectionId: secId,
            classSubjectId: csId,
            staffId: draft.staffId,
            canEnterMarks: draft.canEnterMarks,
            replaceExisting: true,
          }).unwrap();
        }
        successCount++;
      } catch {
        failedKeys.push(key);
      }
    }

    setSavingMatrix(false);
    setMatrixDrafts((prev) => {
      const next: typeof prev = {};
      for (const k of failedKeys) {
        if (prev[k]) next[k] = prev[k];
      }
      return next;
    });

    if (successCount > 0) {
      toast.success(
        `${formatNumber(successCount, 'bn')}টি শিক্ষক বণ্টন সংরক্ষণ করা হয়েছে।`
      );
      if (failedKeys.length === 0) {
        setMatrixOpen(false);
      }
    }
    if (failedKeys.length > 0) {
      toast.error(
        `${formatNumber(failedKeys.length, 'bn')}টি বণ্টন সংরক্ষণ করা যায়নি।`
      );
    }
  };

  // Dynamic statistics based on real DB ClassSubjects and active TeacherAssignments
  const relevantClassSubjects = useMemo(() => {
    return classSubjectsList.filter(
      (cs) =>
        cs.academicYearId === year.id &&
        cs.isActive &&
        (classFilter === 'ALL' ? true : cs.classId === classFilter)
    );
  }, [classSubjectsList, year.id, classFilter]);

  const relevantAssignments = useMemo(() => {
    return allAssignments.filter(
      (a) =>
        (classFilter === 'ALL' ? true : a.classId === classFilter) &&
        (sectionFilter === 'ALL' ? true : a.sectionId === sectionFilter)
    );
  }, [allAssignments, classFilter, sectionFilter]);

  const assignedSubjectIds = useMemo(() => {
    return new Set(relevantAssignments.map((a) => a.classSubjectId));
  }, [relevantAssignments]);

  const unassignedSubjectsCount = useMemo(() => {
    return relevantClassSubjects.filter((cs) => !assignedSubjectIds.has(cs.id)).length;
  }, [relevantClassSubjects, assignedSubjectIds]);

  const openCreateModal = () => {
    if (classFilter !== 'ALL' && activeClasses.some((c) => c.id === classFilter)) {
      setMatrixClassId(classFilter);
    }
    setMatrixDrafts({});
    setMatrixOpen(true);
  };

  const openEditGroupModal = (group: {
    classId: string;
    classSubjectId: string;
    classTitle: string;
    subjectTitle: string;
  }) => {
    const classSecs = sections.filter((s) => s.classId === group.classId);
    const initial: Record<string, { staffId: string; canEnterMarks: boolean }> = {};
    for (const sec of classSecs) {
      const existing = assignmentBySlot.get(`${sec.id}:${group.classSubjectId}`);
      initial[sec.id] = {
        staffId: existing?.staffId ?? '',
        canEnterMarks: existing?.canEnterMarks ?? true,
      };
    }
    setEditDrafts(initial);
    setEditGroup(group);
  };

  const handleSaveGroupEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editGroup) return;
    const classSecs = sections.filter((s) => s.classId === editGroup.classId);
    setSavingGroupEdit(true);
    let changed = 0;
    let failed = 0;

    for (const sec of classSecs) {
      const draft = editDrafts[sec.id];
      if (!draft) continue;
      const existing = assignmentBySlot.get(`${sec.id}:${editGroup.classSubjectId}`);
      const origStaffId = existing?.staffId ?? '';
      const origCanEnter = existing?.canEnterMarks ?? true;

      if (
        draft.staffId === origStaffId &&
        (!draft.staffId || draft.canEnterMarks === origCanEnter)
      ) {
        continue;
      }

      try {
        if (!draft.staffId) {
          if (existing) {
            await releaseAssignment({ id: existing.id }).unwrap();
          }
        } else if (existing && existing.staffId === draft.staffId) {
          await updateAssignment({
            id: existing.id,
            canEnterMarks: draft.canEnterMarks,
          }).unwrap();
        } else {
          await assignTeacher({
            academicYearId: year.id,
            classId: editGroup.classId,
            sectionId: sec.id,
            classSubjectId: editGroup.classSubjectId,
            staffId: draft.staffId,
            canEnterMarks: draft.canEnterMarks,
            replaceExisting: true,
          }).unwrap();
        }
        changed++;
      } catch {
        failed++;
      }
    }

    setSavingGroupEdit(false);
    if (failed === 0) {
      if (changed > 0) {
        toast.success('বিষয় শিক্ষক বণ্টন হালনাগাদ হয়েছে।');
      } else {
        toast.info('কোনো নতুন পরিবর্তন নেই।');
      }
      setEditGroup(null);
    } else {
      toast.error('কিছু শাখার বণ্টন হালনাগাদ করা যায়নি।');
    }
  };

  const confirmRemoveGroup = async () => {
    if (!removeGroupTarget) return;
    try {
      for (const item of removeGroupTarget.assignments) {
        await releaseAssignment({ id: item.id }).unwrap();
      }
      toast.success('বণ্টন সরানো হয়েছে।');
      setRemoveGroupTarget(null);
    } catch (err) {
      toast.error(errorMessage(err, 'বণ্টন সরানো যায়নি।'));
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

  const visibleSectionNames = useMemo(() => {
    if (sectionFilter !== 'ALL') {
      const sec = sections.find((s) => s.id === sectionFilter);
      return sec ? [sec.name] : [];
    }
    return Array.from(new Set(filterSections.map((s) => s.name)));
  }, [sectionFilter, sections, filterSections]);

  const groupedRows = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    const classOrderMap = new Map(classes.map((c) => [c.id, c.numericValue ?? 99]));
    const sectionNameMap = new Map(sections.map((s) => [s.id, s.name]));
    const groups = new Map<
      string,
      {
        key: string;
        classId: string;
        classSubjectId: string;
        classTitle: string;
        classNumeric: number;
        subjectTitle: string;
        bySectionName: Map<string, TeacherAssignmentItem>;
      }
    >();

    for (const row of allAssignments) {
      if (classFilter !== 'ALL' && row.classId !== classFilter) continue;
      if (sectionFilter !== 'ALL' && row.sectionId !== sectionFilter) continue;

      const secName = row.section?.name || sectionNameMap.get(row.sectionId) || '';
      const clsTitle = row.schoolClass?.name || classLabel(row.classId) || '—';
      const subTitle = subjectLabel(row.classSubjectId, row);
      const tObj = teachers.find((t) => t.id === row.staffId);
      const tName = tObj?.nameBn || tObj?.name || row.staff?.name || '';

      if (q) {
        const hay = `${clsTitle} ${subTitle} ${tName} ${secName}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }

      const key = `${row.classId}:${row.classSubjectId}`;
      let entry = groups.get(key);
      if (!entry) {
        entry = {
          key,
          classId: row.classId,
          classSubjectId: row.classSubjectId,
          classTitle: clsTitle,
          classNumeric: row.schoolClass?.numericValue ?? classOrderMap.get(row.classId) ?? 99,
          subjectTitle: subTitle,
          bySectionName: new Map(),
        };
        groups.set(key, entry);
      }
      if (secName) {
        entry.bySectionName.set(secName, row);
      }
    }

    return Array.from(groups.values()).sort((a, b) => {
      if (a.classNumeric !== b.classNumeric) return a.classNumeric - b.classNumeric;
      return a.subjectTitle.localeCompare(b.subjectTitle, 'bn');
    });
  }, [allAssignments, classFilter, sectionFilter, debouncedSearch, classes, sections, teachers, 'bn']);

  const pageSize = 15;
  const totalGrouped = groupedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalGrouped / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedGroups = useMemo(
    () => groupedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [groupedRows, currentPage]
  );

  return (
    <div className="space-y-6">
      {/* 1. Top 3 Simple Full-Width KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-[var(--radius)] p-4 sm:p-5 shadow-xs">
          <p className="text-sm font-medium text-muted-foreground">{'মোট বিষয়'}</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums mt-1.5">
            {formatNumber(relevantClassSubjects.length, 'bn')}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {'পাঠ্যক্রমের সক্রিয় বিষয়'}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-[var(--radius)] p-4 sm:p-5 shadow-xs">
          <p className="text-sm font-medium text-muted-foreground">{'শিক্ষক দেওয়া হয়েছে'}</p>
          <p className="text-2xl sm:text-3xl font-bold text-primary tabular-nums mt-1.5">
            {formatNumber(assignedSubjectIds.size, 'bn')}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {`মোট শাখা বণ্টন: ${formatNumber(relevantAssignments.length, 'bn')}টি`}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-[var(--radius)] p-4 sm:p-5 shadow-xs">
          <p className="text-sm font-medium text-muted-foreground">{'বাকি'}</p>
          <p className={`text-2xl sm:text-3xl font-bold tabular-nums mt-1.5 ${unassignedSubjectsCount > 0 ? 'text-amber-500' : 'text-success'}`}>
            {formatNumber(unassignedSubjectsCount, 'bn')}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {unassignedSubjectsCount > 0
              ? 'বসাতে বাকি আছে'
              : 'সব সম্পন্ন'}
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
              placeholder={'শিক্ষক বা বিষয় খুঁজুন...'}
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
              {'রিসেট'}
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
            <option value="ALL">{'সকল শ্রেণি'}</option>
            {activeClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {classLabel(cls.id) || cls.name}
              </option>
            ))}
          </Select>

          <Select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="w-40 h-10 text-sm"
          >
            <option value="ALL">{'সকল শাখা'}</option>
            {filterSections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {classFilter === 'ALL' ? `${classLabel(sec.classId)} — ` : ''}
                {sec.name} {'শাখা'}
              </option>
            ))}
          </Select>

          <Button type="button" variant="primary" size="sm" onClick={openCreateModal} className="h-10 text-sm px-4">
            <Plus className="w-4 h-4 mr-1.5" />
            {'নতুন শিক্ষক বণ্টন'}
          </Button>
        </div>
      </div>

      {/* 3. Modal for Bulk Matrix Teacher Assignment */}
      <Modal
        open={matrixOpen}
        onClose={() => {
          if (savingMatrix) return;
          setMatrixOpen(false);
          setMatrixDrafts({});
        }}
        title={'বিষয় শিক্ষক বণ্টন'}
        description={'শ্রেণি নির্বাচন করে প্রতিটি বিষয় ও শাখার জন্য শিক্ষক নির্ধারণ করুন।'}
        maxWidth="max-w-5xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="w-full sm:w-64">
              <FormField label={'শ্রেণি নির্বাচন করুন'}>
                <Select
                  value={matrixClassId}
                  disabled={savingMatrix}
                  onChange={(e) => {
                    setMatrixClassId(e.target.value);
                    setMatrixDrafts({});
                  }}
                  className="h-10 text-sm font-medium"
                >
                  {activeClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {classLabel(cls.id) || cls.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          </div>

          {matrixSubjects.length === 0 || matrixSections.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border border-border rounded-lg">
              <BookOpen className="w-9 h-9 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium text-foreground">
                {matrixSections.length === 0
                  ? 'এই শ্রেণিতে কোনো সক্রিয় শাখা নেই।'
                  : 'এই শ্রেণিতে কোনো সক্রিয় বিষয় যোগ করা হয়নি।'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[60vh] border border-border rounded-lg">
              <table className="w-full text-base">
                <thead className="bg-surface-muted text-muted-foreground border-b border-border sticky top-0 z-10">
                  <tr>
                    <th className="p-3.5 text-left font-semibold text-foreground/80 min-w-[200px]">
                      {'বিষয় ও গ্রুপ'}
                    </th>
                    {matrixSections.map((sec) => (
                      <th key={sec.id} className="p-3.5 text-left font-semibold text-foreground/80 min-w-[230px]">
                        {sec.name} {'শাখা'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {matrixSubjects.map((cs) => (
                    <tr key={cs.id} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="p-3.5 font-medium text-foreground align-top">
                        {subjectLabel(cs.id)}
                      </td>
                      {matrixSections.map((sec) => {
                        const key = `${sec.id}:${cs.id}`;
                        const existing = assignmentBySlot.get(key);
                        const draft = matrixDrafts[key];
                        const currentStaffId = draft ? draft.staffId : (existing?.staffId ?? '');
                        const currentCanEnter = draft ? draft.canEnterMarks : (existing?.canEnterMarks ?? true);

                        return (
                          <td key={sec.id} className="p-3 align-top">
                            <div className="p-2 rounded-md border border-border bg-surface space-y-1.5">
                              <Select
                                value={currentStaffId}
                                disabled={savingMatrix}
                                onChange={(e) => setMatrixCell(sec.id, cs.id, { staffId: e.target.value })}
                                className="h-9 text-sm"
                              >
                                <option value="">{'— শিক্ষক নির্ধারিত নয় —'}</option>
                                {teachers.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.nameBn || t.name}
                                  </option>
                                ))}
                              </Select>
                              {currentStaffId && (
                                <label className="inline-flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={currentCanEnter}
                                    disabled={savingMatrix}
                                    onChange={(e) =>
                                      setMatrixCell(sec.id, cs.id, { canEnterMarks: e.target.checked })
                                    }
                                    className="rounded border-border text-primary w-3.5 h-3.5 cursor-pointer"
                                  />
                                  {'নম্বর এন্ট্রির অনুমতি'}
                                </label>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              disabled={savingMatrix}
              onClick={() => {
                setMatrixOpen(false);
                setMatrixDrafts({});
              }}
            >
              {'বাতিল'}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={savingMatrix}
              onClick={handleSaveMatrix}
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {savingMatrix
                ? 'সংরক্ষণ হচ্ছে...'
                : 'সব পরিবর্তন সংরক্ষণ করুন'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 4. Modal to Edit All Sections of a Subject Side-by-Side */}
      <Modal
        open={Boolean(editGroup)}
        onClose={() => {
          if (savingGroupEdit) return;
          setEditGroup(null);
        }}
        title={
          editGroup
            ? `${editGroup.classTitle} — ${editGroup.subjectTitle}`
            : 'বিষয় শিক্ষক সম্পাদনা'
        }
        description={'প্রতিটি শাখার জন্য শিক্ষক পরিবর্তন বা নির্ধারণ করুন। কোনো শাখা থেকে সরাতে "শিক্ষক নির্ধারিত নয়" নির্বাচন করুন।'}
        maxWidth="max-w-2xl"
      >
        {editGroup && (
          <form onSubmit={handleSaveGroupEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sections
                .filter((s) => s.classId === editGroup.classId)
                .map((sec) => {
                  const draft = editDrafts[sec.id] ?? { staffId: '', canEnterMarks: true };
                  return (
                    <div
                      key={sec.id}
                      className="p-3.5 rounded-lg border border-border bg-surface-muted/20 space-y-2.5"
                    >
                      <FormField label={`${sec.name} ${'শাখা'}`}>
                        <Select
                          value={draft.staffId}
                          disabled={savingGroupEdit}
                          onChange={(e) =>
                            setEditDrafts((prev) => ({
                              ...prev,
                              [sec.id]: { ...draft, staffId: e.target.value },
                            }))
                          }
                        >
                          <option value="">{'— শিক্ষক নির্ধারিত নয় —'}</option>
                          {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.nameBn || teacher.name} ({teacher.designation})
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      {draft.staffId && (
                        <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={draft.canEnterMarks}
                            disabled={savingGroupEdit}
                            onChange={(e) =>
                              setEditDrafts((prev) => ({
                                ...prev,
                                [sec.id]: { ...draft, canEnterMarks: e.target.checked },
                              }))
                            }
                            className="rounded border-border text-primary w-3.5 h-3.5 cursor-pointer"
                          />
                          {'নম্বর এন্ট্রির অনুমতি'}
                        </label>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                disabled={savingGroupEdit}
                onClick={() => setEditGroup(null)}
              >
                {'বাতিল'}
              </Button>
              <Button type="submit" variant="primary" disabled={savingGroupEdit}>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {savingGroupEdit
                  ? 'সংরক্ষণ হচ্ছে...'
                  : 'সংরক্ষণ করুন'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* 5. Main Assignment Table (Grouped by Class & Subject, Sections side-by-side) */}
      <Card className="overflow-x-auto border-border">
        <table className="w-full text-base">
          <thead className="bg-surface-muted text-muted-foreground border-b border-border">
            <tr>
              <th className="p-3.5 text-left font-semibold text-foreground/80 min-w-[140px]">
                {'শ্রেণি'}
              </th>
              <th className="p-3.5 text-left font-semibold text-foreground/80 min-w-[210px]">
                {'বিষয় ও গ্রুপ'}
              </th>
              {visibleSectionNames.map((secName) => (
                <th key={secName} className="p-3.5 text-left font-semibold text-foreground/80 min-w-[200px]">
                  {secName} {'শাখা'}
                </th>
              ))}
              <th className="p-3.5 text-right font-semibold text-foreground/80 w-[190px]">
                {'কাজ'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loadingAssignments ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`ta-skel-${idx}`} className="animate-pulse">
                  <td className="p-3.5"><div className="h-5 w-28 rounded bg-surface-muted" /></td>
                  <td className="p-3.5"><div className="h-5 w-40 rounded bg-surface-muted" /></td>
                  {visibleSectionNames.map((secName) => (
                    <td key={secName} className="p-3.5"><div className="h-5 w-36 rounded bg-surface-muted" /></td>
                  ))}
                  <td className="p-3.5 text-right"><div className="inline-block h-8 w-20 rounded bg-surface-muted" /></td>
                </tr>
              ))
            ) : pagedGroups.length === 0 ? (
              <tr>
                <td
                  className="p-8 text-center text-muted-foreground"
                  colSpan={3 + Math.max(1, visibleSectionNames.length)}
                >
                  <BookOpen className="w-9 h-9 mx-auto mb-2 opacity-40 text-muted-foreground" />
                  <p className="text-base font-semibold text-foreground">
                    {'কোনো বিষয় শিক্ষক বণ্টন পাওয়া যায়নি'}
                  </p>
                  <p className="text-sm mt-1.5 text-muted-foreground">
                    {isFiltered
                      ? 'ফিল্টারের সাথে মেলে এমন কোনো রেকর্ড নেই। ফিল্টার রিসেট করে দেখুন।'
                      : 'এই শিক্ষাবর্ষের জন্য কোনো শিক্ষক বণ্টন করা হয়নি। উপরের বাটনে ক্লিক করে বণ্টন করুন।'}
                  </p>
                </td>
              </tr>
            ) : (
              pagedGroups.map((group) => (
                <tr key={group.key} className="hover:bg-surface-muted/40 transition-colors">
                  <td className="p-3.5 font-semibold text-foreground text-base align-top">
                    {group.classTitle}
                  </td>
                  <td className="p-3.5 font-medium text-foreground text-base align-top">
                    {group.subjectTitle}
                  </td>
                  {visibleSectionNames.map((secName) => {
                    const row = group.bySectionName.get(secName);
                    if (!row) {
                      return (
                        <td key={secName} className="p-3.5 text-sm text-muted-foreground align-top">
                          —
                        </td>
                      );
                    }
                    const teacher = teachers.find((item) => item.id === row.staffId);
                    const teacherDisplay =
                      teacher?.nameBn || teacher?.name || row.staff?.name || teacherName(row.staffId);
                    const teacherDesig = teacher?.designation || row.staff?.designation;

                    return (
                      <td key={secName} className="p-3.5 align-top">
                        <p className="font-semibold text-primary text-sm sm:text-base leading-snug">
                          {teacherDisplay}
                        </p>
                        {teacherDesig && (
                          <p className="text-sm text-muted-foreground mt-0.5">{teacherDesig}</p>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-3.5 text-right align-top">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditGroupModal(group)}
                        className="text-sm"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        {'সম্পাদনা'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={removing}
                        onClick={() =>
                          setRemoveGroupTarget({
                            classTitle: group.classTitle,
                            subjectTitle: group.subjectTitle,
                            assignments: Array.from(group.bySectionName.values()),
                          })
                        }
                        className="text-sm text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        {'সরান'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {totalGrouped > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {`মোট ${formatNumber(totalGrouped, 'bn')} টি বিষয় · পৃষ্ঠা ${formatNumber(currentPage, 'bn')} / ${formatNumber(totalPages, 'bn')}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {'পূর্ববর্তী'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {'পরবর্তী'}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(removeGroupTarget)}
        onClose={() => setRemoveGroupTarget(null)}
        onConfirm={confirmRemoveGroup}
        title={'শিক্ষক বণ্টন সরান'}
        description={
          removeGroupTarget
            ? `আপনি কি নিশ্চিতভাবে "${removeGroupTarget.classTitle} — ${removeGroupTarget.subjectTitle}"-এর শিক্ষক বণ্টন সরাতে চান?`
            : ''
        }
        confirmLabel={'সরান'}
        destructive
        loading={removing}
      />
    </div>
  );
}
