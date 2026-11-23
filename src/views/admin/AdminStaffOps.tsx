'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { useParams } from '@/src/lib/navigation';
import {
  useCreateStaffMutation,
  useGetBootstrapQuery,
  useRemoveDepartmentMutation,
  useSaveDepartmentMutation,
  useSaveStaffStructureMutation,
  useToggleArchiveMutation,
  useUpdateStaffMutation,
} from '@/src/store/api';
import { useAcademicYearSelection } from '@/src/views/admin/AcademicFoundation';
import { StaffShell } from '@/src/views/admin/StaffShell';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { triggerPrint } from '@/src/lib/utils/cn';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { DataTable } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { PrintableIdCardSheet } from '@/src/components/print/PrintDocuments';
import { Button, Card, FormField, Input, Modal, Select, Textarea } from '@/src/components/ui/primitives';
import {
  BloodGroup,
  DepartmentStatus,
  EmploymentType,
  Gender,
  StaffStatus,
  StaffType,
} from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import type { Department, Staff, StaffStructure } from '@/src/types/entities';

function errorMessage(err: unknown, fallback: string) {
  return (err as { message?: string })?.message || fallback;
}

const ADMIN_DEPARTMENT_IDS = new Set(['dept-adm', 'dept-acc', 'dept-lib', 'dept-sec', 'dept-lab']);

type SectionKey = 'all' | 'teachers' | 'employees' | 'departments' | 'structures' | 'profile';

const TAB: Record<string, SectionKey> = {
  all: 'all',
  teachers: 'teachers',
  employees: 'employees',
  departments: 'departments',
  structures: 'structures',
  create: 'all',
};

export function AdminStaffPage({
  defaultTab = 'all',
}: {
  defaultTab?: keyof typeof TAB;
}) {
  const { id } = useParams<{ id?: string }>();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  const section: SectionKey = id ? 'profile' : TAB[defaultTab] ?? 'all';
  if (isLoading || !db) return <LoadingSkeleton />;

  const copy: Record<SectionKey, { title: string; description: string }> = {
    all: {
      title: pick('সকল স্টাফ', 'All staff'),
      description: pick('শিক্ষক, কর্মকর্তা ও কর্মচারী এক তালিকায়। নাম খুলে প্রোফাইল।', 'Teachers, officers, and employees in one list. Open a name for the profile.'),
    },
    teachers: {
      title: pick('শিক্ষক', 'Teachers'),
      description: pick('যাঁরা ক্লাস নেন। শ্রেণি ও বিষয় বণ্টন একাডেমিক মেনুতে।', 'People who teach. Class and subject assignment stays in Academics.'),
    },
    employees: {
      title: pick('কর্মকর্তা ও কর্মচারী', 'Officers and employees'),
      description: pick('শিক্ষক ছাড়া অফিস ও সাপোর্ট স্টাফ।', 'Office and support staff other than teachers.'),
    },
    departments: {
      title: pick('বিভাগ', 'Departments'),
      description: pick('বিজ্ঞান, হিসাব, অফিস — স্টাফ কোন বিভাগে।', 'Science, accounts, office — which unit a person belongs to.'),
    },
    structures: {
      title: pick('অনুমোদিত পদ', 'Sanctioned posts'),
      description: pick('কয়টি আসন আছে এবং কয়টিতে লোক আছেন। আসন পূর্ণ হলে নতুন নিয়োগ হয় না।', 'How many posts exist and how many are filled. A full post cannot take another person.'),
    },
    profile: {
      title: pick('স্টাফ প্রোফাইল', 'Staff profile'),
      description: pick('চাকরি, যোগাযোগ এবং এই বছরের শিক্ষকতা।', 'Employment, contact details, and this year’s teaching duties.'),
    },
  };

  return (
    <StaffShell title={copy[section].title} description={copy[section].description}>
      {(section === 'all' || section === 'teachers' || section === 'employees') && (
        <Directory db={db} kind={section} createOpen={defaultTab === 'create'} />
      )}
      {section === 'departments' && <Departments db={db} />}
      {section === 'structures' && <Posts db={db} />}
      {section === 'profile' && <Profile db={db} staffId={id ?? ''} />}
    </StaffShell>
  );
}

function deptName(db: MockDatabase, id?: string | null) {
  return db.departments.find((item) => item.id === id)?.name ?? '—';
}

