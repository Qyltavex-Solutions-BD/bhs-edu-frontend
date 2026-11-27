'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Check,
  Copy,
  GraduationCap,
  Pencil,
  Phone,
  User,
} from 'lucide-react';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils/cn';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import {
  Button,
  Card,
  FormField,
  Input,
  Modal,
  Select,
  Textarea,
} from '@/src/components/ui/primitives';
import { getEnumMeta } from '@/src/lib/constants/enums';
import { closedDay, latestOpenDay, localToday } from '@/src/lib/schoolDay';
import {
  AttendanceMethod,
  AttendanceStatus,
  BloodGroup,
  CardStatus,
  Gender,
  Religion,
  StudentStatus,
} from '@/src/types/enums';
import { useUpdateStudentMutation } from '@/src/store/api';
import { useGetStudentByIdQuery } from '@/src/features/students/api/students.api';
import { useGetAcademicYearsQuery } from '@/src/services/academic/year.api';
import { useGetSchoolClassesQuery } from '@/src/services/academic/class.api';
import { useGetSectionsQuery } from '@/src/services/academic/section.api';
import { useGetAcademicGroupsQuery } from '@/src/services/academic/group.api';
import type { MockDatabase } from '@/src/mocks/seed';
import type { Attendance, Parent, ParentStudent, Student, StudentEnrollment, StudentRFIDcard } from '@/src/types/entities';
import { BLOOD_LABEL, errorMessage, studentInitials } from './studentShared';

const WEEKDAYS = [
  { bn: 'রবি', en: 'Sun' },
  { bn: 'সোম', en: 'Mon' },
  { bn: 'মঙ্গল', en: 'Tue' },
  { bn: 'বুধ', en: 'Wed' },
  { bn: 'বৃহ', en: 'Thu' },
  { bn: 'শুক্র', en: 'Fri' },
  { bn: 'শনি', en: 'Sat' },
];

type ProfileTab = 'overview' | 'attendance' | 'academic';

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
  if (status === AttendanceStatus.PRESENT) return 'bg-primary/10 text-primary border-primary/30';
  if (status === AttendanceStatus.LATE) return 'bg-secondary/15 text-secondary border-secondary/30';
  if (status === AttendanceStatus.ABSENT)
    return 'bg-destructive/12 text-destructive border-destructive/30';
  if (status === AttendanceStatus.LEAVE) return 'bg-info/12 text-info border-info/30';
  return '';
}

function computeAgeLabel(dob: string | null | undefined, refDate: string, locale: string) {
  if (!dob || !refDate) return '';
  const [by, bm, bd] = dob.slice(0, 10).split('-').map(Number);
  const [ry, rm, rd] = refDate.slice(0, 10).split('-').map(Number);
  if (!by || !bm || !bd || !ry || !rm || !rd) return '';
  let years = ry - by;
  let months = rm - bm;
  if (rd < bd) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return '';
  if (true) {
    return `${formatNumber(years, 'bn')} বছর ${formatNumber(months, 'bn')} মাস`;
  }
  return `${years} yrs ${months} mos`;
}

