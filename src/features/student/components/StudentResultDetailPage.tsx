'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from '@/src/lib/navigation';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { useGetBootstrapQuery, useMarkNotificationReadMutation } from '@/src/store/api';
import { useAppSelector } from '@/src/store/hooks';
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

export function StudentResultDetailPage() {
  const { id } = useParams();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const me = useCurrentStudent(db);
  if (isLoading || !db || !me || !me.enrollment) return <LoadingSkeleton />;

  const summary = db.resultSummaries.find((r) => r.id === id);
  const exam = db.exams.find((e) => e.id === summary?.examId);
  if (!summary || !exam || exam.resultStatus !== ResultPublicationStatus.PUBLISHED) {
    return <EmptyState title={'প্রকাশিত ফলাফল পাওয়া যায়নি'} />;
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
            {'সব ফলাফল'}
          </Button>
        </Link>
        <Button variant="primary" size="sm" onClick={() => triggerPrint()}>
          <Printer className="w-4 h-4" />
          {'প্রিন্ট করুন'}
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

