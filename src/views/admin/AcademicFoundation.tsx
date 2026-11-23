'use client';

import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetSchoolClassesQuery,
  useRemoveSchoolClassMutation,
  useSaveSchoolClassMutation,
} from '@/src/services/academic/class.api';
import {
  useSaveAcademicGroupMutation,
  useSaveAcademicYearMutation,
  useSaveSectionMutation,
  useSetActiveAcademicYearMutation,
} from '@/src/store/api';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { setSelectedAcademicYear } from '@/src/store/slices/uiSlice';
import { useI18n } from '@/src/lib/i18n';
import { Button, Card, FormField, Input, Modal, Select, Switch, Textarea } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import type { AcademicGroup, AcademicYear, SchoolClass, Section } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';

type FoundationTab = 'years' | 'groups' | 'classes' | 'sections';

function errorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return fallback;
}

export function useAcademicYearSelection(years: AcademicYear[] | undefined) {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((state) => state.ui.selectedAcademicYearId);
  const resolved =
    years?.find((year) => year.id === selectedId) ??
    years?.find((year) => year.isActive) ??
    years?.[0];

  useEffect(() => {
    if (!years?.length || !resolved) return;
    if (selectedId && years.some((year) => year.id === selectedId)) return;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem('bhs_academic_year');
    } catch {
      stored = null;
    }
    const storedYear = stored ? years.find((year) => year.id === stored) : undefined;
    dispatch(setSelectedAcademicYear(storedYear?.id ?? resolved.id));
  }, [dispatch, resolved, selectedId, years]);

  return resolved;
}

export function AcademicYearBar({
  years,
  selected,
}: {
  years: AcademicYear[];
  selected?: AcademicYear;
}) {
  const dispatch = useAppDispatch();
  const { pick } = useI18n();
  if (!selected) return null;

  return (
    <Card className="p-4 flex flex-wrap items-end justify-between gap-3">
      <FormField label={pick('যে শিক্ষাবর্ষ নিয়ে কাজ করছেন', 'Academic year in view')}>
        <Select
          value={selected.id}
          onChange={(event) => dispatch(setSelectedAcademicYear(event.target.value))}
          className="min-w-52"
        >
          {years.map((year) => (
            <option key={year.id} value={year.id}>
              {year.name}
              {year.isActive ? pick(' · সক্রিয়', ' · Active') : ''}
            </option>
          ))}
        </Select>
      </FormField>
      <p className="text-sm text-muted-foreground pb-2">
        {pick(
          'রুটিন, বিষয় বণ্টন ও শিক্ষক তালিকা এই বছর অনুযায়ী দেখাবে। সক্রিয় বছর আলাদা — সেটাই চলতি সেশন।',
          'Routines, subject maps, and teacher lists follow this year. The active year is the current session.'
        )}
      </p>
    </Card>
  );
}

export function AcademicFoundation({
  tab,
  db,
}: {
  tab: FoundationTab;
  db: MockDatabase;
}) {
  if (tab === 'years') return <YearsPanel years={db.academicYears} />;
  if (tab === 'groups') return <GroupsPanel groups={db.academicGroups} />;
  if (tab === 'classes') return <ClassesPanel db={db} />;
  return <SectionsPanel db={db} />;
}

const emptyYear = { name: '', startDate: '', endDate: '', isActive: false };

