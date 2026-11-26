'use client';

import React from 'react';
import { Pencil, User } from 'lucide-react';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort } from '@/src/lib/formatters';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Modal } from '@/src/components/ui/primitives';
import { BloodGroup, Gender, Religion, StaffStatus } from '@/src/types/enums';
import type { Staff } from '@/src/types/entities';
import { resolveStaffPhotoUrl } from '../api/staff.api';

export function StaffViewModal({
  open,
  onClose,
  member,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  member: Staff | null;
  onEdit: (member: Staff) => void;
}) {
  const { locale, pick } = useI18n();
  if (!member) return null;

  const numLocale = locale === 'bn' ? 'bn' : 'en';
  const photoUrl = resolveStaffPhotoUrl(member.photo);

  const genderLabel = (g?: Gender | null) => {
    if (!g) return '—';
    if (g === Gender.MALE) return pick('পুরুষ', 'Male');
    if (g === Gender.FEMALE) return pick('নারী', 'Female');
    return pick('অন্যান্য', 'Other');
  };

  const religionLabel = (r?: Religion | null) => {
    if (!r) return '—';
    const map: Record<Religion, string> = {
      [Religion.ISLAM]: pick('ইসলাম', 'Islam'),
      [Religion.HINDUISM]: pick('হিন্দু', 'Hinduism'),
      [Religion.CHRISTIANITY]: pick('খ্রিস্টান', 'Christianity'),
      [Religion.BUDDHISM]: pick('বৌদ্ধ', 'Buddhism'),
      [Religion.OTHER]: pick('অন্যান্য', 'Other'),
    };
    return map[r] ?? r;
  };

  const bloodLabel = (b?: BloodGroup | null) =>
    b ? b.replace('_POSITIVE', '+').replace('_NEGATIVE', '−') : '—';

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-base font-medium text-foreground break-words">{value || '—'}</p>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={pick('স্টাফ প্রোফাইল বিবরণ', 'Staff Profile Details')}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Header Profile Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-surface-muted/40">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl border border-border bg-surface overflow-hidden flex items-center justify-center shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={member.nameBn || member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-7 h-7 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">
                {member.nameBn || member.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {member.designation}
                {member.employeeId ? (
                  <span className="ml-2 font-mono text-xs px-2 py-0.5 rounded bg-surface border border-border text-foreground">
                    {member.employeeId}
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge enumName="StaffType" value={member.staffType} />
            <StatusBadge enumName="StaffStatus" value={member.status} />
          </div>
        </div>

        {/* Section 1: Institutional Details */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-primary border-b border-border pb-1.5">
            {pick('১. প্রাতিষ্ঠানিক তথ্য', '1. Institutional Details')}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoRow
              label={pick('পূর্ণ নাম', 'Full Name')}
              value={member.nameBn || member.name}
            />
            <InfoRow
              label={pick('স্টাফ আইডি', 'Staff ID')}
              value={member.employeeId ? <span className="font-mono">{member.employeeId}</span> : '—'}
            />
            <InfoRow
              label={pick('পদবি', 'Designation')}
              value={member.designation}
            />
            <InfoRow
              label={pick('ধরন', 'Staff Type')}
              value={<StatusBadge enumName="StaffType" value={member.staffType} />}
            />
            <InfoRow
              label={pick('নিয়োগের ধরন', 'Employment Type')}
              value={<StatusBadge enumName="EmploymentType" value={member.employmentType} />}
            />
            <InfoRow
              label={pick('শিক্ষাগত যোগ্যতা', 'Qualification')}
              value={member.qualification}
            />
            <InfoRow
              label={pick('যোগদানের তারিখ', 'Joining Date')}
              value={
                member.joiningDate
                  ? formatDateShort(member.joiningDate, numLocale)
                  : '—'
              }
            />
            <InfoRow
              label={pick('অবস্থা (Status)', 'Status')}
              value={<StatusBadge enumName="StaffStatus" value={member.status} />}
            />
            {member.status !== StaffStatus.ACTIVE && (
              <InfoRow
                label={pick('বিদায় / অবসরের তারিখ', 'Leaving Date')}
                value={
                  member.leavingDate
                    ? formatDateShort(member.leavingDate, numLocale)
                    : '—'
                }
              />
            )}
          </div>
        </div>

        {/* Section 2: Personal & Contact Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-primary border-b border-border pb-1.5">
            {pick('২. ব্যক্তিগত ও যোগাযোগের তথ্য', '2. Personal & Contact Information')}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoRow label={pick('মোবাইল নম্বর', 'Phone')} value={member.phone} />
            <InfoRow label={pick('ইমেইল', 'Email')} value={member.email} />
            <InfoRow
              label={pick('জরুরি যোগাযোগ', 'Emergency Phone')}
              value={member.emergencyContact}
            />
            <InfoRow label={pick('জাতীয় পরিচয়পত্র (NID)', 'NID')} value={member.nid} />
            <InfoRow label={pick('লিঙ্গ', 'Gender')} value={genderLabel(member.gender)} />
            <InfoRow label={pick('ধর্ম', 'Religion')} value={religionLabel(member.religion)} />
            <InfoRow
              label={pick('রক্তের গ্রুপ', 'Blood Group')}
              value={bloodLabel(member.bloodGroup)}
            />
            <InfoRow
              label={pick('জন্ম তারিখ', 'Date of Birth')}
              value={
                member.dateOfBirth
                  ? formatDateShort(member.dateOfBirth, numLocale)
                  : '—'
              }
            />
            <InfoRow label={pick('পিতার নাম', 'Father’s Name')} value={member.fatherName} />
            <InfoRow label={pick('মাতার নাম', 'Mother’s Name')} value={member.motherName} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <InfoRow
              label={pick('বর্তমান ঠিকানা', 'Present Address')}
              value={member.presentAddress}
            />
            <InfoRow
              label={pick('স্থায়ী ঠিকানা', 'Permanent Address')}
              value={member.permanentAddress}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            {pick('বন্ধ করুন', 'Close')}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              onClose();
              onEdit(member);
            }}
          >
            <Pencil className="w-4 h-4" />
            <span>{pick('সম্পাদনা করুন', 'Edit Profile')}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
