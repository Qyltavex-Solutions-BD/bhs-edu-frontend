'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAcademicYearSelection } from '@/src/views/admin/AcademicFoundation';
import { useI18n } from '@/src/lib/i18n';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card } from '@/src/components/ui/primitives';
import { deptName } from './StaffDepartments';
import { StaffFormModal } from './StaffFormModal';
import type { MockDatabase } from '@/src/mocks/seed';

export function StaffProfile({ db, staffId }: { db: MockDatabase; staffId: string }) {
  const { locale, pick } = useI18n();
  const year = useAcademicYearSelection(db.academicYears);
  const member = db.staff.find((item) => item.id === staffId);
  const [open, setOpen] = useState(false);
  if (!member) return <p className="text-sm text-muted-foreground">{pick('স্টাফ পাওয়া যায়নি।', 'Staff member was not found.')}</p>;

  const classDuties = db.sectionClassTeachers.filter((row) => row.staffId === member.id && row.academicYearId === year?.id);
  const subjects = db.teacherAssignments.filter((row) => row.staffId === member.id && row.isActive && row.academicYearId === year?.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{member.nameBn || member.name}</h2>
          <p className="text-sm text-muted-foreground">{member.designation} · <span className="font-mono">{member.employeeId}</span></p>
        </div>
        <div className="flex gap-2">
          <StatusBadge enumName="StaffStatus" value={member.status} />
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>{pick('সম্পাদনা', 'Edit')}</Button>
          <Link href="/admin/staff"><Button size="sm" variant="ghost">{pick('তালিকায়', 'Back to list')}</Button></Link>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
        <Card className="p-4 space-y-1">
          <p className="font-semibold">{pick('চাকরি', 'Employment')}</p>
          <p>{pick('বিভাগ', 'Department')}: {deptName(db, member.departmentId)}</p>
          <p>{pick('যোগ্যতা', 'Qualification')}: {member.qualification || '—'}</p>
          <p>{pick('যোগদান', 'Joined')}: {member.joiningDate || '—'}</p>
          <p>{pick('ছাড়ার তারিখ', 'Left')}: {member.leavingDate || '—'}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="font-semibold">{pick('যোগাযোগ', 'Contact')}</p>
          <p>{member.phone || '—'}</p>
          <p>{member.email || '—'}</p>
          <p>{pick('জরুরি', 'Emergency')}: {member.emergencyContact || '—'}</p>
          <p>{member.presentAddress || '—'}</p>
        </Card>
      </div>
      <Card className="p-4 space-y-2 text-sm">
        <p className="font-semibold">{pick('এই বছরের শিক্ষকতা', 'Teaching this year')} · {year?.name}</p>
        {classDuties.map((duty) => {
          const section = db.sections.find((item) => item.id === duty.sectionId);
          const schoolClass = db.classes.find((item) => item.id === section?.classId);
          return <p key={duty.id}>{pick('শ্রেণি শিক্ষক', 'Class teacher')}: {locale === 'bn' ? schoolClass?.nameBn || schoolClass?.name : schoolClass?.name} ({section?.name})</p>;
        })}
        {subjects.map((duty) => {
          const section = db.sections.find((item) => item.id === duty.sectionId);
          const classSubject = db.classSubjects.find((item) => item.id === duty.classSubjectId);
          const subject = db.subjects.find((item) => item.id === classSubject?.subjectId);
          return <p key={duty.id}>{pick('বিষয়', 'Subject')}: {subject?.nameBn || subject?.name} · {section?.name}</p>;
        })}
        {!classDuties.length && !subjects.length && <p className="text-muted-foreground">{pick('এই বছর কোনো বণ্টন নেই।', 'No assignment this year.')}</p>}
      </Card>
      <StaffFormModal db={db} open={open} onClose={() => setOpen(false)} member={member} defaultType={member.staffType} />
    </div>
  );
}
