'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  FileEdit,
  FileText,
  Filter,
  Printer,
  RotateCcw,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { useParams } from '@/src/lib/navigation';
import {
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
import { Button, Card, FormField, Input, Modal, Select } from '@/src/components/ui/primitives';
import { PrintableAdmissionConfirmationSlip } from '@/src/components/print/PrintDocuments';
import { cn, triggerPrint } from '@/src/lib/utils/cn';
import type { MockDatabase } from '@/src/mocks/seed';
import type { OnlineAdmissionApplication } from '@/src/types/proposed/future';
import {
  UnifiedAdmissionForm,
  type AdminAdmissionResult,
} from '@/src/features/admission/components/UnifiedAdmissionForm';
import {
  ADMISSION_TYPE_META,
  getNextSuggestedRoll,
  getOptionalSubjectsForClassGroup,
  getRequiredDocumentChecklist,
} from '@/src/features/admission/rules';
import { resolvePrimaryGuardianPhone } from '@/src/features/admission/mappers';

import { StudentDirectory } from './students/StudentDirectory';
import { StudentProfile } from './students/StudentProfile';
import { StudentEnrollments } from './students/StudentEnrollments';
import { StudentPromotions } from './students/StudentPromotions';
import { StudentTransfers } from './students/StudentTransfers';
import { StudentTestimonials } from './students/StudentTestimonials';
import { StudentRfidCards } from './students/StudentRfidCards';
import { classLabel, errorMessage } from './students/studentShared';

type SectionKey =
  | 'directory'
  | 'create'
  | 'admissions'
  | 'enrollments'
  | 'promotions'
  | 'transfers'
  | 'testimonials'
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
  testimonials: 'testimonials',
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
      title: pick('নতুন ভর্তি (৬ষ্ঠ – ১০ম শ্রেণি)', 'New Admission (Classes 6–10)'),
      description: pick(
        'একীভূত ভর্তি ফরম: শ্রেণি ও বিভাগ নির্বাচন, শিক্ষার্থীর পরিচয় ও ছবি, অভিভাবক ও ঠিকানা এবং শাখা-রোল ও কাগজপত্র যাচাই।',
        'Unified admission engine: class & stream rules, student identity & photo, parents & structured address, and office placement.'
      ),
      year: false,
    },
    admissions: {
      title: pick('অনলাইন ভর্তি আবেদন ইনবক্স', 'Online Admissions Inbox'),
      description: pick(
        'অনলাইন আবেদন যাচাই করে অনুমোদন, বাতিল, দ্রুত ভর্তি অথবা পূর্ণ ফর্মে সম্পাদনা করে ভর্তি নিশ্চিত করুন।',
        'Review online applications, verify documents, and quick-admit or open in the full admission form.'
      ),
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
    testimonials: {
      title: pick('প্রত্যয়নপত্র ও প্রশংসাপত্র (Testimonial)', 'Testimonial Certificates'),
      description: pick(
        'অধ্যয়ন ও চারিত্রিক প্রত্যয়নপত্র এবং এসএসসি প্রশংসাপত্র ইস্যু, স্মারক সংরক্ষণ ও আনুষ্ঠানিক A4 প্রিন্ট।',
        'Issue, track, and print official Study & Character certificates and SSC Graduate testimonials.'
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
      {section === 'testimonials' && <StudentTestimonials db={db} />}
      {section === 'cards' && <StudentRfidCards db={db} />}
      {section === 'import' && <Importer db={db} yearId={year.id} />}
      {section === 'profile' && <StudentProfile db={db} studentId={id ?? ''} yearId={year.id} startEditing={pathname.endsWith('/edit')} />}
    </StudentsShell>
  );
}

function AdmissionConfirmationView({
  db,
  result,
  onAdmitAnother,
}: {
  db: MockDatabase;
  result: AdminAdmissionResult;
  onAdmitAnother: () => void;
}) {
  const { locale, pick } = useI18n();
  const { student, enrollment, formValues } = result;
  const cls = db.classes.find((c) => c.id === enrollment.classId);
  const sec = db.sections.find((s) => s.id === enrollment.sectionId);
  const grp = db.academicGroups.find((g) => g.id === enrollment.groupId);
  const yr = db.academicYears.find((y) => y.id === enrollment.academicYearId);
  const optionals = enrollment.optionalClassSubjectId
    ? getOptionalSubjectsForClassGroup(db, enrollment.classId, enrollment.groupId, enrollment.academicYearId)
    : [];
  const chosenOpt = optionals.find((o) => o.classSubjectId === enrollment.optionalClassSubjectId);

  return (
    <div className="space-y-5">
      <Card className="p-5 border-success/40 bg-success/5 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-base font-bold text-success flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {pick('শিক্ষার্থী সফলভাবে ভর্তি সম্পন্ন হয়েছে!', 'Student Admitted Successfully!')}
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {pick('শিক্ষার্থী আইডি:', 'Student ID:')}{' '}
              <strong className="font-mono text-foreground">{student.studentId}</strong> ·{' '}
              {pick('রোল:', 'Roll:')}{' '}
              <strong className="font-mono text-foreground">{enrollment.roll}</strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm" onClick={triggerPrint}>
              <Printer className="w-4 h-4" />
              {pick('ভর্তি ও আইডি স্লিপ প্রিন্ট', 'Print Confirmation & ID Slip')}
            </Button>
            <Link href={`/admin/students/${student.id}`}>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4" />
                {pick('প্রোফাইল দেখুন', 'View Profile')}
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={onAdmitAnother}>
              <UserPlus className="w-4 h-4" />
              {pick('আরও একজন ভর্তি করুন', 'Admit Another')}
            </Button>
          </div>
        </div>
      </Card>

      <PrintableAdmissionConfirmationSlip
        school={db.schoolProfile}
        student={student}
        enrollment={enrollment}
        classNameLabel={cls ? (locale === 'bn' ? cls.nameBn || cls.name : cls.name) : ''}
        sectionName={sec?.name ?? ''}
        groupName={grp ? (locale === 'bn' ? grp.nameBn || grp.name : grp.name) : null}
        academicYearName={yr?.name ?? ''}
        fatherName={formValues.fatherNameBn}
        motherName={formValues.motherNameBn}
        guardianPhone={resolvePrimaryGuardianPhone(formValues)}
        optionalSubjectName={chosenOpt ? (locale === 'bn' ? chosenOpt.nameBn : chosenOpt.nameEn) : null}
      />
    </div>
  );
}

function Register({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const [admitted, setAdmitted] = useState<AdminAdmissionResult | null>(null);

  if (admitted) {
    return (
      <AdmissionConfirmationView
        db={db}
        result={admitted}
        onAdmitAnother={() => setAdmitted(null)}
      />
    );
  }

  return (
    <UnifiedAdmissionForm
      mode="admin"
      db={db}
      yearId={yearId}
      onAdminSuccess={(result) => setAdmitted(result)}
    />
  );
}

function Admissions({ db, yearId }: { db: MockDatabase; yearId: string }) {
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
        when: formatDateShort(item.submittedAt, locale),
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
      {/* 1. Large KPI Summary Cards (Informational Display) */}
      <Card className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border overflow-hidden">
        {/* Total Applications */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {pick('মোট আবেদন', 'Total Applications')}
            </span>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
              {formatNumber(totalCount, locale)}
            </span>
            <span className="text-xs text-muted-foreground">
              {pick('টি জমা', 'submitted')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {pick('চলতি শিক্ষাবর্ষের সকল অনলাইন আবেদন', 'All online applications in current session')}
          </p>
        </div>

        {/* Pending Review */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-warning">
              {pick('অপেক্ষমান আবেদন', 'Pending Review')}
            </span>
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tabular-nums text-warning">
              {formatNumber(pendingCount, locale)}
            </span>
            <span className="text-xs text-muted-foreground">
              {pick('টি যাচাই বাকি', 'pending action')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {pick('যাচাই ও ভর্তি সম্পন্নকরণের অপেক্ষায়', 'Awaiting review and enrollment')}
          </p>
        </div>

        {/* Admitted / Approved */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-success">
              {pick('ভর্তি সম্পন্ন ও অনুমোদিত', 'Admitted & Approved')}
            </span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tabular-nums text-success">
              {formatNumber(admittedCount, locale)}
            </span>
            <span className="text-xs text-muted-foreground">
              {pick('জন শিক্ষার্থী', 'students')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {pick('শিক্ষার্থী ডিরেক্টরিতে রোল ও শাখা বরাদ্দকৃত', 'Enrolled with assigned roll and section')}
          </p>
        </div>

        {/* Rejected */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-destructive">
              {pick('বাতিলকৃত আবেদন', 'Rejected')}
            </span>
            <XCircle className="w-4 h-4 text-destructive" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tabular-nums text-destructive">
              {formatNumber(rejectedCount, locale)}
            </span>
            <span className="text-xs text-muted-foreground">
              {pick('টি আবেদন', 'applications')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {pick('অসম্পূর্ণ বা ত্রুটিযুক্ত আবেদন', 'Incomplete or invalid applications')}
          </p>
        </div>
      </Card>

      {/* 2. Applications DataTable with Inline Status & Class Dropdowns */}
      <DataTable
        data={filteredRows}
        exportFilename="admissions.csv"
        toolbarExtra={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'PENDING' | 'ADMITTED' | 'REJECTED')}
              className="text-xs h-9 py-1 px-2.5 min-w-[130px] w-auto bg-surface"
              aria-label={pick('আবেদনের অবস্থা নির্বাচন করুন', 'Select status')}
            >
              <option value="ALL">{pick('সকল অবস্থা', 'All Statuses')}</option>
              <option value="PENDING">
                {pick('অপেক্ষমান', 'Pending')} ({formatNumber(pendingCount, locale)})
              </option>
              <option value="ADMITTED">
                {pick('ভর্তি সম্পন্ন', 'Admitted')} ({formatNumber(admittedCount, locale)})
              </option>
              <option value="REJECTED">
                {pick('বাতিলকৃত', 'Rejected')} ({formatNumber(rejectedCount, locale)})
              </option>
            </Select>

            <Select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="text-xs h-9 py-1 px-2.5 min-w-[125px] w-auto bg-surface"
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
                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                title={pick('ফিল্টার রিসেট করুন', 'Reset filter')}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
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
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              {pick('ফিল্টার রিসেট করুন', 'Reset filter')}
            </Button>
          ) : undefined
        }
        columns={[
          { accessorKey: 'applicationNumber', header: pick('আবেদন নং', 'Application'), cell: ({ row }) => <span className="font-mono text-sm tabular-nums">{row.original.applicationNumber}</span> },
          {
            accessorKey: 'studentNameBn',
            header: pick('শিক্ষার্থী', 'Student'),
            cell: ({ row }) => (
              <div className="flex items-center gap-2.5">
                {row.original.photoPreview && (
                  <img
                    src={row.original.photoPreview}
                    alt={row.original.studentNameEn}
                    referrerPolicy="no-referrer"
                    className="w-8 h-9 rounded object-cover border border-border shrink-0"
                  />
                )}
                <span>
                  {row.original.studentNameBn}
                  <span className="block text-xs text-muted-foreground font-mono uppercase">{row.original.studentNameEn}</span>
                </span>
              </div>
            ),
          },
          { accessorKey: 'classLabel', header: pick('শ্রেণি ও বিভাগ', 'Class & Group') },
          { accessorKey: 'typeLabel', header: pick('ধরন', 'Type') },
          { accessorKey: 'guardianPhone', header: pick('মোবাইল', 'Phone'), cell: ({ row }) => <span className="font-mono tabular-nums">{row.original.guardianPhone}</span> },
          { accessorKey: 'when', header: pick('তারিখ', 'Date') },
          { accessorKey: 'status', header: pick('অবস্থা', 'Status'), cell: ({ row }) => <StatusBadge enumName="AdmissionApplicationStatus" value={row.original.status} /> },
          {
            id: 'open',
            header: '',
            cell: ({ row }) => (
              <Button size="sm" variant="outline" onClick={() => open(row.original.id)}>
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
            {/* Applicant Identity Header */}
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
                {/* Quick Office Placement */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label={pick('শাখা', 'Section')} required>
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

                {/* Physical Document Verification Checklist */}
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
