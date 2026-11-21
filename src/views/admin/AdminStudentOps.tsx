'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Printer } from 'lucide-react';
import { useParams } from '@/src/lib/navigation';
import {
  useCreateStudentMutation,
  useGetBootstrapQuery,
  useImportStudentsMutation,
  useIssueRfidCardMutation,
  useIssueTransferCertificateMutation,
  usePromoteStudentsMutation,
  useUpdateAdmissionStatusMutation,
  useUpdateEnrollmentMutation,
  useUpdateRfidCardStatusMutation,
  useUpdateStudentMutation,
} from '@/src/store/api';
import { useAcademicYearSelection } from '@/src/views/admin/AcademicFoundation';
import { StudentsShell } from '@/src/views/admin/StudentsShell';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { triggerPrint } from '@/src/lib/utils/cn';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { DataTable } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { PrintableIdCardSheet, PrintableTransferCertificate } from '@/src/components/print/PrintDocuments';
import { Button, Card, FormField, Input, Modal, Select, Textarea } from '@/src/components/ui/primitives';
import {
  BloodGroup,
  CardStatus,
  EnrollmentStatus,
  Gender,
  PromotionType,
  RelationshipType,
  Religion,
  StudentStatus,
} from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import type { Student, StudentEnrollment } from '@/src/types/entities';

function errorMessage(err: unknown, fallback: string) {
  return (err as { message?: string })?.message || fallback;
}

const BLOOD_LABEL: Record<string, string> = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A−',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B−',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O−',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB−',
};

type SectionKey =
  | 'directory'
  | 'create'
  | 'admissions'
  | 'enrollments'
  | 'promotions'
  | 'transfers'
  | 'cards'
  | 'import'
  | 'profile';

const TAB_SECTION: Record<string, SectionKey> = {
  directory: 'directory',
  create: 'create',
  admissions: 'admissions',
  enrollments: 'enrollments',
  promotions: 'promotions',
  transfers: 'transfers',
  rfid: 'cards',
  import: 'import',
};

export function AdminStudentsPage({
  defaultTab = 'directory',
}: {
  defaultTab?: keyof typeof TAB_SECTION;
}) {
  const { id } = useParams<{ id?: string }>();
  const pathname = usePathname();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  const year = useAcademicYearSelection(db?.academicYears);
  const section: SectionKey = id ? 'profile' : TAB_SECTION[defaultTab] ?? 'directory';

  if (isLoading || !db || !year) return <LoadingSkeleton />;

  const copy: Record<SectionKey, { title: string; description: string; year: boolean }> = {
    directory: {
      title: pick('শিক্ষার্থী ডিরেক্টরি', 'Student directory'),
      description: pick('এই শিক্ষাবর্ষে ভর্তি শিক্ষার্থী। নাম খুলে প্রোফাইল দেখা যায়।', 'Students enrolled in this academic year. Open a name to see the profile.'),
      year: true,
    },
    create: {
      title: pick('নতুন ভর্তি', 'New admission'),
      description: pick('ব্যক্তিগত তথ্য, অভিভাবক, তারপর শ্রেণি ও রোল।', 'Personal details, guardian, then class and roll.'),
      year: false,
    },
    admissions: {
      title: pick('অনলাইন আবেদন', 'Online applications'),
      description: pick('আবেদন দেখে অনুমোদন, বাতিল, অথবা শাখা ও রোল দিয়ে ভর্তি।', 'Review an application, then approve, reject, or admit with a section and roll.'),
      year: true,
    },
    enrollments: {
      title: pick('এনরোলমেন্ট', 'Enrollments'),
      description: pick('এই বছর কে কোন শাখায়, কোন রোলে, কোন বিভাগে।', 'Who sits in which section, roll, and stream this year.'),
      year: true,
    },
    promotions: {
      title: pick('প্রমোশন', 'Promotion'),
      description: pick('চলতি সেশন থেকে পরের শিক্ষাবর্ষে উত্তীর্ণ, অকৃতকার্য, অথবা দশম শ্রেণি সমাপ্ত।', 'Move the current session into the next year: promoted, retained, or class 10 completed.'),
      year: true,
    },
    transfers: {
      title: pick('ছাড়পত্র', 'Transfer certificates'),
      description: pick('ইস্যু হলে শিক্ষার্থী স্থানান্তরিত হয় এবং চলতি ভর্তি বন্ধ হয়।', 'Issuing a certificate marks the student transferred and closes the current enrollment.'),
      year: false,
    },
    cards: {
      title: pick('পরিচয়পত্র', 'Identity cards'),
      description: pick('কার্ড নম্বর ইস্যু ও অবস্থা। হাজিরা এই পাতায় হয় না।', 'Issue a card number and set its status. Attendance is not taken here.'),
      year: false,
    },
    import: {
      title: pick('CSV আমদানি', 'CSV import'),
      description: pick('ফাইল মিলিয়ে দেখে, তারপর শুধু সঠিক সারি ভর্তি হয়।', 'Check the file, then only valid rows are admitted.'),
      year: true,
    },
    profile: {
      title: pick('শিক্ষার্থীর প্রোফাইল', 'Student profile'),
      description: pick('ব্যক্তিগত তথ্য, এই বছরের ভর্তি, অভিভাবক ও ছাড়পত্র।', 'Personal record, this year’s enrollment, guardians, and certificates.'),
      year: false,
    },
  };

  const page = copy[section];
  return (
    <StudentsShell title={page.title} description={page.description} years={db.academicYears} selectedYear={year} showYear={page.year}>
      {section === 'directory' && <Directory db={db} yearId={year.id} />}
      {section === 'create' && <Register db={db} yearId={year.id} />}
      {section === 'admissions' && <Admissions db={db} yearId={year.id} />}
      {section === 'enrollments' && <Enrollments db={db} yearId={year.id} />}
      {section === 'promotions' && <Promotions db={db} yearId={year.id} />}
      {section === 'transfers' && <Transfers db={db} />}
      {section === 'cards' && <Cards db={db} />}
      {section === 'import' && <Importer db={db} yearId={year.id} />}
      {section === 'profile' && <Profile db={db} studentId={id ?? ''} startEditing={pathname.endsWith('/edit')} />}
    </StudentsShell>
  );
}

function classLabel(db: MockDatabase, classId: string, locale: string) {
  const item = db.classes.find((row) => row.id === classId);
  if (!item) return '—';
  return locale === 'bn' ? item.nameBn || item.name : item.name;
}

