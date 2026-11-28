'use client';

import React, { useMemo, useState } from 'react';
import { Printer, Search } from 'lucide-react';
import {
  useGetExamRoutinesByExamQuery,
  useGetExamSubjectsQuery,
  useGetExamsQuery,
} from '@/src/features/examinations/api/examinations.api';
import { useGetEnrollmentsQuery } from '@/src/features/students/api/students.api';
import { useGetAcademicYearsQuery } from '@/src/services/academic/year.api';
import { useGetSchoolClassesQuery } from '@/src/services/academic/class.api';
import { useGetSectionsQuery } from '@/src/services/academic/section.api';
import { useGetAcademicGroupsQuery } from '@/src/services/academic/group.api';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import {
  PrintableBulkExamAdmitCards,
  PrintableExamAdmitCard,
  type PrintableExamAdmitCardProps,
} from '@/src/components/print/PrintDocuments';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import { formatNumber } from '@/src/lib/formatters';
import { triggerPrint } from '@/src/lib/utils/cn';
import { EnrollmentStatus, ExamType, RelationshipType } from '@/src/types/enums';
import type { SchoolProfile } from '@/src/types/entities';

const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  id: 'school-default',
  name: 'ভোজেশ্বর উচ্চ বিদ্যালয়',
  nameEn: 'Vojesshor High School',
  eiin: '113587',
  establishedYear: 1965,
  address: 'ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
  phone: '',
  email: '',
  createdAt: '',
  updatedAt: '',
};

interface EnrollmentWithRelations {
  id: string;
  studentId: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  groupId?: string | null;
  roll: number;
  status: string;
  student?: {
    id: string;
    studentId: string;
    nameEn: string;
    nameBn?: string | null;
    photo?: string | null;
    parents?: Array<{
      relationship: string;
      parent?: {
        name?: string;
        nameBn?: string | null;
      };
    }>;
  };
  section?: { id: string; name: string };
  group?: { id: string; name: string; nameBn?: string | null } | null;
}

