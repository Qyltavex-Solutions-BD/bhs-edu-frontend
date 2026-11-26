'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import { useGetAdminAdmissionsQuery } from '@/src/features/admission/api/admission.api';
import {
  useGetEnrollmentsQuery,
  useGetNextSuggestedRollQuery,
} from '@/src/features/students/api/students.api';
import { useGetAcademicYearsQuery } from '@/src/services/academic/year.api';
import { useGetSchoolClassesQuery } from '@/src/services/academic/class.api';
import { useGetSectionsQuery } from '@/src/services/academic/section.api';
import { useGetAcademicGroupsQuery } from '@/src/services/academic/group.api';
import { useGetClassSubjectsQuery } from '@/src/services/academic/class-subject.api';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { DataTable } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, FormField, Input, Modal, Select } from '@/src/components/ui/primitives';
import {
  type AdmissionCatalogData,
  UnifiedAdmissionForm,
  type AdminAdmissionResult,
  ADMISSION_TYPE_META,
  getNextSuggestedRoll,
  getRequiredDocumentChecklist,
} from '@/src/features/admission';
import { errorMessage } from './admin/studentShared';
import { AdmissionConfirmationView } from './AdmissionConfirmationView';
import type { MockDatabase } from '@/src/mocks/seed';
import type { OnlineAdmissionApplication } from '@/src/types/proposed/future';

