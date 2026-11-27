'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  resolveStaffPhotoUrl,
  useCreateStaffMutation,
  useUpdateStaffMutation,
} from '../api/staff.api';
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
  const [createAccount, setCreateAccount] = useState(defaultType !== StaffType.EMPLOYEE);
  const [portalRole, setPortalRole] = useState<'TEACHER' | 'ACCOUNTANT'>(
    defaultType === StaffType.OFFICER ? 'ACCOUNTANT' : 'TEACHER'
  );
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
    setCreateAccount(defaultType !== StaffType.EMPLOYEE);
    setPortalRole(defaultType === StaffType.OFFICER ? 'ACCOUNTANT' : 'TEACHER');
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
      toast.error('শুধুমাত্র JPG, PNG অথবা WebP ছবি আপলোড করুন।');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ছবির সাইজ ৫ মেগাবাইটের কম হতে হবে।');
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

    if (!member) {
      body.append('createAccount', String(createAccount));
      if (createAccount) {
        body.append('portalRole', portalRole);
      }
    }

    try {
      if (member) {
        await updateStaff({ id: member.id, body }).unwrap();
        toast.success('স্টাফের তথ্য সফলভাবে হালনাগাদ হয়েছে।');
      } else {
        await createStaff(body).unwrap();
        toast.success('নতুন স্টাফ সফলভাবে যুক্ত হয়েছে।');
      }
      onClose();
    } catch (err) {
      toast.error(
        errorMessage(
          err,
          member
            ? 'হালনাগাদ করা যায়নি।'
            : 'সংরক্ষণ করা যায়নি।'
        )
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={member ? 'স্টাফ প্রোফাইল সম্পাদনা' : 'নতুন স্টাফ যুক্ত করুন'}
      description={'প্রাতিষ্ঠানিক ও ব্যক্তিগত প্রয়োজনীয় তথ্য পূরণ করুন।'}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={submit} className="space-y-5">
        {/* Section 1: Institutional Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-primary border-b border-border pb-1.5">
            {'১. প্রাতিষ্ঠানিক তথ্য'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={'পূর্ণ নাম'} required>
              <Input
                required
                value={form.name}
                placeholder={'যেমন: মো. রফিকুল ইসলাম'}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </FormField>

            <FormField label={'স্টাফ আইডি'}>
              <Input
                value={form.employeeId}
                placeholder={'খালি রাখলে স্বয়ংক্রিয়ভাবে তৈরি হবে (যেমন: T-101)'}
                onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
              />
            </FormField>

            <FormField label={'পদবি'} required>
              <Input
                required
                value={form.designation}
                placeholder={'যেমন: সহকারী শিক্ষক (গণিত)'}
                onChange={(event) => setForm({ ...form, designation: event.target.value })}
              />
            </FormField>

            <FormField label={'ধরন'} required>
              <Select
                value={form.staffType}
                onChange={(event) => setForm({ ...form, staffType: event.target.value })}
              >
                <option value={StaffType.TEACHER}>{'শিক্ষক'}</option>
                <option value={StaffType.OFFICER}>{'কর্মকর্তা'}</option>
                <option value={StaffType.EMPLOYEE}>{'কর্মচারী'}</option>
              </Select>
            </FormField>

            <FormField label={'নিয়োগের ধরন'}>
              <Select
                value={form.employmentType}
                onChange={(event) => setForm({ ...form, employmentType: event.target.value })}
              >
                <option value={EmploymentType.PERMANENT}>{'স্থায়ী'}</option>
                <option value={EmploymentType.PROBATIONARY}>{'প্রবেশন'}</option>
                <option value={EmploymentType.CONTRACTUAL}>{'চুক্তিভিত্তিক'}</option>
                <option value={EmploymentType.PART_TIME}>{'খণ্ডকালীন'}</option>
              </Select>
            </FormField>

            <FormField label={'শিক্ষাগত যোগ্যতা'}>
              <Input
                value={form.qualification}
                placeholder={'যেমন: M.Sc in Mathematics, B.Ed'}
                onChange={(event) => setForm({ ...form, qualification: event.target.value })}
              />
            </FormField>

            <FormField label={'যোগদানের তারিখ'}>
              <Input
                type="date"
                value={form.joiningDate}
                onChange={(event) => setForm({ ...form, joiningDate: event.target.value })}
              />
            </FormField>

            <FormField label={'অবস্থা (Status)'}>
              <Select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                <option value={StaffStatus.ACTIVE}>{'কর্মরত (Active)'}</option>
                <option value={StaffStatus.RETIRED}>{'অবসরপ্রাপ্ত (Retired)'}</option>
                <option value={StaffStatus.RESIGNED}>{'পদত্যাগকৃত (Resigned)'}</option>
                <option value={StaffStatus.TRANSFERRED}>{'বদলিজনিত (Transferred)'}</option>
                <option value={StaffStatus.TERMINATED}>{'অব্যাহতিপ্রাপ্ত (Terminated)'}</option>
              </Select>
            </FormField>

            {form.status !== StaffStatus.ACTIVE && (
              <FormField
                label={'বিদায় / অবসরের তারিখ'}
                hint={'খালি রাখলে আজকের তারিখ স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।'}
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
            {'২. ব্যক্তিগত ও যোগাযোগের তথ্য'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={'মোবাইল নম্বর'}>
              <Input
                value={form.phone}
                placeholder={'যেমন: 017XXXXXXXX'}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </FormField>

            <FormField label={'ইমেইল'}>
              <Input
                type="email"
                value={form.email}
                placeholder={'যেমন: teacher@school.edu.bd'}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </FormField>

            <FormField label={'জরুরি যোগাযোগ নম্বর'}>
              <Input
                value={form.emergencyContact}
                placeholder={'যেমন: 018XXXXXXXX'}
                onChange={(event) => setForm({ ...form, emergencyContact: event.target.value })}
              />
            </FormField>

            <FormField label={'জাতীয় পরিচয়পত্র (NID)'}>
              <Input
                value={form.nid}
                placeholder={'১০ বা ১৭ সংখ্যার এনআইডি নম্বর'}
                onChange={(event) => setForm({ ...form, nid: event.target.value })}
              />
            </FormField>

            <FormField label={'লিঙ্গ'}>
              <Select
                value={form.gender}
                onChange={(event) => setForm({ ...form, gender: event.target.value })}
              >
                <option value="">{'নির্বাচন করুন'}</option>
                <option value={Gender.MALE}>{'পুরুষ'}</option>
                <option value={Gender.FEMALE}>{'নারী'}</option>
                <option value={Gender.OTHER}>{'অন্যান্য'}</option>
              </Select>
            </FormField>

            <FormField label={'ধর্ম'}>
              <Select
                value={form.religion}
                onChange={(event) => setForm({ ...form, religion: event.target.value })}
              >
                <option value="">{'নির্বাচন করুন'}</option>
                <option value={Religion.ISLAM}>{'ইসলাম'}</option>
                <option value={Religion.HINDUISM}>{'হিন্দু'}</option>
                <option value={Religion.CHRISTIANITY}>{'খ্রিস্টান'}</option>
                <option value={Religion.BUDDHISM}>{'বৌদ্ধ'}</option>
                <option value={Religion.OTHER}>{'অন্যান্য'}</option>
              </Select>
            </FormField>

            <FormField label={'রক্তের গ্রুপ'}>
              <Select
                value={form.bloodGroup}
                onChange={(event) => setForm({ ...form, bloodGroup: event.target.value })}
              >
                <option value="">{'নির্বাচন করুন'}</option>
                {Object.values(BloodGroup).map((value) => (
                  <option key={value} value={value}>
                    {value.replace('_POSITIVE', '+').replace('_NEGATIVE', '−')}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label={'জন্ম তারিখ'}>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })}
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField
                label={'প্রোফাইল ছবি'}
                hint={'JPG, PNG বা WebP ফরম্যাটে সর্বোচ্চ ৫ মেগাবাইট ছবি আপলোড করুন।'}
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
                          ? 'ছবি পরিবর্তন করুন'
                          : 'ছবি আপলোড করুন'}
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
                        <span>{'মুছুন'}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </FormField>
            </div>

            <FormField label={'পিতার নাম'}>
              <Input
                value={form.fatherName}
                placeholder={'যেমন: মো. আব্দুল করিম'}
                onChange={(event) => setForm({ ...form, fatherName: event.target.value })}
              />
            </FormField>

            <FormField label={'মাতার নাম'}>
              <Input
                value={form.motherName}
                placeholder={'যেমন: মোসা. রহিমা বেগম'}
                onChange={(event) => setForm({ ...form, motherName: event.target.value })}
              />
            </FormField>

            <FormField label={'বর্তমান ঠিকানা'}>
              <Textarea
                value={form.presentAddress}
                placeholder={'গ্রাম/বাড়ি নং, ডাকঘর, উপজেলা, জেলা লিখুন...'}
                onChange={(event) => setForm({ ...form, presentAddress: event.target.value })}
              />
            </FormField>

            <FormField label={'স্থায়ী ঠিকানা'}>
              <Textarea
                value={form.permanentAddress}
                placeholder={'স্থায়ী ঠিকানা (গ্রাম/বাড়ি নং, ডাকঘর, উপজেলা, জেলা)...'}
                onChange={(event) => setForm({ ...form, permanentAddress: event.target.value })}
              />
            </FormField>
          </div>
        </div>

        {!member && (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createAccount}
                onChange={(e) => setCreateAccount(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-primary rounded cursor-pointer"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {'পোর্টাল লগইন অ্যাকাউন্ট তৈরি করুন (পাসওয়ার্ড ছাড়াই)'}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {'অ্যাডমিন থেকে কোনো পাসওয়ার্ড দিতে হবে না। প্রথমবার ইমেইল বা মোবাইল নম্বর দিয়ে লগইনের সময় তিনি নিজেই পাসওয়ার্ড সেট করতে পারবেন।'}
                </p>
              </div>
            </label>

            {createAccount && (
              <div className="pl-7 max-w-xs">
                <FormField label={'পোর্টাল রোল'}>
                  <Select
                    value={portalRole}
                    onChange={(e) => setPortalRole(e.target.value as 'TEACHER' | 'ACCOUNTANT')}
                  >
                    <option value="TEACHER">{'শিক্ষক (Teacher Portal)'}</option>
                    <option value="ACCOUNTANT">{'হিসাবরক্ষক (Accountant Portal)'}</option>
                  </Select>
                </FormField>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            {'বাতিল'}
          </Button>
          <Button type="submit" variant="primary" disabled={creating || updating}>
            {creating || updating
              ? 'সংরক্ষণ হচ্ছে...'
              : member
                ? 'হালনাগাদ করুন'
                : 'সংরক্ষণ করুন'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
