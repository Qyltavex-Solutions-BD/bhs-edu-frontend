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
import { useI18n } from '@/src/lib/i18n';
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

export function TeacherMarksEntryPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [saveMarks, { isLoading: saving }] = useSaveMarksBatchMutation();
  const teacher = useCurrentTeacher(db);
  const auth = useAppSelector((s) => s.auth);
  const { locale, pick } = useI18n();

  const [selectedExamId, setSelectedExamId] = useState('exam-ann-10');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [edits, setEdits] = useState<
    Record<string, { written: number; mcq: number; practical: number; isAbsent: boolean }>
  >({});

  if (isLoading || !db || !teacher) return <LoadingSkeleton />;

  const myAssignments = db.teacherAssignments.filter((a) => a.staffId === teacher.id);
  const myClassIds = Array.from(new Set(myAssignments.map((a) => a.classId)));
  const myExams = db.exams.filter((e) => myClassIds.includes(e.classId));
  const exam = myExams.find((e) => e.id === selectedExamId) ?? myExams[0];

  const examAssignments = myAssignments.filter((a) => a.classId === exam?.classId);
  const activeAssignment =
    examAssignments.find((a) => a.id === selectedAssignmentId) ?? examAssignments[0];

  const activeSubject = activeAssignment
    ? getAssignmentSubject(db, activeAssignment.classSubjectId)
    : undefined;
  const examSubject = db.examSubjects.find(
    (es) => es.examId === exam?.id && es.subjectId === activeSubject?.id
  );
  const scale = db.gradingScales.find((g) => g.id === exam?.gradingScaleId) ?? db.gradingScales[0];
  const scaleRanges = db.gradeRanges.filter((g) => g.gradingScaleId === scale?.id);

  const enrollments = activeAssignment
    ? db.enrollments
        .filter((e) => e.sectionId === activeAssignment.sectionId)
        .sort((a, b) => a.roll - b.roll)
    : [];

  const canEdit =
    Boolean(activeAssignment?.canEnterMarks) &&
    Boolean(exam) &&
    !exam.isLocked &&
    exam.resultStatus !== ResultPublicationStatus.PUBLISHED;

  const getRow = (enrId: string) => {
    if (edits[enrId]) return edits[enrId];
    const existing = db.marks.find(
      (m) => m.examSubjectId === examSubject?.id && m.studentEnrollmentId === enrId
    );
    return {
      written: existing?.writtenMarks ?? 0,
      mcq: existing?.mcqMarks ?? 0,
      practical: existing?.practicalMarks ?? 0,
      isAbsent: existing?.isAbsent ?? false,
    };
  };

  const handleSave = async () => {
    if (!exam || !examSubject || !canEdit) return;
    try {
      const res = await saveMarks({
        examId: exam.id,
        examSubjectId: examSubject.id,
        enteredBy: auth.user?.id ?? 'user-teacher-1',
        entries: enrollments.map((enr) => {
          const r = getRow(enr.id);
          return {
            studentEnrollmentId: enr.id,
            writtenMarks: r.isAbsent ? 0 : r.written,
            mcqMarks: r.isAbsent ? 0 : r.mcq,
            practicalMarks: r.isAbsent ? 0 : r.practical,
            continuousAssessmentMarks: 0,
            isAbsent: r.isAbsent,
          };
        }),
      }).unwrap();
      toast.success(
        pick(
          `${formatNumber(res.savedCount, locale)} জন শিক্ষার্থীর নম্বর সংরক্ষিত হয়েছে`,
          `Saved marks for ${res.savedCount} students`
        )
      );
      setEdits({});
    } catch {
      toast.error(pick('নম্বর সংরক্ষণ ব্যর্থ হয়েছে', 'Failed to save marks'));
    }
  };

  const wMax = examSubject?.writtenFullMarks ?? 0;
  const mMax = examSubject?.mcqFullMarks ?? 0;
  const pMax = examSubject?.practicalFullMarks ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('শিক্ষক নম্বর এন্ট্রি (সীমাবদ্ধ)', 'Teacher Marks Entry (Scoped)')}
        description={pick(
          'শুধুমাত্র আপনার নির্ধারিত শ্রেণি, শাখা ও বিষয়ের নম্বর এন্ট্রি করুন (canEnterMarks অনুযায়ী)',
          'Strictly scoped to your assigned class, section, and subjects with mark-entry permission'
        )}
      />

      <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-1">
            {pick('পরীক্ষা নির্বাচন', 'Select Examination')}
          </label>
          <Select
            value={exam?.id ?? ''}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              setSelectedAssignmentId('');
              setEdits({});
            }}
          >
            {myExams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.resultStatus})
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-1">
            {pick('আপনার নির্ধারিত বিষয় ও শাখা', 'Your Assigned Subject & Section')}
          </label>
          <Select
            value={activeAssignment?.id ?? ''}
            onChange={(e) => {
              setSelectedAssignmentId(e.target.value);
              setEdits({});
            }}
          >
            {examAssignments.map((a) => {
              const sub = getAssignmentSubject(db, a.classSubjectId);
              const sec = db.sections.find((s) => s.id === a.sectionId);
              return (
                <option key={a.id} value={a.id}>
                  {locale === 'bn' ? sub?.nameBn || sub?.name : sub?.name} ({sec?.name})
                  {a.canEnterMarks ? '' : ' [Read-Only]'}
                </option>
              );
            })}
          </Select>
        </div>

        <div className="flex justify-end">
          <Button variant="primary" disabled={!canEdit || saving || !examSubject} onClick={handleSave}>
            <Save className="w-4 h-4" />
            {pick('নম্বর সংরক্ষণ করুন', 'Save Subject Marks')}
          </Button>
        </div>
      </Card>

      {activeAssignment && !activeAssignment.canEnterMarks && (
        <div className="p-4 rounded-[var(--radius)] border border-warning/40 bg-warning/10 flex items-start gap-3 text-sm">
          <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              {pick('এই বিষয়ের নম্বর এন্ট্রি অনুমতি আপনার জন্য সীমাবদ্ধ', 'Mark Entry Permission Restricted')}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pick(
                'TeacherAssignment.canEnterMarks = false হওয়ায় আপনি এই বিষয়ের নম্বর শুধুমাত্র দেখতে পারবেন, পরিবর্তন করতে পারবেন না।',
                'Your assignment for this subject has canEnterMarks = false. You may review marks in read-only mode only.'
              )}
            </p>
          </div>
        </div>
      )}

      {exam && (exam.isLocked || exam.resultStatus === ResultPublicationStatus.PUBLISHED) && (
        <div className="p-3.5 rounded-[var(--radius)] border border-border bg-surface-muted flex items-center gap-2.5 text-sm">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <span>
            {pick(
              'এই পরীক্ষার নম্বর লক বা প্রকাশিত হয়ে গেছে। পরিবর্তনের জন্য অ্যাডমিনের অনুমতি প্রয়োজন।',
              'This examination is locked or published. Contact Admin to unlock marks.'
            )}
          </span>
        </div>
      )}

      {!examSubject ? (
        <EmptyState
          title={pick('এই পরীক্ষায় বিষয়টি অন্তর্ভুক্ত নয়', 'Subject not scheduled in this exam')}
          description={pick('অন্য পরীক্ষা বা বিষয় নির্বাচন করুন।', 'Select another exam or assigned subject.')}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-muted/50 flex flex-wrap items-center justify-between gap-2 text-sm tabular-nums">
            <span className="font-semibold">
              {locale === 'bn' ? activeSubject?.nameBn || activeSubject?.name : activeSubject?.name} —{' '}
              {pick('পূর্ণমান:', 'Full:')} {formatNumber(examSubject.fullMarks, locale)} (
              {pick('লিখিত', 'Written')} {formatNumber(wMax, locale)} · MCQ {formatNumber(mMax, locale)} ·{' '}
              {pick('ব্যবহারিক', 'Prac')} {formatNumber(pMax, locale)})
            </span>
            <StatusBadge enumName="ResultPublicationStatus" value={exam.resultStatus} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted/70 text-sm text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-3 py-2.5 text-left">{pick('রোল', 'Roll')}</th>
                  <th className="px-3 py-2.5 text-left">{pick('শিক্ষার্থী', 'Student')}</th>
                  <th className="px-3 py-2.5 text-center">{pick('অনুপস্থিত', 'Absent')}</th>
                  <th className="px-3 py-2.5 text-right">{pick('লিখিত', 'Written')}</th>
                  <th className="px-3 py-2.5 text-right">MCQ</th>
                  <th className="px-3 py-2.5 text-right">{pick('ব্যবহারিক', 'Practical')}</th>
                  <th className="px-3 py-2.5 text-right">{pick('মোট', 'Total')}</th>
                  <th className="px-3 py-2.5 text-center">{pick('গ্রেড', 'Grade')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {enrollments.map((enr) => {
                  const stu = db.students.find((s) => s.id === enr.studentId);
                  const row = getRow(enr.id);
                  const total = row.isAbsent ? 0 : row.written + row.mcq + row.practical;
                  const grade = evaluateExamSubjectMark(
                    {
                      writtenMarks: row.written,
                      mcqMarks: row.mcq,
                      practicalMarks: row.practical,
                      continuousAssessmentMarks: 0,
                      isAbsent: row.isAbsent,
                    },
                    examSubject,
                    scaleRanges
                  );

                  return (
                    <tr key={enr.id}>
                      <td className="px-3 py-2 font-semibold">{formatNumber(enr.roll, locale)}</td>
                      <td className="px-3 py-2 font-medium">
                        {locale === 'bn' ? stu?.nameBn || stu?.nameEn : stu?.nameEn}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          disabled={!canEdit}
                          checked={row.isAbsent}
                          onChange={(e) =>
                            setEdits((prev) => ({
                              ...prev,
                              [enr.id]: { ...row, isAbsent: e.target.checked },
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          max={wMax}
                          disabled={!canEdit || row.isAbsent || wMax === 0}
                          value={row.written}
                          onChange={(e) => {
                            const v = Math.min(wMax, Math.max(0, Number(e.target.value) || 0));
                            setEdits((prev) => ({ ...prev, [enr.id]: { ...row, written: v } }));
                          }}
                          className="w-16 text-right px-2 py-1 border border-border rounded bg-surface disabled:opacity-50"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          max={mMax}
                          disabled={!canEdit || row.isAbsent || mMax === 0}
                          value={row.mcq}
                          onChange={(e) => {
                            const v = Math.min(mMax, Math.max(0, Number(e.target.value) || 0));
                            setEdits((prev) => ({ ...prev, [enr.id]: { ...row, mcq: v } }));
                          }}
                          className="w-16 text-right px-2 py-1 border border-border rounded bg-surface disabled:opacity-50"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          max={pMax}
                          disabled={!canEdit || row.isAbsent || pMax === 0}
                          value={row.practical}
                          onChange={(e) => {
                            const v = Math.min(pMax, Math.max(0, Number(e.target.value) || 0));
                            setEdits((prev) => ({ ...prev, [enr.id]: { ...row, practical: v } }));
                          }}
                          className="w-16 text-right px-2 py-1 border border-border rounded bg-surface disabled:opacity-50"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-bold">{formatNumber(total, locale)}</td>
                      <td
                        className={`px-3 py-2 text-center font-bold ${
                          grade.isPassed ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {row.isAbsent ? 'AB' : grade.letterGrade}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