function AttendanceMonth({
  month,
  today,
  marks,
  closedOn,
  picked,
  onPick,
}: {
  month: string;
  today: string;
  marks: Attendance[];
  closedOn: (date: string) => string;
  picked: string | null;
  onPick: (date: string) => void;
}) {
  const byDate = useMemo(() => new Map(marks.map((item) => [item.date, item])), [marks]);
  const chosen = picked ? byDate.get(picked) : undefined;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1.5 text-center text-sm font-bold text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <div key={day.en} className="py-1">
            {day.bn}
          </div>
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
              className={cn(
                'h-10 rounded-[var(--radius)] border text-sm tabular-nums cursor-pointer transition-colors',
                tone ||
                  (quiet
                    ? 'border-transparent bg-surface-muted/70 text-muted-foreground'
                    : 'border-border bg-surface text-foreground hover:bg-surface-muted/50'),
                picked === cell.date && 'ring-2 ring-primary ring-offset-1',
                cell.date === today && 'font-bold'
              )}
            >
              {formatNumber(cell.day, 'bn')}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border text-sm">
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary/40" />
            {'উপস্থিত'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-secondary/45" />
            {'বিলম্ব'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-destructive/50" />
            {'অনুপস্থিত'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-info/50" />
            {'ছুটি'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-surface-muted border border-border" />
            {'বন্ধ'}
          </span>
        </div>

        <div className="text-foreground">
          {picked ? (
            <span className="inline-flex items-center gap-2">
              <span className="font-medium tabular-nums">
                {formatDateShort(`${picked}T12:00:00`, 'bn')}
              </span>
              <span aria-hidden="true">·</span>
              {chosen ? (
                <StatusBadge enumName="AttendanceStatus" value={chosen.status} />
              ) : (
                <span className="text-muted-foreground">
                  {closedOn(picked) || 'হাজিরা নথিভুক্ত নেই'}
                </span>
              )}
              {chosen?.inTime && (
                <span className="font-mono text-muted-foreground tabular-nums">
                  · {chosen.inTime.slice(11, 16)}
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {'যেকোনো তারিখে ক্লিক করে বিস্তারিত দেখুন।'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function StudentProfile({
  db,
  studentId,
  yearId,
  startEditing,
}: {
  db?: MockDatabase;
  studentId: string;
  yearId: string;
  startEditing: boolean;
}) {
  const [updateStudent, { isLoading }] = useUpdateStudentMutation();
  const { data: liveStudent, isLoading: loadingStudent } = useGetStudentByIdQuery(
    studentId,
    { skip: !studentId }
  );
  const { data: liveYears = [] } = useGetAcademicYearsQuery();
  const { data: liveClasses = [] } = useGetSchoolClassesQuery();
  const { data: liveSections = [] } = useGetSectionsQuery();
  const { data: liveGroups = [] } = useGetAcademicGroupsQuery();

  const academicYears = liveYears.length ? liveYears : db?.academicYears ?? [];
  const classes = liveClasses.length ? liveClasses : db?.classes ?? [];
  const sections = liveSections.length ? liveSections : db?.sections ?? [];
  const academicGroups = liveGroups.length ? liveGroups : db?.academicGroups ?? [];

  type LiveStudentShape = Student & {
    enrollments?: Array<
      StudentEnrollment & {
        academicYear?: { id: string; name: string; isActive: boolean };
        schoolClass?: { id: string; name: string; nameBn?: string | null; numericValue: number };
        section?: { id: string; name: string };
        group?: { id: string; name: string; nameBn?: string | null } | null;
      }
    >;
    parents?: Array<ParentStudent & { parent?: Parent }>;
    rfidcards?: StudentRFIDcard[];
  };

  const student = (liveStudent ??
    db?.students.find((item) => item.id === studentId)) as LiveStudentShape | undefined;

  const currentYearObj = academicYears.find((y) => y.id === yearId);
  // Deterministic initial reference date for SSR hydration safety, synced to local date on mount
  const fallbackRefDate = currentYearObj?.endDate?.slice(0, 10) || '2026-11-21';
  const [today, setToday] = useState<string>(fallbackRefDate);
  const [month, setMonth] = useState<string>(fallbackRefDate.slice(0, 7));

  const [open, setOpen] = useState(startEditing);
  const [form, setForm] = useState<Partial<Student>>({});
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setForm({
        nameEn: student.nameEn,
        nameBn: student.nameBn ?? '',
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '',
        gender: student.gender,
        bloodGroup: student.bloodGroup ?? undefined,
        religion: student.religion ?? undefined,
        birthCertificateNo: student.birthCertificateNo ?? '',
        boardRegistrationNo: student.boardRegistrationNo ?? '',
        presentAddress: student.presentAddress ?? '',
        permanentAddress: student.permanentAddress ?? '',
        previousSchoolName: student.previousSchoolName ?? '',
        status: student.status,
      });
    }
  }, [student]);

  useEffect(() => {
    const clientToday = localToday();
    setToday(clientToday);
    setMonth(clientToday.slice(0, 7));
    if (window.location.hash === '#attendance') {
      setActiveTab('attendance');
    }
  }, [studentId]);

  const copyText = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(text);
      toast.success(`${label} ${'কপি করা হয়েছে।'}`);
      setTimeout(() => setCopiedText((prev) => (prev === text ? null : prev)), 1800);
    }
  };

  if (loadingStudent && !student) {
    return <LoadingSkeleton />;
  }

  if (!student) {
    return (
      <Card className="p-10 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
        <p className="text-base font-semibold text-foreground">
          {'শিক্ষার্থী পাওয়া যায়নি।'}
        </p>
        <p className="text-sm text-muted-foreground">
          {'অনুরোধকৃত শিক্ষার্থীর তথ্য ডিরেক্টরিতে নেই অথবা সরানো হয়েছে।'}
        </p>
        <div className="pt-2">
          <Link href="/admin/students">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
              {'ডিরেক্টরিতে ফিরুন'}
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Academic & relational lookups
  const enrollments = (
    student.enrollments ??
    (db?.enrollments ?? []).filter((item) => item.studentId === student.id)
  )
    .slice()
    .sort((a, b) => {
      const ya = academicYears.find((y) => y.id === a.academicYearId)?.name ?? '';
      const yb = academicYears.find((y) => y.id === b.academicYearId)?.name ?? '';
      return yb.localeCompare(ya);
    });
  const enrollment =
    enrollments.find((item) => item.academicYearId === yearId) ?? enrollments[0];
  const section = enrollment
    ? sections.find((item) => item.id === enrollment.sectionId) ??
      (enrollment as { section?: { id: string; name: string } }).section
    : undefined;
  const group = enrollment?.groupId
    ? academicGroups.find((item) => item.id === enrollment.groupId) ??
      (enrollment as { group?: { id: string; name: string; nameBn?: string | null } }).group
    : undefined;

  const guardians = (
    student.parents
      ? student.parents.map((link) => ({ link, parent: link.parent }))
      : (db?.parentStudents ?? [])
          .filter((link) => link.studentId === student.id)
          .map((link) => ({
            link,
            parent: db?.parents.find((item) => item.id === link.parentId),
          }))
  )
    .filter((g) => Boolean(g.parent))
    .sort((a, b) => Number(b.link.isPrimary) - Number(a.link.isPrimary));
  const primaryGuardian = guardians[0];

  const cards =
    student.rfidcards ??
    (db?.rfidCards ?? []).filter((item) => item.studentId === student.id);
  const activeCard = cards.find((item) => item.status === CardStatus.ACTIVE) ?? cards[0];

  // Class teacher & optional subject for current enrollment
  const classTeacherLink = section && db
    ? db.sectionClassTeachers.find(
        (row) => row.sectionId === section.id && row.academicYearId === yearId
      )
    : null;
  const classTeacher = classTeacherLink && db
    ? db.staff.find((st) => st.id === classTeacherLink.staffId)
    : null;

  const optSubject = enrollment?.optionalClassSubjectId && db
    ? db.classSubjects.find((cs) => cs.id === enrollment.optionalClassSubjectId)
    : null;
  const optSubjectMaster = optSubject && db
    ? db.subjects.find((s) => s.id === optSubject.subjectId)
    : null;

  // Attendance analytics
  const todayClosed = db ? closedDay(db, today, yearId) : '';
  const todayMark = enrollment && db
    ? db.attendances.find(
        (item) => item.studentEnrollmentId === enrollment.id && item.date === today
      )
    : undefined;
  const method = enrollment && db
    ? db.classAttendanceConfigs.find((item) => item.classId === enrollment.classId)?.method
    : undefined;
  const registerDate = todayClosed && db ? latestOpenDay(db, yearId, today) : today;

  const allMarks = enrollment && db
    ? db.attendances.filter((item) => item.studentEnrollmentId === enrollment.id)
    : [];
  const totalPresent = allMarks.filter((item) => item.status === AttendanceStatus.PRESENT).length;
  const totalLate = allMarks.filter((item) => item.status === AttendanceStatus.LATE).length;
  const totalAbsent = allMarks.filter((item) => item.status === AttendanceStatus.ABSENT).length;
  const totalLeave = allMarks.filter((item) => item.status === AttendanceStatus.LEAVE).length;
  const totalWorkingDays = totalPresent + totalLate + totalAbsent + totalLeave;
  const annualAttendanceRate =
    totalWorkingDays > 0 ? Math.round(((totalPresent + totalLate) / totalWorkingDays) * 100) : null;

  const monthMarks = enrollment && db
    ? db.attendances
        .filter((item) => item.studentEnrollmentId === enrollment.id && item.date.startsWith(month))
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];
  const monthCount = (st: AttendanceStatus) =>
    monthMarks.filter((item) => item.status === st).length;

  const resolveClassText = (cId: string) => {
    const c = classes.find((item) => item.id === cId);
    if (!c) return '—';
    return c.nameBn || c.name;
  };

  // Academic exam results across enrollments
  const enrollmentIds = new Set(enrollments.map((e) => e.id));
  const examResults = (db?.resultSummaries ?? [])
    .filter((res) => enrollmentIds.has(res.studentEnrollmentId))
    .map((res) => {
      const exam = db?.exams.find((e) => e.id === res.examId);
      const enr = enrollments.find((e) => e.id === res.studentEnrollmentId);
      const yr = enr ? academicYears.find((y) => y.id === enr.academicYearId) : undefined;
      return {
        ...res,
        examName: exam?.name ?? '—',
        examDate: exam?.startDate ?? res.createdAt,
        yearName: yr?.name ?? '—',
        classText: enr ? resolveClassText(enr.classId) : '—',
      };
    })
    .sort((a, b) => b.examDate.localeCompare(a.examDate));

  const latestResult = examResults[0];

  const religionLabel = student.religion
    ? getEnumMeta('Religion', student.religion).bn
    : '—';

  const ageText = computeAgeLabel(student.dateOfBirth, today, 'bn');

  const beginEdit = () => {
    setForm({
      nameEn: student.nameEn,
      nameBn: student.nameBn ?? '',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '',
      gender: student.gender,
      bloodGroup: student.bloodGroup ?? undefined,
      religion: student.religion ?? undefined,
      birthCertificateNo: student.birthCertificateNo ?? '',
      boardRegistrationNo: student.boardRegistrationNo ?? '',
      presentAddress: student.presentAddress ?? '',
      permanentAddress: student.permanentAddress ?? '',
      previousSchoolName: student.previousSchoolName ?? '',
      status: student.status,
    });
    setOpen(true);
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await updateStudent({
        id: student.id,
        nameEn: form.nameEn?.trim() || undefined,
        nameBn: form.nameBn?.trim() || undefined,
        dateOfBirth: form.dateOfBirth ? form.dateOfBirth.slice(0, 10) : undefined,
        gender: form.gender,
        bloodGroup: form.bloodGroup || null,
        religion: form.religion || null,
        birthCertificateNo: form.birthCertificateNo?.trim() || undefined,
        boardRegistrationNo: form.boardRegistrationNo?.trim() || undefined,
        presentAddress: form.presentAddress?.trim() || undefined,
        permanentAddress: form.permanentAddress?.trim() || undefined,
        previousSchoolName: form.previousSchoolName?.trim() || undefined,
        status:
          form.status === StudentStatus.INACTIVE ? StudentStatus.INACTIVE : StudentStatus.ACTIVE,
      }).unwrap();
      toast.success('শিক্ষার্থীর তথ্য হালনাগাদ হয়েছে।');
      setOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, 'হালনাগাদ করা যায়নি।'));
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Back Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{'শিক্ষার্থী ডিরেক্টরিতে ফিরুন'}</span>
        </Link>
        <span className="text-sm text-muted-foreground font-mono">
          {student.studentId}
        </span>
      </div>

      {/* 2. Executive Institutional Student Header + KPI Strip (Single Flat Card) */}
      <Card className="overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Student Identity */}
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div
              className={cn(
                'w-16 h-16 rounded-[var(--radius)] flex items-center justify-center font-bold text-xl shrink-0 border border-border',
                student.gender === Gender.FEMALE
                  ? 'bg-secondary/10 text-secondary'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {studentInitials(student.nameEn)}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">
                  {student.nameBn || student.nameEn}
                </h2>
                <StatusBadge enumName="StudentStatus" value={student.status} />
              </div>

              <p className="text-sm text-muted-foreground">{student.nameEn}</p>

              {/* Clean unboxed metadata row */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted-foreground pt-0.5 tabular-nums">
                <button
                  type="button"
                  onClick={() => copyText(student.studentId, 'শিক্ষার্থী আইডি')}
                  className="inline-flex items-center gap-1 font-mono text-foreground hover:text-primary transition-colors cursor-pointer"
                  title={'আইডি কপি করুন'}
                >
                  <span>{student.studentId}</span>
                  {copiedText === student.studentId ? (
                    <Check className="w-3 h-3 text-success" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-60" />
                  )}
                </button>
                <span aria-hidden="true">·</span>
                {enrollment ? (
                  <>
                    <span className="font-medium text-foreground">
                      {resolveClassText(enrollment.classId)} ({section?.name ?? '—'})
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {'রোল'}{' '}
                      <strong className="text-foreground">
                        {formatNumber(enrollment.roll, 'bn')}
                      </strong>
                    </span>
                    {group && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{group.nameBn || group.name}</span>
                      </>
                    )}
                  </>
                ) : (
                  <span>
                    {'চলতি শিক্ষাবর্ষে এনরোলমেন্ট নেই'}
                  </span>
                )}
                {student.bloodGroup && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {'রক্তের গ্রুপ:'}{' '}
                      <strong className="text-foreground">
                        {BLOOD_LABEL[student.bloodGroup] || student.bloodGroup}
                      </strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Primary Action */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button size="sm" variant="primary" onClick={beginEdit}>
              <Pencil className="w-3.5 h-3.5" />
              <span>{'তথ্য সম্পাদনা'}</span>
            </Button>
          </div>
        </div>

        {/* 4-Column Academic Snapshot Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-t border-border divide-y sm:divide-y-0 sm:divide-x divide-border bg-surface-muted/30">
          <div className="p-5 space-y-1.5">
            <span className="text-sm font-bold text-foreground">
              {'বার্ষিক উপস্থিতি'}
            </span>
            <div className="flex items-baseline gap-2 tabular-nums">
              <span
                className={cn(
                  'text-2xl sm:text-3xl font-extrabold tracking-tight',
                  annualAttendanceRate === null
                    ? 'text-foreground'
                    : annualAttendanceRate >= 85
                      ? 'text-primary'
                      : annualAttendanceRate >= 75
                        ? 'text-warning'
                        : 'text-destructive'
                )}
              >
                {annualAttendanceRate !== null
                  ? `${formatNumber(annualAttendanceRate, 'bn')}%`
                  : '—'}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">
                {totalWorkingDays > 0
                  ? `(${formatNumber(totalPresent + totalLate, 'bn')}/${formatNumber(totalWorkingDays, 'bn')} দিন)`
                  : 'তথ্য নেই'}
              </span>
            </div>
          </div>

          <div className="p-5 space-y-1.5">
            <span className="text-sm font-bold text-foreground">
              {'সর্বশেষ পরীক্ষার ফলাফল'}
            </span>
            {latestResult ? (
              <div className="flex items-baseline gap-2 tabular-nums">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  GPA {latestResult.gpa != null ? latestResult.gpa.toFixed(2) : '—'}
                </span>
                <span className="text-sm font-semibold text-muted-foreground truncate">
                  {latestResult.letterGrade ? `${latestResult.letterGrade} · ` : ''}
                  {latestResult.meritPosition
                    ? `মেধাক্রম #${formatNumber(latestResult.meritPosition, 'bn')}`
                    : latestResult.examName}
                </span>
              </div>
            ) : (
              <p className="text-base font-semibold text-muted-foreground">
                {'কোনো প্রকাশিত ফল নেই'}
              </p>
            )}
          </div>

          <div className="p-5 space-y-1.5">
            <span className="text-sm font-bold text-foreground">
              {'আজকের উপস্থিতি'}
            </span>
            <div className="flex items-center gap-2 text-base">
              {todayClosed ? (
                <span className="font-semibold text-muted-foreground">{todayClosed}</span>
              ) : todayMark ? (
                <>
                  <StatusBadge enumName="AttendanceStatus" value={todayMark.status} />
                  {todayMark.inTime && (
                    <span className="text-sm font-mono text-muted-foreground tabular-nums font-semibold">
                      {todayMark.inTime.slice(11, 16)}
                    </span>
                  )}
                </>
              ) : method === AttendanceMethod.RFID ? (
                <span className="text-sm font-semibold text-secondary">
                  {'এখনো স্ক্যান হয়নি'}
                </span>
              ) : (
                <span className="text-sm font-medium text-muted-foreground">
                  {'এখনো নথিভুক্ত হয়নি'}
                </span>
              )}
            </div>
          </div>

          <div className="p-5 space-y-1.5">
            <span className="text-sm font-bold text-foreground">
              {'প্রধান অভিভাবক'}
            </span>
            {primaryGuardian?.parent ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-base font-bold text-foreground truncate">
                  {primaryGuardian.parent.nameBn || primaryGuardian.parent.name}
                </span>
                {primaryGuardian.parent.phone &&
                  !primaryGuardian.parent.phone.startsWith('unused-') && (
                    <a
                      href={`tel:${primaryGuardian.parent.phone}`}
                      className="inline-flex items-center gap-1 text-sm font-mono text-primary font-bold hover:underline shrink-0"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{primaryGuardian.parent.phone}</span>
                    </a>
                  )}
              </div>
            ) : (
              <p className="text-base font-medium text-muted-foreground">
                {'সংযুক্ত নেই'}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* 3. Workspace Navigation Tabs (3 Focused SIS Modules) */}
      <div
        className="flex items-center gap-1 border-b border-border overflow-x-auto"
        role="tablist"
      >
        {[
          { id: 'overview' as const, label: 'সার্বিক পরিচিতি', icon: User },
          {
            id: 'attendance' as const,
            label: 'হাজিরা ও ক্যালেন্ডার',
            icon: Calendar,
          },
          {
            id: 'academic' as const,
            label: 'একাডেমিক ও ফলাফল',
            icon: GraduationCap,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 cursor-pointer',
                isActive
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Left 2 Columns: Personal Dossier & Current Academic Placement */}
          <Card className="lg:col-span-2 divide-y divide-border">
            <div className="p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  {'ব্যক্তিগত ও নিবন্ধন তথ্য'}
                </h3>
                <Button size="sm" variant="ghost" onClick={beginEdit} className="text-primary">
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{'সম্পাদনা'}</span>
                </Button>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-base">
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {'জন্ম তারিখ ও বয়স'}
                  </dt>
                  <dd className="mt-1 font-medium text-foreground tabular-nums">
                    {student.dateOfBirth
                      ? `${formatDateShort(student.dateOfBirth, 'bn')}${ageText ? ` (${ageText})` : ''}`
                      : '—'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">
                    {'লিঙ্গ ও ধর্ম'}
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {student.gender === Gender.MALE ? 'ছাত্র' : 'ছাত্রী'}{' '}
                    · {religionLabel}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">
                    {'জন্ম নিবন্ধন নম্বর (BRN)'}
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5 font-mono text-foreground">
                    <span>{student.birthCertificateNo || '—'}</span>
                    {student.birthCertificateNo && (
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            student.birthCertificateNo!,
                            'জন্ম নিবন্ধন নম্বর'
                          )
                        }
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                        aria-label={'কপি করুন'}
                      >
                        {copiedText === student.birthCertificateNo ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">
                    {'বোর্ড রেজিস্ট্রেশন নম্বর'}
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5 font-mono text-foreground">
                    <span>{student.boardRegistrationNo || '—'}</span>
                    {student.boardRegistrationNo && (
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            student.boardRegistrationNo!,
                            'বোর্ড রেজিস্ট্রেশন'
                          )
                        }
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                        aria-label={'কপি করুন'}
                      >
                        {copiedText === student.boardRegistrationNo ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">
                    {'ভর্তির তারিখ'}
                  </dt>
                  <dd className="mt-1 font-medium text-foreground tabular-nums">
                    {student.admissionDate ? formatDateShort(student.admissionDate, 'bn') : '—'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">
                    {'পূর্বের শিক্ষাপ্রতিষ্ঠান ও জিপিএ'}
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {student.previousSchoolName || '—'}
                    {student.previousGpa
                      ? ` · GPA ${formatNumber(student.previousGpa, 'bn')}`
                      : ''}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-sm text-muted-foreground">
                    {'বর্তমান ঠিকানা'}
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {student.presentAddress || '—'}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-sm text-muted-foreground">
                    {'স্থায়ী ঠিকানা'}
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {student.permanentAddress || student.presentAddress || '—'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Current Session Placement Section */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  {'চলতি সেশনের একাডেমিক অবস্থান'}
                </h3>
                <Link
                  href="/admin/students/enrollments"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  <span>{'এনরোলমেন্ট ব্যবস্থাপনা'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-base">
                <div>
                  <dt className="text-sm text-muted-foreground">{'শিক্ষাবর্ষ'}</dt>
                  <dd className="mt-1 font-medium text-foreground tabular-nums">
                    {currentYearObj?.name ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {'শ্রেণি ও শাখা'}
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {enrollment
                      ? `${resolveClassText(enrollment.classId)} · ${section?.name ?? '—'}`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{'শ্রেণি রোল'}</dt>
                  <dd className="mt-1 font-semibold text-foreground tabular-nums">
                    {enrollment ? `#${formatNumber(enrollment.roll, 'bn')}` : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{'বিভাগ'}</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {group
                      ? group.nameBn || group.name
                      : 'সাধারণ'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {'শ্রেণি শিক্ষক'}
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {classTeacher?.nameBn || classTeacher?.name || 'নির্ধারিত হয়নি'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {'৪র্থ / ঐচ্ছিক বিষয়'}
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {optSubjectMaster
                      ? optSubjectMaster.nameBn || optSubjectMaster.name
                      : '—'}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>

          {/* Right Column: Guardians & Official Records */}
          <div className="space-y-5">
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  {'অভিভাবক ও যোগাযোগ'}
                </h3>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {formatNumber(guardians.length, 'bn')} {'জন'}
                </span>
              </div>

              {guardians.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {'কোনো অভিভাবক সংযুক্ত করা হয়নি।'}
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {guardians.map(({ link, parent }) => {
                    if (!parent) return null;
                    const cleanPhone =
                      parent.phone && !parent.phone.startsWith('unused-') ? parent.phone : null;
                    const relMeta = getEnumMeta('RelationshipType', link.relationship);
                    return (
                      <div key={link.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {parent.nameBn || parent.name}
                            </p>
                            {parent.nameBn && parent.name !== parent.nameBn && (
                              <p className="text-sm text-muted-foreground truncate">{parent.name}</p>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground shrink-0">
                            {relMeta.bn}
                          </span>
                        </div>

                        {cleanPhone && (
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <a
                              href={`tel:${cleanPhone}`}
                              className="inline-flex items-center gap-1.5 font-mono font-medium text-primary hover:underline"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>{cleanPhone}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => copyText(cleanPhone, 'মোবাইল নম্বর')}
                              className="text-muted-foreground hover:text-foreground cursor-pointer"
                              aria-label={'নম্বর কপি করুন'}
                            >
                              {copiedText === cleanPhone ? (
                                <Check className="w-3.5 h-3.5 text-success" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}

                        <p className="text-sm text-muted-foreground">
                          {[
                            link.isPrimary ? 'প্রধান অভিভাবক' : null,
                            link.isSmsReceiver ? 'SMS প্রাপক' : null,
                            parent.occupation || null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Administrative Records (RFID Tag) */}
            <Card className="p-5 sm:p-6 space-y-4">
              <h3 className="text-base font-semibold text-foreground">
                {'প্রশাসনিক নথি'}
              </h3>

              <dl className="text-base">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      {'হাজিরা RFID ট্যাগ'}
                    </dt>
                    <dd className="mt-0.5 font-mono text-base text-foreground">
                      {activeCard ? activeCard.cardNumber : 'ইস্যু হয়নি'}
                    </dd>
                  </div>
                  <Link
                    href="/admin/students/rfid-cards"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
                  >
                    <span>{'ব্যবস্থাপনা'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-5">
          {/* Flat hairline-divided annual breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 flex flex-col justify-between gap-2">
              <span className="text-base font-bold text-foreground">
                {'মোট উপস্থিত'}
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-primary mt-1">
                {formatNumber(totalPresent, 'bn')}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {'সময়মতো উপস্থিতি'}
              </p>
            </Card>
            <Card className="p-5 flex flex-col justify-between gap-2">
              <span className="text-base font-bold text-foreground">
                {'বিলম্বে উপস্থিত'}
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-secondary mt-1">
                {formatNumber(totalLate, 'bn')}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {'নির্ধারিত সময়ের পরে'}
              </p>
            </Card>
            <Card className="p-5 flex flex-col justify-between gap-2">
              <span className="text-base font-bold text-foreground">
                {'অনুপস্থিত'}
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-destructive mt-1">
                {formatNumber(totalAbsent, 'bn')}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {'অননুমোদিত অনুপস্থিতি'}
              </p>
            </Card>
            <Card className="p-5 flex flex-col justify-between gap-2">
              <span className="text-base font-bold text-foreground">
                {'অনুমোদিত ছুটি'}
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground mt-1">
                {formatNumber(totalLeave, 'bn')}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
                {`মোট কার্যদিবস ${formatNumber(totalWorkingDays, 'bn')} দিন`}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* Monthly Calendar */}
            <Card className="p-5 sm:p-6 lg:col-span-2 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {'মাসিক হাজিরা ক্যালেন্ডার'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
                    {`এই মাসে: উপস্থিত ${formatNumber(monthCount(AttendanceStatus.PRESENT), 'bn')} · বিলম্ব ${formatNumber(monthCount(AttendanceStatus.LATE), 'bn')} · অনুপস্থিত ${formatNumber(monthCount(AttendanceStatus.ABSENT), 'bn')} · ছুটি ${formatNumber(monthCount(AttendanceStatus.LEAVE), 'bn')}`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Input placeholder="মাস নির্বাচন লিখুন"
                    type="month"
                    value={month}
                    onChange={(event) => {
                      setMonth(event.target.value);
                      setPickedDay(null);
                    }}
                    className="w-40 h-9 text-sm"
                    aria-label={'মাস নির্বাচন'}
                  />
                  {enrollment && (
                    <Link
                      href={`/admin/attendance/daily?date=${registerDate}&classId=${enrollment.classId}&sectionId=${enrollment.sectionId}`}
                    >
                      <Button size="sm" variant="outline">
                        <span>{'শাখার রেজিস্টার'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              <AttendanceMonth
                month={month}
                today={today}
                marks={monthMarks}
                closedOn={(date) => closedDay(db, date, yearId)}
                picked={pickedDay}
                onPick={setPickedDay}
              />
            </Card>

            {/* Selected Month Recent Log */}
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-border">
                <h3 className="text-base font-semibold text-foreground">
                  {'সাম্প্রতিক হাজিরা লগ'}
                </h3>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {formatNumber(monthMarks.length, 'bn')} {'দিন'}
                </span>
              </div>

              {monthMarks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {'নির্বাচিত মাসে কোনো হাজিরা রেকর্ড নেই।'}
                </p>
              ) : (
                <div className="divide-y divide-border max-h-[360px] overflow-y-auto">
                  {monthMarks.slice(0, 15).map((mark) => (
                    <button
                      key={mark.id}
                      type="button"
                      onClick={() => setPickedDay(mark.date)}
                      className={cn(
                        'w-full py-2.5 px-2 -mx-2 rounded-md flex items-center justify-between gap-2 text-left text-sm hover:bg-surface-muted/60 transition-colors cursor-pointer',
                        pickedDay === mark.date && 'bg-surface-muted/80'
                      )}
                    >
                      <div>
                        <p className="font-medium text-foreground tabular-nums">
                          {formatDateShort(`${mark.date}T12:00:00`, 'bn')}
                        </p>
                        {mark.inTime && (
                          <p className="text-sm font-mono text-muted-foreground tabular-nums">
                            {'প্রবেশ:'} {mark.inTime.slice(11, 16)}
                          </p>
                        )}
                      </div>
                      <StatusBadge enumName="AttendanceStatus" value={mark.status} />
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: ACADEMIC & RESULTS */}
      {activeTab === 'academic' && (
        <div className="space-y-5">
          {/* Exam Results Table */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>{'পরীক্ষার ফলাফল ও মেধাক্রম'}</span>
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {'প্রকাশিত ও সংরক্ষিত সকল পরীক্ষার নম্বর, জিপিএ ও মেধাক্রমের তালিকা।'}
                </p>
              </div>
              <Link
                href="/admin/results/mark-sheets"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                <span>{'নম্বরপত্র ডেস্ক'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {examResults.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {'এই শিক্ষার্থীর কোনো পরীক্ষার ফলাফল এখনো প্রকাশিত হয়নি।'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-base text-left border-collapse">
                  <thead className="bg-surface-muted/70 border-b border-border text-sm font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">{'পরীক্ষা'}</th>
                      <th className="px-5 py-3">{'শিক্ষাবর্ষ ও শ্রেণি'}</th>
                      <th className="px-5 py-3 text-right">{'প্রাপ্ত নম্বর'}</th>
                      <th className="px-5 py-3 text-right">{'জিপিএ'}</th>
                      <th className="px-5 py-3">{'গ্রেড'}</th>
                      <th className="px-5 py-3 text-right">{'মেধাক্রম'}</th>
                      <th className="px-5 py-3">{'অবস্থা'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {examResults.map((res) => (
                      <tr key={res.id} className="hover:bg-surface-muted/40 transition-colors">
                        <td className="px-5 py-3 font-medium text-foreground">{res.examName}</td>
                        <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                          {res.yearName} · {res.classText}
                        </td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums text-foreground">
                          {formatNumber(res.totalMarks, 'bn')} /{' '}
                          {formatNumber(res.totalFullMarks, 'bn')}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold tabular-nums text-primary">
                          {res.gpa != null ? res.gpa.toFixed(2) : '—'}
                        </td>
                        <td className="px-5 py-3 font-semibold text-foreground">
                          {res.letterGrade || '—'}
                        </td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums text-foreground">
                          {res.meritPosition
                            ? `#${formatNumber(res.meritPosition, 'bn')}`
                            : '—'}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge enumName="ResultStatus" value={res.resultStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Enrollment History Table */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {'শিক্ষাবর্ষভিত্তিক এনরোলমেন্ট ইতিহাস'}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {'ভর্তি থেকে বর্তমান পর্যন্ত শ্রেণি, শাখা, রোল এবং উত্তীর্ণ হওয়ার ধারাবাহিক রেকর্ড।'}
                </p>
              </div>
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatNumber(enrollments.length, 'bn')} {'টি সেশন'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-base text-left border-collapse">
                <thead className="bg-surface-muted/70 border-b border-border text-sm font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">{'শিক্ষাবর্ষ'}</th>
                    <th className="px-5 py-3">{'শ্রেণি'}</th>
                    <th className="px-5 py-3">{'শাখা'}</th>
                    <th className="px-5 py-3">{'বিভাগ'}</th>
                    <th className="px-5 py-3 text-right">{'রোল'}</th>
                    <th className="px-5 py-3">{'অবস্থা'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enrollments.map((enr) => {
                    const y = academicYears.find((item) => item.id === enr.academicYearId);
                    const s = sections.find((item) => item.id === enr.sectionId);
                    const g = enr.groupId
                      ? academicGroups.find((item) => item.id === enr.groupId)
                      : null;
                    const isCurrent = enr.academicYearId === yearId;
                    return (
                      <tr
                        key={enr.id}
                        className={cn(
                          'hover:bg-surface-muted/40 transition-colors',
                          isCurrent && 'bg-primary/[0.03]'
                        )}
                      >
                        <td className="px-5 py-3 font-medium text-foreground tabular-nums whitespace-nowrap">
                          {y?.name ?? '—'}
                          {isCurrent && (
                            <span className="ml-2 text-sm font-medium text-primary">
                              · {'চলতি'}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-foreground">
                          {resolveClassText(enr.classId)}
                        </td>
                        <td className="px-5 py-3 text-foreground">{s?.name ?? '—'}</td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {g
                            ? g.nameBn || g.name
                            : 'সাধারণ'}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold tabular-nums text-foreground">
                          {formatNumber(enr.roll, 'bn')}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge enumName="EnrollmentStatus" value={enr.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Student Profile Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={'শিক্ষার্থীর প্রোফাইল সম্পাদনা'}
      >
        <form onSubmit={saveEdit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={'ইংরেজি নাম'} required>
            <Input placeholder="ইংরেজি নাম লিখুন"
              value={form.nameEn ?? ''}
              onChange={(event) => setForm({ ...form, nameEn: event.target.value })}
            />
          </FormField>
          <FormField label={'বাংলা নাম'}>
            <Input placeholder="বাংলা নাম লিখুন"
              value={form.nameBn ?? ''}
              onChange={(event) => setForm({ ...form, nameBn: event.target.value })}
            />
          </FormField>
          <FormField label={'জন্ম তারিখ'}>
            <Input
              type="date"
              value={form.dateOfBirth ?? ''}
              onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })}
            />
          </FormField>
          <FormField label={'লিঙ্গ'}>
            <Select
              value={form.gender}
              onChange={(event) => setForm({ ...form, gender: event.target.value as Gender })}
            >
              <option value={Gender.MALE}>{'ছাত্র'}</option>
              <option value={Gender.FEMALE}>{'ছাত্রী'}</option>
            </Select>
          </FormField>
          <FormField label={'জন্ম নিবন্ধন নম্বর'}>
            <Input placeholder="জন্ম নিবন্ধন নম্বর লিখুন"
              value={form.birthCertificateNo ?? ''}
              onChange={(event) => setForm({ ...form, birthCertificateNo: event.target.value })}
            />
          </FormField>
          <FormField label={'বোর্ড রেজিস্ট্রেশন নম্বর'}>
            <Input placeholder="বোর্ড রেজিস্ট্রেশন নম্বর লিখুন"
              value={form.boardRegistrationNo ?? ''}
              onChange={(event) => setForm({ ...form, boardRegistrationNo: event.target.value })}
            />
          </FormField>
          <FormField label={'রক্তের গ্রুপ'}>
            <Select
              value={form.bloodGroup ?? ''}
              onChange={(event) =>
                setForm({ ...form, bloodGroup: (event.target.value || null) as BloodGroup | null })
              }
            >
              <option value="">{'নির্বাচন করুন'}</option>
              {Object.keys(BLOOD_LABEL).map((bg) => (
                <option key={bg} value={bg}>
                  {BLOOD_LABEL[bg]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={'ধর্ম'}>
            <Select
              value={form.religion ?? ''}
              onChange={(event) =>
                setForm({ ...form, religion: (event.target.value || null) as Religion | null })
              }
            >
              <option value="">{'নির্বাচন করুন'}</option>
              <option value={Religion.ISLAM}>{'ইসলাম'}</option>
              <option value={Religion.HINDUISM}>{'হিন্দু'}</option>
              <option value={Religion.BUDDHISM}>{'বৌদ্ধ'}</option>
              <option value={Religion.CHRISTIANITY}>{'খ্রিষ্টান'}</option>
            </Select>
          </FormField>
          <div className="sm:col-span-2">
            <FormField label={'বর্তমান ঠিকানা'}>
              <Textarea placeholder="বর্তমান ঠিকানা লিখুন..."
                value={form.presentAddress ?? ''}
                onChange={(event) => setForm({ ...form, presentAddress: event.target.value })}
              />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label={'স্থায়ী ঠিকানা'}>
              <Textarea placeholder="স্থায়ী ঠিকানা লিখুন..."
                value={form.permanentAddress ?? ''}
                onChange={(event) => setForm({ ...form, permanentAddress: event.target.value })}
              />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label={'পূর্বের শিক্ষাপ্রতিষ্ঠান'}>
              <Input placeholder="পূর্বের শিক্ষাপ্রতিষ্ঠান লিখুন"
                value={form.previousSchoolName ?? ''}
                onChange={(event) => setForm({ ...form, previousSchoolName: event.target.value })}
              />
            </FormField>
          </div>
          {student.status !== StudentStatus.TRANSFERRED &&
            student.status !== StudentStatus.GRADUATED && (
              <FormField label={'অবস্থা'}>
                <Select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as StudentStatus })
                  }
                >
                  <option value={StudentStatus.ACTIVE}>{'সক্রিয়'}</option>
                  <option value={StudentStatus.INACTIVE}>{'নিষ্ক্রিয়'}</option>
                </Select>
              </FormField>
            )}
          <div className="sm:col-span-2 flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {'বাতিল'}
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}