export function StudentAdmissionInbox({
  db,
  yearId,
}: {
  db?: MockDatabase;
  yearId: string;
}) {
  const { locale, pick } = useI18n();
  const [updateStatus, { isLoading }] = useUpdateAdmissionStatusMutation();
  const { data: liveAdmissions, isLoading: loadingApps } =
    useGetAdminAdmissionsQuery();
  const { data: liveYears = [] } = useGetAcademicYearsQuery();
  const { data: liveClasses = [] } = useGetSchoolClassesQuery({ isActive: true });
  const { data: liveSections = [] } = useGetSectionsQuery({ isActive: true });
  const { data: liveGroups = [] } = useGetAcademicGroupsQuery();
  const { data: liveClassSubjects = [] } = useGetClassSubjectsQuery({ isActive: true });
  const { data: liveEnrollments = [] } = useGetEnrollmentsQuery(
    { academicYearId: yearId },
    { skip: !yearId }
  );

  const sectionCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const enr of liveEnrollments) {
      map.set(enr.sectionId, (map.get(enr.sectionId) ?? 0) + 1);
    }
    return map;
  }, [liveEnrollments]);

  const academicYears = liveYears.length ? liveYears : db?.academicYears ?? [];
  const classes = liveClasses.length ? liveClasses : db?.classes ?? [];
  const sections = liveSections.length ? liveSections : db?.sections ?? [];
  const academicGroups = liveGroups.length ? liveGroups : db?.academicGroups ?? [];
  const classSubjects = liveClassSubjects.length
    ? liveClassSubjects
    : db?.classSubjects ?? [];
  const onlineAdmissions = liveAdmissions ?? db?.onlineAdmissions ?? [];

  const liveCatalog: AdmissionCatalogData = useMemo(
    () => ({
      academicYears,
      classes,
      sections,
      academicGroups,
      classSubjects,
      schoolProfile: db?.schoolProfile,
      admissionContent: db?.admissionContent,
    }),
    [
      academicYears,
      classes,
      sections,
      academicGroups,
      classSubjects,
      db?.schoolProfile,
      db?.admissionContent,
    ]
  );

  const [openId, setOpenId] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState('');
  const [roll, setRoll] = useState('');
  const [formSerialNo, setFormSerialNo] = useState('');
  const [verifiedDocs, setVerifiedDocs] = useState<Record<string, boolean>>({});
  const [fullFormApp, setFullFormApp] = useState<OnlineAdmissionApplication | null>(null);
  const [admittedResult, setAdmittedResult] = useState<AdminAdmissionResult | null>(null);

  const { data: nextRollData } = useGetNextSuggestedRollQuery(
    { academicYearId: yearId, sectionId },
    { skip: !yearId || !sectionId }
  );

  useEffect(() => {
    if (openId && nextRollData?.nextRoll) {
      setRoll(String(nextRollData.nextRoll));
    }
  }, [openId, nextRollData?.nextRoll]);

  const app = onlineAdmissions.find((item) => item.id === openId) ?? null;

  const open = (id: string) => {
    const found = onlineAdmissions.find((item) => item.id === id);
    const classSections = sections.filter(
      (item) => item.classId === found?.targetClassId
    );
    const preferred =
      found?.preferredSection
        ? classSections.find((item) => item.name === found.preferredSection)
        : undefined;
    const leastPopulated = [...classSections].sort(
      (a, b) => (sectionCountMap.get(a.id) ?? 0) - (sectionCountMap.get(b.id) ?? 0)
    )[0];
    const section = preferred || leastPopulated;
    const nextRoll = section ? getNextSuggestedRoll(liveCatalog, yearId, section.id) : 1;
    setOpenId(id);
    setSectionId(section?.id ?? '');
    setRoll(String(nextRoll));
    setFormSerialNo(found?.applicationNumber ?? '');
    setVerifiedDocs(found?.verifiedDocuments ?? {});
  };

  const handleSectionChange = (nextSectionId: string) => {
    setSectionId(nextSectionId);
    setRoll(String(getNextSuggestedRoll(liveCatalog, yearId, nextSectionId)));
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

  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PENDING' | 'APPROVED' | 'ADMITTED' | 'REJECTED'
  >('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');

  const totalCount = onlineAdmissions.length;
  const pendingCount = onlineAdmissions.filter(
    (item) => item.status === 'NEW' || item.status === 'UNDER_REVIEW'
  ).length;
  const approvedCount = onlineAdmissions.filter(
    (item) => item.status === 'APPROVED'
  ).length;
  const admittedCount = onlineAdmissions.filter(
    (item) => item.status === 'ADMITTED'
  ).length;
  const rejectedCount = onlineAdmissions.filter(
    (item) => item.status === 'REJECTED'
  ).length;

  const availableClasses = useMemo(() => {
    return [...classes].sort((a, b) => a.numericValue - b.numericValue);
  }, [classes]);

  const rows = useMemo(() => {
    return onlineAdmissions.map((item) => {
      const cls =
        classes.find((c) => c.id === item.targetClassId) ??
        (item as OnlineAdmissionApplication & {
          targetClass?: { name: string; nameBn?: string };
        }).targetClass;
      const grp =
        academicGroups.find((g) => g.id === item.targetGroupId) ??
        (item as OnlineAdmissionApplication & {
          targetGroup?: { name: string; nameBn?: string };
        }).targetGroup;
      const clsName = cls
        ? locale === 'bn'
          ? cls.nameBn || cls.name
          : cls.name
        : '—';
      const typeKey = item.admissionType ?? (item.isReadmission ? 'READMISSION' : 'NEW');
      return {
        ...item,
        classLabel:
          clsName +
          (grp ? ` · ${locale === 'bn' ? grp.nameBn || grp.name : grp.name}` : ''),
        typeLabel:
          locale === 'bn' ? ADMISSION_TYPE_META[typeKey].bn : ADMISSION_TYPE_META[typeKey].en,
        when: formatDateShort(item.submittedAt, locale === 'bn' ? 'bn' : 'en'),
      };
    });
  }, [onlineAdmissions, classes, academicGroups, locale]);

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      if (statusFilter === 'PENDING') {
        if (item.status !== 'NEW' && item.status !== 'UNDER_REVIEW') return false;
      } else if (statusFilter === 'APPROVED') {
        if (item.status !== 'APPROVED') return false;
      } else if (statusFilter === 'ADMITTED') {
        if (item.status !== 'ADMITTED') return false;
      } else if (statusFilter === 'REJECTED') {
        if (item.status !== 'REJECTED') return false;
      }

      if (classFilter !== 'ALL' && item.targetClassId !== classFilter) {
        return false;
      }

      return true;
    });
  }, [rows, statusFilter, classFilter]);

  if (loadingApps && !liveAdmissions) {
    return <LoadingSkeleton />;
  }

  if (admittedResult) {
    return (
      <AdmissionConfirmationView
        db={liveCatalog}
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
        db={liveCatalog}
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

  const appClass = app ? classes.find((c) => c.id === app.targetClassId) : undefined;
  const appGroup = app ? academicGroups.find((g) => g.id === app.targetGroupId) : undefined;
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
        toolbarExtra={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as 'ALL' | 'PENDING' | 'APPROVED' | 'ADMITTED' | 'REJECTED'
                )
              }
              className="text-sm sm:text-base h-10 min-w-[180px] w-auto bg-surface font-semibold"
              aria-label={pick('আবেদনের অবস্থা নির্বাচন করুন', 'Select status')}
            >
              <option value="ALL">{pick('সকল অবস্থা', 'All Statuses')}</option>
              <option value="PENDING">
                {pick('প্রাথমিক যাচাই বাকি', 'Pending Review')} ({formatNumber(pendingCount, locale === 'bn' ? 'bn' : 'en')})
              </option>
              <option value="APPROVED">
                {pick('অনুমোদিত (ভর্তির অপেক্ষায়)', 'Approved (Ready)')} ({formatNumber(approvedCount, locale === 'bn' ? 'bn' : 'en')})
              </option>
              <option value="ADMITTED">
                {pick('ভর্তি সম্পন্ন', 'Admitted')} ({formatNumber(admittedCount, locale === 'bn' ? 'bn' : 'en')})
              </option>
              <option value="REJECTED">
                {pick('বাতিলকৃত', 'Rejected')} ({formatNumber(rejectedCount, locale === 'bn' ? 'bn' : 'en')})
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
          {
            accessorKey: 'applicationNumber',
            header: pick('আবেদন নং', 'Application'),
            cell: ({ row }) => (
              <span className="font-mono text-xs sm:text-sm font-semibold tabular-nums text-foreground whitespace-nowrap">
                {row.original.applicationNumber}
              </span>
            ),
          },
          {
            accessorKey: 'studentNameBn',
            header: pick('শিক্ষার্থী', 'Student'),
            cell: ({ row }) => (
              <div className="flex items-center gap-3 min-w-[200px]">
                {row.original.photoPreview && (
                  <img
                    src={row.original.photoPreview}
                    alt={row.original.studentNameEn}
                    referrerPolicy="no-referrer"
                    className="w-9 h-10 rounded-lg object-cover border border-border shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <span className="font-semibold text-sm sm:text-base text-foreground block truncate">
                    {row.original.studentNameBn}
                  </span>
                  <span className="block text-xs sm:text-sm text-muted-foreground font-mono uppercase truncate">
                    {row.original.studentNameEn}
                  </span>
                </div>
              </div>
            ),
          },
          {
            accessorKey: 'classLabel',
            header: pick('আবেদিত শ্রেণি', 'Applied Class'),
            cell: ({ row }) => (
              <div className="whitespace-nowrap">
                <span className="font-medium text-sm sm:text-base text-foreground">
                  {row.original.classLabel}
                </span>
                {(row.original.admissionType === 'TRANSFER' ||
                  row.original.admissionType === 'READMISSION' ||
                  row.original.isReadmission) && (
                  <span className="block text-xs text-primary font-medium mt-0.5">
                    {row.original.typeLabel}
                  </span>
                )}
              </div>
            ),
          },
          {
            accessorKey: 'guardianPhone',
            header: pick('মোবাইল', 'Phone'),
            cell: ({ row }) => (
              <span className="font-mono text-sm sm:text-base tabular-nums font-medium whitespace-nowrap">
                {row.original.guardianPhone}
              </span>
            ),
          },
          {
            accessorKey: 'when',
            header: pick('তারিখ', 'Date'),
            cell: ({ row }) => (
              <span className="text-xs sm:text-sm text-muted-foreground tabular-nums whitespace-nowrap">
                {row.original.when}
              </span>
            ),
          },
          {
            accessorKey: 'status',
            header: pick('অবস্থা', 'Status'),
            cell: ({ row }) => (
              <div className="whitespace-nowrap">
                <StatusBadge enumName="AdmissionApplicationStatus" value={row.original.status} />
              </div>
            ),
          },
          {
            id: 'open',
            header: () => <div className="text-right">{pick('কাজ', 'Actions')}</div>,
            enableSorting: false,
            cell: ({ row }) => {
              const st = row.original.status;
              const isPending = st === 'NEW' || st === 'UNDER_REVIEW';
              const isApproved = st === 'APPROVED';
              return (
                <div className="flex justify-end whitespace-nowrap">
                  <Button
                    size="sm"
                    variant={isApproved ? 'primary' : isPending ? 'outline' : 'ghost'}
                    className="h-8 sm:h-9 px-3 text-xs sm:text-sm font-semibold"
                    onClick={() => open(row.original.id)}
                  >
                    {isPending
                      ? pick('প্রাথমিক যাচাই', 'Initial Review')
                      : isApproved
                        ? pick('চূড়ান্ত ভর্তি', 'Final Admit')
                        : pick('বিস্তারিত দেখুন', 'View Details')}
                  </Button>
                </div>
              );
            },
          },
        ]}
      />
      <Modal
        open={Boolean(app)}
        onClose={() => setOpenId(null)}
        title={app ? `${app.applicationNumber} · ${app.studentNameBn}` : ''}
        description={
          app
            ? `${appClass ? (locale === 'bn' ? appClass.nameBn || appClass.name : appClass.name) : '—'} · ${locale === 'bn' ? ADMISSION_TYPE_META[appType].bn : ADMISSION_TYPE_META[appType].en}`
            : undefined
        }
        maxWidth="max-w-3xl"
      >
        {app && (
          <div className="space-y-5 text-sm">
            {/* 1. Student Identity & Applied Program */}
            <div className="flex flex-col sm:flex-row items-start gap-4 pb-4 border-b border-border">
              {app.photoPreview && (
                <img
                  src={app.photoPreview}
                  alt={app.studentNameEn}
                  referrerPolicy="no-referrer"
                  className="w-20 h-24 rounded-[var(--radius)] object-cover border border-border shrink-0"
                />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1.5 flex-1 w-full">
                <p>
                  <span className="text-muted-foreground">{pick('ইংরেজি নাম:', 'English Name:')}</span>{' '}
                  <strong className="font-mono uppercase">{app.studentNameEn}</strong>
                </p>
                <p className="tabular-nums">
                  <span className="text-muted-foreground">{pick('জন্ম তারিখ:', 'Date of Birth:')}</span>{' '}
                  <span>{formatDateShort(app.dateOfBirth, locale === 'bn' ? 'bn' : 'en')}</span>
                </p>
                <p className="tabular-nums">
                  <span className="text-muted-foreground">{pick('জন্ম সনদ:', 'Birth Cert:')}</span>{' '}
                  <span className="font-mono">{app.birthCertificateNo}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">{pick('লিঙ্গ ও ধর্ম:', 'Gender & Religion:')}</span>{' '}
                  <span>{app.gender} · {app.religion}</span>
                </p>
                {appGroup && (
                  <p>
                    <span className="text-muted-foreground">{pick('বিভাগ ও ৪র্থ বিষয়:', 'Group & 4th:')}</span>{' '}
                    <strong>{locale === 'bn' ? appGroup.nameBn || appGroup.name : appGroup.name}</strong>
                    {app.optionalSubjectName ? ` · ${app.optionalSubjectName}` : ''}
                  </p>
                )}
                {app.admissionTestRoll && (
                  <p className="tabular-nums">
                    <span className="text-muted-foreground">{pick('ভর্তি পরীক্ষার রোল:', 'Test Roll:')}</span>{' '}
                    <strong className="font-mono">{app.admissionTestRoll}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* 2. Parents, Guardian & Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-surface-muted/40 border border-border">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  {pick('পিতার তথ্য', 'Father Details')}
                </p>
                <p className="font-medium">
                  {app.fatherNameBn} ({app.fatherNameEn})
                  {app.fatherAlive === false ? ` · ${pick('মৃত', 'Deceased')}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pick('পেশা:', 'Occupation:')} {app.fatherOccupation || '—'}
                  {app.fatherPhone ? ` · ${app.fatherPhone}` : ''}
                </p>
                {app.fatherNid && (
                  <p className="text-xs font-mono text-muted-foreground">
                    NID: {app.fatherNid}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  {pick('মাতার তথ্য', 'Mother Details')}
                </p>
                <p className="font-medium">
                  {app.motherNameBn} ({app.motherNameEn})
                  {app.motherAlive === false ? ` · ${pick('মৃত', 'Deceased')}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pick('পেশা:', 'Occupation:')} {app.motherOccupation || '—'}
                  {app.motherPhone ? ` · ${app.motherPhone}` : ''}
                </p>
                {app.motherNid && (
                  <p className="text-xs font-mono text-muted-foreground">
                    NID: {app.motherNid}
                  </p>
                )}
              </div>

              {app.legalGuardianNameBn && (
                <p className="sm:col-span-2 text-xs pt-1 border-t border-border/60">
                  <span className="text-muted-foreground">{pick('বৈধ অভিভাবক:', 'Legal Guardian:')}</span>{' '}
                  {app.legalGuardianNameBn} ({app.legalGuardianRelation}) ·{' '}
                  <span className="font-mono tabular-nums">{app.legalGuardianPhone}</span>
                </p>
              )}

              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                <p>
                  <span className="text-muted-foreground font-medium">{pick('প্রাথমিক যোগাযোগ:', 'Primary Contact:')}</span>{' '}
                  <strong className="font-mono">{app.guardianPhone}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground font-medium">{pick('বর্তমান ঠিকানা:', 'Present Address:')}</span>{' '}
                  {app.presentAddress}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-muted-foreground font-medium">{pick('স্থায়ী ঠিকানা:', 'Permanent Address:')}</span>{' '}
                  {app.permanentAddress}
                </p>
              </div>
            </div>

            {/* 3. Previous Academic & Board / TC Info */}
            {(app.previousSchoolName ||
              app.previousClass ||
              app.prevExamRoll ||
              app.prevExamGpa ||
              app.boardRegistrationNo ||
              app.transferCertificateNo) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1.5 p-3.5 rounded-lg border border-border">
                <p className="sm:col-span-2 text-xs font-semibold text-muted-foreground uppercase mb-1">
                  {pick('পূর্ববর্তী বিদ্যালয় ও পরীক্ষার তথ্য', 'Previous Academic & Board Info')}
                </p>
                {app.previousSchoolName && (
                  <p className="sm:col-span-2">
                    <span className="text-muted-foreground">{pick('পূর্বের বিদ্যালয়:', 'Previous School:')}</span>{' '}
                    <strong>{app.previousSchoolName}</strong>
                    {app.previousSchoolEiin ? ` (EIIN: ${app.previousSchoolEiin})` : ''}
                  </p>
                )}
                {app.previousClass && (
                  <p>
                    <span className="text-muted-foreground">{pick('পূর্ববর্তী শ্রেণি:', 'Previous Class:')}</span>{' '}
                    {app.previousClass}
                  </p>
                )}
                {(app.prevExamPassingYear ||
                  app.prevExamRoll ||
                  (app.prevExamGpa !== undefined && app.prevExamGpa !== null)) && (
                  <p className="tabular-nums">
                    <span className="text-muted-foreground">{pick('পূর্বের পরীক্ষা:', 'Prev Exam:')}</span>{' '}
                    {[
                      app.prevExamPassingYear ? `${pick('সন', 'Year')}: ${app.prevExamPassingYear}` : null,
                      app.prevExamRoll ? `${pick('রোল', 'Roll')}: ${app.prevExamRoll}` : null,
                      app.prevExamGpa !== undefined && app.prevExamGpa !== null ? `GPA: ${app.prevExamGpa}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                {app.boardRegistrationNo && (
                  <p className="tabular-nums">
                    <span className="text-muted-foreground">{pick('বোর্ড রেজিস্ট্রেশন:', 'Board Reg:')}</span>{' '}
                    <strong className="font-mono">{app.boardRegistrationNo}</strong>
                    {app.boardRegistrationSession ? ` (${app.boardRegistrationSession})` : ''}
                  </p>
                )}
                {app.transferCertificateNo && (
                  <p className="tabular-nums">
                    <span className="text-muted-foreground">{pick('ছাড়পত্র / e-TC:', 'TC / e-TC:')}</span>{' '}
                    <strong className="font-mono">{app.transferCertificateNo}</strong>
                  </p>
                )}
              </div>
            )}

            {app.status === 'APPROVED' && (
              <div className="space-y-4 p-3.5 rounded-lg border border-primary/25 bg-primary/[0.03]">
                <div>
                  <p className="text-xs font-bold text-primary">
                    {pick(
                      'ধাপ ২: মূল কাগজপত্র যাচাই ও চূড়ান্ত ভর্তি (শাখা ও রোল নির্ধারণ)',
                      'Step 2: Document Verification & Final Admission'
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {pick(
                      'অফিসে জমা দেওয়া মূল কাগজপত্রে টিক দিন এবং শাখা ও অটো-সাজেস্টেড রোল নিশ্চিত করে ভর্তি সম্পন্ন করুন।',
                      'Verify original documents submitted at office and confirm section & roll to admit.'
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label={pick('শাখা', 'Section')} required>
                    <Select value={sectionId} onChange={(event) => handleSectionChange(event.target.value)}>
                      {sections
                        .filter((item) => item.classId === app.targetClassId)
                        .map((item) => {
                          const cnt = sectionCountMap.get(item.id) ?? 0;
                          return (
                            <option key={item.id} value={item.id}>
                              {pick(
                                `শাখা ${item.name} (${formatNumber(cnt, 'bn')} জন)`,
                                `Section ${item.name} (${cnt})`
                              )}
                            </option>
                          );
                        })}
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
                    {pick('মূল কাগজপত্র যাচাই (অফিসে জমাকৃত)', 'Physical Document Verification')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {appChecklist.map((item) => (
                      <label
                        key={item.key}
                        className="flex items-start gap-2 p-2.5 rounded border border-border bg-surface text-xs cursor-pointer hover:bg-surface-muted/40"
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
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
              {(app.status === 'NEW' || app.status === 'UNDER_REVIEW') ? (
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
                    {pick('সরাসরি পূর্ণ ফর্মে ভর্তি', 'Direct Full Form Admit')}
                  </Button>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" disabled={isLoading} onClick={() => act('REJECTED')}>
                      {pick('বাতিল করুন', 'Reject')}
                    </Button>
                    <Button variant="primary" size="sm" disabled={isLoading} onClick={() => act('APPROVED')}>
                      {pick('প্রাথমিক অনুমোদন দিন', 'Approve Application')}
                    </Button>
                  </div>
                </>
              ) : app.status === 'APPROVED' ? (
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
                    <Button variant="primary" size="sm" disabled={isLoading} onClick={() => act('ADMITTED')}>
                      {pick('চূড়ান্ত ভর্তি নিশ্চিত করুন', 'Confirm Final Admission')}
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
