'use client';

import React from 'react';
import { Pencil, User } from 'lucide-react';
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
  if (!member) return null;

  const numLocale = 'bn';
  const photoUrl = resolveStaffPhotoUrl(member.photo);

  const genderLabel = (g?: Gender | null) => {
    if (!g) return '—';
    if (g === Gender.MALE) return 'পুরুষ';
    if (g === Gender.FEMALE) return 'নারী';
    return 'অন্যান্য';
  };

  const religionLabel = (r?: Religion | null) => {
    if (!r) return '—';
    const map: Record<Religion, string> = {
      [Religion.ISLAM]: 'ইসলাম',
      [Religion.HINDUISM]: 'হিন্দু',
      [Religion.CHRISTIANITY]: 'খ্রিস্টান',
      [Religion.BUDDHISM]: 'বৌদ্ধ',
      [Religion.OTHER]: 'অন্যান্য',
    };
    return map[r] ?? r;
  };

  const bloodLabel = (b?: BloodGroup | null) =>
    b ? b.replace('_POSITIVE', '+').replace('_NEGATIVE', '−') : '—';

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="space-y-0.5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-base font-medium text-foreground break-words">{value || '—'}</p>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={'স্টাফ প্রোফাইল বিবরণ'}
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
            {'১. প্রাতিষ্ঠানিক তথ্য'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoRow
              label={'পূর্ণ নাম'}
              value={member.nameBn || member.name}
            />
            <InfoRow
              label={'স্টাফ আইডি'}
              value={member.employeeId ? <span className="font-mono">{member.employeeId}</span> : '—'}
            />
            <InfoRow
              label={'পদবি'}
              value={member.designation}
            />
            <InfoRow
              label={'ধরন'}
              value={<StatusBadge enumName="StaffType" value={member.staffType} />}
            />
            <InfoRow
              label={'নিয়োগের ধরন'}
              value={<StatusBadge enumName="EmploymentType" value={member.employmentType} />}
            />
            <InfoRow
              label={'শিক্ষাগত যোগ্যতা'}
              value={member.qualification}
            />
            <InfoRow
              label={'যোগদানের তারিখ'}
              value={
                member.joiningDate
                  ? formatDateShort(member.joiningDate, numLocale)
                  : '—'
              }
            />
            <InfoRow
              label={'অবস্থা (Status)'}
              value={<StatusBadge enumName="StaffStatus" value={member.status} />}
            />
            {member.status !== StaffStatus.ACTIVE && (
              <InfoRow
                label={'বিদায় / অবসরের তারিখ'}
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
            {'২. ব্যক্তিগত ও যোগাযোগের তথ্য'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoRow label={'মোবাইল নম্বর'} value={member.phone} />
            <InfoRow label={'ইমেইল'} value={member.email} />
            <InfoRow
              label={'জরুরি যোগাযোগ'}
              value={member.emergencyContact}
            />
            <InfoRow label={'জাতীয় পরিচয়পত্র (NID)'} value={member.nid} />
            <InfoRow label={'লিঙ্গ'} value={genderLabel(member.gender)} />
            <InfoRow label={'ধর্ম'} value={religionLabel(member.religion)} />
            <InfoRow
              label={'রক্তের গ্রুপ'}
              value={bloodLabel(member.bloodGroup)}
            />
            <InfoRow
              label={'জন্ম তারিখ'}
              value={
                member.dateOfBirth
                  ? formatDateShort(member.dateOfBirth, numLocale)
                  : '—'
              }
            />
            <InfoRow label={'পিতার নাম'} value={member.fatherName} />
            <InfoRow label={'মাতার নাম'} value={member.motherName} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <InfoRow
              label={'বর্তমান ঠিকানা'}
              value={member.presentAddress}
            />
            <InfoRow
              label={'স্থায়ী ঠিকানা'}
              value={member.permanentAddress}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            {'বন্ধ করুন'}
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
            <span>{'সম্পাদনা করুন'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
