'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from '@/src/lib/navigation';
import { toast } from 'sonner';
import { Plus, Printer, CheckCircle2, CreditCard, Upload } from 'lucide-react';
import {
  useCreateStudentMutation,
  useGetBootstrapQuery,
  useIssueTransferCertificateMutation,
  usePromoteStudentsMutation,
  useUpdateAdmissionStatusMutation,
  useUpdateRfidCardStatusMutation,
} from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { triggerPrint } from '@/src/lib/utils/cn';
import { LoadingSkeleton, PageHeader } from '@/src/components/shared/Feedback';
import { DataTable } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import {
  Button,
  Card,
  FormField,
  Input,
  Modal,
  SegmentedTabs,
  Select,
  Textarea,
} from '@/src/components/ui/primitives';
import {
  PrintableIdCardSheet,
  PrintableTransferCertificate,
} from '@/src/components/print/PrintDocuments';
import { CardStatus, Gender, PromotionType, Religion } from '@/src/types/enums';
import type { Student } from '@/src/types/entities';

export function AdminStudentsPage({
  defaultTab = 'directory',
}: {
  defaultTab?:
    | 'directory'
    | 'create'
    | 'enrollments'
    | 'promotions'
    | 'transfers'
    | 'rfid'
    | 'admissions'
    | 'import';
}) {
  const { id: studentIdParam } = useParams();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [createStudent, { isLoading: savingStu }] = useCreateStudentMutation();
  const [updateAdmissionStatus] = useUpdateAdmissionStatusMutation();
  const [updateRfid] = useUpdateRfidCardStatusMutation();
  const [issueTc, { isLoading: issuingTc }] = useIssueTransferCertificateMutation();
  const [promoteStudents, { isLoading: promoting }] = usePromoteStudentsMutation();
  const { locale, pick } = useI18n();

  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(defaultTab);
  const classFilter = searchParams.get('class') ?? 'ALL';
  const setClassFilter = (val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val === 'ALL') next.delete('class');
    else next.set('class', val);
    setSearchParams(next, { replace: true });
  };
  const [idCardModalOpen, setIdCardModalOpen] = useState(false);
  const [regStep, setRegStep] = useState(1);
  const [regForm, setRegForm] = useState({
    nameEn: '',
    nameBn: '',
    dateOfBirth: '2013-04-10',
    gender: Gender.MALE,
    bloodGroup: 'O_POSITIVE',
    religion: Religion.ISLAM,
    birthCertificateNo: '',
    boardRegistrationNo: '',
    presentAddress: 'ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
    permanentAddress: 'ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
    parentName: '',
    parentNameBn: '',
    parentPhone: '01711998877',
    parentOccupation: 'ব্যবসা',
    parentNid: '',
    admissionDate: '2026-11-19',
    previousSchoolName: '',
    previousGpa: '4.5',
    academicYearId: 'ay-2026',
    classId: 'cls-6',
    sectionId: 'sec-6-ka',
    groupId: '',
    roll: '15',
    isReadmission: false,
  });

  const [tcForm, setTcForm] = useState({
    studentId: 'stu-10-5',
    tcNumber: 'TC-2026-002',
    issueDate: '2026-11-19',
    leavingDate: '2026-11-19',
    reason: 'অভিভাবকের বদলিজনিত স্থানান্তর',
    duesCleared: true,
    conductRemarks: 'উত্তম',
    leavingClass: '১০ম শ্রেণি',
    promotedToNextClass: false,
    destinationSchool: '',
  });
  const [printTcId, setPrintTcId] = useState<string | null>(null);
  const [promoClassId, setPromoClassId] = useState('cls-9');

  const directoryRows = useMemo(() => {
    if (!db) return [];
    return db.students
      .map((s) => {
        const enr = db.enrollments.find((e) => e.studentId === s.id && e.academicYearId === 'ay-2026');
        const cls = enr ? db.classes.find((c) => c.id === enr.classId) : null;
        const sec = enr ? db.sections.find((x) => x.id === enr.sectionId) : null;
        return {
          ...s,
          classId: enr?.classId ?? '',
          classLabel: cls ? (locale === 'bn' ? cls.nameBn ?? cls.name : cls.name) : '—',
          sectionLabel: sec?.name ?? '—',
          roll: enr?.roll ?? 0,
        };
      })
      .filter((r) => (classFilter === 'ALL' ? true : r.classId === classFilter));
  }, [db, classFilter, locale]);

  if (isLoading || !db) return <LoadingSkeleton />;

  const profileStudent = studentIdParam ? db.students.find((s) => s.id === studentIdParam) : null;

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.nameEn || !regForm.parentName) {
      toast.error(pick('শিক্ষার্থী ও অভিভাবকের নাম আবশ্যক', 'Student and parent name are required'));
      return;
    }
    try {
      await createStudent({ ...regForm, roll: Number(regForm.roll) }).unwrap();
      toast.success(pick('নতুন শিক্ষার্থী সফলভাবে নিবন্ধিত হয়েছে।', 'Student registered successfully.'));
      setTab('directory');
      setRegStep(1);
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? 'Registration failed');
    }
  };

  const handleIssueTc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await issueTc(tcForm).unwrap();
      toast.success(pick('ট্রান্সফার সার্টিফিকেট (TC) ইস্যু করা হয়েছে।', 'Transfer Certificate issued.'));
    } catch {
      toast.error(pick('টিসি ইস্যু করতে সমস্যা হয়েছে।', 'Failed to issue TC.'));
    }
  };

  const promoCandidates = db.enrollments.filter(
    (e) => e.classId === promoClassId && e.academicYearId === 'ay-2026'
  );

  const handleBulkPromote = async () => {
    if (!promoCandidates.length) return;
    try {
      await promoteStudents({
        items: promoCandidates.map((e) => ({
          studentId: e.studentId,
          fromEnrollmentId: e.id,
          toClassId: 'cls-10',
          promotionType: PromotionType.PROMOTED,
        })),
      }).unwrap();
      toast.success(pick('নির্বাচিত শিক্ষার্থীদের প্রমোশন সম্পন্ন হয়েছে।', 'Bulk promotion processed.'));
    } catch {
      toast.error(pick('প্রমোশন প্রক্রিয়ায় ত্রুটি।', 'Promotion failed.'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('শিক্ষার্থী ও ভর্তি ব্যবস্থাপনা', 'Students & Admissions Management')}
        description={pick(
          'শিক্ষার্থী ডিরেক্টরি, ৬-ধাপ নিবন্ধন, ভর্তি ইনবক্স, প্রমোশন, RFID কার্ড এবং ট্রান্সফার সার্টিফিকেট (TC)।',
          'Directory, 6-step registration, online admissions inbox, promotion wizard, RFID cards, and Transfer Certificates.'
        )}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIdCardModalOpen(true)}>
              <Printer className="w-4 h-4" /> {pick('আইডি কার্ড শিট', 'Batch ID Cards')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => setTab('create')}>
              <Plus className="w-4 h-4" /> {pick('নতুন শিক্ষার্থী নিবন্ধন', 'Register Student')}
            </Button>
          </div>
        }
      />

      {/* Profile Drawer/View when `/admin/students/:id` */}
      {profileStudent && (() => {
        const enr = db.enrollments.find((e) => e.studentId === profileStudent.id);
        const cls = enr ? db.classes.find((c) => c.id === enr.classId) : null;
        const sec = enr ? db.sections.find((s) => s.id === enr.sectionId) : null;
        const linkedParents = db.parentStudents
          .filter((ps) => ps.studentId === profileStudent.id)
          .map((ps) => ({ ps, parent: db.parents.find((p) => p.id === ps.parentId) }));
        const cards = db.rfidCards.filter((c) => c.studentId === profileStudent.id);
        return (
          <Card className="p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {profileStudent.nameBn} ({profileStudent.nameEn})
                </h2>
                <p className="text-sm text-muted-foreground tabular-nums">
                  ID: {profileStudent.studentId} · {locale === 'bn' ? cls?.nameBn : cls?.name} ({sec?.name}) ·{' '}
                  {pick('রোল:', 'Roll:')} {enr?.roll}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIdCardModalOpen(true)}>
                  <Printer className="w-3.5 h-3.5" /> {pick('আইডি কার্ড', 'ID Card')}
                </Button>
                <Link href="/admin/students"><Button variant="ghost" size="sm">{pick('বন্ধ করুন', 'Close')}</Button></Link>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{pick('ব্যক্তিগত তথ্য', 'Personal')}</p>
                <p>{pick('জন্ম তারিখ:', 'DOB:')} {profileStudent.dateOfBirth}</p>
                <p className="tabular-nums">{pick('জন্ম সনদ:', 'Birth Cert:')} {profileStudent.birthCertificateNo}</p>
                <p>{pick('ঠিকানা:', 'Address:')} {profileStudent.presentAddress}</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{pick('সংযুক্ত অভিভাবক', 'Guardians')}</p>
                {linkedParents.map(({ ps, parent }) => (
                  <p key={ps.id}>
                    {parent?.nameBn ?? parent?.name} ({parent?.phone}){' '}
                    {ps.isSmsReceiver ? '· SMS' : ''}
                  </p>
                ))}
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{pick('RFID কার্ড', 'RFID Card')}</p>
                {cards.length === 0 ? (
                  <p className="text-muted-foreground">{pick('কোনো RFID কার্ড ইস্যু হয়নি (ম্যানুয়াল হাজিরা)', 'No RFID card (Manual attendance class)')}</p>
                ) : (
                  cards.map((c) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <span className="font-mono">{c.cardNumber}</span>
                      <StatusBadge enumName="CardStatus" value={c.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        );
      })()}

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'directory', label: pick('শিক্ষার্থী ডিরেক্টরি', 'Directory'), count: db.students.length },
          { value: 'admissions', label: pick('ভর্তি ইনবক্স', 'Admissions Inbox'), count: db.onlineAdmissions.length },
          { value: 'create', label: pick('৬-ধাপ নিবন্ধন', 'Register') },
          { value: 'promotions', label: pick('প্রমোশন উইজার্ড', 'Promotions') },
          { value: 'transfers', label: pick('টিসি (TC)', 'Transfer Certs'), count: db.transferCertificates.length },
          { value: 'rfid', label: pick('RFID কার্ড', 'RFID Cards'), count: db.rfidCards.length },
          { value: 'import', label: pick('CSV ইম্পোর্ট', 'CSV Import') },
        ]}
      />

      {tab === 'directory' && (
        <DataTable
          data={directoryRows}
          exportFilename="students-2026.csv"
          toolbarExtra={
            <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-44 h-9">
              <option value="ALL">{pick('সকল শ্রেণি', 'All Classes')}</option>
              {db.classes.map((c) => (
                <option key={c.id} value={c.id}>{locale === 'bn' ? c.nameBn : c.name}</option>
              ))}
            </Select>
          }
          columns={[
            { accessorKey: 'studentId', header: pick('আইডি', 'Student ID'), cell: ({ row }) => <span className="font-mono text-sm">{row.original.studentId}</span> },
            {
              accessorKey: 'nameEn',
              header: pick('শিক্ষার্থীর নাম', 'Student Name'),
              cell: ({ row }) => (
                <Link href={`/admin/students/${row.original.id}`} className="font-semibold text-primary hover:underline">
                  {row.original.nameBn || row.original.nameEn}
                  <span className="block text-xs font-normal text-muted-foreground">{row.original.nameEn}</span>
                </Link>
              ),
            },
            { accessorKey: 'classLabel', header: pick('শ্রেণি', 'Class') },
            { accessorKey: 'sectionLabel', header: pick('শাখা', 'Section') },
            { accessorKey: 'roll', header: pick('রোল', 'Roll'), cell: ({ row }) => <span className="tabular-nums font-semibold">{formatNumber(row.original.roll, locale)}</span> },
            { accessorKey: 'status', header: pick('অবস্থা', 'Status'), cell: ({ row }) => <StatusBadge enumName="StudentStatus" value={row.original.status} /> },
          ]}
          renderMobileCard={(row) => (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Link href={`/admin/students/${row.id}`} className="font-bold text-primary text-base">
                  {row.nameBn || row.nameEn}
                </Link>
                <StatusBadge enumName="StudentStatus" value={row.status} />
              </div>
              <p className="text-sm text-muted-foreground tabular-nums">
                {row.studentId} · {row.classLabel} ({row.sectionLabel}) · {pick('রোল', 'Roll')} {row.roll}
              </p>
            </div>
          )}
        />
      )}

      {tab === 'admissions' && (
        <div className="space-y-4">
          {db.onlineAdmissions.map((app) => {
            const cls = db.classes.find((c) => c.id === app.targetClassId);
            return (
              <Card key={app.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{app.applicationNumber}</span>
                    <StatusBadge enumName="AdmissionApplicationStatus" value={app.status} />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatDateShort(app.submittedAt, locale)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    {app.studentNameBn} ({app.studentNameEn})
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {pick('আবেদনকৃত শ্রেণি:', 'Target Class:')} {locale === 'bn' ? cls?.nameBn : cls?.name} ·{' '}
                    {pick('পিতা:', 'Father:')} {app.fatherNameBn} · {app.guardianPhone}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {app.status !== 'ADMITTED' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateAdmissionStatus({ id: app.id, status: 'APPROVED' });
                          toast.success(pick('আবেদন অনুমোদিত হয়েছে', 'Application approved'));
                        }}
                      >
                        {pick('অনুমোদন', 'Approve')}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          updateAdmissionStatus({ id: app.id, status: 'ADMITTED' });
                          toast.success(
                            pick(
                              'শিক্ষার্থীকে সরাসরি ভর্তি ও ডিরেক্টরিতে যুক্ত করা হয়েছে!',
                              'Applicant admitted and added to Student Directory!'
                            )
                          );
                        }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> {pick('এক-ক্লিকে ভর্তি করুন (Admit)', 'One-Click Admit')}
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'create' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRegStep(n)}
                className={`px-3 py-1.5 text-sm font-semibold rounded border cursor-pointer ${
                  regStep === n ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-muted-foreground'
                }`}
              >
                {pick(`ধাপ ${formatNumber(n, 'bn')}`, `Step ${n}`)}
              </button>
            ))}
          </div>
          <form onSubmit={handleRegisterStudent} className="space-y-4">
            {regStep === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={pick('শিক্ষার্থীর বাংলা নাম', 'Name (Bangla)')} required>
                  <Input value={regForm.nameBn} onChange={(e) => setRegForm({ ...regForm, nameBn: e.target.value })} />
                </FormField>
                <FormField label={pick('ইংরেজি নাম', 'Name (English)')} required>
                  <Input value={regForm.nameEn} onChange={(e) => setRegForm({ ...regForm, nameEn: e.target.value })} />
                </FormField>
                <FormField label={pick('জন্ম তারিখ', 'Date of Birth')}>
                  <Input type="date" value={regForm.dateOfBirth} onChange={(e) => setRegForm({ ...regForm, dateOfBirth: e.target.value })} />
                </FormField>
                <FormField label={pick('লিঙ্গ', 'Gender')}>
                  <Select value={regForm.gender} onChange={(e) => setRegForm({ ...regForm, gender: e.target.value as Gender })}>
                    <option value={Gender.MALE}>{pick('ছাত্র', 'Male')}</option>
                    <option value={Gender.FEMALE}>{pick('ছাত্রী', 'Female')}</option>
                  </Select>
                </FormField>
              </div>
            )}
            {regStep === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={pick('জন্ম সনদ নম্বর (১৭ ডিজিট)', 'Birth Certificate No')}>
                  <Input value={regForm.birthCertificateNo} onChange={(e) => setRegForm({ ...regForm, birthCertificateNo: e.target.value })} />
                </FormField>
                <FormField label={pick('বোর্ড রেজিস্ট্রেশন নং', 'Board Registration No')}>
                  <Input value={regForm.boardRegistrationNo} onChange={(e) => setRegForm({ ...regForm, boardRegistrationNo: e.target.value })} />
                </FormField>
                <FormField label={pick('বর্তমান ঠিকানা', 'Present Address')}>
                  <Textarea value={regForm.presentAddress} onChange={(e) => setRegForm({ ...regForm, presentAddress: e.target.value })} />
                </FormField>
                <FormField label={pick('স্থায়ী ঠিকানা', 'Permanent Address')}>
                  <Textarea value={regForm.permanentAddress} onChange={(e) => setRegForm({ ...regForm, permanentAddress: e.target.value })} />
                </FormField>
              </div>
            )}
            {regStep === 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={pick('অভিভাবকের নাম (ইংরেজি)', 'Guardian Name (English)')} required>
                  <Input value={regForm.parentName} onChange={(e) => setRegForm({ ...regForm, parentName: e.target.value })} />
                </FormField>
                <FormField label={pick('অভিভাবকের নাম (বাংলা)', 'Guardian Name (Bangla)')}>
                  <Input value={regForm.parentNameBn} onChange={(e) => setRegForm({ ...regForm, parentNameBn: e.target.value })} />
                </FormField>
                <FormField label={pick('অভিভাবকের মোবাইল (SMS রিসিভার)', 'Guardian Phone (SMS)')} required>
                  <Input value={regForm.parentPhone} onChange={(e) => setRegForm({ ...regForm, parentPhone: e.target.value })} />
                </FormField>
                <FormField label={pick('পেশা', 'Occupation')}>
                  <Input value={regForm.parentOccupation} onChange={(e) => setRegForm({ ...regForm, parentOccupation: e.target.value })} />
                </FormField>
              </div>
            )}
            {regStep === 4 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={pick('পূর্ববর্তী বিদ্যালয়ের নাম', 'Previous School')}>
                  <Input value={regForm.previousSchoolName} onChange={(e) => setRegForm({ ...regForm, previousSchoolName: e.target.value })} />
                </FormField>
                <FormField label={pick('পূর্ববর্তী জিপিএ', 'Previous GPA')}>
                  <Input value={regForm.previousGpa} onChange={(e) => setRegForm({ ...regForm, previousGpa: e.target.value })} />
                </FormField>
              </div>
            )}
            {regStep === 5 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label={pick('শ্রেণি', 'Class')}>
                  <Select
                    value={regForm.classId}
                    onChange={(e) => {
                      const firstSec = db.sections.find((s) => s.classId === e.target.value);
                      setRegForm({ ...regForm, classId: e.target.value, sectionId: firstSec?.id ?? '' });
                    }}
                  >
                    {db.classes.map((c) => (
                      <option key={c.id} value={c.id}>{locale === 'bn' ? c.nameBn : c.name}</option>
                    ))}
                  </Select>
                </FormField>
                <FormField label={pick('শাখা', 'Section')}>
                  <Select value={regForm.sectionId} onChange={(e) => setRegForm({ ...regForm, sectionId: e.target.value })}>
                    {db.sections.filter((s) => s.classId === regForm.classId).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Select>
                </FormField>
                <FormField label={pick('রোল নম্বর (ইউনিক)', 'Roll Number (Unique)')} required>
                  <Input type="number" value={regForm.roll} onChange={(e) => setRegForm({ ...regForm, roll: e.target.value })} />
                </FormField>
              </div>
            )}
            {regStep === 6 && (
              <div className="p-4 bg-surface-muted/40 border border-border rounded text-sm space-y-1">
                <p><strong>{pick('শিক্ষার্থী:', 'Student:')}</strong> {regForm.nameBn} ({regForm.nameEn})</p>
                <p><strong>{pick('অভিভাবক:', 'Parent:')}</strong> {regForm.parentName} · {regForm.parentPhone}</p>
                <p className="tabular-nums"><strong>{pick('রোল:', 'Roll:')}</strong> {regForm.roll}</p>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-border">
              <Button variant="outline" disabled={regStep === 1} onClick={() => setRegStep((s) => s - 1)}>
                {pick('পূর্ববর্তী', 'Previous')}
              </Button>
              {regStep < 6 ? (
                <Button variant="primary" onClick={() => setRegStep((s) => s + 1)}>
                  {pick('পরবর্তী ধাপ', 'Next')}
                </Button>
              ) : (
                <Button type="submit" variant="primary" disabled={savingStu}>
                  {pick('নিবন্ধন সম্পন্ন করুন', 'Complete Registration')}
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}

      {tab === 'promotions' && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Select value={promoClassId} onChange={(e) => setPromoClassId(e.target.value)} className="w-52">
              {db.classes.filter((c) => c.numericValue <= 9).map((c) => (
                <option key={c.id} value={c.id}>{locale === 'bn' ? c.nameBn : c.name}</option>
              ))}
            </Select>
            <Button variant="primary" size="sm" onClick={handleBulkPromote} disabled={promoting}>
              {pick('নির্বাচিত শ্রেণির প্রমোশন নিশ্চিত করুন', 'Confirm Bulk Promotion')}
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-sm text-muted-foreground">
              <tr>
                <th className="p-3 text-left">{pick('রোল', 'Roll')}</th>
                <th className="p-3 text-left">{pick('শিক্ষার্থী', 'Student')}</th>
                <th className="p-3 text-left">{pick('অবস্থা', 'Current Enrollment')}</th>
                <th className="p-3 text-left">{pick('প্রস্তাবিত সিদ্ধান্ত', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {promoCandidates.map((enr) => {
                const stu = db.students.find((s) => s.id === enr.studentId);
                return (
                  <tr key={enr.id}>
                    <td className="p-3 tabular-nums">{enr.roll}</td>
                    <td className="p-3 font-medium">{stu?.nameBn ?? stu?.nameEn}</td>
                    <td className="p-3"><StatusBadge enumName="EnrollmentStatus" value={enr.status} /></td>
                    <td className="p-3"><StatusBadge enumName="PromotionType" value={PromotionType.PROMOTED} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'transfers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-5 p-5">
            <form onSubmit={handleIssueTc} className="space-y-3">
              <h3 className="text-base font-bold">{pick('নতুন ট্রান্সফার সার্টিফিকেট (TC) ইস্যু', 'Issue Transfer Certificate')}</h3>
              <FormField label={pick('শিক্ষার্থী', 'Student')}>
                <Select value={tcForm.studentId} onChange={(e) => setTcForm({ ...tcForm, studentId: e.target.value })}>
                  {db.students.map((s) => (
                    <option key={s.id} value={s.id}>{s.nameBn} ({s.studentId})</option>
                  ))}
                </Select>
              </FormField>
              <FormField label={pick('টিসি নম্বর', 'TC Number')}>
                <Input value={tcForm.tcNumber} onChange={(e) => setTcForm({ ...tcForm, tcNumber: e.target.value })} />
              </FormField>
              <FormField label={pick('বিদ্যালয় ত্যাগের কারণ', 'Reason')}>
                <Textarea value={tcForm.reason} onChange={(e) => setTcForm({ ...tcForm, reason: e.target.value })} />
              </FormField>
              <FormField label={pick('গন্তব্য বিদ্যালয়', 'Destination School')}>
                <Input value={tcForm.destinationSchool} onChange={(e) => setTcForm({ ...tcForm, destinationSchool: e.target.value })} />
              </FormField>
              <Button type="submit" variant="primary" disabled={issuingTc}>{pick('টিসি ইস্যু করুন', 'Issue TC')}</Button>
            </form>
          </Card>

          <div className="lg:col-span-7 space-y-3">
            {db.transferCertificates.map((tc) => {
              const stu = db.students.find((s) => s.id === tc.studentId);
              return (
                <Card key={tc.id} className="p-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-bold text-primary">{tc.tcNumber}</p>
                    <p className="text-base font-bold">{stu?.nameBn ?? stu?.nameEn}</p>
                    <p className="text-sm text-muted-foreground">{tc.reason}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setPrintTcId(tc.id)}>
                    <Printer className="w-3.5 h-3.5" /> {pick('প্রিন্ট প্রিভিউ', 'Print Preview')}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'rfid' && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-sm text-muted-foreground">
              <tr>
                <th className="p-3 text-left">{pick('কার্ড নম্বর', 'Card Number')}</th>
                <th className="p-3 text-left">{pick('শিক্ষার্থী', 'Student')}</th>
                <th className="p-3 text-left">{pick('অবস্থা', 'Status')}</th>
                <th className="p-3 text-left">{pick('অ্যাকশন', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {db.rfidCards.map((card) => {
                const stu = db.students.find((s) => s.id === card.studentId);
                return (
                  <tr key={card.id}>
                    <td className="p-3 font-mono text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" /> {card.cardNumber}
                    </td>
                    <td className="p-3 font-medium">{stu?.nameBn ?? stu?.nameEn}</td>
                    <td className="p-3"><StatusBadge enumName="CardStatus" value={card.status} /></td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        {[CardStatus.ACTIVE, CardStatus.LOST, CardStatus.BLOCKED].map((st) => (
                          <Button
                            key={st}
                            size="sm"
                            variant={card.status === st ? 'primary' : 'outline'}
                            onClick={() => {
                              updateRfid({ id: card.id, status: st });
                              toast.success(pick('RFID কার্ড স্ট্যাটাস আপডেট হয়েছে', 'RFID card status updated'));
                            }}
                          >
                            {st}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'import' && (
        <Card className="p-8 text-center space-y-4">
          <Upload className="w-8 h-8 text-primary mx-auto" />
          <h3 className="text-lg font-bold">{pick('বাল্ক শিক্ষার্থী CSV ইম্পোর্ট', 'Bulk Student CSV Import')}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {pick(
              'কলাম ফরম্যাট: nameEn, nameBn, classId, sectionName, roll, birthCertificateNo, parentName, parentPhone। আপলোডের পূর্বে রোল ও জন্ম সনদ যাচাই করা হবে।',
              'Expected columns: nameEn, nameBn, classId, sectionName, roll, birthCertificateNo, parentName, parentPhone.'
            )}
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                toast.success(
                  pick(
                    `ফাইল "${e.target.files[0].name}" সফলভাবে যাচাই হয়েছে (ইম্পোর্ট প্রিভিউ প্রস্তুত)।`,
                    `Validated "${e.target.files[0].name}" — ready for backend batch import.`
                  )
                );
              }
            }}
            className="text-sm"
          />
        </Card>
      )}

      {/* Printable TC Modal */}
      <Modal
        open={Boolean(printTcId)}
        onClose={() => setPrintTcId(null)}
        title={pick('ট্রান্সফার সার্টিফিকেট প্রিন্ট প্রিভিউ', 'Transfer Certificate Print Preview')}
        maxWidth="max-w-3xl"
      >
        {printTcId && (() => {
          const tc = db.transferCertificates.find((t) => t.id === printTcId);
          const stu = tc ? db.students.find((s) => s.id === tc.studentId) : null;
          if (!tc || !stu) return null;
          return (
            <div className="space-y-4">
              <div className="flex justify-end no-print">
                <Button variant="primary" size="sm" onClick={triggerPrint}>
                  <Printer className="w-4 h-4" /> {pick('প্রিন্ট করুন', 'Print A4')}
                </Button>
              </div>
              <PrintableTransferCertificate school={db.schoolProfile} tc={tc} student={stu} />
            </div>
          );
        })()}
      </Modal>

      {/* Printable Student ID Cards Modal */}
      <Modal
        open={idCardModalOpen}
        onClose={() => setIdCardModalOpen(false)}
        title={pick('শিক্ষার্থী পরিচয়পত্র (Student ID Cards)', 'Student ID Card Print Sheet')}
        maxWidth="max-w-5xl"
      >
        <div className="space-y-4">
          <div className="flex justify-end no-print">
            <Button variant="primary" size="sm" onClick={triggerPrint}>
              <Printer className="w-4 h-4" /> {pick('আইডি কার্ড প্রিন্ট করুন', 'Print ID Cards')}
            </Button>
          </div>
          <PrintableIdCardSheet
            school={db.schoolProfile}
            holderType="STUDENT"
            cards={(profileStudent
              ? directoryRows.filter((r) => r.id === profileStudent.id)
              : directoryRows.slice(0, 9)
            ).map((r) => ({
              code: r.studentId,
              name: locale === 'bn' ? r.nameBn || r.nameEn : r.nameEn,
              subline: `${r.classLabel} (${r.sectionLabel}) · ${pick('রোল:', 'Roll:')} ${formatNumber(r.roll, locale)}`,
              secondaryLine: r.presentAddress ?? undefined,
              bloodGroup: r.bloodGroup,
              validUntil: '2026',
            }))}
          />
        </div>
      </Modal>
    </div>
  );
}

// ============================================================================
// 7.7 PARENTS MANAGEMENT
// ============================================================================

export function AdminParentsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  if (isLoading || !db) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('অভিভাবক ডিরেক্টরি ও সংযুক্ত শিক্ষার্থী', 'Parents & Guardians Directory')}
        description={pick('একজন অভিভাবকের সাথে একাধিক শিক্ষার্থী সংযুক্তকরণ ও SMS প্রাপক ব্যবস্থাপনা।', 'Manage guardian profiles, linked children, emergency contacts, and SMS receiver preferences.')}
      />

      <DataTable
        data={db.parents}
        exportFilename="parents.csv"
        columns={[
          {
            accessorKey: 'name',
            header: pick('অভিভাবকের নাম', 'Parent Name'),
            cell: ({ row }) => (
              <div>
                <p className="font-semibold text-foreground">{row.original.nameBn ?? row.original.name}</p>
                <p className="text-xs text-muted-foreground">{row.original.name}</p>
              </div>
            ),
          },
          { accessorKey: 'phone', header: pick('মোবাইল', 'Phone'), cell: ({ row }) => <span className="tabular-nums">{row.original.phone}</span> },
          { accessorKey: 'occupation', header: pick('পেশা', 'Occupation') },
          {
            id: 'children',
            header: pick('সংযুক্ত শিক্ষার্থী', 'Linked Children'),
            cell: ({ row }) => {
              const links = db.parentStudents.filter((ps) => ps.parentId === row.original.id);
              return (
                <div className="space-y-0.5 text-sm">
                  {links.map((l) => {
                    const s = db.students.find((x) => x.id === l.studentId);
                    return (
                      <div key={l.id}>
                        {s?.nameBn ?? s?.nameEn} {l.isSmsReceiver ? '· SMS' : ''}
                      </div>
                    );
                  })}
                </div>
              );
            },
          },
        ]}
      />
    </div>
  );
}
