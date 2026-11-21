'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from '@/src/lib/navigation';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { useGetBootstrapQuery, useMarkNotificationReadMutation } from '@/src/store/api';
import { useAppSelector } from '@/src/store/hooks';
import { useI18n } from '@/src/lib/i18n';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { CommonProfilePanel } from '@/src/components/shared/CommonProfilePanel';
import { PrintableMarksheet } from '@/src/components/print/PrintDocuments';
import { Button, Card } from '@/src/components/ui/primitives';
import {
  formatDateLong,
  formatDateShort,
  formatNumber,
  formatTime12h,
} from '@/src/lib/formatters';
import { ENUM_LABELS } from '@/src/lib/constants/enums';
import { triggerPrint } from '@/src/lib/utils/cn';
import { AttendanceStatus, ResultPublicationStatus, WeekDay } from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';

const DAYS_ORDER: WeekDay[] = [
  WeekDay.SUNDAY,
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
];

function useCurrentStudent(db: MockDatabase | undefined) {
  const auth = useAppSelector((s) => s.auth);
  return useMemo(() => {
    if (!db) return null;
    const student =
      (auth.user?.studentId ? db.students.find((s) => s.id === auth.user?.studentId) : null) ??
      db.students[0];
    if (!student) return null;
    const enrollment = db.enrollments.find((e) => e.studentId === student.id);
    const cls = db.classes.find((c) => c.id === enrollment?.classId);
    const sec = db.sections.find((s) => s.id === enrollment?.sectionId);
    const grp = db.academicGroups.find((g) => g.id === enrollment?.groupId);
    const yr = db.academicYears.find((y) => y.id === enrollment?.academicYearId);
    return { student, enrollment, cls, sec, grp, yr };
  }, [db, auth.user?.studentId]);
}

