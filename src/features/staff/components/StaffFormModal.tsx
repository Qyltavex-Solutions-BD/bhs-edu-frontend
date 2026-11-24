'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useCreateStaffMutation, useUpdateStaffMutation } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { Button, FormField, Input, Modal, Select, Textarea } from '@/src/components/ui/primitives';
import {
  BloodGroup,
  DepartmentStatus,
  EmploymentType,
  Gender,
  StaffStatus,
  StaffType,
} from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import type { Staff } from '@/src/types/entities';

const ADMIN_DEPARTMENT_IDS = new Set(['dept-adm', 'dept-acc', 'dept-lib', 'dept-sec', 'dept-lab']);

function errorMessage(err: unknown, fallback: string) {
  return (err as { message?: string })?.message || fallback;
}

export function StaffFormModal({
  db,
  open,
  onClose,
  member,
  defaultType,
}: {
  db: MockDatabase;
  open: boolean;
  onClose: () => void;
  member: Staff | null;
  defaultType: StaffType;
}) {
  const { pick } = useI18n();
  const [createStaff, { isLoading: creating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: updating }] = useUpdateStaffMutation();
  const blank = {
    employeeId: '',
    name: '',
    nameBn: '',
    designation: '',
    qualification: '',
    staffType: defaultType as string,
    departmentId: '',
    employmentType: EmploymentType.PERMANENT as string,
    phone: '',
    email: '',
    nid: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    status: StaffStatus.ACTIVE as string,
    leavingDate: '',
    gender: '',
    dateOfBirth: '',
    bloodGroup: '',
    fatherName: '',
    motherName: '',
    emergencyContact: '',
    presentAddress: '',
  };
  const [form, setForm] = useState(blank);
  const [loaded, setLoaded] = useState<string | null>(null);
  const key = open ? member?.id ?? 'new' : '';
  if (key && key !== loaded) {
    setLoaded(key);
    setForm(
      member
        ? {
            employeeId: member.employeeId ?? '',
            name: member.name,
            nameBn: member.nameBn ?? '',
            designation: member.designation,
            qualification: member.qualification ?? '',
            staffType: member.staffType,
            departmentId: member.departmentId ?? '',
            employmentType: member.employmentType,
            phone: member.phone ?? '',
            email: member.email ?? '',
            nid: member.nid ?? '',
            joiningDate: member.joiningDate ?? '',
            status: member.status,
            leavingDate: member.leavingDate ?? '',
            gender: member.gender ?? '',
            dateOfBirth: member.dateOfBirth ?? '',
            bloodGroup: member.bloodGroup ?? '',
            fatherName: member.fatherName ?? '',
            motherName: member.motherName ?? '',
            emergencyContact: member.emergencyContact ?? '',
            presentAddress: member.presentAddress ?? '',
          }
        : blank
    );
  }
  if (!open && loaded) setLoaded(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = {
      ...form,
      departmentId: form.departmentId || null,
      gender: (form.gender || null) as Gender | null,
      bloodGroup: (form.bloodGroup || null) as BloodGroup | null,
      staffType: form.staffType as StaffType,
      employmentType: form.employmentType as EmploymentType,
      status: form.status as StaffStatus,
    };
    try {
      if (member) await updateStaff({ id: member.id, ...body }).unwrap();
      else await createStaff(body).unwrap();
      toast.success(pick('স্টাফ সংরক্ষিত হয়েছে।', 'Staff member saved.'));
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, pick('সংরক্ষণ হয়নি।', 'Could not save the staff member.')));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={member ? pick('প্রোফাইল সম্পাদনা', 'Edit profile') : pick('নতুন স্টাফ', 'Add staff')} maxWidth="max-w-3xl">
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label={pick('ইংরেজি নাম', 'Name in English')} required>
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </FormField>
        <FormField label={pick('বাংলা নাম', 'Name in Bangla')}>
          <Input value={form.nameBn} onChange={(event) => setForm({ ...form, nameBn: event.target.value })} />
        </FormField>
        <FormField label={pick('স্টাফ আইডি', 'Staff ID')}>
          <Input value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} />
        </FormField>
        <FormField label={pick('পদবি', 'Designation')} required>
          <Input value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} />
        </FormField>
        <FormField label={pick('ধরন', 'Type')} required>
          <Select value={form.staffType} onChange={(event) => setForm({ ...form, staffType: event.target.value })}>
            <option value={StaffType.TEACHER}>{pick('শিক্ষক', 'Teacher')}</option>
            <option value={StaffType.OFFICER}>{pick('কর্মকর্তা', 'Officer')}</option>
            <option value={StaffType.EMPLOYEE}>{pick('কর্মচারী', 'Employee')}</option>
          </Select>
        </FormField>
        <FormField label={pick('বিভাগ', 'Department')}>
          <Select value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })}>
            <option value="">{pick('নেই', 'None')}</option>
            {form.staffType === StaffType.TEACHER ? (
              <optgroup label={pick('একাডেমিক বিভাগ', 'Academic Departments')}>
                {db.departments
                  .filter((item) => (!ADMIN_DEPARTMENT_IDS.has(item.id) || item.id === 'dept-adm') && (item.status === DepartmentStatus.ACTIVE || item.id === form.departmentId))
                  .map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
              </optgroup>
            ) : (
              <optgroup label={pick('প্রশাসনিক ও সেবা শাখা', 'Administrative & Support Branches')}>
                {db.departments
                  .filter((item) => ADMIN_DEPARTMENT_IDS.has(item.id) && (item.status === DepartmentStatus.ACTIVE || item.id === form.departmentId))
                  .map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
              </optgroup>
            )}
          </Select>
        </FormField>
        <FormField label={pick('নিয়োগ', 'Employment')}>
          <Select value={form.employmentType} onChange={(event) => setForm({ ...form, employmentType: event.target.value })}>
            <option value={EmploymentType.PERMANENT}>{pick('স্থায়ী', 'Permanent')}</option>
            <option value={EmploymentType.PROBATIONARY}>{pick('প্রবেশন', 'Probation')}</option>
            <option value={EmploymentType.CONTRACTUAL}>{pick('চুক্তি', 'Contract')}</option>
            <option value={EmploymentType.PART_TIME}>{pick('খণ্ডকালীন', 'Part time')}</option>
          </Select>
        </FormField>
        <FormField label={pick('যোগ্যতা', 'Qualification')}>
          <Input value={form.qualification} onChange={(event) => setForm({ ...form, qualification: event.target.value })} />
        </FormField>
        <FormField label={pick('মোবাইল', 'Phone')}>
          <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </FormField>
        <FormField label={pick('ইমেইল', 'Email')}>
          <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </FormField>
        <FormField label={pick('যোগদান', 'Joined')}>
          <Input type="date" value={form.joiningDate} onChange={(event) => setForm({ ...form, joiningDate: event.target.value })} />
        </FormField>
        {member && (
          <>
            <FormField label={pick('অবস্থা', 'Status')}>
              <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value={StaffStatus.ACTIVE}>{pick('কর্মরত', 'Active')}</option>
                <option value={StaffStatus.RESIGNED}>{pick('পদত্যাগ', 'Resigned')}</option>
                <option value={StaffStatus.RETIRED}>{pick('অবসর', 'Retired')}</option>
                <option value={StaffStatus.TERMINATED}>{pick('চাকরিচ্যুত', 'Terminated')}</option>
              </Select>
            </FormField>
            {form.status !== StaffStatus.ACTIVE && (
              <FormField label={pick('ছাড়ার তারিখ', 'Leaving date')} required>
                <Input type="date" value={form.leavingDate} onChange={(event) => setForm({ ...form, leavingDate: event.target.value })} />
              </FormField>
            )}
            <FormField label={pick('এনআইডি', 'NID')}>
              <Input value={form.nid} onChange={(event) => setForm({ ...form, nid: event.target.value })} />
            </FormField>
            <FormField label={pick('লিঙ্গ', 'Gender')}>
              <Select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}>
                <option value="">{pick('নেই', 'None')}</option>
                <option value={Gender.MALE}>{pick('পুরুষ', 'Male')}</option>
                <option value={Gender.FEMALE}>{pick('নারী', 'Female')}</option>
              </Select>
            </FormField>
            <FormField label={pick('জন্ম তারিখ', 'Date of birth')}>
              <Input type="date" value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} />
            </FormField>
            <FormField label={pick('রক্ত', 'Blood group')}>
              <Select value={form.bloodGroup} onChange={(event) => setForm({ ...form, bloodGroup: event.target.value })}>
                <option value="">{pick('নেই', 'None')}</option>
                {Object.values(BloodGroup).map((value) => (
                  <option key={value} value={value}>{value.replace('_POSITIVE', '+').replace('_NEGATIVE', '−')}</option>
                ))}
              </Select>
            </FormField>
            <FormField label={pick('পিতার নাম', 'Father')}>
              <Input value={form.fatherName} onChange={(event) => setForm({ ...form, fatherName: event.target.value })} />
            </FormField>
            <FormField label={pick('মাতার নাম', 'Mother')}>
              <Input value={form.motherName} onChange={(event) => setForm({ ...form, motherName: event.target.value })} />
            </FormField>
            <FormField label={pick('জরুরি নম্বর', 'Emergency phone')}>
              <Input value={form.emergencyContact} onChange={(event) => setForm({ ...form, emergencyContact: event.target.value })} />
            </FormField>
            <FormField label={pick('ঠিকানা', 'Address')}>
              <Textarea value={form.presentAddress} onChange={(event) => setForm({ ...form, presentAddress: event.target.value })} />
            </FormField>
          </>
        )}
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" variant="primary" disabled={creating || updating}>{pick('সংরক্ষণ', 'Save')}</Button>
        </div>
      </form>
    </Modal>
  );
}
