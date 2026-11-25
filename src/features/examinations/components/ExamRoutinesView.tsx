'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Edit3,
  Plus,
  Printer,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateExamRoutineMutation,
  useGetExamRoutinesByExamQuery,
  useGetExamRoutinesQuery,
  useGetExamsQuery,
  useGetExamSubjectsQuery,
  useRemoveExamRoutineMutation,
  useUpdateExamRoutineMutation,
  type ExamRoutineSlotResponse,
} from '@/src/features/examinations/api/examinations.api';
import {
  useGetAcademicGroupsQuery,
  useGetAcademicYearsQuery,
  useGetSchoolClassesQuery,
  useGetSubjectsQuery,
} from '@/src/services/academic';
import {
  ConfirmDialog,
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { DataTable } from '@/src/components/shared/DataTable';
import { PrintableExamRoutine } from '@/src/components/print/PrintDocuments';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import { formatDateShort, formatNumber, formatTime } from '@/src/lib/formatters';
import { cn, triggerPrint } from '@/src/lib/utils/cn';
import { ExamRoutineStatus } from '@/src/types/enums';

function timesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && startB < endA;
}

export function ExamRoutinesView() {
  const { data: examsData, isLoading: examsLoading } = useGetExamsQuery({ limit: 100 });
  const { data: classesList = [], isLoading: classesLoading } = useGetSchoolClassesQuery();
  const { data: yearsList = [] } = useGetAcademicYearsQuery();
  const { data: subjectsList = [] } = useGetSubjectsQuery();
  const { data: groupsList = [] } = useGetAcademicGroupsQuery();

  const [createExamRoutine, { isLoading: creating }] = useCreateExamRoutineMutation();
  const [updateExamRoutine, { isLoading: updating }] = useUpdateExamRoutineMutation();
  const [removeExamRoutine] = useRemoveExamRoutineMutation();
  const saving = creating || updating;

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<ExamRoutineSlotResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamRoutineSlotResponse | null>(null);
  const [printOpen, setPrintOpen] = useState(false);

  const [form, setForm] = useState({
    examSubjectId: '',
    examDate: '',
    startTime: '10:00',
    endTime: '13:00',
    roomNo: 'হল রুম ১০১',
  });

  const activeExams = useMemo(
    () => (examsData?.items ?? []).filter((e) => !e.isDeleted),
    [examsData]
  );

  const sortedClasses = useMemo(
    () => [...classesList].sort((a, b) => a.numericValue - b.numericValue),
    [classesList]
  );

  const resolvedClassId =
    selectedClassId ||
    activeExams[0]?.classId ||
    sortedClasses[0]?.id ||
    '';

  const filteredExams = useMemo(
    () =>
      resolvedClassId
        ? activeExams.filter((e) => e.classId === resolvedClassId)
        : activeExams,
    [activeExams, resolvedClassId]
  );

  const resolvedExamId =
    selectedExamId && filteredExams.some((e) => e.id === selectedExamId)
      ? selectedExamId
      : filteredExams[0]?.id ?? '';

  const activeExam = filteredExams.find((e) => e.id === resolvedExamId) ?? null;

  const { data: examSubjectsRaw = [], isLoading: subjectsLoading } = useGetExamSubjectsQuery(
    activeExam?.id ?? '',
    { skip: !activeExam?.id }
  );

  const examSubjects = useMemo(
    () => [...examSubjectsRaw].sort((a, b) => a.displayOrder - b.displayOrder),
    [examSubjectsRaw]
  );

  const { data: examRoutineRes, isLoading: routinesLoading } = useGetExamRoutinesByExamQuery(
    { examId: activeExam?.id ?? '' },
    { skip: !activeExam?.id }
  );

  const { data: yearRoutinesRes } = useGetExamRoutinesQuery(
    { academicYearId: activeExam?.academicYearId },
    { skip: !activeExam?.academicYearId }
  );

  const routines = useMemo(
    () =>
      [...(examRoutineRes?.schedule ?? [])].sort(
        (a, b) => a.examDate.localeCompare(b.examDate) || a.startTime.localeCompare(b.startTime)
      ),
    [examRoutineRes]
  );

  // Live Schedule Conflict Detection across same Academic Year
  const conflicts = useMemo(() => {
    const allRoutines = (yearRoutinesRes?.routines ?? []).filter(
      (r) => r.status !== ExamRoutineStatus.CANCELLED
    );
    const issues: Array<{ idA: string; idB: string; reasonBn: string }> = [];

    for (let i = 0; i < routines.length; i++) {
      const a = routines[i];
      if (a.status === ExamRoutineStatus.CANCELLED) continue;

      for (const b of allRoutines) {
        if (a.id >= b.id) continue;
        if (a.examDate !== b.examDate) continue;
        if (!timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) continue;

        const roomA = a.roomNo && a.roomNo !== 'Not Assigned' ? a.roomNo.trim() : '';
        const roomB = b.roomNo && b.roomNo !== 'Not Assigned' ? b.roomNo.trim() : '';
        const sameRoom = Boolean(roomA && roomB && roomA === roomB);
        const sameExamSameSection =
          a.examId === b.examId && (!a.sectionId || !b.sectionId || a.sectionId === b.sectionId);

        if (sameRoom && a.examId !== b.examId) {
          issues.push({
            idA: a.id,
            idB: b.id,
            reasonBn: `${formatDateShort(a.examDate, 'bn')} তারিখে "${roomA}" কক্ষে একাধিক পরীক্ষার সময় সাংঘর্ষিক।`,
          });
        } else if (sameExamSameSection) {
          const differentGroups =
            a.subject?.group && b.subject?.group && a.subject.group !== b.subject.group;
          if (!differentGroups) {
            issues.push({
              idA: a.id,
              idB: b.id,
              reasonBn: `${formatDateShort(a.examDate, 'bn')} তারিখে একই শ্রেণিতে একাধিক বিষয়ের সময়সূচি সাংঘর্ষিক (${a.startTime}–${a.endTime})।`,
            });
          }
        }
      }
    }
    return issues;
  }, [yearRoutinesRes, routines]);

  const examSpanDays = useMemo(() => {
    if (routines.length === 0) return 0;
    const parseUtc = (iso: string) => {
      const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
      return Date.UTC(y, (m || 1) - 1, d || 1);
    };
    const startMs = parseUtc(routines[0].examDate);
    const endMs = parseUtc(routines[routines.length - 1].examDate);
    return Math.max(1, Math.round((endMs - startMs) / 86400000) + 1);
  }, [routines]);
  const coveredSubjectIds = useMemo(
    () => new Set(routines.map((r) => r.subject?.id).filter(Boolean)).size,
    [routines]
  );
  const uniqueRooms = useMemo(
    () =>
      new Set(
        routines
          .map((r) => (r.roomNo && r.roomNo !== 'Not Assigned' ? r.roomNo.trim() : ''))
          .filter(Boolean)
      ).size,
    [routines]
  );

  if (examsLoading || classesLoading || (activeExam && (subjectsLoading || routinesLoading))) {
    return <LoadingSkeleton rows={6} />;
  }

  const activeClass = activeExam
    ? activeExam.schoolClass ?? classesList.find((c) => c.id === activeExam.classId) ?? null
    : classesList.find((c) => c.id === resolvedClassId) ?? null;
  const activeYear = activeExam
    ? activeExam.academicYear ?? yearsList.find((y) => y.id === activeExam.academicYearId) ?? null
    : null;
  const isClassNineTen = (activeClass?.numericValue ?? 0) >= 9;
  const hasConflict = conflicts.length > 0;

  const openCreate = () => {
    const scheduledSubjectIds = new Set(routines.map((r) => r.subject?.id).filter(Boolean));
    const nextSubject =
      examSubjects.find((es) => !scheduledSubjectIds.has(es.subjectId)) ?? examSubjects[0];

    setEditingRoutine(null);
    setForm({
      examSubjectId: nextSubject?.id ?? '',
      examDate: activeExam?.startDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      startTime: '10:00',
      endTime: '13:00',
      roomNo: 'হল রুম ১০১',
    });
    setModalOpen(true);
  };

  const openEdit = (rt: ExamRoutineSlotResponse) => {
    const matchedEs = examSubjects.find((es) => es.subjectId === rt.subject?.id);
    setEditingRoutine(rt);
    setForm({
      examSubjectId: matchedEs?.id ?? '',
      examDate: rt.examDate.slice(0, 10),
      startTime: rt.startTime,
      endTime: rt.endTime,
      roomNo: rt.roomNo && rt.roomNo !== 'Not Assigned' ? rt.roomNo : '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExam || (!editingRoutine && !form.examSubjectId)) {
      toast.error('বিষয় নির্বাচন করুন।');
      return;
    }
    if (form.endTime <= form.startTime) {
      toast.error('শেষের সময় শুরুর সময়ের পরে হতে হবে।');
      return;
    }

    try {
      if (editingRoutine) {
        await updateExamRoutine({
          routineId: editingRoutine.id,
          examId: activeExam.id,
          body: {
            examDate: form.examDate,
            startTime: form.startTime,
            endTime: form.endTime,
            roomNo: form.roomNo.trim() || undefined,
          },
        }).unwrap();
        toast.success('পরীক্ষার রুটিন হালনাগাদ হয়েছে।');
      } else {
        await createExamRoutine({
          examId: activeExam.id,
          body: {
            examSubjectId: form.examSubjectId,
            examDate: form.examDate,
            startTime: form.startTime,
            endTime: form.endTime,
            roomNo: form.roomNo.trim() || undefined,
          },
        }).unwrap();
        toast.success('পরীক্ষার রুটিন সংরক্ষিত হয়েছে।');
      }
      setModalOpen(false);
    } catch (err: any) {
      const msg = err?.data?.message || err?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'রুটিন সংরক্ষণ ব্যর্থ হয়েছে।');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !activeExam) return;
    try {
      await removeExamRoutine({
        routineId: deleteTarget.id,
        examId: activeExam.id,
      }).unwrap();
      toast.success('রুটিন এন্ট্রি মুছে ফেলা হয়েছে।');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'মুছা সম্ভব হয়নি।');
    }
    setDeleteTarget(null);
  };

  const resolveSubjectNameBn = (rt: ExamRoutineSlotResponse) => {
    const sub = subjectsList.find((s) => s.id === rt.subject?.id);
    return sub?.nameBn || rt.subject?.nameBn || rt.subject?.name || '—';
  };

  const printableRows = routines.map((rt) => ({
    id: rt.id,
    examDate: rt.examDate,
    startTime: rt.startTime,
    endTime: rt.endTime,
    subjectCode: isClassNineTen ? rt.subject?.code ?? '—' : '—',
    subjectName: resolveSubjectNameBn(rt),
    fullMarks: rt.marksDistribution?.fullMarks ?? 100,
    roomNo: rt.roomNo === 'Not Assigned' ? null : rt.roomNo,
    sectionName: null,
    instructions: rt.instructions,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        titleBn="পরীক্ষার রুটিন ও সময়সূচি"
        subtitleBn="বিষয়ভিত্তিক তারিখ, সময় ও কক্ষ নির্ধারণ করুন। স্বয়ংক্রিয়ভাবে কক্ষ ও সময় সংঘর্ষ শনাক্ত হবে এবং প্রাতিষ্ঠানিক রুটিন প্রিন্ট করা যাবে।"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPrintOpen(true)}
              disabled={routines.length === 0}
              className="whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4" />
              {'অফিশিয়াল রুটিন প্রিন্ট'}
            </Button>
            <Button
              onClick={openCreate}
              disabled={!activeExam || examSubjects.length === 0 || activeExam.isLocked}
              className="whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              {'নতুন সময়সূচি যুক্ত করুন'}
            </Button>
          </div>
        }
      />

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'মোট বিষয়'}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(examSubjects.length, 'bn')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {`${activeClass?.nameBn || activeClass?.name || ''} · পরীক্ষায় নির্ধারিত`}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'রুটিন সম্পন্ন'}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-success">
            {formatNumber(coveredSubjectIds, 'bn')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {'এই বিষয়গুলোর সময়সূচি তৈরি হয়েছে'}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'রুটিন বাকি'}</p>
          <p
            className={cn(
              'mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums',
              examSubjects.length - coveredSubjectIds > 0 ? 'text-warning' : 'text-success'
            )}
          >
            {formatNumber(Math.max(0, examSubjects.length - coveredSubjectIds), 'bn')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {examSubjects.length - coveredSubjectIds > 0
              ? 'এই বিষয়গুলোর রুটিন এখনো বাকি'
              : 'সব বিষয়ের রুটিন সম্পন্ন হয়েছে'}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'পরীক্ষার সময়কাল'}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-primary">
            {`${formatNumber(examSpanDays, 'bn')} দিন`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {routines.length > 0
              ? `${formatDateShort(routines[0].examDate, 'bn')} – ${formatDateShort(routines[routines.length - 1].examDate, 'bn')}`
              : 'রুটিন এন্ট্রি নেই'}
          </p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-wrap items-end gap-3">
        <div className="w-44">
          <label className="block text-xs text-muted-foreground mb-1">{'শ্রেণি নির্বাচন করুন'}</label>
          <Select
            value={resolvedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedExamId('');
            }}
          >
            {sortedClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.nameBn || cls.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full sm:w-72">
          <label className="block text-xs text-muted-foreground mb-1">{'পরীক্ষা নির্বাচন করুন'}</label>
          <Select
            value={resolvedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            disabled={filteredExams.length === 0}
          >
            {filteredExams.length === 0 ? (
              <option value="">{'এই শ্রেণির কোনো পরীক্ষা নেই'}</option>
            ) : (
              filteredExams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))
            )}
          </Select>
        </div>
      </Card>

      {/* Live Conflict Detection Alert */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-[var(--radius)] border border-destructive/40 bg-destructive/10 text-sm space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{`${formatNumber(conflicts.length, 'bn')}টি সময় বা কক্ষ সংঘর্ষ শনাক্ত হয়েছে`}</span>
          </div>
          <ul className="list-disc list-inside text-xs text-foreground space-y-0.5">
            {conflicts.map((c, idx) => (
              <li key={idx}>{c.reasonBn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Routine Table */}
      {routines.length === 0 ? (
        <EmptyState
          title={'কোনো রুটিন যুক্ত করা হয়নি'}
          description={
            examSubjects.length === 0
              ? 'এই পরীক্ষায় এখনো কোনো বিষয় যুক্ত নেই। আগে "বিষয় ও নম্বর বণ্টন" পেজ থেকে বিষয় যুক্ত করুন।'
              : 'এই পরীক্ষার বিষয়গুলোর তারিখ ও সময় নির্ধারণ করতে "নতুন সময়সূচি যুক্ত করুন" বাটনে ক্লিক করুন।'
          }
          action={
            <Button
              onClick={openCreate}
              disabled={!activeExam || examSubjects.length === 0 || activeExam.isLocked}
            >
              <Plus className="w-4 h-4" />
              {'প্রথম সময়সূচি যুক্ত করুন'}
            </Button>
          }
        />
      ) : (
        <DataTable
          data={routines.map((rt) => ({
            rt,
            id: rt.id,
            examDate: rt.examDate,
            subjectName: resolveSubjectNameBn(rt),
            roomNo: rt.roomNo && rt.roomNo !== 'Not Assigned' ? rt.roomNo : '—',
            timeRange: `${formatTime(rt.startTime, 'bn')} – ${formatTime(rt.endTime, 'bn')}`,
          }))}
          pageSize={20}
          searchPlaceholder={'বিষয় বা রুম খুঁজুন...'}
          emptyTitle={'কোনো রুটিন যুক্ত করা হয়নি'}
          columns={[
            {
              accessorKey: 'examDate',
              header: 'তারিখ',
              cell: ({ row }) => (
                <span className="font-semibold text-foreground whitespace-nowrap tabular-nums">
                  {formatDateShort(row.original.examDate, 'bn')}
                </span>
              ),
            },
            {
              accessorKey: 'subjectName',
              header: 'বিষয়',
              cell: ({ row }) => (
                <span className="font-semibold text-foreground">{row.original.subjectName}</span>
              ),
            },
            {
              accessorKey: 'roomNo',
              header: 'রুম নম্বর',
              cell: ({ row }) => (
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {row.original.roomNo}
                </span>
              ),
            },
            {
              accessorKey: 'timeRange',
              header: 'সময়',
              enableSorting: false,
              cell: ({ row }) => (
                <span className="text-sm text-foreground whitespace-nowrap tabular-nums">
                  {row.original.timeRange}
                </span>
              ),
            },
            {
              id: 'actions',
              header: () => <div className="text-right">{'অ্যাকশন'}</div>,
              enableSorting: false,
              cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={activeExam?.isLocked}
                    onClick={() => openEdit(row.original.rt)}
                    aria-label="সম্পাদনা"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={activeExam?.isLocked}
                    onClick={() => setDeleteTarget(row.original.rt)}
                    aria-label="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* Create / Edit Routine Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingRoutine
            ? 'পরীক্ষার সময়সূচি সম্পাদনা করুন'
            : 'নতুন পরীক্ষার সময়সূচি যুক্ত করুন'
        }
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">{'বিষয় *'}</label>
              <Select
                value={form.examSubjectId}
                disabled={Boolean(editingRoutine)}
                onChange={(e) => setForm({ ...form, examSubjectId: e.target.value })}
              >
                {examSubjects.map((es) => {
                  const sub = es.subject ?? subjectsList.find((s) => s.id === es.subjectId);
                  const grp =
                    es.group ?? (es.groupId ? groupsList.find((g) => g.id === es.groupId) : null);
                  return (
                    <option key={es.id} value={es.id}>
                      {sub?.nameBn || sub?.name || '—'}
                      {isClassNineTen && sub?.officialCode ? ` (${sub.officialCode})` : ''}
                      {grp ? ` — ${grp.nameBn || grp.name}` : ''}
                    </option>
                  );
                })}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{'পরীক্ষার তারিখ *'}</label>
              <Input
                type="date"
                required
                min={activeExam?.startDate?.slice(0, 10)}
                max={activeExam?.endDate?.slice(0, 10)}
                value={form.examDate}
                onChange={(e) => setForm({ ...form, examDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{'পরীক্ষার কক্ষ / হল'}</label>
              <Input
                value={form.roomNo}
                onChange={(e) => setForm({ ...form, roomNo: e.target.value })}
                placeholder={'যেমন: হল রুম ১০১'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{'শুরুর সময় *'}</label>
              <Input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{'শেষের সময় *'}</label>
              <Input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              {'বাতিল'}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'রুটিন সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Institutional Official Routine Print Modal */}
      <Modal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        title={'অফিশিয়াল পরীক্ষার রুটিন প্রিভিউ'}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex justify-end no-print">
            <Button onClick={() => triggerPrint()}>
              <Printer className="w-4 h-4" />
              {'A4 প্রিন্ট করুন'}
            </Button>
          </div>
          {activeExam && (
            <PrintableExamRoutine
              school={{ name: 'ভোজেশ্বর উচ্চ বিদ্যালয়', nameEn: 'Vojesshor High School' } as any}
              examName={activeExam.name}
              className={activeClass?.nameBn || activeClass?.name || ''}
              academicYear={activeYear?.name ?? '2026'}
              routines={printableRows}
            />
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={'রুটিন এন্ট্রি মুছুন'}
        description={'আপনি কি নিশ্চিত যে এই সময়সূচিটি মুছে ফেলতে চান?'}
        confirmLabel={'মুছে ফেলুন'}
        destructive
      />
    </div>
  );
}