function Directory({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const { locale, pick } = useI18n();
  const [classId, setClassId] = useState('ALL');
  const [sectionId, setSectionId] = useState('ALL');
  const [printOpen, setPrintOpen] = useState(false);
  const rows = useMemo(() => {
    return db.enrollments
      .filter((enrollment) => enrollment.academicYearId === yearId)
      .map((enrollment) => {
        const student = db.students.find((item) => item.id === enrollment.studentId);
        if (!student) return null;
        const section = db.sections.find((item) => item.id === enrollment.sectionId);
        const group = enrollment.groupId ? db.academicGroups.find((item) => item.id === enrollment.groupId) : null;
        const guardian = db.parentStudents
          .filter((link) => link.studentId === student.id)
          .map((link) => db.parents.find((parent) => parent.id === link.parentId))
          .find(Boolean);
        return {
          id: student.id,
          studentId: student.studentId,
          nameBn: student.nameBn || student.nameEn,
          nameEn: student.nameEn,
          classId: enrollment.classId,
          sectionId: enrollment.sectionId,
          classLabel: classLabel(db, enrollment.classId, locale),
          sectionLabel: section?.name ?? '—',
          groupLabel: group ? (locale === 'bn' ? group.nameBn || group.name : group.name) : '—',
          roll: enrollment.roll,
          guardian: guardian ? `${guardian.nameBn || guardian.name} · ${guardian.phone}` : '—',
          status: student.status,
          presentAddress: student.presentAddress,
          bloodGroup: student.bloodGroup,
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .filter((row) => (classId === 'ALL' ? true : row.classId === classId))
      .filter((row) => (sectionId === 'ALL' ? true : row.sectionId === sectionId))
      .sort((a, b) => a.classLabel.localeCompare(b.classLabel) || a.sectionLabel.localeCompare(b.sectionLabel) || a.roll - b.roll);
  }, [db, yearId, locale, classId, sectionId]);

  return (
    <>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)} disabled={!rows.length}>
          <Printer className="w-4 h-4" /> {pick('পরিচয়পত্র প্রিন্ট', 'Print ID cards')}
        </Button>
      </div>
      <DataTable
        data={rows}
        exportFilename="students.csv"
        toolbarExtra={
          <div className="flex gap-2">
            <Select
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value);
                setSectionId('ALL');
              }}
              className="w-40 h-9"
            >
              <option value="ALL">{pick('সকল শ্রেণি', 'All classes')}</option>
              {db.classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {locale === 'bn' ? item.nameBn || item.name : item.name}
                </option>
              ))}
            </Select>
            <Select value={sectionId} onChange={(event) => setSectionId(event.target.value)} className="w-36 h-9">
              <option value="ALL">{pick('সকল শাখা', 'All sections')}</option>
              {db.sections
                .filter((item) => classId === 'ALL' || item.classId === classId)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </Select>
          </div>
        }
        columns={[
          { accessorKey: 'studentId', header: pick('আইডি', 'ID'), cell: ({ row }) => <span className="font-mono text-sm">{row.original.studentId}</span> },
          {
            accessorKey: 'nameBn',
            header: pick('নাম', 'Name'),
            cell: ({ row }) => (
              <Link href={`/admin/students/${row.original.id}`} className="font-semibold text-primary hover:underline">
                {row.original.nameBn}
                <span className="block text-xs font-normal text-muted-foreground">{row.original.nameEn}</span>
              </Link>
            ),
          },
          { accessorKey: 'classLabel', header: pick('শ্রেণি', 'Class') },
          { accessorKey: 'sectionLabel', header: pick('শাখা', 'Section') },
          { accessorKey: 'groupLabel', header: pick('বিভাগ', 'Stream') },
          { accessorKey: 'roll', header: pick('রোল', 'Roll'), cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.roll, locale)}</span> },
          { accessorKey: 'guardian', header: pick('অভিভাবক', 'Guardian') },
          { accessorKey: 'status', header: pick('অবস্থা', 'Status'), cell: ({ row }) => <StatusBadge enumName="StudentStatus" value={row.original.status} /> },
        ]}
        renderMobileCard={(row) => (
          <div className="space-y-1">
            <Link href={`/admin/students/${row.id}`} className="font-semibold text-primary">
              {row.nameBn}
            </Link>
            <p className="text-sm text-muted-foreground">
              {row.studentId} · {row.classLabel} ({row.sectionLabel}) · {pick('রোল', 'Roll')} {row.roll}
            </p>
          </div>
        )}
      />
      <Modal open={printOpen} onClose={() => setPrintOpen(false)} title={pick('পরিচয়পত্র', 'ID cards')} maxWidth="max-w-5xl">
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={triggerPrint}>
              <Printer className="w-4 h-4" /> {pick('প্রিন্ট', 'Print')}
            </Button>
          </div>
          <PrintableIdCardSheet
            school={db.schoolProfile}
            holderType="STUDENT"
            cards={rows.slice(0, 12).map((row) => ({
              code: row.studentId,
              name: locale === 'bn' ? row.nameBn : row.nameEn,
              subline: `${row.classLabel} (${row.sectionLabel}) · ${pick('রোল', 'Roll')} ${formatNumber(row.roll, locale)}`,
              secondaryLine: row.presentAddress ?? undefined,
              bloodGroup: row.bloodGroup ? BLOOD_LABEL[row.bloodGroup] || row.bloodGroup : undefined,
              validUntil: db.academicYears.find((item) => item.id === yearId)?.name,
            }))}
          />
        </div>
      </Modal>
    </>
  );
}