export function ExamAdmitCardsView() {
  const { data: examsRes, isLoading: loadingExams } = useGetExamsQuery({
    limit: 100,
    isDeleted: false,
  });
  const { data: academicYears = [] } = useGetAcademicYearsQuery();
  const { data: allClasses = [] } = useGetSchoolClassesQuery();
  const { data: academicGroups = [] } = useGetAcademicGroupsQuery();

  const [selectedExamId, setSelectedExamId] = useState('');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [previewCard, setPreviewCard] = useState<PrintableExamAdmitCardProps | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const activeExams = useMemo(
    () =>
      (examsRes?.items ?? [])
        .filter((e) => !e.isDeleted && e.examType !== ExamType.CONSOLIDATED)
        .sort(
          (a, b) =>
            (a.schoolClass?.numericValue ?? 99) - (b.schoolClass?.numericValue ?? 99)
        ),
    [examsRes?.items]
  );

  const resolvedExamId =
    selectedExamId && activeExams.some((e) => e.id === selectedExamId)
      ? selectedExamId
      : activeExams[0]?.id ?? '';

  const activeExam = activeExams.find((e) => e.id === resolvedExamId) ?? null;

  const { data: sectionsData = [] } = useGetSectionsQuery(
    { classId: activeExam?.classId },
    { skip: !activeExam?.classId }
  );

  const { data: routinesRes, isLoading: loadingRoutines } =
    useGetExamRoutinesByExamQuery(
      { examId: activeExam?.id ?? '' },
      { skip: !activeExam?.id }
    );

  const { data: examSubjects = [], isLoading: loadingSubjects } =
    useGetExamSubjectsQuery(activeExam?.id ?? '', {
      skip: !activeExam?.id,
    });

  const { data: enrollmentsData = [], isLoading: loadingEnrollments } =
    useGetEnrollmentsQuery(
      { academicYearId: activeExam?.academicYearId },
      { skip: !activeExam?.academicYearId }
    );

  const activeClass = useMemo(
    () =>
      activeExam
        ? allClasses.find((c) => c.id === activeExam.classId) ?? null
        : null,
    [allClasses, activeExam]
  );

  const activeYear = useMemo(
    () =>
      activeExam
        ? academicYears.find((y) => y.id === activeExam.academicYearId) ?? null
        : null,
    [academicYears, activeExam]
  );

  const classSections = useMemo(
    () =>
      sectionsData
        .filter((s) => !activeExam || s.classId === activeExam.classId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [sectionsData, activeExam]
  );

  const admitCardItems = useMemo(() => {
    if (!activeExam) return [];

    const routineList = routinesRes?.schedule ?? [];
    const sortedRoutines = [...routineList].sort(
      (a, b) =>
        String(a.examDate).localeCompare(String(b.examDate)) ||
        a.startTime.localeCompare(b.startTime)
    );

    const subjectBySubjectId = new Map(examSubjects.map((es) => [es.subjectId, es]));
    const classEnrollments = (enrollmentsData as EnrollmentWithRelations[])
      .filter(
        (enr) =>
          enr.classId === activeExam.classId &&
          enr.status === EnrollmentStatus.ACTIVE
      )
      .sort((a, b) => a.roll - b.roll);

    const q = search.trim().toLowerCase();

    return classEnrollments
      .filter((enr) => {
        if (sectionFilter !== 'ALL' && enr.sectionId !== sectionFilter) return false;
        if (groupFilter !== 'ALL' && (enr.groupId ?? '') !== groupFilter) return false;
        if (q) {
          const stu = enr.student;
          const hay = `${stu?.nameBn ?? ''} ${stu?.nameEn ?? ''} ${stu?.studentId ?? ''} ${enr.roll}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .map((enr) => {
        const stu = enr.student;
        const sec =
          enr.section ?? classSections.find((s) => s.id === enr.sectionId) ?? null;
        const grp =
          enr.group ??
          (enr.groupId
            ? academicGroups.find((g) => g.id === enr.groupId) ?? null
            : null);

        const parents = stu?.parents ?? [];
        const fatherLink = parents.find(
          (p) => p.relationship === RelationshipType.FATHER
        );
        const motherLink = parents.find(
          (p) => p.relationship === RelationshipType.MOTHER
        );
        const fatherName =
          fatherLink?.parent?.nameBn || fatherLink?.parent?.name || '—';
        const motherName =
          motherLink?.parent?.nameBn || motherLink?.parent?.name || '—';

        const schedule = sortedRoutines
          .filter((rt) => {
            if (rt.sectionId && rt.sectionId !== enr.sectionId) return false;
            const es = rt.subject?.id ? subjectBySubjectId.get(rt.subject.id) : undefined;
            if (es?.groupId && es.groupId !== enr.groupId) return false;
            return true;
          })
          .map((rt) => {
            const sub = rt.subject;
            return {
              examDate: String(rt.examDate).slice(0, 10),
              startTime: rt.startTime,
              endTime: rt.endTime,
              subjectCode: sub?.code ?? '—',
              subjectName: sub?.nameBn || sub?.name || '—',
              roomNo: rt.roomNo ?? null,
            };
          });

        const primaryRoom = schedule.find((s) => Boolean(s.roomNo))?.roomNo ?? null;

        const props: PrintableExamAdmitCardProps = {
          school: DEFAULT_SCHOOL_PROFILE,
          examName: activeExam.name,
          academicYear: activeYear?.name ?? formatNumber(2026, 'bn'),
          student: {
            studentId: stu?.studentId ?? enr.studentId,
            nameBn: stu?.nameBn,
            nameEn: stu?.nameEn ?? 'Student',
            fatherName,
            motherName,
            photo: stu?.photo ?? null,
            roll: enr.roll,
            className: activeClass?.nameBn || activeClass?.name || '',
            sectionName: sec?.name ?? '',
            groupName: grp ? grp.nameBn || grp.name : null,
            hallRoom: primaryRoom,
            seatNo: null,
          },
          schedule,
        };

        return {
          enrollmentId: enr.id,
          props,
        };
      });
  }, [
    activeExam,
    routinesRes?.schedule,
    examSubjects,
    enrollmentsData,
    classSections,
    academicGroups,
    activeClass,
    activeYear,
    sectionFilter,
    groupFilter,
    search,
  ]);

  if (loadingExams) return <LoadingSkeleton rows={6} />;

  const isNineTen = (activeClass?.numericValue ?? 0) >= 9;
  const isFetchingDetails = loadingRoutines || loadingSubjects || loadingEnrollments;

  const selectedItems = admitCardItems.filter((item) => selectedIds[item.enrollmentId]);
  const bulkTargets = selectedItems.length > 0 ? selectedItems : admitCardItems;
  const readyCount = admitCardItems.filter((i) => i.props.schedule.length > 0).length;
  const assignedRoomCount = admitCardItems.filter((i) => Boolean(i.props.student.hallRoom)).length;
  const allFilteredChecked =
    admitCardItems.length > 0 && admitCardItems.every((i) => selectedIds[i.enrollmentId]);

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    if (checked) {
      admitCardItems.forEach((i) => {
        next[i.enrollmentId] = true;
      });
    }
    setSelectedIds(next);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="পরীক্ষার প্রবেশপত্র"
        description="শিক্ষার্থীর নাম, রোল, অভিভাবকের তথ্য ও ব্যক্তিগত পরীক্ষার রুটিনসহ প্রাতিষ্ঠানিক প্রবেশপত্র একক বা একসাথে প্রিন্ট করুন।"
        actions={
          <Button
            onClick={() => setBulkOpen(true)}
            disabled={bulkTargets.length === 0}
            className="whitespace-nowrap shrink-0"
          >
            <Printer className="w-4 h-4" />
            {selectedItems.length > 0
              ? `নির্বাচিত ${formatNumber(selectedItems.length, 'bn')}টি প্রবেশপত্র প্রিন্ট`
              : `সকল (${formatNumber(bulkTargets.length, 'bn')}) প্রবেশপত্র প্রিন্ট`}
          </Button>
        }
      />

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'মোট পরীক্ষার্থী'}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(admitCardItems.length, 'bn')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {`শ্রেণি: ${activeClass?.nameBn || activeClass?.name || '—'}`}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'প্রবেশপত্র প্রস্তুতি স্থিতি'}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-primary">
            {formatNumber(readyCount, 'bn')} / {formatNumber(admitCardItems.length, 'bn')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {`রুটিনযুক্ত ${formatNumber(readyCount, 'bn')} · বাকি ${formatNumber(Math.max(0, admitCardItems.length - readyCount), 'bn')}`}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'কক্ষ নির্ধারিত শিক্ষার্থী'}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(assignedRoomCount, 'bn')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {`রুটিন অনুযায়ী কক্ষ: ${formatNumber(assignedRoomCount, 'bn')}`}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'নির্বাচিত প্রিন্ট তালিকা'}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(selectedItems.length || admitCardItems.length, 'bn')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {selectedItems.length > 0
              ? `${formatNumber(selectedItems.length, 'bn')}টি কার্ড নির্বাচিত`
              : 'সকল কার্ড প্রিন্টের জন্য প্রস্তুত'}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[230px]">
          <label className="block text-sm text-muted-foreground mb-1">
            {'পরীক্ষা নির্বাচন করুন'}
          </label>
          <Select
            value={resolvedExamId}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              setSectionFilter('ALL');
              setGroupFilter('ALL');
              setSelectedIds({});
            }}
          >
            {activeExams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
                {ex.schoolClass?.nameBn || ex.schoolClass?.name
                  ? ` — ${ex.schoolClass?.nameBn || ex.schoolClass?.name}`
                  : ''}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-40">
          <label className="block text-sm text-muted-foreground mb-1">{'শাখা'}</label>
          <Select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
            <option value="ALL">{'সকল শাখা'}</option>
            {classSections.map((s) => (
              <option key={s.id} value={s.id}>
                {'শাখা'} {s.name}
              </option>
            ))}
          </Select>
        </div>

        {isNineTen && (
          <div className="w-44">
            <label className="block text-sm text-muted-foreground mb-1">{'বিভাগ'}</label>
            <Select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
              <option value="ALL">{'সকল বিভাগ'}</option>
              {academicGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nameBn || g.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="relative w-56">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={'নাম, রোল বা আইডি...'}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Examinees List */}
      {isFetchingDetails ? (
        <LoadingSkeleton rows={5} />
      ) : admitCardItems.length === 0 ? (
        <EmptyState
          title={'কোনো পরীক্ষার্থী পাওয়া যায়নি'}
          description={'অনুগ্রহ করে অন্য পরীক্ষা বা শাখা নির্বাচন করুন।'}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border text-sm font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={allFilteredChecked}
                      onChange={(e) => toggleAll(e.target.checked)}
                      aria-label={'সব নির্বাচন করুন'}
                    />
                  </th>
                  <th className="px-3 py-3 text-center w-16">{'রোল'}</th>
                  <th className="px-4 py-3 text-left">{'শিক্ষার্থী ও আইডি'}</th>
                  <th className="px-3 py-3 text-left">{'শাখা ও বিভাগ'}</th>
                  <th className="px-3 py-3 text-left">{'কক্ষ'}</th>
                  <th className="px-3 py-3 text-center">{'রুটিন বিষয়'}</th>
                  <th className="px-4 py-3 text-right">{'প্রবেশপত্র'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {admitCardItems.map((item) => {
                  const st = item.props.student;
                  return (
                    <tr key={item.enrollmentId} className="hover:bg-surface-muted/40">
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedIds[item.enrollmentId])}
                          onChange={(e) =>
                            setSelectedIds((prev) => ({
                              ...prev,
                              [item.enrollmentId]: e.target.checked,
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-3 text-center font-medium">
                        {formatNumber(st.roll, 'bn')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">
                          {st.nameBn || st.nameEn}
                        </div>
                        <p className="text-sm font-mono text-muted-foreground">{st.studentId}</p>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <span className="font-medium text-foreground">
                          {st.className} ({st.sectionName})
                        </span>
                        {st.groupName && (
                          <span className="block text-muted-foreground">{st.groupName}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <span className="font-medium text-foreground">
                          {st.hallRoom || 'নির্ধারিত হয়নি'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-sm font-medium">
                        {formatNumber(item.props.schedule.length, 'bn')}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewCard(item.props)}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          {'দেখুন ও প্রিন্ট'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Single Admit Card Print Modal */}
      <Modal
        open={Boolean(previewCard)}
        onClose={() => setPreviewCard(null)}
        title={'প্রাতিষ্ঠানিক প্রবেশপত্র প্রিভিউ'}
        size="xl"
      >
        {previewCard && (
          <div className="space-y-4">
            <div className="flex justify-end no-print">
              <Button onClick={() => triggerPrint()}>
                <Printer className="w-4 h-4" />
                {'প্রবেশপত্র প্রিন্ট করুন'}
              </Button>
            </div>
            <PrintableExamAdmitCard {...previewCard} />
          </div>
        )}
      </Modal>

      {/* Bulk Admit Cards Print Modal */}
      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title={`বাল্ক প্রবেশপত্র প্রিন্ট (${formatNumber(bulkTargets.length, 'bn')} জন)`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 no-print text-sm text-muted-foreground">
            <span>
              {'প্রতিটি শিক্ষার্থীর প্রবেশপত্র পৃথক A4 পৃষ্ঠায় স্বয়ংক্রিয়ভাবে প্রিন্ট হবে।'}
            </span>
            <Button onClick={() => triggerPrint()} className="whitespace-nowrap shrink-0">
              <Printer className="w-4 h-4" />
              {'সবগুলো প্রিন্ট করুন'}
            </Button>
          </div>
          <PrintableBulkExamAdmitCards items={bulkTargets.map((t) => t.props)} />
        </div>
      </Modal>
    </div>
  );
}