function Directory({ db, kind, createOpen }: { db: MockDatabase; kind: 'all' | 'teachers' | 'employees'; createOpen: boolean }) {
  const { locale, pick } = useI18n();
  const [open, setOpen] = useState(createOpen);
  const [printOpen, setPrintOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  const departmentOptions = useMemo(() => {
    if (kind === 'teachers') {
      return db.departments.filter((d) => !ADMIN_DEPARTMENT_IDS.has(d.id) || d.id === 'dept-adm');
    }
    if (kind === 'employees') {
      return db.departments.filter((d) => ADMIN_DEPARTMENT_IDS.has(d.id));
    }
    return db.departments;
  }, [db.departments, kind]);

  useEffect(() => {
    if (departmentId !== 'ALL' && !departmentOptions.some((d) => d.id === departmentId)) {
      setDepartmentId('ALL');
    }
  }, [departmentOptions, departmentId]);

  const rows = db.staff.filter((member) => {
    if (kind === 'teachers' && member.staffType !== StaffType.TEACHER) return false;
    if (kind === 'employees' && member.staffType === StaffType.TEACHER) return false;
    if (departmentId !== 'ALL' && member.departmentId !== departmentId) return false;
    if (status !== 'ALL' && member.status !== status) return false;
    return true;
  }).map((member) => ({ ...member, department: deptName(db, member.departmentId) }));

  const activeStaff = db.staff.filter((s) => s.status === StaffStatus.ACTIVE);
  const activeTeachers = activeStaff.filter((s) => s.staffType === StaffType.TEACHER).length;
  const activeEmployees = activeStaff.filter((s) => s.staffType !== StaffType.TEACHER).length;
  const totalPosts = db.staffStructures.filter((p) => !p.isDeleted).reduce((sum, p) => sum + p.totalPositions, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('মোট কর্মরত স্টাফ', 'Total Active Staff')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">{formatNumber(activeStaff.length, locale)}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('শিক্ষকমণ্ডলী', 'Active Teachers')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary tabular-nums mt-1">{formatNumber(activeTeachers, locale)}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('কর্মকর্তা ও কর্মচারী', 'Officers & Support')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">{formatNumber(activeEmployees, locale)}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('অনুমোদিত পদ পূরণ', 'Sanctioned Posts Filled')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-success tabular-nums mt-1">
            {formatNumber(activeStaff.length, locale)}
            <span className="text-sm font-semibold text-muted-foreground"> / {formatNumber(totalPosts, locale)}</span>
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Link href="/about/teachers" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4" /> {pick('পাবলিক শিক্ষক তালিকা', 'Public Teachers')}
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)} disabled={!rows.length}>
          <Printer className="w-4 h-4" /> {pick('পরিচয়পত্র', 'ID cards')}
        </Button>
        <Button variant="primary" size="sm" onClick={() => setOpen(true)}>{pick('নতুন স্টাফ', 'Add staff')}</Button>
      </div>
      <DataTable
        data={rows}
        exportFilename="staff.csv"
        toolbarExtra={
          <div className="flex gap-2">
            <Select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="w-40 h-9">
              <option value="ALL">{pick('সকল বিভাগ', 'All departments')}</option>
              {departmentOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </Select>
            <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-36 h-9">
              <option value="ALL">{pick('সকল অবস্থা', 'All statuses')}</option>
              {Object.values(StaffStatus).map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </Select>
          </div>
        }
        columns={[
          { accessorKey: 'employeeId', header: pick('আইডি', 'ID'), cell: ({ row }) => <span className="font-mono text-sm">{row.original.employeeId}</span> },
          {
            accessorKey: 'name',
            header: pick('নাম', 'Name'),
            cell: ({ row }) => (
              <Link href={`/admin/staff/${row.original.id}`} className="font-semibold text-primary hover:underline">
                {row.original.nameBn || row.original.name}
                <span className="block text-xs font-normal text-muted-foreground">{row.original.designation}</span>
              </Link>
            ),
          },
          { accessorKey: 'department', header: pick('বিভাগ', 'Department') },
          { accessorKey: 'staffType', header: pick('ধরন', 'Type'), cell: ({ row }) => <StatusBadge enumName="StaffType" value={row.original.staffType} /> },
          { accessorKey: 'employmentType', header: pick('নিয়োগ', 'Employment'), cell: ({ row }) => <StatusBadge enumName="EmploymentType" value={row.original.employmentType} /> },
          { accessorKey: 'status', header: pick('অবস্থা', 'Status'), cell: ({ row }) => <StatusBadge enumName="StaffStatus" value={row.original.status} /> },
        ]}
      />
      <StaffForm db={db} open={open} onClose={() => setOpen(false)} member={null} defaultType={kind === 'employees' ? StaffType.EMPLOYEE : StaffType.TEACHER} />
      <Modal open={printOpen} onClose={() => setPrintOpen(false)} title={pick('পরিচয়পত্র', 'ID cards')} maxWidth="max-w-5xl">
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={triggerPrint}><Printer className="w-4 h-4" /> {pick('প্রিন্ট', 'Print')}</Button>
          </div>
          <PrintableIdCardSheet
            school={db.schoolProfile}
            holderType="STAFF"
            cards={rows.slice(0, 12).map((member) => ({
              code: member.employeeId ?? member.id,
              name: member.nameBn || member.name,
              subline: member.designation,
              secondaryLine: member.qualification ?? undefined,
              phone: member.phone,
              validUntil: db.academicYears.find((year) => year.isActive)?.name ?? '',
            }))}
          />
        </div>
      </Modal>
    </div>
  );
}

function StaffForm({
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

function Profile({ db, staffId }: { db: MockDatabase; staffId: string }) {
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
      <StaffForm db={db} open={open} onClose={() => setOpen(false)} member={member} defaultType={member.staffType} />
    </div>
  );
}

function Departments({ db }: { db: MockDatabase }) {
  const { pick } = useI18n();
  const [saveDepartment, { isLoading }] = useSaveDepartmentMutation();
  const [removeDepartment, { isLoading: removing }] = useRemoveDepartmentMutation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', status: DepartmentStatus.ACTIVE as string });

  const start = (department: Department | null) => {
    setEditing(department);
    setForm({
      name: department?.name ?? '',
      code: department?.code ?? '',
      description: department?.description ?? '',
      status: department?.status ?? DepartmentStatus.ACTIVE,
    });
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveDepartment({ id: editing?.id, ...form, status: form.status as DepartmentStatus }).unwrap();
      toast.success(pick('বিভাগ সংরক্ষিত হয়েছে।', 'Department saved.'));
      setOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, pick('সংরক্ষণ হয়নি।', 'Could not save the department.')));
    }
  };

  const rows = db.departments.map((department) => ({
    ...department,
    people: db.staff.filter((member) => member.departmentId === department.id && member.status === StaffStatus.ACTIVE).length,
  }));

  return (
    <>
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => start(null)}>{pick('নতুন বিভাগ', 'New department')}</Button>
      </div>
      <DataTable
        data={rows}
        exportFilename="departments.csv"
        columns={[
          { accessorKey: 'name', header: pick('নাম', 'Name') },
          { accessorKey: 'code', header: pick('কোড', 'Code'), cell: ({ row }) => <span className="font-mono">{row.original.code || '—'}</span> },
          { accessorKey: 'people', header: pick('কর্মরত', 'Active') },
          { accessorKey: 'status', header: pick('অবস্থা', 'Status'), cell: ({ row }) => <StatusBadge enumName="DepartmentStatus" value={row.original.status} /> },
          {
            id: 'edit',
            header: '',
            cell: ({ row }) => (
              <Button size="sm" variant="ghost" onClick={() => start(row.original)}>{pick('সম্পাদনা', 'Edit')}</Button>
            ),
          },
        ]}
      />
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? pick('বিভাগ সম্পাদনা', 'Edit department') : pick('নতুন বিভাগ', 'New department')}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label={pick('নাম', 'Name')} required>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </FormField>
          <FormField label={pick('কোড', 'Code')}>
            <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
          </FormField>
          <FormField label={pick('বিবরণ', 'Description')}>
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </FormField>
          <FormField label={pick('অবস্থা', 'Status')}>
            <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value={DepartmentStatus.ACTIVE}>{pick('সক্রিয়', 'Active')}</option>
              <option value={DepartmentStatus.INACTIVE}>{pick('বন্ধ', 'Inactive')}</option>
            </Select>
          </FormField>
          <div className="flex justify-between">
            {editing ? (
              <Button
                type="button"
                variant="outline"
                disabled={removing}
                onClick={async () => {
                  try {
                    await removeDepartment({ id: editing.id }).unwrap();
                    toast.success(pick('বিভাগ মুছে ফেলা হয়েছে।', 'Department removed.'));
                    setOpen(false);
                  } catch (err) {
                    toast.error(errorMessage(err, pick('মুছা যায়নি।', 'Could not remove the department.')));
                  }
                }}
              >
                {pick('মুছুন', 'Remove')}
              </Button>
            ) : <span />}
            <Button type="submit" variant="primary" disabled={isLoading}>{pick('সংরক্ষণ', 'Save')}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Posts({ db }: { db: MockDatabase }) {
  const { pick } = useI18n();
  const [savePost, { isLoading }] = useSaveStaffStructureMutation();
  const [toggleArchive, { isLoading: archiving }] = useToggleArchiveMutation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffStructure | null>(null);
  const [form, setForm] = useState({ designation: '', staffType: StaffType.TEACHER as string, departmentId: '', totalPositions: '1' });

  const rows = useMemo(
    () =>
      db.staffStructures.map((structure) => ({
        ...structure,
        department: deptName(db, structure.departmentId),
        filled: db.staff.filter(
          (member) =>
            member.status === StaffStatus.ACTIVE &&
            member.staffType === structure.staffType &&
            member.designation.trim().toLowerCase() === structure.designation.trim().toLowerCase() &&
            (member.departmentId ?? null) === (structure.departmentId ?? null)
        ).length,
      })),
    [db]
  );

  const start = (structure: StaffStructure | null) => {
    setEditing(structure);
    setForm({
      designation: structure?.designation ?? '',
      staffType: structure?.staffType ?? StaffType.TEACHER,
      departmentId: structure?.departmentId ?? '',
      totalPositions: String(structure?.totalPositions ?? 1),
    });
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await savePost({
        id: editing?.id,
        designation: form.designation,
        staffType: form.staffType as StaffType,
        departmentId: form.departmentId || null,
        totalPositions: Number(form.totalPositions),
      }).unwrap();
      toast.success(pick('পদ সংরক্ষিত হয়েছে।', 'Post saved.'));
      setOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, pick('সংরক্ষণ হয়নি।', 'Could not save the post.')));
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => start(null)}>{pick('নতুন পদ', 'New post')}</Button>
      </div>
      <DataTable
        data={rows.filter((row) => !row.isDeleted)}
        exportFilename="posts.csv"
        columns={[
          { accessorKey: 'designation', header: pick('পদবি', 'Designation') },
          { accessorKey: 'department', header: pick('বিভাগ', 'Department') },
          { accessorKey: 'staffType', header: pick('ধরন', 'Type'), cell: ({ row }) => <StatusBadge enumName="StaffType" value={row.original.staffType} /> },
          { accessorKey: 'filled', header: pick('পূরণ', 'Filled') },
          { accessorKey: 'totalPositions', header: pick('আসন', 'Posts') },
          {
            id: 'edit',
            header: '',
            cell: ({ row }) => (
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => start(row.original)}>{pick('সম্পাদনা', 'Edit')}</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={archiving}
                  onClick={async () => {
                    try {
                      await toggleArchive({ collection: 'staffStructures', id: row.original.id }).unwrap();
                      toast.success(pick('পদ আর্কাইভ হয়েছে।', 'Post archived.'));
                    } catch (err) {
                      toast.error(errorMessage(err, pick('আর্কাইভ হয়নি।', 'Could not archive the post.')));
                    }
                  }}
                >
                  {pick('আর্কাইভ', 'Archive')}
                </Button>
              </div>
            ),
          },
        ]}
      />
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? pick('পদ সম্পাদনা', 'Edit post') : pick('নতুন পদ', 'New post')}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label={pick('পদবি', 'Designation')} required>
            <Input value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} />
          </FormField>
          <FormField label={pick('ধরন', 'Type')}>
            <Select value={form.staffType} onChange={(event) => setForm({ ...form, staffType: event.target.value })}>
              <option value={StaffType.TEACHER}>{pick('শিক্ষক', 'Teacher')}</option>
              <option value={StaffType.OFFICER}>{pick('কর্মকর্তা', 'Officer')}</option>
              <option value={StaffType.EMPLOYEE}>{pick('কর্মচারী', 'Employee')}</option>
            </Select>
          </FormField>
          <FormField label={pick('বিভাগ', 'Department')}>
            <Select value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })}>
              <option value="">{pick('সাধারণ', 'General')}</option>
              {form.staffType === StaffType.TEACHER ? (
                <optgroup label={pick('একাডেমিক বিভাগ', 'Academic Departments')}>
                  {db.departments
                    .filter((item) => !ADMIN_DEPARTMENT_IDS.has(item.id) || item.id === 'dept-adm')
                    .map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </optgroup>
              ) : (
                <optgroup label={pick('প্রশাসনিক ও সেবা শাখা', 'Administrative & Support Branches')}>
                  {db.departments
                    .filter((item) => ADMIN_DEPARTMENT_IDS.has(item.id))
                    .map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </optgroup>
              )}
            </Select>
          </FormField>
          <FormField label={pick('আসন সংখ্যা', 'Number of posts')} required>
            <Input type="number" min={1} value={form.totalPositions} onChange={(event) => setForm({ ...form, totalPositions: event.target.value })} />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={isLoading}>{pick('সংরক্ষণ', 'Save')}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
