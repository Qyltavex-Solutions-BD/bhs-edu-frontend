'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileEdit,
  FileText,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { useUpdateAdmissionStatusMutation } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { DataTable } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, FormField, Input, Modal, Select } from '@/src/components/ui/primitives';
import {
  UnifiedAdmissionForm,
  type AdminAdmissionResult,
  ADMISSION_TYPE_META,
  getNextSuggestedRoll,
  getRequiredDocumentChecklist,
} from '@/src/features/admission';
import { classLabel, errorMessage } from './admin/studentShared';
import { AdmissionConfirmationView } from './AdmissionConfirmationView';
import type { MockDatabase } from '@/src/mocks/seed';
import type { OnlineAdmissionApplication } from '@/src/types/proposed/future';

export function StudentAdmissionInbox({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const { locale, pick } = useI18n();
  const [updateStatus, { isLoading }] = useUpdateAdmissionStatusMutation();
  const [openId, setOpenId] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState('');
  const [roll, setRoll] = useState('');
  const [formSerialNo, setFormSerialNo] = useState('');
  const [verifiedDocs, setVerifiedDocs] = useState<Record<string, boolean>>({});
  const [fullFormApp, setFullFormApp] = useState<OnlineAdmissionApplication | null>(null);
  const [admittedResult, setAdmittedResult] = useState<AdminAdmissionResult | null>(null);

  const app = db.onlineAdmissions.find((item) => item.id === openId) ?? null;

  const open = (id: string) => {
    const found = db.onlineAdmissions.find((item) => item.id === id);
    const section =
      db.sections.find((item) => found && item.classId === found.targetClassId && found.preferredSection && item.name === found.preferredSection) ||
      db.sections.find((item) => item.classId === found?.targetClassId);
    const nextRoll = section ? getNextSuggestedRoll(db, yearId, section.id) : 1;
    setOpenId(id);
    setSectionId(section?.id ?? '');
    setRoll(String(nextRoll));
    setFormSerialNo(found?.applicationNumber ?? '');
    setVerifiedDocs(found?.verifiedDocuments ?? {});
  };

  const handleSectionChange = (nextSectionId: string) => {
    setSectionId(nextSectionId);
    setRoll(String(getNextSuggestedRoll(db, yearId, nextSectionId)));
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
        formSerialNo: status === 'ADMITTED' ? formSerialNo || app.applicationNumber : undefined,
        verifiedDocuments: status === 'ADMITTED' ? verifiedDocs : undefined,
      }).unwrap();
      toast.success(
        status === 'ADMITTED'
          ? pick('ভর্তি সম্পন্ন হয়েছে এবং শিক্ষার্থী ডিরেক্টরিতে যুক্ত হয়েছে।', 'Admitted! Student added to the directory.')
          : pick('আবেদনের অবস্থা হালনাগাদ হয়েছে।', 'Application status updated.')
      );
      setOpenId(null);
    } catch (err) {
      toast.error(errorMessage(err, pick('হালনাগাদ হয়নি।', 'Could not update the application.')));
    }
  };

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ADMITTED' | 'REJECTED'>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');

  const totalCount = db.onlineAdmissions.length;
  const pendingCount = db.onlineAdmissions.filter(
    (item) => item.status === 'NEW' || item.status === 'UNDER_REVIEW'
  ).length;
  const admittedCount = db.onlineAdmissions.filter(
    (item) => item.status === 'ADMITTED' || item.status === 'APPROVED'
  ).length;
  const rejectedCount = db.onlineAdmissions.filter(
    (item) => item.status === 'REJECTED'
  ).length;

  const availableClasses = useMemo(() => {
    return [...db.classes].sort((a, b) => a.numericValue - b.numericValue);
  }, [db.classes]);

  const rows = useMemo(() => {
    return db.onlineAdmissions.map((item) => {
      const grp = db.academicGroups.find((g) => g.id === item.targetGroupId);
      const typeKey = item.admissionType ?? (item.isReadmission ? 'READMISSION' : 'NEW');
      return {
        ...item,
        classLabel:
          classLabel(db, item.targetClassId, locale) +
          (grp ? ` · ${locale === 'bn' ? grp.nameBn : grp.name}` : ''),
        typeLabel:
          locale === 'bn' ? ADMISSION_TYPE_META[typeKey].bn : ADMISSION_TYPE_META[typeKey].en,
        when: formatDateShort(item.submittedAt, (locale === 'bn' ? 'bn' : 'en')),
      };
    });
  }, [db, locale]);

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      if (statusFilter === 'PENDING') {
        if (item.status !== 'NEW' && item.status !== 'UNDER_REVIEW') return false;
      } else if (statusFilter === 'ADMITTED') {
        if (item.status !== 'ADMITTED' && item.status !== 'APPROVED') return false;
      } else if (statusFilter === 'REJECTED') {
        if (item.status !== 'REJECTED') return false;
      }

      if (classFilter !== 'ALL' && item.targetClassId !== classFilter) {
        return false;
      }

      return true;
    });
  }, [rows, statusFilter, classFilter]);

  if (admittedResult) {
    return (
      <AdmissionConfirmationView
        db={db}
        result={admittedResult}
        onAdmitAnother={() => {
          setAdmittedResult(null);
          setFullFormApp(null);
        }}
      />
    );
  }

  if (fullFormApp) {
    return (
      <UnifiedAdmissionForm
        mode="admin"
        db={db}
        yearId={yearId}
        prefillApplication={fullFormApp}
        onAdminSuccess={(result) => {
          setFullFormApp(null);
          setAdmittedResult(result);
        }}
        onCancel={() => setFullFormApp(null)}
      />
    );
  }

  const appClass = app ? db.classes.find((c) => c.id === app.targetClassId) : undefined;
  const appGroup = app ? db.academicGroups.find((g) => g.id === app.targetGroupId) : undefined;
  const appType = app ? (app.admissionType ?? (app.isReadmission ? 'READMISSION' : 'NEW')) : 'NEW';
  const appChecklist = app
    ? getRequiredDocumentChecklist(
        appClass?.numericValue ?? 6,
        appType,
        app.fatherAlive === false || app.motherAlive === false
      )
    : [];

  return (
    <div className="space-y-6">
      {/* 1. Large KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-foreground">
              {pick('মোট আবেদন', 'Total Applications')}
            </span>
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
              {formatNumber(totalCount, (locale === 'bn' ? 'bn' : 'en'))}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {pick('টি জমা', 'submitted')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {pick('চলতি শিক্ষাবর্ষের সকল অনলাইন আবেদন', 'All online applications in current session')}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-warning">
              {pick('অপেক্ষমান আবেদন', 'Pending Review')}
            </span>
            <Clock className="w-5 h-5 text-warning" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-warning">
              {formatNumber(pendingCount, (locale === 'bn' ? 'bn' : 'en'))}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {pick('টি যাচাই বাকি', 'pending action')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {pick('যাচাই ও ভর্তি সম্পন্নকরণের অপেক্ষায়', 'Awaiting review and enrollment')}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-success">
              {pick('ভর্তি সম্পন্ন ও অনুমোদিত', 'Admitted & Approved')}
            </span>
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-success">
              {formatNumber(admittedCount, (locale === 'bn' ? 'bn' : 'en'))}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {pick('জন শিক্ষার্থী', 'students')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {pick('শিক্ষার্থী ডিরেক্টরিতে রোল ও শাখা বরাদ্দকৃত', 'Enrolled with assigned roll and section')}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-destructive">
              {pick('বাতিলকৃত আবেদন', 'Rejected')}
            </span>
            <XCircle className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-destructive">
              {formatNumber(rejectedCount, (locale === 'bn' ? 'bn' : 'en'))}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {pick('টি আবেদন', 'applications')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {pick('অসম্পূর্ণ বা ত্রুটিযুক্ত আবেদন', 'Incomplete or invalid applications')}
          </p>
        </Card>
      </div>

      {/* 2. Applications DataTable */}
      <DataTable
        data={filteredRows}
        exportFilename="admissions.csv"
        toolbarExtra={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'PENDING' | 'ADMITTED' | 'REJECTED')}
              className="text-sm sm:text-base h-10 min-w-[160px] w-auto bg-surface font-semibold"
              aria-label={pick('আবেদনের অবস্থা নির্বাচন করুন', 'Select status')}
            >
              <option value="ALL">{pick('সকল অবস্থা', 'All Statuses')}</option>
              <option value="PENDING">
                {pick('অপেক্ষমান', 'Pending')} ({formatNumber(pendingCount, (locale === 'bn' ? 'bn' : 'en'))})
              </option>
              <option value="ADMITTED">
                {pick('ভর্তি সম্পন্ন', 'Admitted')} ({formatNumber(admittedCount, (locale === 'bn' ? 'bn' : 'en'))})
              </option>
              <option value="REJECTED">
                {pick('বাতিলকৃত', 'Rejected')} ({formatNumber(rejectedCount, (locale === 'bn' ? 'bn' : 'en'))})
              </option>
            </Select>

            <Select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="text-sm sm:text-base h-10 min-w-[150px] w-auto bg-surface font-semibold"
              aria-label={pick('শ্রেণি নির্বাচন করুন', 'Select class')}
            >
              <option value="ALL">{pick('সকল শ্রেণি', 'All Classes')}</option>
              {availableClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {locale === 'bn' ? cls.nameBn || cls.name : cls.name}
                </option>
              ))}
            </Select>

            {(statusFilter !== 'ALL' || classFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('ALL');
                  setClassFilter('ALL');
                }}
                className="h-10 px-3 text-sm font-semibold text-muted-foreground hover:text-foreground"
                title={pick('ফিল্টার রিসেট করুন', 'Reset filter')}
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                {pick('রিসেট', 'Reset')}
              </Button>
            )}
          </div>
        }
        emptyTitle={pick('নির্বাচিত ফিল্টারে কোনো আবেদন পাওয়া যায়নি।', 'No applications found matching the selected filter.')}
        emptyAction={
          statusFilter !== 'ALL' || classFilter !== 'ALL' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter('ALL');
                setClassFilter('ALL');
              }}
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              {pick('ফিল্টার রিসেট করুন', 'Reset filter')}
            </Button>
          ) : undefined
        }
        columns={[
          { accessorKey: 'applicationNumber', header: pick('আবেদন নং', 'Application'), cell: ({ row }) => <span className="font-mono text-base font-medium tabular-nums text-foreground">{row.original.applicationNumber}</span> },
          {
            accessorKey: 'studentNameBn',
            header: pick('শিক্ষার্থী', 'Student'),
            cell: ({ row }) => (
              <div className="flex items-center gap-3">
                {row.original.photoPreview && (
                  <img
                    src={row.original.photoPreview}
                    alt={row.original.studentNameEn}
                    referrerPolicy="no-referrer"
                    className="w-9 h-10 rounded-lg object-cover border border-border shrink-0"
                  />
                )}
                <span>
                  <span className="font-semibold text-base text-foreground block">{row.original.studentNameBn}</span>
                  <span className="block text-sm text-muted-foreground font-mono uppercase font-normal">{row.original.studentNameEn}</span>
                </span>
              </div>
            ),
          },
          { accessorKey: 'classLabel', header: pick('শ্রেণি ও বিভাগ', 'Class & Group'), cell: ({ row }) => <span className="font-medium text-base text-foreground">{row.original.classLabel}</span> },
          { accessorKey: 'typeLabel', header: pick('ধরন', 'Type'), cell: ({ row }) => <span className="font-normal text-base text-muted-foreground">{row.original.typeLabel}</span> },
          { accessorKey: 'guardianPhone', header: pick('মোবাইল', 'Phone'), cell: ({ row }) => <span className="font-mono text-base tabular-nums font-medium">{row.original.guardianPhone}</span> },
          { accessorKey: 'when', header: pick('তারিখ', 'Date'), cell: ({ row }) => <span className="text-base text-muted-foreground tabular-nums">{row.original.when}</span> },
          { accessorKey: 'status', header: pick('অবস্থা', 'Status'), cell: ({ row }) => <StatusBadge enumName="AdmissionApplicationStatus" value={row.original.status} /> },
          {
            id: 'open',
            header: '',
            cell: ({ row }) => (
              <Button size="sm" variant="outline" className="h-9 px-3 text-sm font-semibold" onClick={() => open(row.original.id)}>
                {pick('যাচাই ও ভর্তি', 'Review')}
              </Button>
            ),
          },
        ]}
      />
      <Modal
        open={Boolean(app)}
        onClose={() => setOpenId(null)}
        title={app ? `${app.applicationNumber} · ${app.studentNameBn}` : ''}
        description={app ? `${classLabel(db, app.targetClassId, locale)} · ${locale === 'bn' ? ADMISSION_TYPE_META[appType].bn : ADMISSION_TYPE_META[appType].en}` : undefined}
        maxWidth="max-w-2xl"
      >
        {app && (
          <div className="space-y-5 text-sm">
            <div className="flex items-start gap-4 pb-4 border-b border-border">
              {app.photoPreview && (
                <img
                  src={app.photoPreview}
                  alt={app.studentNameEn}
                  referrerPolicy="no-referrer"
                  className="w-18 h-22 rounded-[var(--radius)] object-cover border border-border shrink-0"
                />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1.5 flex-1">
                <p>
                  <span className="text-muted-foreground">{pick('ইংরেজি নাম:', 'English Name:')}</span>{' '}
                  <strong className="font-mono uppercase">{app.studentNameEn}</strong>
                </p>
                <p className="tabular-nums">
                  <span className="text-muted-foreground">{pick('জন্ম সনদ:', 'Birth Cert:')}</span>{' '}
                  <span className="font-mono">{app.birthCertificateNo}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">{pick('পিতা:', 'Father:')}</span>{' '}
                  {app.fatherNameBn}{app.fatherAlive === false ? ` (${pick('মৃত', 'Deceased')})` : ''}
                </p>
                <p>
                  <span className="text-muted-foreground">{pick('মাতা:', 'Mother:')}</span>{' '}
                  {app.motherNameBn}{app.motherAlive === false ? ` (${pick('মৃত', 'Deceased')})` : ''}
                </p>
                {app.legalGuardianNameBn && (
                  <p className="sm:col-span-2">
                    <span className="text-muted-foreground">{pick('বৈধ অভিভাবক:', 'Legal Guardian:')}</span>{' '}
                    {app.legalGuardianNameBn} ({app.legalGuardianRelation}) ·{' '}
                    <span className="font-mono tabular-nums">{app.legalGuardianPhone}</span>
                  </p>
                )}
                <p className="tabular-nums">
                  <span className="text-muted-foreground">
                    {pick('প্রাথমিক যোগাযোগ:', 'Primary Contact:')}
                  </span>{' '}
                  {app.primaryGuardianType === 'MOTHER'
                    ? pick('মাতা', 'Mother')
                    : app.primaryGuardianType === 'LEGAL_GUARDIAN'
                      ? pick('বৈধ অভিভাবক', 'Legal Guardian')
                      : pick('পিতা', 'Father')}{' '}
                  · <strong className="font-mono">{app.guardianPhone}</strong>
                </p>
                {appGroup && (
                  <p>
                    <span className="text-muted-foreground">{pick('বিভাগ ও ৪র্থ বিষয়:', 'Group & 4th:')}</span>{' '}
                    <strong>{locale === 'bn' ? appGroup.nameBn : appGroup.name}</strong>
                    {app.optionalSubjectName ? ` · ${app.optionalSubjectName}` : ''}
                  </p>
                )}
                {app.boardRegistrationNo && (
                  <p className="tabular-nums">
                    <span className="text-muted-foreground">{pick('বোর্ড রেজিস্ট্রেশন:', 'Board Reg:')}</span>{' '}
                    <strong className="font-mono">{app.boardRegistrationNo}</strong>
                  </p>
                )}
                {app.transferCertificateNo && (
                  <p className="tabular-nums">
                    <span className="text-muted-foreground">{pick('ছাড়পত্র / e-TC:', 'TC / e-TC:')}</span>{' '}
                    <strong className="font-mono">{app.transferCertificateNo}</strong>
                  </p>
                )}
                <p className="sm:col-span-2 text-xs text-muted-foreground">
                  {pick('ঠিকানা:', 'Address:')} {app.presentAddress}
                </p>
              </div>
            </div>

            {app.status !== 'ADMITTED' && app.status !== 'REJECTED' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label={pick(' শাখা', 'Section')} required>
                    <Select value={sectionId} onChange={(event) => handleSectionChange(event.target.value)}>
                      {db.sections
                        .filter((item) => item.classId === app.targetClassId)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {pick(`শাখা ${item.name}`, `Section ${item.name}`)}
                          </option>
                        ))}
                    </Select>
                  </FormField>
                  <FormField label={pick('রোল নম্বর', 'Roll Number')} required>
                    <Input type="number" min={1} value={roll} onChange={(event) => setRoll(event.target.value)} className="font-mono tabular-nums" />
                  </FormField>
                  <FormField label={pick('ফরম সিরিয়াল নং', 'Form Serial No')}>
                    <Input value={formSerialNo} onChange={(event) => setFormSerialNo(event.target.value)} className="font-mono tabular-nums" />
                  </FormField>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ClipboardCheck className="w-3.5 h-3.5 text-primary" />
                    {pick('মূল কাগজপত্র যাচাই (ঐচ্ছিক টিক দিন)', 'Physical Document Verification')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {appChecklist.map((item) => (
                      <label
                        key={item.key}
                        className="flex items-start gap-2 p-2.5 rounded border border-border text-xs cursor-pointer hover:bg-surface-muted/40"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(verifiedDocs[item.key])}
                          onChange={() =>
                            setVerifiedDocs((prev) => ({
                              ...prev,
                              [item.key]: !prev[item.key],
                            }))
                          }
                          className="w-3.5 h-3.5 mt-0.5 accent-primary shrink-0"
                        />
                        <span>{locale === 'bn' ? item.labelBn : item.labelEn}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
              {app.status !== 'ADMITTED' && app.status !== 'REJECTED' ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOpenId(null);
                      setFullFormApp(app);
                    }}
                  >
                    <FileEdit className="w-4 h-4" />
                    {pick('পূর্ণ ফর্মে সম্পাদনা ও ভর্তি', 'Edit in Full Form')}
                  </Button>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" disabled={isLoading} onClick={() => act('REJECTED')}>
                      {pick('বাতিল', 'Reject')}
                    </Button>
                    <Button variant="outline" size="sm" disabled={isLoading} onClick={() => act('APPROVED')}>
                      {pick('অনুমোদন', 'Approve')}
                    </Button>
                    <Button variant="primary" size="sm" disabled={isLoading} onClick={() => act('ADMITTED')}>
                      {pick('দ্রুত ভর্তি করুন', 'Quick Admit')}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="w-full flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setOpenId(null)}>
                    {pick('বন্ধ করুন', 'Close')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
