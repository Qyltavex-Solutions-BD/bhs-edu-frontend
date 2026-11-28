'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  ClipboardCheck,
  Edit3,
  LayoutGrid,
  Plus,
  Printer,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateExamHallRoomMutation,
  useDeleteExamHallRoomMutation,
  useGetExamHallRoomsByExamQuery,
  useGetExamRoutinesByExamQuery,
  useGetExamSubjectsQuery,
  useGetExamsQuery,
  useUpdateExamHallRoomMutation,
} from '@/src/features/examinations/api/examinations.api';
import { useGetEnrollmentsQuery } from '@/src/features/students/api/students.api';
import { useGetStaffPageQuery } from '@/src/features/staff/api/staff.api';
import { useGetAcademicYearsQuery } from '@/src/services/academic/year.api';
import { useGetSchoolClassesQuery } from '@/src/services/academic/class.api';
import { useGetAcademicGroupsQuery } from '@/src/services/academic/group.api';
import {
  ConfirmDialog,
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import {
  PrintableExamAttendanceSheet,
  PrintableExamSeatPlan,
} from '@/src/components/print/PrintDocuments';
import type { SeatPlanRoomBlock } from '@/src/components/print/ExamPrintDocuments';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import { formatDateShort, formatNumber, formatTime } from '@/src/lib/formatters';
import { cn, triggerPrint } from '@/src/lib/utils/cn';
import { EnrollmentStatus, ExamType, StaffType } from '@/src/types/enums';
import type { ExamHallRoom, SchoolProfile } from '@/src/types/entities';

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

function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { data?: { message?: string | string[] }; message?: string };
  const msg = e?.data?.message ?? e?.message;
  if (Array.isArray(msg)) return msg.join(' · ');
  return msg || fallback;
}

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
  };
  section?: { id: string; name: string };
  group?: { id: string; name: string; nameBn?: string | null } | null;
}

