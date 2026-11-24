'use client';

import React from 'react';
import type { AcademicYear } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';
import { SubjectCatalogPanel } from './academic/panels/SubjectCatalogPanel';
import { ClassSubjectsPanel } from './academic/panels/ClassSubjectsPanel';
import { BooksPanel } from './academic/panels/BooksPanel';

export function AcademicCurriculum({
  db,
  year,
  section,
}: {
  db: MockDatabase;
  year: AcademicYear;
  section: 'curriculum' | 'books' | 'catalog';
}) {
  return (
    <div className="space-y-6">
      {section === 'curriculum' && <ClassSubjectsPanel db={db} year={year} />}
      {section === 'books' && <BooksPanel db={db} year={year} />}
      {section === 'catalog' && <SubjectCatalogPanel db={db} />}
    </div>
  );
}