function Register({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const { locale, pick } = useI18n();
  const [createStudent, { isLoading }] = useCreateStudentMutation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nameEn: '',
    nameBn: '',
    dateOfBirth: '',
    gender: Gender.MALE as string,
    bloodGroup: '',
    religion: Religion.ISLAM as string,
    birthCertificateNo: '',
    boardRegistrationNo: '',
    presentAddress: '',
    permanentAddress: '',
    parentName: '',
    parentNameBn: '',
    parentPhone: '',
    parentOccupation: '',
    parentNid: '',
    relationship: RelationshipType.FATHER as string,
    previousSchoolName: '',
    previousGpa: '',
    academicYearId: yearId,
    classId: db.classes[0]?.id ?? '',
    sectionId: db.sections.find((item) => item.classId === db.classes[0]?.id)?.id ?? '',
    groupId: '',
    optionalClassSubjectId: '',
    roll: '',
    isReadmission: false,
  });
  const schoolClass = db.classes.find((item) => item.id === form.classId);
  const needsGroup = (schoolClass?.numericValue ?? 0) >= 9;
  const optionals = db.classSubjects.filter(
    (row) =>
      row.isOptional &&
      row.isActive &&
      row.academicYearId === form.academicYearId &&
      row.classId === form.classId &&
      (!row.groupId || row.groupId === form.groupId)
  );

  const set = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));

  const next = () => {
    if (step === 1 && !form.nameEn.trim()) {
      toast.error(pick('ইংরেজি নাম আবশ্যক।', 'English name is required.'));
      return;
    }
    if (step === 3 && (!form.parentName.trim() || !form.parentPhone.trim())) {
      toast.error(pick('অভিভাবকের নাম ও মোবাইল আবশ্যক।', 'Guardian name and phone are required.'));
      return;
    }
    setStep((value) => value + 1);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.roll || (needsGroup && !form.groupId)) {
      toast.error(pick('শাখা, রোল এবং প্রয়োজন হলে বিভাগ দিন।', 'Section, roll, and a stream where required.'));
      return;
    }
    try {
      await createStudent({
        ...form,
        groupId: needsGroup ? form.groupId : '',
        roll: Number(form.roll),
        previousGpa: form.previousGpa ? Number(form.previousGpa) : null,
        bloodGroup: form.bloodGroup || null,
      }).unwrap();
      toast.success(pick('শিক্ষার্থী ভর্তি হয়েছে।', 'Student admitted.'));
      setStep(1);
      set({ nameEn: '', nameBn: '', birthCertificateNo: '', boardRegistrationNo: '', parentName: '', parentNameBn: '', parentPhone: '', roll: '' });
    } catch (err) {
      toast.error(errorMessage(err, pick('ভর্তি হয়নি।', 'Admission failed.')));
    }
  };

  const steps = [
    pick('ব্যক্তিগত', 'Personal'),
    pick('ঠিকানা', 'Address'),
    pick('অভিভাবক', 'Guardian'),
    pick('শ্রেণি ও রোল', 'Class & roll'),
  ];

  return (
    <Card className="p-6">
      <div className="flex flex-wrap gap-2 mb-5">
        {steps.map((label, index) => (
          <span
            key={label}
            className={`px-3 py-1.5 text-sm rounded border ${step === index + 1 ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground'}`}
          >
            {formatNumber(index + 1, locale)}. {label}
          </span>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={pick('বাংলা নাম', 'Name in Bangla')}>
              <Input value={form.nameBn} onChange={(event) => set({ nameBn: event.target.value })} />
            </FormField>
            <FormField label={pick('ইংরেজি নাম', 'Name in English')} required>
              <Input value={form.nameEn} onChange={(event) => set({ nameEn: event.target.value })} />
            </FormField>
            <FormField label={pick('জন্ম তারিখ', 'Date of birth')}>
              <Input type="date" value={form.dateOfBirth} onChange={(event) => set({ dateOfBirth: event.target.value })} />
            </FormField>
            <FormField label={pick('লিঙ্গ', 'Gender')}>
              <Select value={form.gender} onChange={(event) => set({ gender: event.target.value })}>
                <option value={Gender.MALE}>{pick('ছাত্র', 'Male')}</option>
                <option value={Gender.FEMALE}>{pick('ছাত্রী', 'Female')}</option>
                <option value={Gender.OTHER}>{pick('অন্যান্য', 'Other')}</option>
              </Select>
            </FormField>
            <FormField label={pick('রক্তের গ্রুপ', 'Blood group')}>
              <Select value={form.bloodGroup} onChange={(event) => set({ bloodGroup: event.target.value })}>
                <option value="">{pick('নেই', 'None')}</option>
                {Object.values(BloodGroup).map((value) => (
                  <option key={value} value={value}>
                    {BLOOD_LABEL[value]}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={pick('ধর্ম', 'Religion')}>
              <Select value={form.religion} onChange={(event) => set({ religion: event.target.value })}>
                {Object.values(Religion).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={pick('জন্ম সনদ নম্বর', 'Birth certificate')}>
              <Input value={form.birthCertificateNo} onChange={(event) => set({ birthCertificateNo: event.target.value })} />
            </FormField>
            <FormField label={pick('বোর্ড রেজিস্ট্রেশন', 'Board registration')}>
              <Input value={form.boardRegistrationNo} onChange={(event) => set({ boardRegistrationNo: event.target.value })} />
            </FormField>
          </div>
        )}
        {step === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={pick('বর্তমান ঠিকানা', 'Present address')}>
              <Textarea value={form.presentAddress} onChange={(event) => set({ presentAddress: event.target.value })} />
            </FormField>
            <FormField label={pick('স্থায়ী ঠিকানা', 'Permanent address')}>
              <Textarea value={form.permanentAddress} onChange={(event) => set({ permanentAddress: event.target.value })} />
            </FormField>
            <FormField label={pick('পূর্বের বিদ্যালয়', 'Previous school')}>
              <Input value={form.previousSchoolName} onChange={(event) => set({ previousSchoolName: event.target.value })} />
            </FormField>
            <FormField label={pick('পূর্বের জিপিএ', 'Previous GPA')}>
              <Input value={form.previousGpa} onChange={(event) => set({ previousGpa: event.target.value })} />
            </FormField>
          </div>
        )}
        {step === 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={pick('সম্পর্ক', 'Relationship')}>
              <Select value={form.relationship} onChange={(event) => set({ relationship: event.target.value })}>
                <option value={RelationshipType.FATHER}>{pick('পিতা', 'Father')}</option>
                <option value={RelationshipType.MOTHER}>{pick('মাতা', 'Mother')}</option>
                <option value={RelationshipType.GUARDIAN}>{pick('অভিভাবক', 'Guardian')}</option>
                <option value={RelationshipType.OTHER}>{pick('অন্যান্য', 'Other')}</option>
              </Select>
            </FormField>
            <FormField label={pick('ইংরেজি নাম', 'Name in English')} required>
              <Input value={form.parentName} onChange={(event) => set({ parentName: event.target.value })} />
            </FormField>
            <FormField label={pick('বাংলা নাম', 'Name in Bangla')}>
              <Input value={form.parentNameBn} onChange={(event) => set({ parentNameBn: event.target.value })} />
            </FormField>
            <FormField label={pick('মোবাইল', 'Phone')} required>
              <Input value={form.parentPhone} onChange={(event) => set({ parentPhone: event.target.value })} />
            </FormField>
            <FormField label={pick('পেশা', 'Occupation')}>
              <Input value={form.parentOccupation} onChange={(event) => set({ parentOccupation: event.target.value })} />
            </FormField>
            <FormField label={pick('এনআইডি', 'NID')}>
              <Input value={form.parentNid} onChange={(event) => set({ parentNid: event.target.value })} />
            </FormField>
          </div>
        )}
        {step === 4 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={pick('শিক্ষাবর্ষ', 'Academic year')}>
              <Select value={form.academicYearId} onChange={(event) => set({ academicYearId: event.target.value })}>
                {db.academicYears.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={pick('শ্রেণি', 'Class')}>
              <Select
                value={form.classId}
                onChange={(event) => {
                  const section = db.sections.find((item) => item.classId === event.target.value);
                  set({ classId: event.target.value, sectionId: section?.id ?? '', groupId: '', optionalClassSubjectId: '' });
                }}
              >
                {db.classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {locale === 'bn' ? item.nameBn || item.name : item.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={pick('শাখা', 'Section')} required>
              <Select value={form.sectionId} onChange={(event) => set({ sectionId: event.target.value })}>
                {db.sections
                  .filter((item) => item.classId === form.classId)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </Select>
            </FormField>
            {needsGroup && (
              <FormField label={pick('বিভাগ', 'Stream')} required>
                <Select value={form.groupId} onChange={(event) => set({ groupId: event.target.value, optionalClassSubjectId: '' })}>
                  <option value="">{pick('বেছে নিন', 'Choose')}</option>
                  {db.academicGroups.map((item) => (
                    <option key={item.id} value={item.id}>
                      {locale === 'bn' ? item.nameBn || item.name : item.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            )}
            <FormField label={pick('রোল', 'Roll')} required>
              <Input type="number" min={1} value={form.roll} onChange={(event) => set({ roll: event.target.value })} />
            </FormField>
            <FormField label={pick('ঐচ্ছিক বিষয়', 'Optional subject')}>
              <Select value={form.optionalClassSubjectId} onChange={(event) => set({ optionalClassSubjectId: event.target.value })}>
                <option value="">{pick('নেই', 'None')}</option>
                {optionals.map((row) => {
                  const subject = db.subjects.find((item) => item.id === row.subjectId);
                  return (
                    <option key={row.id} value={row.id}>
                      {subject ? (locale === 'bn' ? subject.nameBn || subject.name : subject.name) : row.id}
                    </option>
                  );
                })}
              </Select>
            </FormField>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={form.isReadmission} onChange={(event) => set({ isReadmission: event.target.checked })} />
              {pick('পুনঃভর্তি', 'Readmission')}
            </label>
          </div>
        )}
        <div className="flex justify-between pt-3 border-t border-border">
          <Button variant="outline" disabled={step === 1} onClick={() => setStep((value) => value - 1)}>
            {pick('পূর্ববর্তী', 'Back')}
          </Button>
          {step < 4 ? (
            <Button variant="primary" onClick={next}>
              {pick('পরবর্তী', 'Next')}
            </Button>
          ) : (
            <Button type="submit" variant="primary" disabled={isLoading}>
              {pick('ভর্তি নিশ্চিত', 'Confirm admission')}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

function Admissions({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const { locale, pick } = useI18n();
  const [updateStatus, { isLoading }] = useUpdateAdmissionStatusMutation();
  const [openId, setOpenId] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState('');
  const [roll, setRoll] = useState('');
  const app = db.onlineAdmissions.find((item) => item.id === openId) ?? null;

  const open = (id: string) => {
    const found = db.onlineAdmissions.find((item) => item.id === id);
    const section =
      db.sections.find((item) => found && item.classId === found.targetClassId && found.preferredSection && item.name === found.preferredSection) ||
      db.sections.find((item) => item.classId === found?.targetClassId);
    const used = db.enrollments.filter((item) => item.academicYearId === yearId && item.sectionId === section?.id).map((item) => item.roll);
    setOpenId(id);
    setSectionId(section?.id ?? '');
    setRoll(String(used.length ? Math.max(...used) + 1 : 1));
  };

  const act = async (status: 'APPROVED' | 'REJECTED' | 'ADMITTED') => {
    if (!app) return;
    try {
      await updateStatus({
        id: app.id,
        status,
        sectionId: status === 'ADMITTED' ? sectionId : undefined,
        roll: status === 'ADMITTED' ? Number(roll) : undefined,
        academicYearId: yearId,
      }).unwrap();
      toast.success(
        status === 'ADMITTED'
          ? pick('ভর্তি সম্পন্ন। ডিরেক্টরিতে যোগ হয়েছে।', 'Admitted. The student is now in the directory.')
          : pick('আবেদনের অবস্থা হালনাগাদ হয়েছে।', 'Application status updated.')
      );
      setOpenId(null);
    } catch (err) {
      toast.error(errorMessage(err, pick('হালনাগাদ হয়নি।', 'Could not update the application.')));
    }
  };

  const rows = db.onlineAdmissions.map((item) => ({
    ...item,
    classLabel: classLabel(db, item.targetClassId, locale),
    when: formatDateShort(item.submittedAt, locale),
  }));

  return (
    <>
      <DataTable
        data={rows}
        exportFilename="admissions.csv"
        columns={[
          { accessorKey: 'applicationNumber', header: pick('আবেদন নং', 'Application'), cell: ({ row }) => <span className="font-mono text-sm">{row.original.applicationNumber}</span> },
          { accessorKey: 'studentNameBn', header: pick('শিক্ষার্থী', 'Student'), cell: ({ row }) => <span>{row.original.studentNameBn}<span className="block text-xs text-muted-foreground">{row.original.studentNameEn}</span></span> },
          { accessorKey: 'classLabel', header: pick('শ্রেণি', 'Class') },
          { accessorKey: 'fatherNameBn', header: pick('পিতা', 'Father') },
          { accessorKey: 'guardianPhone', header: pick('মোবাইল', 'Phone') },
          { accessorKey: 'when', header: pick('তারিখ', 'Date') },
          { accessorKey: 'status', header: pick('অবস্থা', 'Status'), cell: ({ row }) => <StatusBadge enumName="AdmissionApplicationStatus" value={row.original.status} /> },
          {
            id: 'open',
            header: '',
            cell: ({ row }) => (
              <Button size="sm" variant="outline" onClick={() => open(row.original.id)}>
                {pick('দেখুন', 'Review')}
              </Button>
            ),
          },
        ]}
      />
      <Modal open={Boolean(app)} onClose={() => setOpenId(null)} title={app ? `${app.applicationNumber} · ${app.studentNameBn}` : ''} maxWidth="max-w-xl">
        {app && (
          <div className="space-y-4 text-sm">
            <p>{app.studentNameEn}</p>
            <p>
              {pick('পিতা', 'Father')}: {app.fatherNameBn} · {app.guardianPhone}
            </p>
            <p>
              {pick('মাতা', 'Mother')}: {app.motherNameBn}
            </p>
            <p>
              {pick('শ্রেণি', 'Class')}: {classLabel(db, app.targetClassId, locale)}
            </p>
            <p>{app.presentAddress}</p>
            {app.status !== 'ADMITTED' && app.status !== 'REJECTED' && (
              <div className="grid grid-cols-2 gap-3">
                <FormField label={pick('শাখা', 'Section')}>
                  <Select value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
                    {db.sections
                      .filter((item) => item.classId === app.targetClassId)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                  </Select>
                </FormField>
                <FormField label={pick('রোল', 'Roll')}>
                  <Input type="number" min={1} value={roll} onChange={(event) => setRoll(event.target.value)} />
                </FormField>
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              {app.status !== 'ADMITTED' && app.status !== 'REJECTED' && (
                <>
                  <Button variant="outline" disabled={isLoading} onClick={() => act('REJECTED')}>
                    {pick('বাতিল', 'Reject')}
                  </Button>
                  <Button variant="outline" disabled={isLoading} onClick={() => act('APPROVED')}>
                    {pick('অনুমোদন', 'Approve')}
                  </Button>
                  <Button variant="primary" disabled={isLoading} onClick={() => act('ADMITTED')}>
                    {pick('ভর্তি করুন', 'Admit')}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function Enrollments({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const { locale, pick } = useI18n();
  const [updateEnrollment, { isLoading }] = useUpdateEnrollmentMutation();
  const [classId, setClassId] = useState('ALL');
  const [editing, setEditing] = useState<StudentEnrollment | null>(null);
  const [form, setForm] = useState({ sectionId: '', groupId: '', roll: '', optionalClassSubjectId: '', isRepeater: false, isReadmission: false, remarks: '' });

  const rows = db.enrollments
    .filter((item) => item.academicYearId === yearId && (classId === 'ALL' || item.classId === classId))
    .map((item) => {
      const student = db.students.find((row) => row.id === item.studentId);
      const group = item.groupId ? db.academicGroups.find((row) => row.id === item.groupId) : null;
      return {
        ...item,
        name: student?.nameBn || student?.nameEn || '—',
        studentCode: student?.studentId ?? '',
        classLabel: classLabel(db, item.classId, locale),
        sectionLabel: db.sections.find((row) => row.id === item.sectionId)?.name ?? '—',
        groupLabel: group ? (locale === 'bn' ? group.nameBn || group.name : group.name) : '—',
      };
    })
    .sort((a, b) => a.classLabel.localeCompare(b.classLabel) || a.roll - b.roll);

  const start = (row: StudentEnrollment) => {
    setEditing(row);
    setForm({
      sectionId: row.sectionId,
      groupId: row.groupId ?? '',
      roll: String(row.roll),
      optionalClassSubjectId: row.optionalClassSubjectId ?? '',
      isRepeater: row.isRepeater,
      isReadmission: row.isReadmission,
      remarks: row.remarks ?? '',
    });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    try {
      await updateEnrollment({
        id: editing.id,
        sectionId: form.sectionId,
        groupId: form.groupId || null,
        roll: Number(form.roll),
        optionalClassSubjectId: form.optionalClassSubjectId || null,
        isRepeater: form.isRepeater,
        isReadmission: form.isReadmission,
        remarks: form.remarks,
      }).unwrap();
      toast.success(pick('এনরোলমেন্ট হালনাগাদ হয়েছে।', 'Enrollment updated.'));
      setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err, pick('হালনাগাদ হয়নি।', 'Could not update the enrollment.')));
    }
  };

  const needsGroup = (db.classes.find((item) => item.id === editing?.classId)?.numericValue ?? 0) >= 9;
  const optionals = db.classSubjects.filter(
    (row) =>
      editing &&
      row.isOptional &&
      row.isActive &&
      row.academicYearId === editing.academicYearId &&
      row.classId === editing.classId &&
      (!row.groupId || row.groupId === form.groupId)
  );

  return (
    <>
      <DataTable
        data={rows}
        exportFilename="enrollments.csv"
        toolbarExtra={
          <Select value={classId} onChange={(event) => setClassId(event.target.value)} className="w-40 h-9">
            <option value="ALL">{pick('সকল শ্রেণি', 'All classes')}</option>
            {db.classes.map((item) => (
              <option key={item.id} value={item.id}>
                {locale === 'bn' ? item.nameBn || item.name : item.name}
              </option>
            ))}
          </Select>
        }
        columns={[
          { accessorKey: 'studentCode', header: pick('আইডি', 'ID') },
          { accessorKey: 'name', header: pick('শিক্ষার্থী', 'Student') },
          { accessorKey: 'classLabel', header: pick('শ্রেণি', 'Class') },
          { accessorKey: 'sectionLabel', header: pick('শাখা', 'Section') },
          { accessorKey: 'groupLabel', header: pick('বিভাগ', 'Stream') },
          { accessorKey: 'roll', header: pick('রোল', 'Roll') },
          { accessorKey: 'status', header: pick('অবস্থা', 'Status'), cell: ({ row }) => <StatusBadge enumName="EnrollmentStatus" value={row.original.status} /> },
          {
            id: 'edit',
            header: '',
            cell: ({ row }) =>
              row.original.status === EnrollmentStatus.ACTIVE ? (
                <Button size="sm" variant="ghost" onClick={() => start(row.original)}>
                  {pick('সম্পাদনা', 'Edit')}
                </Button>
              ) : null,
          },
        ]}
      />
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={pick('এনরোলমেন্ট সম্পাদনা', 'Edit enrollment')}>
        <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={pick('শাখা', 'Section')}>
            <Select value={form.sectionId} onChange={(event) => setForm({ ...form, sectionId: event.target.value })}>
              {db.sections
                .filter((item) => item.classId === editing?.classId)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </Select>
          </FormField>
          {needsGroup && (
            <FormField label={pick('বিভাগ', 'Stream')}>
              <Select value={form.groupId} onChange={(event) => setForm({ ...form, groupId: event.target.value })}>
                {db.academicGroups.map((item) => (
                  <option key={item.id} value={item.id}>
                    {locale === 'bn' ? item.nameBn || item.name : item.name}
                  </option>
                ))}
              </Select>
            </FormField>
          )}
          <FormField label={pick('রোল', 'Roll')}>
            <Input type="number" min={1} value={form.roll} onChange={(event) => setForm({ ...form, roll: event.target.value })} />
          </FormField>
          <FormField label={pick('ঐচ্ছিক বিষয়', 'Optional subject')}>
            <Select value={form.optionalClassSubjectId} onChange={(event) => setForm({ ...form, optionalClassSubjectId: event.target.value })}>
              <option value="">{pick('নেই', 'None')}</option>
              {optionals.map((row) => {
                const subject = db.subjects.find((item) => item.id === row.subjectId);
                return (
                  <option key={row.id} value={row.id}>
                    {subject?.nameBn || subject?.name}
                  </option>
                );
              })}
            </Select>
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isRepeater} onChange={(event) => setForm({ ...form, isRepeater: event.target.checked })} />
            {pick('পুনরাবৃত্তি', 'Repeater')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isReadmission} onChange={(event) => setForm({ ...form, isReadmission: event.target.checked })} />
            {pick('পুনঃভর্তি', 'Readmission')}
          </label>
          <FormField label={pick('মন্তব্য', 'Note')}>
            <Textarea value={form.remarks} onChange={(event) => setForm({ ...form, remarks: event.target.value })} />
          </FormField>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" variant="primary" disabled={isLoading}>
              {pick('সংরক্ষণ', 'Save')}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Promotions({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const { locale, pick } = useI18n();
  const [promote, { isLoading }] = usePromoteStudentsMutation();
  const [classId, setClassId] = useState(db.classes[0]?.id ?? '');
  const [targetYearId, setTargetYearId] = useState(db.academicYears.find((item) => item.id !== yearId)?.id ?? '');
  const [choices, setChoices] = useState<Record<string, { decision: string; sectionId: string; roll: string }>>({});
  const sourceClass = db.classes.find((item) => item.id === classId);
  const nextClass =
    db.classes.find((item) => item.numericValue === (sourceClass?.numericValue ?? 0) + 1) ?? sourceClass;
  const isTop = (sourceClass?.numericValue ?? 0) >= 10;

  const candidates = db.enrollments.filter(
    (item) => item.academicYearId === yearId && item.classId === classId && item.status === EnrollmentStatus.ACTIVE
  );

  const choiceFor = (enrollment: StudentEnrollment) => {
    const existing = choices[enrollment.id];
    if (existing) return existing;
    const targetClassId = isTop ? classId : nextClass?.id;
    const currentSection = db.sections.find((item) => item.id === enrollment.sectionId);
    const targetSection =
      db.sections.find((item) => item.classId === targetClassId && item.name === currentSection?.name) ||
      db.sections.find((item) => item.classId === targetClassId);
    return { decision: 'SKIP', sectionId: targetSection?.id ?? '', roll: String(enrollment.roll) };
  };

  const setChoice = (id: string, enrollment: StudentEnrollment, patch: Partial<{ decision: string; sectionId: string; roll: string }>) => {
    setChoices((current) => ({ ...current, [id]: { ...choiceFor(enrollment), ...current[id], ...patch } }));
  };

  const run = async () => {
    const items = candidates
      .map((enrollment) => ({ enrollment, choice: choiceFor(enrollment) }))
      .filter((row) => row.choice.decision !== 'SKIP')
      .map((row) => ({
        studentId: row.enrollment.studentId,
        fromEnrollmentId: row.enrollment.id,
        toClassId: row.choice.decision === 'RETAINED' || row.choice.decision === 'GRADUATED' ? classId : nextClass?.id,
        toSectionId: row.choice.sectionId,
        roll: Number(row.choice.roll),
        promotionType: row.choice.decision as PromotionType | 'GRADUATED',
      }));
    if (!items.length) {
      toast.error(pick('অন্তত একজনের সিদ্ধান্ত বেছে নিন।', 'Choose a decision for at least one student.'));
      return;
    }
    try {
      const result = await promote({ toAcademicYearId: targetYearId, items }).unwrap();
      toast.success(
        pick(
          `উত্তীর্ণ ${formatNumber(result.promoted, 'bn')}, অকৃতকার্য ${formatNumber(result.retained, 'bn')}, সমাপ্ত ${formatNumber(result.graduated, 'bn')}।`,
          `Promoted ${result.promoted}, retained ${result.retained}, completed ${result.graduated}.`
        )
      );
      setChoices({});
    } catch (err) {
      toast.error(errorMessage(err, pick('প্রমোশন হয়নি।', 'Promotion failed.')));
    }
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <FormField label={pick('উৎস শ্রেণি', 'From class')}>
          <Select value={classId} onChange={(event) => { setClassId(event.target.value); setChoices({}); }}>
            {db.classes.map((item) => (
              <option key={item.id} value={item.id}>
                {locale === 'bn' ? item.nameBn || item.name : item.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={pick('পরের শিক্ষাবর্ষ', 'Next year')}>
          <Select value={targetYearId} onChange={(event) => setTargetYearId(event.target.value)}>
            {db.academicYears
              .filter((item) => item.id !== yearId)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </Select>
        </FormField>
        <Button variant="primary" disabled={isLoading} onClick={run}>
          {pick('নির্বাচিত সিদ্ধান্ত প্রয়োগ', 'Apply selected decisions')}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="p-2 text-left">{pick('রোল', 'Roll')}</th>
              <th className="p-2 text-left">{pick('শিক্ষার্থী', 'Student')}</th>
              <th className="p-2 text-left">{pick('সিদ্ধান্ত', 'Decision')}</th>
              <th className="p-2 text-left">{pick('পরের শাখা', 'Next section')}</th>
              <th className="p-2 text-left">{pick('পরের রোল', 'Next roll')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {candidates.map((enrollment) => {
              const student = db.students.find((item) => item.id === enrollment.studentId);
              const choice = choiceFor(enrollment);
              const moving = choice.decision === 'PROMOTED' || choice.decision === 'RETAINED';
              const targetClassId = choice.decision === 'RETAINED' ? classId : nextClass?.id;
              return (
                <tr key={enrollment.id}>
                  <td className="p-2 tabular-nums">{enrollment.roll}</td>
                  <td className="p-2">{student?.nameBn || student?.nameEn}</td>
                  <td className="p-2">
                    <Select value={choice.decision} onChange={(event) => setChoice(enrollment.id, enrollment, { decision: event.target.value })} className="h-9">
                      <option value="SKIP">{pick('এখন নয়', 'Skip')}</option>
                      {!isTop && <option value={PromotionType.PROMOTED}>{pick('উত্তীর্ণ', 'Promoted')}</option>}
                      <option value={PromotionType.RETAINED}>{pick('একই শ্রেণিতে', 'Retained')}</option>
                      {isTop && <option value="GRADUATED">{pick('সমাপ্ত', 'Completed')}</option>}
                    </Select>
                  </td>
                  <td className="p-2">
                    {moving ? (
                      <Select value={choice.sectionId} onChange={(event) => setChoice(enrollment.id, enrollment, { sectionId: event.target.value })} className="h-9">
                        {db.sections
                          .filter((item) => item.classId === targetClassId)
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                      </Select>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-2">
                    {moving ? (
                      <Input type="number" min={1} value={choice.roll} onChange={(event) => setChoice(enrollment.id, enrollment, { roll: event.target.value })} className="h-9 w-24" />
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!candidates.length && <p className="p-4 text-sm text-muted-foreground">{pick('এই শ্রেণিতে চলতি ভর্তি নেই।', 'No active enrollment in this class.')}</p>}
      </div>
    </Card>
  );
}

function Transfers({ db }: { db: MockDatabase }) {
  const { pick } = useI18n();
  const [issue, { isLoading }] = useIssueTransferCertificateMutation();
  const [open, setOpen] = useState(false);
  const [printId, setPrintId] = useState<string | null>(null);
  const [form, setForm] = useState({
    studentId: '',
    tcNumber: '',
    issueDate: new Date().toISOString().slice(0, 10),
    leavingDate: new Date().toISOString().slice(0, 10),
    reason: '',
    duesCleared: true,
    conductRemarks: '',
    leavingClass: '',
    promotedToNextClass: false,
    destinationSchool: '',
  });

  const activeStudents = db.students.filter((item) => item.status === StudentStatus.ACTIVE);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await issue(form).unwrap();
      toast.success(pick('ছাড়পত্র ইস্যু হয়েছে।', 'Transfer certificate issued.'));
      setOpen(false);
      setForm({ ...form, studentId: '', tcNumber: '', reason: '', destinationSchool: '' });
    } catch (err) {
      toast.error(errorMessage(err, pick('ইস্যু হয়নি।', 'Could not issue the certificate.')));
    }
  };
  const printed = db.transferCertificates.find((item) => item.id === printId);
  const printedStudent = printed ? db.students.find((item) => item.id === printed.studentId) : null;

  return (
    <>
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
          {pick('নতুন ছাড়পত্র', 'Issue certificate')}
        </Button>
      </div>
      <DataTable
        data={db.transferCertificates.map((item) => {
          const student = db.students.find((row) => row.id === item.studentId);
          return { ...item, name: student?.nameBn || student?.nameEn || '—' };
        })}
        exportFilename="transfer-certificates.csv"
        columns={[
          { accessorKey: 'tcNumber', header: pick('টিসি নম্বর', 'TC number'), cell: ({ row }) => <span className="font-mono">{row.original.tcNumber}</span> },
          { accessorKey: 'name', header: pick('শিক্ষার্থী', 'Student') },
          { accessorKey: 'issueDate', header: pick('ইস্যু', 'Issued') },
          { accessorKey: 'reason', header: pick('কারণ', 'Reason') },
          { accessorKey: 'destinationSchool', header: pick('গন্তব্য', 'Destination') },
          {
            id: 'print',
            header: '',
            cell: ({ row }) => (
              <Button size="sm" variant="outline" onClick={() => setPrintId(row.original.id)}>
                {pick('প্রিন্ট', 'Print')}
              </Button>
            ),
          },
        ]}
      />
      <Modal open={open} onClose={() => setOpen(false)} title={pick('ছাড়পত্র ইস্যু', 'Issue transfer certificate')}>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={pick('শিক্ষার্থী', 'Student')} required>
            <Select value={form.studentId} onChange={(event) => setForm({ ...form, studentId: event.target.value })}>
              <option value="">{pick('বেছে নিন', 'Choose')}</option>
              {activeStudents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nameBn || item.nameEn} ({item.studentId})
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={pick('টিসি নম্বর', 'TC number')} required>
            <Input value={form.tcNumber} onChange={(event) => setForm({ ...form, tcNumber: event.target.value })} />
          </FormField>
          <FormField label={pick('ইস্যুর তারিখ', 'Issue date')}>
            <Input type="date" value={form.issueDate} onChange={(event) => setForm({ ...form, issueDate: event.target.value })} />
          </FormField>
          <FormField label={pick('ত্যাগের তারিখ', 'Leaving date')}>
            <Input type="date" value={form.leavingDate} onChange={(event) => setForm({ ...form, leavingDate: event.target.value })} />
          </FormField>
          <FormField label={pick('কারণ', 'Reason')} required>
            <Textarea value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
          </FormField>
          <FormField label={pick('গন্তব্য বিদ্যালয়', 'Destination school')}>
            <Input value={form.destinationSchool} onChange={(event) => setForm({ ...form, destinationSchool: event.target.value })} />
          </FormField>
          <FormField label={pick('আচরণ', 'Conduct')}>
            <Input value={form.conductRemarks} onChange={(event) => setForm({ ...form, conductRemarks: event.target.value })} />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.duesCleared} onChange={(event) => setForm({ ...form, duesCleared: event.target.checked })} />
            {pick('বকেয়া পরিশোধিত', 'Dues cleared')}
          </label>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" variant="primary" disabled={isLoading}>
              {pick('ইস্যু', 'Issue')}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal open={Boolean(printed && printedStudent)} onClose={() => setPrintId(null)} title={pick('ছাড়পত্র', 'Transfer certificate')} maxWidth="max-w-3xl">
        {printed && printedStudent && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={triggerPrint}>
                <Printer className="w-4 h-4" /> {pick('প্রিন্ট', 'Print')}
              </Button>
            </div>
            <PrintableTransferCertificate school={db.schoolProfile} tc={printed} student={printedStudent} />
          </div>
        )}
      </Modal>
    </>
  );
}

function Cards({ db }: { db: MockDatabase }) {
  const { pick } = useI18n();
  const [issue, { isLoading: issuing }] = useIssueRfidCardMutation();
  const [updateStatus, { isLoading: updating }] = useUpdateRfidCardStatusMutation();
  const [open, setOpen] = useState(false);
  const [statusId, setStatusId] = useState<string | null>(null);
  const [status, setStatus] = useState<CardStatus>(CardStatus.ACTIVE);
  const [form, setForm] = useState({ studentId: '', cardNumber: '', remarks: '' });
  const card = db.rfidCards.find((item) => item.id === statusId);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await issue(form).unwrap();
      toast.success(pick('কার্ড ইস্যু হয়েছে।', 'Card issued.'));
      setOpen(false);
      setForm({ studentId: '', cardNumber: '', remarks: '' });
    } catch (err) {
      toast.error(errorMessage(err, pick('ইস্যু হয়নি।', 'Could not issue the card.')));
    }
  };

  const saveStatus = async () => {
    if (!card) return;
    try {
      await updateStatus({ id: card.id, status }).unwrap();
      toast.success(pick('কার্ডের অবস্থা হালনাগাদ হয়েছে।', 'Card status updated.'));
      setStatusId(null);
    } catch (err) {
      toast.error(errorMessage(err, pick('হালনাগাদ হয়নি।', 'Could not update the card.')));
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
          {pick('কার্ড ইস্যু', 'Issue card')}
        </Button>
      </div>
      <DataTable
        data={db.rfidCards.map((item) => {
          const student = db.students.find((row) => row.id === item.studentId);
          return { ...item, name: student?.nameBn || student?.nameEn || '—', studentCode: student?.studentId ?? '' };
        })}
        exportFilename="identity-cards.csv"
        columns={[
          { accessorKey: 'cardNumber', header: pick('কার্ড নম্বর', 'Card number'), cell: ({ row }) => <span className="font-mono">{row.original.cardNumber}</span> },
          { accessorKey: 'name', header: pick('শিক্ষার্থী', 'Student') },
          { accessorKey: 'studentCode', header: pick('আইডি', 'ID') },
          { accessorKey: 'status', header: pick('অবস্থা', 'Status'), cell: ({ row }) => <StatusBadge enumName="CardStatus" value={row.original.status} /> },
          {
            id: 'status',
            header: '',
            cell: ({ row }) => (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setStatusId(row.original.id);
                  setStatus(row.original.status);
                }}
              >
                {pick('অবস্থা', 'Status')}
              </Button>
            ),
          },
        ]}
      />
      <Modal open={open} onClose={() => setOpen(false)} title={pick('কার্ড ইস্যু', 'Issue card')}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label={pick('শিক্ষার্থী', 'Student')} required>
            <Select value={form.studentId} onChange={(event) => setForm({ ...form, studentId: event.target.value })}>
              <option value="">{pick('বেছে নিন', 'Choose')}</option>
              {db.students
                .filter((item) => item.status === StudentStatus.ACTIVE)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nameBn || item.nameEn} ({item.studentId})
                  </option>
                ))}
            </Select>
          </FormField>
          <FormField label={pick('কার্ড নম্বর', 'Card number')} required>
            <Input value={form.cardNumber} onChange={(event) => setForm({ ...form, cardNumber: event.target.value })} />
          </FormField>
          <FormField label={pick('মন্তব্য', 'Note')}>
            <Input value={form.remarks} onChange={(event) => setForm({ ...form, remarks: event.target.value })} />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={issuing}>
              {pick('ইস্যু', 'Issue')}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal open={Boolean(card)} onClose={() => setStatusId(null)} title={card?.cardNumber ?? ''}>
        <div className="space-y-4">
          <FormField label={pick('অবস্থা', 'Status')}>
            <Select value={status} onChange={(event) => setStatus(event.target.value as CardStatus)}>
              <option value={CardStatus.ACTIVE}>{pick('সক্রিয়', 'Active')}</option>
              <option value={CardStatus.LOST}>{pick('হারিয়ে গেছে', 'Lost')}</option>
              <option value={CardStatus.DAMAGED}>{pick('ক্ষতিগ্রস্ত', 'Damaged')}</option>
              <option value={CardStatus.BLOCKED}>{pick('বন্ধ', 'Blocked')}</option>
            </Select>
          </FormField>
          <div className="flex justify-end">
            <Button variant="primary" disabled={updating} onClick={saveStatus}>
              {pick('সংরক্ষণ', 'Save')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function Importer({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const { pick } = useI18n();
  const [importStudents, { isLoading }] = useImportStudentsMutation();
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [fileName, setFileName] = useState('');

  const preview = rows.map((row, index) => {
    const schoolClass = db.classes.find((item) => item.name === row.className || item.nameBn === row.className);
    const section = schoolClass ? db.sections.find((item) => item.classId === schoolClass.id && item.name === row.sectionName) : undefined;
    const problem = !row.nameEn || !row.parentName || !row.parentPhone || !schoolClass || !section || !Number(row.roll);
    return {
      index: index + 1,
      nameEn: row.nameEn || '',
      nameBn: row.nameBn || '',
      className: row.className || '',
      sectionName: row.sectionName || '',
      roll: row.roll || '',
      problem,
    };
  });

  const commit = async () => {
    const ready = rows.filter((_, index) => !preview[index]?.problem);
    if (!ready.length) {
      toast.error(pick('সঠিক সারি নেই।', 'There are no valid rows.'));
      return;
    }
    try {
      const result = await importStudents({ academicYearId: yearId, rows: ready }).unwrap();
      toast.success(pick(`${result.created} জন ভর্তি হয়েছে।`, `${result.created} students admitted.`));
      if (result.errors.length) {
        toast.error(result.errors.map((item) => `${item.row}: ${item.message}`).join(' '));
      }
      setRows([]);
      setFileName('');
    } catch (err) {
      toast.error(errorMessage(err, pick('আমদানি হয়নি।', 'Import failed.')));
    }
  };

  return (
    <Card className="p-5 space-y-4">
      <p className="text-sm text-muted-foreground">
        nameEn, nameBn, gender, dateOfBirth, className, sectionName, groupName, roll, birthCertificateNo, parentName, parentPhone
      </p>
      <Input
        type="file"
        accept=".csv,text/csv"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const text = await file.text();
          const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
          const headers = lines[0]?.split(',').map((cell) => cell.trim()) ?? [];
          const parsed = lines.slice(1).map((line) => {
            const cells = line.split(',');
            return Object.fromEntries(headers.map((header, index) => [header, (cells[index] ?? '').trim()]));
          });
          setRows(parsed);
          setFileName(file.name);
        }}
      />
      {fileName && <p className="text-sm">{fileName}</p>}
      {!!preview.length && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">{pick('নাম', 'Name')}</th>
                  <th className="p-2 text-left">{pick('শ্রেণি', 'Class')}</th>
                  <th className="p-2 text-left">{pick('শাখা', 'Section')}</th>
                  <th className="p-2 text-left">{pick('রোল', 'Roll')}</th>
                  <th className="p-2 text-left">{pick('যাচাই', 'Check')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.map((row) => (
                  <tr key={row.index}>
                    <td className="p-2">{row.index}</td>
                    <td className="p-2">{row.nameBn || row.nameEn}</td>
                    <td className="p-2">{row.className}</td>
                    <td className="p-2">{row.sectionName}</td>
                    <td className="p-2">{row.roll}</td>
                    <td className="p-2">{row.problem ? pick('অসম্পূর্ণ', 'Incomplete') : pick('ঠিক আছে', 'Ready')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <Button variant="primary" disabled={isLoading} onClick={commit}>
              {pick('সঠিক সারি ভর্তি করুন', 'Admit valid rows')}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

function Profile({ db, studentId, startEditing }: { db: MockDatabase; studentId: string; startEditing: boolean }) {
  const { locale, pick } = useI18n();
  const [updateStudent, { isLoading }] = useUpdateStudentMutation();
  const student = db.students.find((item) => item.id === studentId);
  const [open, setOpen] = useState(startEditing);
  const [form, setForm] = useState<Partial<Student>>({});

  if (!student) {
    return <p className="text-sm text-muted-foreground">{pick('শিক্ষার্থী পাওয়া যায়নি।', 'Student was not found.')}</p>;
  }

  const enrollments = db.enrollments.filter((item) => item.studentId === student.id);
  const guardians = db.parentStudents
    .filter((link) => link.studentId === student.id)
    .map((link) => ({ link, parent: db.parents.find((item) => item.id === link.parentId) }));
  const cards = db.rfidCards.filter((item) => item.studentId === student.id);
  const certificates = db.transferCertificates.filter((item) => item.studentId === student.id);

  const begin = () => {
    setForm({
      nameEn: student.nameEn,
      nameBn: student.nameBn ?? '',
      dateOfBirth: student.dateOfBirth ?? '',
      gender: student.gender,
      bloodGroup: student.bloodGroup ?? undefined,
      religion: student.religion ?? undefined,
      birthCertificateNo: student.birthCertificateNo ?? '',
      boardRegistrationNo: student.boardRegistrationNo ?? '',
      presentAddress: student.presentAddress ?? '',
      permanentAddress: student.permanentAddress ?? '',
      previousSchoolName: student.previousSchoolName ?? '',
      status: student.status === StudentStatus.TRANSFERRED || student.status === StudentStatus.GRADUATED ? student.status : student.status,
    });
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await updateStudent({
        id: student.id,
        nameEn: form.nameEn,
        nameBn: form.nameBn,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        bloodGroup: form.bloodGroup || null,
        religion: form.religion || null,
        birthCertificateNo: form.birthCertificateNo,
        boardRegistrationNo: form.boardRegistrationNo,
        presentAddress: form.presentAddress,
        permanentAddress: form.permanentAddress,
        previousSchoolName: form.previousSchoolName,
        status: form.status === StudentStatus.INACTIVE ? StudentStatus.INACTIVE : StudentStatus.ACTIVE,
      }).unwrap();
      toast.success(pick('প্রোফাইল হালনাগাদ হয়েছে।', 'Profile updated.'));
      setOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, pick('হালনাগাদ হয়নি।', 'Could not update the profile.')));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{student.nameBn || student.nameEn}</h2>
          <p className="text-sm text-muted-foreground">
            {student.nameEn} · <span className="font-mono">{student.studentId}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <StatusBadge enumName="StudentStatus" value={student.status} />
          <Button size="sm" variant="outline" onClick={begin}>
            {pick('সম্পাদনা', 'Edit')}
          </Button>
          <Link href="/admin/students">
            <Button size="sm" variant="ghost">
              {pick('তালিকায়', 'Back to list')}
            </Button>
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-1 text-sm">
          <p className="font-semibold">{pick('ব্যক্তিগত', 'Personal')}</p>
          <p>{pick('জন্ম', 'Born')}: {student.dateOfBirth || '—'}</p>
          <p>{pick('জন্ম সনদ', 'Birth certificate')}: {student.birthCertificateNo || '—'}</p>
          <p>{pick('বোর্ড রেজিস্ট্রেশন', 'Board registration')}: {student.boardRegistrationNo || '—'}</p>
          <p>{pick('রক্ত', 'Blood')}: {student.bloodGroup ? BLOOD_LABEL[student.bloodGroup] : '—'}</p>
          <p>{pick('ঠিকানা', 'Address')}: {student.presentAddress || '—'}</p>
          <p>{pick('পূর্বের বিদ্যালয়', 'Previous school')}: {student.previousSchoolName || '—'}</p>
        </Card>
        <Card className="p-4 space-y-2 text-sm">
          <p className="font-semibold">{pick('অভিভাবক', 'Guardians')}</p>
          {guardians.length === 0 && <p className="text-muted-foreground">{pick('সংযুক্ত নেই।', 'None linked.')}</p>}
          {guardians.map(({ link, parent }) => (
            <p key={link.id}>
              {parent?.nameBn || parent?.name} · {parent?.phone} · {link.relationship}
              {link.isSmsReceiver ? ' · SMS' : ''}
            </p>
          ))}
        </Card>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="p-3 text-left">{pick('শিক্ষাবর্ষ', 'Year')}</th>
              <th className="p-3 text-left">{pick('শ্রেণি', 'Class')}</th>
              <th className="p-3 text-left">{pick('শাখা', 'Section')}</th>
              <th className="p-3 text-left">{pick('রোল', 'Roll')}</th>
              <th className="p-3 text-left">{pick('অবস্থা', 'Status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {enrollments.map((item) => (
              <tr key={item.id}>
                <td className="p-3">{db.academicYears.find((year) => year.id === item.academicYearId)?.name}</td>
                <td className="p-3">{classLabel(db, item.classId, locale)}</td>
                <td className="p-3">{db.sections.find((section) => section.id === item.sectionId)?.name}</td>
                <td className="p-3 tabular-nums">{item.roll}</td>
                <td className="p-3"><StatusBadge enumName="EnrollmentStatus" value={item.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
        <Card className="p-4 space-y-1">
          <p className="font-semibold">{pick('পরিচয়পত্র', 'Identity cards')}</p>
          {cards.length === 0 && <p className="text-muted-foreground">{pick('কার্ড নেই।', 'No card.')}</p>}
          {cards.map((item) => (
            <p key={item.id} className="font-mono">
              {item.cardNumber} · {item.status}
            </p>
          ))}
        </Card>
        <Card className="p-4 space-y-1">
          <p className="font-semibold">{pick('ছাড়পত্র', 'Transfer certificates')}</p>
          {certificates.length === 0 && <p className="text-muted-foreground">{pick('নেই।', 'None.')}</p>}
          {certificates.map((item) => (
            <p key={item.id}>
              {item.tcNumber} · {item.issueDate}
            </p>
          ))}
        </Card>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={pick('প্রোফাইল সম্পাদনা', 'Edit profile')}>
        <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={pick('ইংরেজি নাম', 'Name in English')} required>
            <Input value={form.nameEn ?? ''} onChange={(event) => setForm({ ...form, nameEn: event.target.value })} />
          </FormField>
          <FormField label={pick('বাংলা নাম', 'Name in Bangla')}>
            <Input value={form.nameBn ?? ''} onChange={(event) => setForm({ ...form, nameBn: event.target.value })} />
          </FormField>
          <FormField label={pick('জন্ম তারিখ', 'Date of birth')}>
            <Input type="date" value={form.dateOfBirth ?? ''} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} />
          </FormField>
          <FormField label={pick('লিঙ্গ', 'Gender')}>
            <Select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value as Gender })}>
              <option value={Gender.MALE}>{pick('ছাত্র', 'Male')}</option>
              <option value={Gender.FEMALE}>{pick('ছাত্রী', 'Female')}</option>
            </Select>
          </FormField>
          <FormField label={pick('জন্ম সনদ', 'Birth certificate')}>
            <Input value={form.birthCertificateNo ?? ''} onChange={(event) => setForm({ ...form, birthCertificateNo: event.target.value })} />
          </FormField>
          <FormField label={pick('ঠিকানা', 'Address')}>
            <Textarea value={form.presentAddress ?? ''} onChange={(event) => setForm({ ...form, presentAddress: event.target.value })} />
          </FormField>
          {student.status !== StudentStatus.TRANSFERRED && student.status !== StudentStatus.GRADUATED && (
            <FormField label={pick('অবস্থা', 'Status')}>
              <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as StudentStatus })}>
                <option value={StudentStatus.ACTIVE}>{pick('সক্রিয়', 'Active')}</option>
                <option value={StudentStatus.INACTIVE}>{pick('নিষ্ক্রিয়', 'Inactive')}</option>
              </Select>
            </FormField>
          )}
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" variant="primary" disabled={isLoading}>
              {pick('সংরক্ষণ', 'Save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
