'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Clock,
  Lock,
  Pencil,
  Save,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { useGetMyTeacherAssignmentsQuery } from '@/src/services/academic';
import {
  useGetExamsQuery,
  useGetExamSubjectsQuery,
  useGetGradeSheetQuery,
  useGetGradingScalesQuery,
  useSaveBulkMarksMutation,
} from '@/src/features/examinations/api/examinations.api';
import { useI18n } from '@/src/lib/i18n';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Select } from '@/src/components/ui/primitives';
import {
  evaluateExamSubjectMark,
  formatDateShort,
  formatNumber,
} from '@/src/lib/formatters';
import { ResultPublicationStatus } from '@/src/types/enums';
import type { GradeRange } from '@/src/types/entities';

interface MarkEditDraft {
  written: string;
  mcq: string;
  practical: string;
  ca: string;
  isAbsent: boolean;
}

function sanitizeMarkInput(raw: string, max: number): string {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (cleaned === '') return '';
  const parts = cleaned.split('.');
  const normalized =
    parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
  const limitedDecimals =
    parts.length === 2 ? `${parts[0]}.${parts[1].slice(0, 2)}` : normalized;
  const num = Number(limitedDecimals);
  if (Number.isNaN(num)) return '';
  if (num > max) return String(max);
  return limitedDecimals;
}

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object') {
    const data = (err as { data?: { message?: unknown } }).data;
    if (data && typeof data.message === 'string') return data.message;
    if ('message' in err && typeof (err as { message?: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
  }
  return fallback;
}

export function TeacherMarksEntryPage() {
  const { locale, pick } = useI18n();

  const { data: myAssignments = [], isLoading: loadingAssignments } =
    useGetMyTeacherAssignmentsQuery();
  const { data: examsRes, isLoading: loadingExams } = useGetExamsQuery({
    limit: 100,
    isDeleted: false,
  });
  const { data: scalesRes } = useGetGradingScalesQuery();
  const [saveBulkMarks, { isLoading: saving }] = useSaveBulkMarksMutation();

  const [selectedExamName, setSelectedExamName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [isEntryMode, setIsEntryMode] = useState(false);
  const [edits, setEdits] = useState<Record<string, MarkEditDraft>>({});

  const activeAssignments = useMemo(
    () =>
      myAssignments.filter(
        (a) => (a as { academicYear?: { isActive?: boolean } }).academicYear?.isActive !== false
      ),
    [myAssignments]
  );

  const allMyExams = useMemo(() => {
    const allExams = examsRes?.items ?? [];
    if (activeAssignments.length === 0) return [];
    const assignedPairs = new Set(
      activeAssignments.map((a) => `${a.academicYearId}:${a.classId}`)
    );
    return allExams.filter((e) => assignedPairs.has(`${e.academicYearId}:${e.classId}`));
  }, [examsRes?.items, activeAssignments]);

  const examNames = useMemo(
    () => Array.from(new Set(allMyExams.map((e) => e.name))),
    [allMyExams]
  );

  useEffect(() => {
    if (
      examNames.length > 0 &&
      (!selectedExamName || !examNames.includes(selectedExamName))
    ) {
      setSelectedExamName(examNames[0]);
      setSelectedAssignmentId('');
      setEdits({});
    }
  }, [examNames, selectedExamName]);

  const resolvedExamName =
    selectedExamName && examNames.includes(selectedExamName)
      ? selectedExamName
      : examNames[0] ?? '';

  const assignedClasses = useMemo(() => {
    const map = new Map<string, { id: string; name: string; nameBn?: string; numericValue: number }>();
    for (const a of activeAssignments) {
      if (a.schoolClass && !map.has(a.classId)) {
        const cls = a.schoolClass as { id: string; name: string; nameBn?: string; numericValue: number };
        map.set(a.classId, cls);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.numericValue - b.numericValue);
  }, [activeAssignments]);

  useEffect(() => {
    if (
      assignedClasses.length > 0 &&
      (!selectedClassId || !assignedClasses.some((c) => c.id === selectedClassId))
    ) {
      setSelectedClassId(assignedClasses[0].id);
      setSelectedAssignmentId('');
      setEdits({});
    }
  }, [assignedClasses, selectedClassId]);

  const resolvedClassId =
    selectedClassId && assignedClasses.some((c) => c.id === selectedClassId)
      ? selectedClassId
      : assignedClasses[0]?.id ?? '';

  const exam = useMemo(
    () =>
      allMyExams.find(
        (e) => e.name === resolvedExamName && e.classId === resolvedClassId
      ),
    [allMyExams, resolvedExamName, resolvedClassId]
  );

  const examAssignments = useMemo(() => {
    if (!exam) return [];
    return myAssignments.filter(
      (a) => a.academicYearId === exam.academicYearId && a.classId === exam.classId
    );
  }, [myAssignments, exam]);

  useEffect(() => {
    if (
      examAssignments.length > 0 &&
      (!selectedAssignmentId || !examAssignments.some((a) => a.id === selectedAssignmentId))
    ) {
      setSelectedAssignmentId(examAssignments[0].id);
      setEdits({});
    }
  }, [examAssignments, selectedAssignmentId]);

  const activeAssignment =
    examAssignments.find((a) => a.id === selectedAssignmentId) ?? examAssignments[0];

  const { data: examSubjects = [], isFetching: loadingExamSubjects } =
    useGetExamSubjectsQuery(exam?.id ?? '', {
      skip: !exam?.id,
    });

  const activeSubjectId = activeAssignment?.classSubject?.subject?.id;
  const examSubject = useMemo(
    () => examSubjects.find((es) => es.subjectId === activeSubjectId),
    [examSubjects, activeSubjectId]
  );

  const {
    data: gradeSheet,
    isFetching: loadingGradeSheet,
  } = useGetGradeSheetQuery(
    {
      examSubjectId: examSubject?.id ?? '',
      sectionId: activeAssignment?.sectionId,
    },
    {
      skip: !examSubject?.id || !activeAssignment?.sectionId,
    }
  );

  const scaleRanges = useMemo<GradeRange[]>(() => {
    const scales = scalesRes?.items ?? [];
    const matched = (scales.find((s) => s.id === exam?.gradingScaleId) ?? scales[0]) as
      | { gradeRanges?: GradeRange[]; ranges?: GradeRange[] }
      | undefined;
    const rawRanges = matched?.gradeRanges ?? matched?.ranges ?? [];
    return rawRanges.map((r) => ({
      ...r,
      minPercentage: Number(r.minPercentage),
      maxPercentage: Number(r.maxPercentage),
      gradePoint: Number(r.gradePoint),
    }));
  }, [scalesRes?.items, exam?.gradingScaleId]);

  if (loadingAssignments || loadingExams) return <LoadingSkeleton />;

  const students = gradeSheet?.students ?? [];
  const gsSubject = gradeSheet?.examSubject;

  const isDeadlinePassed = Boolean(
    exam?.marksEntryDeadline && new Date() > new Date(exam.marksEntryDeadline)
  );

  const canEdit =
    Boolean(activeAssignment?.canEnterMarks) &&
    Boolean(exam) &&
    !exam?.isLocked &&
    exam?.resultStatus !== ResultPublicationStatus.PUBLISHED &&
    !isDeadlinePassed;

  const getRow = (stu: (typeof students)[number]): MarkEditDraft => {
    if (edits[stu.studentEnrollmentId]) return edits[stu.studentEnrollmentId];
    if (!stu.mark) {
      return {
        written: '',
        mcq: '',
        practical: '',
        ca: '',
        isAbsent: false,
      };
    }
    return {
      written: String(stu.mark.writtenMarks ?? ''),
      mcq: String(stu.mark.mcqMarks ?? ''),
      practical: String(stu.mark.practicalMarks ?? ''),
      ca: String(stu.mark.continuousAssessmentMarks ?? ''),
      isAbsent: stu.mark.isAbsent ?? false,
    };
  };

  const handleSave = async () => {
    if (!exam || !examSubject || !activeAssignment || !canEdit) return;
    const editedStudents = students.filter((s) => {
      if (s.mark?.isLocked) return false;
      const edit = edits[s.studentEnrollmentId];
      if (!edit) return false;
      if (s.mark) return true;
      return (
        edit.isAbsent ||
        edit.written !== '' ||
        edit.mcq !== '' ||
        edit.practical !== '' ||
        edit.ca !== ''
      );
    });

    if (editedStudents.length === 0) {
      toast.info(
        pick(
          'সংরক্ষণের জন্য অন্তত একজন শিক্ষার্থীর নম্বর লিখুন।',
          'Please enter marks for at least one student before saving.'
        )
      );
      return;
    }

    try {
      const res = await saveBulkMarks({
        examSubjectId: examSubject.id,
        sectionId: activeAssignment.sectionId,
        marks: editedStudents.map((stu) => {
          const r = getRow(stu);
          return {
            studentEnrollmentId: stu.studentEnrollmentId,
            isAbsent: r.isAbsent,
            writtenMarks: r.isAbsent ? 0 : Number(r.written || 0),
            mcqMarks: r.isAbsent ? 0 : Number(r.mcq || 0),
            practicalMarks: r.isAbsent ? 0 : Number(r.practical || 0),
            continuousAssessmentMarks: r.isAbsent ? 0 : Number(r.ca || 0),
          };
        }),
      }).unwrap();

      toast.success(
        pick(
          `${formatNumber(res.totalProcessed, locale)} জন শিক্ষার্থীর নম্বর সংরক্ষিত হয়েছে`,
          `Saved marks for ${res.totalProcessed} students`
        )
      );
      setEdits({});
      setIsEntryMode(false);
    } catch (err) {
      toast.error(getErrorMessage(err, pick('নম্বর সংরক্ষণ ব্যর্থ হয়েছে', 'Failed to save marks')));
    }
  };

  const wMax = gsSubject?.writtenFullMarks ?? examSubject?.writtenFullMarks ?? 0;
  const mMax = gsSubject?.mcqFullMarks ?? examSubject?.mcqFullMarks ?? 0;
  const pMax = gsSubject?.practicalFullMarks ?? examSubject?.practicalFullMarks ?? 0;
  const caMax =
    gsSubject?.continuousAssessmentFullMarks ??
    examSubject?.continuousAssessmentFullMarks ??
    0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('শিক্ষক নম্বর এন্ট্রি', 'Teacher Marks Entry')}
        description={pick(
          'শুধুমাত্র আপনার নির্ধারিত শ্রেণি, শাখা ও বিষয়ের শিক্ষার্থীদের নম্বর এন্ট্রি করুন',
          'Enter marks for your assigned classes, sections, and subjects'
        )}
      />

      {activeAssignments.length === 0 ? (
        <EmptyState
          title={pick('কোনো বিষয় বরাদ্দ নেই', 'No Subjects Assigned')}
          description={pick(
            'আপনাকে এখনও কোনো শ্রেণি ও বিষয়ের শিক্ষক হিসেবে নির্ধারণ করা হয়নি।',
            'You have not been assigned to any class or subject yet.'
          )}
        />
      ) : (
        <>
          <Card className="p-4 flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-52">
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                {pick('পরীক্ষা নির্বাচন', 'Select Examination')}
              </label>
              <Select
                value={resolvedExamName}
                disabled={examNames.length === 0}
                onChange={(e) => {
                  setSelectedExamName(e.target.value);
                  setSelectedAssignmentId('');
                  setIsEntryMode(false);
                  setEdits({});
                }}
                className="h-9 text-sm"
              >
                {examNames.length === 0 && (
                  <option value="">{pick('কোনো পরীক্ষা নেই', 'No exams')}</option>
                )}
                {examNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="w-full sm:w-40">
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                {pick('শ্রেণি নির্বাচন', 'Select Class')}
              </label>
              <Select
                value={resolvedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedAssignmentId('');
                  setIsEntryMode(false);
                  setEdits({});
                }}
                className="h-9 text-sm"
              >
                {assignedClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {locale === 'bn' ? cls.nameBn || cls.name : cls.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="w-full sm:w-56">
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                {pick('বিষয় ও শাখা', 'Subject & Section')}
              </label>
              <Select
                value={activeAssignment?.id ?? ''}
                disabled={examAssignments.length === 0}
                onChange={(e) => {
                  setSelectedAssignmentId(e.target.value);
                  setIsEntryMode(false);
                  setEdits({});
                }}
                className="h-9 text-sm"
              >
                {examAssignments.length === 0 && (
                  <option value="">{pick('কোনো বিষয় নেই', 'No subjects')}</option>
                )}
                {examAssignments.map((a) => {
                  const sub = a.classSubject?.subject;
                  const subName = locale === 'bn' ? sub?.nameBn || sub?.name : sub?.name;
                  return (
                    <option key={a.id} value={a.id}>
                      {subName || '—'} ({a.section?.name ?? '—'}{' '}
                      {pick('শাখা', 'Sec')})
                      {a.canEnterMarks ? '' : ` [${pick('শুধু দেখা', 'Read-Only')}]`}
                    </option>
                  );
                })}
              </Select>
            </div>

            <div className="sm:ml-auto w-full sm:w-auto flex items-center gap-2">
              {!isEntryMode ? (
                <Button
                  variant="primary"
                  size="sm"
                  className="h-9 w-full sm:w-auto"
                  disabled={!canEdit || !examSubject || students.length === 0}
                  onClick={() => setIsEntryMode(true)}
                >
                  <Pencil className="w-4 h-4 mr-1.5" />
                  {pick('নম্বর এন্ট্রি', 'Enter Marks')}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    disabled={saving}
                    onClick={() => {
                      setIsEntryMode(false);
                      setEdits({});
                    }}
                  >
                    {pick('বাতিল', 'Cancel')}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-9 w-full sm:w-auto"
                    disabled={!canEdit || saving || !examSubject || students.length === 0}
                    onClick={handleSave}
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    {saving
                      ? pick('সংরক্ষণ হচ্ছে...', 'Saving...')
                      : pick('নম্বর সংরক্ষণ করুন', 'Save Marks')}
                  </Button>
                </>
              )}
            </div>
          </Card>

          {activeAssignment && !activeAssignment.canEnterMarks && (
            <div className="p-4 rounded-[var(--radius)] border border-warning/40 bg-warning/10 flex items-start gap-3 text-sm">
              <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {pick(
                    'এই বিষয়ের নম্বর এন্ট্রি অনুমতি আপনার জন্য সীমাবদ্ধ',
                    'Mark Entry Permission Restricted'
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {pick(
                    'আপনি এই বিষয়ের নম্বর শুধুমাত্র দেখতে পারবেন, পরিবর্তন করতে পারবেন না।',
                    'Your assignment for this subject is in read-only mode.'
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

          {isDeadlinePassed && exam?.marksEntryDeadline && (
            <div className="p-3.5 rounded-[var(--radius)] border border-destructive/30 bg-destructive/10 flex items-center gap-2.5 text-sm text-destructive">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                {pick(
                  `নম্বর এন্ট্রির শেষ সময় (${formatDateShort(exam.marksEntryDeadline, 'bn')}) অতিক্রান্ত হয়েছে।`,
                  `Marks entry deadline (${formatDateShort(exam.marksEntryDeadline, 'en')}) has passed.`
                )}
              </span>
            </div>
          )}

          {loadingExamSubjects || loadingGradeSheet ? (
            <LoadingSkeleton />
          ) : !examSubject ? (
            <EmptyState
              title={pick('এই পরীক্ষায় বিষয়টি অন্তর্ভুক্ত নয়', 'Subject not scheduled in this exam')}
              description={pick(
                'অ্যাডমিন প্যানেল থেকে এই পরীক্ষায় বিষয়ের পূর্ণমান নির্ধারণ করা হয়নি।',
                'This subject has not been configured in the selected exam yet.'
              )}
            />
          ) : students.length === 0 ? (
            <EmptyState
              title={pick('কোনো শিক্ষার্থী পাওয়া যায়নি', 'No Students Found')}
              description={pick(
                'এই শ্রেণি ও শাখায় কোনো সক্রিয় শিক্ষার্থী ভর্তি নেই।',
                'No active students are enrolled in this class and section.'
              )}
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-surface-muted/50 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold">
                  {(() => {
                    const clsObj = assignedClasses.find((c) => c.id === resolvedClassId);
                    const clsLabel = clsObj ? (locale === 'bn' ? clsObj.nameBn || clsObj.name : clsObj.name) : '';
                    const secLabel = activeAssignment?.section?.name
                      ? `${activeAssignment.section.name} ${pick('শাখা', 'Sec')}`
                      : '';
                    const subLabel = locale === 'bn'
                      ? activeAssignment?.classSubject?.subject?.nameBn ||
                        activeAssignment?.classSubject?.subject?.name
                      : activeAssignment?.classSubject?.subject?.name;
                    return [clsLabel, secLabel, subLabel].filter(Boolean).join(' · ');
                  })()}{' '}
                  — {pick('পূর্ণমান:', 'Full:')}{' '}
                  {formatNumber(gsSubject?.fullMarks ?? examSubject.fullMarks, locale)} (
                  {[
                    wMax > 0 ? `${pick('লিখিত', 'Written')} ${formatNumber(wMax, locale)}` : null,
                    mMax > 0 ? `MCQ ${formatNumber(mMax, locale)}` : null,
                    pMax > 0 ? `${pick('ব্যবহারিক', 'Prac')} ${formatNumber(pMax, locale)}` : null,
                    caMax > 0 ? `CA ${formatNumber(caMax, locale)}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  )
                </span>
                <div className="flex items-center gap-3">
                  {gradeSheet?.summary && (
                    <span className="text-xs text-muted-foreground">
                      {pick(
                        `এন্ট্রি সম্পন্ন: ${formatNumber(gradeSheet.summary.marksEnteredCount, 'bn')}/${formatNumber(gradeSheet.summary.totalStudents, 'bn')}`,
                        `Entered: ${gradeSheet.summary.marksEnteredCount}/${gradeSheet.summary.totalStudents}`
                      )}
                    </span>
                  )}
                  <StatusBadge
                    enumName="ResultPublicationStatus"
                    value={exam.resultStatus as ResultPublicationStatus}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="bg-surface-muted/70 text-sm text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-3 py-3 text-center w-16 font-semibold">{pick('রোল', 'Roll')}</th>
                      <th className="px-3 py-3 text-left min-w-[180px] font-semibold">{pick('শিক্ষার্থী', 'Student')}</th>
                      <th className="px-3 py-3 text-center w-24 font-semibold">{pick('অনুপস্থিত', 'Absent')}</th>
                      {wMax > 0 && (
                        <th className="px-3 py-3 text-right w-28 font-semibold">
                          <div>{pick('লিখিত', 'Written')}</div>
                          <div className="text-xs font-normal text-primary">({formatNumber(wMax, locale)})</div>
                        </th>
                      )}
                      {mMax > 0 && (
                        <th className="px-3 py-3 text-right w-28 font-semibold">
                          <div>MCQ</div>
                          <div className="text-xs font-normal text-primary">({formatNumber(mMax, locale)})</div>
                        </th>
                      )}
                      {pMax > 0 && (
                        <th className="px-3 py-3 text-right w-28 font-semibold">
                          <div>{pick('ব্যবহারিক', 'Practical')}</div>
                          <div className="text-xs font-normal text-primary">({formatNumber(pMax, locale)})</div>
                        </th>
                      )}
                      {caMax > 0 && (
                        <th className="px-3 py-3 text-right w-28 font-semibold">
                          <div>CA</div>
                          <div className="text-xs font-normal text-primary">({formatNumber(caMax, locale)})</div>
                        </th>
                      )}
                      <th className="px-3 py-3 text-right w-24 font-semibold">{pick('মোট', 'Total')}</th>
                      <th className="px-3 py-3 text-center w-24 font-semibold">{pick('গ্রেড', 'Grade')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {students.map((stu) => {
                      const row = getRow(stu);
                      const rowLocked = Boolean(stu.mark?.isLocked);
                      const rowEditable = isEntryMode && canEdit && !rowLocked;
                      const hasEntered =
                        Boolean(stu.mark) ||
                        row.isAbsent ||
                        row.written !== '' ||
                        row.mcq !== '' ||
                        row.practical !== '' ||
                        row.ca !== '';
                      const wNum = Number(row.written || 0);
                      const mNum = Number(row.mcq || 0);
                      const pNum = Number(row.practical || 0);
                      const caNum = Number(row.ca || 0);
                      const total = row.isAbsent ? 0 : wNum + mNum + pNum + caNum;
                      const grade = evaluateExamSubjectMark(
                        {
                          writtenMarks: wNum,
                          mcqMarks: mNum,
                          practicalMarks: pNum,
                          continuousAssessmentMarks: caNum,
                          isAbsent: row.isAbsent,
                        },
                        examSubject,
                        scaleRanges
                      );

                      return (
                        <tr key={stu.studentEnrollmentId} className="hover:bg-surface-muted/30">
                          <td className="px-3 py-2.5 text-center font-semibold">
                            {formatNumber(stu.roll, locale)}
                          </td>
                          <td className="px-3 py-2.5 font-medium">
                            <div className="flex items-center gap-2">
                              <span>
                                {locale === 'bn' ? stu.nameBn || stu.name : stu.name}
                              </span>
                              {rowLocked && (
                                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              disabled={!rowEditable}
                              checked={row.isAbsent}
                              onChange={(e) =>
                                setEdits((prev) => ({
                                  ...prev,
                                  [stu.studentEnrollmentId]: {
                                    ...row,
                                    isAbsent: e.target.checked,
                                  },
                                }))
                              }
                              className="w-4 h-4 accent-primary cursor-pointer"
                            />
                          </td>
                          {wMax > 0 && (
                            <td className="px-3 py-2.5 text-right">
                              <input
                                type="text"
                                inputMode="decimal"
                                disabled={!rowEditable || row.isAbsent}
                                value={row.isAbsent ? '' : row.written}
                                onChange={(e) => {
                                  const v = sanitizeMarkInput(e.target.value, wMax);
                                  setEdits((prev) => ({
                                    ...prev,
                                    [stu.studentEnrollmentId]: { ...row, written: v },
                                  }));
                                }}
                                className={`w-16 text-right px-2 py-1.5 border rounded font-medium text-foreground ${
                                  row.isAbsent
                                    ? 'border-border/60 bg-surface-muted/40 opacity-40'
                                    : !isEntryMode
                                    ? 'border-border/60 bg-surface-muted/30'
                                    : 'border-border bg-surface'
                                }`}
                              />
                            </td>
                          )}
                          {mMax > 0 && (
                            <td className="px-3 py-2.5 text-right">
                              <input
                                type="text"
                                inputMode="decimal"
                                disabled={!rowEditable || row.isAbsent}
                                value={row.isAbsent ? '' : row.mcq}
                                onChange={(e) => {
                                  const v = sanitizeMarkInput(e.target.value, mMax);
                                  setEdits((prev) => ({
                                    ...prev,
                                    [stu.studentEnrollmentId]: { ...row, mcq: v },
                                  }));
                                }}
                                className={`w-16 text-right px-2 py-1.5 border rounded font-medium text-foreground ${
                                  row.isAbsent
                                    ? 'border-border/60 bg-surface-muted/40 opacity-40'
                                    : !isEntryMode
                                    ? 'border-border/60 bg-surface-muted/30'
                                    : 'border-border bg-surface'
                                }`}
                              />
                            </td>
                          )}
                          {pMax > 0 && (
                            <td className="px-3 py-2.5 text-right">
                              <input
                                type="text"
                                inputMode="decimal"
                                disabled={!rowEditable || row.isAbsent}
                                value={row.isAbsent ? '' : row.practical}
                                onChange={(e) => {
                                  const v = sanitizeMarkInput(e.target.value, pMax);
                                  setEdits((prev) => ({
                                    ...prev,
                                    [stu.studentEnrollmentId]: { ...row, practical: v },
                                  }));
                                }}
                                className={`w-16 text-right px-2 py-1.5 border rounded font-medium text-foreground ${
                                  row.isAbsent
                                    ? 'border-border/60 bg-surface-muted/40 opacity-40'
                                    : !isEntryMode
                                    ? 'border-border/60 bg-surface-muted/30'
                                    : 'border-border bg-surface'
                                }`}
                              />
                            </td>
                          )}
                          {caMax > 0 && (
                            <td className="px-3 py-2.5 text-right">
                              <input
                                type="text"
                                inputMode="decimal"
                                disabled={!rowEditable || row.isAbsent}
                                value={row.isAbsent ? '' : row.ca}
                                onChange={(e) => {
                                  const v = sanitizeMarkInput(e.target.value, caMax);
                                  setEdits((prev) => ({
                                    ...prev,
                                    [stu.studentEnrollmentId]: { ...row, ca: v },
                                  }));
                                }}
                                className={`w-16 text-right px-2 py-1.5 border rounded font-medium text-foreground ${
                                  row.isAbsent
                                    ? 'border-border/60 bg-surface-muted/40 opacity-40'
                                    : !isEntryMode
                                    ? 'border-border/60 bg-surface-muted/30'
                                    : 'border-border bg-surface'
                                }`}
                              />
                            </td>
                          )}
                          <td className="px-3 py-2.5 text-right font-bold">
                            {hasEntered ? formatNumber(total, locale) : '—'}
                          </td>
                          <td
                            className={`px-3 py-2.5 text-center font-bold ${
                              !hasEntered
                                ? 'text-muted-foreground'
                                : grade.isPassed
                                ? 'text-success'
                                : 'text-destructive'
                            }`}
                          >
                            {!hasEntered
                              ? '—'
                              : row.isAbsent
                              ? 'F'
                              : grade.letterGrade}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