export function StudentDashboardPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const me = useCurrentStudent(db);
  const { locale, pick } = useI18n();

  if (isLoading || !db || !me || !me.enrollment) return <LoadingSkeleton rows={6} />;

  const att = db.attendances.filter((a) => a.studentEnrollmentId === me.enrollment!.id);
  const present = att.filter(
    (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE
  ).length;
  const attPct = att.length > 0 ? Math.round((present / att.length) * 100) : 0;

  const publishedSummaries = db.resultSummaries.filter((r) => {
    const ex = db.exams.find((e) => e.id === r.examId);
    return (
      r.studentEnrollmentId === me.enrollment!.id &&
      ex?.resultStatus === ResultPublicationStatus.PUBLISHED
    );
  });
  const latest = publishedSummaries[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick(
          `স্বাগতম, ${me.student.nameBn || me.student.nameEn}`,
          `Welcome, ${me.student.nameEn}`
        )}
        description={`${locale === 'bn' ? me.cls?.nameBn || me.cls?.name : me.cls?.name} (${me.sec?.name}) · ${pick('রোল', 'Roll')} ${formatNumber(me.enrollment.roll, locale)} · ID: ${me.student.studentId}`}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={pick('উপস্থিতির হার', 'Attendance')}
          value={`${formatNumber(attPct, locale)}%`}
          meta={`${formatNumber(present, locale)}/${formatNumber(att.length, locale)}`}
          accent="success"
        />
        <StatCard
          label={pick('সর্বশেষ জিপিএ', 'Latest GPA')}
          value={latest?.gpa ? formatNumber(latest.gpa, locale, 2) : '—'}
          meta={
            latest?.meritPosition
              ? pick(`মেধা: #${formatNumber(latest.meritPosition, locale)}`, `Rank #${latest.meritPosition}`)
              : '—'
          }
          accent="primary"
        />
        <StatCard
          label={pick('শিক্ষা রিসোর্স', 'Learning Materials')}
          value={formatNumber(db.digitalResources.length, locale)}
        />
        <StatCard
          label={pick('গ্রন্থাগার বই', 'Library Catalog')}
          value={formatNumber(db.libraryBooks.length, locale)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">{pick('আমার ফলাফলসমূহ', 'My Published Results')}</h2>
            <Link href="/student/results" className="text-sm font-medium text-primary hover:underline">
              {pick('সব দেখুন', 'View All')}
            </Link>
          </div>
          {publishedSummaries.map((s) => {
            const ex = db.exams.find((e) => e.id === s.examId);
            return (
              <Link
                key={s.id}
                href={`/student/results/${s.id}`}
                className="flex items-center justify-between py-2.5 border-b last:border-0 border-border hover:text-primary"
              >
                <span className="text-sm font-medium">{ex?.name}</span>
                <span className="text-sm font-bold tabular-nums">
                  GPA {s.gpa ? formatNumber(s.gpa, locale, 2) : '—'}
                </span>
              </Link>
            );
          })}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">{pick('সাম্প্রতিক নোটিশ', 'Recent Notices')}</h2>
            <Link href="/student/notices" className="text-sm font-medium text-primary hover:underline">
              {pick('সব নোটিশ', 'All Notices')}
            </Link>
          </div>
          {db.notices.slice(0, 4).map((n) => (
            <div key={n.id} className="py-2 border-b last:border-0 border-border">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatDateShort(n.publishedAt ?? n.createdAt, locale)}
              </p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

export function StudentProfilePage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const me = useCurrentStudent(db);
  const { locale, pick } = useI18n();
  if (isLoading || !db || !me) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader title={pick('আমার প্রোফাইল', 'My Profile')} />
      <Card className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
        <div>
          <p className="text-sm text-muted-foreground">{pick('নাম (বাংলা)', 'Name (Bangla)')}</p>
          <p className="font-semibold mt-0.5">{me.student.nameBn ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{pick('নাম (ইংরেজি)', 'Name (English)')}</p>
          <p className="font-semibold mt-0.5">{me.student.nameEn}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{pick('শিক্ষার্থী আইডি', 'Student ID')}</p>
          <p className="font-mono mt-0.5">{me.student.studentId}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{pick('জন্ম তারিখ', 'Date of Birth')}</p>
          <p className="tabular-nums mt-0.5">{formatDateLong(me.student.dateOfBirth, locale)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{pick('রক্তের গ্রুপ', 'Blood Group')}</p>
          <p className="mt-0.5">{me.student.bloodGroup ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{pick('ঠিকানা', 'Address')}</p>
          <p className="mt-0.5">{me.student.presentAddress ?? me.student.permanentAddress ?? '—'}</p>
        </div>
      </Card>

      <CommonProfilePanel
        roleLabel={pick('শিক্ষার্থী (Student)', 'Student Account')}
        extraMeta={`ID: ${me.student.studentId}`}
      />
    </div>
  );
}

export function StudentAcademicInfoPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const me = useCurrentStudent(db);
  const { locale, pick } = useI18n();
  if (isLoading || !db || !me || !me.enrollment) return <LoadingSkeleton />;

  const subjects = db.classSubjects
    .filter((cs) => cs.classId === me.enrollment!.classId)
    .map((cs) => db.subjects.find((s) => s.id === cs.subjectId))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader title={pick('একাডেমিক তথ্য', 'Academic Information')} />
      <Card className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-base tabular-nums">
        <div>
          <p className="text-sm text-muted-foreground">{pick('শ্রেণি', 'Class')}</p>
          <p className="font-bold mt-0.5">{locale === 'bn' ? me.cls?.nameBn || me.cls?.name : me.cls?.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{pick('শাখা', 'Section')}</p>
          <p className="font-bold mt-0.5">{me.sec?.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{pick('রোল নম্বর', 'Roll')}</p>
          <p className="font-bold mt-0.5">{formatNumber(me.enrollment.roll, locale)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{pick('বিভাগ', 'Group')}</p>
          <p className="font-bold mt-0.5">
            {me.grp ? (locale === 'bn' ? me.grp.nameBn || me.grp.name : me.grp.name) : pick('সাধারণ', 'General')}
          </p>
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="text-base font-semibold mb-3">{pick('পাঠ্য বিষয়সমূহ', 'Enrolled Subjects')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((sub) => (
            <div key={sub!.id} className="p-3 rounded-[var(--radius)] border border-border text-sm">
              <p className="text-base font-semibold">{locale === 'bn' ? sub!.nameBn || sub!.name : sub!.name}</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{sub!.officialCode ?? '—'}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function StudentRoutinePage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const me = useCurrentStudent(db);
  const { locale, pick } = useI18n();
  if (isLoading || !db || !me || !me.enrollment) return <LoadingSkeleton />;

  const routines = db.classRoutines.filter((r) => r.sectionId === me.enrollment!.sectionId);
  return (
    <div className="space-y-6">
      <PageHeader title={pick('আমার ক্লাস রুটিন', 'My Class Routine')} />
      <div className="space-y-4">
        {DAYS_ORDER.map((day) => {
          const items = routines
            .filter((r) => r.day === day)
            .sort((a, b) => a.periodNumber - b.periodNumber);
          const dayMeta = ENUM_LABELS.WeekDay?.[day];
          return (
            <Card key={day} className="p-4">
              <h3 className="text-base font-bold text-primary mb-2">
                {locale === 'bn' ? dayMeta?.bn ?? day : dayMeta?.en ?? day}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {items.map((r) => {
                  const ta = db.teacherAssignments.find((a) => a.id === r.teacherAssignmentId);
                  const cs = db.classSubjects.find((x) => x.id === ta?.classSubjectId);
                  const sub = db.subjects.find((s) => s.id === cs?.subjectId);
                  return (
                    <div key={r.id} className="p-3 rounded border border-border bg-surface-muted/40">
                      <p className="text-xs font-semibold text-primary tabular-nums">
                        {formatTime12h(r.startTime, locale)} – {formatTime12h(r.endTime, locale)}
                      </p>
                      <p className="text-base font-semibold mt-1">
                        {locale === 'bn' ? sub?.nameBn || sub?.name : sub?.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function StudentAttendancePage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const me = useCurrentStudent(db);
  const { locale, pick } = useI18n();
  if (isLoading || !db || !me || !me.enrollment) return <LoadingSkeleton />;

  const records = db.attendances
    .filter((a) => a.studentEnrollmentId === me.enrollment!.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <PageHeader title={pick('আমার হাজিরা', 'My Attendance')} />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted/70 text-sm text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left">{pick('তারিখ', 'Date')}</th>
              <th className="px-4 py-3 text-left">{pick('অবস্থা', 'Status')}</th>
              <th className="px-4 py-3 text-left">{pick('পদ্ধতি', 'Method')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border tabular-nums">
            {records.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5">{formatDateLong(r.date, locale)}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge enumName="AttendanceStatus" value={r.status} />
                </td>
                <td className="px-4 py-2.5 text-sm">{r.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function StudentExaminationsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const me = useCurrentStudent(db);
  const { locale, pick } = useI18n();
  if (isLoading || !db || !me || !me.enrollment) return <LoadingSkeleton />;

  const exams = db.exams.filter((e) => e.classId === me.enrollment!.classId);
  return (
    <div className="space-y-6">
      <PageHeader title={pick('পরীক্ষার সূচি', 'Examinations')} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map((ex) => (
          <Card key={ex.id} className="p-5">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-bold">{ex.name}</h3>
              <StatusBadge enumName="ResultPublicationStatus" value={ex.resultStatus} />
            </div>
            <p className="text-sm text-muted-foreground mt-2 tabular-nums">
              {formatDateLong(ex.startDate, locale)} – {formatDateLong(ex.endDate, locale)}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function StudentResultsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const me = useCurrentStudent(db);
  const { locale, pick } = useI18n();
  if (isLoading || !db || !me || !me.enrollment) return <LoadingSkeleton />;

  const summaries = db.resultSummaries.filter((r) => {
    const ex = db.exams.find((e) => e.id === r.examId);
    return (
      r.studentEnrollmentId === me.enrollment!.id &&
      ex?.resultStatus === ResultPublicationStatus.PUBLISHED
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader title={pick('আমার প্রকাশিত ফলাফল', 'My Published Results')} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaries.map((s) => {
          const ex = db.exams.find((e) => e.id === s.examId);
          return (
            <Card key={s.id} className="p-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold">{ex?.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 tabular-nums">
                  GPA: {s.gpa ? formatNumber(s.gpa, locale, 2) : '—'} · {pick('গ্রেড:', 'Grade:')}{' '}
                  {s.letterGrade ?? '—'}
                </p>
              </div>
              <Link href={`/student/results/${s.id}`}>
                <Button variant="primary" size="sm">
                  {pick('মার্কশিট', 'Marksheet')}
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function StudentResultDetailPage() {
  const { id } = useParams();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const me = useCurrentStudent(db);
  const { pick } = useI18n();
  if (isLoading || !db || !me || !me.enrollment) return <LoadingSkeleton />;

  const summary = db.resultSummaries.find((r) => r.id === id);
  const exam = db.exams.find((e) => e.id === summary?.examId);
  if (!summary || !exam || exam.resultStatus !== ResultPublicationStatus.PUBLISHED) {
    return <EmptyState title={pick('প্রকাশিত ফলাফল পাওয়া যায়নি', 'Published result not found')} />;
  }

  const subjects = db.studentSubjectResults
    .filter((sr) => sr.examId === exam.id && sr.studentEnrollmentId === me.enrollment!.id)
    .map((sr) => {
      const es = db.examSubjects.find((x) => x.id === sr.examSubjectId);
      const sub = db.subjects.find((x) => x.id === es?.subjectId);
      const mk = db.marks.find(
        (m) => m.examSubjectId === sr.examSubjectId && m.studentEnrollmentId === me.enrollment!.id
      );
      return {
        subjectCode: sub?.officialCode ?? '—',
        subjectName: sub?.name ?? 'Subject',
        subjectNameBn: sub?.nameBn ?? sub?.name ?? 'বিষয়',
        fullMarks: es?.fullMarks ?? 100,
        writtenMarks: mk?.writtenMarks ?? 0,
        mcqMarks: mk?.mcqMarks ?? 0,
        practicalMarks: mk?.practicalMarks ?? 0,
        totalMarks: sr.totalMarks,
        letterGrade: sr.letterGrade,
        gradePoint: sr.gradePoint,
        isPassed: sr.isPassed,
        isOptional: sr.isOptional,
        bonusGradePoint: sr.bonusGradePoint ?? 0,
        isAbsent: sr.isAbsent,
      };
    });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center no-print">
        <Link href="/student/results">
          <Button variant="outline" size="sm">
            {pick('সব ফলাফল', 'Back to Results')}
          </Button>
        </Link>
        <Button variant="primary" size="sm" onClick={() => triggerPrint()}>
          <Printer className="w-4 h-4" />
          {pick('প্রিন্ট করুন', 'Print')}
        </Button>
      </div>
      <PrintableMarksheet
        school={db.schoolProfile}
        examName={exam.name}
        student={{
          studentId: me.student.studentId,
          nameEn: me.student.nameEn,
          nameBn: me.student.nameBn,
          roll: me.enrollment.roll,
          className: me.cls?.name ?? '',
          classNameBn: me.cls?.nameBn ?? me.cls?.name ?? '',
          sectionName: me.sec?.name ?? '',
          groupName: me.grp?.name,
          groupNameBn: me.grp?.nameBn ?? me.grp?.name,
          academicYear: me.yr?.name ?? '2026',
        }}
        summary={summary}
        subjects={subjects}
      />
    </div>
  );
}

export function StudentResourcesPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  if (isLoading || !db) return <LoadingSkeleton />;
  return (
    <div className="space-y-6">
      <PageHeader title={pick('শিক্ষা রিসোর্স', 'Academic Resources')} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {db.digitalResources.map((r) => (
          <Card key={r.id} className="p-5 space-y-2">
            <h3 className="font-bold text-base">{r.title}</h3>
            <p className="text-sm text-muted-foreground">{r.description}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info(pick('রিসোর্স খোলা হয়েছে', 'Resource opened'))}
            >
              {pick('পড়ুন', 'Open')}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function StudentLibraryPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  if (isLoading || !db) return <LoadingSkeleton />;
  return (
    <div className="space-y-6">
      <PageHeader title={pick('বিদ্যালয় গ্রন্থাগার', 'School Library Catalog')} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {db.libraryBooks.map((b) => (
          <Card key={b.id} className="p-5 space-y-1.5">
            <h3 className="font-bold text-base">{b.title}</h3>
            <p className="text-sm text-muted-foreground">{b.author ?? '—'}</p>
            <p className="text-sm text-muted-foreground">
              {b.category ?? '—'} · {b.publisher ?? '—'}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function StudentNoticesPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <LoadingSkeleton />;
  return (
    <div className="space-y-6">
      <PageHeader title={pick('নোটিশ', 'Notices')} />
      <div className="space-y-3">
        {db.notices.map((n) => (
          <Card key={n.id} className="p-5">
            <h3 className="text-base font-semibold">{n.title}</h3>
            <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
              {formatDateLong(n.publishedAt ?? n.createdAt, locale)}
            </p>
            <p className="text-base mt-2 leading-relaxed">{n.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function StudentNotificationsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const { locale, pick } = useI18n();
  if (isLoading || !db) return <LoadingSkeleton />;
  const items = db.notifications.filter((n) => n.targetRoles.includes('STUDENT'));
  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('নোটিফিকেশন', 'Notifications')}
        actions={
          <Button variant="outline" size="sm" onClick={() => markRead({})}>
            {pick('সব পঠিত করুন', 'Mark All Read')}
          </Button>
        }
      />
      <div className="space-y-3">
        {items.map((n) => (
          <Card key={n.id} className="p-4">
            <p className="text-base font-semibold">{locale === 'bn' ? n.titleBn : n.titleEn}</p>
            <p className="text-sm text-muted-foreground mt-1">{locale === 'bn' ? n.bodyBn : n.bodyEn}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
