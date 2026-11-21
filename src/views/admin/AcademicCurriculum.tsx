'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  useRemoveClassSubjectMutation,
  useRolloverClassSubjectsMutation,
  useSaveBookMutation,
  useSaveClassSubjectMutation,
} from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { Button, Card, FormField, Input, Select, Switch } from '@/src/components/ui/primitives';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { BookType } from '@/src/types/enums';
import type { AcademicYear, ClassSubject } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';

function errorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return fallback;
}

export function AcademicCurriculum({ db, year }: { db: MockDatabase; year: AcademicYear }) {
  const { locale, pick } = useI18n();
  const [saveSubject, { isLoading: savingSubject }] = useSaveClassSubjectMutation();
  const [removeSubject, { isLoading: removing }] = useRemoveClassSubjectMutation();
  const [rollover, { isLoading: copying }] = useRolloverClassSubjectsMutation();
  const [saveBook, { isLoading: savingBook }] = useSaveBookMutation();

  const [classId, setClassId] = useState(db.classes[0]?.id ?? '');
  const [groupFilter, setGroupFilter] = useState('all');
  const [subjectId, setSubjectId] = useState(db.subjects.find((subject) => subject.isActive)?.id ?? '');
  const [groupId, setGroupId] = useState('');
  const [isOptional, setIsOptional] = useState(false);
  const [fromYearId, setFromYearId] = useState('');

  useEffect(() => {
    setFromYearId(db.academicYears.find((item) => item.id !== year.id)?.id ?? '');
  }, [db.academicYears, year.id]);
  const [bookSubjectId, setBookSubjectId] = useState('');
  const [bookName, setBookName] = useState('');
  const [bookCode, setBookCode] = useState('');

  const schoolClass = db.classes.find((item) => item.id === classId);
  const usesGroup = (schoolClass?.numericValue ?? 0) >= 9;
  const classLabel = (id: string) => {
    const item = db.classes.find((entry) => entry.id === id);
    return locale === 'bn' ? item?.nameBn || item?.name : item?.name;
  };
  const subjectLabel = (id: string) => {
    const item = db.subjects.find((entry) => entry.id === id);
    return locale === 'bn' ? item?.nameBn || item?.name : item?.name;
  };
  const groupLabel = (id?: string | null) => {
    if (!id) return pick('কমন', 'Common');
    const item = db.academicGroups.find((entry) => entry.id === id);
    return locale === 'bn' ? item?.nameBn || item?.name : item?.name;
  };

  const yearSubjects = useMemo(
    () =>
      db.classSubjects
        .filter((item) => item.academicYearId === year.id && item.classId === classId)
        .filter((item) => {
          if (!usesGroup || groupFilter === 'all') return true;
          if (groupFilter === 'common') return !item.groupId;
          return item.groupId === groupFilter;
        })
        .sort((a, b) => a.displayOrder - b.displayOrder || subjectLabel(a.subjectId).localeCompare(subjectLabel(b.subjectId))),
    [db.classSubjects, year.id, classId, usesGroup, groupFilter, locale]
  );

  const curriculumSubjectIds = useMemo(
    () =>
      Array.from(
        new Set(
          db.classSubjects
            .filter((item) => item.academicYearId === year.id && item.classId === classId && item.isActive)
            .map((item) => item.subjectId)
        )
      ),
    [db.classSubjects, year.id, classId]
  );

  const classBooks = db.books.filter(
    (book) => book.classId === classId && curriculumSubjectIds.includes(book.subjectId)
  );

  const handleAssign = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveSubject({
        academicYearId: year.id,
        classId,
        subjectId,
        groupId: usesGroup ? groupId || null : null,
        isOptional,
        displayOrder: yearSubjects.length + 1,
      }).unwrap();
      toast.success(pick('বিষয় পাঠ্যক্রমে যুক্ত হয়েছে।', 'Subject added to the curriculum.'));
      setIsOptional(false);
    } catch (err) {
      toast.error(errorMessage(err, pick('বিষয় যুক্ত হয়নি।', 'Could not assign the subject.')));
    }
  };

  const patchSubject = async (item: ClassSubject, patch: Partial<ClassSubject>) => {
    try {
      await saveSubject({ ...item, ...patch }).unwrap();
    } catch (err) {
      toast.error(errorMessage(err, pick('হালনাগাদ হয়নি।', 'Could not update the subject.')));
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeSubject({ id }).unwrap();
      toast.success(pick('বিষয় পাঠ্যক্রম থেকে সরানো হয়েছে।', 'Subject removed from the curriculum.'));
    } catch (err) {
      toast.error(errorMessage(err, pick('বিষয় সরানো যায়নি।', 'Could not remove the subject.')));
    }
  };

  const handleRollover = async () => {
    try {
      const result = await rollover({ fromAcademicYearId: fromYearId, toAcademicYearId: year.id }).unwrap();
      toast.success(
        pick(
          `${formatNumber(result.copiedCount, 'bn')}টি বিষয় কপি হয়েছে, ${formatNumber(result.skippedCount, 'bn')}টি আগে থেকে ছিল।`,
          `Copied ${result.copiedCount} subjects. ${result.skippedCount} were already present.`
        )
      );
    } catch (err) {
      toast.error(errorMessage(err, pick('পাঠ্যক্রম কপি হয়নি।', 'Could not copy the curriculum.')));
    }
  };

  const handleBook = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveBook({
        academicYearId: year.id,
        classId,
        subjectId: bookSubjectId,
        name: bookName,
        bookCode,
        type: BookType.TEXTBOOK,
        isActive: true,
      }).unwrap();
      toast.success(pick('বই যুক্ত হয়েছে।', 'Book added.'));
      setBookName('');
      setBookCode('');
    } catch (err) {
      toast.error(errorMessage(err, pick('বই সংরক্ষণ হয়নি।', 'Could not save the book.')));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 flex flex-wrap items-end gap-3">
        <FormField label={pick(`${year.name} এ কপি করবেন যে বছর থেকে`, `Copy into ${year.name} from`)}>
          <Select value={fromYearId} onChange={(event) => setFromYearId(event.target.value)} className="min-w-40">
            {db.academicYears
              .filter((item) => item.id !== year.id)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </Select>
        </FormField>
        <Button type="button" variant="outline" disabled={copying || !fromYearId} onClick={handleRollover}>
          {copying ? pick('কপি হচ্ছে...', 'Copying...') : pick('সক্রিয় বিষয় কপি করুন', 'Copy active subjects')}
        </Button>
        <p className="text-sm text-muted-foreground pb-2">
          {pick(
            'যে বিষয় এই বছরে আগে থেকে আছে সেটা আবার বসবে না।',
            'Subjects already on this year are left as they are.'
          )}
        </p>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <FormField label={pick('শ্রেণি', 'Class')}>
            <Select
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value);
                setGroupFilter('all');
                setGroupId('');
              }}
              className="min-w-44"
            >
              {db.classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {classLabel(item.id)}
                </option>
              ))}
            </Select>
          </FormField>
          {usesGroup && (
            <FormField label={pick('তালিকা ফিল্টার', 'List filter')}>
              <Select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)} className="min-w-44">
                <option value="all">{pick('সব', 'All')}</option>
                <option value="common">{pick('কমন', 'Common')}</option>
                {db.academicGroups
                  .filter((group) => group.isActive)
                  .map((group) => (
                    <option key={group.id} value={group.id}>
                      {groupLabel(group.id)}
                    </option>
                  ))}
              </Select>
            </FormField>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {usesGroup
            ? pick(
                '৯ম–১০ম শ্রেণিতে কমন বিষয় সবার, বিভাগের বিষয় শুধু সেই বিভাগের। একাধিক বিষয় ঐচ্ছিক রাখা যায়; শিক্ষার্থী পরে একটি নেবে।',
                'In classes 9–10, common subjects are for every group. A grouped subject belongs to that stream. Several subjects may be optional; a student later chooses one.'
              )
            : pick('৬ষ্ঠ–৮ম শ্রেণিতে বিভাগ নেই। বিষয় সবার জন্য।', 'Classes 6–8 have no stream. Subjects apply to the whole class.')}
        </p>
        <form onSubmit={handleAssign} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <FormField label={pick('বিষয়', 'Subject')}>
            <Select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
              {db.subjects
                .filter((subject) => subject.isActive)
                .map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.officialCode ? `${subject.officialCode} · ` : ''}
                    {subjectLabel(subject.id)}
                  </option>
                ))}
            </Select>
          </FormField>
          {usesGroup && (
            <FormField label={pick('বিভাগ', 'Group')}>
              <Select value={groupId} onChange={(event) => setGroupId(event.target.value)}>
                <option value="">{pick('কমন (সব বিভাগ)', 'Common (all groups)')}</option>
                {db.academicGroups
                  .filter((group) => group.isActive)
                  .map((group) => (
                    <option key={group.id} value={group.id}>
                      {groupLabel(group.id)}
                    </option>
                  ))}
              </Select>
            </FormField>
          )}
          <Switch
            checked={isOptional}
            onChange={setIsOptional}
            label={pick('ঐচ্ছিক / চতুর্থ বিষয়', 'Optional / fourth subject')}
          />
          <Button type="submit" variant="primary" disabled={savingSubject || !classId || !subjectId}>
            {savingSubject ? pick('যুক্ত হচ্ছে...', 'Adding...') : pick('পাঠ্যক্রমে যুক্ত করুন', 'Add to curriculum')}
          </Button>
        </form>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-sm text-muted-foreground">
            <tr>
              <th className="p-3 text-left">{pick('বিষয়', 'Subject')}</th>
              <th className="p-3 text-left">{pick('বিভাগ', 'Group')}</th>
              <th className="p-3 text-left">{pick('ধরন', 'Type')}</th>
              <th className="p-3 text-left">{pick('অবস্থা', 'Status')}</th>
              <th className="p-3 text-right">{pick('কাজ', 'Action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {yearSubjects.length === 0 && (
              <tr>
                <td className="p-4 text-muted-foreground" colSpan={5}>
                  {pick('এই শ্রেণিতে এখনো কোনো বিষয় নেই।', 'No subjects on this class for the selected year.')}
                </td>
              </tr>
            )}
            {yearSubjects.map((item) => (
              <tr key={item.id}>
                <td className="p-3 font-medium">{subjectLabel(item.subjectId)}</td>
                <td className="p-3">{usesGroup ? groupLabel(item.groupId) : pick('—', '—')}</td>
                <td className="p-3">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => patchSubject(item, { isOptional: !item.isOptional })}
                  >
                    <StatusBadge
                      value={item.isOptional ? 'OPTIONAL' : 'COMPULSORY'}
                      customLabel={item.isOptional ? pick('ঐচ্ছিক', 'Optional') : pick('আবশ্যিক', 'Compulsory')}
                      customTone={item.isOptional ? 'warning' : 'success'}
                    />
                  </button>
                </td>
                <td className="p-3">
                  <button type="button" onClick={() => patchSubject(item, { isActive: !item.isActive })}>
                    <StatusBadge
                      value={item.isActive ? 'ACTIVE' : 'INACTIVE'}
                      customLabel={item.isActive ? pick('সক্রিয়', 'Active') : pick('বন্ধ', 'Inactive')}
                      customTone={item.isActive ? 'success' : 'neutral'}
                    />
                  </button>
                </td>
                <td className="p-3 text-right">
                  <Button type="button" variant="outline" size="sm" disabled={removing} onClick={() => handleRemove(item.id)}>
                    {pick('সরান', 'Remove')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-base font-bold">{pick('পাঠ্যবই', 'Textbooks')}</h3>
        <p className="text-sm text-muted-foreground">
          {pick(
            'বই শ্রেণি ও বিষয়ের সাথে থাকে। শুধু এই বছরের সক্রিয় পাঠ্যক্রমের বিষয়ে বই যোগ করা যায়।',
            'A book belongs to a class and subject. You can add one only for a subject active on this year.'
          )}
        </p>
        <form onSubmit={handleBook} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <FormField label={pick('বিষয়', 'Subject')}>
            <Select value={bookSubjectId} onChange={(event) => setBookSubjectId(event.target.value)}>
              <option value="">{pick('বিষয় বাছুন', 'Choose a subject')}</option>
              {curriculumSubjectIds.map((id) => (
                <option key={id} value={id}>
                  {subjectLabel(id)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={pick('বইয়ের নাম', 'Book name')}>
            <Input value={bookName} onChange={(event) => setBookName(event.target.value)} />
          </FormField>
          <FormField label={pick('বই কোড', 'Book code')}>
            <Input value={bookCode} onChange={(event) => setBookCode(event.target.value)} placeholder="NCTB-101" />
          </FormField>
          <Button type="submit" variant="primary" disabled={savingBook || !bookSubjectId}>
            {savingBook ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('বই যুক্ত করুন', 'Add book')}
          </Button>
        </form>
        <div className="divide-y divide-border">
          {classBooks.length === 0 && (
            <p className="py-3 text-sm text-muted-foreground">{pick('এই শ্রেণির পাঠ্যক্রমে এখনো বই নেই।', 'No books for this class curriculum yet.')}</p>
          )}
          {classBooks.map((book) => (
            <div key={book.id} className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{book.name}</p>
                <p className="text-sm text-muted-foreground">
                  {subjectLabel(book.subjectId)}
                  {book.bookCode ? ` · ${book.bookCode}` : ''}
                </p>
              </div>
              <StatusBadge
                value={book.isActive ? 'ACTIVE' : 'INACTIVE'}
                customLabel={book.isActive ? pick('সক্রিয়', 'Active') : pick('বন্ধ', 'Inactive')}
                customTone={book.isActive ? 'success' : 'neutral'}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