function YearsPanel({ years }: { years: AcademicYear[] }) {
  const { pick } = useI18n();
  const [saveYear, { isLoading: saving }] = useSaveAcademicYearMutation();
  const [setActive, { isLoading: activating }] = useSetActiveAcademicYearMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyYear);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyYear);
    setOpen(true);
  };

  const close = () => {
    setEditingId(null);
    setForm(emptyYear);
    setOpen(false);
  };

  const startEdit = (year: AcademicYear) => {
    setEditingId(year.id);
    setForm({
      name: year.name,
      startDate: year.startDate,
      endDate: year.endDate,
      isActive: year.isActive,
    });
    setOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveYear({
        id: editingId ?? undefined,
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        isActive: form.isActive,
      }).unwrap();
      toast.success(
        editingId
          ? pick('শিক্ষাবর্ষ হালনাগাদ হয়েছে।', 'Academic year updated.')
          : pick('নতুন শিক্ষাবর্ষ যুক্ত হয়েছে।', 'Academic year created.')
      );
      close();
    } catch (err) {
      toast.error(errorMessage(err, pick('শিক্ষাবর্ষ সংরক্ষণ হয়নি।', 'Could not save the academic year.')));
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await setActive({ id }).unwrap();
      toast.success(pick('এই বছরটি এখন সক্রিয় শিক্ষাবর্ষ।', 'This year is now the active academic year.'));
    } catch (err) {
      toast.error(errorMessage(err, pick('সক্রিয় করা যায়নি।', 'Could not activate the year.')));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="primary" onClick={startCreate}>
          <Plus className="w-4 h-4" /> {pick('নতুন শিক্ষাবর্ষ', 'New academic year')}
        </Button>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-muted-foreground">
            <tr>
              <th className="p-3 text-left">{pick('শিক্ষাবর্ষ', 'Year')}</th>
              <th className="p-3 text-left">{pick('সময়কাল', 'Dates')}</th>
              <th className="p-3 text-left">{pick('অবস্থা', 'Status')}</th>
              <th className="p-3 text-right">{pick('কাজ', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {years.map((year) => (
              <tr key={year.id}>
                <td className="p-3 font-semibold tabular-nums">{year.name}</td>
                <td className="p-3 text-muted-foreground tabular-nums">{year.startDate} — {year.endDate}</td>
                <td className="p-3">
                  <StatusBadge
                    value={year.isActive ? 'ACTIVE' : 'INACTIVE'}
                    customLabel={year.isActive ? pick('চলতি', 'Current') : pick('বন্ধ', 'Inactive')}
                    customTone={year.isActive ? 'success' : 'neutral'}
                  />
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  {!year.isActive && (
                    <Button type="button" variant="outline" size="sm" disabled={activating} onClick={() => handleActivate(year.id)}>
                      {pick('চলতি করুন', 'Make current')}
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(year)}>
                    <Pencil className="w-4 h-4" />
                    {pick('সম্পাদনা', 'Edit')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Modal
        open={open}
        onClose={close}
        title={editingId ? pick('শিক্ষাবর্ষ সম্পাদনা', 'Edit academic year') : pick('নতুন শিক্ষাবর্ষ', 'New academic year')}
        description={pick('শুরুর তারিখ শেষ তারিখের আগে হতে হবে। একটি বছর চলতি থাকবে।', 'The start date must be before the end date. One year stays current.')}
      >
        <form onSubmit={handleSave} className="space-y-3">
          <FormField label={pick('নাম', 'Name')}>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="2027" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={pick('শুরু', 'Starts')}>
              <Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
            </FormField>
            <FormField label={pick('শেষ', 'Ends')}>
              <Input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
            </FormField>
          </div>
          <Switch
            checked={form.isActive}
            onChange={(isActive) => setForm({ ...form, isActive })}
            label={pick('এটিকে চলতি শিক্ষাবর্ষ করুন', 'Make this the current year')}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={close}>{pick('বাতিল', 'Cancel')}</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('সংরক্ষণ করুন', 'Save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const emptyGroup = { name: '', nameBn: '', description: '', isActive: true };

function GroupsPanel({ groups }: { groups: AcademicGroup[] }) {
  const { locale, pick } = useI18n();
  const [saveGroup, { isLoading: saving }] = useSaveAcademicGroupMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyGroup);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyGroup);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveGroup({
        id: editingId ?? undefined,
        name: form.name,
        nameBn: form.nameBn,
        description: form.description,
        isActive: form.isActive,
      }).unwrap();
      toast.success(
        editingId ? pick('বিভাগ হালনাগাদ হয়েছে।', 'Group updated.') : pick('নতুন বিভাগ যুক্ত হয়েছে।', 'Group created.')
      );
      startCreate();
    } catch (err) {
      toast.error(errorMessage(err, pick('বিভাগ সংরক্ষণ হয়নি।', 'Could not save the group.')));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-bold">
            {editingId ? pick('বিভাগ সম্পাদনা', 'Edit group') : pick('নতুন বিভাগ (৯ম–১০ম)', 'New group (classes 9–10)')}
          </h3>
          {editingId && (
            <Button type="button" variant="outline" size="sm" onClick={startCreate}>
              <Plus className="w-4 h-4" /> {pick('নতুন', 'New')}
            </Button>
          )}
        </div>
        <form onSubmit={handleSave} className="space-y-3">
          <FormField label={pick('ইংরেজি নাম', 'English name')}>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Science" />
          </FormField>
          <FormField label={pick('বাংলা নাম', 'Bangla name')}>
            <Input value={form.nameBn} onChange={(event) => setForm({ ...form, nameBn: event.target.value })} placeholder="বিজ্ঞান" />
          </FormField>
          <FormField label={pick('বিবরণ', 'Description')}>
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </FormField>
          <Switch
            checked={form.isActive}
            onChange={(isActive) => setForm({ ...form, isActive })}
            label={pick('সক্রিয়', 'Active')}
          />
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('সংরক্ষণ করুন', 'Save')}
          </Button>
        </form>
      </Card>
      <Card className="divide-y divide-border">
        {groups.map((group) => (
          <div key={group.id} className="p-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{locale === 'bn' ? group.nameBn || group.name : group.name}</p>
              <p className="text-sm text-muted-foreground">{group.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge
                value={group.isActive ? 'ACTIVE' : 'INACTIVE'}
                customLabel={group.isActive ? pick('সক্রিয়', 'Active') : pick('বন্ধ', 'Inactive')}
                customTone={group.isActive ? 'success' : 'neutral'}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingId(group.id);
                  setForm({
                    name: group.name,
                    nameBn: group.nameBn ?? '',
                    description: group.description ?? '',
                    isActive: group.isActive,
                  });
                }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

const emptyClass = { name: '', numericValue: '', sectionNames: '', isActive: true };

function ClassesPanel({ db }: { db: MockDatabase }) {
  const { locale, pick } = useI18n();
  const selectedYearId = useAppSelector((state) => state.ui.selectedAcademicYearId);
  const { data: realClasses, isLoading: loadingClasses } = useGetSchoolClassesQuery();
  const [saveClass, { isLoading: saving }] = useSaveSchoolClassMutation();
  const [removeSchoolClass, { isLoading: deleting }] = useRemoveSchoolClassMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyClass);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyClass);
  };

  const classList = realClasses && realClasses.length > 0 ? realClasses : db.classes;

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = form.name.trim();
    const numVal = parseInt(form.numericValue, 10);

    if (!trimmedName) {
      toast.error(pick('শ্রেণির নাম আবশ্যক।', 'Class name is required.'));
      return;
    }

    if (isNaN(numVal) || numVal < 1) {
      toast.error(pick('শ্রেণি নম্বর ১ বা তার বেশি হতে হবে।', 'Class number must be 1 or greater.'));
      return;
    }

    const sections = form.sectionNames
      .split(/[,،\n]/)
      .map((name) => name.trim())
      .filter(Boolean);

    try {
      await saveClass(
        editingId
          ? {
              id: editingId,
              name: trimmedName,
              numericValue: numVal,
              isActive: form.isActive,
            }
          : {
              name: trimmedName,
              numericValue: numVal,
              isActive: form.isActive,
              sections,
            }
      ).unwrap();

      toast.success(
        editingId
          ? pick('শ্রেণি সফলভাবে হালনাগাদ হয়েছে।', 'Class updated successfully.')
          : pick('নতুন শ্রেণি সফলভাবে যুক্ত হয়েছে।', 'Class created successfully.')
      );
      startCreate();
    } catch (err) {
      toast.error(errorMessage(err, pick('শ্রেণি সংরক্ষণ করা যায়নি।', 'Could not save the class.')));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(pick(`আপনি কি "${name}" শ্রেণিটি মুছে ফেলতে চান?`, `Are you sure you want to delete class "${name}"?`))) {
      return;
    }
    try {
      await removeSchoolClass({ id }).unwrap();
      toast.success(pick('শ্রেণি মুছে ফেলা হয়েছে।', 'Class deleted successfully.'));
      if (editingId === id) startCreate();
    } catch (err) {
      toast.error(errorMessage(err, pick('শ্রেণি মুছে ফেলা যায়নি।', 'Could not delete the class.')));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-bold">
            {editingId ? pick('শ্রেণি সম্পাদনা', 'Edit class') : pick('নতুন শ্রেণি তৈরি', 'New class')}
          </h3>
          {editingId && (
            <Button type="button" variant="outline" size="sm" onClick={startCreate}>
              <Plus className="w-4 h-4" /> {pick('নতুন শ্রেণি', 'New class')}
            </Button>
          )}
        </div>
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <FormField label={pick('শ্রেণির নাম', 'Class name')}>
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="e.g. Class 6"
              maxLength={50}
              required
            />
          </FormField>
          <FormField label={pick('শ্রেণি নম্বর (ক্রমিক)', 'Class number')}>
            <Input
              type="number"
              min={1}
              max={12}
              value={form.numericValue}
              onChange={(event) => setForm({ ...form, numericValue: event.target.value })}
              placeholder="e.g. 6"
              required
            />
          </FormField>
          {!editingId && (
            <FormField label={pick('শাখা (কমা দিয়ে পৃথক করুন)', 'Sections (comma separated)')}>
              <Input
                value={form.sectionNames}
                onChange={(event) => setForm({ ...form, sectionNames: event.target.value })}
                placeholder="A, B, C"
              />
            </FormField>
          )}
          <div className="flex items-center gap-3 pb-1">
            <Switch
              checked={form.isActive}
              onChange={(isActive) => setForm({ ...form, isActive })}
              label={pick('সক্রিয়', 'Active')}
            />
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('সংরক্ষণ করুন', 'Save')}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loadingClasses && classList.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {pick('শ্রেণির তালিকা লোড হচ্ছে...', 'Loading classes...')}
          </div>
        ) : (
          classList.map((schoolClass) => {
            const sections =
              schoolClass.sections && schoolClass.sections.length > 0
                ? schoolClass.sections
                : db.sections.filter((section) => section.classId === schoolClass.id);

            return (
              <Card key={schoolClass.id} className="p-5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-primary">{schoolClass.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {pick('নম্বর', 'Numeric')}: {schoolClass.numericValue} ·{' '}
                      {schoolClass.isActive
                        ? pick('সক্রিয়', 'Active')
                        : pick('নিষ্ক্রিয়', 'Inactive')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(schoolClass.id);
                        setForm({
                          name: schoolClass.name,
                          numericValue: String(schoolClass.numericValue),
                          sectionNames: '',
                          isActive: schoolClass.isActive,
                        });
                      }}
                      title={pick('সম্পাদনা করুন', 'Edit')}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => handleDelete(schoolClass.id, schoolClass.name)}
                      disabled={deleting}
                      title={pick('মুছে ফেলুন', 'Delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm pt-1 border-t border-border/40">
                  <div className="text-xs font-semibold text-muted-foreground flex justify-between">
                    <span>{pick('শাখা সমূহ', 'Sections')}</span>
                    {schoolClass._count?.enrollments !== undefined && (
                      <span>
                        {schoolClass._count.enrollments} {pick('শিক্ষার্থী', 'students')}
                      </span>
                    )}
                  </div>
                  {sections.length === 0 && (
                    <p className="text-muted-foreground text-xs">
                      {pick('এখনো কোনো শাখা নেই।', 'No sections yet.')}
                    </p>
                  )}
                  {sections.map((section) => {
                    const classTeacher = db.sectionClassTeachers?.find(
                      (assignment) =>
                        assignment.sectionId === section.id &&
                        assignment.academicYearId === selectedYearId
                    );
                    const teacher = classTeacher
                      ? db.staff?.find((member) => member.id === classTeacher.staffId)
                      : null;
                    return (
                      <div
                        key={section.id}
                        className="flex justify-between items-center p-2 bg-surface-muted/50 rounded text-xs"
                      >
                        <span className="font-medium">
                          {pick('শাখা', 'Sec')} {section.name}
                          {!section.isActive ? pick(' (বন্ধ)', ' (off)') : ''}
                        </span>
                        <span className="text-muted-foreground truncate max-w-[140px]">
                          {teacher?.name ?? '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

const emptySection = { classId: '', name: '', isActive: true };

function SectionsPanel({ db }: { db: MockDatabase }) {
  const { locale, pick } = useI18n();
  const [saveSection, { isLoading: saving }] = useSaveSectionMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof emptySection>({
    ...emptySection,
    classId: db.classes[0]?.id ?? '',
  });

  const className = (schoolClass?: SchoolClass) =>
    locale === 'bn' ? schoolClass?.nameBn || schoolClass?.name : schoolClass?.name;

  const startCreate = () => {
    setEditingId(null);
    setForm({ ...emptySection, classId: db.classes[0]?.id ?? '' });
  };

  const startEdit = (section: Section) => {
    setEditingId(section.id);
    setForm({ classId: section.classId, name: section.name, isActive: section.isActive });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveSection({
        id: editingId ?? undefined,
        classId: form.classId,
        name: form.name,
        isActive: form.isActive,
      }).unwrap();
      toast.success(
        editingId ? pick('শাখা হালনাগাদ হয়েছে।', 'Section updated.') : pick('নতুন শাখা যুক্ত হয়েছে।', 'Section created.')
      );
      startCreate();
    } catch (err) {
      toast.error(errorMessage(err, pick('শাখা সংরক্ষণ হয়নি।', 'Could not save the section.')));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <FormField label={pick('শ্রেণি', 'Class')}>
            <Select value={form.classId} onChange={(event) => setForm({ ...form, classId: event.target.value })}>
              {db.classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {className(schoolClass)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={pick('শাখার নাম', 'Section name')}>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="ক" />
          </FormField>
          <Switch checked={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} label={pick('সক্রিয়', 'Active')} />
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : editingId ? pick('হালনাগাদ', 'Update') : pick('শাখা যুক্ত করুন', 'Add section')}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={startCreate}>
                {pick('বাতিল', 'Cancel')}
              </Button>
            )}
          </div>
        </form>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-sm text-muted-foreground">
            <tr>
              <th className="p-3 text-left">{pick('শ্রেণি', 'Class')}</th>
              <th className="p-3 text-left">{pick('শাখা', 'Section')}</th>
              <th className="p-3 text-left">{pick('অবস্থা', 'Status')}</th>
              <th className="p-3 text-right">{pick('কাজ', 'Action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {db.sections.map((section) => {
              const schoolClass = db.classes.find((item) => item.id === section.classId);
              return (
                <tr key={section.id}>
                  <td className="p-3">{className(schoolClass)}</td>
                  <td className="p-3 font-medium">{section.name}</td>
                  <td className="p-3">
                    <StatusBadge
                      value={section.isActive ? 'ACTIVE' : 'INACTIVE'}
                      customLabel={section.isActive ? pick('সক্রিয়', 'Active') : pick('বন্ধ', 'Inactive')}
                      customTone={section.isActive ? 'success' : 'neutral'}
                    />
                  </td>
                  <td className="p-3 text-right">
                    <Button type="button" variant="outline" size="sm" onClick={() => startEdit(section)}>
                      <Pencil className="w-4 h-4" />
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
