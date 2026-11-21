'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  GraduationCap,
  Heart,
  IdCard,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Printer,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
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
import { LoadingSkeleton, SchoolEmblem, StatCard } from '@/src/components/shared/Feedback';
import { DataTable } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { PrintableTransferCertificate } from '@/src/components/print/PrintDocuments';
import { Button, Card, FormField, Input, Modal, Select, Textarea } from '@/src/components/ui/primitives';
import { getEnumMeta } from '@/src/lib/constants/enums';
import { closedDay, latestOpenDay, localToday } from '@/src/lib/schoolDay';
import {
  AttendanceMethod,
  AttendanceStatus,
  BloodGroup,
  CardStatus,
  EnrollmentStatus,
  Gender,
  PromotionType,
  Religion,
  StudentStatus,
} from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import type { Attendance, Student, StudentEnrollment } from '@/src/types/entities';

import { StudentDirectory } from './students/StudentDirectory';
import { StudentProfile } from './students/StudentProfile';
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
      title: pick('শিক্ষার্থী ডিরেক্টরি', 'Student directory'),
      description: pick('এই শিক্ষাবর্ষের সারাংশ ও তালিকা। চোখের আইকনে ফাইল খোলে।', 'This year’s summary and list. The eye icon opens the file.'),
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
      title: pick('শিক্ষার্থীর ফাইল', 'Student file'),
      description: pick('পরিচয়, এই বছরের হাজিরা, অভিভাবক ও কার্ড। হাজিরা এখান থেকে লেখা হয় না।', 'Identity, this year’s attendance, guardian, and card. Attendance is not marked here.'),
      year: true,
    },
  };

  const page = copy[section];
  return (
    <StudentsShell title={page.title} description={page.description} years={db.academicYears} selectedYear={year} showYear={page.year}>
      {section === 'directory' && <StudentDirectory db={db} yearId={year.id} />}
      {section === 'create' && <Register db={db} yearId={year.id} />}
      {section === 'admissions' && <Admissions db={db} yearId={year.id} />}
      {section === 'enrollments' && <Enrollments db={db} yearId={year.id} />}
      {section === 'promotions' && <Promotions db={db} yearId={year.id} />}
      {section === 'transfers' && <Transfers db={db} />}
      {section === 'cards' && <Cards db={db} />}
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

const WEEKDAYS = [
  { bn: 'রবি', en: 'Sun' },
  { bn: 'সোম', en: 'Mon' },
  { bn: 'মঙ্গল', en: 'Tue' },
  { bn: 'বুধ', en: 'Wed' },
  { bn: 'বৃহ', en: 'Thu' },
  { bn: 'শুক্র', en: 'Fri' },
  { bn: 'শনি', en: 'Sat' },
];

function monthCells(month: string) {
  const [year, mon] = month.split('-').map(Number);
  if (!year || !mon) return [];
  const pad = new Date(year, mon - 1, 1).getDay();
  const count = new Date(year, mon, 0).getDate();
  const cells: ({ date: string; day: number } | null)[] = Array.from({ length: pad }, () => null);
  for (let day = 1; day <= count; day += 1) {
    cells.push({
      date: `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      day,
    });
  }
  return cells;
}

function dayTone(status?: AttendanceStatus) {
  if (status === AttendanceStatus.PRESENT) return 'bg-success/15 text-success border-success/30';
  if (status === AttendanceStatus.LATE) return 'bg-warning/20 text-warning border-warning/40';
  if (status === AttendanceStatus.ABSENT) return 'bg-destructive/15 text-destructive border-destructive/30';
  if (status === AttendanceStatus.LEAVE) return 'bg-info/15 text-info border-info/30';
  return '';
}

function AttendanceMonth({
  month,
  marks,
  closedOn,
  picked,
  onPick,
}: {
  month: string;
  marks: Attendance[];
  closedOn: (date: string) => string;
  picked: string | null;
  onPick: (date: string) => void;
}) {
  const { locale, pick } = useI18n();
  const today = localToday();
  const byDate = new Map(marks.map((item) => [item.date, item]));
  const chosen = picked ? byDate.get(picked) : undefined;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <div key={day.en}>{locale === 'bn' ? day.bn : day.en}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {monthCells(month).map((cell, index) => {
          if (!cell) return <div key={`pad-${index}`} />;
          const mark = byDate.get(cell.date);
          const closed = closedOn(cell.date);
          const tone = dayTone(mark?.status);
          const quiet = !mark && (Boolean(closed) || cell.date > today);
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onPick(cell.date)}
              className={`h-11 rounded-md border text-sm tabular-nums cursor-pointer ${
                tone || (quiet ? 'border-transparent bg-surface-muted text-muted-foreground' : 'border-border bg-surface')
              } ${picked === cell.date ? 'ring-2 ring-primary' : ''} ${cell.date === today ? 'font-bold' : ''}`}
            >
              {formatNumber(cell.day, locale)}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-success/60" />{pick('উপস্থিত', 'Present')}</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-warning/70" />{pick('দেরি', 'Late')}</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-destructive/60" />{pick('অনুপস্থিত', 'Absent')}</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-info/60" />{pick('ছুটি', 'Leave')}</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-surface-muted border border-border" />{pick('বন্ধ', 'Closed')}</span>
      </div>
      <p className="text-sm">
        {picked
          ? <>
              {formatDateShort(`${picked}T12:00:00`, locale)}
              {' · '}
              {chosen ? <StatusBadge enumName="AttendanceStatus" value={chosen.status} /> : closedOn(picked) || pick('এই দিনে হাজিরা নেই।', 'No attendance on this day.')}
              {chosen?.inTime ? ` · ${chosen.inTime.slice(11, 16)}` : ''}
            </>
          : pick('একটা দিন চাপলে সেই দিনের হাজিরা এখানে দেখা যাবে।', 'Press a day to see that day’s attendance.')}
      </p>
    </div>
  );
}

function getStudentAge(dob?: string | null, locale = 'bn') {
  if (!dob) return '—';
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return '—';
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  if (locale === 'bn') {
    return `${formatNumber(years, 'bn')} বছর ${formatNumber(months, 'bn')} মাস`;
  }
  return `${years} yrs ${months} mos`;
}
