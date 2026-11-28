'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  DoorOpen,
  FileSpreadsheet,
  Lock,
  Printer,
  Sparkles,
  Unlock,
} from 'lucide-react';
import { useLiveSchoolProfile } from '@/src/features/institution/hooks/useSchoolProfile';
import {
  useGetAcademicYearsQuery,
  useGetCurrentAcademicYearQuery,
  useGetMyTeacherAssignmentsQuery,
  useGetSchoolClassesQuery,
} from '@/src/services/academic';
import {
  useGetExamRoutinesByExamQuery,
  useGetExamsQuery,
  type ExamRoutineSlotResponse,
} from '@/src/features/examinations/api/examinations.api';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { FormalExamDocumentShell } from '@/src/components/print/ExamPrintDocuments';
import { Button, Card, FormField, Modal, Select } from '@/src/components/ui/primitives';
import {
  formatDateLong,
  formatDateShort,
  formatNumber,
  formatTime12h,
} from '@/src/lib/formatters';
import { ENUM_LABELS } from '@/src/lib/constants/enums';
import { cn, triggerPrint } from '@/src/lib/utils/cn';
import type { Exam, SchoolProfile } from '@/src/types/entities';
import { ExamRoutineStatus, ExamStatus } from '@/src/types/enums';



function getDayLabelBn(dayOfWeek: string, examDate: string): string {
  const upper = dayOfWeek?.toUpperCase?.() ?? '';
  const fromEnum = (ENUM_LABELS.WeekDay as Record<string, { bn: string }> | undefined)?.[upper]?.bn;
  if (fromEnum) return fromEnum;
  if (examDate) {
    const d = new Date(examDate);
    if (!Number.isNaN(d.getTime())) {
      const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
      return days[d.getDay()] ?? dayOfWeek;
    }
  }
  return dayOfWeek || '—';
}

function formatMarksBreakdown(slot: ExamRoutineSlotResponse): string {
  const md = slot.marksDistribution;
  if (!md) return '—';
  const parts: string[] = [];
  if (md.hasWritten && md.writtenFullMarks != null) {
    parts.push(`লিখিত ${formatNumber(md.writtenFullMarks, 'bn')}`);
  }
  if (md.hasMcq && md.mcqFullMarks != null) {
    parts.push(`বহুনির্বাচনি ${formatNumber(md.mcqFullMarks, 'bn')}`);
  }
  if (md.hasPractical && md.practicalFullMarks != null) {
    parts.push(`ব্যবহারিক ${formatNumber(md.practicalFullMarks, 'bn')}`);
  }
  return parts.join(' · ');
}

