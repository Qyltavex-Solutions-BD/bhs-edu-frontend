'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import {
  resolveStaffPhotoUrl,
  useDeleteStaffMutation,
  useGetStaffProfileQuery,
} from '../api/staff.api';
import { useI18n } from '@/src/lib/i18n';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Modal } from '@/src/components/ui/primitives';
import { StaffFormModal } from './StaffFormModal';
import type { StaffWorkspace } from '../api/staff.api';

export function StaffProfile({ staffId }: { staffId: string }) {
  const { pick } = useI18n();
  const router = useRouter();
  const { data: member, isLoading, error, refetch } = useGetStaffProfileQuery(staffId);
  const [deleteStaff, { isLoading: deleting }] = useDeleteStaffMutation();
  const [open, setOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
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
        <div className="flex items-center gap-3.5">
          {resolveStaffPhotoUrl(member.photo) && (
            <img
              src={resolveStaffPhotoUrl(member.photo)!}
              alt={member.nameBn || member.name}
              className="w-14 h-14 rounded-2xl object-cover border border-border shrink-0"
            />
          )}
          <div>
            <h2 className="text-lg font-semibold">{member.nameBn || member.name}</h2>
            <p className="text-sm text-muted-foreground">{member.designation} · <span className="font-mono">{member.employeeId}</span></p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge enumName="StaffStatus" value={member.status} />
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>{pick('সম্পাদনা', 'Edit')}</Button>
          <Button
            size="sm"
            variant="outline"
            disabled={deleting}
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmDeleteOpen(true)}
          >
            {pick('মুছুন', 'Delete')}
          </Button>
          <Link href="/admin/staff"><Button size="sm" variant="ghost">{pick('তালিকায়', 'Back to list')}</Button></Link>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
        <Card className="p-4 space-y-1">
          <p className="font-semibold">{pick('চাকরি', 'Employment')}</p>
          <p>{pick('যোগ্যতা', 'Qualification')}: {member.qualification || '—'}</p>
          <p>{pick('যোগদান', 'Joined')}: {member.joiningDate?.slice(0, 10) || '—'}</p>
          <p>{pick('ছাড়ার তারিখ', 'Left')}: {member.leavingDate?.slice(0, 10) || '—'}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="font-semibold">{pick('যোগাযোগ', 'Contact')}</p>
          <p>{member.phone || '—'}</p>
          <p>{member.email || '—'}</p>
          <p>{pick('জরুরি', 'Emergency')}: {member.emergencyContact || '—'}</p>
          <p>{pick('বর্তমান ঠিকানা', 'Present Address')}: {member.presentAddress || '—'}</p>
          <p>{pick('স্থায়ী ঠিকানা', 'Permanent Address')}: {member.permanentAddress || '—'}</p>
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
      <StaffFormModal open={open} onClose={() => setOpen(false)} member={member} defaultType={member.staffType} />
      <Modal
        open={confirmDeleteOpen}
        onClose={() => !deleting && setConfirmDeleteOpen(false)}
        title={pick('স্টাফ সদস্য মুছে ফেলুন', 'Delete Staff Member')}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-base text-foreground">
            {pick(
              `আপনি কি নিশ্চিতভাবে "${member.nameBn || member.name}"-কে মুছে ফেলতে চান?`,
              `Are you sure you want to delete "${member.name}"?`
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={deleting} onClick={() => setConfirmDeleteOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={async () => {
                try {
                  await deleteStaff(member.id).unwrap();
                  toast.success(pick('স্টাফ সদস্য মুছে ফেলা হয়েছে।', 'Staff member deleted.'));
                  router.push('/admin/staff');
                } catch (err: unknown) {
                  const e = err as { data?: { message?: string }; message?: string };
                  toast.error(e?.data?.message || e?.message || pick('মুছে ফেলা যায়নি।', 'Could not delete staff member.'));
                }
              }}
            >
              {deleting ? pick('মুছে ফেলা হচ্ছে...', 'Deleting...') : pick('মুছে ফেলুন', 'Delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
