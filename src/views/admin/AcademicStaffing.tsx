'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  useRemoveClassTeacherMutation,
  useRemoveTeacherAssignmentMutation,
  useSaveClassTeacherMutation,
  useSaveTeacherAssignmentMutation,
} from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { Button, Card, FormField, Input, Modal, Select } from '@/src/components/ui/primitives';
import { Search, Plus, Trash2, BookOpen, Users, GraduationCap, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
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
  const teachers = db.staff.filter(
    (member) => member.staffType === StaffType.TEACHER && member.status === StaffStatus.ACTIVE
  );
  const sections = db.sections.filter((section) => section.isActive);
  const classLabel = (classId: string) => {
    const schoolClass = db.classes.find((item) => item.id === classId);
    return locale === 'bn' ? schoolClass?.nameBn || schoolClass?.name : schoolClass?.name;
  };
  const teacherName = (staffId: string) => db.staff.find((member) => member.id === staffId)?.name ?? '—';

  if (mode === 'class-teachers') {
    return (
      <ClassTeachers
        db={db}
        year={year}
        teachers={teachers}
        sections={sections}
        classLabel={classLabel}
        teacherName={teacherName}
      />
    );
  }

  return (
    <SubjectTeachers
      db={db}
      year={year}
      teachers={teachers}
      sections={sections}
      classLabel={classLabel}
      teacherName={teacherName}
    />
  );
}

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
  const [saveTeacher, { isLoading: saving }] = useSaveClassTeacherMutation();
  const [removeTeacher, { isLoading: removing }] = useRemoveClassTeacherMutation();
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '');
  const [staffId, setStaffId] = useState(teachers[0]?.id ?? '');
  const [open, setOpen] = useState(false);

  const rows = useMemo(
    () =>
      sections.map((section) => ({
        section,
        assignment: db.sectionClassTeachers.find(
          (item) => item.academicYearId === year.id && item.sectionId === section.id
        ),
      })),
    [sections, db.sectionClassTeachers, year.id]
  );

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveTeacher({ academicYearId: year.id, sectionId, staffId }).unwrap();
      toast.success(pick('শ্রেণি শিক্ষক বসানো হয়েছে।', 'Class teacher saved.'));
      setOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, pick('শ্রেণি শিক্ষক বসানো যায়নি।', 'Could not save the class teacher.')));
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeTeacher({ id }).unwrap();
      toast.success(pick('শ্রেণি শিক্ষক সরানো হয়েছে।', 'Class teacher removed.'));
    } catch (err) {
      toast.error(errorMessage(err, pick('সরানো যায়নি।', 'Could not remove the class teacher.')));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-2xl">
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
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-muted-foreground">
            <tr>
              <th className="p-3 text-left">{pick('শ্রেণি', 'Class')}</th>
              <th className="p-3 text-left">{pick('শাখা', 'Section')}</th>
              <th className="p-3 text-left">{pick('শ্রেণি শিক্ষক', 'Class teacher')}</th>
              <th className="p-3 text-right">{pick('কাজ', 'Action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(({ section, assignment }) => (
              <tr key={section.id}>
                <td className="p-3">{classLabel(section.classId)}</td>
                <td className="p-3 font-medium">{section.name}</td>
                <td className="p-3">{assignment ? teacherName(assignment.staffId) : '—'}</td>
                <td className="p-3 text-right">
                  {assignment && (
                    <Button type="button" variant="outline" size="sm" disabled={removing} onClick={() => handleRemove(assignment.id)}>
                      {pick('সরান', 'Remove')}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
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
  const { locale, pick } = useI18n();
  const [saveAssignment, { isLoading: saving }] = useSaveTeacherAssignmentMutation();
  const [removeAssignment, { isLoading: removing }] = useRemoveTeacherAssignmentMutation();
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '');
  const section = sections.find((item) => item.id === sectionId);
  const subjects = db.classSubjects.filter(
    (item) => item.academicYearId === year.id && item.classId === section?.classId && item.isActive
  );
  const [classSubjectId, setClassSubjectId] = useState(subjects[0]?.id ?? '');
  const [staffId, setStaffId] = useState(teachers[0]?.id ?? '');
  const [canEnterMarks, setCanEnterMarks] = useState(true);
  const [open, setOpen] = useState(false);
  const selectedSubjectId = subjects.some((item) => item.id === classSubjectId) ? classSubjectId : subjects[0]?.id ?? '';

  // Filtering states
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const subjectLabel = (classSubjectIdValue: string) => {
    const classSubject = db.classSubjects.find((item) => item.id === classSubjectIdValue);
    const subject = classSubject ? db.subjects.find((item) => item.id === classSubject.subjectId) : undefined;
    const group = classSubject?.groupId ? db.academicGroups.find((item) => item.id === classSubject.groupId) : undefined;
    const name = locale === 'bn' ? subject?.nameBn || subject?.name : subject?.name;
    const groupName = group ? (locale === 'bn' ? group.nameBn || group.name : group.name) : '';
    return groupName ? `${name} · ${groupName}` : name ?? '—';
  };

  const allAssignments = useMemo(
    () => db.teacherAssignments.filter((item) => item.academicYearId === year.id && item.isActive),
    [db.teacherAssignments, year.id]
  );

  const activeClasses = useMemo(
    () => [...db.classes].filter((c) => c.isActive).sort((a, b) => a.numericValue - b.numericValue),
    [db.classes]
  );

  // Dynamic statistics based on classFilter
  const relevantClassSubjects = useMemo(() => {
    return db.classSubjects.filter(
      (cs) =>
        cs.academicYearId === year.id &&
        cs.isActive &&
        (classFilter === 'ALL' ? true : cs.classId === classFilter)
    );
  }, [db.classSubjects, year.id, classFilter]);

  const relevantAssignments = useMemo(() => {
    return allAssignments.filter((a) =>
      classFilter === 'ALL' ? true : a.classId === classFilter
    );
  }, [allAssignments, classFilter]);

  const assignedSubjectIds = useMemo(() => {
    return new Set(relevantAssignments.map((a) => a.classSubjectId));
  }, [relevantAssignments]);

  const unassignedSubjects = useMemo(() => {
    return relevantClassSubjects.filter((cs) => !assignedSubjectIds.has(cs.id));
  }, [relevantClassSubjects, assignedSubjectIds]);

  const relevantTeachingTeachers = useMemo(() => {
    return new Set(relevantAssignments.map((a) => a.staffId));
  }, [relevantAssignments]);

  const freeTeachersCount = Math.max(0, teachers.length - relevantTeachingTeachers.size);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return allAssignments.filter((row) => {
      if (classFilter !== 'ALL' && row.classId !== classFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const teacher = teacherName(row.staffId).toLowerCase();
        const sub = subjectLabel(row.classSubjectId).toLowerCase();
        const clsName = (classLabel(row.classId) || '').toLowerCase();
        if (!teacher.includes(q) && !sub.includes(q) && !clsName.includes(q)) return false;
      }
      return true;
    });
  }, [allAssignments, classFilter, searchQuery, teacherName, classLabel, subjectLabel]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveAssignment({
        academicYearId: year.id,
        sectionId,
        classSubjectId: selectedSubjectId,
        staffId,
        canEnterMarks,
      }).unwrap();
      toast.success(pick('বিষয় শিক্ষক বণ্টন সম্পন্ন হয়েছে।', 'Subject teacher assigned.'));
      setOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, pick('বণ্টন হয়নি।', 'Could not assign the teacher.')));
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeAssignment({ id }).unwrap();
      toast.success(pick('বণ্টন সরানো হয়েছে।', 'Assignment removed.'));
    } catch (err) {
      toast.error(errorMessage(err, pick('বণ্টন সরানো যায়নি।', 'Could not remove the assignment.')));
    }
  };

  const isFiltered = classFilter !== 'ALL' || searchQuery.trim() !== '';
  const resetFilters = () => {
    setClassFilter('ALL');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Actionable KPI Summary Cards */}
      <div className="bg-surface border border-border rounded-[var(--radius)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border shadow-xs">
        <div className="p-4 sm:p-5">
          <p className="text-sm font-medium text-muted-foreground">{pick('বিষয় বণ্টন অগ্রগতি', 'Subject Allocation Progress')}</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums mt-1.5">
            {formatNumber(assignedSubjectIds.size, locale)}
            <span className="text-sm sm:text-base font-normal text-muted-foreground"> / {formatNumber(relevantClassSubjects.length, locale)} {pick('টি বিষয়', 'subjects')}</span>
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-normal">
            {pick(`মোট বরাদ্দ: ${formatNumber(relevantAssignments.length, locale)}টি পাঠদান`, `Total: ${formatNumber(relevantAssignments.length, locale)} assignments`)}
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-sm font-medium text-muted-foreground">{pick('শিক্ষকহীন বাকি বিষয়', 'Pending / Unassigned Subjects')}</p>
          <p className={`text-2xl sm:text-3xl font-bold tabular-nums mt-1.5 flex items-center gap-1.5 ${unassignedSubjects.length > 0 ? 'text-amber-500' : 'text-success'}`}>
            {formatNumber(unassignedSubjects.length, locale)}
            <span className="text-sm sm:text-base font-normal text-muted-foreground">{pick('টি বিষয় বাকি', 'subjects pending')}</span>
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-normal">
            {unassignedSubjects.length > 0
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

        <div className="flex items-center gap-2.5">
          <Select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-52 h-10 text-sm"
          >
            <option value="ALL">{pick('সকল শ্রেণি', 'All Classes')}</option>
            {activeClasses.map((cls) => {
              const count = allAssignments.filter((a) => a.classId === cls.id).length;
              return (
                <option key={cls.id} value={cls.id}>
                  {classLabel(cls.id) || cls.name} ({formatNumber(count, locale)}টি বিষয়)
                </option>
              );
            })}
          </Select>

          <Button type="button" variant="primary" size="sm" onClick={() => setOpen(true)} className="h-10 text-sm px-4">
            <Plus className="w-4 h-4 mr-1.5" />
            {pick('নতুন শিক্ষক বণ্টন', 'Assign Subject Teacher')}
          </Button>
        </div>
      </div>

      {/* 4. Modal to Assign Subject Teacher */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={pick('বিষয় শিক্ষক বণ্টন', 'Assign Subject Teacher')}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label={pick('শ্রেণি ও শাখা', 'Class & Section')} required>
            <Select
              value={sectionId}
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
            <Select value={selectedSubjectId} onChange={(event) => setClassSubjectId(event.target.value)}>
              {subjects.length === 0 && <option value="">{pick('এই শ্রেণিতে কোনো সক্রিয় বিষয় নেই', 'No active subjects')}</option>}
              {subjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {subjectLabel(item.id)}
                </option>
              ))}
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{pick('বাতিল', 'Cancel')}</Button>
            <Button type="submit" variant="primary" disabled={saving || !selectedSubjectId || !staffId}>
              {saving ? pick('বণ্টন হচ্ছে...', 'Assigning...') : pick('সংরক্ষণ করুন', 'Save Assignment')}
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
            {filteredRows.length === 0 ? (
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
                const sectionRow = db.sections.find((item) => item.id === row.sectionId);
                const teacher = db.staff.find((item) => item.id === row.staffId);
                const clsTitle = classLabel(row.classId) || '—';

                return (
                  <tr key={row.id} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm sm:text-base">{clsTitle}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-muted text-xs sm:text-[13px] font-medium text-muted-foreground border border-border">
                          {sectionRow?.name} শাখা
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-foreground text-sm sm:text-base">
                        {subjectLabel(row.classSubjectId)}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div>
                        <p className="font-semibold text-primary hover:underline cursor-pointer text-sm sm:text-base">
                          {teacher?.nameBn || teacher?.name || teacherName(row.staffId)}
                        </p>
                        {teacher?.designation && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{teacher.designation}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      {row.canEnterMarks ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-success/10 text-success border border-success/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {pick('অনুমোদিত', 'Allowed')}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-surface-muted text-muted-foreground border border-border">
                          {pick('অনুমতি নেই', 'Not allowed')}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={removing}
                        onClick={() => handleRemove(row.id)}
                        className="text-xs sm:text-sm text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        {pick('সরান', 'Remove')}
                      </Button>
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
