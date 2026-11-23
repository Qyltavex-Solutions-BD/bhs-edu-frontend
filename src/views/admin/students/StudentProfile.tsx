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
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils/cn';
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
import type { MockDatabase } from '@/src/mocks/seed';
import type { Attendance, Student } from '@/src/types/entities';
import { BLOOD_LABEL, classLabel, errorMessage, studentInitials } from './studentShared';

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
  if (locale === 'bn') {
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
  const { locale, pick } = useI18n();
  const byDate = useMemo(() => new Map(marks.map((item) => [item.date, item])), [marks]);
  const chosen = picked ? byDate.get(picked) : undefined;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1.5 text-center text-sm font-bold text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <div key={day.en} className="py-1">
            {locale === 'bn' ? day.bn : day.en}
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
              {formatNumber(cell.day, locale)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border text-xs">
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary/40" />
            {pick('উপস্থিত', 'Present')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-secondary/45" />
            {pick('বিলম্ব', 'Late')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-destructive/50" />
            {pick('অনুপস্থিত', 'Absent')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-info/50" />
            {pick('ছুটি', 'Leave')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-surface-muted border border-border" />
            {pick('বন্ধ', 'Closed')}
          </span>
        </div>

        <div className="text-foreground">
          {picked ? (
            <span className="inline-flex items-center gap-2">
              <span className="font-medium tabular-nums">
                {formatDateShort(`${picked}T12:00:00`, locale)}
              </span>
              <span aria-hidden="true">·</span>
              {chosen ? (
                <StatusBadge enumName="AttendanceStatus" value={chosen.status} />
              ) : (
                <span className="text-muted-foreground">
                  {closedOn(picked) || pick('হাজিরা নথিভুক্ত নেই', 'No record')}
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
              {pick('যেকোনো তারিখে ক্লিক করে বিস্তারিত দেখুন।', 'Select any date to inspect punch details.')}
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
  db: MockDatabase;
  studentId: string;
  yearId: string;
  startEditing: boolean;
}) {
  const { locale, pick } = useI18n();
  const [updateStudent, { isLoading }] = useUpdateStudentMutation();
  const student = db.students.find((item) => item.id === studentId);

  const currentYearObj = db.academicYears.find((y) => y.id === yearId);
  // Deterministic initial reference date for SSR hydration safety, synced to local date on mount
  const fallbackRefDate = currentYearObj?.endDate?.slice(0, 10) || '2026-11-21';
  const [today, setToday] = useState<string>(fallbackRefDate);
  const [month, setMonth] = useState<string>(fallbackRefDate.slice(0, 7));

  const [open, setOpen] = useState(startEditing);
  const [form, setForm] = useState<Partial<Student>>(() =>
    student
      ? {
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
          status: student.status,
        }
      : {}
  );
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

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
      toast.success(`${label} ${pick('কপি করা হয়েছে।', 'copied.')}`);
      setTimeout(() => setCopiedText((prev) => (prev === text ? null : prev)), 1800);
    }
  };

  if (!student) {
    return (
      <Card className="p-10 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
        <p className="text-base font-semibold text-foreground">
          {pick('শিক্ষার্থী পাওয়া যায়নি।', 'Student record not found.')}
        </p>
        <p className="text-sm text-muted-foreground">
          {pick(
            'অনুরোধকৃত শিক্ষার্থীর তথ্য ডিরেক্টরিতে নেই অথবা সরানো হয়েছে।',
            'The requested student record does not exist in this directory.'
          )}
        </p>
        <div className="pt-2">
          <Link href="/admin/students">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
              {pick('ডিরেক্টরিতে ফিরুন', 'Back to directory')}
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Academic & relational lookups
  const enrollments = db.enrollments
    .filter((item) => item.studentId === student.id)
    .sort((a, b) => {
      const ya = db.academicYears.find((y) => y.id === a.academicYearId)?.name ?? '';
      const yb = db.academicYears.find((y) => y.id === b.academicYearId)?.name ?? '';
      return yb.localeCompare(ya);
    });
  const enrollment = enrollments.find((item) => item.academicYearId === yearId);
  const section = enrollment
    ? db.sections.find((item) => item.id === enrollment.sectionId)
    : undefined;
  const group = enrollment?.groupId
    ? db.academicGroups.find((item) => item.id === enrollment.groupId)
    : undefined;

  const guardians = db.parentStudents
    .filter((link) => link.studentId === student.id)
    .map((link) => ({ link, parent: db.parents.find((item) => item.id === link.parentId) }))
    .filter((g) => Boolean(g.parent))
    .sort((a, b) => Number(b.link.isPrimary) - Number(a.link.isPrimary));
  const primaryGuardian = guardians[0];

  const cards = db.rfidCards.filter((item) => item.studentId === student.id);
  const activeCard = cards.find((item) => item.status === CardStatus.ACTIVE) ?? cards[0];

  // Class teacher & optional subject for current enrollment
  const classTeacherLink = section
    ? db.sectionClassTeachers.find(
        (row) => row.sectionId === section.id && row.academicYearId === yearId
      )
    : null;
  const classTeacher = classTeacherLink
    ? db.staff.find((st) => st.id === classTeacherLink.staffId)
    : null;

  const optSubject = enrollment?.optionalClassSubjectId
    ? db.classSubjects.find((cs) => cs.id === enrollment.optionalClassSubjectId)
    : null;
  const optSubjectMaster = optSubject
    ? db.subjects.find((s) => s.id === optSubject.subjectId)
    : null;

  // Attendance analytics
  const todayClosed = closedDay(db, today, yearId);
  const todayMark = enrollment
    ? db.attendances.find(
        (item) => item.studentEnrollmentId === enrollment.id && item.date === today
      )
    : undefined;
  const method = enrollment
    ? db.classAttendanceConfigs.find((item) => item.classId === enrollment.classId)?.method
    : undefined;
  const registerDate = todayClosed ? latestOpenDay(db, yearId, today) : today;

  const allMarks = enrollment
    ? db.attendances.filter((item) => item.studentEnrollmentId === enrollment.id)
    : [];
  const totalPresent = allMarks.filter((item) => item.status === AttendanceStatus.PRESENT).length;
  const totalLate = allMarks.filter((item) => item.status === AttendanceStatus.LATE).length;
  const totalAbsent = allMarks.filter((item) => item.status === AttendanceStatus.ABSENT).length;
  const totalLeave = allMarks.filter((item) => item.status === AttendanceStatus.LEAVE).length;
  const totalWorkingDays = totalPresent + totalLate + totalAbsent + totalLeave;
  const annualAttendanceRate =
    totalWorkingDays > 0 ? Math.round(((totalPresent + totalLate) / totalWorkingDays) * 100) : null;

  const monthMarks = enrollment
    ? db.attendances
        .filter((item) => item.studentEnrollmentId === enrollment.id && item.date.startsWith(month))
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];
  const monthCount = (st: AttendanceStatus) =>
    monthMarks.filter((item) => item.status === st).length;

  // Academic exam results across enrollments
  const enrollmentIds = new Set(enrollments.map((e) => e.id));
  const examResults = db.resultSummaries
    .filter((res) => enrollmentIds.has(res.studentEnrollmentId))
    .map((res) => {
      const exam = db.exams.find((e) => e.id === res.examId);
      const enr = enrollments.find((e) => e.id === res.studentEnrollmentId);
      const yr = enr ? db.academicYears.find((y) => y.id === enr.academicYearId) : undefined;
      return {
        ...res,
        examName: exam?.name ?? '—',
        examDate: exam?.startDate ?? res.createdAt,
        yearName: yr?.name ?? '—',
        classText: enr ? classLabel(db, enr.classId, locale) : '—',
      };
    })
    .sort((a, b) => b.examDate.localeCompare(a.examDate));

  const latestResult = examResults[0];

  const religionLabel = student.religion
    ? locale === 'bn'
      ? getEnumMeta('Religion', student.religion).bn
      : getEnumMeta('Religion', student.religion).en
    : '—';

  const ageText = computeAgeLabel(student.dateOfBirth, today, locale);

  const beginEdit = () => {
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
      status: student.status,
    });
    setOpen(true);
  };

  const saveEdit = async (event: React.FormEvent) => {
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
        status:
          form.status === StudentStatus.INACTIVE ? StudentStatus.INACTIVE : StudentStatus.ACTIVE,
      }).unwrap();
      toast.success(pick('শিক্ষার্থীর তথ্য হালনাগাদ হয়েছে।', 'Student profile updated.'));
      setOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, pick('হালনাগাদ করা যায়নি।', 'Could not update the profile.')));
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
          <span>{pick('শিক্ষার্থী ডিরেক্টরিতে ফিরুন', 'Back to Student Directory')}</span>
        </Link>
        <span className="text-xs text-muted-foreground font-mono">
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
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground pt-0.5 tabular-nums">
                <button
                  type="button"
                  onClick={() => copyText(student.studentId, pick('শিক্ষার্থী আইডি', 'Student ID'))}
                  className="inline-flex items-center gap-1 font-mono text-foreground hover:text-primary transition-colors cursor-pointer"
                  title={pick('আইডি কপি করুন', 'Copy student ID')}
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
                      {classLabel(db, enrollment.classId, locale)} ({section?.name ?? '—'})
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {pick('রোল', 'Roll')}{' '}
                      <strong className="text-foreground">
                        {formatNumber(enrollment.roll, locale)}
                      </strong>
                    </span>
                    {group && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{locale === 'bn' ? group.nameBn || group.name : group.name}</span>
                      </>
                    )}
                  </>
                ) : (
                  <span>
                    {pick('চলতি শিক্ষাবর্ষে এনরোলমেন্ট নেই', 'Not enrolled in selected session')}
                  </span>
                )}
                {student.bloodGroup && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {pick('রক্তের গ্রুপ:', 'Blood:')}{' '}
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
              <span>{pick('তথ্য সম্পাদনা', 'Edit Profile')}</span>
            </Button>
          </div>
        </div>

        {/* 4-Column Academic Snapshot Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-t border-border divide-y sm:divide-y-0 sm:divide-x divide-border bg-surface-muted/30">
          <div className="p-5 space-y-1.5">
            <span className="text-sm font-bold text-foreground">
              {pick('বার্ষিক উপস্থিতি', 'Annual Attendance')}
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
                  ? `${formatNumber(annualAttendanceRate, locale)}%`
                  : '—'}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">
                {totalWorkingDays > 0
                  ? pick(
                      `(${formatNumber(totalPresent + totalLate, locale)}/${formatNumber(totalWorkingDays, locale)} দিন)`,
                      `(${totalPresent + totalLate}/${totalWorkingDays} days)`
                    )
                  : pick('তথ্য নেই', 'No records')}
              </span>
            </div>
          </div>

          <div className="p-5 space-y-1.5">
            <span className="text-sm font-bold text-foreground">
              {pick('সর্বশেষ পরীক্ষার ফলাফল', 'Latest Exam Standing')}
            </span>
            {latestResult ? (
              <div className="flex items-baseline gap-2 tabular-nums">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  GPA {latestResult.gpa != null ? latestResult.gpa.toFixed(2) : '—'}
                </span>
                <span className="text-sm font-semibold text-muted-foreground truncate">
                  {latestResult.letterGrade ? `${latestResult.letterGrade} · ` : ''}
                  {latestResult.meritPosition
                    ? pick(
                        `মেধাক্রম #${formatNumber(latestResult.meritPosition, locale)}`,
                        `Rank #${latestResult.meritPosition}`
                      )
                    : latestResult.examName}
                </span>
              </div>
            ) : (
              <p className="text-base font-semibold text-muted-foreground">
                {pick('কোনো প্রকাশিত ফল নেই', 'No published result')}
              </p>
            )}
          </div>

          <div className="p-5 space-y-1.5">
            <span className="text-sm font-bold text-foreground">
              {pick('আজকের উপস্থিতি', "Today's Status")}
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
                  {pick('এখনো স্ক্যান হয়নি', 'Not scanned yet')}
                </span>
              ) : (
                <span className="text-sm font-medium text-muted-foreground">
                  {pick('এখনো নথিভুক্ত হয়নি', 'Not marked yet')}
                </span>
              )}
            </div>
          </div>

          <div className="p-5 space-y-1.5">
            <span className="text-sm font-bold text-foreground">
              {pick('প্রধান অভিভাবক', 'Primary Guardian')}
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
                {pick('সংযুক্ত নেই', 'Not linked')}
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
          { id: 'overview' as const, label: pick('সার্বিক পরিচিতি', 'Overview'), icon: User },
          {
            id: 'attendance' as const,
            label: pick('হাজিরা ও ক্যালেন্ডার', 'Attendance'),
            icon: Calendar,
          },
          {
            id: 'academic' as const,
            label: pick('একাডেমিক ও ফলাফল', 'Academic & Results'),
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
                  {pick('ব্যক্তিগত ও নিবন্ধন তথ্য', 'Personal & Registration Information')}
                </h3>
                <Button size="sm" variant="ghost" onClick={beginEdit} className="text-primary">
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{pick('সম্পাদনা', 'Edit')}</span>
                </Button>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {pick('জন্ম তারিখ ও বয়স', 'Date of Birth & Age')}
                  </dt>
                  <dd className="mt-1 font-medium text-foreground tabular-nums">
                    {student.dateOfBirth
                      ? `${formatDateShort(student.dateOfBirth, locale)}${ageText ? ` (${ageText})` : ''}`
                      : '—'}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">
                    {pick('লিঙ্গ ও ধর্ম', 'Gender & Religion')}
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {student.gender === Gender.MALE ? pick('ছাত্র', 'Male') : pick('ছাত্রী', 'Female')}{' '}
                    · {religionLabel}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">
                    {pick('জন্ম নিবন্ধন নম্বর (BRN)', 'Birth Certificate Number')}
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5 font-mono text-foreground">
                    <span>{student.birthCertificateNo || '—'}</span>
                    {student.birthCertificateNo && (
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            student.birthCertificateNo!,
                            pick('জন্ম নিবন্ধন নম্বর', 'Birth Certificate No.')
                          )
                        }
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                        aria-label={pick('কপি করুন', 'Copy')}
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
                  <dt className="text-xs text-muted-foreground">
                    {pick('বোর্ড রেজিস্ট্রেশন নম্বর', 'Board Registration Number')}
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5 font-mono text-foreground">
                    <span>{student.boardRegistrationNo || '—'}</span>
                    {student.boardRegistrationNo && (
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            student.boardRegistrationNo!,
                            pick('বোর্ড রেজিস্ট্রেশন', 'Board Registration')
                          )
                        }
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                        aria-label={pick('কপি করুন', 'Copy')}
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
                  <dt className="text-xs text-muted-foreground">
                    {pick('ভর্তির তারিখ', 'Admission Date')}
                  </dt>
                  <dd className="mt-1 font-medium text-foreground tabular-nums">
                    {student.admissionDate ? formatDateShort(student.admissionDate, locale) : '—'}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">
                    {pick('পূর্বের শিক্ষাপ্রতিষ্ঠান ও জিপিএ', 'Previous Institution & GPA')}
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {student.previousSchoolName || '—'}
                    {student.previousGpa
                      ? ` · GPA ${formatNumber(student.previousGpa, locale)}`
                      : ''}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">
                    {pick('বর্তমান ঠিকানা', 'Present Address')}
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {student.presentAddress || '—'}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">
                    {pick('স্থায়ী ঠিকানা', 'Permanent Address')}
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
                  {pick('চলতি সেশনের একাডেমিক অবস্থান', 'Current Session Placement')}
                </h3>
                <Link
                  href="/admin/students/enrollments"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <span>{pick('এনরোলমেন্ট ব্যবস্থাপনা', 'Manage enrollments')}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">{pick('শিক্ষাবর্ষ', 'Session')}</dt>
                  <dd className="mt-1 font-medium text-foreground tabular-nums">
                    {currentYearObj?.name ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {pick('শ্রেণি ও শাখা', 'Class & Section')}
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {enrollment
                      ? `${classLabel(db, enrollment.classId, locale)} · ${section?.name ?? '—'}`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{pick('শ্রেণি রোল', 'Class Roll')}</dt>
                  <dd className="mt-1 font-semibold text-foreground tabular-nums">
                    {enrollment ? `#${formatNumber(enrollment.roll, locale)}` : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{pick('বিভাগ', 'Stream')}</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {group
                      ? locale === 'bn'
                        ? group.nameBn || group.name
                        : group.name
                      : pick('সাধারণ', 'General')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {pick('শ্রেণি শিক্ষক', 'Class Teacher')}
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {classTeacher?.nameBn || classTeacher?.name || pick('নির্ধারিত হয়নি', 'Not assigned')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {pick('৪র্থ / ঐচ্ছিক বিষয়', 'Optional Subject')}
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {optSubjectMaster
                      ? locale === 'bn'
                        ? optSubjectMaster.nameBn || optSubjectMaster.name
                        : optSubjectMaster.name
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
                  {pick('অভিভাবক ও যোগাযোগ', 'Guardians & Contacts')}
                </h3>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatNumber(guardians.length, locale)} {pick('জন', 'linked')}
                </span>
              </div>

              {guardians.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {pick('কোনো অভিভাবক সংযুক্ত করা হয়নি।', 'No guardians linked yet.')}
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
                              <p className="text-xs text-muted-foreground truncate">{parent.name}</p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {locale === 'bn' ? relMeta.bn : relMeta.en}
                          </span>
                        </div>

                        {cleanPhone && (
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <a
                              href={`tel:${cleanPhone}`}
                              className="inline-flex items-center gap-1.5 font-mono font-medium text-primary hover:underline"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>{cleanPhone}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => copyText(cleanPhone, pick('মোবাইল নম্বর', 'Phone'))}
                              className="text-muted-foreground hover:text-foreground cursor-pointer"
                              aria-label={pick('নম্বর কপি করুন', 'Copy phone')}
                            >
                              {copiedText === cleanPhone ? (
                                <Check className="w-3.5 h-3.5 text-success" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          {[
                            link.isPrimary ? pick('প্রধান অভিভাবক', 'Primary guardian') : null,
                            link.isSmsReceiver ? pick('SMS প্রাপক', 'SMS recipient') : null,
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
                {pick('প্রশাসনিক নথি', 'Administrative Records')}
              </h3>

              <dl className="text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {pick('হাজিরা RFID ট্যাগ', 'Attendance RFID Tag')}
                    </dt>
                    <dd className="mt-0.5 font-mono text-sm text-foreground">
                      {activeCard ? activeCard.cardNumber : pick('ইস্যু হয়নি', 'Not assigned')}
                    </dd>
                  </div>
                  <Link
                    href="/admin/students/rfid-cards"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
                  >
                    <span>{pick('ব্যবস্থাপনা', 'Manage')}</span>
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
                {pick('মোট উপস্থিত', 'Days Present')}
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-primary mt-1">
                {formatNumber(totalPresent, locale)}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pick('সময়মতো উপস্থিতি', 'On-time records')}
              </p>
            </Card>
            <Card className="p-5 flex flex-col justify-between gap-2">
              <span className="text-base font-bold text-foreground">
                {pick('বিলম্বে উপস্থিত', 'Days Late')}
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-secondary mt-1">
                {formatNumber(totalLate, locale)}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pick('নির্ধারিত সময়ের পরে', 'Arrived after bell')}
              </p>
            </Card>
            <Card className="p-5 flex flex-col justify-between gap-2">
              <span className="text-base font-bold text-foreground">
                {pick('অনুপস্থিত', 'Days Absent')}
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-destructive mt-1">
                {formatNumber(totalAbsent, locale)}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pick('অননুমোদিত অনুপস্থিতি', 'Unexcused absences')}
              </p>
            </Card>
            <Card className="p-5 flex flex-col justify-between gap-2">
              <span className="text-base font-bold text-foreground">
                {pick('অনুমোদিত ছুটি', 'Approved Leave')}
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground mt-1">
                {formatNumber(totalLeave, locale)}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
                {pick(
                  `মোট কার্যদিবস ${formatNumber(totalWorkingDays, locale)} দিন`,
                  `${totalWorkingDays} total recorded days`
                )}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* Monthly Calendar */}
            <Card className="p-5 sm:p-6 lg:col-span-2 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {pick('মাসিক হাজিরা ক্যালেন্ডার', 'Monthly Attendance Calendar')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                    {pick(
                      `এই মাসে: উপস্থিত ${formatNumber(monthCount(AttendanceStatus.PRESENT), locale)} · বিলম্ব ${formatNumber(monthCount(AttendanceStatus.LATE), locale)} · অনুপস্থিত ${formatNumber(monthCount(AttendanceStatus.ABSENT), locale)} · ছুটি ${formatNumber(monthCount(AttendanceStatus.LEAVE), locale)}`,
                      `This month: ${monthCount(AttendanceStatus.PRESENT)} present · ${monthCount(AttendanceStatus.LATE)} late · ${monthCount(AttendanceStatus.ABSENT)} absent · ${monthCount(AttendanceStatus.LEAVE)} leave`
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="month"
                    value={month}
                    onChange={(event) => {
                      setMonth(event.target.value);
                      setPickedDay(null);
                    }}
                    className="w-40 h-9 text-sm"
                    aria-label={pick('মাস নির্বাচন', 'Select month')}
                  />
                  {enrollment && (
                    <Link
                      href={`/admin/attendance/daily?date=${registerDate}&classId=${enrollment.classId}&sectionId=${enrollment.sectionId}`}
                    >
                      <Button size="sm" variant="outline">
                        <span>{pick('শাখার রেজিস্টার', 'Section Register')}</span>
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
                  {pick('সাম্প্রতিক হাজিরা লগ', 'Monthly Attendance Log')}
                </h3>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatNumber(monthMarks.length, locale)} {pick('দিন', 'days')}
                </span>
              </div>

              {monthMarks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {pick('নির্বাচিত মাসে কোনো হাজিরা রেকর্ড নেই।', 'No attendance records in this month.')}
                </p>
              ) : (
                <div className="divide-y divide-border max-h-[360px] overflow-y-auto">
                  {monthMarks.slice(0, 15).map((mark) => (
                    <button
                      key={mark.id}
                      type="button"
                      onClick={() => setPickedDay(mark.date)}
                      className={cn(
                        'w-full py-2.5 px-2 -mx-2 rounded-md flex items-center justify-between gap-2 text-left text-xs hover:bg-surface-muted/60 transition-colors cursor-pointer',
                        pickedDay === mark.date && 'bg-surface-muted/80'
                      )}
                    >
                      <div>
                        <p className="font-medium text-foreground tabular-nums">
                          {formatDateShort(`${mark.date}T12:00:00`, locale)}
                        </p>
                        {mark.inTime && (
                          <p className="text-xs font-mono text-muted-foreground tabular-nums">
                            {pick('প্রবেশ:', 'In:')} {mark.inTime.slice(11, 16)}
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
                  <span>{pick('পরীক্ষার ফলাফল ও মেধাক্রম', 'Examination Results & Standing')}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pick(
                    'প্রকাশিত ও সংরক্ষিত সকল পরীক্ষার নম্বর, জিপিএ ও মেধাক্রমের তালিকা।',
                    'Published examination marks, GPA, letter grades, and merit standings.'
                  )}
                </p>
              </div>
              <Link
                href="/admin/results/mark-sheets"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <span>{pick('নম্বরপত্র ডেস্ক', 'Mark Sheets')}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {examResults.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {pick(
                  'এই শিক্ষার্থীর কোনো পরীক্ষার ফলাফল এখনো প্রকাশিত হয়নি।',
                  'No examination results have been recorded for this student yet.'
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-surface-muted/70 border-b border-border text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">{pick('পরীক্ষা', 'Examination')}</th>
                      <th className="px-5 py-3">{pick('শিক্ষাবর্ষ ও শ্রেণি', 'Session & Class')}</th>
                      <th className="px-5 py-3 text-right">{pick('প্রাপ্ত নম্বর', 'Marks')}</th>
                      <th className="px-5 py-3 text-right">{pick('জিপিএ', 'GPA')}</th>
                      <th className="px-5 py-3">{pick('গ্রেড', 'Grade')}</th>
                      <th className="px-5 py-3 text-right">{pick('মেধাক্রম', 'Merit')}</th>
                      <th className="px-5 py-3">{pick('অবস্থা', 'Status')}</th>
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
                          {formatNumber(res.totalMarks, locale)} /{' '}
                          {formatNumber(res.totalFullMarks, locale)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold tabular-nums text-primary">
                          {res.gpa != null ? res.gpa.toFixed(2) : '—'}
                        </td>
                        <td className="px-5 py-3 font-semibold text-foreground">
                          {res.letterGrade || '—'}
                        </td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums text-foreground">
                          {res.meritPosition
                            ? `#${formatNumber(res.meritPosition, locale)}`
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
                  {pick('শিক্ষাবর্ষভিত্তিক এনরোলমেন্ট ইতিহাস', 'Session Enrollment History')}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pick(
                    'ভর্তি থেকে বর্তমান পর্যন্ত শ্রেণি, শাখা, রোল এবং উত্তীর্ণ হওয়ার ধারাবাহিক রেকর্ড।',
                    'Chronological class, section, roll, and promotion records across sessions.'
                  )}
                </p>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatNumber(enrollments.length, locale)} {pick('টি সেশন', 'sessions')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-surface-muted/70 border-b border-border text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">{pick('শিক্ষাবর্ষ', 'Session')}</th>
                    <th className="px-5 py-3">{pick('শ্রেণি', 'Class')}</th>
                    <th className="px-5 py-3">{pick('শাখা', 'Section')}</th>
                    <th className="px-5 py-3">{pick('বিভাগ', 'Stream')}</th>
                    <th className="px-5 py-3 text-right">{pick('রোল', 'Roll')}</th>
                    <th className="px-5 py-3">{pick('অবস্থা', 'Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enrollments.map((enr) => {
                    const y = db.academicYears.find((item) => item.id === enr.academicYearId);
                    const s = db.sections.find((item) => item.id === enr.sectionId);
                    const g = enr.groupId
                      ? db.academicGroups.find((item) => item.id === enr.groupId)
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
                            <span className="ml-2 text-xs font-medium text-primary">
                              · {pick('চলতি', 'Current')}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-foreground">
                          {classLabel(db, enr.classId, locale)}
                        </td>
                        <td className="px-5 py-3 text-foreground">{s?.name ?? '—'}</td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {g
                            ? locale === 'bn'
                              ? g.nameBn || g.name
                              : g.name
                            : pick('সাধারণ', 'General')}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold tabular-nums text-foreground">
                          {formatNumber(enr.roll, locale)}
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
        title={pick('শিক্ষার্থীর প্রোফাইল সম্পাদনা', 'Edit Student Profile')}
      >
        <form onSubmit={saveEdit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={pick('ইংরেজি নাম', 'Name in English')} required>
            <Input
              value={form.nameEn ?? ''}
              onChange={(event) => setForm({ ...form, nameEn: event.target.value })}
            />
          </FormField>
          <FormField label={pick('বাংলা নাম', 'Name in Bangla')}>
            <Input
              value={form.nameBn ?? ''}
              onChange={(event) => setForm({ ...form, nameBn: event.target.value })}
            />
          </FormField>
          <FormField label={pick('জন্ম তারিখ', 'Date of birth')}>
            <Input
              type="date"
              value={form.dateOfBirth ?? ''}
              onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })}
            />
          </FormField>
          <FormField label={pick('লিঙ্গ', 'Gender')}>
            <Select
              value={form.gender}
              onChange={(event) => setForm({ ...form, gender: event.target.value as Gender })}
            >
              <option value={Gender.MALE}>{pick('ছাত্র', 'Male')}</option>
              <option value={Gender.FEMALE}>{pick('ছাত্রী', 'Female')}</option>
            </Select>
          </FormField>
          <FormField label={pick('জন্ম নিবন্ধন নম্বর', 'Birth certificate')}>
            <Input
              value={form.birthCertificateNo ?? ''}
              onChange={(event) => setForm({ ...form, birthCertificateNo: event.target.value })}
            />
          </FormField>
          <FormField label={pick('বোর্ড রেজিস্ট্রেশন নম্বর', 'Board registration')}>
            <Input
              value={form.boardRegistrationNo ?? ''}
              onChange={(event) => setForm({ ...form, boardRegistrationNo: event.target.value })}
            />
          </FormField>
          <FormField label={pick('রক্তের গ্রুপ', 'Blood group')}>
            <Select
              value={form.bloodGroup ?? ''}
              onChange={(event) =>
                setForm({ ...form, bloodGroup: (event.target.value || null) as BloodGroup | null })
              }
            >
              <option value="">{pick('নির্বাচন করুন', 'Select')}</option>
              {Object.keys(BLOOD_LABEL).map((bg) => (
                <option key={bg} value={bg}>
                  {BLOOD_LABEL[bg]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={pick('ধর্ম', 'Religion')}>
            <Select
              value={form.religion ?? ''}
              onChange={(event) =>
                setForm({ ...form, religion: (event.target.value || null) as Religion | null })
              }
            >
              <option value="">{pick('নির্বাচন করুন', 'Select')}</option>
              <option value={Religion.ISLAM}>{pick('ইসলাম', 'Islam')}</option>
              <option value={Religion.HINDUISM}>{pick('হিন্দু', 'Hinduism')}</option>
              <option value={Religion.BUDDHISM}>{pick('বৌদ্ধ', 'Buddhism')}</option>
              <option value={Religion.CHRISTIANITY}>{pick('খ্রিষ্টান', 'Christianity')}</option>
            </Select>
          </FormField>
          <div className="sm:col-span-2">
            <FormField label={pick('বর্তমান ঠিকানা', 'Present address')}>
              <Textarea
                value={form.presentAddress ?? ''}
                onChange={(event) => setForm({ ...form, presentAddress: event.target.value })}
              />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label={pick('স্থায়ী ঠিকানা', 'Permanent address')}>
              <Textarea
                value={form.permanentAddress ?? ''}
                onChange={(event) => setForm({ ...form, permanentAddress: event.target.value })}
              />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label={pick('পূর্বের শিক্ষাপ্রতিষ্ঠান', 'Previous school')}>
              <Input
                value={form.previousSchoolName ?? ''}
                onChange={(event) => setForm({ ...form, previousSchoolName: event.target.value })}
              />
            </FormField>
          </div>
          {student.status !== StudentStatus.TRANSFERRED &&
            student.status !== StudentStatus.GRADUATED && (
              <FormField label={pick('অবস্থা', 'Status')}>
                <Select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as StudentStatus })
                  }
                >
                  <option value={StudentStatus.ACTIVE}>{pick('সক্রিয়', 'Active')}</option>
                  <option value={StudentStatus.INACTIVE}>{pick('নিষ্ক্রিয়', 'Inactive')}</option>
                </Select>
              </FormField>
            )}
          <div className="sm:col-span-2 flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('সংরক্ষণ করুন', 'Save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}