'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  useSaveBookMutation,
} from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { Button, Card, FormField, Input, Select } from '@/src/components/ui';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { BookType } from '@/src/types/enums';
import type { AcademicYear } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';
import { SubjectCatalogPanel } from './academic/panels/SubjectCatalogPanel';
import { ClassSubjectsPanel } from './academic/panels/ClassSubjectsPanel';

function errorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return fallback;
}

export function AcademicCurriculum({
  db,
  year,
  section,
}: {
  db: MockDatabase;
  year: AcademicYear;
  section: 'curriculum' | 'books' | 'catalog';
}) {
  const { locale, pick } = useI18n();
  const [saveBook, { isLoading: savingBook }] = useSaveBookMutation();

  const [classId, setClassId] = useState(db.classes[0]?.id ?? '');
  const [bookSubjectId, setBookSubjectId] = useState('');
  const [bookName, setBookName] = useState('');
  const [bookCode, setBookCode] = useState('');

  const classLabel = (id: string) => {
    const item = db.classes.find((entry) => entry.id === id);
    return locale === 'bn' ? item?.nameBn || item?.name : item?.name;
  };
  const subjectLabel = (id: string) => {
    const item = db.subjects.find((entry) => entry.id === id);
    return locale === 'bn' ? item?.nameBn || item?.name : item?.name;
  };

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
      {section === 'curriculum' && <ClassSubjectsPanel db={db} year={year} />}

      {section === 'books' && (
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <FormField label={pick('শ্রেণি', 'Class')}>
            <Select value={classId} onChange={(event) => setClassId(event.target.value)} className="min-w-44">
              {db.classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {classLabel(item.id)}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
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
      )}

      {section === 'catalog' && <SubjectCatalogPanel db={db} />}
    </div>
  );
}
