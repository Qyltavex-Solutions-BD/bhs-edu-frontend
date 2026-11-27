'use client';

import React, { useState } from 'react';
import { ListChecks } from 'lucide-react';
import { Button, Modal, SegmentedTabs } from '@/src/components/ui/primitives';
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
  const [activeView, setActiveView] = useState<'curriculum' | 'books'>(
    section === 'books' ? 'books' : 'curriculum',
  );
  const [catalogOpen, setCatalogOpen] = useState(section === 'catalog');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <SegmentedTabs
          value={activeView}
          onChange={(val) => setActiveView(val as 'curriculum' | 'books')}
          items={[
            {
              value: 'curriculum',
              label: 'শ্রেণির বিষয়',
            },
            {
              value: 'books',
              label: 'পাঠ্যবই',
            },
          ]}
        />

        <Button type="button" variant="outline" onClick={() => setCatalogOpen(true)}>
          <ListChecks className="w-4 h-4" />
          {'মাস্টার বিষয় তালিকা'}
        </Button>
      </div>

      {activeView === 'curriculum' ? (
        <ClassSubjectsPanel db={db} year={year} />
      ) : (
        <BooksPanel db={db} year={year} />
      )}

      <Modal
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        title={'মাস্টার বিষয় তালিকা'}
        description={'নতুন বা কাস্টম কোনো বিষয় প্রয়োজন হলে এখান থেকে যোগ বা সম্পাদনা করুন।'}
        size="xl"
      >
        <SubjectCatalogPanel db={db} />
      </Modal>
    </div>
  );
}
