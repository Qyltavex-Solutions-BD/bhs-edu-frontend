'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { useGetStaffProfileQuery } from '../api/staff.api';
import { useI18n } from '@/src/lib/i18n';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card } from '@/src/components/ui/primitives';
import { deptName } from './StaffDepartments';
import { StaffFormModal } from './StaffFormModal';
import type { StaffWorkspace } from '../api/staff.api';

export function StaffProfile({ db, staffId }: { db: StaffWorkspace; staffId: string }) {
  const { pick } = useI18n();
  const { data: member, isLoading, error, refetch } = useGetStaffProfileQuery(staffId);
  const [open, setOpen] = useState(false);
  if (isLoading) return <LoadingSkeleton />;
  if (error || !member) return (
    <div role="alert">
      <p>{pick('স্টাফ প্রোফাইল লোড করা যায়নি।', 'Could not load the staff profile.')}</p>
      <Button size="sm" variant="outline" onClick={refetch}>{pick('আবার চেষ্টা করুন', 'Retry')}</Button>
    </div>
  );

  const classDuties = member.sectionClassTeachers.filter((duty) => duty.academicYear.isActive);
  const subjects = member.teacherAssignments.filter((duty) => duty.isActive && duty.academicYear.isActive);

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
          <p>{pick('যোগদান', 'Joined')}: {member.joiningDate?.slice(0, 10) || '—'}</p>
          <p>{pick('ছাড়ার তারিখ', 'Left')}: {member.leavingDate?.slice(0, 10) || '—'}</p>
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
        <p className="font-semibold">{pick('এই বছরের শিক্ষকতা', 'Teaching this year')}</p>
        {classDuties.map((duty) => (
          <p key={duty.id}>{pick('শ্রেণি শিক্ষক', 'Class teacher')} {duty.section.schoolClass.name} ({duty.section.name})</p>
        ))}
        {subjects.map((duty) => (
          <p key={duty.id}>{pick('বিষয়', 'Subject')} {duty.classSubject.subject.name} {duty.section?.name}</p>
        ))}
        {!classDuties.length && !subjects.length && <p className="text-muted-foreground">{pick('এই বছর কোনো বণ্টন নেই।', 'No assignment this year.')}</p>}
      </Card>
      <StaffFormModal db={db} open={open} onClose={() => setOpen(false)} member={member} defaultType={member.staffType} />
    </div>
  );
}
