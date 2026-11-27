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
  useDeleteExamHallRoomMutation,
  useGetBootstrapQuery,
  useUpsertExamHallRoomMutation,
} from '@/src/store/api';
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
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import { formatDateShort, formatNumber, formatTime } from '@/src/lib/formatters';
import { cn, triggerPrint } from '@/src/lib/utils/cn';
import { StaffType } from '@/src/types/enums';
import type { ExamHallRoom } from '@/src/types/entities';
import { buildSeatPlanRooms, getExamEnrolledStudents } from './ExamShared';

export function ExamSeatPlanView() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [upsertRoom, { isLoading: saving }] = useUpsertExamHallRoomMutation();
  const [deleteRoom] = useDeleteExamHallRoomMutation();

  const [selectedExamId, setSelectedExamId] = useState('exam-ann-10');
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
    () => (db ? db.exams.filter((e) => !e.isDeleted) : []),
    [db]
  );

  const resolvedExamId =
    selectedExamId && activeExams.some((e) => e.id === selectedExamId)
      ? selectedExamId
      : activeExams[0]?.id ?? '';

  const activeExam = activeExams.find((e) => e.id === resolvedExamId) ?? null;

  const activeExamClass = useMemo(
    () => (db && activeExam ? db.classes.find((c) => c.id === activeExam.classId) : null),
    [db, activeExam]
  );

  const teachers = useMemo(
    () => (db ? db.staff.filter((s) => s.staffType === StaffType.TEACHER) : []),
    [db]
  );

  const configuredRooms = useMemo(() => {
    if (!db || !activeExam) return [];
    return db.examHallRooms
      .filter((r) => r.examId === activeExam.id)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [db, activeExam]);

  const examSubjects = useMemo(() => {
    if (!db || !activeExam) return [];
    return db.examSubjects
      .filter((es) => es.examId === activeExam.id)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [db, activeExam]);

  const enrolledCount = useMemo(
    () => (db && activeExam ? getExamEnrolledStudents(db, activeExam).length : 0),
    [db, activeExam]
  );

  const allocation = useMemo(() => {
    if (!db || !activeExam) {
      return { rooms: [], seatLookup: new Map(), unallocatedCount: 0, totalCapacity: 0 };
    }
    return buildSeatPlanRooms(db, activeExam, 'bn');
  }, [db, activeExam, 'bn']);

  const assignedInvigilatorsCount = useMemo(
    () => configuredRooms.filter((r) => Boolean(r.invigilatorStaffId)).length,
    [configuredRooms]
  );

  if (isLoading || !db) return <LoadingSkeleton rows={6} />;

  const activeYear = activeExam ? db.academicYears.find((y) => y.id === activeExam.academicYearId) : null;

  const openAddRoom = () => {
    setEditingRoom(null);
    setForm({
      roomNo: '',
      buildingName: 'মূল একাডেমিক ভবন (২য় তলা)',
      capacity: 24,
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
    const res = await upsertRoom({
      id: editingRoom?.id,
      examId: activeExam.id,
      roomNo: form.roomNo.trim(),
      buildingName: form.buildingName.trim() || null,
      capacity: Number(form.capacity),
      invigilatorStaffId: form.invigilatorStaffId || null,
      assistantInvigilatorStaffId: form.assistantInvigilatorStaffId || null,
      notes: form.notes.trim() || null,
    });
    if ('error' in res) {
      toast.error('কক্ষ সংরক্ষণ ব্যর্থ হয়েছে।');
      return;
    }
    toast.success('পরীক্ষার কক্ষ ও পরিদর্শক সংরক্ষিত হয়েছে।');
    setRoomModalOpen(false);
  };

  const handleDeleteRoom = async () => {
    if (!deleteTarget) return;
    await deleteRoom({ id: deleteTarget.id });
    toast.success('কক্ষটি অপসারণ করা হয়েছে।');
    setDeleteTarget(null);
  };

  const openAttendancePrint = () => {
    const firstSubId = examSubjects[0]?.id ?? '';
    setAttendanceSubjectId(firstSubId);
    const matchingRoutine = db.examRoutines.find(
      (r) => !r.isDeleted && r.examId === activeExam?.id && r.examSubjectId === firstSubId
    );
    setAttendanceDate(matchingRoutine?.examDate ?? activeExam?.startDate.slice(0, 10) ?? '2026-11-22');
    setAttendanceModalOpen(true);
  };

  const selectedEs = examSubjects.find((es) => es.id === attendanceSubjectId) ?? examSubjects[0];
  const selectedSub = selectedEs ? db.subjects.find((s) => s.id === selectedEs.subjectId) : null;
  const matchingRoutine = selectedEs
    ? db.examRoutines.find((r) => !r.isDeleted && r.examId === activeExam?.id && r.examSubjectId === selectedEs.id)
    : null;

  const roomsForPrint =
    selectedPrintRoomNo === 'ALL'
      ? allocation.rooms
      : allocation.rooms.filter((r) => r.roomNo === selectedPrintRoomNo);

  return (
    <div className="space-y-6">
      <PageHeader
        titleBn="আসন বিন্যাস, পরিদর্শক ও হল হাজিরা শিট"
        titleEn="Multi-Room Seat Plan, Invigilators & Hall Attendance"
        subtitleBn="পরীক্ষা কেন্দ্রের কক্ষ, আসন ধারণক্ষমতা ও কক্ষ পরিদর্শক নির্ধারণ করে প্রাতিষ্ঠানিক আসন বিন্যাস এবং উত্তরপত্র স্বাক্ষর শিট প্রিন্ট করুন।"
        subtitleEn="Configure exam rooms, capacities, and invigilators to generate formal multi-room seat plans and hall attendance sheets."
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
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-3 text-sm tabular-nums text-muted-foreground">
          <span>
            {'শ্রেণি:'} <strong className="text-foreground font-semibold">{activeExamClass?.nameBn || activeExamClass?.name || '—'}</strong>
          </span>
          <span>·</span>
          <span>
            {'শিক্ষাবর্ষ:'} <strong className="text-foreground font-semibold">{formatNumber('2026', 'bn')}</strong>
          </span>
        </div>
      </Card>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'মোট আসন ধারণক্ষমতা'}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(allocation.totalCapacity, 'bn')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {`মোট পরীক্ষার্থী ${formatNumber(enrolledCount, 'bn')} জন`}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'কনফিগারকৃত হল ও কক্ষ'}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-primary">
            {formatNumber(configuredRooms.length, 'bn')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {`সক্রিয় পরীক্ষা কক্ষ · ভবনভিত্তিক বিন্যাস`}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'হল পরিদর্শক শিক্ষক'}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(assignedInvigilatorsCount, 'bn')} / {formatNumber(configuredRooms.length, 'bn')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {`নিযুক্ত শিক্ষক · কক্ষের অনুপাত ${formatNumber(configuredRooms.length > 0 ? Math.round((assignedInvigilatorsCount / configuredRooms.length) * 100) : 0, 'bn')}%`}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'আসন বরাদ্দের স্থিতি'}
          </p>
          <p className={cn('mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums', allocation.unallocatedCount > 0 ? 'text-destructive' : 'text-success')}>
            {allocation.unallocatedCount > 0
              ? `ঘাটতি ${formatNumber(allocation.unallocatedCount, 'bn')}`
              : '১০০% সম্পন্ন'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {allocation.unallocatedCount > 0
              ? 'অতিরিক্ত আসন প্রয়োজন'
              : `উদ্বৃত্ত আসন ${formatNumber(Math.max(0, allocation.totalCapacity - enrolledCount), 'bn')}টি`}
          </p>
        </Card>
      </div>

      {/* Insufficient Capacity Warning */}
      {allocation.unallocatedCount > 0 && (
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
      {configuredRooms.length === 0 ? (
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

                <div className="grid grid-cols-2 gap-3 text-sm border-y border-border py-2.5 tabular-nums">
                  <div>
                    <span className="text-muted-foreground block">{'আসন বরাদ্দ'}</span>
                    <strong className="text-foreground text-sm">
                      {formatNumber(seated.length, 'bn')} / {formatNumber(room.capacity, 'bn')}
                    </strong>
                    {rolls.length > 0 && (
                      <span className="block text-muted-foreground">
                        {'রোল:'} {formatNumber(Math.min(...rolls), 'bn')} –{' '}
                        {formatNumber(Math.max(...rolls), 'bn')}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{'কক্ষ পরিদর্শক (Invigilator)'}</span>
                    <strong className="text-foreground">
                      {inv ? (inv.nameBn || inv.name) : 'নির্ধারিত নয়'}
                    </strong>
                    {asst && (
                      <span className="block text-muted-foreground">
                        {'সহকারী:'} {asst.nameBn || asst.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Seated Students Compact List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-sm tabular-nums">
                  {seated.length === 0 ? (
                    <p className="text-muted-foreground italic">
                      {'এই কক্ষে কোনো পরীক্ষার্থী অবশিষ্ট নেই।'}
                    </p>
                  ) : (
                    seated.map((seat) => (
                      <div
                        key={seat.studentId}
                        className="flex items-center justify-between py-1 px-2 rounded bg-surface-muted/50"
                      >
                        <span className="font-medium text-foreground truncate">
                          #{formatNumber(seat.seatNo, 'bn')} · {seat.studentName}
                        </span>
                        <span className="text-muted-foreground shrink-0 ml-2">
                          {'রোল'} {formatNumber(seat.roll, 'bn')} ({seat.sectionName})
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Hall Room Modal */}
      <Modal
        open={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        title={
          editingRoom
            ? 'কক্ষ ও পরিদর্শক সম্পাদনা'
            : 'নতুন পরীক্ষা কক্ষ যুক্ত করুন'
        }
        size="md"
      >
        <form onSubmit={handleSaveRoom} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{'কক্ষ নম্বর / নাম *'}</label>
              <Input
                required
                value={form.roomNo}
                onChange={(e) => setForm({ ...form, roomNo: e.target.value })}
                placeholder={'যেমন: হল রুম ১০১'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{'আসন ধারণক্ষমতা *'}</label>
              <Input placeholder="আসন ধারণক্ষমতা লিখুন"
                type="number"
                min={1}
                max={200}
                required
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">{'ভবন ও তলা'}</label>
              <Input
                value={form.buildingName}
                onChange={(e) => setForm({ ...form, buildingName: e.target.value })}
                placeholder={'যেমন: মূল একাডেমিক ভবন (২য় তলা)'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{'প্রধান পরিদর্শক'}</label>
              <Select
                value={form.invigilatorStaffId}
                onChange={(e) => setForm({ ...form, invigilatorStaffId: e.target.value })}
              >
                <option value="">{'নির্বাচন করুন'}</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameBn || t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{'সহকারী পরিদর্শক'}</label>
              <Select
                value={form.assistantInvigilatorStaffId}
                onChange={(e) => setForm({ ...form, assistantInvigilatorStaffId: e.target.value })}
              >
                <option value="">{'কোনোটি নয়'}</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameBn || t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">{'নোট / মন্তব্য'}</label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={'যেমন: বিজ্ঞান ও মানবিক বিভাগ'}
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

      {/* Formal Multi-Room Seat Plan Print Modal */}
      <Modal
        open={seatPlanPrintOpen}
        onClose={() => setSeatPlanPrintOpen(false)}
        title={'প্রাতিষ্ঠানিক আসন বিন্যাস প্রিভিউ'}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-muted-foreground" />
              <Select
                value={selectedPrintRoomNo}
                onChange={(e) => setSelectedPrintRoomNo(e.target.value)}
                className="w-56"
              >
                <option value="ALL">
                  {`সকল কক্ষ (${formatNumber(allocation.rooms.length, 'bn')}টি)`}
                </option>
                {allocation.rooms.map((r) => (
                  <option key={r.roomNo} value={r.roomNo}>
                    {r.roomNo} ({formatNumber(r.seats.length, 'bn')})
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
              school={db.schoolProfile}
              examName={activeExam.name}
              academicYear={activeYear?.name ?? '2026'}
              rooms={roomsForPrint}
            />
          )}
        </div>
      </Modal>

      {/* Formal Room-Wise Hall Attendance & Answer Script Register Print Modal */}
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
                <label className="block text-sm text-muted-foreground mb-1">{'বিষয় নির্বাচন করুন'}</label>
                <Select
                  value={attendanceSubjectId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setAttendanceSubjectId(nextId);
                    const rt = db.examRoutines.find(
                      (r) => !r.isDeleted && r.examId === activeExam?.id && r.examSubjectId === nextId
                    );
                    if (rt) setAttendanceDate(rt.examDate);
                  }}
                >
                  {examSubjects.map((es) => {
                    const sub = db.subjects.find((s) => s.id === es.subjectId);
                    return (
                      <option key={es.id} value={es.id}>
                        {sub?.nameBn || sub?.name} ({sub?.officialCode})
                      </option>
                    );
                  })}
                </Select>
              </div>
              <div className="w-44">
                <label className="block text-sm text-muted-foreground mb-1">{'পরীক্ষার তারিখ'}</label>
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
              school={db.schoolProfile}
              examName={activeExam.name}
              academicYear={activeYear?.name ?? '2026'}
              subjectLabel={
                selectedSub
                  ? `${selectedSub.nameBn} (${selectedSub.officialCode ?? ''})`
                  : 'সাধারণ পরীক্ষা'
              }
              examDate={attendanceDate}
              examTime={
                matchingRoutine
                  ? `${formatTime(matchingRoutine.startTime, 'bn')} – ${formatTime(matchingRoutine.endTime, 'bn')}`
                  : null
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
        description={'এই কক্ষটি মুছে ফেললে পরীক্ষার্থীরা অবশিষ্ট কক্ষগুলোতে পুনর্বণ্টিত হবে।'}
        confirmLabel={'মুছে ফেলুন'}
        destructive
      />
    </div>
  );
}
