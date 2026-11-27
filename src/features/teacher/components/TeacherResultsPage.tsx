'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from '@/src/lib/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileSpreadsheet,
  Lock,
  MonitorPlay,
  Printer,
  Save,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { toast } from 'sonner';
import { CommonProfilePanel } from '@/src/components/shared/CommonProfilePanel';
import {
  useGetBootstrapQuery,
  useMarkNotificationReadMutation,
  useSaveAttendanceBatchMutation,
  useSaveMarksBatchMutation,
} from '@/src/store/api';
import { useAppSelector } from '@/src/store/hooks';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { PrintableMarksheet } from '@/src/components/print/PrintDocuments';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import {
  formatDateLong,
  formatDateShort,
  formatNumber,
  formatTime12h,
  evaluateExamSubjectMark,
} from '@/src/lib/formatters';
import { ENUM_LABELS } from '@/src/lib/constants/enums';
import { triggerPrint } from '@/src/lib/utils/cn';
import {
  AttendanceMethod,
  AttendanceStatus,
  ResultPublicationStatus,
  WeekDay,
} from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';

const DAYS_ORDER: WeekDay[] = [
  WeekDay.SUNDAY,
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
];

function useCurrentTeacher(db: MockDatabase | undefined) {
  const auth = useAppSelector((s) => s.auth);
  return useMemo(() => {
    if (!db) return null;
    const byId = auth.user?.staffId ? db.staff.find((s) => s.id === auth.user?.staffId) : null;
    return byId ?? db.staff.find((s) => s.id === 'staff-3') ?? db.staff[0] ?? null;
  }, [db, auth.user?.staffId]);
}

function getAssignmentSubject(db: MockDatabase, classSubjectId: string) {
  const cs = db.classSubjects.find((x) => x.id === classSubjectId);
  return cs ? db.subjects.find((s) => s.id === cs.subjectId) : undefined;
}

export function TeacherResultsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const teacher = useCurrentTeacher(db);
  const [examId, setExamId] = useState('exam-hy-10');
  const [previewSummaryId, setPreviewSummaryId] = useState<string | null>(null);

  const myClassIds = db && teacher
    ? Array.from(
        new Set(db.teacherAssignments.filter((a) => a.staffId === teacher.id).map((a) => a.classId))
      )
    : [];
  const myExams = db ? db.exams.filter((e) => myClassIds.includes(e.classId)) : [];
  const exam = myExams.find((e) => e.id === examId) ?? myExams[0];
  const summaries = db
    ? db.resultSummaries
        .filter((r) => r.examId === exam?.id)
        .sort((a, b) => (a.meritPosition ?? 999) - (b.meritPosition ?? 999))
    : [];

  const selectedSummary = previewSummaryId
    ? summaries.find((s) => s.id === previewSummaryId)
    : null;

  const marksheetProps = useMemo(() => {
    if (!db || !selectedSummary || !exam) return null;
    const enr = db.enrollments.find((e) => e.id === selectedSummary.studentEnrollmentId);
    const stu = db.students.find((s) => s.id === enr?.studentId);
    const cls = db.classes.find((c) => c.id === enr?.classId);
    const sec = db.sections.find((s) => s.id === enr?.sectionId);
    const grp = db.academicGroups.find((g) => g.id === enr?.groupId);
    const yr = db.academicYears.find((y) => y.id === enr?.academicYearId);
    if (!enr || !stu || !cls || !sec) return null;

    const subjects = db.studentSubjectResults
      .filter((sr) => sr.examId === exam.id && sr.studentEnrollmentId === enr.id)
      .map((sr) => {
        const es = db.examSubjects.find((x) => x.id === sr.examSubjectId);
        const sub = db.subjects.find((x) => x.id === es?.subjectId);
        const mk = db.marks.find(
          (m) => m.examSubjectId === sr.examSubjectId && m.studentEnrollmentId === enr.id
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

    return {
      school: db.schoolProfile,
      examName: exam.name,
      student: {
        studentId: stu.studentId,
        nameEn: stu.nameEn,
        nameBn: stu.nameBn,
        roll: enr.roll,
        className: cls.name,
        classNameBn: cls.nameBn ?? cls.name,
        sectionName: sec.name,
        groupName: grp?.name,
        groupNameBn: grp?.nameBn ?? grp?.name,
        academicYear: yr?.name ?? '2026',
      },
      summary: selectedSummary,
      subjects,
    };
  }, [selectedSummary, exam, db]);

  if (isLoading || !db || !teacher) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={'শ্রেণির ফলাফল ও মেধাতালিকা'}
        description={'আপনার নির্ধারিত শ্রেণিসমূহের ফলাফল বিশ্লেষণ'}
      />
      <Card className="p-4 flex items-center justify-between gap-4">
        <Select value={exam?.id ?? ''} onChange={(e) => setExamId(e.target.value)} className="max-w-sm">
          {myExams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} ({ENUM_LABELS.ResultPublicationStatus?.[e.resultStatus]?.bn ?? e.resultStatus})
            </option>
          ))}
        </Select>
        {exam && <StatusBadge enumName="ResultPublicationStatus" value={exam.resultStatus} />}
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead className="bg-surface-muted/70 text-sm text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">{'মেধা'}</th>
                <th className="px-4 py-3 text-left">{'রোল'}</th>
                <th className="px-4 py-3 text-left">{'শিক্ষার্থী'}</th>
                <th className="px-4 py-3 text-right">{'মোট নম্বর'}</th>
                <th className="px-4 py-3 text-right">GPA</th>
                <th className="px-4 py-3 text-center">{'গ্রেড'}</th>
                <th className="px-4 py-3 text-right">{'মার্কশিট'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {summaries.map((sum) => {
                const enr = db.enrollments.find((e) => e.id === sum.studentEnrollmentId);
                const stu = db.students.find((s) => s.id === enr?.studentId);
                return (
                  <tr key={sum.id}>
                    <td className="px-4 py-3 font-bold">
                      {sum.meritPosition ? `#${formatNumber(sum.meritPosition, 'bn')}` : '—'}
                    </td>
                    <td className="px-4 py-3">{enr ? formatNumber(enr.roll, 'bn') : '—'}</td>
                    <td className="px-4 py-3 font-medium">
                      {stu?.nameBn || stu?.nameEn}
                    </td>
                    <td className="px-4 py-3 text-right">{formatNumber(sum.totalMarks, 'bn')}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">
                      {sum.gpa !== null && sum.gpa !== undefined ? formatNumber(sum.gpa, 'bn', 2) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{sum.letterGrade ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => setPreviewSummaryId(sum.id)}>
                        {'দেখুন'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={Boolean(marksheetProps)}
        onClose={() => setPreviewSummaryId(null)}
        title={'শিক্ষার্থীর মার্কশিট'}
        maxWidth="max-w-4xl"
      >
        {marksheetProps && (
          <div className="space-y-4">
            <div className="flex justify-end no-print">
              <Button variant="primary" size="sm" onClick={() => triggerPrint()}>
                <Printer className="w-4 h-4" />
                {'প্রিন্ট করুন'}
              </Button>
            </div>
            <PrintableMarksheet {...marksheetProps} />
          </div>
        )}
      </Modal>
    </div>
  );
}

