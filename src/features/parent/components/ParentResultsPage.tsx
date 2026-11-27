'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from '@/src/lib/navigation';
import { MonitorPlay, Printer, Users } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
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
import { Button, Card, Select } from '@/src/components/ui/primitives';
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

function useParentChildren(db: MockDatabase | undefined) {
  const auth = useAppSelector((s) => s.auth);
  return useMemo(() => {
    if (!db) return { parent: null, children: [] };
    const parent =
      (auth.user?.parentId ? db.parents.find((p) => p.id === auth.user?.parentId) : null) ??
      db.parents[0] ??
      null;
    if (!parent) return { parent: null, children: [] };
    const links = db.parentStudents.filter((l) => l.parentId === parent.id);
    const children = links
      .map((l) => {
        const student = db.students.find((s) => s.id === l.studentId);
        const enrollment = db.enrollments.find((e) => e.studentId === l.studentId);
        const cls = db.classes.find((c) => c.id === enrollment?.classId);
        const sec = db.sections.find((s) => s.id === enrollment?.sectionId);
        const grp = db.academicGroups.find((g) => g.id === enrollment?.groupId);
        const yr = db.academicYears.find((y) => y.id === enrollment?.academicYearId);
        if (!student || !enrollment) return null;
        return { link: l, student, enrollment, cls, sec, grp, yr };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
    return { parent, children };
  }, [db, auth.user?.parentId]);
}

function ChildSwitcherBar({
  childrenList,
  selectedStudentId,
  onChange,
}: {
  childrenList: ReturnType<typeof useParentChildren>['children'];
  selectedStudentId: string;
  onChange: (id: string) => void;
}) {
  if (childrenList.length <= 1) return null;
  return (
    <Card className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-surface-muted/40">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Users className="w-4 h-4 text-primary" />
        <span>{'সন্তান নির্বাচন করুন:'}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {childrenList.map((c) => {
          const active = c.student.id === selectedStudentId;
          return (
            <button
              key={c.student.id}
              type="button"
              onClick={() => onChange(c.student.id)}
              className={`px-3 py-1.5 rounded-[var(--radius)] text-sm font-semibold border transition-colors cursor-pointer ${
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-surface text-foreground border-border hover:bg-surface-muted'
              }`}
            >
              {c.student.nameBn || c.student.nameEn} ·{' '}
              {c.cls?.nameBn || c.cls?.name} ({c.sec?.name})
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export function ParentResultsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { children } = useParentChildren(db);
  const [selectedId, setSelectedId] = useState('stu-10-1');
  const [selectedExamId, setSelectedExamId] = useState('');

  if (isLoading || !db) return <LoadingSkeleton />;
  const active = children.find((c) => c.student.id === selectedId) ?? children[0];
  if (!active) return <EmptyState title={'কোনো তথ্য নেই'} />;

  const publishedExams = db.exams.filter(
    (e) =>
      e.classId === active.enrollment.classId &&
      e.resultStatus === ResultPublicationStatus.PUBLISHED
  );
  const activeExam = publishedExams.find((e) => e.id === selectedExamId) ?? publishedExams[0];
  const summary = activeExam
    ? db.resultSummaries.find(
        (r) => r.examId === activeExam.id && r.studentEnrollmentId === active.enrollment.id
      )
    : null;

  const subjects =
    activeExam && summary
      ? db.studentSubjectResults
          .filter((sr) => sr.examId === activeExam.id && sr.studentEnrollmentId === active.enrollment.id)
          .map((sr) => {
            const es = db.examSubjects.find((x) => x.id === sr.examSubjectId);
            const sub = db.subjects.find((x) => x.id === es?.subjectId);
            const mk = db.marks.find(
              (m) => m.examSubjectId === sr.examSubjectId && m.studentEnrollmentId === active.enrollment.id
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
          })
      : [];

  const trendData = publishedExams.map((ex) => {
    const s = db.resultSummaries.find(
      (r) => r.examId === ex.id && r.studentEnrollmentId === active.enrollment.id
    );
    return {
      exam: ex.name.slice(0, 18),
      gpa: s?.gpa ?? 0,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={'প্রকাশিত ফলাফল ও মার্কশিট'}
        description={'শুধুমাত্র প্রকাশিত পরীক্ষার ফলাফল ও প্রিন্টযোগ্য একাডেমিক ট্রান্সক্রিপ্ট'}
        actions={
          summary ? (
            <Button variant="primary" size="sm" onClick={() => triggerPrint()} className="no-print">
              <Printer className="w-4 h-4" />
              {'মার্কশিট প্রিন্ট করুন'}
            </Button>
          ) : undefined
        }
      />

      <div className="no-print space-y-4">
        <ChildSwitcherBar
          childrenList={children}
          selectedStudentId={active.student.id}
          onChange={(id) => {
            setSelectedId(id);
            setSelectedExamId('');
          }}
        />

        {publishedExams.length > 0 && (
          <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
            <Select
              value={activeExam?.id ?? ''}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="max-w-sm"
            >
              {publishedExams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </Select>
            {activeExam && (
              <StatusBadge enumName="ResultPublicationStatus" value={activeExam.resultStatus} />
            )}
          </Card>
        )}
      </div>

      {!activeExam || !summary ? (
        <EmptyState
          title={'কোনো প্রকাশিত ফলাফল পাওয়া যায়নি'}
          description={'খসড়া বা স্থগিত ফলাফল এখানে প্রদর্শিত হয় না।'}
        />
      ) : (
        <>
          <PrintableMarksheet
            school={db.schoolProfile}
            examName={activeExam.name}
            student={{
              studentId: active.student.studentId,
              nameEn: active.student.nameEn,
              nameBn: active.student.nameBn,
              roll: active.enrollment.roll,
              className: active.cls?.name ?? '',
              classNameBn: active.cls?.nameBn ?? active.cls?.name ?? '',
              sectionName: active.sec?.name ?? '',
              groupName: active.grp?.name,
              groupNameBn: active.grp?.nameBn ?? active.grp?.name,
              academicYear: active.yr?.name ?? '2026',
            }}
            summary={summary}
            subjects={subjects}
          />

          <Card className="p-5 no-print">
            <h2 className="text-base font-semibold mb-3">
              {'জিপিএ অগ্রগতি চার্ট'}
            </h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="exam" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="gpa"
                    stroke="#0B7A34"
                    fill="#16A34A"
                    fillOpacity={0.22}
                    name="GPA"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

