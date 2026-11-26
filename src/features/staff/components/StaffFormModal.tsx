'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  resolveStaffPhotoUrl,
  useCreateStaffMutation,
  useUpdateStaffMutation,
} from '../api/staff.api';
import { useI18n } from '@/src/lib/i18n';
import { Button, FormField, Input, Modal, Select, Textarea } from '@/src/components/ui/primitives';
import {
  BloodGroup,
  EmploymentType,
  Gender,
  Religion,
  StaffStatus,
  StaffType,
} from '@/src/types/enums';
import type { Staff } from '@/src/types/entities';

function errorMessage(err: unknown, fallback: string) {
  const e = err as { data?: { message?: string }; message?: string };
  return e?.data?.message || e?.message || fallback;
}

export function StaffFormModal({
  open,
  onClose,
  member,
  defaultType,
}: {
  open: boolean;
  onClose: () => void;
  member: Staff | null;
  defaultType: StaffType;
}) {
  const { pick } = useI18n();
  const [createStaff, { isLoading: creating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: updating }] = useUpdateStaffMutation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const blank = {
    employeeId: '',
    name: '',
    designation: '',
    qualification: '',
    staffType: defaultType as string,
    employmentType: EmploymentType.PERMANENT as string,
    phone: '',
    email: '',
    nid: '',
    joiningDate: '',
    status: StaffStatus.ACTIVE as string,
    leavingDate: '',
    gender: '',
    dateOfBirth: '',
    bloodGroup: '',
    religion: '',
    fatherName: '',
    motherName: '',
    emergencyContact: '',
    presentAddress: '',
    permanentAddress: '',
  };

  const [form, setForm] = useState(blank);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [loaded, setLoaded] = useState<string | null>(null);

  const key = open ? member?.id ?? `new-${defaultType}` : '';

  if (key && key !== loaded) {
    setLoaded(key);
    setPhotoFile(null);
    setLocalPreview(null);
    setRemovePhoto(false);
    setForm(
      member
        ? {
            employeeId: member.employeeId ?? '',
            name: member.name,
            designation: member.designation,
            qualification: member.qualification ?? '',
            staffType: member.staffType,
            employmentType: member.employmentType,
            phone: member.phone ?? '',
            email: member.email ?? '',
            nid: member.nid ?? '',
            joiningDate: member.joiningDate?.slice(0, 10) ?? '',
            status: member.status,
            leavingDate: member.leavingDate?.slice(0, 10) ?? '',
            gender: member.gender ?? '',
            dateOfBirth: member.dateOfBirth?.slice(0, 10) ?? '',
            bloodGroup: member.bloodGroup ?? '',
            religion: member.religion ?? '',
            fatherName: member.fatherName ?? '',
            motherName: member.motherName ?? '',
            emergencyContact: member.emergencyContact ?? '',
            presentAddress: member.presentAddress ?? '',
            permanentAddress: member.permanentAddress ?? '',
          }
        : blank
    );
  }
  if (!open && loaded) {
    setLoaded(null);
  }

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const handlePhotoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error(pick('শুধুমাত্র JPG, PNG অথবা WebP ছবি আপলোড করুন।', 'Please upload a JPG, PNG, or WebP image.'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(pick('ছবির সাইজ ৫ মেগাবাইটের কম হতে হবে।', 'Image size must be under 5 MB.'));
      return;
    }

    if (localPreview) URL.revokeObjectURL(localPreview);
    setPhotoFile(file);
    setLocalPreview(URL.createObjectURL(file));
    setRemovePhoto(false);
  };

  const handleRemovePhoto = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setPhotoFile(null);
    setLocalPreview(null);
    setRemovePhoto(true);
  };

  const photoPreviewUrl =
    localPreview ?? (removePhoto ? null : resolveStaffPhotoUrl(member?.photo));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const isFormer = form.status !== StaffStatus.ACTIVE;

    const body = new FormData();
    body.append('name', form.name.trim());
    body.append('designation', form.designation.trim());
    body.append('staffType', form.staffType);
    body.append('employmentType', form.employmentType);
    body.append('status', form.status);

    const optionalFields: Array<[string, string]> = [
      ['employeeId', form.employeeId.trim()],
      ['qualification', form.qualification.trim()],
      ['phone', form.phone.trim()],
      ['email', form.email.trim()],
      ['nid', form.nid.trim()],
      ['joiningDate', form.joiningDate],
      ['dateOfBirth', form.dateOfBirth],
      ['gender', form.gender],
      ['bloodGroup', form.bloodGroup],
      ['religion', form.religion],
      ['fatherName', form.fatherName.trim()],
      ['motherName', form.motherName.trim()],
      ['emergencyContact', form.emergencyContact.trim()],
      ['presentAddress', form.presentAddress.trim()],
      ['permanentAddress', form.permanentAddress.trim()],
    ];

    for (const [field, val] of optionalFields) {
      if (member) {
        if (field === 'employeeId' && !val) continue;
        body.append(field, val);
      } else if (val) {
        body.append(field, val);
      }
    }

    if (member) {
      body.append('leavingDate', isFormer ? form.leavingDate : '');
      if (removePhoto && !photoFile) {
        body.append('removePhoto', 'true');
      }
    }

    if (photoFile) {
      body.append('file', photoFile);
    }

    try {
      if (member) {
        await updateStaff({ id: member.id, body }).unwrap();
        toast.success(pick('স্টাফের তথ্য সফলভাবে হালনাগাদ হয়েছে।', 'Staff profile updated successfully.'));
      } else {
        await createStaff(body).unwrap();
        toast.success(pick('নতুন স্টাফ সফলভাবে যুক্ত হয়েছে।', 'Staff member created successfully.'));
      }
      onClose();
    } catch (err) {
      toast.error(
        errorMessage(
          err,
          member
            ? pick('হালনাগাদ করা যায়নি।', 'Could not update staff member.')
            : pick('সংরক্ষণ করা যায়নি।', 'Could not create staff member.')
        )
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={member ? pick('স্টাফ প্রোফাইল সম্পাদনা', 'Edit Staff Profile') : pick('নতুন স্টাফ যুক্ত করুন', 'Add New Staff')}
      description={pick(
        'প্রাতিষ্ঠানিক ও ব্যক্তিগত প্রয়োজনীয় তথ্য পূরণ করুন।',
        'Fill in institutional and personal details for this staff member.'
      )}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={submit} className="space-y-5">
        {/* Section 1: Institutional Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-primary border-b border-border pb-1.5">
            {pick('১. প্রাতিষ্ঠানিক তথ্য', '1. Institutional Details')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={pick('পূর্ণ নাম', 'Full name')} required>
              <Input
                required
                value={form.name}
                placeholder={pick('যেমন: মো. রফিকুল ইসলাম', 'e.g. Md. Rafiqul Islam')}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </FormField>

            <FormField label={pick('স্টাফ আইডি', 'Staff ID')}>
              <Input
                value={form.employeeId}
                placeholder={pick('খালি রাখলে স্বয়ংক্রিয়ভাবে তৈরি হবে (যেমন: T-101)', 'Auto-generated if left blank (e.g. T-101)')}
                onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
              />
            </FormField>

            <FormField label={pick('পদবি', 'Designation')} required>
              <Input
                required
                value={form.designation}
                placeholder={pick('যেমন: সহকারী শিক্ষক (গণিত)', 'e.g. Assistant Teacher (Math)')}
                onChange={(event) => setForm({ ...form, designation: event.target.value })}
              />
            </FormField>

            <FormField label={pick('ধরন', 'Staff Type')} required>
              <Select
                value={form.staffType}
                onChange={(event) => setForm({ ...form, staffType: event.target.value })}
              >
                <option value={StaffType.TEACHER}>{pick('শিক্ষক', 'Teacher')}</option>
                <option value={StaffType.OFFICER}>{pick('কর্মকর্তা', 'Officer')}</option>
                <option value={StaffType.EMPLOYEE}>{pick('কর্মচারী', 'Employee')}</option>
              </Select>
            </FormField>

            <FormField label={pick('নিয়োগের ধরন', 'Employment Type')}>
              <Select
                value={form.employmentType}
                onChange={(event) => setForm({ ...form, employmentType: event.target.value })}
              >
                <option value={EmploymentType.PERMANENT}>{pick('স্থায়ী', 'Permanent')}</option>
                <option value={EmploymentType.PROBATIONARY}>{pick('প্রবেশন', 'Probation')}</option>
                <option value={EmploymentType.CONTRACTUAL}>{pick('চুক্তিভিত্তিক', 'Contractual')}</option>
                <option value={EmploymentType.PART_TIME}>{pick('খণ্ডকালীন', 'Part-time')}</option>
              </Select>
            </FormField>

            <FormField label={pick('শিক্ষাগত যোগ্যতা', 'Qualification')}>
              <Input
                value={form.qualification}
                placeholder={pick('যেমন: M.Sc in Mathematics, B.Ed', 'e.g. M.Sc in Mathematics, B.Ed')}
                onChange={(event) => setForm({ ...form, qualification: event.target.value })}
              />
            </FormField>

            <FormField label={pick('যোগদানের তারিখ', 'Joining Date')}>
              <Input
                type="date"
                value={form.joiningDate}
                onChange={(event) => setForm({ ...form, joiningDate: event.target.value })}
              />
            </FormField>

            <FormField label={pick('অবস্থা (Status)', 'Status')}>
              <Select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                <option value={StaffStatus.ACTIVE}>{pick('কর্মরত (Active)', 'Active')}</option>
                <option value={StaffStatus.RETIRED}>{pick('অবসরপ্রাপ্ত (Retired)', 'Retired')}</option>
                <option value={StaffStatus.RESIGNED}>{pick('পদত্যাগকৃত (Resigned)', 'Resigned')}</option>
                <option value={StaffStatus.TRANSFERRED}>{pick('বদলিজনিত (Transferred)', 'Transferred')}</option>
                <option value={StaffStatus.TERMINATED}>{pick('অব্যাহতিপ্রাপ্ত (Terminated)', 'Terminated')}</option>
              </Select>
            </FormField>

            {form.status !== StaffStatus.ACTIVE && (
              <FormField
                label={pick('বিদায় / অবসরের তারিখ', 'Leaving Date')}
                hint={pick(
                  'খালি রাখলে আজকের তারিখ স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।',
                  'Defaults to today if left blank.'
                )}
              >
                <Input
                  type="date"
                  value={form.leavingDate}
                  onChange={(event) => setForm({ ...form, leavingDate: event.target.value })}
                />
              </FormField>
            )}
          </div>
        </div>

        {/* Section 2: Personal & Contact Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-primary border-b border-border pb-1.5">
            {pick('২. ব্যক্তিগত ও যোগাযোগের তথ্য', '2. Personal & Contact Information')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={pick('মোবাইল নম্বর', 'Phone')}>
              <Input
                value={form.phone}
                placeholder={pick('যেমন: 017XXXXXXXX', 'e.g. 017XXXXXXXX')}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </FormField>

            <FormField label={pick('ইমেইল', 'Email')}>
              <Input
                type="email"
                value={form.email}
                placeholder={pick('যেমন: teacher@school.edu.bd', 'e.g. teacher@school.edu.bd')}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </FormField>

            <FormField label={pick('জরুরি যোগাযোগ নম্বর', 'Emergency Phone')}>
              <Input
                value={form.emergencyContact}
                placeholder={pick('যেমন: 018XXXXXXXX', 'e.g. 018XXXXXXXX')}
                onChange={(event) => setForm({ ...form, emergencyContact: event.target.value })}
              />
            </FormField>

            <FormField label={pick('জাতীয় পরিচয়পত্র (NID)', 'National ID (NID)')}>
              <Input
                value={form.nid}
                placeholder={pick('১০ বা ১৭ সংখ্যার এনআইডি নম্বর', '10 or 17 digit NID number')}
                onChange={(event) => setForm({ ...form, nid: event.target.value })}
              />
            </FormField>

            <FormField label={pick('লিঙ্গ', 'Gender')}>
              <Select
                value={form.gender}
                onChange={(event) => setForm({ ...form, gender: event.target.value })}
              >
                <option value="">{pick('নির্বাচন করুন', 'Select gender')}</option>
                <option value={Gender.MALE}>{pick('পুরুষ', 'Male')}</option>
                <option value={Gender.FEMALE}>{pick('নারী', 'Female')}</option>
                <option value={Gender.OTHER}>{pick('অন্যান্য', 'Other')}</option>
              </Select>
            </FormField>

            <FormField label={pick('ধর্ম', 'Religion')}>
              <Select
                value={form.religion}
                onChange={(event) => setForm({ ...form, religion: event.target.value })}
              >
                <option value="">{pick('নির্বাচন করুন', 'Select religion')}</option>
                <option value={Religion.ISLAM}>{pick('ইসলাম', 'Islam')}</option>
                <option value={Religion.HINDUISM}>{pick('হিন্দু', 'Hinduism')}</option>
                <option value={Religion.CHRISTIANITY}>{pick('খ্রিস্টান', 'Christianity')}</option>
                <option value={Religion.BUDDHISM}>{pick('বৌদ্ধ', 'Buddhism')}</option>
                <option value={Religion.OTHER}>{pick('অন্যান্য', 'Other')}</option>
              </Select>
            </FormField>

            <FormField label={pick('রক্তের গ্রুপ', 'Blood Group')}>
              <Select
                value={form.bloodGroup}
                onChange={(event) => setForm({ ...form, bloodGroup: event.target.value })}
              >
                <option value="">{pick('নির্বাচন করুন', 'Select blood group')}</option>
                {Object.values(BloodGroup).map((value) => (
                  <option key={value} value={value}>
                    {value.replace('_POSITIVE', '+').replace('_NEGATIVE', '−')}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label={pick('জন্ম তারিখ', 'Date of Birth')}>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })}
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField
                label={pick('প্রোফাইল ছবি', 'Profile Photo')}
                hint={pick('JPG, PNG বা WebP ফরম্যাটে সর্বোচ্চ ৫ মেগাবাইট ছবি আপলোড করুন।', 'Upload JPG, PNG, or WebP image (max 5 MB).')}
              >
                <div className="flex flex-wrap items-center gap-4 p-3 rounded-2xl border border-border bg-surface-muted/40">
                  <div className="w-16 h-16 rounded-2xl border border-border bg-surface overflow-hidden flex items-center justify-center shrink-0">
                    {photoPreviewUrl ? (
                      <img
                        src={photoPreviewUrl}
                        alt={form.name || 'Staff photo'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePhotoFileChange}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {photoPreviewUrl
                          ? pick('ছবি পরিবর্তন করুন', 'Change Photo')
                          : pick('ছবি আপলোড করুন', 'Upload Photo')}
                      </span>
                    </Button>

                    {photoPreviewUrl && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleRemovePhoto}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{pick('মুছুন', 'Remove')}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </FormField>
            </div>

            <FormField label={pick('পিতার নাম', 'Father’s Name')}>
              <Input
                value={form.fatherName}
                placeholder={pick('যেমন: মো. আব্দুল করিম', 'e.g. Md. Abdul Karim')}
                onChange={(event) => setForm({ ...form, fatherName: event.target.value })}
              />
            </FormField>

            <FormField label={pick('মাতার নাম', 'Mother’s Name')}>
              <Input
                value={form.motherName}
                placeholder={pick('যেমন: মোসা. রহিমা বেগম', 'e.g. Mst. Rahima Begum')}
                onChange={(event) => setForm({ ...form, motherName: event.target.value })}
              />
            </FormField>

            <FormField label={pick('বর্তমান ঠিকানা', 'Present Address')}>
              <Textarea
                value={form.presentAddress}
                placeholder={pick('গ্রাম/বাড়ি নং, ডাকঘর, উপজেলা, জেলা লিখুন...', 'Enter village/house, post office, upazila, district...')}
                onChange={(event) => setForm({ ...form, presentAddress: event.target.value })}
              />
            </FormField>

            <FormField label={pick('স্থায়ী ঠিকানা', 'Permanent Address')}>
              <Textarea
                value={form.permanentAddress}
                placeholder={pick('স্থায়ী ঠিকানা (গ্রাম/বাড়ি নং, ডাকঘর, উপজেলা, জেলা)...', 'Permanent address (village/house, post office, upazila, district)...')}
                onChange={(event) => setForm({ ...form, permanentAddress: event.target.value })}
              />
            </FormField>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            {pick('বাতিল', 'Cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={creating || updating}>
            {creating || updating
              ? pick('সংরক্ষণ হচ্ছে...', 'Saving...')
              : member
                ? pick('হালনাগাদ করুন', 'Update')
                : pick('সংরক্ষণ করুন', 'Save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
