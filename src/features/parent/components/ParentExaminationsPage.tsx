'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  DoorOpen,
  FileBarChart2,
  Printer,
  Users,
} from 'lucide-react';
import { useGetAuthProfileQuery } from '@/src/features/auth/api/auth.api';
import {
  useGetAcademicYearsQuery,
  useGetCurrentAcademicYearQuery,
  useGetParentByIdQuery,
  useGetSchoolClassesQuery,
  type ParentChildItem,
} from '@/src/services/academic';
import {
  useGetExamRoutinesByExamQuery,
  useGetExamsQuery,
  type ExamRoutineSlotResponse,
} from '@/src/features/examinations/api/examinations.api';
import { useAppSelector } from '@/src/store/hooks';
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
import { ExamRoutineStatus, ExamStatus, ResultPublicationStatus } from '@/src/types/enums';

const FALLBACK_SCHOOL_PROFILE: SchoolProfile = {
  id: 'school-default',
  name: 'ভোজেশ্বর উচ্চ বিদ্যালয়',
  nameEn: 'Vojesshor High School',
  eiin: '112233',
  establishedYear: 1965,
  address: 'ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
  phone: '',
  email: '',
  createdAt: '',
  updatedAt: '',
};

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

function ChildSwitcherBar({
  childrenList,
  selectedStudentId,
  classNameMap,
  onChange,
}: {
  childrenList: ParentChildItem[];
  selectedStudentId: string;
  classNameMap: Map<string, string>;
  onChange: (id: string) => void;
}) {
  if (childrenList.length <= 1) return null;
  return (
    <Card className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-muted/30">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Users className="w-4 h-4 text-primary" />
        <span>{'সন্তান নির্বাচন করুন:'}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {childrenList.map((c) => {
          const active = c.studentId === selectedStudentId;
          const clsLabel = c.currentClass
            ? classNameMap.get(c.currentClass) ?? c.currentClass
            : '';
          return (
            <button
              key={c.mappingId}
              type="button"
              onClick={() => onChange(c.studentId)}
              className={`px-3 py-1.5 rounded-[var(--radius)] text-sm font-semibold border transition-colors cursor-pointer ${
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:bg-muted/50'
              }`}
            >
              {c.studentNameBn || c.studentNameEn}
              {clsLabel ? ` · ${clsLabel}` : ''}
              {c.currentSection ? ` (${c.currentSection})` : ''}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export function ParentExaminationsPage() {
  const auth = useAppSelector((s) => s.auth);
  const { data: meData, isLoading: loadingMe } = useGetAuthProfileQuery();
  const { data: allClasses = [] } = useGetSchoolClassesQuery();
  const { data: academicYears = [], isLoading: loadingYears } = useGetAcademicYearsQuery();
  const { data: currentAcademicYear } = useGetCurrentAcademicYearQuery();

  const parentId = meData?.parent?.id || auth.user?.parentId || '';

  const {
    data: parentDetail,
    isLoading: loadingParent,
  } = useGetParentByIdQuery(parentId, { skip: !parentId });

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const effectiveYearId = selectedYearId ?? currentAcademicYear?.id ?? 'ALL';
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  const schoolProfile: SchoolProfile = FALLBACK_SCHOOL_PROFILE;

  const classNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cls of allClasses) {
      map.set(cls.name, cls.nameBn || cls.name);
    }
    return map;
  }, [allClasses]);

  const yearMap = useMemo(() => {
    const map = new Map<string, (typeof academicYears)[number]>();
    for (const y of academicYears) map.set(y.id, y);
    return map;
  }, [academicYears]);

  const children = parentDetail?.children ?? [];
  const activeChild = useMemo(() => {
    if (children.length === 0) return null;
    if (selectedStudentId) {
      const found = children.find((c) => c.studentId === selectedStudentId);
      if (found) return found;
    }
    return children[0] ?? null;
  }, [children, selectedStudentId]);

  const childClassId = activeChild?.classId ?? '';
  const childSectionId = activeChild?.sectionId ?? undefined;
  const childGroupName = activeChild?.groupName ?? null;

  const {
    data: examsData,
    isLoading: loadingExams,
  } = useGetExamsQuery(
    {
      classId: childClassId || undefined,
      limit: 100,
    },
    { skip: !childClassId }
  );

  const childExams = useMemo(() => {
    const all = (examsData?.items ?? []).filter(
      (e) => !e.isDeleted && e.classId === childClassId
    );
    return all.sort((a, b) => {
      const rank = (s: ExamStatus) =>
        s === ExamStatus.ONGOING ? 0 : s === ExamStatus.UPCOMING ? 1 : s === ExamStatus.COMPLETED ? 2 : 3;
      const diff = rank(a.status) - rank(b.status);
      if (diff !== 0) return diff;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  }, [examsData, childClassId]);

  const filteredExams = useMemo(() => {
    return childExams.filter((exam) => {
      if (effectiveYearId !== 'ALL' && exam.academicYearId !== effectiveYearId) return false;
      if (selectedStatus !== 'ALL' && exam.status !== selectedStatus) return false;
      return true;
    });
  }, [childExams, effectiveYearId, selectedStatus]);

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
    { examId: activeExamId, sectionId: childSectionId },
    { skip: !activeExamId }
  );

  const activeSchedule = useMemo(() => {
    const raw = routineResponse?.schedule ?? [];
    return raw.filter((slot) => {
      if (slot.status === ExamRoutineStatus.CANCELLED) return false;
      if (childGroupName && slot.subject?.group && slot.subject.group !== childGroupName) {
        return false;
      }
      return true;
    });
  }, [routineResponse, childGroupName]);

  const stats = useMemo(() => {
    const upcomingOrOngoing = childExams.filter(
      (e) => e.status === ExamStatus.UPCOMING || e.status === ExamStatus.ONGOING
    ).length;
    const completed = childExams.filter((e) => e.status === ExamStatus.COMPLETED).length;
    return {
      totalExams: childExams.length,
      upcomingOrOngoing,
      completed,
      routineSlots: activeSchedule.length,
    };
  }, [childExams, activeSchedule.length]);

  const slotInstructions = useMemo(() => {
    return activeSchedule
      .filter((s) => s.instructions && s.instructions.trim().length > 0)
      .map((s) => ({
        subject: s.subject.nameBn || s.subject.name,
        text: s.instructions!.trim(),
      }));
  }, [activeSchedule]);

  if (loadingMe || loadingYears || (Boolean(parentId) && loadingParent)) {
    return <LoadingSkeleton />;
  }

  const activeChildName = activeChild
    ? activeChild.studentNameBn || activeChild.studentNameEn
    : '';
  const activeClassLabel = activeChild?.currentClass
    ? classNameMap.get(activeChild.currentClass) ?? activeChild.currentClass
    : '';
  const activeGroupLabel = activeChild?.groupName ? ` · ${activeChild.groupName}` : '';
  const activeYearName = activeExam ? yearMap.get(activeExam.academicYearId)?.name ?? '' : '';

  return (
    <div className="space-y-6">
      <PageHeader
        title={'পরীক্ষার সূচি ও রুটিন'}
        description={
          activeChild
            ? `${activeChildName} · ${activeClassLabel}${activeChild.currentSection ? ` (${activeChild.currentSection})` : ''}${activeGroupLabel}`
            : 'আসন্ন ও সম্পন্ন পরীক্ষাসমূহ এবং পরীক্ষার সময়সূচি'
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            disabled={!activeExam || activeSchedule.length === 0}
            onClick={() => setShowPrintModal(true)}
          >
            <Printer className="w-4 h-4" />
            {'প্রিন্ট / PDF (A4)'}
          </Button>
        }
      />

      {!parentId ? (
        <EmptyState
          title={'অভিভাবক প্রোফাইল যুক্ত নেই'}
          description={'আপনার অ্যাকাউন্টের সাথে এখনো কোনো অভিভাবক প্রোফাইল লিংক করা হয়নি।'}
        />
      ) : !activeChild ? (
        <EmptyState
          title={'কোনো সন্তান লিংক করা নেই'}
          description={'আপনার অভিভাবক প্রোফাইলের সাথে কোনো শিক্ষার্থীর তথ্য যুক্ত করা হলে এখানে পরীক্ষার সূচি দেখতে পাবেন।'}
        />
      ) : (
        <>
          <ChildSwitcherBar
            childrenList={children}
            selectedStudentId={activeChild.studentId}
            classNameMap={classNameMap}
            onChange={(id) => {
              setSelectedStudentId(id);
              setSelectedExamId('');
            }}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={'শিক্ষাবর্ষ'}>
                <Select
                  id="parent-exam-year-filter"
                  name="academicYearId"
                  aria-label="শিক্ষাবর্ষ"
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

              <FormField label={'পরীক্ষার অবস্থা'}>
                <Select
                  id="parent-exam-status-filter"
                  name="status"
                  aria-label="পরীক্ষার অবস্থা"
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

          {!childClassId ? (
            <EmptyState
              title={'চলমান ভর্তি তথ্য পাওয়া যায়নি'}
              description={'এই শিক্ষার্থীর চলমান শিক্ষাবর্ষের ভর্তি তথ্য এখনো সক্রিয় নেই।'}
            />
          ) : loadingExams ? (
            <LoadingSkeleton />
          ) : filteredExams.length === 0 ? (
            <EmptyState
              title={'কোনো পরীক্ষা পাওয়া যায়নি'}
              description={'নির্বাচিত শিক্ষাবর্ষ বা অবস্থা অনুযায়ী আপনার সন্তানের শ্রেণির জন্য এখনো কোনো পরীক্ষা পাওয়া যায়নি।'}
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
                    const yearName = yearMap.get(exam.academicYearId)?.name ?? '';
                    const isSelected = activeExam?.id === exam.id;

                    return (
                      <button
                        key={exam.id}
                        type="button"
                        onClick={() => setSelectedExamId(exam.id)}
                        className={cn(
                          'w-full text-left rounded-xl border p-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer',
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
                              {activeClassLabel}
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
                          <StatusBadge enumName="ResultPublicationStatus" value={exam.resultStatus} />
                          {exam.resultStatus === ResultPublicationStatus.PUBLISHED && (
                            <Link
                              href="/parent/results"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                            >
                              <FileBarChart2 className="w-3.5 h-3.5" />
                              {'ফলাফল দেখুন'}
                            </Link>
                          )}
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
                          {activeClassLabel}
                          {activeChild.currentSection ? ` (${activeChild.currentSection})` : ''}
                          {activeGroupLabel}
                          {activeYearName ? ` · শিক্ষাবর্ষ ${activeYearName}` : ''}
                          {' · '}
                          {formatDateShort(activeExam.startDate, 'bn')} – {formatDateShort(activeExam.endDate, 'bn')}
                        </p>
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
                          description={'বিদ্যালয় কর্তৃপক্ষ থেকে এই পরীক্ষার সময়সূচি প্রকাশ করলে তারিখ, সময় ও কক্ষ নম্বরসহ সম্পূর্ণ রুটিন এখানে দেখতে পাবেন।'}
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
                              const breakdown = formatMarksBreakdown(slot);
                              const timeText =
                                slot.displayTime ||
                                `${formatTime12h(slot.startTime)} – ${formatTime12h(slot.endTime)}`;

                              return (
                                <tr key={slot.id} className="transition-colors hover:bg-muted/20">
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
                                    </div>
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
        </>
      )}

      {/* A4 Print / PDF Modal */}
      <Modal
        open={showPrintModal && Boolean(activeExam) && activeSchedule.length > 0}
        onClose={() => setShowPrintModal(false)}
        title={'পরীক্ষার রুটিন প্রিন্ট প্রিভিউ (A4)'}
        size="xl"
      >
        {activeExam && activeChild && (
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
              subtitleBn={`${activeExam.name} · ${activeClassLabel}${activeChild.currentSection ? ` (${activeChild.currentSection})` : ''}${activeGroupLabel}${activeYearName ? ` · শিক্ষাবর্ষ ${activeYearName}` : ''}`}
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
                    <strong>{'শিক্ষার্থী:'}</strong> {activeChildName}
                  </span>
                  <span>
                    <strong>{'রোল:'}</strong>{' '}
                    {activeChild.currentRoll != null ? formatNumber(activeChild.currentRoll, 'bn') : '—'}
                  </span>
                  <span>
                    <strong>{'শ্রেণি:'}</strong> {activeClassLabel}
                    {activeChild.currentSection ? ` (${activeChild.currentSection})` : ''}
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
