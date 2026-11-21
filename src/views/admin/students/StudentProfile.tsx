'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Calendar,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  GraduationCap,
  Heart,
  IdCard,
  MapPin,
  Pencil,
  Phone,
  Printer,
  QrCode,
  User,
  Users,
} from 'lucide-react';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { triggerPrint } from '@/src/lib/utils/cn';
import { SchoolEmblem } from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, FormField, Input, Modal, Select, Textarea } from '@/src/components/ui/primitives';
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
import { BLOOD_LABEL, classLabel, errorMessage } from './studentShared';

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
  if (status === AttendanceStatus.PRESENT) return 'bg-primary/10 text-primary border-primary/30';
  if (status === AttendanceStatus.LATE) return 'bg-secondary/15 text-secondary border-secondary/30';
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
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-primary/40" />{pick('উপস্থিত', 'Present')}</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-secondary/40" />{pick('দেরি', 'Late')}</span>
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

export function StudentProfile({ db, studentId, yearId, startEditing }: { db: MockDatabase; studentId: string; yearId: string; startEditing: boolean }) {
  const { locale, pick } = useI18n();
  const [updateStudent, { isLoading }] = useUpdateStudentMutation();
  const student = db.students.find((item) => item.id === studentId);
  const [open, setOpen] = useState(startEditing);
  const [form, setForm] = useState<Partial<Student>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'academic' | 'idcard' | 'testimonial'>('overview');
  const [month, setMonth] = useState(localToday().slice(0, 7));
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyText = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(text);
      toast.success(`${label} ${pick('কপি করা হয়েছে।', 'copied to clipboard.')}`);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  useEffect(() => {
    if (window.location.hash === '#attendance') {
      setActiveTab('attendance');
    }
  }, [studentId]);

  if (!student) {
    return (
      <Card className="p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
        <p className="text-base font-semibold">{pick('শিক্ষার্থী পাওয়া যায়নি।', 'Student was not found.')}</p>
        <Link href="/admin/students">
          <Button variant="outline" size="sm">{pick('তালিকায় ফিরুন', 'Back to list')}</Button>
        </Link>
      </Card>
    );
  }

  const enrollments = db.enrollments.filter((item) => item.studentId === student.id);
  const enrollment = enrollments.find((item) => item.academicYearId === yearId);
  const section = enrollment ? db.sections.find((item) => item.id === enrollment.sectionId) : undefined;
  const group = enrollment?.groupId ? db.academicGroups.find((item) => item.id === enrollment.groupId) : undefined;
  const guardians = db.parentStudents
    .filter((link) => link.studentId === student.id)
    .map((link) => ({ link, parent: db.parents.find((item) => item.id === link.parentId) }))
    .sort((a, b) => Number(b.link.isPrimary) - Number(a.link.isPrimary));
  const cards = db.rfidCards.filter((item) => item.studentId === student.id);
  const activeCard = cards.find((item) => item.status === CardStatus.ACTIVE) ?? cards[0];
  const today = localToday();
  const todayClosed = closedDay(db, today, yearId);
  const todayMark = enrollment ? db.attendances.find((item) => item.studentEnrollmentId === enrollment.id && item.date === today) : undefined;
  const method = enrollment ? db.classAttendanceConfigs.find((item) => item.classId === enrollment.classId)?.method : undefined;
  const monthMarks = enrollment
    ? db.attendances
        .filter((item) => item.studentEnrollmentId === enrollment.id && item.date.startsWith(month))
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];
  const monthCount = (status: AttendanceStatus) => monthMarks.filter((item) => item.status === status).length;
  const registerDate = todayClosed ? latestOpenDay(db, yearId, today) : today;
  const certificates = db.transferCertificates.filter((item) => item.studentId === student.id);

  // Annual attendance stats
  const allMarks = enrollment ? db.attendances.filter((item) => item.studentEnrollmentId === enrollment.id) : [];
  const totalPresent = allMarks.filter((item) => item.status === AttendanceStatus.PRESENT).length;
  const totalLate = allMarks.filter((item) => item.status === AttendanceStatus.LATE).length;
  const totalAbsent = allMarks.filter((item) => item.status === AttendanceStatus.ABSENT).length;
  const totalLeave = allMarks.filter((item) => item.status === AttendanceStatus.LEAVE).length;
  const totalWorkingDays = totalPresent + totalLate + totalAbsent + totalLeave;
  const annualAttendanceRate = totalWorkingDays > 0 ? Math.round(((totalPresent + totalLate) / totalWorkingDays) * 100) : 100;

  // Class teacher for current section
  const classTeacherLink = section ? db.sectionClassTeachers.find((row) => row.sectionId === section.id && row.academicYearId === yearId) : null;
  const classTeacher = classTeacherLink ? db.staff.find((st) => st.id === classTeacherLink.staffId) : null;

  // Optional subject
  const optSubject = enrollment?.optionalClassSubjectId ? db.classSubjects.find((cs) => cs.id === enrollment.optionalClassSubjectId) : null;
  const optSubjectMaster = optSubject ? db.subjects.find((s) => s.id === optSubject.subjectId) : null;

  const initials = (name?: string | null) => {
    if (!name) return 'ST';
    const p = name.trim().split(/\s+/);
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };

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

  const currentYearObj = db.academicYears.find((y) => y.id === yearId);

  return (
    <div className="space-y-6">
      {/* 360° Hero Header Dossier */}
      <Card className="overflow-hidden border border-border shadow-sm">
        {/* Decorative Institutional Cover */}
        <div className="h-32 bg-gradient-to-r from-primary to-primary/90 relative px-6 py-4 flex items-end justify-between">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="text-white/80 text-xs font-medium z-10 flex items-center gap-2">
            <span>{db.schoolProfile.name}</span>
            <span>·</span>
            <span>EIIN: {db.schoolProfile.eiin ?? '113585'}</span>
          </div>
          <div className="z-10 flex items-center gap-2">
            <StatusBadge enumName="StudentStatus" value={student.status} />
          </div>
        </div>

        {/* Profile Details Bar */}
        <div className="p-6 pt-0 relative bg-surface">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 -mt-12">
            {/* Avatar & Core Identity */}
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className={`w-24 h-24 rounded-2xl ring-4 ring-surface shadow-md flex items-center justify-center font-bold text-2xl shrink-0 border ${
                  student.gender === Gender.FEMALE
                    ? 'bg-gradient-to-br from-surface-muted to-surface text-foreground border-border'
                    : 'bg-gradient-to-br from-surface-muted to-surface text-foreground border-border'
                }`}>
                  {initials(student.nameEn)}
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-surface flex items-center justify-center ${
                    student.status === StudentStatus.ACTIVE ? 'bg-success' : 'bg-muted-foreground'
                  }`}
                  title={student.status}
                >
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-foreground">
                  {student.nameBn || student.nameEn}
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                  {student.nameEn}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => copyText(student.studentId, 'Student ID')}
                    className="inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-md bg-surface-muted text-muted-foreground hover:text-foreground hover:bg-surface-muted/80 transition-colors"
                  >
                    {copiedText === student.studentId ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                    <span>{student.studentId}</span>
                  </button>
                  {enrollment && (
                    <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      {pick('রোল', 'Roll')} #{formatNumber(enrollment.roll, locale)}
                    </span>
                  )}
                  {student.bloodGroup && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-surface-muted text-foreground border border-border">
                      <Heart className="w-3 h-3 fill-current" />
                      <span>{BLOOD_LABEL[student.bloodGroup] || student.bloodGroup}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={activeTab === 'idcard' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('idcard')}
                className="gap-1.5"
              >
                <IdCard className="w-4 h-4" />
                <span>{pick('ডিজিটাল আইডি কার্ড', 'Digital ID')}</span>
              </Button>
              <Button
                size="sm"
                variant={activeTab === 'testimonial' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('testimonial')}
                className="gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>{pick('প্রত্যয়নপত্র', 'Testimonial')}</span>
              </Button>
              <Button size="sm" variant="outline" onClick={begin} className="gap-1.5">
                <Pencil className="w-3.5 h-3.5" />
                <span>{pick('সম্পাদনা', 'Edit')}</span>
              </Button>
              <Link href="/admin/students">
                <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" />
                  <span>{pick('তালিকায় ফিরুন', 'Back to List')}</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Sub-header Badges Row */}
          <div className="mt-5 pt-4 border-t border-border/70 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">{pick('শ্রেণি ও শাখা:', 'Class & Section:')}</span>
              {enrollment ? (
                <span className="font-semibold text-foreground px-2 py-0.5 rounded bg-surface-muted">
                  {classLabel(db, enrollment.classId, locale)} · {section?.name ?? '—'}
                  {group ? ` (${locale === 'bn' ? group.nameBn || group.name : group.name})` : ''}
                </span>
              ) : (
                <span className="text-muted-foreground italic">
                  {pick('চলতি সেশনে এনরোলমেন্ট নেই', 'Not enrolled in current session')}
                </span>
              )}
              {activeCard && (
                <span className="inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  <CreditCard className="w-3 h-3" />
                  <span>RFID: {activeCard.cardNumber}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{pick('আজকের উপস্থিতি:', 'Today’s Attendance:')}</span>
              {todayClosed ? (
                <span className="font-medium text-muted-foreground">{todayClosed}</span>
              ) : todayMark ? (
                <StatusBadge enumName="AttendanceStatus" value={todayMark.status} />
              ) : method === AttendanceMethod.RFID ? (
                <span className="text-secondary font-bold font-medium">{pick('স্ক্যান হয়নি', 'Not scanned')}</span>
              ) : (
                <span className="text-muted-foreground">{pick('ধরা হয়নি', 'Not marked yet')}</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto pb-px">
        {[
          { id: 'overview', label: pick('সার্বিক পরিচিতি', 'Overview'), icon: User },
          { id: 'attendance', label: pick('হাজিরা ও ক্যালেন্ডার', 'Attendance & Calendar'), icon: Calendar },
          { id: 'academic', label: pick('শিক্ষাজীবন ও ইতিহাস', 'Academic Journey'), icon: GraduationCap },
          { id: 'idcard', label: pick('ডিজিটাল আইডি কার্ড', 'Digital Student ID'), icon: IdCard },
          { id: 'testimonial', label: pick('প্রত্যয়নপত্র / প্রশংসাপত্র', 'Testimonial Document'), icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview (Bento Grid) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Personal Information (Spans 2 Columns) */}
          <Card className="p-5 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span>{pick('ব্যক্তিগত পরিচয় ও সনদ', 'Personal Dossier & Certificates')}</span>
              </h3>
              <Button size="sm" variant="ghost" onClick={begin} className="text-xs gap-1 text-primary">
                <Pencil className="w-3.5 h-3.5" />
                <span>{pick('সম্পাদনা', 'Edit')}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{pick('জন্ম তারিখ ও বর্তমান বয়স', 'Date of Birth & Age')}</p>
                <p className="font-medium text-foreground">
                  {student.dateOfBirth ? `${formatDateShort(student.dateOfBirth, locale)} (${getStudentAge(student.dateOfBirth, locale)})` : '—'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{pick('লিঙ্গ ও ধর্ম', 'Gender & Religion')}</p>
                <p className="font-medium text-foreground">
                  {student.gender === Gender.MALE ? pick('ছাত্র (পুরুষ)', 'Male') : pick('ছাত্রী (নারী)', 'Female')}
                  {' · '}
                  {student.religion || '—'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{pick('জন্ম নিবন্ধন নম্বর (BRN)', 'Birth Certificate No.')}</p>
                <div className="flex items-center gap-1.5 font-mono font-medium text-foreground">
                  <span>{student.birthCertificateNo || '—'}</span>
                  {student.birthCertificateNo && (
                    <button
                      type="button"
                      onClick={() => copyText(student.birthCertificateNo!, 'Birth Certificate')}
                      className="text-muted-foreground hover:text-foreground"
                      title="Copy"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{pick('বোর্ড রেজিস্ট্রেশন নম্বর', 'Board Registration No.')}</p>
                <div className="flex items-center gap-1.5 font-mono font-medium text-foreground">
                  <span>{student.boardRegistrationNo || '—'}</span>
                  {student.boardRegistrationNo && (
                    <button
                      type="button"
                      onClick={() => copyText(student.boardRegistrationNo!, 'Board Registration')}
                      className="text-muted-foreground hover:text-foreground"
                      title="Copy"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs text-muted-foreground">{pick('বর্তমান ঠিকানা', 'Present Address')}</p>
                <p className="font-medium text-foreground flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{student.presentAddress || '—'}</span>
                </p>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs text-muted-foreground">{pick('স্থায়ী ঠিকানা', 'Permanent Address')}</p>
                <p className="font-medium text-foreground flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{student.permanentAddress || student.presentAddress || '—'}</span>
                </p>
              </div>

              <div className="space-y-1 sm:col-span-2 pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">{pick('পূর্বের শিক্ষাপ্রতিষ্ঠান ও জিপিএ', 'Previous School & GPA')}</p>
                <p className="font-medium text-foreground">
                  {student.previousSchoolName || '—'}
                  {student.previousGpa ? ` · GPA: ${formatNumber(student.previousGpa, locale)}` : ''}
                </p>
              </div>
            </div>
          </Card>

          {/* Right Column: Guardians & RFID */}
          <div className="space-y-5">
            {/* Guardians Card */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{pick('অভিভাবক ও যোগাযোগ', 'Guardians & Contacts')}</span>
                </h3>
                <span className="text-xs text-muted-foreground">
                  {formatNumber(guardians.length, locale)} {pick('জন', 'linked')}
                </span>
              </div>

              {guardians.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  {pick('কোনো অভিভাবক সংযুক্ত করা হয়নি।', 'No guardians linked yet.')}
                </p>
              ) : (
                <div className="space-y-3">
                  {guardians.map(({ link, parent }) => (
                    <div
                      key={link.id}
                      className="p-3 rounded-lg border border-border/70 bg-surface-muted/30 space-y-2 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground">
                            {parent?.nameBn || parent?.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">{parent?.name}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary">
                          {link.relationship}
                        </span>
                      </div>

                      {parent?.phone && (
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                          <a
                            href={`tel:${parent.phone}`}
                            className="inline-flex items-center gap-1.5 font-mono font-medium text-primary hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{parent.phone}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => copyText(parent.phone!, 'Phone')}
                            className="text-muted-foreground hover:text-foreground text-xs"
                            title="Copy phone"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {link.isPrimary && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-secondary/10 text-secondary border border-secondary/20">
                            ★ {pick('প্রধান অভিভাবক', 'Primary Guardian')}
                          </span>
                        )}
                        {link.isSmsReceiver && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                            SMS {pick('প্রাপক', 'Receiver')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* RFID Identity Card Desk */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span>{pick('পরিচয়পত্র ও ডিভাইস', 'Identity & Device')}</span>
                </h3>
                <Link href="/admin/students/rfid-cards" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <span>{pick('কার্ড ডেস্কে যান', 'Manage cards')}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {activeCard ? (
                <div className="p-3 rounded-lg border border-border bg-surface-muted/20 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{pick('কার্ড নম্বর:', 'Card No:')}</span>
                    <span className="font-mono font-bold text-foreground">{activeCard.cardNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{pick('অবস্থা:', 'Status:')}</span>
                    <StatusBadge enumName="CardStatus" value={activeCard.status} />
                  </div>
                  {activeCard.issuedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{pick('ইস্যুর তারিখ:', 'Issued:')}</span>
                      <span className="tabular-nums">{formatDateShort(activeCard.issuedAt, locale)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  {pick('কোনো সক্রিয় RFID কার্ড বরাদ্দ নেই।', 'No active RFID card assigned.')}
                </p>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance Analytics & Calendar */}
      {activeTab === 'attendance' && (
        <div className="space-y-5">
          {/* Annual Attendance Gauge Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 flex items-center gap-4 bg-gradient-to-br from-surface to-surface-muted/40">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl tabular-nums shrink-0">
                {formatNumber(annualAttendanceRate, locale)}%
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {pick('বার্ষিক উপস্থিতি', 'Annual Rate')}
                </p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {annualAttendanceRate >= 85
                    ? pick('চমৎকার উপস্থিতি', 'Excellent record')
                    : annualAttendanceRate >= 75
                      ? pick('সন্তোষজনক', 'Satisfactory')
                      : pick('উদ্বেগজনক (< ৭৫%)', 'Critical alert (< 75%)')}
                </p>
              </div>
            </Card>

            <Card className="p-4 space-y-1">
              <p className="text-xs text-muted-foreground">{pick('মোট উপস্থিত দিন', 'Days Present')}</p>
              <p className="text-2xl font-bold tabular-nums text-primary font-bold">
                {formatNumber(totalPresent, locale)}
              </p>
              <p className="text-[11px] text-muted-foreground">{pick('নির্ধারিত সময়ের উপস্থিতি', 'On-time attendance')}</p>
            </Card>

            <Card className="p-4 space-y-1">
              <p className="text-xs text-muted-foreground">{pick('মোট বিলম্ব (Late)', 'Days Late')}</p>
              <p className="text-2xl font-bold tabular-nums text-secondary font-bold">
                {formatNumber(totalLate, locale)}
              </p>
              <p className="text-[11px] text-muted-foreground">{pick('সমাবেশের পরে পাঞ্চ', 'After morning bell')}</p>
            </Card>

            <Card className="p-4 space-y-1">
              <p className="text-xs text-muted-foreground">{pick('অনুপস্থিত ও ছুটি', 'Absent & Leave')}</p>
              <p className="text-2xl font-bold tabular-nums text-foreground font-bold">
                {formatNumber(totalAbsent, locale)}
                <span className="text-xs font-normal text-muted-foreground ml-1.5">
                  (+ {formatNumber(totalLeave, locale)} {pick('ছুটি', 'leave')})
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground">{pick('অননুমোদিত অনুপস্থিতি', 'Unexcused absences')}</p>
            </Card>
          </div>

          {/* Monthly Calendar View */}
          <Card className="p-5 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{pick('মাসিক হাজিরা ক্যালেন্ডার', 'Monthly Attendance Calendar')}</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  {pick('ক্যালেন্ডারের তারিখে চাপলে বিস্তারিত ইন-টাইম দেখা যাবে।', 'Click any date cell to inspect exact punch times.')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <FormField label={pick('মাস নির্বাচন', 'Select Month')}>
                  <Input
                    type="month"
                    value={month}
                    onChange={(event) => {
                      setMonth(event.target.value);
                      setPickedDay(null);
                    }}
                    className="w-40 h-9 text-xs"
                  />
                </FormField>
                {enrollment && (
                  <Link href={`/admin/attendance/daily?date=${registerDate}&classId=${enrollment.classId}&sectionId=${enrollment.sectionId}`}>
                    <Button size="sm" variant="outline" className="text-xs gap-1">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{pick('শাখার দৈনিক রেজিস্টার', 'Section Register')}</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Monthly Summary Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded-lg border border-border/80 px-3 py-2 bg-primary/5 border-primary/20">
                <p className="text-muted-foreground">{pick('উপস্থিত', 'Present')}</p>
                <p className="text-lg font-bold text-primary font-bold tabular-nums">
                  {formatNumber(monthCount(AttendanceStatus.PRESENT), locale)}
                </p>
              </div>
              <div className="rounded-lg border border-border/80 px-3 py-2 bg-secondary/5 border-secondary/20">
                <p className="text-muted-foreground">{pick('দেরি', 'Late')}</p>
                <p className="text-lg font-bold text-secondary font-bold tabular-nums">
                  {formatNumber(monthCount(AttendanceStatus.LATE), locale)}
                </p>
              </div>
              <div className="rounded-lg border border-border/80 px-3 py-2 bg-surface-muted/50 border-border">
                <p className="text-muted-foreground">{pick('অনুপস্থিত', 'Absent')}</p>
                <p className="text-lg font-bold text-foreground font-bold tabular-nums">
                  {formatNumber(monthCount(AttendanceStatus.ABSENT), locale)}
                </p>
              </div>
              <div className="rounded-lg border border-border/80 px-3 py-2 bg-info/5">
                <p className="text-muted-foreground">{pick('ছুটি', 'Leave')}</p>
                <p className="text-lg font-bold text-info tabular-nums">
                  {formatNumber(monthCount(AttendanceStatus.LEAVE), locale)}
                </p>
              </div>
            </div>

            {/* Calendar Component */}
            <AttendanceMonth
              month={month}
              marks={monthMarks}
              closedOn={(date) => closedDay(db, date, yearId)}
              picked={pickedDay}
              onPick={setPickedDay}
            />
          </Card>
        </div>
      )}

      {/* Tab 3: Academic Journey Timeline */}
      {activeTab === 'academic' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h3 className="font-semibold text-base flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span>{pick('শিক্ষাজীবন ও এনরোলমেন্ট ইতিহাস', 'Academic Journey & Enrollment History')}</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                {pick('ভর্তি থেকে বর্তমান পর্যন্ত সেশনভিত্তিক অগ্রগতির পূর্ণাঙ্গ রেকর্ড।', 'Chronological session-by-session academic progression.')}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              {formatNumber(enrollments.length, locale)} {pick('টি সেশন', 'sessions')}
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {enrollments.map((enr, idx) => {
              const y = db.academicYears.find((item) => item.id === enr.academicYearId);
              const c = db.classes.find((item) => item.id === enr.classId);
              const s = db.sections.find((item) => item.id === enr.sectionId);
              const g = enr.groupId ? db.academicGroups.find((item) => item.id === enr.groupId) : null;
              const isCurrent = enr.academicYearId === yearId;

              return (
                <div key={enr.id} className="relative">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-surface ${
                    isCurrent ? 'bg-primary ring-4 ring-primary/20' : 'bg-muted-foreground/60'
                  }`} />

                  <Card className={`p-4 border ${isCurrent ? 'border-primary/40 bg-primary/5 shadow-xs' : 'border-border'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-foreground">
                          {y?.name ?? '—'} {pick('শিক্ষাবর্ষ', 'Session')}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground">
                            {pick('চলতি সেশন', 'Current')}
                          </span>
                        )}
                      </div>
                      <StatusBadge enumName="EnrollmentStatus" value={enr.status} />
                    </div>

                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">{pick('শ্রেণি:', 'Class:')}</span>
                        <p className="font-semibold text-foreground text-sm">{classLabel(db, enr.classId, locale)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{pick('শাখা:', 'Section:')}</span>
                        <p className="font-semibold text-foreground text-sm">{s?.name ?? '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{pick('শ্রেণি রোল:', 'Roll:')}</span>
                        <p className="font-semibold text-foreground text-sm tabular-nums">#{formatNumber(enr.roll, locale)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{pick('বিভাগ / স্ট্রিম:', 'Stream:')}</span>
                        <p className="font-semibold text-foreground text-sm">
                          {g ? (locale === 'bn' ? g.nameBn || g.name : g.name) : pick('সাধারণ', 'Common')}
                        </p>
                      </div>
                    </div>

                    {isCurrent && (
                      <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>
                          {pick('শ্রেণি শিক্ষক:', 'Class Teacher:')}{' '}
                          <span className="font-medium text-foreground">
                            {classTeacher?.name ?? pick('নির্ধারিত হয়নি', 'Not assigned')}
                          </span>
                        </span>
                        {optSubjectMaster && (
                          <span>
                            {pick('ঐচ্ছিক বিষয় (৪র্থ):', 'Optional (4th):')}{' '}
                            <span className="font-medium text-foreground">
                              {locale === 'bn' ? optSubjectMaster.nameBn : optSubjectMaster.name}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Tab 4: Digital Student ID Card (Printable) */}
      {activeTab === 'idcard' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <IdCard className="w-5 h-5 text-primary" />
                  <span>{pick('অফিসিয়াল ডিজিটাল আইডি কার্ড প্রিভিউ', 'Official Student ID Card Preview')}</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  {pick('আন্তর্জাতিক পিভিসি স্ট্যান্ডার্ড (CR80) অনুকরণে প্রস্তুতকৃত লেআউট।', 'Standard CR80 size identity card preview ready for laminating.')}
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={triggerPrint} className="gap-2 shrink-0">
                <Printer className="w-4 h-4" />
                <span>{pick('আইডি কার্ড প্রিন্ট করুন', 'Print ID Card')}</span>
              </Button>
            </div>

            {/* Realistic PVC Card Mockup (Two Sides) */}
            <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-8">
              {/* Card FRONT */}
              <div className="w-[340px] h-[215px] rounded-2xl bg-gradient-to-br from-primary via-primary/95 to-slate-900 text-white p-4 relative shadow-xl overflow-hidden flex flex-col justify-between border border-white/20">
                {/* Background watermarked emblem */}
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-6 translate-y-6 pointer-events-none">
                  <SchoolEmblem size={160} />
                </div>

                {/* Card Top: School Crest & Title */}
                <div className="flex items-center gap-2.5 border-b border-white/20 pb-2">
                  <SchoolEmblem size={34} className="ring-white/40" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold tracking-tight truncate leading-tight">
                      {db.schoolProfile.name}
                    </p>
                    <p className="text-[8px] text-white/80 tracking-wider uppercase font-mono">
                      EIIN: {db.schoolProfile.eiin ?? '113585'} · Est. 1898
                    </p>
                  </div>
                </div>

                {/* Card Middle: Photo + Student Info */}
                <div className="flex items-center gap-3.5 my-auto">
                  <div className="w-18 h-18 rounded-xl bg-white/10 ring-2 ring-white/60 shadow-inner flex items-center justify-center font-bold text-xl text-white shrink-0">
                    {initials(student.nameEn)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-bold truncate leading-tight">{student.nameBn}</p>
                    <p className="text-[10px] text-white/80 font-mono truncate">{student.nameEn}</p>
                    <p className="text-[10px] font-mono text-white/90 font-bold">{student.studentId}</p>
                    <div className="flex items-center gap-2 text-[9px] text-white/90 pt-0.5">
                      <span>{classLabel(db, enrollment?.classId ?? '', locale)}</span>
                      <span>·</span>
                      <span>{pick('শাখা', 'Sec')}: {section?.name ?? '—'}</span>
                      <span>·</span>
                      <span className="font-bold">{pick('রোল', 'Roll')}: #{enrollment?.roll ?? '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Blood Group, Validity & Seal */}
                <div className="flex items-end justify-between border-t border-white/20 pt-1.5 text-[8px] text-white/80">
                  <div>
                    <span>{pick('রক্ত:', 'Blood:')} </span>
                    <span className="font-bold text-white font-bold">{student.bloodGroup ? BLOOD_LABEL[student.bloodGroup] : '—'}</span>
                    <span className="mx-1">·</span>
                    <span>{pick('সেশন:', 'Session:')} </span>
                    <span className="font-bold text-white">{currentYearObj?.name ?? '2026'}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-serif italic text-[9px] text-white/80">Md. Shafiqur</p>
                    <p className="text-[7px] text-white/70 uppercase tracking-wider">{pick('প্রধান শিক্ষক', 'Principal')}</p>
                  </div>
                </div>
              </div>

              {/* Card BACK */}
              <div className="w-[340px] h-[215px] rounded-2xl bg-surface border-2 border-border text-foreground p-4 relative shadow-xl overflow-hidden flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold text-center border-b border-border pb-1 text-primary">
                    {pick('নির্দেশনাবলী ও জরুরি তথ্য', 'Instructions & Emergency Info')}
                  </p>
                  <div className="mt-2 space-y-1 text-[9px] text-muted-foreground">
                    <p>• {pick('এই কার্ডটি বিদ্যালয়ের সম্পদ। সর্বদা সাথে রাখা বাধ্যতামূলক।', 'This identity card is property of BHS. Must be carried daily.')}</p>
                    <p>• {pick('কার্ড হারিয়ে গেলে অবিলম্বে প্রধান শিক্ষক বরাবর অবহিত করিতে হইবে।', 'Report loss immediately to the Headteacher’s office.')}</p>
                    <p className="font-medium text-foreground pt-0.5">
                      {pick('জরুরি অভিভাবক ফোন:', 'Emergency Phone:')}{' '}
                      <span className="font-mono font-bold text-primary">{guardians[0]?.parent?.phone ?? db.schoolProfile.phone}</span>
                    </p>
                    <p className="text-[8px] truncate">
                      {pick('ঠিকানা:', 'Address:')} {student.presentAddress ?? db.schoolProfile.address}
                    </p>
                  </div>
                </div>

                {/* Simulated Barcode / QR Section */}
                <div className="flex items-center justify-between border-t border-border/80 pt-2 text-[8px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <QrCode className="w-8 h-8 text-foreground shrink-0" />
                    <div>
                      <p className="font-mono text-[9px] font-bold text-foreground">{student.studentId}</p>
                      <p className="text-[7px] text-muted-foreground">VERIFIED ID · BHS</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[8px]">{activeCard ? `RFID: ${activeCard.cardNumber}` : 'NON-RFID'}</p>
                    <p className="text-[7px] text-muted-foreground">www.bijharischool.edu.bd</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: Testimonial Generator (Printable) */}
      {activeTab === 'testimonial' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span>{pick('অফিসিয়াল চারিত্রিক প্রত্যয়নপত্র / প্রশংসাপত্র', 'Official Character Testimonial Document')}</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                {pick('বিদ্যালয়ের অফিশিয়াল লেটারহেডে স্বয়ংক্রিয়ভাবে পূর্ণাঙ্গ প্রত্যয়নপত্র প্রস্তুত।', 'Automatically generated formal institutional certificate ready for printing.')}
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={triggerPrint} className="gap-2 shrink-0">
              <Printer className="w-4 h-4" />
              <span>{pick('প্রত্যয়নপত্র প্রিন্ট করুন', 'Print Testimonial')}</span>
            </Button>
          </div>

          {/* Testimonial Document Preview */}
          <div className="max-w-2xl mx-auto p-8 rounded-xl border-2 border-border/80 bg-surface shadow-md font-serif text-foreground space-y-6">
            {/* Letterhead Header */}
            <div className="text-center space-y-1 border-b-2 border-primary/30 pb-4">
              <div className="flex justify-center mb-2">
                <SchoolEmblem size={56} />
              </div>
              <h2 className="text-xl font-bold text-foreground font-sans">
                {db.schoolProfile.name}
              </h2>
              <p className="text-xs text-muted-foreground font-sans">
                {db.schoolProfile.address} · EIIN: {db.schoolProfile.eiin ?? '113585'} · স্থাপিত: ১৮৯৮ খ্রি.
              </p>
              <div className="pt-2">
                <span className="inline-block px-4 py-1 rounded-full border border-primary text-primary font-bold text-sm tracking-wider uppercase">
                  প্রত্যয়নপত্র / প্রশংসাপত্র
                </span>
              </div>
            </div>

            {/* Testimonial Body */}
            <div className="space-y-4 text-sm leading-relaxed text-justify">
              <p>
                এই মর্মে প্রত্যয়ন করা যাইতেছে যে, <strong className="text-foreground">{student.nameBn || student.nameEn}</strong>
                {guardians[0]?.parent && (
                  <>
                    , পিতা: <strong>{guardians[0].parent.nameBn || guardians[0].parent.name}</strong>
                  </>
                )}
                , অত্র বিদ্যালয়ের <strong className="text-foreground">{classLabel(db, enrollment?.classId ?? '', 'bn')}</strong> শ্রেণির
                শাখা: <strong>{section?.name ?? '—'}</strong>, রোল নং: <strong className="font-mono">#{enrollment?.roll ?? '—'}</strong>-এর একজন নিয়মিত শিক্ষার্থী।
              </p>
              <p>
                আমার জানামতে সে রাষ্ট্রবিরোধী কিংবা বিদ্যালয়ের শৃঙ্খলা পরিপন্থী কোনো কার্যকলাপে কখনো লিপ্ত ছিল না। তাহার স্বভাব ও চারিত্রিক বৈশিষ্ট্য প্রশংসনীয় এবং নৈতিক গুণাবলী উত্তম।
              </p>
              <p>
                আমি তাহার সার্বিক সুস্বাস্থ্য, দীর্ঘায়ু এবং জীবনের উত্তরোত্তর সাফল্য কামনা করি।
              </p>
            </div>

            {/* Footer Signatures */}
            <div className="pt-12 flex items-end justify-between text-xs">
              <div>
                <p className="text-muted-foreground">তারিখ: {formatDateShort(localToday(), locale)}</p>
                <p className="text-muted-foreground">স্মারক নং: BHS/TEST/{currentYearObj?.name ?? '2026'}/{student.studentId}</p>
              </div>
              <div className="text-center space-y-1">
                <p className="font-serif italic text-base text-primary">Md. Shafiqur Rahman</p>
                <div className="w-36 h-0.5 bg-foreground mx-auto" />
                <p className="font-bold font-sans">প্রধান শিক্ষক</p>
                <p className="text-[11px] text-muted-foreground font-sans">{db.schoolProfile.name}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Edit Profile Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={pick('প্রোফাইল সম্পাদনা', 'Edit Student Profile')}>
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
          <FormField label={pick('জন্ম সনদ নম্বর', 'Birth certificate')}>
            <Input value={form.birthCertificateNo ?? ''} onChange={(event) => setForm({ ...form, birthCertificateNo: event.target.value })} />
          </FormField>
          <FormField label={pick('বোর্ড রেজিস্ট্রেশন নম্বর', 'Board Registration')}>
            <Input value={form.boardRegistrationNo ?? ''} onChange={(event) => setForm({ ...form, boardRegistrationNo: event.target.value })} />
          </FormField>
          <FormField label={pick('রক্তের গ্রুপ', 'Blood group')}>
            <Select value={form.bloodGroup ?? ''} onChange={(event) => setForm({ ...form, bloodGroup: (event.target.value || null) as BloodGroup | null })}>
              <option value="">{pick('বাছুন', 'Select')}</option>
              {Object.keys(BLOOD_LABEL).map((bg) => (
                <option key={bg} value={bg}>{BLOOD_LABEL[bg]}</option>
              ))}
            </Select>
          </FormField>
          <FormField label={pick('ধর্ম', 'Religion')}>
            <Select value={form.religion ?? ''} onChange={(event) => setForm({ ...form, religion: (event.target.value || null) as Religion | null })}>
              <option value="">{pick('বাছুন', 'Select')}</option>
              <option value={Religion.ISLAM}>{pick('ইসলাম', 'Islam')}</option>
              <option value={Religion.HINDUISM}>{pick('হিন্দু', 'Hinduism')}</option>
              <option value={Religion.BUDDHISM}>{pick('বৌদ্ধ', 'Buddhism')}</option>
              <option value={Religion.CHRISTIANITY}>{pick('খ্রিষ্টান', 'Christianity')}</option>
            </Select>
          </FormField>
          <div className="sm:col-span-2"><FormField label={pick('বর্তমান ঠিকানা', 'Present Address')}>
            <Textarea value={form.presentAddress ?? ''} onChange={(event) => setForm({ ...form, presentAddress: event.target.value })} />
          </FormField></div>
          <div className="sm:col-span-2"><FormField label={pick('স্থায়ী ঠিকানা', 'Permanent Address')}>
            <Textarea value={form.permanentAddress ?? ''} onChange={(event) => setForm({ ...form, permanentAddress: event.target.value })} />
          </FormField></div>
          <div className="sm:col-span-2"><FormField label={pick('পূর্বের শিক্ষাপ্রতিষ্ঠান', 'Previous school')}>
            <Input value={form.previousSchoolName ?? ''} onChange={(event) => setForm({ ...form, previousSchoolName: event.target.value })} />
          </FormField></div>
          {student.status !== StudentStatus.TRANSFERRED && student.status !== StudentStatus.GRADUATED && (
            <FormField label={pick('অবস্থা', 'Status')}>
              <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as StudentStatus })}>
                <option value={StudentStatus.ACTIVE}>{pick('সক্রিয়', 'Active')}</option>
                <option value={StudentStatus.INACTIVE}>{pick('নিষ্ক্রিয়', 'Inactive')}</option>
              </Select>
            </FormField>
          )}
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
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