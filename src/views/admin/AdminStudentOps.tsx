'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useParams } from '@/src/lib/navigation';
import {
  useCreateStudentMutation,
  useGetBootstrapQuery,
  useImportStudentsMutation,
  useUpdateAdmissionStatusMutation,
} from '@/src/store/api';
import { useAcademicYearSelection } from '@/src/views/admin/AcademicFoundation';
import { StudentsShell } from '@/src/views/admin/StudentsShell';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { DataTable } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, FormField, Input, Modal, Select, Textarea } from '@/src/components/ui/primitives';
import { getEnumMeta } from '@/src/lib/constants/enums';
import {
  BloodGroup,
  Gender,
  Religion,
} from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';

import { StudentDirectory } from './students/StudentDirectory';
import { StudentProfile } from './students/StudentProfile';
import { StudentEnrollments } from './students/StudentEnrollments';
import { StudentPromotions } from './students/StudentPromotions';
import { StudentTransfers } from './students/StudentTransfers';
import { StudentRfidCards } from './students/StudentRfidCards';
import { classLabel, errorMessage, BLOOD_LABEL } from './students/studentShared';

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
      title: pick('শিক্ষার্থী ডিরেক্টরি', 'Student Directory'),
      description: pick(
        'নির্বাচিত শিক্ষাবর্ষের ভর্তি শিক্ষার্থী, শ্রেণি ও শাখাভিত্তিক তালিকা, উপস্থিতির হার এবং অভিভাবক যোগাযোগ।',
        'Enrolled student roster, class and section breakdown, attendance rates, and guardian contacts for the selected session.'
      ),
      year: true,
    },
    create: {
      title: pick('নতুন ভর্তি', 'New admission'),
      description: pick('স্কুলের ভর্তি ফরম: শিক্ষার্থী, পিতা-মাতা, তারপর আগের পড়াশোনা ও শ্রেণি।', 'The school admission form: the student, both parents, then previous study and class.'),
      year: false,
    },
    admissions: {
      title: pick('অনলাইন আবেদন', 'Online applications'),
      description: pick('আবেদন দেখে অনুমোদন, বাতিল, অথবা শাখা ও রোল দিয়ে ভর্তি।', 'Review an application, then approve, reject, or admit with a section and roll.'),
      year: true,
    },
    enrollments: {
      title: pick('এনরোলমেন্ট রেজিস্টার', 'Session Enrollments'),
      description: pick(
        'নির্বাচিত শিক্ষাবর্ষে প্রতিটি শিক্ষার্থীর শ্রেণি, শাখা, রোল, বিভাগ ও ঐচ্ছিক বিষয়ের তালিকা এবং চলতি সেশনের প্লেসমেন্ট সংশোধন।',
        'Class, section, roll, stream, and optional subject registry for the selected academic year.'
      ),
      year: true,
    },
    promotions: {
      title: pick('শ্রেণি উত্তরণ ও প্রমোশন', 'Class Promotion Console'),
      description: pick(
        'প্রকাশিত পরীক্ষার ফলাফল ও মেধাক্রম যাচাই করে পরবর্তী শিক্ষাবর্ষে উত্তীর্ণ, অকৃতকার্য (Retained) অথবা দশম শ্রেণি সমাপ্ত করুন।',
        'Promote, retain, or graduate students into the next academic year with published exam result guidance.'
      ),
      year: true,
    },
    transfers: {
      title: pick('ছাড়পত্র (TC) রেজিস্টার', 'Transfer Certificates'),
      description: pick(
        'অফিসিয়াল ছাড়পত্র ইস্যু, প্রিন্ট ও বকেয়া নিষ্পত্তি। টিসি ইস্যু হলে শিক্ষার্থীর চলতি ভর্তি ও সক্রিয় RFID কার্ড স্বয়ংক্রিয়ভাবে বন্ধ হয়।',
        'Issue and print official Transfer Certificates. Issuing a TC closes active enrollment and auto-blocks active RFID cards.'
      ),
      year: false,
    },
    cards: {
      title: pick('RFID ও পরিচয়পত্র ডেস্ক', 'Identity & RFID Cards'),
      description: pick(
        'সক্রিয় শিক্ষার্থীদের স্মার্ট কার্ড ইস্যু, হারানো/ক্ষতিগ্রস্ত কার্ড রিপ্লেসমেন্ট, স্ট্যাটাস নিয়ন্ত্রণ এবং ব্যাচ প্রিন্ট। (হাজিরা গেট পাতা থেকে নেওয়া হয়)',
        'Issue smart RFID cards, track unassigned students, replace lost or damaged cards, and print ID sheets. Attendance scanning is handled separately.'
      ),
      year: false,
    },
    import: {
      title: pick('CSV আমদানি', 'CSV import'),
      description: pick('ফাইল মিলিয়ে দেখে, তারপর শুধু সঠিক সারি ভর্তি হয়।', 'Check the file, then only valid rows are admitted.'),
      year: true,
    },
    profile: {
      title: pick('শিক্ষার্থীর প্রোফাইল', 'Student Profile'),
      description: pick(
        'শিক্ষার্থীর পূর্ণাঙ্গ একাডেমিক ও ব্যক্তিগত নথি, উপস্থিতি বিশ্লেষণ, পরীক্ষার ফলাফল এবং অভিভাবক তথ্য।',
        'Complete academic and personal dossier, attendance record, exam results, and guardian contacts.'
      ),
      year: true,
    },
  };

  const page = copy[section];
  const headerActions =
    section === 'directory' ? (
      <>
        <Link href="/admin/students/import">
          <Button variant="outline" size="sm">
            {pick('CSV আমদানি', 'CSV import')}
          </Button>
        </Link>
        <Link href="/admin/students/create">
          <Button variant="primary" size="sm">
            {pick('নতুন ভর্তি', 'New admission')}
          </Button>
        </Link>
      </>
    ) : undefined;

  return (
    <StudentsShell
      title={page.title}
      description={page.description}
      actions={headerActions}
      years={db.academicYears}
      selectedYear={year}
      showYear={page.year}
    >
      {section === 'directory' && <StudentDirectory db={db} yearId={year.id} />}
      {section === 'create' && <Register db={db} yearId={year.id} />}
      {section === 'admissions' && <Admissions db={db} yearId={year.id} />}
      {section === 'enrollments' && <StudentEnrollments db={db} yearId={year.id} />}
      {section === 'promotions' && <StudentPromotions db={db} yearId={year.id} />}
      {section === 'transfers' && <StudentTransfers db={db} />}
      {section === 'cards' && <StudentRfidCards db={db} />}
      {section === 'import' && <Importer db={db} yearId={year.id} />}
      {section === 'profile' && <StudentProfile db={db} studentId={id ?? ''} yearId={year.id} startEditing={pathname.endsWith('/edit')} />}
    </StudentsShell>
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
    fatherNameEn: '',
    fatherNameBn: '',
    fatherOccupation: '',
    fatherNid: '',
    guardianPhone: '',
    motherNameEn: '',
    motherNameBn: '',
    motherOccupation: '',
    motherNid: '',
    motherPhone: '',
    previousSchoolName: '',
    previousSchoolAddress: '',
    previousGrade: '',
    prevExamPassingYear: '',
    prevExamRoll: '',
    prevExamRegistration: '',
    prevExamGpa: '',
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

  const phoneOk = (value: string) => /^(\+?88)?01[3-9]\d{8}$/.test(value.trim());

  const next = () => {
    if (step === 1) {
      if (!form.nameBn.trim() || !form.nameEn.trim() || !form.dateOfBirth) {
        toast.error(pick('নাম ও জন্ম তারিখ আবশ্যক।', 'Name and date of birth are required.'));
        return;
      }
      if (!/^\d{17}$/.test(form.birthCertificateNo.trim())) {
        toast.error(pick('১৭ ডিজিটের জন্ম সনদ দিন।', 'Enter the 17-digit birth certificate.'));
        return;
      }
    }
    if (step === 2) {
      if (!form.fatherNameBn.trim() || !form.fatherNameEn.trim() || !form.motherNameBn.trim() || !form.motherNameEn.trim()) {
        toast.error(pick('পিতা ও মাতার নাম আবশ্যক।', 'Father and mother names are required.'));
        return;
      }
      if (!phoneOk(form.guardianPhone)) {
        toast.error(pick('অভিভাবকের মোবাইল সঠিক নয়।', 'Guardian phone is not valid.'));
        return;
      }
      if (form.motherPhone.trim() && !phoneOk(form.motherPhone)) {
        toast.error(pick('মাতার মোবাইল সঠিক নয়।', 'Mother’s phone is not valid.'));
        return;
      }
      if (form.presentAddress.trim().length < 5 || form.permanentAddress.trim().length < 5) {
        toast.error(pick('বর্তমান ও স্থায়ী ঠিকানা দিন।', 'Present and permanent addresses are required.'));
        return;
      }
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
        bloodGroup: form.bloodGroup || null,
        prevExamPassingYear: form.prevExamPassingYear ? Number(form.prevExamPassingYear) : null,
        prevExamGpa: form.prevExamGpa ? Number(form.prevExamGpa) : null,
      }).unwrap();
      toast.success(pick('শিক্ষার্থী ভর্তি হয়েছে।', 'Student admitted.'));
      setStep(1);
      set({
        nameEn: '',
        nameBn: '',
        birthCertificateNo: '',
        boardRegistrationNo: '',
        fatherNameEn: '',
        fatherNameBn: '',
        motherNameEn: '',
        motherNameBn: '',
        guardianPhone: '',
        motherPhone: '',
        roll: '',
      });
    } catch (err) {
      toast.error(errorMessage(err, pick('ভর্তি হয়নি।', 'Admission failed.')));
    }
  };

  const steps = [
    pick('শিক্ষার্থী', 'Student'),
    pick('পিতা-মাতা ও ঠিকানা', 'Parents & address'),
    pick('পূর্বের পড়াশোনা ও শ্রেণি', 'Previous study & class'),
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
            <FormField label={pick('০১. শিক্ষার্থীর নাম (বাংলায়)', '01. Student name in Bangla')} required>
              <Input value={form.nameBn} onChange={(event) => set({ nameBn: event.target.value })} />
            </FormField>
            <FormField label={pick('০১. শিক্ষার্থীর নাম (ইংরেজিতে)', '01. Student name in English')} required>
              <Input value={form.nameEn} onChange={(event) => set({ nameEn: event.target.value })} />
            </FormField>
            <FormField label={pick('০৫. জন্ম তারিখ', '05. Date of birth')} required>
              <Input type="date" value={form.dateOfBirth} onChange={(event) => set({ dateOfBirth: event.target.value })} />
            </FormField>
            <FormField label={pick('লিঙ্গ', 'Gender')} required>
              <Select value={form.gender} onChange={(event) => set({ gender: event.target.value })}>
                <option value={Gender.MALE}>{pick('ছাত্র', 'Male')}</option>
                <option value={Gender.FEMALE}>{pick('ছাত্রী', 'Female')}</option>
              </Select>
            </FormField>
            <FormField label={pick('০৬. ১৭ ডিজিটের জন্ম সনদ', '06. 17-digit birth certificate')} required>
              <Input inputMode="numeric" maxLength={17} value={form.birthCertificateNo} onChange={(event) => set({ birthCertificateNo: event.target.value.replace(/\D/g, '').slice(0, 17) })} />
            </FormField>
            <FormField label={pick('০৭. ধর্ম', '07. Religion')} required>
              <Select value={form.religion} onChange={(event) => set({ religion: event.target.value })}>
                {Object.values(Religion).map((value) => (
                  <option key={value} value={value}>
                    {locale === 'bn' ? getEnumMeta('Religion', value).bn : getEnumMeta('Religion', value).en}
                  </option>
                ))}
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
            <FormField label={pick('বোর্ড রেজিস্ট্রেশন', 'Board registration')}>
              <Input value={form.boardRegistrationNo} onChange={(event) => set({ boardRegistrationNo: event.target.value })} />
            </FormField>
          </div>
        )}
        {step === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={pick('০২. পিতার নাম (বাংলায়)', '02. Father’s name in Bangla')} required>
              <Input value={form.fatherNameBn} onChange={(event) => set({ fatherNameBn: event.target.value })} />
            </FormField>
            <FormField label={pick('পিতার নাম (ইংরেজিতে)', 'Father’s name in English')} required>
              <Input value={form.fatherNameEn} onChange={(event) => set({ fatherNameEn: event.target.value })} />
            </FormField>
            <FormField label={pick('পিতার পেশা', 'Father’s occupation')}>
              <Input value={form.fatherOccupation} onChange={(event) => set({ fatherOccupation: event.target.value })} />
            </FormField>
            <FormField label={pick('পিতার এনআইডি', 'Father’s NID')}>
              <Input value={form.fatherNid} onChange={(event) => set({ fatherNid: event.target.value })} />
            </FormField>
            <FormField label={pick('অভিভাবকের মোবাইল', 'Guardian mobile')} required>
              <Input value={form.guardianPhone} onChange={(event) => set({ guardianPhone: event.target.value })} placeholder="01XXXXXXXXX" />
            </FormField>
            <FormField label={pick('০৩. মাতার নাম (বাংলায়)', '03. Mother’s name in Bangla')} required>
              <Input value={form.motherNameBn} onChange={(event) => set({ motherNameBn: event.target.value })} />
            </FormField>
            <FormField label={pick('মাতার নাম (ইংরেজিতে)', 'Mother’s name in English')} required>
              <Input value={form.motherNameEn} onChange={(event) => set({ motherNameEn: event.target.value })} />
            </FormField>
            <FormField label={pick('মাতার পেশা', 'Mother’s occupation')}>
              <Input value={form.motherOccupation} onChange={(event) => set({ motherOccupation: event.target.value })} />
            </FormField>
            <FormField label={pick('মাতার এনআইডি', 'Mother’s NID')}>
              <Input value={form.motherNid} onChange={(event) => set({ motherNid: event.target.value })} />
            </FormField>
            <FormField label={pick('মাতার মোবাইল', 'Mother’s mobile')}>
              <Input value={form.motherPhone} onChange={(event) => set({ motherPhone: event.target.value })} placeholder="01XXXXXXXXX" />
            </FormField>
            <FormField label={pick('০৪. বর্তমান ঠিকানা', '04. Present address')} required>
              <Textarea value={form.presentAddress} onChange={(event) => set({ presentAddress: event.target.value })} />
            </FormField>
            <FormField label={pick('০৪. স্থায়ী ঠিকানা', '04. Permanent address')} required>
              <Textarea value={form.permanentAddress} onChange={(event) => set({ permanentAddress: event.target.value })} />
            </FormField>
          </div>
        )}
        {step === 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={pick('০৯. পূর্বের বিদ্যালয়', '09. Previous school')}>
              <Input value={form.previousSchoolName} onChange={(event) => set({ previousSchoolName: event.target.value })} />
            </FormField>
            <FormField label={pick('পূর্বের বিদ্যালয়ের ঠিকানা', 'Previous school address')}>
              <Input value={form.previousSchoolAddress} onChange={(event) => set({ previousSchoolAddress: event.target.value })} />
            </FormField>
            <FormField label={pick('পূর্বের শ্রেণি ও গ্রেড', 'Previous class and grade')}>
              <Input value={form.previousGrade} onChange={(event) => set({ previousGrade: event.target.value })} />
            </FormField>
            <FormField label={pick('০৮. পিএসসি / জেএসসি পাসের সন', '08. PSC / JSC passing year')}>
              <Input type="number" min={1990} max={2100} value={form.prevExamPassingYear} onChange={(event) => set({ prevExamPassingYear: event.target.value })} />
            </FormField>
            <FormField label={pick('পূর্বের পরীক্ষার রোল', 'Previous exam roll')}>
              <Input value={form.prevExamRoll} onChange={(event) => set({ prevExamRoll: event.target.value })} />
            </FormField>
            <FormField label={pick('পূর্বের রেজিস্ট্রেশন', 'Previous registration')}>
              <Input value={form.prevExamRegistration} onChange={(event) => set({ prevExamRegistration: event.target.value })} />
            </FormField>
            <FormField label={pick('পূর্বের জিপিএ', 'Previous GPA')}>
              <Input type="number" min={0} max={5} step="0.01" value={form.prevExamGpa} onChange={(event) => set({ prevExamGpa: event.target.value })} />
            </FormField>
            <FormField label={pick('১০. ভর্তির ধরন', '10. Admission type')}>
              <Select value={form.isReadmission ? 'READMIT' : 'NEW'} onChange={(event) => set({ isReadmission: event.target.value === 'READMIT' })}>
                <option value="NEW">{pick('নতুন ভর্তি', 'New admission')}</option>
                <option value="READMIT">{pick('পুনঃভর্তি', 'Readmission')}</option>
              </Select>
            </FormField>
            <FormField label={pick('শিক্ষাবর্ষ', 'Academic year')}>
              <Select value={form.academicYearId} onChange={(event) => set({ academicYearId: event.target.value })}>
                {db.academicYears.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={pick('১১. ভর্তিচ্ছু শ্রেণি', '11. Class')}>
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
              <FormField label={pick('১২. বিভাগ', '12. Stream')} required>
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
            <FormField label={pick('১৩. ৪র্থ বিষয় (ঐচ্ছিক)', '13. Fourth / optional subject')}>
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
          </div>
        )}
        <div className="flex justify-between pt-3 border-t border-border">
          <Button type="button" variant="outline" disabled={step === 1} onClick={() => setStep((value) => value - 1)}>
            {pick('পূর্ববর্তী', 'Back')}
          </Button>
          {step < 3 ? (
            <Button type="button" variant="primary" onClick={next}>
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
