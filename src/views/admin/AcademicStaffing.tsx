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
import { Button, Card, FormField, Modal, Select } from '@/src/components/ui/primitives';
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
  const [open, setOpen] = useState(false);
  const selectedSubjectId = subjects.some((item) => item.id === classSubjectId) ? classSubjectId : subjects[0]?.id ?? '';

  const subjectLabel = (classSubjectIdValue: string) => {
    const classSubject = db.classSubjects.find((item) => item.id === classSubjectIdValue);
    const subject = classSubject ? db.subjects.find((item) => item.id === classSubject.subjectId) : undefined;
    const group = classSubject?.groupId ? db.academicGroups.find((item) => item.id === classSubject.groupId) : undefined;
    const name = locale === 'bn' ? subject?.nameBn || subject?.name : subject?.name;
    const groupName = group ? (locale === 'bn' ? group.nameBn || group.name : group.name) : '';
    return groupName ? `${name} · ${groupName}` : name ?? '—';
  };

  const rows = db.teacherAssignments.filter((item) => item.academicYearId === year.id && item.isActive);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveAssignment({
        academicYearId: year.id,
        sectionId,
        classSubjectId: selectedSubjectId,
        staffId,
      }).unwrap();
      toast.success(pick('বিষয় শিক্ষক বণ্টন হয়েছে।', 'Subject teacher assigned.'));
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-2xl">
          {pick(
            'বিষয় আগে পাঠ্যক্রমে থাকতে হবে। এক শাখায় এক বিষয়ের একজন শিক্ষক। রুটিন শুধু এই বণ্টন থেকে পিরিয়ড নেয়।',
            'The subject must already be on the curriculum. One teacher per subject in a section. The routine can only use these assignments.'
          )}
        </p>
        <Button type="button" variant="primary" onClick={() => setOpen(true)}>
          {pick('বিষয় শিক্ষক বসান', 'Assign subject teacher')}
        </Button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={pick('বিষয় শিক্ষক', 'Subject teacher')}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <FormField label={pick('শাখা', 'Section')}>
            <Select
              value={sectionId}
              onChange={(event) => {
                setSectionId(event.target.value);
                setClassSubjectId('');
              }}
            >
              {sections.map((item) => (
                <option key={item.id} value={item.id}>
                  {classLabel(item.classId)} — {item.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={pick('পাঠ্যক্রমের বিষয়', 'Curriculum subject')}>
            <Select value={selectedSubjectId} onChange={(event) => setClassSubjectId(event.target.value)}>
              {subjects.length === 0 && <option value="">{pick('এই শ্রেণিতে বিষয় নেই', 'No subjects on this class')}</option>}
              {subjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {subjectLabel(item.id)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={pick('শিক্ষক', 'Teacher')}>
            <Select value={staffId} onChange={(event) => setStaffId(event.target.value)}>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{pick('বাতিল', 'Cancel')}</Button>
            <Button type="submit" variant="primary" disabled={saving || !selectedSubjectId || !staffId}>
              {saving ? pick('বণ্টন হচ্ছে...', 'Assigning...') : pick('সংরক্ষণ করুন', 'Save')}
            </Button>
          </div>
        </form>
      </Modal>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-muted-foreground">
            <tr>
              <th className="p-3 text-left">{pick('শিক্ষক', 'Teacher')}</th>
              <th className="p-3 text-left">{pick('শাখা', 'Section')}</th>
              <th className="p-3 text-left">{pick('বিষয়', 'Subject')}</th>
              <th className="p-3 text-right">{pick('কাজ', 'Action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-muted-foreground" colSpan={4}>
                  {pick('এই বছরে কোনো বিষয় শিক্ষক নেই।', 'No subject teachers for this year.')}
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const sectionRow = db.sections.find((item) => item.id === row.sectionId);
              return (
                <tr key={row.id}>
                  <td className="p-3 font-medium">{teacherName(row.staffId)}</td>
                  <td className="p-3">
                    {classLabel(row.classId)} ({sectionRow?.name})
                  </td>
                  <td className="p-3">{subjectLabel(row.classSubjectId)}</td>
                  <td className="p-3 text-right">
                    <Button type="button" variant="outline" size="sm" disabled={removing} onClick={() => handleRemove(row.id)}>
                      {pick('সরান', 'Remove')}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
