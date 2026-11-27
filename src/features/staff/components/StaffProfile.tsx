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
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Modal } from '@/src/components/ui/primitives';
import { StaffFormModal } from './StaffFormModal';
import type { StaffWorkspace } from '../api/staff.api';

export function StaffProfile({ staffId }: { staffId: string }) {
  const router = useRouter();
  const { data: member, isLoading, error, refetch } = useGetStaffProfileQuery(staffId);
  const [deleteStaff, { isLoading: deleting }] = useDeleteStaffMutation();
  const [open, setOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  if (isLoading) return <LoadingSkeleton />;
  if (error || !member) return (
    <div role="alert">
      <p>{'স্টাফ প্রোফাইল লোড করা যায়নি।'}</p>
      <Button size="sm" variant="outline" onClick={refetch}>{'আবার চেষ্টা করুন'}</Button>
    </div>
  );

  const classDuties = member.sectionClassTeachers;
  const subjects = member.teacherAssignments;

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
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>{'সম্পাদনা'}</Button>
          <Button
            size="sm"
            variant="outline"
            disabled={deleting}
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmDeleteOpen(true)}
          >
            {'মুছুন'}
          </Button>
          <Link href="/admin/staff"><Button size="sm" variant="ghost">{'তালিকায়'}</Button></Link>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
        <Card className="p-4 space-y-1">
          <p className="font-semibold">{'চাকরি'}</p>
          <p>{'যোগ্যতা'}: {member.qualification || '—'}</p>
          <p>{'যোগদান'}: {member.joiningDate?.slice(0, 10) || '—'}</p>
          <p>{'ছাড়ার তারিখ'}: {member.leavingDate?.slice(0, 10) || '—'}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="font-semibold">{'যোগাযোগ'}</p>
          <p>{member.phone || '—'}</p>
          <p>{member.email || '—'}</p>
          <p>{'জরুরি'}: {member.emergencyContact || '—'}</p>
          <p>{'বর্তমান ঠিকানা'}: {member.presentAddress || '—'}</p>
          <p>{'স্থায়ী ঠিকানা'}: {member.permanentAddress || '—'}</p>
        </Card>
      </div>
      <Card className="p-4 space-y-2 text-sm">
        <p className="font-semibold">{'এই বছরের শিক্ষকতা'}</p>
        {classDuties.map((duty) => (
          <p key={duty.id}>{'শ্রেণি শিক্ষক'} {duty.section.schoolClass.name} ({duty.section.name})</p>
        ))}
        {subjects.map((duty) => (
          <p key={duty.id}>{'বিষয়'} {duty.classSubject.subject.name} {duty.section?.name}</p>
        ))}
        {!classDuties.length && !subjects.length && <p className="text-muted-foreground">{'এই বছর কোনো বণ্টন নেই।'}</p>}
      </Card>
      <StaffFormModal open={open} onClose={() => setOpen(false)} member={member} defaultType={member.staffType} />
      <Modal
        open={confirmDeleteOpen}
        onClose={() => !deleting && setConfirmDeleteOpen(false)}
        title={'স্টাফ সদস্য মুছে ফেলুন'}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-base text-foreground">
            {`আপনি কি নিশ্চিতভাবে "${member.nameBn || member.name}"-কে মুছে ফেলতে চান?`}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={deleting} onClick={() => setConfirmDeleteOpen(false)}>
              {'বাতিল'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={async () => {
                try {
                  await deleteStaff(member.id).unwrap();
                  toast.success('স্টাফ সদস্য মুছে ফেলা হয়েছে।');
                  router.push('/admin/staff');
                } catch (err: unknown) {
                  const e = err as { data?: { message?: string }; message?: string };
                  toast.error(e?.data?.message || e?.message || 'মুছে ফেলা যায়নি।');
                }
              }}
            >
              {deleting ? 'মুছে ফেলা হচ্ছে...' : 'মুছে ফেলুন'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