export function TeacherExaminationsPage() {
  const schoolProfile = useLiveSchoolProfile();
  const { data: myAssignments = [], isLoading: loadingAssignments } =
    useGetMyTeacherAssignmentsQuery();
  const { data: allClasses = [], isLoading: loadingClasses } = useGetSchoolClassesQuery();
  const { data: academicYears = [], isLoading: loadingYears } = useGetAcademicYearsQuery();
  const { data: currentAcademicYear } = useGetCurrentAcademicYearQuery();
  const { data: examsData, isLoading: loadingExams } = useGetExamsQuery({ limit: 100 });

  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const effectiveYearId = selectedYearId ?? currentAcademicYear?.id ?? 'ALL';
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  const myClassIds = useMemo(
    () => Array.from(new Set(myAssignments.map((a) => a.classId).filter(Boolean))),
    [myAssignments]
  );

  const mySubjectIdsByClass = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const a of myAssignments) {
      const subjectId = a.classSubject?.subject?.id;
      if (!a.classId || !subjectId) continue;
      if (!map.has(a.classId)) map.set(a.classId, new Set());
      map.get(a.classId)!.add(subjectId);
    }
    return map;
  }, [myAssignments]);

  const myClasses = useMemo(
    () =>
      allClasses
        .filter((c) => myClassIds.includes(c.id))
        .sort((a, b) => a.numericValue - b.numericValue),
    [allClasses, myClassIds]
  );

  const classMap = useMemo(() => {
    const map = new Map<string, (typeof allClasses)[number]>();
    for (const c of allClasses) map.set(c.id, c);
    return map;
  }, [allClasses]);

  const yearMap = useMemo(() => {
    const map = new Map<string, (typeof academicYears)[number]>();
    for (const y of academicYears) map.set(y.id, y);
    return map;
  }, [academicYears]);

  const myExams = useMemo(() => {
    const allExams = (examsData?.items ?? []).filter((e) => !e.isDeleted);
    const assigned = allExams.filter((e) => myClassIds.includes(e.classId));
    return assigned.sort((a, b) => {
      const rank = (s: ExamStatus) =>
        s === ExamStatus.ONGOING ? 0 : s === ExamStatus.UPCOMING ? 1 : s === ExamStatus.COMPLETED ? 2 : 3;
      const diff = rank(a.status) - rank(b.status);
      if (diff !== 0) return diff;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  }, [examsData, myClassIds]);

  const filteredExams = useMemo(() => {
    return myExams.filter((exam) => {
      if (effectiveYearId !== 'ALL' && exam.academicYearId !== effectiveYearId) return false;
      if (selectedClassId !== 'ALL' && exam.classId !== selectedClassId) return false;
      if (selectedStatus !== 'ALL' && exam.status !== selectedStatus) return false;
      return true;
    });
  }, [myExams, effectiveYearId, selectedClassId, selectedStatus]);

  const activeExam: Exam | null = useMemo(() => {
    if (filteredExams.length === 0) return null;
    if (selectedExamId) {
      const found = filteredExams.find((e) => e.id === selectedExamId);
      if (found) return found;
    }
    return filteredExams[0] ?? null;
  }, [filteredExams, selectedExamId]);

  const activeExamId = activeExam?.id ?? '';

  const {
    data: routineResponse,
    isLoading: loadingRoutine,
    isFetching: fetchingRoutine,
  } = useGetExamRoutinesByExamQuery(
    { examId: activeExamId },
    { skip: !activeExamId }
  );

  const activeSchedule = useMemo(() => {
    const raw = routineResponse?.schedule ?? [];
    return raw.filter((slot) => slot.status !== ExamRoutineStatus.CANCELLED);
  }, [routineResponse]);

  const myAssignedSubjectsForActiveExam = useMemo(() => {
    if (!activeExam) return new Set<string>();
    return mySubjectIdsByClass.get(activeExam.classId) ?? new Set<string>();
  }, [activeExam, mySubjectIdsByClass]);

  const stats = useMemo(() => {
    const upcomingOrOngoing = myExams.filter(
      (e) => e.status === ExamStatus.UPCOMING || e.status === ExamStatus.ONGOING
    ).length;
    const completed = myExams.filter((e) => e.status === ExamStatus.COMPLETED).length;
    return {
      totalExams: myExams.length,
      upcomingOrOngoing,
      completed,
      routineSlots: activeSchedule.length,
    };
  }, [myExams, activeSchedule.length]);

  const slotInstructions = useMemo(() => {
    return activeSchedule
      .filter((s) => s.instructions && s.instructions.trim().length > 0)
      .map((s) => ({
        subject: s.subject.nameBn || s.subject.name,
        text: s.instructions!.trim(),
      }));
  }, [activeSchedule]);

  if (loadingAssignments || loadingClasses || loadingYears || loadingExams) {
    return <LoadingSkeleton />;
  }

  const activeClassMeta = activeExam ? classMap.get(activeExam.classId) : undefined;
  const activeClassName = activeClassMeta?.nameBn || activeClassMeta?.name || '';
  const activeYearName = activeExam ? yearMap.get(activeExam.academicYearId)?.name ?? '' : '';

  return (
    <div className="space-y-6">
      <PageHeader
        title={'পরীক্ষা ও সময়সূচি'}
        description={'আপনার নির্ধারিত শ্রেণিসমূহের পরীক্ষা এবং পূর্ণাঙ্গ পরীক্ষার রুটিন'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!activeExam || activeSchedule.length === 0}
              onClick={() => setShowPrintModal(true)}
            >
              <Printer className="w-4 h-4" />
              {'প্রিন্ট / PDF (A4)'}
            </Button>
            <Link href="/teacher/marks-entry">
              <Button variant="primary" size="sm">
                <FileSpreadsheet className="w-4 h-4" />
                {'নম্বর এন্ট্রি করুন'}
              </Button>
            </Link>
          </div>
        }
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={'মোট পরীক্ষা'}
          value={formatNumber(stats.totalExams, 'bn')}
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatCard
          label={'চলমান ও আসন্ন'}
          value={formatNumber(stats.upcomingOrOngoing, 'bn')}
          icon={<CalendarClock className="w-5 h-5" />}
        />
        <StatCard
          label={'সম্পন্ন পরীক্ষা'}
          value={formatNumber(stats.completed, 'bn')}
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <StatCard
          label={'নির্বাচিত পরীক্ষার স্লট'}
          value={formatNumber(stats.routineSlots, 'bn')}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label={'শিক্ষাবর্ষ'}>
            <Select
              value={effectiveYearId}
              onChange={(e) => {
                setSelectedYearId(e.target.value);
                setSelectedExamId('');
              }}
            >
              <option value="ALL">{'সকল শিক্ষাবর্ষ'}</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                  {currentAcademicYear?.id === y.id ? ' (চলমান)' : ''}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={'শ্রেণি নির্বাচন করুন'}>
            <Select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedExamId('');
              }}
            >
              <option value="ALL">{'আমার সকল শ্রেণি'}</option>
              {myClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.nameBn || cls.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={'পরীক্ষার অবস্থা'}>
            <Select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setSelectedExamId('');
              }}
            >
              <option value="ALL">{'সকল অবস্থা'}</option>
              <option value={ExamStatus.ONGOING}>{'চলমান'}</option>
              <option value={ExamStatus.UPCOMING}>{'আসন্ন'}</option>
              <option value={ExamStatus.COMPLETED}>{'সম্পন্ন'}</option>
            </Select>
          </FormField>
        </div>
      </Card>

      {myClassIds.length === 0 ? (
        <EmptyState
          title={'কোনো শ্রেণি নির্ধারিত নেই'}
          description={'আপনাকে এখনো কোনো শ্রেণি বা বিষয়ে দায়িত্ব দেওয়া হয়নি। অ্যাডমিন বিষয়-শিক্ষক বণ্টন করলে এখানে পরীক্ষাসমূহ দেখতে পাবেন।'}
        />
      ) : filteredExams.length === 0 ? (
        <EmptyState
          title={'কোনো পরীক্ষা পাওয়া যায়নি'}
          description={'নির্বাচিত ফিল্টার অনুযায়ী আপনার শ্রেণিসমূহের জন্য এখনো কোনো পরীক্ষা তৈরি করা হয়নি।'}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Exam List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                {'পরীক্ষার তালিকা'} ({formatNumber(filteredExams.length, 'bn')})
              </h2>
            </div>

            <div className="space-y-3">
              {filteredExams.map((exam) => {
                const cls = classMap.get(exam.classId);
                const clsName = cls?.nameBn || cls?.name || '';
                const yearName = yearMap.get(exam.academicYearId)?.name ?? '';
                const isSelected = activeExam?.id === exam.id;

                return (
                  <button
                    key={exam.id}
                    type="button"
                    onClick={() => setSelectedExamId(exam.id)}
                    className={cn(
                      'w-full text-left rounded-xl border p-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-foreground truncate">
                          {exam.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {clsName}
                          {yearName ? ` · ${yearName}` : ''}
                        </p>
                      </div>
                      <StatusBadge enumName="ExamStatus" value={exam.status} />
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {formatDateShort(exam.startDate, 'bn')} – {formatDateShort(exam.endDate, 'bn')}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border/70 flex items-center justify-between gap-2 text-xs">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 font-medium',
                          exam.isLocked ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                        )}
                      >
                        {exam.isLocked ? (
                          <>
                            <Lock className="w-3 h-3" />
                            {'নম্বর লক করা'}
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" />
                            {'নম্বর এন্ট্রি উন্মুক্ত'}
                          </>
                        )}
                      </span>
                      <StatusBadge enumName="ResultPublicationStatus" value={exam.resultStatus} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Exam Routine */}
          <div className="lg:col-span-8 space-y-4">
            {activeExam && (
              <Card className="overflow-hidden">
                <div className="p-5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-foreground">
                        {activeExam.name} — {'পরীক্ষার রুটিন'}
                      </h2>
                      <StatusBadge enumName="ExamStatus" value={activeExam.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activeClassName}
                      {activeYearName ? ` · শিক্ষাবর্ষ ${activeYearName}` : ''}
                      {' · '}
                      {formatDateShort(activeExam.startDate, 'bn')} – {formatDateShort(activeExam.endDate, 'bn')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/teacher/marks-entry?examId=${activeExam.id}`}
                      className="text-xs font-semibold text-primary hover:underline px-2 py-1"
                    >
                      {'নম্বর এন্ট্রি →'}
                    </Link>
                  </div>
                </div>

                {loadingRoutine || fetchingRoutine ? (
                  <div className="p-6">
                    <LoadingSkeleton />
                  </div>
                ) : activeSchedule.length === 0 ? (
                  <div className="p-8">
                    <EmptyState
                      title={'পরীক্ষার রুটিন এখনো যুক্ত করা হয়নি'}
                      description={'অ্যাডমিন প্যানেল থেকে এই পরীক্ষার সময়সূচি তৈরি করলে তারিখ, সময় ও কক্ষ নম্বরসহ সম্পূর্ণ রুটিন এখানে দেখা যাবে।'}
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                          <th className="py-3 px-4 text-left whitespace-nowrap">{'তারিখ ও বার'}</th>
                          <th className="py-3 px-4 text-left whitespace-nowrap">{'সময়'}</th>
                          <th className="py-3 px-4 text-left">{'বিষয়'}</th>
                          <th className="py-3 px-4 text-left whitespace-nowrap">{'কক্ষ নম্বর'}</th>
                          <th className="py-3 px-4 text-left whitespace-nowrap">{'পূর্ণমান / পাস'}</th>
                          <th className="py-3 px-4 text-left whitespace-nowrap">{'অবস্থা'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {activeSchedule.map((slot) => {
                          const isMySubject = myAssignedSubjectsForActiveExam.has(slot.subject.id);
                          const breakdown = formatMarksBreakdown(slot);
                          const timeText =
                            slot.displayTime ||
                            `${formatTime12h(slot.startTime)} – ${formatTime12h(slot.endTime)}`;

                          return (
                            <tr
                              key={slot.id}
                              className={cn(
                                'transition-colors hover:bg-muted/20',
                                isMySubject && 'bg-primary/[0.03]'
                              )}
                            >
                              <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                <div className="font-semibold text-foreground">
                                  {formatDateShort(slot.examDate, 'bn')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {getDayLabelBn(slot.dayOfWeek, slot.examDate)}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5 text-foreground font-medium">
                                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  <span>{timeText}</span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 align-top">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-semibold text-foreground">
                                    {slot.subject.nameBn || slot.subject.name}
                                  </span>
                                  {slot.marksDistribution?.isOptional && (
                                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                                      {'ঐচ্ছিক'}
                                    </span>
                                  )}
                                  {isMySubject && (
                                    <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                                      <Sparkles className="w-3 h-3" />
                                      {'আপনার বিষয়'}
                                    </span>
                                  )}
                                </div>
                                {slot.section && slot.section !== 'All Sections' && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {'শাখা:'} {slot.section}
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                {slot.roomNo ? (
                                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                                    <DoorOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    {slot.roomNo}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                <div className="font-semibold text-foreground">
                                  {formatNumber(slot.marksDistribution?.fullMarks ?? 0, 'bn')} /{' '}
                                  {formatNumber(slot.marksDistribution?.passMarks ?? 0, 'bn')}
                                </div>
                                {breakdown && (
                                  <div className="text-[11px] text-muted-foreground mt-0.5">
                                    {breakdown}
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                <StatusBadge enumName="ExamRoutineStatus" value={slot.status} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {slotInstructions.length > 0 && (
                  <div className="p-4 border-t border-border bg-muted/20 space-y-1.5">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
                      {'বিশেষ নির্দেশনাবলি'}
                    </h4>
                    <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
                      {slotInstructions.map((item, idx) => (
                        <li key={`${item.subject}-${idx}`}>
                          <span className="font-semibold text-foreground">{item.subject}:</span>{' '}
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      )}

      {/* A4 Print / PDF Modal */}
      <Modal
        open={showPrintModal && Boolean(activeExam) && activeSchedule.length > 0}
        onClose={() => setShowPrintModal(false)}
        title={'পরীক্ষার রুটিন প্রিন্ট প্রিভিউ (A4)'}
        size="xl"
      >
        {activeExam && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2 print:hidden">
              <Button variant="outline" onClick={() => setShowPrintModal(false)}>
                {'বন্ধ করুন'}
              </Button>
              <Button variant="primary" onClick={() => triggerPrint()}>
                <Printer className="w-4 h-4" />
                {'প্রিন্ট / PDF সেভ করুন'}
              </Button>
            </div>
            <FormalExamDocumentShell
              school={schoolProfile}
              titleBn={'পরীক্ষার সময়সূচি'}
              titleEn={'Examination Routine'}
              subtitleBn={`${activeExam.name}${activeClassName ? ` · ${activeClassName}` : ''}${activeYearName ? ` · শিক্ষাবর্ষ ${activeYearName}` : ''}`}
              dateLabel={formatDateLong(new Date().toISOString(), 'bn')}
              orientation="portrait"
              allowFlow
              signatures={[
                { titleBn: 'শ্রেণি শিক্ষক', titleEn: 'Class Teacher' },
                { titleBn: 'পরীক্ষা নিয়ন্ত্রক', titleEn: 'Controller of Examinations' },
                { titleBn: 'প্রধান শিক্ষক', titleEn: 'Head Teacher' },
              ]}
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs border border-[#D4D4D8] bg-[#FAFAFA] px-3 py-2">
                  <span>
                    <strong>{'পরীক্ষার নাম:'}</strong> {activeExam.name}
                  </span>
                  <span>
                    <strong>{'শ্রেণি:'}</strong> {activeClassName || '—'}
                  </span>
                  <span>
                    <strong>{'তারিখ:'}</strong> {formatDateShort(activeExam.startDate, 'bn')} –{' '}
                    {formatDateShort(activeExam.endDate, 'bn')}
                  </span>
                </div>

                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F4F4F5] text-[#111111]">
                      <th className="border border-[#52525B] px-2.5 py-2 text-center w-10">{'ক্রম'}</th>
                      <th className="border border-[#52525B] px-2.5 py-2 text-left">{'তারিখ ও বার'}</th>
                      <th className="border border-[#52525B] px-2.5 py-2 text-left">{'সময়'}</th>
                      <th className="border border-[#52525B] px-2.5 py-2 text-left">{'বিষয়'}</th>
                      <th className="border border-[#52525B] px-2.5 py-2 text-center">{'কক্ষ'}</th>
                      <th className="border border-[#52525B] px-2.5 py-2 text-center">{'পূর্ণমান / পাস'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSchedule.map((slot, index) => {
                      const timeText =
                        slot.displayTime ||
                        `${formatTime12h(slot.startTime)} – ${formatTime12h(slot.endTime)}`;
                      return (
                        <tr key={slot.id}>
                          <td className="border border-[#52525B] px-2.5 py-2 text-center">
                            {formatNumber(index + 1, 'bn')}
                          </td>
                          <td className="border border-[#52525B] px-2.5 py-2">
                            <div className="font-semibold">{formatDateShort(slot.examDate, 'bn')}</div>
                            <div className="text-[10px] text-[#52525B]">
                              {getDayLabelBn(slot.dayOfWeek, slot.examDate)}
                            </div>
                          </td>
                          <td className="border border-[#52525B] px-2.5 py-2 whitespace-nowrap">
                            {timeText}
                          </td>
                          <td className="border border-[#52525B] px-2.5 py-2 font-semibold">
                            {slot.subject.nameBn || slot.subject.name}
                            {slot.marksDistribution?.isOptional ? ' (ঐচ্ছিক)' : ''}
                          </td>
                          <td className="border border-[#52525B] px-2.5 py-2 text-center">
                            {slot.roomNo || '—'}
                          </td>
                          <td className="border border-[#52525B] px-2.5 py-2 text-center whitespace-nowrap">
                            {formatNumber(slot.marksDistribution?.fullMarks ?? 0, 'bn')} /{' '}
                            {formatNumber(slot.marksDistribution?.passMarks ?? 0, 'bn')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {slotInstructions.length > 0 && (
                  <div className="text-[11px] border border-[#D4D4D8] p-2.5 space-y-1">
                    <div className="font-bold">{'নির্দেশনাবলি:'}</div>
                    {slotInstructions.map((item, idx) => (
                      <div key={`${item.subject}-print-${idx}`}>
                        • <strong>{item.subject}:</strong> {item.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormalExamDocumentShell>
          </div>
        )}
      </Modal>
    </div>
  );
}