export function ExamSeatPlanView() {
  const { data: examsRes, isLoading: loadingExams } = useGetExamsQuery({
    limit: 100,
    isDeleted: false,
  });
  const { data: academicYears = [] } = useGetAcademicYearsQuery();
  const { data: allClasses = [] } = useGetSchoolClassesQuery();
  const { data: academicGroups = [] } = useGetAcademicGroupsQuery();
  const { data: staffRes } = useGetStaffPageQuery({
    limit: 100,
    staffType: StaffType.TEACHER,
  });

  const [createRoom, { isLoading: creatingRoom }] = useCreateExamHallRoomMutation();
  const [updateRoom, { isLoading: updatingRoom }] = useUpdateExamHallRoomMutation();
  const [deleteRoom] = useDeleteExamHallRoomMutation();

  const [selectedExamId, setSelectedExamId] = useState('');
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ExamHallRoom | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamHallRoom | null>(null);

  const [seatPlanPrintOpen, setSeatPlanPrintOpen] = useState(false);
  const [selectedPrintRoomNo, setSelectedPrintRoomNo] = useState<string>('ALL');

  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceSubjectId, setAttendanceSubjectId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState('2026-11-22');

  const [form, setForm] = useState({
    roomNo: '',
    buildingName: 'মূল একাডেমিক ভবন',
    capacity: 30,
    invigilatorStaffId: '',
    assistantInvigilatorStaffId: '',
    notes: '',
  });

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

  const { data: configuredRooms = [], isLoading: loadingRooms } =
    useGetExamHallRoomsByExamQuery(activeExam?.id ?? '', {
      skip: !activeExam?.id,
    });

  const { data: examSubjects = [] } = useGetExamSubjectsQuery(activeExam?.id ?? '', {
    skip: !activeExam?.id,
  });

  const { data: routinesRes } = useGetExamRoutinesByExamQuery(
    { examId: activeExam?.id ?? '' },
    { skip: !activeExam?.id }
  );

  const { data: enrollmentsData = [] } = useGetEnrollmentsQuery(
    { academicYearId: activeExam?.academicYearId },
    { skip: !activeExam?.academicYearId }
  );

  const activeExamClass = useMemo(
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

  const teachers = useMemo(
    () =>
      (staffRes?.items ?? []).filter((s) => s.staffType === StaffType.TEACHER),
    [staffRes?.items]
  );

  const classEnrollments = useMemo(() => {
    if (!activeExam) return [];
    return (enrollmentsData as EnrollmentWithRelations[])
      .filter(
        (e) =>
          e.classId === activeExam.classId &&
          e.status === EnrollmentStatus.ACTIVE
      )
      .sort((a, b) => {
        const secA = a.section?.name ?? '';
        const secB = b.section?.name ?? '';
        return secA.localeCompare(secB) || a.roll - b.roll;
      });
  }, [enrollmentsData, activeExam]);

  const allocation = useMemo(() => {
    if (!activeExam) {
      return { rooms: [] as SeatPlanRoomBlock[], unallocatedCount: 0, totalCapacity: 0 };
    }

    const toSeatEntry = (enr: EnrollmentWithRelations, seatNo: number) => {
      const grp =
        enr.group ??
        (enr.groupId
          ? academicGroups.find((g) => g.id === enr.groupId) ?? null
          : null);
      return {
        seatNo,
        roll: enr.roll,
        studentId: enr.student?.studentId ?? enr.studentId,
        studentName: enr.student?.nameBn || enr.student?.nameEn || '—',
        className: activeExamClass?.nameBn || activeExamClass?.name || '',
        sectionName: enr.section?.name ?? '',
        groupName: grp ? grp.nameBn || grp.name : null,
      };
    };

    if (configuredRooms.length === 0) {
      return { rooms: [] as SeatPlanRoomBlock[], unallocatedCount: classEnrollments.length, totalCapacity: 0 };
    }

    let cursor = 0;
    const rooms: SeatPlanRoomBlock[] = configuredRooms.map((room) => {
      const slice = classEnrollments.slice(cursor, cursor + room.capacity);
      cursor += slice.length;
      const inv = room.invigilatorStaffId
        ? teachers.find((t) => t.id === room.invigilatorStaffId)
        : null;
      const asst = room.assistantInvigilatorStaffId
        ? teachers.find((t) => t.id === room.assistantInvigilatorStaffId)
        : null;

      return {
        roomNo: room.roomNo,
        buildingName: room.buildingName,
        capacity: room.capacity,
        invigilatorName: inv?.name ?? null,
        assistantInvigilatorName: asst?.name ?? null,
        seats: slice.map((enr, idx) => toSeatEntry(enr, idx + 1)),
      };
    });

    const totalCapacity = configuredRooms.reduce((sum, r) => sum + r.capacity, 0);
    const unallocatedCount = Math.max(0, classEnrollments.length - cursor);

    return { rooms, unallocatedCount, totalCapacity };
  }, [activeExam, configuredRooms, classEnrollments, academicGroups, activeExamClass, teachers]);

  const assignedInvigilatorsCount = useMemo(
    () => configuredRooms.filter((r) => Boolean(r.invigilatorStaffId)).length,
    [configuredRooms]
  );

  if (loadingExams) return <LoadingSkeleton rows={6} />;

  const routineList = routinesRes?.schedule ?? [];
  const enrolledCount = classEnrollments.length;
  const saving = creatingRoom || updatingRoom;

  const openAddRoom = () => {
    setEditingRoom(null);
    setForm({
      roomNo: '',
      buildingName: 'মূল একাডেমিক ভবন (২য় তলা)',
      capacity: 30,
      invigilatorStaffId: teachers[0]?.id ?? '',
      assistantInvigilatorStaffId: '',
      notes: '',
    });
    setRoomModalOpen(true);
  };

  const openEditRoom = (room: ExamHallRoom) => {
    setEditingRoom(room);
    setForm({
      roomNo: room.roomNo,
      buildingName: room.buildingName ?? '',
      capacity: room.capacity,
      invigilatorStaffId: room.invigilatorStaffId ?? '',
      assistantInvigilatorStaffId: room.assistantInvigilatorStaffId ?? '',
      notes: room.notes ?? '',
    });
    setRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExam) return;
    if (!form.roomNo.trim() || form.capacity <= 0) {
      toast.error('কক্ষ নম্বর ও সঠিক আসন সংখ্যা দিন।');
      return;
    }
    try {
      if (editingRoom) {
        await updateRoom({
          id: editingRoom.id,
          examId: activeExam.id,
          roomNo: form.roomNo.trim(),
          buildingName: form.buildingName.trim() || null,
          capacity: Number(form.capacity),
          invigilatorStaffId: form.invigilatorStaffId || null,
          assistantInvigilatorStaffId: form.assistantInvigilatorStaffId || null,
          notes: form.notes.trim() || null,
        }).unwrap();
        toast.success('পরীক্ষার কক্ষ হালনাগাদ হয়েছে।');
      } else {
        await createRoom({
          examId: activeExam.id,
          roomNo: form.roomNo.trim(),
          buildingName: form.buildingName.trim() || null,
          capacity: Number(form.capacity),
          invigilatorStaffId: form.invigilatorStaffId || null,
          assistantInvigilatorStaffId: form.assistantInvigilatorStaffId || null,
          notes: form.notes.trim() || null,
        }).unwrap();
        toast.success('নতুন পরীক্ষার কক্ষ ও পরিদর্শক সংরক্ষিত হয়েছে।');
      }
      setRoomModalOpen(false);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'কক্ষ সংরক্ষণ ব্যর্থ হয়েছে।'));
    }
  };

  const handleDeleteRoom = async () => {
    if (!deleteTarget || !activeExam) return;
    try {
      await deleteRoom({ id: deleteTarget.id, examId: activeExam.id }).unwrap();
      toast.success('কক্ষটি অপসারণ করা হয়েছে।');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'কক্ষ অপসারণ ব্যর্থ হয়েছে।'));
    }
  };

  const openAttendancePrint = () => {
    const firstEs = examSubjects[0];
    const firstSubId = firstEs?.id ?? '';
    setAttendanceSubjectId(firstSubId);
    const matchingRoutine = firstEs
      ? routineList.find((r) => r.subject?.id === firstEs.subjectId)
      : undefined;
    setAttendanceDate(
      matchingRoutine
        ? String(matchingRoutine.examDate).slice(0, 10)
        : activeExam?.startDate.slice(0, 10) ?? '2026-11-22'
    );
    setAttendanceModalOpen(true);
  };

  const selectedEs = examSubjects.find((es) => es.id === attendanceSubjectId) ?? examSubjects[0];
  const selectedSub = selectedEs?.subject;
  const matchingRoutine = selectedEs
    ? routineList.find((r) => r.subject?.id === selectedEs.subjectId)
    : null;

  const roomsForPrint =
    selectedPrintRoomNo === 'ALL'
      ? allocation.rooms
      : allocation.rooms.filter((r) => r.roomNo === selectedPrintRoomNo);

  return (
    <div className="space-y-6">
      <PageHeader
        title="আসন বিন্যাস, পরিদর্শক ও হল হাজিরা শিট"
        description="পরীক্ষা কেন্দ্রের কক্ষ, আসন ধারণক্ষমতা ও কক্ষ পরিদর্শক নির্ধারণ করে প্রাতিষ্ঠানিক আসন বিন্যাস এবং উত্তরপত্র স্বাক্ষর শিট প্রিন্ট করুন।"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={openAttendancePrint}
              disabled={allocation.rooms.length === 0}
              className="whitespace-nowrap shrink-0"
            >
              <ClipboardCheck className="w-4 h-4" />
              {'হল হাজিরা শিট প্রিন্ট'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPrintRoomNo('ALL');
                setSeatPlanPrintOpen(true);
              }}
              disabled={allocation.rooms.length === 0}
              className="whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4" />
              {'আসন বিন্যাস প্রিন্ট'}
            </Button>
            <Button onClick={openAddRoom} disabled={!activeExam} className="whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" />
              {'নতুন কক্ষ যুক্ত করুন'}
            </Button>
          </div>
        }
      />

      {/* Exam Picker */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[260px] max-w-md">
          <label className="block text-sm text-muted-foreground mb-1">
            {'পরীক্ষা নির্বাচন করুন'}
          </label>
          <Select value={resolvedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
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
        <div className="flex items-center gap-3 text-sm tabular-nums text-muted-foreground">
          <span>
            {'শ্রেণি:'}{' '}
            <strong className="text-foreground font-semibold">
              {activeExamClass?.nameBn || activeExamClass?.name || '—'}
            </strong>
          </span>
          <span>·</span>
          <span>
            {'শিক্ষাবর্ষ:'}{' '}
            <strong className="text-foreground font-semibold">
              {activeYear?.name ?? formatNumber(2026, 'bn')}
            </strong>
          </span>
        </div>
      </Card>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'মোট আসন ধারণক্ষমতা'}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(allocation.totalCapacity, 'bn')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {`মোট পরীক্ষার্থী ${formatNumber(enrolledCount, 'bn')} জন`}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'কনফিগারকৃত হল ও কক্ষ'}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-primary">
            {formatNumber(configuredRooms.length, 'bn')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {'সক্রিয় পরীক্ষা কক্ষ · ভবনভিত্তিক বিন্যাস'}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'হল পরিদর্শক শিক্ষক'}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(assignedInvigilatorsCount, 'bn')} /{' '}
            {formatNumber(configuredRooms.length, 'bn')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {`নিযুক্ত শিক্ষক · কক্ষের অনুপাত ${formatNumber(
              configuredRooms.length > 0
                ? Math.round((assignedInvigilatorsCount / configuredRooms.length) * 100)
                : 0,
              'bn'
            )}%`}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'আসন বরাদ্দের স্থিতি'}</p>
          <p
            className={cn(
              'mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums',
              allocation.unallocatedCount > 0 ? 'text-destructive' : 'text-success'
            )}
          >
            {allocation.unallocatedCount > 0
              ? `ঘাটতি ${formatNumber(allocation.unallocatedCount, 'bn')}`
              : '১০০% সম্পন্ন'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {allocation.unallocatedCount > 0
              ? 'অতিরিক্ত আসন প্রয়োজন'
              : `উদ্বৃত্ত আসন ${formatNumber(
                  Math.max(0, allocation.totalCapacity - enrolledCount),
                  'bn'
                )}টি`}
          </p>
        </Card>
      </div>

      {/* Insufficient Capacity Warning */}
      {configuredRooms.length > 0 && allocation.unallocatedCount > 0 && (
        <div className="p-4 rounded-[var(--radius)] border border-warning/50 bg-warning/10 flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground">
              {`${formatNumber(allocation.unallocatedCount, 'bn')} জন শিক্ষার্থীর জন্য আসন কম রয়েছে!`}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {'নতুন কক্ষ যুক্ত করুন অথবা বিদ্যমান কক্ষের আসন সংখ্যা বাড়ান যাতে সকল পরীক্ষার্থীর আসন নিশ্চিত হয়।'}
            </p>
          </div>
        </div>
      )}

      {/* Room Cards & Live Allocation Breakdown */}
      {loadingRooms ? (
        <LoadingSkeleton rows={4} />
      ) : configuredRooms.length === 0 ? (
        <EmptyState
          title={'কোনো পরীক্ষা কক্ষ নির্ধারণ করা হয়নি'}
          description={'পরীক্ষা কেন্দ্রের কক্ষ, আসন সংখ্যা এবং কক্ষ পরিদর্শক যুক্ত করুন।'}
          action={
            <Button onClick={openAddRoom}>
              <Plus className="w-4 h-4" />
              {'প্রথম কক্ষ যুক্ত করুন'}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {configuredRooms.map((room, idx) => {
            const allocBlock = allocation.rooms[idx];
            const seated = allocBlock?.seats ?? [];
            const rolls = seated.map((s) => s.roll);
            const inv = teachers.find((t) => t.id === room.invigilatorStaffId);
            const asst = teachers.find((t) => t.id === room.assistantInvigilatorStaffId);

            return (
              <Card key={room.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary shrink-0" />
                      <span>{room.roomNo}</span>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {room.buildingName || 'একাডেমিক ভবন'}
                      {room.notes ? ` · ${room.notes}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPrintRoomNo(room.roomNo);
                        setSeatPlanPrintOpen(true);
                      }}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      {'প্রিন্ট'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditRoom(room)}>
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(room)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm bg-surface-muted/40 rounded-lg p-3 border border-border/60">
                  <div>
                    <span className="text-muted-foreground block">{'বরাদ্দকৃত পরীক্ষার্থী'}</span>
                    <strong className="text-foreground tabular-nums">
                      {formatNumber(seated.length, 'bn')} / {formatNumber(room.capacity, 'bn')}{' '}
                      {'জন'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{'রোল সীমা'}</span>
                    <strong className="text-foreground tabular-nums">
                      {rolls.length > 0
                        ? `${formatNumber(Math.min(...rolls), 'bn')} – ${formatNumber(Math.max(...rolls), 'bn')}`
                        : '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{'মূল পরিদর্শক'}</span>
                    <span className="font-medium text-foreground">{inv?.name ?? 'নির্ধারিত নয়'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{'সহকারী পরিদর্শক'}</span>
                    <span className="font-medium text-foreground">{asst?.name ?? '—'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    {`আসন নং ১ – ${formatNumber(Math.max(seated.length, 1), 'bn')}`}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {`${formatNumber(seated.length, 'bn')} জন পরীক্ষার্থী`}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Room Add / Edit Modal */}
      <Modal
        open={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        title={editingRoom ? 'পরীক্ষা কক্ষ সম্পাদনা' : 'নতুন পরীক্ষা কক্ষ যুক্ত করুন'}
        size="md"
      >
        <form onSubmit={handleSaveRoom} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{'কক্ষ নম্বর *'}</label>
              <Input
                required
                value={form.roomNo}
                onChange={(e) => setForm({ ...form, roomNo: e.target.value })}
                placeholder={'যেমন: কক্ষ ১০১'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{'আসন ধারণক্ষমতা *'}</label>
              <Input
                placeholder="আসন ধারণক্ষমতা লিখুন"
                type="number"
                min={1}
                max={500}
                required
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) || 1 })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">{'ভবন ও তলা'}</label>
              <Input
                value={form.buildingName}
                onChange={(e) => setForm({ ...form, buildingName: e.target.value })}
                placeholder={'মূল একাডেমিক ভবন (২য় তলা)'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{'মূল কক্ষ পরিদর্শক'}</label>
              <Select
                value={form.invigilatorStaffId}
                onChange={(e) => setForm({ ...form, invigilatorStaffId: e.target.value })}
              >
                <option value="">{'নির্বাচন করুন'}</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{'সহকারী পরিদর্শক'}</label>
              <Select
                value={form.assistantInvigilatorStaffId}
                onChange={(e) =>
                  setForm({ ...form, assistantInvigilatorStaffId: e.target.value })
                }
              >
                <option value="">{'প্রযোজ্য নয়'}</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">{'মন্তব্য'}</label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={'অতিরিক্ত নির্দেশনা (যদি থাকে)'}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setRoomModalOpen(false)}>
              {'বাতিল'}
            </Button>
            <Button type="submit" disabled={saving}>
              {'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Printable Multi-Room Seat Plan Modal */}
      <Modal
        open={seatPlanPrintOpen}
        onClose={() => setSeatPlanPrintOpen(false)}
        title={'প্রাতিষ্ঠানিক আসন বিন্যাস (Seat Plan)'}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 no-print border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">{'কক্ষ ফিল্টার:'}</label>
              <Select
                value={selectedPrintRoomNo}
                onChange={(e) => setSelectedPrintRoomNo(e.target.value)}
                className="w-52"
              >
                <option value="ALL">{'সকল পরীক্ষা কক্ষ'}</option>
                {allocation.rooms.map((r) => (
                  <option key={r.roomNo} value={r.roomNo}>
                    {r.roomNo}
                  </option>
                ))}
              </Select>
            </div>
            <Button onClick={() => triggerPrint()}>
              <Printer className="w-4 h-4" />
              {'আসন বিন্যাস প্রিন্ট করুন'}
            </Button>
          </div>

          {activeExam && (
            <PrintableExamSeatPlan
              school={DEFAULT_SCHOOL_PROFILE}
              examName={activeExam.name}
              academicYear={activeYear?.name ?? formatNumber(2026, 'bn')}
              rooms={roomsForPrint}
            />
          )}
        </div>
      </Modal>

      {/* Formal Room-Wise Hall Attendance Print Modal */}
      <Modal
        open={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        title={'হল হাজিরা ও উত্তরপত্র স্বাক্ষর শিট'}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3 no-print border-b border-border pb-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-56">
                <label className="block text-sm text-muted-foreground mb-1">
                  {'বিষয় নির্বাচন করুন'}
                </label>
                <Select
                  value={attendanceSubjectId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setAttendanceSubjectId(nextId);
                    const es = examSubjects.find((x) => x.id === nextId);
                    const rt = es
                      ? routineList.find((r) => r.subject?.id === es.subjectId)
                      : undefined;
                    if (rt) setAttendanceDate(String(rt.examDate).slice(0, 10));
                  }}
                >
                  {examSubjects.map((es) => (
                    <option key={es.id} value={es.id}>
                      {es.subject?.nameBn || es.subject?.name}{' '}
                      {es.subject?.officialCode ? `(${es.subject.officialCode})` : ''}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-44">
                <label className="block text-sm text-muted-foreground mb-1">
                  {'পরীক্ষার তারিখ'}
                </label>
                <Input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={() => triggerPrint()}>
              <Printer className="w-4 h-4" />
              {'হাজিরা শিট প্রিন্ট করুন'}
            </Button>
          </div>

          {activeExam && (
            <PrintableExamAttendanceSheet
              school={DEFAULT_SCHOOL_PROFILE}
              examName={activeExam.name}
              academicYear={activeYear?.name ?? formatNumber(2026, 'bn')}
              subjectLabel={
                selectedSub
                  ? `${selectedSub.nameBn || selectedSub.name} (${selectedSub.officialCode ?? ''})`
                  : 'সাধারণ পরীক্ষা'
              }
              examDate={attendanceDate}
              examTime={
                matchingRoutine
                  ? `${formatTime(matchingRoutine.startTime, 'bn')} – ${formatTime(matchingRoutine.endTime, 'bn')}`
                  : 'সকাল ১০:০০ – দুপুর ০১:০০'
              }
              rooms={allocation.rooms}
            />
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteRoom}
        title={'পরীক্ষা কক্ষ অপসারণ'}
        description={`আপনি কি "${deleteTarget?.roomNo}" কক্ষটি আসন বিন্যাস থেকে মুছে ফেলতে চান?`}
        confirmLabel={'মুছে ফেলুন'}
        destructive
      />
    </div>
  );
}
